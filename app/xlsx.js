// Minimal .xlsx reader: no dependencies, runs in Chrome / Edge.
// An .xlsx file is a zip of XML parts. This reads the zip's central directory, inflates
// the parts it needs with the browser's DecompressionStream, and parses the XML with
// DOMParser. Returns cell VALUES only (no styles or formulas): { sheets: { name: rows } }
// where rows[r][c] is a string ('' for empty), 0-based, header rows included.
(function () {
  'use strict';
  const T = (window.T = window.T || {});

  const u16 = (v, o) => v.getUint16(o, true);
  const u32 = (v, o) => v.getUint32(o, true);

  async function unzip(buf) {
    const v = new DataView(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
      if (u32(v, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not an .xlsx file (no zip directory found).');
    const count = u16(v, eocd + 10);
    let p = u32(v, eocd + 16);
    const entries = {};
    const dec = new TextDecoder();
    for (let n = 0; n < count; n++) {
      if (u32(v, p) !== 0x02014b50) throw new Error('Damaged .xlsx (bad zip directory).');
      const method = u16(v, p + 10);
      const csize = u32(v, p + 20);
      const nameLen = u16(v, p + 28);
      const extraLen = u16(v, p + 30);
      const commentLen = u16(v, p + 32);
      const local = u32(v, p + 42);
      const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
      entries[name] = { method, csize, local };
      p += 46 + nameLen + extraLen + commentLen;
    }
    return {
      has: (name) => !!entries[name],
      async text(name) {
        const e = entries[name];
        if (!e) return null;
        const lNameLen = u16(v, e.local + 26);
        const lExtraLen = u16(v, e.local + 28);
        const start = e.local + 30 + lNameLen + lExtraLen;
        const data = new Uint8Array(buf, start, e.csize);
        if (e.method === 0) return dec.decode(data);
        if (e.method !== 8) throw new Error('Unsupported compression in .xlsx part ' + name);
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return new Response(stream).text();
      },
    };
  }

  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
  const kids = (el, tag) => Array.from(el.getElementsByTagName(tag));
  const colIndex = (ref) => {
    const letters = ref.replace(/\d+/g, '');
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  };

  T.readXlsx = async function (arrayBuffer) {
    const zip = await unzip(arrayBuffer);
    const wb = xml(await zip.text('xl/workbook.xml'));
    const rels = xml(await zip.text('xl/_rels/workbook.xml.rels'));
    const target = {};
    kids(rels, 'Relationship').forEach((r) => { target[r.getAttribute('Id')] = r.getAttribute('Target'); });

    const shared = [];
    if (zip.has('xl/sharedStrings.xml')) {
      kids(xml(await zip.text('xl/sharedStrings.xml')), 'si').forEach((si) => {
        shared.push(kids(si, 't').map((t) => t.textContent).join(''));
      });
    }

    const sheets = {};
    for (const s of kids(wb, 'sheet')) {
      const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      let path = target[rid] || '';
      path = path.startsWith('/') ? path.slice(1) : 'xl/' + path.replace(/^\.\//, '');
      const text = await zip.text(path);
      if (!text) continue;
      const rows = [];
      kids(xml(text), 'row').forEach((rowEl) => {
        const r = parseInt(rowEl.getAttribute('r'), 10) - 1;
        const row = (rows[r] = rows[r] || []);
        kids(rowEl, 'c').forEach((c) => {
          const t = c.getAttribute('t');
          const vEl = c.getElementsByTagName('v')[0];
          let val = '';
          if (t === 's') val = vEl ? shared[parseInt(vEl.textContent, 10)] || '' : '';
          else if (t === 'inlineStr') val = kids(c, 't').map((x) => x.textContent).join('');
          else if (t === 'b') val = vEl && vEl.textContent === '1' ? 'TRUE' : 'FALSE';
          else val = vEl ? vEl.textContent : '';
          row[colIndex(c.getAttribute('r'))] = val;
        });
      });
      for (let i = 0; i < rows.length; i++) {
        rows[i] = rows[i] || [];
        for (let j = 0; j < rows[i].length; j++) if (rows[i][j] == null) rows[i][j] = '';
      }
      sheets[s.getAttribute('name')] = rows;
    }
    return { sheets };
  };
})();
