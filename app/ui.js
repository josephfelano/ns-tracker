// UI components shared by every view. Views render HTML strings built with these helpers,
// then wire behaviour with T.ui.on() delegated listeners on their own root element
// (a fresh element per render, so listeners never outlive the view).
(function () {
  'use strict';
  const T = window.T;
  const esc = T.esc;
  const ui = (T.ui = {});

  ui.on = (root, type, selector, fn) =>
    root.addEventListener(type, (e) => {
      const t = e.target.closest(selector);
      if (t && root.contains(t)) fn(e, t);
    });

  ui.el = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };

  // ---------- small render helpers ----------
  ui.badge = (text, tone) => (text ? `<span class="badge tone-${tone || T.tone(text)}">${esc(text)}</span>` : '');
  ui.tier = (isT1) => (isT1 ? '<span class="badge tone-accent" title="Tier 1: answer before contract signature">Tier 1</span>' : '');
  ui.rev = (r) => (r ? `<span class="badge tone-${T.tone(r)}" title="Reversibility">${esc(r)}</span>` : '');
  ui.idLink = (id, kind) => {
    const route = kind || (id.startsWith('D-') ? 'decisions' : id.startsWith('M-') ? 'scoping' : 'questions');
    return `<a class="idlink" href="#/${route}/${encodeURIComponent(id)}">${esc(id)}</a>`;
  };
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

  // ---------- toast ----------
  ui.toast = (msg, type) => {
    let host = document.getElementById('toasts');
    if (!host) { host = ui.el('<div id="toasts" class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(host); }
    const t = ui.el(`<div class="toast tone-${type || 'info'}">${esc(msg)}</div>`);
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3600);
  };

  // ---------- modal / confirm / prompt ----------
  ui.modal = ({ title, body, actions, wide }) => {
    const m = ui.el(`<div class="modal-back"><div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">&times;</button></div>
      <div class="modal-body"></div>
      <div class="modal-foot"></div></div></div>`);
    const bodyEl = m.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const foot = m.querySelector('.modal-foot');
    let closed = false;
    const close = () => { if (closed) return; closed = true; m.remove(); document.removeEventListener('keydown', onKey); };
    (actions || [{ label: 'Close' }]).forEach((a) => {
      const b = ui.el(`<button class="btn${a.primary ? ' primary' : ''}${a.danger ? ' danger' : ''}">${esc(a.label)}</button>`);
      b.addEventListener('click', () => { const keep = a.onClick && a.onClick(m) === false; if (!keep) close(); });
      foot.appendChild(b);
    });
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m);
    const first = m.querySelector('input, textarea, select') || foot.querySelector('.primary');
    if (first) first.focus();
    return { el: m, close };
  };

  ui.confirm = ({ title, message, confirmLabel, danger }) =>
    new Promise((res) => {
      let answered = false;
      const m = ui.modal({
        title, body: `<p>${esc(message)}</p>`,
        actions: [
          { label: 'Cancel', onClick: () => { answered = true; res(false); } },
          { label: confirmLabel || 'OK', primary: !danger, danger, onClick: () => { answered = true; res(true); } },
        ],
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!answered) res(false); } });
      obs.observe(document.body, { childList: true });
    });

  ui.promptText = ({ title, label, value, placeholder }) =>
    new Promise((res) => {
      let answered = false;
      const body = ui.el(`<label class="field"><span>${esc(label)}</span><input type="text" value="${esc(value || '')}" placeholder="${esc(placeholder || '')}"></label>`);
      const input = body.querySelector('input');
      const m = ui.modal({
        title, body,
        actions: [
          { label: 'Cancel', onClick: () => { answered = true; res(null); } },
          { label: 'Save', primary: true, onClick: () => { answered = true; res(input.value.trim() || null); } },
        ],
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { answered = true; res(input.value.trim() || null); m.close(); } });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!answered) res(null); } });
      obs.observe(document.body, { childList: true });
    });

  // ---------- drawer (right-hand detail panel) ----------
  ui.drawer = {
    el: null,
    open({ title, subtitle, body, onClose }) {
      this.close(true);
      const d = ui.el(`<aside class="drawer" role="dialog" aria-label="${esc(title)}">
        <div class="drawer-head"><div><div class="drawer-sub">${subtitle || ''}</div><h2>${esc(title)}</h2></div>
        <button class="icon-btn" data-close aria-label="Close">&times;</button></div>
        <div class="drawer-body"></div></aside>`);
      const b = d.querySelector('.drawer-body');
      if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
      d.querySelector('[data-close]').addEventListener('click', () => this.close());
      document.body.appendChild(d);
      document.body.classList.add('has-drawer');
      this.el = d;
      this.onClose = onClose;
      ui.growAll(d);
      return d;
    },
    close(silent) {
      if (!this.el) return;
      this.el.remove();
      this.el = null;
      document.body.classList.remove('has-drawer');
      const cb = this.onClose;
      this.onClose = null;
      if (!silent && cb) cb();
    },
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.drawer.el && !document.querySelector('.modal-back')) ui.drawer.close();
  });

  // ---------- tabs ----------
  ui.tabs = (items, active, hrefFor) =>
    `<nav class="tabs">${items.map((t) => `<a class="tab${t.key === active ? ' active' : ''}" href="${hrefFor(t.key)}">${esc(t.label)}${t.count != null ? ` <span class="count">${t.count}</span>` : ''}</a>`).join('')}</nav>`;

  // ---------- editable table ----------
  // columns: [{key, label, enum?, person?, readonly?, long?, width?}]
  // rows: [{_key, ...values}]   onEdit(rowKey, colKey, value)   onRemove(rowKey) optional
  ui.editTable = ({ columns, rows, onEdit, onRemove, empty }) => {
    const head = columns.map((c) => `<th${c.width ? ` style="min-width:${c.width}px"` : ''}>${esc(c.label)}</th>`).join('') + (onRemove ? '<th class="narrow"></th>' : '');
    const body = rows.length
      ? rows.map((r) => {
          const cells = columns.map((c) => {
            const v = r[c.key] == null ? '' : r[c.key];
            const a = `data-row="${esc(r._key)}" data-col="${esc(c.key)}"`;
            const ro = typeof c.readonly === 'function' ? c.readonly(r) : c.readonly;
            if (ro) return `<td class="ro">${c.render ? c.render(r) : esc(v)}</td>`;
            if (c.enum) return `<td><select class="status tone-${T.tone(v)}" ${a}>${ui.options(T.enums[c.enum], v, '-')}</select></td>`;
            if (c.person) return `<td>${ui.personSelect(v, a, '-')}</td>`;
            return `<td><textarea class="cell grow" rows="1" ${a} placeholder="${esc(c.placeholder || '')}">${esc(v)}</textarea></td>`;
          }).join('');
          return `<tr>${cells}${onRemove ? `<td class="narrow"><button class="icon-btn subtle" data-remove="${esc(r._key)}" title="Remove row" aria-label="Remove row">&times;</button></td>` : ''}</tr>`;
        }).join('')
      : `<tr><td class="empty" colspan="${columns.length + (onRemove ? 1 : 0)}">${esc(empty || 'No rows yet.')}</td></tr>`;
    const el = ui.el(`<div class="table-wrap"><table class="grid edit"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
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
    ui.growAll(el);
    return el;
  };
})();
