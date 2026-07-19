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
- **PDF Generation:** Client-side via `html2pdf.js`

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
4. **Drafting Flow (Updated)**: Report agent goes to "My Projects" (`/portal/my-projects`) to see pending work (complete with client contact/property details). They fill out a dynamic **10-section React form** (`ReportBuilder.tsx`). This matches the real-world Individual Client Bank Report template (property details, floor-wise depreciation calculations, Valuation Certificate auto-generated with `numberToWords`, and a property photo upload section).
   - *Crucial Update:* Temporary property images uploaded during drafting are saved in `temp-photos/${projectId}/` inside the `valuation-documents` bucket.
   - Agents do NOT generate the PDF. They only save drafts and submit the JSON data to the `Report` table. Status updates to `MANAGER_REVIEW`.
5. **Manager Preview, Editing & Finalization Flow (Updated)**: 
   - Manager reviews the drafted report via `ReportBuilder.tsx` on `/portal/projects/[id]`. The Manager can edit text fields and add/remove/replace photographs as needed.
   - Manager can preview the PDF natively in the browser without generating files.
   - Manager can "Send for Rework" (reverts status) or "Finalize & Generate PDF".
6. **PDF Generation & Cleanup (Updated)**: PDF generation is fully implemented on the **Client-Side** (using `html2canvas` and `jspdf`), triggered during the **Manager Finalization** step to save server resources. 
   - It captures the HTML layout (including a dedicated Photographs page at the end), paginates it, downloads it locally for the manager, and uploads the final PDF blob to the `reports/pdfs/` folder in the `valuation-documents` bucket.
   - **Automated Cleanup:** Upon finalization, the code automatically deletes all temporary property images inside the `temp-photos/${projectId}/` folder from Supabase Storage, and clears the `propertyImages` array inside the database's JSON report data, preventing any wasted storage space.
7. **Preview & Precision Adjustments (Updated)**: 
   - Report Agents and Managers can natively preview the PDF in a new tab ("Preview PDF") or directly download it locally ("Download PDF") before finalization.
   - Calculation engine updated to retain exact float values for accurate `Realizable Value` and `Distress Sale Value`.
   - Managers and Report Agents can dynamically adjust the Realizable Value percentage (default 90%) and Distress Sale Value percentage (default 80%) via explicit input boxes.
8. **Delivery**: Client downloads the PDF from their dashboard.

## 5. Pending Work (What is next)

If you are picking up work on this project, here are the outstanding items:

1. **Organizational/Corporate Templates**: The "Standard Individual" (Bank Reports) template is now completed. The user will provide data layouts for specific organizational/corporate clients (SBI, PNB, etc.). You will need to create conditional logic or separate React components for these specific forms and adjust the PDF generation to match their layouts.
2. **Supabase Storage Lifecycle Policy**: The user requested that final PDFs be stored in Supabase for only 3-6 months to preserve the 8GB storage limit. A cron job, Edge Function, or Supabase Storage bucket lifecycle policy needs to be implemented to automatically delete old PDFs.
3. **Email Automation**: Connect Gmail API or Nodemailer to send automated notifications (e.g., "Your request was received", "Your PDF is ready for download").
4. **Local Archiving Script**: Create a separate Node.js script intended to run locally on the user's office PC to automatically download and archive PDFs older than 3 months from Supabase to their local hard drive to save cloud storage costs.

> [!IMPORTANT]
> **Vercel Redirects & NextAuth**: `AUTH_URL` should NOT be set to `http://localhost:3000` in the Vercel environment variables, as it causes NextAuth relative paths to crash in production. To bypass this, logout redirects currently use absolute production URLs (e.g., `https://smohantyassociates.vercel.app/`).

> [!TIP]
> When modifying the UI, prioritize modern, premium aesthetics (glassmorphism, clean typography, subtle animations) without relying on Tailwind components like Shadcn unless explicitly requested. Use raw Tailwind classes.
