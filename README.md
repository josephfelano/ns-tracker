# NS Implementation Tracker

A local, no-install app for running a NetSuite implementation from scoping to go-live: discovery interviews, the decision register, the implementation guide, module scoping, prework and the file checklist. Each decision has answers to pick from; the answers drive the guide (features to enable, what to configure, what stops applying, one-way warnings, the quote checklist), and every decision traces back to the interview answers behind it.

## Quick start

1. Clone this repo anywhere.
2. Open `index.html` in Chrome or Edge.
3. Choose a folder. A folder that already holds a tracker opens; any other folder gets an `ns-tracker` folder set up inside it.

Nothing is installed and nothing is sent anywhere. Each implementation is just a folder, so one copy of the app serves any number of them; switch from the folder button in the top bar.

The tracker runs on the same shell as Mission Control (`shell/`, an identical copy in both repos), so the two look and work the same and remember the same folder.

**Design rule:** clone, open, pick a folder, go. No build step, no dependencies, no server, no workspace layout required. Any change that would add a setup step needs a very good reason.

## Two kinds of data, kept apart

| | What | Where | Owner |
|---|---|---|---|
| **Question bank** | Questions, decisions with their answer options, implementation steps, NetSuite features and their rules, sources, one-way doors, data load order, module scoping, prework and file checklist templates | `bank/*.json` in this repo (bundled into `app/bank.js`) | This repo |
| **Implementation data** | Answers, decisions made, people, interviews, prework entries, system tables, files, activity log | A data folder you choose on first launch, one JSON file per area | Whoever's implementation it is |

The app never writes into this repo. Choosing a folder: one with `tracker.json` is used as is; one containing `ns-tracker/` uses that; any other is offered an `ns-tracker/` folder set up inside it. So pointing every tool at the same company folder keeps each tool's data side by side. Recent folders are remembered, so switching is one click.

Data folder files: `tracker.json`, `people.json`, `interviews.json`, `answers.json`, `decisions.json`, `scoping.json`, `prework.json`, `tables.json`, `files.json`, `activity.json`. They are plain, pretty-printed JSON keyed by bank IDs (`FIN-4c`, `D-013`, `M-02`, `PW-D01`, `F-01`), so they diff cleanly in git and Claude can read or edit them directly. If a file is edited outside the app while it is open, the app reloads it when the window regains focus, or asks before overwriting.

## Importing the prework workbook

Prework > **Import prework workbook...** reads the filled-in prework `.xlsx` in the browser (no install) and shows exactly what would change before applying it. Rows match bank items by their text, so a reordered workbook still lands correctly. Filled cells set values; empty cells never clear what is already in the tracker. Owner names become People (matched case-insensitively). Re-importing the same file changes nothing.

## Storage

The app talks to storage through one adapter interface (`app/store.js`):

- **Folder** (default): the File System Access API. Chrome and Edge only. The app remembers the folder; after a browser restart it asks once to reconnect.
- **Browser storage** (fallback): `localStorage`, this browser only. Use Settings > Download a snapshot to back it up, and Import a snapshot to move it into a folder.

A hosted backend would be a third adapter. The views do not change.

## The bank

The bank files in `bank/` are the source: edit them directly, then run

```
node tools/check_bank.js
node tools/bundle_bank.js
```

`check_bank.js` verifies every reference (questions, decisions, features, sources, steps), the enums, that the feature rules have no requirement cycles, and that every NetSuite fact carries a source or an explicit unverified note; it exits non-zero on failure. `bundle_bank.js` regenerates `app/bank.js` (browsers block `fetch()` from `file://`, so the bank ships as a script). Never edit `app/bank.js` by hand. The bank was first imported from consultant workbooks; that import script and its corrections log are in git history. Research behind the content is in `research/`.

| File | Holds |
|---|---|
| `steps.json` | The implementation steps in order: Scoping and licensing, Kickoff, Discovery and design, build layers L0-L6, Testing, Training, L7 Cutover, Go-live and hypercare, Operate |
| `decisions.json` | Each decision: the questions that feed it, the step it must be decided by and the step it is built in, reversibility, and `input`: the answer type (yes/no, pick one, pick several, number, text) and options. Each option lists the setup it means (`does`), the features it turns on or leaves off, the decisions it makes not applicable, licence impact, warnings and sources |
| `features.json` | NetSuite features and their rules, once: what each requires, switches on, conflicts with, how it locks and whether it is licensed |
| `sources.json` | Every source behind a NetSuite fact (Oracle docs first), referenced by id |
| `loadOrder.json` | The order data is loaded in, with the method and step for each |
| `oneWayDoors.json` | Constraints to read before configuring, each with a kind (cannot be undone, locked once used, locked on the record, order, behaviour, recommendation, scope risk) |
| `questions.json`, `moduleScoping.json`, `prework.json`, `systemsTables.json`, `fileChecklist.json`, `meta.json` | Discovery questions, pre-quote asks, prework and file templates, enums |

**How answers drive the guide.** Chosen options turn features on, and the feature rules close over them (requires, switches on). A pick-one or yes/no decision whose answer NetSuite then fixes is shown as set, with the reason ("Multiple Currencies is required by OneWorld (D-001)"); an option those rules rule out is disabled; `makesNA` drops decisions that stop applying; conflicting features are flagged. Pick-several decisions are never forced, and a decision with `input.forceable: false` (an account default or policy) is never forced either; both still have options ruled out. Rules live only on features, never copied into options. The answer is saved as `choice` in the data folder's `decisions.json`.

## Code layout

Plain HTML, CSS and JavaScript with no build step and no dependencies. Classic `<script>` tags in dependency order, because ES modules do not load from `file://`.

| File | Does |
|---|---|
| `index.html` | The tracker on its own: the pinned hub shell plus this one module |
| `module.js` | Loads the tracker onto the shell (its stylesheet and scripts, in order); listed in `index.html` |
| `shell/` | The shared shell (frame, data folder, themes, shared components). Mission Control keeps an identical copy; change both and run `node tools/check-shell.js ../mission-control` (see `shell/README.md`) |
| `app/core.js` | Utilities, bank indexes (question -> decisions, steps, scoping, prework), status semantics, the decision logic (features on, forced answers, not applicable, conflicts), derived metrics and gates |
| `app/store.js` | Instance state, adapters, debounced saves, outside-edit detection, activity log, mutations |
| `app/ui.js` | Tracker helpers: badges, status selects, people pickers, editable table; re-exports the shell's toast, modal, drawer and tabs |
| `app/views-core.js` | Overview, Questions, Decisions, Implementation guide (page, print, Markdown export), Module scoping, question and decision editors, the answer picker |
| `app/xlsx.js` | Minimal .xlsx reader (zip + XML, browser built-ins only) |
| `app/import-prework.js` | Prework workbook import: plan (no writes), then apply |
| `app/views-work.js` | Interview, Prework, Systems & files, People, Activity, Settings |
| `app/app.js` | The module definition: navigation, routing into views, search, save status, outside-edit handling |
| `app/styles.css` | Tracker page styles only; tokens and shared components come from the shell |
