# Slice D - Implementation lifecycle and cross-cutting areas

Scope: decision areas Licensing, Migration, Integration, Cutover, Access, Governance (D-021, D-022, D-023, D-029, D-050, D-071..D-078, D-083..D-087); question prefixes SYS, ORG, ART (plus CAL and CLS where cutover depends on them); files `layers.json`, `moduleScoping.json`, `prework.json`, `fileChecklist.json`, `systemsTables.json`. Bank read 2026-10-12. No repo files edited.

Counts: 24 gaps, 16 corrections, 19 decisions drafted, 9 items marked unverified.

## Sources

Every NetSuite fact below cites one of these. Tag: **[O]** = Oracle docs (docs.oracle.com Help Center); **[N]** = Oracle-owned netsuite.com marketing or articles (not Help Center, so weaker than [O]); **[S]** = Secondary.

| Key | Source | Tag |
|---|---|---|
| S1 | CSV Import FAQ (preferred import order; opening balances as JEs at go-live; OneWorld: create subsidiaries before importing; 25,000 records per file) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3924743.html | O |
| S2 | Supported Record Types for CSV Import (lists Credit Memo, Return Authorization, Journal Entry, Inventory Adjustment, Item Receipt, Item Fulfillment, Transfer Order, Vendor Credit, BOM, BOM Revision, Currency Exchange Rates imports; does not list subsidiary, currency, accounting period) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N356360.html | O |
| S3 | General CSV File Conventions ("25,000 records or 50 MB per import job"; multi-file uploads combined) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N453326.html | O |
| S4 | Limitations for Importing Transactions (5,000 lines per transaction; 10,000 per journal entry; over 1,000 lines may time out) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_159361166033.html | O |
| S5 | Entering Opening Balances (Setup > Accounting > Setup Tasks > Enter Opening Balances; generates journal entries; Out of Balance By; later changes made by editing the generated journal) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1441761.html | O |
| S6 | Setting Up Historical Balances in OneWorld ("don't load a complete transaction history... journal in the balances of all balance sheet accounts as of a period end"; Opening Balance equity account General Rate Type = Current) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1442160.html | O |
| S7 | Invoice Import (historical sales; import invoices before payments and use external IDs to apply payments) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N411794.html | O |
| S8 | Vendor Bill Import (bills typically used to bring in open payables) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N427250.html | O |
| S9 | Creating an Inventory Worksheet (worksheets exclude lot numbered, serial numbered and inactive items) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_161981128590.html ; Adjusting Serialized Inventory - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2235043.html ; Inventory Adjustment Import - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4676544313.html | O |
| S10 | NetSuite Service Tier Structure (Standard/Premium/Enterprise/Ultimate: users, file storage, monthly transaction lines averaged over 6 months, max SuiteCloud Plus licenses; 90-day grace on storage) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_159162378384.html | O |
| S11 | Concurrency Governance Limits Based on Service Tiers and SuiteCloud Plus Licenses (base 5/15/20/20, +10 per SuiteCloud Plus licence; development accounts fixed at 5) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_1500275603.html | O |
| S12 | Overview of User License Types (Full Licensed User, Employee Center, Retail User, Specialized User [CRM, Project Manager, Site Operator, View and Approve, WMS], SuiteCloud Plus) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0304103113.html ; Role Assignment and License Consumption - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0304103817.html | O |
| S13 | Refreshing Sandbox Accounts (refresh replaces all sandbox content; cannot be cancelled; activate within 14 days) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N334348.html ; NetSuite Sandbox FAQ (sandboxes go offline for upgrade at the same time as production; refresh fails if it overlaps the upgrade; Customer Center and Partner Center roles are never allowed into sandbox) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4714508173.html | O |
| S14 | The Release Preview Account (available twice a year before each release; snapshot of production) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_1121105228.html ; Release Delivery - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_161193621552.html | O |
| S15 | Account Customization Projects (cannot be uninstalled after deploy; objects in the project replace the account's objects on deploy) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_1510680449.html ; Copy to Account - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1544019532.html ; Bundle Support Across Account Types (development accounts hold no production data) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4853873261.html | O |
| S16 | Mandatory Two-Factor Authentication (2FA required for Administrator and highly privileged roles in every account type; API access for such roles must use TBA or OAuth 2.0) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1532968056.html | O |
| S17 | SAML Single Sign-on - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3825119.html | O |
| S18 | Setting Up Accounting Periods for a Year (Set Up Full Year: calendar months, 4 weeks/13 periods, 4-4-5) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1446183.html ; Accounting Period Deletion Restrictions (periods with transactions or closed cannot be deleted) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1448709.html | O |
| S19 | Deleting Incorrect CSV Data (records must be deleted one at a time; no mass delete) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N353700.html | O |
| S20 | Enabling SuiteBilling Features; Revenue Recognition for SuiteBilling (SuiteBilling works with ARM when all are enabled; ARM Essentials cannot be disabled) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1546981120.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4744857571.html | O |
| S21 | Making Deposits (payments to Undeposited Funds; Make Deposits) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1542431.html ; Shopify Payout Report Sync - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0630052659.html | O |
| S22 | Work Order Import - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1221125458.html ; Purchase Order Import - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N423495.html ; Sales Order Import - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N426302.html | O |
| S23 | Reconciliation Detail Report (Unreconciled section lists transactions "in the system" not on the statement) - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1556925.html | O |
| S24 | 6 Key Phases of an ERP Implementation Plan (discovery/planning, design, development, testing, deployment, support; move transactional data at the last moment) - https://www.netsuite.com/portal/resource/articles/erp/erp-implementation-phases.shtml | N |
| S25 | 4 Key ERP Implementation Strategies (big bang, phased, parallel, hybrid) - https://www.netsuite.com/portal/resource/articles/erp/erp-implementation-strategies.shtml | N |
| S26 | SuiteSuccess Enablement (stages Engage, Drive, Enable, Convert; change management throughout) - https://us-approval.netsuite.com/portal/services/training/suite-training/suitesuccess-enablement.shtml ; What is SuiteSuccess - https://www.netsuite.com/portal/products/suitesuccess.shtml | N |
| S27 | NetSuite.org "Financials Accelerated" Session 4 Going Live, 2017 (open AR as invoices and open AP as bills dated the last day of the prior period; outstanding checks entered as of that date; delete test transactions before go-live) - https://netsuiteorg.atlassian.net/wiki/spaces/DOC/pages/58490926/Session+4+Going+Live | S |
| S28 | Epiq, NetSuite Go-Live Checklist (go/no-go vs cutover plan; 3+ trial loads; hypercare 30-90 days through first close) - https://epiqinfo.com/netsuite-go-live-checklist/ ; Houseblend, NetSuite data migration cutover testing - https://houseblend.io/articles/netsuite-data-migration-cutover-testing | S |
| S29 | Partner pricing guides (editions Starter / Mid-Market / Enterprise; sandbox pricing ranges; estimates disagree) - https://www.anchorgroup.tech/blog/netsuite-pricing-complete-guide ; https://houseblend.io/articles/netsuite-licensing-options-enterprise-guide | S |
| S30 | Amazon Seller vs Vendor Central (3P seller owns inventory; 1P vendor sells wholesale to Amazon on POs, invitation only) - https://sellercloud.com/blog/vendor-central-vs-seller-central/ ; https://www.channelengine.com/en/blog/amazon-seller-central-vs-amazon-vendor-central | S |
| S31 | X12 transaction sets 850/855/856/810/852/820 - https://www.stacksync.com/edi/x12 | S |
| S32 | Bank `oneWayDoors.json` #2-#4 (MLI enable before items; no inventory transaction dated before MLI enabled), already sourced to Oracle by the bank | O (via bank) |

## 1. Lifecycle map

Phase names follow Oracle's own article (S24); SuiteSuccess labels the same arc Engage, Drive, Enable, Convert (S26). "Bank coverage" names the ids that cover the work; "none" means a gap (detailed in section 2).

| Phase | Work in the phase | Bank coverage | Gap ref |
|---|---|---|---|
| 0. Pre-sale scoping and licensing | Edition; **service tier** (users, storage, monthly transaction lines, SuiteCloud Plus max - S10); modules; user licence mix incl. Employee Center, Specialized (View and Approve, WMS), Retail (S12); sandbox / development / Release Preview accounts (S13-S15); SuiteCloud Plus for integration concurrency (S11); support plan; renewal uplift | M-01..M-18, SYS-5, SYS-7, ORG-7, D-021, D-022, D-023 | G-01, G-02, G-03, C-05..C-08 |
| 1. Kickoff and project governance | Sponsor, decision owner, design and UAT sign-off authority, project team capacity, go-live strategy (big bang / phased / parallel - S25), provisional go-live date, partner vs internal responsibilities | ORG-5, ORG-6, CAL-1..3, D-086, D-087 | G-04, G-05, G-06, C-12, C-15 |
| 2. Discovery and design | Current-state systems, interfaces, spreadsheets, reports, process walkthroughs; system-of-record decisions; fit-gap | SYS-1..SYS-10, all P1/P2 questions, systemsTables 1-4, prework processes PW-P01..P23, fileChecklist F-01..F-37 | G-07 (missing process rows), G-16 |
| 3. Account provisioning and foundation (L0) | Production provisioning; Enable Features; fiscal calendar and periods (S18); subsidiaries (manual; not CSV - S1, S2); currencies | layers L0, D-001..D-020 | C-11 (D-073/D-074 belong at L0 decision time) |
| 4. Configuration (L1-L4) | COA, dimensions, preferences; master data; transaction flows; roles, approvals, SoD | layers L1-L4, D-024..D-070 | G-10, G-11 (identity / admin access) |
| 5. Customisation and SDF / change control | Scripts, workflows, custom records deployed by SDF or Copy to Account; ACPs cannot be uninstalled and overwrite account objects on deploy (S15); sandbox first | none (D-029 covers only who creates accounts/dimension values) | G-08, G-09 |
| 6. Integrations (L5) | Per system: originate vs reconcile; connector / iPaaS / custom; auth (TBA/OAuth 2.0 required for privileged roles - S16); concurrency budget (S11) | layers L5, D-071..D-078, SYS-4, SYS-6, M-16 | G-12, C-04 |
| 7. Data migration | Object list, method per object, CSV limits (S3, S4), external-ID keys (S7), cleanse owners, trial loads in sandbox (incorrect CSV data deletes one record at a time - S19), history scope | SYS-7, SYS-8, D-023, D-046, PW-D09..D17, F-12..F-21 | G-13, G-14, G-15; section 5 |
| 8. Roles and permissions | Roles, licences per role, 2FA for admin roles (S16), SSO (S17), integration users | ORG-1, ORG-2, ORG-3, ORG-7, SYS-10, D-022, D-050, D-068, D-069 | G-10, G-11 |
| 9. Testing (unit, integration, UAT) | Test scenarios from real samples (F-22..F-30), integration end-to-end, UAT sign-off, report validation (D-082), recall test (D-081), mock data loads | D-081, D-082, D-087 (capacity only), layers L6 note | G-05, G-17 |
| 10. Training | End-user and admin training, train-the-trainer, role-based guides; Oracle positions training at Engage (admins) and Enable (end users) (S26) | ORG-4 (adoption risk), D-087 (capacity) | G-18 |
| 11. Cutover | Legacy freeze and final legacy close; opening TB JE (S5, S6); open AR/AP as invoices/bills (S7, S8, S27); opening inventory by location and lot (S9, S32); open POs/SOs/WOs/TOs (S22); outstanding bank items (S23, S27); first period open; go/no-go (S28) | layers L7, D-083..D-086, ITM-5*, CAL-1, CAL-2, F-01, F-03..F-05, F-08 | G-19, G-20, G-21, G-22, C-01, C-02, C-03 |
| 12. Go-live and hypercare | Go/no-go, support model, issue triage, first close in NetSuite (S28) | none | G-23 |
| 13. Post-go-live operations | Period close (CLS-*, D-035, D-070); twice-yearly releases tested in Release Preview (S14); sandbox refresh cadence (refresh overwrites sandbox - S13); service tier monitoring and licence true-up (S10); renewal (M-18) | CLS-1..CLS-11, D-035, D-070, M-18 | G-24 |

## 2. Gaps

Only items that change setup, licensing, sequencing or design. "Layer/phase" uses the bank's L0-L7 where one fits, otherwise the lifecycle phase from section 1.

| Id | Area | Layer / phase | Proposed text | Why it matters | Source |
|---|---|---|---|---|---|
| G-01 | Licensing (moduleScoping) | Phase 0 | "Which service tier is being quoted (Standard / Premium / Enterprise / Ultimate), and how many SuiteCloud Plus licences?" | Tier caps users, File Cabinet storage and monthly transaction lines (averaged over 6 months), and the max number of SuiteCloud Plus licences; integration concurrency is base 5/15/20/20 +10 per SuiteCloud Plus. SYS-5 volumes and SYS-9 document volumes feed it. Edition (M-01) is a different thing. | S10, S11 |
| G-02 | Licensing (question, ORG) | Phase 0 / L0 | Extend ORG-7 or add ORG-8: "Who only needs to approve transactions (not enter them), and who only uses warehouse scanning?" | Oracle has Specialized User licences for View and Approve and WMS roles, separate from Full and Employee Center. ORG-7 lists full / employee / customer / vendor / scanning but not approve-only, which is a common licence saving and drives D-068 approval design. | S12 |
| G-03 | Licensing (moduleScoping) | Phase 0 | "Which non-production accounts are included: sandbox(es), development account(s); and who requests Release Preview each release?" | Sandbox refresh overwrites everything in the sandbox (S13); development accounts hold no production data and are fixed at concurrency 5 (S11, S15); Release Preview is free, twice a year (S14). M-15 asks only about sandbox tier. | S11, S13, S14, S15 |
| G-04 | Governance (question, ORG) | Phase 1 | "Who signs off (a) each design decision, (b) UAT, (c) go/no-go? Who breaks a tie between departments?" | ORG-5 asks whose buy-in matters, not who decides. The decision register has a Decided status with no owner of the decision. | S28 (go/no-go as a formal step) |
| G-05 | Cutover (decision) | Phase 1, confirmed at L7 | New decision "Go-live strategy: big bang, phased (by entity, module or site), parallel run, or hybrid". Options in section 4. | Changes the cutover plan, licence overlap with legacy, number of opening-balance events, and integration coexistence. | S25 |
| G-06 | Cutover (question, CAL) | Phase 1 | "Target go-live month, and must it be the first day of a fiscal year, quarter or month?" | Opening balances are entered against a posting period (S5); no inventory transaction can be dated before MLI is enabled (S32), so the date fixes the MLI enable date and first open period. D-086 sits at L7 but the date is needed at L0. | S5, S32 |
| G-07 | Prework processes | Phase 2 | Add process rows (only if applicable): Sales tax filing; Payroll and the payroll journal; Intercompany and consolidation; Fixed assets and depreciation; Employee expenses and corporate cards. | Each has a question (FIN-3c, CLS-11, FIN-5c, P2P-13) but no PW-P row, so the process readiness of these areas is never collected. Payroll is not asked anywhere; it is usually an interface (SYS-4). | Bank cross-check (no external fact) |
| G-08 | Governance (decision) | Phase 5 | New decision "Customisation change control: where may customisations be made (production UI, sandbox then promote, SDF from source control), and who may deploy to production?" | SDF account customisation projects cannot be uninstalled and replace the account's object on every deploy; a UI edit in production is overwritten by the next deploy. Copy to Account moves one object at a time. | S15 |
| G-09 | Governance (question, SYS) | Phase 5 / Phase 13 | "Who will be the NetSuite administrator after go-live, and how many people will hold the Administrator role?" | Administrator and highly privileged roles require 2FA in every account type (S16); SYS-10 asks this for legacy systems only. Admin count also affects Employee Center licence counting (S12: admin+Employee Center users do not consume Employee Center licences). | S12, S16 |
| G-10 | Access (question, ORG) | L4 | "Do you use a company identity provider (Okta, Entra ID, Google) and require single sign-on? Any IP-address restrictions?" | SAML SSO is a feature to enable and configure per account; enabling it delegates user access control to the IdP admins. | S17 |
| G-11 | Access (decision) | L4 | New decision "Authentication model: NetSuite login + 2FA vs SAML SSO; 2FA scope beyond the mandatory roles". | Mandatory 2FA cannot be removed for admin/privileged roles (S16); SSO changes onboarding and offboarding. | S16, S17 |
| G-12 | Integration (decision note) | L5 | Add to D-078 (or new): "Integration identity and throughput: dedicated integration user(s)/role(s), auth method (TBA or OAuth 2.0), and the concurrency budget across all integrations." | Privileged roles cannot authenticate APIs with user credentials (S16); concurrency is shared and capped by tier + SuiteCloud Plus (S11). | S11, S16 |
| G-13 | Migration (decision) | L2 / Phase 7 | New decision "Migration method per object: CSV Import Assistant, integration platform, or web services; and who runs each load". | CSV is capped at 25,000 records or 50 MB per job, 5,000 lines per transaction, 10,000 per JE (S3, S4); Oracle points to SOAP/REST for big or ongoing migrations (S1). SYS-5 volumes decide which. | S1, S3, S4 |
| G-14 | Migration (decision) | L2 | New decision "Record key convention: legacy ids carried as External ID on every migrated record". | Oracle's invoice import requires unique ids, preferably external ids, to apply imported payments to imported invoices (S7). Without a key, re-runs duplicate and links fail. | S7 |
| G-15 | Migration (question, SYS) | Phase 7 | "How many trial loads in sandbox, who reconciles each, and what counts as a pass (record counts, TB, AR/AP totals)?" | Incorrect CSV-imported data must be deleted one record at a time (S19), so failed production loads are expensive; partner guidance is 3+ reconciled trial loads (S28). The L2 note says "dry-run more than once" but no question or owner. | S19, S28 |
| G-16 | Migration (question, SYS) | Phase 2 / 7 | Extend SYS-9: "Which documents must be attached to records in NetSuite, roughly how many GB?" | File Cabinet storage is capped by service tier (100 GB Standard) with a 90-day grace period when exceeded (S10). | S10 |
| G-17 | Testing (decision) | Phase 9 | New decision "UAT scope and acceptance: which scenarios (from F-22..F-30 samples), which roles test, pass criteria, who signs". | D-087 covers capacity only. UAT of Customer Center / Partner Center portals cannot happen in sandbox (S13). | S13, S24 |
| G-18 | Training (question, ORG) | Phase 10 | "Who will train end users (partner, internal trainers, Oracle training), and who maintains role guides after go-live?" | Oracle splits admin/project-team training (Engage) from end-user training (Enable) (S26); ORG-4 asks adoption risk only. | S26 |
| G-19 | Cutover (question, CAL/CLS) | L7 | "When does entry stop in the legacy system, and will the last legacy month be closed before the opening balances are loaded?" | Opening balances are taken as of a period end (S6); open AR/AP go in dated the last day of the prior period (S27). The freeze sets the cutover window. | S6, S27 |
| G-20 | Cutover (file checklist) | L7 | Add files: open PO list with remaining quantities; open sales order / backorder list; open work orders and transfer orders; customer deposits, prepayments, gift card and store credit liability detail; unapplied cash and open credit memos / vendor credits. | D-084 carries these forward but the file checklist only has AR/AP agings (F-03, F-04). PO, SO, WO, TO, credit memo and vendor credit imports exist (S2, S22). | S2, S22 |
| G-21 | Cutover (file checklist) | L7 | Add file: "Last bank reconciliation per account with the list of outstanding checks and deposits in transit". | NetSuite reconciliation works against transactions in the system (S23); outstanding items are entered as of the cutover date (S27). F-08 (one month of statements) does not give the outstanding list. | S23, S27 |
| G-22 | Cutover (file checklist) | L7 | Add file: "On-hand by item, location and lot (with expiry) as of cutover". | Lot-numbered items cannot use the Inventory Worksheet; the adjustment needs lot and quantity per line (S9). F-05 is valuation by location only. | S9 |
| G-23 | Cutover / Governance (question) | Phase 12 | "Hypercare: who supports users in the first 30-90 days, how are issues logged and prioritised, and when does hypercare end (e.g. after the first close)?" | Partner guidance frames hypercare as 30-90 days through the first month-end close (S28); nothing in the bank covers it. | S28 |
| G-24 | Governance (question) | Phase 13 | "Who reviews each twice-yearly release in Release Preview, and how often is the sandbox refreshed (knowing a refresh wipes sandbox work)?" | S13, S14. Releases can change behaviour of scripts and workflows; refresh timing near an upgrade fails (S13). | S13, S14 |
| G-25 | File checklist | Phase 2 | Add "Org chart" (CORRECTIONS.md "needs a human decision" item). | ORG-1 asks the client to attach it; no checklist row exists. | Bank |

(25 rows; G-25 restates an existing open item from CORRECTIONS.md, so it is not counted in the 24 new gaps.)

## 3. Corrections

| Id | Target | Field | Current | Proposed | Source |
|---|---|---|---|---|---|
| C-01 | layers.json L7 | fedByPseudoRefs / fedByQuestionIds | `ART`, `CLS` (unresolved, per CORRECTIONS.md) | Resolve ART to the cutover files (F-01, F-03, F-04, F-05, F-08 plus G-20..G-22) and CLS to CLS-6 (reconciliations) and CLS-1. Add SYS-7 and SYS-8 (history scope and cleanup decide what loads at cutover). | Bank logic; S6 (balances as of a period end) |
| C-02 | decisions.json D-085 | nsSetting | "Inventory Adjustment / Worksheet" | "Inventory Adjustment (required for lot- and serial-numbered items, lot#(qty) or inventory detail); Inventory Worksheet only for non-lot, non-serial items. Dated on or after the MLI enable date." | S9, S32 |
| C-03 | decisions.json D-083 | reversibility | One-way | Costly. Oracle: the opening balance journals are ordinary journal entries that are changed by editing them; the cost is re-closing and re-reporting periods already closed. | S5 |
| C-04 | decisions.json D-021 | nsSetting / notes | "Account sizing; integration throughput; cutover duration" / "License tier; whether integrations need batching" | nsSetting: "Service tier (users, File Cabinet storage, monthly transaction lines averaged over 6 months); SuiteCloud Plus licences (integration concurrency)". Notes: "Service tier, not licence tier." | S10, S11 |
| C-05 | decisions.json D-022 | decides / nsSetting | "Full users vs Employee / Customer / Vendor Center vs no-login integration" / "User licenses; Center-based roles" | Add Specialized User licences (View and Approve, WMS, CRM, Project Manager, Site Operator) and Retail User to the option set; note that any full-licensed role on a user consumes a Full licence. | S12 |
| C-06 | moduleScoping.json M-14 | ask / why | "How many full user licenses vs Employee / Customer / Vendor Center..." / "Licensing is per unique login by role" | Add "and Specialized (View and Approve, WMS) licences". Why: "The roles assigned to a user decide the licence type it consumes; one full-licensed role makes it a Full licence." | S12 |
| C-07 | moduleScoping.json M-15 | why | "Roughly 10% of subscription for standard, ~20% for premium." | Unverified: Oracle publishes no sandbox price; partner estimates disagree (S29). Replace with "Get the quoted price; a refresh overwrites the sandbox, so one sandbox serves either dry-run loads or development at a time." Pair with G-03. | S13, S29 |
| C-08 | moduleScoping.json M-01 | ask | "Which SuiteSuccess edition is being quoted..." | "Which edition (and SuiteSuccess industry package, if any), which service tier, and exactly which modules?" Edition and service tier are separate (G-01). Edition names (Starter / Mid-Market / Enterprise) are partner-reported only - unverified in Oracle docs. | S10, S29 |
| C-09 | decisions.json D-073 | layer | L5 | Decide at L0 (build at L5). layers.json L0 already lists O2C-5a..O2C-5f as feeders, and the answer decides whether ARM (D-015, one-way) and SuiteBilling are enabled. | S20; layers.json L0 |
| C-10 | decisions.json D-074 | layer | L5 | Decide at L0/L1 (build at L5). layers.json L0 already lists O2C-6a..O2C-6c; Seller (3P) means owned inventory at marketplace locations (D-005, D-032), Vendor (1P) means Amazon is a wholesale customer on POs. | S30; layers.json L0 |
| C-11 | layers.json | structure | L5 integrations sit after L4 with no note on decision timing | Add note: "L5 is when integrations are built; the originate-vs-reconcile and system-of-record decisions for each are made at L0-L2 because they drive features, locations and master-data ownership (D-046, D-073, D-074)." | Bank logic (C-09, C-10) |
| C-12 | decisions.json D-086 | layer / notes | L7 | Provisional date at L0 (kickoff), confirmed at L7. Reason: the date fixes the MLI enable date and the first open period. | S32, S5 |
| C-13 | decisions.json D-087 | layer | L7 | Project plan item needed at kickoff (ORG-6 is a capacity question); UAT itself runs after L6 and before L7. Suggest moving to a phase, or L0 timing. | S24 (testing precedes deployment) |
| C-14 | decisions.json D-084 | nsSetting | "Open transaction import" | "Open AR as invoices (CSV), open AP as vendor bills (CSV), open POs/SOs/WOs/TOs by their imports; the opening TB journal must exclude the AR/AP (and other) balances that the open transactions recreate, or they double count." | S7, S8, S22, S27 |
| C-15 | layers.json L2 | decides | "...pricing, roles" | Roles belong with L4 (permissions/SoD) and must exist before UAT and before integration users (L5); keep employee records in L2. | S16 (integration roles), bank logic |
| C-16 | Migration note (applies to any copy of the Oracle import order) | - | CSV Import FAQ says Credit Memos and Return Authorizations are "not yet supported" | Outdated: the Supported Record Types page lists Credit Memo Import and Return Authorization Import. Use S2 as authority. | S1 vs S2 |

## 4. Decision options draft

Format per decision: input type; options; per option configure / leave off / requires / makes N/A / licence or quote impact / one-way. "Requires" and "makes N/A" are proposed logic links between bank ids, not NetSuite facts; each NetSuite fact carries a source.

### D-021 Licensing - Transaction volume and record counts (SYS-5)
- Input: **number** (several): monthly transaction lines (peak and 6-month average), full users, File Cabinet GB, active SKUs / customers / vendors.
- Derived single: service tier Standard / Premium / Enterprise / Ultimate.

| Option (derived tier) | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Standard (<=100 users, <=100 GB, <=200K lines/month, <=1 SuiteCloud Plus) | concurrency base 5 (+10 with SuiteCloud Plus) | - | SYS-5, ORG-7 | - | Tier line on quote (S10, S11) | No - tier is changed by contract (S10 FAQ link "Service Tier Upgrade FAQs"); not verified as a downgrade path - unverified |
| Premium (<=1,000 / 1,000 GB / 2M / 3) | base 15 | - | same | - | higher tier line | same |
| Enterprise (<=2,000 / 2,000 GB / 10M / 6) | base 20 | - | same | - | | |
| Ultimate (<=4,000 / 4,000 GB / 50M / 12) | base 20 | - | same | - | | |

Sources: S10, S11. Feeds D-078 (batching if concurrency is tight), G-13 (migration method).

### D-022 Licensing - Access type per user group (ORG-7)
- Input: **multi** per user group (table: group, headcount, licence type).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Full Licensed User | standard or custom full roles | - | D-050 | - | Full licence each; any full role on a user consumes Full (S12) | No |
| Employee Center | Employee Center role (time, expenses, purchase requests) | - | D-061 for expenses | - | Employee Center licence (S12) | No |
| Specialized: View and Approve | approver role | - | D-068 | full licence for approve-only users | Specialized licence (S12) | No |
| Specialized: WMS | WMS roles | - | M-11 (WMS in scope) | - | Specialized licence (S12) | No |
| Retail User | Retail Clerk roles | - | POS in scope | - | Retail licence (S12) | No |
| Customer Center | customer access | - | Customer Access feature; O2C portal need | - | Licence treatment not stated in Oracle licence overview - **unverified**; cannot be tested in sandbox (S13) | No |
| Vendor Center | vendor access (view/print POs) | - | Vendor Access feature (https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_161952527878.html) | - | **unverified** licence treatment | No |
| No login - integration / file only | integration user + role | - | D-078, G-12 | portal setup for that party | SuiteCloud Plus may be needed for concurrency (S11) | No |

### D-023 Migration - History migrated vs archived (SYS-7)
- Input: **single** + **number** (years) per data type.

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Balances only (TB as of a period end + open transactions) | Opening balance JE (S5, S6) | historical transaction loads | D-083, D-084 | historical comparatives in NS unless budgets/stat entries added | Lowest migration cost | Costly to add history later (needs periods reopened; S18 deletion limits) |
| Monthly summary TB history (N years) | one JE per period per subsidiary | detail transactions | Accounting periods back N years (S18) | - | Moderate | Costly |
| Detail transaction history (N years) | Invoice / bill / SO / PO imports with history flags | - | External ID convention (G-14); CSV limits (S3, S4) | - | Highest; Oracle advises against full history for OneWorld (S6) | Costly (incorrect CSV data deletes one record at a time - S19) |
| Legacy kept read-only | legacy licence retained | migration of history | SYS-7 answer per system | - | Legacy subscription cost | Easy |

### D-029 Governance - Who can create accounts and dimension values (DIM-7)
- Input: **multi** (roles allowed) + **yesno** (approval required) + **text** (naming convention).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Admin / controller only | remove Accounts and Departments/Classes/Locations create permissions from other roles | - | D-069 roles | - | none | No |
| Named finance roles with approval | role permission + approval workflow | - | D-068 | - | none | No |
| Open (any full user) | default role permissions | - | - | - | none | No |
Source for permission-based control: roles and permissions are per role in NetSuite (Standard Roles Permissions Table - https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N295396.html, O). The specific permission names for creating accounts and segment values are **unverified** here.

### D-050 Access - Who exists in the system and as what (ORG-1)
- Input: **text-only table** (person/role/location) feeding D-022; derived **multi** of record types (employee, vendor contact, customer contact, partner).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Employee record with login | employee + role + 2FA if privileged (S16) | - | D-022 | - | per D-022 | No |
| Employee record, no login | employee as approver / sales rep / supervisor reference | access | - | - | none | No |
| External contact with Center access | customer/vendor/partner record + Center role | - | D-022 | - | per D-022 | No |
| No record | - | - | - | - | none | No |
Load order: employees load in the Entities step after classifications (S1).

### D-071 Integration - A/P platform direction and system of record (P2P-8a)
- Input: **single**.

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| No A/P platform - bills entered/approved in NS | vendor bill approval (D-057), Electronic Bank Payments or bank file (D-058) | connector | D-057, D-058 | P2P-8b..8e | possibly an EBP SuiteApp (unverified licence) | No |
| Platform captures and approves, pushes approved bills to NS; NS master for vendors/COA | connector, vendor + COA sync NS -> platform | NS bill approval workflow | D-046, D-078 | D-057 approval part | platform subscription; integration build | No |
| Platform also executes payments; payment records pushed back | as above + payment sync | NS payment run | D-058 | NS EBP | as above | No |
| NS bills pushed to platform for payment only | payment connector | platform capture | D-058 | - | as above | No |
External facts here are platform-specific; none verified in Oracle docs beyond NetSuite having vendor bill approval and Electronic Bank Payments (bank decisions D-057/D-058 already name them).

### D-072 Integration - TMS scope (O2C-3a)
- Input: **multi**: orders out to TMS / tracking and status back / freight cost back to GL / none.

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| No TMS | NS shipping (item fulfillment, D-062) | connector | D-062 | O2C-3b..3f | none | No |
| Orders out only | fulfillment-to-TMS feed | cost back | D-062 | - | integration build | No |
| Orders out + status/tracking back | as above + update fulfillment | - | - | - | | No |
| + freight cost back (accrual / landed cost) | cost posting rule, accrual account | - | D-013 if freight capitalised; CLS-4 | - | | No |
No NetSuite-specific fact claimed; design depends on D-013 (bank).

### D-073 Integration - Subscription state in NS or only resulting orders (O2C-5e)
- Input: **single**. Decide at L0 (C-09).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| NS holds subscription state (SuiteBilling) | Subscription Billing features (Enable Features > Billing: Advanced Billing, Charge-Based Billing, Billing Accounts, Subscription Billing, ...) (S20) | external subscription platform | ARM Essentials if revenue must be recognised over time with SuiteBilling (S20) -> D-015 | external order import for subscriptions | SuiteBilling module (quote); ARM module | ARM Essentials cannot be disabled once enabled (S20) - one-way |
| External platform holds state; NS receives resulting orders/cash | order + payment import, item mapping | SuiteBilling | D-078, D-076 | O2C-5b detail inside NS | integration build | No |
| No recurring revenue | - | both | - | O2C-5a..5f, D-073 | none | No |

### D-074 Integration - Marketplace model per channel (O2C-6b)
- Input: **single per marketplace** (table). Decide at L0/L1 (C-10).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| 3P seller, marketplace fulfils (e.g. Seller Central + FBA) | location per marketplace warehouse holding owned inventory; order + settlement import | - | D-005 MLI, D-032 | - | connector | Location setup Easy; MLI one-way (S32) |
| 3P seller, self-fulfilled | order import; ship from own/3PL locations | marketplace location | D-062 | - | connector | No |
| 1P vendor (e.g. Vendor Central) | marketplace as wholesale customer; POs in, typically EDI | settlement import | D-075 EDI | marketplace inventory location | EDI provider | No |
| Not sold through marketplaces | - | - | - | O2C-6b, O2C-6c | none | No |
Seller/Vendor Central definitions: S30 (Secondary). Whether a given marketplace uses EDI is **unverified** per marketplace.

### D-075 Integration - EDI partners and transaction sets (O2C-7)
- Input: **multi per trading partner**: 850, 855, 856, 810, 852, 820 (+ other).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| No EDI | - | provider | - | O2C-1f routing guides partly | none | No |
| 850 in (PO) | SO creation from EDI | - | D-048 pricing; customer item mapping | - | EDI provider per partner | No |
| 855 out (PO ack) | ack after SO | - | 850 | - | | No |
| 856 out (ASN) | from item fulfillment; needs carton/pallet and GTIN/SSCC data | - | D-044 packaging hierarchy, D-062 | - | | No |
| 810 out (invoice) | from invoice | - | O2C-4a | - | | No |
| 852 in (product activity) | inbound sales/inventory data store | - | D-020 if forecast uses it | - | | No |
| 820 in (remittance) | cash application | - | D-077 | - | | No |
Transaction-set meanings: S31 (Secondary).

### D-076 Integration - Payment processor payout reconciliation (CSH-2, CSH-3)
- Input: **single per processor**.

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Payments to Undeposited Funds, grouped by Make Deposits matching each payout; fees as deposit lines | Undeposited Funds, Make Deposits (S21) | - | CSH-2 (gross vs net) | - | none | No |
| Connector payout sync (e.g. Shopify Payout Report Sync) | connector; cash sales/refunds kept undeposited (S21) | manual deposits | D-078 | - | connector (S21 is a Oracle-documented connector feature; licence unverified) | No |
| NetSuite Pay automated settlement reconciliation | NetSuite Pay (Oracle doc "Automated Settlement Reconciliation for NetSuite Pay" https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_6145552647.html) | - | NetSuite Pay as processor | - | processor change | No |
| Summary JE per payout | JE per payout to bank / fees / clearing | order-level match | CLS-6 | - | none | No |

### D-077 Integration - A/R automation platform (O2C-10)
- Input: **single**.

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| None - NS invoicing, statements, payments | invoice email templates, customer payments | connector | O2C-4b, O2C-4c | - | none | No |
| External platform for delivery/dunning/cash app; NS is GL of record | connector, payment sync back | - | D-078, G-14 external ids | - | platform + build | No |
| EDI 820 remittance only | per D-075 | - | D-075 | - | EDI | No |
No NetSuite fact claimed.

### D-078 Integration - Everything else that moves data, and what it is built on (SYS-4, SYS-6)
- Input: **single per interface** (table in systemsTables #4) + **yesno** "iPaaS already licensed?".

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Native connector / SuiteApp | install, integration record, role | - | G-12 auth | - | connector fee varies | No |
| iPaaS (existing or new) | integration record, TBA/OAuth 2.0 role (S16) | - | concurrency budget (S11) | - | iPaaS subscription; SuiteCloud Plus if concurrency short (S11) | No |
| Custom (RESTlet / SuiteScript / web services) | scripts via SDF (S15) | - | G-08 change control | - | build cost; governance | No |
| Manual file (CSV import / saved search export) | saved CSV import map, saved search | automation | owner named (SYS-8 style) | - | none; 25,000 rows / 50 MB per job (S3) | No |
| Retire interface | - | - | - | that row | saving | No |

### D-083 Cutover - Opening trial balance and tie-out (ART, CLS)
- Input: **single** (method) + **date** (as-of period end) + **text** (tie-out owner).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Enter Opening Balances page (generates JEs; Out of Balance By) | Setup > Accounting > Setup Tasks > Enter Opening Balances (S5) | - | COA loaded without balances (S1); period open (S18) | - | none | Costly (journals editable - S5; C-03) |
| Journal entry import at go-live | Journal Entry Import (S1, S2); <=10,000 lines per JE (S4) | - | same | - | none | Costly |
| Per-subsidiary balances with Opening Balance equity, General Rate Type = Current (OneWorld, multi-currency) | equity account rate type (S6) | - | D-001, D-033 | - | none | Costly |
In every option: exclude balances recreated by open transactions (D-084) or route them through a clearing account that must net to zero - S27 (Secondary) and C-14.

### D-084 Cutover - Open AR, AP, POs, SOs carried forward (ART)
- Input: **multi** (which open items) + **single per item** (method).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Open AR as invoices (one per open invoice, or one per customer) | Invoice Import (S7), offset item/account | AR in TB JE | customers, items (S1 order), G-14 external ids | AR balance line in D-083 | none | Costly |
| Open AP as vendor bills | Vendor Bill Import (S8) | AP in TB JE | vendors | AP balance line in D-083 | none | Costly |
| Open POs (remaining qty) | Purchase Order Import (S22) | - | items, vendors, D-014 (receiving model) | - | none | Easy (close/edit) |
| Open SOs (remaining qty) | Sales Order Import (S22) | - | customers, items, pricing | - | none | Easy |
| Open work orders / transfer orders | Work Order Import, Transfer Order Import (S2, S22) | - | D-009, D-005 | - | none | Easy |
| Customer credits, vendor credits, RAs | Credit Memo, Vendor Credit, Return Authorization imports (S2) | - | - | - | none | Costly |
| Customer deposits / prepayments | **unverified** whether Customer Deposit is CSV-importable (not seen in S2 summary) | - | - | - | - | - |
| Leave in legacy and work off | legacy kept running (D-023) | NS import | parallel AR/AP | - | legacy cost | No |

### D-085 Cutover - Opening inventory quantity and value by location (ITM-5a)
- Input: **single** (method) + **date**.

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Inventory Adjustment import with inventory detail (lot#(qty)) | Inventory Adjustment Import (S9) | - | lot items need this (S9); MLI enabled before the adjustment date (S32); locations (D-032) | - | none | Bank says One-way; the MLI-date constraint is the one-way part (S32) |
| Inventory Worksheet (absolute qty and value) | Worksheet (S9) | - | only non-lot, non-serial, active items (S9) | - | none | as above |
| Serial numbers on item record (new serialized items) | item record Inventory subtab (S9) | - | serialized items | - | none | as above |
Valuation source: F-05 plus G-22; costing method per item fixed before load (oneWayDoors #1).

### D-086 Cutover - Go-live date against the business calendar (CAL-1, CAL-2)
- Input: **date** + **single** (boundary: fiscal year start / quarter start / month start).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Fiscal year start | periods from FY start (S18); no prior-year periods except opening | - | FIN-2a | mid-year YTD history loads | none | Costly |
| Quarter / month start | YTD P&L as balances or monthly JEs (D-023) | - | D-023 | - | none | Costly |
| Avoid: peak season, audit fieldwork, physical count week | - | - | CAL-1, CAL-2 | - | - | - |
Any option: MLI must be enabled on or before the first inventory transaction date (S32); set provisionally at kickoff (C-12).

### D-087 Cutover - UAT and training capacity (ORG-6)
- Input: **number** (hours/week per named participant) + **yesno** (backfill funded).

| Option | Configure | Leave off | Requires | Makes N/A | Licence / quote | One-way? |
|---|---|---|---|---|---|---|
| Internal UAT by process owners, backfilled | UAT plan (G-17) | - | ORG-6 | - | backfill cost | No |
| Partner-led testing, owners sign off | partner scope | - | G-04 sign-off | - | services cost | No |
| Insufficient capacity -> phased go-live | G-05 phased | big bang | G-05 | - | longer timeline (S25) | No |
No NetSuite fact; S24/S25 for phase and strategy framing.

### New decisions proposed (from gaps; options in brief)
- **G-05 Go-live strategy** (single): big bang / phased by entity, module or site / parallel run / hybrid (S25). Phased and parallel imply legacy licences overlap and repeated opening-balance events; parallel doubles entry (S25).
- **G-08 Customisation change control** (single): SDF from source control, sandbox first / Copy to Account per object / direct UI edits in production. SDF ACPs cannot be uninstalled and overwrite account objects on deploy (S15).
- **G-11 Authentication model** (single + multi): NetSuite login with mandatory 2FA for privileged roles (S16) / SAML SSO via IdP (S17); 2FA for all roles yes/no.
- **G-13 Migration method per object** (single per object): CSV Import Assistant (<=25,000 records or 50 MB per job, 5,000 lines per transaction - S3, S4) / integration platform / SOAP-REST web services (S1).
- **G-14 External ID convention** (yesno + text): carry legacy key as External ID on every migrated record (S7).
- **G-17 UAT scope and acceptance** (text-only list of scenarios + single sign-off owner).

## 5. Data migration load order

Oracle's preferred order is COA -> classifications -> entities -> items -> CRM -> transactions, with opening balances entered as journal entries at go-live and subsidiaries created before any import in OneWorld (S1). Steps 0-3 and 6 below fill in setup Oracle's FAQ does not list; where the position is dependency logic rather than an Oracle statement it says so.

| Step | What | Method | Notes | Source |
|---|---|---|---|---|
| 0 | Enable Features (MLI, lot/serial, MUOM, multi-currency, pricing features, etc.) | UI | MLI before items and before the first inventory transaction date. Item pricing import needs Multiple Prices, Quantity Pricing or Multiple Currencies enabled. | S32; S1 (pricing FAQ) |
| 1 | Subsidiaries (OneWorld) | UI (not in CSV supported list) | "set up your subsidiaries in NetSuite before you start importing data"; Subsidiary field is required on COA, customer, vendor, employee, contact imports | S1, S2 |
| 2 | Currencies and exchange rates | Currencies: UI (not listed); rates: Currency Exchange Rates Import | Position = dependency logic | S2 |
| 3 | Fiscal calendar and accounting periods | Set Up Full Year (not CSV) | Periods must exist before any dated transaction; periods with transactions cannot be deleted | S18 |
| 4 | Chart of accounts | CSV, **no balances** | "Don't import account balances until you're ready to go live" | S1 |
| 5 | Classifications: departments, classes, locations (and custom segment values) | CSV | Locations before items are distributed | S1, S32 |
| 6 | Other lists items reference: units of measure, price levels, terms, tax setup | UI or CSV where supported | Position = dependency logic (items reference them); not in Oracle's FAQ order - unverified as Oracle sequence | - |
| 7 | Entities: employees, vendors, partners, customers, contacts | CSV | Employees first among entities is dependency logic (sales rep, supervisor, approver references) | S1 |
| 8 | Items (components before assemblies) | CSV | Oracle lists all item types in one step; component-before-assembly is dependency logic. Costing method and lot designation fixed at save (oneWayDoors #1, #5) | S1 |
| 9 | BOMs, then BOM revisions, then assembly-BOM link | BOM Import, BOM Revision Import | Imports exist; order is dependency logic | S2 |
| 10 | Item pricing, vendor pricing | CSV | Feature prerequisite in step 0 | S1 |
| 11 | Roles and user access | UI / SDF (roles), employee record access | Before UAT; 2FA mandatory on privileged roles | S16 |
| 12 | Opening GL balances as of the cutover period end | Enter Opening Balances page or JE import (<=10,000 lines per JE) | Exclude balances recreated in steps 13-14 | S1, S4, S5, S6 |
| 13 | Open AR invoices, open AP bills, open credits | Invoice, Vendor Bill, Credit Memo, Vendor Credit imports | Import invoices before payments; external ids to link | S2, S7, S8 |
| 14 | Opening inventory by location (and lot) | Inventory Adjustment import (lot/serial) or Inventory Worksheet (other items) | Dated on/after MLI enable date | S9, S32 |
| 15 | Open POs, SOs, work orders, transfer orders, RAs | PO, SO, Work Order, Transfer Order, Return Authorization imports | Remaining quantities only (practice, Secondary) | S2, S22, S28 |
| 16 | Outstanding bank items for the first reconciliation | Checks / deposits dated as of cutover | Reconciliation matches transactions in the system | S23, S27 |
| 17 | Historical transactions, only if D-023 says so | CSV / web services | Oracle advises balances, not full history, for OneWorld | S6 |

Limits that shape every step: 25,000 records or 50 MB per Import Assistant job, combined across files (S3); 5,000 lines per imported transaction, 10,000 per journal entry, performance risk above 1,000 (S4); incorrectly imported records must be deleted one at a time (S19), so every load is trial-run in sandbox first, remembering a sandbox refresh wipes those trial loads (S13).

## 6. Unverified items (9)

1. Edition names and contents (Starter / Mid-Market / Enterprise) - partner sources only (S29).
2. Sandbox pricing (M-15 "10% / 20%") - no Oracle source; partner ranges disagree (S29).
3. Licence treatment of Customer Center and Vendor Center users - Oracle licence overview is silent (S12).
4. Whether a service tier can be downgraded mid-term - not confirmed.
5. Whether Customer Deposit records can be CSV-imported - not seen in the supported list summary (S2).
6. Exact permission names that control creating accounts and segment values (D-029).
7. Position of UOM, price levels, terms and tax setup in the load order - dependency logic, not an Oracle statement.
8. Whether each marketplace uses EDI (D-074 / D-075).
9. Licence status of connector features (e.g. Shopify Payout Report Sync, EBP) in D-071 / D-076.
