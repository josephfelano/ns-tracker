# E - Irreversibility and feature dependencies (bank audit)

Scope: `ns-tracker/bank/oneWayDoors.json` (16 entries), every One-way / Costly decision in `decisions.json`, missing one-way doors, the Enable Features dependency graph, and order constraints against `layers.json`. Researched 2026-10-12 against the live Oracle NetSuite Help (docs.oracle.com). Base URL for every "Oracle docs" link below: `https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/`. Quotes are Oracle's wording as fetched. Anything not found on an Oracle page is marked **unverified** or tagged **Secondary**.

Note on method: three Oracle pages were seen only through a search-engine excerpt, not a direct fetch; they are marked "(search excerpt)". Everything else was fetched directly.

## Summary

| Measure | Count |
|---|---|
| oneWayDoors.json entries checked | 16 |
| Confirmed (fact as stated is right) | 11 (#1, #2, #4, #5, #6, #7, #8, #9, #11, #12, #16) |
| Partly right | 3 (#10, #14, #15) |
| Wrong | 0 outright, but 6 entries flagged `isOneWay: true` are not irreversibility constraints (#9, #10, #11, #12, #13, #14) |
| Unverified (no Oracle source found) | 2 (#3, #13) |
| Decisions marked One-way checked | 14: 7 confirmed, 2 partly, 5 unverified / not a platform constraint |
| Decisions that should be One-way but are not | 1 (D-033 base currency) |
| New one-way / Support-only doors found (Oracle-sourced) | 19 |
| Feature dependency relationships mapped (Oracle-sourced) | 41 |

### The five findings that matter most for the decision logic

1. **OneWorld forces two "One-way" decisions that the bank treats as free choices.** "The Multiple Currencies feature is required for NetSuite OneWorld" (section_N269257) and "In NetSuite OneWorld ... If you enable Inventory, Multi-Location Inventory enables automatically" (section_N275901). So D-001 = OneWorld forces D-002 = yes, and OneWorld + any inventory forces D-005 = yes. Then MLI requires "Locations, Inventory, Advanced Shipping, and Advanced Receiving" (article_1111112400), which forces D-014 = yes. The guide must compute these as forced, not ask them.
2. **Six oneWayDoors entries would raise false one-way warnings.** #9 (Advanced Receiving costing timing), #10 (receipt vs bill cost), #11 (use Advanced BOM), #12 (auto-created accounts), #13 (catch weight), #14 (shelf life) are behaviours, recommendations or scoping risks, not irreversible settings. Split them out (e.g. `kind: behaviour | recommendation | scope-risk`) before the app turns `isOneWay` into warnings.
3. **D-033 (subsidiary base currency) is One-way, not Costly, and belongs in L0.** "You can't change a subsidiary's base currency after the subsidiary record has been saved for the first time" (section_N269257); the only fix is delete-and-recreate, and only if no transactions exist (article_162152170370). Country, Edition, Elimination state and Period End Journal Entries state are locked the same way. layers.json L0 already lists "base currencies" but the decision sits in L1.
4. **Door #14 is misleading: Oracle documents a FEFO Lot Assignments SuiteApp with a customer-level minimum shelf life.** "Required shelf life can be set at item level as well as at customer item level" and lots that "expire by the fulfillment date plus required shelf life days ... are not assigned" (article_161009052865, section_164222866570). D-043's "NOT native - customization or WMS" should read "SuiteApp (Oracle-documented); licensing unverified". Same SuiteApp is the FEFO mechanism D-042 refers to.
5. **The bank has no decision for several Oracle-documented one-way or prerequisite features:** Multi-Book Accounting (OneWorld only, Professional Services required, subsidiaries with transactions can't be added to an active book), Automated Intercompany Management ("can't be disabled after it is enabled. This is true even if you have not created any intercompany entities or transactions"), Advanced Bin / Numbered Inventory Management (prerequisite for Inventory Status, WMS, Inbound Shipment Management), Advanced Inventory Management (prerequisite for Demand Planning and MRP; auto-enables Lot Tracking, Serialized Inventory, Matrix Items and Multiple UOM), Standard Costing feature (must be on before any item can be saved as Standard), Accounting Periods feature, Currency Exchange Rate Types (can't be disabled). Also: Manufacturing Routing and Work Center requires **Project Management** (section_N2341773), a licensing surprise for D-009.

---

## Part 1 - oneWayDoors.json verified

| # | Bank claim (short) | Verdict | What Oracle says | Source | Fix for the bank |
|---|---|---|---|---|---|
| 1 | Costing method can't change once item saved | Confirmed | "You can't change the costing method after you save it on the item record." Workaround documented by Oracle: zero out, inactivate and recreate the item. | Oracle docs: section_4345703007.html; bridgehead_160650437174.html | None. The "losing continuity of history" part is an inference (true in effect: history stays on the inactivated item) |
| 2 | MLI can't be turned off without Support once items distributed | Confirmed | "After you enable Multi-Location Inventory and distribute items, you can't turn it off without contacting Customer Support." | Oracle docs: article_1111112400.html; section_N2303574.html | None |
| 3 | No inventory transaction dated before the MLI enable date | **Unverified** | The quoted sentence was not found on any current Oracle page. Closest Oracle text: "The distribution is dated after the last inventory-affecting transactions" and "Do not delete or change inventory transactions dated prior to an inventory distribution" (section_N2304534); for OneWorld: "NetSuite doesn't support importing historical data that is dated prior to the date of the OneWorld upgrade" (section_N275901). | Oracle docs (closest): section_N2304534.html; section_N275901.html | Re-source or soften to the distribution-date rule. For a new account the practical rule stands: enable MLI before any inventory transaction |
| 4 | Enable MLI before loading items; enable -> locations -> distribute | Confirmed | Steps listed in order: Enabling Features, Creating Locations, Distributing Inventory. Also: "You should enable Multi-Location Inventory when you enable the Locations feature, even if you plan to track only one location. This is recommended especially for NetSuite OneWorld accounts." | Oracle docs: section_N2303574.html; section_161963741628.html | This is a sequencing rule, not an irreversibility. Keep, but tag as order constraint |
| 5 | Lot/serial items can't be members of a regular assembly | Confirmed | "Serialized and lot numbered items cannot be included as member items in a regular assembly item." "A serialized assembly can include a serialized or lot numbered member item. A lot numbered assembly can include a serialized or lot numbered member item." | Oracle docs: section_N2319594.html | Nuance: a tracked component forces a lot OR serialized parent, not only lot |
| 6 | ARM, Multiple Currencies, Dynamic Allocation, Statistical Accounts, Advanced Taxes can't be disabled once used; MLI Support-only | Confirmed, with timing nuance | ARM (Essentials): "When you enable this feature, you can't disable it." ARM (Revenue Allocation): "When you enable this feature, it can't be disabled." Multiple Currencies: "You can't disable the feature after you create transactions and records that rely upon it." Dynamic Allocation and Statistical Accounts: "This feature can't be disabled after it has been used." Advanced Taxes: "If you enable Advanced Taxes, then you can't disable later." | Oracle docs: article_1110092646.html; chapter_N1395057.html; bridgehead_3740479636.html | Record the trigger per feature: ARM and Advanced Taxes lock **on enable**; Multiple Currencies, Dynamic Allocation, Statistical Accounts lock **on use**; MLI locks on distribution. Dynamic Allocation has no decision id |
| 7 | MUOM is the prerequisite for Statistical Accounts; auto-enabled; MUOM locked if SA used | Confirmed | "The Multiple Unit of Measure feature is a requirement for using the Statistical Accounts feature. If it isn't enabled, the system automatically enables the feature." "If the Statistical Accounts feature is enabled and you have used the feature, the system prevents you from disabling the Multiple Unit of Measure feature." | Oracle docs: section_3851462725.html | Note: the ERP General feature table says under MUOM "...and track non-monetary accounts. The Statistical Accounts feature must be enabled" (article_1110085128). Read in context it is about the non-monetary part; the SA page is the authority |
| 8 | Multi-Subsidiary Customer needs transactions reversed/deleted to disable | Confirmed (upgrade from Secondary to Oracle docs) | "To disable the Multi-Subsidiary Customer feature: 1. Reverse or delete all transactions related to customers and their secondary subsidiaries. 2. Remove all secondary subsidiaries from customer records." Incompatible with EU One Stop Shop (OSS). | Oracle docs: section_1509460991.html; section_1509460470.html | Change confidence to Oracle docs. It is Costly, not One-way. Mapping to D-001/D-003 is weak: there is no Multi-Subsidiary Customer decision |
| 9 | Advanced Receiving decides when costing posts | Confirmed as behaviour; **not a one-way door** | "If you use Advanced Receiving, costing happens when you receive items and create item receipts. If you don't use Advanced Receiving, costing happens when you enter the bill." No Oracle statement found on disabling Advanced Receiving. | Oracle docs: section_4345703007.html | Set `isOneWay: false` (behaviour). See D-014 below |
| 10 | Receipt cost drives costing; bill difference posts to Accrued Purchases | Partly right | "If there are any discrepancies between the quantity, price, or exchange rate, a remaining value may post to the Accrued Purchases account. ... you can reconcile these differences using the Post Vendor Bill Variances page", which posts to the Bill Price / Quantity / Exchange Rate Variance accounts set on the item. FIFO/LIFO with AR: "Inventory costing is determined by the amounts entered on purchase orders." | Oracle docs: section_N2371184.html; section_N2194541.html | Add the Post Vendor Bill Variances step (variances land in variance accounts, not item cost). Not a one-way door |
| 11 | Embedded BOMs unsupported since 2023.1; use Advanced BOM (free) | Confirmed; **not a one-way door** | "With the release of NetSuite 2023.1 Bills of Materials, where components are embedded to an Assembly Item, will no longer be supported. ... transition to the Advanced Bill of Materials feature, which is free of charge. After you enable this feature, NetSuite will automatically migrate all of your Bill of Materials to the new structure." Oracle also documents behaviour "in the event Advanced BOM is disabled" (search excerpt), so the feature itself is reversible. | Oracle docs: section_N2319594.html; chapter_N2332509.html | Recommendation, set `isOneWay: false`. Move the Advanced BOM enable to L0 (see Part 4) |
| 12 | Inventory creates Asset + COGS accounts; MLI creates Transfer Orders + In Transit | Confirmed; **not a one-way door** | Exact Oracle wording matches. Other auto-accounts worth listing in DIM-1: Advanced Receiving -> Accrued Purchases; Work Orders -> Work Orders; ARM -> Deferred Revenue, Unbilled Receivables, Revenue Arrangement; Purchase Orders, Sales Orders, Return Authorizations, Vendor Return Authorizations (+ Purchases Returned Not Credited), Requisitions, Estimates each create a non-posting account; Amortization -> Deferred Expense + Accumulated Depreciation. | Oracle docs: article_1111112400.html; article_1111110711.html; article_1111110344.html; article_1110092646.html; article_1110092929.html | Set `isOneWay: false` (informational) |
| 13 | Catch weight not supported by standard MUOM | **Unverified** | No Oracle page found on catch weight. Only vendor material. Oracle does say units types are fixed ratios defined against a base unit (section_N2212390), which is consistent but does not address catch weight. | Secondary only | Keep as scope risk, `isOneWay: false`, confidence Secondary |
| 14 | Minimum remaining shelf life not enforced natively | Partly right / misleading | Oracle documents the FEFO Lot Assignments SuiteApp: "Required shelf life can be set at item level as well as at customer item level. If it is defined at both places, the required shelf life defined at the customer item level is used." On fulfillment, lots that "expire by the fulfillment date plus required shelf life days criteria ... are not assigned." Publisher and licensing are not stated on the page. | Oracle docs: article_161009052865.html; section_164222866570.html | Rewrite: "Not in core; available via the FEFO Lot Assignments SuiteApp (lot items, works with Supply Allocation). Confirm licensing." `isOneWay: false` |
| 15 | Non-inventory items can convert to inventory, incl. lot/serial; history keeps its class | Partly right | Oracle: "You can convert a non-inventory purchase item to an inventory item." No Oracle text found for converting to lot/serial, or on how prior transactions are classified. Oracle says the opposite for inventory -> serialized: "you cannot convert existing inventory items into serialized items." | Oracle docs: article_0120113247.html; section_N2230957.html | Limit the claim to non-inventory purchase -> inventory. Drop lot/serial and history clauses or mark Secondary |
| 16 | COGS and Asset accounts on an item can change, optionally retroactively | Confirmed with condition | "When you update the Cost of Goods Sold (COGS) or Asset account on an assembly or inventory item, you can also update the accounts on existing transactions." The retroactive box "becomes available when the Do Not Update COGS and Asset Accounts on Existing Transactions When Accounts Are Changed preference is turned on." | Oracle docs: article_0324022028.html | Add the preference condition. Secondary sources say that preference can't be unchecked once checked (see Part 2, leads). Mapping to D-036 is wrong (costing method); D-024 / D-037 fit better |

### Decisions marked One-way

| Decision | Verdict | Evidence | Source |
|---|---|---|---|
| D-001 OneWorld + subsidiaries | Unverified at Oracle for "cannot downgrade" | No Oracle page found stating OneWorld can't be reversed. Secondary sources say a OneWorld account can't be downgraded. Oracle-confirmed one-way pieces inside OneWorld: subsidiary Currency/Country/Edition/Elimination locked; subsidiaries with transactions can't be deleted; hierarchy modification has irreversible consequences (Part 2). | Secondary: https://answers.gurussolutions.com/?p=2087 ; https://www.apideck.com/blog/netsuite-oneworld-vs-standard-api-integration |
| D-002 Multiple Currencies | Confirmed (locks on use) | Quote in #6. Also forced on by OneWorld (section_N269257) and by Multi-Book Foreign Currency Management: "this feature is also required and can't be disabled" (article_1110085418). | Oracle docs |
| D-003 Provision OneWorld now | Irreversibility unverified; rationale supported | "NetSuite doesn't support importing historical data that is dated prior to the date of the OneWorld upgrade." | Oracle docs: section_N275901.html |
| D-005 MLI | Confirmed (Support-only) | #2. In OneWorld, Inventory auto-enables MLI, so it is not a choice there. | Oracle docs: article_1111112400.html; section_N275901.html |
| D-006 Lot / Serialized features | Confirmed | "After you've enabled Lot Tracking and created tracking items, you can't turn it off." Same wording for Serialized Inventory. | Oracle docs: article_1111112400.html |
| D-007 MUOM | Partly right | Feature-level lock confirmed only when Statistical Accounts has been used (#7). Item-level lock confirmed: "After you assign a units type to an item, you can't change the item's unit type." "after a units type is assigned to any item, you can only add more units. You can't edit the type itself." General MUOM disable: unverified. | Oracle docs: section_3851462725.html; section_N2212390.html |
| D-014 Advanced Receiving | Unverified as One-way | No Oracle statement on disabling. It is a hard prerequisite of MLI, so with MLI on it is effectively locked (inference from article_1111112400, not an Oracle statement). Recommend: Costly, and "forced = yes when D-005 = yes". | Oracle docs (prereq): article_1111112400.html |
| D-015 ARM | Confirmed (locks on enable) | #6. Requires Accounting Periods: "You must enable Accounting Periods before using ARM (Essentials)." | Oracle docs: article_1110092646.html |
| D-016 Advanced Taxes / SuiteTax | Confirmed for both | Advanced Taxes: #6. SuiteTax: "SuiteTax is a non-reversible feature and when enabled, it can't be disabled." On enable, "All tax codes created in legacy tax are inactivated". Whether the two are formally mutually exclusive: not stated on the pages read. | Oracle docs: chapter_161365561211.html; section_158331921354.html |
| D-017 Statistical Accounts | Confirmed (locks on use) | #6, #7 | Oracle docs |
| D-036 Costing method per item | Confirmed | #1 | Oracle docs |
| D-038 Lot / serial per item | Partly right | Serialized confirmed: "you must create new serialized inventory items because you cannot convert existing inventory items into serialized items." Lot: no Oracle statement found (community sources agree it can't be converted). | Oracle docs: section_N2230957.html |
| D-083 Opening trial balance | Not a platform one-way door | No Oracle source makes an opening JE irreversible; it is governed by period locks. Treat as project risk (Costly). | n/a |
| D-085 Opening inventory | Not a platform one-way door | Governed by MLI distribution dating and period locks (#3). In OneWorld: "you can't enter initial quantities on hand when you create an item record ... you must enter an inventory adjustment" (section_N275901). Treat as Costly. | Oracle docs (related): section_N275901.html |

### Decisions marked Costly - spot checks

| Decision | Finding | Source |
|---|---|---|
| D-004 Fiscal calendar | Supported. Base periods: delete "Allowed only if the period has no transactions"; "Modifying an accounting period is generally prohibited if doing so removes an existing parent/child without reestablishing a new one." Non-OneWorld: "you can't disable the Accounting Periods feature if an accounting period exists." | Oracle docs: section_N1448709.html; section_N1450765.html; section_N1445585.html |
| D-009 / D-010 Production tier / WIP | Reversibility of Work Orders, WIP, Routing: unverified. New dependency: Routing requires Project Management (Part 3). | Oracle docs: section_N2341773.html |
| D-011 Inventory Status | Requires Advanced Bin / Numbered Inventory Management: "If you use the Advanced Bin/Numbered Inventory Management feature, you can enable and set up Inventory Status." Disable behaviour: unverified (community says blocked once statuses are used). | Oracle docs: section_1518031931.html |
| D-013 Landed Cost | Does not require Advanced Receiving: Oracle documents landed cost "without Advanced Receiving" (allocation on the PO); "If you use Advanced Receiving, the allocation must occur on the inventory receipt transaction." Example "not applicable for Standard Cost items." Disable behaviour: unverified. | Oracle docs: article_162022026857.html |
| D-033 Base currency | **Should be One-way and L0** (finding 3) | Oracle docs: section_N269257.html; article_162152170370.html |
| D-034 Transfer pricing | Oracle: for arm's-length intercompany transfers "verify the Use Item Cost as Transfer Cost preference is not enabled" (Automated Intercompany setup). Per-transaction lock after approval seen only on a mirror page: unverified. | Oracle docs: section_N1486610.html |
| D-037 Item type | Oracle confirms only non-inventory purchase -> inventory conversion, and that inventory -> serialized is not possible. Other type changes: no Oracle statement (community: not possible). | Oracle docs: article_0120113247.html; section_N2230957.html |
| D-043 Min shelf life | Rewrite (finding 4) | Oracle docs: article_161009052865.html |
| D-008, D-023..D-028, D-039, D-053, D-055, D-064, D-073, D-074, D-082, D-084, D-086, D-087 | Project / design judgement, not a NetSuite setting constraint. Nothing to verify against Oracle. "Adding an axis later cannot retro-tag history" (D-026): no Oracle source found. | n/a |

---

## Part 2 - Missing one-way doors (all Oracle-sourced unless marked)

| # | Constraint | Trigger | Oracle wording | Source | Suggested decision |
|---|---|---|---|---|---|
| N1 | Subsidiary Currency, Country, Edition, Elimination state, Period End JE state can't be edited (parent also: legal name, tax numbers, logos, URL, return email, fax, Always Display Subsidiary Name) | First save | "If you must change the values and states of these fields, you must delete the record and create a new record with the updated values." Base currency can be changed only if no transactions: delete nexus, delete subsidiaries, recreate both. | article_162152170370.html | D-001 / D-033 |
| N2 | Subsidiary with transactions or records can't be deleted; subsidiary ID 1 never | First transaction | "You can delete a subsidiary that doesn't have transactions or records." "You can't delete the subsidiary where the ID is equal to 1." | section_3760056730.html | D-001 |
| N3 | Subsidiary hierarchy change is possible only via a special preference, with irreversible effects outside Support scope | Any time | "Existing financial statements may be lost with no possibility of recovery"; "Consolidated/Budget Exchange Rates may be irreversibly recalculated"; "The consequences of implemented modifications are outside the scope of any support". | section_157252074629.html | D-001 (design hierarchy once) |
| N4 | Non-OneWorld base currency fixed once any currency record exists | First record with a currency amount | "Make any changes to base currency before you do anything else in NetSuite. You can't change the base currency after a record has been saved that includes a currency amount or link." | section_N1395677.html | D-033 |
| N5 | Automated Intercompany Management can't be disabled | Enable | "The Automated Intercompany Management feature can't be disabled after it is enabled. This is true even if you have not created any intercompany entities or transactions." Requires OneWorld and elimination subsidiaries first. | section_N1486610.html | New decision (relates D-034) |
| N6 | Currency Exchange Rate Types can't be disabled | Enable | "You can't disable the Currency Exchange Rate Types feature after you enable it." | article_1110085418.html | D-002 or new |
| N7 | Multi-Book: primary book can't be inactivated; subsidiary can't be removed from an active book; subsidiaries with transactions can't be added | Book activation | "The primary book can't be made inactive." "You can't remove a subsidiary from an active accounting book." "Subsidiaries that have transactions can't be added even when inactive." Max five active books. OneWorld only; "The assistance of NetSuite Professional Services or a Multi-Book authorized partner is required". | section_3831664657.html; bridgehead_4176305598.html | New decision (Multi-Book) |
| N8 | Foreign Currency Management (Multi-Book) makes Multiple Currencies non-disableable | Enable FCM | "When you enable Foreign Currency Management in Multi-Book Accounting, this feature is also required and can't be disabled." | article_1110085418.html | D-002 + Multi-Book |
| N9 | SuiteTax non-reversible; legacy tax codes inactivated | Enable | Quotes under D-016. | chapter_161365561211.html; section_158331921354.html | D-016 (split from Advanced Taxes) |
| N10 | ARM (Revenue Allocation) can't be disabled; Rule-Based Recognition Treatment conditional lock; classic -> ARM needs Professional Services | Enable | "When you enable this feature, it can't be disabled." "The assistance of NetSuite Professional Services or a qualified NetSuite partner is required to move from classic Revenue Recognition to Advanced Revenue Management (Essentials)." | article_1110092646.html | D-015 |
| N11 | Units type on an item can't change; a units type in use can only gain units | Assign to item | Quotes under D-007. | section_N2212390.html | D-007 (units-type design before item load) |
| N12 | Existing inventory items can't become serialized | Item save | Quote under D-038. | section_N2230957.html | D-038 |
| N13 | Lot Tracking / Serialized Inventory features locked once tracked items exist | First tracked item | Quote under D-006. | article_1111112400.html | D-006 |
| N14 | Dynamic Allocation locked after use | First use | "This feature can't be disabled after it has been used." | article_1110092646.html | D-017 (no current decision) |
| N15 | Accounting Periods (non-OneWorld) can't be disabled while any period exists; base periods with transactions can't be deleted | First period / transaction | Quotes under D-004. | section_N1445585.html; section_N1448709.html | D-004 + new "Accounting Periods feature" |
| N16 | OneWorld: no import of historical data dated before the OneWorld upgrade | Upgrade date | Quote under D-003. | section_N275901.html | D-003, D-023 |
| N17 | Group Average Costing: in-transit preference fixed after first costing run | First costing calc | "The setting for this preference can't be changed after any item with a Group Average costing method has had costing calculations run." "you should do so immediately after enabling the Group Average Costing feature." | section_N1387022.html | D-031 / D-036 |
| N18 | Multi-Subsidiary Customer and EU OSS are mutually exclusive | Enable either | "Incompatible features can't be enabled when the Multi-Subsidiary Customer feature is enabled. The Multi-Subsidiary Customer feature can't be enabled when incompatible features are enabled." | section_1509460470.html | New (O2C / tax) |
| N19 | MLI needs open orders closed before enabling | Enable | "Before you enable the Multi-Location Inventory feature, you must fully ship or otherwise close all open orders." | section_N2303574.html | D-005 (order constraint) |

### Oracle says these are reversible - do not mark one-way

| Feature | Oracle evidence | Source |
|---|---|---|
| Bin Management / Advanced Bin / Numbered Inventory Management | "If you use both bin features, you can disable the Advanced Bin Management feature before the basic Bin Management feature." Use Bins can be cleared per item / per location with no bins and no referencing transactions. | section_0512092419.html |
| Advanced Bill of Materials | Oracle documents behaviour "in the event Advanced BOM is disabled" (search excerpt; exact disable procedure not found). | search excerpt of Oracle routing / ATB pages |
| Multi-Subsidiary Customer | Disable after reversing/deleting related transactions (Costly, not One-way). | section_1509460991.html |
| Use Deletion Reason | "This feature can be disabled after use." | article_1110085128.html |
| Item COGS / Asset accounts | #16 | article_0324022028.html |

### Leads - could not verify on Oracle (left out of the door list)

| Lead | Status |
|---|---|
| OneWorld cannot be downgraded | Secondary only (see D-001) |
| "Do Not Update COGS and Asset Accounts on Existing Transactions When Accounts Are Changed" can't be unchecked once checked | Secondary only (https://www.anchorgroup.tech/blog/gl-impact-notice-cant-convert-non-inventory-to-inventory-item). The Oracle preference page does not say so (section_N1387022) |
| Existing items can't be converted to matrix parent/child | Community only |
| Item type can't change (other than non-inventory purchase -> inventory) | Community only |
| Existing inventory item can't become lot numbered | Community only |
| Inventory Status can't be disabled once statuses are used | Community only |
| Multiple Shipping Routes, Advanced Receiving, Standard Costing, Landed Cost, Work Orders, WIP, Routing, MUOM: disable behaviour | No Oracle statement found |
| Use Item Cost as Transfer Cost locked per transfer order after approval | Mirror of Oracle help only, not docs.oracle.com |
| Catch weight unsupported natively | Vendor material only |

---

## Part 3 - Feature dependency graph

"Requires" = Oracle says the feature needs it. "Auto" = enabling one turns on the other. "Conflicts" = Oracle states incompatibility. Decision ids are the bank's where one exists; "none" marks a gap.

| Feature | Requires | Auto-enables / auto-enabled by | Conflicts with | Source | Bank decision(s) |
|---|---|---|---|---|---|
| OneWorld | - | Requires Multiple Currencies (always); Inventory auto-enables MLI in OneWorld | - | section_N269257.html; section_N275901.html | D-001, D-003 -> forces D-002; with inventory forces D-005 |
| Multi-Location Inventory | Locations, Inventory, Advanced Shipping, Advanced Receiving | Auto-on with Inventory in OneWorld | Open orders must be closed first | article_1111112400.html; section_N275901.html; section_N2303574.html | D-005 -> forces D-014; D-032 |
| Assembly Items | Inventory | - | - | section_N2319428.html | D-009, D-037 |
| Work Orders (transaction) | Assembly Items + Work Orders | - | Work order "is used when the Allow Purchase of Assembly Items accounting preference is not enabled" | section_N3199912.html | D-009, D-064 |
| Manufacturing Work In Process | Work Orders (WIP records need "Work Orders and Manufacturing Work in Process") | - | - | section_N3200178.html | D-010 |
| Manufacturing Routing and Work Center | Manufacturing WIP, Multi-Location Inventory, Work Orders, Assembly Items, **Project Management** | - | Routing "can be used only with work orders that are marked as Work In Process (WIP)" | section_N2341773.html; chapter_N2341076.html | D-009 (add Project Management licence note) |
| Advanced Bill of Materials | (Assembly context; formal prereq not found) | Migrates existing BOMs on enable | - | section_N2319594.html | D-040 (feature belongs in L0) |
| Outsourced Manufacturing | Purchase Orders, Advanced Receiving, MLI, Assembly Items, Advanced BOM, Work Orders | - | - | section_157833742278.html (search excerpt) | none (relates D-039 co-man) |
| Lot numbered / serialized assembly | Lot Tracking / Serialized Inventory + Assembly Items | - | Tracked members not allowed in a regular assembly | section_N2319594.html | D-006, D-038 |
| Advanced Inventory Management | - | Auto-enables Bar Coding and Item Labels, Lot Tracking, Matrix Items, Pick Pack and Ship, Serialized Inventory, Multiple Units of Measure | - | article_162488513759.html | none |
| Demand Planning | Advanced Inventory Management; Work Orders for assembly items | - | - | article_1111112400.html; section_N2288536.html | D-020 |
| Material Requirements Planning (supply planning) | Locations, MLI, Advanced Inventory Management; plus Assembly Items, Advanced BOM, Work Orders if manufacturing | Label says "(includes Demand Planning)" | - | section_161780351051.html; article_1111112400.html | D-020, D-051 |
| Supply Allocation | MLI (detailed procedure); data check may require Support | - | - | article_162790924668.html (search excerpt) | none |
| Group Average Costing | Multi-Location Inventory | - | - | article_1111112400.html | D-031, D-036 |
| Standard Costing | Inventory; Oracle: "you should enable" MLI | Creates a default cost category | - | section_N2200714.html | D-031, D-036, D-041 (no feature decision) |
| Landed Cost | Feature + Accounting Preference "Landed Cost"; items "Track Landed Cost"; Advanced Receiving optional (changes where allocation happens) | - | Bill-together example "not applicable for Standard Cost items" | article_162642325864.html; article_162022026857.html | D-013, D-056 |
| Inbound Shipment Management | Multiple Currencies, Purchase Orders, Advanced Receiving, Advanced Bin / Numbered Inventory Management, Advanced Inventory Management, Landed Cost | - | "Basic Bins are not supported" | section_1490822316.html | none |
| Bin Management | (Inventory) | - | Basic bins: "cannot associate serial or lot items with bins" | section_N2271791.html | none |
| Advanced Bin / Numbered Inventory Management | Bin Management | - | - | section_N2271791.html | none |
| Inventory Status | Advanced Bin / Numbered Inventory Management | - | - | section_1518031931.html; section_161963741628.html | D-011, D-054, D-066 |
| Warehouse Management (WMS) | Multiple UOM, Advanced Shipping, Pick Pack and Ship, Inventory, MLI, Bin Management, Advanced Bin / Numbered Inventory Management, Advanced Inventory Management, Custom Records, Advanced PDF/HTML Templates, Client + Server SuiteScript; SCM Mobile + WMS SuiteApps | - | Intercompany Cross-Subsidiary Fulfillment "not compatible with ... NetSuite Warehouse Management System (WMS) Advanced" | section_156399385061.html; section_1515703010.html | none (module scoping M-11) |
| Intercompany Cross-Subsidiary Fulfillment | OneWorld, MLI, Advanced Shipping (Multiple Shipping Routes optional) | - | WMS Advanced SuiteApp | section_1515703010.html | none |
| Automated Intercompany Management | OneWorld; elimination subsidiaries before enabling | Creates CTA Elimination account after first elimination | - | section_N1486610.html | none (D-034 related) |
| Multi-Subsidiary Customer | OneWorld context | - | EU One Stop Shop | section_1509460991.html; section_1509460470.html | none |
| Pick, Pack and Ship | Enabled together with Advanced Shipping in Oracle's steps (explicit "requires" not found) | Auto-on with Fulfillment Request and with Advanced Inventory Management | - | section_N1230197.html (search excerpt); article_162488513759.html | D-062 |
| Fulfillment Request | - | Auto-enables Advanced Shipping and Pick, Pack and Ship | - | section_1490179639.html (search excerpt) | D-062 |
| Multiple Units of Measure | - | Auto-enabled by Statistical Accounts and by Advanced Inventory Management | - | section_3851462725.html; article_162488513759.html | D-007 |
| Statistical Accounts | Multiple Units of Measure | Auto-enables MUOM | - | section_3851462725.html | D-017 -> forces D-007 |
| Dynamic Allocation | Uses statistical account balances (formal prereq wording not found) | - | - | article_1110092646.html | none |
| ARM (Essentials) | Accounting Periods | Auto-enables ARM in Configuration Mode | In Configuration Mode "you can't use ARM for revenue recognition" | article_1110092646.html | D-015 |
| ARM (Revenue Allocation) | ARM (Essentials) | - | - | article_1110092646.html | D-015 |
| Rule-Based Recognition Treatment | ARM (Essentials) | - | - | article_1110092646.html | D-015 |
| GL Audit Numbering | Accounting Periods | - | - | article_1110092533.html | none |
| Multiple Currencies | Accounting Periods recommended ("enable the Accounting Periods feature to use the Multiple Currencies feature effectively") | Required by OneWorld and by FCM | - | section_N1395677.html | D-002 |
| Multi-Book Accounting | OneWorld; Professional Services | - | - | bridgehead_4176305598.html; section_3831664657.html | none |
| Chart of Accounts Mapping / Foreign Currency Management / Revenue and Expense Management / Extended Period Close | Multi-Book Accounting | FCM makes Multiple Currencies required and non-disableable | - | bridgehead_4176305598.html; article_1110085418.html | none |
| Adjustment-Only Books | Not full Multi-Book | - | - | bridgehead_4176305598.html | none |
| Period End Journal Entries | Must also be enabled per subsidiary; subsidiary state then locked | - | - | article_1110092646.html; article_162152170370.html | none |
| SuitePromotions | Promotion Codes, Auto-Apply Promotions | - | - | article_1111110455.html | D-048 |
| SuiteTax | Site Builder sites inactive or scope 'Information and Catalog' / 'Information Only' | Inactivates legacy tax codes | Listed incompatibilities: Advanced Promotions, Store Pickup (US), Cash Basis reporting, others | chapter_161365561211.html; section_158331921354.html | D-016 |
| FEFO Lot Assignments SuiteApp | Lot numbered items; location on SO lines; works with Supply Allocation | - | - | article_161009052865.html | D-042, D-043 |

### Logic rules the guide should compute (from the table)

1. D-001 = OneWorld -> D-002 forced yes, and Multiple Currencies one-way warning applies at first foreign-currency record.
2. D-001 = OneWorld and any inventory -> D-005 forced yes.
3. D-005 = yes -> D-014 forced yes; Advanced Shipping forced on.
4. D-017 = yes -> D-007 forced yes (and MUOM becomes locked once SA is used).
5. D-020 (Demand Planning in NS) or MRP = yes -> Advanced Inventory Management on -> Lot Tracking, Serialized, Matrix, MUOM, PPS auto-enabled (show this so D-006 / D-007 are not "surprises").
6. D-011 = yes -> Bin Management + Advanced Bin / Numbered Inventory Management required (no bank decision today).
7. D-009 includes routings -> WIP (D-010), Work Orders, Assembly Items, MLI and Project Management required.
8. Any item category on Standard -> Standard Costing feature on before the item is saved (and MLI recommended).
9. Group Average on any item -> MLI required; set the in-transit preference immediately.
10. D-013 = yes does not require D-014; if D-014 = yes, landed cost allocates on the receipt, otherwise on the PO/bill.
11. Multi-Subsidiary Customer and EU OSS: mutually exclusive.
12. Intercompany Cross-Subsidiary Fulfillment and the WMS Advanced SuiteApp: flag incompatibility.

---

## Part 4 - Order constraints vs layers.json

| Constraint (Oracle) | Source | Where the bank has it | Flag |
|---|---|---|---|
| Base currency first: "Make any changes to base currency before you do anything else in NetSuite." Subsidiary currency fixed at first save. | section_N1395677.html; section_N269257.html | D-033 in **L1**; L0 `decides` lists "base currencies" | **Sequenced wrong**: move D-033 to L0, mark One-way |
| Elimination subsidiaries must exist before enabling Automated Intercompany Management | section_N1486610.html | No decision | Add to L0, after subsidiaries |
| Multi-Book books and subsidiary-to-book mapping before any transaction in those subsidiaries | section_3831664657.html | No decision | Add Multi-Book decision to L0 |
| Accounting Periods enabled before ARM; periods set up before revenue arrangements | article_1110092646.html; section_4328435754.html (search excerpt) | D-004 L0, D-015 L0 | OK; add explicit order D-004 before D-015 |
| Every day must belong to a period ("Each day must belong to an accounting period") - periods exist before opening balances | section_N1445585.html | D-004 L0, D-083 L7 | OK |
| MLI: close open orders, enable feature, create locations, distribute; enable MLI together with Locations | section_N2303574.html; section_161963741628.html | D-005 L0, D-032 L1, items L2 | OK. Add "enable with Locations" note; D-005 note's "no inventory transaction before enable date" needs re-sourcing (#3) |
| In OneWorld, after Inventory is enabled "you must associate each location with only one subsidiary" | section_N275901.html | D-032 L1 | Add to D-032 notes; location-to-subsidiary design is fixed at L1 |
| In OneWorld, initial on-hand can't be entered on the item record; use an inventory adjustment | section_N275901.html | D-085 L7 (Inventory Adjustment / Worksheet) | OK |
| Standard Costing feature on before any item is saved as Standard (costing method then permanent) | section_N2200714.html; section_4345703007.html | D-031 L1, D-036 L2; no feature decision | Add Standard Costing feature to L0 (or make D-031 imply it) |
| Group Average in-transit preference set immediately after enabling Group Average Costing | section_N1387022.html | none | Add to L1 accounting preferences |
| Units types designed before items (item's units type can't change) | section_N2212390.html | D-007 L0 (feature only); no units-type design step | Add units-type design to L1/L2 before item load |
| Serialized items created serialized from the start (no conversion) | section_N2230957.html | D-038 L2 | OK; make it a hard pre-load check |
| Advanced BOM enabled before building BOMs (enabling converts existing BOMs to legacy read-only snapshots) | section_N2319594.html; chapter_N2332509.html | D-040 L2, "Easy" | Feature enable belongs in L0; BOM content stays L2 |
| Bin Management / Advanced Bin enabled before Inventory Status and before bins / Use Bins on items | section_N2271791.html; section_1518031931.html | D-011 L0; no bin decision | Add bin decision to L0 |
| Lot Tracking / Serialized enabled before lot/serial item records | article_163360479619.html | D-006 L0, D-038 L2 | OK |
| SuiteTax: test in sandbox; "All required actions need to be performed before you can enable the feature" | section_158331921354.html | D-016 L0 | OK |

---

## Bank gaps this research exposes (no decision id today)

Multi-Book Accounting; Automated Intercompany Management; Multi-Subsidiary Customer; Intercompany Cross-Subsidiary Fulfillment; Bin Management / Advanced Bin / Numbered Inventory Management; Advanced Inventory Management; Standard Costing (feature); Group Average Costing; Accounting Periods (feature); Currency Exchange Rate Types; Supply Allocation; Outsourced Manufacturing; Inbound Shipment Management; Dynamic Allocation. Each is either a one-way door or a prerequisite of a decision the bank already has.

## Sources

Oracle docs (all under https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/): article_1111112400, article_1110092646, article_1110092533, article_1110092929, article_1110085418, article_1110085128, article_1110084707, bridgehead_4176305598, bridgehead_3740479636, article_1111110711, article_1111110455, article_1111110344, article_1111112254, section_N1395677, chapter_N1395057, section_N269257, section_3851462725, article_162488513759, section_N2271791, section_0512092419, section_1518031931, section_161963741628, section_N2303574, section_N2304534, section_N275901, section_4345703007, bridgehead_160650437174, section_N2319594, section_N2319428, section_N3199912, section_N3200178, section_N2341773, chapter_N2341076, section_N2288536, section_161780351051, section_1515621767, section_1515703010, section_N1486610, section_1509460991, section_1509460470, article_162152170370, section_157252074629, section_N269084, section_N273122, section_3760056730, section_N1445585, section_N1448709, section_N1450765, section_3831664657, chapter_161365561211, section_158331921354, section_156399385061, section_1490822316, section_N2212390, section_N2230957, article_163360479619, article_0120113247, article_0324022028, section_N2371184, section_N2194541, article_162642325864, article_162022026857, section_3898859613, article_161009052865, section_164222866570, section_N2200714, section_N2211106, section_N1387022, chapter_N2332509. Seen via search excerpt only: section_157833742278, article_162790924668, section_1490179639, section_N1230197, section_4328435754.

Secondary: https://answers.gurussolutions.com/?p=2087 ; https://www.apideck.com/blog/netsuite-oneworld-vs-standard-api-integration ; https://www.anchorgroup.tech/blog/gl-impact-notice-cant-convert-non-inventory-to-inventory-item
