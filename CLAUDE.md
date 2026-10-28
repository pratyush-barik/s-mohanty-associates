## Strategic Roadmap (October – November 2026)
- **Immediate Goal (Phase 1 — Target: Before Nov 2nd)**:
  - External model support in Antigravity ends on Nov 2nd. Therefore, **prioritize creating the basic working structure and dedicated PDF renderer for ALL remaining bank templates from their sample reports**.
  - Speed and complete architectural coverage are vital so that no bank is left behind.
- **Refinement Goal (Phase 2)**:
  - Once every bank has its scaffolded UI builder and PDF renderer wired up, iterate bank-by-bank to apply micro-fixes, precise code-of-conduct clauses, justification letters, and exact visual alignment.

## Core Developer Directives

### 1. Base Bank Reuse
- For every bank report builder project, always refer to and maximize reuse from Base Bank components (`src/app/portal/reports/[projectId]/banks/BaseBankReportComponents.tsx`), fields (`src/lib/bank-fields.ts`), and PDF renderer (`src/lib/pdf-bank-renderer.ts`). Avoid duplicating standard sections from scratch.

### 2. Universal Enclosure Order Invariant
- Every report builder (General Reports, all 60+ Bank Reports including Standalone SBI Flat and SBI Land & Building, IBBI, Income Tax) MUST strictly follow this exact enclosure order in both Web UI and PDF output:
  $$\mathbf{Documents} \longrightarrow \mathbf{Maps} \longrightarrow \mathbf{Photographs} \longrightarrow \mathbf{Annexures}$$
- **NO STANDALONE BANK EXCEPTIONS**: There are no standalone banks or custom template exceptions. All banks follow this exact format for docs, maps, and photos.
- UI: Section numbering & `navSections` must place Documents before Maps, Maps before Photographs, and Photographs before Annexures.
- PDF: `drawEnclosures()` must execute Documents first, Maps second, Photographs third (fresh page), and Annexures last.

### 3. Google Satellite Map Card Layout Invariant
- In `MapImageCategoryCard` and any satellite map card, `{headerExtra}` MUST NOT be nested inside the header flex container row alongside the `+ Add` button.
- Header row contains only the category title/icon on the left and `+ Add` button on the right.
- `{headerExtra}` must render 100% full-width directly below the header divider (`border-b border-slate-100`).

### 4. Valuation Headings & Remarks Styling Standards
- Bank report valuation headings must use clean titles without depreciation suffixes: `VALUATION - APARTMENT/FLAT`, `VALUATION - LAND`, `VALUATION - BUILDING`.
- Apartment valuation cards must include a field for `Recommended Rate and basis for recommendation` with `'NA'` fallback.
- In General Reports PDF renderer, the Remarks section must be drawn with a clean section title only (no colored background box or fill), and body text underneath in non-bold justified format.

### 5. Performance Directive
- **All report builders MUST use `dynamic()` imports** in `BuilderSelector.tsx`. Never convert them back to static `import` statements — doing so will bloat the Vercel serverless function bundle and exhaust free tier storage limits.
- **New bank builders** must be added as `dynamic(() => import('./banks/...'))` entries in `BANK_BUILDER_MAP`.

### 6. Strict Status Tracking & Anti-Hallucination Invariant
- When a bank builder UI and PDF renderer are created, its status in `BANK_REPORT_PROGRESS.md` MUST ALWAYS be marked:
  - `Base Structure: ✅ Created Base`
  - `Status: 🔨 In Progress` (under Section 2).
- **NEVER mark any bank as `✅ Completed`** unless the user explicitly inspects it and specifically instructs in chat to mark it completed.

### 7. Zero Hardcoded Mock Client Data Invariant
- Entity names, contact numbers, case identifiers (Khata, Plot, Loan No), specific dates, landmarks, site boundaries, and valuation figures MUST default strictly to `''` or dynamic prefill (`p.applicantName || ''`). NEVER hardcode sample customer data.

### 8. Strict 1-to-1 Field Ownership & Zero Alias Fallbacks
- Dedicated Bank UI is the sole translator of prefill data into bank-specific domain fields.
- PDF renderers use direct field retrieval (`resolveField(fields, key)`) with zero alias fallback chains. No silent field bridging or magic aliases in the PDF layer.

### 9. Post-Finalization Evidentiary Image Retention
- `finalizeReport()` must NEVER purge property images (`propertyImages: []`) or delete storage photos. Photographs must remain intact in case of manager/client rework cycles.

### 10. External Case Chat Locking & Direct PDF Email Attachments
- External projects (`EXTERNAL`) lock in-portal chat input (`<input disabled />` and `<button disabled />`) with the notice banner highlighting primary contact channels (`call, sms, whatsapp or mail` in red). Chat messages never auto-dispatch outbound emails.
- Final report emails for external bank cases attach the PDF directly as a file from `smohantyassociates@gmail.com` with no download link button (preventing corporate firewall blocks). Website account holders receive dashboard view notifications from `report@smohantyassociates.com`.



## Reference Number Invariants
- Project Code format: `SMA-YYYY/MM-NNNN` (monthly reset, locked across all builders).
- All bank templates strictly use canonical `refNo` (no bank prefixes, no dummy constants).
- Income Tax statutory ref: `SMA/V-01/IT/BBSR-NNNN/YY` (annual reset on Jan 1st, locked).
