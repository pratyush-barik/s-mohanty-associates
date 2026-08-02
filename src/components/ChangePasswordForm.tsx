'use client';

import { useState, useEffect } from 'react';
import { changePassword } from '@/app/actions/auth';

interface ChangePasswordFormProps {
  portal: 'CLIENT' | 'EMPLOYEE';
}

export default function ChangePasswordForm({ portal }: ChangePasswordFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // OTP state
  const [requireOtp, setRequireOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [timer, setTimer] = useState(0);

  // Countdown timer
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

  // Password strength checks
  const checks = [
    { label: '12+ characters', ok: newPassword.length >= 12 },
    { label: 'Lowercase letter', ok: /[a-z]/.test(newPassword) },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(newPassword) },
    { label: 'Number', ok: /[0-9]/.test(newPassword) },
    { label: 'Special char (!@#$...)', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];
  const passedCount = checks.filter((c) => c.ok).length;
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-500'];
  const strengthTextColors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-lime-600', 'text-green-600'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('currentPassword', currentPassword);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);
    formData.append('portal', portal);
    if (requireOtp && otp) {
      formData.append('otp', otp);
    }

    const result = await changePassword(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.requireOtp) {
      // Step 1 → OTP sent, show OTP input
      setRequireOtp(true);
      setOtpEmail(result.email || '');
      setTimer(300); // 5 minutes = 300 seconds
      setMessage({ type: 'success', text: `A verification code has been sent to ${result.email}` });
    } else if (result.success) {
      // Step 2 → Password changed successfully
      setMessage({ type: 'success', text: '✅ Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setRequireOtp(false);
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 2500);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('currentPassword', currentPassword);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);
    formData.append('portal', portal);
    // No OTP → triggers a fresh OTP send

    const result = await changePassword(formData);
    if (result.requireOtp) {
      setTimer(300);
      setMessage({ type: 'success', text: 'New verification code sent!' });
    } else if (result.error) {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setMessage(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setRequireOtp(false);
    setTimer(0);
  };

  if (!isOpen) {
    return (
      <div className="card p-5 border border-red-200/60 bg-red-50/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-700">Password & Security</h3>
            <p className="text-[11px] text-red-500/80 mt-0.5">
              Change your account password
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Change Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 border border-red-200 bg-white space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-red-700" style={{ fontFamily: 'var(--font-heading)' }}>
          🔒 Change Password
        </h3>
        <button
          onClick={handleCancel}
          className="text-xs text-[#6c757d] hover:text-red-600 font-medium transition-colors"
        >
          ✕ Cancel
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm border font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── OTP Verification Step ── */}
        {requireOtp ? (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200/50 space-y-3">
              <div className="flex justify-between items-center">
                <label htmlFor="pw-change-otp" className="block text-sm font-semibold text-[#0f2038]">
                  Verification Code (6 digits)
                </label>
                {timer > 0 ? (
                  <span className="text-xs text-red-500 font-mono font-semibold">
                    Expires in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
              
              <input
                id="pw-change-otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-red-200 text-center font-mono tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                placeholder="000000"
              />
              <p className="text-[11px] text-[#6c757d]">
                🔒 A verification code was sent to <strong>{otpEmail}</strong>. Enter it above to confirm your password change.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Confirm & Change Password'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 pr-16"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#6c757d] hover:text-[#0f2038] uppercase tracking-wider"
                >
                  {showCurrentPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 pr-16"
                  placeholder="Minimum 12 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#6c757d] hover:text-[#0f2038] uppercase tracking-wider"
                >
                  {showNewPw ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Strength Meter */}
              {newPassword && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < passedCount ? strengthColors[passedCount] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      {checks.map((rule) => (
                        <span key={rule.label} className={`flex items-center gap-1 ${rule.ok ? 'text-green-600' : 'text-gray-400'}`}>
                          {rule.ok ? '✓' : '○'} {rule.label}
                        </span>
                      ))}
                    </div>
                    <span className={`text-[10px] font-semibold ${strengthTextColors[passedCount] || 'text-gray-400'}`}>
                      {strengthLabels[passedCount] || ''}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-400 bg-red-50/30'
                    : 'border-[#dee2e6]'
                }`}
                placeholder="Re-enter new password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passedCount < 5 || !currentPassword || newPassword !== confirmPassword}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Update Password'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
