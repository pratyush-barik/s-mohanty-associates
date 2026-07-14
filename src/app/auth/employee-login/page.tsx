'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';

export default function EmployeeLoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="glass rounded-2xl p-8 border border-[#b8860b]/30">
      <div className="flex justify-center mb-4">
        <span className="px-3 py-1 bg-[#b8860b]/20 text-[#ffcb47] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#b8860b]/30">
          Staff Portal
        </span>
      </div>
      <h1
        className="text-2xl font-bold text-white text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Employee Login
      </h1>
      <p className="text-white/50 text-sm text-center mb-6">
        Enter your credentials to access the internal system
      </p>

      {state?.message && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-white/70 mb-1.5">
            Work Email Address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="employee@smohantyassociates.com"
          />
          {state?.errors?.email && (
             <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>
          )}
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
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-400">{state.errors.password[0]}</p>
          )}
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-xs text-[#ffcb47]/70 hover:text-[#ffcb47] transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

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
              Logging In...
            </span>
          ) : (
            'Log In to Portal'
          )}
        </button>
      </form>
    </div>
  );
}
