import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from '@/auth';
import ActiveLink from '@/components/ui/ActiveLink';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/client-login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'CLIENT') redirect('/portal');

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-[#e9ecef] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/smohantyassociate_logo.png"
              alt="S Mohanty Associates"
              width={180}
              height={45}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <ActiveLink href="/dashboard" className="text-sm text-[#495057] hover:text-[#0f2038] font-medium transition-colors" activeClassName="!text-[#b8860b] font-bold">
              Dashboard
            </ActiveLink>
            <ActiveLink href="/dashboard/requests" className="text-sm text-[#495057] hover:text-[#0f2038] font-medium transition-colors" activeClassName="!text-[#b8860b] font-bold">
              My Requests
            </ActiveLink>
            <ActiveLink href="/dashboard/projects" className="text-sm text-[#495057] hover:text-[#0f2038] font-medium transition-colors" activeClassName="!text-[#b8860b] font-bold">
              My Projects
            </ActiveLink>
          </div>

          {/* User Menu Dropdown (Triggered on hover over user icon) */}
          <div className="relative group flex items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-[#0f2038] group-hover:text-[#b8860b] transition-colors">{session.user.name}</p>
                <p className="text-xs text-[#6c757d]">{session.user.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:ring-2 group-hover:ring-[#b8860b]/40 transition-all">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-[100%] w-48 bg-white border border-[#e9ecef] rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 py-1.5 mt-[-2px] origin-top-right">
              {/* User Stats/Info */}
              <div className="px-4 py-2 border-b border-[#e9ecef] sm:hidden">
                <p className="text-sm font-semibold text-[#0f2038] truncate">{session.user.name}</p>
                <p className="text-xs text-[#6c757d] truncate">{session.user.email}</p>
              </div>
              
              <Link 
                href="/dashboard/profile" 
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#495057] hover:bg-[#f8f9fa] hover:text-[#0f2038] font-medium transition-all"
              >
                👤 My Profile
              </Link>
              
              <form action={async () => {
                'use server';
                const redirectUrl = process.env.NODE_ENV === 'production' 
                  ? 'https://smohantyassociates.com/' 
                  : '/';
                await signOut({ redirectTo: redirectUrl });
              }} className="border-t border-[#e9ecef] mt-1.5 pt-1.5">
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-all"
                >
                  🚪 Logout
                </button>
              </form>
            </div>
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
