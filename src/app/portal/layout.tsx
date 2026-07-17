import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '@/auth';

const employeeRoles = ['OWNER', 'MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'];

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_EMPLOYEE: 'Field Agent',
  REPORT_EMPLOYEE: 'Report Staff',
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const userRole = (session.user as any).role;
  if (!employeeRoles.includes(userRole)) redirect('/dashboard');

  let dashboardHref = '/portal';
  if (userRole === 'OWNER') dashboardHref = '/portal/owner';
  else if (userRole === 'MANAGER') dashboardHref = '/portal/manager';
  else if (userRole === 'FIELD_EMPLOYEE') dashboardHref = '/portal/field-agent';
  else if (userRole === 'REPORT_EMPLOYEE') dashboardHref = '/portal/report-agent';

  const navItems = [
    { label: 'Dashboard', href: dashboardHref, icon: '📊' },
    { label: 'Profile', href: '/portal/profile', icon: '👤' },
  ];

  // Role-specific nav items
  if (userRole === 'OWNER' || userRole === 'MANAGER') {
    navItems.push(
      { label: 'Public Enquiries', href: '/portal/enquiries', icon: '💬' },
      { label: 'Service Requests', href: '/portal/requests', icon: '📨' },
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
      { label: 'My Projects', href: '/portal/reports', icon: '📝' },
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a1628] text-white flex flex-col flex-shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#b8860b] to-[#c9952c] flex items-center justify-center font-bold text-white">
              S
            </div>
            <div>
              <div className="font-bold text-base leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                S Mohanty
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#ffcb47] font-medium">
                Employee Portal
              </div>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4f6f] flex items-center justify-center text-white font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
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
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
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
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span className="text-base">🚪</span>
              Logout
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
