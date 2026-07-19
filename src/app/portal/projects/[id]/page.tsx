import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import AssignTeamForm from './AssignTeamForm';
import Link from 'next/link';
import ReportBuilder from '../../reports/[projectId]/ReportBuilder';

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      serviceRequest: true,
      fieldEmployee: { select: { id: true, name: true, employeeId: true } },
      reportEmployee: { select: { id: true, name: true, employeeId: true } },
      manager: { select: { id: true, name: true } },
      report: true,
    },
  });

  if (!project) return notFound();

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
    _count: { fieldProjects: emp.fieldProjects.length },
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
    _count: { reportProjects: emp.reportProjects.length },
  }));

  const managers = await prisma.employee.findMany({
    where: { role: { in: ['MANAGER', 'OWNER'] }, isActive: true },
    select: { id: true, name: true, employeeId: true },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/portal/projects" className="text-[#6c757d] hover:text-[#0f2038]">
              ← Back
            </Link>
            <span className="text-[#dee2e6]">|</span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2038] font-mono">
            {project.projectCode}
          </h1>
        </div>
      </div>

      {/* Manager Verification (Shows only when submitted by Report Agent) */}
      {(project.status === 'MANAGER_REVIEW' || project.status === 'COMPLETED') && project.report && (
        <div className="mb-8">
          <ReportBuilder
            projectId={project.id}
            initialFields={project.report.data}
            status={project.status}
            userRole={currentUser.role}
          />
        </div>
      )}

      {/* Assignment UI */}
      <AssignTeamForm
        projectId={project.id}
        currentFieldId={project.fieldEmployeeId}
        currentReportId={project.reportEmployeeId}
        currentManagerId={project.assignedManagerId}
        pendingManagerId={project.pendingManagerId}
        fieldEmployees={fieldEmployees}
        reportEmployees={reportEmployees}
        managers={managers}
        userRole={currentUser.role}
      />

      {/* Request Details (Read Only Overview) */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Request Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Client</p>
            <p className="text-sm font-medium text-[#0f2038]">{project.serviceRequest.contactName}</p>
            <p className="text-sm text-[#6c757d]">{project.serviceRequest.contactEmail}</p>
            <p className="text-sm text-[#6c757d]">{project.serviceRequest.contactPhone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Property</p>
            <p className="text-sm font-medium text-[#0f2038]">{project.serviceRequest.propertyType} — {project.serviceRequest.purpose}</p>
            <p className="text-sm text-[#6c757d]">{project.serviceRequest.propertyAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
