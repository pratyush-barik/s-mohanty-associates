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
2. **Assignment Flow**: Manager accepts the project and assigns a `FIELD_EMPLOYEE` and `REPORT_EMPLOYEE` via the `/portal/projects/[id]` dashboard. Managers can assign agents to multiple projects simultaneously; active project counts are displayed as badges during assignment.
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
   - **Section 14 – Location Map:** Live embedded Google Maps iframe (auto-reads from property address in Section 1 or lat/long coordinates). Manual screenshot upload for PDF inclusion (iframes cannot be captured by html2canvas).    **Key Design Decisions in ReportBuilder:**
    - **Form UI:** All option-type fields use compact `<select>` dropdowns and `<input>` fields — NOT bulky 3-column boxes. Fast and space-efficient for data entry.
    - **PDF Output:** Uses a 3-column table pattern (Column 1: Label in blue | Column 2: All options listed | Column 3: Selected value in bold) to match the sample bank valuation report format.
    - **PDF Layout & Alignment:** To counter rendering bugs in `html2canvas` (which ignores CSS `vertical-align` and flexbox on table cells), the code uses a **JavaScript post-processing technique**. Before capture, it measures the rendered row height vs content height of cells marked with `data-vcenter="1"` and dynamically injects precise pixel padding to force vertical centering. The PDF pages are also balanced (e.g. Section 3 moved to Page 3) and page-level flex wrappers were removed to completely eliminate overflow and large gaps.
    - **Cell Height & Overlap Fix (July 2026):** Halved vertical cell paddings (reduced to `4.5px 8px` on general rows, `6px 8px` on section headers, and `2.5px 6px` on building table details) and set explicit `line-height: 1.35em` relative layout constraints inside all table elements. This prevents html2canvas from interpreting unitless heights as pixel coordinates (which originally caused subsequent rows to collapse and render on top of each other) while centering the text nicely within cells.
    - **3-Step Setup Wizard:** Implemented a configuration wizard overlay that prompts the Report Agent to select:
      1. *Client Category*: Individual client vs. Organisation/Bank (supporting templates 1-10).
      2. *Service*: Preloaded with the company's 13 official services.
      3. *Subject*: Dynamically filtered based on the selected service (e.g., Residential Land under Land Valuation).
    - **Adaptability Banner & Dynamic Titles:** Configured an active settings summary banner at the top of Section 1 of the report editor that highlights these selected parameters with a "Change Parameters" trigger to re-run the configuration wizard at any time. Report document titles in the final PDF compile dynamically based on the chosen category, service, and subject.
    - **Semi-Transparent Table Accents:** Replaced solid `#DBE6F0` (light blue labels) and `#DDE9F6` (lighter options) backgrounds in the PDF generator with semi-transparent `rgba` equivalents (approx. 55% transparency) to match the custom background templates elegantly when printed.
    - **Simplified Address Schema & States Datalist:** Replaced the redundant list of address fields (city, district, khasra, mouza, tahasil, etc.) with a clean structure: Address Line 1, State, and Pincode. The State field uses a searchable datalist prefilled with all 36 Indian states and Union Territories. All values serialize dynamically into PostgreSQL via Prisma client JSON mutations without schema table alterations.
    - **State:** `ReportFields` interface holds ~50+ fields. All saved as JSON into `Report.data` via `saveReportDraft` server action.
    - **PDF Stack:** `html2canvas` + `jsPDF`. The `generatePDFPages()` function (around line 668) builds custom HTML template strings with inline styles for each page. Letterhead loaded from `/letterhead.png`. **Tailwind classes do NOT work inside these HTML strings — use only inline styles.**
    - **Pull Back to Draft:** Report Agent can cancel their submission via `cancelReportSubmission` server action. After all status-changing operations (submit, cancel, rework, finalize), `router.refresh()` is called so the client component re-renders with the correct status from the server without a manual page reload.
    - **`OptionField` / `LandmarkField` components** still exist in the file but are **NOT used in the form render** — they are kept only in case they are needed for future read-only display modes. Do NOT add them back to the form.

5. **Manager Preview, Editing & Finalization Flow (Updated)**:
   - Manager reviews the drafted report via `ReportBuilder.tsx`. Can edit text fields and add/remove/replace photographs as needed.
   - Manager can "Send for Rework" which opens a prompt to input specific rework instructions (reverts status to REPORT_DRAFTING) or "Finalize & Generate PDF".
   - The Report Agent will see the Manager's rework comments highlighted at the top of the form when they resume drafting.
6. **PDF Generation & Cleanup (Updated)**: PDF generation is fully implemented on the **Client-Side** (`html2canvas` + `jsPDF`), triggered during Manager Finalization.
   - Captures HTML layout, paginates it, downloads locally for manager, and uploads the final PDF blob to `reports/pdfs/` in the `valuation-documents` Supabase bucket.
   - **Automated Cleanup:** Upon finalization, all temporary property images in `temp-photos/${projectId}/` are deleted from Supabase, and the `propertyImages` array in the database JSON is cleared.
7. **Client Rework Flow**: Clients can request changes to their finalized reports from their dashboard. The project status reverts to `MANAGER_REVIEW`, and the manager receives a rework comment message.
8. **Navigation & Login Layout Updates (July 2026)**:
   - Portal navigation labels updated — "My Reports" → "My Projects".
   - My Projects listing page layout transformed from block cards into sleek, horizontal, inline rectangular list rows.
   - Report Agent's "My Projects" page now includes exact filtering options (search bar, Pending/Completed/All tabs) matching the Field Agent's workflow.
   - Replaced Next.js `<Image>` styling calculations inside the main Navigation Bar and Employee Login page layout with native HTML `<img>` elements, resolving the issue where logos were cut off at the bottom.
9. **Delivery**: Client downloads the PDF from their dashboard.
10. **Landing Page Integrations**: The "Submit Organisational Request" CTA on the public landing page now generates pre-filled emails (Gmail, Outlook, Default Mail) whose body matches the exact 8 data fields found in the client's internal "Request a Service" form (Service Category, Property Details, etc.).

## 5. Pending Work (What is next)

Outstanding items in **priority order**:

### High Priority — In Progress
1. **Default Template End-to-End Verification**: The 14-section `ReportBuilder.tsx` is complete, perfectly balanced, and on GitHub (branch: `main`). The user should verify locally or deploy to Vercel and check:
   - Location Map section (Google Maps iframe auto-loads from address field)
   - PDF download — verify all 14 sections render correctly with perfectly centered text and no footer overflow.
   - "Cancel Submission (Pull back to Draft)" button — check status refreshes correctly
   - All new `<select>` dropdowns save and restore correctly from the JSON `Report.data`

### Medium Priority — After Verification (FUTURE WORK)
2. **Organizational/Corporate Templates (Architecture & Rendering)**: The "Standard Individual" (default bank report) template is complete. The category config wizard supports choosing between "Individual" and "Organisation" templates 1-10. However, wizard choices currently have zero impact on the actual form or PDF output. 
   **Future Work Implementation Plan:**
   - *Phase 1: Named Organisation Templates*: Replace numbered templates with real named organisations (SBI, PNB, etc.) in the wizard and backend.
   - *Phase 2: Service-Aware Form Sections*: Conditionally show/hide form sections based on the selected service type (e.g., hide Building Valuation for Land Only).
   - *Phase 3: Organisation-Specific PDF Layouts*: Generate different PDF outputs per organisation (custom headers, disclaimers, field labels).
   - *Phase 4: Dynamic Template Management*: Allow managers to CRUD templates from the portal.
   **Deferred until the default template is fully verified by the user.**
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
> **ReportBuilder.tsx is large (~2400+ lines)**. When editing, be careful with the `generatePDFPages()` function. Inline styles in the HTML template strings must use valid CSS values — Tailwind classes do NOT work inside these strings.
> *Note on Alignment*: Do not rely on flexbox, native `vertical-align`, or `rowspan` inside standard `<tr>/<td>` elements for PDF generation, as `html2canvas` handles them poorly when rows are stretched. Add the `data-vcenter="1"` attribute to any `<td>` that needs vertical centering; the JS logic inside `handleGeneratePDF` will dynamically calculate and apply the correct padding before capture.
> *Note on Line Heights*: Always use explicit units (e.g. `line-height: 1.35em`) inside table cell CSS; unitless values like `1.15` are parsed incorrectly as `pixels` by the html2canvas engine, causing tables to collapse and overlap text lines.

> [!WARNING]
> **Do NOT add `OptionField` or `LandmarkField` back to the form render**. These components still exist in the file (kept for potential future read-only display use) but the form uses plain `<select>` and `<input>` elements. The 3-column blue-box display is for PDF output only.

> [!TIP]
> When modifying the UI, prioritize modern, premium aesthetics (glassmorphism, clean typography, subtle animations) without relying on Tailwind component libraries like Shadcn. Use raw Tailwind classes.

## 7. Recent Git Commits (for reference)
- `824655b` — fix: update organisational email template fields to match service request form
- `3e76b90` — feat: add search and status filter to My Projects page
- `ac4b53c` — fix: Restore cell layout heights to 1.35em to avoid html2canvas unitless line-height scaling bugs that overlap rows
- `24eb50f` — style: Reduce table cell padding by half and adjust line-height to 1.15 to ensure text is centered without overflow
- `d922b7c` — feat: Simplify address layout by removing city/town and district, renaming Address Line 1, adding pincode input, and listing all Indian states
- `188b2f1` — feat: setup configuration wizard banner, transparent table cells, projectCode autofill, and rectangular listings
- `816b355` — fix: use JS post-processing to dynamically calculate and apply vertical centering padding before html2canvas capture
- `994b91a` — fix: use rowspan for option rows to guarantee vertical centering works in html2canvas PDF (Superceded)
- `6d373bb` — fix: proper vertical alignment via direct td padding and remove broken flex space-between layout to fix PDF gaps
- `e335f93` — style: apply inner table centering to all rows for robust vertical alignment
- `75f3d33` — style: fix vertical alignment in option rows by using inner table layout and rebalance page sections to fix overflow
- `4ecdfa6` — feat: multi-assignment, rework flow, strict permissions, enquiry fixes
- `4cc5f7e` — refactor: revert form UI to compact dropdowns, keep 3-column layout for PDF only
- `250ddc4` — feat: auto-embed Google Maps in Location Map section from property address
