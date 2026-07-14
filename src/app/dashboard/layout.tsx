import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '@/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-[#e9ecef] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#b8860b] to-[#c9952c] flex items-center justify-center font-bold text-white">
              S
            </div>
            <div>
              <div className="font-bold text-base text-[#0f2038] leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                S Mohanty
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#b8860b] font-medium">
                Associates
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-[#495057] hover:text-[#0f2038] font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/requests" className="text-sm text-[#495057] hover:text-[#0f2038] font-medium transition-colors">
              My Requests
            </Link>
            <Link href="/dashboard/projects" className="text-sm text-[#495057] hover:text-[#0f2038] font-medium transition-colors">
              My Projects
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#0f2038]">{session.user.name}</p>
              <p className="text-xs text-[#6c757d]">{session.user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center text-white text-sm font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <form action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}>
              <button
                type="submit"
                className="text-xs text-[#6c757d] hover:text-red-500 font-medium transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
