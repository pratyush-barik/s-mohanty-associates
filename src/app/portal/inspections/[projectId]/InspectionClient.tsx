'use client';

import { useState } from 'react';
import { updateInspectionStatus } from '@/app/actions/project';

interface InspectionClientProps {
  projectId: string;
  initialStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  initialNotes: string | null;
}

export default function InspectionClient({ projectId, initialStatus, initialNotes }: InspectionClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    setLoading(true);
    setMessage(null);

    const result = await updateInspectionStatus(projectId, newStatus, notes);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setStatus(newStatus);
      setMessage({ type: 'success', text: 'Inspection updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="card p-6 border border-[#b8860b]/20 bg-[#b8860b]/5">
      <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Inspection Status
      </h3>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-5">
        <label className="block text-sm font-medium text-[#343a40] mb-1.5">
          Field Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Enter any field notes or observations here..."
          className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => handleSave('IN_PROGRESS')}
          disabled={loading || status === 'IN_PROGRESS' || status === 'COMPLETED'}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            status === 'IN_PROGRESS' || status === 'COMPLETED'
              ? 'bg-[#e9ecef] text-[#adb5bd] cursor-not-allowed'
              : 'bg-[#1e3a5f] text-white hover:bg-[#0f2038]'
          }`}
        >
          {loading && status !== 'IN_PROGRESS' ? 'Saving...' : 'Start Inspection'}
        </button>
        
        <button
          onClick={() => handleSave('COMPLETED')}
          disabled={loading || status === 'COMPLETED' || status === 'PENDING'}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            status === 'COMPLETED' || status === 'PENDING'
              ? 'bg-[#e9ecef] text-[#adb5bd] cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {loading && status === 'IN_PROGRESS' ? 'Saving...' : 'Mark as Completed'}
        </button>
      </div>

      <p className="text-[10px] text-[#6c757d] mt-4">
        * Note: Site photos should be stored on the local office drive. They do not need to be uploaded here.
      </p>
    </div>
  );
}
