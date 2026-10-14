// Views: Overview, Questions, Decisions, Implementation guide, Module scoping
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

  // ======================= answer picker =======================
  const DOOR_KIND = {
    'cannot-disable': 'Cannot be undone', 'locked-once-used': 'Locked once used', 'record-lock': 'Locked on the record',
    'support-only': 'Only NetSuite Support can undo', order: 'Order matters', behaviour: 'How it behaves',
    recommendation: 'Recommendation', 'scope-risk': 'Scope risk', 'not-a-door': 'Not a one-way door',
  };
  const LOCKING = ['cannot-disable', 'locked-once-used', 'record-lock', 'support-only'];
  T.doorKind = (k) => DOOR_KIND[k] || k;
  T.doorLocks = (k) => LOCKING.includes(k) || k === 'order';
  // Confirmed locks are a danger; an unconfirmed one is "no data" (grey), not a verdict, and says
  // only that Oracle does not state whether it can be turned off.
  const LOCK = { 'cannot-disable': 'Cannot be turned off', 'locked-once-used': 'Locked once used', 'support-only': 'Support only', unverified: 'Undo not confirmed' };
  ui.lock = (f) => (f.lock && LOCK[f.lock.kind] ? `<span class="badge tone-${f.lock.kind === 'unverified' ? 'muted' : 'bad'}" title="${esc(f.lock.text || '')}">${LOCK[f.lock.kind]}</span>` : '');
  ui.licence = (f) => {
    const k = f.licence && f.licence.kind;
    if (!k || k === 'included') return '';
    return `<span class="badge tone-warn" title="${esc(f.licence.text || '')}">${k === 'unverified' ? 'Licence: confirm' : 'Licensed'}</span>`;
  };
  ui.sources = (ids) => {
    const list = (ids || []).map((id) => idx.src.get(id)).filter(Boolean);
    if (!list.length) return '';
    return `<details class="srcs"><summary>Sources (${list.length})</summary><ul>${list.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <span class="fine">${esc(s.kind)}</span></li>`).join('')}</ul></details>`;
  };
  const decLink = (did) => `<a class="idlink" href="#/tracker/decisions/${did}">${did}</a>`;
  const optLabel = (did, v) => { const o = idx.opt.get(did); return o && o.get(v) ? o.get(v).label : v; };

  // The structured answer for a decision. Yes/no and pick-one are buttons, pick-several toggles,
  // number and text an input. An answer NetSuite forces shows as set, with the reason; an option
  // another answer rules out is disabled, with the reason.
  T.picker = function (did, opts) {
    opts = opts || {};
    const d = idx.d.get(did);
    if (!d.input) return '';
    const a = T.answer(store.state, did);
    let body;
    if (a.kind === 'number' || a.kind === 'text') {
      body = `<input class="pick-input" type="${a.kind === 'number' ? 'number' : 'text'}" data-pick-input="${did}" value="${esc(a.raw == null ? '' : a.raw)}"${a.na ? ' disabled' : ''}>`;
    } else {
      body = `<div class="pick-row${a.kind === 'multi' ? ' multi' : ''}">${d.input.options.map((o) => {
        const on = a.values.includes(o.value);
        const forced = a.forced && a.forced.has(o.value);
        const block = a.blocked.get(o.value);
        const lockedOn = forced && a.kind === 'multi';
        const title = block ? 'Ruled out: ' + block : forced ? 'Set by NetSuite: ' + a.forced.get(o.value) : '';
        return `<button type="button" class="pick-btn${on ? ' on' : ''}${forced ? ' forced' : ''}" data-pick="${did}" data-val="${esc(o.value)}" aria-pressed="${on}"${block || a.na || lockedOn ? ' disabled' : ''}${title ? ` title="${esc(title)}"` : ''}>${esc(o.label)}</button>`;
      }).join('')}</div>`;
    }
    const notes = [];
    if (a.na) notes.push(`<div class="pick-note">Not applicable: ${a.na.map((x) => `${decLink(x.did)} ${esc(optLabel(x.did, x.value))}`).join('; ')}</div>`);
    else if (a.forced) notes.push(`<div class="pick-note">Set by NetSuite: ${esc([...new Set(a.forced.values())].join('; '))}</div>`);
    if (a.overridden && !a.na) notes.push(`<div class="pick-note bad">Your earlier answer is ruled out by this.</div>`);
    return `<div class="picker${opts.compact ? ' compact' : ''}" data-picker-for="${did}">${body}${notes.join('')}</div>`;
  };

  // Clicks and typing in any picker inside root; redraws every picker in root (one answer can
  // force or rule out others) and calls after().
  T.wirePickers = function (root, after) {
    const redraw = () => {
      root.querySelectorAll('[data-picker-for]').forEach((p) => { p.outerHTML = T.picker(p.dataset.pickerFor, { compact: p.classList.contains('compact') }); });
      if (after) after();
    };
    ui.on(root, 'click', '[data-pick]', (e, b) => {
      const did = b.dataset.pick; const v = b.dataset.val;
      const d = idx.d.get(did);
      const cur = (store.state.decisions[did] || {}).choice;
      if (d.input.type === 'multi') {
        const list = Array.isArray(cur) ? cur.slice() : [];
        const i = list.indexOf(v);
        if (i >= 0) list.splice(i, 1); else list.push(v);
        store.setDecision(did, 'choice', list);
      } else store.setDecision(did, 'choice', cur === v ? '' : v);
      redraw();
    });
    ui.on(root, 'change', '[data-pick-input]', (e, t) => { store.setDecision(t.dataset.pickInput, 'choice', t.value.trim()); redraw(); });
  };

  // What the current answer means: features on and off, setup, what stops applying, licence, sources.
  T.consequences = function (did) {
    const d = idx.d.get(did);
    if (!d.input || !idx.opt.has(did)) return '';
    const a = T.answer(store.state, did);
    if (!a.values.length || a.na) return '';
    const L = T.logic(store.state);
    const opts = a.values.map((v) => idx.opt.get(did).get(v));
    const uniq = (xs) => [...new Set(xs)];
    const featOn = uniq(opts.flatMap((o) => o.features || []));
    const also = [...L.on.keys()].filter((f) => !featOn.includes(f) && T.why(L.on, f)[0] && T.why(L.on, f)[0].did === did);
    const offs = uniq(opts.flatMap((o) => o.off || []));
    const does = uniq(opts.flatMap((o) => o.does || []));
    const na = uniq(opts.flatMap((o) => o.makesNA || []));
    const lic = uniq(opts.map((o) => o.licence).filter(Boolean));
    const warn = uniq(opts.map((o) => o.warn).filter(Boolean));
    const unv = uniq(opts.flatMap((o) => o.unverified || []));
    const src = uniq(opts.flatMap((o) => o.sources || []));
    const fchip = (id, why) => { const f = idx.f.get(id) || { name: id }; return `<span class="chip" title="${esc(why || f.where || '')}">${esc(f.name)} ${ui.lock(f)}${ui.licence(f)}</span>`; };
    const row = (label, html) => (html ? `<div class="feed-row"><span class="feed-label">${label}</span><div class="feed-val">${html}</div></div>` : '');
    return `<div class="feeds conseq">
      ${row('Turns on', featOn.length ? `<div class="chips">${featOn.map((f) => fchip(f)).join('')}</div>` : '')}
      ${row('Also on', also.length ? `<div class="chips">${also.map((f) => fchip(f, T.whyText(L.on, f))).join('')}</div>` : '')}
      ${row('Leaves off', offs.length ? `<div class="chips">${offs.map((f) => fchip(f)).join('')}</div>` : '')}
      ${row('Setup', does.length ? `<ul class="does">${does.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')}
      ${row('Not needed', na.length ? `<div class="chips">${na.map((x) => `<a class="chip" href="#/tracker/decisions/${x}"><b>${x}</b> ${esc(idx.d.get(x).decides)}</a>`).join('')}</div>` : '')}
      ${row('Licence', lic.map((x) => `<div>${esc(x)}</div>`).join(''))}
      ${row('Warning', warn.map((x) => `<div class="bad-text">${esc(x)}</div>`).join(''))}
      ${row('To confirm', unv.length ? `<ul class="does">${unv.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')}
      ${src.length ? `<div class="feed-row"><span class="feed-label"></span><div class="feed-val">${ui.sources(src)}</div></div>` : ''}
    </div>`;
  };

  // ======================= question editor =======================
  T.qEditor = function (qid, opts) {
    opts = opts || {};
    const q = idx.q.get(qid);
    const a = store.state.answers[qid] || {};
    const status = a.status || 'Not started';
    const decisions = idx.qDecisions.get(qid) || [];
    const layers = idx.qSteps.get(qid) || [];
    const scoping = idx.qScoping.get(qid) || [];
    const prework = idx.qPrework.get(qid) || [];
    const interviews = (a.interviewIds || []).map((id) => store.state.interviews.find((i) => i.id === id)).filter(Boolean);

    // Decisions with answer options are answered right here, while the client is talking.
    const decRow = (did) => {
      const d = idx.d.get(did);
      const head = `<a class="chip" href="#/tracker/decisions/${did}" title="${esc(d.nsSetting || '')}">${ui.dot(T.dStatus(store.state, did))}<b>${did}</b> ${esc(d.decides)} ${ui.rev(d.reversibility)}</a>`;
      return d.input ? `<div class="dec-pick">${head}${T.picker(did, { compact: true })}</div>` : head;
    };
    const feeds = [
      decisions.length ? `<div class="feed-row"><span class="feed-label">Decides</span><div class="chips dec-picks">${decisions.map(decRow).join('')}</div></div>` : '',
      scoping.length && scoping.length < 10 ? `<div class="feed-row"><span class="feed-label">Quote check</span><div class="chips">${scoping.map((mid) => `<a class="chip" href="#/tracker/scoping/${mid}"><b>${mid}</b> ${esc(idx.m.get(mid).ask)}</a>`).join('')}</div></div>` : '',
      prework.length ? `<div class="feed-row"><span class="feed-label">Prework</span><div class="chips">${prework.map((pid) => {
        const p = B.prework.dataDocuments.find((x) => x.id === pid); const pd = store.state.prework.data[pid] || {};
        return `<a class="chip" href="#/tracker/prework/data" title="Prework item that prepares this question">${pd['data-readiness'] ? ui.badge(pd['data-readiness']) : ''}<b>${pid}</b> ${esc(p.item)}</a>`;
      }).join('')}</div></div>` : '',
      layers.length ? `<div class="feed-row"><span class="feed-label">Steps</span><div class="chips">${layers.map((l) => `<a class="chip" href="#/tracker/guide" title="${esc(T.stepName(l))}">${l}</a>`).join('')}</div></div>` : '',
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
    T.wirePickers(el, () => {
      el.querySelectorAll('.dec-pick > a.chip .dot').forEach((dot) => {
        const did = dot.closest('.dec-pick').querySelector('[data-picker-for]').dataset.pickerFor;
        dot.outerHTML = ui.dot(T.dStatus(store.state, did));
      });
    });
    ui.growAll(el);
    return el;
  };

  // ======================= decision editor =======================
  T.dEditor = function (did) {
    const d = idx.d.get(did);
    const s = store.state.decisions[did] || {};
    const status = T.dStatus(store.state, did);
    const inp = T.inputs(store.state, d);
    const doors = (idx.dDoors.get(did) || []).map((n) => idx.door.get(n));
    const steps = d.decideBy === d.buildIn ? `Step ${esc(d.decideBy)}` : `Decide by ${esc(d.decideBy)} &middot; build in ${esc(d.buildIn)}`;
    const el = ui.el(`<div class="ded">
      <div class="qed-meta">${ui.rev(d.reversibility)} ${ui.tier(d.tier1)} <span>${esc(d.area)} &middot; ${steps}</span></div>
      <dl class="kv">
        <dt>NetSuite setting</dt><dd>${esc(d.nsSetting || '-')}</dd>
        <dt>Blocks / notes</dt><dd>${esc(d.notes || '-')}</dd>
        ${d.pseudoRefs && d.pseudoRefs.length ? `<dt>Also fed by</dt><dd>${esc(d.pseudoRefs.join(', '))}</dd>` : ''}
        ${(d.unverified || []).length ? `<dt>To confirm</dt><dd>${d.unverified.map(esc).join('<br>')}</dd>` : ''}
      </dl>
      ${ui.sources(d.sources)}
      ${doors.length ? `<div class="doors">${doors.map((o) => `<div class="door${T.doorLocks(o.kind) ? '' : ' not'}"><div class="door-head">${esc(T.doorKind(o.kind))} #${o.num} <span class="fine">${esc(o.confidence)}${o.mappedBy === 'heuristic' ? ' &middot; link not yet confirmed' : ''}</span></div><div>${esc(o.constraint)}</div>${o.why ? `<div class="fine">${esc(o.why)}</div>` : ''}${ui.sources(o.sources)}</div>`).join('')}</div>` : ''}
      <h4 class="sub-h">Discovery inputs <span class="fine">${inp.done} of ${inp.total} answered</span></h4>
      <div class="inputs">${d.questionIds.map((qid) => {
        const q = idx.q.get(qid); const a = store.state.answers[qid] || {};
        return `<div class="input-q">
          <div class="input-q-head">${ui.dot(a.status)}<a class="idlink" href="#/tracker/questions/${qid}">${qid}</a> ${ui.tier(q.tier1)} <span class="input-q-text">${esc(q.text)}</span></div>
          ${a.answer ? `<div class="input-q-answer">${esc(a.answer)}</div>` : '<div class="input-q-answer empty">No answer yet</div>'}
        </div>`;
      }).join('') || '<p class="fine">No discovery question is linked to this decision.</p>'}</div>
      ${d.input ? `<div class="field"><span>Answer</span>${T.picker(did)}</div><div class="conseq-slot">${T.consequences(did)}</div>` : ''}
      <div class="field"><span>Status</span>${segmented(T.enums.decisionStatus, status, 'data-status')}</div>
      <label class="field"><span>${d.input ? 'Decision notes' : 'Decision'}</span><textarea class="grow" data-f="decision" rows="${d.input ? 2 : 3}" placeholder="${d.input ? 'Anything the answer above does not say' : 'What we will configure, in one or two sentences'}">${esc(s.decision || '')}</textarea></label>
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
    T.wirePickers(el, () => {
      const slot = el.querySelector('.conseq-slot');
      if (slot) slot.innerHTML = T.consequences(did);
      const st = T.dStatus(store.state, did);
      el.querySelectorAll('[data-status]').forEach((x) => { x.classList.toggle('on', x.dataset.status === st); x.setAttribute('aria-checked', x.dataset.status === st); });
      const dt = el.querySelector('[data-f="decidedAt"]');
      if (!dt.value && store.state.decisions[did] && store.state.decisions[did].decidedAt) dt.value = store.state.decisions[did].decidedAt;
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

        const byPart = B.meta.parts.map((x) => x.id).map((p) => {
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
            ${gate('One-way decisions open', m.oneWayOpen, m.oneWayTotal, m.oneWayOpen ? 'Must reach 0 before L0 / L2 setup' : 'Clear to configure', m.oneWayOpen === 0, '#/tracker/guide')}
          </div>
          <div class="grid-2">
            <section class="card"><div class="card-head"><h2>Discovery</h2><span class="fine">${m.qDone} of ${m.qTotal} done${m.qHelp ? ' &middot; ' + m.qHelp + ' need help' : ''}</span></div>${byPart}</section>
            <section class="card"><div class="card-head"><h2>Implementation steps</h2><span class="fine">${m.dDone} of ${m.dTotal} decisions made</span></div>
              ${m.steps.filter((l) => l.total).map((l) => `<a class="layer-row" href="#/tracker/guide/${l.code}"><span class="layer-code">${l.code}</span><span class="layer-name">${esc(T.stepName(l.code))}</span>${ui.bar(l.done, l.total)}<span class="sec-num">${l.done}/${l.total}${l.oneWayOpen ? ` <span class="badge tone-bad" title="One-way decisions open">${l.oneWayOpen}</span>` : ''}</span></a>`).join('')}
              <p class="fine">Decisions by the step they must be made in. Red counts are one-way decisions still open.</p>
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

  // Owner and Department filters, shared by the Questions and Decisions pages. Department is
  // the owner's Team on the People page.
  const ownerFilter = (cur) => `<select data-k="owner"><option value="">Any owner</option><option value="__none"${cur === '__none' ? ' selected' : ''}>No owner</option>${store.state.people.map((p) => `<option value="${p.id}"${cur === p.id ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
  const deptFilter = (cur) => `<select data-k="dept"><option value="">Any department</option>${ui.teams().map((t) => `<option value="${esc(t)}"${cur === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}<option value="__none"${cur === '__none' ? ' selected' : ''}>No department</option></select>`;
  const ownerMatch = (f, ownerId) => {
    if (f.owner === '__none' ? ownerId : f.owner && ownerId !== f.owner) return false;
    if (f.dept && (ui.teamOf(ownerId) || '__none') !== f.dept) return false;
    return true;
  };

  // ======================= Questions =======================
  V.questions = {
    defaults: () => ({ text: '', part: '', section: '', tier: '', status: '', owner: '', dept: '' }),
    filters: null,
    render(root, r) {
      const f = (this.filters = this.filters || this.defaults());
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">The discovery question bank. Click a row to answer it.</p></div></div>
        <div class="filters">
          <input type="search" data-k="text" placeholder="Filter by ID, words or answer" value="${esc(f.text)}">
          <select data-k="part">${ui.options(B.meta.parts.map((p) => p.id), f.part, 'All parts')}</select>
          <select data-k="section">${ui.options(idx.sections.map((s) => s.name), f.section, 'All sections')}</select>
          <select data-k="tier"><option value="">All tiers</option><option value="1"${f.tier === '1' ? ' selected' : ''}>Tier 1 only</option></select>
          <select data-k="status">${ui.options(T.enums.questionStatus, f.status, 'Any status')}</select>
          ${ownerFilter(f.owner)}
          ${deptFilter(f.dept)}
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
          if (!ownerMatch(f, a.ownerId)) return false;
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
    defaults: () => ({ text: '', step: '', area: '', rev: '', tier: '', status: '', inputs: '', owner: '', dept: '' }),
    filters: null,
    render(root, r) {
      const f = (this.filters = this.filters || this.defaults());
      root.innerHTML = `
        <div class="page-head"><div><p class="lead">What each discovery answer decides in NetSuite, grouped by the step it must be decided in. One-way decisions cannot be undone once configured.</p></div></div>
        <div class="filters">
          <input type="search" data-k="text" placeholder="Filter by ID, words or setting" value="${esc(f.text)}">
          <select data-k="step">${ui.options(T.enums.step, f.step, 'All steps')}</select>
          <select data-k="area">${ui.options(T.enums.decisionArea, f.area, 'All areas')}</select>
          <select data-k="rev">${ui.options(T.enums.reversibility, f.rev, 'Any reversibility')}</select>
          <select data-k="tier"><option value="">All tiers</option><option value="1"${f.tier === '1' ? ' selected' : ''}>Tier 1 only</option></select>
          <select data-k="status">${ui.options(T.enums.decisionStatus, f.status, 'Any status')}</select>
          <select data-k="inputs"><option value="">Any inputs</option><option value="ready"${f.inputs === 'ready' ? ' selected' : ''}>Inputs answered</option><option value="waiting"${f.inputs === 'waiting' ? ' selected' : ''}>Waiting on answers</option></select>
          ${ownerFilter(f.owner)}
          ${deptFilter(f.dept)}
          <button class="btn subtle" data-clear>Clear</button>
          <button class="btn subtle" data-review title="Markdown of the decisions shown, with every option, setup step, feature and source">Export for review</button>
          <span class="fine count" id="dcount"></span>
        </div>
        <div class="table-wrap"><table class="grid rows-click"><thead><tr><th class="narrow"></th><th>ID</th><th>What the answer decides</th><th>Area</th><th>Reversibility</th><th>Inputs</th><th>Status</th></tr></thead><tbody id="dbody"></tbody></table></div>`;
      const body = root.querySelector('#dbody');
      let shown = [];
      const draw = () => {
        const st = store.state;
        const text = f.text.trim().toLowerCase();
        const rows = B.decisions.filter((d) => {
          const s = st.decisions[d.id] || {};
          const a = T.answer(st, d.id);
          if (f.step && d.decideBy !== f.step) return false;
          if (f.area && d.area !== f.area) return false;
          if (f.rev && d.reversibility !== f.rev) return false;
          if (f.tier && !d.tier1) return false;
          if (f.status && a.status !== f.status) return false;
          if (f.inputs) { const ready = T.inputs(st, d).ready; if ((f.inputs === 'ready') !== ready) return false; }
          if (!ownerMatch(f, s.ownerId)) return false;
          if (text && !(d.id.toLowerCase().includes(text) || d.decides.toLowerCase().includes(text) || (d.nsSetting || '').toLowerCase().includes(text) || (s.decision || '').toLowerCase().includes(text) || a.labels.join(' ').toLowerCase().includes(text))) return false;
          return true;
        });
        shown = rows;
        root.querySelector('#dcount').textContent = `Showing ${rows.length} of ${B.decisions.length}`;
        let html = '';
        T.enums.step.forEach((code) => {
          const inStep = rows.filter((d) => d.decideBy === code);
          if (!inStep.length) return;
          const L = idx.step.get(code);
          html += `<tr class="group"><td colspan="7"><b>${code}</b> ${esc(L.title)}</td></tr>`;
          html += inStep.map((d) => {
            const s = st.decisions[d.id] || {};
            const a = T.answer(st, d.id);
            const inp = T.inputs(st, d);
            return `<tr data-d="${d.id}"${r && r.id === d.id ? ' class="sel"' : ''}>
              <td class="narrow">${ui.dot(a.status)}</td>
              <td class="mono nowrap">${d.id} ${d.tier1 ? '<span class="t1" title="Tier 1">T1</span>' : ''}</td>
              <td><div class="clamp">${esc(d.decides)}</div>${T.answerLine(a, s.decision || d.nsSetting || '')}</td>
              <td class="nowrap fine">${esc(d.area)}</td>
              <td>${ui.rev(d.reversibility)}</td>
              <td class="nowrap"><div class="mini">${ui.bar(inp.done, inp.total)}<span class="fine">${inp.done}/${inp.total}</span></div></td>
              <td class="nowrap">${ui.badge(a.status)}</td></tr>`;
          }).join('');
        });
        body.innerHTML = html || '<tr><td colspan="7" class="empty">No decisions match these filters.</td></tr>';
      };
      ui.on(root, 'input', '[data-k]', (e, el) => { f[el.dataset.k] = el.value; draw(); });
      ui.on(root, 'change', 'select[data-k]', (e, el) => { f[el.dataset.k] = el.value; draw(); });
      ui.on(root, 'click', '[data-clear]', () => { this.filters = null; T.rerender(); });
      ui.on(root, 'click', 'tr[data-d]', (e, tr) => { location.hash = '#/tracker/decisions/' + tr.dataset.d; });
      ui.on(root, 'click', '[data-review]', () => T.download('decision-review-' + T.today() + '.md', T.reviewMarkdown(shown), 'text/markdown'));
      draw();
      T.live(root, draw, ['decisions', 'answers', 'reload', 'people']);
      this.select(r);
    },
    select(r) {
      document.querySelectorAll('tr[data-d]').forEach((tr) => tr.classList.toggle('sel', !!r.id && tr.dataset.d === r.id));
      if (r.id) T.openDecision(r.id, '#/tracker/decisions'); else ui.drawer.close(true);
    },
  };

  // ======================= Implementation guide =======================
  // One model, two renderings (page and Markdown export): every step in order, what is decided
  // there, what to configure from the answers, the features to enable, one-way warnings, the
  // quote checklist and the data load order.
  T.answerLine = (a, fallback) => {
    if (a.na) return `<div class="clamp fine">Not applicable (${a.na.map((x) => x.did).join(', ')})</div>`;
    if (a.labels.length) return `<div class="clamp answer-line">${esc(a.labels.join(', '))}${a.forced ? ' <span class="badge tone-muted">set by NetSuite</span>' : ''}</div>`;
    return fallback ? `<div class="clamp fine">${esc(fallback)}</div>` : '';
  };

  T.guideModel = function (state) {
    const L = T.logic(state);
    const answers = new Map(B.decisions.map((d) => [d.id, T.answer(state, d.id)]));
    const ctrl = (fid) => { const p = T.why(L.on, fid); return p.length ? p[0].did : null; };
    const features = [...L.on.keys()].map((id) => idx.f.get(id) || { id, name: id, where: '', lock: {}, licence: {} })
      .sort((a, b) => T.natCmp(a.where || '', b.where || '') || T.natCmp(a.name, b.name))
      .map((f) => ({ f, why: T.whyText(L.on, f.id), did: ctrl(f.id) }));
    const featuresOrdered = T.orderFeatures(features);
    const off = [...L.off.entries()].map(([id, did]) => ({ f: idx.f.get(id) || { id, name: id }, did }));
    const conflicts = L.conflicts.map(([a, b]) => ({ a: idx.f.get(a), b: idx.f.get(b), whyA: T.whyText(L.on, a), whyB: T.whyText(L.on, b) }));
    const quote = [];
    features.forEach(({ f, why }) => { if (f.licence && f.licence.kind && f.licence.kind !== 'included') quote.push({ name: f.name, text: f.licence.text || '', confirm: f.licence.kind === 'unverified', why }); });
    B.decisions.forEach((d) => {
      const a = answers.get(d.id);
      if (a.na || !idx.opt.has(d.id)) return;
      a.values.forEach((v) => { const o = idx.opt.get(d.id).get(v); if (o.licence) quote.push({ name: o.label, did: d.id, text: o.licence, confirm: false }); });
    });
    const scopingOpen = B.moduleScoping.filter((m) => !T.mDone((state.scoping[m.id] || {}).status));
    return B.steps.map((s) => {
      const decide = B.decisions.filter((d) => d.decideBy === s.code).map((d) => ({ d, a: answers.get(d.id) }));
      const build = T.orderBuild(B.decisions.filter((d) => d.buildIn === s.code).map((d) => ({ d, a: answers.get(d.id) }))
        .filter(({ a }) => !a.na && a.values.length))
        .map(({ d, a }) => ({ d, a, lines: idx.opt.has(d.id) ? [...new Set(a.values.flatMap((v) => idx.opt.get(d.id).get(v).does || []))] : [] }));
      const waiting = B.decisions.filter((d) => d.buildIn === s.code && d.decideBy !== s.code).filter((d) => !T.dDone(answers.get(d.id).status));
      const doorNums = new Set(decide.flatMap(({ d }) => idx.dDoors.get(d.id) || []));
      const doors = B.oneWayDoors.filter((o) => doorNums.has(o.num));
      const fed = s.fedByQuestionIds;
      return {
        s, decide, build, waiting, doors,
        done: decide.filter(({ a }) => T.dDone(a.status)).length,
        oneWayOpen: decide.filter(({ d, a }) => d.reversibility === 'One-way' && !T.dDone(a.status)).length,
        features: s.code === 'L0' ? { on: featuresOrdered, off, conflicts } : null,
        quote: s.code === 'SCOPE' ? { items: quote, scopingOpen } : null,
        load: B.loadOrder.filter((l) => l.step === s.code),
        fed: fed.length, fedDone: fed.filter((qid) => T.qDone((state.answers[qid] || {}).status)).length,
      };
    });
  };

  T.download = (name, text, type) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type }));
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  // The bank content behind a set of decisions, for someone to read and check line by line:
  // every option with its setup, features, warnings, to-confirm notes and sources.
  T.reviewMarkdown = function (decisions) {
    const fn = (id) => (idx.f.get(id) || { name: id }).name;
    const src = (ids) => (ids || []).map((id) => idx.src.get(id)).filter(Boolean).map((s) => `[${s.title}](${s.url})`).join('; ');
    const out = [`# Decision review - ${decisions.length} decisions`, '', `Exported ${T.today()} from the implementation tracker. Tick each line once checked.`, ''];
    T.enums.step.forEach((code) => {
      const inStep = decisions.filter((d) => d.decideBy === code);
      if (!inStep.length) return;
      out.push(`## ${code} ${T.stepName(code)}`, '');
      inStep.forEach((d) => {
        out.push(`### ${d.id} ${d.decides}`, '', `${d.area} - ${d.reversibility} - decide by ${d.decideBy}, build in ${d.buildIn}${d.tier1 ? ' - Tier 1' : ''} - answer: ${d.input.type}${d.input.forceable === false ? ' (never forced)' : ''}`, '');
        if (d.nsSetting) out.push(`- [ ] NetSuite setting: ${d.nsSetting}`);
        if (d.notes) out.push(`- [ ] Notes: ${d.notes}`);
        if (d.questionIds.length) out.push(`- [ ] Fed by: ${d.questionIds.join(', ')}`);
        (d.unverified || []).forEach((u) => out.push(`- [ ] To confirm: ${u}`));
        if ((d.sources || []).length) out.push(`- Sources: ${src(d.sources)}`);
        (d.input.options || []).forEach((o) => {
          out.push('', `**${o.label}** (\`${o.value}\`)`, '');
          (o.does || []).forEach((x) => out.push(`- [ ] ${x}`));
          if ((o.features || []).length) out.push(`- [ ] Turns on: ${o.features.map(fn).join(', ')}`);
          if ((o.off || []).length) out.push(`- [ ] Leaves off: ${o.off.map(fn).join(', ')}`);
          if ((o.makesNA || []).length) out.push(`- [ ] Makes not applicable: ${o.makesNA.join(', ')}`);
          if (o.licence) out.push(`- [ ] Licence: ${o.licence}`);
          if (o.warn) out.push(`- [ ] Warning: ${o.warn}`);
          (o.unverified || []).forEach((u) => out.push(`- [ ] To confirm: ${u}`));
          if ((o.sources || []).length) out.push(`- Sources: ${src(o.sources)}`);
        });
        out.push('');
      });
    });
    return out.join('\n');
  };

  T.guideMarkdown = function (state) {
    const model = T.guideModel(state);
    const out = [`# ${state.tracker.name || 'NetSuite implementation'} - implementation guide`, '', `Generated ${T.today()} from the implementation tracker.`, ''];
    const cell = (x) => String(x == null ? '' : x).replace(/\|/g, '/').replace(/\n/g, ' ');
    model.forEach((g) => {
      out.push(`## ${g.s.code} ${g.s.title}`, '', g.s.what, '');
      if (g.decide.length) {
        out.push('| Decision | Answer | Status |', '|---|---|---|');
        g.decide.forEach(({ d, a }) => out.push(`| ${d.id} ${cell(d.decides)} | ${cell(a.na ? 'Not applicable' : a.labels.join(', ') + (a.forced ? ' (set by NetSuite)' : ''))} | ${a.status} |`));
        out.push('');
      }
      if (g.quote && (g.quote.items.length || g.quote.scopingOpen.length)) {
        out.push('### Confirm with the quote', '');
        g.quote.items.forEach((q) => out.push(`- ${q.did ? q.did + ' ' : ''}${q.name}${q.text ? ': ' + q.text : ''}${q.confirm ? ' (licence to confirm)' : ''}`));
        g.quote.scopingOpen.forEach((m) => out.push(`- ${m.id} ${m.ask}`));
        out.push('');
      }
      if (g.features && g.features.on.length) {
        out.push('### Enable features', '', '| Feature | Where | Why |', '|---|---|---|');
        g.features.on.forEach(({ f, why }) => out.push(`| ${cell(f.name)} | ${cell(f.where)} | ${cell(why)} |`));
        out.push('');
        if (g.features.off.length) out.push('Leave off: ' + g.features.off.map(({ f, did }) => `${f.name} (${did})`).join(', '), '');
        g.features.conflicts.forEach((c) => out.push(`- CONFLICT: ${c.a.name} and ${c.b.name} cannot both be on.`));
      }
      if (g.build.length) {
        out.push('### Configure', '');
        g.build.forEach(({ d, a, lines }) => { out.push(`**${d.id} ${a.labels.join(', ')}** - ${d.decides}`); lines.forEach((l) => out.push(`- ${l}`)); out.push(''); });
      }
      if (g.waiting.length) out.push('Waiting on: ' + g.waiting.map((d) => `${d.id} (decide by ${d.decideBy})`).join(', '), '');
      if (g.doors.length) {
        out.push('### Watch out', '');
        g.doors.forEach((o) => out.push(`- ${T.doorKind(o.kind)}: ${o.constraint}`));
        out.push('');
      }
      if (g.load.length) {
        out.push('### Data load order', '', '| # | What | Method | Notes |', '|---|---|---|---|');
        g.load.forEach((l) => out.push(`| ${l.order} | ${cell(l.what)} | ${cell(l.method)} | ${cell(l.notes)} |`));
        out.push('');
      }
    });
    return out.join('\n');
  };

  V.guide = {
    open: new Set(),
    render(root, r) {
      const self = this;
      const draw = () => {
        const st = store.state;
        const model = T.guideModel(st);
        const ans = (a) => (a.na ? '<span class="badge tone-na">Not applicable</span>' : a.labels.length ? `${esc(a.labels.join(', '))}${a.forced ? ' <span class="badge tone-muted">set by NetSuite</span>' : ''}` : '<span class="fine">Open</span>');
        root.innerHTML = `
          <div class="page-head"><div><p class="lead">Every step from scoping to go-live, built from the answers: what to decide, what to configure and what to watch.</p></div>
            <div class="btn-row"><button class="btn" data-print>Print</button><button class="btn" data-md>Export Markdown</button></div></div>
          <div class="layers">${model.map((g) => {
            const s = g.s;
            return `<details class="layer card" data-step="${s.code}"${self.open.has(s.code) ? ' open' : ''}>
              <summary>
                <span class="layer-code big">${s.code}</span>
                <span class="layer-main"><span class="layer-title">${esc(s.title)}</span><span class="fine">${esc(s.what)}</span></span>
                <span class="layer-stats">
                  ${g.decide.length ? `<span><b>${g.done}/${g.decide.length}</b> decided</span>` : ''}
                  ${g.oneWayOpen ? `<span class="badge tone-bad">${g.oneWayOpen} one-way open</span>` : ''}
                  ${g.features && g.features.conflicts.length ? `<span class="badge tone-bad">${g.features.conflicts.length} conflict${g.features.conflicts.length > 1 ? 's' : ''}</span>` : ''}
                </span>
                <span class="layer-bar">${g.decide.length ? ui.bar(g.done, g.decide.length) : ''}</span>
              </summary>
              <div class="layer-body">
                ${s.costOfChange ? `<p class="fine">Cost of changing later: ${esc(s.costOfChange)}</p>` : ''}
                ${g.decide.length ? `<h4 class="sub-h">Decide</h4><table class="grid rows-click compact"><tbody>${g.decide.map(({ d, a }) => `<tr data-d="${d.id}"><td class="narrow">${ui.dot(a.status)}</td><td class="mono nowrap">${d.id}</td><td>${esc(d.decides)}</td><td>${ans(a)}</td><td>${ui.rev(d.reversibility)}</td><td class="nowrap">${ui.badge(a.status)}</td></tr>`).join('')}</tbody></table>` : ''}
                ${g.quote && (g.quote.items.length || g.quote.scopingOpen.length) ? `<h4 class="sub-h">Confirm with the quote</h4><table class="grid compact"><tbody>
                  ${g.quote.items.map((q) => `<tr><td>${q.did ? decLink(q.did) + ' ' : ''}${esc(q.name)}</td><td>${esc(q.text)}</td><td>${q.confirm ? '<span class="badge tone-warn">Licence: confirm</span>' : ''}</td></tr>`).join('')}
                  ${g.quote.scopingOpen.map((m) => `<tr><td><a class="idlink" href="#/tracker/scoping/${m.id}">${m.id}</a> ${esc(m.ask)}</td><td></td><td>${ui.badge((st.scoping[m.id] || {}).status || 'Not started')}</td></tr>`).join('')}
                </tbody></table>` : ''}
                ${g.features ? `<h4 class="sub-h">Enable features <span class="fine">${g.features.on.length} on</span></h4>
                  ${g.features.conflicts.map((c) => `<div class="door"><div class="door-head">Conflict</div><div>${esc(c.a.name)} and ${esc(c.b.name)} cannot both be on.</div><div class="fine">${esc(c.whyA)}. ${esc(c.whyB)}.</div></div>`).join('')}
                  ${g.features.on.length ? `<table class="grid compact"><thead><tr><th>Feature</th><th>Where</th><th>Why it is on</th><th></th></tr></thead><tbody>${g.features.on.map(({ f, why, did }) => `<tr><td>${esc(f.name)}</td><td class="fine">${esc(f.where || '')}</td><td class="fine">${did ? esc(why).replace(did, decLink(did)) : esc(why)}</td><td class="nowrap">${ui.lock(f)} ${ui.licence(f)}</td></tr>`).join('')}</tbody></table>` : '<p class="fine">Nothing turned on yet.</p>'}
                  ${g.features.off.length ? `<div class="feed-row"><span class="feed-label">Leave off</span><div class="chips">${g.features.off.map(({ f, did }) => `<span class="chip" title="${esc(did)}">${esc(f.name)}</span>`).join('')}</div></div>` : ''}` : ''}
                ${g.build.length ? `<h4 class="sub-h">Configure</h4>${g.build.map(({ d, a, lines }) => `<div class="cfg"><div class="cfg-head">${decLink(d.id)} <b>${esc(a.labels.join(', '))}</b> <span class="fine">${esc(d.decides)}</span></div>${lines.length ? `<ul class="does">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}</div>`).join('')}` : ''}
                ${g.waiting.length ? `<div class="feed-row"><span class="feed-label">Waiting on</span><div class="chips">${g.waiting.map((d) => `<a class="chip" href="#/tracker/decisions/${d.id}">${ui.dot(T.dStatus(st, d.id))}<b>${d.id}</b> ${esc(d.decides)}</a>`).join('')}</div></div>` : ''}
                ${g.doors.length ? `<h4 class="sub-h">Watch out</h4><div class="doors">${g.doors.map((o) => `<div class="door${T.doorLocks(o.kind) ? '' : ' not'}"><div class="door-head">${esc(T.doorKind(o.kind))} <span class="fine">#${o.num} &middot; ${(o.decisionIds || []).join(', ')}</span></div><div>${esc(o.constraint)}</div></div>`).join('')}</div>` : ''}
                ${g.load.length ? `<h4 class="sub-h">Data load order</h4><table class="grid compact"><thead><tr><th>#</th><th>What</th><th>Method</th><th>Notes</th></tr></thead><tbody>${g.load.map((l) => `<tr><td class="mono">${esc(l.order)}</td><td>${esc(l.what)}</td><td>${esc(l.method)}</td><td class="fine">${esc(l.notes || '')}${(l.unverified || []).length ? ` <span class="badge tone-warn" title="${esc(l.unverified.join(' '))}">to confirm</span>` : ''}</td></tr>`).join('')}</tbody></table>` : ''}
                ${g.fed ? `<p class="fine">Fed by ${g.fed} discovery questions, ${g.fedDone} answered.</p>` : ''}
              </div></details>`;
          }).join('')}</div>`;
        root.querySelectorAll('details.layer').forEach((el) => el.addEventListener('toggle', () => { if (el.open) self.open.add(el.dataset.step); else self.open.delete(el.dataset.step); }));
      };
      if (r && r.id && idx.step.has(r.id)) this.open.add(r.id);
      draw();
      ui.on(root, 'click', 'tr[data-d]', (e, tr) => T.openDecision(tr.dataset.d));
      ui.on(root, 'click', '[data-print]', () => {
        const was = new Set(self.open);
        root.querySelectorAll('details.layer').forEach((d) => { d.open = true; });
        window.print();
        root.querySelectorAll('details.layer').forEach((d) => { d.open = was.has(d.dataset.step); });
      });
      ui.on(root, 'click', '[data-md]', () => T.download(T.slug(store.state.tracker.name || 'netsuite') + '-implementation-guide-' + T.today() + '.md', T.guideMarkdown(store.state), 'text/markdown'));
      T.live(root, draw, ['decisions', 'answers', 'scoping', 'reload']);
      if (r && r.id) { const el = root.querySelector(`details[data-step="${r.id}"]`); if (el) el.scrollIntoView({ block: 'start' }); }
    },
  };
  V.layers = V.guide; // old links

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
