'use client';

import { useState } from 'react';
import { updateProjectTeam, initiateManagerTransfer } from '@/app/actions/project';

interface Employee {
  id: string;
  name: string;
  employeeId: string | null;
}

interface AssignTeamFormProps {
  projectId: string;
  currentFieldId: string | null;
  currentReportId: string | null;
  currentManagerId: string | null;
  pendingManagerId: string | null;
  fieldEmployees: Employee[];
  reportEmployees: Employee[];
  managers: Employee[];
  userRole: string;
}

export default function AssignTeamForm({
  projectId,
  currentFieldId,
  currentReportId,
  currentManagerId,
  pendingManagerId,
  fieldEmployees,
  reportEmployees,
  managers,
  userRole,
}: AssignTeamFormProps) {
  const [fieldId, setFieldId] = useState(currentFieldId || '');
  const [reportId, setReportId] = useState(currentReportId || '');
  const [targetManagerId, setTargetManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAssign = async () => {
    setLoading(true);
    setMessage(null);

    const result = await updateProjectTeam(
      projectId,
      fieldId || null,
      reportId || null
    );

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Project team assignments updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

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

  const showManagerTransfer = ['OWNER', 'MANAGER'].includes(userRole);
  const currentManager = managers.find((m) => m.id === currentManagerId);
  const pendingManager = managers.find((m) => m.id === pendingManagerId);

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {pendingManager && (
        <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm">
          ⚠️ <strong>Oversight Transfer Pending:</strong> This project is currently proposed to be transferred to{' '}
          <strong>{pendingManager.name}</strong>. Awaiting their acceptance.
        </div>
      )}

      <div className="card p-6 border border-[#b8860b]/20 bg-[#b8860b]/5">
        <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Manage Project Team
        </h3>

        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Field Agent (Inspection)
            </label>
            <select
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
            >
              <option value="">-- Remove/Unassigned --</option>
              {fieldEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Report Staff (Valuation)
            </label>
            <select
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
            >
              <option value="">-- Remove/Unassigned --</option>
              {reportEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.employeeId ? `(${emp.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAssign}
          disabled={loading || (fieldId === (currentFieldId||'') && reportId === (currentReportId||''))}
          className="btn btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Assignments'}
        </button>
      </div>

      {showManagerTransfer && (
        <div className="card p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Transfer Oversight Manager
          </h3>
          <p className="text-xs text-[#6c757d] mb-4">
            Current Overseer:{' '}
            <strong className="text-[#0f2038]">
              {currentManager ? `${currentManager.name} (${currentManager.employeeId})` : 'Unassigned'}
            </strong>
          </p>

          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                Select Target Manager to Transfer To
              </label>
              <select
                value={targetManagerId}
                onChange={(e) => setTargetManagerId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
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

            <button
              onClick={handleTransfer}
              disabled={transferLoading || !targetManagerId}
              className="btn bg-rose-600 hover:bg-rose-700 text-white text-sm px-6 py-2.5 disabled:opacity-50 whitespace-nowrap"
            >
              {transferLoading ? 'Initiating...' : 'Request Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
