// App shell: layout, navigation, router, save status, connect screen, outside-edit handling.
(function () {
  'use strict';
  const T = window.T;
  const { esc, ui, store } = T;
  T.views = T.views || {};

  const NAV = [
    { key: 'overview', label: 'Overview', icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
    { key: 'interview', label: 'Interview', icon: 'M4 5h16v10H8l-4 4z' },
    { key: 'questions', label: 'Questions', icon: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14M12 17.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
    { key: 'decisions', label: 'Decisions', icon: 'M6 3v18M6 5h11l-2 4 2 4H6' },
    { key: 'layers', label: 'Build layers', icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5' },
    { key: 'scoping', label: 'Module scoping', icon: 'M4 6h16M4 12h16M4 18h10' },
    { sep: 'Collect' },
    { key: 'prework', label: 'Prework', icon: 'M6 3h9l5 5v13H6zM14 3v6h6' },
    { key: 'collect', label: 'Systems & files', icon: 'M4 5h16v4H4zM4 11h16v4H4zM4 17h16v4H4z' },
    { key: 'people', label: 'People', icon: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { key: 'activity', label: 'Activity', icon: 'M3 12h4l3-8 4 16 3-8h4' },
  ];
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;

  let currentRoute = null;

  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    const [view, ...rest] = h.split('/').map(decodeURIComponent);
    return { view: view || 'overview', id: rest[0] || null, sub: rest[1] || null };
  }

  // ---------- frame ----------
  function frame() {
    document.getElementById('app').innerHTML = `
      <aside class="rail">
        <div class="brand"><div class="brand-mark">NS</div><div><div class="brand-name" id="proj-name"></div><div class="brand-sub">Implementation tracker</div></div></div>
        <nav class="nav" id="nav"></nav>
        <div class="rail-foot">
          <a class="nav-item" href="#/settings" data-key="settings">${svg('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 .5-1.5-1.5.5-2-4-2-1 2h-2l-1-2-4 2 .5 2L5 7.5 3 7l-2 4 2 1v0')}<span>Settings</span></a>
        </div>
      </aside>
      <div class="main-col">
        <header class="topbar">
          <div class="search"><input id="gsearch" type="search" placeholder="Search questions and decisions (ID or words)" autocomplete="off" aria-label="Search"><div id="gresults" class="search-results" hidden></div></div>
          <div class="top-right">
            <span id="savestate" class="savestate"></span>
            <button class="icon-btn" id="theme-btn" title="Toggle light / dark" aria-label="Toggle theme">${svg('M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z')}</button>
          </div>
        </header>
        <main id="main" class="main"></main>
      </div>`;
    wireSearch();
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  }

  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const m = T.metrics(store.state);
    const counts = {
      questions: `${m.qDone}/${m.qTotal}`,
      decisions: `${m.dDone}/${m.dTotal}`,
      scoping: `${m.scopingDone}/${m.scopingTotal}`,
      people: store.state.people.length || '',
    };
    nav.innerHTML = NAV.map((n) => n.sep
      ? `<div class="nav-sep">${esc(n.sep)}</div>`
      : `<a class="nav-item${currentRoute && currentRoute.view === n.key ? ' active' : ''}" href="#/${n.key}" data-key="${n.key}">${svg(n.icon)}<span>${esc(n.label)}</span>${counts[n.key] ? `<span class="nav-count">${counts[n.key]}</span>` : ''}</a>`).join('');
    document.querySelectorAll('.rail-foot .nav-item').forEach((a) => a.classList.toggle('active', currentRoute && currentRoute.view === a.dataset.key));
    document.getElementById('proj-name').textContent = store.state.tracker.name || 'NetSuite implementation';
  }

  function renderSaveState() {
    const el = document.getElementById('savestate');
    if (!el || !store.adapter) return;
    const where = store.adapter.kind === 'folder' ? 'folder "' + store.adapter.label + '"' : 'this browser only';
    const map = {
      pending: ['Unsaved changes...', 'muted'],
      saving: ['Saving...', 'muted'],
      saved: ['Saved to ' + where, store.adapter.kind === 'folder' ? 'ok' : 'warn'],
      error: ['Save failed: ' + (store.lastError ? store.lastError.message : ''), 'bad'],
      idle: ['', 'muted'],
    };
    const [text, tone] = map[store.saveState] || map.idle;
    el.textContent = text;
    el.className = 'savestate tone-' + tone;
  }

  // ---------- router ----------
  function route() {
    if (!store.adapter) return;
    const r = parseRoute();
    const view = T.views[r.view] || T.views.overview;
    const sameView = currentRoute && currentRoute.view === r.view && currentRoute.sub === r.sub;
    currentRoute = r;
    renderNav();
    if (sameView && view.select) {
      view.select(r); // e.g. open a drawer for a new id without re-rendering the list
      return;
    }
    ui.drawer.close(true);
    const main = document.getElementById('main');
    const root = document.createElement('div');
    root.className = 'view view-' + r.view;
    main.replaceChildren(root);
    try {
      view.render(root, r);
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="error-box"><h2>This view failed to render</h2><pre>${esc(e.stack || e.message)}</pre></div>`;
    }
    main.scrollTop = 0;
  }
  T.rerender = () => { currentRoute = null; route(); };
  T.go = (hash) => { if (location.hash === hash) T.rerender(); else location.hash = hash; };

  // ---------- global search ----------
  function wireSearch() {
    const input = document.getElementById('gsearch');
    const box = document.getElementById('gresults');
    const find = (q) => {
      q = q.trim().toLowerCase();
      if (!q) return [];
      const hit = (s) => s && s.toLowerCase().includes(q);
      const qs = T.bank.questions.filter((x) => x.id.toLowerCase().startsWith(q) || hit(x.text) || hit((store.state.answers[x.id] || {}).answer))
        .map((x) => ({ id: x.id, kind: 'questions', text: x.text, meta: x.section }));
      const ds = T.bank.decisions.filter((x) => x.id.toLowerCase().startsWith(q) || hit(x.decides) || hit(x.nsSetting) || hit(x.area))
        .map((x) => ({ id: x.id, kind: 'decisions', text: x.decides, meta: x.area + ' - ' + x.layer }));
      return ds.concat(qs).slice(0, 14);
    };
    const show = () => {
      const res = find(input.value);
      if (!input.value.trim()) { box.hidden = true; return; }
      box.innerHTML = res.length
        ? res.map((r, i) => `<a class="sr${i === 0 ? ' first' : ''}" href="#/${r.kind}/${encodeURIComponent(r.id)}"><span class="sr-id">${esc(r.id)}</span><span class="sr-text">${esc(r.text)}</span><span class="sr-meta">${esc(r.meta)}</span></a>`).join('')
        : '<div class="sr-empty">No matches</div>';
      box.hidden = false;
    };
    input.addEventListener('input', show);
    input.addEventListener('focus', show);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const a = box.querySelector('a'); if (a) { location.hash = a.getAttribute('href'); box.hidden = true; input.blur(); } }
      if (e.key === 'Escape') { input.value = ''; box.hidden = true; input.blur(); }
    });
    box.addEventListener('click', () => { box.hidden = true; input.value = ''; });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.target.closest('input, textarea, select')) { e.preventDefault(); input.focus(); }
    });
  }

  // ---------- theme (per-viewer convenience; storage may be unavailable) ----------
  function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('ns-tracker:theme', next); } catch (e) { /* fine */ }
  }
  try { applyTheme(localStorage.getItem('ns-tracker:theme')); } catch (e) { /* fine */ }

  // ---------- connect screen ----------
  async function connectScreen(restored, needsPermission) {
    const supported = store.FolderAdapter.supported();
    const recent = supported ? await store.FolderAdapter.recent() : [];
    document.getElementById('app').innerHTML = `
      <div class="connect"><div class="connect-card">
        <div class="brand-mark big">NS</div>
        <h1>Implementation tracker</h1>
        <p class="lead">Discovery answers, decisions and build progress for a NetSuite implementation.</p>
        <p>Your data is saved as JSON files in a folder you choose, kept separate from the app. Choose a folder: one that already holds a tracker opens straight away, any other folder gets an <code>ns-tracker</code> folder set up inside it.</p>
        ${recent.length ? `<div class="recent"><div class="nav-sep">Recent</div>${recent.map((r, i) => `<button class="recent-item" data-recent="${i}"><span>${esc(r.label)}</span><span class="fine mono">${esc(r.handle.name)}</span></button>`).join('')}</div>` : ''}
        <div class="connect-actions">
          ${restored && needsPermission ? `<button class="btn primary" id="reconnect">Reconnect to "${esc(restored.label)}"</button>` : ''}
          ${supported ? `<button class="btn${restored && needsPermission ? '' : ' primary'}" id="pick">Choose data folder...</button>` : ''}
          <button class="btn subtle" id="browser">Use browser storage instead</button>
        </div>
        ${supported ? '' : '<p class="warn-text">This browser cannot save to a folder. Open this page in Chrome or Edge to save files; browser storage keeps data in this browser only.</p>'}
        <p class="fine">Nothing is sent anywhere. The app runs entirely on this computer.</p>
        <div id="connect-err" class="error-text"></div>
      </div></div>`;
    const err = (e) => { document.getElementById('connect-err').textContent = e.message || String(e); };
    const go = async (adapter, fromGesture) => {
      try {
        const status = await adapter.init(fromGesture);
        if (status === 'needs-permission') return err(new Error('Permission to the folder was not granted.'));
        if (adapter.kind === 'folder') await adapter.remember();
        await store.loadAll(adapter, status);
        start();
      } catch (e) { if (e.name !== 'AbortError') err(e); }
    };
    document.querySelectorAll('[data-recent]').forEach((b) => b.addEventListener('click', () => {
      try { localStorage.removeItem('ns-tracker:adapter'); } catch (e) { /* fine */ }
      const r = recent[Number(b.dataset.recent)];
      go(new store.FolderAdapter(r.handle, r.label), true);
    }));
    const rc = document.getElementById('reconnect');
    if (rc) rc.addEventListener('click', () => go(restored, true));
    const pk = document.getElementById('pick');
    if (pk) pk.addEventListener('click', async () => {
      try {
        try { localStorage.removeItem('ns-tracker:adapter'); } catch (e) { /* fine */ }
        const picked = await store.FolderAdapter.pick();
        if (picked.adapter) return go(picked.adapter, true);
        const ok = await ui.confirm({
          title: 'Set up a new tracker',
          message: `Creates a folder "ns-tracker" inside "${picked.parent.name}" for this implementation's data. Your data stays there, on this computer.`,
          confirmLabel: 'Set up and open',
        });
        if (ok) go(await picked.setUp(), true);
      } catch (e) { if (e.name !== 'AbortError') err(e); }
    });
    document.getElementById('browser').addEventListener('click', () => {
      try { localStorage.setItem('ns-tracker:adapter', 'browser'); } catch (e) { /* fine */ }
      go(new store.BrowserAdapter(), true);
    });
  }

  // ---------- start ----------
  let started = false;
  function start() {
    frame();
    if (!started) {
      started = true;
      window.addEventListener('hashchange', route);
      store.onChange(onStoreEvent);
      window.addEventListener('focus', checkOutsideEdits);
      window.addEventListener('beforeunload', (e) => {
        if (store.dirty.size) { store.flushAll(); e.preventDefault(); e.returnValue = ''; }
      });
    }
    currentRoute = null;
    route();
    renderSaveState();
  }

  let navTimer = null;
  function onStoreEvent(what) {
    renderSaveState();
    if (what === 'load' || what === 'reload') { T.rerender(); return; }
    if (what === 'conflict') { onConflict(store.lastError.collection); return; }
    clearTimeout(navTimer);
    navTimer = setTimeout(renderNav, 250);
  }

  function onConflict(name) {
    ui.modal({
      title: name + '.json changed outside the app',
      body: `<p>Someone (or Claude) edited <code>${esc(name)}.json</code> in the data folder after the app loaded it.</p>
             <p><strong>Load from disk</strong> keeps the outside edit and drops your latest change in this area. <strong>Keep mine</strong> overwrites the file with what you see in the app.</p>`,
      actions: [
        { label: 'Keep mine', onClick: () => { store.forceWrite(name); } },
        { label: 'Load from disk', primary: true, onClick: () => { store.reload([name]).then(() => ui.toast('Loaded ' + name + '.json from disk', 'ok')); } },
      ],
    });
  }

  let checking = false;
  async function checkOutsideEdits() {
    if (checking || !store.adapter || store.adapter.kind !== 'folder') return;
    checking = true;
    try {
      const changed = (await store.adapter.changedOnDisk()).filter((n) => !store.dirty.has(n));
      if (changed.length) {
        await store.reload(changed);
        ui.toast('Loaded outside changes: ' + changed.map((n) => n + '.json').join(', '), 'ok');
      }
    } catch (e) { console.warn(e); } finally { checking = false; }
  }

  T.reconnect = () => connectScreen(null, false);

  async function boot() {
    let useBrowser = false;
    try { useBrowser = localStorage.getItem('ns-tracker:adapter') === 'browser'; } catch (e) { /* fine */ }
    if (useBrowser) {
      try {
        const b = new store.BrowserAdapter();
        await store.loadAll(b, await b.init());
        return start();
      } catch (e) { console.warn(e); }
    }
    const restored = store.FolderAdapter.supported() ? await store.FolderAdapter.restore() : null;
    if (restored) {
      try {
        const status = await restored.init(false);
        if (status !== 'needs-permission') {
          await store.loadAll(restored, status);
          return start();
        }
        return connectScreen(restored, true);
      } catch (e) {
        console.warn(e);
      }
    }
    connectScreen(null, false);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
