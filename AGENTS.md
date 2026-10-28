<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation warnings.

## Project: S Mohanty Associates - Property Valuation Management

### Key Concepts
- **Public Enquiries** ≠ **Service Requests** (Cases)
  - Public Enquiries: website contact form / direct email doubt messages → `/portal/enquiries`
  - Service Requests: client requests for valuation services → `/portal/requests`
- `Enquiry` model tracks enquiries with collision-proof `ticketNumber` (`SMA-YYYY-XXXXXX`), `source` (`WEBSITE` / `EMAIL`), `status` (`NEW` / `WAITING_FOR_CLIENT` / `IN_PROGRESS` / `CLOSED`)
- `ServiceRequest` model tracks client intake requests, linked to `Project` via `serviceRequestId` (unique)
- `Project` model linked to `Enquiry` via `enquiryId` named relation "ProjectEnquiry", has `source` field (`WEBSITE` for account holders, `EXTERNAL` for manual bank/guest cases)
- `ProjectMessage` model stores in-portal chat messages for registered account holders; for `EXTERNAL` cases, chat input is strictly disabled with a red warning badge. Chat messages never auto-dispatch outbound emails.
- `fetch-emails/route.ts` strictly creates/updates `Enquiry` tickets from domain email (`info@smohantyassociates.com`). Inbound emails NEVER auto-create projects or service requests.
- `finalizeReport` attaches PDF directly to email from `smohantyassociates@gmail.com` (no download link button) for external bank cases, and sends portal dashboard notifications from `report@smohantyassociates.com` for website clients.
- `Prisma db push` is used (no migrations directory) — run `npx prisma db push` after schema changes
- `npx prisma generate` must be run after schema changes for Prisma Client to update

### Schema Relationships
- Enquiry → Project (1:1 via `projectId` @unique on Enquiry, `enquiry` relation "ProjectEnquiry" on Project)
- Enquiry → ServiceRequest (1:1 via `serviceRequestId` @unique on Enquiry, `enquiry` relation on ServiceRequest)
- ServiceRequest → Project (1:1 via `serviceRequestId` @unique on Project)
- Project → ProjectMessage (1:N, messages are in-portal chat for owner/manager and registered client)
- ProjectMessage → Document (1:N, attachments linked to messages via `messageId`)
- Project status flow: PENDING_REVIEW → INSPECTION_IN_PROGRESS → MANAGER_REVIEW → COMPLETED
- Enquiry status flow: NEW → WAITING_FOR_CLIENT → IN_PROGRESS → CLOSED (auto-close when report finalized)

### Server Actions (Project Communication & Delivery)
- `sendProjectMessage(projectId, content, attachmentDocIds[])` — in-portal chat message for registered clients. External projects lock chat input.
- `uploadProjectMessageAttachment(projectId, formData)` — uploads file to Supabase Storage (`enquiry-files` bucket), creates `Document` record linked to project
- `acceptServiceRequest(requestId, overrideManagerId?)` — sets `Project.source` to `WEBSITE` if ServiceRequest has `clientId`, else `EXTERNAL`
- `createManualCase(formData)` — creates external bank/guest case with `Project.source = 'EXTERNAL'`, sequential month-scoped projectCode (`SMA-YYYY/MM-NNNN`), and stores external email in `guestEmail`
- `finalizeReport(projectId, pdfUrl)` — attaches finalized PDF report directly to email from `smohantyassociates@gmail.com` for external cases, and sends portal link notification from `report@smohantyassociates.com` for website clients. Evidentiary photos (`propertyImages: []`) are permanently retained in database.

### File Structure
- Server actions: `src/app/actions/project.ts`, `src/app/actions/service.ts`, `src/app/actions/enquiry.ts`
- Portal pages: `src/app/portal/` with role-based dashboards (`owner/`, `manager/`, `field-agent/`, `report-agent/`)
- Key components: `ChatInterface.tsx` (client-side enquiry chat), `ProjectChat.tsx` (employee-side project chat), `RequestsDashboard.tsx`, `EnquiryList.tsx`, `BuilderSelector.tsx` (dynamic router), and `banks/` directory (60+ bank builders)
- **All report builders are lazy-loaded**: `GeneralReportBuilder.tsx`, `IBBIReportBuilder.tsx`, `IncomeTaxReportBuilder.tsx`, `BankReportBuilder.tsx`, and all bank-specific builders use `dynamic()` imports in `BuilderSelector.tsx`. Do NOT convert these back to static `import` statements — this would bloat the client bundle and exceed Vercel free tier storage limits.

### Strategy & Timeline Directive (October – November 2026)
- **Phase 1: Rapid Scaffolding of All 60+ Bank Basic Structures (Priority Target: Before Nov 2nd)**:
  - Antigravity external model support ends on Nov 2nd. To maximize time and efficiency across models and agents, **our immediate goal is to rapidly scaffold the basic UI builder component and dedicated PDF renderer for all remaining banks from their sample reports**.
  - Each bank scaffold must establish: (1) Correct bank/subtemplate ID matching sample reports, (2) UI sections layout, (3) Table structure & valuation arithmetic, (4) Dedicated PDF renderer with inherited attachment suites (Photographs, Device-uploaded Maps, Documents), and (5) Registration in `BuilderSelector.tsx`.
- **Phase 2: Deep Refinement, Edge Cases & Custom Perfection**:
  - Once all bank basic structures are established in the codebase, we apply targeted fixes, bank-specific quirks, affirmations, code of conduct clauses, and fine-grained visual alignment to perfection.

### Core Guideline: Maximize Base Bank Architecture Reuse
- **UI Components**: Always refer to and reuse building blocks from `src/app/portal/reports/[projectId]/banks/BaseBankReportComponents.tsx` (`BaseBankReportLayout`, `BaseLocationSection`, `BasePropertySection`, `BaseValuationSection`, `BaseBoundarySection`, `BasePhotographsSection`, `BaseMapsSection`, `BaseAnnexureSection`, `Field`, `Section`, `SubSection`, `FloatingNavigator`).
- **Fields & Types**: Inherit from `src/lib/bank-fields.ts` (`BaseReportFields`, `BankConfig`).
- **PDF Generation**: Extend `PDFBankRenderer` from `src/lib/pdf-bank-renderer.ts`, inheriting table structures, image section boxes, photo grids, coordinate math, and multi-page flows. Override only bank-specific delta methods.

### Typography & Table Font Size Standards (MS Word Alignment)
- **Table Font Sizes**:
  - `FONT_SIZE_TABLE` = 12pt (standard: for 2–3 column property grids & comfortable widths)
  - `FONT_SIZE_TABLE_COMPACT` = 10pt (compact: for wide multi-column tables with ≥4 columns, floor valuation grids, and Excel Annexures)
- **Constants by Report Type**:
  - General: `FONT_SIZE_TABLE_GENERAL = 12`, `FONT_SIZE_TABLE_GENERAL_COMPACT = 10` in `src/lib/pdf-general-renderer.ts`
  - Income Tax: `FONT_SIZE_TABLE_IT = 12`, `FONT_SIZE_TABLE_IT_COMPACT = 10` in `src/lib/pdf-it-renderer.ts`
  - IBBI: `FONT_SIZE_TABLE_IBBI = 12`, `FONT_SIZE_TABLE_IBBI_COMPACT = 10` in `src/lib/pdf-ibbi-renderer.ts`
  - Bank Reports: `FONT_SIZE_TABLE_BANK = 12`, `FONT_SIZE_TABLE_BANK_COMPACT = 10` in `src/lib/pdf-bank-renderer.ts` (inherited by all 60+ bank-specific builders).
- **Uniformity Invariant**: Never mix multiple font sizes within the same table. All column headers (bold) and cell data (regular) in a given table must strictly share the chosen font size (either 12pt or 10pt). Section headers remain untouched at `14pt` (`FONT_SIZE_HEADER`).

---

## 🏦 Bank Report UI & Parameter Invariants (MANDATORY FOR ALL `banks/`)

All bank report builders in `src/app/portal/reports/[projectId]/banks/` and their corresponding PDF renderers in `src/lib/banks/` MUST strictly comply with the invariants defined in `.agents/rules/bank_report_invariants.md`:

### 1. Mandatory & Universal `<BankReportHeader />`
- Every single bank report builder (all custom bank builders AND delegating builders via `BankReportBuilder.tsx`) MUST adopt the universal `<BankReportHeader />` component from `BaseBankReportComponents.tsx`.
- **STRICT NO AD-HOC HEADERS RULE**: Never render any ad-hoc secondary header card, standalone box, or custom `<h2>... Valuation Report</h2>` block above Section 1. All report metadata (`Ref. No`, `Report Date`, `Date of Valuation`) must reside cleanly inside Section 1.
- **BANK-ONLY INVARIANT**: This header component is EXCLUSIVELY for Bank & FIS report builders. Never add `BankReportHeader` to General, IBBI-IVS, or Income Tax report builders.

### 2. Section Navigator (Navbar) Invariants
- `FloatingNavigator` pills MUST NOT contain any numbers, numbering ranges, Roman numerals, or letter prefixes (strip `1. `, `6-8. `, `A. `, `VII & VIII. `).
- Pills must display clean, human-readable titles (e.g. `Basic Details`, `Documents`, `Maps`, `Photographs`). Never render badge numbering circles.

### 3. Continuous Sequential Section Numbering (`1..N`)
- Form `<Section>` titles and `navSections` titles must match 1-to-1 identically.
- Numbering must form an unbroken sequence from `number={1}` through the final annexure section `number={N}`.
- Explicit continuous sequential numbers must be passed to attachment sections:
  - `BaseDocumentsSection`: `sectionNumber={N-2}`
  - `BaseMapsSection`: `sectionNumber={N-1}`
  - `BasePhotographsSection`: `sectionNumber={N}`
- Attachment components must always be self-closing without duplicate wrapper attributes.

### 4. Dedicated Bank Builder & PDF Architecture
- Each bank format implemented must establish:
  1. Dedicated UI builder in `src/app/portal/reports/[projectId]/banks/<bank-dir>/`
  2. Dedicated PDF Renderer in `src/lib/banks/pdf-<bank-id>-renderer.ts` extending `PDFBankRenderer`
  3. Full attachment suites: Documents gallery, Location/Mouza/Sketch maps with GPS coordinates, and Photogrid
  4. Tracked in `BANK_REPORT_PROGRESS.md`
  5. Always verify `npx tsc --noEmit` passes with 0 errors before staging and committing.

### 5. Active Configuration Banner Truthfulness
- `ActiveConfigBanner` must strictly reflect only the user's actual selection path from the Report Setup Wizard (Client Type, Category, Bank Name, and sub-template ONLY IF explicitly selected).
- NEVER inject `'Standard'`, `'Valuation Report'`, `'Default'`, or any hardcoded fallback as a subclass badge.

### 6. Strict Status Tracking & Anti-Hallucination Invariant (NO Premature Completion)
- When a bank builder UI and PDF renderer are created, its status in `BANK_REPORT_PROGRESS.md` MUST ALWAYS be marked:
  - `Base Structure: ✅ Created Base`
  - `Status: 🔨 In Progress` (under Section 2).
- **NEVER mark any bank as `✅ Completed`** unless the user explicitly inspects it and specifically instructs in chat to mark it completed. Only the 15 original baseline templates are allowed to be in Section 1 (`✅ Completed`).

### 7. Layout, Styling & Valuation Memory Standards
- Color Accents: Blue/Indigo primary headers, Amber/Orange badges, Emerald for final values.
- Auto-Calculations: Wire up dynamic real-time calculations (Land = Area × Rate, BUA = Area × Rate, Total = Land + BUA + Amenities, Forced/Distress = 75-80%, Insurable, Conservative).
- Indian numbering system (`1,00,000` / `Lakhs` / `Crores`) with words representation via `numberToWords`.

### 8. Zero Hardcoded Mock Client Data & Nullable Fields Invariant
- **Case-Specific Client Data**: Entity names (applicant, owner, builder, etc.), contact numbers, case identifiers (Khata, Plot, Loan No), specific dates, landmarks, site boundaries, and valuation figures MUST default strictly to `''` or dynamic prefill (`p.applicantName || ''`). NEVER hardcode sample customer data.
- **Acceptable Defaults**: Structural classifications, qualitative ratings, tenure, and official agency sign-off details (M/s S. Mohanty Associates, Er. Satyajit Mohanty) are valid defaults.
- Type-Safe Prefill Reading: `const p = (prefill || {}) as any;`.

### 9. Universal Base Styling & Rendered Justified Alignment Invariant
- Single source of truth: import all inputs, selects, textareas, and section wrappers directly from `BaseBankReportComponents.tsx`. Do not redeclare local classes.
- Mandatory justified alignment (`text-justify leading-relaxed` and `align: 'justify'`) on all rendered continuous text entities, clauses, certificates, and PDF multi-line blocks. Raw textareas retain standard left-alignment.

### 10. Universal Enclosure Order Invariant (Documents → Maps → Photographs → Annexures)
- **Universal Across All Builders**: Every report builder (General, all 60+ Banks including Standalone SBI Flat and SBI Land & Building, IBBI, Income Tax) MUST strictly follow this exact enclosure order in both Web UI and PDF:
  $$\mathbf{Documents} \longrightarrow \mathbf{Maps} \longrightarrow \mathbf{Photographs} \longrightarrow \mathbf{Annexures}$$
- **NO STANDALONE BANK EXCEPTIONS**: There are no standalone banks or custom template exceptions. All banks follow this exact format for docs, maps, and photos.
- **Form UI Order**: Form `<Section>` and `FloatingNavigator` `navSections` must place Documents before Maps, Maps before Photographs, and Photographs before Annexures.
- **PDF Execution Order**: `drawEnclosures()` must execute `drawDocumentsAttachment()` first, then `drawMapsAttachment()`, then `drawPhotographsAttachment()` (fresh page with bold uppercase title banner), followed by Annexures.

### 11. Google Satellite Map Card Layout Invariant
- In `MapImageCategoryCard` and any satellite map card, `{headerExtra}` MUST NEVER be nested inside the header flex container row alongside the `+ Add` button.
- Header row contains only the category title/icon on the left and the `+ Add` button on the right.
- `{headerExtra}` must render 100% full-width directly below the header divider (`border-b border-slate-100`).

### 12. Valuation Headings & Standard Field Naming
- Bank report valuation headings must use standard clean titles: `VALUATION - APARTMENT/FLAT`, `VALUATION - LAND`, `VALUATION - BUILDING`. Never append suffixes like `(After Depreciation)`.
- Apartment valuation cards must include a field for `Recommended Rate and basis for recommendation` with `'NA'` fallback.

### 13. Git Commit Conventions (Per `.agents/rules/commit_convention.md`)
- PDF Renderer Changes: `feat (<bank_name>-pdf): <message>`
- Web UI (Report Draft) Changes: `feat (<bank_name>-report): <message>`

### 14. Universal Reference Standardization & Engine Lockdown Invariants
1. **Universal Project Code Format (`SMA-YYYY/MM-NNNN`)**: Strictly month-scoped sequential format (`SMA-YYYY/MM-NNNN`). Resets to `0001` on the 1st of every month automatically.
2. **Canonical State Key `refNo` Exclusively**: Every report builder strictly stores and accesses the firm reference number under the single canonical key `refNo`. Redundant keys (`caseRefNo`, `proposalNo`, `referenceNo`, `fileRefNo`) are purged.
3. **Firm Reference Immutability**: All firm reference inputs are permanently locked (`disabled={true} readOnly={true}`) with standard placeholder `"SMA-YYYY/MM-NNNN"`. Valuers cannot edit the firm reference number.
4. **Zero Bank Prefixes & Dummy Constants**: Never concatenate bank prefixes (`SMA/`, `SMA/AYE/`, `SMA/CHOLA/`, `PRPL-`, `SAM/`) or hardcode dummy references (`BOB/02/...`). Pure firm project code is used everywhere.
5. **Income Tax Reference Auto-Generation**: Income Tax valuation reports auto-generate the statutory format `SMA/V-01/IT/BBSR-NNNN/YY` in `refNo`, resetting to `0001` on January 1st every year, hardcoded to jurisdiction circle `BBSR`, and locked in the UI.
6. **Normalized Single-Pass State Initialization**: State initialization in custom builders strictly follows the single-pass spread pattern `const d = { ...(rawInitialFields || {}), refNo: rawInitialFields?.refNo || projectCode || '' };`. Imperative mutations (`if (!d.refNo) d.refNo = ...`) and secondary `useEffect` render cycles for `refNo` are prohibited.
7. **URL & PDF Download Filename Safety**: Project codes in routing are URL-encoded (`encodeURIComponent`). All PDF download filenames are sanitized via `sanitizeFilenameCode(...)` (`/` $\rightarrow$ `_`).




