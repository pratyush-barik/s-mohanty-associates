import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from '@/auth';
import ActiveLink from '@/components/ui/ActiveLink';
import { ClientHeaderProfile } from '@/components/layout/ClientHeaderProfile';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/client-login');
  
  const userRole = (session.user as any).role;
  if (userRole !== 'CLIENT') redirect('/portal');

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-[#e9ecef] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/smohantyassociate_logo.png"
              alt="S Mohanty Associates"
              width={240}
              height={60}
              priority
              className="h-14 w-auto object-contain"
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

          {/* User Menu Dropdown (Kokonut UI Profile Dropdown) */}
          <ClientHeaderProfile
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
            handleLogout={async () => {
              'use server';
              const redirectUrl = process.env.NODE_ENV === 'production' 
                ? 'https://smohantyassociates.com/' 
                : '/';
              await signOut({ redirectTo: redirectUrl });
            }}
          />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1440px] mx-auto px-6 py-4">
        {children}
      </main>
    </div>
  );
}
