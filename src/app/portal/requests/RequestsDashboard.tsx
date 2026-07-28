'use client';

import { useState } from 'react';
import Link from 'next/link';
import { acceptServiceRequest, rejectServiceRequest, assignProjectManager } from '@/app/actions/project';

interface Profile {
  name?: string;
  organisationName?: string;
}

interface Client {
  id: string;
  email: string;
  clientType: 'INDIVIDUAL' | 'ORGANISATION';
  individual?: { name: string } | null;
  organisation?: { organisationName: string } | null;
}

interface Manager {
  id: string;
  name: string;
  employeeId: string | null;
}

interface Project {
  id: string;
  projectCode: string;
  status: string;
  manager?: Manager | null;
}

interface ServiceRequest {
  id: string;
  createdAt: Date;
  propertyDetails: string;
  propertyType: string;
  purpose: string;
  propertyAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  additionalNotes: string | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewNotes: string | null;
  client: Client | null;
  project?: Project | null;
}

interface RequestsDashboardProps {
  requests: ServiceRequest[];
  managers: Manager[];
  currentUserRole: 'OWNER' | 'MANAGER';
  currentUserId: string;
}

export default function RequestsDashboard({
  requests,
  managers,
  currentUserRole,
  currentUserId,
}: RequestsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Rejection state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Owner approval manager selection state
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  // Owner post-approval manager assignment state
  const [assigningProjectId, setAssigningProjectId] = useState<string | null>(null);
  const [postManagerId, setPostManagerId] = useState('');

  // Alert/Message state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getClientName = (req: ServiceRequest) => {
    if (!req.client) return req.contactName;
    return req.client.clientType === 'INDIVIDUAL'
      ? req.client.individual?.name || req.contactName
      : req.client.organisation?.organisationName || req.contactName;
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'pending') return req.status === 'SUBMITTED';
    if (activeTab === 'approved') return req.status === 'APPROVED';
    return req.status === 'REJECTED';
  });

  const handleAccept = async (requestId: string, mgrId: string | null) => {
    setProcessingId(requestId);
    setAlert(null);
    
    const result = await acceptServiceRequest(requestId, mgrId);
    
    if (result.error) {
      setAlert({ type: 'error', text: result.error });
    } else {
      setAlert({ type: 'success', text: `Service request approved! Project code: ${result.projectCode}` });
      setApprovingId(null);
      setSelectedManagerId('');
    }
    setProcessingId(null);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setProcessingId(rejectingId);
    setAlert(null);

    const result = await rejectServiceRequest(rejectingId, rejectionNotes);

    if (result.error) {
      setAlert({ type: 'error', text: result.error });
    } else {
      setAlert({ type: 'success', text: 'Service request rejected successfully.' });
      setRejectingId(null);
      setRejectionNotes('');
    }
    setProcessingId(null);
  };

  const handleAssignManager = async (projectId: string, mgrId: string) => {
    setProcessingId(projectId);
    setAlert(null);

    const result = await assignProjectManager(projectId, mgrId);

    if (result.error) {
      setAlert({ type: 'error', text: result.error });
    } else {
      setAlert({ type: 'success', text: 'Manager assigned successfully.' });
      setAssigningProjectId(null);
      setPostManagerId('');
    }
    setProcessingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Valuation Service Requests
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Review, approve, and oversee property valuation intake requests from clients.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          alert.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {alert.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#dee2e6]">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-[#b8860b] text-[#b8860b]'
              : 'border-transparent text-[#6c757d] hover:text-[#0f2038]'
          }`}
        >
          Pending Review ({requests.filter((r) => r.status === 'SUBMITTED').length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'approved'
              ? 'border-[#b8860b] text-[#b8860b]'
              : 'border-transparent text-[#6c757d] hover:text-[#0f2038]'
          }`}
        >
          Approved / Active ({requests.filter((r) => r.status === 'APPROVED').length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'rejected'
              ? 'border-[#b8860b] text-[#b8860b]'
              : 'border-transparent text-[#6c757d] hover:text-[#0f2038]'
          }`}
        >
          Rejected ({requests.filter((r) => r.status === 'REJECTED').length})
        </button>
      </div>

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="card p-12 text-center text-[#6c757d] text-sm">
            No service requests found.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="card p-6 space-y-4 border border-gray-100 hover:border-gray-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1f3f5]">
                <div>
                  <p className="text-xs text-[#adb5bd] font-semibold tracking-wider uppercase">
                    Intake Request • {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  <h3 className="text-base font-bold text-[#0f2038] mt-0.5">
                    {req.propertyType} Valuation for {req.purpose.replace(/_/g, ' ')}
                  </h3>
                </div>
                <div>
                  {req.status === 'SUBMITTED' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (currentUserRole === 'OWNER') {
                            setApprovingId(req.id);
                          } else {
                            handleAccept(req.id, null);
                          }
                        }}
                        disabled={processingId !== null}
                        className="btn bg-[#b8860b] hover:bg-[#b8860b]/90 text-white text-xs px-4 py-2"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        disabled={processingId !== null}
                        className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {req.status === 'APPROVED' && req.project && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#6c757d] font-mono">
                        Project:{' '}
                        <Link
                          href={`/portal/projects/${req.project.id}`}
                          className="text-[#b8860b] hover:underline font-bold"
                        >
                          {req.project.projectCode}
                        </Link>
                      </span>
                      {req.project.manager ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 text-[10px] font-semibold">
                          Oversight: {req.project.manager.name}
                        </span>
                      ) : (
                        currentUserRole === 'OWNER' && (
                          <div className="flex items-center gap-2">
                            {assigningProjectId === req.project.id ? (
                              <div className="flex gap-2">
                                <select
                                  value={postManagerId}
                                  onChange={(e) => setPostManagerId(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
                                >
                                  <option value="">-- Assign Manager --</option>
                                  {managers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAssignManager(req.project!.id, postManagerId)}
                                  disabled={!postManagerId || processingId !== null}
                                  className="bg-green-600 text-white text-xs px-2 py-1 rounded"
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => setAssigningProjectId(null)}
                                  className="text-gray-500 text-xs px-1 hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAssigningProjectId(req.project!.id)}
                                className="btn border border-[#b8860b] text-[#b8860b] hover:bg-[#b8860b]/5 text-[10px] py-1 px-3"
                              >
                                Assign Manager
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {req.status === 'REJECTED' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-semibold">
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Grid details */}
              <div className="grid sm:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Property Location</p>
                  <p className="text-[#343a40] font-medium leading-relaxed">{req.propertyAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Contact Person</p>
                  <p className="text-[#343a40] font-medium">{req.contactName}</p>
                  <p className="text-xs text-[#6c757d] mt-0.5">{req.contactEmail} • {req.contactPhone}</p>
                  <p className="text-xs text-[#9b9b9b] italic mt-0.5">Account: {getClientName(req)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider mb-1">Details & khata/Plot</p>
                  <p className="text-[#6c757d] text-xs leading-relaxed">{req.propertyDetails}</p>
                </div>
              </div>

              {/* Extra info/notes */}
              {req.additionalNotes && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-[#6c757d]">
                  <strong>Client Note:</strong> {req.additionalNotes}
                </div>
              )}

              {req.status === 'REJECTED' && req.reviewNotes && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-100">
                  <strong>Rejection Reason:</strong> {req.reviewNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-[#0f2038]/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Reject Service Request
            </h3>
            <p className="text-xs text-[#6c757d] mb-4">
              Please enter the reason for rejecting this service request. The client will see this note.
            </p>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="e.g. Incomplete khata documentation, location outside services range, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 min-h-[100px] mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionNotes('');
                }}
                disabled={processingId !== null}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionNotes.trim() || processingId !== null}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Approve Manager Selector Modal */}
      {approvingId && (
        <div className="fixed inset-0 bg-[#0f2038]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              Accept Request & Create Project
            </h3>
            <p className="text-xs text-[#6c757d] mb-4">
              Select a manager to oversee this project. If you wish to oversee it yourself, select your account or leave it unassigned to assign later.
            </p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-[#343a40] mb-1">
                  Assign Manager
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
                >
                  <option value="">-- Leave Unassigned --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.id === currentUserId ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setApprovingId(null);
                  setSelectedManagerId('');
                }}
                disabled={processingId !== null}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAccept(approvingId, selectedManagerId || null)}
                disabled={processingId !== null}
                className="bg-[#b8860b] hover:bg-[#b8860b]/90 text-white px-4 py-2 rounded-xl text-sm"
              >
                Approve & Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
