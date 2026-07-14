import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Navbar from './Navbar';

export default async function NavbarWrapper() {
  const session = await auth();
  
  let userProps = null;

  if (session?.user?.id) {
    const userRole = (session.user as any).role || 'CLIENT';

    // Fetch active projects for clients
    let projects: { id: string; projectCode: string; status: string }[] = [];
    if (userRole === 'CLIENT') {
      const dbProjects = await prisma.project.findMany({
        where: {
          serviceRequest: { clientId: session.user.id },
          status: { notIn: ['ARCHIVED', 'COMPLETED'] },
        },
        select: { id: true, projectCode: true, status: true },
        orderBy: { createdAt: 'desc' },
      });
      projects = dbProjects;
    }

    userProps = {
      name: session.user.name || 'User',
      role: userRole,
      projects,
    };
  }

  return <Navbar user={userProps} />;
}
