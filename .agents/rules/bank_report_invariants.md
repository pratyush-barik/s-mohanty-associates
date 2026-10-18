# Bank Report UI & Parameter Invariants

### 0. Protected Bank Formats (DO NOT TOUCH)
- The following 4 bank formats are managed by a separate team and must NEVER be modified:
  1. `Bank of Baroda`
  2. `UCO Bank`
  3. `Bank of Maharashtra`
  4. `Bank of India`

### 1. Mandatory & Uniform Title Card (`BankReportTitleCard`)
- Every single bank report builder (all custom bank builders AND delegating builders via `BankReportBuilder.tsx`) MUST render `BankReportTitleCard`.
- It must be placed directly beneath `ActiveConfigBanner` and display:
  - `bankName`: Bank / Institution name (e.g. `Shriram Finance Ltd`, `Purple Finance Ltd`)
  - `subclass`: Format subclass or `'Standard Format'`
  - `title`: `'Valuation Report Builder'`
  - `description`: Bank-specific format description
  - `earliestVisit`: Calculated via `getEarliestFieldVisit(bucketImages, prefill)`
  - `projectCode`: Current project code
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

