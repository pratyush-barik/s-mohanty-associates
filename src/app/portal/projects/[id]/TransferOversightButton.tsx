'use client';

import { useState } from 'react';
import { initiateManagerTransfer } from '@/app/actions/project';

interface Manager {
  id: string;
  name: string;
  employeeId: string | null;
}

interface TransferOversightButtonProps {
  projectId: string;
  currentManagerId: string | null;
  managers: Manager[];
}

export default function TransferOversightButton({ projectId, currentManagerId, managers }: TransferOversightButtonProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [targetManagerId, setTargetManagerId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentManager = managers.find((m) => m.id === currentManagerId);

  const handleTransfer = async () => {
    if (!targetManagerId) return;
    setTransferLoading(true);
    setMessage(null);

    const result = await initiateManagerTransfer(projectId, targetManagerId);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({
        type: 'success',
        text: 'Project transfer initiated! Waiting for the target manager to accept.',
      });
      setTargetManagerId('');
      setTimeout(() => setMessage(null), 5000);
    }
    setTransferLoading(false);
  };

  return (
    <>
      {/* Transfer Button */}
      <div className="mt-6">
        <button
          onClick={() => setShowDrawer(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all border border-red-500/20"
        >
          🔄 Transfer Oversight Manager
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mt-3 p-3 rounded-xl text-sm font-semibold ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Centered Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setShowDrawer(false)} />
          
          <div className="relative bg-white w-full max-w-xl mx-4 rounded-2xl shadow-2xl p-8 border border-red-100 z-10">
            <div className="mx-auto w-16 h-1.5 bg-gray-200 rounded-full mb-6 cursor-pointer" onClick={() => setShowDrawer(false)} />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#0f2038] tracking-tight">
                  Transfer Oversight Manager
                </h3>
                <p className="text-xs text-[#6c757d] mt-1">Reassign this project&apos;s manager oversight to another manager.</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Overseer</span>
                <p className="text-sm font-bold text-[#0f2038]">
                  {currentManager ? `${currentManager.name} (${currentManager.employeeId})` : 'Unassigned'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#343a40] uppercase tracking-wider">
                  Select Target Manager to Transfer To
                </label>
                <select
                  value={targetManagerId}
                  onChange={(e) => setTargetManagerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                >
                  <option value="">-- Select Manager --</option>
                  {managers
                    .filter((m) => m.id !== currentManagerId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.employeeId ? `(${m.employeeId})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-4 pt-3">
                <button
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleTransfer();
                    setShowDrawer(false);
                  }}
                  disabled={transferLoading || !targetManagerId}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
