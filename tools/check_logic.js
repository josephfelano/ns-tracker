#!/usr/bin/env node
// Exercises the decision logic in the live app/core.js against the live bank (app/bank.js).
// Zero dependencies. Usage: node tools/check_logic.js   (run after bundle_bank.js)
// 1. Invariants that must hold for any set of answers (random answers, many rounds).
// 2. Named rules from the research that the bank must produce (OneWorld forces Multiple
//    Currencies, and so on). Each names the decision and option values it relies on and fails
//    loudly if the bank no longer has them.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
global.window = {};
for (const f of ['app/bank.js', 'app/core.js']) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  new Function('window', src)(global.window); // eslint-disable-line no-new-func
}
const T = global.window.T;
const B = T.bank;
const failures = [];
let checks = 0;
const ok = (c, msg) => { checks++; if (!c) failures.push(msg); };
const blank = () => ({ decisions: {}, answers: {}, scoping: {}, files: {}, tracker: {} });
const set = (st, did, choice) => { st.decisions[did] = Object.assign(st.decisions[did] || {}, { choice }); return st; };

const withOpts = B.decisions.filter((d) => d.input && ['yesno', 'single', 'multi'].includes(d.input.type));

// ---- 1. invariants under random answers
let seed = 42;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let round = 0; round < 300; round++) {
  const st = blank();
  for (const d of withOpts) {
    if (rnd() < 0.5) continue;
    const vals = d.input.options.map((o) => o.value);
    if (d.input.type === 'multi') set(st, d.id, vals.filter(() => rnd() < 0.4));
    else set(st, d.id, vals[Math.floor(rnd() * vals.length)]);
  }
  const L = T.logic(st);
  for (const d of withOpts) {
    const a = T.answer(st, d.id);
    const opts = new Map(d.input.options.map((o) => [o.value, o]));
    ok(a.values.every((v) => opts.has(v)), `round ${round} ${d.id}: effective value not an option`);
    if (d.input.type !== 'multi') ok(a.values.length <= 1, `round ${round} ${d.id}: more than one value for ${d.input.type}`);
    if (a.forced) for (const v of a.forced.keys()) ok((opts.get(v).features || []).some((f) => L.on.has(f)), `round ${round} ${d.id}: forced ${v} but none of its features are on`);
    for (const v of a.values) for (const f of (opts.get(v).features || [])) ok(L.on.has(f), `round ${round} ${d.id}: effective ${v} feature ${f} not on`);
    ok(T.metrics && T.dStatus(st, d.id), `round ${round} ${d.id}: no status`);
  }
  for (const [fid] of L.on) ok(T.why(L.on, fid).length > 0, `round ${round}: feature ${fid} on with no reason`);
}

// ---- 2. named rules from the research
const has = (did, value) => {
  const d = B.decisions.find((x) => x.id === did);
  const o = d && d.input && (d.input.options || []).find((x) => x.value === value);
  ok(!!o, `rule setup: ${did} has no option "${value}"`);
  return !!o;
};
const feat = (id) => { ok(B.features.some((f) => f.id === id), `rule setup: no feature ${id}`); return id; };
const rule = (name, fn) => { try { fn(); } catch (e) { failures.push(`${name}: threw ${e.message}`); } };
const optWith = (did, fid) => {
  const d = B.decisions.find((x) => x.id === did);
  const o = d && d.input && (d.input.options || []).find((x) => (x.features || []).includes(fid));
  ok(!!o, `rule setup: no option of ${did} turns on ${fid}`);
  return o && o.value;
};

rule('OneWorld forces Multiple Currencies', () => {
  const v = optWith('D-001', feat('ONEWORLD'));
  if (!v || !has('D-002', 'yes')) return;
  const st = set(blank(), 'D-001', v);
  const a = T.answer(st, 'D-002');
  ok(a.values[0] === 'yes' && a.forced, 'OneWorld: D-002 should be forced to yes');
  ok(a.blocked.has('no'), 'OneWorld: D-002 "no" should be blocked');
  ok(a.status === 'Decided', 'OneWorld: forced D-002 should count as decided');
  set(st, 'D-002', 'no');
  ok(T.answer(st, 'D-002').overridden, 'OneWorld: a user "no" on D-002 should show as overridden');
});

rule('Two decisions that turn on the same feature do not force each other', () => {
  const v = optWith('D-001', 'ONEWORLD');
  const w = optWith('D-003', 'ONEWORLD');
  if (!v || !w) return;
  const st = set(blank(), 'D-001', v);
  ok(!T.answer(st, 'D-001').forced, 'D-001 chosen alone must not show as set by NetSuite');
  const st2 = set(blank(), 'D-003', w);
  ok(T.answer(st2, 'D-001').forced, 'D-003 provisioning OneWorld should set D-001');
});

rule('Multi-Location Inventory forces Advanced Receiving and Advanced Shipping', () => {
  const v = optWith('D-005', feat('MLI'));
  if (!v) return;
  const st = set(blank(), 'D-005', v);
  const L = T.logic(st);
  ok(L.on.has(feat('ADV_RECEIVING')), 'MLI: Advanced Receiving should be on');
  ok(L.on.has(feat('ADV_SHIPPING')), 'MLI: Advanced Shipping should be on');
  const r = optWith('D-014', 'ADV_RECEIVING');
  if (r) ok(T.answer(st, 'D-014').values[0] === r && T.answer(st, 'D-014').forced, 'MLI: D-014 should be forced');
  // Two D-062 options turn on Advanced Shipping (with or without pick, pack and ship), so MLI
  // rules out the one-step option and leaves the choice between the two.
  const d62 = B.decisions.find((x) => x.id === 'D-062');
  const oneStep = d62 && d62.input && d62.input.options.find((o) => (o.off || []).includes('ADV_SHIPPING'));
  ok(!!oneStep, 'rule setup: D-062 needs an option that leaves Advanced Shipping off');
  if (oneStep) ok(T.answer(st, 'D-062').blocked.has(oneStep.value), 'MLI: D-062 one-step option should be ruled out');
  ok(!T.answer(st, 'D-062').forced, 'MLI: D-062 should not be forced while two options fit');
});

rule('Inventory Status forces the advanced bin option, not basic bins', () => {
  const v = optWith('D-011', 'INVENTORY_STATUS');
  const adv = optWith('D-095', 'ADV_BIN_NUMBERED');
  if (!v || !adv) return;
  const a = T.answer(set(blank(), 'D-011', v), 'D-095');
  ok(a.forced && a.values[0] === adv, 'Inventory Status: D-095 should be forced to the advanced bin option');
});

rule('OneWorld with inventory turns on Multi-Location Inventory', () => {
  const ow = optWith('D-001', 'ONEWORLD');
  const inv = optWith('D-037', feat('INVENTORY'));
  if (!ow || !inv) return;
  const st = set(set(blank(), 'D-001', ow), 'D-037', [inv]);
  ok(T.logic(st).on.has('MLI'), 'OneWorld + inventory: MLI should be on');
  ok(T.answer(st, 'D-005').forced, 'OneWorld + inventory: D-005 should be forced');
});

rule('Statistical Accounts forces Multiple Units of Measure', () => {
  const v = optWith('D-017', feat('STATISTICAL_ACCOUNTS'));
  if (!v) return;
  const st = set(blank(), 'D-017', v);
  ok(T.logic(st).on.has(feat('MUOM')), 'Statistical Accounts: MUOM should be on');
});

rule('Inventory Status requires the bin features', () => {
  const v = optWith('D-011', feat('INVENTORY_STATUS'));
  if (!v) return;
  const st = set(blank(), 'D-011', v);
  ok(T.logic(st).on.has(feat('ADV_BIN_NUMBERED')), 'Inventory Status: Advanced Bin / Numbered Inventory Management should be on');
});

rule('Conflicts are flagged: commissions and SuiteBilling', () => {
  const c = B.features.find((f) => f.id === 'EMPLOYEE_COMMISSIONS');
  ok(!!c && ((c.conflicts || []).includes('SUITEBILLING') || (B.features.find((f) => f.id === 'SUITEBILLING') || {}).conflicts.includes('EMPLOYEE_COMMISSIONS')), 'EMPLOYEE_COMMISSIONS and SUITEBILLING should conflict');
});

rule('Single legal entity makes intercompany decisions not applicable', () => {
  const d = B.decisions.find((x) => x.id === 'D-001');
  const single = d && d.input && d.input.options.find((o) => (o.off || []).includes('ONEWORLD'));
  ok(!!single, 'rule setup: D-001 needs an option that leaves OneWorld off');
  if (!single) return;
  ok((single.makesNA || []).includes('D-034'), 'Single entity: D-034 intercompany pricing should be not applicable');
  const st = set(blank(), 'D-001', single.value);
  ok(T.answer(st, 'D-034').status === 'N/A', 'Single entity: D-034 status should be N/A');
});

// ---- finance
rule('Cash-basis reporting conflicts with SuiteTax', () => {
  if (!has('D-111', 'yes') || !has('D-016', 'suitetax-native')) return;
  const st = set(set(blank(), 'D-111', 'yes'), 'D-016', 'suitetax-native');
  ok(T.logic(st).conflicts.some((c) => c.includes('CASH_BASIS_REPORTING') && c.includes('SUITETAX')), 'Cash basis + SuiteTax: conflict should be listed');
});

rule('Period rules need Accounting Periods', () => {
  if (!has('D-035', 'disallow') || !has('D-090', 'yes')) return;
  const a = T.answer(set(blank(), 'D-035', 'disallow'), 'D-090');
  ok(a.values[0] === 'yes' && a.forced, 'D-035 disallow: D-090 should be forced to yes');
  ok(a.blocked.has('no'), 'D-035 disallow: D-090 "no" should be blocked');
  if (has('D-106', 'amortization')) ok(T.answer(set(blank(), 'D-106', ['amortization']), 'D-090').forced, 'D-106 amortization: D-090 should be forced');
});

rule('FX follows Multiple Currencies', () => {
  if (!has('D-002', 'no') || !has('D-104', 'integration')) return;
  ok(T.answer(set(blank(), 'D-002', 'no'), 'D-104').status === 'N/A', 'D-002 no: D-104 should be not applicable');
  const a = T.answer(set(blank(), 'D-104', ['integration']), 'D-002');
  ok(a.values[0] === 'yes' && a.forced, 'D-104 integration: D-002 should be forced to yes');
});

rule('Custom segments rule out "no GL impact" without forcing a choice', () => {
  if (!has('D-026', 'custom-segment') || !has('D-103', 'none')) return;
  const a = T.answer(set(blank(), 'D-026', ['custom-segment']), 'D-103');
  ok(a.blocked.has('none'), 'D-026 custom segment: D-103 "none" should be blocked');
  ok(!a.forced, 'D-026 custom segment: D-103 should stay the user\'s choice');
});

// ---- items, inventory, production
rule('Pick-several answers are never forced', () => {
  for (const d of withOpts.filter((x) => x.input.type === 'multi')) {
    const st = blank();
    for (const o of withOpts) if (o.input.type !== 'multi') set(st, o.id, o.input.options[0].value);
    ok(!T.answer(st, d.id).forced, `${d.id}: multi-select must never be forced`);
  }
  if (!has('D-096', 'yes')) return;
  const st = set(blank(), 'D-096', 'yes');
  for (const id of ['D-006', 'D-037', 'D-038']) ok(!T.answer(st, id).values.length, `Advanced Inventory Management must not tick ${id}`);
});

rule('Account defaults and policies are not forced', () => {
  const pol = B.decisions.filter((d) => d.input && d.input.forceable === false);
  ok(pol.length > 0, 'rule setup: expected decisions marked forceable: false');
  if (!has('D-036', 'standard')) return;
  ok(!T.answer(set(blank(), 'D-036', ['standard']), 'D-031').forced, 'D-036 standard must not set the D-031 account default');
});

rule('Holding stock on a status forces Inventory Status; FEFO picking forces WMS', () => {
  if (has('D-066', 'status-hold')) ok(T.answer(set(blank(), 'D-066', ['status-hold']), 'D-011').forced, 'D-066 status-hold: D-011 should be forced');
  if (has('D-042', 'fefo-pick')) ok(T.answer(set(blank(), 'D-042', ['fefo-pick']), 'D-100').forced, 'D-042 fefo-pick: D-100 should be forced to WMS');
});

rule('Production tier makes later production decisions not applicable', () => {
  if (has('D-009', 'none')) for (const id of ['D-115', 'D-116']) ok(T.answer(set(blank(), 'D-009', 'none'), id).status === 'N/A', `D-009 none: ${id} should be N/A`);
  if (has('D-009', 'assembly-builds')) ok(T.answer(set(blank(), 'D-009', 'assembly-builds'), 'D-064').status === 'N/A', 'D-009 assembly builds: D-064 should be N/A');
  if (has('D-005', 'no')) ok(T.answer(set(blank(), 'D-005', 'no'), 'D-113').status === 'N/A', 'D-005 no: D-113 should be N/A');
});

// ---- procure to pay, order to cash
rule('3-way match forces Advanced Receiving', () => {
  if (!has('D-057', 'three-way') || !has('D-014', 'yes')) return;
  const a = T.answer(set(blank(), 'D-057', 'three-way'), 'D-014');
  ok(a.values[0] === 'yes' && a.forced && a.blocked.has('no'), 'D-057 three-way: D-014 should be forced to yes, no blocked');
});

rule('Vendor consignment conflicts with assemblies', () => {
  if (!has('D-053', 'vendor-consignment') || !has('D-009', 'assembly-builds')) return;
  const st = set(set(blank(), 'D-053', ['vendor-consignment']), 'D-009', 'assembly-builds');
  ok(T.logic(st).conflicts.some((c) => c.includes('CONSIGNED_INVENTORY') && c.includes('ASSEMBLY_ITEMS')), 'consignment + assemblies: conflict should be listed');
});

rule('SuiteBilling invoicing sets subscription state and conflicts with commissions', () => {
  if (!has('D-119', 'suitebilling') || !has('D-073', 'suitebilling')) return;
  const st = set(blank(), 'D-119', ['suitebilling']);
  ok(T.answer(st, 'D-073').values[0] === 'suitebilling' && T.answer(st, 'D-073').forced, 'D-119 suitebilling: D-073 should be forced');
  if (has('D-102', 'netsuite')) ok(T.logic(set(st, 'D-102', 'netsuite')).conflicts.some((c) => c.includes('SUITEBILLING')), 'SuiteBilling + commissions: conflict should be listed');
});

rule('MRP planning forces the MRP option', () => {
  const mrp = optWith('D-097', 'MRP');
  if (!mrp) return;
  const src = B.decisions.find((d) => d.id !== 'D-097' && d.input && d.input.type !== 'multi' && (d.input.options || []).some((o) => (o.features || []).some((f) => (B.features.find((x) => x.id === f) || {}).requires && B.features.find((x) => x.id === f).requires.includes('MRP'))));
  if (!src) return; // nothing else in the bank requires MRP yet
  const o = src.input.options.find((x) => (x.features || []).some((f) => (B.features.find((y) => y.id === f).requires || []).includes('MRP')));
  ok(T.answer(set(blank(), src.id, o.value), 'D-097').values[0] === mrp, `${src.id} ${o.value}: D-097 should be forced to MRP`);
});

// ---- integrations, migration, cutover
rule('Every decision has an answer type', () => {
  for (const d of B.decisions) ok(!!d.input, `${d.id}: no input`);
});

rule('Opening balances leave out what open transactions recreate', () => {
  const d83 = B.decisions.find((d) => d.id === 'D-083');
  const text = JSON.stringify(d83 || {}).toLowerCase();
  ok(/exclud|leave out|leaves out/.test(text), 'D-083 should carry the exclusion step for balances recreated by open transactions');
});

rule('Single sign-on never drops 2FA on privileged roles', () => {
  const d = B.decisions.find((x) => x.id === 'D-127');
  ok(!!d, 'rule setup: no D-127');
  if (!d) return;
  for (const o of d.input.options || []) ok(!/no 2fa|without 2fa|turn off 2fa/i.test(o.label), `D-127 ${o.value}: must not offer dropping mandatory 2FA`);
  ok(B.oneWayDoors.some((o) => (o.decisionIds || []).includes('D-127')), 'a door should map to D-127 (mandatory 2FA)');
});

rule('Pick-several payout options do not force the payments decision', () => {
  const v = optWith('D-076', 'NETSUITE_PAY');
  if (!v) return;
  const st = set(blank(), 'D-076', [v]);
  ok(T.logic(st).on.has('NETSUITE_PAY'), 'D-076 NetSuite Pay: feature should be on');
  ok(!T.answer(st, 'D-120').forced, 'D-076 NetSuite Pay: D-120 is pick-several and must not be forced');
});

// ---- the guide's build order
const orderOf = (st, step) => T.orderBuild(B.decisions.filter((d) => d.buildIn === step)
  .map((d) => ({ d, a: T.answer(st, d.id) })).filter(({ a }) => !a.na && a.values.length)).map((e) => e.d.id);
const before = (list, a, b, label) => { if (list.includes(a) && list.includes(b)) ok(list.indexOf(a) < list.indexOf(b), `${label}: ${a} should come before ${b} (got ${list.join(' ')})`); };

rule('Setup comes after what it needs', () => {
  const st = blank();
  const pick = (did, fid) => { const v = optWith(did, fid); if (v) set(st, did, B.decisions.find((d) => d.id === did).input.type === 'multi' ? [v] : v); };
  pick('D-015', 'ARM_ESSENTIALS'); pick('D-090', 'ACCOUNTING_PERIODS'); pick('D-011', 'INVENTORY_STATUS');
  pick('D-095', 'ADV_BIN_NUMBERED'); pick('D-001', 'ONEWORLD'); pick('D-002', 'MULTICURRENCY');
  const l0 = orderOf(st, 'L0');
  before(l0, 'D-090', 'D-015', 'Accounting Periods before ARM');
  before(l0, 'D-095', 'D-011', 'Bins before Inventory Status');
  before(l0, 'D-002', 'D-001', 'Multiple Currencies before OneWorld');
  const L = T.logic(st);
  const feats = T.orderFeatures([...L.on.keys()].map((id) => ({ f: B.features.find((f) => f.id === id) }))).map((x) => x.f.id);
  before(feats, 'ACCOUNTING_PERIODS', 'ARM_ESSENTIALS', 'feature order');
  before(feats, 'BINS', 'ADV_BIN_NUMBERED', 'feature order');
  before(feats, 'ADV_BIN_NUMBERED', 'INVENTORY_STATUS', 'feature order');
});

rule('No feature is listed before a feature it requires (random answers)', () => {
  let s2 = 7;
  const r = () => { s2 = (s2 * 1103515245 + 12345) % 2147483648; return s2 / 2147483648; };
  for (let round = 0; round < 60; round++) {
    const st = blank();
    for (const d of withOpts) { if (r() < 0.5) continue; const vals = d.input.options.map((o) => o.value); set(st, d.id, d.input.type === 'multi' ? vals.filter(() => r() < 0.4) : vals[Math.floor(r() * vals.length)]); }
    const ids = T.orderFeatures([...T.logic(st).on.keys()].map((id) => ({ f: B.features.find((f) => f.id === id) || { id } }))).map((x) => x.f.id);
    ids.forEach((id, i) => ((B.features.find((f) => f.id === id) || {}).requires || []).forEach((q) => { if (ids.includes(q)) ok(ids.indexOf(q) < i, `round ${round}: ${q} should come before ${id}`); }));
  }
});

if (failures.length) {
  console.error(`check_logic: FAIL (${failures.length} of ${checks} checks)`);
  for (const f of [...new Set(failures)].slice(0, 60)) console.error('  - ' + f);
  process.exit(1);
}
console.log(`check_logic: OK (${checks} checks, ${withOpts.length} decisions with options)`);
