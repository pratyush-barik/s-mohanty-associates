import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from '@/auth';
import ActiveLink from '@/components/ui/ActiveLink';
import { prisma } from '@/lib/prisma';

const employeeRoles = ['OWNER', 'MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'];

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_EMPLOYEE: 'Field Agent',
  REPORT_EMPLOYEE: 'Report Staff',
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/employee-login');

  const userRole = (session.user as any).role;
  if (!employeeRoles.includes(userRole)) redirect('/dashboard');

  let dashboardHref = '/portal';
  if (userRole === 'OWNER') dashboardHref = '/portal/owner';
  else if (userRole === 'MANAGER') dashboardHref = '/portal/manager';
  else if (userRole === 'FIELD_EMPLOYEE') dashboardHref = '/portal/field-agent';
  else if (userRole === 'REPORT_EMPLOYEE') dashboardHref = '/portal/report-agent';

  let pendingTransfersCount = 0;
  if (userRole === 'OWNER' || userRole === 'MANAGER') {
    pendingTransfersCount = await prisma.project.count({
      where: {
        pendingManagerId: session.user?.id || '',
      },
    });
  }

  const navItems: Array<{ label: string; href: string; icon: string; badge?: number }> = [
    { label: 'Dashboard', href: dashboardHref, icon: '📊' },
    { label: 'Profile', href: '/portal/profile', icon: '👤' },
  ];

  // Role-specific nav items
  if (userRole === 'OWNER' || userRole === 'MANAGER') {
    navItems.push(
      { label: 'Public Enquiries', href: '/portal/enquiries', icon: '💬' },
      { label: 'Service Requests', href: '/portal/requests', icon: '📨' },
      { label: 'Incoming Transfers', href: '/portal/transfers', icon: '🔄', badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined },
      { label: 'Projects', href: '/portal/projects', icon: '📁' },
    );
  }
  if (userRole === 'OWNER') {
    navItems.push(
      { label: 'Manage Employees', href: '/portal/employees', icon: '👥' },
    );
  }
  if (userRole === 'FIELD_EMPLOYEE') {
    navItems.push(
      { label: 'My Inspections', href: '/portal/inspections', icon: '🔍' },
    );
  }
  if (userRole === 'REPORT_EMPLOYEE') {
    navItems.push(
      { label: 'My Projects', href: '/portal/my-projects', icon: '📝' },
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-20 hover:w-64 bg-[#0a1628] text-white flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out group overflow-hidden z-45 shadow-xl">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Collapsed: show small square icon version */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center group-hover:hidden">
              <Image
                src="/logo/smohantyassociate_logo.png"
                alt="S Mohanty Associates"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
            </div>
            {/* Expanded: show full logo */}
            <div className="hidden group-hover:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <div className="inline-block">
                <Image
                  src="/logo/smohantyassociate_logo.png"
                  alt="S Mohanty Associates"
                  width={200}
                  height={50}
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#ffcb47] font-medium mt-1.5 ml-1">Employee Portal</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4f6f] flex flex-shrink-0 items-center justify-center text-white font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-[10px] text-[#ffcb47] font-medium uppercase tracking-wider">
                {roleLabels[userRole] || userRole}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <ActiveLink
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all overflow-hidden"
              activeClassName="!bg-white/15 !text-[#ffcb47] font-bold"
            >
              <span className="text-base flex-shrink-0 relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 group-hover:hidden">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffcb47] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffcb47]"></span>
                  </span>
                )}
              </span>
              
              <div className="flex-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-[#ffcb47] text-[#0a1628] text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>
            </ActiveLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <form action={async () => {
            'use server';
            const redirectUrl = process.env.NODE_ENV === 'production' 
              ? 'https://smohantyassociates.com/auth/employee-login' 
              : '/auth/employee-login';
            await signOut({ redirectTo: redirectUrl });
          }}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all overflow-hidden"
            >
              <span className="text-base flex-shrink-0">🚪</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Logout
              </span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1100px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
