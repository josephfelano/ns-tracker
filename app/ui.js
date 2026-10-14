// Tracker UI helpers: badges, status selects, people pickers, the editable table.
// The generic services (toast, modal, confirm, prompt, drawer, tabs, delegated listeners)
// come from the shared shell (Hub.ui); they are re-exported here so views keep calling T.ui.*.
// Views render HTML strings built with these helpers, then wire behaviour with ui.on()
// delegated listeners on their own root element (a fresh element per render).
(function () {
  'use strict';
  const T = window.T;
  const esc = T.esc;
  const ui = (T.ui = {});
  ['on', 'el', 'toast', 'modal', 'confirm', 'promptText', 'tabs'].forEach((k) => { ui[k] = Hub.ui[k]; });

  // ---------- small render helpers ----------
  ui.badge = (text, tone) => (text ? `<span class="badge tone-${tone || T.tone(text)}">${esc(text)}</span>` : '');
  ui.tier = (isT1) => (isT1 ? '<span class="badge tone-accent" title="Tier 1: answer before contract signature">Tier 1</span>' : '');
  ui.rev = (r) => (r ? `<span class="badge tone-${T.tone(r)}" title="Reversibility">${esc(r)}</span>` : '');
  ui.idLink = (id, kind) => {
    const route = kind || (id.startsWith('D-') ? 'decisions' : id.startsWith('M-') ? 'scoping' : 'questions');
    return `<a class="idlink" href="${T.href(route + '/' + encodeURIComponent(id))}">${esc(id)}</a>`;
  };
  // An id link that opens the question or decision in the side panel and keeps the page where it
  // is, so a list of references can be read one after another. A modified click still navigates.
  ui.peekLink = (id) => ui.idLink(id).replace('<a ', `<a data-peek="${esc(id)}" `);
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-peek]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = a.dataset.peek;
    const open = id.startsWith('D-') ? T.openDecision : id.startsWith('M-') ? null : T.openQuestion;
    if (!open) return;
    e.preventDefault();
    open(id);
  });
  ui.bar = (done, total, tone) => {
    const p = T.pct(done, total);
    return `<div class="bar" title="${done} of ${total}"><div class="bar-fill tone-${tone || (p === 100 ? 'ok' : 'accent')}" style="width:${p}%"></div></div>`;
  };
  ui.dot = (status) => `<span class="dot tone-${T.tone(status || 'Not started')}" title="${esc(status || 'Not started')}"></span>`;

  ui.options = (values, current, blank) =>
    (blank != null ? `<option value="">${esc(blank)}</option>` : '') +
    values.map((v) => `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${esc(v)}</option>`).join('');

  // A status <select> whose colour follows its value.
  ui.statusSelect = (enumName, value, attrs, fallback) => {
    const vals = T.enums[enumName];
    const v = value || fallback || vals[0];
    return `<select class="status tone-${T.tone(v)}" ${attrs || ''}>${ui.options(vals, v)}</select>`;
  };

  ui.personSelect = (value, attrs, blank) => {
    const people = T.store.state.people.slice().sort((a, b) => T.natCmp(a.name, b.name));
    return `<select class="person" ${attrs || ''}>
      <option value="">${esc(blank || 'No owner')}</option>
      ${people.map((p) => `<option value="${esc(p.id)}"${p.id === value ? ' selected' : ''}>${esc(p.name || p.id)}${p.role ? ' - ' + esc(p.role) : ''}</option>`).join('')}
      <option value="__new">+ Add a person...</option>
    </select>`;
  };

  // Handle the "+ Add a person..." option; resolves to the chosen/created person id (or null).
  ui.resolvePerson = async (selectEl, previous) => {
    if (selectEl.value !== '__new') return selectEl.value;
    const name = await ui.promptText({ title: 'Add a person', label: 'Name', placeholder: 'e.g. Dana Lee' });
    if (!name) {
      selectEl.value = previous || '';
      return null;
    }
    const role = await ui.promptText({ title: 'Role for ' + name, label: 'Role / team (optional)', placeholder: 'e.g. Controller' });
    const p = T.store.addPerson({ name, role: role || '' });
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name + (p.role ? ' - ' + p.role : '');
    selectEl.insertBefore(opt, selectEl.lastElementChild);
    selectEl.value = p.id;
    return p.id;
  };

  ui.recolor = (sel) => { sel.className = sel.className.replace(/tone-\S+/, 'tone-' + T.tone(sel.value)); };

  // ---------- auto-growing textareas ----------
  ui.grow = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; };
  ui.growAll = (root) => requestAnimationFrame(() => root.querySelectorAll('textarea.grow').forEach(ui.grow));
  document.addEventListener('input', (e) => { if (e.target.matches && e.target.matches('textarea.grow')) ui.grow(e.target); });
  // Column widths follow the window, so wrapped text changes height on resize.
  let growTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(growTimer); growTimer = setTimeout(() => ui.growAll(document), 120); });

  // The shell's drawer, plus auto-growing the textareas the tracker's editors put in it.
  ui.drawer = {
    get el() { return Hub.ui.drawer.el; },
    open(opts) { const d = Hub.ui.drawer.open(opts); ui.growAll(d); return d; },
    close: (silent) => Hub.ui.drawer.close(silent),
  };

  // ---------- editable table ----------
  // columns: [{key, label, enum?, person?, readonly?, long?, width?, link?}]
  // link: the cell holds a link or path (key) and optional display text (key + '-text'). It shows
  // the text, as a truncated link when the value is a URL; the pencil edits both in a small form.
  // rows: [{_key, ...values}]   onEdit(rowKey, colKey, value)   onRemove(rowKey) optional
  // The table fits its container (fixed layout): columns get proportional widths and long text
  // wraps inside its cell, so there is no sideways scrolling.
  ui.isUrl = (v) => /^(https?:\/\/|www\.)\S+$/i.test(String(v || '').trim());
  ui.linkView = (v, text) => {
    const u = String(v || '').trim();
    const label = String(text || '').trim() || u;
    const href = /^www\./i.test(u) ? 'https://' + u : u;
    const shown = !label ? '<span class="link-empty">-</span>'
      : ui.isUrl(u) ? `<a href="${esc(href)}" target="_blank" rel="noopener" title="${esc(u)}">${esc(label)}</a>`
      : `<span class="link-text" title="${esc(label)}">${esc(label)}</span>`;
    return `<span class="link-view">${shown}<button type="button" class="icon-btn subtle" data-edit-link title="Edit link" aria-label="Edit link">&#9998;</button></span>`;
  };
  // Edit a link cell: display text + link or path. Resolves { text, link }, or null on cancel.
  ui.editLink = ({ text, link }) =>
    new Promise((res) => {
      let answer = null;
      const body = ui.el(`<div>
        <label class="field"><span>Display text</span><input type="text" data-text value="${esc(text || '')}"></label>
        <label class="field"><span>Link or path</span><input type="text" data-link value="${esc(link || '')}" placeholder="https://..."></label></div>`);
      const read = () => ({ text: body.querySelector('[data-text]').value.trim(), link: body.querySelector('[data-link]').value.trim() });
      const m = ui.modal({
        title: 'Edit link', body,
        actions: [{ label: 'Cancel' }, { label: 'Save', primary: true, onClick: () => { answer = read(); } }],
        onClose: () => res(answer),
      });
      body.addEventListener('keydown', (e) => { if (e.key === 'Enter') { answer = read(); m.close(); } });
    });
  ui.editTable = ({ columns, rows, onEdit, onRemove, empty }) => {
    // Dropdown columns are sized to the longest value they hold (a select cannot wrap), as a
    // share of a 1340px table so they scale with the window; text columns share what is left
    // and wrap. Dropdowns together take at most 70%.
    const longest = (c) => Math.max(0, ...rows.map((r) => String((c.person ? T.store.personName(r[c.key]) : r[c.key]) || '').length));
    const pick = (c) => !c.width && (c.enum || c.person);
    const px = columns.map((c) => (pick(c) ? Math.min(230, Math.max(92, Math.round(longest(c) * 7.2 + 46))) : 0));
    const pctTotal = px.reduce((a, b) => a + b, 0) / 1340 * 100;
    const scale = pctTotal > 70 ? 70 / pctTotal : 1;
    const colW = (c, i) => (c.width ? c.width + 'px' : pick(c) ? (px[i] / 1340 * 100 * scale).toFixed(2) + '%' : 'auto');
    const colgroup = '<colgroup>' + columns.map((c, i) => `<col style="width:${colW(c, i)}">`).join('') + (onRemove ? '<col style="width:36px">' : '') + '</colgroup>';
    const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('') + (onRemove ? '<th class="narrow"></th>' : '');
    const body = rows.length
      ? rows.map((r) => {
          const cells = columns.map((c) => {
            const v = r[c.key] == null ? '' : r[c.key];
            const a = `data-row="${esc(r._key)}" data-col="${esc(c.key)}"`;
            const ro = typeof c.readonly === 'function' ? c.readonly(r) : c.readonly;
            if (ro) return `<td class="ro">${c.render ? c.render(r) : esc(v)}</td>`;
            if (c.enum) return `<td><select class="status tone-${T.tone(v)}" ${a}>${ui.options(T.enums[c.enum], v, '-')}</select></td>`;
            if (c.person) return `<td>${ui.personSelect(v, a, '-')}</td>`;
            if (c.link) return `<td class="link-cell" ${a}>${ui.linkView(v, r[c.key + '-text'])}</td>`;
            return `<td><textarea class="cell grow" rows="1" ${a} placeholder="${esc(c.placeholder || '')}">${esc(v)}</textarea></td>`;
          }).join('');
          return `<tr>${cells}${onRemove ? `<td class="narrow"><button class="icon-btn subtle" data-remove="${esc(r._key)}" title="Remove row" aria-label="Remove row">&times;</button></td>` : ''}</tr>`;
        }).join('')
      : `<tr><td class="empty" colspan="${columns.length + (onRemove ? 1 : 0)}">${esc(empty || 'No rows yet.')}</td></tr>`;
    const el = ui.el(`<div class="table-wrap"><table class="grid edit">${colgroup}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
    const prev = new WeakMap();
    el.addEventListener('focusin', (e) => { if (e.target.matches('select.person')) prev.set(e.target, e.target.value); });
    ui.on(el, 'input', 'textarea[data-row]', (e, t) => onEdit(t.dataset.row, t.dataset.col, t.value));
    ui.on(el, 'change', 'select[data-row]', async (e, t) => {
      if (t.classList.contains('person')) {
        const id = await ui.resolvePerson(t, prev.get(t));
        if (id == null) return;
        onEdit(t.dataset.row, t.dataset.col, id);
      } else {
        ui.recolor(t);
        onEdit(t.dataset.row, t.dataset.col, t.value);
      }
    });
    if (onRemove) ui.on(el, 'click', '[data-remove]', (e, t) => onRemove(t.dataset.remove));
    // Link cells: the pencil (or a click anywhere in the cell but the link) opens the editor.
    const linkVals = new Map(rows.map((r) => [r._key, r]));
    ui.on(el, 'click', 'td.link-cell', async (e, td) => {
      if (e.target.closest('a')) return;
      const row = linkVals.get(td.dataset.row) || {};
      const col = td.dataset.col;
      const got = await ui.editLink({ text: row[col + '-text'], link: row[col] });
      if (!got) return;
      row[col] = got.link; row[col + '-text'] = got.text;
      onEdit(td.dataset.row, col, got.link);
      onEdit(td.dataset.row, col + '-text', got.text);
      td.innerHTML = ui.linkView(got.link, got.text);
    });
    ui.growAll(el);
    return el;
  };
})();
