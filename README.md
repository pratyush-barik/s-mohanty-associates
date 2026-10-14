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

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Verification & Build

```bash
# Typecheck
npx tsc --noEmit

# Production Build
npm run build
```
