import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import MyProjectsClient from '@/components/portal/MyProjectsClient';

export default async function ReportAgentDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const currentUser = await prisma.employee.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || !['REPORT_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal');
  }

  // Fetch projects assigned to this report employee, or all if Owner/Manager
  const whereClause = ['OWNER', 'MANAGER'].includes(currentUser.role) 
    ? {} 
    : { reportEmployeeId: userId };

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      serviceRequest: { select: { propertyAddress: true, propertyType: true, contactName: true } },
      inspection: true,
      report: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return <MyProjectsClient initialProjects={projects} userId={userId} />;
}
