# Slice A - Finance foundation: bank review

Scope: decision areas Entity, Calendar, Costing (D-013, D-031), Revenue, Tax, Assets, Planning, GL, Close, Controls, Reporting, Governance; question prefixes FIN, DIM, CLS, CSH, RPT, CAL; the Enable Features Accounting, Company, Tax and Multi-Book feature sets. Bank read from `ns-tracker/bank/` (decisions.json 87 rows, questions.json 187 rows, layers.json, oneWayDoors.json, moduleScoping.json). Research date 2026-10-12.

Source tags: **[O]** = Oracle docs (docs.oracle.com NetSuite Help, or an Oracle contract document); **[N]** = Oracle NetSuite marketing page (netsuite.com), good for "add-on module" but not for mechanics; **[S]** = Secondary (partner, community, blog). "Unverified" = I could not confirm it from a source; nothing below fills that gap with assumed text.

## Sources

| # | Tag | Title | URL |
|---|---|---|---|
| S1 | O | Enable Advanced Accounting Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1110092646.html |
| S2 | O | Enable Accounting Basic Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1110092533.html |
| S3 | O | Enable Revenue Accounting Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1110092929.html |
| S4 | O | Enable Multi-Book Accounting Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_4176305598.html |
| S5 | O | Accounting-Related Features (Company / Transactions / Employees subtabs) | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1383904.html |
| S6 | O | Using Revenue Recognition (classic) | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N1678106.html |
| S7 | O | Enabling the ARM (Essentials) Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4331936670.html |
| S8 | O | Multiple Currencies in OneWorld | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N269257.html |
| S9 | O | Enabling the Multiple Currencies Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1395677.html |
| S10 | O | Subsidiary Hierarchy Planning | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N269084.html |
| S11 | O | Subsidiary Record Fields Unavailable for Edits | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_162152170370.html |
| S12 | O | Subsidiaries in OneWorld | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N268563.html |
| S13 | O | Elimination Subsidiaries | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N268759.html |
| S14 | O | Setting Up Automated Intercompany Management | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1486610.html |
| S15 | O | Requirements for the Intercompany Framework Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_1522768517.html |
| S16 | O | Differences between SuiteTax and Legacy Tax | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0315035511.html |
| S17 | O | Enabling the SuiteTax Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1513063459.html |
| S18 | O | Enabling Advanced Taxes | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1803739.html |
| S19 | O | Partner Tax Engines / SuiteTax Engine | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_2125829065.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1557396965.html |
| S20 | O | Fiscal Calendars; Setting Up Accounting Periods for a Year | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1449211.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1446183.html |
| S21 | O | Adjustment Periods | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1450241.html |
| S22 | O | Accounting Period Setup | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1445585.html |
| S23 | O | Accounting Period Management | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N1445226.html |
| S24 | O | General Accounting Preferences | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1385293.html |
| S25 | O | Using the Period Close Checklist; Locking and Unlocking Accounting Periods | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1455781.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1451780.html |
| S26 | O | Year-End Closing; Period End Journal Entries; Defining PEJE Settings | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1457773.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1531269686.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1559313740.html |
| S27 | O | Configuring GL Impact for a Custom Segment; Editing Custom Segments | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4385199949.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4385121331.html |
| S28 | O | Enabling the Balancing Segments Feature; Creating a Balancing Segment | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_1547638463.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_1547638483.html |
| S29 | O | Budgets in NetSuite; Multiple Budgets and Budget Categories | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N1503165.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1506174.html |
| S30 | O | Oracle NetSuite Service Descriptions v061526 (effective 15-Jun-2026), EPM section | https://www.oracle.com/contracts/docs/nsgbu_oracle_ns_service_descriptions.pdf |
| S31 | O | NetSuite Planning and Budgeting; Planning and Budgeting Sync vs NSPB Sync | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_160432563078.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_4130425784.html |
| S32 | O | FAM Prerequisites; Fixed Assets Lease Accounting; FAQ: FAM | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_4683871588.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1543968584.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_3891643944.html |
| S33 | N | NetSuite Fixed Assets Management product page | https://www.netsuite.com/portal/products/erp/financial-management/finance-accounting/fixed-assets-management.shtml |
| S34 | N | NetSuite Planning and Budgeting product page | https://www.netsuite.com/portal/products/erp/financial-management/financial-planning.shtml |
| S35 | O | Consolidated Exchange Rate Types; Account Setup in OneWorld | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1405625.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N275342.html |
| S36 | O | Costing Methods; Setting a Default Inventory Costing Method; Group Average Costing | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2191818.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4345703007.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4345703444.html |
| S37 | O | Entering Landed Cost on a Transaction; Landed Cost Allocation per Line | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2418831.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_3728979515.html |
| S38 | O | Enable the Multi-Subsidiary Customer Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1509460991.html |
| S39 | O | Enabling the Intelligent Close Manager Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_7203104321.html |
| S40 | O | Bank Feeds SuiteApp (+FAQ); Supported File Formats for Default Parsers; Auto Bank Statement Import | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_158079179132.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_159010939426.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1508961121.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_159296303155.html |
| S41 | O | SuiteAnalytics Connect FAQ | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1555594476.html |
| S42 | O | Enabling the Amortization Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1766842.html |
| S43 | O | Expense Allocation Overview | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1483457.html |
| S44 | O | GL Audit Numbering; GL Impact Locking | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_3735573963.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4725785967.html |
| S45 | O | Enabling Multi-Book Accounting Features; Adjustment-Only Books Overview | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4842473026.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1546505267.html |
| S46 | O | Using Per-Line Classifications | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N265988.html |
| S47 | O | Enabling the Custom Segments Feature | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4313465000.html |
| S48 | O | Enabling Statistical Accounts | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_3851462725.html |
| S49 | S | NetSuite community / practitioner threads on converting to OneWorld (irreversibility, history stays on root) | https://archive.netsuiteprofessionals.com/t/107934/when-migrating-from-a-single-instance-to-oneworld-does-netsu ; https://epiqinfo.com/what-is-netsuite-oneworld/ |
| S50 | S | Oracle NetSuite Community notice: accounts eligible for automated upgrade to SuiteTax | https://community.oracle.com/netsuite/english/discussion/4512399/your-account-has-been-identified-as-eligible-for-an-automated-upgrade-to-suitetax |
| S51 | S | HouseBlend SuiteTax migration guide (claims new implementations default to SuiteTax) | https://www.houseblend.io/articles/netsuite-legacy-tax-suitetax-migration |

---

## 1. Gaps

Things an implementation in this area must settle that the bank does not have as a decision (or has no question feeding). Proposed IDs are placeholders (`G-A01`...) for the owner to renumber.

| ID | Area | Layer | Gap (decision or question to add) | Why it matters | Source |
|---|---|---|---|---|---|
| G-A01 | Entity | L0 | **Decision: per-subsidiary country, base currency, parent and edition.** Bank D-001 counts subsidiaries; D-033 (L1, Costly) covers base currency. Nothing captures that country, base currency, elimination flag and edition are locked when the subsidiary is first saved, and that country sets the edition and first tax nexus. | Locked fields can only be changed by deleting and recreating the subsidiary (base currency only while it has no transactions). Subsidiary licensing is "based on country and base currency combinations", so this is also a quote input. | S10, S11, S12, S8 [O] |
| G-A02 | Entity | L0 | **Decision: elimination subsidiaries and intercompany automation level** - none / manual elimination JEs / Automated Intercompany Management (AIM) / AIM + Intercompany Framework / Automated Intercompany Drop Ship / Intercompany Time and Expense. FIN-1b ("activity between entities... how eliminated") feeds no decision today. | AIM "can't be disabled after it is enabled... even if you have not created any intercompany entities or transactions", needs at least one elimination subsidiary first; Intercompany Framework requires AIM and also cannot be disabled. Elimination subsidiaries are not licensed and do not count to the 250 limit. | S14, S15, S13, S1 [O] |
| G-A03 | Entity / GL | L0 | **Decision + question: Multi-Book Accounting** - none / Adjustment-Only Books / Full Multi-Book (with Chart of Accounts Mapping, Foreign Currency Management, Revenue and Expense Management, Extended Accounting Period Close Process). Question to add: "Do you report under more than one accounting basis (e.g. local statutory GAAP plus group GAAP or IFRS, or a tax book)?" | OneWorld only; Full Multi-Book "setup requires NetSuite Professional Services"; contact sales rep (quote line). Full Multi-Book can be cleared only while there are no secondary books. Nothing in the bank asks about parallel books. | S4, S45 [O] |
| G-A04 | Calendar | L0 | **Decision: Multiple Calendars (different fiscal year per subsidiary).** FIN-2a (year end) is Tier 1 but feeds no decision. | Multiple Calendars can only be disabled until a new fiscal calendar is assigned to a subsidiary; all adjustment periods must be overlapping before enabling it; base periods are shared by all subsidiaries and "you cannot set up overlapping fiscal years that have different base period formats". | S1, S20, S21 [O] |
| G-A05 | Calendar / Close | L0 | **Decision: year-end close method** - NetSuite automatic year-end (retained earnings calculated, no closing entries) / manual closing JEs / Period End Journal Entries feature per subsidiary (income statement closing, balance sheet closing, consolidation journals). Plus adjustment periods yes/no. Question to add: "Do any entities have a statutory requirement to post closing entries in the ledger?" | PEJE: "If you enable the feature for at least one subsidiary, you can't disable it on the Enable Features page"; requires a historical balances run before first use; Enable PEJE state is locked on the subsidiary record. Adjustment periods accept only journal entries. | S26, S21, S11, S1 [O] |
| G-A06 | Controls | L1 | **Decision: GL Audit Numbering (gapless GL numbering) and GL Impact Locking.** | Meets "international auditing requirements"; requires Accounting Periods; adds a required close task; numbering method can only be set in the last month of a year/quarter/period; GL Impact Locking requires GL Audit Numbering. Whether the feature can be disabled after sequences run: unverified. | S2, S24, S44 [O] |
| G-A07 | Entity / GL | L1 | **Decision: FX rate source and translation set-up** - Currency Exchange Rate Integration (daily provider feed, triangulation/anchor currencies) or manual rates; General Rate Type and Cash Flow Rate Type per account (Current / Average / Historical); Foreign Currency Variance Mapping. | Rate types live on every account record (fixed asset accounts default to Current and must be changed to Historical if that treatment is wanted); mixing rate types creates CTA lines. Exchange Rate Integration works only with the default rate type. | S5, S24, S35, S1 [O] |
| G-A08 | GL / Reporting | L1 | **Decision: header vs line-level classifications and journal balancing rules** - Allow Per-Line Departments / Classes / Locations; Always Allow Per-line Classifications on Journals; Allow Non-balancing Classifications on Journals; Allow Empty Classifications on Journals. | Decides whether one transaction can split across departments/classes; Allow Per-Line Locations is forced on (and hidden) when Multi-Location Inventory is on. D-030 covers only mandatory/optional. | S24, S46 [O] |
| G-A09 | GL / Reporting | L1 | **Decision per custom segment: GL Impact yes/no; and whether any segment is a Balancing Segment** (balance sheet by segment with intersegment accounts). | "After the segment has been created, this option can't be modified" (GL Impact). Balancing segments require Custom Segments, must have GL impact, max two active, GL Impact can't be cleared afterwards. Today D-026/D-028 treat segments as one Costly decision. | S27, S28, S47 [O] |
| G-A10 | GL | L1 | **Decision + question: recurring allocations and prepaid amortization** - none / Expense Allocation (fixed-weight schedules) / Dynamic Allocation (weighted by statistical account balances) / Amortization feature (deferred expense schedules from vendor bills) / manual JEs. Question to add: "Which costs are allocated or spread across periods each month, and on what basis?" (CLS-4/CLS-5 touch it but feed nothing.) | Expense Allocation and Amortization require Accounting Periods; Amortization auto-creates Deferred Expense accounts and needs periods set up for the full schedule horizon; Dynamic Allocation "can't be disabled after it has been used" and depends on Statistical Accounts (D-017). | S1, S42, S43 [O] |
| G-A11 | Close (no Cash area in meta enum) | L5 | **Decision: bank data import and reconciliation method** per bank account - Bank Feeds SuiteApp (free, daily, supported institutions only) / Auto Bank Statement Import via SFTP (+ Bank Statement Parsers SuiteApp for MT940 etc.) / manual file upload (BAI2, CAMT.053, CSV, OFX/QFX) / outside NetSuite. CSH-1 and CSH-5 feed nothing. | Drives the Match Bank Data / Reconcile Account Statement set-up ("Use Match Bank Data and Reconcile Account Statement Pages" box per account), file format work with each bank, and bank onboarding lead time. Note: meta.json `decisionArea` has no Cash value - flagging, not redesigning. | S40, S24 [O] |
| G-A12 | Assets | L0 | **Question: leases under ASC 842 / IFRS 16.** Add to D-018's feeding questions. | FAM includes Lease Accounting (lease records, amortization schedules, ROU asset and lease liability accounts, needs Custom Transactions). A lease requirement can force FAM even with no fixed-asset register. | S32 [O] |
| G-A13 | Close | L0 / L4 | **Decision: close and reconciliation tooling** - native Period Close Checklist only / + Intelligent Close Manager (native, needs Accounting Periods) / NetSuite Account Reconciliation (EPM business process) / NetSuite Close Management and Consolidation (EPM Premium). CLS-1, CLS-6, CLS-11 feed nothing. | EPM services are separate subscriptions (Standard EPM allows one business process: Planning and Budgeting or Account Reconciliation; Close Management and Consolidation is Premium-only). Quote impact. | S39, S30 [O] |
| G-A14 | Reporting | L0 | **Decision: external BI / data warehouse access** - none / SuiteAnalytics Connect (ODBC/JDBC/ADO.NET; add-on, not available on Small Business accounts) / NetSuite Analytics Warehouse (separate subscription tiers) / EPM Narrative Reporting (EPM Premium). | All three are separately purchased; nothing in the bank asks whether reports will be built outside NetSuite. Question to add: "Do any reports or dashboards need to be built in a BI tool or warehouse outside NetSuite?" | S41, S30 [O] |
| G-A15 | Reporting | L6 | **Decision: cash-basis reporting needed?** (Accounting Preferences > Cash Basis Reporting, overridable per custom report). Feed from FIN-3b (lender/investor packages) and RPT-1. | Changes how supported standard reports compute; a lender or tax package on cash basis is a day-one report requirement. | S24 [O] |
| G-A16 | Tax | L0 | **Question: tax registrations per entity and use tax.** FIN-3c covers sales tax obligations; it does not ask for VAT/GST registrations per country, or whether use tax is self-assessed on purchases. | SuiteTax supports multiple tax registrations per subsidiary and assigns a tax engine per nexus; a US consumer's use tax topic exists for SuiteTax. These drive nexus/registration set-up and the engine choice (D-016). | S16, S19 [O]; use-tax topic: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_160086073386.html [O] |
| G-A17 | Calendar | L0 | **Decision: Accounting Periods feature on, and first period / earliest open date.** Not in the bank, though ARM, Amortization, Expense Allocation, GL Audit Numbering, Intelligent Close Manager and FX revaluation all depend on it. | In non-OneWorld accounts it cannot be disabled while any period exists; "each day must belong to an accounting period"; a period created before a locked period is locked on creation. | S22, S23, S7, S9, S39, S42, S43 [O] |
| G-A18 | Controls | L1 | **Decision: closed-period posting rules (preferences, not just who)**: Allow Transaction Date Outside of Posting Period (Disallow/Warn/Allow); Default Posting Period When Transaction Date in Closed Period; Enable Accounting Period Window; Create and Edit Inventory Transactions Dated in Closed Periods; Allow Non-GL Changes Is Set by Default; Allow Quick Close. | D-035 frames this as "who may post"; these preferences set what the system does for everyone. Better as options inside D-035 than a new row (see section 3). | S24, S25 [O] |
| G-A19 | Planning | L0 | **Decision detail: budget structure** - one budget per year vs Multiple Budgets (budget categories); in OneWorld + multi-currency each category is Global (root currency) or Local (subsidiary currency); budget dimensions (customer/project, item, department, class, location, subsidiary); statistical budgets. | Shapes budget import format and Budget vs Actual reports; budget data does not show if Report by Period = Never. Fold into D-019 options. | S29, S1 [O] |
| G-A20 | Controls | L4 | **Decision detail: journal entry approval** - Require Approvals on Journal Entries (preference) vs SuiteFlow approval routing for journals vs none. | The preference is hidden when journal approval routing via SuiteFlow is used; ARM/Amortization journal forms should be excluded from approval workflows. Fold into D-068 options. | S24 [O] |

Questions in this slice that feed **no decision** today (useful for decision logic; several are covered by gaps above): FIN-1b (-> G-A02), FIN-2a (-> G-A04), FIN-2c, FIN-3a, FIN-3b (-> G-A15), FIN-3d, FIN-3e, FIN-4b (-> D-041, outside slice), FIN-4d, FIN-5b, CLS-1, CLS-2, CLS-4, CLS-5 (-> G-A10), CLS-6 (-> G-A13), CLS-7, CLS-11 (-> G-A02/G-A13), CSH-1, CSH-4, CSH-5 (-> G-A11), CSH-6, RPT-2, CAL-3. (Computed from decisions.json `questionIds`.)

---

## 2. Corrections

| # | ID | Field | Current | Proposed | Source |
|---|---|---|---|---|---|
| C-A01 | D-002 | notes / dependency | Treated as an independent yes/no. | Add: "Required (forced yes) when D-001 = OneWorld." Oracle: "The Multiple Currencies feature is required for NetSuite OneWorld." Disabling: "You can't disable the feature after you create transactions and records that rely upon it." Also needs Accounting Periods to post revaluation properly. | S8, S9 [O] |
| C-A02 | D-033 | reversibility, layer | Costly, L1 | **One-way, L0** for base currency: "After you define and save a base currency on a subsidiary record, you can't change it" (exception: no transactions yet -> delete nexus and subsidiary, recreate). Consolidated exchange rates themselves are a monthly process (Easy) - consider splitting rate maintenance into G-A07. | S10, S11, S8 [O] |
| C-A03 | D-003 | notes | "Retrofitting OneWorld later is a migration, not a setting change" | Oracle describes an upgrade path: "If your account was upgraded to OneWorld, the preexisting data is used for the root subsidiary." So it is an account upgrade, not a new account - but history stays on the root subsidiary and cannot be split [S49, Secondary]. That OneWorld cannot be reversed/downgraded is Secondary only (unverified in Oracle docs). Suggest per-option reversibility: "Yes now" = One-way (unverified); "No, upgrade later" = Costly. | S12 [O]; S49 [S] |
| C-A04 | D-001 | nsSetting / notes | "Subsidiaries; OneWorld provisioning" | Add: 250-subsidiary limit (elimination and inactive subsidiaries excluded); subsidiary licensing "based on country and base currency combinations"; country on the subsidiary sets edition and first nexus. | S12, S13 [O] |
| C-A05 | D-015 | nsSetting / notes | "Enable Features > Advanced Revenue Management" | Renamed: **Advanced Revenue Management (Essentials)**, optional add-on **ARM (Revenue Allocation)** (fair value / SSP allocation), plus **ARM in Configuration Mode** (auto-enabled; configure without recognising). Prerequisite: Accounting Periods. "When you enable this feature, you can't disable it" - but the enabling page also says it can be disabled while Configuration Mode is still on and no system account has a balance (this deletes ARM configuration). Classic Revenue Recognition / VSOE / Revenue Commitments "aren't available in new NetSuite implementations" - so the real choice is ARM vs manual deferral JEs. Bank's "Expensive module" claim: licensing/price unverified in Oracle docs. | S1, S6, S7 [O] |
| C-A06 | D-016 | nsSetting | "Enable Features > Advanced Taxes / SuiteTax" | **Tax subtab: SuiteTax** (account-level, all subsidiaries; "non-reversible... can't be disabled"; incompatible features/SuiteApps must be removed first; tax engine chosen per nexus on subsidiary tax registrations; native engines free, partner engines - Anrok, Avalara AvaTax, Numeral, Sovos, Sphere, TaxJar, ONESOURCE, Vertex, CCH SureTax - are a cost). **Advanced Taxes** is a legacy-tax feature, "already enabled in NetSuite OneWorld accounts" and cannot be disabled once enabled. So in OneWorld the choice is legacy (Advanced Taxes) vs SuiteTax. Claim that new implementations now default to SuiteTax: unverified (Secondary only, S51); Oracle is auto-upgrading some eligible legacy accounts (S50, Secondary). | S16, S17, S18, S19 [O]; S50, S51 [S] |
| C-A07 | M-06 | ask | "SuiteTax or legacy Advanced Taxes, and is a tax partner (Avalara etc.) needed?" | Reword: "SuiteTax or legacy tax (Advanced Taxes is already on in OneWorld), and which tax engine per nexus - native SuiteTax Engine (no cost) or a partner engine (separate cost)?" | S18, S19 [O] |
| C-A08 | D-018 | notes, questionIds | "Module scoping; depreciation posting"; fed by FIN-5c only | Add lease accounting (FAM includes IFRS 16 / ASC 842 lease records and journals) and add a lease question (G-A12). FAM is an "add-on module" [N]; prerequisites: Custom Records, Custom Transactions, Client and Server SuiteScript, Online Forms. FAM "does not currently generate a parallel set of books" - parallel-book depreciation needs Multi-Book (G-A03). | S32 [O]; S33 [N] |
| C-A09 | M-08 | ask | "Fixed Assets Management: needed?" | "Fixed Assets Management (incl. lease accounting): needed?" | S32 [O] |
| C-A10 | D-019 / M-10 | nsSetting | "Native Budgets (no cost) vs NetSuite Planning & Budgeting (separate product)" | NSPB is a business process of **Oracle NetSuite EPM** (Standard or Premium cloud service, named-user subscription, requires an active NetSuite ERP subscription), integrated via the **Planning and Budgeting Sync** SuiteApp (Oracle says new customers use this, not NSPB Sync). Standard EPM covers one business process (NSPB *or* Account Reconciliation), max 10 users. Native side: Budgets plus optional **Multiple Budgets** feature. "No cost" for native budgets: not stated in Oracle docs (unverified, though no licence note appears on the feature). | S30, S31, S1 [O]; S34 [N] |
| C-A11 | D-004 | notes | "Every period-based report; close checklist" | Add: Set Up Full Year offers Calendar Months (12), 4 Weeks (13 periods) and 4-4-5 Weeks; optional one-day year-end adjustment period (journals only). Overlapping fiscal years with different base formats are not allowed; closed periods cannot be deleted - so a shape change is only practical at a fiscal-year boundary (keep Costly). 4-5-4 / 5-4-4 patterns via Set Up Full Year: unverified (likely manual base-period setup). | S20, S21, S22 [O] |
| C-A12 | D-026, D-028 | nsSetting / reversibility | "Custom Segments", Costly | Add: per segment, the **GL Impact** flag is one-way ("after the segment has been created, this option can't be modified"); ID cannot change. Custom Segments feature is on the SuiteCloud subtab and cannot be disabled if a segment is applied to a budget record. | S27, S47, S28 [O] |
| C-A13 | D-030 | nsSetting | "Custom Segment / Dept / Class settings" | "Accounting Preferences > Classifications: Make Departments / Classes / Locations Mandatory; Allow Empty Classifications on Journals; custom segment mandatory setting." Custom-form overrides must be updated too. | S24 [O] |
| C-A14 | D-035 | nsSetting | "Manage Accounting Periods; period close checklist" | Add: Accounting Preferences (Allow Transaction Date Outside of Posting Period; Default Posting Period When Transaction Date in Closed Period; Enable Accounting Period Window; Create and Edit Inventory Transactions Dated in Closed Periods; Allow Non-GL Changes default); period-level Lock A/R, Lock A/P, Lock Payroll, Lock All (by subsidiary in OneWorld); permissions Override Period Restrictions and Allow Non G/L Changes. | S24, S25 [O] |
| C-A15 | D-024 | notes | Lists only Inventory and MLI auto-created accounts | Extend: Accounting creates Undeposited Funds and Refunds Payable (+ Sales Tax Payable in US edition); A/R and A/P create their control accounts; Multiple Currencies creates Realized / Unrealized / Unrealized Matching / Rounding Gain/Loss after revaluation; ARM creates Deferred Revenue, Deferred Revenue Clearing, Unbilled Receivable, Revenue Arrangement (non-posting); Amortization creates Deferred Expense; AIM creates CTA Elimination. | S2, S5, S7, S42, S1 [O] |
| C-A16 | D-031 | notes / options | "Default inherited by new item records" | Options and prerequisites: Average (system default), FIFO, LIFO (not in AU edition), Group Average (requires Multi-Location Inventory + location costing groups), Standard (requires Standard Costing feature), Lot Numbered (lot items), Specific (serial). The per-item method "can't be changed after you save it on the item record", so the default is low-risk only if every item load sets the method explicitly. | S36 [O] |
| C-A17 | D-013 | notes | "Item cost accuracy; margin reporting; close" | Add: Landed Cost is on the Items & Inventory subtab; with Advanced Receiving the allocation happens on the item receipt; item must be set to track landed costs; optional "Landed Cost Allocation per Line" preference. Reversibility (Costly) not confirmed by a source - unverified. | S37, S36 [O] |
| C-A18 | oneWayDoors #6 | constraint | "Cannot be disabled once used: ARM, Multiple Currencies, Dynamic Allocation, Statistical Accounts, Advanced Taxes. MLI support-only." | Add, all Oracle-sourced: **SuiteTax** (non-reversible), **Automated Intercompany Management** and **Intercompany Framework** (cannot be disabled once *enabled*, even unused), **ARM (Revenue Allocation)**, **Period End Journal Entries** (once on for one subsidiary), **Multiple Calendars** (once a calendar is assigned to a subsidiary), **Accounting Periods** in non-OneWorld (while any period exists), **custom segment GL Impact** (per segment), **subsidiary base currency / country** (per subsidiary). Note ARM nuance in C-A05 and Statistical Accounts can be disabled if no statistical accounts/journals/schedules exist. | S1, S7, S14, S15, S17, S22, S26, S27, S11, S48 [O] |
| C-A19 | oneWayDoors #8 | confidence / source / isOneWay | Secondary; "requires reversing or deleting all related transactions to disable"; isOneWay true | Upgrade to Oracle docs: disable = reverse/delete all transactions tied to secondary subsidiaries, remove secondary subsidiaries from customer records, then clear the box. That is Costly rather than strictly one-way. | S38 [O] |
| C-A20 | M-02 | ask | "Is OneWorld included, and what does adding a subsidiary later cost?" | "...and what does each additional country / base-currency combination cost?" (licensing basis per Oracle). | S12 [O] |
| C-A21 | M-03 | ask | "Advanced Revenue Management: in scope or not?" | "ARM (Essentials) - and is ARM (Revenue Allocation) needed for multi-element SSP allocation?" | S1 [O] |
| C-A22 | D-017 | notes | "Cannot be disabled once used." | Precise: can be disabled while no statistical accounts, statistical journals or statistical schedules exist; once used, cannot. Also prerequisite for Dynamic Allocation (G-A10). | S1, S48 [O] |
| C-A23 | D-070 | nsSetting | Saved searches only | Native options now exist: Intelligent Close Manager (task list, KPIs, AI exceptions; needs Accounting Periods) and Exception Management (+ Exception Management Models). Licensing for these: not stated in Oracle docs (unverified). | S1, S39 [O] |
| C-A24 | D-034 | nsSetting | "Intercompany preferences; transfer price on transfer orders" | Mechanics of intercompany transfer pricing not verified in this sweep - flag for the inventory/O2C slice. Note AIM's dependence on elimination subsidiaries (G-A02). | unverified |
| C-A25 | D-020 | nsSetting | "Demand Planning module (likely NOT needed)" | Module name, licensing and scope not verified here - leave to the supply-chain slice. | unverified |

---

## 3. Decision options draft

Format per decision: **input type**; options with *Configure* / *Leave off* / *Requires* / *Makes N/A* / *Licence-quote* / *One-way?*; **feeding questions** (confirm / add). Decision ids outside the slice are named where they interact. "n/s" = no source states a licence impact.

### D-001 Entity - OneWorld and number of subsidiaries
- **Input:** single (+ number). Options:
  - **Single entity (no OneWorld).** Configure: company record only. Leave off: subsidiaries, intercompany features, Multi-Book, Multiple Calendars, PEJE. Makes N/A: D-034, G-A02, G-A03, G-A04, PEJE part of G-A05. Licence: none. One-way: no (upgrade later possible, S12).
  - **OneWorld, N subsidiaries (number).** Configure: subsidiary records top-down from root, each with country, base currency, parent (G-A01); elimination subsidiary under each parent with children (S10, S13). Requires: D-002 = yes (forced, S8), G-A01, G-A02. Licence: OneWorld; subsidiary licensing by country + base currency combination (S12). Limit 250 excluding elimination/inactive (S12). One-way: yes for downgrade (Secondary, S49 - unverified in Oracle).
- **Feeding:** FIN-1a (confirm), FIN-6 (add), CLS-11 (add).

### D-002 Entity - Multiple Currencies
- **Input:** yesno.
  - **Yes.** Configure: Multiple Currencies (Company subtab), currency records, base currency marked, Accounting Periods (needed for revaluation), FX rate source (G-A07). System gain/loss accounts appear after revaluation (S5). Requires: G-A17. Licence: n/s. One-way: yes once records/transactions rely on it (S9).
  - **No.** Leave off. Makes N/A: G-A07. Not available if D-001 = OneWorld (forced yes, S8).
- **Feeding:** FIN-1c (confirm), FIN-1a (add), CSH-1/CSH-2 (add - foreign-currency bank or processor accounts).

### D-003 Entity - provision OneWorld now for future entities
- **Input:** yesno.
  - **Yes, provision now.** Same as D-001 OneWorld branch. One-way: downgrade not supported (Secondary, S49).
  - **No, upgrade if needed.** Costly later: upgrade puts existing data on the root subsidiary (S12); splitting history not possible (Secondary, S49). Licence: priced at upgrade (ask now - M-02).
- **Feeding:** FIN-6 (confirm), CAL-3 (add).

### D-004 Calendar - fiscal calendar shape
- **Input:** single. Options: **12 calendar months** / **13 x 4-week periods** / **4-4-5 weeks** / **other week pattern (manual setup - unverified)**; plus sub-input yesno **one-day year-end adjustment period** (S20, S21).
  - Configure: Set Up Full Year with First Fiscal Month and format (S20). Requires: G-A17 (Accounting Periods), FIN-2a year end. Makes required: G-A04 if subsidiaries need different year ends. Licence: none. One-way: Costly - change only at a fiscal-year boundary; closed periods cannot be deleted; overlapping years with different formats not allowed (S20, S22).
- **Feeding:** FIN-2b (confirm), FIN-2a (add), FIN-2c (add - stub periods in history affect migrated periods).

### D-013 Costing - landed cost capitalisation
- **Input:** single. Options:
  - **Expense freight/duty (no landed cost).** Leave off Landed Cost. Makes N/A: D-056 (outside slice).
  - **Capitalise via Landed Cost feature.** Configure: Landed Cost (Items & Inventory subtab), landed cost categories, items flagged to track landed cost, optional Landed Cost Allocation per Line preference (S37). Interaction: with Advanced Receiving (D-014) allocation is on the item receipt (S37). Licence: n/s in Oracle docs (bank M-05 asks). One-way: unverified.
  - **Capitalise via manual JE / standard-cost overhead.** Configure: process only; if standard costing, cost categories (D-041, outside). Licence: none.
- **Feeding:** FIN-4c (confirm), P2P-9, P2P-10 (add, outside slice).

### D-015 Revenue - deferred / subscription revenue scheduling
- **Input:** single. Options:
  - **Recognise at invoice/shipment, no deferral engine.** Leave off ARM. Makes N/A: C-A21 Revenue Allocation sub-question.
  - **Manual deferral journals.** Configure: deferred revenue accounts; recurring JEs. Licence: none.
  - **ARM (Essentials).** Configure: ARM (Essentials) (auto-turns on Configuration Mode), Accounting Periods, revenue recognition rules, item revenue settings; system accounts Deferred Revenue, Deferred Revenue Clearing, Unbilled Receivable, Revenue Arrangement (S7). Requires: G-A17. Licence: contact sales (S1 - specific pricing unverified). One-way: yes once Configuration Mode is turned off (S7).
  - **ARM (Essentials) + ARM (Revenue Allocation).** Adds fair value / SSP allocation across performance obligations; also cannot be disabled (S1).
  - Not an option: classic Revenue Recognition / VSOE / Revenue Commitments - not available in new implementations (S6).
- **Feeding:** FIN-5a, O2C-5a (confirm); O2C-5c (add, as M-03 already does).

### D-016 Tax - tax engine and nexus handling
- **Input:** single (+ per-nexus engine list). Options:
  - **Legacy tax, basic (non-OneWorld US only).** Configure: tax codes/groups, nexus. Leave off Advanced Taxes. One-way: no.
  - **Legacy tax with Advanced Taxes.** Configure: Advanced Taxes (Tax subtab), tax schedules on items. Already on in OneWorld (S18). One-way: yes (S18).
  - **SuiteTax + native SuiteTax Engine.** Configure: SuiteTax (Tax subtab), SuiteTax Engine bundle and plug-in, subsidiary tax registrations with engine per nexus; remove incompatible features/SuiteApps first (S17, S19). Licence: native engine no cost (S19). One-way: yes, account-wide (S16, S17).
  - **SuiteTax + partner engine (per nexus).** As above with a partner engine (Avalara, Vertex, etc.) on chosen nexuses. Licence: partner subscription (S19). One-way: yes.
  - Cross-checks: SuiteTax requires removing International Tax Reports and similar bundles; SiteBuilder sites must be inactive or information-only (S17-related search result). Native engine does not cover Brazil/India nexuses (separate engines, S19).
- **Feeding:** FIN-3c (confirm); add G-A16 question (registrations per country, use tax); FIN-1a (entity countries).

### D-017 Reporting - per-unit / statistical metrics
- **Input:** yesno.
  - **Yes.** Configure: Statistical Accounts (Accounting subtab) - auto-enables Multiple Units of Measure; statistical accounts, statistical journals/schedules. Requires: D-007 (MUOM, outside slice) becomes yes (S48). Enables option: Dynamic Allocation (G-A10). Licence: n/s. One-way: yes once used (S1).
  - **No.** Leave off. Makes N/A: Dynamic Allocation option of G-A10.
- **Feeding:** DIM-6 (confirm), RPT-3 (add).

### D-018 Assets - fixed asset register in NetSuite
- **Input:** single. Options:
  - **Outside NetSuite; post depreciation by JE.** Licence: none.
  - **FAM SuiteApp (assets only).** Configure: install FAM; enable Custom Records, Custom Transactions, Client/Server SuiteScript, Online Forms (S32); asset types, depreciation methods, accounts. Licence: add-on module (S33 [N]). One-way: no (Easy, kept).
  - **FAM incl. Lease Accounting.** Adds lease records, ROU asset / lease liability / interest accounts (S32).
  - Note: parallel-book depreciation needs Multi-Book (G-A03); FAM "does not currently generate a parallel set of books" (S32).
- **Feeding:** FIN-5c (confirm); add lease question (G-A12).

### D-019 Planning - budget vs actual
- **Input:** single (+ multi for dimensions). Options:
  - **No budgets in NetSuite.**
  - **Native single budget per year.** Configure: Set Up Budgets; dimensions from {customer/project, item, department, class, location, subsidiary}; Report by Period not "Never" (S29).
  - **Native Multiple Budgets.** Configure: Multiple Budgets feature; budget categories; in OneWorld + multi-currency choose Global vs Local per category; Budget Exchange Rates (S29, S1).
  - **NSPB (EPM).** Configure: EPM subscription, Planning and Budgeting Sync SuiteApp (S30, S31). Licence: separate EPM subscription + named users (S30). Makes required: interface design for actuals and budget write-back.
  - One-way: none known; Custom Segments cannot be disabled once a segment is on a budget record (S47).
- **Feeding:** FIN-7a (confirm), CAL-2 (add - budget cycle), D-017 if statistical budgets wanted.

### D-020 Planning - demand forecast external
- **Input:** single: **Forecast stays external (interface in/out)** / **Forecast moves into NetSuite**. NetSuite module naming and licensing for demand planning not verified in this sweep (C-A25) - draft options only, defer configure/licence fields to supply-chain slice.
- **Feeding:** FIN-7b (confirm).

### D-024 GL - chart of accounts
- **Input:** text-only (the COA is a list) with structured sub-inputs: yesno **Use Account Numbers** (S24); yesno **Expand Account Lists** (S24); per account General Rate Type / Cash Flow Rate Type when multi-currency (S35, G-A07).
  - Configure: account records; expect system accounts from enabled features (C-A15). Licence: none. One-way: Costly (kept).
- **Feeding:** DIM-1 (confirm), DIM-2 (add).

### D-025 GL - accounts that are really dimensions
- **Input:** text-only (mapping list old account -> new account + dimension values). Requires: D-026 dimensions exist. Configure: account + department/class/location/segment mapping for migration. Costly (kept).
- **Feeding:** DIM-2 (confirm), DIM-1.

### D-026 Reporting - reporting axes
- **Input:** multi: **Department / Class / Location / Custom segment(s) (text list) / Subsidiary (OneWorld)**; per custom segment sub-input yesno **GL Impact** (one-way per segment, S27).
  - Configure: Departments, Classes, Locations (Company subtab, Classifications); Custom Segments feature (SuiteCloud subtab, S47); records for each value. Location becomes required if MLI (D-005, outside). Requires: D-030, G-A08. Licence: none stated. One-way: GL Impact flag per segment.
- **Feeding:** DIM-3 (confirm), DIM-4, DIM-5 (add).

### D-027 Reporting - manual Excel cuts
- **Input:** text-only (list of views) with per-view single: **covered by D-026 dimensions / needs new segment / saved search or report only / out of scope**. Feeds D-026, D-079/D-080.
- **Feeding:** DIM-4 (confirm), RPT-1 (add).

### D-028 Reporting - axes never had
- **Input:** text-only list, each with single: **add as segment now / defer**. Same configure and GL Impact rule as D-026.
- **Feeding:** DIM-5 (confirm).

### D-029 Governance - who creates accounts and dimension values
- **Input:** single: **Controller/admin only** / **Finance roles with approval** / **Any finance user**; plus text naming convention.
  - Configure: role permissions for Accounts and classification lists; custom segment value permissions. One-way: no. Licence: none.
- **Feeding:** DIM-7 (confirm).

### D-030 Reporting - mandatory vs optional segments
- **Input:** per dimension single: **Mandatory / Optional**; plus yesno **Allow Empty Classifications on Journals** (S24).
  - Configure: Make Departments / Classes / Locations Mandatory; custom segment mandatory setting; update custom forms. One-way: no.
- **Feeding:** DIM-8 (confirm).

### D-031 Costing - default costing method
- **Input:** single: **Average / FIFO / LIFO / Group Average / Standard** (Lot Numbered and Specific are per-item for lot/serial items, S36).
  - Group Average requires D-005 MLI yes + location costing groups (S36). Standard requires Standard Costing feature and D-041 (outside). LIFO not in AU edition. One-way: default is Easy; per-item method is One-way (D-036).
- **Feeding:** FIN-4a (confirm), FIN-4b (add).

### D-033 Entity - base currency and consolidation rates
- **Input:** per subsidiary single (currency list) + single **consolidated rate maintenance: NetSuite-calculated from exchange rate table / manual override**.
  - Configure: base currency on subsidiary (locked at first save, S10/S11); Consolidated Exchange Rates updated at close (S35). Requires: D-002 yes when >1 currency. One-way: base currency yes (C-A02).
- **Feeding:** FIN-1a, FIN-1c (confirm).

### D-034 Entity - intercompany transfer pricing
- **Input:** single: **At cost / Cost plus markup / Other (text)**. Requires D-001 OneWorld; interacts with G-A02. Configure details unverified (C-A24). Costly (kept).
- **Feeding:** FIN-8 (confirm), FIN-1b (add).

### D-035 Controls - period locking and closed-period posting
- **Input:** structured group:
  - single **Allow Transaction Date Outside of Posting Period: Disallow / Warn / Allow** (S24).
  - single **Default posting period for dates in closed periods: Current Period / First Open Period** (S24).
  - yesno **Enable Accounting Period Window** (+ number Minimum Period Window Size 1-1000) (S24).
  - yesno **Create and Edit Inventory Transactions Dated in Closed Periods** (affects all subsidiaries in OneWorld) (S24).
  - yesno **Allow Non-GL Changes set by default** (S24).
  - text **roles holding Override Period Restrictions** (S25).
  - One-way: none. Requires: G-A17.
- **Feeding:** CLS-10 (confirm), CLS-7 (add).

### D-068 Controls - approval thresholds and routing
- **Input:** per transaction type multi + number thresholds. Journal sub-input single: **No JE approval / Require Approvals on Journal Entries preference / SuiteFlow journal approval routing** (S24). Other types (PO, bill, expense) outside slice.
  - Configure: preference or approval routing workflows; exclude ARM/Amortization JE forms from workflows (S24). One-way: no.
- **Feeding:** ORG-2 (confirm).

### D-069 Controls - segregation of duties
- **Input:** text-only (role matrix). Configure: custom roles and permissions. No native SoD rules engine was found in this sweep (unverified either way). One-way: no.
- **Feeding:** ORG-3 (confirm), FIN-3a (add - audit status drives rigour).

### D-070 Close - early-warning searches
- **Input:** multi: **negative inventory / date-period mismatch / unbilled receipts / missing external files / other (text)**; plus yesno **Intelligent Close Manager** and yesno **Exception Management** (S1, S39).
  - ICM requires Accounting Periods; Exception Management requires Exception Management Models (S1). Licence: n/s. One-way: n/s.
- **Feeding:** CLS-3, CLS-9 (confirm), CLS-1 (add).

### D-079 Reporting - day-one reports
- **Input:** text-only list (report, format, audience). Sub-input yesno **cash-basis version needed** (G-A15).
- **Feeding:** CLS-8 (confirm), FIN-3b, RPT-2 (add).

### D-080 Reporting - full report inventory and metric definitions
- **Input:** text-only (table). Sub-input single per report: **native report / saved search / workbook / external BI** - external BI makes G-A14 required.
- **Feeding:** RPT-1, RPT-3 (confirm), RPT-2 (add).

### D-081 Reporting - recall / traceability acceptance test
- **Input:** yesno (run as acceptance test) + text scenario. Out-of-finance mechanics left to the quality/traceability slice.
- **Feeding:** QLT-6 (confirm), FIN-3d, FIN-3e (add).

### D-082 Reporting - validation that L1 dimensions produce L6 reports
- **Input:** yesno (pass / fail with rework list). Not a configuration decision; a gate. Costly kept.
- **Feeding:** DIM-3 (confirm), CLS-8, RPT-1 (add).

### Options for proposed gap decisions (short)
- **G-A01 per-subsidiary set-up** - input: table per subsidiary (country single, base currency single, parent single, elimination yesno). One-way per field (S11).
- **G-A02 intercompany automation** - single: **None / Manual elimination JEs / AIM / AIM + Intercompany Framework**; multi add-ons: **Intercompany Time and Expense / Automated Intercompany Drop Ship / Advanced Intercompany JEs**. AIM requires elimination subsidiary first (S14). One-way: AIM and Framework yes (S14, S15).
- **G-A03 Multi-Book** - single: **None / Adjustment-Only Books / Full Multi-Book**; multi under Full: **Chart of Accounts Mapping / Foreign Currency Management / Revenue and Expense Management / Extended Accounting Period Close Process** (S4). Requires D-001 OneWorld. Licence: sales rep; Full needs NetSuite Professional Services (S4). One-way: Full can be cleared only with no secondary books (S45); Adjustment-Only disable unverified.
- **G-A04 Multiple Calendars** - yesno. Requires D-001 OneWorld. One-way after assigning a calendar to a subsidiary (S20).
- **G-A05 year-end close** - single: **Automatic (calculated retained earnings) / Manual closing JEs / Period End Journal Entries** (+ multi: income statement closing, balance sheet closing, consolidation journals); yesno adjustment period. PEJE requires OneWorld; one-way once on for one subsidiary (S26).
- **G-A06 GL Audit Numbering** - yesno (+ yesno GL Impact Locking). Requires G-A17. One-way: unverified.
- **G-A07 FX** - single **rate source: Exchange Rate Integration provider / manual**; yesno triangulation; per-account rate types (S24, S35). Requires D-002 yes.
- **G-A08 per-line classifications** - per dimension single **Header / Line**; yesno non-balancing journals (S24).
- **G-A09 segment GL impact / balancing** - per segment yesno GL Impact (one-way); yesno Balancing Segment (max 2 active; requires GL impact) (S27, S28).
- **G-A10 allocations / amortization** - multi: **Expense Allocation / Dynamic Allocation / Amortization / manual JEs**. Dynamic Allocation requires D-017 yes and is one-way once used (S1).
- **G-A11 bank data** - per bank account single: **Bank Feeds / ABSI (SFTP) / manual file / not reconciled in NetSuite** (S40). Bank Feeds is free (S40).
- **G-A13 close tooling** - multi: **Period Close Checklist only / Intelligent Close Manager / NetSuite Account Reconciliation (EPM) / Close Management and Consolidation (EPM Premium)** (S30, S39).
- **G-A14 external BI** - multi: **None / SuiteAnalytics Connect / NetSuite Analytics Warehouse / EPM Narrative Reporting** (S30, S41). All separately purchased.
- **G-A17 Accounting Periods** - effectively yesno (default yes). One-way in non-OneWorld once a period exists (S22).

---

## 4. Cross-area touches

| From (this slice) | Depends on / affects | Rule | Source |
|---|---|---|---|
| D-017 Statistical Accounts | D-007 Multiple Units of Measure (Items) | Enabling Statistical Accounts auto-enables MUOM; MUOM cannot then be disabled if statistical accounts used. | S48, S1 [O] |
| D-031 Group Average default | D-005 Multi-Location Inventory (Inventory) | Group Average costing available only with MLI. | S36 [O] |
| D-031 Standard default | D-041 standard cost set-up (Costing, outside) | Standard costing feature must be enabled first. | S36 [O] |
| D-031 / D-036 | D-014 Advanced Receiving (Procurement) | Costing posts at item receipt with Advanced Receiving, at bill without. | S36 [O] |
| D-013 Landed Cost | D-014 Advanced Receiving | With Advanced Receiving, landed cost is allocated on the item receipt. | S37 [O] |
| G-A08 per-line locations | D-005 MLI | Allow Per-Line Locations is auto-enabled and hidden when MLI is on. | S24 [O] |
| D-015 ARM | D-073 subscription platform (Integration); SuiteBilling | ARM arrangement date can follow SuiteBilling subscription dates (preference requires SuiteBilling); Stripe's connector supports ARM only, not classic. | S24 [O]; https://docs.stripe.com/connectors/netsuite/revenue-recognition [S] |
| D-015 ARM, G-A10, G-A06, D-070 ICM, D-002 revaluation | G-A17 Accounting Periods | All require or rely on Accounting Periods. | S7, S42, S43, S2, S39, S9 [O] |
| D-016 SuiteTax | Commerce/web store decisions (O2C) | SuiteTax requires SiteBuilder sites inactive or information-only; Advanced Promotions being deprecated; NSPOS needs Support confirmation. | S17 (search summary of SuiteTax prerequisites) [O] |
| D-016 SuiteTax | Installed SuiteApps (Integration) | International Tax Reports and other legacy-tax bundles must be uninstalled before enabling. | S17 [O] |
| G-A02 AIM | D-001 OneWorld + elimination subsidiaries; O2C cross-subsidiary fulfilment; Multi-Subsidiary Customer (O2C) | AIM requires OneWorld and elimination subsidiaries; Multi-Subsidiary Customer disable requires reversing related transactions. | S14, S38 [O] |
| G-A03 Multi-Book | D-018 FAM; D-015 ARM; D-016 tax reporting | FAM does not produce parallel books on its own; ARM revenue per book via Revenue and Expense Management; adjustment-only books supported in Tax Reporting Framework. | S32, S4 [O]; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_160222998474.html [O] |
| D-018 FAM | SuiteCloud features (Integration/Access) | FAM needs Custom Records, Custom Transactions, Client and Server SuiteScript, Online Forms. | S32 [O] |
| G-A09 Balancing Segments | Custom Segments feature (SuiteCloud) | Balancing Segments requires Custom Segments with GL impact. | S28 [O] |
| G-A11 bank data | D-058 payment execution / Electronic Bank Payments (AP); D-076 processor payout reconciliation (Integration) | In-Transit Payments feature clears vendor payments through Match Bank Data; Vendor Prepayments is a separate Accounting feature. | S1 [O] |
| D-019 NSPB, G-A13, G-A14 | D-022 user licences (Licensing) | EPM and NSAW are named-user subscriptions separate from ERP users. | S30 [O] |
| D-035 closed-period inventory preference | Inventory costing (Inventory slice) | Non-GL changes in locked periods can still trigger inventory costing recalculation; inventory closed-period preference applies to all subsidiaries. | S25, S24 [O] |
| D-004 / G-A04 | D-086 go-live date (Cutover) | Periods must exist for every day; reports by period need the full fiscal year set up; first period choice interacts with MLI enable date (oneWayDoors #3). | S22 [O] |

---

## 5. Unverified items (do not build on these without a source)

1. OneWorld cannot be downgraded / reversed once enabled (Secondary only, S49).
2. Licence price or add-on status of ARM in Oracle docs (only "contact your sales or account representative" in the context of migrating from classic, S1); bank's "expensive" note.
3. Native Budgets "no cost" (no licence note found either way).
4. Landed Cost reversibility (bank: Costly).
5. GL Audit Numbering can or cannot be disabled after sequences run.
6. Adjustment-Only Books can or cannot be disabled.
7. New NetSuite implementations default to SuiteTax (Secondary S51); automated SuiteTax upgrades for eligible legacy accounts (Oracle community notice, S50).
8. 4-5-4 / 5-4-4 calendars through Set Up Full Year (only Calendar Months, 4 Weeks, 4-4-5 Weeks documented).
9. Intercompany transfer pricing mechanics (D-034).
10. Demand Planning module naming/licensing (D-020).
11. Licensing of Intelligent Close Manager and Exception Management (no licence note found).
12. Whether NetSuite has any native segregation-of-duties rule engine (D-069).
13. Whether Accounting Periods can be disabled in OneWorld accounts (Oracle only states the non-OneWorld rule).
