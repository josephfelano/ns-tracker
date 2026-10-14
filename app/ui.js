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
  // columns: [{key, label, enum?, person?, readonly?, long?, width?, link?, filter?, owner?}]
  // link: the cell holds a link or path (key) and optional display text (key + '-text'). It shows
  // the text, as a truncated link when the value is a URL; the pencil edits both in a small form.
  // filter: a text column that gets a dropdown in the filter bar (enum and person columns always
  // do). owner: a text column holding a person's name; it also drives the Department dropdown.
  // rows: [{_key, ...values}]   onEdit(rowKey, colKey, value)   onRemove(rowKey) optional
  // id: optional key for the table's saved filters (default: the page's hash)
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
  // The team (department) of an owner value: a person id, or a name typed in a text column
  // matched to People by name. '' when there is no owner, no match or no team.
  ui.teamOf = (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    const people = T.store.state.people;
    const p = people.find((x) => x.id === s) || people.find((x) => String(x.name || '').trim().toLowerCase() === s.toLowerCase());
    return p ? String(p.team || '').trim() : '';
  };
  ui.teams = () => [...new Set(T.store.state.people.map((p) => String(p.team || '').trim()).filter(Boolean))].sort(T.natCmp);
  ui.NONE = '__none';

  // Each editable table's filters, kept across re-renders (key: the page's hash, or opts.id).
  const tableFilters = new Map();
  // The filter bar: a search over every value in the row, then a dropdown for each enum and
  // person column and each text column marked filter or owner, and Department when the table has
  // an owner. Dropdowns list the values present; one with fewer than two choices is left out.
  const filterBar = (columns, rows, state) => {
    const blank = (v) => String(v == null ? '' : v).trim() === '';
    const selects = [];
    columns.filter((c) => c.enum || c.person || c.filter || c.owner).forEach((c) => {
      const seen = new Map();
      rows.forEach((r) => {
        const v = String(r[c.key] == null ? '' : r[c.key]).trim();
        if (v && !seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
      });
      let vals = [...seen.values()];
      if (c.enum) { const order = T.enums[c.enum] || []; vals.sort((a, b) => ((order.indexOf(a) + 1) || 999) - ((order.indexOf(b) + 1) || 999)); }
      const label = (v) => (c.person ? T.store.personName(v) || v : v);
      if (!c.enum) vals.sort((a, b) => T.natCmp(label(a), label(b)));
      const opts = vals.map((v) => [v, label(v)]);
      if (rows.some((r) => blank(r[c.key]))) opts.push([ui.NONE, 'Not filled in']);
      if (opts.length >= 2) selects.push({ key: c.key, label: c.label, opts });
    });
    const owners = columns.filter((c) => c.person || c.owner);
    if (owners.length) {
      const teams = new Set();
      let none = false;
      rows.forEach((r) => owners.forEach((c) => { const t = ui.teamOf(r[c.key]); if (t) teams.add(t); else none = true; }));
      const opts = [...teams].sort(T.natCmp).map((t) => [t, t]);
      if (none) opts.push([ui.NONE, 'No department']);
      if (opts.length >= 2) selects.push({ key: '_dept', label: 'Department', opts });
    }
    // A saved choice that is no longer offered would hide rows with no visible control.
    Object.keys(state).forEach((k) => { if (k !== 'text' && !selects.some((s) => s.key === k && s.opts.some((o) => o[0] === state[k]))) delete state[k]; });
    return `<div class="filters">
      <input type="search" data-fk="text" placeholder="Search" value="${esc(state.text || '')}">
      ${selects.map((s) => `<select data-fk="${esc(s.key)}" title="${esc(s.label)}"><option value="">${esc(s.label)}</option>${s.opts.map(([v, l]) => `<option value="${esc(v)}"${state[s.key] === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`).join('')}
      <button class="btn subtle" data-fclear>Clear</button>
      <span class="fine count" data-fcount></span>
    </div>`;
  };

  ui.editTable = ({ columns, rows, onEdit, onRemove, empty, id }) => {
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
          return `<tr data-key="${esc(r._key)}">${cells}${onRemove ? `<td class="narrow"><button class="icon-btn subtle" data-remove="${esc(r._key)}" title="Remove row" aria-label="Remove row">&times;</button></td>` : ''}</tr>`;
        }).join('')
      : `<tr><td class="empty" colspan="${columns.length + (onRemove ? 1 : 0)}">${esc(empty || 'No rows yet.')}</td></tr>`;
    const fkey = id || location.hash;
    const fstate = tableFilters.get(fkey) || {};
    tableFilters.set(fkey, fstate);
    const el = ui.el(`<div class="edit-table">${rows.length ? filterBar(columns, rows, fstate) : ''}<div class="table-wrap"><table class="grid edit">${colgroup}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`);
    // The table keeps its own copy of each row current, so filtering reads what is on screen.
    const byKey = new Map(rows.map((r) => [r._key, r]));
    const edit = (key, col, v) => { const r = byKey.get(key); if (r) r[col] = v; onEdit(key, col, v); };

    // Filtering hides rows instead of re-rendering, so focus and edits are kept. A row with
    // every column blank (one just added) always shows.
    const SKIP = new Set(['_key', 'id', 'createdAt', 'updatedAt', 'preset']);
    const haystack = (r) => Object.keys(r).filter((k) => !SKIP.has(k)).map((k) => [].concat(r[k] == null ? [] : r[k]).join(' '))
      .concat(columns.filter((c) => c.person).map((c) => T.store.personName(r[c.key]))).join(' ').toLowerCase();
    const owners = columns.filter((c) => c.person || c.owner);
    const val = (r, k) => String(r[k] == null ? '' : r[k]).trim();
    const matches = (r) => {
      if (columns.every((c) => !val(r, c.key))) return true;
      const text = String(fstate.text || '').trim().toLowerCase();
      if (text && !haystack(r).includes(text)) return false;
      return Object.keys(fstate).every((k) => {
        const want = fstate[k];
        if (k === 'text' || !want) return true;
        if (k === '_dept') return owners.some((c) => (ui.teamOf(r[c.key]) || ui.NONE) === want);
        const v = val(r, k);
        return want === ui.NONE ? !v : v.toLowerCase() === want.toLowerCase();
      });
    };
    const tbody = el.querySelector('tbody');
    const noMatch = ui.el(`<table><tbody><tr class="no-match" hidden><td class="empty" colspan="${columns.length + (onRemove ? 1 : 0)}">No rows match these filters.</td></tr></tbody></table>`).querySelector('tr');
    if (rows.length) tbody.appendChild(noMatch);
    const applyFilters = () => {
      if (!rows.length) return;
      let n = 0;
      tbody.querySelectorAll('tr[data-key]').forEach((tr) => {
        const show = matches(byKey.get(tr.dataset.key) || {});
        tr.hidden = !show;
        if (show) n++;
      });
      noMatch.hidden = n > 0;
      el.querySelector('[data-fcount]').textContent = `Showing ${n} of ${rows.length}`;
      ui.growAll(tbody); // textareas in hidden rows measure 0 tall
    };
    ui.on(el, 'input', 'input[data-fk]', (e, t) => { fstate[t.dataset.fk] = t.value; applyFilters(); });
    ui.on(el, 'change', 'select[data-fk]', (e, t) => { fstate[t.dataset.fk] = t.value; applyFilters(); });
    ui.on(el, 'click', '[data-fclear]', () => {
      Object.keys(fstate).forEach((k) => delete fstate[k]);
      el.querySelectorAll('[data-fk]').forEach((c) => { c.value = ''; });
      applyFilters();
    });
    applyFilters();

    const prev = new WeakMap();
    el.addEventListener('focusin', (e) => { if (e.target.matches('select.person')) prev.set(e.target, e.target.value); });
    ui.on(el, 'input', 'textarea[data-row]', (e, t) => edit(t.dataset.row, t.dataset.col, t.value));
    ui.on(el, 'change', 'select[data-row]', async (e, t) => {
      if (t.classList.contains('person')) {
        const pid = await ui.resolvePerson(t, prev.get(t));
        if (pid == null) return;
        edit(t.dataset.row, t.dataset.col, pid);
      } else {
        ui.recolor(t);
        edit(t.dataset.row, t.dataset.col, t.value);
      }
    });
    if (onRemove) ui.on(el, 'click', '[data-remove]', (e, t) => onRemove(t.dataset.remove));
    // Link cells: the pencil (or a click anywhere in the cell but the link) opens the editor.
    ui.on(el, 'click', 'td.link-cell', async (e, td) => {
      if (e.target.closest('a')) return;
      const row = byKey.get(td.dataset.row) || {};
      const col = td.dataset.col;
      const got = await ui.editLink({ text: row[col + '-text'], link: row[col] });
      if (!got) return;
      edit(td.dataset.row, col, got.link);
      edit(td.dataset.row, col + '-text', got.text);
      td.innerHTML = ui.linkView(got.link, got.text);
    });
    ui.growAll(el);
    return el;
  };
})();
