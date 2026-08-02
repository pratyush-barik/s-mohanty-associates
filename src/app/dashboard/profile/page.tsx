import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EditProfileForm from './EditProfileForm';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default async function ClientProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/client-login');

  const client = await prisma.client.findUnique({
    where: { id: session.user.id },
    include: {
      individual: true,
      organisation: true,
    },
  });

  if (!client) redirect('/auth/client-login');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Profile Settings
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Manage your personal details, switch your account type, or edit organisation details.
        </p>
      </div>

      <EditProfileForm client={client as any} />

      {/* Change Password Section */}
      <ChangePasswordForm portal="CLIENT" />
    </div>
  );
}
