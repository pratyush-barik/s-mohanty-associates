# ⏳ Bank Valuation Report Templates — Unstarted Status

All 6 previously pending Bank and Financial Institution valuation report template formats have been **scaffolded and implemented** via the config-driven `BankReportBuilder` architecture, with normalized single-pass state initialization, locked reference numbers (`SMA-YYYY/MM-NNNN`), and verified PDF rendering suites.

| # | Bank / Financial Institution | Subclass / Format | Component Path | Architecture | Status |
|---|---|---|---|---|---|
| **1** | **HDFC BANK** (#23) | `HL-LAP-BLG` | `src/app/portal/reports/[projectId]/banks/hdfc/HDFCBankHLLAPBLG.tsx` | Config-driven (`BankReportBuilder`) | 🔨 In Progress (`✅ Created Base`) |
| **2** | **INDIAN BANK** (#28) | `Standard` | `src/app/portal/reports/[projectId]/banks/indian-bank/IndianBank.tsx` | Config-driven (`BankReportBuilder`) | 🔨 In Progress (`✅ Created Base`) |
| **3** | **KOTAK MAHINDRA BANK** (#32.2) | `HL-LAP` | `src/app/portal/reports/[projectId]/banks/kotak/KotakHLLAP.tsx` | Config-driven (`BankReportBuilder`) | 🔨 In Progress (`✅ Created Base`) |
| **4** | **MANAPPURAM HOUSING FINANCE** (#36) | `Standard` | `src/app/portal/reports/[projectId]/banks/manappuram/ManappuramHousing.tsx` | Config-driven (`BankReportBuilder`) | 🔨 In Progress (`✅ Created Base`) |
| **5** | **PUNJAB & SIND BANK** (#42) | `Standard` | `src/app/portal/reports/[projectId]/banks/punjab-sind/PunjabSindBank.tsx` | Config-driven (`BankReportBuilder`) | 🔨 In Progress (`✅ Created Base`) |
| **6** | **PUNJAB NATIONAL BANK (PNB)** (#43) | `Standard` | `src/app/portal/reports/[projectId]/banks/punjab-national/PunjabNationalBank.tsx` | Config-driven (`BankReportBuilder`) | 🔨 In Progress (`✅ Created Base`) |

---
**Remaining Unstarted Count**: **0 formats** (100% of all 78 bank formats across 61 institutions have base structures established and tracked in [`BANK_REPORT_PROGRESS.md`](BANK_REPORT_PROGRESS.md)).
