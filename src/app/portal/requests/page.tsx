import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import RequestsDashboard from './RequestsDashboard';

export default async function PortalRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal');
  }

  // Fetch all requests
  const requests = await prisma.serviceRequest.findMany({
    include: {
      client: {
        include: {
          individual: true,
          organisation: true,
        },
      },
      project: {
        include: {
          manager: {
            select: { id: true, name: true, employeeId: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch active managers
  const managers = await prisma.employee.findMany({
    where: { role: { in: ['MANAGER', 'OWNER'] }, isActive: true },
    select: { id: true, name: true, employeeId: true },
  });

  return (
    <RequestsDashboard
      requests={requests as any}
      managers={managers}
      currentUserRole={currentUser.role as 'OWNER' | 'MANAGER'}
      currentUserId={currentUser.id}
    />
  );
}
