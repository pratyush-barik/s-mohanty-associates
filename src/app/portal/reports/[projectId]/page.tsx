import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ReportBuilder from './ReportBuilder';

export default async function ReportEditorPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['REPORT_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      serviceRequest: true,
      report: true,
      fieldEmployee: { select: { name: true, email: true, phone: true } },
    }
  });

  if (!project) return notFound();

  // Report agents can only see their own assignments
  if (currentUser.role === 'REPORT_EMPLOYEE' && project.reportEmployeeId !== session.user.id) {
    redirect('/portal/reports');
  }

  const { serviceRequest, fieldEmployee, report } = project;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/portal/reports" className="text-[#6c757d] hover:text-[#0f2038]">
              ← Back to Reports
            </Link>
            <span className="text-[#dee2e6]">|</span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
              project.status === 'MANAGER_REVIEW' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 
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
                {fieldEmployee ? (
                  <>
                    <p className="text-sm font-medium text-[#0f2038]">{fieldEmployee.name}</p>
                    <a href={`tel:${fieldEmployee.phone}`} className="text-sm text-[#b8860b] hover:underline block">{fieldEmployee.phone}</a>
                  </>
                ) : (
                  <p className="text-sm text-[#6c757d]">Not assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Report Builder */}
        <div className="lg:col-span-2">
          <ReportBuilder 
            projectId={project.id} 
            initialFields={report?.fields || null} 
            status={project.status}
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
}
