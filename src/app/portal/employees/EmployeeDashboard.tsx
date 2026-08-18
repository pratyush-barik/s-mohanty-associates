'use client';

import { useState } from 'react';
import { updateEmployee, terminateEmployee } from '@/app/actions/employee';

interface Employee {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  employeeId: string;
  designation: string | null;
  role: 'OWNER' | 'MANAGER' | 'FIELD_EMPLOYEE' | 'REPORT_EMPLOYEE';
  profilePhoto: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface EmployeeDashboardProps {
  employees: Employee[];
  currentUserRole: string;
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_EMPLOYEE: 'Field Inspector',
  REPORT_EMPLOYEE: 'Report Analyst',
};

export default function EmployeeDashboard({ employees: initialEmployees, currentUserRole }: EmployeeDashboardProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [mobile, setMobile] = useState('');
  const [terminatingEmp, setTerminatingEmp] = useState<Employee | null>(null);
  
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.employeeId || '').toLowerCase().includes(q) ||
      (emp.designation || '').toLowerCase().includes(q)
    );
  });

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmp) return;

    if (mobile && mobile.length !== 10) {
      setActionMessage({ type: 'error', text: 'Mobile number must be exactly 10 digits.' });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.append('id', editingEmp.id);
    formData.set('mobile', mobile ? `+91${mobile}` : '');

    const res = await updateEmployee(formData);
    if (res.error) {
      setActionMessage({ type: 'error', text: res.error });
    } else {
      setActionMessage({ type: 'success', text: res.message || 'Updated successfully!' });
      
      // Update local state
      const updatedName = formData.get('name') as string;
      const updatedEmail = formData.get('email') as string;
      const updatedMobile = formData.get('mobile') as string;
      const updatedRole = formData.get('role') as any;
      const updatedDesignation = formData.get('designation') as string;

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmp.id
            ? {
                ...emp,
                name: updatedName,
                email: updatedEmail,
                mobile: updatedMobile || null,
                role: updatedRole,
                designation: updatedDesignation || null,
              }
            : emp
        )
      );

      setTimeout(() => {
        setEditingEmp(null);
        setActionMessage(null);
        setMobile('');
      }, 1500);
    }
    setActionLoading(false);
  };

  const handleTerminate = async () => {
    if (!terminatingEmp) return;
    
    // Safety check
    if (confirmPhrase !== terminatingEmp.name && confirmPhrase !== terminatingEmp.employeeId) {
      setActionMessage({ type: 'error', text: 'Confirmation text does not match name or employee ID.' });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    const res = await terminateEmployee(terminatingEmp.id);
    if (res.error) {
      setActionMessage({ type: 'error', text: res.error });
    } else {
      setActionMessage({ type: 'success', text: res.message || 'Terminated successfully!' });
      
      // Update local state (mark inactive)
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === terminatingEmp.id ? { ...emp, isActive: false } : emp
        )
      );

      setTimeout(() => {
        setTerminatingEmp(null);
        setConfirmPhrase('');
        setActionMessage(null);
      }, 1500);
    }
    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b]"
            placeholder="🔍 Search employees by name, email, employee ID, designation..."
          />
        </div>
      </div>

      {/* Employee List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            All Employees ({filteredEmployees.length})
          </h2>
        </div>

        {filteredEmployees.length === 0 ? (
          <p className="text-sm text-[#adb5bd] text-center py-8">No matching employees found.</p>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-gray-300 transition-all">
                <div className="flex items-center gap-4">
                  {/* Photo */}
                  <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center">
                    {emp.profilePhoto ? (
                      <img src={emp.profilePhoto} alt={emp.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-bold">{emp.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#0f2038]">{emp.name}</p>
                      {emp.employeeId && (
                        <span className="text-[10px] font-mono font-bold text-[#b8860b] bg-[#b8860b]/10 px-2 py-0.5 rounded">
                          {emp.employeeId}
                        </span>
                      )}
                      {!emp.isActive && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          Terminated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6c757d] mt-0.5 truncate max-w-[250px] sm:max-w-none">
                      {emp.email} {emp.mobile && `• ${emp.mobile}`} {emp.designation && `• ${emp.designation}`}
                    </p>
                  </div>
                </div>

                {/* Role badge & Actions */}
                <div className="flex items-center gap-3 justify-end">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#b8860b]/10 text-[#b8860b] border border-[#b8860b]/20">
                    {roleLabels[emp.role] || emp.role}
                  </span>

                  {emp.isActive && (
                    <div className="flex items-center gap-1">
                      {/* Hide edit/terminate buttons if Manager is trying to edit Owner or other Manager */}
                      {!(currentUserRole === 'MANAGER' && (emp.role === 'OWNER' || emp.role === 'MANAGER')) && (
                        <>
                          <button
                            onClick={() => {
                              setEditingEmp(emp);
                              setActionMessage(null);
                              const raw = emp.mobile || '';
                              const cleaned = raw.replace(/^\+?91/, '').trim();
                              setMobile(cleaned.length === 10 ? cleaned : raw);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all text-xs font-semibold px-2 py-1 border border-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setTerminatingEmp(emp);
                              setConfirmPhrase('');
                              setActionMessage(null);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all text-xs font-semibold px-2 py-1 border border-red-200"
                          >
                            Terminate
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 bg-[#0f2038]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-md w-full animate-fade-in space-y-4">
            <h3 className="text-lg font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              Edit Employee Details
            </h3>

            {actionMessage && (
              <div className={`p-3 rounded-xl text-sm ${
                actionMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {actionMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#343a40] mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingEmp.name}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#343a40] mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editingEmp.email}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#343a40] mb-1">Mobile</label>
                  <div className="flex items-center w-full rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#b8860b]/30 transition-all bg-white overflow-hidden">
                    <span className="pl-3 text-gray-500 text-xs font-medium select-none">
                      +91
                    </span>
                    <span className="text-gray-300 mx-1.5 select-none">|</span>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          setMobile(val);
                        }
                      }}
                      className="w-full pr-3 py-2 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                      placeholder="----------"
                      pattern="[0-9]{10}"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#343a40] mb-1">Role</label>
                  <select
                    name="role"
                    required
                    defaultValue={editingEmp.role}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 bg-white"
                  >
                    {currentUserRole === 'OWNER' && <option value="MANAGER">Manager</option>}
                    <option value="FIELD_EMPLOYEE">Field Inspector</option>
                    <option value="REPORT_EMPLOYEE">Report Analyst</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#343a40] mb-1">Designation</label>
                <input
                  type="text"
                  name="designation"
                  defaultValue={editingEmp.designation || ''}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                  placeholder="e.g. Senior Surveyor"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmp(null);
                    setMobile('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#b8860b] hover:bg-[#b8860b]/90 text-white font-semibold text-sm rounded-xl disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminate Employee Modal */}
      {terminatingEmp && (
        <div className="fixed inset-0 bg-[#0f2038]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-red-100 shadow-2xl p-6 max-w-md w-full animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                Terminate Employee Account
              </h3>
            </div>

            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 leading-relaxed">
              <strong>Permanent Action Alert:</strong> Terminating <strong>{terminatingEmp.name}</strong> ({terminatingEmp.employeeId}) will deactivate their login permanently and unassign them from any active projects.
            </div>

            {actionMessage && (
              <div className={`p-3 rounded-xl text-sm ${
                actionMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {actionMessage.text}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                To confirm, type the employee's name <span className="font-mono text-red-600">"{terminatingEmp.name}"</span> or ID <span className="font-mono text-red-600">"{terminatingEmp.employeeId}"</span> below:
              </label>
              
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Type confirmation text..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={() => {
                  setTerminatingEmp(null);
                  setConfirmPhrase('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminate}
                disabled={actionLoading || (confirmPhrase !== terminatingEmp.name && confirmPhrase !== terminatingEmp.employeeId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Terminating...' : 'Terminate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
