'use client';

import { useState, type FormEvent } from 'react';
import { createEmployee } from '@/app/actions/employee';

export default function CreateEmployeeForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEmployee(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || 'Employee created!' });
      e.currentTarget.reset();
      setTimeout(() => setIsOpen(false), 2000);
    }

    setLoading(false);
  };

  return (
    <div className="card overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setMessage(null); }}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#f8f9fa] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">➕</span>
          <div>
            <p className="text-sm font-bold text-[#0f2038]">Create New Employee</p>
            <p className="text-xs text-[#6c757d]">Add a manager, field agent, or report staff member</p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-[#adb5bd] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Form */}
      {isOpen && (
        <div className="px-6 pb-6 border-t border-[#e9ecef]">
          {message && (
            <div className={`mt-4 p-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emp-name" className="block text-xs font-medium text-[#343a40] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="emp-name"
                  name="name"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                  placeholder="Employee name"
                />
              </div>
              <div>
                <label htmlFor="emp-id" className="block text-xs font-medium text-[#343a40] mb-1.5">
                  Employee ID *
                </label>
                <input
                  id="emp-id"
                  name="employeeId"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] font-mono focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                  placeholder="e.g. EMP-101"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emp-email" className="block text-xs font-medium text-[#343a40] mb-1.5">
                  Email *
                </label>
                <input
                  id="emp-email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                  placeholder="employee@email.com"
                />
              </div>
              <div>
                <label htmlFor="emp-mobile" className="block text-xs font-medium text-[#343a40] mb-1.5">
                  Mobile
                </label>
                <input
                  id="emp-mobile"
                  name="mobile"
                  type="tel"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="emp-role" className="block text-xs font-medium text-[#343a40] mb-1.5">
                  Role *
                </label>
                <select
                  id="emp-role"
                  name="role"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                >
                  <option value="">Select role</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FIELD_EMPLOYEE">Field Inspector</option>
                  <option value="REPORT_EMPLOYEE">Report Analyst</option>
                </select>
              </div>
              <div>
                <label htmlFor="emp-designation" className="block text-xs font-medium text-[#343a40] mb-1.5">
                  Designation
                </label>
                <input
                  id="emp-designation"
                  name="designation"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                  placeholder="e.g. Senior Surveyor"
                />
              </div>
            </div>

            <div>
              <label htmlFor="emp-password" className="block text-xs font-medium text-[#343a40] mb-1.5">
                Temporary Password *
              </label>
              <input
                id="emp-password"
                name="password"
                type="text"
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] font-mono focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
                placeholder="Min 8 characters — employee will use this to login"
              />
              <p className="text-[10px] text-[#adb5bd] mt-1">
                Share this password securely with the employee. They will use it to log in for the first time.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-sm px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Employee'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
