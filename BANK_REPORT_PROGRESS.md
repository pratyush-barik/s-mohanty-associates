# Bank & FIS Valuation Report Templates — Progress Tracker

This document tracks the end-to-end implementation and customization of all 57+ Bank and Financial Institution report templates and subclasses in alphabetical order.

---

## 📊 Summary & Status Overview

- **Total Banks / Organizations**: 57
- **Total Subclasses / Templates**: 73
- **Completed Subclasses**: 5 / 73 (1.1 `MLAP`, 1.2 `STSL`, 3 `Standard` (Annapurna), 5 `Standard` (Arthan), 8.1 `AGRI` (Axis))
- **Current Active Bank**: 8. `AXIS BANK`
- **Current Active Subclass**: 8.1 `AGRI` (Complete: 14 Sections UI & 10-Page PDF)
- **Bucket Standard**: Enforced strictly per [docs/BUCKET_ARCHITECTURE_STANDARD.md](docs/BUCKET_ARCHITECTURE_STANDARD.md) (Cloud bucket exclusively for Property Photographs; Maps/Documents are device-upload only).

---

## 📋 Alphabetical Bank & Subclass List

| # | Bank / Organization | Subclass / Format | Status | UI Config | PDF Renderer | Validation |
|---|---|---|---|---|---|---|
| **1** | **ADITYA BIRLA CAPITAL LTD** | | | | | |
| 1.1 | ADITYA BIRLA CAPITAL LTD | `MLAP` | ✅ Complete | ✅ 12-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| 1.2 | ADITYA BIRLA CAPITAL LTD | `STSL` | ✅ Complete | ✅ 14-Section Custom UI | ✅ Dedicated 7-Page PDF | ✅ Validated |
| **2** | **ADITYA BIRLA HOUSING FINANCE LTD** | | | | | |
| 2.1 | ADITYA BIRLA HOUSING FINANCE LTD | `HL-LAP` | 🟡 Ready for Review | 🟡 Configured | 🟡 Custom Fields | ⏳ Pending |
| **3** | **ANNAPURNA MICRO FINANCE LTD** | `Standard` | ✅ Complete | ✅ 8-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **4** | **ARKA FINANCE LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **5** | **ARTHAN FINANCE** | `Standard` | ✅ Complete | ✅ 13-Section Custom UI | ✅ Dedicated PDF Renderer | ✅ Validated |
| **6** | **AU SMALL FINANCE BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **7** | **AVE FINANCE LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **8** | **AXIS BANK** | | | | | |
| 8.1 | AXIS BANK | `AGRI` | ✅ Complete | ✅ 14-Section Custom UI | ✅ Dedicated 10-Page PDF | ✅ Validated |
| 8.2 | AXIS BANK | `HL-LAP` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 8.3 | AXIS BANK | `SBB` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 8.4 | AXIS BANK | `SME` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **9** | **AXIS FINANCE LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **10** | **BAJAJ HOUSING FINANCE LTD** | `HL-LAP` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **11** | **BANDHAN BANK** | | | | | |
| 11.1 | BANDHAN BANK | `HL-LAP` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| 11.2 | BANDHAN BANK | `SME` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **12** | **BANK OF BARODA-BOB** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **13** | **BANK OF INDIA-BOI** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **14** | **BANK OF MAHARASHTRA-BOM** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **15** | **CANARA BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **16** | **CANFIN HOMES LTD** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
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
| **42** | **PUNJAB NATIONAL BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **43** | **PUNJAB & SIND BANK** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **44** | **PURPLE FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **45** | **SAMMUNATI FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **46** | **STATE BANK OF INDIA-SBI** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **47** | **SHRIRAM FINANCE** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
| **48** | **SMFG INDIA-FULLERTON** | `Standard` | ⏳ Not Started | ⏳ Stub | ⏳ Base PDF | ⏳ Pending |
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

## 🎯 Current Focus: Bank 1 — ADITYA BIRLA CAPITAL LTD

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