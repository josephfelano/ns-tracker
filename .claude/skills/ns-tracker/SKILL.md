---
name: ns-tracker
description: The NetSuite implementation tracker for the active company - discovery questions and answers, the decision register, interviews, people, prework, module scoping, systems and files, the implementation guide. Use when the user asks "what did we decide about X", "what's still open for discovery", "what do we need to ask finance", "log this answer", "what does the prework say about Y", "which features does that turn on", prepares or debriefs an interview, or asks to change the question bank itself.
---

# NS tracker

The app and the generic question bank are the `ns-tracker` core; each implementation's data is a folder. `ns-tracker/README.md` has the data split, file list and how answers drive the guide; read it before working here.

## Where

- Implementation data: `<company>/ns-tracker/*.json` for the active company (`workspace.json`): `answers.json`, `decisions.json`, `people.json`, `interviews.json`, `prework.json`, `scoping.json`, `tables.json`, `files.json`, `activity.json`.
- Question and decision text: `ns-tracker/bank/*.json`. Data files are keyed by bank ids (`FIN-4c`, `D-013`, `M-02`, `PW-D01`, `F-01`, `P-001`, `I-001`); join every id to the bank before quoting it.
- The app: `ns-tracker/index.html` (the user opens it and picks the company folder).

## Every time

1. **Answer from the files, with the ids.** Quote the bank text and the recorded answer; an empty answer means not answered yet, never a guess.
2. **Writes:** read freely. Write the data files only when the user asks you to record something, in the shape the app writes (it reloads outside edits). Otherwise point the user to the screen in the app.
3. **Bank changes are core work** (the user's own device only): edit `bank/*.json` with a script that parses and re-serialises, run `node tools/check_bank.js` then `node tools/bundle_bank.js` in `ns-tracker/`. Never hand-edit `app/bank.js`. No company facts in the bank.
