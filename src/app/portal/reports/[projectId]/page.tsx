import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ReportBuilder from './ReportBuilder';

export default async function ReportEditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const currentUser = await prisma.employee.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!currentUser || !['REPORT_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
      redirect('/portal/dashboard');
    }

    const resolvedParams = await params;

    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.projectId },
      include: {
        serviceRequest: true,
        report: true,
        fieldEmployees: { select: { name: true, email: true, mobile: true } },
        inspection: { select: { notes: true } },
      }
    });

    if (!project) return notFound();

    // Report agents can only see their own assignments
    if (currentUser.role === 'REPORT_EMPLOYEE' && project.reportEmployeeId !== session.user.id) {
      redirect('/portal/my-projects');
    }

    const { serviceRequest, report } = project;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/portal/my-projects" className="text-[#6c757d] hover:text-[#0f2038]">
                ← Back to Projects
              </Link>
              <span className="text-[#dee2e6]">|</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${project.status === 'MANAGER_REVIEW' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                  project.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f2038] font-mono">
              {project.projectCode}
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Property & Field Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 bg-[#f8f9fa]">
              <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Project Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Client Contact</p>
                  <p className="text-sm font-medium text-[#0f2038]">{serviceRequest.contactName}</p>
                  <a href={`tel:${serviceRequest.contactPhone}`} className="text-sm text-[#b8860b] hover:underline block">{serviceRequest.contactPhone}</a>
                  <a href={`mailto:${serviceRequest.contactEmail}`} className="text-sm text-[#b8860b] hover:underline block">{serviceRequest.contactEmail}</a>
                </div>
                <hr className="border-[#e9ecef]" />
                <div>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Property</p>
                  <p className="text-sm font-medium text-[#0f2038]">{serviceRequest.propertyType} — {serviceRequest.purpose}</p>
                  <p className="text-sm text-[#6c757d] mt-1">{serviceRequest.propertyAddress}</p>
                </div>
                <hr className="border-[#e9ecef]" />
                <div>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Field Agent details</p>
                  {project.fieldEmployees.length > 0 ? (
                    <div className="space-y-2">
                      {project.fieldEmployees.map((emp) => (
                        <div key={emp.email} className="mb-2">
                          <p className="text-sm font-medium text-[#0f2038]">{emp.name}</p>
                          {emp.mobile && <a href={`tel:${emp.mobile}`} className="text-sm text-[#b8860b] hover:underline block">{emp.mobile}</a>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6c757d]">Not assigned</p>
                  )}
                </div>
                {project.inspection?.notes && (
                  <>
                    <hr className="border-[#e9ecef]" />
                    <div>
                      <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Field Inspection Notes</p>
                      <p className="text-xs text-[#212529] bg-white p-3 rounded-xl border border-[#dee2e6] whitespace-pre-wrap font-medium">
                        {project.inspection.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Report Builder */}
          <div className="lg:col-span-2">
            <ReportBuilder
              projectId={project.id}
              initialFields={report?.data || null}
              status={project.status}
              userRole={currentUser.role}
              prefill={{
                contactName: serviceRequest.contactName,
                contactPhone: serviceRequest.contactPhone,
                contactEmail: serviceRequest.contactEmail,
                propertyAddress: serviceRequest.propertyAddress,
                propertyType: serviceRequest.propertyType,
              }}
            />
          </div>
        </div>
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
