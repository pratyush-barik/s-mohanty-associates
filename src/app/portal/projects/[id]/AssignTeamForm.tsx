'use client';

import { useState } from 'react';
import { updateProjectTeam, initiateManagerTransfer, cancelManagerTransfer } from '@/app/actions/project';

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
  currentFieldIds: string[];
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
  currentFieldIds,
  currentReportId,
  currentManagerId,
  pendingManagerId,
  fieldEmployees,
  reportEmployees,
  managers,
  userRole,
}: AssignTeamFormProps) {
  const [fieldIds, setFieldIds] = useState<string[]>(currentFieldIds || []);
  const [reportId, setReportId] = useState(currentReportId || '');
  const [targetManagerId, setTargetManagerId] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal configuration states
  const [activeModal, setActiveModal] = useState<'ADD_FIELD' | 'REPLACE_FIELD' | 'REPLACE_REPORT' | null>(null);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const handleAssign = async () => {
    setLoading(true);
    setMessage(null);

    const result = await updateProjectTeam(
      projectId,
      fieldIds,
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

  const handleCancelTransfer = async () => {
    setCancelLoading(true);
    setMessage(null);
    const result = await cancelManagerTransfer(projectId);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Oversight transfer cancelled successfully.' });
      setTimeout(() => setMessage(null), 3000);
    }
    setCancelLoading(false);
  };

  const showManagerTransfer = ['OWNER', 'MANAGER'].includes(userRole);
  const currentManager = managers.find((m) => m.id === currentManagerId);
  const pendingManager = managers.find((m) => m.id === pendingManagerId);

  const getSelectedEmployeeName = (id: string, list: Employee[]) => {
    const emp = list.find((e) => e.id === id);
    return emp ? `${emp.name} ${emp.employeeId ? `(${emp.employeeId})` : ''}` : 'Unknown';
  };

  // Filter lists for modal
  const filterList = (list: Employee[]) => {
    // Prevent showing already added field employees in the Add/Replace lists
    let filtered = list;
    if (activeModal === 'ADD_FIELD') {
      filtered = list.filter(emp => !fieldIds.includes(emp.id));
    } else if (activeModal === 'REPLACE_FIELD') {
      filtered = list.filter(emp => !fieldIds.includes(emp.id) || fieldIds[replaceTargetIndex!] === emp.id);
    }

    return filtered.filter((emp) => {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(q))
      );
    });
  };

  const removeFieldAgent = (indexToRemove: number) => {
    setFieldIds(fieldIds.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSelectEmployee = (empId: string) => {
    if (activeModal === 'ADD_FIELD') {
      setFieldIds([...fieldIds, empId]);
    } else if (activeModal === 'REPLACE_FIELD' && replaceTargetIndex !== null) {
      const newIds = [...fieldIds];
      newIds[replaceTargetIndex] = empId;
      setFieldIds(newIds);
    } else if (activeModal === 'REPLACE_REPORT') {
      setReportId(empId);
    }
    setActiveModal(null);
    setSearchQuery('');
    setModalError(null);
    setReplaceTargetIndex(null);
  };

  // Check if anything has actually changed to enable the Save button
  const hasChanges = () => {
    if (fieldIds.length !== currentFieldIds.length) return true;
    const sortedFields = [...fieldIds].sort();
    const sortedCurrentFields = [...currentFieldIds].sort();
    for (let i = 0; i < sortedFields.length; i++) {
      if (sortedFields[i] !== sortedCurrentFields[i]) return true;
    }
    if (reportId !== (currentReportId || '')) return true;
    return false;
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
        <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            ⚠️ <strong>Oversight Transfer Pending:</strong> This project is currently proposed to be transferred to{' '}
            <strong>{pendingManager.name}</strong>. Awaiting their acceptance.
          </div>
          <button
            onClick={handleCancelTransfer}
            disabled={cancelLoading}
            className="text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors font-semibold self-start sm:self-auto disabled:opacity-50"
          >
            {cancelLoading ? 'Cancelling...' : 'Cancel Request'}
          </button>
        </div>
      )}

      <div className="card p-6 border border-[#b8860b]/20 bg-[#b8860b]/5">
        <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Manage Project Team
        </h3>

        <div className="grid sm:grid-cols-2 gap-6 mb-5">
          {/* Field Agents Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#343a40]">
              Field Agents (Inspection)
            </label>
            
            <div className="space-y-2">
              {fieldIds.length === 0 ? (
                <p className="text-xs text-[#6c757d] italic">No field agents assigned.</p>
              ) : (
                fieldIds.map((id, index) => (
                  <div key={id} className="flex items-center justify-between p-3 rounded-xl border border-[#dee2e6] bg-white text-sm">
                    <span className="font-medium text-[#212529]">
                      {getSelectedEmployeeName(id, fieldEmployees)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReplaceTargetIndex(index);
                          setActiveModal('REPLACE_FIELD');
                        }}
                        className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-[#0f2038] hover:bg-gray-50 transition-colors font-medium"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => removeFieldAgent(index)}
                        className="text-xs px-2.5 py-1.5 border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setActiveModal('ADD_FIELD')}
              className="w-full py-2.5 border border-dashed border-[#b8860b]/40 rounded-xl text-xs font-semibold text-[#b8860b] hover:bg-[#b8860b]/10 hover:border-[#b8860b] transition-all"
            >
              + Add Field Agent
            </button>
          </div>

          {/* Report Staff Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#343a40]">
              Report Staff (Valuation)
            </label>

            {!reportId ? (
              <button
                onClick={() => setActiveModal('REPLACE_REPORT')}
                className="w-full py-2.5 border border-dashed border-[#b8860b]/40 rounded-xl text-xs font-semibold text-[#b8860b] hover:bg-[#b8860b]/10 hover:border-[#b8860b] transition-all"
              >
                + Assign Report Staff
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#dee2e6] bg-white text-sm">
                  <span className="font-medium text-[#212529]">
                    {getSelectedEmployeeName(reportId, reportEmployees)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal('REPLACE_REPORT')}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-[#0f2038] hover:bg-gray-50 transition-colors font-medium"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => setReportId('')}
                      className="text-xs px-2.5 py-1.5 border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Inline warning prompts for report agent actions */}
                {reportId !== (currentReportId || '') && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                    {reportId === '' ? (
                      <p>
                        ⚠️ <strong>Warning:</strong> Removing the Report Agent will permanently <strong>delete</strong> all draft valuation reports saved for this project.
                      </p>
                    ) : (
                      <p>
                        ℹ️ <strong>Notice:</strong> Replacing the Report Agent will automatically <strong>transfer</strong> all saved draft data to the newly assigned agent.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleAssign}
          disabled={loading || !hasChanges()}
          className="btn btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Assignments'}
        </button>
      </div>

      {/* Floating Modal for Search & Selection */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[#e9ecef] flex justify-between items-center bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
                {activeModal === 'ADD_FIELD' ? 'Add Field Agent' : activeModal === 'REPLACE_FIELD' ? 'Replace Field Agent' : 'Select Report Staff'}
              </h2>
              <button 
                onClick={() => { setActiveModal(null); setSearchQuery(''); setModalError(null); setReplaceTargetIndex(null); }}
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
              {filterList(activeModal.includes('FIELD') ? fieldEmployees : reportEmployees).length === 0 ? (
                <p className="text-center text-sm text-[#6c757d] py-6">No matching employees found.</p>
              ) : (
                filterList(activeModal.includes('FIELD') ? fieldEmployees : reportEmployees).map((emp) => {
                  const activeCount = activeModal.includes('FIELD') 
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
                        handleSelectEmployee(emp.id);
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
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
