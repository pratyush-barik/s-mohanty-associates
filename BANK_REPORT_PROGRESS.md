# Bank & FIS Valuation Report Templates — Progress Tracker

This document tracks the end-to-end implementation and customization of all 57+ Bank and Financial Institution report templates and subclasses in alphabetical order.

---

## 📊 Summary & Status Overview

- **Total Banks / Organizations**: 60
- **Total Subclasses / Templates**: 73
- **Completed Subclasses**: 16 / 73 (1.1 `MLAP`, 1.2 `STSL`, 2.1 `HL-LAP` (Aditya Birla Housing), 3 `Standard` (Annapurna), 4 `Standard` (Arka), 5 `Standard` (Arthan), 7.1 `AGRI` (Axis), 7.2 `HL-LAP` (Axis), 7.3 `SBB` (Axis), 7.4 `SME` (Axis), 8 `Standard` (Axis Finance), 10 `HL-LAP` (Bajaj Housing), 11.1 `HL-LAP` (Bandhan), 11.2 `SME` (Bandhan), 12 `Standard` (Bank of Baroda), 16 `Standard` (CanFin Homes))
- **Current Active Bank**: 16. `CANFIN HOMES LTD` (Completed)
- **Current Active Subclass**: 16.1 `Standard` (Completed)
- **Bucket Standard**: Enforced strictly per [docs/BUCKET_ARCHITECTURE_STANDARD.md](docs/BUCKET_ARCHITECTURE_STANDARD.md) (Cloud bucket exclusively for Property Photographs; Maps/Documents are device-upload only).

---

## 📋 Alphabetical Bank & Subclass List

| # | Bank / Organization | Subclass / Format | Status | UI Config | PDF Renderer | Validation |
|---|---|---|---|---|---|---|
| **1** | **ADITYA BIRLA CAPITAL LTD** | | | | | |
| 1.1 | ADITYA BIRLA CAPITAL LTD | `MLAP` | ✅ Complete | ✅ 12-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| 1.2 | ADITYA BIRLA CAPITAL LTD | `STSL` | ✅ Complete | ✅ 14-Section Custom UI | ✅ Dedicated 7-Page PDF | ✅ Validated |
| **2** | **ADITYA BIRLA HOUSING FINANCE LTD** | | | | | |
| 2.1 | ADITYA BIRLA HOUSING FINANCE LTD | `HL-LAP` | ✅ Complete | ✅ 11-Section Custom Config | ✅ Dedicated PDF Renderer | ✅ Validated |
| **3** | **ANNAPURNA MICRO FINANCE LTD** | `Standard` | ✅ Complete | ✅ 8-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **4** | **ARKA FINANCE LTD** | `Standard` | ✅ Complete | ✅ Custom UI | ✅ Dedicated PDF | ✅ Validated |
| **5** | **ARTHAN FINANCE** | `Standard` | ✅ Complete | ✅ 13-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **6** | **AU SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **7** | **AXIS BANK** | | | | | |
| 7.1 | AXIS BANK | `AGRI` | ✅ Complete | ✅ 14-Section Custom UI | ✅ Dedicated 10-Page PDF | ✅ Validated |
| 7.2 | AXIS BANK | `HL-LAP` | ✅ Complete | ✅ 12-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| 7.3 | AXIS BANK | `SBB` | ✅ Complete | ✅ 14-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| 7.4 | AXIS BANK | `SME` | ✅ Complete | ✅ 14-Section Custom UI | ✅ Dedicated 10-Page PDF | ✅ Validated |
| **8** | **AXIS FINANCE LTD** | `Standard` | ✅ Complete | ✅ 10-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **9** | **AYE FINANCE LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **10** | **BAJAJ HOUSING FINANCE LTD** | `HL-LAP` | ✅ Complete | ✅ 12-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **11** | **BANDHAN BANK** | | | | | |
| 11.1 | BANDHAN BANK | `HL-LAP` | ✅ Complete | ✅ 13-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| 11.2 | BANDHAN BANK | `SME` | ✅ Complete | ✅ Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **12** | **BANK OF BARODA-BOB** | `Standard` | ✅ Complete | ✅ 10-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **13** | **BANK OF INDIA-BOI** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **14** | **BANK OF MAHARASHTRA-BOM** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **15** | **CANARA BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **16** | **CANFIN HOMES LTD** | `Standard` | ✅ Complete | ✅ Standard UI | ✅ Standard Base PDF | ✅ Validated |
| **17** | **CHOLAMANDALAM INVESTMENT COMPANY LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **18** | **CLIX CAPITAL LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **19** | **DCB BANK** | | | | | |
| 19.1 | DCB BANK | `Desktop valuation format` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 19.2 | DCB BANK | `HL-LAP-SME` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **20** | **GIC HOUSING FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **21** | **GRIHAM HOUSING FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **22** | **HDB FINANCIAL SERVICES** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **23** | **HDFC BANK** | `HL-LAP-BLG` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **24** | **ICICI BANK** | | | | | |
| 24.1 | ICICI BANK | `HL-LAP-BBG` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 24.2 | ICICI BANK | `NPA` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **25** | **IDBI BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **26** | **IDFC FIRST BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **27** | **IKF FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **28** | **INDIAN BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **29** | **INDUSIND BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **30** | **ISFC** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **31** | **JANA SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **32** | **KOTAK MAHINDRA BANK** | | | | | |
| 32.1 | KOTAK MAHINDRA BANK | `BUSINESS BANKING GROUP` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 32.2 | KOTAK MAHINDRA BANK | `HL-LAP` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **33** | **L&T FINANCIAL SERVICES** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **34** | **LIC HOUSING FINANCE LTD** | | | | | |
| 34.1 | LIC HOUSING FINANCE LTD | `NPA-DEFAULT CASES` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 34.2 | LIC HOUSING FINANCE LTD | `PVR-1(SELF CONSTRUCTIONLA-L & B)` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 34.3 | LIC HOUSING FINANCE LTD | `PVR-2(FLAT-UNDERCONSTRUCTION)` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 34.4 | LIC HOUSING FINANCE LTD | `PVR-3(LAP-RENNOVATION-BOTH L&B-FLAT)` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 34.5 | LIC HOUSING FINANCE LTD | `PVR-4(LAND PURCHSASE ONLY)` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 34.6 | LIC HOUSING FINANCE LTD | `PVR-5 (SUBSEQUENT VALUATION REPORT)` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **35** | **MAHINDRA FINANCE LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **36** | **MANAPPURAM HOUSING FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **37** | **NAVDHAN FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **38** | **NEO GROWTH** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **39** | **PNB HOUSING FINANCE LTD** | `HL-LAP` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **40** | **POONAWALLA FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **41** | **PROTEUM FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **42** | **PUNJAB & SIND BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **43** | **PUNJAB NATIONAL BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **44** | **PURPLE FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **45** | **SAMMUNATI FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **46** | **SHRIRAM FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **47** | **SMFG INDIA-FULLERTON** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **48** | **STATE BANK OF INDIA-SBI** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **49** | **SURYODAY SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **50** | **SWARNA FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **51** | **TATA CAPITAL LTD** | `SME-BLG` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **52** | **TATA HOUSING FINANCE LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **53** | **UCO BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **54** | **UJJIVAN SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **55** | **UNION BANK OF INDIA-UBI** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **56** | **UNITY SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **57** | **UTKARSH SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **58** | **VARTHANA FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **59** | **VISTAAR FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **60** | **YES BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |

---

## ⚠️ Known Issues / Implementation Notes

The following banks share the EXACT SAME sample file format / valuation template as Bank of Baroda. Their implementation should heavily reuse or directly point to the Bank of Baroda components and PDF renderer:
1. `BANK OF INDIA-BOI` (src/app/portal/reports/[projectId]/banks/bank-of-india)
2. `BANK OF MAHARASHTRA-BOM` (src/app/portal/reports/[projectId]/banks/bank-of-maharashtra)
3. `CANARA BANK` (src/app/portal/reports/[projectId]/banks/canara)

---

## 🎯 Current Focus: Bank 16 — CANFIN HOMES LTD

### 16.1 `Standard` — ✅ COMPLETE
- **Vertical**: `Standard`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/canfin/CanFinHomes.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-canfin-homes-renderer.ts` (`PDFCanFinHomesRenderer`)
- **Status**: Complete & Verified (Uses base layout as requested)
- **Key Features Implemented**:
  - Implemented 2-file architecture exactly as specified (`CanFinHomes.tsx` and `pdf-canfin-homes-renderer.ts`).
  - Directly leverages the `GeneralReportBuilder` UI and `PDFGeneralRenderer` generation logic for a standard 14-section format without unnecessary overrides, matching the user's explicit directive to use the "existing base bank report draft ui and pdf render of it".

---

## 🎯 Past Completed Banks: Bank 12 — BANK OF BARODA-BOB

### 12.1 `Standard` — ✅ COMPLETE
- **Vertical**: `Standard`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/bank-of-baroda/BankOfBaroda.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-bank-of-baroda-renderer.ts` (`PDFBankOfBarodaRenderer`)
- **Status**: Complete & Verified (10 sections, Custom PDF overrides, Maps, Annexures, prefill bugs and PDF headers fixed)
- **Key Features Implemented**:
  - Full 10-section architecture matching Bank of Baroda's specific layout.
  - Handled Affirmations and Questionnaire arrays seamlessly with prefill logic and cleared states.
  - Custom rendering overrides with `isBobDrawing` to strictly follow BOB's PDF format while preserving map and photo headers natively.
  - Added bottom padding for layout consistency in PDF sign-offs.

---

## 🎯 Past Completed Banks: Bank 1 — ADITYA BIRLA CAPITAL LTD

### 1.1 `MLAP` (Mortgage Loan Against Property) — ✅ COMPLETE
- **Vertical**: `MLAP`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/aditya-birla/AdityaBirlaCapitalMLAP.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-aditya-birla-mlap-renderer.ts` (`PDFAdityaBirlaMLAPRenderer`)
- **Status**: Complete & Verified (12 sections, Annexures, strict ordering, FloatingNavigator, Turbopack build verified)

### 1.2 `STSL` (Small Ticket Secured Loan) — ✅ COMPLETE
- **Vertical**: `STSL`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/aditya-birla/AdityaBirlaCapitalSTSL.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-aditya-birla-stsl-renderer.ts` (`PDFAdityaBirlaSTSLRenderer`)
- **Status**: Complete & Verified (14 sections, exact 7-page PDF renderer, Annexures, Maps, Declaration with hanging indent, Turbopack build verified)
- **Key Features Implemented**:
  - Full 14-section architecture matching reference sample.
  - Page 1 & 2: 3-row Address format (TRF, Visit, Docs) with in-field Annexure selector, highlighted slash options.
  - Page 2 & 3: 8-Item Documentation Checklist table with availability status + details.
  - Page 3 & 4: Floor-wise Built-Up Area table with deviations, Setbacks table (Front/Side1/Side2/Rear), Valuation summary with formulas and Distress (80%) value.
  - Page 4: 4-Side Boundary comparison table (Sale deed vs Bhulekh map vs Actual) with Boundary Matching row, Remarks & Visited Engineer.
  - Page 5: Photographs of Property with GPS/Timestamp stamps.
  - Page 6 & 7: Location Map, Bhulekh Mouza Cadastral Map, Superimposed Drone/Survey Cadastral Map, Appraiser Name, 5 Declaration Points with hanging indent, and editable Prepared/Finalized By sign-off.
  - Page 8+: Standardized Annexures & Schedules.

### Bank 7 — AXIS BANK

#### 7.1 `AGRI` (Agricultural Land Valuation) — ✅ COMPLETE
- **Vertical**: `AGRI`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/axis/AxisAGRI.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-axis-agri-renderer.ts` (`PDFAxisAgriRenderer`)
- **Status**: Complete & Verified
- **Key Features Implemented**:
  - Full 14-Section Valuation architecture per Axis Bank AGRI (Non-Agri Format) specifications.
  - Dedicated 10-Page PDF generator with exact statutory table structures and Times New Roman typography.
  - Flow-based compact layout for Valuer Undertaking + Authorized Signatory block with height lookahead to eliminate orphan splits.
  - Widened 8-column Building Valuation breakdown table (+20pt width with title-case headers) and side-by-side BUA/Carpet area columns.
  - Flow-packed map rendering engine packing Location, Cadastral, Sketch, and Benchmark maps onto unified pages without unnecessary page breaks.
  - Compact Checklist layout with reduced top margins and strict grid alignment.
  - Comprehensive automatic calculations (Land values, Building depreciation, Realisable & Distress breakdowns, and Say conversions).

#### 7.2 `HL-LAP` (Home Loan / Loan Against Property) — ✅ COMPLETE
- **Vertical**: `HL-LAP`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/axis/AxisHLLAP.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-axis-hllap-renderer.ts` (`PDFAxisHLLAPRenderer`)
- **Status**: Complete & Verified
- **Key Features Implemented**:
  - Full 12-Section Valuation architecture per Axis Bank HL-LAP specifications.
  - Standardized Times New Roman typography (12pt Body/Tables, 14pt Headers/Titles, 10pt Captions).
  - Universal `DD/MM/YYYY` date format support with controlled date pickers.
  - Unified Spanning Table Headings for header-only sections (merged columns 2 & 3 without dividing lines).
  - Single-line `Sl. No.` column formatting (`colSl = 48`).
  - Unified `Sl. No` cells for multi-row sub-blocks (Deed vs Actual boundaries, side margins, BUA floors) eliminating row slices in the serial number column.
  - Standard predefined `drawPhotoGrid` and `drawMapGallery` integration with dynamic captions (`DEFAULT_PHOTO_LABEL = 'Site Picture'`) and natural aspect ratio preservation.
  - Seamless space-efficient page layout preventing blank space waste following Undertaking.

#### 7.3 `SBB` (Small Business Banking) — ✅ COMPLETE
- **Vertical**: `SBB`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/axis/AxisSBB.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-axis-sbb-renderer.ts` (`PDFAxisSBBRenderer`)
- **Status**: Complete & Verified
- **Key Features Implemented**:
  - Full Valuation architecture per Axis Bank SBB specifications.
  - Custom dynamic Table 9.1 & 9.2 (Market Value & Government Guideline Value) with dynamic floor layout integrations.
  - Accurate calculation cascading logic handling manual edits and overrides correctly from UI state to PDF rendering logic.
  - "FLOOR WISE BREAK UP" custom styling (bolding overrides, custom width alignments, horizontal checkbox display in PDF).

#### 7.4 `SME` (Small & Medium Enterprises) — ✅ COMPLETE
- **Vertical**: `SME`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/axis/AxisSME.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-axis-sme-renderer.ts` (`PDFAxisSmeRenderer`)
- **Status**: Complete & Verified (Completely standalone entity, zero references/dependencies to Agri)
- **Key Features Implemented**:
  - Full 14-Section Valuation architecture per Axis Bank SME specifications.
  - Dedicated 10-Page PDF generator with exact statutory table structures and Times New Roman typography.
  - Independent `AxisSmeReportFields`, `AxisSmeFloorItem`, and `PDFAxisSmeRenderer` with `generateAxisSmeReport`.
  - Full feature parity with Axis non-agri reporting standard: flow-based Valuer Undertaking, justified paragraphs, widened 8-column Building Valuation table, flow-packed maps, and compact Checklist layout.
  - Completely isolated from AGRI to allow future SME-specific customizations without side effects.

### Bank 4 — ARKA FINANCE LTD

#### 4.1 `Standard` — ✅ COMPLETE
- **Vertical**: `Standard`
- **UI Builder**: `src/app/portal/reports/[projectId]/banks/arka/ArkaFinance.tsx`
- **PDF Renderer**: `src/lib/banks/pdf-arka-finance-renderer.ts` (`PDFArkaFinanceRenderer`)
- **Status**: Complete & Verified
- **Key Features Implemented**:
  - 7-section architecture (Cover Details, Summary, Location & Physical Details, Area Details, Violation Details, Structural Details, Boundary Details).
  - Custom dynamic fields including editable Property Owner tables with relation drop-downs.
  - Complete replication of Arka's distinct double blue border layout on Cover Page.
  - Advanced PDF generation handling standard text and image injection seamlessly.