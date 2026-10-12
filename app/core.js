// Core: namespace, utilities, bank indexes, derived metrics.
// Classic script (no ES modules) so index.html works from file://.
(function () {
  'use strict';
  const T = (window.T = window.T || {});

  // ---------- utilities ----------
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  T.esc = (s) => (s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ESC[c]));
  T.today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  T.now = () => new Date().toISOString();
  T.uid = (prefix) => prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  T.fmtWhen = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const mins = Math.round((Date.now() - d) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    if (mins < 60 * 24) return Math.round(mins / 60) + 'h ago';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  };
  T.pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  T.natCmp = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
  T.slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ---------- bank + indexes ----------
  const B = window.BANK;
  if (!B) throw new Error('BANK missing: run node tools/bundle_bank.js');
  T.bank = B;
  T.enums = B.meta.enums;
  T.sem = B.meta.statusSemantics;

  const idx = (T.idx = {
    q: new Map(), d: new Map(), m: new Map(), door: new Map(), step: new Map(), stepOrder: new Map(),
    f: new Map(), src: new Map(), opt: new Map(),
    qDecisions: new Map(), qSteps: new Map(), qScoping: new Map(), qPrework: new Map(), dDoors: new Map(),
    sections: [], // [{name, part, prefixes, questionIds}]
  });
  const push = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };

  B.questions.forEach((q) => idx.q.set(q.id, q));
  B.decisions.forEach((d) => {
    idx.d.set(d.id, d);
    d.questionIds.forEach((qid) => push(idx.qDecisions, qid, d.id));
    if (d.input && d.input.options) idx.opt.set(d.id, new Map(d.input.options.map((o) => [o.value, o])));
  });
  B.steps.forEach((s, i) => {
    idx.step.set(s.code, s);
    idx.stepOrder.set(s.code, i);
    s.fedByQuestionIds.forEach((qid) => push(idx.qSteps, qid, s.code));
  });
  B.features.forEach((f) => idx.f.set(f.id, f));
  B.sources.forEach((s) => idx.src.set(s.id, s));
  T.stepName = (code) => { const s = idx.step.get(code); return s ? s.title : code; };
  B.moduleScoping.forEach((m) => {
    idx.m.set(m.id, m);
    (m.drivenByAllTier1 ? B.questions.filter((q) => q.tier1).map((q) => q.id) : m.drivenByQuestionIds)
      .forEach((qid) => push(idx.qScoping, qid, m.id));
  });
  B.oneWayDoors.forEach((o) => {
    idx.door.set(o.num, o);
    (o.decisionIds || []).forEach((did) => push(idx.dDoors, did, o.num));
  });
  B.prework.dataDocuments.forEach((p) => (p.preparesQuestionIds || []).forEach((qid) => push(idx.qPrework, qid, p.id)));

  const secMap = new Map();
  B.meta.sections.forEach((s) => secMap.set(s.name, { name: s.name, part: s.part, prefixes: s.prefixes, questionIds: [] }));
  B.questions.forEach((q) => {
    if (!secMap.has(q.section)) secMap.set(q.section, { name: q.section, part: q.part, prefixes: [q.prefix], questionIds: [] });
    secMap.get(q.section).questionIds.push(q.id);
  });
  idx.sections = [...secMap.values()].filter((s) => s.questionIds.length);
  idx.partName = Object.fromEntries(B.meta.parts.map((p) => [p.id, p.packetTitle || p.name]));

  // ---------- status semantics ----------
  T.qDone = (status) => T.sem.questionDone.includes(status);
  T.dDone = (status) => T.sem.decisionDone.includes(status);
  T.mDone = (status) => status === 'Confirmed' || status === 'N/A';

  // Map a status string to a visual tone used by .tone-* classes.
  const TONES = {
    'Not started': 'muted', 'In progress': 'info', Complete: 'ok', 'Need help': 'warn', 'Not applicable': 'na',
    Requested: 'info', Partial: 'info', Answered: 'info', Decided: 'ok', Blocked: 'bad', 'N/A': 'na',
    Asked: 'info', Quoted: 'info', Confirmed: 'ok',
    'Ready for review': 'ok',
    'One-way': 'bad', Costly: 'warn', Easy: 'muted',
    'Ready / trusted': 'ok', 'Available, cleanup needed': 'warn', 'Multiple / conflicting sources': 'bad', 'Major gaps': 'bad', 'Not located yet': 'bad',
    'Clear / consistent': 'ok', 'Mostly clear': 'ok', 'Varies by person / team': 'warn', 'Unclear / needs definition': 'bad', Unknown: 'muted',
  };
  T.tone = (s) => TONES[s] || 'muted';

  // ---------- decision logic (read state, never write) ----------
  // An answer lives in state.decisions[did].choice: a string for yesno / single / number / text,
  // an array for multi. Chosen options turn features on; features carry the rules (requires,
  // auto-enables, conflicts), once, in bank/features.json. From those this computes, for every
  // decision: the effective answer, whether NetSuite forces it (and why), whether another answer
  // makes it not applicable, and which options are blocked.
  const optionInput = (d) => d.input && ['yesno', 'single', 'multi'].includes(d.input.type);
  const userValues = (state, did) => {
    const c = (state.decisions[did] || {}).choice;
    const opts = idx.opt.get(did);
    if (!opts || c == null || c === '') return [];
    return (Array.isArray(c) ? c : [c]).map(String).filter((v) => opts.has(v));
  };

  // Close a seed set of features over requires and auto-enables. Each feature keeps how it got on:
  // { by: 'choice', did, value } | { by: 'requires' | 'auto', from: featureId }.
  function closure(seeds) {
    const on = new Map(seeds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of [...on.keys()]) {
        const f = idx.f.get(id);
        if (!f) continue;
        for (const r of f.requires || []) if (!on.has(r)) { on.set(r, { by: 'requires', from: id }); changed = true; }
        for (const a of f.autoEnables || []) {
          const aid = typeof a === 'string' ? a : a.id;
          if ((typeof a === 'string' || on.has(a.when)) && !on.has(aid)) { on.set(aid, { by: 'auto', from: id }); changed = true; }
        }
      }
    }
    return on;
  }

  // The chain that put a feature on, as steps from the answer that started it.
  T.why = function (on, fid) {
    const path = [];
    const seen = new Set();
    let id = fid;
    while (id && on.has(id) && !seen.has(id)) {
      seen.add(id);
      const r = on.get(id);
      path.unshift(Object.assign({ feature: id }, r));
      id = r.by === 'choice' ? null : r.from;
    }
    return path;
  };
  const fname = (id) => (idx.f.get(id) || { name: id }).name;
  // "Multiple Currencies is required by OneWorld (D-001)"
  T.whyText = function (on, fid) {
    const p = T.why(on, fid);
    if (!p.length) return '';
    const root = p[0];
    const origin = root.by === 'choice' ? ` (${root.did})` : '';
    if (p.length === 1) return `${fname(fid)} is turned on by ${root.did}`;
    const last = p[p.length - 1];
    const verb = last.by === 'auto' ? 'is switched on by' : 'is required by';
    return `${fname(fid)} ${verb} ${fname(last.from)}${p.length > 2 ? ', for ' + fname(root.feature) : ''}${origin}`;
  };

  let cache = { key: null, value: null };
  T.logic = function (state) {
    const key = Object.keys(state.decisions).map((k) => k + '=' + JSON.stringify(state.decisions[k].choice)).join('|');
    if (cache.key === key) return cache.value;

    const decs = B.decisions.filter(optionInput);
    const user = new Map(decs.map((d) => [d.id, userValues(state, d.id)]));
    const optOf = (did, v) => idx.opt.get(did).get(v);
    const naFrom = (vals) => {
      const na = new Map(); // did -> [{ did, value }] that made it not applicable
      for (const d of decs) for (const v of vals.get(d.id) || []) for (const x of (optOf(d.id, v).makesNA || [])) {
        if (!na.has(x)) na.set(x, []);
        na.get(x).push({ did: d.id, value: v });
      }
      return na;
    };
    const seedsFrom = (vals, skip, na) => {
      const seeds = new Map();
      for (const d of decs) {
        if (d.id === skip || na.has(d.id)) continue;
        for (const v of vals.get(d.id) || []) for (const f of (optOf(d.id, v).features || [])) if (!seeds.has(f)) seeds.set(f, { by: 'choice', did: d.id, value: v });
      }
      return seeds;
    };

    // Forcing comes only from answers someone gave (never from another forced answer, or two
    // decisions that turn on the same feature would force each other), and a decision that
    // stopped applying neither forces nor is forced.
    const userNA = naFrom(user);
    const onUser = closure(seedsFrom(user, null, userNA));
    const forced = new Map(); // did -> Map value -> reason text
    const blocked = new Map(); // did -> Map value -> reason
    for (const d of decs) {
      if (userNA.has(d.id)) continue;
      const opts = d.input.options;
      if (!opts.some((o) => (o.features || []).concat(o.off || []).some((f) => onUser.has(f)))) continue;
      const without = closure(seedsFrom(user, d.id, userNA));
      const hits = new Map(opts.map((o) => [o.value, (o.features || []).filter((f) => without.has(f))]));
      const force = (o) => { if (!forced.has(d.id)) forced.set(d.id, new Map()); forced.get(d.id).set(o.value, T.whyText(without, hits.get(o.value)[0])); };
      // Pick-several answers are never forced: a feature being on (say Lot Tracking, switched on
      // by Advanced Inventory Management) does not mean the business uses that option. Nor are
      // decisions marked forceable: false (account defaults and policies, whose options share a
      // feature with a different purpose). Both still have options ruled out below.
      if (d.input.type === 'multi' || d.input.forceable === false) {
        // no forcing
      } else {
        // Force one option only when what it covers is a strict superset of every other option's
        // cover; several options sharing the required feature leave the choice to the user.
        const withHits = opts.filter((o) => hits.get(o.value).length);
        const top = withHits.find((o) => withHits.every((p) => p === o || (hits.get(p.value).every((f) => hits.get(o.value).includes(f)) && hits.get(o.value).length > hits.get(p.value).length)));
        if (top) force(top);
      }
      for (const o of opts) {
        const off = (o.off || []).find((f) => without.has(f));
        if (off) { if (!blocked.has(d.id)) blocked.set(d.id, new Map()); blocked.get(d.id).set(o.value, T.whyText(without, off)); }
      }
    }
    const effective = (d) => {
      const fv = forced.get(d.id);
      if (d.input.type === 'multi') return [...new Set(user.get(d.id).concat(fv ? [...fv.keys()] : []))];
      if (fv && fv.size) return [[...fv.keys()][0]];
      return user.get(d.id).filter((v) => !(blocked.get(d.id) || new Map()).has(v));
    };
    // A decision that stopped applying has no answer, so it rules nothing out either.
    const eff = new Map(decs.map((d) => [d.id, effective(d)]));
    let na = naFrom(eff);
    for (let i = 0; i < 3; i++) {
      for (const did of na.keys()) if (eff.has(did)) eff.set(did, []);
      const next = naFrom(eff);
      if ([...next.keys()].join() === [...na.keys()].join()) { na = next; break; }
      na = next;
    }
    // Reasons trace to answers someone gave: close over those first, then add what forced
    // answers bring that is not already on.
    const given = new Map([...eff].map(([did, vals]) => [did, vals.filter((v) => !(forced.get(did) || new Map()).has(v))]));
    const base = closure(seedsFrom(given, null, na));
    const extra = [...seedsFrom(eff, null, na)].filter(([f]) => !base.has(f));
    const on = extra.length ? closure(new Map([...base, ...extra])) : base;
    const conflicts = [];
    for (const id of on.keys()) for (const c of ((idx.f.get(id) || {}).conflicts || [])) {
      if (on.has(c) && !conflicts.some((x) => x[0] === c && x[1] === id)) conflicts.push([id, c]);
    }
    // Features an answer deliberately leaves off (and nothing turned on).
    const off = new Map();
    for (const d of decs) for (const v of eff.get(d.id)) for (const f of (idx.opt.get(d.id).get(v).off || [])) if (!on.has(f) && !off.has(f)) off.set(f, d.id);

    const value = { on, off, forced, blocked, eff, user, na, conflicts };
    cache = { key, value };
    return value;
  };

  // Everything a view needs about one decision's answer.
  T.answer = function (state, did) {
    const d = idx.d.get(did);
    const s = state.decisions[did] || {};
    const L = T.logic(state);
    const res = { d, kind: d.input ? d.input.type : null, values: [], labels: [], forced: null, blocked: L.blocked.get(did) || new Map(), na: L.na.get(did) || null, overridden: false, raw: s.choice };
    if (optionInput(d)) {
      res.values = L.eff.get(did) || [];
      res.labels = res.values.map((v) => idx.opt.get(did).get(v).label);
      res.forced = L.forced.get(did) || null;
      const u = L.user.get(did) || [];
      if (res.forced && d.input.type !== 'multi' && u.length && u[0] !== res.values[0]) res.overridden = true;
      if (u.some((v) => res.blocked.has(v))) res.overridden = true;
    } else if (d.input && s.choice != null && s.choice !== '') {
      res.values = [String(s.choice)];
      res.labels = [String(s.choice)];
    }
    // Effective status: not applicable wins; an answer NetSuite forces is decided; else the user's status.
    const userStatus = s.status || 'Not started';
    const fullyForced = res.forced && d.input.type !== 'multi';
    res.status = res.na ? 'N/A' : fullyForced && !T.dDone(userStatus) ? 'Decided' : userStatus;
    res.auto = res.na ? 'na' : fullyForced && !T.dDone(userStatus) ? 'forced' : null;
    return res;
  };
  T.dStatus = (state, did) => T.answer(state, did).status;

  // Order work so nothing comes before what it needs: a feature after every feature it requires,
  // and a decision's setup after the setup of any decision whose features its own features need
  // (plus a bank decision's explicit `after` list). Ties and cycles keep the bank's order.
  const reqAll = (fid, seen) => {
    seen = seen || new Set();
    for (const r of ((idx.f.get(fid) || {}).requires || [])) if (!seen.has(r)) { seen.add(r); reqAll(r, seen); }
    return seen;
  };
  const topo = (items, needs) => {
    const out = []; const done = new Set(); const busy = new Set();
    const visit = (x) => {
      if (done.has(x) || busy.has(x)) return; // a cycle falls back to bank order
      busy.add(x);
      items.filter((y) => y !== x && needs(x, y)).forEach(visit);
      busy.delete(x); done.add(x); out.push(x);
    };
    items.forEach(visit);
    return out;
  };
  T.orderFeatures = (list) => topo(list, (x, y) => reqAll(x.f.id).has(y.f.id));
  T.orderBuild = (entries) => {
    const feats = new Map(entries.map((e) => [e, new Set(idx.opt.has(e.d.id) ? e.a.values.flatMap((v) => idx.opt.get(e.d.id).get(v).features || []) : [])]));
    const needAll = new Map(entries.map((e) => [e, new Set([...feats.get(e)].flatMap((f) => [...reqAll(f)]))]));
    return topo(entries, (x, y) => (x.d.after || []).includes(y.d.id) || [...feats.get(y)].some((f) => needAll.get(x).has(f) && !feats.get(x).has(f)));
  };

  // ---------- derived metrics (read state, never write) ----------
  T.metrics = function (state) {
    const ans = (qid) => state.answers[qid] || {};
    const qStatus = (qid) => ans(qid).status || 'Not started';
    const dStatus = (did) => T.dStatus(state, did);

    const questions = B.questions;
    const qDoneCount = questions.filter((q) => T.qDone(qStatus(q.id))).length;
    const tier1Q = questions.filter((q) => q.tier1);
    const tier1QDone = tier1Q.filter((q) => T.qDone(qStatus(q.id))).length;

    const tier1D = B.decisions.filter((d) => d.tier1);
    const oneWayD = B.decisions.filter((d) => d.reversibility === 'One-way');
    const scopingDone = B.moduleScoping.filter((m) => T.mDone((state.scoping[m.id] || {}).status)).length;

    const sections = idx.sections.map((s) => {
      const st = s.questionIds.map(qStatus);
      return {
        name: s.name, part: s.part, total: st.length,
        done: st.filter(T.qDone).length,
        help: st.filter((x) => x === 'Need help').length,
        started: st.filter((x) => x !== 'Not started').length,
      };
    });

    const steps = B.steps.map((l) => {
      const ds = B.decisions.filter((d) => d.decideBy === l.code);
      return {
        code: l.code, total: ds.length,
        done: ds.filter((d) => T.dDone(dStatus(d.id))).length,
        oneWayOpen: ds.filter((d) => d.reversibility === 'One-way' && !T.dDone(dStatus(d.id))).length,
        inputsReady: ds.filter((d) => T.inputs(state, d).ready).length,
      };
    });

    const files = B.fileChecklist.filter((f) => (state.files[f.id] || {}).status === 'Complete').length;

    return {
      qTotal: questions.length, qDone: qDoneCount,
      qHelp: questions.filter((q) => qStatus(q.id) === 'Need help').length,
      tier1QTotal: tier1Q.length, tier1QDone,
      tier1DTotal: tier1D.length, tier1DOpen: tier1D.filter((d) => !T.dDone(dStatus(d.id))).length,
      oneWayTotal: oneWayD.length, oneWayOpen: oneWayD.filter((d) => !T.dDone(dStatus(d.id))).length,
      dTotal: B.decisions.length, dDone: B.decisions.filter((d) => T.dDone(dStatus(d.id))).length,
      scopingTotal: B.moduleScoping.length, scopingDone,
      filesTotal: B.fileChecklist.length, filesDone: files,
      sections, steps,
    };
  };

  // Are a decision's input questions answered? (all linked questions done)
  T.inputs = function (state, d) {
    const total = d.questionIds.length;
    const done = d.questionIds.filter((qid) => T.qDone((state.answers[qid] || {}).status || 'Not started')).length;
    return { total, done, ready: total > 0 && done === total };
  };
})();
