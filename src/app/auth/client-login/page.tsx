'use client';

import { useActionState, useState } from 'react';
import { login, requestOtp } from '@/app/actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  
  // OTP state
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email) {
      setOtpError('Please enter your email address first.');
      return;
    }
    
    setOtpLoading(true);
    setOtpError(null);
    setOtpMessage(null);

    const result = await requestOtp(email, 'CLIENT');

    if (result.error) {
      setOtpError(result.error);
    } else {
      setOtpSent(true);
      setOtpMessage('A 6-digit verification code has been sent to your email.');
    }
    setOtpLoading(false);
  };

  return (
    <div className="glass rounded-2xl p-8 border border-white/10 max-w-md w-full mx-auto">
      <div className="flex justify-center mb-4">
        <span className="px-3 py-1 bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20">
          Client Portal
        </span>
      </div>
      
      <h1
        className="text-2xl font-bold text-white text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Welcome Back
      </h1>
      
      <p className="text-white/50 text-sm text-center mb-6">
        Choose your preferred login method
      </p>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setLoginMethod('PASSWORD');
            setOtpError(null);
            setOtpMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            loginMethod === 'PASSWORD' ? 'bg-[#b8860b] text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod('OTP');
            setOtpError(null);
            setOtpMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            loginMethod === 'OTP' ? 'bg-[#b8860b] text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          OTP Login
        </button>
      </div>

      {state?.message && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {state.message}
        </div>
      )}

      {otpError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {otpError}
        </div>
      )}

      {otpMessage && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
          {otpMessage}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="portal" value="CLIENT" />
        
        {loginMethod === 'PASSWORD' ? (
          <>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-white/70 mb-1.5">
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-white/70 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#ffcb47]/70 hover:text-[#ffcb47] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Email OTP Input */}
            <div>
              <label htmlFor="otp-email" className="block text-sm font-medium text-white/70 mb-1.5">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  id="otp-email"
                  name="email"
                  type="email"
                  required
                  readOnly={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all disabled:opacity-50"
                  placeholder="you@example.com"
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !email}
                    className="bg-[#b8860b] hover:bg-[#b8860b]/90 text-white text-xs font-semibold px-4 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            {/* OTP Code Verification */}
            {otpSent && (
              <div className="animate-fade-in">
                <label htmlFor="otp-code" className="block text-sm font-medium text-white/70 mb-1.5">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  id="otp-code"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center font-mono tracking-widest placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
                  placeholder="000000"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-white/40">Code is valid for 5 minutes</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs text-[#ffcb47]/70 hover:text-[#ffcb47] hover:underline transition-colors"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || (loginMethod === 'OTP' && !otpSent)}
          className="btn btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              Logging In...
            </span>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm text-white/40">
        Don't have an account?{' '}
        <Link href="/auth/register" className="text-[#ffcb47] hover:text-[#ffcb47]/80 font-medium transition-colors">
          Create Account
        </Link>
      </p>
    </div>
  );
}
