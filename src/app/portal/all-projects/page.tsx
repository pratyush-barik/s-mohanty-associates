import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AllProjectsClient from './AllProjectsClient';

export default async function AllProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Owner-only page
  if (!currentUser || currentUser.role !== 'OWNER') {
    redirect('/portal');
  }

  const projects = await prisma.project.findMany({
    include: {
      serviceRequest: { select: { propertyType: true, contactName: true } },
      manager: { select: { name: true } },
      fieldEmployees: { select: { name: true } },
      reportEmployee: { select: { name: true } },
      // Fetch the termination message if terminated
      messages: {
        where: { content: { startsWith: '**Project Terminated**' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <AllProjectsClient projects={projects} />;
}

