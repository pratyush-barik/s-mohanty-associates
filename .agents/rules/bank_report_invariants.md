# Bank Report UI & Parameter Invariants

### 1. Mandatory & Universal `<BankReportHeader />`
- Every single bank report builder (all 44 custom bank builders AND delegating builders via `BankReportBuilder.tsx`) MUST adopt the universal `<BankReportHeader />` component from `BaseBankReportComponents.tsx`:
  1. `<BankReportHeader />` replaces legacy separate `ActiveConfigBanner` + `BankReportTitleCard` + inspection date sync banners.
  2. Renders unified Active Configuration banner with Change Parameters button (`onResetWizard`).
  3. Displays Bank name, subclass badge, description, Project Code, and Field Visit Date Badge.
  4. Houses integrated "Sync Inspection Date" action whenever site inspection visits are detected.
  5. Rework Banner (if `fields.reworkNotes && status === 'REPORT_DRAFTING'`)
  6. Toast Message Banner (if `message` is present)
  7. Section 1..N (Unbroken continuous sequence)
- **STRICT NO AD-HOC HEADERS RULE**: Never render any ad-hoc secondary header card, standalone box, or custom `<h2>... Valuation Report</h2>` block above Section 1. All report metadata (`Ref. No`, `Report Date`, `Date of Valuation`) must reside cleanly inside Section 1.
- **BANK-ONLY INVARIANT**: This header component is EXCLUSIVELY for Bank & FIS report builders. Never add `BankReportHeader` to General, IBBI-IVS, or Income Tax report builders.
- Title cards must be identical in visual hierarchy, typography, amber pill styling, and badge presentation across every single builder.

### 2. Section Navigator (Navbar) Invariants
- `FloatingNavigator` pills MUST NOT contain any numbers, numbering ranges, Roman numerals, or letter prefixes.
- Strip all leading numbers, letters, and Roman numerals (e.g. `1. `, `6-8. `, `A. `, `VII & VIII. `, `Points 1 - 4`).
- Pills must display clean, human-readable titles (e.g. `Basic Details`, `Market Comparison & Remarks`, `Documents`, `Maps`, `Photographs`).
- Pills must never render badge numbering circles.

### 3. Continuous Sequential Section Numbering (`1..N`)
- Form `<Section>` titles and `navSections` titles must match 1-to-1 identically.
- Eliminate arbitrary numbering prefixes in form section titles so they mirror the navbar.
- **Unbroken Continuity**: Numbering must form an unbroken sequence from `number={1}` up through the final annexure section `number={N}`.
- **Attachment Sections**: Pass explicit continuous `sectionNumber` to attachment sections:
  - `BaseDocumentsSection`: `sectionNumber={N-2}` (or sequential index)
  - `BaseMapsSection`: `sectionNumber={N-1}`
  - `BasePhotographsSection`: `sectionNumber={N}`
- **No Duplicate Attributes**: If an attachment section uses `withoutSectionWrapper={true}` inside an outer `<Section number={N}>`, do NOT pass duplicate `sectionNumber` or `title` to the inner component.
- Attachment components must always be self-closing (`<BaseDocumentsSection ... />`).

### 4. Dedicated Bank Builder & PDF Architecture
- Each bank format implemented must establish:
  1. Dedicated UI builder in `src/app/portal/reports/[projectId]/banks/<bank-dir>/`
  2. Dedicated PDF Renderer in `src/lib/banks/pdf-<bank-id>-renderer.ts` extending `PDFBankRenderer`
  3. Full attachment suites: Documents gallery, Location/Mouza/Sketch maps with GPS coordinates, and Photogrid
  4. Update tracker files `REMAINING_UNSTARTED_BANKS.md` and `BANK_REPORT_PROGRESS.md`
  5. Verify `npx tsc --noEmit` passes with 0 errors before committing and pushing.

### 5. Active Configuration Banner Truthfulness
- `ActiveConfigBanner` must strictly reflect only the user's actual selection path from the Report Setup Wizard:
  1. Client Type (`ORGANISATION / BANK` or `INDIVIDUAL`)
  2. Category (`BANK & FIS`, `NBFC / PRIVATE LENDING`, etc.)
  3. Bank / Organisation Name (e.g. `YES BANK`, `TATA CAPITAL LTD`)
  4. Sub-template ONLY IF explicitly selected in the wizard (e.g. `SME-BLG`, `HL-LAP`, `Land & Building`).
- NEVER inject `'Standard'`, `'Valuation Report'`, `'Default'`, or any hardcoded fallback as a subclass badge.

### 6. Strict Status Tracking & Anti-Hallucination Invariant (NO Premature Completion)
- **CRITICAL ANTI-HALLUCINATION RULE**: When a bank builder UI and PDF renderer are created, its status in `BANK_REPORT_PROGRESS.md` MUST ALWAYS be marked:
  - `Base Structure: ✅ Created Base`
  - `Status: 🔨 In Progress`
- It MUST be placed under **Section 2: Base Structure Completed (`✅ Created Base` — Builder In Progress)**.
- **NEVER mark any bank as `✅ Completed`** unless the user explicitly inspects it and specifically instructs in chat to mark it completed.
- Only the 15 original baseline templates are allowed to be in Section 1 (`✅ Completed`).
- Conflating scaffold/base creation with completion is strictly forbidden.

### 7. Layout, Styling & Valuation Memory Standards
- **Color Palette & Accents**:
  - Primary accent: Blue/Indigo system (`blue-600`, `blue-700`) for headers, borders, and main CTA actions.
  - Valuation highlights: Amber/Orange badges (`amber-100`, `amber-800`, `amber-500`) for Title Card tags and status indicators.
  - Value summary cards: Emerald/Green (`emerald-50`, `emerald-700`, `emerald-600`) for Final Realizable / Market Value callouts.
- **Auto-Calculations**:
  - Always wire up dynamic calculations in real-time (`useEffect` or pure memoized derived values):
    - Land Value = Land Area × Land Rate
    - Built-up Area (BUA) Construction Value = Total BUA × Construction Rate
    - Total Market Value = Land Value + Construction Value + Extra Amenities
    - Distress / Forced Sale Value (QSV) = Total Market Value × (typically 80%)
    - Conservative Value = Total Market Value × (typically 90%)
    - Insurable Value = Construction Cost / Depreciated Structure Value
  - All calculated monetary values must display in Indian numbering format (`1,00,000` / `Lakhs` / `Crores`) with matching words representation.
- **Attachment Suites**:
  - `BaseDocumentsSection`: Document gallery with upload, preview, and verification checklist.
  - `BaseMapsSection`: Route map, layout plan, mouza map, and site sketch with GPS coordinate tags.
  - `BasePhotographsSection`: Photo grid with category bucket picker (`Front Elevation`, `Interior`, `Surrounding Road`, `Boundary`, etc.) and caption inputs.

### 8. Zero Hardcoded Mock Client Data & Nullable Fields Invariant
- **CRITICAL DISTINCTION: Client Data vs. Structural Defaults**:
  - **1. CASE-SPECIFIC CLIENT DATA (MUST BE NULLABLE / DEFAULT STRICTLY TO `''` OR DYNAMIC PREFILL)**:
    - **Entity Names**: Applicant, Borrower, Co-Applicant, Owner, Builder, Seller, Purchaser, Person Met at site, Visiting Engineer, Inspected By. Strictly default to `p.applicantName || p.contactName || ''` or `''`. NEVER hardcode sample names (e.g. `'C&B Ecogen Pvt Ltd'`, `'Sanjay Kumar Roy'`, `'Deepak Bhoi'`, `'Mr. Mantu Das'`).
    - **Contact Numbers**: Customer phone or mobile numbers. Fallback strictly to `p.contactPhone || ''`. NEVER hardcode sample personal numbers.
    - **Case Identifiers**: Application No, Loan No, Deal No, Khata No, Plot No, Dag No, Patta No, Survey No, Electric Meter No. Leave blank (`''`) for field engineer entry.
    - **Specific Dates**: Never hardcode static visit, inspection, or report dates (e.g. `'27.11.2024'`, `'10.08.2026'`, `'18/06/2026'`). Must dynamically derive from `earliestVisit ? formatReportDate(earliestVisit.date) : ''` or empty string.
    - **Specific Landmarks & Distances**: Specific railway station distances, bus stop distances, city center distances, and case landmarks (e.g. `'Near Gayatri Enclave'`, `'1Km (Patia Railway station)'`). Fallback strictly to `p.nearestLandmark || ''` or `''`.
    - **Valuation Figures & Areas**: Plot areas, BUA, carpet areas, land rates, construction rates, market values, and distress values must NEVER have static sample values (e.g. `'1159'`, `'4007'`, `'8466080'`). Leave blank (`''` or `0`) for dynamic auto-calculation.
    - **Boundaries at Site**: Site boundaries (`boundaryEastSite`, `boundaryWestSite`, etc.) must default to dynamic prefill `p.boundaryEast || ''` or `''`, never static descriptions like `'Others building'`, `'Road'`.
  - **2. ACCEPTABLE DEFAULTS (CAN HAVE CATEGORICAL DEFAULTS)**:
    - **Qualitative & Structural Specs**: Universal ratings (`'Good'`, `'Average'`, `'Satisfactory'`), structural types (`'RCC'`, `'RCC Framed Structure'`), tenure (`'Freehold'`), occupancy (`'Occupied'`, `'Vacant'`), locality classes (`'Middle Class'`, `'Developed'`), and Boolean options (`'Yes'`, `'No'`).
    - **Non-applicable Placeholders**: Universal `'NA'`, `'N.A.'`, `'Nil'` for unapplicable sub-clauses.
    - **Authorized Agency Sign-off Info**: Valuer agency firm details (M/s S. Mohanty Associates, Er. Satyajit Mohanty, official office landline `06742381145` / mobile `9937023855`, valuer code `SMA/11-25/01`, official email `Smohantyassociates@gmail.com`) are agency sign-offs, NOT mock customer data.
- **Type-Safe Prefill Reading**:
  - `BankReportBuilderProps['prefill']` has limited base typing. Always cast `prefill` safely in state initializers:
    ```typescript
    const p = (prefill || {}) as any;
    ```
- **PDF Renderer Fallbacks**:
  - `this.getF(key, defaultVal)` in bank PDF renderers must default to empty string `''` for all client-specific data, never hardcoded customer names, static dates, or sample financial figures.

### 9. Universal Base Styling & Rendered Justified Alignment Invariant

#### 1. Universal Base Styling (Single Source of Truth)
- **STRICT PROHIBITION OF LOCAL STYLING DEFINITIONS**: Bank builders must NEVER declare local `const inputCls = ...`, bespoke select classes, or custom section container components inside builder files.
- **Universal Import**: All inputs, selects, textareas, labels, dates, and section cards must be imported directly from `BaseBankReportComponents.tsx`:
  - `inputCls`, `selectCls`, `textareaCls`
  - `<Section>`, `<Field>`, `<BaseDateInput>`
  - `<BankReportHeader />`, `<FloatingNavigator>`, `<ReportActionBar>`
- Typography, font size hierarchy (`text-sm` inputs, `text-xs` uppercase labels), borders (`border-[#dee2e6]`), and focus rings (`focus:ring-accent-500/30`) are 100% universal across all bank report builders.

#### 2. Rendered Justified Alignment
- **Mandatory Justification for Rendered Text**: All continuous entities in rendered valuation outputs MUST have justified text alignment:
  1. **PDF Renderers**: `PDFBankRenderer.drawWrappedTextAt(...)` defaults `align: 'justify'` on all multi-line text blocks, remarks, declarations, methodology statements, and notes.
  2. **Rendered UI Blocks**: All rendered declaration items, Model Code of Conduct clauses, valuation certificate statements, and remarks display blocks must use `text-justify leading-relaxed` (e.g., via `renderedDeclarationPointCls`, `renderedParagraphCls`, `renderedBoxedContentCls`).
- **Interactive Textareas**: Raw `<textarea>` input elements retain standard left-aligned typing to avoid caret jumping during text entry.

### 10. Universal Enclosure Order Invariant (Documents → Maps → Photographs → Annexures)
- **Absolute Universal Sequence Across ALL Builders**:
  Every report builder (General Reports, all 60+ Bank Reports including Standalone SBI Flat and SBI Land & Building, IBBI, and Income Tax) MUST strictly follow this exact enclosure sequence:
  $$\mathbf{Documents} \longrightarrow \mathbf{Maps} \longrightarrow \mathbf{Photographs} \longrightarrow \mathbf{Annexures}$$
- **NO STANDALONE BANK EXCEPTIONS**: There are no standalone banks or custom template exceptions. All bank builders and renderers must follow this exact format for documents, maps, and photographs.
- **Form UI & Navbar Order**:
  1. Documents Section (`BaseDocumentsSection`) — attached title deeds, tax receipts, RTCs, etc.
  2. Maps Section (`BaseMapsSection`) — Google Satellite Map, Mouza Map, Sketch Map, Cadastral Map.
  3. Photographs Section (`BasePhotographsSection`) — site photos with 2-column layout and bucket picker.
  4. Annexures Section (`BaseAnnexureSection`) — Excel/spreadsheet attachments.
  Both the form `<Section>` sequence and `navSections` must match this order identically.
- **PDF Renderer Execution Order**:
  The PDF renderer enclosure drawing method (`drawEnclosures()`) must invoke attachment functions in the exact order:
  1. `this.drawDocumentsAttachment()` / Documents
  2. `this.drawMapsAttachment()` / Maps
  3. `this.drawPhotographsAttachment()` / Photographs (starting on a fresh page with bold header banner)
  4. `this.drawAnnexuresAttachment()` / Annexures (Excel data tables)

### 11. Google Satellite Map Card Layout Invariant
- **Strict Separation of Header and Map Embed**:
  In `MapImageCategoryCard` and any custom Google Satellite Map card, `{headerExtra}` MUST NEVER be placed inside the flex header container row alongside the `+ Add` button.
- **Card Structure Contract**:
  1. **Header Row** (`<div className="px-3 py-2 flex items-center justify-between">`):
     - Left: Category icon, category title (e.g. `1. Google Satellite Map`), and uploaded count badge.
     - Right: `+ Add` upload button (`<input type="file" ... />`).
  2. **Divider Line**: `border-b border-slate-100`.
  3. **Full-Width Header Extra Container**:
     - `{headerExtra && <div className="w-full border-b border-slate-100 bg-slate-50/50 p-2.5 space-y-2">{headerExtra}</div>}`
     - Spans 100% full-width across the card.
     - Houses live coordinates pill, origin address badge, manual coordinate overrides, and the interactive Google Satellite iframe embed (`w-full h-44 rounded-lg border`).
  4. **Image Upload Grid**:
     - Rendered beneath `{headerExtra}` with full drag-and-drop reordering, zoom preview, and deletion actions.

### 12. Valuation Headings & Standard Field Naming
- **Clean Valuation Titles**:
  Valuation summary cards and PDF table headers must use standard clean titles:
  - `VALUATION - APARTMENT/FLAT`
  - `VALUATION - LAND`
  - `VALUATION - BUILDING`
  - Never append suffixes like `(After Depreciation)` or ad-hoc parenthetical notes.
- **Apartment Valuation Basis**:
  Apartment valuation cards must include a dedicated input field for `Recommended Rate and basis for recommendation` defaulting safely to `'NA'`.

