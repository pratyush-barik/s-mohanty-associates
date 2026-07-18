'use client';

import { useState } from 'react';
import { acceptManagerTransfer, declineManagerTransfer } from '@/app/actions/project';

interface Project {
  id: string;
  projectCode: string;
  serviceRequest: {
    propertyType: string;
    contactName: string;
  };
}

interface PendingTransfersListProps {
  transfers: Project[];
}

export default function PendingTransfersList({ transfers: initialTransfers }: PendingTransfersListProps) {
  const [transfers, setTransfers] = useState(initialTransfers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = async (projectId: string) => {
    setLoadingId(projectId);
    const res = await acceptManagerTransfer(projectId);
    if (res.success) {
      setTransfers((prev) => prev.filter((p) => p.id !== projectId));
    }
    setLoadingId(null);
  };

  const handleDecline = async (projectId: string) => {
    setLoadingId(projectId);
    const res = await declineManagerTransfer(projectId);
    if (res.success) {
      setTransfers((prev) => prev.filter((p) => p.id !== projectId));
    }
    setLoadingId(null);
  };

  if (transfers.length === 0) return null;

  return (
    <div className="card p-6 border border-amber-200 bg-amber-50/30">
      <h2 className="text-base font-bold text-amber-800 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Incoming Project Transfer Requests ({transfers.length})
      </h2>
      <div className="space-y-3">
        {transfers.map((project) => (
          <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-amber-100 shadow-sm gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0f2038]">{project.projectCode}</p>
              <p className="text-xs text-[#6c757d] mt-0.5">
                {project.serviceRequest.propertyType} Valuation • Client: {project.serviceRequest.contactName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAccept(project.id)}
                disabled={loadingId !== null}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingId === project.id ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => handleDecline(project.id)}
                disabled={loadingId !== null}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-2 rounded-lg transition-colors border border-rose-200 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
