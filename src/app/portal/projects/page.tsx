import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ManagerProjectsClient from './ManagerProjectsClient';

export default async function PortalProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal');
  }

  const whereClause = { assignedManagerId: session.user.id };

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      serviceRequest: { select: { propertyType: true, contactName: true } },
      fieldEmployees: { select: { name: true } },
      reportEmployee: { select: { name: true } },
      messages: {
        where: { content: { startsWith: '**Project Terminated**' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ManagerProjectsClient
      projects={projects}
      title="My Projects"
      subtitle="Projects assigned to you for oversight."
    />
  );
}
