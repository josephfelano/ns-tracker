# NS Tracker - core repo

Core repo, owned by the user and portable between companies. It holds the app and the generic question bank only. Implementation data lives in the company's data folder (`<company>/ns-tracker/` in the workspace), never here. Changes to this repo happen only on the user's own device.

- Read `README.md` for the data split, storage adapters and code layout.
- The bank is generated: edit `tools/build_bank.py`, then run `build_bank.py` -> `check_bank.js` -> `bundle_bank.js`. Never hand-edit `bank/*.json`, `bank/CORRECTIONS.md` or `app/bank.js`.
- No build step, no dependencies, classic scripts (the app must open from `file://`).
- When reading a company's tracker data: files are keyed by bank IDs (`FIN-4c`, `D-013`, `M-02`, `PW-D01`, `F-01`, `P-001`, `I-001`). Join them to `bank/*.json` for the question and decision text.
