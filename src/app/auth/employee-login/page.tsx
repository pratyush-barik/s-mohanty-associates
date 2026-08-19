'use client';

import { useActionState, useState, useEffect } from 'react';
import { login, requestOtp } from '@/app/actions/auth';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function EmployeeLoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  
  // 2FA state management
  const [require2FA, setRequire2FA] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Sync state transitions when server action responds
  useEffect(() => {
    if (state?.require2FA) {
      setRequire2FA(true);
      if (state.email) {
        setEmail(state.email);
      }
      setTimer(90); // 90 seconds limit for 2FA OTP
    }
  }, [state]);

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

  const handleResendOtp = async () => {
    setResending(true);
    setResendError(null);
    setResendSuccess(null);
    
    const result = await requestOtp(email, 'EMPLOYEE');
    if (result.error) {
      setResendError(result.error);
    } else {
      setResendSuccess('A new 2FA code has been sent to your work email.');
      setTimer(90); // Restart 90s countdown
    }
    setResending(false);
  };

  return (
    <div className="bg-[#FFF9F0] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 max-w-md w-full mx-auto">
      <div className="flex justify-center mb-4">
        <span className="px-3 py-1 bg-[#166534]/10 text-[#166534] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#166534]/20">
          Staff Portal
        </span>
      </div>
      
      <h1
        className="text-2xl font-bold text-[#0d3d24] text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {require2FA ? 'Two-Factor Authentication' : 'Employee Login'}
      </h1>
      
      <p className="text-[#4a6f4a] text-sm text-center mb-6">
        {require2FA 
          ? `Enter the 6-digit security code sent to ${email}`
          : 'Enter your credentials to access the internal system'
        }
      </p>

      {state?.message && !state.require2FA && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          {state.message}
        </div>
      )}

      {resendError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          {resendError}
        </div>
      )}

      {resendSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 text-sm">
          {resendSuccess}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="portal" value="EMPLOYEE" />
        
        {/* Pass fields hidden if in 2FA mode to satisfy NextAuth credentials submission */}
        {require2FA ? (
          <>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="password" value={password} />
            
            {/* OTP Verification Input with 90s Timer limits */}
            <div className="space-y-2 bg-white/80 p-4 rounded-2xl border border-[#dcfce7]">
              <div className="flex justify-between items-center">
                <label htmlFor="login-otp" className="block text-sm font-medium text-[#166534]">
                  Security Code (6 digits)
                </label>
                {timer > 0 ? (
                  <span className="text-xs text-[#b8860b] font-mono">
                    Resend in {timer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-xs text-[#b8860b] font-semibold hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Resending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
              
              <input
                id="login-otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-center font-mono tracking-widest text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
                placeholder="000000"
              />
            </div>
          </>
        ) : (
          <>
            {/* Email Address */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
                Work Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
                placeholder="employee@smohantyassociates.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#6b8f6b] hover:text-[#0d3d24] focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#b8860b] hover:text-[#9a6f08] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              {require2FA ? 'Verifying Code...' : 'Logging In...'}
            </span>
          ) : (
            require2FA ? 'Confirm & Log In' : 'Log In'
          )}
        </button>
      </form>
    </div>
  );
}
