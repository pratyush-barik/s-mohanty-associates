'use client';

import { useState, useEffect } from 'react';
import { updateClientProfile } from '@/app/actions/auth';

interface Client {
  id: string;
  email: string;
  clientType: 'INDIVIDUAL' | 'ORGANISATION';
  individual?: {
    name: string;
    mobile: string | null;
  } | null;
  organisation?: {
    organisationName: string;
    contactName: string;
    mobile: string | null;
  } | null;
}

interface EditProfileFormProps {
  client: Client;
}

export default function EditProfileForm({ client }: EditProfileFormProps) {
  const clientType = client.clientType; // Read-only locked profile type

  // Input states
  const [name, setName] = useState(
    clientType === 'INDIVIDUAL'
      ? client.individual?.name || ''
      : client.organisation?.contactName || ''
  );
  const [email, setEmail] = useState(client.email);
  const [mobile, setMobile] = useState(
    clientType === 'INDIVIDUAL'
      ? client.individual?.mobile || ''
      : client.organisation?.mobile || ''
  );
  const [organisationName, setOrganisationName] = useState(
    client.organisation?.organisationName || ''
  );

  // OTP Verification state
  const [requireVerification, setRequireVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('mobile', mobile);
    if (clientType === 'ORGANISATION') {
      formData.append('organisationName', organisationName);
    }
    if (requireVerification) {
      formData.append('otp', otp);
    }

    const result = await updateClientProfile(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.requireVerification) {
      setRequireVerification(true);
      setTimer(90); // 90 seconds limit
      setMessage({ type: 'success', text: `A verification code has been sent to your connected email: ${result.email}` });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setRequireVerification(false);
      setOtp('');
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  const handleRequestNewOtp = async () => {
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('mobile', mobile);
    if (clientType === 'ORGANISATION') {
      formData.append('organisationName', organisationName);
    }

    const result = await updateClientProfile(formData);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.requireVerification) {
      setTimer(90); // Restart 90s timer
      setMessage({ type: 'success', text: 'New verification code sent!' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Account Type Badge (Hardcoded & Locked) */}
      <div className="card p-5 border border-gray-200 bg-[#f8f9fa] flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-[#6c757d] uppercase tracking-wider">
            Account Type
          </label>
          <p className="text-sm font-semibold text-[#0f2038] mt-1">
            {clientType === 'INDIVIDUAL' ? 'Individual Client Profile' : 'Organisation Profile'}
          </p>
        </div>
        <span className="px-3 py-1 bg-gray-200/50 text-[#495057] text-[10px] font-bold uppercase rounded-full tracking-wider">
          Locked
        </span>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        {requireVerification ? (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white/5 p-4 rounded-2xl border border-[#b8860b]/20 bg-[#b8860b]/5 space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="profile-otp" className="block text-sm font-semibold text-[#0f2038]">
                  Verification Code (6 digits)
                </label>
                {timer > 0 ? (
                  <span className="text-xs text-[#b8860b] font-mono font-semibold">
                    Resend in {timer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestNewOtp}
                    disabled={loading}
                    className="text-xs text-[#b8860b] font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              
              <input
                id="profile-otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] text-center font-mono tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                placeholder="000000"
              />
              <p className="text-[11px] text-[#6c757d]">
                🔒 For security, a code has been sent to your currently registered email address to verify these updates.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Confirm Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequireVerification(false);
                  setOtp('');
                  setMessage(null);
                }}
                className="px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {clientType === 'ORGANISATION' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Organisation Name
                </label>
                <input
                  type="text"
                  required
                  value={organisationName}
                  onChange={(e) => setOrganisationName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                  placeholder="e.g. State Bank of India, LIC Housing, etc."
                />
                <p className="text-[10px] text-[#8e98a2] mt-1">
                  🏢 If you leave your former organisation to join a new one, update this name to bind your account to the new entity.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                {clientType === 'ORGANISATION' ? 'Contact Person Name' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                placeholder="Enter name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
            >
              {loading ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
