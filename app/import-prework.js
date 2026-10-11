// Prework workbook import: reads the filled-in prework .xlsx (Data & Documents,
// Process Inventory, Systems & Partners) and merges it into the tracker's prework data.
//
// plan(sheets) computes every change without touching state; the UI shows it; apply(plan)
// writes it. Merge rule: a non-empty workbook cell sets the value; an empty cell never
// clears what is already in the tracker. Rows match bank items by their text, so a
// reordered workbook still lands on the right items. Owner names become People.
(function () {
  'use strict';
  const T = window.T;
  const { store } = T;
  const B = T.bank;
  const norm = (s) => T.slug(String(s == null ? '' : s).trim());
  const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

  const SHEETS = { data: 'Data & Documents', processes: 'Process Inventory', systems: 'Systems & Partners' };

  function findSheet(sheets, title) {
    const key = Object.keys(sheets).find((k) => norm(k) === norm(title));
    return key ? sheets[key] : null;
  }

  // Header row = first row whose first cell is the template's first column label.
  function readTable(rows, template) {
    const first = norm(template[0].column);
    const h = rows.findIndex((r) => r && norm(r[0]) === first && r.filter(Boolean).length > 2);
    if (h < 0) return null;
    const headers = rows[h].map((x) => T.slug(clean(x)));
    const known = new Set(template.map((c) => T.slug(c.column)));
    const out = [];
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      if (!r.some((x) => clean(x))) continue;
      const obj = { _row: i + 1 };
      headers.forEach((k, j) => { if (k && known.has(k)) obj[k] = clean(r[j]); });
      out.push(obj);
    }
    return out;
  }

  // Enum check with the known workbook quirk: Excel split 'Available, cleanup needed'
  // into 'Available' and 'cleanup needed' in the dropdown.
  function fixEnum(enumName, value, flags, where) {
    if (!enumName || !value) return value;
    const vals = T.enums[enumName];
    const hit = vals.find((v) => v.toLowerCase() === value.toLowerCase());
    if (hit) return hit;
    if (enumName === 'preworkReadiness' && /^(available|cleanup needed)$/i.test(value)) {
      flags.push(`${where}: "${value}" read as "Available, cleanup needed" (the workbook dropdown split that value in two).`);
      return 'Available, cleanup needed';
    }
    flags.push(`${where}: "${value}" is not one of the listed values; kept as typed.`);
    return value;
  }

  // people: Map lowercase name -> display name (first spelling seen wins)
  function personRef(name, people) {
    const n = clean(name);
    if (!n) return null;
    const hit = store.state.people.find((p) => (p.name || '').toLowerCase() === n.toLowerCase());
    if (hit) return { id: hit.id, name: hit.name };
    if (!people.has(n.toLowerCase())) people.set(n.toLowerCase(), n);
    return { newName: people.get(n.toLowerCase()) };
  }

  // The template pre-fills every row's status with 'Not started'; that is not an answer.
  const isTemplateDefault = (key, value, current) => key === 'collection-status' && value === 'Not started' && !current;

  T.preworkImport = {
    plan(sheets) {
      const flags = [];
      const people = new Map();
      const changes = []; // { area: 'data'|'processes', id, label, key, from, to }
      const newProcesses = [];
      const systemsAdd = [];
      const systemsUpdate = [];
      const pw = store.state.prework;
      const found = {};

      // ---- Data & Documents ----
      const dTpl = B.prework.dataDocumentsTemplate;
      const dRows = findSheet(sheets, SHEETS.data);
      const dTable = dRows && readTable(dRows, dTpl);
      found.data = !!dTable;
      if (dTable) {
        const byItem = new Map(B.prework.dataDocuments.map((p) => [norm(p.item), p]));
        const skip = new Set(['area', 'what-to-have-ready', 'good-enough-before-day-one']);
        dTable.forEach((row) => {
          if (!row['what-to-have-ready']) return; // a note or spacer row, not an item
          const item = byItem.get(norm(row['what-to-have-ready']));
          if (!item) { flags.push(`Data & Documents row ${row._row}: "${row['what-to-have-ready']}" is not a prework item; skipped.`); return; }
          const cur = pw.data[item.id] || {};
          dTpl.forEach((c) => {
            const key = T.slug(c.column);
            if (skip.has(key) || !row[key]) return;
            if (isTemplateDefault(key, row[key], cur[key])) return;
            let to = row[key];
            if (key === 'owner') to = personRef(to, people);
            else to = fixEnum(c.enum, to, flags, `${item.id} ${c.column}`);
            const from = cur[key] || '';
            const same = key === 'owner' ? to.id && to.id === from : from === to;
            if (!same) changes.push({ area: 'data', id: item.id, label: item.item, key, from, to });
          });
        });
      }

      // ---- Process Inventory ----
      const pTpl = B.prework.processesTemplate;
      const pRows = findSheet(sheets, SHEETS.processes);
      const pTable = pRows && readTable(pRows, pTpl);
      found.processes = !!pTable;
      if (pTable) {
        const byName = new Map(B.prework.processes.map((p) => [norm(p.process), p]));
        pw.extraProcesses.forEach((x) => { if (x.process) byName.set(norm(x.process), { id: x.id, process: x.process, extra: true }); });
        pTable.forEach((row) => {
          const proc = byName.get(norm(row.process));
          if (!row.process) return; // a note or spacer row
          const fields = {};
          const curP = proc ? ((proc.extra ? pw.extraProcesses.find((x) => x.id === proc.id) : pw.processes[proc.id]) || {}) : {};
          pTpl.forEach((c) => {
            const key = T.slug(c.column);
            if (key === 'area' || key === 'process' || !row[key]) return;
            if (isTemplateDefault(key, row[key], curP[key])) return;
            fields[key] = key === 'primary-owner' ? personRef(row[key], people) : fixEnum(c.enum, row[key], flags, `Process "${row.process}" ${c.column}`);
          });
          if (!proc) {
            newProcesses.push({ area: row.area || '', process: row.process, fields });
            return;
          }
          Object.entries(fields).forEach(([key, to]) => {
            const from = curP[key] || '';
            const same = key === 'primary-owner' ? to.id && to.id === from : from === to;
            if (!same) changes.push({ area: 'processes', id: proc.id, extra: !!proc.extra, label: proc.process, key, from, to });
          });
        });
      }

      // ---- Systems & Partners ----
      const sTpl = B.prework.systemsTemplate;
      const sRows = findSheet(sheets, SHEETS.systems);
      const sTable = sRows && readTable(sRows, sTpl);
      found.systems = !!sTable;
      if (sTable) {
        sTable.forEach((row) => {
          const validType = row.type && T.enums.systemType.some((v) => v.toLowerCase() === row.type.toLowerCase());
          if (!row['system-partner'] && !validType) return; // empty slot or a footnote, not a system
          const fields = {};
          sTpl.forEach((c) => { const k = T.slug(c.column); if (row[k]) fields[k] = fixEnum(c.enum, row[k], flags, `System "${row['system-partner'] || row._row}" ${c.column}`); });
          const name = norm(row['system-partner']);
          const existing = name && pw.systems.find((s) => norm(s['system-partner']) === name);
          if (existing) {
            const diff = Object.entries(fields).filter(([k, v]) => (existing[k] || '') !== v);
            if (diff.length) systemsUpdate.push({ id: existing.id, label: row['system-partner'], fields: Object.fromEntries(diff) });
          } else {
            systemsAdd.push({ label: row['system-partner'] || '(unnamed row ' + row._row + ')', fields });
          }
        });
      }

      if (!found.data && !found.processes && !found.systems) {
        throw new Error('This does not look like the prework workbook: none of the sheets "Data & Documents", "Process Inventory" or "Systems & Partners" were found.');
      }
      return { found, changes, newProcesses, systemsAdd, systemsUpdate, newPeople: [...people.values()], flags };
    },

    apply(plan) {
      const pw = store.state.prework;
      const ids = {};
      plan.newPeople.forEach((name) => { ids[name] = store.addPerson({ name }).id; });
      const val = (v) => (v && typeof v === 'object' ? v.id || ids[v.newName] : v);
      const now = T.now();
      plan.changes.forEach((c) => {
        const row = c.area === 'data'
          ? (pw.data[c.id] = pw.data[c.id] || {})
          : c.extra ? pw.extraProcesses.find((x) => x.id === c.id) : (pw.processes[c.id] = pw.processes[c.id] || {});
        row[c.key] = val(c.to);
        row.updatedAt = now;
      });
      plan.newProcesses.forEach((p) => {
        const row = { id: T.uid('PW-PX'), area: p.area, process: p.process, updatedAt: now };
        Object.entries(p.fields).forEach(([k, v]) => { row[k] = val(v); });
        pw.extraProcesses.push(row);
      });
      plan.systemsAdd.forEach((s) => pw.systems.push(Object.assign({ id: T.uid('R'), createdAt: now, updatedAt: now }, s.fields)));
      plan.systemsUpdate.forEach((s) => Object.assign(pw.systems.find((x) => x.id === s.id), s.fields, { updatedAt: now }));
      store.touch('prework');
      const parts = [];
      if (plan.changes.length) parts.push(plan.changes.length + ' fields');
      if (plan.newProcesses.length) parts.push(plan.newProcesses.length + ' new processes');
      if (plan.systemsAdd.length + plan.systemsUpdate.length) parts.push((plan.systemsAdd.length + plan.systemsUpdate.length) + ' systems');
      if (plan.newPeople.length) parts.push(plan.newPeople.length + ' new people');
      store.log('prework-import', null, 'Imported prework workbook: ' + (parts.join(', ') || 'no changes'));
    },
  };
})();
