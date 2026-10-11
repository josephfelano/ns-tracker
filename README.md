# NS Implementation Tracker

A local, no-install app for running a NetSuite implementation: discovery interviews, the decision register, build layers, module scoping, prework and the file checklist, all linked so any decision can be traced back to the answers behind it.

## Quick start

1. Clone this repo anywhere.
2. Open `index.html` in Chrome or Edge.
3. Choose a folder. A folder that already holds a tracker opens; any other folder gets an `ns-tracker` folder set up inside it.

Nothing is installed and nothing is sent anywhere. Each implementation is just a folder, so one copy of the app serves any number of them; switch from Settings.

**Design rule:** clone, open, pick a folder, go. No build step, no dependencies, no server, no workspace layout required. Any change that would add a setup step needs a very good reason.

## Two kinds of data, kept apart

| | What | Where | Owner |
|---|---|---|---|
| **Question bank** | 187 questions, 87 decisions, 8 build layers, one-way doors, module scoping, prework and file checklist templates | `bank/*.json` in this repo (bundled into `app/bank.js`) | This repo |
| **Implementation data** | Answers, decisions made, people, interviews, prework entries, system tables, files, activity log | A data folder you choose on first launch, one JSON file per area | Whoever's implementation it is |

The app never writes into this repo. Choosing a folder: one with `tracker.json` is used as is; one containing `ns-tracker/` uses that; any other gets `ns-tracker/` created inside it. So pointing every tool at the same company folder (for example `dev\lemme`) keeps each tool's data side by side. Recent folders are remembered, so switching is one click (Settings > Switch data folder).

Data folder files: `tracker.json`, `people.json`, `interviews.json`, `answers.json`, `decisions.json`, `scoping.json`, `prework.json`, `tables.json`, `files.json`, `activity.json`. They are plain, pretty-printed JSON keyed by bank IDs (`FIN-4c`, `D-013`, `M-02`, `PW-D01`, `F-01`), so they diff cleanly in git and Claude can read or edit them directly. If a file is edited outside the app while it is open, the app reloads it when the window regains focus, or asks before overwriting.

## Importing the prework workbook

Prework > **Import prework workbook...** reads the filled-in prework `.xlsx` in the browser (no install) and shows exactly what would change before applying it. Rows match bank items by their text, so a reordered workbook still lands correctly. Filled cells set values; empty cells never clear what is already in the tracker. Owner names become People (matched case-insensitively). Re-importing the same file changes nothing.

## Storage

The app talks to storage through one adapter interface (`app/store.js`):

- **Folder** (default): the File System Access API. Chrome and Edge only. The app remembers the folder; after a browser restart it asks once to reconnect.
- **Browser storage** (fallback): `localStorage`, this browser only. Use Settings > Download a snapshot to back it up, and Import a snapshot to move it into a folder.

A hosted backend would be a third adapter. The views do not change.

## Rebuilding the bank

The bank is generated from the source workbooks, with corrections applied by the builder and logged in `bank/CORRECTIONS.md`:

```
python -I tools/build_bank.py --source <folder with the workbooks>
node tools/check_bank.js
node tools/bundle_bank.js
```

`check_bank.js` verifies every cross-reference, ID, enum and expected count and exits non-zero on failure. `bundle_bank.js` regenerates `app/bank.js` (browsers block `fetch()` from `file://`, so the bank ships as a script). Never edit `app/bank.js` or `CORRECTIONS.md` by hand.

## Code layout

Plain HTML, CSS and JavaScript with no build step and no dependencies. Classic `<script>` tags in dependency order, because ES modules do not load from `file://`.

| File | Does |
|---|---|
| `app/core.js` | Utilities, bank indexes (question -> decisions, layers, scoping, prework), status semantics, derived metrics and gates |
| `app/store.js` | Instance state, adapters, debounced saves, outside-edit detection, activity log, mutations |
| `app/ui.js` | Shared components: badges, selects, editable table, drawer, modal, toast |
| `app/views-core.js` | Overview, Questions, Decisions, Build layers, Module scoping, question and decision editors |
| `app/xlsx.js` | Minimal .xlsx reader (zip + XML, browser built-ins only) |
| `app/import-prework.js` | Prework workbook import: plan (no writes), then apply |
| `app/views-work.js` | Interview, Prework, Systems & files, People, Activity, Settings |
| `app/app.js` | Shell: navigation, router, search, theme, connect screen |
