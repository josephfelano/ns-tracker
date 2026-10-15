// Store: the instance data (everything that is NOT the bank) and where it is saved.
//
// State is split into collections; each collection is one JSON file in the data folder,
// so changes diff cleanly in git and Claude can read/edit them directly.
//
// Adapters share one interface: { kind, label, init() -> 'ready'|'needs-permission'|'empty',
//   read(name) -> data|undefined, write(name, data), changedOnDisk() -> [names] }.
// Swap or add an adapter (e.g. a hosted API) without touching the views.
(function () {
  'use strict';
  const T = window.T;

  const SCHEMA = 1;
  const COLLECTIONS = ['tracker', 'people', 'interviews', 'answers', 'decisions', 'scoping', 'prework', 'tables', 'files', 'activity'];
  const defaults = () => ({
    tracker: { schema: SCHEMA, name: 'NetSuite implementation', createdAt: T.now(), bankVersion: T.bank.meta.version },
    people: [],
    interviews: [],
    answers: {},
    decisions: {},
    scoping: {},
    prework: { data: {}, processes: {}, extraProcesses: [], systems: [] },
    tables: {},
    files: {},
    activity: [],
  });

  // What a new data folder contains: every collection as a JSON file. The shell writes these
  // when it sets a folder up; mission-control/tools/lib/company.js (initTrackerData) writes the
  // same files from Node, so a folder set up either way opens the same.
  // name: what the user typed (e.g. the company folder "lemme") -> "Lemme NetSuite implementation".
  const templateFiles = (name) => {
    const d = defaults();
    const display = String(name).split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    d.tracker.name = display + ' NetSuite implementation';
    return COLLECTIONS.map((c) => ({ path: c + '.json', content: JSON.stringify(d[c], null, 2) + '\n' }));
  };

  // ---------- Folder adapter (File System Access API; Chrome / Edge) ----------
  // The shell picks and remembers the folder and hands the tracker its data folder handle.
  // label: what the user sees - the name of the folder that was picked (normally the company's).
  function FolderAdapter(handle, label) {
    this.kind = 'folder';
    this.handle = handle;
    this.label = label || (handle ? handle.name : '');
    this.known = {}; // name -> lastModified we last read or wrote
  }
  FolderAdapter.prototype.init = async function (fromGesture) {
    let perm = await this.handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted' && fromGesture) perm = await this.handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return 'needs-permission';
    try {
      await this.handle.getFileHandle('tracker.json');
      return 'ready';
    } catch (e) {
      if (e.name === 'NotFoundError') return 'empty';
      throw e;
    }
  };
  FolderAdapter.prototype.read = async function (name) {
    let fh;
    try {
      fh = await this.handle.getFileHandle(name + '.json');
    } catch (e) {
      if (e.name === 'NotFoundError') return undefined;
      throw e;
    }
    const file = await fh.getFile();
    this.known[name] = file.lastModified;
    const text = await file.text();
    if (!text.trim()) return undefined;
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(name + '.json is not valid JSON (' + e.message + '). Fix or remove the file, then reload.');
    }
  };
  // A text file in the data folder that is not a collection (how-it-runs.md); undefined if missing.
  FolderAdapter.prototype.readText = async function (file) {
    try {
      return await (await (await this.handle.getFileHandle(file)).getFile()).text();
    } catch (e) {
      if (e.name === 'NotFoundError') return undefined;
      throw e;
    }
  };
  FolderAdapter.prototype.write = async function (name, data) {
    const fh = await this.handle.getFileHandle(name + '.json', { create: true });
    const before = await fh.getFile();
    if (this.known[name] != null && before.lastModified > this.known[name]) {
      const err = new Error(name + '.json changed outside the app');
      err.code = 'CONFLICT';
      err.collection = name;
      throw err;
    }
    const w = await fh.createWritable();
    await w.write(JSON.stringify(data, null, 2) + '\n');
    await w.close();
    this.known[name] = (await fh.getFile()).lastModified;
  };
  FolderAdapter.prototype.changedOnDisk = async function () {
    const changed = [];
    for (const name of COLLECTIONS) {
      try {
        const file = await (await this.handle.getFileHandle(name + '.json')).getFile();
        if (this.known[name] != null && file.lastModified > this.known[name]) changed.push(name);
      } catch (e) { /* missing file: nothing to compare */ }
    }
    return changed;
  };

  // ---------- Browser adapter (localStorage; fallback, this browser only) ----------
  function BrowserAdapter() {
    this.kind = 'browser';
    this.label = 'this browser only';
  }
  const LS = 'ns-tracker:';
  BrowserAdapter.prototype.init = async function () {
    try {
      return localStorage.getItem(LS + 'tracker') ? 'ready' : 'empty';
    } catch (e) {
      throw new Error('Browser storage is blocked here. Use Chrome or Edge and connect a folder.');
    }
  };
  BrowserAdapter.prototype.read = async function (name) {
    const v = localStorage.getItem(LS + name);
    return v ? JSON.parse(v) : undefined;
  };
  BrowserAdapter.prototype.write = async function (name, data) {
    localStorage.setItem(LS + name, JSON.stringify(data));
  };
  BrowserAdapter.prototype.changedOnDisk = async function () { return []; };
  BrowserAdapter.prototype.readText = async function () { return undefined; }; // no files here

  // ---------- the store ----------
  const store = (T.store = {
    state: defaults(),
    adapter: null,
    saveState: 'idle', // idle | pending | saving | saved | error
    lastError: null,
    listeners: new Set(),
    timers: {},
    dirty: new Set(),
    FolderAdapter, BrowserAdapter, COLLECTIONS, templateFiles,
  });

  store.onChange = (fn) => { store.listeners.add(fn); return () => store.listeners.delete(fn); };
  store.readText = (file) => (store.adapter ? store.adapter.readText(file) : Promise.resolve(undefined));
  const emit = (what) => store.listeners.forEach((fn) => { try { fn(what); } catch (e) { console.error(e); } });

  store.loadAll = async function (adapter, status) {
    const fresh = defaults();
    if (status === 'empty') {
      // New data folder: write every collection so the folder is self-describing.
      for (const name of COLLECTIONS) await adapter.write(name, fresh[name]);
    } else {
      for (const name of COLLECTIONS) {
        const v = await adapter.read(name);
        if (v !== undefined) fresh[name] = mergeDefaults(fresh[name], v);
      }
    }
    store.state = fresh;
    store.adapter = adapter;
    store.saveState = 'saved';
    emit('load');
  };

  function mergeDefaults(def, v) {
    if (Array.isArray(def) || def === null || typeof def !== 'object' || Array.isArray(v) || typeof v !== 'object') return v;
    return Object.assign({}, def, v);
  }

  // Mark a collection changed; it is written after a short pause in typing.
  store.touch = function (name) {
    store.dirty.add(name);
    store.saveState = 'pending';
    emit('dirty');
    clearTimeout(store.timers[name]);
    store.timers[name] = setTimeout(() => store.flush(name), 600);
  };

  store.flush = async function (name) {
    if (!store.adapter || !store.dirty.has(name)) return;
    store.dirty.delete(name);
    store.saveState = 'saving';
    emit('saving');
    try {
      await store.adapter.write(name, store.state[name]);
      store.saveState = store.dirty.size ? 'pending' : 'saved';
      store.lastError = null;
      emit('saved');
    } catch (e) {
      store.saveState = 'error';
      store.lastError = e;
      if (e.code !== 'CONFLICT') store.dirty.add(name);
      emit(e.code === 'CONFLICT' ? 'conflict' : 'error');
    }
  };

  store.flushAll = async function () {
    for (const name of [...store.dirty]) {
      clearTimeout(store.timers[name]);
      await store.flush(name);
    }
  };

  // Reload collections from storage (after an outside edit, e.g. Claude changed a file).
  store.reload = async function (names) {
    for (const name of names) {
      const v = await store.adapter.read(name);
      store.state[name] = v === undefined ? defaults()[name] : mergeDefaults(defaults()[name], v);
      store.dirty.delete(name);
    }
    store.saveState = store.dirty.size ? 'pending' : 'saved';
    emit('reload');
  };

  // Overwrite the file with the app's copy after a conflict the user chose to override.
  store.forceWrite = async function (name) {
    if (store.adapter.kind === 'folder') {
      const fh = await store.adapter.handle.getFileHandle(name + '.json', { create: true });
      store.adapter.known[name] = (await fh.getFile()).lastModified;
    }
    store.dirty.add(name);
    await store.flush(name);
  };

  // ---------- activity log ----------
  // Same kind + ref within 15 minutes updates the last entry instead of adding one,
  // so typing an answer does not produce fifty log lines.
  store.log = function (kind, ref, text) {
    const a = store.state.activity;
    const last = a[a.length - 1];
    const at = T.now();
    if (last && last.kind === kind && last.ref === ref && Date.now() - new Date(last.at) < 15 * 60000) {
      last.at = at;
      last.text = text;
    } else {
      a.push({ at, kind, ref, text });
    }
    store.touch('activity');
  };

  // ---------- mutations ----------
  store.setAnswer = function (qid, field, value, interviewId) {
    const a = (store.state.answers[qid] = store.state.answers[qid] || {});
    const prev = a[field];
    if (prev === value) return;
    a[field] = value;
    a.updatedAt = T.now();
    if (interviewId) {
      a.interviewIds = a.interviewIds || [];
      if (!a.interviewIds.includes(interviewId)) a.interviewIds.push(interviewId);
    }
    if (field === 'answer' && value && (!a.status || a.status === 'Not started')) a.status = 'In progress';
    store.touch('answers');
    if (field === 'status') store.log('question-status', qid, qid + ' marked ' + value);
    else if (field === 'answer') store.log('question-answer', qid, qid + ' answer updated');
    emit('answers');
  };

  store.setDecision = function (did, field, value) {
    const d = (store.state.decisions[did] = store.state.decisions[did] || {});
    if (JSON.stringify(d[field]) === JSON.stringify(value)) return;
    d[field] = value;
    d.updatedAt = T.now();
    // Picking an answer is making the decision.
    const picked = field === 'choice' && value != null && value !== '' && !(Array.isArray(value) && !value.length);
    if (picked && !T.dDone(d.status || 'Not started')) d.status = 'Decided';
    if ((field === 'status' && value === 'Decided') || (picked && d.status === 'Decided')) d.decidedAt = d.decidedAt || T.today();
    store.touch('decisions');
    if (field === 'status') store.log('decision-status', did, did + ' marked ' + value);
    else if (field === 'choice') {
      const opts = T.idx.opt.get(did);
      const label = (v) => (opts && opts.get(String(v)) ? opts.get(String(v)).label : String(v));
      const text = value == null || value === '' || (Array.isArray(value) && !value.length) ? 'cleared' : (Array.isArray(value) ? value : [value]).map(label).join(', ');
      store.log('decision-choice', did, did + ' answer: ' + text);
    } else store.log('decision-edit', did, did + ' ' + field + ' updated');
    emit('decisions');
  };

  store.setScoping = function (mid, field, value) {
    const m = (store.state.scoping[mid] = store.state.scoping[mid] || {});
    if (m[field] === value) return;
    m[field] = value;
    m.updatedAt = T.now();
    store.touch('scoping');
    if (field === 'status') store.log('scoping-status', mid, mid + ' marked ' + value);
    emit('scoping');
  };

  // Generic keyed edit, e.g. setKeyed('files', 'F-01', 'status', 'Complete')
  store.setKeyed = function (collection, key, field, value, label) {
    const coll = store.state[collection];
    const row = (coll[key] = coll[key] || {});
    if (row[field] === value) return;
    row[field] = value;
    row.updatedAt = T.now();
    store.touch(collection);
    if (field === 'status' || /status/i.test(field)) store.log(collection + '-status', key, (label || key) + ' marked ' + value);
    emit(collection);
  };

  store.addPerson = function (fields) {
    const n = store.state.people.reduce((m, p) => Math.max(m, parseInt(String(p.id).replace(/\D/g, ''), 10) || 0), 0) + 1;
    const p = Object.assign({ id: 'P-' + String(n).padStart(3, '0'), name: '', role: '', team: '', notes: '' }, fields);
    store.state.people.push(p);
    store.touch('people');
    store.log('person-add', p.id, 'Added ' + (p.name || p.id));
    emit('people');
    return p;
  };
  store.person = (id) => store.state.people.find((p) => p.id === id);
  store.personName = (id) => { const p = store.person(id); return p ? p.name || p.id : ''; };

  store.addInterview = function (fields) {
    // Ids are never reused: the activity log still names deleted interviews.
    const used = store.state.interviews.map((i) => i.id).concat(store.state.activity.map((x) => x.ref).filter((r) => /^I-\d+$/.test(r)));
    const n = used.reduce((m, id) => Math.max(m, parseInt(String(id).replace(/\D/g, ''), 10) || 0), 0) + 1;
    const iv = Object.assign({ id: 'I-' + String(n).padStart(3, '0'), date: T.today(), personIds: [], title: '', notes: '', createdAt: T.now() }, fields);
    store.state.interviews.push(iv);
    store.touch('interviews');
    store.log('interview-add', iv.id, 'Interview ' + iv.id + (iv.title ? ': ' + iv.title : '') + ' started');
    emit('interviews');
    return iv;
  };

  // Answers captured in the interview stay; only their link to it is removed.
  store.linkedAnswers = (id) => Object.keys(store.state.answers).filter((q) => (store.state.answers[q].interviewIds || []).includes(id));
  store.removeInterview = function (id) {
    const iv = store.state.interviews.find((i) => i.id === id);
    if (!iv) return;
    const linked = store.linkedAnswers(id);
    linked.forEach((q) => { const a = store.state.answers[q]; a.interviewIds = a.interviewIds.filter((x) => x !== id); });
    store.state.interviews = store.state.interviews.filter((i) => i.id !== id);
    store.touch('interviews');
    if (linked.length) store.touch('answers');
    store.log('interview-delete', id, 'Interview ' + id + (iv.title ? ': ' + iv.title : '') + ' deleted');
    emit('interviews');
  };

  // ---------- export / import (a full snapshot as one JSON file) ----------
  store.snapshot = () => JSON.parse(JSON.stringify(store.state));
  store.importSnapshot = async function (obj) {
    for (const name of COLLECTIONS) {
      if (obj[name] !== undefined) {
        store.state[name] = mergeDefaults(defaults()[name], obj[name]);
        store.dirty.add(name);
      }
    }
    await store.flushAll();
    emit('load');
  };
})();
