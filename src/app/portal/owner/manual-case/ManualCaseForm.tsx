'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createManualCase } from '@/app/actions/project';

type Manager = { id: string; name: string; employeeId: string };

export default function ManualCaseForm({ managers }: { managers: Manager[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    propertyType: '',
    purpose: '',
    propertyAddress: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    propertyDetails: '',
    managerId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => fd.append(key, val));

    const result = await createManualCase(fd);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/portal/owner');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Guest Client Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#0f2038] border-b pb-2">1. Client Details (Email-Only)</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Organisation / Client Name *</label>
            <input type="text" required value={formData.guestName} onChange={e => setFormData({ ...formData, guestName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Client Email (For PDF Delivery) *</label>
            <input type="email" required value={formData.guestEmail} onChange={e => setFormData({ ...formData, guestEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Client Phone</label>
            <input type="tel" value={formData.guestPhone} onChange={e => setFormData({ ...formData, guestPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" />
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#0f2038] border-b pb-2">2. Property Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Property Type *</label>
            <select required value={formData.propertyType} onChange={e => setFormData({ ...formData, propertyType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm">
              <option value="">Select Service Category</option>
              <option value="Mortgage & Loan Security Valuation">Mortgage & Loan Security Valuation</option>
              <option value="Banking & Financial Institution Services">Banking & Financial Institution Services</option>
              <option value="SARFAESI & Recovery Valuation">SARFAESI & Recovery Valuation</option>
              <option value="Land Valuation">Land Valuation</option>
              <option value="Building Valuation">Building Valuation</option>
              <option value="Project & Construction Consultancy">Project & Construction Consultancy</option>
              <option value="Corporate & Fixed Asset Valuation">Corporate & Fixed Asset Valuation</option>
              <option value="IBC & Insolvency Valuation Support">IBC & Insolvency Valuation Support</option>
              <option value="Development & Investment Advisory">Development & Investment Advisory</option>
              <option value="Government & Statutory Valuation">Government & Statutory Valuation</option>
              <option value="Specialized Property Valuation">Specialized Property Valuation</option>
              <option value="Market Research & Advisory">Market Research & Advisory</option>
              <option value="Customized Valuation & Advisory">Customized Valuation & Advisory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Purpose of Valuation *</label>
            <input type="text" required value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" placeholder="e.g. Bank Loan, Insurance" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[#343a40] mb-1">Property Address *</label>
            <textarea required rows={2} value={formData.propertyAddress} onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[#343a40] mb-1">Detailed Description *</label>
            <textarea required rows={3} value={formData.propertyDetails} onChange={e => setFormData({ ...formData, propertyDetails: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm resize-none" />
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#0f2038] border-b pb-2">3. Assignment</h3>
        <div>
          <label className="block text-sm font-medium text-[#343a40] mb-1">Assign Manager *</label>
          <select required value={formData.managerId} onChange={e => setFormData({ ...formData, managerId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm">
            <option value="">Select a Manager</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.employeeId})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary px-8 py-2.5 text-sm"
        >
          {isSubmitting ? 'Creating Case...' : 'Create Case & Assign Manager'}
        </button>
      </div>
    </form>
  );
}
