// The tracker as an app on the shared shell: navigation, routing into views, search, save status
// and outside-edit handling. The frame, data folder, themes and shared UI come from the shell
// (shell/, an identical copy in mission-control - see shell/README.md).
(function () {
  'use strict';
  const T = window.T;
  const { esc, ui, store } = T;
  T.views = T.views || {};

  const KEY = 'tracker';
  T.href = (path) => Hub.href(KEY, path); // '#/tracker/<path>'

  const NAV = [
    { key: 'overview', label: 'Overview', icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
    { key: 'interview', label: 'Interview', icon: 'M4 5h16v10H8l-4 4z' },
    { key: 'how-it-runs', label: 'How it runs', icon: 'M3 5h6v5H3zM15 14h6v5h-6zM6 10v6.5h9' },
    { key: 'questions', label: 'Questions', icon: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14M12 17.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
    { key: 'decisions', label: 'Decisions', icon: 'M6 3v18M6 5h11l-2 4 2 4H6' },
    { key: 'guide', label: 'Implementation guide', icon: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5' },
    { key: 'scoping', label: 'Module scoping', icon: 'M4 6h16M4 12h16M4 18h10' },
    { sep: 'Collect' },
    { key: 'prework', label: 'Prework', icon: 'M6 3h9l5 5v13H6zM14 3v6h6' },
    { key: 'collect', label: 'Systems & files', icon: 'M4 5h16v4H4zM4 11h16v4H4zM4 17h16v4H4z' },
    { key: 'people', label: 'People', icon: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { key: 'activity', label: 'Activity', icon: 'M3 12h4l3-8 4 16 3-8h4' },
  ];
  const FOOT = [
    { key: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 .5-1.5-1.5.5-2-4-2-1 2h-2l-1-2-4 2 .5 2L5 7.5 3 7l-2 4 2 1v0' },
  ];

  function nav() {
    const m = T.metrics(store.state);
    const counts = {
      questions: `${m.qDone}/${m.qTotal}`,
      decisions: `${m.dDone}/${m.dTotal}`,
      scoping: `${m.scopingDone}/${m.scopingTotal}`,
      people: store.state.people.length || '',
    };
    // "How <company> runs": the folder that was picked is normally the company's.
    const company = store.adapter && store.adapter.kind === 'folder' ? store.adapter.label : '';
    return NAV.map((n) => (n.key === 'how-it-runs' && company ? Object.assign({}, n, { label: `How ${company} runs` }) : n))
      .map((n) => (counts[n.key] ? Object.assign({ count: counts[n.key] }, n) : n));
  }

  function saveStatus() {
    if (!store.adapter) return;
    // Where the data is saved is shown in the header (folder button), so a finished save shows nothing.
    const map = {
      pending: ['Unsaved changes...', ''],
      saving: ['Saving...', ''],
      saved: ['', ''],
      error: ['Save failed: ' + (store.lastError ? store.lastError.message : ''), 'bad'],
      idle: ['', ''],
    };
    const [text, tone] = map[store.saveState] || map.idle;
    Hub.setStatus(KEY, text, tone);
  }

  // A route from the shell is { page, id, sub }; the views know it as { view, id, sub }.
  const toView = (r) => ({ view: r.page, id: r.id, sub: r.sub });
  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const hit = (s) => s && s.toLowerCase().includes(q);
    const qs = T.bank.questions.filter((x) => x.id.toLowerCase().startsWith(q) || hit(x.text) || hit((store.state.answers[x.id] || {}).answer))
      .map((x) => ({ id: x.id, text: x.text, meta: x.section, href: T.href('questions/' + encodeURIComponent(x.id)) }));
    const ds = T.bank.decisions.filter((x) => x.id.toLowerCase().startsWith(q) || hit(x.decides) || hit(x.nsSetting) || hit(x.area))
      .map((x) => ({ id: x.id, text: x.decides, meta: x.area + ' - ' + x.decideBy, href: T.href('decisions/' + encodeURIComponent(x.id)) }));
    return ds.concat(qs).slice(0, 14);
  }

  // ---------- outside edits (Claude or a person changed a file while the app was open) ----------
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

  let navTimer = null;
  function onStoreEvent(what) {
    saveStatus();
    if (what === 'load' || what === 'reload') { T.rerender(); return; }
    if (what === 'conflict') { onConflict(store.lastError.collection); return; }
    clearTimeout(navTimer);
    navTimer = setTimeout(Hub.refreshNav, 250);
  }

  // A page's tabs stick to the top while it scrolls, and table headers stick just under them.
  // --tabs-h (the tabs' height) and --stick-pad (the scroller's top padding) set the offsets
  // (styles.css: .sticky-tabs).
  let tabsObserver = null;
  function stickyTabs(root) {
    if (tabsObserver) { tabsObserver.disconnect(); tabsObserver = null; }
    const tabs = root.querySelector(':scope > .tabs');
    root.classList.toggle('sticky-tabs', !!tabs);
    if (!tabs) return;
    const set = () => {
      root.style.setProperty('--stick-pad', getComputedStyle(root.parentElement).paddingTop);
      root.style.setProperty('--tabs-h', tabs.getBoundingClientRect().height + 'px');
    };
    set();
    tabsObserver = new ResizeObserver(set);
    tabsObserver.observe(tabs);
  }

  // Re-render only while a tracker page is the one on screen.
  T.rerender = () => { const r = Hub.currentRoute(); if (r && r.module && r.module.key === KEY) Hub.rerender(); };
  T.go = (hash) => Hub.go(hash);

  Hub.defineModule({
    key: KEY,
    label: 'Implementation tracker',
    mark: 'NS',
    icon: 'M9 4h6v3H9zM8 5H6v16h12V5h-2M9 13l2 2 4-4',
    description: 'Discovery, decisions and the implementation guide for a NetSuite implementation',
    nav,
    footNav: FOOT,
    // Found, remembered and set up by the shell's one folder rule (shell/hub.js).
    data: {
      folder: 'ns-tracker',
      marker: 'tracker.json',
      browser: true,
      template: (name) => store.templateFiles(name),
    },
    async open(ctx) {
      const adapter = ctx.browser ? new store.BrowserAdapter() : new store.FolderAdapter(ctx.dir, ctx.label);
      const status = await adapter.init(false);
      if (status === 'needs-permission') throw new Error('Permission to the data folder was not granted.');
      await store.loadAll(adapter, status);
      store.onChange(onStoreEvent);
      window.addEventListener('focus', checkOutsideEdits);
      saveStatus();
    },
    title: (r) => (r.page === 'overview' ? store.state.tracker.name || 'Overview' : null),
    render(root, r) {
      const view = T.views[r.page];
      if (!view) { root.innerHTML = '<p class="fine">No such page.</p>'; return; }
      view.render(root, toView(r));
      stickyTabs(root);
    },
    select(r) {
      const view = T.views[r.page];
      if (view && view.select) view.select(toView(r)); else Hub.rerender();
    },
    search,
    flush: () => store.flushAll(),
    isDirty: () => store.dirty.size > 0,
  });
})();
