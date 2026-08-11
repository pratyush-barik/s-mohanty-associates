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
- **PDF Generation:** Client-side via `pdf-lib` (Native PDF generation engine, replacing the old `html2canvas` HTML screenshot approach)
  - **Renderers:** `pdf-general-renderer.ts` (General builder), `pdf-ibbi-renderer.ts` (IBBI builder), `pdf-it-renderer.ts` (IT builder). All renderers include `sanitizeText()` which strips newlines, bullets (U+2022→`-`), smart quotes, em/en-dashes, ellipsis, rupee sign (₹→`Rs.`), and any non-WinAnsi characters before passing text to `pdf-lib`'s `page.drawText()`.
  - **Table Layout:** `drawSimpleRow()` renders as a proper **two-column table** (40% label with background / 60% bold value) matching sample IBBI reports. `drawDataTable()` handles multi-column dynamic tables.

## 2. Architecture & Data Storage

### Database Schema (Prisma)
The database uses PostgreSQL. The schema is defined in `prisma/schema.prisma`.
Key Models:
- **`User`**: Contains all users. Differentiated by the `role` enum (`CLIENT`, `FIELD_EMPLOYEE`, `REPORT_EMPLOYEE`, `MANAGER`, `OWNER`).
- **`Project`**: The core entity. Tracks a valuation job from start to finish. It has relations to the client, the assigned manager, field employee, and report employee. Controlled by a strict `status` enum (e.g., `PENDING_REVIEW`, `INSPECTION_IN_PROGRESS`, `MANAGER_REVIEW`, `COMPLETED`). Has a `source` field (`EnquirySource` enum) tracking where the project originated.
- **`ServiceRequest`**: The initial intake form data submitted by the client (property details, contact info). 1-to-1 with a Project. Has `enquiryId` linking to the originating enquiry (for portal signup and organised email requests).
- **`Inspection`**: Data filled out by the Field Employee during site visits (status, location, notes).
- **`Report`**: The actual valuation data. Contains a `data` JSON column to flexibly store dynamic report data (Market Value, Distress Value, etc.).
- **`Enquiry`**: Public enquiries — tracking website contacts, direct emails, and portal signups. Has a `ticketNumber` (SMA-XXX format), `source` (`EnquirySource`: `WEBSITE`, `EMAIL`, `PORTAL_SIGNUP`), `status` (`EnquiryStatus`: `NEW`, `WAITING_FOR_CLIENT`, `IN_PROGRESS`, `CLOSED`), and linked `projectId`/`serviceRequestId`. Supports threaded messages (`EnquiryMessage`) and file attachments (`Document`). Auto-closes when report is finalized with no rework; reopens when sent for rework or client requests it.
- **`EnquiryMessage`**: Threaded messages within an enquiry.
- **`Document`**: File attachments linked to enquiries or service requests, stored in Supabase `enquiry-files` bucket. Public enquiries and service-request-sourced enquiries both have their files visible in the manager/owner ChatInterface..

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
4. **Drafting Flow (Updated — August 2026)**: Report agent goes to "My Projects" (`/portal/my-projects`) to see pending work. The report builder is dynamically routed in `src/app/portal/reports/[projectId]/page.tsx` based on the chosen client template:

   - **A. General Customer (`GeneralReportBuilder.tsx`)**: This is the default 14-section dynamic form used for standard individual clients, fully matching the real-world Individual Client Bank Report template (based on the HDFC/SBI IBBI valuation sample PDF).
   - **B. IBBI Organisation (`IBBIReportBuilder.tsx`)**: A completely distinct report builder used when `organisationTemplate === 'IBBI_IVS'`. It contains 15 statutory IBBI sections (Objective, Description, Town Planning, Legal, Infrastructure, Socio-Env, Marketability, Engineering, Valuation, Photos/Maps, Assumptions). Includes:
      - Comprehensive **Cover Page** and auto-generated **Table of Contents**.
      - A distinct PDF rendering layout where the Valuation Certificate appears *before* Section 1.
      - Auto-generated statutory text for Sections 1–3 in the PDF.
      - **Section 4** with introductory prose paragraph and sub-numbered rows (4.1, 4.2, 4.3, 4.8, 4.10, 4.13-4.16) matching the sample document.
      - Sub-sections 13.1 to 13.6 outlining Valuation Approaches & Methodology.
      - A dynamic "Add Row" plot-by-plot valuation table in Section 13, seamlessly integrating with the Excel Annexure feature.
      - **Section 15: Assumption & Limitation** — exact verbatim text from sample reports (paragraph-based, not bullet list).
      - **Conclusion** — exact sample wording including market value philosophy, dynamic property/owner reference, and bold value lines.
      - Expanded **Declaration and Undertaking** containing **20 statutory clauses** extracted from real sample reports (citizenship, PAN card, IVS compliance, IT Act references, Model Code of Conduct, etc.).
      - **Annexure I: General Principles and Limiting Conditions** — boilerplate page covering Confidentiality, Use of Report, Source of Information, Legal Title, Town Planning, Leases, Development Agreements, Site Surveys, Structural Surveys.
      - **Annexure II: General Assumptions** — boilerplate page with 6 standard assumption paragraphs.
      - Signature blocks on Conclusion, Declaration, and Annexure II pages.
   - **C. Income Tax / Capital Gains (`IncomeTaxReportBuilder.tsx`)**: A specialized builder for IT/Capital Gains valuations (when `organisationTemplate === 'INCOME_TAX_CAPITAL_GAINS'`), featuring custom fields for retro-valuation, indexation, and specific statutory sections under IT rules.

   **Shared Design Decisions across ReportBuilders:**

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
   - **Section 14 – Location Map:** Live embedded Google Maps iframe (auto-reads from property address in Section 1 or lat/long coordinates). Manual screenshot upload for PDF inclusion (iframes cannot be captured by html2canvas).
   - **Section 15 – Annexure (August 2026):** Allows uploading Excel/CSV files containing complex tabular data (e.g., multiple addresses). Toggled via a switch in Section 1 next to the Address field. When enabled, address fields are hidden, the PDF/HTML preview replaces the address text with a reference to the Annexure (e.g. "Details are provided in Annexure A"), and the parsed Excel data is dynamically rendered as a data table at the very end of the report document. Uses `xlsx` library for client-side parsing.    **Key Design Decisions in ReportBuilder:**
    - **Form UI:** All option-type fields use compact `<select>` dropdowns and `<input>` fields — NOT bulky 3-column boxes. Fast and space-efficient for data entry.
    - **PDF Output:** Uses a 3-column table pattern (Column 1: Label in blue | Column 2: All options listed | Column 3: Selected value in bold) to match the sample bank valuation report format.
    - **PDF Layout & Alignment:** To counter rendering bugs in `html2canvas` (which ignores CSS `vertical-align` and flexbox on table cells), the code uses a **JavaScript post-processing technique**. Before capture, it measures the rendered row height vs content height of cells marked with `data-vcenter="1"` and dynamically injects precise pixel padding to force vertical centering. The PDF pages are also balanced (e.g. Section 3 moved to Page 3) and page-level flex wrappers were removed to completely eliminate overflow and large gaps.
    - **Cell Height & Overlap Fix (July 2026):** Halved vertical cell paddings (reduced to `4.5px 8px` on general rows, `6px 8px` on section headers, and `2.5px 6px` on building table details) and set explicit `line-height: 1.35em` relative layout constraints inside all table elements. This prevents html2canvas from interpreting unitless heights as pixel coordinates (which originally caused subsequent rows to collapse and render on top of each other) while centering the text nicely within cells.
    - **3-Step Setup Wizard:** Implemented a configuration wizard overlay that prompts the Report Agent to select:
       1. *Client Category*: Individual client vs. Organisation/Bank (supporting templates 1-10).
       2. *Service*: Preloaded with the company's 13 official services.
       3. *Subject*: Dynamically filtered based on the selected service (e.g., Residential Land under Land Valuation).
       - *Browser History popstate Sync (August 2026)*: Synchronized the Setup Wizard steps with the browser's history log (`window.history.pushState` & `popstate` listener). Using the browser's forward/back buttons or the on-screen "← Back" button now navigates backward through wizard steps rather than redirecting the user out of the page.
       - *Centered Flex Layout for Selections*: Replaced hardcoded CSS grid columns with a flex-wrap container (`flex flex-wrap gap-3 justify-center`) and constrained item widths (`flex-1 min-w-[200px] max-w-[280px]`) so that selection cards wrap and stretch dynamically, centering themselves instead of leaving empty columns on the right when items are few.
       - *Sticky Section Navigator Sidebar*: Changed the `FloatingNavigator` (sections list) from `fixed right-4` to a `sticky top-24 shrink-0 w-[160px] z-40` flex sibling inside the editor layout. Replaced the parent page padding with clean inline column separation, completely preventing forms from sliding under the sections panel on narrow screens.
    - **Adaptability Banner & Dynamic Titles:** Configured an active settings summary banner at the top of Section 1 of the report editor that highlights these selected parameters with a "Change Parameters" trigger to re-run the configuration wizard at any time. Report document titles in the final PDF compile dynamically based on the chosen category, service, and subject.
    - **Semi-Transparent Table Accents:** Replaced solid `#DBE6F0` (light blue labels) and `#DDE9F6` (lighter options) backgrounds in the PDF generator with semi-transparent `rgba` equivalents (approx. 55% transparency) to match the custom background templates elegantly when printed.
    - **Simplified Address Schema & States Datalist:** Replaced the redundant list of address fields (city, district, khasra, mouza, tahasil, etc.) with a clean structure: Address Line 1, State, and Pincode. The State field uses a searchable datalist prefilled with all 36 Indian states and Union Territories. All values serialize dynamically into PostgreSQL via Prisma client JSON mutations without schema table alterations.
    - **State:** `ReportFields` interface holds ~50+ fields. All saved as JSON into `Report.data` via `saveReportDraft` server action.
    - **PDF Stack:** `html2canvas` + `jsPDF`. The `generatePDFPages()` function (around line 668) builds custom HTML template strings with inline styles for each page. Letterhead loaded from `/letterhead.png`. **Tailwind classes do NOT work inside these HTML strings — use only inline styles.**
    - **Pull Back to Draft:** Report Agent can cancel their submission via `cancelReportSubmission` server action. After all status-changing operations (submit, cancel, rework, finalize), `router.refresh()` is called so the client component re-renders with the correct status from the server without a manual page reload.
    - **`OptionField` / `LandmarkField` components** still exist in the file but are **NOT used in the form render** — they are kept only in case they are needed for future read-only display modes. Do NOT add them back to the form.

7. **Photo Bucket & Evidence Workflow (July 2026)**:
   - Field Agents upload evidence (photos) via the Inspection dashboard directly into a centralized "Photo Bucket" (`bucket_images` DB table + Supabase Storage). Features a lightbox and grid UI.
   - Report Agents access this bucket natively inside `GeneralReportBuilder.tsx` via the `BucketPicker` modal to select photos for Property Images, Sketch Map, and Location Map.
   - *Strict Constraints & RBAC*:
     - Max 10MB per photo, restricted to images (JPEG/PNG/WebP), max 30 photos per project, min 1 required to mark inspection as COMPLETED.
     - Only assigned agents and managers can upload/delete/view.
     - **Lifecycle Locks:** Bucket is locked (read-only for agents) when the project is in `MANAGER_REVIEW` or `COMPLETED`. If a manager sends it back for rework, it unlocks.
     - **Drafting Lock:** Prevents deletion of photos actively used in the Report Draft to avoid broken PDF images.
   - *Auto-Cleanup*: Serverless CRON job (`/api/cron/cleanup-buckets`) runs daily to permanently delete raw images and metadata for projects that have been `COMPLETED` for > 48 hours.
8. **Manager Preview, Editing & Finalization Flow (Updated)**:
   - Manager reviews the drafted report via available report builders. Can edit text fields and add/remove/replace photographs as needed.
   - Manager can "Send for Rework" which opens a prompt to input specific rework instructions (reverts status to REPORT_DRAFTING) or "Finalize & Generate PDF".
   - The Report Agent will see the Manager's rework comments highlighted at the top of the form when they resume drafting.
9. **PDF Generation & Cleanup (Updated)**: PDF generation is fully implemented on the **Client-Side** natively using `pdf-lib`, triggered during Manager Finalization.
    - It directly draws tables, text, and images onto PDF coordinates using dedicated renderers (`src/lib/pdf-general-renderer.ts`, `pdf-ibbi-renderer.ts`, `pdf-it-renderer.ts`), paginates automatically, downloads locally for the manager, and uploads the final PDF blob to `reports/pdfs/` in the `valuation-documents` Supabase bucket.
    - **Automated Cleanup:** Upon finalization, all temporary property images in `temp-photos/${projectId}/` are deleted from Supabase, and the `propertyImages` array in the database JSON is cleared.
 10. **Client Rework Flow**: Clients can request changes to their finalized reports from their dashboard. The project status reverts to `MANAGER_REVIEW`, and the manager receives a rework comment message.
11. **Public Enquiries Ticketing System**: Website contact form submissions and direct emails are tracked as separate tickets (Enquiry model) with `ENQUIRY_FILES` Supabase bucket for attachments. The Employee Portal has a dedicated **Public Enquiries** nav item (navigates to `/portal/enquiries`) with:
    - **Enquiry List** table: shows ticket number, source badge (🌐 Website / 📧 Email / 🔐 Portal Signup), linked project code, status, date, and search/filter controls.
    - **Enquiry Detail** page: threaded chat interface (`ChatInterface`) with source badge, file attachment section (manager/owner can view and download all attachments in-app), and close ticket button.
    - **Tabular views**: Filter by source type in the EnquiryList. Columns show source icons (📧 Gmail, 🌐 Website, 🔐 Portal Signup).
    - Tickets are linked to ServiceRequests (via `serviceRequestId`) and Projects (via `projectId`) so managers can see which enquiries became active projects.
    - Auto-close behaviour: when a report is finalized with no rework needed, the linked enquiry ticket auto-closes. New messages on closed tickets create a new ticket automatically.
 12. **Navigation & Layout Styling Updates (July 2026)**:
    - Auth pages (Login, Register, Forgot Password) standardized to a "Floral White" (`#FFF9F0`) theme.
    - Footer logo container updated to a bone white pill-shape layout.
    - Portal navigation labels updated — "My Reports" → "My Projects".
    - My Projects listing page layout transformed from block cards into sleek, horizontal, inline rectangular list rows.
    - Report Agent's "My Projects" page now includes exact filtering options (search bar, Pending/Completed/All tabs) matching the Field Agent's workflow.
    - Client Portal navigation compacted to prevent layout wrapping and height growth after login.
 13. **Dynamic Report Builder (Sections 7-9)**: The Report Builder dynamically adjusts Sections 7 (Building Valuation), 8 (Land Valuation), and 9 (Abstract) based on the chosen subject type. If the subject is an `Apartment` or `Flat`, the Land section is completely hidden, Section 7 is renamed to Apartment Valuation, and the Abstract displays only the single total value instead of a split Land+Building breakdown.
 14. **Delivery**: Client downloads the PDF from their dashboard.
 15. **Landing Page Integrations**: The "Submit Organisational Request" CTA on the public landing page now generates pre-filled emails (Gmail, Outlook, Default Mail) whose body matches the exact 8 data fields found in the client's internal "Request a Service" form (Service Category, Property Details, etc.).
 16. **Security Hardening (August 2026)**: Comprehensive security audit response addressing vulnerabilities identified by a penetration tester:
     - **Generic Error Messages**: All login failures return identical `"Invalid email or password"` — no account enumeration possible.
     - **Strong Password Policy**: 12+ characters, uppercase, lowercase, number, special character required. Top 100 common passwords blocked. Bcrypt cost factor increased to 12.
     - **Password Strength Meter**: Real-time visual feedback on registration page with 5-bar color-coded strength indicator and per-criterion checkmarks.
     - **Rate Limiting**: In-memory per-IP (5 attempts/15 min) and per-account (10 attempts/hour) rate limiting on login.
     - **Account Lockout**: 5 consecutive failed login attempts locks the account for 30 minutes. Auto-resets on successful login.
     - **Security Headers**: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` added to all responses via `next.config.ts`.
     - **Audit Logging**: `SecurityLog` model tracks all login attempts (success/failure), account lockouts, and rate limit hits with IP address and timestamp.
     - **Prior fixes by teammate**: HTML escaping (XSS), OTP bypass removal, cron auth, input validation (Zod `ProfileUpdateSchema`).
 17. **Change Password Feature**: Both client (`/dashboard/profile`) and employee (`/portal/profile`) profiles now include a red-themed "Change Password" button with:
     - Real-time password strength meter (5-bar color-coded + per-criterion checklist).
     - Two-step OTP verification: after validating current/new password, a 6-digit verification code is emailed to the user (sent from the owner's SMTP address). Code expires in 5 minutes with resend capability.
     - Enforces all password policy constraints (12+ chars, uppercase, lowercase, number, special char, common deny-list, must differ from current).
     - Shared reusable component: `src/components/ChangePasswordForm.tsx`.
     - Password changes are logged to `SecurityLog` with `PASSWORD_CHANGED` event.
 18. **ML / AI Assist Integration (August 2026)**: Full scaffolding for order-independent AI-powered valuation field predictions:
     - **Prediction Engine** (`src/lib/ai/predictor.ts`): **Now data-driven** — loads trained statistical weights from `src/lib/ai/model_weights.json` instead of using hardcoded heuristic values. Analyzes whichever fields are already filled (any section, any order) and predicts values for all remaining empty fields. Supports: estimated future life, quality of construction, floor rates, depreciation %, land rates, marketability, realizable/distress %, replacement cost. Predictions show `source: 'ml'` when trained data is used, falling back to `source: 'heuristic'` only when no trained data exists for a given input combination.
     - **Model Weights** (`src/lib/ai/model_weights.json`): JSON file containing grouped statistical lookup tables (medians, modes, distributions) trained from 150 rows of Odisha property valuation data. Imported at build time — no runtime API calls needed.
     - **LLM Provider Adapter** (`src/lib/ai/provider.ts`): Swappable backends (Groq, Together AI, OpenRouter, Mock). Change provider by setting `LLM_PROVIDER` env var. Generates optional AI narrative/analysis.
     - **API Endpoint** (`src/app/api/valuation-assist/route.ts`): Auth-protected POST endpoint. Receives current fields state, returns predictions + optional LLM narrative.
     - **AI Assist Panel** (`src/components/AiAssistPanel.tsx`): Persistent right-side sidebar with accept/dismiss per field, "Accept All" bulk action, confidence indicators, auto-refresh (debounced 2s). Groups suggestions by section.
     - **ReportBuilder Integration**: Split flex layout with sidebar. Feature-flagged behind `NEXT_PUBLIC_AI_ASSIST_ENABLED` env var (currently `false`/hidden).
     - **Schema**: `ValuationPrediction` model added for tracking predictions vs. final values (future retraining).
     - **To activate UI**: Set `NEXT_PUBLIC_AI_ASSIST_ENABLED=true` in `.env` / Vercel env vars.
     - **To add LLM narrative**: Set `LLM_PROVIDER=groq` and `LLM_API_KEY=<key>` in env.
 19. **End Project Feature (August 2026)**: Managers/Owners can permanently terminate a project before natural completion (e.g., client unresponsive, payment issues).
     - **UI**: Compact red header button in the Project Dashboard (the full-page danger-zone card was removed for cleanliness).
     - **Validation**: Requires typing a reason (max 30 words, with a live counter) and exactly confirming the project code to prevent accidental clicks. If the report was already delivered (COMPLETED), the reason field is skipped.
     - **Backend/Actions**: Sets status to `TERMINATED`, creates a project message log, triggers an email notification to the client (best-effort), and logs a `PROJECT_TERMINATED` event in the `SecurityLog`.
     - **Filtering**: Terminated projects are excluded from active workload counts but remain visible in historical lists with a red `⛔ TERMINATED` badge and permanent banner.
 20. **Manager Projects Page Revamp (August 2026)**: Added advanced filtering to `/portal/projects` (client-side component `ManagerProjectsClient.tsx`).
     - Includes a live search bar by Project Code.
     - Tabs for `Pending`, `Completed`, and `All`.
     - Selecting `Completed` reveals a sub-toggle for `All / Completed / Terminated` for granular control.
 21. **ML Training Infrastructure & Data Pipeline (August 2026)**: Built the complete scaffolding for training ML models and auto-collecting data.
     - **Directory**: `ML_integration/` (gitignored to protect data). Contains `data/raw`, `data/processed`, `models`, `notebooks`, and `scripts`.
     - **Export Script**: `ML_integration/scripts/export_data.ts` written to extract ALL 97 report fields across 10 sections from `completed_reports` in Supabase into clean CSV format, alongside `project_metadata.csv` and `predictions_vs_actual.csv`.
     - **Training Data Collector**: `src/lib/training-data.ts` auto-appends a new row to a single persistent `train_model.csv` file in Supabase Storage (`valuation-documents/ml-training/train_model.csv`) every time a project is marked as `COMPLETED`. No manual export needed for continuous data collection.
     - **Dummy Data Generator**: `ML_integration/scripts/generate_dummy.js` produces 150 rows of realistic Odisha property valuation data with proper correlations between locality class, rates, construction quality, marketability, structure type, and age. Uses weighted distributions and location-specific rate multipliers for 10 Odisha cities.
     - **Model Trainer**: `ML_integration/scripts/train_model.js` reads the CSV, builds grouped statistical lookup tables (medians, modes, percentiles, distributions) across 10 categories, and exports `src/lib/ai/model_weights.json`.
     - **Retraining**: To retrain with real data, replace `ML_integration/data/raw/train_model.csv` and run `node ML_integration/scripts/train_model.js`. Commit the updated `model_weights.json`.
     - **Documentation**: Extensive `ML_integration/README.md` defining target variables (e.g., predicting `distress_pct` via XGBoost), data requirements, and the full 97-column schema.
 22. **Generic Cron Runner Framework + Terminated Project Cleanup (August 2026)**:
     - **Generic Framework** (`src/lib/cron/runner.ts`): Reusable `runCronJob(jobName, tasks[], request)` function. Every cron route just defines a list of `CronTask` objects (name + async `run()`) and calls it. The runner handles: Bearer token auth (`CRON_SECRET`), per-task error isolation (one task failure does NOT abort others), per-task timing, structured result logging, and returns a full `CronRunResult` JSON with success/skip/error counts.
     - **Terminated Project Cleanup** (`/api/cron/cleanup-terminated-projects`): Fires daily at 2:00 AM. Finds all `TERMINATED` projects older than 24 hours and runs 4 sequential tasks: (1) Find eligible projects, (2) Delete photo bucket images from Supabase Storage + DB, (3) Delete employee↔client chat messages (`ProjectMessage`) + their document attachments, (4) Delete remaining project-level document DB references.
     - **Existing cron refactored**: `cleanup-buckets` cron now also uses the generic framework.
     - **`vercel.json` updated**: All 3 crons registered — `cleanup-buckets` at midnight, `cleanup-terminated-projects` at 2 AM, `fetch-emails` every 15 min.
     - **How to add a new cron**: Create `/api/cron/<name>/route.ts`, define `CronTask[]`, call `runCronJob('name', tasks, request)`, add path + schedule to `vercel.json`.
 23. **Trained ML Predictor Overhaul (August 2026)**: Replaced the entire hardcoded heuristic prediction engine with a data-driven model.
     - **Before**: All prediction values (rates, quality, marketability, etc.) were hardcoded constants in if-else chains. Confidence values were fixed.
     - **After**: Predictions come from `model_weights.json` — grouped statistical lookups trained on 150 rows of Odisha property data. Includes:
       - Govt land rate medians by locality class (6 groups)
       - Market rates by locality × vicinity (18 groups)
       - Construction quality modes by structure type × age bucket (23 groups)
       - Marketability modes by locality × road width (17 groups)
       - Realizable/distress % medians by marketability (4 groups each)
       - Structure total life spans by type (8 groups)
     - **Confidence scaling**: Confidence now scales with sample count — more training data for a group → higher confidence. Uses `trainedConfidence()` function.
     - **Graceful fallback**: If no trained data exists for a particular combination, falls back to the original heuristic logic but with lower confidence and `source: 'heuristic'` tag.
     - **Zero runtime cost**: Model weights are imported as a static JSON file at build time — no API calls, no model loading latency.
 24. **PDF Formatting & TOC Enhancements (August 2026)**:
     - **Dynamic Table of Contents**: The IBBI report generator now tracks page numbers dynamically during rendering. The TOC is formatted with dotted leaders (`...`) and precise right-aligned page numbers. All TOC text (including sub-sections like 1.1) is strictly bold and uniform in size.
     - **Global Page Numbers**: Added bottom-center page numbers to all generated PDFs (IBBI, General, and IT renderers) starting from page 2.
     - **Dynamic Image Sizing**: Improved the `drawImagePair` method across all renderers to calculate exact image aspect ratios instead of fixed heights, eliminating awkward vertical whitespace and preventing page spillage.
     - **Image Captions**: Added explicit input fields for captions on all property photographs in the form. These captions render boldly below each image pair in the final PDF (`Figure 1 - CAPTION`).

## 5. Pending Work (What is next)

Outstanding items in **priority order**:

### High Priority — In Progress
1. **IBBI-IVS Template End-to-End Verification**: The `IBBIReportBuilder.tsx` component is built and functionally complete (with dynamic valuation rows and annexures), but the generated PDF layout needs to be battle-tested with real data. The user should verify:
   - That spacing, pagination, and tables in the IBBI PDF (especially the Valuation Certificate layout and the Plot-by-Plot valuation table) look perfect.
   - Test the flow from the Setup Wizard -> changing to IBBI_IVS -> reloading -> saving -> previewing PDF.

2. **Default Template End-to-End Verification**: The 14-section `GeneralReportBuilder.tsx` is complete, perfectly balanced, and on GitHub (branch: `main`). The user should verify locally or deploy to Vercel and check:
   - Location Map section (Google Maps iframe auto-loads from address field)
   - PDF download — verify all 14 sections render correctly with perfectly centered text and no footer overflow.
   - "Cancel Submission (Pull back to Draft)" button — check status refreshes correctly
   - All new `<select>` dropdowns save and restore correctly from the JSON `Report.data`

### Medium Priority — Future Features (Photo Bucket)
2. **Watermarking & Timestamping (Evidence Integrity)**:
   - *Priority:* High (Critical for Valuation Compliance)
   - Automatically stamp the **Date, Time, and GPS Coordinates (Latitude/Longitude)** on the image itself. Proves the field agent was actually physically present. Should be done client-side before upload or via serverless function.
3. **Photo Categorization / Tagging**:
   - Require Field Agents to select a category when uploading (e.g., `Front Elevation`, `Interior`, `Sketch Map`, `Location`). Allows Report Agent to easily filter the Photo Bucket.

### Lower Priority — Future
4. **Organizational/Corporate Templates (Architecture & Rendering)**: The "Standard Individual" (default bank report) and "IBBI-IVS" templates are now built. The category config wizard supports choosing between "Individual" and "Organisation" templates 1-10. 
   **Future Work Implementation Plan:**
   - *Phase 1: Named Organisation Templates*: Replace numbered templates with real named organisations (SBI, PNB, etc.) in the wizard and backend.
   - *Phase 2: Add more Report Builders*: Similar to `IBBIReportBuilder`, build dedicated components for other unique bank formats.
   - *Phase 3: Dynamic Template Management*: Allow managers to CRUD templates from the portal.
5. **Remove the overlay / coming-soon banner** on `https://smohantyassociates.vercel.app/` (the public-facing landing page).
6. **Supabase Storage Lifecycle Policy**: PDFs should auto-delete after 3–6 months to stay within 8GB limit. Implement via Supabase Edge Function, cron job, or bucket lifecycle policy. (Note: Photo Bucket auto-cleanup is already implemented natively).
7. **Email Automation**: Automated notifications via Gmail API or Nodemailer (e.g., "Your request was received", "Your PDF is ready for download").
8. **Local Archiving Script**: Node.js script to run on the office PC to automatically download and archive PDFs older than 3 months from Supabase to a local hard drive.
9. **Repo Sync**: Pull latest changes from teammate's fork (`https://github.com/pratyush-barik/s-mohanty-associates/`) and merge with current `main`, using this document as the source of truth.


## 6. Critical Notes & Gotchas

> [!IMPORTANT]
> **Vercel Redirects & NextAuth**: `AUTH_URL` should NOT be set to `http://localhost:3000` in Vercel environment variables — it causes NextAuth relative paths to crash in production. Logout redirects currently use absolute production URLs (e.g., `https://smohantyassociates.vercel.app/`).

> [!IMPORTANT]
> **Location Map in PDF**: Section 14 uses a Google Maps `<iframe>` for live preview (auto-loaded from property address). `pdf-lib` **cannot capture iframes**. The user must manually take a Google Maps satellite screenshot and upload it in the "Screenshot for PDF" upload within Section 14. Only the uploaded image appears in the PDF.

> [!WARNING]
> **GeneralReportBuilder.tsx and pdf-report-renderer.ts are large**. When editing the PDF output, you are working directly with `pdf-lib` coordinate math in `pdf-report-renderer.ts`.
> *Note on Alignment*: Text wrapping and pagination are handled manually by measuring string widths (`StandardFonts.Helvetica`) and cursor tracking.
> *Note on Currency*: `pdf-lib` using standard Helvetica cannot encode the Indian Rupee symbol (`₹`). The symbol will throw a `WinAnsi cannot encode` error. Always fallback to `Rs.` or `INR` in text drawn to the PDF!
> *Note on Orphaned Headings*: High-level drawing methods like `drawSectionHeader` use a keep-with-next margin (e.g. 60 points) when checking for page breaks to prevent headings from appearing alone at the bottom of a page.

> [!WARNING]
> **Do NOT add `OptionField` or `LandmarkField` back to the form render**. These components still exist in the file (kept for potential future read-only display use) but the form uses plain `<select>` and `<input>` elements. The 3-column blue-box display is for PDF output only.

> [!TIP]
> When modifying the UI, prioritize modern, premium aesthetics (glassmorphism, clean typography, subtle animations) without relying on Tailwind component libraries like Shadcn. Use raw Tailwind classes.

## 7. Recent Git Commits (for reference)
- `latest` — feat(PDF): add bottom page numbers, format TOC with dot leaders and dynamic page numbers matching Word template
- `previous` — feat: complete IBBIReportBuilder implementation with dynamic valuation rows and PDF rendering
- `previous` — fix(ReportBuilder): resolve PDF table overflow by breaking words and handling full-width rows, and fix missing address in Valuation Certificate
- `previous` — feat(ReportBuilder): add Annexure parsing (xlsx) and rendering in PDF/HTML preview tables
- `previous` — feat(ReportBuilder): add Annexure toggle in Section 1 and Section 15 with dynamic annexure cards and Excel upload
- `previous` — feat(ReportBuilder): synchronize wizard steps with browser history popstate
- `previous` — style(ReportBuilder): center selection grids and make FloatingNavigator sticky
- `previous` — style(ReportBuilder): remove double padding to fix FloatingNavigator overlap
- `previous` — style(ReportBuilder): use flexbox layout with wrap and stretch for bank items
- `previous` — style(ReportBuilder): use auto-fit for bank and category grids to prevent empty space
- `previous` — style(ReportBuilder): fix bank selection layout and text overflow
- `previous` — feat(ReportBuilder): show organisation parameters in banner
- `previous` — feat: replace hardcoded heuristic predictor with trained ML model from 150-row Odisha property dataset
- `previous` — docs: add Training Data Collector to ML pipeline docs
- `previous` — feat: auto-append project data to persistent train_model.csv upon completion
- `previous` — feat: add generic cron runner framework + terminated project cleanup job (photos + chat data, 24h interval)
- `previous` — docs: update AI_HANDOVER.md and ML_integration pipeline setup with 97 column export script
- `previous` — feat: add search, Pending/Completed/All filter with Completed sub-toggle to manager projects page
- `previous` — fix: resolve textarea losing focus by inlining modal JSX instead of nested function component
- `previous` — fix: replace dropdown+notes with simple 30-word message box in End Project modal
- `previous` — style: remove Danger Zone end project card from bottom of page
- `previous` — feat: ML/AI Assist integration with predictor, LLM adapter, API route, sidebar panel (feature-flagged)
- `0826206` — security: fix SQL injection audit findings - cron auth, OTP bypass, input validation, HTML escaping
- `0b598e3` — fix: correct Prisma relation names in enquiry detail page (messages→enquiries, serviceRequest→serviceRequests)
- `263d6e6` — feat: remove create manual case button from manager dashboard
- `880be3c` — style: rename Client to Enquirer and remove Project column in Public Enquiries table
- `2d64a97` — feat: dynamically adjust report sections 7-9 for Apartment/Flat vs Land+Building
- `e50c2dc` — fix: prevent text overflow in service requests grid on owner portal
- `4bf5ce5` — fix: correct source field for manual cases and remove invalid Prisma include
- `20b0d90` — style: update register and forgot-password pages to match floral white light theme
- `88f4cc9` — style: reduce height and padding of footer logo pill to match tight reference image
- `c218195` — fix: prevent navbar height growth after login by compacting nav links
- `03e36f3` — feat: implement Photo Bucket lifecycle locks and auto-cleanup
- `e6bcc3f` — feat: add Photo Bucket data and lifecycle constraints
- `a5b4c1c` — fix: enforce strict RBAC for Photo Bucket actions
- `ac4a2a5` — feat: integrate Photo Bucket into Report Agent workflow
- `8f6c5bb` — feat: build robust Field Agent Photo Bucket UI with camera/gallery uploads
- `b5bce8a` — chore: replace default favicon with smohantyassociate_symbol.png
- `a448f23` — style: apply background color to the second column in proximity and landmark tables
- `305f7a0` — style: left align floor table headers and reduce font size of units in brackets
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
- `d37005f` — feat: ticketing system with email attachments, source tracking, and enquiry-project linking
- `d343bf1` — fix: revert "Cases" back to "Public Enquiries" nav label (Public Enquiries ≠ Service Requests/Cases)
- `d343c01` — fix: service request active/pending tab 404 error
- `5b8c534` — fix(IBBI-PDF): match exact sample - Declaration(20 clauses), Conclusion, Section 15, Annexure I/II boilerplate, Section 4 numbering
- `fbb6acb` — fix(pdf): add sanitizeText to strip newlines, bullets, smart quotes and non-WinAnsi chars before drawText
- `051d898` — fix(pdf): sanitize ALL text paths - drawRichTextAt and measureRichTextHeight missing sanitization causing WinAnsi 0x000a crash
- `latest` — feat(pdf): convert drawSimpleRow from single-column to two-column table layout (Label | Value) matching sample IBBI reports
