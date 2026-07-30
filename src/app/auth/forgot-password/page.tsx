'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement password reset flow with token generation and email
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-[#FFF9F0] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#0d3d24] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Check Your Email
        </h1>
        <p className="text-sm text-[#4a6f4a] mb-6">
          If an account exists with <span className="text-[#0d3d24] font-medium">{email}</span>,
          we&apos;ve sent password reset instructions.
        </p>
        <Link href="/auth/client-login" className="btn btn-primary text-sm px-6 py-2.5">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF9F0] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald-100">
      <h1
        className="text-2xl font-bold text-[#0d3d24] text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Reset Password
      </h1>
      <p className="text-[#4a6f4a] text-sm text-center mb-6">
        Enter your email and we&apos;ll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-[#2d4a2d] mb-1.5">
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#dcfce7] text-[#0d3d24] text-sm placeholder:text-[#6b8f6b] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              Sending...
            </span>
          ) : (
            'Send Reset Instructions'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#166534]">
        Remember your password?{' '}
        <Link href="/auth/client-login" className="text-[#b8860b] hover:text-[#9a6f08] font-medium transition-colors">
          Log In
        </Link>
      </p>
    </div>
  );
}
