# S. Mohanty Associates - Developer Onboarding & Project Handover

> [!IMPORTANT]
> **To the collaborating Antigravity model:** Please read this entire document carefully. It contains the complete architectural context, database schema explanation, and workflow details required to understand and contribute to this codebase.

## 1. Project Overview & Goals
**S. Mohanty Associates** is a web application designed to manage the entire lifecycle of property valuation reports. The platform digitizes operations that were previously manual, connecting Clients, Managers, Field Inspectors, and Report Analysts into a single unified workflow.

**Core Tech Stack:**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom UI, no component libraries)
- **Database:** PostgreSQL hosted on Supabase
- **ORM:** Prisma
- **Authentication:** Auth.js (NextAuth v5) with Prisma Adapter
- **File Storage:** Supabase Storage (for property images and generated PDFs)
- **PDF Generation:** Client-side via `html2canvas` + `jsPDF`

## 2. Architecture & Data Storage

### Database Schema (Prisma)
The database uses PostgreSQL. The schema is defined in `prisma/schema.prisma`.
Key Models:
- **`User`**: Contains all users. Differentiated by the `role` enum (`CLIENT`, `FIELD_EMPLOYEE`, `REPORT_EMPLOYEE`, `MANAGER`, `OWNER`).
- **`Project`**: The core entity. Tracks a valuation job from start to finish. It has relations to the client, the assigned manager, field employee, and report employee. Controlled by a strict `status` enum (e.g., `PENDING_REVIEW`, `INSPECTION_IN_PROGRESS`, `MANAGER_REVIEW`, `COMPLETED`).
- **`ServiceRequest`**: The initial intake form data submitted by the client (property details, contact info). 1-to-1 with a Project.
- **`Inspection`**: Data filled out by the Field Employee during site visits (status, location, notes).
- **`Report`**: The actual valuation data. Contains a `data` JSON column to flexibly store dynamic report data (Market Value, Distress Value, etc.).

### Storage (Supabase)
We use Supabase Storage buckets for file handling.
Configured in `src/lib/supabase-client.ts`.
- **Images:** Uploaded directly from the client browser to Supabase during report drafting.
- **PDFs:** Finalized valuation reports are generated client-side and uploaded to Supabase. The public URL is then saved to the `Report` model.

### Environment Setup
Requires the following `.env` variables:
- `DATABASE_URL` (Supabase pooled connection)
- `DIRECT_URL` (Supabase direct connection for Prisma migrations)
- `AUTH_SECRET` (For Auth.js)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3. Authentication & Routing

We use two distinct portals to separate concerns:
1. **Client Portal (`/dashboard`)**: For standard users to request valuations, chat, and download final PDFs.
   - Login: `/auth/client-login` (previously `/auth/login`)
2. **Employee Portal (`/portal`)**: For staff (Owners, Managers, Field Agents, Report Analysts).
   - Login: `/auth/employee-login`
   - **Role-Based Dashboards:** Upon login, employees are automatically redirected to their specific role dashboard (`/portal/owner`, `/portal/manager`, `/portal/field-agent`, or `/portal/report-agent`). The old generic unified dashboard has been removed.
   - **Common Profile:** All employees share a common `/portal/profile` page where they can view locked personal details and edit their profile photo.
   - **Dashboard Paths:** Report Analysts view their assigned project list at `/portal/my-projects`, while individual reports are built/edited at `/portal/reports/[projectId]`.
   - **Auto-Generated ID Format:** All client and employee registrations automatically generate a sequential unique ID saved in the `employeeId` column:
     - **Owner:** `0000O` (static)
     - **Clients:** `C` followed by a sequential number starting from 1000 (e.g. `C1000`, `C1001`, ...)
     - **Employees:** Shared counter starting from 1000 with a role-based suffix:
       - Manager: `1000M`, `1003M`, ...
       - Field Agent: `1002F`, ...
       - Report Agent: `1001R`, ...

> [!NOTE]
> Client and Employee sidebars/headers now dynamically highlight their active sections (e.g. bold highlights, active states) using the `<ActiveLink />` client helper component.
> Server actions (`src/app/actions`) heavily enforce role-based access control (RBAC). Always verify `session.user.role` before performing database mutations.

## 4. Completed Workflows (What is done)

The core business logic is **100% complete**.

1. **Intake Flow**: Client requests a valuation. A `Project` is created with `PENDING_REVIEW` status.
2. **Assignment Flow**: Manager accepts the project and assigns a `FIELD_EMPLOYEE` and `REPORT_EMPLOYEE` via the `/portal/projects/[id]` dashboard.
3. **Inspection Flow**: Field agent sees assignment, views client details, gets Google Maps directions, and completes the inspection. Status updates to `INSPECTION_COMPLETED`.
4. **Drafting Flow (Updated — July 2026)**: Report agent goes to "My Projects" (`/portal/my-projects`) to see pending work. They fill out a dynamic **14-section React form** in `src/app/portal/reports/[projectId]/ReportBuilder.tsx`. This form now fully matches the real-world Individual Client Bank Report template (based on the HDFC/SBI IBBI valuation sample PDF):

   **Form Sections (in order):**
   - **Section 1 – General Details:** Type of Property, Customer Name, Property Address, Landmark, Loan App No., Document Holder, Legal Address, Dates (Inspection & Valuation), Bank, Branch, Ref No.
   - **Section 2 – Surrounding Locality Details:** Ward No., Vicinity, Locality Type, Approach Road Width, Plot Demarcated, Proximity to Civic Amenities (Railway/Bus/Hospital distances), Property Identification, Proximity to Facilities, Landmark Details (Railway/Bus/Hospital/Nearest).
   - **Section 3 – Property Details:** Type of Usage, Additional Amenities, Legal Status.
   - **Section 4 – Subject Property Details:** Type of Premises, Occupied By/Vacant, Is Property Rented, Rented Occupants, Property Taxation, Boundary Details (North/East/South/West — both as per sketch map & at site).
   - **Section 5 – Structural Details:** Type of Structure, No. of Floors, Wings, Units/Floor, Internal Composition, Lifts, Age of Property, Estimated Future Life, Exteriors, Quality of Construction, Common Areas Remarks, Other Observations, Flooring, Roofing, Fixtures.
   - **Section 6 – Plan Approvals:** Construction as per Approved Plans, Approval Details, Construction Permission, Violations, Conformity to Byelaws, Documents Verified.
   - **Section 7 – Floor-wise Area & Building Valuation:** Dynamic table with Floor name, Area, Rate, Estimated Value, Life, Age, Depreciation %, Net Value. Auto-calculates total building value.
   - **Section 8 – Valuation of Land:** Govt Land Rate, Recommended Rate Basis, Land Area, Rate, Govt Rate, BUA as per Approvals, Total Land Value.
   - **Section 9 – Abstract of Valuation:** Total Building + Land values, Realizable Value (% configurable), Distress Sale Value (% configurable), Marketability, Valuation Result, Replacement Cost, Deviations, Govt/Guideline Value.
   - **Section 10 – Remarks & Declaration:** Demarcation, Possession, Remarks/Observations, Representative Name.
   - **Section 11 – Valuation Certificate (Auto-generated):** Auto-fills from Section 1 & 9 data.
   - **Section 12 – Property Photographs:** Multi-image upload to Supabase temp storage.
   - **Section 13 – Sketch Map:** Upload sketch map image.
   - **Section 14 – Location Map:** Live embedded Google Maps iframe (auto-reads from property address in Section 1 or lat/long coordinates). Manual screenshot upload for PDF inclusion (iframes cannot be captured by html2canvas). Lat/Long coordinate inputs.

   **Key Design Decisions in ReportBuilder:**
   - **Form UI:** All option-type fields use compact `<select>` dropdowns and `<input>` fields — NOT bulky 3-column boxes. Fast and space-efficient for data entry.
   - **PDF Output:** Uses a 3-column table pattern (Column 1: Label in blue | Column 2: All options listed | Column 3: Selected value in bold) to match the sample bank valuation report format.
   - **State:** `ReportFields` interface holds ~50+ fields. All saved as JSON into `Report.data` via `saveReportDraft` server action.
   - **PDF Stack:** `html2canvas` + `jsPDF`. The `generatePDFPages()` function (around line 668) builds custom HTML template strings with inline styles for each page. Letterhead loaded from `/letterhead.png`. **Tailwind classes do NOT work inside these HTML strings — use only inline styles.**
   - **Pull Back to Draft:** Report Agent can cancel their submission via `cancelReportSubmission` server action. After all status-changing operations (submit, cancel, rework, finalize), `router.refresh()` is called so the client component re-renders with the correct status from the server without a manual page reload.
   - **`OptionField` / `LandmarkField` components** still exist in the file but are **NOT used in the form render** — they are kept only in case they are needed for future read-only display modes. Do NOT add them back to the form.

5. **Manager Preview, Editing & Finalization Flow (Updated)**:
   - Manager reviews the drafted report via `ReportBuilder.tsx`. Can edit text fields and add/remove/replace photographs as needed.
   - Manager can "Send for Rework" (reverts status to REPORT_DRAFTING) or "Finalize & Generate PDF".
6. **PDF Generation & Cleanup (Updated)**: PDF generation is fully implemented on the **Client-Side** (`html2canvas` + `jsPDF`), triggered during Manager Finalization.
   - Captures HTML layout, paginates it, downloads locally for manager, and uploads the final PDF blob to `reports/pdfs/` in the `valuation-documents` Supabase bucket.
   - **Automated Cleanup:** Upon finalization, all temporary property images in `temp-photos/${projectId}/` are deleted from Supabase, and the `propertyImages` array in the database JSON is cleared.
7. **Navigation Updates (July 2026)**: Portal navigation labels updated — "My Reports" → "My Projects". Page titles updated accordingly.
8. **Delivery**: Client downloads the PDF from their dashboard.

## 5. Pending Work (What is next)

Outstanding items in **priority order**:

### High Priority — In Progress
1. **Default Template End-to-End Verification**: The 14-section `ReportBuilder.tsx` is complete and on GitHub (branch: `main`). Teammate should deploy to Vercel. User needs to test:
   - Location Map section (Google Maps iframe auto-loads from address field)
   - PDF download — verify all 14 sections render correctly with 3-column table format
   - "Cancel Submission (Pull back to Draft)" button — check status refreshes correctly
   - All new `<select>` dropdowns save and restore correctly from the JSON `Report.data`

### Medium Priority — After Verification
2. **Organizational/Corporate Templates**: The "Standard Individual" (default bank report) template is complete. Next is to build template variants for specific org clients (SBI, PNB, etc.). The user will provide sample layouts. These need conditional form logic or separate components, plus matching PDF generation. **Deferred until the default template is verified by the user.**
3. **Remove the overlay / coming-soon banner** on `https://smohantyassociates.vercel.app/` (the public-facing landing page).

### Lower Priority — Future
4. **Supabase Storage Lifecycle Policy**: PDFs should auto-delete after 3–6 months to stay within 8GB limit. Implement via Supabase Edge Function, cron job, or bucket lifecycle policy.
5. **Email Automation**: Automated notifications via Gmail API or Nodemailer (e.g., "Your request was received", "Your PDF is ready for download").
6. **Local Archiving Script**: Node.js script to run on the office PC to automatically download and archive PDFs older than 3 months from Supabase to a local hard drive.
7. **Repo Sync**: Pull latest changes from teammate's fork (`https://github.com/pratyush-barik/s-mohanty-associates/`) and merge with current `main`, using this document as the source of truth.

## 6. Critical Notes & Gotchas

> [!IMPORTANT]
> **Vercel Redirects & NextAuth**: `AUTH_URL` should NOT be set to `http://localhost:3000` in Vercel environment variables — it causes NextAuth relative paths to crash in production. Logout redirects currently use absolute production URLs (e.g., `https://smohantyassociates.vercel.app/`).

> [!IMPORTANT]
> **Location Map in PDF**: Section 14 uses a Google Maps `<iframe>` for live preview (auto-loaded from property address). `html2canvas` **cannot capture iframes**. The user must manually take a Google Maps satellite screenshot and upload it in the "Screenshot for PDF" upload within Section 14. Only the uploaded image appears in the PDF.

> [!WARNING]
> **ReportBuilder.tsx is large (~1600+ lines)**. When editing, be careful with the `generatePDFPages()` function (starts around line 668). Inline styles in the HTML template strings must use valid CSS values — Tailwind classes do NOT work inside these strings.

> [!WARNING]
> **Do NOT add `OptionField` or `LandmarkField` back to the form render**. These components still exist in the file (kept for potential future read-only display use) but the form uses plain `<select>` and `<input>` elements. The 3-column blue-box display is for PDF output only.

> [!TIP]
> When modifying the UI, prioritize modern, premium aesthetics (glassmorphism, clean typography, subtle animations) without relying on Tailwind component libraries like Shadcn. Use raw Tailwind classes.

## 7. Recent Git Commits (for reference)
- `4cc5f7e` — refactor: revert form UI to compact dropdowns, keep 3-column layout for PDF only
- `250ddc4` — feat: auto-embed Google Maps in Location Map section from property address
- `1f013d5` — Refactor ReportBuilder UI and logic to match sample PDF layout and fix pull back button state update
- `c26fa3b` — (previous: various nav and auth fixes)
