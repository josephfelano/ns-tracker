# Shell

The shared frame, styling and UI services that Mission Control and the NS tracker both run on, so the two apps look and work the same: icon rail, top bar with search and the data folder, title bar, light/dark themes, folder picking, and `Hub.ui` (toast, modal, confirm, prompt, drawer, tabs).

**This folder is an identical copy in both repos** (`mission-control/shell/` and `ns-tracker/shell/`). There is no source repo: change it in one, copy the folder to the other, then check:

```
node tools/check-shell.js ../ns-tracker        (from mission-control)
node tools/check-shell.js ../mission-control   (from ns-tracker)
```

It exits non-zero and lists the files that differ. Never commit one repo's shell change without the other's.

Classic scripts, no build step, no dependencies: it runs from `file://`.

## How an app uses it

The app's HTML page sets the config, loads the shell, and the shell loads the app's `module.js`:

```html
<script>window.HUB_CONFIG = { modules: ['module.js'] };</script>
<script src="shell/hub.js"></script>
...
<div id="hub-app"></div>
```

`module.js` writes the app's stylesheet and scripts (with `document.write`, so they run in order from `file://`), and one of those scripts calls:

```js
Hub.defineModule({
  key: 'tracker',                  // routes are #/<key>/<page>/<id>/<sub>
  label: 'Implementation tracker', // rail header and breadcrumb
  mark: 'NS',
  icon: 'M9 4h6v3H9z...',          // SVG path or inner SVG markup
  nav: () => [{ key, label, icon, count }, { sep: 'Section' }],  // array or function
  footNav: [{ key, label, icon }], // pinned to the bottom of the rail
  actions: () => [{ key, icon, title, dot, onClick }], // top-bar buttons
  data: {                          // omit if the app keeps no data
    folder: 'ns-tracker',          // its folder inside a company folder
    marker: 'tracker.json',        // the file that marks a data folder
    template: (name) => [{ path, content }], // what a new data folder contains ('dir/' = empty folder)
    browser: true,                 // optional: can fall back to browser storage
  },
  open: async ({ dir, label, browser }) => {}, // load data once the folder is known
  render(root, route) {},          // draw a page into root (a fresh element per navigation)
  select(route) {},                // optional: same page, new id (e.g. open a drawer)
  title: (route) => '...' | null,  // optional: override the page title
  search: (q) => [{ id, text, meta, href }],
  flush: async () => {},           // write anything pending before the page goes away
  isDirty: () => false,
});
```

The shell provides `Hub.ui` (`on`, `el`, `toast`, `modal`, `confirm`, `promptText`, `drawer`, `tabs`), `Hub.href(module, path)`, `Hub.go`, `Hub.rerender`, `Hub.currentRoute`, `Hub.refreshNav`, `Hub.refreshActions`, `Hub.setMeta(text)` (a count beside the page title), `Hub.setStatus(module, text, tone)`, `Hub.switchFolder`, `Hub.fs` (folder helpers) and `Hub.icon`.

## Data folders: one rule for every app

You choose a folder, normally the company folder (`~/dev/<company>`). The browser remembers it and the last few folders (IndexedDB), so both apps open the same folder next time and switching is one click (the folder button in the top bar, or Settings).

Each app finds its own data folder in it the same way:

1. the chosen folder has the app's marker file: it is the app's data folder;
2. the chosen folder contains `<folder>/` with the marker: use that;
3. otherwise the page shows **Set up here**: it asks for a name (default: the chosen folder's name) and creates `<chosen>/<folder>/` from the app's template, never overwriting an existing file.

| App | Folder | Marker | Template |
|---|---|---|---|
| Mission Control | `mission-control/` | `mission-control.json` | `tools/lib/mc-template.js` |
| NS tracker | `ns-tracker/` | `tracker.json` | `templateFiles` in `app/store.js` |

The Node setup tools (`mission-control/tools/use-company.js`) write the same files, so a company folder set up from the command line or from either page opens identically.

## Styling

`hub.css` holds the chrome and the shared components (buttons, badges, cards, tables, tabs, chips, inputs, drawer, modal, toast), written only against tokens. Base element styles (inputs, selects) have zero specificity, so an app's own rule always wins. An app's stylesheet adds page-specific rules only.

`themes/<key>.css` holds tokens only, on `.hub-root`; one is linked at a time and Settings switches it (or follows the system). Every theme defines the same set; `light.css` is the reference.
