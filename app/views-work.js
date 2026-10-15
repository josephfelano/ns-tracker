// Views: Interview, Prework, Systems & files, People, Activity, Settings.
(function () {
  'use strict';
  const T = window.T;
  const { esc, ui, store, idx } = T;
  const B = T.bank;
  const V = (T.views = T.views || {});

  // ======================= Interview =======================
  // Pick (or start) an interview, choose a question set, then work question by question.
  // Every edit made here is tagged with the interview id, so an answer can be traced
  // back to who said it and when.
  V.interview = {
    set: { mode: 'tier1', section: '', hideDone: false },
    current: null,
    render(root, r) {
      const st = store.state;
      const iv = r.id ? st.interviews.find((i) => i.id === r.id) : null;
      if (r.id && !iv) { location.hash = '#/tracker/interview'; return; }
      const set = this.set;

      root.innerHTML = `
        <div class="page-head"><div><p class="lead">Work through questions with someone. Everything you capture here is linked to this interview.</p></div>
          <button class="btn primary" data-new>New interview</button></div>
        <div class="iv-bar card">
          <label class="field inline"><span>Interview</span><select data-iv>
            <option value="">No interview selected (answers are not linked)</option>
            ${st.interviews.slice().reverse().map((i) => `<option value="${i.id}"${iv && iv.id === i.id ? ' selected' : ''}>${esc(i.id)} &middot; ${esc(i.date)} &middot; ${esc(i.title || i.personIds.map(store.personName).join(', ') || 'Untitled')}</option>`).join('')}
          </select></label>
          ${iv ? `<div class="iv-people">${iv.personIds.map((p) => `<span class="chip">${esc(store.personName(p))}</span>`).join('') || '<span class="fine">No people added</span>'}<button class="btn subtle small" data-edit>Edit</button></div>` : ''}
        </div>
        ${iv ? `<details class="card iv-notes"${iv.notes ? ' open' : ''}><summary>Interview notes</summary><textarea class="grow" rows="3" data-ivnotes placeholder="General notes from this conversation: context, things to follow up, documents they mentioned">${esc(iv.notes || '')}</textarea></details>` : ''}
        <div class="iv-layout">
          <aside class="iv-queue card">
            <div class="iv-set">
              <select data-mode>
                <option value="tier1"${set.mode === 'tier1' ? ' selected' : ''}>Tier 1 questions</option>
                <option value="section"${set.mode === 'section' ? ' selected' : ''}>A section</option>
                <option value="owner"${set.mode === 'owner' ? ' selected' : ''}>Owned by people in this interview</option>
                <option value="help"${set.mode === 'help' ? ' selected' : ''}>Marked "Need help"</option>
                <option value="all"${set.mode === 'all' ? ' selected' : ''}>All questions</option>
              </select>
              ${set.mode === 'section' ? `<select data-section>${ui.options(idx.sections.map((s) => s.name), set.section || idx.sections[0].name)}</select>` : ''}
              <label class="check"><input type="checkbox" data-hide${set.hideDone ? ' checked' : ''}> Hide done</label>
            </div>
            <div class="iv-progress" id="ivprog"></div>
            <div class="iv-list" id="ivlist"></div>
          </aside>
          <section class="iv-card card" id="ivcard"></section>
        </div>`;

      const queue = () => {
        const s = store.state;
        let qs = B.questions;
        if (set.mode === 'tier1') qs = qs.filter((q) => q.tier1);
        else if (set.mode === 'section') qs = qs.filter((q) => q.section === (set.section || idx.sections[0].name));
        else if (set.mode === 'owner') { const ids = iv ? iv.personIds : []; qs = qs.filter((q) => ids.includes((s.answers[q.id] || {}).ownerId)); }
        else if (set.mode === 'help') qs = qs.filter((q) => (s.answers[q.id] || {}).status === 'Need help');
        const all = qs;
        if (set.hideDone) qs = qs.filter((q) => !T.qDone((s.answers[q.id] || {}).status) || q.id === this.current);
        return { qs, all };
      };

      const drawList = () => {
        const { qs, all } = queue();
        const s = store.state;
        const done = all.filter((q) => T.qDone((s.answers[q.id] || {}).status)).length;
        root.querySelector('#ivprog').innerHTML = `${ui.bar(done, all.length)}<span class="fine">${done} of ${all.length} done</span>`;
        root.querySelector('#ivlist').innerHTML = qs.map((q) => `<button class="iv-item${q.id === this.current ? ' on' : ''}" data-q="${q.id}">${ui.dot((s.answers[q.id] || {}).status)}<span class="mono">${q.id}</span><span class="clamp">${esc(q.text)}</span></button>`).join('')
          || `<p class="fine pad">${set.mode === 'owner' ? 'No questions are owned by the people in this interview yet. Set owners on questions, or pick another set.' : 'Nothing in this set.'}</p>`;
        return qs;
      };

      const drawCard = () => {
        const { qs } = queue();
        if (!this.current || !qs.some((q) => q.id === this.current)) this.current = qs.length ? qs[0].id : null;
        const card = root.querySelector('#ivcard');
        if (!this.current) { card.innerHTML = '<p class="fine pad">Pick a question set on the left.</p>'; return; }
        const i = qs.findIndex((q) => q.id === this.current);
        card.replaceChildren(ui.el(`<div class="iv-nav"><button class="btn" data-prev${i <= 0 ? ' disabled' : ''}>&larr; Previous</button><span class="fine">${i + 1} of ${qs.length} &middot; Ctrl+Enter for next</span><button class="btn primary" data-next${i >= qs.length - 1 ? ' disabled' : ''}>Next &rarr;</button></div>`));
        card.appendChild(T.qEditor(this.current, { big: true, interviewId: iv ? iv.id : null, onStatus: () => drawList() }));
        drawList();
        const ta = card.querySelector('textarea.answer');
        if (ta) ta.focus({ preventScroll: true });
      };

      const move = (step) => {
        const { qs } = queue();
        const i = qs.findIndex((q) => q.id === this.current);
        const n = qs[i + step];
        if (n) { this.current = n.id; drawCard(); }
      };

      ui.on(root, 'click', '[data-q]', (e, b) => { this.current = b.dataset.q; drawCard(); });
      ui.on(root, 'click', '[data-next]', () => move(1));
      ui.on(root, 'click', '[data-prev]', () => move(-1));
      root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); move(1); }
      });
      ui.on(root, 'change', '[data-mode]', (e, s) => { set.mode = s.value; T.rerender(); });
      ui.on(root, 'change', '[data-section]', (e, s) => { set.section = s.value; this.current = null; drawCard(); });
      ui.on(root, 'change', '[data-hide]', (e, c) => { set.hideDone = c.checked; drawList(); });
      ui.on(root, 'change', '[data-iv]', (e, s) => { location.hash = '#/tracker/interview' + (s.value ? '/' + s.value : ''); });
      ui.on(root, 'click', '[data-new]', () => this.editInterview(null));
      ui.on(root, 'click', '[data-edit]', () => this.editInterview(iv));
      ui.on(root, 'input', '[data-ivnotes]', (e, t) => { iv.notes = t.value; store.touch('interviews'); });
      drawCard();
      ui.growAll(root);
    },

    editInterview(iv) {
      const st = store.state;
      const sel = new Set(iv ? iv.personIds : []);
      const body = ui.el(`<div>
        <label class="field"><span>Title</span><input type="text" data-t value="${esc(iv ? iv.title : '')}" placeholder="e.g. Finance close walkthrough"></label>
        <label class="field"><span>Date</span><input type="date" data-date value="${esc(iv ? iv.date : T.today())}"></label>
        <div class="field"><span>People</span><div class="people-pick">${st.people.map((p) => `<label class="check"><input type="checkbox" value="${p.id}"${sel.has(p.id) ? ' checked' : ''}> ${esc(p.name)}${p.role ? ' <span class="fine">' + esc(p.role) + '</span>' : ''}</label>`).join('') || '<span class="fine">No people yet.</span>'}</div>
          <button class="btn subtle small" data-addp>+ Add a person</button></div>
      </div>`);
      body.querySelector('[data-addp]').addEventListener('click', async () => {
        const name = await ui.promptText({ title: 'Add a person', label: 'Name' });
        if (!name) return;
        const role = await ui.promptText({ title: 'Role for ' + name, label: 'Role / team (optional)' });
        const p = store.addPerson({ name, role: role || '' });
        const pick = body.querySelector('.people-pick');
        if (!st.people.length || pick.querySelector('.fine')) pick.innerHTML = '';
        pick.appendChild(ui.el(`<label class="check"><input type="checkbox" value="${p.id}" checked> ${esc(p.name)}</label>`));
      });
      ui.modal({
        title: iv ? 'Edit interview ' + iv.id : 'New interview',
        body,
        actions: [
          ...(iv ? [{ label: 'Delete', danger: true, onClick: () => { this.deleteInterview(iv); } }] : []),
          { label: 'Cancel' },
          { label: iv ? 'Save' : 'Start interview', primary: true, onClick: () => {
            const fields = {
              title: body.querySelector('[data-t]').value.trim(),
              date: body.querySelector('[data-date]').value || T.today(),
              personIds: [...body.querySelectorAll('.people-pick input:checked')].map((c) => c.value),
            };
            if (iv) { Object.assign(iv, fields); store.touch('interviews'); T.rerender(); }
            else { const n = store.addInterview(fields); location.hash = '#/tracker/interview/' + n.id; }
          } },
        ],
      });
    },

    async deleteInterview(iv) {
      const n = store.linkedAnswers(iv.id).length;
      const ok = await ui.confirm({
        title: 'Delete interview ' + iv.id,
        message: n ? `${n} answer${n === 1 ? ' was' : 's were'} captured in this interview. The answers stay; their link to this interview is removed.` : 'Delete this interview and its notes?',
        confirmLabel: 'Delete', danger: true,
      });
      if (!ok) return;
      store.removeInterview(iv.id);
      location.hash = '#/tracker/interview';
    },
  };

  // ======================= How it runs =======================
  // The company's flows step by step, from how-it-runs.md in the data folder. The file is written
  // from walkthrough notes outside the app (its format is in a comment at its top); this page only
  // reads it. Tracker ids in the text link to their records.
  const RUNS_FILE = 'how-it-runs.md';
  const runsLink = (id) => {
    if (idx.q.has(id) || idx.d.has(id)) return ui.peekLink(id);
    if (idx.m.has(id)) return ui.idLink(id, 'scoping');
    const link = (path, title) => `<a class="idlink" href="${T.href(path)}"${title ? ` title="${esc(title)}"` : ''}>${esc(id)}</a>`;
    const st = store.state;
    if (st.interviews.some((i) => i.id === id)) return link('interview/' + id);
    const p = st.people.find((x) => x.id === id);
    if (p) return link('people', p.name + (p.role ? ' - ' + p.role : ''));
    const f = B.fileChecklist.find((x) => x.id === id);
    if (f) return link('collect/files', f.file);
    if (B.prework.dataDocuments.some((x) => x.id === id)) return link('prework/data');
    if (B.prework.processes.some((x) => x.id === id)) return link('prework/processes');
    return id;
  };
  const runsHtml = (text) => (text == null
    ? `<p class="fine">No ${RUNS_FILE} in this tracker's data folder.</p>`
    : `<div class="md runs">${Hub.md(text, { inline: (t) => t.replace(/\b[A-Z][A-Z0-9]*-[A-Z]?\d+[a-z]?\b/g, runsLink) })}</div>`);

  V['how-it-runs'] = {
    root: null,
    text: undefined,
    async render(root) {
      this.root = root;
      try {
        this.text = await store.readText(RUNS_FILE);
        if (root.isConnected) root.innerHTML = runsHtml(this.text);
      } catch (e) {
        root.innerHTML = `<div class="error-box"><pre>${esc(e.message)}</pre></div>`;
      }
    },
    // Back in the window after the file was edited: show the new text in place, keeping the scroll.
    async refresh() {
      const root = this.root;
      if (!root || !root.isConnected) return;
      const text = await store.readText(RUNS_FILE).catch(() => this.text);
      if (text !== this.text && root.isConnected) { this.text = text; root.innerHTML = runsHtml(text); }
    },
  };
  window.addEventListener('focus', () => V['how-it-runs'].refresh());

  // ======================= Prework =======================
  // Columns come from the bank's templates; values are stored under slug(column label).
  const tplColumns = (tpl, readonlyLabels, personLabels) => tpl.map((c) => ({
    key: T.slug(c.column), label: c.column, enum: c.enum || undefined,
    readonly: readonlyLabels.includes(c.column), person: personLabels.includes(c.column),
    link: /^(file \/ link|link \/ notes)$/i.test(c.column) || undefined,
    filter: c.column === 'Area' || undefined,
    owner: c.column === 'Business owner' || undefined,
  }));

  V.prework = {
    render(root, r) {
      const tab = r.id || 'data';
      const st = store.state;
      const pw = st.prework;
      const counts = {
        data: B.prework.dataDocuments.filter((p) => (pw.data[p.id] || {})['collection-status'] === 'Ready for review').length + '/' + B.prework.dataDocuments.length,
        processes: B.prework.processes.length + pw.extraProcesses.length,
        systems: pw.systems.length,
      };
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">What the business assembles before day one: where the data lives, who owns each process, which systems and partners exist. Honest ratings beat tidy ones; a gap marked as a gap is a good answer.</p></div>
          <label class="btn">Import prework workbook...<input type="file" accept=".xlsx" data-import-xlsx hidden></label></div>
        ${ui.tabs([{ key: 'data', label: 'Data & documents', count: counts.data }, { key: 'processes', label: 'Processes', count: counts.processes }, { key: 'systems', label: 'Systems & partners', count: counts.systems }], tab, (k) => '#/tracker/prework/' + k)}
        <div id="pwbody"></div>`;
      const host = root.querySelector('#pwbody');
      ui.on(root, 'change', '[data-import-xlsx]', async (e, input) => {
        const file = input.files[0];
        input.value = '';
        if (file) await V.prework.importFile(file);
      });

      if (tab === 'processes') {
        const ro = (row) => !row._extra;
        const cols = tplColumns(B.prework.processesTemplate, [], ['Primary owner']).map((c) => (c.label === 'Area' || c.label === 'Process' ? Object.assign(c, { readonly: ro, width: c.label === 'Process' ? 200 : 120 }) : c));
        const rows = B.prework.processes.map((p) => Object.assign({ _key: p.id, area: p.area, process: p.process }, pw.processes[p.id] || {}))
          .concat(pw.extraProcesses.map((x) => Object.assign({ _key: x.id, _extra: true }, x)));
        host.appendChild(ui.editTable({
          columns: cols, rows,
          onEdit: (key, col, v) => {
            const extra = pw.extraProcesses.find((x) => x.id === key);
            if (extra) { extra[col] = v; extra.updatedAt = T.now(); store.touch('prework'); return; }
            const row = (pw.processes[key] = pw.processes[key] || {});
            row[col] = v; row.updatedAt = T.now();
            store.touch('prework');
            if (/status|clarity/.test(col)) store.log('prework-status', key, key + ' ' + col.replace(/-/g, ' ') + ': ' + v);
          },
          onRemove: async (key) => {
            if (!pw.extraProcesses.some((x) => x.id === key)) return ui.toast('Bank processes cannot be removed; mark them Not applicable.', 'info');
            if (!(await ui.confirm({ title: 'Remove process', message: 'Remove this added process row?', confirmLabel: 'Remove', danger: true }))) return;
            pw.extraProcesses = pw.extraProcesses.filter((x) => x.id !== key); store.touch('prework'); T.rerender();
          },
        }));
        host.appendChild(ui.el('<button class="btn subtle add-row" data-addproc>+ Add a process</button>'));
        ui.on(host, 'click', '[data-addproc]', () => { pw.extraProcesses.push({ id: T.uid('PW-PX') }); store.touch('prework'); T.rerender(); });
      }

      if (tab === 'systems') {
        const cols = tplColumns(B.prework.systemsTemplate, [], []);
        host.appendChild(ui.el('<p class="fine">Every system, partner and critical spreadsheet the business runs on: 3PLs, co-manufacturers, marketplaces, EDI, banks, payment processors, carriers. Where they overlap, this list wins over the discovery system tables.</p>'));
        host.appendChild(freeTable(pw.systems, cols, 'prework', 'No systems added yet.'));
      }

      // Data & documents: bank rows, edits stored under prework.data[id]
      if (tab === 'data') {
        const cols = tplColumns(B.prework.dataDocumentsTemplate, ['Area', 'What to have ready', 'Good enough before day one'], ['Owner'])
          .filter((c) => c.label !== 'Good enough before day one');
        const item = cols.find((c) => c.label === 'What to have ready');
        item.width = 240;
        item.render = (row) => `<b>${esc(row['what-to-have-ready'])}</b><div class="fine">${esc(row._good)}</div>${row._prepares.length ? `<div class="chips small">Prepares ${row._prepares.map((q) => ui.peekLink(q)).join('')}</div>` : ''}`;
        const rows = B.prework.dataDocuments.map((p) => Object.assign({}, pw.data[p.id] || {}, { _key: p.id, area: p.area, 'what-to-have-ready': p.item, _good: p.goodEnough, _prepares: p.preparesQuestionIds || [] }));
        host.appendChild(ui.editTable({
          columns: cols, rows,
          onEdit: (key, col, v) => {
            const row = (pw.data[key] = pw.data[key] || {});
            row[col] = v; row.updatedAt = T.now();
            store.touch('prework');
            if (/status|readiness/.test(col)) store.log('prework-status', key, key + ' ' + col.replace(/-/g, ' ') + ': ' + v);
          },
        }));
      }
    },
  };

  // Read a filled-in prework workbook, show what would change, apply on confirm.
  V.prework.importFile = async function (file) {
    let plan;
    try {
      const { sheets } = await T.readXlsx(await file.arrayBuffer());
      plan = T.preworkImport.plan(sheets);
    } catch (err) {
      return ui.modal({ title: 'Could not read that file', body: `<p>${esc(err.message || String(err))}</p>` });
    }
    const total = plan.changes.length + plan.newProcesses.length + plan.systemsAdd.length + plan.systemsUpdate.length + plan.newPeople.length;
    const byArea = (a) => plan.changes.filter((c) => c.area === a);
    const rowsTouched = (a) => new Set(byArea(a).map((c) => c.id)).size;
    const overwrites = plan.changes.filter((c) => c.from).length;
    const missing = ['data', 'processes', 'systems'].filter((k) => !plan.found[k]);
    const body = `
      <p>From <b>${esc(file.name)}</b>. Filled-in cells are imported; empty cells never clear what is already here.</p>
      <table class="grid compact"><tbody>
        <tr><td>Data &amp; documents</td><td>${plan.found.data ? `${byArea('data').length} values on ${rowsTouched('data')} items` : 'sheet not found'}</td></tr>
        <tr><td>Processes</td><td>${plan.found.processes ? `${byArea('processes').length} values on ${rowsTouched('processes')} processes${plan.newProcesses.length ? `, ${plan.newProcesses.length} new processes` : ''}` : 'sheet not found'}</td></tr>
        <tr><td>Systems &amp; partners</td><td>${plan.found.systems ? `${plan.systemsAdd.length} new, ${plan.systemsUpdate.length} updated` : 'sheet not found'}</td></tr>
        <tr><td>People</td><td>${plan.newPeople.length ? 'New: ' + plan.newPeople.map(esc).join(', ') : 'No new people'}</td></tr>
      </tbody></table>
      ${overwrites ? `<p class="warn-text">${overwrites} value(s) already in the tracker will be replaced by the workbook.</p>` : ''}
      ${missing.length ? `<p class="fine">Missing sheets are skipped.</p>` : ''}
      ${plan.flags.length ? `<details class="example"><summary>${plan.flags.length} note(s) about values</summary><ul class="flags">${plan.flags.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></details>` : ''}`;
    ui.modal({
      title: total ? 'Import prework' : 'Nothing new to import',
      body,
      wide: true,
      actions: total ? [
        { label: 'Cancel' },
        { label: 'Import', primary: true, onClick: () => { T.preworkImport.apply(plan); ui.toast('Prework imported', 'ok'); T.rerender(); } },
      ] : [{ label: 'Close' }],
    });
  };

  // A free-row table stored as an array of {id, ...} in some collection.
  function freeTable(arr, cols, collection, empty, opts) {
    opts = opts || {};
    const wrap = document.createElement('div');
    const rows = arr.map((x) => Object.assign({ _key: x.id }, x));
    wrap.appendChild(ui.editTable({
      columns: cols, rows, empty,
      onEdit: (key, col, v) => {
        const row = arr.find((x) => x.id === key);
        row[col] = v; row.updatedAt = T.now();
        store.touch(collection);
      },
      onRemove: opts.noRemove ? null : async (key) => {
        if (!(await ui.confirm({ title: 'Remove row', message: 'Remove this row? This cannot be undone from the app.', confirmLabel: 'Remove', danger: true }))) return;
        const i = arr.findIndex((x) => x.id === key);
        if (i >= 0) arr.splice(i, 1);
        store.touch(collection);
        T.rerender();
      },
    }));
    const add = ui.el('<button class="btn subtle add-row">+ Add a row</button>');
    add.addEventListener('click', () => { arr.push({ id: T.uid('R'), createdAt: T.now() }); store.touch(collection); T.rerender(); });
    wrap.appendChild(add);
    return wrap;
  }

  // ======================= Systems & files (discovery tables) =======================
  // Columns of the discovery tables that get a dropdown in the filter bar. Owner columns hold
  // a person's name and also drive the Department dropdown.
  const TABLE_OWNERS = ['Who owns it', 'Who built it', 'Who runs it', 'Who builds it', 'Who decides when systems disagree'];
  const TABLE_FILTERS = ['Could we turn it off afterward?', 'Still here?', 'Report, or a system holding data?', 'Native connector, iPaaS, or custom?',
    'How often', 'Frequency', 'Format', 'Source', 'Destination'];

  V.collect = {
    render(root, r) {
      const st = store.state;
      const tables = B.systemsTables.tables.concat([B.systemsTables.reports]);
      const tab = r.id || tables[0].key;
      const filesDone = B.fileChecklist.filter((f) => (st.files[f.id] || {}).status === 'Complete').length;
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">The discovery workbook's tables and the file checklist. Confirm and extend what the prework collected rather than starting over.</p></div></div>
        ${ui.tabs(tables.map((t) => ({ key: t.key, label: t.title, count: (st.tables[t.key] || []).length || null })).concat([{ key: 'files', label: 'File checklist', count: filesDone + '/' + B.fileChecklist.length }]), tab, (k) => '#/tracker/collect/' + k)}
        <div id="cbody"></div>`;
      const host = root.querySelector('#cbody');

      if (tab === 'files') {
        host.appendChild(ui.el(`<p class="fine">${filesDone} of ${B.fileChecklist.length} collected. Choose representative documents, including one that went wrong.</p>`));
        const cols = [
          { key: 'category', label: 'Category', readonly: true, filter: true },
          { key: 'file', label: 'File', readonly: true, width: 260, render: (row) => `<b>${esc(row.file)}</b>${row._notes ? `<div class="fine">${esc(row._notes)}</div>` : ''}${row._cov ? `<div class="fine">Covered by prework ${esc(row._cov)}</div>` : ''}` },
          { key: 'status', label: 'Status', enum: 'fileChecklistStatus' },
          { key: 'link', label: 'Filename / link', placeholder: 'Path or URL', link: true },
          { key: 'notes', label: 'Notes' },
        ];
        const rows = B.fileChecklist.map((f) => Object.assign({}, st.files[f.id] || {}, { _key: f.id, category: f.category, file: f.file, _notes: f.notes, _cov: f.coveredByPreworkId }));
        host.appendChild(ui.editTable({ columns: cols, rows, onEdit: (key, col, v) => store.setKeyed('files', key, col, v, key) }));
        return;
      }

      const t = tables.find((x) => x.key === tab) || tables[0];
      if (!st.tables[t.key]) {
        st.tables[t.key] = (t.presetDataTypes || []).map((p) => ({ id: T.uid('R'), [T.slug(t.columns[0])]: p, preset: true }));
        if (st.tables[t.key].length) store.touch('tables');
      }
      const cols = t.columns.map((c, i) => ({
        key: T.slug(c), label: c, width: i === 0 ? 180 : undefined, readonly: i === 0 && t.presetDataTypes ? (row) => row.preset : false,
        owner: TABLE_OWNERS.includes(c) || undefined, filter: TABLE_FILTERS.includes(c) || undefined, link: c === 'Link' || undefined,
      }));
      host.appendChild(ui.el(`<div class="table-intro"><p>${esc(t.description || '')}</p><p class="fine">Answers ${t.questionIds.map((q) => ui.peekLink(q)).join(', ')}</p>
        ${t.example ? `<details class="example"><summary>Example row</summary><dl class="kv">${Object.entries(t.example).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details>` : ''}</div>`));
      host.appendChild(freeTable(st.tables[t.key], cols, 'tables', 'No rows yet.'));
    },
  };

  // ======================= People =======================
  V.people = {
    render(root) {
      const st = store.state;
      const owned = (pid) => Object.values(st.answers).filter((a) => a.ownerId === pid).length;
      const decs = (pid) => Object.values(st.decisions).filter((d) => d.ownerId === pid).length;
      const ivs = (pid) => st.interviews.filter((i) => i.personIds.includes(pid)).length;
      root.innerHTML = `<div class="page-head"><div><p class="lead">Every owner field points at a named person, not a department.</p></div><button class="btn primary" data-add>Add a person</button></div><div id="pbody"></div>`;
      const cols = [
        { key: 'id', label: 'ID', readonly: true },
        { key: 'name', label: 'Name', width: 160 },
        { key: 'role', label: 'Role', width: 160 },
        { key: 'team', label: 'Team', filter: true },
        { key: 'notes', label: 'Notes', width: 220 },
        { key: '_stats', label: 'Owns', readonly: true, render: (r) => `<span class="fine nowrap">${owned(r._key)} questions &middot; ${decs(r._key)} decisions &middot; ${ivs(r._key)} interviews</span>` },
      ];
      const rows = st.people.map((p) => Object.assign({ _key: p.id }, p));
      root.querySelector('#pbody').appendChild(ui.editTable({
        columns: cols, rows, empty: 'No people yet. Add them as you meet them; interviews and owner fields use this list.',
        onEdit: (key, col, v) => { const p = store.person(key); p[col] = v; store.touch('people'); },
        onRemove: async (key) => {
          const n = owned(key) + decs(key) + ivs(key);
          if (!(await ui.confirm({ title: 'Remove ' + store.personName(key), message: n ? `This person is referenced ${n} times (owner fields, interviews). Those references will show blank.` : 'Remove this person?', confirmLabel: 'Remove', danger: true }))) return;
          st.people = st.people.filter((p) => p.id !== key); store.touch('people'); T.rerender();
        },
      }));
      ui.on(root, 'click', '[data-add]', async () => {
        const name = await ui.promptText({ title: 'Add a person', label: 'Name' });
        if (!name) return;
        store.addPerson({ name });
        T.rerender();
      });
    },
  };

  // ======================= Activity =======================
  V.activity = {
    render(root) {
      const items = store.state.activity.slice().reverse();
      const byDay = new Map();
      items.forEach((a) => { const d = a.at.slice(0, 10); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(a); });
      const refLink = (ref) => (!ref ? '' : idx.q.has(ref) ? ui.idLink(ref, 'questions') : idx.d.has(ref) ? ui.idLink(ref, 'decisions') : idx.m.has(ref) ? ui.idLink(ref, 'scoping') : /^I-/.test(ref) ? `<a class="idlink" href="#/tracker/interview/${ref}">${esc(ref)}</a>` : `<span class="mono">${esc(ref)}</span>`);
      root.innerHTML = `<div class="page-head"><div><p class="lead">What changed and when. Edits to the same item within 15 minutes are folded into one line.</p></div></div>
        ${byDay.size ? [...byDay].map(([day, list]) => `<section class="card"><div class="card-head"><h2>${new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2><span class="fine">${list.length}</span></div>
          <div class="list">${list.map((a) => `<div class="list-row"><span class="fine when">${new Date(a.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>${refLink(a.ref)}<span>${esc(a.text)}</span></div>`).join('')}</div></section>`).join('') : '<p class="fine">Nothing yet.</p>'}`;
    },
  };

  // ======================= Settings =======================
  V.settings = {
    render(root) {
      const st = store.state;
      const a = store.adapter;
      const meta = B.meta;
      root.innerHTML = `<section class="card"><div class="card-head"><h2>Project</h2></div>
          <label class="field"><span>Name shown in the app</span><input type="text" data-name value="${esc(st.tracker.name)}"></label></section>
        <section class="card"><div class="card-head"><h2>Where data is saved</h2></div>
          <p>${a.kind === 'folder' ? `Folder <b>${esc(a.label)}</b>. Each area is one JSON file in that folder:` : '<b>This browser only.</b> Data is not in any file and is lost if browser data is cleared. Connect a folder to save files.'}</p>
          ${a.kind === 'folder' ? `<ul class="files-list">${store.COLLECTIONS.map((c) => `<li><code>${c}.json</code></li>`).join('')}</ul>` : ''}
          <div class="btn-row"><button class="btn" data-switch>${a.kind === 'folder' ? 'Switch data folder...' : 'Connect a folder...'}</button>
          <button class="btn" data-export>Download a snapshot (.json)</button>
          <label class="btn">Import a snapshot...<input type="file" accept=".json,application/json" data-import hidden></label></div>
          <p class="fine">A snapshot is every area in one file: a backup, or a way to move data into a folder.</p></section>
        <section class="card"><div class="card-head"><h2>Question bank</h2></div>
          <dl class="kv"><dt>Version</dt><dd>${esc(meta.version)}</dd><dt>Source date</dt><dd>${esc(meta.generatedAt)}</dd>
          <dt>Contents</dt><dd>${B.questions.length} questions (${B.questions.filter((q) => q.tier1).length} Tier 1), ${B.decisions.length} decisions, ${B.steps.length} steps, ${B.features.length} NetSuite features, ${B.oneWayDoors.length} one-way door notes, ${B.moduleScoping.length} scoping asks, ${B.prework.dataDocuments.length + B.prework.processes.length} prework items, ${B.fileChecklist.length} files</dd>
          <dt>Sources</dt><dd>${B.sources.length} sources behind the NetSuite facts; research in <code>research/</code>.</dd></dl></section>`;
      ui.on(root, 'input', '[data-name]', (e, t) => { st.tracker.name = t.value; store.touch('tracker'); });
      ui.on(root, 'click', '[data-switch]', () => Hub.switchFolder());
      ui.on(root, 'click', '[data-export]', () => {
        const blob = new Blob([JSON.stringify(store.snapshot(), null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'ns-tracker-snapshot-' + T.today() + '.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      });
      ui.on(root, 'change', '[data-import]', async (e, input) => {
        const file = input.files[0];
        if (!file) return;
        let obj;
        try { obj = JSON.parse(await file.text()); } catch (err) { return ui.toast('Not a valid JSON file', 'bad'); }
        if (!obj.tracker) return ui.toast('That file is not a tracker snapshot', 'bad');
        if (!(await ui.confirm({ title: 'Import snapshot', message: 'Replace the data here with the snapshot? Areas in the snapshot overwrite what is saved now.', confirmLabel: 'Import', danger: true }))) return;
        await store.importSnapshot(obj);
        ui.toast('Snapshot imported', 'ok');
      });
    },
  };
})();
