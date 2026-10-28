# S Mohanty Associates — Property Valuation Management & Bank Report Engine

Web application managing the end-to-end lifecycle of real estate and property valuation reports for S Mohanty Associates, empaneled with major PSU, Private, and Housing Finance institutions.

## 🚀 Active Roadmap & Deadlines (October – November 2026)

- **Phase 1: Rapid Scaffolding of All 60+ Bank Structures (Priority Target: Before Nov 2nd)**:
  - External model support in Antigravity ends on **Nov 2nd**.
  - To maximize development velocity, the primary objective is to **scaffold the basic working UI component and dedicated PDF renderer for ALL remaining bank templates directly from sample reports**.
  - Deliverables per bank: Correct bank/subtemplate ID, soft container UI layout, table arithmetic & decimal handling, dedicated PDF renderer extending `PDFBankRenderer`, inherited attachment galleries (Photographs, Device-uploaded Maps, Documents), and lazy-loaded dynamic registration in `BuilderSelector.tsx`.
- **Phase 2: Deep Refinement, Edge Cases & Custom Perfection**:
  - Once 100% of the bank structures exist in the repository, perform bank-by-bank deep refinement (precise statutory declarations, Code of Conduct, justification letters, and pixel-perfect PDF alignment).

For comprehensive developer directives, schema details, and architecture specifications, please refer to:
- [`AI_HANDOVER.md`](AI_HANDOVER.md) — Comprehensive developer onboarding & project architecture.
- [`AGENTS.md`](AGENTS.md) — Multi-agent directives, strict coding rules, and conventions.
- [`CLAUDE.md`](CLAUDE.md) — Directives for Claude and collaborating models.
- [`SESSION_TRANSFER_CONTEXT.mdf`](SESSION_TRANSFER_CONTEXT.mdf) — Machine-readable inference context & negative/positive controls.
- [`BANK_REPORT_PROGRESS.md`](BANK_REPORT_PROGRESS.md) — Master tracker for all 60+ banks and 73 sub-templates.

---

## 🏛️ Core Architecture & System Invariants

1. **Universal Enclosure Order Invariant**:
   - Across ALL report builders (General, all 60+ Banks including Standalone SBI Flat and SBI Land & Building, IBBI, and Income Tax), both Web UI sections and PDF renderer outputs strictly follow:
     $$\mathbf{Documents} \longrightarrow \mathbf{Maps} \longrightarrow \mathbf{Photographs} \longrightarrow \mathbf{Annexures}$$
   - *No exceptions or standalone formats*: All templates adhere to this unified sequence.
2. **Lazy-Loaded Dynamic Routing**:
   - All report builders are loaded on demand via `dynamic()` imports in `BuilderSelector.tsx` to maintain bundle size within Vercel free tier limits (~18 KB main client chunk).
3. **Single Source of Truth Styling**:
   - Universal base UI components (`BaseBankReportComponents.tsx`) and fields (`bank-fields.ts`) govern all bank templates.
   - Mandatory justified text alignment (`text-justify leading-relaxed` and PDF `align: 'justify'`) on all rendered clauses, certificates, and multi-line remarks.
4. **Google Satellite Map Card Layout**:
   - Full-width interactive satellite embed with GPS coordinates, origin address badges, and manual coordinate override directly below the category header divider.
5. **Zero Mock Client Data**:
   - Case-specific customer data (names, loan numbers, boundaries, dates) strictly defaults to dynamic prefill or empty strings.
6. **Strict 1-to-1 Field Ownership & Zero Alias Fallbacks**:
   - Bank UI components directly prefill fields without hidden alias chains in the PDF engine (`resolveField`).
7. **Evidentiary Photo Retention**:
   - `finalizeReport` never purges property photographs; images are retained for compliance and rework cycles.
8. **Direct PDF Delivery & Bank Firewall Compliance**:
   - External bank reports are delivered directly attached as PDF files from `smohantyassociates@gmail.com` with zero download link buttons, bypassing Indian bank corporate firewalls. Website clients receive portal dashboard notifications.
9. **Universal Reference Standardization & Engine Lockdown**:
   - **Project Code Format**: Strictly `SMA-YYYY/MM-NNNN` (monthly sequential counter resetting to `0001` on the 1st of every month).
   - **Canonical State Key `refNo`**: Single uniform state key across all builders (General, IBBI, Income Tax, and all 78 bank report builders). Redundant keys (`caseRefNo`, `proposalNo`, `referenceNo`, `fileRefNo`) are purged.
   - **Global Input Lockdown**: The firm reference number field is permanently locked (`disabled={true} readOnly={true}`) with standard placeholder `"SMA-YYYY/MM-NNNN"`.
   - **Zero Bank Prefixes**: No firm prefixes (`SMA/`, `SMA/AYE/`, `SMA/CHOLA/`, `PRPL-`, `SAM/`) or dummy fixture constants (`BOB/02/...`).
   - **Statutory Income Tax Reference**: Auto-generates `SMA/V-01/IT/BBSR-NNNN/YY` on mount, hardcoded to CCIT jurisdiction circle `BBSR`, resetting annually on January 1st.
   - **Download Filename Safety**: All PDF download filenames sanitized via `sanitizeFilenameCode(...)` (`/` $\rightarrow$ `_`).
10. **Normalized Single-Pass State Initialization**:
   - All 78 bank report builders follow the declarative single-pass object spread:
     ```ts
     const d = { ...(rawInitialFields || {}), refNo: rawInitialFields?.refNo || projectCode || '' };
     ```
   - Imperative state mutations (`if (!d.refNo) d.refNo = ...`) and secondary `useEffect` render cycles are prohibited.

---

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Verification & Build

```bash
# Typecheck (Must pass with 0 errors)
npx tsc --noEmit

# Production Build (All 33 routes static/dynamic compiled)
npm run build
```
