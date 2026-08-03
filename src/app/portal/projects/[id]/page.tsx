import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import AssignTeamForm from './AssignTeamForm';
import ProjectChat from './ProjectChat';
import Link from 'next/link';
import ReportBuilder from '../../reports/[projectId]/ReportBuilder';
import ReportDraftSection from './ReportDraftSection';
import TransferOversightButton from './TransferOversightButton';

function formatStatus(status: string, clientReworkRequested?: boolean) {
  if (clientReworkRequested) return 'CLIENT REWORK REQUESTED';
  if (status === 'ASSIGNED') return 'MANAGER ASSIGNED';
  return status.replace(/_/g, ' ');
}

function formatSource(source: string) {
  if (source === 'GMAIL') return 'Gmail';
  if (source === 'EXTERNAL') return 'External';
  return 'Website';
}

function sourceColor(source: string) {
  if (source === 'GMAIL') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (source === 'EXTERNAL') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-purple-100 text-purple-700 border-purple-200';
}

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const currentUser = await prisma.employee.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
      redirect('/portal');
    }

    const resolvedParams = await params;

    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: {
        serviceRequest: true,
        fieldEmployees: { select: { id: true, name: true, employeeId: true, mobile: true } },
        reportEmployee: { select: { id: true, name: true, employeeId: true, mobile: true } },
        manager: { select: { id: true, name: true, employeeId: true, mobile: true } },
        report: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where: { clientId: { not: null } },
        },
      },
    });

    if (!project) return notFound();

    // Fetch project messages with documents for the chat
    const chatMessages = await prisma.projectMessage.findMany({
      where: { projectId: project.id },
      include: {
        client: { include: { individual: true, organisation: true } },
        employee: true,
        documents: {
          select: { id: true, name: true, url: true, type: true, size: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = chatMessages.map((msg) => {
      const isClientMsg = !!msg.clientId;
      const senderId = isClientMsg ? msg.clientId! : msg.employeeId!;
      let name = '';
      let role = '';
      let profilePhoto = null;

      if (isClientMsg && msg.client) {
        name = msg.client.clientType === 'INDIVIDUAL'
          ? msg.client.individual?.name || 'Client'
          : msg.client.organisation?.organisationName || 'Client';
        role = 'CLIENT';
      } else if (!isClientMsg && msg.employee) {
        name = msg.employee.name;
        role = msg.employee.role;
        profilePhoto = msg.employee.profilePhoto;
      }

      return {
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        documents: msg.documents || [],
        sender: {
          id: senderId,
          name,
          role,
          profilePhoto,
        },
      };
    });

    // Fetch available employees for assignment (fail-proof method mapping counts manually)
    const fieldEmployeesData = await prisma.employee.findMany({
      where: { role: 'FIELD_EMPLOYEE', isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        fieldProjects: {
          where: { status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
          select: { id: true },
        },
      },
    });

    const fieldEmployees = fieldEmployeesData.map((emp) => ({
      id: emp.id,
      name: emp.name,
      employeeId: emp.employeeId,
      _count: { fieldProjects: emp.fieldProjects?.length || 0 },
    }));

    const reportEmployeesData = await prisma.employee.findMany({
      where: { role: 'REPORT_EMPLOYEE', isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        reportProjects: {
          where: { status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
          select: { id: true },
        },
      },
    });

    const reportEmployees = reportEmployeesData.map((emp) => ({
      id: emp.id,
      name: emp.name,
      employeeId: emp.employeeId,
      _count: { reportProjects: emp.reportProjects?.length || 0 },
    }));

    const managers = await prisma.employee.findMany({
      where: { role: { in: ['MANAGER', 'OWNER'] }, isActive: true },
      select: { id: true, name: true, employeeId: true },
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal/projects" className="text-[#6c757d] hover:text-[#0f2038]">
              ← Back
            </Link>
            <span className="text-[#dee2e6]">|</span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${sourceColor(project.source)}`}>
              {formatSource(project.source)}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${project.clientReworkRequested ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              {project.clientReworkRequested ? 'CLIENT REWORK REQUESTED' : project.status?.replace(/_/g, ' ') || 'UNKNOWN'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2038] font-mono">
            {project.projectCode}
          </h1>
        </div>

        {/* Client Rework Banner */}
        {project.clientReworkRequested && project.messages.length > 0 && (
          <div className="card p-5 border border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Client Rework Requested</h2>
            </div>
            <p className="text-xs text-red-700 mb-3 font-semibold">The client has reviewed the finalized report and requested the following changes:</p>
            <div className="text-sm text-red-800 bg-white/70 p-4 rounded-lg border border-red-100 whitespace-pre-wrap">
              {project.messages[0].content.replace('**Rework Request:** ', '')}
            </div>
            <p className="text-xs text-red-600 mt-3">Please review their request and either update the report yourself or send it back to the Report Agent.</p>
          </div>
        )}

        {/* 1) REQUEST AND ASSIGNMENT DETAILS */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Request & Assignment Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Client</p>
              <p className="text-sm font-medium text-[#0f2038]">{project.serviceRequest?.contactName || 'N/A'}</p>
              <p className="text-sm text-[#6c757d]">{project.serviceRequest?.contactEmail || 'N/A'}</p>
              <p className="text-sm text-[#6c757d]">{project.serviceRequest?.contactPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Property</p>
              <p className="text-sm font-medium text-[#0f2038]">{project.serviceRequest?.propertyType || 'N/A'} — {project.serviceRequest?.purpose || 'N/A'}</p>
              <p className="text-sm text-[#6c757d]">{project.serviceRequest?.propertyAddress || 'N/A'}</p>
            </div>
          </div>
          
          <hr className="my-6 border-[#e9ecef]" />
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#f1f3f5]">
              <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">Assigned Manager</span>
              {project.manager ? (
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#0f2038]">{project.manager.name}</p>
                  <p className="text-xs text-gray-500">Manager ID: {project.manager.employeeId || 'N/A'} | Phone: {project.manager.mobile || 'N/A'}</p>
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-semibold italic">Not Assigned</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#f1f3f5]">
              <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">Field Agents (Inspectors)</span>
              {project.fieldEmployees.length > 0 ? (
                <div className="text-right space-y-1">
                  {project.fieldEmployees.map(emp => (
                    <div key={emp.id} className="text-xs">
                      <span className="font-semibold text-[#0f2038]">{emp.name}</span>
                      <span className="text-gray-500"> (Agent ID: {emp.employeeId || 'N/A'} | Phone: {emp.mobile || 'N/A'})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-semibold italic">Not Assigned</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#f1f3f5]">
              <span className="text-xs font-bold text-[#6c757d] uppercase tracking-wider">Assigned Report Agent</span>
              {project.reportEmployee ? (
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#0f2038]">{project.reportEmployee.name}</p>
                  <p className="text-xs text-gray-500">Agent ID: {project.reportEmployee.employeeId || 'N/A'} | Phone: {project.reportEmployee.mobile || 'N/A'}</p>
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-semibold italic">Not Assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* 2) manage team */}
        <AssignTeamForm
          projectId={project.id}
          currentFieldIds={project.fieldEmployees.map((e) => e.id)}
          currentReportId={project.reportEmployeeId}
          currentManagerId={project.assignedManagerId}
          pendingManagerId={project.pendingManagerId}
          fieldEmployees={fieldEmployees}
          reportEmployees={reportEmployees}
          managers={managers}
          userRole={currentUser.role}
        />

        {/* 3) PROJECT CHAT — under manage section */}
        <ProjectChat
          projectId={project.id}
          project={{
            id: project.id,
            projectCode: project.projectCode,
            source: project.source,
            serviceRequest: project.serviceRequest
              ? {
                  contactName: project.serviceRequest.contactName,
                  contactEmail: project.serviceRequest.contactEmail || '',
                  contactPhone: project.serviceRequest.contactPhone || '',
                  guestName: project.serviceRequest.guestName,
                  guestEmail: project.serviceRequest.guestEmail,
                  guestPhone: project.serviceRequest.guestPhone,
                }
              : null,
            pendingManagerId: project.pendingManagerId,
            assignedManagerId: project.assignedManagerId,
            status: project.status,
          }}
          messages={formattedMessages}
          currentUserId={currentUser.id}
        />

        {/* 4) THEN VIEW REPORT — Collapsible Dropdown */}
        {(project.status === 'MANAGER_REVIEW' || project.status === 'COMPLETED') && project.report && (
          <ReportDraftSection>
            <ReportBuilder
              projectId={project.id}
              initialFields={project.report.data}
              status={project.status}
              userRole={currentUser.role}
            />
          </ReportDraftSection>
        )}

        {/* 5) TRANSFER — After report section */}
        {['OWNER', 'MANAGER'].includes(currentUser.role) && (
          <TransferOversightButton
            projectId={project.id}
            currentManagerId={project.assignedManagerId}
            managers={managers}
          />
        )}
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full">
        <div className="bg-rose-50 text-rose-800 p-8 rounded-2xl border border-rose-200">
          <h2 className="text-xl font-bold mb-4 font-mono">Bypassed Error Boundary</h2>
          <pre className="text-left bg-white p-4 rounded-xl text-xs overflow-auto font-mono border border-rose-100">
            {error?.message || String(error)}
            {'\n\n'}
            {error?.stack}
          </pre>
        </div>
      </div>
    );
  }
}
