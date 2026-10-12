#!/usr/bin/env node
// Validates bank/*.json. Zero dependencies. Usage: node tools/check_bank.js [bankDir]
// The bank files are the source (edited directly), so this is the guard: every reference
// resolves, enums hold, the feature graph has no requirement cycles, and every NetSuite fact
// carries a source or an explicit "unverified" note. Exits 1 on any failure.
'use strict';
const fs = require('fs');
const path = require('path');

const bankDir = process.argv[2] || path.join(__dirname, '..', 'bank');
const failures = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) failures.push(msg); };
const load = (f) => {
  try { return JSON.parse(fs.readFileSync(path.join(bankDir, f), 'utf8')); }
  catch (e) { failures.push(`cannot read ${f}: ${e.message}`); return null; }
};

const meta = load('meta.json');
const questions = load('questions.json');
const decisions = load('decisions.json');
const steps = load('steps.json');
const features = load('features.json');
const sources = load('sources.json');
const loadOrder = load('loadOrder.json');
const doors = load('oneWayDoors.json');
const scoping = load('moduleScoping.json');
const prework = load('prework.json');
const systems = load('systemsTables.json');
const files = load('fileChecklist.json');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }

const E = meta.enums;
const inEnum = (name, v, where) => {
  ok(Array.isArray(E[name]), `meta.enums.${name} missing`);
  ok(E[name] && E[name].includes(v), `${where}: value ${JSON.stringify(v)} not in meta.enums.${name}`);
};
const unique = (arr, label) => {
  const seen = new Set();
  for (const x of arr) { ok(!seen.has(x), `duplicate ${label} id ${x}`); seen.add(x); }
};
const arr = (v, where) => { ok(Array.isArray(v), `${where}: not an array`); return Array.isArray(v) ? v : []; };
const qids = new Set(questions.map((q) => q.id));
const dids = new Set(decisions.map((d) => d.id));
const fids = new Set(features.map((f) => f.id));
const sids = new Set(sources.map((s) => s.id));
const stepIdx = new Map(E.step.map((c, i) => [c, i]));
const qrefs = (list, where) => { for (const r of arr(list, where)) ok(qids.has(r), `${where}: unknown question ${r}`); };
const drefs = (list, where) => { for (const r of arr(list, where)) ok(dids.has(r), `${where}: unknown decision ${r}`); };
const frefs = (list, where) => { for (const r of arr(list, where)) ok(fids.has(typeof r === 'string' ? r : r && r.id), `${where}: unknown feature ${JSON.stringify(r)}`); };
const srefs = (list, where) => { for (const r of arr(list, where)) ok(sids.has(r), `${where}: unknown source ${r}`); };
// A NetSuite fact is sourced, or says plainly what is not confirmed.
const sourced = (x, where) => ok(arr(x.sources, where + '.sources').length > 0 || arr(x.unverified, where + '.unverified').length > 0, `${where}: no sources and no unverified note`);

// ---- meta
for (const k of ['version', 'enums', 'parts', 'sections', 'prefixes']) ok(meta[k] !== undefined, `meta.${k} missing`);
for (const [k, v] of Object.entries(E)) {
  ok(Array.isArray(v) && v.length > 0, `meta.enums.${k} empty`);
  ok(new Set(v).size === v.length, `meta.enums.${k} has duplicates`);
}
ok(E.preworkReadiness.includes('Available, cleanup needed'), 'preworkReadiness must keep "Available, cleanup needed" as one value');
const partIds = new Set(meta.parts.map((p) => p.id));
const prefixSet = new Set(meta.prefixes.map((p) => p.prefix));

// ---- sources
unique(sources.map((s) => s.id), 'source');
for (const s of sources) {
  ok(/^S-\d{3}$/.test(s.id), `source id format ${s.id}`);
  ok(/^https:\/\//.test(s.url || ''), `source ${s.id}: url must be https`);
  ok(s.title && s.title.length > 0, `source ${s.id}: no title`);
  inEnum('sourceKind', s.kind, `source ${s.id}.kind`);
}

// ---- questions
unique(questions.map((q) => q.id), 'question');
for (const q of questions) {
  ok(/^[A-Z0-9]{3}-\d+[a-z]?$/.test(q.id), `question id format ${q.id}`);
  ok(partIds.has(q.part), `question ${q.id}: unknown part ${q.part}`);
  ok(prefixSet.has(q.prefix), `question ${q.id}: unknown prefix ${q.prefix}`);
  ok(q.id.startsWith(q.prefix + '-'), `question ${q.id}: id does not start with prefix ${q.prefix}`);
  ok(meta.sections.some((s) => s.name === q.section && s.part === q.part), `question ${q.id}: section ${q.section} not in meta.sections for ${q.part}`);
  ok(typeof q.tier1 === 'boolean', `question ${q.id}: tier1 not boolean`);
  ok(q.text && q.text.length > 0, `question ${q.id}: empty text`);
  ok(q.parentId === null || q.id.startsWith(q.parentId), `question ${q.id}: bad parentId ${q.parentId}`);
  for (const k of ['answer', 'owner', 'status']) ok(!(k in q), `question ${q.id}: instance field ${k} must not be in bank`);
}

// ---- steps
ok(JSON.stringify(steps.map((s) => s.code)) === JSON.stringify(E.step), 'steps.json order must match meta.enums.step');
for (const s of steps) {
  ok(['phase', 'layer'].includes(s.kind), `step ${s.code}: kind must be phase or layer`);
  ok(s.title && s.what, `step ${s.code}: title and what required`);
  qrefs(s.fedByQuestionIds, `step ${s.code}.fedByQuestionIds`);
}

// ---- features
unique(features.map((f) => f.id), 'feature');
for (const f of features) {
  const w = `feature ${f.id}`;
  ok(/^[A-Z][A-Z0-9_]*$/.test(f.id), `${w}: id must be UPPER_SNAKE`);
  ok(f.name && f.where, `${w}: name and where required`);
  frefs(f.requires, `${w}.requires`);
  frefs(f.autoEnables, `${w}.autoEnables`);
  for (const a of arr(f.autoEnables, `${w}.autoEnables`)) if (typeof a === 'object') ok(fids.has(a.when), `${w}.autoEnables: unknown 'when' feature ${a.when}`);
  frefs(f.conflicts, `${w}.conflicts`);
  for (const c of arr(f.conflicts, `${w}.conflicts`)) ok(c !== f.id, `${w}: conflicts with itself`);
  ok(f.lock && f.lock.kind, `${w}: lock.kind required`);
  if (f.lock) inEnum('lockKind', f.lock.kind, `${w}.lock.kind`);
  ok(f.licence && f.licence.kind, `${w}: licence.kind required`);
  if (f.licence) inEnum('licenceKind', f.licence.kind, `${w}.licence.kind`);
  srefs(f.sources, `${w}.sources`);
  sourced(f, w);
}
// requirement cycles
const req = new Map(features.map((f) => [f.id, (f.requires || [])]));
const state = new Map();
const visit = (id, trail) => {
  if (state.get(id) === 2) return;
  if (state.get(id) === 1) { failures.push(`feature requirement cycle: ${trail.concat(id).join(' -> ')}`); return; }
  state.set(id, 1);
  for (const r of req.get(id) || []) visit(r, trail.concat(id));
  state.set(id, 2);
};
checks++;
for (const f of features) visit(f.id, []);
// conflicts are symmetric (declared on at least one side is enough, but never contradicted by requires)
for (const f of features) for (const c of f.conflicts || []) ok(!(req.get(f.id) || []).includes(c), `feature ${f.id} both requires and conflicts with ${c}`);

// ---- decisions
unique(decisions.map((d) => d.id), 'decision');
for (const d of decisions) {
  const w = `decision ${d.id}`;
  ok(/^D-\d{3}$/.test(d.id), `decision id format ${d.id}`);
  qrefs(d.questionIds, `${w}.questionIds`);
  ok(Array.isArray(d.pseudoRefs), `${w}: pseudoRefs missing`);
  for (const p of d.pseudoRefs || []) ok(!qids.has(p), `${w}: pseudoRef ${p} is a real question id`);
  inEnum('reversibility', d.reversibility, `${w}.reversibility`);
  inEnum('step', d.decideBy, `${w}.decideBy`);
  inEnum('step', d.buildIn, `${w}.buildIn`);
  ok(stepIdx.get(d.buildIn) >= stepIdx.get(d.decideBy), `${w}: buildIn ${d.buildIn} is before decideBy ${d.decideBy}`);
  const fed = (steps.find((s) => s.code === d.decideBy) || { fedByQuestionIds: [] }).fedByQuestionIds;
  for (const q of d.questionIds || []) ok(fed.includes(q), `${w}: question ${q} is not listed on its decide-by step ${d.decideBy}`);
  inEnum('decisionArea', d.area, `${w}.area`);
  srefs(d.sources, `${w}.sources`);
  arr(d.unverified, `${w}.unverified`);
  if (d.after !== undefined) { drefs(d.after, `${w}.after`); for (const x of d.after || []) ok(x !== d.id, `${w}: after itself`); }
  for (const k of ['owner', 'status', 'answer', 'choice']) ok(!(k in d), `${w}: instance field ${k} must not be in bank`);
  if (d.input == null) continue;
  inEnum('inputType', d.input.type, `${w}.input.type`);
  if ('forceable' in d.input) ok(typeof d.input.forceable === 'boolean', `${w}: input.forceable must be boolean`);
  const opts = d.input.options || [];
  if (['yesno', 'single', 'multi'].includes(d.input.type)) {
    ok(opts.length >= 2, `${w}: ${d.input.type} needs at least 2 options`);
    if (d.input.type === 'yesno') ok(opts.length === 2 && opts.some((o) => o.value === 'yes') && opts.some((o) => o.value === 'no'), `${w}: yesno options must be exactly yes and no`);
  } else ok(opts.length === 0, `${w}: ${d.input.type} input takes no options`);
  unique(opts.map((o) => w + ':' + o.value), 'option');
  for (const o of opts) {
    const ow = `${w} option ${o.value}`;
    ok(/^[a-z0-9][a-z0-9-]*$/.test(o.value || ''), `${ow}: value must be kebab-case`);
    ok(o.label && o.label.length > 0, `${ow}: no label`);
    arr(o.does, `${ow}.does`);
    frefs(o.features, `${ow}.features`);
    frefs(o.off, `${ow}.off`);
    for (const f of o.features || []) ok(!(o.off || []).includes(f), `${ow}: feature ${f} both on and off`);
    drefs(o.makesNA, `${ow}.makesNA`);
    for (const x of o.makesNA || []) ok(x !== d.id, `${ow}: makes its own decision N/A`);
    srefs(o.sources, `${ow}.sources`);
    // Options that state NetSuite behaviour (features, setup, licence, warnings) must be sourced.
    if ((o.features || []).length || (o.off || []).length || (o.does || []).length || o.licence || o.warn) sourced(o, ow);
  }
}

// ---- load order
for (const [i, l] of loadOrder.entries()) {
  const w = `loadOrder[${i}]`;
  ok(l.what && l.method, `${w}: what and method required`);
  inEnum('step', l.step, `${w}.step`);
  frefs(l.needsFeatures || [], `${w}.needsFeatures`);
  srefs(l.sources, `${w}.sources`);
  sourced(l, w);
}

// ---- one-way doors
unique(doors.map((d) => d.num), 'door');
for (const d of doors) {
  inEnum('doorKind', d.kind, `door ${d.num}.kind`);
  inEnum('oneWayDoorConfidence', d.confidence, `door ${d.num}.confidence`);
  drefs(d.decisionIds, `door ${d.num}.decisionIds`);
  srefs(d.sources, `door ${d.num}.sources`);
}

// ---- module scoping
unique(scoping.map((m) => m.id), 'scoping');
for (const m of scoping) {
  qrefs(m.drivenByQuestionIds, `scoping ${m.id}.drivenByQuestionIds`);
  if (m.features) frefs(m.features, `scoping ${m.id}.features`);
}

// ---- prework
unique([...prework.dataDocuments, ...prework.processes].map((x) => x.id), 'prework');
const pwIds = new Set(prework.dataDocuments.map((d) => d.id));
for (const d of prework.dataDocuments) {
  qrefs(d.preparesQuestionIds, `prework ${d.id}.preparesQuestionIds`);
  inEnum('preworkDataArea', d.area, `prework ${d.id}.area`);
}
for (const p of prework.processes) inEnum('preworkProcessArea', p.area, `prework ${p.id}.area`);
for (const tpl of ['dataDocumentsTemplate', 'processesTemplate', 'systemsTemplate'])
  for (const c of prework[tpl] || []) if (c.enum) ok(Array.isArray(E[c.enum]), `prework.${tpl}: column ${c.column} references unknown enum ${c.enum}`);

// ---- systems tables
for (const t of systems.tables) {
  ok(t.columns.length > 0, `systems table ${t.key}: no columns`);
  qrefs(t.questionIds, `systems table ${t.key}.questionIds`);
}

// ---- file checklist
unique(files.map((f) => f.id), 'file');
for (const f of files) {
  inEnum('fileChecklistCategory', f.category, `file ${f.id}.category`);
  if (f.coveredByPreworkId) ok(pwIds.has(f.coveredByPreworkId), `file ${f.id}: unknown prework ${f.coveredByPreworkId}`);
}

// ---- every source is used (no orphans)
const used = new Set();
const collect = (x) => (x && x.sources || []).forEach((s) => used.add(s));
features.forEach(collect); decisions.forEach((d) => { collect(d); ((d.input || {}).options || []).forEach(collect); });
loadOrder.forEach(collect); doors.forEach(collect);
for (const s of sources) ok(used.has(s.id), `source ${s.id} is not referenced anywhere`);

if (failures.length) {
  console.error(`check_bank: FAIL (${failures.length} of ${checks} checks)`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
const withInput = decisions.filter((d) => d.input).length;
console.log(`check_bank: OK (${checks} checks) - ${questions.length} questions, ${decisions.length} decisions (${withInput} with answer options), ${features.length} features, ${sources.length} sources`);
