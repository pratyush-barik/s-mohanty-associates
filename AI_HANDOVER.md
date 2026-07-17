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
- **`Report`**: The actual valuation data. Contains a `fields` JSON column to flexibly store dynamic report data (Market Value, Distress Value, etc.).

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
   - Login: `/auth/login`
2. **Employee Portal (`/portal`)**: For staff (Owners, Managers, Field Agents, Report Analysts).
   - Login: `/auth/employee-login`
   - **Role-Based Dashboards:** Upon login, employees are automatically redirected to their specific role dashboard (`/portal/owner`, `/portal/manager`, `/portal/field-agent`, or `/portal/report-agent`). The old generic unified dashboard has been removed.
   - **Common Profile:** All employees share a common `/portal/profile` page where they can view locked personal details and edit their profile photo.

> [!NOTE]
> Server actions (`src/app/actions`) heavily enforce role-based access control (RBAC). Always verify `session.user.role` before performing database mutations.

## 4. Completed Workflows (What is done)

The core business logic is **100% complete**. 

1. **Intake Flow**: Client requests a valuation. A `Project` is created with `PENDING_REVIEW` status.
2. **Assignment Flow**: Manager accepts the project and assigns a `FIELD_EMPLOYEE` and `REPORT_EMPLOYEE` via the `/portal/projects/[id]` dashboard.
3. **Inspection Flow**: Field agent sees assignment, views client details, gets Google Maps directions, and completes the inspection. Status updates to `INSPECTION_COMPLETED`.
4. **Drafting Flow (Updated)**: Report agent fills out a dynamic, comprehensive **11-section React form** (`ReportBuilder.tsx`). This form matches the real-world Individual Client Bank Report template (including property details, floor-wise depreciation calculations, and an auto-generated Valuation Certificate with amounts automatically converted to words via `numberToWords.ts`). Agents can upload property images directly to Supabase. Status updates to `MANAGER_REVIEW`.
5. **Finalization Flow**: Manager reviews the drafted report. They can "Send for Rework" or "Finalize".
6. **PDF Generation (Updated)**: PDF generation is now fully implemented on the **Client-Side** directly within the Report Builder using `html2canvas` and `jspdf`. Upon clicking "Generate PDF & Submit", it captures the 11-section HTML layout, paginates it into an A4 PDF blob, downloads it locally, and uploads it to Supabase storage.
7. **Delivery**: Client downloads the PDF from their dashboard.

## 5. Pending Work (What is next)

If you are picking up work on this project, here are the outstanding items:

1. **Organizational/Corporate Templates**: The "Standard Individual" (Bank Reports) template is now completed. The user will provide data layouts for specific organizational/corporate clients (SBI, PNB, etc.). You will need to create conditional logic or separate React components for these specific forms and adjust the PDF generation to match their layouts.
2. **Manager Flow Verification**: Verify that the Manager dashboard can correctly read the JSON data from the new 11-section `ReportBuilder` during the `MANAGER_REVIEW` phase, and ensure they can successfully access the generated PDF URL from Supabase.
3. **Email Automation**: Connect Gmail API or Nodemailer to send automated notifications (e.g., "Your request was received", "Your PDF is ready for download").
4. **Local Archiving Script**: Create a separate Node.js script intended to run locally on the user's office PC to automatically download and archive PDFs older than 3 months from Supabase to their local hard drive to save cloud storage costs.

> [!TIP]
> When modifying the UI, prioritize modern, premium aesthetics (glassmorphism, clean typography, subtle animations) without relying on Tailwind components like Shadcn unless explicitly requested. Use raw Tailwind classes.
