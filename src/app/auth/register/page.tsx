'use client';

import { useActionState, useState, useEffect } from 'react';
import { signup, requestRegistrationOtp } from '@/app/actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'ORGANISATION'>('INDIVIDUAL');
  
  // Verification states
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

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

  const handleSendOtp = async () => {
    if (!email) {
      setVerifyError('Please enter your email address first.');
      return;
    }
    setOtpLoading(true);
    setVerifyError(null);
    setVerifySuccess(null);

    const result = await requestRegistrationOtp(email);
    if (result.error) {
      setVerifyError(result.error);
    } else {
      setOtpSent(true);
      setVerifySuccess('Verification code sent! Check your email inbox.');
      setTimer(90); // 90 seconds timer limit
    }
    setOtpLoading(false);
  };

  return (
    <div className="bg-[#FFF9F0] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 max-w-lg w-full mx-auto">
      <h1
        className="text-2xl font-bold text-[#0d3d24] text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Create Account
      </h1>
      <p className="text-[#4a6f4a] text-sm text-center mb-6">
        Register to request valuation services
      </p>

      {state?.message && !state.success && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          {state.message}
        </div>
      )}

      {state?.success && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm">
          {state.message}{' '}
          <Link href="/auth/client-login" className="underline font-medium">
            Log in here
          </Link>
        </div>
      )}

      {verifyError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          {verifyError}
        </div>
      )}

      {verifySuccess && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm">
          {verifySuccess}
        </div>
      )}

      <div className="flex bg-[#f0f4f1] p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setClientType('INDIVIDUAL')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            clientType === 'INDIVIDUAL' ? 'bg-[#b8860b] text-white' : 'text-[#4a6f4a] hover:text-[#0d3d24]'
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setClientType('ORGANISATION')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            clientType === 'ORGANISATION' ? 'bg-[#b8860b] text-white' : 'text-[#4a6f4a] hover:text-[#0d3d24]'
          }`}
        >
          Organisation
        </button>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="clientType" value={clientType} />

        {clientType === 'ORGANISATION' && (
          <div className="animate-fade-in">
            <label htmlFor="register-organisationName" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
              Organisation Name
            </label>
            <input
              id="register-organisationName"
              name="organisationName"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
              placeholder="e.g. State Bank of India, LIC Housing, etc."
            />
            {state?.errors?.organisationName && (
              <p className="mt-1 text-xs text-red-600">{state.errors.organisationName[0]}</p>
            )}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
            {clientType === 'ORGANISATION' ? 'Contact Person Name' : 'Full Name'}
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="Enter full name"
          />
          {state?.errors?.name && (
            <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Email Address with Verify Action */}
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
            Email Address
          </label>
          <div className="flex gap-2">
            <input
              id="register-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
              className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all disabled:opacity-60"
              placeholder="you@example.com"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpLoading || !email || (otpSent && timer > 0)}
              className="bg-[#b8860b] hover:bg-[#b8860b]/90 text-white text-xs font-semibold px-4 rounded-xl disabled:opacity-50 transition-colors"
            >
              {otpLoading ? 'Sending...' : otpSent ? 'Resend' : 'Verify'}
            </button>
          </div>
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        {/* OTP Input Fields with 90s Timer */}
        {otpSent && (
          <div className="animate-fade-in space-y-2 bg-white/80 p-4 rounded-2xl border border-[#dcfce7]">
            <div className="flex justify-between items-center">
              <label htmlFor="register-otp" className="block text-sm font-medium text-[#166534]">
                Verification Code (6 digits)
              </label>
              {timer > 0 ? (
                <span className="text-xs text-[#b8860b] font-mono">
                  Resend code in {timer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-xs text-[#b8860b] font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
            <input
              id="register-otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              pattern="\d{6}"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-center font-mono tracking-widest text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
              placeholder="000000"
            />
            {state?.errors?.otp && (
              <p className="mt-1 text-xs text-red-600">{state.errors.otp[0]}</p>
            )}
          </div>
        )}

        {/* Mobile */}
        <div>
          <label htmlFor="register-mobile" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
            Mobile Number
          </label>
          <input
            id="register-mobile"
            name="mobile"
            type="tel"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="+91 XXXXX XXXXX"
          />
          {state?.errors?.mobile && (
            <p className="mt-1 text-xs text-red-600">{state.errors.mobile[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="Minimum 8 characters"
          />
          {state?.errors?.password && (
            <div className="mt-1 space-y-0.5">
              {state.errors.password.map((err) => (
                <p key={err} className="text-xs text-red-600">• {err}</p>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || !otpSent}
          className="btn btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-[#166534]">
        Already have an account?{' '}
        <Link href="/auth/client-login" className="text-[#b8860b] hover:text-[#9a6f08] font-medium transition-colors">
          Log In
        </Link>
      </p>
    </div>
  );
}
