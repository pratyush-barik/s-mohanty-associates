'use client';

import { useState, useTransition } from 'react';
import { terminateProject } from '@/app/actions/project';
import { useRouter } from 'next/navigation';

const TERMINATION_REASONS = [
  'Client not responding / poor coordination',
  'Client withdrew the request',
  'Duplicate or invalid project',
  'Property not accessible for inspection',
  'Legal dispute / court order',
  'Payment issues',
  'Project completed outside system',
  'Other',
];

interface EndProjectButtonProps {
  projectId: string;
  projectCode: string;
  variant: 'header' | 'danger-zone';
}

export default function EndProjectButton({ projectId, projectCode, variant }: EndProjectButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canSubmit = reason && confirmText === projectCode;

  const handleTerminate = () => {
    if (!canSubmit) return;
    setError('');

    startTransition(async () => {
      const result = await terminateProject(projectId, reason, notes || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setModalOpen(false);
        router.refresh();
      }
    });
  };

  // ─── Header variant: compact red button ───
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all uppercase tracking-wider"
        >
          ⛔ End Project
        </button>
        {modalOpen && <TerminationModal />}
      </>
    );
  }

  // ─── Danger-zone variant: full card at bottom ───
  return (
    <>
      <div className="card p-6 border-2 border-red-200 bg-gradient-to-r from-red-50/50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">Danger Zone</h3>
            </div>
            <p className="text-xs text-red-600">
              Permanently end this project. This action will set the status to <strong>TERMINATED</strong>, notify the client via email, and log the event. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm shrink-0 ml-4"
          >
            End Project
          </button>
        </div>
      </div>
      {modalOpen && <TerminationModal />}
    </>
  );

  // ─── Shared Modal ───
  function TerminationModal() {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">⛔</div>
              <div>
                <h2 className="text-base font-bold text-white">End Project</h2>
                <p className="text-xs text-red-100">
                  This will permanently terminate <span className="font-mono font-bold">{projectCode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Reason select */}
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1.5">
                Reason for Termination <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#dee2e6] rounded-xl text-sm text-[#0f2038] bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
              >
                <option value="">Select a reason...</option>
                {TERMINATION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Additional notes */}
            <div>
              <label className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wider block mb-1.5">
                Additional Notes <span className="text-[#adb5bd]">(Optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional context about why this project is being ended..."
                className="w-full px-3 py-2.5 border border-[#dee2e6] rounded-xl text-sm text-[#0f2038] bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all resize-none"
              />
            </div>

            {/* Confirmation input */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <label className="text-[10px] font-bold text-red-700 uppercase tracking-wider block mb-1.5">
                Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">{projectCode}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={projectCode}
                className="w-full px-3 py-2.5 border border-red-200 rounded-xl text-sm font-mono text-[#0f2038] bg-white focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold border border-red-100">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[#e9ecef] bg-[#f8f9fa] flex justify-end gap-3">
            <button
              onClick={() => {
                setModalOpen(false);
                setReason('');
                setNotes('');
                setConfirmText('');
                setError('');
              }}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTerminate}
              disabled={!canSubmit || isPending}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Ending...
                </>
              ) : (
                '⛔ End Project Permanently'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
