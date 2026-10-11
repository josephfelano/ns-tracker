#!/usr/bin/env node
// Check that this repo's shell/ is identical to another app repo's shell/.
//
//   node tools/check-shell.js <other repo>      e.g. ../ns-tracker
//
// Mission Control and the NS tracker each keep an identical copy of the shared shell
// (shell/README.md). Exits 1 and lists every file that differs or exists on one side only.
// The same script lives in both repos.
'use strict';
const fs = require('fs');
const path = require('path');

const other = process.argv[2];
if (!other) {
  console.error('Usage: node tools/check-shell.js <other repo>');
  process.exit(2);
}
const here = path.join(__dirname, '..', 'shell');
const there = path.join(path.resolve(other), 'shell');
if (!fs.existsSync(there)) {
  console.error(`No shell/ in ${path.resolve(other)}`);
  process.exit(2);
}

const list = (root, dir = '') => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = path.join(dir, e.name);
  return e.isDirectory() ? list(root, rel) : [rel];
});
// Compare text with line endings normalised, so a CRLF checkout does not count as a difference.
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');

const a = new Set(list(here));
const b = new Set(list(there));
const problems = [];
for (const f of new Set([...a, ...b])) {
  if (!a.has(f)) problems.push(`only in ${other}: shell/${f}`);
  else if (!b.has(f)) problems.push(`only here: shell/${f}`);
  else if (read(here, f) !== read(there, f)) problems.push(`differs: shell/${f}`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`shell/ is identical (${a.size} files)`);
