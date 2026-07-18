'use client';

import { useActionState, useState } from 'react';
import { signup } from '@/app/actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'ORGANISATION'>('INDIVIDUAL');

  return (
    <div className="glass rounded-2xl p-8 border border-white/10">
      <h1
        className="text-2xl font-bold text-white text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Create Account
      </h1>
      <p className="text-white/50 text-sm text-center mb-6">
        Register to request valuation services
      </p>

      {state?.message && !state.success && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {state.message}
        </div>
      )}

      {state?.success && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
          {state.message}{' '}
          <Link href="/auth/client-login" className="underline font-medium">
            Log in here
          </Link>
        </div>
      )}

      <div className="flex bg-white/5 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setClientType('INDIVIDUAL')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            clientType === 'INDIVIDUAL' ? 'bg-[#b8860b] text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          Individual
        </button>
        <button
          type="button"
          onClick={() => setClientType('ORGANISATION')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            clientType === 'ORGANISATION' ? 'bg-[#b8860b] text-white' : 'text-white/60 hover:text-white'
          }`}
        >
          Organisation
        </button>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="clientType" value={clientType} />

        {clientType === 'ORGANISATION' && (
          <div className="animate-fade-in">
            <label htmlFor="register-organisationName" className="block text-sm font-medium text-white/70 mb-1.5">
              Organisation Name
            </label>
            <input
              id="register-organisationName"
              name="organisationName"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
              placeholder="e.g. State Bank of India, LIC Housing, etc."
            />
            {state?.errors?.organisationName && (
              <p className="mt-1 text-xs text-red-400">{state.errors.organisationName[0]}</p>
            )}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-white/70 mb-1.5">
            {clientType === 'ORGANISATION' ? 'Contact Person Name' : 'Full Name'}
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="Enter full name"
          />
          {state?.errors?.name && (
            <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-white/70 mb-1.5">
            Email Address
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="you@example.com"
          />
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>
          )}
        </div>

        {/* Mobile */}
        <div>
          <label htmlFor="register-mobile" className="block text-sm font-medium text-white/70 mb-1.5">
            Mobile Number
          </label>
          <input
            id="register-mobile"
            name="mobile"
            type="tel"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="+91 XXXXX XXXXX"
          />
          {state?.errors?.mobile && (
            <p className="mt-1 text-xs text-red-400">{state.errors.mobile[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-white/70 mb-1.5">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-[#b8860b]/50 transition-all"
            placeholder="Minimum 8 characters"
          />
          {state?.errors?.password && (
            <div className="mt-1 space-y-0.5">
              {state.errors.password.map((err) => (
                <p key={err} className="text-xs text-red-400">• {err}</p>
              ))}
            </div>
          )}
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
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="mt-6 text-center text-sm text-white/40">
        Already have an account?{' '}
        <Link href="/auth/client-login" className="text-[#ffcb47] hover:text-[#ffcb47]/80 font-medium transition-colors">
          Log In
        </Link>
      </p>
    </div>
  );
}
