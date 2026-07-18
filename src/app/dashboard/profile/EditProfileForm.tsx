'use client';

import { useState } from 'react';
import { updateClientProfile } from '@/app/actions/auth';

interface Client {
  id: string;
  email: string;
  clientType: 'INDIVIDUAL' | 'ORGANISATION';
  individual?: {
    name: string;
    mobile: string | null;
  } | null;
  organisation?: {
    organisationName: string;
    contactName: string;
    mobile: string | null;
  } | null;
}

interface EditProfileFormProps {
  client: Client;
}

export default function EditProfileForm({ client }: EditProfileFormProps) {
  const [clientType, setClientType] = useState<'INDIVIDUAL' | 'ORGANISATION'>(client.clientType);
  const [name, setName] = useState(
    clientType === 'INDIVIDUAL'
      ? client.individual?.name || ''
      : client.organisation?.contactName || ''
  );
  const [email, setEmail] = useState(client.email);
  const [mobile, setMobile] = useState(
    clientType === 'INDIVIDUAL'
      ? client.individual?.mobile || ''
      : client.organisation?.mobile || ''
  );
  const [organisationName, setOrganisationName] = useState(
    client.organisation?.organisationName || ''
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync inputs if type changes
  const handleTypeChange = (type: 'INDIVIDUAL' | 'ORGANISATION') => {
    setClientType(type);
    if (type === 'INDIVIDUAL') {
      setName(client.individual?.name || '');
      setMobile(client.individual?.mobile || '');
    } else {
      setName(client.organisation?.contactName || '');
      setMobile(client.organisation?.mobile || '');
      setOrganisationName(client.organisation?.organisationName || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('clientType', clientType);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('mobile', mobile);
    if (clientType === 'ORGANISATION') {
      formData.append('organisationName', organisationName);
    }

    const result = await updateClientProfile(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Account Type Tabs */}
      <div className="card p-5 border border-[#b8860b]/20 bg-[#b8860b]/5">
        <label className="block text-xs font-bold text-[#b8860b] uppercase tracking-wider mb-3">
          Account Profile Type
        </label>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => handleTypeChange('INDIVIDUAL')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              clientType === 'INDIVIDUAL' ? 'bg-[#b8860b] text-white' : 'text-[#6c757d] hover:text-[#0f2038]'
            }`}
          >
            Individual Client
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('ORGANISATION')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              clientType === 'ORGANISATION' ? 'bg-[#b8860b] text-white' : 'text-[#6c757d] hover:text-[#0f2038]'
            }`}
          >
            Organisation Profile
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        {clientType === 'ORGANISATION' && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Organisation Name
            </label>
            <input
              type="text"
              required
              value={organisationName}
              onChange={(e) => setOrganisationName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
              placeholder="e.g. State Bank of India, LIC Housing, etc."
            />
            <p className="text-[10px] text-[#8e98a2] mt-1">
              🏢 If you leave your former organisation to join a new one, update this name to re-bind your account.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#343a40] mb-1.5">
            {clientType === 'ORGANISATION' ? 'Contact Person Name' : 'Full Name'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
            placeholder="Enter name"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
