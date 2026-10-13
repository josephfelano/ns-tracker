// The shared shell (named Hub in code): the frame, styling and UI services an app runs on.
// Mission Control and the NS tracker each keep an identical copy in shell/ - see shell/README.md.
//
// Classic script, no build step, no dependencies: it runs from file:// by opening the app's page.
// Load it in <head> AFTER window.HUB_CONFIG is set. It links its own stylesheets and then
// the module loaders listed in the config, so the page never paints unstyled and every
// module script runs before boot.
//
// A module is an app that calls Hub.defineModule({...}) - see shell/README.md for the contract.
// The shell owns: the frame (rail, top bar, title bar), routing, the data folder, themes,
// search, and the shared services in Hub.ui (toast, modal, confirm, prompt, drawer, tabs).
// The shell holds no app logic and no company data.
(function () {
  'use strict';
  const Hub = (window.Hub = window.Hub || {});
  Hub.version = '0.1.0';
  const CONFIG = window.HUB_CONFIG || {};
  const BASE = document.currentScript.src.replace(/[^/]*$/, '');
  const APP_TITLE = document.title || 'Hub';

  // ---------- utilities ----------
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (Hub.esc = (s) => (s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ESC[c])));
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k) { try { return localStorage.getItem('hub:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('hub:' + k, v); } catch (e) { /* storage blocked: fine */ } },
    del(k) { try { localStorage.removeItem('hub:' + k); } catch (e) { /* fine */ } },
  };
  const ICON = {
    chevron: 'M6 9l6 6 6-6',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    close: 'M18 6L6 18M6 6l12 12',
    home: 'M3 10.5L12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
    refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
  };
  // An icon is an SVG path ("M3 12l9-8...") or inner SVG markup ("<circle .../>").
  const icon = (Hub.icon = (d) => `<svg class="hub-ico" viewBox="0 0 24 24" aria-hidden="true">${String(d || '').trim().startsWith('<') ? d : `<path d="${esc(d)}"/>`}</svg>`);

  // ---------- themes ----------
  // A theme is a tokens-only stylesheet in shell/themes/. One is linked at a time.
  Hub.themes = [{ key: 'light', label: 'Light' }, { key: 'dark', label: 'Dark' }];
  const darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  const themeChoice = () => ls.get('theme') || CONFIG.theme || 'system';
  const themeKey = () => {
    const t = themeChoice();
    if (t === 'system') return darkMq.matches ? 'dark' : 'light';
    return Hub.themes.some((x) => x.key === t) ? t : 'light';
  };
  const themeHref = () => BASE + 'themes/' + themeKey() + '.css';
  function applyTheme() {
    const link = $('hub-theme');
    if (!link || link.getAttribute('href') === themeHref()) return;
    const next = link.cloneNode();
    next.removeAttribute('id');
    next.href = themeHref();
    next.onload = () => { link.remove(); next.id = 'hub-theme'; };
    link.after(next);
  }
  Hub.setTheme = (t) => { ls.set('theme', t); applyTheme(); };
  darkMq.addEventListener('change', () => { if (themeChoice() === 'system') applyTheme(); });

  // ---------- page head: stylesheets, then module loaders (parser-inserted, so they run in order) ----------
  document.documentElement.classList.add('hub-root');
  const loadFailed = [];
  Hub._loadFailed = (src) => loadFailed.push(src);
  document.write(`<link rel="stylesheet" href="${BASE}hub.css"><link id="hub-theme" rel="stylesheet" href="${themeHref()}">`);
  (CONFIG.modules || []).forEach((src) => {
    document.write(`<script src="${esc(src)}" onerror="Hub._loadFailed(this.getAttribute('src'))"></scr` + 'ipt>');
  });

  // ---------- module registry ----------
  const modules = [];
  Hub.modules = modules;
  // def: { key, label, mark, icon, description, nav, footNav, actions, data, open, render, select, title, search, flush, isDirty }
  Hub.defineModule = (def) => {
    if (!def || !def.key || !def.label || typeof def.render !== 'function') throw new Error('Hub.defineModule needs key, label and render()');
    if (modules.some((m) => m.key === def.key)) throw new Error('Hub module "' + def.key + '" is defined twice');
    def.status = 'pending';
    modules.push(def);
  };
  const navOf = (m) => (typeof m.nav === 'function' ? m.nav() : m.nav) || [];
  const footOf = (m) => (typeof m.footNav === 'function' ? m.footNav() : m.footNav) || [];
  const actionsOf = (m) => (m && m.status === 'ready' && (typeof m.actions === 'function' ? m.actions() : m.actions)) || [];
  const pagesOf = (m) => navOf(m).concat(footOf(m)).filter((n) => n.key);
  Hub.href = (moduleKey, path) => '#/' + moduleKey + (path ? '/' + path : '');

  // ---------- shared UI services ----------
  const ui = (Hub.ui = {});

  // Delegated listener on a view's own root (a fresh element per render, so it never outlives the view).
  ui.on = (root, type, selector, fn) =>
    root.addEventListener(type, (e) => {
      const t = e.target.closest(selector);
      if (t && root.contains(t)) fn(e, t);
    });
  ui.el = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };

  // Escape closes only the top-most layer (modal over drawer over page).
  const layers = [];
  const dropLayer = (l) => { const i = layers.indexOf(l); if (i >= 0) layers.splice(i, 1); };
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !layers.length) return;
    e.preventDefault();
    layers[layers.length - 1].close();
  });

  const TONES = ['ok', 'bad', 'warn', 'info'];
  ui.toast = (msg, tone) => {
    if (tone && !TONES.includes(tone)) { console.warn('Hub.ui.toast: unknown tone "' + tone + '"; use ' + TONES.join(', ')); tone = 'info'; }
    let host = $('hub-toasts');
    if (!host) { host = ui.el('<div id="hub-toasts" class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(host); }
    const t = ui.el(`<div class="toast tone-${tone || 'info'}">${esc(msg)}</div>`);
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3600);
  };

  // actions: [{ label, primary, danger, onClick(modalEl) -> false keeps it open }]
  ui.modal = ({ title, body, actions, wide, onClose }) => {
    const m = ui.el(`<div class="modal-back"><div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${icon(ICON.close)}</button></div>
      <div class="modal-body"></div>
      <div class="modal-foot"></div></div></div>`);
    const bodyEl = m.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const foot = m.querySelector('.modal-foot');
    let closed = false;
    const layer = {
      close() {
        if (closed) return;
        closed = true;
        m.remove();
        dropLayer(layer);
        if (onClose) onClose();
      },
    };
    (actions || [{ label: 'Close' }]).forEach((a) => {
      const b = ui.el(`<button class="btn${a.primary ? ' primary' : ''}${a.danger ? ' danger' : ''}">${esc(a.label)}</button>`);
      b.addEventListener('click', () => {
        if (closed) return; // one click, one action
        const keep = a.onClick && a.onClick(m) === false;
        if (!keep) layer.close();
      });
      foot.appendChild(b);
    });
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) layer.close(); });
    document.body.appendChild(m);
    layers.push(layer);
    const first = m.querySelector('.modal-body input, .modal-body textarea, .modal-body select') || foot.querySelector('.primary');
    if (first) first.focus();
    return { el: m, close: () => layer.close() };
  };

  ui.confirm = ({ title, message, confirmLabel, danger }) =>
    new Promise((res) => {
      let answer = false;
      ui.modal({
        title,
        body: `<p>${esc(message)}</p>`,
        actions: [
          { label: 'Cancel' },
          { label: confirmLabel || 'OK', primary: !danger, danger, onClick: () => { answer = true; } },
        ],
        onClose: () => res(answer),
      });
    });

  ui.promptText = ({ title, label, value, placeholder }) =>
    new Promise((res) => {
      let answer = null;
      const body = ui.el(`<label class="field"><span>${esc(label)}</span><input type="text" value="${esc(value || '')}" placeholder="${esc(placeholder || '')}"></label>`);
      const input = body.querySelector('input');
      const m = ui.modal({
        title, body,
        actions: [
          { label: 'Cancel' },
          { label: 'Save', primary: true, onClick: () => { answer = input.value.trim() || null; } },
        ],
        onClose: () => res(answer),
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { answer = input.value.trim() || null; m.close(); } });
    });

  // Right-hand detail panel. One at a time; navigating to another page closes it.
  ui.drawer = {
    el: null,
    open({ title, subtitle, body, onClose }) {
      this.close(true);
      const d = ui.el(`<aside class="drawer" role="dialog" aria-label="${esc(title)}">
        <div class="drawer-head"><div><div class="drawer-sub">${subtitle || ''}</div><h2>${esc(title)}</h2></div>
        <button class="icon-btn" data-close aria-label="Close">${icon(ICON.close)}</button></div>
        <div class="drawer-body"></div></aside>`);
      const b = d.querySelector('.drawer-body');
      if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
      d.querySelector('[data-close]').addEventListener('click', () => this.close());
      document.body.appendChild(d);
      this.el = d;
      this.onClose = onClose;
      this.layer = { close: () => this.close() };
      layers.push(this.layer);
      return d;
    },
    close(silent) {
      if (!this.el) return;
      this.el.remove();
      this.el = null;
      dropLayer(this.layer);
      const cb = this.onClose;
      this.onClose = null;
      if (!silent && cb) cb();
    },
  };

  ui.tabs = (items, active, hrefFor) =>
    `<nav class="tabs">${items.map((t) => `<a class="tab${t.key === active ? ' active' : ''}" href="${hrefFor(t.key)}">${esc(t.label)}${t.count != null ? ` <span class="count">${t.count}</span>` : ''}</a>`).join('')}</nav>`;

  // ---------- data folder ----------
  // One rule for every app. You pick a folder (normally the company folder) and the browser
  // remembers it and the recent list (IndexedDB). Each app declares
  //   data: { folder: 'ns-tracker', marker: 'tracker.json', template: (name) => [{ path, content }] }
  // and finds its data folder the same way:
  //   1. the picked folder has the app's marker file -> it is the app's data folder
  //   2. the picked folder contains <folder>/ with the marker -> use that
  //   3. otherwise "Set up here" asks for a name and creates <picked>/<folder>/ from the
  //      app's template (the same files the Node setup tools write), never overwriting a file.
  const idb = {
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open('hub', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) {
      const db = await this.open();
      return new Promise((res, rej) => { const r = db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    },
    async set(k, v) {
      const db = await this.open();
      return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
    },
  };
  const folder = (Hub.folder = { mode: null, handle: null, label: '' }); // mode: 'folder' | 'browser'
  const canPick = () => typeof window.showDirectoryPicker === 'function';
  const recentFolders = async () => { try { return (await idb.get('recent')) || []; } catch (e) { return []; } };
  // What a folder holds, for the recent list: a browser never reveals a folder's full path, so
  // each entry says which apps' data it holds and when it was last opened instead.
  async function holdingsOf(dir) {
    const out = [];
    for (const [file, label] of Object.entries(DATA_MARKERS)) {
      if (await Hub.fs.hasFile(dir, file)) { out.push(label); continue; }
      const sub = DATA_FOLDERS[file] ? await Hub.fs.sub(dir, DATA_FOLDERS[file]) : null;
      if (sub && (await Hub.fs.hasFile(sub, file))) out.push(label);
    }
    return out;
  }
  const ago = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    if (m < 1440) return Math.round(m / 60) + ' h ago';
    const d = Math.round(m / 1440);
    return d < 31 ? d + (d === 1 ? ' day ago' : ' days ago') : new Date(t).toLocaleDateString();
  };
  async function forgetFolder(i) {
    const list = await recentFolders();
    const gone = list.splice(i, 1)[0];
    await idb.set('recent', list);
    const saved = await idb.get('folder').catch(() => null);
    try { if (gone && saved && (await saved.handle.isSameEntry(gone.handle))) await idb.set('folder', null); } catch (e) { /* stale handle */ }
  }
  async function rememberFolder(handle, label) {
    let holds = [];
    try { holds = await holdingsOf(handle); } catch (e) { /* unreadable: leave it blank */ }
    const entry = { handle, label, at: Date.now(), holds };
    await idb.set('folder', entry);
    const kept = [];
    for (const r of await recentFolders()) {
      try { if (!(await r.handle.isSameEntry(handle))) kept.push(r); } catch (e) { /* stale handle */ }
    }
    await idb.set('recent', [entry].concat(kept).slice(0, 6));
  }
  // Folder helpers, also for apps that read their data folder.
  Hub.fs = {
    async sub(dir, name) { try { return await dir.getDirectoryHandle(name); } catch (e) { return null; } },
    async hasFile(dir, name) { try { await dir.getFileHandle(name); return true; } catch (e) { return false; } },
    async has(dir, name) { return (await Hub.fs.hasFile(dir, name)) || !!(await Hub.fs.sub(dir, name)); },
  };

  // Every app's marker, so a page never sets one app up inside another app's data folder, even
  // when only one app is loaded. Add a line here when a new app joins (both copies of the shell).
  const DATA_MARKERS = { 'mission-control.json': 'Mission Control', 'tracker.json': 'NS tracker' };
  // Where each app keeps its data inside a company folder (the same names as each app's data.folder).
  const DATA_FOLDERS = { 'mission-control.json': 'mission-control', 'tracker.json': 'ns-tracker' };
  async function otherAppFolder(m, dir) {
    const markers = Object.assign({}, DATA_MARKERS);
    modules.forEach((x) => { if (x.data) markers[x.data.marker] = x.label; });
    for (const [file, label] of Object.entries(markers)) {
      if (file !== m.data.marker && (await Hub.fs.hasFile(dir, file))) return label;
    }
    return null;
  }

  async function findDataFolder(d, picked) {
    if (await Hub.fs.hasFile(picked, d.marker)) return picked;
    const child = await Hub.fs.sub(picked, d.folder);
    return child && (await Hub.fs.hasFile(child, d.marker)) ? child : null;
  }

  // Create <parent>/<folder>/ from the app's template. A path ending in '/' is an empty folder
  // (kept in git with .gitkeep). Files that already exist are left alone.
  async function setUpDataFolder(d, parent, name) {
    const dir = await parent.getDirectoryHandle(d.folder, { create: true });
    for (const f of await d.template(name)) {
      const parts = f.path.split('/').filter(Boolean);
      const isFolder = f.content == null;
      let at = dir;
      for (let i = 0; i < parts.length - (isFolder ? 0 : 1); i++) at = await at.getDirectoryHandle(parts[i], { create: true });
      const fileName = isFolder ? '.gitkeep' : parts[parts.length - 1];
      if (await Hub.fs.hasFile(at, fileName)) continue;
      const w = await (await at.getFileHandle(fileName, { create: true })).createWritable();
      await w.write(isFolder ? '' : f.content);
      await w.close();
    }
    if (!(await Hub.fs.hasFile(dir, d.marker))) throw new Error(`The ${d.folder} template did not write ${d.marker}.`);
    return dir;
  }

  async function resolveModules() {
    for (const m of modules) {
      m.dir = null;
      m.error = null;
      if (folder.mode === 'browser') { m.status = !m.data || m.data.browser ? 'open' : 'needs-folder'; continue; }
      if (!m.data) { m.status = 'open'; continue; }
      try {
        m.dir = await findDataFolder(m.data, folder.handle);
        m.status = m.dir ? 'open' : 'not-set-up';
      } catch (e) { m.status = 'error'; m.error = e; }
    }
  }
  async function openModule(m) {
    try {
      if (m.open) await m.open({ dir: m.dir, label: folder.label, browser: folder.mode === 'browser' });
      m.status = 'ready';
    } catch (e) {
      console.error(e);
      m.status = 'error';
      m.error = e;
    }
  }

  // Flush every module's pending writes before the page goes away.
  async function flushAll() { for (const m of modules) if (m.status === 'ready' && m.flush) await m.flush(); }
  Hub.switchFolder = async () => { await flushAll(); connectScreen({ closable: true }); };

  // ---------- connect screen ----------
  async function connectScreen(opts) {
    const restored = opts.restored || null;
    const recent = canPick() ? await recentFolders() : [];
    const browserOk = modules.some((m) => m.data && m.data.browser);
    const mark = modules.length === 1 ? modules[0].mark || '' : CONFIG.mark || 'H';
    $('hub-app').innerHTML = `
      <div class="connect"><div class="connect-card">
        <div class="brand-mark big">${esc(mark)}</div>
        <h1>${esc(APP_TITLE)}</h1>
        <p class="lead">Choose the folder your data lives in. A folder that already holds the data opens straight away; otherwise each app sets up its own folder inside it.</p>
        ${recent.length ? `<div class="recent"><div class="nav-sep">Recent</div>${recent.map((r, i) => `<div class="recent-row"><button class="recent-item" data-recent="${i}"><span class="recent-name">${esc(r.label)}${r.label !== r.handle.name ? ` <span class="fine mono">${esc(r.handle.name)}</span>` : ''}</span><span class="fine">${esc([r.holds ? (r.holds.length ? r.holds.join(', ') : 'No app data yet') : '', r.at ? 'opened ' + ago(r.at) : ''].filter(Boolean).join(' - '))}</span></button><button class="recent-forget" data-forget="${i}" aria-label="Remove ${esc(r.label)} from the list">&times;</button></div>`).join('')}</div>` : ''}
        <div class="connect-actions">
          ${restored ? `<button class="btn primary" data-reconnect>Reconnect to "${esc(restored.label)}"</button>` : ''}
          ${canPick() ? `<button class="btn${restored ? '' : ' primary'}" data-pick>Choose folder...</button>` : ''}
          ${browserOk ? '<button class="btn subtle" data-browser>Use browser storage instead</button>' : ''}
          ${opts.closable ? '<button class="btn subtle" data-cancel>Cancel</button>' : ''}
        </div>
        ${canPick() ? '' : '<p class="warn-text">This browser cannot open folders. Open this page in Chrome or Edge.</p>'}
        <p class="error-text" data-err></p>
      </div></div>`;
    const root = $('hub-app');
    const err = (e) => { root.querySelector('[data-err]').textContent = e.message || String(e); };
    const useFolder = async (handle, label) => {
      let perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') return err(new Error('Permission to the folder was not granted.'));
      ls.del('storage');
      await rememberFolder(handle, label);
      if (opts.closable) return location.reload(); // modules boot once per page; a reload starts them on the new folder
      Object.assign(folder, { mode: 'folder', handle, label });
      start();
    };
    root.addEventListener('click', async (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      try {
        if (t.matches('[data-recent]')) { const r = recent[Number(t.dataset.recent)]; return await useFolder(r.handle, r.label); }
        if (t.matches('[data-forget]')) {
          await forgetFolder(Number(t.dataset.forget));
          const saved = await idb.get('folder').catch(() => null);
          return connectScreen(Object.assign({}, opts, { restored: restored && saved ? restored : null }));
        }
        if (t.matches('[data-reconnect]')) return await useFolder(restored.handle, restored.label);
        if (t.matches('[data-pick]')) {
          const picked = await window.showDirectoryPicker({ id: 'hub-data', mode: 'readwrite' });
          return await useFolder(picked, picked.name);
        }
        if (t.matches('[data-browser]')) {
          ls.set('storage', 'browser');
          if (opts.closable) return location.reload();
          Object.assign(folder, { mode: 'browser', handle: null, label: 'This browser' });
          return start();
        }
        if (t.matches('[data-cancel]')) return location.reload();
      } catch (ex) { if (ex.name !== 'AbortError') err(ex); }
    });
  }

  // ---------- frame ----------
  function frame() {
    $('hub-app').innerHTML = `
      <nav id="hub-nav" class="hub-nav">
        <div class="hub-nav-header">
          <a id="hub-home" class="hub-nav-home" href="${HOME}" title="Home">${icon(ICON.home)}</a>
          <div class="hub-nav-expand"><span id="hub-nav-title" class="hub-nav-title"></span></div>
        </div>
        <div id="hub-nav-items" class="hub-nav-items"></div>
        <div id="hub-nav-foot" class="hub-nav-items hub-nav-foot"></div>
      </nav>
      <div class="hub-nav-overlay"></div>
      <div class="hub-main">
        <header class="hub-topbar">
          <div id="hub-breadcrumb" class="hub-breadcrumb"></div>
          <div class="hub-topbar-right">
            <span id="hub-status" class="hub-status"></span>
            <span id="hub-actions" class="hub-actions"></span>
            <div class="hub-search">
              ${icon(ICON.search)}
              <input id="hub-search" type="search" placeholder="Search" autocomplete="off" aria-label="Search">
              <div id="hub-search-results" class="hub-search-results" hidden></div>
            </div>
            <button id="hub-folder-btn" class="hub-folder-btn" title="Data folder: click to switch">${icon(ICON.folder)}<span>${esc(folder.label)}</span></button>
            <button id="hub-settings-btn" class="icon-btn" title="Settings" aria-label="Settings">${icon(ICON.gear)}</button>
          </div>
        </header>
        <div class="hub-title-bar"><h1 id="hub-title" class="hub-page-title"></h1><span id="hub-meta" class="hub-title-meta"></span></div>
        <main id="hub-content" class="hub-content"></main>
      </div>`;

    $('hub-folder-btn').addEventListener('click', Hub.switchFolder);
    $('hub-actions').addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      const a = b && actionsOf(current && current.module).find((x) => x.key === b.dataset.action);
      if (a && a.onClick) a.onClick(b);
    });
    $('hub-settings-btn').addEventListener('click', openSettings);
    wireSearch();
  }

  // Inside a module the rail lists its pages; on Home it lists the modules.
  function renderNav() {
    const m = current.module;
    const link = (href, label, ico, active, count) => `<a class="hub-nav-item${active ? ' active' : ''}" href="${href}" title="${esc(label)}">
          <span class="hub-nav-icon">${ico}</span><span class="hub-nav-label">${esc(label)}</span>${count ? `<span class="hub-nav-count">${esc(count)}</span>` : ''}</a>`;
    const item = (n) => (n.sep ? `<div class="hub-nav-sep">${esc(n.sep)}</div>` : link(Hub.href(m.key, n.key), n.label, icon(n.icon), current.page === n.key, n.count));
    $('hub-nav-items').innerHTML = m ? navOf(m).map(item).join('') : modules.map((x) => link(Hub.href(x.key), x.label, moduleIcon(x), false)).join('');
    $('hub-nav-foot').innerHTML = m ? footOf(m).map(item).join('') : '';
    $('hub-nav-title').textContent = m ? m.label : APP_TITLE;
    $('hub-home').classList.toggle('active', !m);
  }
  const moduleIcon = (m) => (m.icon ? icon(m.icon) : `<span class="brand-mark small">${esc(m.mark || m.label.slice(0, 2))}</span>`);
  Hub.refreshNav = () => { if (current && $('hub-nav-items')) renderNav(); };

  function pageLabel(m, key) { const n = pagesOf(m).find((x) => x.key === key); return n ? n.label : key; }

  function renderHeader() {
    const m = current.module;
    Hub.setMeta('');
    renderActions();
    if (!m) {
      $('hub-title').textContent = 'Home';
      $('hub-breadcrumb').innerHTML = '<span class="hub-breadcrumb-current">Home</span>';
      document.title = APP_TITLE;
      renderStatus();
      return;
    }
    const title = (m.title && m.status === 'ready' && m.title(current)) || pageLabel(m, current.page);
    $('hub-title').textContent = title;
    $('hub-breadcrumb').innerHTML = `${multi() ? `<a class="hub-breadcrumb-link" href="${HOME}">Home</a><span class="hub-breadcrumb-sep">/</span>` : ''}<a class="hub-breadcrumb-link" href="${Hub.href(m.key)}">${esc(m.label)}</a><span class="hub-breadcrumb-sep">/</span><span class="hub-breadcrumb-current">${esc(title)}</span>`;
    document.title = title + ' - ' + APP_TITLE;
    renderStatus();
  }

  // Top-bar buttons a module adds while it is open: [{ key, icon, title, dot, onClick(button) }].
  function renderActions() {
    const el = $('hub-actions');
    if (!el || !current) return;
    el.innerHTML = actionsOf(current.module).map((a) => `<button class="icon-btn hub-action${a.dot ? ' has-dot' : ''}" data-action="${esc(a.key)}" title="${esc(a.title || '')}" aria-label="${esc(a.title || a.key)}">${icon(a.icon === 'refresh' ? ICON.refresh : a.icon)}</button>`).join('');
  }
  Hub.refreshActions = renderActions;

  // A short count or note beside the page title (e.g. "12 projects"), set by the module per page.
  Hub.setMeta = (text) => { const el = $('hub-meta'); if (el) el.textContent = text || ''; };

  // A module's status line (e.g. "Saved") shows in the top bar while that module is open.
  const statuses = {};
  Hub.setStatus = (moduleKey, text, tone) => { statuses[moduleKey] = { text, tone }; renderStatus(); };
  function renderStatus() {
    const el = $('hub-status');
    if (!el || !current) return;
    const s = (current.module && statuses[current.module.key]) || {};
    el.textContent = s.text || '';
    el.className = 'hub-status' + (s.tone ? ' tone-' + s.tone : '');
  }

  // ---------- router: #/home, or #/<module>/<page>/<id>/<sub> ----------
  // With one module (an app opened on its own) there is no Home: the house goes to its first page.
  let current = null;
  const multi = () => modules.length > 1;
  const HOME_HASH = '#/home';
  let HOME = HOME_HASH;
  function parse() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (parts[0] === 'home' && multi()) return { module: null, page: 'home' };
    const m = modules.find((x) => x.key === parts[0]);
    if (!m) return null;
    return { module: m, page: parts[1] || null, id: parts[2] || null, sub: parts[3] || null };
  }
  function firstPage(m) { const p = pagesOf(m)[0]; return Hub.href(m.key, p ? p.key : 'home'); }
  function route() {
    const r = parse();
    if (!r || !r.page) {
      location.replace(r ? firstPage(r.module) : multi() ? HOME_HASH : firstPage(modules[0]));
      return;
    }
    const same = current && current.module === r.module && current.page === r.page && current.sub === r.sub;
    current = r;
    renderNav();
    renderHeader();
    const m = r.module;
    if (!m) { ui.drawer.close(true); renderHome(); return; }
    if (m.status === 'ready' && same && m.select) { m.select(r); return; }
    ui.drawer.close(true);
    const content = $('hub-content');
    const root = document.createElement('div');
    root.className = 'view view-' + m.key + ' view-' + m.key + '-' + r.page;
    content.replaceChildren(root);
    content.scrollTop = 0;
    if (m.status !== 'ready') { stateCard(root, m); return; }
    try {
      m.render(root, r);
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="error-box"><h2>This page failed to render</h2><pre>${esc(e.stack || e.message)}</pre></div>`;
    }
  }
  Hub.rerender = () => { current = null; route(); };
  Hub.currentRoute = () => current;
  Hub.go = (hash) => { if (location.hash === hash) Hub.rerender(); else location.hash = hash; };

  // Home: one card per module. Opening a card goes to that module's first page.
  function renderHome() {
    const content = $('hub-content');
    const root = document.createElement('div');
    root.className = 'view view-home';
    const state = (m) => ({ ready: folder.label, 'not-set-up': 'Not set up in ' + folder.label, 'needs-folder': 'Needs a folder', error: 'Could not open' }[m.status] || '');
    root.innerHTML = `<div class="hub-home-grid">${modules.map((m) => `
      <a class="card hub-home-card" href="${Hub.href(m.key)}">
        <span class="hub-home-icon">${moduleIcon(m)}</span>
        <span class="hub-home-text"><b>${esc(m.label)}</b>${m.description ? `<span class="fine">${esc(m.description)}</span>` : ''}</span>
        <span class="badge tone-${m.status === 'ready' ? 'muted' : m.status === 'error' ? 'bad' : 'warn'}">${esc(state(m))}</span>
      </a>`).join('')}</div>`;
    content.replaceChildren(root);
    content.scrollTop = 0;
  }

  // What a module shows when it has no data folder, or failed to open.
  async function stateCard(root, m) {
    const d = m.data || {};
    // The chosen folder may itself be another app's data folder: never set up inside it.
    const owner = m.status === 'not-set-up' && folder.handle ? await otherAppFolder(m, folder.handle) : null;
    const body = {
      'not-set-up': owner
        ? `<p>"${esc(folder.label)}" is the ${esc(owner)} data folder. Choose the folder that holds it (normally the company folder) to use ${esc(m.label)} too.</p>
           <div class="btn-row"><button class="btn primary" data-switch>Choose folder...</button></div>`
        : `<p>No ${esc(m.label)} data in "${esc(folder.label)}" yet. Setting up creates the folder <code>${esc(d.folder)}</code> inside it.</p>
           <div class="btn-row"><button class="btn primary" data-setup>Set up here</button><button class="btn" data-switch>Choose another folder...</button></div>`,
      'needs-folder': `<p>${esc(m.label)} saves to a folder, not browser storage.</p>
           <div class="btn-row"><button class="btn primary" data-switch>Choose folder...</button></div>`,
      error: `<div class="error-box"><pre>${esc(m.error && (m.error.message || m.error))}</pre></div>`,
    }[m.status] || '';
    root.innerHTML = `<section class="card state-card"><div class="card-head"><h2>${esc(m.label)}</h2></div>${body}<p class="error-text" data-err></p></section>`;
    ui.on(root, 'click', '[data-switch]', () => Hub.switchFolder());
    ui.on(root, 'click', '[data-setup]', async () => {
      try {
        const name = await ui.promptText({ title: 'Set up ' + m.label, label: 'Name', value: folder.label });
        if (!name) return;
        m.dir = await setUpDataFolder(d, folder.handle, name);
        await openModule(m);
        Hub.rerender();
      } catch (e) { root.querySelector('[data-err]').textContent = e.message || String(e); }
    });
  }

  // ---------- search (each module answers for itself) ----------
  function wireSearch() {
    const input = $('hub-search');
    const box = $('hub-search-results');
    const show = () => {
      const q = input.value.trim();
      if (!q) { box.hidden = true; return; }
      const groups = modules.filter((m) => m.status === 'ready' && m.search).map((m) => ({ m, hits: m.search(q) || [] })).filter((g) => g.hits.length);
      box.innerHTML = groups.length
        ? groups.map((g) => `${modules.length > 1 ? `<div class="sr-group">${esc(g.m.label)}</div>` : ''}${g.hits.map((h) => `<a class="sr" href="${esc(h.href)}">${h.id ? `<span class="sr-id">${esc(h.id)}</span>` : ''}<span class="sr-text">${esc(h.text)}</span><span class="sr-meta">${esc(h.meta || '')}</span></a>`).join('')}`).join('')
        : '<div class="sr-empty">No matches</div>';
      const first = box.querySelector('.sr');
      if (first) first.classList.add('first');
      box.hidden = false;
    };
    input.addEventListener('input', show);
    input.addEventListener('focus', show);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const a = box.querySelector('.sr'); if (a) { location.hash = a.getAttribute('href'); box.hidden = true; input.value = ''; input.blur(); } }
      if (e.key === 'Escape') { e.stopPropagation(); input.value = ''; box.hidden = true; input.blur(); }
    });
    box.addEventListener('click', () => { box.hidden = true; input.value = ''; });
    document.addEventListener('click', (e) => { if (!e.target.closest('.hub-search')) box.hidden = true; });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); input.focus(); }
    });
  }

  // ---------- settings ----------
  function openSettings() {
    const choice = themeChoice();
    const opts = [{ key: 'system', label: 'Match system' }].concat(Hub.themes);
    const body = ui.el(`<div>
      <div class="field"><span>Theme</span><div class="seg">${opts.map((t) => `<button class="seg-btn${t.key === choice ? ' on tone-muted' : ''}" data-theme="${t.key}">${esc(t.label)}</button>`).join('')}</div></div>
      <div class="field"><span>Data folder</span><div class="hub-settings-row"><b>${esc(folder.label)}</b><button class="btn small" data-switch>Switch folder...</button></div></div>
      <p class="fine">Hub ${esc(Hub.version)}</p></div>`);
    ui.on(body, 'click', '[data-theme]', (e, b) => {
      Hub.setTheme(b.dataset.theme);
      body.querySelectorAll('[data-theme]').forEach((x) => { x.className = 'seg-btn' + (x === b ? ' on tone-muted' : ''); });
    });
    const m = ui.modal({ title: 'Settings', body });
    ui.on(body, 'click', '[data-switch]', () => { m.close(); Hub.switchFolder(); });
  }

  // ---------- boot ----------
  let started = false;
  async function start() {
    await resolveModules();
    for (const m of modules) if (m.status === 'open') await openModule(m);
    HOME = multi() ? HOME_HASH : firstPage(modules[0]);
    frame();
    if (!started) {
      started = true;
      window.addEventListener('hashchange', route);
      window.addEventListener('beforeunload', (e) => {
        if (modules.some((m) => m.status === 'ready' && m.isDirty && m.isDirty())) { flushAll(); e.preventDefault(); e.returnValue = ''; }
      });
    }
    current = null;
    route();
    window.dispatchEvent(new Event('hub:started'));
  }

  async function boot() {
    if (loadFailed.length || !modules.length) {
      $('hub-app').innerHTML = `<div class="connect"><div class="connect-card"><h1>${esc(APP_TITLE)}</h1>
        ${loadFailed.length ? `<p>These modules could not be loaded. Check the paths in <code>HUB_CONFIG</code> on this page:</p><ul>${loadFailed.map((s) => `<li><code>${esc(s)}</code></li>`).join('')}</ul>` : '<p>No modules are configured. List them in <code>HUB_CONFIG</code> on this page.</p>'}
      </div></div>`;
      if (!modules.length) return;
      window.addEventListener('hub:started', () => ui.toast('Could not load: ' + loadFailed.join(', '), 'bad'), { once: true });
    }
    if (ls.get('storage') === 'browser') {
      Object.assign(folder, { mode: 'browser', handle: null, label: 'This browser' });
      return start();
    }
    if (canPick()) {
      let saved = null;
      try { saved = await idb.get('folder'); } catch (e) { console.warn(e); }
      if (saved) {
        let perm = 'denied';
        try { perm = await saved.handle.queryPermission({ mode: 'readwrite' }); } catch (e) { console.warn(e); }
        if (perm === 'granted') {
          Object.assign(folder, { mode: 'folder', handle: saved.handle, label: saved.label });
          return start();
        }
        return connectScreen({ restored: saved });
      }
    }
    connectScreen({});
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
