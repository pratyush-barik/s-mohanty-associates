import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import BuilderSelector from './BuilderSelector';
import BuilderErrorBoundary from './BuilderErrorBoundary';
import { decodeHtmlEntities, decodeHtmlEntitiesDeep } from '@/lib/html-entities';
import { formatReportDate } from '@/lib/pdf-bank-renderer';

export default async function ReportEditorPage({ params, searchParams }: { params: Promise<{ projectId: string }>, searchParams: Promise<{ builder?: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const currentUser = await prisma.employee.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !['REPORT_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
      redirect('/portal');
    }

    const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const builderFromQuery = resolvedSearchParams?.builder;

    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.projectId },
      include: {
        serviceRequest: true,
        report: true,
        fieldEmployees: { select: { name: true, email: true, mobile: true, employeeId: true } },
        reportEmployee: { select: { name: true, email: true, mobile: true, employeeId: true } },
        manager: { select: { name: true, employeeId: true, mobile: true } },
        inspection: { select: { notes: true, scheduledDate: true, completedAt: true, createdAt: true } },
        bucketImages: {
          include: { employee: { select: { name: true, employeeId: true } } },
          orderBy: { createdAt: 'desc' },
        },
      }
    });

    if (!project) return notFound();

    // Per-project authorization: MANAGER can only access their assigned projects
    if (currentUser.role === 'MANAGER' && project.assignedManagerId !== session.user.id) {
      return notFound();
    }

    // Report agents can only see their own assignments
    if (currentUser.role === 'REPORT_EMPLOYEE' && project.reportEmployeeId !== session.user.id) {
      return notFound();
    }

    const { serviceRequest, report } = project;
    const rawBucketImages = project.bucketImages;
    const verifiedBucketImages: typeof rawBucketImages = [];
    const deadBucketImageIds: string[] = [];

    await Promise.all(
      rawBucketImages.map(async (img) => {
        if (!img.url || img.url.trim().length <= 5) {
          deadBucketImageIds.push(img.id);
          return;
        }
        try {
          const resp = await fetch(img.url, { method: 'HEAD' });
          if (resp.ok) {
            verifiedBucketImages.push(img);
          } else {
            deadBucketImageIds.push(img.id);
          }
        } catch {
          deadBucketImageIds.push(img.id);
        }
      })
    );

    if (deadBucketImageIds.length > 0) {
      prisma.bucketImage.deleteMany({
        where: { id: { in: deadBucketImageIds } }
      }).catch(err => console.error('Failed to auto-purge dead bucket images:', err));
    }

    const mappedBucketImages = verifiedBucketImages.map(img => ({
      ...img,
      createdAt: img.createdAt.toISOString()
    }));

    // Earliest field visit detection:
    const earliestPhoto = verifiedBucketImages.length > 0
      ? [...verifiedBucketImages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
      : null;
    const rawVisitDate = earliestPhoto
      ? earliestPhoto.createdAt
      : (project.inspection?.completedAt || project.inspection?.scheduledDate || project.inspection?.createdAt);
    const earliestFieldVisitDate = rawVisitDate ? formatReportDate(rawVisitDate) : '';
    const earliestFieldAgentName = earliestPhoto?.employee?.name || project.fieldEmployees?.[0]?.name || '';

    return (
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/portal/my-projects" className="text-[#6c757d] hover:text-[#0f2038]">
                ← Back to Projects
              </Link>
              <span className="text-[#dee2e6]">|</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${project.status === 'MANAGER_REVIEW' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                project.status === 'REPORT_DRAFTING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                {project.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#0f2038]">
              Report Editor: {project.projectCode}
            </h1>
            <p className="text-xs text-[#6c757d]">
              {serviceRequest?.propertyAddress ? decodeHtmlEntities(serviceRequest.propertyAddress) : 'No address provided'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/portal/projects/${project.id}`}
              className="px-3 py-1.5 bg-white border border-[#dee2e6] rounded-lg text-xs font-semibold text-[#0f2038] hover:bg-[#f8f9fa] transition-colors"
            >
              Project Overview
            </Link>
          </div>
        </div>

        {/* Project Meta Bar */}
        <div className="bg-white border border-[#dee2e6] rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1.5">Client & Service Request</p>
            <p className="text-xs font-semibold text-[#0f2038]">{serviceRequest?.contactName ? decodeHtmlEntities(serviceRequest.contactName) : 'N/A'}</p>
            <p className="text-xs text-gray-500">{serviceRequest?.contactPhone || 'No Phone'}</p>
            <p className="text-xs text-gray-500">{serviceRequest?.contactEmail || 'No Email'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1.5">Field Engineer & Phone</p>
            {project.fieldEmployees.length > 0 ? (
              <div className="space-y-2">
                {project.fieldEmployees.map((emp) => (
                  <div key={emp.email} className="text-xs">
                    <p className="font-semibold text-[#0f2038]">{emp.name}</p>
                    <p className="text-gray-500">ID: {emp.employeeId || 'N/A'}</p>
                    {emp.mobile && <p className="text-[#b8860b] font-medium">Phone: {emp.mobile}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6c757d]">No inspectors assigned</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1.5">Field Inspection Remarks</p>
            {project.inspection?.notes ? (
              <p className="text-xs text-[#212529] bg-white p-2.5 rounded-lg border border-[#dee2e6] max-h-24 overflow-y-auto whitespace-pre-wrap font-medium">
                {decodeHtmlEntities(project.inspection.notes)}
              </p>
            ) : (
              <p className="text-xs text-[#6c757d] italic">No site notes recorded.</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1.5">Assigned Manager</p>
            {project.manager ? (
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-[#0f2038]">{project.manager.name}</p>
                <p className="text-gray-500">Manager ID: {project.manager.employeeId || 'N/A'}</p>
                {project.manager.mobile && <p className="text-[#b8860b] font-medium">Phone: {project.manager.mobile}</p>}
              </div>
            ) : (
              <p className="text-xs text-[#6c757d] italic">No manager assigned</p>
            )}
          </div>
        </div>

        {/* Report Builder (Full Width) */}
        <BuilderErrorBoundary>
          <BuilderSelector
            initialFields={decodeHtmlEntitiesDeep(report?.data) || null}
            projectId={project.id}
            projectCode={project.projectCode}
            status={project.status}
            userRole={currentUser.role}
            bucketImages={mappedBucketImages}
            builderQuery={builderFromQuery}
            prefill={{
              contactName: decodeHtmlEntities(serviceRequest?.contactName || ''),
              contactPhone: decodeHtmlEntities(serviceRequest?.contactPhone || ''),
              contactEmail: decodeHtmlEntities(serviceRequest?.contactEmail || ''),
              propertyAddress: decodeHtmlEntities(serviceRequest?.propertyAddress || ''),
              propertyType: decodeHtmlEntities(serviceRequest?.propertyType || ''),
              purpose: decodeHtmlEntities(serviceRequest?.purpose || ''),
              fieldEmployees: project.fieldEmployees || [],
              reportEmployeeName: project.reportEmployee?.name || (currentUser.role === 'REPORT_EMPLOYEE' ? session.user.name : '') || '',
              initiationDate: (project.startDate || project.createdAt) ? formatReportDate(project.startDate || project.createdAt) : '',
              inspectionDate: (project.inspection?.completedAt || project.inspection?.scheduledDate || project.inspection?.createdAt) ? formatReportDate(project.inspection?.completedAt || project.inspection?.scheduledDate || project.inspection?.createdAt) : '',
              fieldVisitDate: earliestFieldVisitDate,
              firstFieldAgentName: earliestFieldAgentName,
            }}
          />
        </BuilderErrorBoundary>
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
