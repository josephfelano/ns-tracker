#!/usr/bin/env node
// Validates bank/*.json. Zero dependencies. Usage: node tools/check_bank.js [bankDir]
// Exits 1 on any failure.
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

const EXPECT = {
  questions: 187, tier1: 32, decisions: 87, decisionTier1: 26, oneWay: 14, costly: 26, easy: 47,
  layers: 8, doors: 16, scoping: 18, dataDocuments: 24, processes: 23, files: 37,
  sysTables: 4, sys2Presets: 13, partQuestions: { P1: 92, P2: 88, P3: 7 },
};

const meta = load('meta.json');
const questions = load('questions.json');
const decisions = load('decisions.json');
const layers = load('layers.json');
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
const qids = new Set(questions.map((q) => q.id));
const did = new Set(decisions.map((d) => d.id));
const refs = (list, where) => {
  ok(Array.isArray(list), `${where}: not an array`);
  for (const r of list || []) ok(qids.has(r), `${where}: unknown question ref ${r}`);
};

// meta basics
for (const k of ['version', 'generatedAt', 'sources', 'enums', 'parts', 'sections', 'prefixes'])
  ok(meta[k] !== undefined, `meta.${k} missing`);
for (const [k, v] of Object.entries(E)) {
  ok(Array.isArray(v) && v.length > 0, `meta.enums.${k} empty`);
  ok(new Set(v).size === v.length, `meta.enums.${k} has duplicates`);
}
ok(E.preworkReadiness.includes('Available, cleanup needed'), 'C-04: preworkReadiness must keep "Available, cleanup needed" as one value');
const partIds = new Set(meta.parts.map((p) => p.id));
const prefixSet = new Set(meta.prefixes.map((p) => p.prefix));

// questions
ok(questions.length === EXPECT.questions, `questions: expected ${EXPECT.questions}, got ${questions.length}`);
unique(questions.map((q) => q.id), 'question');
const tier1 = questions.filter((q) => q.tier1).length;
ok(tier1 === EXPECT.tier1, `tier1 questions: expected ${EXPECT.tier1}, got ${tier1}`);
for (const [p, n] of Object.entries(EXPECT.partQuestions)) {
  const c = questions.filter((q) => q.part === p).length;
  ok(c === n, `part ${p}: expected ${n} questions, got ${c}`);
}
for (const q of questions) {
  ok(/^[A-Z0-9]{3}-\d+[a-z]?$/.test(q.id), `question id format ${q.id}`);
  ok(partIds.has(q.part), `question ${q.id}: unknown part ${q.part}`);
  ok(prefixSet.has(q.prefix), `question ${q.id}: unknown prefix ${q.prefix}`);
  ok(meta.sections.some((s) => s.name === q.section && s.part === q.part), `question ${q.id}: section ${q.section} not in meta.sections for ${q.part}`);
  ok(typeof q.tier1 === 'boolean', `question ${q.id}: tier1 not boolean`);
  ok(q.text && q.text.length > 0, `question ${q.id}: empty text`);
  ok(q.parentId === null || q.id.startsWith(q.parentId), `question ${q.id}: bad parentId ${q.parentId}`);
  for (const k of ['answer', 'owner', 'status']) ok(!(k in q), `question ${q.id}: instance field ${k} must not be in bank`);
}
ok(questions.find((q) => q.id === 'FIN-4c')?.tier1 === true, 'C-02: FIN-4c must be Tier 1');

// decisions
ok(decisions.length === EXPECT.decisions, `decisions: expected ${EXPECT.decisions}, got ${decisions.length}`);
unique(decisions.map((d) => d.id), 'decision');
for (const d of decisions) {
  ok(/^D-\d{3}$/.test(d.id), `decision id format ${d.id}`);
  refs(d.questionIds, `decision ${d.id}.questionIds`);
  ok(Array.isArray(d.pseudoRefs), `decision ${d.id}: pseudoRefs missing`);
  ok(d.questionIds.length + d.pseudoRefs.length > 0, `decision ${d.id}: no refs at all`);
  for (const p of d.pseudoRefs) ok(!qids.has(p), `decision ${d.id}: pseudoRef ${p} is a real question id`);
  inEnum('reversibility', d.reversibility, `decision ${d.id}.reversibility`);
  inEnum('layer', d.layer, `decision ${d.id}.layer`);
  inEnum('decisionArea', d.area, `decision ${d.id}.area`);
  for (const k of ['owner', 'status', 'answer']) ok(!(k in d), `decision ${d.id}: instance field ${k} must not be in bank`);
}
const cnt = (v) => decisions.filter((d) => d.reversibility === v).length;
ok(cnt('One-way') === EXPECT.oneWay, `One-way decisions: expected ${EXPECT.oneWay}, got ${cnt('One-way')}`);
ok(cnt('Costly') === EXPECT.costly, `Costly decisions: expected ${EXPECT.costly}, got ${cnt('Costly')}`);
ok(cnt('Easy') === EXPECT.easy, `Easy decisions: expected ${EXPECT.easy}, got ${cnt('Easy')}`);
const dt1 = decisions.filter((d) => d.tier1).length;
ok(dt1 === EXPECT.decisionTier1, `Tier 1 decisions: expected ${EXPECT.decisionTier1}, got ${dt1}`);
const landed = decisions.filter((d) => /Landed Cost/.test(d.nsSetting) && /capitalize/.test(d.decides));
ok(landed.length === 1 && landed[0].questionIds.join() === 'FIN-4c', 'C-01: Landed Cost decision must be keyed to FIN-4c only');

// layers
ok(layers.length === EXPECT.layers, `layers: expected ${EXPECT.layers}, got ${layers.length}`);
unique(layers.map((l) => l.code), 'layer');
ok(JSON.stringify(layers.map((l) => l.code)) === JSON.stringify(E.layer), 'layers order must match meta.enums.layer');
for (const l of layers) {
  refs(l.fedByQuestionIds, `layer ${l.code}.fedByQuestionIds`);
  ok(l.fedByQuestionIds.length > 0, `layer ${l.code}: no fedByQuestionIds`);
  ok(typeof l.fedByRaw === 'string' && l.fedByRaw.length > 0, `layer ${l.code}: fedByRaw missing`);
}

// one-way doors
ok(doors.length === EXPECT.doors, `doors: expected ${EXPECT.doors}, got ${doors.length}`);
unique(doors.map((d) => d.num), 'door');
for (const d of doors) {
  inEnum('oneWayDoorConfidence', d.confidence, `door ${d.num}.confidence`);
  ok(typeof d.isOneWay === 'boolean', `door ${d.num}: isOneWay not boolean`);
  ok(d.mappedBy === 'heuristic', `door ${d.num}: mappedBy must be "heuristic"`);
  for (const x of d.decisionIds) ok(did.has(x), `door ${d.num}: unknown decision ${x}`);
}
ok(doors.filter((d) => !d.isOneWay).length === 2, 'expected exactly 2 "NOT a one-way door" rows');

// module scoping
ok(scoping.length === EXPECT.scoping, `scoping: expected ${EXPECT.scoping}, got ${scoping.length}`);
unique(scoping.map((m) => m.id), 'scoping');
for (const m of scoping) {
  refs(m.drivenByQuestionIds, `scoping ${m.id}.drivenByQuestionIds`);
  ok(typeof m.drivenByRaw === 'string', `scoping ${m.id}: drivenByRaw missing`);
}

// prework
ok(prework.dataDocuments.length === EXPECT.dataDocuments, `prework dataDocuments: expected ${EXPECT.dataDocuments}, got ${prework.dataDocuments.length}`);
ok(prework.processes.length === EXPECT.processes, `prework processes: expected ${EXPECT.processes}, got ${prework.processes.length}`);
unique([...prework.dataDocuments, ...prework.processes].map((x) => x.id), 'prework');
const pwIds = new Set(prework.dataDocuments.map((d) => d.id));
for (const d of prework.dataDocuments) {
  refs(d.preparesQuestionIds, `prework ${d.id}.preparesQuestionIds`);
  inEnum('preworkDataArea', d.area, `prework ${d.id}.area`);
}
for (const p of prework.processes) inEnum('preworkProcessArea', p.area, `prework ${p.id}.area`);
for (const tpl of ['dataDocumentsTemplate', 'processesTemplate', 'systemsTemplate'])
  for (const c of prework[tpl] || []) if (c.enum) ok(Array.isArray(E[c.enum]), `prework.${tpl}: column ${c.column} references unknown enum ${c.enum}`);
ok((prework.systemsTemplate || []).length === 11, 'systemsTemplate: expected 11 columns');

// systems tables
ok(systems.tables.length === EXPECT.sysTables, `systems tables: expected ${EXPECT.sysTables}, got ${systems.tables.length}`);
for (const t of systems.tables) {
  ok(t.columns.length > 0, `systems table ${t.key}: no columns`);
  refs(t.questionIds, `systems table ${t.key}.questionIds`);
}
const sor = systems.tables.find((t) => t.key === 'systemOfRecord');
ok(sor && sor.presetDataTypes.length === EXPECT.sys2Presets, `SYS-2 presets: expected ${EXPECT.sys2Presets}`);
ok(systems.reports && systems.reports.columns.length === 8, 'reports: expected 8 columns');

// file checklist
ok(files.length === EXPECT.files, `fileChecklist: expected ${EXPECT.files}, got ${files.length}`);
unique(files.map((f) => f.id), 'file');
for (const f of files) {
  inEnum('fileChecklistCategory', f.category, `file ${f.id}.category`);
  if (f.coveredByPreworkId) ok(pwIds.has(f.coveredByPreworkId), `file ${f.id}: unknown prework ${f.coveredByPreworkId}`);
}

if (failures.length) {
  console.error(`check_bank: FAIL (${failures.length} of ${checks} checks)`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`check_bank: OK (${checks} checks)`);
