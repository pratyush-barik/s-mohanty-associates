'use client';

import { useState, useActionState } from 'react';
import { submitServiceRequest } from '@/app/actions/service';
import Link from 'next/link';
import { serviceCategoryMap } from '@/lib/services';

export default function ServiceRequestPage() {
  const [state, action, pending] = useActionState(submitServiceRequest, undefined);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [phone, setPhone] = useState('');

  const availablePurposes = selectedCategory ? serviceCategoryMap[selectedCategory] || [] : [];

  if (state?.success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Request Submitted Successfully!
          </h2>
          <p className="text-sm text-[#6c757d] mb-6">
            {state.message} Our team will review your request and get back to you within 24–48 hours.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="btn btn-primary text-sm px-6 py-2.5">
              Go to Dashboard
            </Link>
            <Link href="/dashboard/requests" className="btn btn-outline text-sm px-6 py-2.5">
              View My Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Request a Valuation Service
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Fill in the details below and our team will review your request.
        </p>
      </div>

      {state?.message && !state.success && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.message}
        </div>
      )}

      <form action={action} className="card p-8 space-y-6">
        {/* Property Type & Purpose */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sr-property-type" className="block text-sm font-medium text-[#343a40] mb-1.5">
              Service Category *
            </label>
            <select
              id="sr-property-type"
              name="propertyType"
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
            >
              <option value="">Select Service Category</option>
              {Object.keys(serviceCategoryMap).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {state?.errors?.propertyType && (
              <p className="mt-1 text-xs text-red-500">{state.errors.propertyType[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="sr-purpose" className="block text-sm font-medium text-[#343a40] mb-1.5">
              Services Offered *
            </label>
            <select
              id="sr-purpose"
              name="purpose"
              required
              disabled={!selectedCategory}
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
            >
              <option value="">Select a service</option>
              {availablePurposes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {state?.errors?.purpose && (
              <p className="mt-1 text-xs text-red-500">{state.errors.purpose[0]}</p>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div>
          <label htmlFor="sr-details" className="block text-sm font-medium text-[#343a40] mb-1.5">
            Property Details *
          </label>
          <textarea
            id="sr-details"
            name="propertyDetails"
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none"
            placeholder="Describe the property — type, size, age, features, etc."
          />
          {state?.errors?.propertyDetails && (
            <p className="mt-1 text-xs text-red-500">{state.errors.propertyDetails[0]}</p>
          )}
        </div>

        {/* Property Address */}
        <div>
          <label htmlFor="sr-address" className="block text-sm font-medium text-[#343a40] mb-1.5">
            Property Address *
          </label>
          <textarea
            id="sr-address"
            name="propertyAddress"
            required
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none"
            placeholder="Complete address including city, district, state, and PIN code"
          />
          {state?.errors?.propertyAddress && (
            <p className="mt-1 text-xs text-red-500">{state.errors.propertyAddress[0]}</p>
          )}
        </div>

        {/* Contact Info Header */}
        <div className="pt-4 border-t border-[#e9ecef]">
          <h3 className="text-base font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Contact Information
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="sr-name" className="block text-sm font-medium text-[#343a40] mb-1.5">
              Contact Name *
            </label>
            <input
              id="sr-name"
              name="contactName"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
              placeholder="Your name"
            />
            {state?.errors?.contactName && (
              <p className="mt-1 text-xs text-red-500">{state.errors.contactName[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="sr-phone" className="block text-sm font-medium text-[#343a40] mb-1.5">
              Phone Number *
            </label>
            <input
              type="hidden"
              name="contactPhone"
              value={phone ? `+91${phone}` : ''}
            />
            <div className="flex items-center w-full rounded-xl border border-[#dee2e6] bg-white focus-within:ring-2 focus-within:ring-[#b8860b]/30 focus-within:border-[#b8860b] transition-all">
              <span className="pl-4 text-[#495057] text-sm font-medium select-none">
                +91
              </span>
              <span className="text-[#dee2e6] mx-3 select-none">|</span>
              <input
                id="sr-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) {
                    setPhone(val);
                  }
                }}
                className="w-full pr-4 py-3 bg-transparent text-[#212529] text-sm focus:outline-none placeholder:text-gray-400"
                placeholder="----------"
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>
            {state?.errors?.contactPhone && (
              <p className="mt-1 text-xs text-red-500">{state.errors.contactPhone[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="sr-email" className="block text-sm font-medium text-[#343a40] mb-1.5">
            Contact Email *
          </label>
          <input
            id="sr-email"
            name="contactEmail"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
            placeholder="you@example.com"
          />
          {state?.errors?.contactEmail && (
            <p className="mt-1 text-xs text-red-500">{state.errors.contactEmail[0]}</p>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="sr-notes" className="block text-sm font-medium text-[#343a40] mb-1.5">
            Additional Notes
          </label>
          <textarea
            id="sr-notes"
            name="additionalNotes"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none"
            placeholder="Any additional information or specific requirements..."
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary text-sm px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Request'
            )}
          </button>
          <Link href="/dashboard" className="text-sm text-[#6c757d] hover:text-[#0f2038] font-medium transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
