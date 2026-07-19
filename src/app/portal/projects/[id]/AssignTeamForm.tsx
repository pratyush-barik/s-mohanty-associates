'use client';

import { useState } from 'react';
import { updateProjectTeam, initiateManagerTransfer } from '@/app/actions/project';

interface Employee {
  id: string;
  name: string;
  employeeId: string | null;
  _count?: {
    fieldProjects?: number;
    reportProjects?: number;
  };
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

  // Modal State
  const [activeModal, setActiveModal] = useState<'FIELD' | 'REPORT' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

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

  const getSelectedEmployeeName = (id: string, list: Employee[]) => {
    if (!id) return 'Not Assigned';
    const emp = list.find((e) => e.id === id);
    return emp ? `${emp.name} ${emp.employeeId ? `(${emp.employeeId})` : ''}` : 'Unknown';
  };

  // Filter lists for modal
  const filterList = (list: Employee[]) => {
    return list.filter((emp) => {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(q))
      );
    });
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
          {/* Field Agent UI */}
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Field Agent (Inspection)
            </label>
            <div 
              onClick={() => setActiveModal('FIELD')}
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white cursor-pointer hover:border-[#b8860b] transition-colors flex justify-between items-center"
            >
              <span className={`text-sm ${!fieldId ? 'text-[#6c757d]' : 'text-[#212529] font-medium'}`}>
                {getSelectedEmployeeName(fieldId, fieldEmployees)}
              </span>
              <span className="text-[#adb5bd] text-xs">Change</span>
            </div>
          </div>

          {/* Report Staff UI */}
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">
              Report Staff (Valuation)
            </label>
            <div 
              onClick={() => setActiveModal('REPORT')}
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white cursor-pointer hover:border-[#b8860b] transition-colors flex justify-between items-center"
            >
              <span className={`text-sm ${!reportId ? 'text-[#6c757d]' : 'text-[#212529] font-medium'}`}>
                {getSelectedEmployeeName(reportId, reportEmployees)}
              </span>
              <span className="text-[#adb5bd] text-xs">Change</span>
            </div>
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

      {/* Hero Modal for Search & Assign */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[#e9ecef] flex justify-between items-center bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
                Select {activeModal === 'FIELD' ? 'Field Agent' : 'Report Staff'}
              </h2>
              <button 
                onClick={() => { setActiveModal(null); setSearchQuery(''); setModalError(null); }}
                className="text-[#6c757d] hover:text-[#0f2038] text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-4 border-b border-[#e9ecef] space-y-3">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-xl">
                  {modalError}
                </div>
              )}
              <input
                type="text"
                placeholder="Search by name or ID number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setModalError(null);
                }}
                className="input-field w-full"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button
                onClick={() => {
                  activeModal === 'FIELD' ? setFieldId('') : setReportId('');
                  setActiveModal(null);
                  setSearchQuery('');
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-[#adb5bd] text-[#6c757d] hover:bg-[#f8f9fa] hover:text-[#0f2038] transition-colors text-sm"
              >
                🚫 Remove / Unassign
              </button>

              {filterList(activeModal === 'FIELD' ? fieldEmployees : reportEmployees).map((emp) => {
                const activeCount = activeModal === 'FIELD' 
                  ? (emp._count?.fieldProjects || 0) 
                  : (emp._count?.reportProjects || 0);
                
                const isBusy = activeCount > 0;

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      if (isBusy) {
                        setModalError('This employee is already assigned to another case, please deploy another.');
                        return;
                      }
                      activeModal === 'FIELD' ? setFieldId(emp.id) : setReportId(emp.id);
                      setActiveModal(null);
                      setSearchQuery('');
                      setModalError(null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${
                      isBusy 
                        ? 'border-red-200 bg-red-50/50 cursor-not-allowed opacity-75' 
                        : 'border-[#dee2e6] hover:border-green-400 hover:bg-green-50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${isBusy ? 'text-red-700' : 'text-[#0f2038]'}`}>
                        {emp.name}
                      </p>
                      <p className="text-xs text-[#6c757d]">ID: {emp.employeeId}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        isBusy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isBusy ? 'BUSY' : 'CLEAR'}
                      </span>
                      {isBusy && (
                        <p className="text-[10px] text-red-600 mt-1">{activeCount} active project{activeCount > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
