# Slice C: procure-to-pay and order-to-cash

Research date: 2026-10-12. Bank read: `ns-tracker/bank/` (decisions.json, questions.json, layers.json, oneWayDoors.json, moduleScoping.json, CORRECTIONS.md). No repo files edited.

Scope: decisions in areas Procurement, AP, Sales, Fulfillment, plus D-014 and D-015; questions P2P-*, O2C-*, CSH-*. D-076 and D-077 (Integration area, fed by CSH and O2C questions) are drafted as adjacent decisions at the end of the options section.

## How to read this

- Every NetSuite fact carries a source tag `[Sn]`. The source list at the bottom says whether each is **Oracle docs**, **Oracle service description** (Oracle's contract document that lists what each licensed cloud service includes), **Oracle docs (mirror)** (a copy of the Oracle help page served from a non-Oracle host; the docs.oracle.com copy was not fetched), or **Secondary**.
- "Unverified" means I looked and could not confirm it from a source. Those items are collected in the Unverified section.
- "Inferred" means a conclusion drawn from the absence of something in Oracle's own documents (for example, a feature with no licensing note that is not listed as a paid module). Treat inferred items as leads to confirm with the account rep.
- Proposed new decisions are numbered `N-01`..`N-12` so they cannot be confused with real D- ids.

## Counts

- Gaps: 15 (12 proposed decisions, 3 missing questions-only)
- Corrections: 19
- Decisions drafted: 20 existing (18 in slice + D-076, D-077 adjacent) and 12 proposed (N-01..N-12) = 32
- Unverified items: 11

---

## 1. Gaps

### 1a. Proposed decisions

| # | Area | Layer | Decision (text) | Why it matters | Fed by | Source |
|---|---|---|---|---|---|---|
| N-01 | Sales | L3 (setting) / L4 (who approves) | Whether sales orders need approval before fulfillment, and whether an edit forces re-approval | Sets the Default Sales Order Status (Pending Approval vs Pending Fulfillment) on the Order Management subtab, and the Require Re-approval on Edit of Sales Order preference. Interacts with credit limits: unbilled orders count toward the credit limit whether approved or not when Customer Credit Limit Includes Orders is checked. No decision or question covers it today. | New question needed (see Q-gap 1); O2C-8 | [S18] [S17] [S16] |
| N-02 | Fulfillment | L3 | How inventory is committed and allocated to orders, by channel and location | Under multi-location inventory, which order gets stock and from where is a design choice: Supply Allocation (commit against future supply), Sales Channel Allocation, Order Reservations, Available to Promise, and Automatic Location Assignment (Advanced Order Management). Marketplace and wholesale channels competing for the same stock is the usual case. | O2C-1a, O2C-2d, O2C-6c, ITM-5a | [S8] [S11] [S3] [S37] |
| N-03 | Sales (AR) | L3 | What triggers the customer invoice, and how invoices are grouped and delivered | With Advanced Shipping, billing is a separate step after fulfillment; Invoice in Advance of Fulfillment allows billing the whole order before it ships; Invoice Groups combine invoices; Advanced Billing adds billing schedules (part of the Financial Management cloud service); e-invoicing to a network needs the Electronic Invoicing SuiteApp (free for one country, licensed for more). O2C-4a and O2C-4b have no decision. | O2C-4a, O2C-4b, O2C-1c | [S13] [S4] [S35] [S29] |
| N-04 | Sales (AR) / Cash | L3 + L5 | Whether customers pay cards/ACH inside NetSuite, and through which processor | Needs Credit Card Payments feature, a merchant account and a payment processing profile per gateway/currency, or NetSuite Pay (Versapay; US/Canada; included in several SuiteSuccess editions purchased or renewed on or after 15 Sep 2026), plus Payment Link for invoice links. Changes the quote and the cash reconciliation design (D-076). | O2C-1e, CSH-2, O2C-4c | [S5] [S36] [S26] [S35] |
| N-05 | Sales | L3 | Whether deposits or prepayment are required on any orders | Required Deposit Workflow requires a customer deposit on sales orders (percentage or amount). Prepaid orders also change revenue timing (D-015). | O2C-1e, O2C-5c | [S2] |
| N-06 | Sales / Revenue | L0 (feature) / L3 | How gift cards, store credit and referral credits are issued and redeemed | Gift Certificates feature sells set or variable amounts and allows reuse of a remaining balance. O2C-5c is Tier 1 with no decision referencing it (CORRECTIONS.md "Computed Tier 1 consistency findings"). Whether the liability is held in NetSuite or in the commerce/subscription platform must be decided. | O2C-5c, O2C-5e | [S9] |
| N-07 | Sales (AR) | L3 | How cash is applied and how collections and dunning run in NetSuite | Automated Cash Application generates and applies customer payments from imported bank lines; Dunning Letters SuiteApp must be obtained through the account rep and requires Multi-Language; Payment Date Prediction is an accounting feature. D-077 covers only an external AR platform; O2C-4c and O2C-4f have no decision. | O2C-4c, O2C-4f, O2C-10, CSH-3 | [S27] [S28] [S6] |
| N-08 | Sales (AR) / Procurement | L0 (licence) / L3 | How customer deductions, chargebacks, customer rebates, trade promotions and vendor rebates are recorded | Rebate Management Cloud Service covers customer, vendor and third-party rebate and trade promotion agreements with accruals and settlements; it requires OneWorld or Subsidiary Management and is included in the Food & Beverage SuiteSuccess editions. Without it, deductions are a custom or manual design. O2C-4d, O2C-1f and P2P-7f have no decision. | O2C-4d, O2C-1f, P2P-7f | [S35] |
| N-09 | Procurement | L0 (licence) / L3 | Whether the Procurement module is needed: requisitions, request for quote, purchase contracts, blanket purchase orders | These four are the listed capabilities of the NetSuite Procurement Cloud Service (licensed; included in Food & Beverage Premium, not Standard). Purchase Requests (Employees subtab) is a separate feature. D-047 and D-051 name these in nsSetting without any licensing decision. | P2P-1a, P2P-1e, P2P-3, P2P-2b | [S35] [S1] [S10] |
| N-10 | Procurement / AP / Controls | L4 | Which approval mechanism runs purchase orders, requisitions, vendor bills and vendor payments | Choices: Approval Routing feature (purchase/expense limits on employee; without it, requests go to supervisor then accounting), per-transaction SuiteFlow approval preferences, NetSuite Approvals Workflow SuiteApp, or SuiteApprovals SuiteApp. Requisition approval requires the Requisition Approval Workflow bundle. The View and Approve user licence covers approving vendor bills and sales orders but its record list does not include purchase orders (requisitions, blanket POs, purchase contracts only with the Procurement module). Could be built as options on D-068 instead of a new decision. | P2P-2b, P2P-6e, P2P-7b, ORG-2 | [S10] [S11] [S12] [S18] [S35] |
| N-11 | AP | L3 | How vendor bills enter NetSuite (manual, Bill Capture, A/P platform, EDI) | Bill Capture is an Accounting feature that scans uploaded or emailed bills; email intake runs through the Transaction Email Capture SuiteApp. Overlaps D-071 (A/P platform). The AP Automation cloud service that bundled Bill Capture is no longer sold (no net new sales since 1 Sep 2024). Current licensing of Bill Capture: unverified. P2P-6a has no decision. | P2P-6a, P2P-8b, P2P-8c | [S7] [S24] [S35] |
| N-12 | Sales | L0 | Whether sales reps or partners are paid commission calculated in NetSuite | Employee Commissions must be disabled before SuiteBilling can be enabled; existing commission data becomes inaccessible while disabled. This is a hard conflict with N-03/D-073 if subscription billing moves into NetSuite. There is no commission question in the bank. | New question needed (see Q-gap 3) | [S25] |

### 1b. Missing questions (no decision needed beyond the above)

| # | Section | Suggested question | Why | Feeds |
|---|---|---|---|---|
| Q-gap 1 | Sales | Do sales orders need someone's approval before they ship? Who, and on what condition (amount, customer, margin)? | Only source for N-01. | N-01 |
| Q-gap 2 | AP | Do you pay any vendor before delivery (deposits, prepayments, cash in advance)? How are they tracked against the order and the bill? | Vendor Prepayments is an accounting feature; it can link a prepayment to a PO and auto-apply it to that PO's bills. No question asks about it. | D-058 option |
| Q-gap 3 | Sales | Are sales reps, brokers or partners paid commission? How is it calculated and from which transactions? | Commission conflicts with SuiteBilling (N-12). | N-12 |

Not raised as gaps (already covered or trivial): drop ship (P2P-4/D-053), EDI (O2C-7/D-075), marketplaces (O2C-6/D-074), TMS (O2C-3/D-072), parcel labels and multi-address shipping (folded into D-062 options).

---

## 2. Corrections

| # | Id | Field | Current | Proposed | Source |
|---|---|---|---|---|---|
| C-01 | D-014 | notes / dependency | Treated as an independent choice | Add: Advanced Receiving is a stated prerequisite of Multi-Location Inventory ("You'll also need to enable Locations, Inventory, Advanced Shipping, and Advanced Receiving"). If D-005 = yes, D-014 is forced yes. | [S8] |
| C-02 | D-014 (and P2P-5f "why", oneWayDoors #9) | reversibility | One-way | "One-way when Multi-Location Inventory is on (MLI can only be disabled by Support); standalone reversibility unverified." No Oracle page found says Advanced Receiving cannot be disabled; community answers say it can be toggled on Enable Features. | [S8] [S43] |
| C-03 | D-062 | reversibility | Easy | Costly. "After you have enabled Advanced Shipping, it cannot be turned off unless all fulfilled sales orders are billed." It is also an MLI prerequisite, so with D-005 = yes it is locked. | [S13] [S8] |
| C-04 | D-062 | layer | L3 | Split: the Advanced Shipping / Pick, Pack and Ship feature enable is an L0 setting; the warehouse/3PL handoff process stays L3. | [S3] [S13] |
| C-05 | M-05 | ask | "Advanced Receiving / Landed Cost: included?" | "Is the Inventory Management module included (landed cost, pick/pack/ship, bins, lot and serial, matrix items, reorder-point replenishment)?" Landed Cost is listed as a capability of the NetSuite Inventory Management Cloud Service. Advanced Receiving carries no licensing note on the Enable Features page and is not listed as a paid module (inferred: standard feature). | [S35] [S3] |
| C-06 | D-015 | nsSetting | Enable Features > Advanced Revenue Management | Enable Features > Accounting > Advanced Revenue Management (Essentials), plus ARM (Revenue Allocation) only if multi-element allocation is needed. Prerequisite: Accounting Periods. ARM in Configuration Mode is auto-enabled so it can be configured before it recognises revenue. | [S6] |
| C-07 | D-015 / M-03 | notes (licence) | "Expensive module" | Licensed as NetSuite Revenue Management Cloud Service. Revenue Allocation is a separate add-on (private-company and public-company versions) whose prerequisites include the NetSuite Sandbox Environment Cloud Service, so allocation also drags a sandbox onto the quote. | [S35] |
| C-08 | oneWayDoors #6 | constraint | "Advanced Revenue Management" cannot be disabled once used | Split: ARM (Essentials) "When you enable this feature, you can't disable it"; ARM (Revenue Allocation) cannot be disabled once enabled and Configuration Mode is off. Rule-Based Recognition Treatment cannot be disabled once rules exist and Configuration Mode is off. | [S6] |
| C-09 | D-057 | nsSetting | 3 Way Match Vendor Bill Approval Workflow; bill variance | Delivered by the NetSuite Approvals Workflow SuiteApp (bundle 537941). Requires A/P, Purchase Orders, Advanced Receiving, Approval Routing, SuiteFlow, and the Vendor Bills box on the Approval Routing subtab. Items on the PO need Match Bill to Receipt = Yes. Variances post through Post Vendor Bill Variances to item-level Bill Price / Bill Quantity / Exchange Rate variance accounts. Add dependency: requires D-014 = yes. | [S12] [S24] [S15] |
| C-10 | D-058 | nsSetting | Bill Payments; Electronic Bank Payments | Standard Electronic Bank Payments SuiteApp (local formats) vs Advanced Electronic Bank Payments (licensed: global templates, custom formats, multicurrency, batch automation; included in several SuiteSuccess editions). Add Intelligent Payment Automation (BILL; US customers, US vendors, USD only, production only). | [S23] [S35] [S22] |
| C-11 | D-058 / D-071 | notes | none | HSBC-based Payment Automation SuiteApp: no new HSBC applications after 4 Mar 2026; support targeted to end 31 Dec 2026; Oracle points to Intelligent Payment Automation. The AP Automation cloud service (Bill Capture + HSBC payments) is listed under retired parts, no net new sales since 1 Sep 2024. Do not design on either. | [S21] [S35] |
| C-12 | D-053 | nsSetting | Drop Ship & Special Orders; ownership modelling | Feature is named "Drop Shipments & Special Orders". Add "Consigned Inventory Management" (vendor consignment) and "Outsourced Manufacturing" (tolling / components you own at a contract manufacturer); OneWorld adds Automated Intercompany Drop Ship. Critical: Consigned Inventory Management cannot be enabled if the Assembly Items feature is used (and vice versa), cannot be used with WMS, and does not support manufacturing. | [S9] [S8] [S6] [S33] |
| C-13 | D-055 | nsSetting | In-Transit inventory; ownership at title transfer | Inbound Shipment Management: an ownership transfer record can be created once the shipment is In-Transit and posts the transfer to the GL before receipt. Once a PO line is on an inbound shipment it must be received from the shipment. Consigned items cannot be on an inbound shipment. | [S34] [S33] |
| C-14 | D-056 | nsSetting | Landed Cost categories; separate vendor bills | Add: Inbound Shipment Management can apply landed cost to a whole shipment instead of individual receipts. Landed Cost is part of the Inventory Management cloud service. | [S34] [S35] |
| C-15 | D-048 | nsSetting / questionIds | Price Levels; Pricing Matrix; Customer records. Fed by O2C-1d | Add features: Multiple Prices (at least four price levels), Quantity Pricing, Advanced Pricing (price rules, time-limited and customer-specific pricing; "significantly changes the Item record"), Promotion Codes / SuitePromotions / Auto-Apply Promotions. Standard and Advanced promotions are superseded by SuitePromotions. Add O2C-5d as a feeding question (first-order promotional pricing). | [S2] [S31] [S32] |
| C-16 | D-047 | nsSetting | Vendor record pricing; Purchase Price levels; Purchase Contracts | Replace "Purchase Price levels" (no Oracle source found for this term) with: Multiple Vendors feature (vendor, vendor item code, purchase price per vendor on the item), Purchase Contracts and Blanket Purchase Orders (Procurement module), Advanced Pricing (covers items you buy as well as sell). | [S9] [S1] [S35] [S2] |
| C-17 | D-051 | nsSetting | Reorder points; Requisitions; external forecast feed | Reorder-point replenishment is a listed capability of the Inventory Management cloud service; Requisitions belong to the Procurement cloud service. Licensing goes to N-09 / M-05. | [S35] |
| C-18 | D-061 | notes | "Employee Center license need" | Core Suite includes five Employee Center users; more must be purchased. Expense Reports creates Unapproved Expense Reports, Advances Paid and Accounts Payable accounts. Without Approval Routing, expense reports go to supervisor then accounting. | [S35] [S10] |
| C-19 | layers.json / decisions | coverage | CSH-1, CSH-4, CSH-5, CSH-6 feed no layer and no decision. P2P-0 feeds nothing. The whole O2C-4 AR group (invoicing, cash application, deductions, credit memos, collections) feeds L3 but no decision; O2C-5b, O2C-5c, O2C-6a are Tier 1 with no decision. | Map CSH-4/CSH-6 to D-076, CSH-5 to N-07 or a close decision, CSH-1 to L1 (bank accounts in COA); O2C-4* to N-03/N-07/N-08; O2C-6a to D-074; O2C-5b to D-073; O2C-5c to N-06 and D-015. | Computed from bank files |

---

## 3. Decision options draft

Field key per option: **configure** (enable / set up), **leave off**, **requires**, **makes N/A**, **licence/quote**, **one-way?**. Each option carries its sources.

### D-014 Receipt separate from bill (Advanced Receiving)

- Input: yesno
- Feeding questions: P2P-5f (confirm); add P2P-5c, P2P-6b; ITM-5a via D-005.
- **Yes**: configure Enable Features > Transactions > Advanced Receiving; creates system Accrued Purchases account [S3]. LIFO/FIFO costing happens at item receipt, cost from PO amounts [S14]. Requires: nothing. Forced on if D-005 = yes [S8]. Makes possible: D-057 three-way match [S12]. Licence: none found (inferred) [S3]. One-way: locked while MLI is on [S8]; otherwise unverified (C-02).
- **No**: leave Advanced Receiving off; receipt and bill are one step and costing waits for the bill [S14]. Not allowed if D-005 = yes [S8]. Makes N/A: D-057 (3-way match workflow requires Advanced Receiving) [S12]. One-way: no.
- Optional preference (secondary): Bill in Advance of Receipt on Order Management preferences lets a bill be entered before receipt [S42].

### D-015 Deferred / subscription revenue scheduling (ARM)

- Input: single
- Feeding questions: FIN-5a, O2C-5a (confirm); add O2C-5c (prepaid plans, gift cards), O2C-5e.
- **No deferral needed (revenue at shipment/invoice)**: leave ARM off. Licence: none. One-way: no.
- **ARM (Essentials)**: configure Accounting > Advanced Revenue Management (Essentials); prerequisite Accounting Periods; creates Deferred Revenue, Unbilled Receivables and Revenue Arrangement accounts; Configuration Mode auto-enabled for setup [S6]. Licence: NetSuite Revenue Management Cloud Service [S35]. One-way: yes, "When you enable this feature, you can't disable it" [S6].
- **ARM (Essentials) + Revenue Allocation**: as above plus ARM (Revenue Allocation) for SSP / fair value allocation across performance obligations [S6]. Licence: Revenue Allocation add-on (private or public company version) which also requires the Sandbox Environment cloud service [S35]. One-way: yes [S6].
- Makes required: N-06 decision on where gift-card liability lives; cross-area with D-073.

### D-047 Vendor pricing storage

- Input: multi
- Feeding questions: P2P-3 (confirm); add P2P-1e (contracted volumes, blanket POs).
- **Item purchase price / last price**: configure purchase price on item; no feature. Licence: none.
- **Per-vendor price on item**: configure Multiple Vendors feature (vendor name, item code, purchase price per vendor) [S9]. Note: with Multiple Vendors, Bill Capture maps items via the vendor name/code on the item [S24]. Licence: none found.
- **Purchase contracts / blanket POs**: configure Purchase Contracts and/or Blanket Purchase Orders features [S1]. Requires N-09 = yes. Licence: Procurement cloud service [S35].
- **Advanced Pricing price rules**: configure Multiple Prices + Advanced Pricing (prices for items you buy and sell) [S2] [S31]. Shared with D-048; one-way unverified.
- One-way: none stated for any option.

### D-048 Customer and channel pricing

- Input: multi
- Feeding questions: O2C-1d (confirm); add O2C-5d, O2C-1a.
- **Single base price**: leave pricing features off.
- **Price levels**: configure Multiple Prices (at least four price levels) [S2]; customer default price level; pricing groups [S2].
- **Quantity breaks**: configure Quantity Pricing [S2].
- **Price rules (time-limited, customer-specific)**: configure Advanced Pricing; "significantly changes the Item record" [S31]. Reversibility unverified - treat as Costly until confirmed.
- **Promotions / coupon codes**: configure Promotion Codes, SuitePromotions, Auto-Apply Promotions (SuitePromotions requires the other two) [S2]. Standard/Advanced promotions are superseded by SuitePromotions [S32]. Do not disable Promotion Codes once transactions carry promotions [S32].
- Makes required: none. Licence: none found for these features (inferred from no licensing note in [S2]).

### D-049 Credit limits and holds

- Input: single (handling) + number (days overdue) + yesno (include orders)
- Feeding questions: O2C-8 (confirm); add O2C-4f.
- **Ignore**: Customer Credit Limit Handling = Ignore [S16].
- **Warn only**: = Warn Only; warning not shown while an invoice is Pending Approval [S16].
- **Enforce holds**: = Enforce Holds; blocks a sales order or invoice that puts the customer at or above limit; does not affect estimates, opportunities or cash sales [S16].
- Sub-settings: Customer Credit Limit Includes Orders (unbilled orders count, approved or not) [S16]; Days Overdue for Warning/Hold (grace period) [S16]; credit limit per customer record.
- Requires: N-01 (if SO approval is used, decide whether Pending Approval orders should count). Licence: none. One-way: no.

### D-051 How buying demand is generated

- Input: multi
- Feeding questions: P2P-1a (confirm); add P2P-1b, P2P-1c, P2P-1d.
- **Judgment / manual POs**: nothing to enable.
- **Reorder point / min-max**: reorder-point replenishment, lead time and safety stock are Inventory Management cloud service capabilities [S35]; Advanced Inventory Management feature for demand-based suggestions [S8]. Licence: Inventory Management module.
- **Requisitions from employees**: configure Requisitions (creates Requisitions account) [S1] or Purchase Requests (Employees subtab) [S10]. Requisitions requires N-09 [S35].
- **MRP / supply planning**: Material Requirements Planning feature [S8]. Cross-area: D-020 / Planning.
- **External forecast feed**: integration (D-020, D-078).

### D-052 PO document and channel

- Input: multi
- Feeding questions: P2P-2a (confirm); add P2P-2c, P2P-2d.
- **PDF by email**: Advanced PDF/HTML template + email template. Licence: none.
- **EDI 850**: EDI provider; NetSuite has no native EDI engine [S41]. Requires D-075.
- **Oracle Business Network (SuiteProcurement)**: transmit approved POs, receive acknowledgements, ship notices and bills over OBN; includes Electronic Business Extension; only Employee Self-Serve users may access [S35]. Licence: SuiteProcurement cloud service.
- **Vendor portal**: Vendor Center login is part of Core Suite [S35]; cross-area D-022.

### D-053 Consignment, VMI, drop ship, tolling, bill-and-hold

- Input: multi
- Feeding questions: P2P-4 (confirm); add O2C-2a.
- **None**: nothing.
- **Drop ship / special order**: configure Drop Shipments & Special Orders [S9]. OneWorld cross-subsidiary: Automated Intercompany Drop Ship [S6].
- **Vendor consignment (vendor owns stock until consumed)**: configure Consigned Inventory Management; item flag Allow Vendor Consignment [S8] [S33]. Requires: Assembly Items feature NOT in use, no WMS [S33]. Makes N/A: D-009 assembly tiers and M-11 WMS if chosen (mutually exclusive) [S33]. If assemblies are needed, consignment must be a custom design. One-way: unverified.
- **Tolling / outsourced manufacturing (components you own at a co-man)**: configure Outsourced Manufacturing [S8]. Cross-area: Production (D-009, D-064).
- **Customer consignment / bill-and-hold / VMI at customer**: no specific Oracle feature found; design as location/ownership modelling (unverified).
- Licence: none stated on the Enable Features pages for these features [S8] [S9].

### D-054 Receiving process incl. quality hold

- Input: multi
- Feeding questions: P2P-5a (confirm); add P2P-5b, P2P-5d, P2P-5e, QLT-2.
- **Receive on PO**: Item Receipt; requires D-014 = yes for a separate receipt [S3].
- **Receive from inbound shipment**: Inbound Shipment Management; bulk receive many POs from one shipment record [S34].
- **Quality hold via status**: Inventory Status feature, statuses that make stock unavailable [S8]; cross-area D-011.
- **Bins / scanning**: Bin Management, Advanced Bin/Numbered Inventory Management, WMS (needs SCM Mobile and NetSuite WMS SuiteApps) [S8]; cross-area M-11.
- Licence: bins and lot capture are Inventory Management capabilities [S35]; WMS licensing not located in [S35] (unverified).

### D-055 FOB terms and goods-in-transit ownership

- Input: single
- Feeding questions: P2P-9 (confirm).
- **Title at destination / receipt**: no in-transit accounting; ownership at item receipt.
- **Title at origin, tracked in NetSuite**: configure Inbound Shipment Management; create an ownership transfer once the shipment is In-Transit (posts to GL) [S34]. Consigned items cannot be on an inbound shipment [S33]. May need an External Inventory in Transit account (secondary, [S34] summary).
- **Title at origin, journal accrual**: no feature; manual month-end entry.
- Reversibility: Costly (keep).

### D-056 Duty and brokerage cost capture

- Input: single
- Feeding questions: P2P-10 (confirm); add FIN-4c.
- **Expense, not capitalised**: no feature.
- **Landed cost per receipt**: configure Landed Cost [S8]; Requires D-013 = yes. Licence: Inventory Management module [S35].
- **Landed cost per inbound shipment**: Inbound Shipment Management applies landed cost to the whole shipment [S34].

### D-057 Match tolerance and exception handling

- Input: single + number (price %, qty %)
- Feeding questions: P2P-6c (confirm); add P2P-6b, P2P-6f.
- **No match (bills entered freely)**: nothing. Variances still land in Accrued Purchases and are cleared with Post Vendor Bill Variances [S15].
- **2-way (bill vs PO)**: bill from PO; no receipt link.
- **3-way with workflow**: install NetSuite Approvals Workflow SuiteApp (3 Way Match Vendor Bill Approval); prerequisites A/P, Purchase Orders, Advanced Receiving, Approval Routing, SuiteFlow, Vendor Bills approval preference; tolerance and difference fields added [S12]. Items need Match Bill to Receipt = Yes [S24]. Requires D-014 = yes, N-10. Licence: none stated [S12] (inferred).
- Sub-setting: variance accounts on items (Bill Price / Bill Quantity / Exchange Rate) [S15] - cross-area item build L2.
- One-way: no; but once a variance journal posts, the linked PO, receipt and bill cannot be changed [S15].

### D-058 Payment execution path

- Input: multi
- Feeding questions: P2P-7a (confirm); add P2P-7b, P2P-7c, P2P-7d, Q-gap 2.
- **Checks printed from NetSuite / manual bank portal**: Bill Payments; no add-on.
- **Payment files (ACH/EFT) from NetSuite**: Electronic Bank Payments SuiteApp; local country formats free; Advanced EBP (global templates, custom formats, multicurrency, batch automation) licensed [S23] [S35]. Payment batch approval and Positive Pay are documented EBP topics [S23]. Payment Runs approval via SuiteFlow [S11]. Vendor Payment Instruments feature stores vendor bank details on the vendor [S5].
- **Intelligent Payment Automation (BILL)**: US company, US vendors, USD, production only; payments only via Automated Bill Payments, not Pay Bills page or CSV [S22]. Licence: IPA cloud service; included in several SuiteSuccess editions purchased or renewed on or after 15 Sep 2026 [S35]. Oracle FAQ also states an AP Automation licence and License Client are required [S22] - conflict with [S35], confirm with rep.
- **External A/P platform pays**: NetSuite records payments synced back; cross-area D-071.
- **Vendor prepayments**: configure Vendor Prepayments; link to PO to auto-apply to that PO's bills [S6] [S20].
- Avoid: HSBC Payment Automation (ending) [S21].
- One-way: none stated.

### D-059 Vendor onboarding and 1099

- Input: single
- Feeding questions: P2P-11 (confirm); add P2P-8e.
- **1099 fields on vendor + third-party filing**: vendor 1099 eligibility fields, payments extracted to a filer (Track1099, Aatrix and similar) [S46].
- **Native 1099 print/e-file**: unverified - no Oracle page located during this sweep.
- **Vendor approval workflow**: SuiteFlow on vendor record (no Oracle source checked; unverified).
- Licence: third-party filer cost.

### D-060 Vendor returns

- Input: single
- Feeding questions: P2P-12 (confirm); add P2P-5d, P2P-7f.
- **Vendor Return Authorization**: configure Vendor Return Authorizations; creates Vendor Return Authorizations and Purchases Returned Not Credited accounts [S1].
- **Vendor credit only (no physical return)**: inventory adjustment / write-off plus vendor credit; no feature.
- Licence: none found. One-way: none stated.

### D-061 Employee expense and card spend

- Input: multi
- Feeding questions: P2P-13 (confirm).
- **Expense reports in NetSuite**: configure Expense Reports (creates Unapproved Expense Reports, Advances Paid, Accounts Payable accounts) [S10]; approvers via Approval Routing or SuiteFlow [S10] [S11]. Licence: Core Suite includes 5 Employee Center users, more purchased [S35]; cross-area D-022.
- **External expense tool, summary into NetSuite**: integration (D-078).
- **Corporate card feed**: corporate card feature not confirmed on Oracle pages fetched (unverified).

### D-062 Pick / pack / ship and 3PL handoff

- Input: multi (+ single for default stage)
- Feeding questions: O2C-2a (confirm); add O2C-2b, O2C-2c, O2C-2d, O2C-3a.
- **Fulfill and bill in one step**: leave Advanced Shipping off; invoice created when lines ship [S19]. Not allowed if D-005 = yes [S8].
- **Advanced Shipping**: fulfill and bill as separate transactions; cannot be turned off unless all fulfilled orders are billed [S13]. Required by MLI [S8]. Makes required: N-03.
- **Pick, Pack and Ship**: Picked and Packed non-posting, Shipped posting; default stage on Shipping preferences; enabled together with Advanced Shipping [S19]. Licence: Inventory Management module [S35].
- **Parcel labels**: Shipping Label Integration (UPS/FedEx) [S3], or Ship Central (packing, multi-carton, pallet building, carriers via ShipEngine; separate ShipEngine agreement and billing; included in SuiteSuccess editions) [S35].
- **Multiple ship-to on one order**: Multiple Shipping Routes [S3].
- **3PL / warehouse system**: integration (D-078); NetSuite Connector lists ShipStation among supported 3PLs [S30]. **WMS**: see M-11.
- One-way: Advanced Shipping - Costly (C-03).

### D-063 Customer returns and disposal

- Input: multi
- Feeding questions: O2C-9 (confirm); add O2C-4e.
- **Return Authorizations**: configure Return Authorizations (creates Return Authorizations account) [S1]; receive back to stock or a returns location; credit memo or refund.
- **Credit without physical return**: credit memo only; disposal via inventory adjustment / write-off (no feature).
- **Inspect then disposition**: Inventory Status for returned stock [S8]; cross-area D-011, D-066.
- **Marketplace returns**: per D-074.

---

### Adjacent: D-076 Processor payout reconciliation (Integration; fed by CSH)

- Input: single
- Feeding questions: CSH-2, CSH-3 (confirm); add CSH-4, CSH-6, O2C-6c.
- **Gross: order-level payments to Undeposited Funds, deposit per payout with fee line**: native records; no add-on.
- **Net settlement imported (connector or iPaaS)**: NetSuite Connector supports Amazon Seller/Vendor Central, Shopify, Walmart, others [S30]; licensed per connector under "Connectors for NetSuite" with a separate third-party agreement [S35].
- **NetSuite Pay as processor**: Versapay processes and reconciles card/ACH payments [S26]; requires N-04.
- Bank side: Automated Cash Application / match bank data [S27]; cross with N-07.

### Adjacent: D-077 A/R automation platform

- Input: single
- Feeding questions: O2C-10 (confirm); add O2C-4b, O2C-4c, O2C-4f.
- **None, all in NetSuite**: makes required N-03, N-07.
- **External platform**: integration (D-078); NetSuite holds invoice and payment; remittance in the platform.

---

### Proposed decisions (options)

- **N-01 Sales order approval** - single: No approval (Default Sales Order Status = Pending Fulfillment) / Approval required (= Pending Approval, Order Management subtab) [S18] / Approval + re-approval on edit (Require Re-approval on Edit of Sales Order; partially fulfilled orders unaffected) [S17]. Optional SuiteApprovals rules for sales orders [S18]. Licence: approvers can be View and Approve users (sales orders are in its list) [S35].
- **N-02 Commitment and allocation** - multi: Default commit on order (no feature) / Supply Allocation [S8] / Sales Channel Allocation [S8] / Order Reservations [S11] / Available to Promise [S8] / Automatic Location Assignment (Advanced Order Management) [S3] [S37]. Requires D-005 = yes for location choices. Licence: Advanced Order Management is paid per Oracle help mirror and a secondary source; 2020 secondary says free - unverified.
- **N-03 Invoice trigger and delivery** - multi: Invoice per fulfillment (Advanced Shipping) [S13] / Invoice in advance of fulfillment [S13] / Billing schedules (Advanced Billing; requires Sales Orders) [S4], licence Financial Management module [S35] / Invoice Groups [S4] / SuiteBilling (provisioned by Oracle; Employee Commissions must be off) [S25] / EDI 810 (D-075) / e-invoicing network (Electronic Invoicing SuiteApp free for one country, licence for more; Avalara certification needs Electronic Business extension + Avalara processing licences) [S29], or Electronic Document Processing cloud service (Avalara networks, 1,000 documents per unit) [S35].
- **N-04 Customer payment acceptance** - multi: None (checks/ACH to bank only) / Card via gateway (Credit Card Payments feature; merchant account; one processing profile per gateway, settlement currency and merchant account) [S5] [S36] / NetSuite Pay (Versapay; US/Canada; merchant application) [S26]; included in some editions from 15 Sep 2026 [S35] / Payment Link on invoices [S5] / Customer Center invoice pay [S35].
- **N-05 Deposits** - yesno: Required Deposit Workflow (percentage or amount) [S2]. Cross D-015 if deposits are prepayments for future delivery.
- **N-06 Gift cards / store credit** - single: Not offered / Gift Certificates feature in NetSuite [S9] / Held in commerce or subscription platform, NetSuite receives summarised liability (D-073). One-way: unverified.
- **N-07 Cash application and collections** - multi: Manual application / Automated Cash Application from bank lines [S27] / Dunning Letters SuiteApp (purchase through rep; requires Multi-Language; bundle 392827) [S28] / Payment Date Prediction (ML) [S6] / External AR platform (D-077).
- **N-08 Deductions and rebates** - multi: Manual credit memos and JEs / Rebate Management cloud service (customer, vendor, third-party, tiered, accruals and settlements; requires OneWorld or Subsidiary Management) [S35] / Third-party trade-promotion tool (integration). Licence: Rebate Management included in F&B editions, otherwise add-on [S35].
- **N-09 Procurement module** - yesno: Yes = Requisitions, Request for Quote, Purchase Contracts, Blanket Purchase Orders [S1], licensed Procurement cloud service [S35]; makes D-047 contract option and D-051 requisition option available. No = Purchase Requests only [S10].
- **N-10 Approval mechanism** - multi per record type: Default (supervisor then accounting, no Approval Routing) [S10] / Approval Routing feature with purchase and expense limits [S10] / SuiteFlow per-transaction approval preferences (Purchase Orders, Vendor Bills, Vendor Payments, Payment Runs, Requisitions, Blanket POs, Purchase Contracts, Invoices, Journal Entries) [S11] / NetSuite Approvals Workflow SuiteApp [S12] / SuiteApprovals SuiteApp [S18]. Requisition approvals need the Requisition Approval Workflow bundle [S11]. Licence: View and Approve 5-pack users cover vendor bills, vendor payments, sales orders, return authorizations, VRAs; not purchase orders [S35].
- **N-11 Bill intake** - single: Manual entry / Bill Capture (feature + Transaction Email Capture SuiteApp for email) [S7] [S24] / A/P platform pushes bills (D-071) / EDI 810 inbound (D-075). Licence for Bill Capture unverified.
- **N-12 Commissions** - single: None / Employee or Partner Commissions in NetSuite (conflicts with SuiteBilling) [S25] / External commission tool. Licence: unverified.

---

## 4. Cross-area touches

| From (slice) | To (other area) | Dependency | Source |
|---|---|---|---|
| D-005 Multi-Location Inventory | D-014, D-062 | MLI requires Advanced Receiving and Advanced Shipping. Answering D-005 = yes answers both feature enables. | [S8] |
| D-053 vendor consignment | D-009 Production, M-11 WMS | Consigned Inventory Management cannot coexist with the Assembly Items feature or WMS. | [S33] |
| D-057 3-way match | D-068 / ORG-2 Controls | Needs Approval Routing feature and SuiteFlow. | [S12] |
| D-057 | D-036/D-037 item build (L2) | Item-level variance accounts and Match Bill to Receipt on items. | [S15] [S24] |
| D-054 quality hold, D-063 returns | D-011 Inventory Status | Hold and returned-stock disposition use inventory statuses. | [S8] |
| D-056 landed cost | D-013 Costing, M-05 | Landed Cost feature; licensed with Inventory Management module. | [S8] [S35] |
| N-03 SuiteBilling | N-12 commissions, D-073 subscription state | SuiteBilling must be provisioned; Employee Commissions must be disabled; Projects need Consolidate Projects on Sales Transactions. | [S25] |
| D-015 Revenue Allocation | M-15 sandbox | Revenue Allocation add-on requires a Sandbox Environment cloud service. | [S35] |
| N-04, D-058 | M-01 edition | NetSuite Pay and Intelligent Payment Automation are included in several SuiteSuccess editions only if purchased or renewed on or after 15 Sep 2026. Advanced EBP and Ship Central are included in the editions read. | [S35] |
| N-08 Rebate Management | D-001 OneWorld | Requires OneWorld or Subsidiary Management. | [S35] |
| N-10 approvals | D-022 / M-14 licences | View and Approve users can approve vendor bills and sales orders, not purchase orders; Core Suite includes 5 Employee Center users. | [S35] |
| D-053 drop ship, intercompany | D-001, D-034 | OneWorld adds Automated Intercompany Drop Ship, Intercompany Cross-Subsidiary Fulfillment, Centralized Purchasing and Billing. | [S6] [S8] |
| D-074 marketplaces, D-076 | Integration / M-16 | NetSuite Connector is licensed per connector and needs a separate agreement with the third party. | [S35] [S30] |
| D-061 expenses, N-09 requisitions | D-022 licences | Employee Center counts; SuiteProcurement only usable by Employee Self-Serve users. | [S35] |
| Bill Capture (N-11), Automated Cash Application, Payment Date Prediction | AI usage | Service description introduces pooled AI Units; whether these features consume them is unverified. | [S35] |

---

## 5. Unverified (looked, could not confirm)

1. Whether Advanced Receiving can be disabled on an account without MLI (only community answers say yes) [S43].
2. Current licensing of Bill Capture now that the AP Automation cloud service is retired (a search snippet of the netsuite.com product page describes it as separately licensed; page could not be fetched) [S44].
3. Intelligent Payment Automation: Oracle FAQ says an AP Automation licence is required; the Sep 2026 service description lists IPA as its own cloud service included in editions [S22] [S35].
4. Advanced Order Management (Automatic Location Assignment) licence status [S37].
5. Advanced Pricing reversibility and licence [S31].
6. Gift Certificates and Consigned Inventory Management reversibility.
7. WMS licensing (not found in the service description read).
8. Native 1099 production in NetSuite [S46].
9. Corporate card expense feature name and setup.
10. Commission feature licensing.
11. Customer-side consignment / bill-and-hold native support.

---

## Sources

| Id | Title | URL | Tag |
|---|---|---|---|
| S1 | Enabling Basic Transaction Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111110344.html | Oracle docs |
| S2 | Enabling Sales Transaction Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111110455.html | Oracle docs |
| S3 | Enabling Shipping and Receiving Transaction Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111110711.html | Oracle docs |
| S4 | Enabling Billing Transaction Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111110839.html | Oracle docs |
| S5 | Enabling Payment Processing Transaction Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111110954.html | Oracle docs |
| S6 | Enable Advanced Accounting Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1110092646.html | Oracle docs |
| S7 | Enable Accounting Basic Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1110092533.html | Oracle docs |
| S8 | Enabling Inventory Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111112400.html | Oracle docs |
| S9 | Enabling Item Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1111112254.html | Oracle docs |
| S10 | Enabling Time and Expenses Features | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1112110701.html | Oracle docs |
| S11 | Approval Routing Accounting Preferences | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1391689.html | Oracle docs |
| S12 | Setting Up 3 Way Match Vendor Bill Approval | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4096250993.html | Oracle docs |
| S13 | Advanced Shipping | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1224089.html | Oracle docs |
| S14 | LIFO/FIFO Inventory Costing and Advanced Receiving | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2194541.html | Oracle docs |
| S15 | Vendor Bill Variances (and Vendor Bill Variance Journals) | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2371184.html | Oracle docs (read via search summary) |
| S16 | Credit Limit Preferences | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_4490498729.html | Oracle docs |
| S17 | Approving Sales Orders | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1218788.html | Oracle docs |
| S18 | Setting Up Prerequisites for Supported Record Types (SuiteApprovals); SuiteApprovals Terminology | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/bridgehead_1556694406.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_95074055417.html | Oracle docs (read via search summary) |
| S19 | Setting Up Pick, Pack, and Ship; Pick, Pack, and Ship Workflow Charts; Overview | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1230197.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1230081.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N1229796.html | Oracle docs (read via search summary) |
| S20 | Vendor Prepayments Overview | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156378588624.html | Oracle docs (read via search summary) |
| S21 | Payment Automation overview (HSBC end of support) | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1006083520.html | Oracle docs |
| S22 | Intelligent Payment Automation FAQ / Setup / Limitations | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0530033225.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0530033102.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_0530040548.html | Oracle docs (read via search summary) |
| S23 | Electronic Bank Payments; Setting Up Electronic Bank Payments | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N1585433.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_3831186542.html | Oracle docs (TOC fetched; licence text via search summary) |
| S24 | Prerequisites for Bill Capture | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_1021104845.html | Oracle docs |
| S25 | Enabling SuiteBilling Features; Setting the SuiteBilling Preferences | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1546981120.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1546981168.html | Oracle docs |
| S26 | NetSuite Pay Overview | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_5102539325.html | Oracle docs |
| S27 | Automated Cash Application | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1525962614.html | Oracle docs (read via search summary) |
| S28 | Enabling Dunning | https://oracle.hydrogen.sagittarius.connect.product.adaptavist.com/en/cloud/saas/netsuite/ns-online-help/section_4054122965.html | Oracle docs (mirror) |
| S29 | Electronic Invoicing SuiteApp Availability and License Client | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4615669958.html | Oracle docs (read via search summary) |
| S30 | NetSuite Connector Supported Storefronts and 3PLs | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_164723289789.html | Oracle docs (read via search summary) |
| S31 | Enabling Advanced Pricing | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_9154128713.html | Oracle docs |
| S32 | Promotions Overview | https://oracle.hydrogen.sagittarius.connect.product.adaptavist.com/en/cloud/saas/netsuite/ns-online-help/section_4737596252.html ; superseded notice quoted at https://archive.netsuiteprofessionals.com/t/406550/netsuite-emailed-some-accounts-announcing-that-standard-and- | Oracle docs (mirror) + Secondary |
| S33 | Consigned Inventory Management (limitations) | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_94502112.html | Oracle docs |
| S34 | Using Inbound Shipment Management | https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1490823161.html | Oracle docs (read via search summary) |
| S35 | Oracle NetSuite GBU Cloud Services Service Descriptions v091526, effective 15-Sep-2026 (Core Suite glossary; Inventory Management, Procurement, Financial Management, Revenue Management and Revenue Allocation, Rebate Management, Advanced EBP, Intelligent Payment Automation, NetSuite Pay, Ship Central, SuiteProcurement, Electronic Business Extension, Electronic Document Processing, Connectors for NetSuite, View and Approve users, SuiteSuccess Financials / Food & Beverage / Products editions; retired AP Automation and Payment Automation) | https://www.oracle.com/a/ocom/docs/netsuite-cloud-services-sd.pdf | Oracle service description |
| S36 | Setting Up Payment Processing Profiles in NetSuite | https://oracle.hydrogen.sagittarius.connect.product.adaptavist.com/en/cloud/saas/netsuite/ns-online-help/section_N1572588.html | Oracle docs (mirror) |
| S37 | Order Fulfillment Automation (Automatic Location Assignment) | https://oracle.hydrogen.sagittarius.connect.product.adaptavist.com/en/cloud/saas/netsuite/ns-online-help/chapter_4440622374.html ; https://technologyblog.rsmus.com/netsuite/automated-location-assignment-feature-netsuite | Oracle docs (mirror) + Secondary |
| S41 | EDI for NetSuite (no native EDI engine) | https://erpresearch.com/erp-add-ons/edi/for-netsuite | Secondary |
| S42 | Bill in Advance of Receipt preference | https://support.ramp.com/syncing-pos-and-matched-bills-troubleshooting-guide-netsuite-only | Secondary |
| S43 | Advanced Receiving toggle (community) | https://archive.netsuiteprofessionals.com/t/103267/hi-is-it-possible-to-remove-the-receive-phase-for-a-purchase | Secondary |
| S44 | What is NetSuite Bill Capture? (could not fetch; search snippet only) | https://www.netsuite.com/portal/products/erp/financial-management/finance-accounting/accounts-payable-software/invoice-management/invoice-capture.shtml | Secondary |
| S46 | 1099 third-party filing for NetSuite | https://track1099.com/info/netsuite_home ; https://www.houseblend.io/articles/netsuite-1099-reporting-readiness | Secondary |
