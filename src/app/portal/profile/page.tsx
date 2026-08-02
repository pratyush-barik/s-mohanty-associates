import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import ChangePasswordForm from '@/components/ChangePasswordForm';

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_EMPLOYEE: 'Field Inspector',
  REPORT_EMPLOYEE: 'Report Analyst',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      mobile: true,
      employeeId: true,
      designation: true,
      profilePhoto: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          My Profile
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">View your details and manage your profile photo.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Photo Upload */}
        <div className="lg:col-span-1">
          <ProfilePhotoUpload
            currentPhoto={user.profilePhoto}
            userName={user.name}
          />
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-base font-bold text-[#0f2038] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
            Employee Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <DetailField label="Full Name" value={user.name} />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Mobile" value={user.mobile || 'Not provided'} />
            <DetailField label="Employee ID" value={user.employeeId || 'Not assigned'} highlight />
            <DetailField label="Role" value={roleLabels[user.role] || user.role} />
            <DetailField label="Designation" value={user.designation || 'Not specified'} />
            <DetailField
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-[#e9ecef]">
            <p className="text-xs text-[#adb5bd]">
              To update your name, email, or other details, please contact the administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <ChangePasswordForm portal="EMPLOYEE" />
    </div>
  );
}

function DetailField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#adb5bd] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-mono font-bold text-[#b8860b]' : 'font-medium text-[#0f2038]'}`}>
        {value}
      </p>
    </div>
  );
}
