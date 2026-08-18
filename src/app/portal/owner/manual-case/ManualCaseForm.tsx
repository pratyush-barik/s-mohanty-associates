'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createManualCase } from '@/app/actions/project';
import { serviceCategoryMap } from '@/lib/services';

type Manager = { id: string; name: string; employeeId: string };

export default function ManualCaseForm({ managers }: { managers: Manager[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    clientType: 'INDIVIDUAL',
    clientName: '',
    organisationName: '',
    guestEmail: '',
    guestPhone: '',
    propertyType: '',
    purpose: '',
    propertyAddress: '',
    propertyDetails: '',
    managerId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (formData.guestPhone && formData.guestPhone.length !== 10) {
      setError('Client Phone must be exactly 10 digits.');
      setIsSubmitting(false);
      return;
    }

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'guestPhone') {
        fd.append(key, val ? `+91${val}` : '');
      } else {
        fd.append(key, val);
      }
    });

    const result = await createManualCase(fd);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/portal/owner');
    }
  };

  const availablePurposes = formData.propertyType ? serviceCategoryMap[formData.propertyType] || [] : [];

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
            <label className="block text-sm font-medium text-[#343a40] mb-1">Client Type *</label>
            <select
              required
              value={formData.clientType}
              onChange={e => setFormData({ ...formData, clientType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="ORGANISATION">Organisation</option>
            </select>
          </div>
          
          {formData.clientType === 'ORGANISATION' && (
            <div>
              <label className="block text-sm font-medium text-[#343a40] mb-1">Organisation Name *</label>
              <input type="text" required value={formData.organisationName} onChange={e => setFormData({ ...formData, organisationName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" placeholder="e.g. Acme Corp" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Client Name *</label>
            <input type="text" required value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" placeholder="Contact Person Name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Client Email (For PDF Delivery) *</label>
            <input type="email" required value={formData.guestEmail} onChange={e => setFormData({ ...formData, guestEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Client Phone</label>
            <div className="flex items-center w-full rounded-lg border border-[#dee2e6] bg-white focus-within:ring-2 focus-within:ring-[#b8860b]/30 focus-within:border-[#b8860b] transition-all">
              <span className="pl-3 text-[#495057] text-sm font-medium select-none">
                +91
              </span>
              <span className="text-[#dee2e6] mx-2 select-none">|</span>
              <input
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) {
                    setFormData({ ...formData, guestPhone: val });
                  }
                }}
                className="w-full pr-3 py-2 bg-transparent text-[#212529] text-sm focus:outline-none placeholder:text-gray-400"
                placeholder="----------"
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#0f2038] border-b pb-2">2. Property Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Service Category *</label>
            <select required value={formData.propertyType} onChange={e => setFormData({ ...formData, propertyType: e.target.value, purpose: '' })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm">
              <option value="">Select Service Category</option>
              {Object.keys(serviceCategoryMap).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1">Services Offered *</label>
            <select required value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#dee2e6] text-sm" disabled={!formData.propertyType}>
              <option value="">Select a service</option>
              {availablePurposes.map(purpose => (
                <option key={purpose} value={purpose}>{purpose}</option>
              ))}
            </select>
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
