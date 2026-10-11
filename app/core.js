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
    q: new Map(), d: new Map(), m: new Map(), door: new Map(), layer: new Map(),
    qDecisions: new Map(), qLayers: new Map(), qScoping: new Map(), qPrework: new Map(), dDoors: new Map(),
    sections: [], // [{name, part, prefixes, questionIds}]
  });
  const push = (map, k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v); };

  B.questions.forEach((q) => idx.q.set(q.id, q));
  B.decisions.forEach((d) => {
    idx.d.set(d.id, d);
    d.questionIds.forEach((qid) => push(idx.qDecisions, qid, d.id));
  });
  B.layers.forEach((l) => {
    idx.layer.set(l.code, l);
    l.fedByQuestionIds.forEach((qid) => push(idx.qLayers, qid, l.code));
  });
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

  // ---------- derived metrics (read state, never write) ----------
  T.metrics = function (state) {
    const ans = (qid) => state.answers[qid] || {};
    const dec = (did) => state.decisions[did] || {};
    const qStatus = (qid) => ans(qid).status || 'Not started';
    const dStatus = (did) => dec(did).status || 'Not started';

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

    const layers = B.layers.map((l) => {
      const ds = B.decisions.filter((d) => d.layer === l.code);
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
      sections, layers,
    };
  };

  // Are a decision's input questions answered? (all linked questions done)
  T.inputs = function (state, d) {
    const total = d.questionIds.length;
    const done = d.questionIds.filter((qid) => T.qDone((state.answers[qid] || {}).status || 'Not started')).length;
    return { total, done, ready: total > 0 && done === total };
  };
})();
