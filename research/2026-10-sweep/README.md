# Bank sweep - merged review (2026-10-12)

The question bank checked against Oracle's NetSuite documentation (first) and implementation partners (second), before decision logic is built on it. Five slices, one evidence file each; every fact there carries a source URL tagged Oracle docs or Secondary, and anything that could not be sourced is listed as unverified rather than stated. This file is the merged list for review. Approved in full on 2026-10-12. Applied in full on 2026-10-12: Scoping, Kickoff and L0, finance, items and inventory, procure to pay and order to cash, then integrations, migration, access, testing and cutover (D-071 to D-078, D-083 to D-085, new D-127 to D-130, file checklist, prework processes, load order, doors #34 to #37). Deliberately left out: a "serial numbers on the item record" option for D-085 (Oracle says OneWorld opening on-hand must come by inventory adjustment); a separate door for SDF projects (already on D-089); a SAML single sign-on feature record (the Enable Features location is not in the research); and 9 questions that feed no decision by design (SYS-1, SYS-3, ITM-1a, ITM-1d, ITM-9, P2P-0, P2P-6d, O2C-5f, ORG-5). Follow-up the same day: setup lines filled where the research supports them, go-live and operate decisions D-131 to D-136 (PRJ-4 and PRJ-10 now feed them), inferred licences changed to "confirm with the quote", and the guide orders setup by dependency.

| File | Slice |
|---|---|
| [A-finance.md](A-finance.md) | Entity, currency, calendar, tax, revenue, assets, GL, close, controls, reporting |
| [B-items.md](B-items.md) | Items, inventory, production, quality, costing, traceability |
| [C-p2p-o2c.md](C-p2p-o2c.md) | Procure to pay, order to cash, payments |
| [D-lifecycle.md](D-lifecycle.md) | Licensing, phases from scoping to hypercare, migration and load order, cutover |
| [E-doors-deps.md](E-doors-deps.md) | One-way doors verified, missing doors, feature dependency graph, order constraints |

IDs below are the evidence files' own (A G-A01, B G-01, C N-01, D G-01, E N1).

## Verdict

The workbooks got the structure right. Of the 16 one-way doors, 11 are confirmed by Oracle and none is wrong outright. The problems are of three kinds:

1. **Relations the bank treats as free choices are forced by NetSuite.** OneWorld requires Multiple Currencies; OneWorld with inventory turns on Multi-Location Inventory; MLI requires Advanced Receiving and Advanced Shipping. Answering D-001 answers D-002, D-005, D-014 and D-062.
2. **Missing decisions**, mostly hidden prerequisites and one-way features (bins, Advanced Inventory Management, Accounting Periods, Multi-Book, intercompany automation), the receivables side of order to cash, and every lifecycle phase after configuration (UAT, training, hypercare, change control, releases).
3. **Outdated product and licensing facts**: retired payment products, renamed ARM and manufacturing features, SuiteTax changes, and several features treated as free that are licensed modules.

## 1. What this changes in the design

- **Relations between decisions have five kinds**, each computed by the guide, never asked: *forces* (an answer fixes another decision's answer), *requires* (a feature needs another feature on), *auto-enables* (turning one on switches others on), *conflicts* (two cannot coexist), *makes N/A* (a decision stops applying).
- **"One-way" needs a kind**, or the app will raise false warnings: *cannot be disabled* (SuiteTax, intercompany automation), *locked once used* (Lot Tracking once lot items exist; Advanced BOM, where disabling deletes BOMs), *locked on the record at save* (item costing method, subsidiary base currency), and three that are not locks at all: *behaviour*, *recommendation*, *scope risk*. oneWayDoors #9-#14 are the last three.
- **Decide-by and build-in are different layers.** Subscription (D-073), marketplace (D-074) and go-live date (D-086) are built late but must be decided at L0 because they drive one-way features or the first open period. Each decision needs both.
- **The guide can derive an Enable Features checklist** (on, off, forced, conflicts) from the decisions. That is most of L0.
- **Licence flags** on options let the guide produce a "confirm with the quote" list (modules, add-ons, service tier, user licence types).
- **Unverified facts ship as "confirm with Oracle"**, never as fact.

## 2. Forced chains and conflicts the guide must compute

| Rule | Source file |
|---|---|
| D-001 OneWorld -> D-002 Multiple Currencies forced yes | A C-A01, E |
| D-001 OneWorld + any inventory -> D-005 MLI forced yes | E |
| D-005 MLI -> D-014 Advanced Receiving and D-062 Advanced Shipping forced on; open orders must be closed before enabling | B, C C-01, E N19 |
| D-017 Statistical Accounts -> D-007 Multiple Units of Measure forced on | A, E |
| Demand Planning / MRP / WMS -> Advanced Inventory Management -> auto-enables Lot Tracking, Serialized, Matrix Items, MUOM, Pick Pack Ship | B G-02, E |
| D-011 Inventory Status -> Bin Management + Advanced Bin / Numbered Inventory Management required | B G-01, E |
| Lot and Serial Number Trace SuiteApp (the D-081 recall tool) -> ABNIM, MUOM required | B |
| FEFO Lot Assignments SuiteApp (D-042, D-043) -> Supply Allocation, ABNIM, Serialized Inventory on; Sales Channel Allocation off | B |
| D-009 routings -> WIP, Work Orders, Assembly Items, MLI and Project Management required | B, E |
| WIP and Routing -> assemblies must be Standard or Average costing (constrains D-036) | B |
| Standard cost on any item -> Standard Costing feature on before that item is saved | A C-A16, E |
| Group Average Costing -> MLI required; in-transit preference fixed after the first costing run | B G-05, E N17 |
| ARM, Amortization, Expense Allocation, GL Audit Numbering, Intelligent Close Manager -> Accounting Periods required | A G-A17 |
| ARM Revenue Allocation -> a sandbox on the quote | C C-07 |
| Intercompany automation -> elimination subsidiaries first; cannot be disabled once enabled | A G-A02, E N5 |
| Rebate Management -> OneWorld or Subsidiary Management | C N-08 |
| Conflict: Consigned Inventory Management vs Assembly Items and WMS | C C-12 |
| Conflict: Employee Commissions vs SuiteBilling | C N-12 |
| Conflict: Multi-Subsidiary Customer vs EU One Stop Shop | E N18 |
| Conflict: Intercompany Cross-Subsidiary Fulfillment vs WMS Advanced | E |
| Landed Cost does not require Advanced Receiving; with it, cost allocates on the receipt | A, E |

## 3. Missing decisions, triaged

### A. Must add: one-way or a prerequisite (the guide is wrong without them)

| Proposed decision | Layer | Evidence |
|---|---|---|
| Accounting Periods feature and first open period | L0 | A G-A17, E N15 |
| Multi-Book Accounting (none / adjustment-only / full), plus a question on parallel GAAP, IFRS or tax books | L0 | A G-A03, E N7 |
| Intercompany automation level and elimination subsidiaries (FIN-1b feeds nothing today) | L0 | A G-A02, E N5 |
| Multiple Calendars (fiscal year per subsidiary) | L0 | A G-A04 |
| Year-end close method / Period End Journal Entries | L0 | A G-A05 |
| Bin tracking: none / Bin Management / ABNIM | L0 | B G-01 |
| Advanced Inventory Management on or off | L0 | B G-02 |
| Supply planning engine: manual / reorder point / Demand Planning / MRP | L0 | B G-03 |
| Co-manufacturing model, including Outsourced Manufacturing (ITM-6h feeds nothing) | L0 | B G-04 |
| One cost across sites (Group Average) or per site | L0/L1 | B G-05 |
| Warehouse execution: NetSuite WMS / third-party scanning / none | L0 | B G-08 |
| Custom segment GL Impact and balancing segments (GL Impact is fixed per segment at creation) | L1 | A G-A09 |
| Multi-Subsidiary Customer | L0 | E |
| Commission calculated in NetSuite (conflicts with SuiteBilling) | L0 | C N-12 |

Folded into existing rows rather than added: Standard Costing feature into D-031; subsidiary country, currency and edition locks into D-033 (which moves to L0); Advanced BOM feature into D-040 (feature at L0).

### B. Should add: a real design decision with no home today

| Area | Proposed decisions |
|---|---|
| Finance | FX rate source and rate types (A G-A07); per-line classifications and journal balancing (A G-A08); allocations and amortization (A G-A10); GL Audit Numbering (A G-A06); bank import and reconciliation method (A G-A11; meta has no Cash area); close and reconciliation tooling including EPM (A G-A13); external BI or warehouse (A G-A14); cash-basis reporting (A G-A15) |
| Inventory and production | Negative inventory policy (B G-06); transfer costing and Incoterms (B G-07); lot number assignment (B G-09); labour and overhead in product cost (B G-10); yield and scrap (B G-11); matrix items or flat SKUs (B G-12) |
| Order to cash, procure to pay | Sales order approval (C N-01); commitment and allocation (C N-02); invoice trigger and delivery (C N-03); customer payments in NetSuite (C N-04); deposits (C N-05); gift cards and store credit (C N-06); cash application and dunning (C N-07); deductions and rebates (C N-08); Procurement module (C N-09); vendor bill intake (C N-11) |
| Lifecycle | Go-live strategy (D G-05); customisation change control (D G-08); authentication and SSO (D G-11); migration method per object (D G-13); external ID convention (D G-14); UAT scope and acceptance (D G-17) |

### C. Fold into an existing decision as options

Closed-period preferences into D-035 (A G-A18); budget structure into D-019 (A G-A19); journal and purchase approval mechanism into D-068 (A G-A20, C N-10); leases into D-018 (A G-A12); tax registrations and use tax into D-016 (A G-A16); integration identity and concurrency into D-078 (D G-12); Specialized and Retail licences into D-022; cycle counts into D-067; engineering change orders into D-040.

### D. Questions, prework or file checklist only

- Module scoping: service tier and SuiteCloud Plus (D G-01), non-production accounts and Release Preview (D G-03).
- Questions: approve-only users (D G-02), sign-off authority (D G-04), go-live month (D G-06), NetSuite admin after go-live (D G-09), identity provider (D G-10), trial loads and pass criteria (D G-15), attachment volume (D G-16), training (D G-18), legacy freeze (D G-19), hypercare (D G-23), release review and sandbox refresh (D G-24), sales order approval, vendor prepayments, commission (C Q-gaps 1-3), parallel books (A G-A03), leases (A G-A12), allocations (A G-A10), bins, cost per site, negative inventory, lot assignment, variants (B).
- Prework process rows: sales tax filing, payroll, intercompany, fixed assets, expenses (D G-07).
- File checklist: open POs, SOs, WOs, TOs, deposits and credits (D G-20); last bank reconciliation with outstanding items (D G-21); on-hand by item, location and lot with expiry (D G-22); org chart (D G-25).

## 4. Corrections that change the logic

The full lists are in the evidence files (A 25, B 26, C 19, D 16, plus E's door review). These are the ones that change how the guide behaves.

**Layer moves**
- D-033 base currency: L1 -> L0, and One-way (A C-A02, E N1).
- D-062 Advanced Shipping: feature at L0, warehouse handoff stays L3 (C C-04).
- D-073 subscription, D-074 marketplace: decide at L0, build at L5 (D C-09, C-10).
- D-086 go-live date: provisional at L0, confirmed at L7 (D C-12). D-087 UAT and training capacity: kickoff (D C-13).
- Advanced BOM and Standard Costing features: L0 (B, E).
- Roles: L2 -> L4, before UAT and integration users (D C-15).
- L7 unresolved ART and CLS references resolved; SYS-7, SYS-8 added (D C-01).

**Reversibility**
- D-011 Inventory Status: Costly -> One-way (B).
- D-062 Advanced Shipping: Easy -> Costly; cannot be turned off until all fulfilled orders are billed (C C-03).
- D-083 opening balances: One-way -> Costly (D C-03).
- D-043 shelf life: Costly -> Easy if the FEFO SuiteApp fits (B).
- D-014 Advanced Receiving: One-way only while MLI is on (C C-02).
- Door #8 Multi-Subsidiary Customer: now Oracle-sourced, Costly not One-way (A C-A19).
- Doors #9-#14: retag as behaviour / recommendation / scope risk (E).
- Door #3 (no inventory transaction before the MLI enable date): no current Oracle source; re-source or soften (E).
- D-001 / D-003: that OneWorld cannot be reversed is Secondary only; Oracle documents an upgrade path (A C-A03).

**Outdated product facts**
- HSBC Payment Automation and the AP Automation service are retired; the current option is Intelligent Payment Automation (BILL: US, USD, production only). D-058, D-071 (C C-10, C-11).
- ARM is now ARM (Essentials) plus optional Revenue Allocation; classic revenue recognition is not available to new implementations. D-015, M-03 (A C-A05).
- SuiteTax is account-wide, cannot be disabled, engine chosen per nexus; Advanced Taxes is already on in OneWorld. D-016, M-06 (A C-A06, C-A07).
- Feature names: Manufacturing Work In Process, Manufacturing Routing and Work Center. D-009, D-010 (B).
- Shelf life and FEFO come from the FEFO Lot Assignments SuiteApp or WMS, not core. D-042, D-043, door #14 (B).
- "Purchase Price levels" has no Oracle source. D-047 (C C-16).

**Licensing and quote**
- Service tier is separate from edition; it caps users, storage, transaction lines and integration concurrency. M-01, D-021 (D G-01, C-04, C-08).
- Inventory Management module covers landed cost, pick pack ship, bins, lot and serial, matrix, reorder point. M-05 (C C-05).
- Procurement module covers requisitions, RFQ, purchase contracts, blanket POs (C N-09).
- EPM (Planning and Budgeting, Account Reconciliation, Close Management), Analytics Warehouse and SuiteAnalytics Connect are separate purchases (A C-A10, G-A13, G-A14).
- Fixed Assets Management includes lease accounting (A C-A08).
- Subsidiary licensing is per country and base-currency combination. M-02 (A C-A20).
- Specialized licences (View and Approve, WMS). D-022, M-14 (D C-05, C-06).
- M-15 sandbox "10% / 20%" has no Oracle source (D C-07).

**Cutover and migration**
- D-085: lot and serial items must load by Inventory Adjustment, not the worksheet (D C-02).
- D-084: the opening trial balance must exclude what open AR and AP recreate (D C-14).
- Load order and CSV limits sourced to Oracle: D section 5.

**Question links**
- D-064 is fed by ITM-6e, not ITM-6d (B).
- D-036: ITM-1a becomes evidence only, which resolves the open CORRECTIONS.md item (B).
- 23 finance questions, the O2C-4 receivables group and CSH-1/4/5/6 feed no decision; each maps to a decision above (A, C C-19).

## 5. Needs Oracle or the quote (unverified)

- **Licensing**: Advanced Inventory Management, Demand Planning, MRP, WMS, Advanced Manufacturing, Quality Management SuiteApp, FEFO and lot SuiteApps, Outsourced Manufacturing, Standard and Group Average Costing, Bill Capture, Intelligent Payment Automation, Advanced Order Management, ARM pricing, Intelligent Close Manager, commissions. Only Advanced BOM is stated free.
- **Reversibility**: OneWorld downgrade, Advanced Receiving without MLI, MUOM, WIP, Landed Cost, GL Audit Numbering, Adjustment-Only Books, Advanced Pricing, Gift Certificates, item type changes other than non-inventory to inventory, matrix conversion.
- **Other**: whether new accounts default to SuiteTax; native 1099s; native segregation-of-duties rules; native shelf-life field outside the SuiteApp; Oracle edition names; sandbox pricing.

## 6. Where the slices disagree

- **Advanced BOM**: Oracle documents disabling it (E), but disabling deletes the BOMs and revisions created under it (B). Treat as *locked once used*.

No other conflicts between slices.
