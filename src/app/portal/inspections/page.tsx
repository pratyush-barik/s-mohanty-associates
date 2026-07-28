import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import InspectionsClient from '@/components/portal/InspectionsClient';

export default async function FieldAgentDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const currentUser = await prisma.employee.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || !['FIELD_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal');
  }

  // Fetch projects assigned to this field employee, or all if Owner/Manager
  const whereClause = ['OWNER', 'MANAGER'].includes(currentUser.role) 
    ? {} 
    : {
        fieldEmployees: {
          some: { id: userId },
        },
      };

  const allInspections = await prisma.inspection.findMany({
    where: { project: whereClause },
    include: {
      project: {
        include: {
          serviceRequest: { select: { propertyAddress: true, propertyType: true, contactName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return <InspectionsClient initialInspections={allInspections} userId={userId} />;
}
