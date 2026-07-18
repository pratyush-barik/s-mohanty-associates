import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProjectChat from './ProjectChat';

const statusColors: Record<string, string> = {
  PENDING_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
  INSPECTION_IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  INSPECTION_COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
  REPORT_DRAFTING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MANAGER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  ARCHIVED: 'bg-gray-50 text-gray-700 border-gray-200',
};

const statusSteps = [
  { key: 'PENDING_REVIEW', label: 'Pending Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'INSPECTION_IN_PROGRESS', label: 'Inspection' },
  { key: 'INSPECTION_COMPLETED', label: 'Inspected' },
  { key: 'REPORT_DRAFTING', label: 'Report Drafting' },
  { key: 'MANAGER_REVIEW', label: 'Manager Review' },
  { key: 'COMPLETED', label: 'Completed' },
];

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      serviceRequest: true,
      manager: { select: { id: true, name: true, email: true, profilePhoto: true, designation: true } },
      fieldEmployee: { select: { id: true, name: true, email: true, profilePhoto: true, designation: true } },
      reportEmployee: { select: { id: true, name: true, email: true, profilePhoto: true, designation: true } },
      messages: {
        include: {
          client: { include: { individual: true, organisation: true } },
          employee: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      report: { select: { id: true, status: true, fileUrl: true } },
    },
  });

  if (!project) notFound();

  // Verify client access
  if (project.serviceRequest.clientId !== session.user.id) notFound();

  const currentStepIndex = statusSteps.findIndex((s) => s.key === project.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6c757d]">
        <Link href="/dashboard" className="hover:text-[#0f2038] transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/projects" className="hover:text-[#0f2038] transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-[#0f2038] font-medium">{project.projectCode}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              {project.projectCode}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
              {formatStatus(project.status)}
            </span>
          </div>
          <p className="text-sm text-[#6c757d] mt-1">
            {project.serviceRequest.propertyType} — {project.serviceRequest.purpose}
          </p>
        </div>

        {/* Download Report Button */}
        {project.report?.fileUrl && project.status === 'COMPLETED' && (
          <a
            href={project.report.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-sm px-6 py-2.5"
          >
            📥 Download Report
          </a>
        )}
      </div>

      {/* Status Timeline */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-5">Project Progress Timeline</h2>
        
        {/* Horizontal Timeline */}
        <div className="flex items-start gap-0 overflow-x-auto pb-4">
          {[
            {
              label: 'Manager Assigned',
              isCompleted: !!project.assignedManagerId,
              detail: project.manager?.name ? `Overseer: ${project.manager.name}` : 'Awaiting overseer',
            },
            {
              label: 'Field Agent Assigned',
              isCompleted: !!project.fieldEmployeeId,
              detail: project.fieldEmployee?.name ? `Inspector: ${project.fieldEmployee.name}` : 'Awaiting inspector',
            },
            {
              label: 'Field Agent Deployed',
              isCompleted: ['INSPECTION_IN_PROGRESS', 'INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED'].includes(project.status),
              detail: ['INSPECTION_IN_PROGRESS', 'INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED'].includes(project.status) ? 'Agent on site' : 'Pending trip',
            },
            {
              label: 'Field Work Completed',
              isCompleted: ['INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED'].includes(project.status),
              detail: ['INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED'].includes(project.status) ? 'Data gathered' : 'Awaiting site survey',
            },
            {
              label: 'Report Agent Assigned',
              isCompleted: !!project.reportEmployeeId,
              detail: project.reportEmployee?.name ? `Analyst: ${project.reportEmployee.name}` : 'Awaiting analyst',
            },
            {
              label: 'Sent for Verification',
              isCompleted: ['MANAGER_REVIEW', 'COMPLETED'].includes(project.status) || project.report?.status === 'SUBMITTED_FOR_REVIEW',
              detail: ['MANAGER_REVIEW', 'COMPLETED'].includes(project.status) ? 'Verification review' : 'Drafting report',
            },
            {
              label: 'Report Completed',
              isCompleted: project.status === 'COMPLETED',
              detail: project.status === 'COMPLETED' ? 'Final report ready' : 'Awaiting approval',
            },
          ].map((step, i, arr) => {
            return (
              <div key={step.label} className="flex items-start flex-shrink-0">
                <div className="flex flex-col items-center min-w-[120px] px-2 text-center">
                  {/* Step Bubble */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.isCompleted
                      ? 'bg-gradient-to-br from-[#b8860b] to-[#c9952c] text-white shadow-sm'
                      : 'bg-[#e9ecef] text-[#adb5bd]'
                  }`}>
                    {step.isCompleted ? '✓' : i + 1}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[11px] font-semibold mt-2 leading-tight ${
                    step.isCompleted ? 'text-[#0f2038]' : 'text-[#adb5bd]'
                  }`}>
                    {step.label}
                  </span>
                  
                  {/* Detail text */}
                  <span className="text-[9px] text-[#8e98a2] mt-0.5 max-w-[100px] leading-tight break-words">
                    {step.detail}
                  </span>
                </div>
                
                {/* Connecting Line */}
                {i < arr.length - 1 && (
                  <div className={`w-12 h-0.5 mt-4 flex-shrink-0 ${
                    arr[i + 1].isCompleted ? 'bg-[#b8860b]' : 'bg-[#e9ecef]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column — Property & Team */}
        <div className="lg:col-span-1 space-y-6">
          {/* Download Final Report */}
          {project.status === 'COMPLETED' && project.report?.fileUrl && (
            <div className="card p-6 bg-[#f8f9fa] border-[#b8860b]/30 shadow-md">
              <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-2">Final Valuation Report</h2>
              <p className="text-xs text-[#6c757d] mb-4">Your property valuation report is ready to download.</p>
              <a 
                href={project.report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full text-center py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
            </div>
          )}

          {/* Property Details */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-4">Property Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#adb5bd] text-xs font-medium mb-0.5">Type</p>
                <p className="text-[#0f2038]">{project.serviceRequest.propertyType}</p>
              </div>
              <div>
                <p className="text-[#adb5bd] text-xs font-medium mb-0.5">Purpose</p>
                <p className="text-[#0f2038]">{project.serviceRequest.purpose}</p>
              </div>
              <div>
                <p className="text-[#adb5bd] text-xs font-medium mb-0.5">Address</p>
                <p className="text-[#0f2038]">{project.serviceRequest.propertyAddress}</p>
              </div>
              <div>
                <p className="text-[#adb5bd] text-xs font-medium mb-0.5">Details</p>
                <p className="text-[#6c757d] text-xs leading-relaxed">{project.serviceRequest.propertyDetails}</p>
              </div>
            </div>
          </div>

          {/* Assigned Team */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-4">Assigned Team</h2>
            <div className="space-y-4">
              {project.manager && (
                <TeamMemberCard
                  name={project.manager.name}
                  email={project.manager.email}
                  role="Project Manager"
                  designation={project.manager.designation}
                  photo={project.manager.profilePhoto}
                />
              )}
              {project.fieldEmployee && (
                <TeamMemberCard
                  name={project.fieldEmployee.name}
                  email={project.fieldEmployee.email}
                  role="Field Inspector"
                  designation={project.fieldEmployee.designation}
                  photo={project.fieldEmployee.profilePhoto}
                />
              )}
              {project.reportEmployee && (
                <TeamMemberCard
                  name={project.reportEmployee.name}
                  email={project.reportEmployee.email}
                  role="Report Analyst"
                  designation={project.reportEmployee.designation}
                  photo={project.reportEmployee.profilePhoto}
                />
              )}
              {!project.manager && !project.fieldEmployee && !project.reportEmployee && (
                <p className="text-sm text-[#adb5bd]">Team assignment pending.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Communication */}
        <div className="lg:col-span-2">
          <ProjectChat
            projectId={project.id}
            messages={project.messages.map((m) => {
              const isClientMsg = !!m.clientId;
              const senderId = isClientMsg ? m.clientId! : m.employeeId!;
              let name = '';
              let role = '';
              let profilePhoto = null;

              if (isClientMsg && m.client) {
                name = m.client.clientType === 'INDIVIDUAL'
                  ? m.client.individual?.name || 'Client'
                  : m.client.organisation?.organisationName || 'Client';
                role = 'CLIENT';
              } else if (!isClientMsg && m.employee) {
                name = m.employee.name;
                role = m.employee.role;
                profilePhoto = m.employee.profilePhoto;
              }

              return {
                id: m.id,
                content: m.content,
                createdAt: m.createdAt.toISOString(),
                sender: {
                  id: senderId,
                  name,
                  role,
                  profilePhoto,
                },
              };
            })}
            currentUserId={session.user.id}
          />
        </div>
      </div>
    </div>
  );
}

function TeamMemberCard({
  name,
  email,
  role,
  designation,
  photo,
}: {
  name: string;
  email: string;
  role: string;
  designation: string | null;
  photo: string | null;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fa] border border-[#e9ecef]">
      {/* Photo */}
      <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center">
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-lg font-bold">{name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0f2038]">{name}</p>
        <p className="text-xs text-[#b8860b] font-medium">{role}</p>
        {designation && <p className="text-xs text-[#6c757d]">{designation}</p>}
        <a href={`mailto:${email}`} className="text-xs text-[#6c757d] hover:text-[#b8860b] transition-colors">
          {email}
        </a>
      </div>
    </div>
  );
}
