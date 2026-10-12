# Slice B: Items, inventory, production, quality (bank review)

Scope: decisions D-005, D-006, D-007, D-008, D-009, D-010, D-011, D-012, D-032, D-036, D-037, D-038, D-039, D-040, D-041, D-042, D-043, D-044, D-045, D-046, D-064, D-065, D-066, D-067; questions ITM-*, QLT-*; the related one-way doors (#1-#7, #11, #13-#16) and module-scoping rows (M-04, M-07, M-11, M-12, M-13). Bank read 2026-10-12 from `ns-tracker/bank/`. No repo files were edited.

Each fact cites a source key from the **Sources** list at the end. Every source is tagged [Oracle docs] or [Secondary]. "Unverified" means I could not find it in Oracle docs, and secondary sources either did not cover it or disagreed.

**Licensing caveat (applies throughout):** Oracle Help Center pages almost never say whether a feature or SuiteApp is separately licensed. The only Oracle statement I found on cost is that Advanced BOM is "free of charge" [S34b]. Every other licence or quote impact below is marked **unverified**: confirm it against the actual Oracle quote. Secondary pricing sources contradict each other [X3].

---

## 1. Gaps

These are decisions or questions a NetSuite implementation has to settle in this area that the bank does not have. Each one changes setup, licensing or design.

| # | Area | Suggested layer | Gap (proposed text) | Why it matters | Source |
|---|---|---|---|---|---|
| G-01 | Inventory | L0 | **Bin tracking: none / Bin Management / Advanced Bin / Numbered Inventory Management (ABNIM).** Proposed question: "Do you store product in addressable bins or shelves within a site, and do you need on-hand by bin?" | ABNIM is a hidden prerequisite for several things the bank already assumes. Inventory Status can only be enabled with ABNIM [S13a]. Inventory counts of lot or serial items need ABNIM [S33]. The Lot and Serial Number Trace SuiteApp, which is the D-081 recall tool, needs Bin Management and ABNIM [S27]. The FEFO Lot Assignments SuiteApp needs ABNIM [S23b]. NetSuite WMS needs both bin features "even if you only want to set up warehouse locations with no bins" [S28]. Basic Bin Management cannot hold lot or serial items [S14]. ABNIM lets each location choose whether it uses bins [S14]. A lot-tracked business therefore almost certainly needs ABNIM even with no physical bins. No decision or question covers this. | S13a, S14, S27, S28, S33, S23b [Oracle docs] |
| G-02 | Inventory / Planning | L0 | **Advanced Inventory Management (AIM) feature: on or off.** | Demand Planning requires AIM [S1]. Supply Planning (MRP) requires Multi-Location Inventory (MLI) and AIM [S31]. WMS requires AIM [S28]. Enabling AIM also auto-enables Lot Tracking, Serialized Inventory, Matrix Items, Multiple Units of Measure (MUOM), Pick Pack and Ship, and Bar Coding [S2]. So it switches on features whose later use is one-way (see D-006, D-007). D-020 only asks whether the forecast stays external. It does not cover AIM as the gate to MRP and WMS. | S1, S2, S28, S31 [Oracle docs] |
| G-03 | Production / Planning | L0 (feature), L2 (item replenishment method) | **How production and replenishment orders are planned: manual / reorder point / Demand Planning / Material Requirements Planning (Supply Planning) / Distribution Resource Planning.** | MRP is an Enable Features item. It "includes Demand Planning" and needs planning item categories, planning rule groups, a supply plan definition, and Replenishment Method = MRP on each item [S1, S31]. ITM-6d and P2P-1a ask how runs and buys start, but no decision chooses the planning engine for production. D-051 covers buying only. | S1, S31 [Oracle docs] |
| G-04 | Production | L0 | **Co-manufacturing model: Outsourced Manufacturing feature / transfer components to a co-man location and record builds there / buy finished goods.** | Outsourced Manufacturing is a native feature. Its prerequisites are Purchase Orders, Advanced Receiving, MLI, Assembly Items, Advanced BOM and Work Orders. It needs an outsourcing location on the vendor (one vendor per location) and an outsourcing charge item. A consolidator runs daily at 2:00 a.m. and cannot be rescheduled or turned off; it creates purchase orders from firmed work orders, capped at 30 work orders per PO [S20]. ITM-6h asks the co-man questions, but no decision exists. | S1, S19, S20 [Oracle docs] |
| G-05 | Costing | L0/L1 | **One cost across locations or a cost per location: Group Average Costing with location costing groups, or per-location average.** Proposed question: "Should an item carry one cost across all sites, or its own cost per site?" | With MLI, average cost is calculated per location. Group Average needs the Group Average Costing feature (MLI only) plus location costing groups. It is locked on the item once saved. It cannot use Inventory Adjustment Worksheets. In OneWorld, subsidiaries in one group must share a base currency. It adds a period-end "Balance Location Costing Group Accounts" task [S10, S11]. This is not one of D-036's three listed methods. | S1, S10, S11 [Oracle docs] |
| G-06 | Inventory | L1 | **Negative inventory policy.** Proposed question: "Is product ever shipped or consumed before its receipt or build is recorded?" | "Use Cost Estimate for Negative Inventory" (Last Purchase Price / Zero / Average Cost) applies to FIFO, LIFO, Specific and Lot-Numbered items [S35]. Blocking negatives takes the "Prevent Negative Inventory" preference of the Enhanced Validations and Defaulting SuiteApp. That SuiteApp does not cover REST, Custom Tool or Web Store transactions [S36]. D-070 builds a negative-inventory search but does not decide the policy. | S35, S36 [Oracle docs] |
| G-07 | Inventory | L1 | **Inter-location transfer costing and ownership: the "Use Item Cost as Transfer Cost" preference and the default Transfer Order Incoterms (DAP / EXW).** | When the transfer-cost box is cleared, the transfer price becomes the receipt cost and the difference posts to Gain/Loss. When it is checked, the price is reference only. The per-order setting cannot change after the order is saved. Incoterms decide where ownership transfers [S32]. D-067 lists transfer orders but not these settings. | S32 [Oracle docs] |
| G-08 | Inventory | L0 | **Warehouse execution: NetSuite WMS / third-party scanning / none.** | M-11 asks the commercial question, but the register has no decision. WMS prerequisites are MUOM, Advanced Shipping, Pick Pack and Ship, MLI, Bin Management, ABNIM, AIM, and SuiteCloud features [S28]. It is the native route for FEFO pick sorting (lot rotation type) [S24] and for weight capture at receipt [S29]. | S24, S28, S29 [Oracle docs] |
| G-09 | Traceability | L2 | **Lot and serial number assignment: supplier lot reused / manual / auto-numbered format (Lot Auto Numbering SuiteApp).** Plus what is recorded per lot (expiry, custom item-number fields). Proposed question: "Who assigns lot numbers, at receipt and at production, and what is recorded against each lot?" | Lot number formats are a SuiteApp, not core. Formats cannot be CSV-imported. The SuiteApp is tested mainly for OneWorld [S26]. Lot records carry an expiration date and custom item-number fields for QC and recall data [S25]. | S25, S26 [Oracle docs] |
| G-10 | Production / Costing | L2 | **Labour and overhead in product cost: material only / routing cost templates (Manufacturing Routing and Work Center) / standard-cost categories / period journal.** ITM-6f is the question; no decision exists. | Routing costing needs cost categories, charge items, cost templates, resources and routings [S15]. The standard cost rollup adds labour and machine cost from the default routing [S12c]. This choice decides whether the routing feature is needed. | S12c, S15 [Oracle docs] |
| G-11 | Production | L2 | **Yield and scrap modelling: component yield on the BOM revision / WIP scrap account / absorb as variance.** ITM-6c is the question; no decision exists. | A WIP assembly needs a WIP account and a scrap account [S16 via search; S18]. With WIP, average-cost assemblies generate variances that need an Inventory Adjustment Worksheet [S17]. Component-yield field semantics are unverified. | S17, S18 [Oracle docs]; yield field unverified |
| G-12 | Items | L2 | **Product variants: matrix items (parent and child) or flat SKUs.** Proposed question: "Do products come in variants (size, flavour, pack) sold as one family?" | Matrices can be built on inventory, non-inventory, other charge or service items [S5]. AIM auto-enables Matrix Items [S2]. Whether a matrix can be converted later is unverified. | S2, S5 [Oracle docs] |

Gaps considered and **not** added because existing decisions cover them or they are trivia: cycle counting (folded into D-067 options), Engineering Change Orders and item revisions (folded into D-040 options), Supply Allocation and Available to Promise (O2C slice; see Cross-area), Consigned Inventory Management (Procurement D-053; see Cross-area).

---

## 2. Corrections

| ID | Field | Current | Proposed | Source |
|---|---|---|---|---|
| D-009 | nsSetting | "Enable Features > Work Orders / WIP & Routings / Advanced BOM" | "Enable Features > Assembly Items; Work Orders; Manufacturing Work In Process; Manufacturing Routing and Work Center; Advanced Bill of Materials. Optional: Advanced Manufacturing SuiteApp (extends routing into the Work Bench), Manufacturing Mobile SuiteApp." These are the current feature names. "WIP & Routings" is not a feature name. | S1, S19 [Oracle docs] |
| D-010 | nsSetting | "Enable Features > Work In Process" | "Enable Features > Manufacturing Work In Process (requires Assembly Items and Work Orders)" | S1, S16 [Oracle docs] |
| D-010 | notes | "Costing depth; whether WIP items are needed" | Add: "WIP and Routing work only for assemblies on Standard or Average costing. LIFO, FIFO and Specific assemblies are not compatible [S17, S15]. An intermediate product can also be a sub-assembly item without the WIP feature. Decide whether ITM-6g's 'intermediate stage' means a stocked sub-assembly or in-process tracking." | S15, S17 [Oracle docs] |
| D-011 | reversibility | Costly | **One-way.** "If any non-default inventory statuses exist, you cannot disable the Inventory Status feature." The default Good status cannot be deleted. A custom status's availability checkboxes lock once the status is used on a transaction. | S13b [Oracle docs] |
| D-011 | nsSetting | "Enable Features > Inventory Status (+ statuses, Make Inventory Available for Commitment)" | Add the prerequisite: "requires Bin Management + Advanced Bin / Numbered Inventory Management". Also add "Make Inventory Available for Allocation (only with Supply Allocation)". | S13a, S13b [Oracle docs] |
| D-043 | nsSetting | "NOT native - customization or WMS" | "FEFO Lot Assignments SuiteApp (Oracle, bundle 279508): required shelf life at item and customer-item level, checked as ship date + required shelf-life days <= lot expiry. It requires Supply Allocation, ABNIM and Serialized Inventory, and Sales Channel Allocation turned off. It is tested primarily for OneWorld. Custom build only if the SuiteApp does not fit." Licence: unverified. | S23a, S23b [Oracle docs] |
| D-043 | reversibility | Costly | Easy, if the SuiteApp fits; it is an install plus configuration. Keep Costly only if a custom build is needed. | S23a, S23b [Oracle docs] |
| oneWayDoors #14 | constraint | "Minimum remaining shelf life ... is not enforced natively. FEFO allocation is native; a customer-mandated remaining-life threshold is not." Confidence Secondary. | Both halves are unsupported by Oracle docs. Oracle's FEFO on sales-order lot assignment is the FEFO Lot Assignments SuiteApp, which also enforces required shelf life by item and customer-item [S23a]. FEFO at pick is NetSuite WMS (lot rotation type FEFO) [S24]. I found no Oracle evidence of FEFO allocation in core without either one. Proposed: "Not core. FEFO and minimum shelf life on lot assignment come through the FEFO Lot Assignments SuiteApp; FEFO picking through NetSuite WMS." isOneWay: false. | S23a, S24 [Oracle docs] |
| M-13 | ask | "native, SuiteApp, or custom?" | The question can stay. Add to the why: "Oracle SuiteApp exists (FEFO Lot Assignments). Confirm cost and fit." | S23a [Oracle docs] |
| D-042 | nsSetting | "Item record shelf-life fields; FEFO preference" | "Lot (inventory number) expiration date (native); 'Expiry Date Required' item flag and required shelf life (FEFO Lot Assignments SuiteApp); FEFO rotation type (NetSuite WMS)." I found no native "FEFO preference". A native item-level shelf-life field is unverified. | S23a, S24, S25 [Oracle docs] |
| D-005 | notes | Sequencing note only | Add: "MLI requires Locations, Advanced Shipping and **Advanced Receiving** [S1]. Saying yes here forces D-014 (Advanced Receiving, One-way) to yes. MLI also auto-creates the Transfer Orders and Inventory In Transit accounts [S1]." | S1 [Oracle docs] |
| D-006 | notes / reversibility rationale | "Item type per SKU; assembly structure; recall + cert reporting" | Add the exact rule: Lot Tracking and Serialized Inventory "can't [be turned] off" after tracked items are created. Merely enabling them is not yet one-way. AIM auto-enables both [S1, S2]. | S1, S2 [Oracle docs] |
| D-007 | notes | Statistical Accounts note | Add: "Once an item has a units type it 'can't be edited except to add more units' [S4]. MUOM is a prerequisite of NetSuite WMS [S28], the Quality Management SuiteApp [S30] and the Lot and Serial Number Trace SuiteApp [S27], and is auto-enabled by AIM [S2]." Whether the MUOM feature itself can be disabled is unverified: Oracle's enable page is silent [S3]. One-way stays justified at item level. | S2, S3, S4, S27, S28, S30 [Oracle docs] |
| D-012 | nsSetting | "Quality Management SuiteApp (separately licensed)" | Mark "separately licensed" as **unverified** (no Oracle statement found). Add prerequisites: Locations, MUOM, File Cabinet, Return Authorizations, Purchase Orders, Vendor Return Authorizations, Inventory, Custom Records, Client/Server SuiteScript, SuiteFlow. | S30 [Oracle docs] |
| D-036 | notes | "Cannot be changed after the item record is saved. New item required." | Confirmed. Oracle's procedure: adjust to zero, inactivate, recreate the item with an opening balance [S8, S9]. Add: Group Average needs MLI and location costing groups [S10]; Standard needs the Standard Costing feature [S12a]; WIP and Routing assemblies must be Standard or Average [S15, S17]; LIFO is not available in the AU edition [S7]. | S7-S10, S12a, S15, S17 [Oracle docs] |
| D-036 | questionIds | FIN-4a, ITM-1a | FIN-4a, FIN-4b (if standard), ITM-6g (WIP restricts methods). Keep ITM-1a as evidence only, which resolves the "needs a human decision" note in CORRECTIONS.md. | S17 [Oracle docs] for the WIP link |
| D-041 | layer / notes | L2; "Cost Categories; Standard Cost Versions; Cost Rollup" | Keep L2 for values, but note the **L0 prerequisite: Enable Features > Standard Costing** [S1]. Oracle term: "Cost Versions" (standard cost version). Full chain: cost categories, item set to Standard, cost versions, planned standard cost records, Planned Standard Cost Rollup, revaluation [S12a-S12d]. | S1, S12a-d [Oracle docs] |
| D-064 | questionIds | ITM-6d | **ITM-6e** ("What gets recorded during a run - materials issued, labor, machine time, output, scrap?") is the question that decides issue vs backflush. ITM-6d is about the demand signal (better fed to G-03). | Bank text |
| D-064 | nsSetting | "Work Order; Assembly Build; WIP preferences" | "Non-WIP: Work Order -> Assembly Build. WIP: Work Order Issue -> Work Order Completion (optionally with backflush) -> Work Order Close." | S18 [Oracle docs] |
| D-040 | notes | "Work order explosion; standard cost rollup" | Add: "Embedded BOMs on assembly items are unsupported from 2023.1; Advanced BOM is free of charge [S34b]. Disabling Advanced BOM after use **deletes** the BOM and revision records created under it [S34a]. Revision effective dates cannot overlap [S34c]." The decision itself stays Easy, but the feature switch is effectively one-way once used. | S34a-c [Oracle docs] |
| oneWayDoors #11 | constraint | "...Advanced Bill of Materials is the current structure and is free." | Confirmed. Add the disable-deletes-records fact. | S34a, S34b [Oracle docs] |
| D-032 | notes | "Inventory reporting; fulfillment routing; MLI distribution" | Add: Oracle advises **against** using location records for areas inside a warehouse (bin, shelf, dock) because it causes problems with fulfillments, LIFO/FIFO costing and reporting; use bins instead. A location's "Make Inventory Available" box controls whether its stock can be committed. | S37 [Oracle docs] |
| D-067 | nsSetting | "Transfer Orders; Inventory Adjustment; Count" | "Transfer Orders (MLI) or Inventory Transfer; Inventory Adjustment / Adjustment Worksheet (not for Group Average items); Inventory Count feature (lot/serial counts need ABNIM); Transfer Order preferences." | S10, S32, S33 [Oracle docs] |
| D-008 | nsSetting | "No native support - SuiteApp or custom design" | Keep. I found no catch-weight topic in NetSuite help (absence, not proof). Partner sources call it non-standard [X1]. Add: NetSuite WMS can capture weight at PO receipt with a scale [S29]. That does not cover invoicing on actual weight. | S29 [Oracle docs]; X1 [Secondary] |
| oneWayDoors #5 | source | "NetSuite Help - Assembly Item Records" | Confirmed. "Serialized and lot numbered items cannot be included as member items in a regular assembly item"; lot or serial assemblies can hold them. | S21 [Oracle docs] |
| D-037 | reversibility | Costly | Keep Costly. Oracle documents only one conversion: Non-Inventory or Other Charge to Inventory (simple, lot or serial). It is one direction only and final on save [S6]. That other type changes are impossible (recreate the item) is **Secondary only** [X2]. | S6 [Oracle docs]; X2 [Secondary] |

---

## 3. Decision options draft

Conventions: **configure** = enable or set up. **leave off** = features that stay off. **requires** / **makes N/A** refer to decision ids, with gap ids G-xx where a gap decision is proposed. Licence impact is unverified unless stated.

### D-005: Is inventory tracked by location? (Multi-Location Inventory)
- **Input:** yesno
- **Yes:** configure Locations, Advanced Shipping, Advanced Receiving and Multi-Location Inventory [S1], then create locations and distribute items (see oneWayDoors #4). Requires D-032. Forces D-014 = Yes [S1]. Enables G-05 (Group Average), G-04 (Outsourced Manufacturing needs MLI [S20]), G-03 MRP (needs MLI [S31]) and G-08 WMS (needs MLI [S28]). Licence: unverified. **One-way:** cannot be turned off after items are distributed without Support, and no inventory transaction can be dated before the enable date [S1; oneWayDoors #2-3].
- **No:** leave off MLI. Makes N/A: G-05, G-04 (native outsourced flow), G-03 (MRP), G-08 (WMS), the transfer-order parts of D-067, and G-07.
- **Feeding questions:** ITM-5a, ITM-5b (confirm). Add P2P-5f as a cross-check, since Advanced Receiving comes with MLI.

### D-006: Which items need lot or serial traceability (feature level)
- **Input:** multi: {Lot Tracking, Serialized Inventory, Neither}
- **Lot Tracking:** configure Enable Features > Lot Tracking [S1]. Requires D-038 (per-item types), G-09 (lot numbering) and G-01 (ABNIM is needed for lot counts, bins, Lot Trace and Inventory Status [S33, S27, S13a]). Enables D-042. **One-way** once lot items exist [S1].
- **Serialized Inventory:** configure Enable Features > Serialized Inventory [S1]. Requires D-038. **One-way** once serialized items exist [S1].
- **Neither:** leave both off. Makes N/A: D-038, D-039, D-042 (lot expiry), D-043, G-09. Note that AIM (G-02) auto-enables both features [S2].
- **Feeding questions:** ITM-3a, ITM-3b, ITM-3d, ITM-3e (confirm).

### D-007: Do buy, stock and sell units differ? (MUOM)
- **Input:** yesno
- **Yes:** configure Enable Features (Company subtab) > Multiple Units of Measure [S3], then unit types per item. **One-way per item:** a units type "can't be edited except to add more units" [S4]. Required by D-017 Statistical Accounts (oneWayDoors #7), G-08 WMS [S28], D-012 QM [S30] and the D-081 Lot Trace SuiteApp [S27].
- **No:** leave off. This is not possible if D-017, D-012 or G-08 is yes, or the Lot Trace SuiteApp is used [S27, S28, S30].
- **Feeding questions:** ITM-2a, ITM-8 (packaging levels often become units).

### D-008: Is any product sold by catch weight?
- **Input:** yesno
- **Yes:** configure a third-party SuiteApp or custom design (no Oracle feature found [X1]). WMS weighing-scale capture at receipt is a partial aid [S29]. Requires D-007. Licence/quote impact: yes, priced separately (M-12). One-way: not a feature switch. Costly because the item and UOM design depends on it.
- **No:** nothing to configure. Makes N/A: M-12.
- **Feeding questions:** ITM-2b.

### D-009: Production tier
- **Input:** single
- **None (buy or co-man finished only):** leave off Assembly Items, Work Orders and WIP. Makes N/A: D-010, D-040, D-064, D-041 rollup, G-10, G-11. D-037 loses the assembly types.
- **Assembly builds only:** configure Assembly Items + Advanced BOM [S1, S34]. Leave off Work Orders. Requires D-040. Makes N/A: D-010, the WIP branch of D-064, and the routing branch of G-10.
- **Work orders + assembly builds:** configure Assembly Items, Advanced BOM and Work Orders (creates a Work Orders account) [S1]. Requires D-040, D-064, G-03.
- **WIP:** add Manufacturing Work In Process [S16]. Requires D-010 = yes. Assemblies limited to Standard or Average costing [S17], which constrains D-036.
- **WIP + Routing:** add Manufacturing Routing and Work Center, with work centres, a default calendar, cost templates and routings [S15]. Requires G-10.
- **Advanced Manufacturing:** add the Advanced Manufacturing SuiteApp (extends routing into the Work Bench) and optionally Manufacturing Mobile [S19]. Licence: unverified (M-04).
- **Outsourced Manufacturing** can combine with any work-order tier. See G-04.
- **Feeding questions:** ITM-6a, ITM-6e, ITM-6f, ITM-6g.

### D-010: Is there an intermediate or WIP stage?
- **Input:** single: {No, Stocked intermediate (sub-assembly item), In-process tracking (WIP feature)}
- **No:** nothing to configure.
- **Stocked intermediate:** configure sub-assembly items under D-037 / D-040. No WIP feature needed (inference from the assembly model [S21]; mark unverified as a rule).
- **WIP feature:** configure Manufacturing Work In Process plus a WIP and scrap account per assembly [S16, S18]. Assemblies must be Standard or Average [S17]. Requires D-009 at the WIP tier or above. Disable behaviour: unverified [S16].
- **Feeding questions:** ITM-6g, ITM-6e.

### D-011: Can inventory exist but be unavailable to sell?
- **Input:** single: {No, Yes via Inventory Status, Yes via separate non-available location}
- **Inventory Status:** configure Bin Management + ABNIM (G-01), then Inventory Status, custom statuses, and per status "Make Inventory Available for Commitment" (and for Allocation if Supply Allocation is on) [S13a, S13b]. Note that unavailable stock still shows as on hand [S13c]. **One-way** once custom statuses exist, and a used status's availability is locked [S13b].
- **Hold location:** configure a location with "Make Inventory Available" cleared [S37]. Requires D-005 and D-032. Oracle warns against using locations for areas inside a warehouse [S37]. Easy.
- **No:** nothing. Makes N/A: the status-change branch of D-066.
- **Feeding questions:** QLT-2, P2P-5a, QLT-4.

### D-012: Are formal inspection records needed?
- **Input:** yesno
- **Yes:** configure the Quality Management SuiteApp with its prerequisite features (Locations, MUOM, File Cabinet, Return Authorizations, Purchase Orders, Vendor Return Authorizations, Inventory, Custom Records, SuiteScript, SuiteFlow) [S30]. Requires D-007. The tablet interface needs an SCM Mobile app [QM search; S30 family]. Licence: unverified (M-07).
- **No:** inspection evidence is kept outside NetSuite. D-011 may still apply.
- **Feeding questions:** QLT-1, QLT-3, QLT-5.

### D-032: Location records and which hold owned inventory
- **Input:** text-only for the list, plus per location a multi: {holds owned inventory / Make Inventory Available, uses bins, co-man / outsourcing location, 3PL, in-transit/virtual}
- **Configure:** location records. Set "Make Inventory Available" per location [S37] and "Use Bins" per location if ABNIM is on [S14]. An outsourcing location is linked on the vendor record, one vendor per location (G-04) [S20]. Do not model bins or zones as locations [S37].
- **Requires:** D-005 (if more than one stock location), D-001 (subsidiary assignment, cross-area).
- **Feeding questions:** ITM-5a, ITM-5b, ITM-5c.

### D-036: Costing method per item (per item category)
- **Input:** multi (the methods in use), then a mapping of item category to method in evidence
- **Average:** the default [S7, S8]. Compatible with WIP and Routing [S17]. With MLI it is per location; see G-05.
- **FIFO / LIFO:** not compatible with WIP or Routing assemblies [S17]. LIFO is not in the AU edition [S7]. Negative-stock costing follows G-06 [S35].
- **Group Average:** configure Group Average Costing (needs MLI) plus location costing groups [S1, S10]. Requires D-005 and G-05. No Inventory Adjustment Worksheets [S10].
- **Standard:** configure Enable Features > Standard Costing [S1]. Requires D-041. Compatible with WIP [S17].
- **Lot Numbered:** for lot items [S7]. Requires D-038.
- **Specific:** for serial items [S7]. Requires D-038.
- **Every option is one-way per item** [S8]. The only remedy is zero, inactivate and recreate [S9].
- **Feeding questions:** FIN-4a, FIN-4b, ITM-6g. ITM-1a as evidence.

### D-037: Item type per SKU
- **Input:** multi. Each type below says what it needs. Types come from the Item Types list [S5].
  - **Inventory Item:** needs Inventory [S1]. Holds a costing method (D-036).
  - **Lot Numbered Inventory Item:** needs Lot Tracking [S1]. Requires D-038 and G-09.
  - **Serialized Inventory Item:** needs Serialized Inventory [S1]. Requires D-038.
  - **Assembly Item** (plus Lot Numbered and Serialized Assembly): needs Assembly Items and Advanced BOM [S1, S34]. A regular assembly cannot contain lot or serial members [S21]. Requires D-009 and D-040.
  - **Kit/Package Item:** one sellable unit made of several items. Can carry lot or serial components [S22]. No stock of its own (inference from "packages several items"; unverified as a rule).
  - **Item Group:** bundles items on sales or purchase transactions [S5].
  - **Non-Inventory Item** (for sale / purchase / resale): can later convert to an inventory, lot or serial item, one direction only [S6].
  - **Other Charge Item:** same one-way conversion to inventory [S6]. Also the outsourcing charge item for G-04 [S20].
  - **Service Item:** with Standard Costing it can carry a service cost category [S12a].
  - **Matrix Item** (parent and children): built on inventory, non-inventory, other charge or service items [S5]. Needs Matrix Items (auto-enabled by AIM [S2]). See G-12.
  - **Drop Ship / Special Order items:** need the drop ship and special order behaviour; Procurement D-053 [S5].
  - **Download, Gift Certificate, Description, Discount, Markup, Subtotal, Payment, Expense items:** transaction support; Expense needs Charge-Based Billing [S5]. Mostly O2C slice.
- **Reversibility:** Costly. Only Non-Inventory or Other Charge to Inventory is documented [S6]. Other changes mean recreating the item [X2, Secondary].
- **Feeding questions:** ITM-1c, ITM-6a, ITM-6h, ITM-11.

### D-038: Lot or serial designation per item and per assembly parent
- **Input:** single per item category: {Untracked, Lot, Serial}. A rule check runs over the BOM.
- **Lot / Serial:** use the Lot Numbered or Serialized item or assembly type [S5]. Any assembly containing a lot or serial member must itself be lot or serialized [S21]. Requires D-006, G-09 and G-01. **One-way** (item type, oneWayDoors #5) [S21; X2].
- **Untracked:** a regular type. Makes N/A for that item: D-042 lot expiry, D-043.
- **Feeding questions:** ITM-3a, ITM-3d, ITM-3e.

### D-039: Can the 3PL or co-man send lot-to-shipment detail?
- **Input:** single: {Yes, structured (EDI/API/file) / Partial or manual / No}
- **Yes:** configure integration mapping of inventory detail (lot) on fulfillments and receipts (D-075 / D-078). If the 3PL uses NetSuite WMS or Inbound Shipment Management, receiving lot items needs "Inventory Detail on Inbound Shipment", provisioned by Support [S28].
- **Partial / No:** traceability gap. D-081's recall test will fail at the hand-off. Flag it as a risk. There is no NetSuite setting that fixes it.
- **Requires:** D-006 (Lot). **Makes N/A** if D-006 = Neither.
- **Feeding questions:** ITM-3f, O2C-2c, P2P-5e.

### D-040: BOM structure, versioning and revision control
- **Input:** single: {single current revision / dated revisions (effective dates) / revisions with Engineering Change Orders}
- **All options:** configure Advanced BOM (free [S34b]) with BOM revision records whose dates cannot overlap [S34c]. ECO is a native manufacturing capability [S19]; its enabling detail is unverified. Disabling Advanced BOM later deletes the BOM records [S34a]. Requires D-009 (Assembly). Makes N/A if D-009 = None.
- **Feeding questions:** ITM-6b, ITM-6c.

### D-041: Standard cost values and rollup
- **Input:** single: {N/A (no standard items) / standard on purchased items only / standard with assembly rollup / rollup incl. routing labour and machine}
- **Configure:** Enable Features > Standard Costing; cost categories (one material category per inventory item, several on assemblies); item method = Standard; cost versions; planned standard cost records; Planned Standard Cost Rollup (needs a cost category on the assembly); revaluation [S12a-S12d]. The routing option adds labour and machine cost from the default routing [S12c] and requires G-10 and D-009 at the routing tier.
- **Requires:** D-036 includes Standard. **Makes N/A** when D-036 has no Standard.
- **Feeding questions:** ITM-7a, ITM-7b, FIN-4b, ITM-7d.

### D-042: Shelf life and expiration handling
- **Input:** multi: {record lot expiry dates, require expiry on every lot, FEFO on sales-order lot assignment, FEFO at pick, none}
- **Record expiry:** native lot expiration date [S25]. Requires D-006 Lot.
- **Require expiry / FEFO lot assignment:** FEFO Lot Assignments SuiteApp ("Expiry Date Required") [S23a, S23b]. Requires Supply Allocation (O2C), ABNIM (G-01) and Serialized Inventory, with Sales Channel Allocation off [S23b].
- **FEFO at pick:** NetSuite WMS lot rotation type FEFO [S24]. Requires G-08.
- **Feeding questions:** ITM-4a.

### D-043: Minimum remaining shelf life on outbound
- **Input:** single: {Not required / SuiteApp (FEFO Lot Assignments) / custom}
- **SuiteApp:** required shelf-life days on the item and on the customer-item; checked as ship date + days <= expiry [S23a]. Same prerequisites as D-042 FEFO [S23b]. Licence: unverified. Easy.
- **Custom:** scope it before signature (M-13). Costly.
- **Requires:** D-006 Lot and D-042. Makes N/A when not required.
- **Feeding questions:** ITM-4b.

### D-044: Packaging hierarchy and GTIN/UPC/SSCC per level
- **Input:** multi of levels {each, inner, case, pallet} plus text for code ownership
- **Configure:** units on the item's units type (D-007) [S4]. Bar Coding and Item Labels (auto-enabled by AIM [S2]; optional for WMS [S28]). Storing a GTIN per unit level natively is **unverified**. Plan custom fields or an EDI-provider mapping (D-075).
- **Requires:** D-007 if levels are transacted.
- **Feeding questions:** ITM-8.

### D-045: Regulatory attributes per item (allergen, organic, kosher, COO)
- **Input:** multi {allergen, organic, kosher, non-GMO, country of origin, nutrition, other}, each tagged item-level or lot-level
- **Configure:** item-level attributes as custom item fields (bank). Lot-level attributes (for example certificate status per lot) as custom item-number fields on lot records [S25]. Requires D-006 for the lot-level ones. Easy.
- **Feeding questions:** ITM-10, QLT-5.

### D-046: Vendor and customer master, deduped and standardized
- **Input:** text-only, plus single {system of record after go-live: NetSuite / external system} per master
- **Configure:** vendor and customer records, and an import plan. Integration ownership sits in D-078. Not feature-gated. Easy.
- **Feeding questions:** SYS-2, SYS-8.

### D-064: Work order to build flow, backflush vs issue
- **Input:** single: {Assembly Build at completion (non-WIP) / WIP: issue materials then complete / WIP: complete with backflush / mixed per item}
- **Non-WIP:** one Assembly Build per work order [S18]. Requires D-009 at Work orders or above.
- **WIP options:** Work Order Issue, then Work Order Completion (optionally with backflush), then Work Order Close [S18]. Requires D-010 = WIP feature. Backflush posts component cost at location average or actual, or at standard [S17].
- **Feeding questions:** ITM-6e (primary), ITM-6d.

### D-065: Rework, repack, downgrade
- **Input:** multi: {unbuild, rework via work order or build into the same or a new SKU, repack or relabel to another SKU, downgrade to B-grade SKU, downgrade via inventory status, donate or destroy (adjustment)}
- **Configure:** Assembly Unbuild is native with Advanced BOM in use [S1]. A new SKU goes through D-037. Status downgrade requires D-011 Inventory Status. Adjustments use D-067. Cost treatment follows D-036 (WIP average-cost variance [S17]). Easy.
- **Feeding questions:** ITM-11, QLT-4.

### D-066: Non-conforming disposition
- **Input:** multi: {status change to hold or reject, move to a hold location, write-off adjustment, return to vendor (VRA), rework order}
- **Configure:** Inventory Status Change (needs D-011 Inventory Status) [S13c]; hold location (D-011); inventory adjustment (D-067); Vendor Return Authorization (D-060, cross-area); rework (D-065). QM SuiteApp non-conformance records: unverified (D-012). Easy.
- **Feeding questions:** QLT-4, QLT-2, P2P-12.

### D-067: Transfers, adjustments and counts
- **Input:** multi: {transfer orders with in-transit, immediate inventory transfers, inventory adjustments / worksheet, Inventory Count transactions (cycle counts), WMS cycle-count plans}
- **Transfer orders:** need MLI [S1]. Transfer Order preferences: default status, Use Item Cost as Transfer Cost, default Incoterms DAP or EXW, default lead time [S32]. See G-07.
- **Adjustment worksheet:** not for Group Average items [S10].
- **Inventory Count:** configure the Inventory Count feature [S1]. Lot and serial counts need ABNIM [S33]. Velocity (ABC) and interval fields on the item drive calculated counts with WMS [Inventory Counts search results; S33 family].
- **WMS cycle-count plans:** G-08 [S28].
- **Feeding questions:** ITM-5e, ITM-5d, ITM-5c.

---

## 4. Cross-area touches

| From (this slice) | To (other slice) | Dependency | Source |
|---|---|---|---|
| D-005 MLI = yes | D-014 Advanced Receiving (Procurement) | MLI requires Advanced Receiving and Advanced Shipping, so D-014 is forced to yes and its one-way consequence (costing at receipt) follows | S1 [Oracle docs] |
| D-005 MLI | D-024 COA (GL) | MLI creates Transfer Orders and Inventory In Transit accounts. Work Orders creates a Work Orders account | S1 [Oracle docs] |
| G-02 AIM | D-020 Demand Planning (Planning) | Demand Planning and MRP both need AIM, and MRP includes Demand Planning. "Forecast stays external" does not remove AIM if MRP or WMS is wanted | S1, S31 [Oracle docs] |
| G-03 planning | D-051 buying demand (Procurement) | MRP also generates purchase and transfer supply. Transfer Order preferences have a "Generate Transfer Orders in Supply Planning" status | S31, S32 [Oracle docs] |
| D-042 / D-043 FEFO SuiteApp | O2C allocation (Supply Allocation, Sales Channel Allocation, Available to Promise order allocation strategy) | The SuiteApp needs Supply Allocation on and Sales Channel Allocation off; the expected ship date needs the ATP lead-time preference | S23b [Oracle docs] |
| D-011 Inventory Status | Supply Allocation (O2C) | "Make Inventory Available for Allocation" exists only with Supply Allocation; excluded-from-allocation stock cannot be made available for commitment | S13b, S13c [Oracle docs] |
| D-007 MUOM | D-017 Statistical Accounts (Reporting) | Already in the bank (oneWayDoors #7). Also forced by WMS, QM and the Lot Trace SuiteApp | S27, S28, S30 [Oracle docs] |
| D-081 recall test (Reporting) | G-01 ABNIM, D-007 MUOM | The Lot and Serial Number Trace SuiteApp requires Locations, MUOM, Bin Management, ABNIM, SuiteAnalytics Workbook and SuiteFlow | S27 [Oracle docs] |
| D-036 costing | D-031 default costing (Costing) | D-031 is only the default on new items; each item locks its own method | S8 [Oracle docs] |
| D-036 / D-005 | D-013 Landed Cost (Costing) | Under Advanced Receiving, landed cost is allocated on the item receipt, not a transaction Landed Cost subtab. Item cost comes from the receipt; bill differences post to Accrued Purchases | S7; landed-cost pages S38 [Oracle docs] |
| G-04 Outsourced Manufacturing | D-053 tolling and co-man ownership (Procurement), D-034 intercompany | Needs POs, Advanced Receiving and MLI; the consolidator creates POs from work orders by vendor and subsidiary | S20 [Oracle docs] |
| D-053 consignment (Procurement) | Inventory | A native "Consigned Inventory Management" feature exists on the Items & Inventory subtab | S1 [Oracle docs] |
| D-066 non-conforming | D-060 vendor returns (Procurement), D-063 customer returns (Fulfillment) | Disposition paths use VRA and RMA; the QM SuiteApp needs both features | S30 [Oracle docs] |
| G-05 Group Average | D-001 / D-033 OneWorld base currency (Entity), D-070 close (Close) | One base currency per costing group; the period-end BLCGA task | S10, S11 [Oracle docs] |
| G-06 negative inventory | D-070 close-prep searches (Close) | The policy sets how much the negative-inventory search will find; Prevent Negative Inventory needs a SuiteApp | S35, S36 [Oracle docs] |
| G-08 WMS | D-022 licensing (Licensing), M-11 | Mobile users; WMS prerequisites include AIM | S28 [Oracle docs]; licence unverified |
| D-085 opening inventory (Cutover) | D-036, G-05 | Group Average items cannot use the Adjustment Worksheet, so the opening-balance load method matters | S10 [Oracle docs] |

---

## 5. Unverified items (need Oracle confirmation or a sandbox check)

1. Licence or separate cost of: AIM, Demand Planning, MRP, WMS, Advanced Manufacturing SuiteApp, Manufacturing Mobile, Quality Management SuiteApp, FEFO Lot Assignments, Lot Auto Numbering, Lot and Serial Number Trace, Outsourced Manufacturing, Standard Costing, Group Average Costing. Only Advanced BOM is stated free [S34b]. Secondary pricing is inconsistent [X3].
2. Whether the MUOM feature itself can be disabled once used [S3 is silent].
3. Whether Manufacturing WIP or ABNIM can be disabled once used [S14, S16 are silent].
4. That item types other than Non-Inventory or Other Charge to Inventory cannot be changed (Secondary only [X2]).
5. A native item-level shelf-life field outside the FEFO SuiteApp.
6. Native GTIN storage per unit-of-measure level.
7. Whether FEFO lot allocation exists in core without the FEFO Lot Assignments SuiteApp or WMS (no Oracle evidence found).
8. ECO enablement detail (named as a capability in [S19] only).
9. Whether a matrix item structure can be converted later.
10. The QM SuiteApp's non-conformance record capability (secondary mention only).
11. Component-yield field semantics on BOM revisions.
12. Whether a kit holds no stock of its own (inferred, not quoted).

---

## Sources

Oracle docs (all under https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/):
- S1 [Oracle docs] Enabling Inventory Features - article_1111112400.html
- S2 [Oracle docs] Enabling the Advanced Inventory Management Feature - article_162488513759.html
- S3 [Oracle docs] Enabling Multiple Units of Measure - article_163283384203.html
- S4 [Oracle docs] Multiple Units of Measure - chapter_N2211898.html
- S5 [Oracle docs] Item Types - chapter_N2222944.html
- S6 [Oracle docs] Converting Non-Inventory Items to Inventory Items - section_N2258046.html
- S7 [Oracle docs] Costing Methods - section_N2191818.html
- S8 [Oracle docs] Setting a Default Inventory Costing Method - section_4345703007.html
- S9 [Oracle docs] Changing Your Costing Method - bridgehead_160650437174.html
- S10 [Oracle docs] Group Average Costing - section_4345703444.html
- S11 [Oracle docs] Balance Location Costing Group Accounts - section_4503902247.html
- S12a [Oracle docs] Standard Costing Workflow - subsect_162705144712.html; Setting Up Item Records for Standard Costing - section_N2201836.html
- S12b [Oracle docs] Creating Cost Categories - section_N2201059.html; Defining Cost Versions - section_N2202327.html
- S12c [Oracle docs] Standard Cost Rollup - section_N2204939.html
- S12d [Oracle docs] Entering Planned Standard Cost Records - section_N2202799.html
- S13a [Oracle docs] Setting Up Inventory Status - section_1518031931.html
- S13b [Oracle docs] Creating Inventory Status Records - section_1498074763.html
- S13c [Oracle docs] Inventory Status - section_1515696627.html; Inventory Allocation and Commitment Based on Status - section_1517948058.html
- S14 [Oracle docs] Advanced Bin / Numbered Inventory Management - section_N2271791.html
- S15 [Oracle docs] Manufacturing Routing - chapter_N2341076.html
- S16 [Oracle docs] Enabling the WIP Feature - section_N2335702.html
- S17 [Oracle docs] WIP and Inventory Costing - section_N2340709.html
- S18 [Oracle docs] Work Order Completion - section_N3200062.html
- S19 [Oracle docs] Manufacturing Overview - chapter_1506100009.html
- S20 [Oracle docs] Setting up Outsourced Manufacturing - section_157833742278.html; Outsourced Manufacturing Consolidator - bridgehead_161183731844.html
- S21 [Oracle docs] Assembly Item Records - section_N2319594.html
- S22 [Oracle docs] Entering Serial and Lot Components on the Item Record for the Kit - section_N2225398.html
- S23a [Oracle docs] FEFO Lot Assignments - article_161009052865.html
- S23b [Oracle docs] Installing FEFO Lot Assignments - section_160638997107.html
- S24 [Oracle docs] Pick Task Sorting and Recommended Bins (NetSuite WMS) - section_1549310986.html
- S25 [Oracle docs] Lot Numbered Items - section_N2235684.html
- S26 [Oracle docs] Lot Auto Numbering SuiteApp - article_162780241331.html
- S27 [Oracle docs] Installing Lot and Serial Number Trace - section_159412055773.html
- S28 [Oracle docs] Enabling Features for NetSuite WMS - section_156399385061.html
- S29 [Oracle docs] Weighing Scale Support - section_161523537011.html
- S30 [Oracle docs] Quality Management Prerequisites - section_1528995922.html
- S31 [Oracle docs] Supply Planning Prerequisites - section_159172352717.html; Enabling Supply Planning Features - section_161780351051.html
- S32 [Oracle docs] Setting Transfer Order Preferences - section_N2310077.html
- S33 [Oracle docs] Inventory Count (record) - section_0817104703.html; Inventory Counts - section_1541441798.html
- S34a [Oracle docs] Enabling Advanced BOM - section_1497967586.html
- S34b [Oracle docs] Assembly Item Records (2023.1 embedded-BOM end and "free of charge") - section_N2319594.html
- S34c [Oracle docs] Updating BOM Revision Record Dates - section_1518447156.html
- S35 [Oracle docs] Setting Inventory Costing Preferences - section_1497451045.html
- S36 [Oracle docs] Setting the Prevent Negative Inventory Preference - section_1521526008.html
- S37 [Oracle docs] Creating Locations - section_N263263.html
- S38 [Oracle docs] Entering Landed Cost on a Transaction - section_N2418831.html; Landed Cost Categories - section_N2417902.html

Secondary:
- X1 [Secondary] Folio3, NetSuite Catch Weight Solution - https://netsuite.folio3.com/?p=31449 (vendor marketing)
- X2 [Secondary] Gurus Solutions answer on changing item subtype - https://answers.gurussolutions.com/?p=2100; NetSuite Professionals archive - https://archive.netsuiteprofessionals.com/t/428498/we-have-hundred-s-of-inventory-and-assembly-items-that-we-wi
- X3 [Secondary] Oracle Licensing Experts, NetSuite module pricing - https://oraclelicensingexperts.com/blog/netsuite-module-pricing/; Epiq, NetSuite modules pricing - https://epiqinfo.com/netsuite-modules-pricing/
