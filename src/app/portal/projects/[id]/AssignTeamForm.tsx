'use client';

import { useState } from 'react';
import { assignProjectStaff } from '@/app/actions/project';

interface Employee {
  id: string;
  name: string;
  employeeId: string | null;
}

interface AssignTeamFormProps {
  projectId: string;
  currentFieldId: string | null;
  currentReportId: string | null;
  fieldEmployees: Employee[];
  reportEmployees: Employee[];
}

export default function AssignTeamForm({
  projectId,
  currentFieldId,
  currentReportId,
  fieldEmployees,
  reportEmployees,
}: AssignTeamFormProps) {
  const [fieldId, setFieldId] = useState(currentFieldId || '');
  const [reportId, setReportId] = useState(currentReportId || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAssign = async () => {
    setLoading(true);
    setMessage(null);

    const result = await assignProjectStaff(
      projectId,
      fieldId || null,
      reportId || null
    );

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Team assigned successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="card p-6 border border-[#b8860b]/20 bg-[#b8860b]/5">
      <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Assign Project Team
      </h3>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

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
            <option value="">-- Unassigned --</option>
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
            <option value="">-- Unassigned --</option>
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
        {loading ? 'Assigning...' : 'Save Assignments'}
      </button>
    </div>
  );
}
