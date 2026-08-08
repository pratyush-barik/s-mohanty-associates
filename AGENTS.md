<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation warnings.

## Project: S. Mohanty Associates - Property Valuation Management

### Key Concepts
- **Public Enquiries** ≠ **Service Requests** (Cases)
  - Public Enquiries: website contact form / direct email doubt messages → `/portal/enquiries`
  - Service Requests: client requests for valuation services → `/portal/requests`
- `Enquiry` model tracks enquiries with `ticketNumber` (SMA-XXX), `source` (WEBSITE/EMAIL/PORTAL_SIGNUP), `status` (NEW/WAITING_FOR_CLIENT/IN_PROGRESS/CLOSED)
- `ServiceRequest` model tracks client intake requests, linked to `Project` via `serviceRequestId` (unique)
- `Project` model linked to `Enquiry` via `enquiryId` named relation "ProjectEnquiry", has `source` field (`ProjectSource` with `@default(WEBSITE)`)
- `ProjectSource` enum: `WEBSITE` (client login sends a service request), `GMAIL` (all service requests from Gmail), `EXTERNAL` (service created by owner manually)
- `ProjectMessage` model stores employee/client chat messages per project; `Document` model linked via `messageId` for attachments
- `Prisma db push` is used (no migrations directory) — run `npx prisma db push` after schema changes
- `npx prisma generate` must be run after schema changes for Prisma Client to update

### Schema Relationships
- Enquiry → Project (1:1 via `projectId` @unique on Enquiry, `enquiry` relation "ProjectEnquiry" on Project)
- Enquiry → ServiceRequest (1:1 via `serviceRequestId` @unique on Enquiry, `enquiry` relation on ServiceRequest)
- ServiceRequest → Project (1:1 via `serviceRequestId` @unique on Project)
- Project → ProjectMessage (1:N, messages are chat for owner/manager and client)
- ProjectMessage → Document (1:N, attachments linked to messages via `messageId`)
- Project status flow: PENDING_REVIEW → INSPECTION_IN_PROGRESS → MANAGER_REVIEW → COMPLETED
- Enquiry status flow: NEW → WAITING_FOR_CLIENT → IN_PROGRESS → CLOSED (auto-close when report finalized)

### Server Actions (Project Chat)
- `sendProjectMessage(projectId, content, attachmentDocIds[])` — sends a chat message; for Gmail/External source projects, also sends email reply to client
- `uploadProjectMessageAttachment(projectId, formData)` — uploads file to Supabase Storage (`enquiry-files` bucket), creates `Document` record linked to project
- `acceptServiceRequest(requestId, overrideManagerId?)` — sets `Project.source` to `WEBSITE` if ServiceRequest has `clientId`, else `GMAIL`
- `createManualCase(formData)` — sets `Project.source` to `EXTERNAL`

### File Structure
- Server actions: `src/app/actions/project.ts`, `src/app/actions/service.ts`, `src/app/actions/enquiry.ts`
- Portal pages: `src/app/portal/` with role-based dashboards (`owner/`, `manager/`, `field-agent/`, `report-agent/`)
- Key components: `ChatInterface.tsx` (client-side enquiry chat), `ProjectChat.tsx` (employee-side project chat), `RequestsDashboard.tsx`, `EnquiryList.tsx`, `GeneralReportBuilder.tsx`, `IBBIReportBuilder.tsx`