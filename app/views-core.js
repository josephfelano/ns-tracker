// Views: Overview, Questions, Decisions, Build layers, Module scoping
// plus the question and decision editors used by drawers and Interview mode.
(function () {
  'use strict';
  const T = window.T;
  const { esc, ui, store, idx } = T;
  const B = T.bank;
  const V = (T.views = T.views || {});

  // Re-run fn on store changes while root is on the page; stops itself afterwards.
  T.live = (root, fn, events) => {
    let t = null;
    const off = store.onChange((what) => {
      if (!root.isConnected) { off(); return; }
      if (events && !events.includes(what)) return;
      clearTimeout(t);
      t = setTimeout(() => { if (root.isConnected) fn(what); }, 200);
    });
  };

  const segmented = (values, current, attr) =>
    `<div class="seg" role="radiogroup">${values.map((v) => `<button type="button" class="seg-btn tone-${T.tone(v)}${v === current ? ' on' : ''}" ${attr}="${esc(v)}" role="radio" aria-checked="${v === current}">${esc(v)}</button>`).join('')}</div>`;

  // ======================= question editor =======================
  T.qEditor = function (qid, opts) {
    opts = opts || {};
    const q = idx.q.get(qid);
    const a = store.state.answers[qid] || {};
    const status = a.status || 'Not started';
    const decisions = idx.qDecisions.get(qid) || [];
    const layers = idx.qLayers.get(qid) || [];
    const scoping = idx.qScoping.get(qid) || [];
    const prework = idx.qPrework.get(qid) || [];
    const interviews = (a.interviewIds || []).map((id) => store.state.interviews.find((i) => i.id === id)).filter(Boolean);

    const feeds = [
      decisions.length ? `<div class="feed-row"><span class="feed-label">Decides</span><div class="chips">${decisions.map((did) => {
        const d = idx.d.get(did); const ds = (store.state.decisions[did] || {}).status || 'Not started';
        return `<a class="chip" href="#/tracker/decisions/${did}" title="${esc(d.nsSetting || '')}">${ui.dot(ds)}<b>${did}</b> ${esc(d.decides)} ${ui.rev(d.reversibility)}</a>`;
      }).join('')}</div></div>` : '',
      scoping.length && scoping.length < 10 ? `<div class="feed-row"><span class="feed-label">Quote check</span><div class="chips">${scoping.map((mid) => `<a class="chip" href="#/tracker/scoping/${mid}"><b>${mid}</b> ${esc(idx.m.get(mid).ask)}</a>`).join('')}</div></div>` : '',
      prework.length ? `<div class="feed-row"><span class="feed-label">Prework</span><div class="chips">${prework.map((pid) => {
        const p = B.prework.dataDocuments.find((x) => x.id === pid); const pd = store.state.prework.data[pid] || {};
        return `<a class="chip" href="#/tracker/prework/data" title="Prework item that prepares this question">${pd['data-readiness'] ? ui.badge(pd['data-readiness']) : ''}<b>${pid}</b> ${esc(p.item)}</a>`;
      }).join('')}</div></div>` : '',
      layers.length ? `<div class="feed-row"><span class="feed-label">Layers</span><div class="chips">${layers.map((l) => `<a class="chip" href="#/tracker/layers">${l}</a>`).join('')}</div></div>` : '',
    ].join('');

    const el = ui.el(`<div class="qed${opts.big ? ' big' : ''}">
      <div class="qed-meta"><span class="mono">${esc(q.id)}</span> <span>${esc(q.section)} &middot; ${esc(idx.partName[q.part])}</span> ${ui.tier(q.tier1)}</div>
      <div class="qed-text">${esc(q.text)}</div>
      ${q.why ? `<div class="qed-why"><span>Why we ask</span> ${esc(q.why)}</div>` : ''}
      ${feeds ? `<div class="feeds">${feeds}</div>` : ''}
      <div class="field"><span>Status</span>${segmented(T.enums.questionStatus, status, 'data-status')}</div>
      <label class="field"><span>Answer</span><textarea class="grow answer" data-f="answer" rows="${opts.big ? 6 : 4}" placeholder="What they told you, in their words. Record what actually happens, including exceptions.">${esc(a.answer || '')}</textarea></label>
      <label class="field"><span>Follow-ups / notes</span><textarea class="grow" data-f="notes" rows="2" placeholder="Open questions, who else to ask, files to request">${esc(a.notes || '')}</textarea></label>
      <div class="field-row">
        <label class="field"><span>Owner (who answers for this)</span>${ui.personSelect(a.ownerId, 'data-f="ownerId"')}</label>
        <label class="field"><span>Files / links (one per line)</span><textarea class="grow" data-f="links" rows="1" placeholder="Path or URL">${esc((a.links || []).join('\n'))}</textarea></label>
      </div>
      <div class="qed-foot">${a.updatedAt ? 'Updated ' + T.fmtWhen(a.updatedAt) : 'Not touched yet'}${interviews.length ? ' &middot; From ' + interviews.map((i) => `<a href="#/tracker/interview/${i.id}">${esc(i.id)}${i.title ? ' ' + esc(i.title) : ''}</a>`).join(', ') : ''}</div>
    </div>`);

    ui.on(el, 'click', '[data-status]', (e, b) => {
      store.setAnswer(qid, 'status', b.dataset.status, opts.interviewId);
      el.querySelectorAll('[data-status]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      if (opts.onStatus) opts.onStatus(b.dataset.status);
    });
    ui.on(el, 'input', 'textarea[data-f]', (e, t) => {
      const f = t.dataset.f;
      const v = f === 'links' ? t.value.split('\n').map((s) => s.trim()).filter(Boolean) : t.value;
      if (f === 'links') { store.state.answers[qid] = store.state.answers[qid] || {}; store.state.answers[qid].links = v; store.state.answers[qid].updatedAt = T.now(); store.touch('answers'); return; }
      const wasNotStarted = !(store.state.answers[qid] || {}).status || store.state.answers[qid].status === 'Not started';
      store.setAnswer(qid, f, v, opts.interviewId);
      if (f === 'answer' && wasNotStarted && v) {
        el.querySelectorAll('[data-status]').forEach((x) => x.classList.toggle('on', x.dataset.status === 'In progress'));
      }
    });
    let prevOwner = a.ownerId || '';
    ui.on(el, 'change', 'select[data-f="ownerId"]', async (e, s) => {
      const id = await ui.resolvePerson(s, prevOwner);
      if (id == null) return;
      prevOwner = id;
      store.setAnswer(qid, 'ownerId', id, opts.interviewId);
    });
    ui.growAll(el);
    return el;
  };

  // ======================= decision editor =======================
  T.dEditor = function (did) {
    const d = idx.d.get(did);
    const s = store.state.decisions[did] || {};
    const status = s.status || 'Not started';
    const inp = T.inputs(store.state, d);
    const doors = (idx.dDoors.get(did) || []).map((n) => idx.door.get(n));
    const el = ui.el(`<div class="ded">
      <div class="qed-meta">${ui.rev(d.reversibility)} ${ui.tier(d.tier1)} <span>${esc(d.area)} &middot; Layer ${esc(d.layer)}</span></div>
      <dl class="kv">
        <dt>NetSuite setting</dt><dd>${esc(d.nsSetting || '-')}</dd>
        <dt>Blocks / notes</dt><dd>${esc(d.notes || '-')}</dd>
        ${d.pseudoRefs && d.pseudoRefs.length ? `<dt>Also fed by</dt><dd>${esc(d.pseudoRefs.join(', '))}</dd>` : ''}
      </dl>
      ${doors.length ? `<div class="doors">${doors.map((o) => `<div class="door${o.isOneWay ? '' : ' not'}"><div class="door-head">${o.isOneWay ? 'One-way door' : 'Not a one-way door'} #${o.num} <span class="fine">${esc(o.confidence)}${o.mappedBy === 'heuristic' ? ' &middot; link not yet confirmed' : ''}</span></div><div>${esc(o.constraint)}</div>${o.why ? `<div class="fine">${esc(o.why)}</div>` : ''}</div>`).join('')}</div>` : ''}
      <h4 class="sub-h">Discovery inputs <span class="fine">${inp.done} of ${inp.total} answered</span></h4>
      <div class="inputs">${d.questionIds.map((qid) => {
        const q = idx.q.get(qid); const a = store.state.answers[qid] || {};
        return `<div class="input-q">
          <div class="input-q-head">${ui.dot(a.status)}<a class="idlink" href="#/tracker/questions/${qid}">${qid}</a> ${ui.tier(q.tier1)} <span class="input-q-text">${esc(q.text)}</span></div>
          ${a.answer ? `<div class="input-q-answer">${esc(a.answer)}</div>` : '<div class="input-q-answer empty">No answer yet</div>'}
        </div>`;
      }).join('') || '<p class="fine">No discovery question is linked to this decision.</p>'}</div>
      <div class="field"><span>Status</span>${segmented(T.enums.decisionStatus, status, 'data-status')}</div>
      <label class="field"><span>Decision</span><textarea class="grow" data-f="decision" rows="3" placeholder="What we will configure, in one or two sentences">${esc(s.decision || '')}</textarea></label>
      <label class="field"><span>Why (evidence and reasoning)</span><textarea class="grow" data-f="rationale" rows="3" placeholder="Which answers drove it, what was ruled out and why">${esc(s.rationale || '')}</textarea></label>
      <div class="field-row">
        <label class="field"><span>Owner (theirs)</span>${ui.personSelect(s.ownerId, 'data-f="ownerId"')}</label>
        <label class="field"><span>Decided on</span><input type="date" data-f="decidedAt" value="${esc(s.decidedAt || '')}"></label>
      </div>
      <div class="qed-foot">${s.updatedAt ? 'Updated ' + T.fmtWhen(s.updatedAt) : 'Not touched yet'}</div>
    </div>`);
    ui.on(el, 'click', '[data-status]', (e, b) => {
      store.setDecision(did, 'status', b.dataset.status);
      el.querySelectorAll('[data-status]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      const dt = el.querySelector('[data-f="decidedAt"]');
      if (!dt.value && store.state.decisions[did].decidedAt) dt.value = store.state.decisions[did].decidedAt;
    });
    ui.on(el, 'input', 'textarea[data-f]', (e, t) => store.setDecision(did, t.dataset.f, t.value));
    ui.on(el, 'change', 'input[data-f="decidedAt"]', (e, t) => store.setDecision(did, 'decidedAt', t.value));
    let prevOwner = s.ownerId || '';
    ui.on(el, 'change', 'select[data-f="ownerId"]', async (e, sel) => {
      const id = await ui.resolvePerson(sel, prevOwner);
      if (id == null) return;
      prevOwner = id;
      store.setDecision(did, 'ownerId', id);
    });
    ui.growAll(el);
    return el;
  };

  T.openQuestion = (qid, backHash) => {
    if (!idx.q.has(qid)) return ui.toast('No question ' + qid, 'bad');
    const q = idx.q.get(qid);
    ui.drawer.open({ title: q.id, subtitle: esc(q.section), body: T.qEditor(qid), onClose: () => { if (backHash) location.hash = backHash; } });
  };
  T.openDecision = (did, backHash) => {
    if (!idx.d.has(did)) return ui.toast('No decision ' + did, 'bad');
    const d = idx.d.get(did);
    ui.drawer.open({ title: d.decides, subtitle: `<span class="mono">${d.id}</span>`, body: T.dEditor(did), onClose: () => { if (backHash) location.hash = backHash; } });
  };

  // ======================= Overview =======================
  V.overview = {
    render(root) {
      const draw = () => {
        const m = T.metrics(store.state);
        const st = store.state;
        const gate = (title, value, of, sub, good, href) => `<a class="gate tone-${good ? 'ok' : 'bad'}" href="${href}">
            <div class="gate-title">${esc(title)}</div>
            <div class="gate-num">${value}<span> / ${of}</span></div>
            <div class="gate-sub">${esc(sub)}</div></a>`;

        const nextT1 = B.questions.filter((q) => q.tier1 && !T.qDone((st.answers[q.id] || {}).status)).slice(0, 8);
        const recent = st.activity.slice(-8).reverse();
        const readiness = {};
        B.prework.dataDocuments.forEach((p) => { const r = (st.prework.data[p.id] || {})['data-readiness'] || 'Not filled in'; readiness[r] = (readiness[r] || 0) + 1; });
        const clarity = {};
        B.prework.processes.forEach((p) => { const r = (st.prework.processes[p.id] || {})['current-state-clarity'] || 'Not filled in'; clarity[r] = (clarity[r] || 0) + 1; });
        const countList = (obj, order) => order.concat(['Not filled in']).filter((k) => obj[k]).map((k) => `<div class="count-row">${k === 'Not filled in' ? '<span class="badge tone-muted">Not filled in</span>' : ui.badge(k)}<b>${obj[k]}</b></div>`).join('');

        const byPart = ['P1', 'P2', 'P3'].map((p) => {
          const secs = m.sections.filter((s) => s.part === p);
          const done = secs.reduce((n, s) => n + s.done, 0); const total = secs.reduce((n, s) => n + s.total, 0);
          return `<div class="part-block"><div class="part-head"><b>${esc(idx.partName[p])}</b><span class="fine">${done} / ${total}</span></div>
            ${secs.map((s) => `<a class="sec-row" href="#/tracker/questions" data-section="${esc(s.name)}"><span class="sec-name">${esc(s.name)}</span>${ui.bar(s.done, s.total)}<span class="sec-num">${s.done}/${s.total}${s.help ? ` <span class="badge tone-warn" title="Need help">${s.help}</span>` : ''}</span></a>`).join('')}</div>`;
        }).join('');

        root.innerHTML = `
          <div class="page-head"><div><p class="lead">Where the implementation stands: what must be answered, decided and built, in order.</p></div>
            <a class="btn primary" href="#/tracker/interview">Start an interview</a></div>
          <div class="gates">
            ${gate('Tier 1 questions answered', m.tier1QDone, m.tier1QTotal, 'Answer before contract signature', m.tier1QDone === m.tier1QTotal, '#/tracker/questions')}
            ${gate('Tier 1 decisions open', m.tier1DOpen, m.tier1DTotal, m.tier1DOpen ? 'Must reach 0 before signing' : 'Clear to sign', m.tier1DOpen === 0, '#/tracker/decisions')}
            ${gate('Module scoping confirmed', m.scopingDone, m.scopingTotal, 'Check the quote against the business', m.scopingDone === m.scopingTotal, '#/tracker/scoping')}
            ${gate('One-way decisions open', m.oneWayOpen, m.oneWayTotal, m.oneWayOpen ? 'Must reach 0 before L0 / L2 setup' : 'Clear to configure', m.oneWayOpen === 0, '#/tracker/layers')}
          </div>
          <div class="grid-2">
            <section class="card"><div class="card-head"><h2>Discovery</h2><span class="fine">${m.qDone} of ${m.qTotal} done${m.qHelp ? ' &middot; ' + m.qHelp + ' need help' : ''}</span></div>${byPart}</section>
            <section class="card"><div class="card-head"><h2>Build layers</h2><span class="fine">${m.dDone} of ${m.dTotal} decisions made</span></div>
              ${m.layers.map((l) => { const L = idx.layer.get(l.code); return `<a class="layer-row" href="#/tracker/layers"><span class="layer-code">${l.code}</span><span class="layer-name">${esc(L.decides.split(':')[0])}</span>${ui.bar(l.done, l.total)}<span class="sec-num">${l.done}/${l.total}${l.oneWayOpen ? ` <span class="badge tone-bad" title="One-way decisions open">${l.oneWayOpen}</span>` : ''}</span></a>`; }).join('')}
              <p class="fine">Each layer assumes everything above it is settled. Red counts are one-way decisions still open.</p>
            </section>
          </div>
          <div class="grid-2">
            <section class="card"><div class="card-head"><h2>Next Tier 1 questions</h2><a class="fine" href="#/tracker/interview">Interview mode</a></div>
              ${nextT1.length ? `<div class="list">${nextT1.map((q) => `<a class="list-row" href="#/tracker/questions/${q.id}">${ui.dot((st.answers[q.id] || {}).status)}<span class="mono">${q.id}</span><span class="clamp">${esc(q.text)}</span></a>`).join('')}</div>` : '<p class="ok-text">All Tier 1 questions are answered.</p>'}
            </section>
            <section class="card"><div class="card-head"><h2>Recent activity</h2><a class="fine" href="#/tracker/activity">All</a></div>
              ${recent.length ? `<div class="list">${recent.map((r) => `<div class="list-row"><span class="fine when">${T.fmtWhen(r.at)}</span><span>${esc(r.text)}</span></div>`).join('')}</div>` : '<p class="fine">Nothing yet. Answers, decisions and status changes show up here.</p>'}
            </section>
          </div>
          <div class="grid-3">
            <section class="card"><div class="card-head"><h2>Prework: data</h2><a class="fine" href="#/tracker/prework/data">Open</a></div>${countList(readiness, T.enums.preworkReadiness)}</section>
            <section class="card"><div class="card-head"><h2>Prework: process clarity</h2><a class="fine" href="#/tracker/prework/processes">Open</a></div>${countList(clarity, T.enums.preworkClarity)}</section>
            <section class="card"><div class="card-head"><h2>Files collected</h2><a class="fine" href="#/tracker/collect/files">Open</a></div>
              <div class="big-num">${m.filesDone}<span> / ${m.filesTotal}</span></div>${ui.bar(m.filesDone, m.filesTotal)}</section>
          </div>`;
        ui.on(root, 'click', '[data-section]', (e, a) => { V.questions.filters = Object.assign(V.questions.defaults(), { section: a.dataset.section }); });
      };
      draw();
      T.live(root, draw);
    },
  };

  // ======================= Questions =======================
  V.questions = {
    defaults: () => ({ text: '', part: '', section: '', tier: '', status: '', owner: '' }),
    filters: null,
    render(root, r) {
      const f = (this.filters = this.filters || this.defaults());
      const people = store.state.people;
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">The discovery question bank. Click a row to answer it.</p></div></div>
        <div class="filters">
          <input type="search" data-k="text" placeholder="Filter by ID, words or answer" value="${esc(f.text)}">
          <select data-k="part">${ui.options(B.meta.parts.map((p) => p.id), f.part, 'All parts')}</select>
          <select data-k="section">${ui.options(idx.sections.map((s) => s.name), f.section, 'All sections')}</select>
          <select data-k="tier"><option value="">All tiers</option><option value="1"${f.tier === '1' ? ' selected' : ''}>Tier 1 only</option></select>
          <select data-k="status">${ui.options(T.enums.questionStatus, f.status, 'Any status')}</select>
          <select data-k="owner"><option value="">Any owner</option><option value="__none"${f.owner === '__none' ? ' selected' : ''}>No owner</option>${people.map((p) => `<option value="${p.id}"${f.owner === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
          <button class="btn subtle" data-clear>Clear</button>
          <span class="fine count" id="qcount"></span>
        </div>
        <div class="table-wrap"><table class="grid rows-click"><thead><tr><th class="narrow"></th><th>ID</th><th>Question</th><th>Section</th><th>Owner</th><th>Decides</th><th>Updated</th></tr></thead><tbody id="qbody"></tbody></table></div>`;
      const partOpt = root.querySelector('[data-k="part"]');
      [...partOpt.options].forEach((o) => { if (o.value) o.textContent = idx.partName[o.value]; });
      const body = root.querySelector('#qbody');
      const draw = () => {
        const st = store.state;
        const text = f.text.trim().toLowerCase();
        const rows = B.questions.filter((q) => {
          const a = st.answers[q.id] || {};
          if (f.part && q.part !== f.part) return false;
          if (f.section && q.section !== f.section) return false;
          if (f.tier && !q.tier1) return false;
          if (f.status && (a.status || 'Not started') !== f.status) return false;
          if (f.owner === '__none' && a.ownerId) return false;
          if (f.owner && f.owner !== '__none' && a.ownerId !== f.owner) return false;
          if (text && !(q.id.toLowerCase().includes(text) || q.text.toLowerCase().includes(text) || (a.answer || '').toLowerCase().includes(text))) return false;
          return true;
        });
        root.querySelector('#qcount').textContent = `Showing ${rows.length} of ${B.questions.length}`;
        body.innerHTML = rows.map((q) => {
          const a = st.answers[q.id] || {};
          const ds = idx.qDecisions.get(q.id) || [];
          const oneWay = ds.some((did) => idx.d.get(did).reversibility === 'One-way');
          return `<tr data-q="${q.id}"${r && r.id === q.id ? ' class="sel"' : ''}>
            <td class="narrow">${ui.dot(a.status)}</td>
            <td class="mono nowrap">${q.id} ${q.tier1 ? '<span class="t1" title="Tier 1">T1</span>' : ''}</td>
            <td><div class="clamp">${esc(q.text)}</div>${a.answer ? `<div class="clamp fine">${esc(a.answer)}</div>` : ''}</td>
            <td class="nowrap fine">${esc(q.section)}</td>
            <td class="nowrap">${esc(store.personName(a.ownerId))}</td>
            <td class="nowrap">${ds.length ? `${ds.length}${oneWay ? ' <span class="badge tone-bad">one-way</span>' : ''}` : ''}</td>
            <td class="nowrap fine">${T.fmtWhen(a.updatedAt)}</td></tr>`;
        }).join('') || '<tr><td colspan="7" class="empty">No questions match these filters.</td></tr>';
      };
      ui.on(root, 'input', '[data-k]', (e, el) => { f[el.dataset.k] = el.value; draw(); });
      ui.on(root, 'change', 'select[data-k]', (e, el) => { f[el.dataset.k] = el.value; draw(); });
      ui.on(root, 'click', '[data-clear]', () => { this.filters = null; T.rerender(); });
      ui.on(root, 'click', 'tr[data-q]', (e, tr) => { location.hash = '#/tracker/questions/' + tr.dataset.q; });
      draw();
      T.live(root, draw, ['answers', 'reload', 'people']);
      this.select(r);
    },
    select(r) {
      document.querySelectorAll('tr[data-q]').forEach((tr) => tr.classList.toggle('sel', !!r.id && tr.dataset.q === r.id));
      if (r.id) T.openQuestion(r.id, '#/tracker/questions'); else ui.drawer.close(true);
    },
  };

  // ======================= Decisions =======================
  V.decisions = {
    defaults: () => ({ text: '', layer: '', area: '', rev: '', tier: '', status: '', inputs: '' }),
    filters: null,
    render(root, r) {
      const f = (this.filters = this.filters || this.defaults());
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">What each discovery answer decides in NetSuite, grouped by build layer. One-way decisions cannot be undone once configured.</p></div></div>
        <div class="filters">
          <input type="search" data-k="text" placeholder="Filter by ID, words or setting" value="${esc(f.text)}">
          <select data-k="layer">${ui.options(T.enums.layer, f.layer, 'All layers')}</select>
          <select data-k="area">${ui.options(T.enums.decisionArea, f.area, 'All areas')}</select>
          <select data-k="rev">${ui.options(T.enums.reversibility, f.rev, 'Any reversibility')}</select>
          <select data-k="tier"><option value="">All tiers</option><option value="1"${f.tier === '1' ? ' selected' : ''}>Tier 1 only</option></select>
          <select data-k="status">${ui.options(T.enums.decisionStatus, f.status, 'Any status')}</select>
          <select data-k="inputs"><option value="">Any inputs</option><option value="ready"${f.inputs === 'ready' ? ' selected' : ''}>Inputs answered</option><option value="waiting"${f.inputs === 'waiting' ? ' selected' : ''}>Waiting on answers</option></select>
          <button class="btn subtle" data-clear>Clear</button>
          <span class="fine count" id="dcount"></span>
        </div>
        <div class="table-wrap"><table class="grid rows-click"><thead><tr><th class="narrow"></th><th>ID</th><th>What the answer decides</th><th>Area</th><th>Reversibility</th><th>Inputs</th><th>Status</th></tr></thead><tbody id="dbody"></tbody></table></div>`;
      const body = root.querySelector('#dbody');
      const draw = () => {
        const st = store.state;
        const text = f.text.trim().toLowerCase();
        const rows = B.decisions.filter((d) => {
          const s = st.decisions[d.id] || {};
          if (f.layer && d.layer !== f.layer) return false;
          if (f.area && d.area !== f.area) return false;
          if (f.rev && d.reversibility !== f.rev) return false;
          if (f.tier && !d.tier1) return false;
          if (f.status && (s.status || 'Not started') !== f.status) return false;
          if (f.inputs) { const ready = T.inputs(st, d).ready; if ((f.inputs === 'ready') !== ready) return false; }
          if (text && !(d.id.toLowerCase().includes(text) || d.decides.toLowerCase().includes(text) || (d.nsSetting || '').toLowerCase().includes(text) || (s.decision || '').toLowerCase().includes(text))) return false;
          return true;
        });
        root.querySelector('#dcount').textContent = `Showing ${rows.length} of ${B.decisions.length}`;
        let html = '';
        T.enums.layer.forEach((code) => {
          const inLayer = rows.filter((d) => d.layer === code);
          if (!inLayer.length) return;
          const L = idx.layer.get(code);
          html += `<tr class="group"><td colspan="7"><b>${code}</b> ${esc(L.decides)}</td></tr>`;
          html += inLayer.map((d) => {
            const s = st.decisions[d.id] || {};
            const inp = T.inputs(st, d);
            return `<tr data-d="${d.id}"${r && r.id === d.id ? ' class="sel"' : ''}>
              <td class="narrow">${ui.dot(s.status)}</td>
              <td class="mono nowrap">${d.id} ${d.tier1 ? '<span class="t1" title="Tier 1">T1</span>' : ''}</td>
              <td><div class="clamp">${esc(d.decides)}</div><div class="clamp fine">${esc(s.decision || d.nsSetting || '')}</div></td>
              <td class="nowrap fine">${esc(d.area)}</td>
              <td>${ui.rev(d.reversibility)}</td>
              <td class="nowrap"><div class="mini">${ui.bar(inp.done, inp.total)}<span class="fine">${inp.done}/${inp.total}</span></div></td>
              <td class="nowrap">${ui.badge(s.status || 'Not started')}</td></tr>`;
          }).join('');
        });
        body.innerHTML = html || '<tr><td colspan="7" class="empty">No decisions match these filters.</td></tr>';
      };
      ui.on(root, 'input', '[data-k]', (e, el) => { f[el.dataset.k] = el.value; draw(); });
      ui.on(root, 'change', 'select[data-k]', (e, el) => { f[el.dataset.k] = el.value; draw(); });
      ui.on(root, 'click', '[data-clear]', () => { this.filters = null; T.rerender(); });
      ui.on(root, 'click', 'tr[data-d]', (e, tr) => { location.hash = '#/tracker/decisions/' + tr.dataset.d; });
      draw();
      T.live(root, draw, ['decisions', 'answers', 'reload']);
      this.select(r);
    },
    select(r) {
      document.querySelectorAll('tr[data-d]').forEach((tr) => tr.classList.toggle('sel', !!r.id && tr.dataset.d === r.id));
      if (r.id) T.openDecision(r.id, '#/tracker/decisions'); else ui.drawer.close(true);
    },
  };

  // ======================= Build layers =======================
  V.layers = {
    render(root) {
      const draw = () => {
        const st = store.state;
        const m = T.metrics(st);
        root.innerHTML = `
          <div class="page-head"><div><p class="lead">The account is built top to bottom. Each layer assumes everything above it is settled; changing an upper layer later means rework below it.</p></div></div>
          <div class="layers">${B.layers.map((L) => {
            const lm = m.layers.find((x) => x.code === L.code);
            const ds = B.decisions.filter((d) => d.layer === L.code);
            const fed = L.fedByQuestionIds;
            const fedDone = fed.filter((qid) => T.qDone((st.answers[qid] || {}).status)).length;
            return `<details class="layer card">
              <summary>
                <span class="layer-code big">${L.code}</span>
                <span class="layer-main"><span class="layer-title">${esc(L.decides)}</span><span class="fine">Cost of changing later: ${esc(L.costOfChange)}</span></span>
                <span class="layer-stats">
                  <span><b>${lm.done}/${lm.total}</b> decided</span>
                  <span><b>${lm.inputsReady}</b> ready to decide</span>
                  ${lm.oneWayOpen ? `<span class="badge tone-bad">${lm.oneWayOpen} one-way open</span>` : ''}
                </span>
                <span class="layer-bar">${ui.bar(lm.done, lm.total)}</span>
              </summary>
              <div class="layer-body">
                ${L.notes ? `<p class="fine">${esc(L.notes)}</p>` : ''}
                <table class="grid rows-click compact"><tbody>${ds.map((d) => {
                  const s = st.decisions[d.id] || {}; const inp = T.inputs(st, d);
                  return `<tr data-d="${d.id}"><td class="narrow">${ui.dot(s.status)}</td><td class="mono nowrap">${d.id}</td><td>${esc(d.decides)}</td><td>${ui.rev(d.reversibility)}</td><td class="nowrap fine">inputs ${inp.done}/${inp.total}</td><td class="nowrap">${ui.badge(s.status || 'Not started')}</td></tr>`;
                }).join('')}</tbody></table>
                <p class="fine">Fed by ${fed.length} discovery questions, ${fedDone} answered.${L.fedByRaw ? ' Source: ' + esc(L.fedByRaw) : ''}</p>
              </div></details>`;
          }).join('')}</div>
          <h2 class="section-h">One-way doors</h2>
          <p class="lead">Constraints that cannot be undone (or only through NetSuite Support). Read before enabling anything.</p>
          <div class="door-grid">${B.oneWayDoors.map((o) => `<div class="door card${o.isOneWay ? '' : ' not'}">
            <div class="door-head"><span>#${o.num}</span> ${o.isOneWay ? ui.badge('One-way') : '<span class="badge tone-muted">Not a one-way door</span>'} <span class="fine">${esc(o.confidence)}</span></div>
            <div class="door-text">${esc(o.constraint)}</div>
            ${o.why ? `<div class="fine">${esc(o.why)}</div>` : ''}
            ${(o.decisionIds || []).length ? `<div class="chips">${o.decisionIds.map((did) => `<a class="chip" href="#/tracker/decisions/${did}">${ui.dot((st.decisions[did] || {}).status)}<b>${did}</b> ${esc(idx.d.get(did).decides)}</a>`).join('')}</div>` : ''}
            ${o.source ? `<div class="fine">Source: ${esc(o.source)}</div>` : ''}
          </div>`).join('')}</div>`;
      };
      draw();
      ui.on(root, 'click', 'tr[data-d]', (e, tr) => T.openDecision(tr.dataset.d));
      // keep open/closed state of layer cards across redraws
      T.live(root, () => {
        const open = [...root.querySelectorAll('details.layer')].map((d) => d.open);
        draw();
        root.querySelectorAll('details.layer').forEach((d, i) => { d.open = open[i]; });
      }, ['decisions', 'answers', 'reload']);
    },
  };

  // ======================= Module scoping =======================
  V.scoping = {
    render(root, r) {
      const st = store.state;
      const t1 = B.questions.filter((q) => q.tier1);
      const t1Done = t1.filter((q) => T.qDone((st.answers[q.id] || {}).status)).length;
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">Questions to put to NetSuite and the implementation partner before signing, so the quote matches the business. Each is driven by discovery answers.</p></div></div>
        <div class="scoping">${B.moduleScoping.map((m) => {
          const s = st.scoping[m.id] || {};
          const drivers = m.drivenByAllTier1
            ? `<span class="chip">All Tier 1 questions: ${t1Done}/${t1.length} answered</span>`
            : m.drivenByQuestionIds.map((qid) => `<a class="chip" href="#/tracker/questions/${qid}">${ui.dot((st.answers[qid] || {}).status)}<b>${qid}</b></a>`).join('') || `<span class="fine">${esc(m.drivenByRaw || '-')}</span>`;
          return `<div class="card scope${r && r.id === m.id ? ' sel' : ''}" id="scope-${m.id}">
            <div class="scope-head"><span class="mono">${m.id}</span><div class="scope-ask">${esc(m.ask)}</div>${ui.statusSelect('moduleScopingStatus', s.status, `data-m="${m.id}"`)}</div>
            ${m.why ? `<div class="fine">${esc(m.why)}</div>` : ''}
            <div class="chips">${drivers}</div>
            <textarea class="grow" rows="1" data-ma="${m.id}" placeholder="Answer / what was quoted">${esc(s.answer || '')}</textarea>
          </div>`;
        }).join('')}</div>`;
      ui.on(root, 'change', 'select[data-m]', (e, s) => { ui.recolor(s); store.setScoping(s.dataset.m, 'status', s.value); });
      ui.on(root, 'input', 'textarea[data-ma]', (e, t) => store.setScoping(t.dataset.ma, 'answer', t.value));
      ui.growAll(root);
      this.select(r);
    },
    select(r) {
      if (!r.id) return;
      const el = document.getElementById('scope-' + r.id);
      if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('sel'); }
    },
  };
})();
