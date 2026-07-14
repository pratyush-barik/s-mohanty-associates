import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import InspectionClient from './InspectionClient';

export default async function InspectionDetailsPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['FIELD_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  const inspection = await prisma.inspection.findUnique({
    where: { projectId: params.projectId },
    include: {
      project: {
        include: {
          serviceRequest: true,
        }
      }
    }
  });

  if (!inspection) return notFound();

  // Field agents can only see their own assignments
  if (currentUser.role === 'FIELD_EMPLOYEE' && inspection.employeeId !== session.user.id) {
    redirect('/portal/inspections');
  }

  const { serviceRequest } = inspection.project;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/portal/inspections" className="text-[#6c757d] hover:text-[#0f2038]">
              ← Back to Inspections
            </Link>
            <span className="text-[#dee2e6]">|</span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
              inspection.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' : 
              inspection.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {inspection.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2038] font-mono">
            {inspection.project.projectCode}
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Property Details */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Property & Contact Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Contact</p>
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
                <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Additional Notes from Client</p>
                <p className="text-sm text-[#6c757d] whitespace-pre-wrap bg-[#f8f9fa] p-3 rounded-xl border border-[#e9ecef]">
                  {serviceRequest.propertyDetails}
                  {serviceRequest.additionalNotes && `\n\n${serviceRequest.additionalNotes}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <InspectionClient
            projectId={inspection.projectId}
            initialStatus={inspection.status}
            initialNotes={inspection.notes}
          />
        </div>
      </div>
    </div>
  );
}
