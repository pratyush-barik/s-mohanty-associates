'use client';

import { useState } from 'react';
import { requestClientRework } from '@/app/actions/project';

interface ClientReworkFormProps {
  projectId: string;
}

export default function ClientReworkForm({ projectId }: ClientReworkFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    const result = await requestClientRework(projectId, message);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Optional: keep it open to show success state, or let page refresh handle it
    }
  };

  if (success) {
    return (
      <div className="card p-6 border border-green-200 bg-green-50 shadow-md">
        <h2 className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-2">Request Submitted</h2>
        <p className="text-xs text-green-700">
          Your request for changes has been submitted to the project manager. The project status has been updated to under review.
        </p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="card p-6 bg-[#f8f9fa] border-gray-200 shadow-md">
        <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-2">Need Changes?</h2>
        <p className="text-xs text-[#6c757d] mb-4">If the finalized valuation report requires corrections or additions, you can request a rework.</p>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full py-2.5 border border-dashed border-[#b8860b]/40 rounded-xl text-xs font-semibold text-[#b8860b] hover:bg-[#b8860b]/10 hover:border-[#b8860b] transition-all"
        >
          Request Changes
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 border border-[#b8860b]/30 shadow-md bg-white">
      <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-2">Request Changes</h2>
      <p className="text-xs text-[#6c757d] mb-4">Please describe the changes you need in detail. This will be sent to the project manager.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the required changes..."
          className="input-field w-full min-h-[120px] text-sm resize-y"
          required
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2.5 border border-[#dee2e6] rounded-xl text-xs font-semibold text-[#495057] hover:bg-[#f8f9fa] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn btn-primary py-2.5 text-xs font-semibold"
            disabled={loading || !message.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
