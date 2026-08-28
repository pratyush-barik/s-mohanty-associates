'use client';

import { useState } from 'react';
import Link from 'next/link';

type ProjectType = any;

function formatStatus(status: string, clientReworkRequested?: boolean) {
  if (clientReworkRequested) return 'CLIENT REWORK REQUESTED';
  if (status === 'ASSIGNED') return 'MANAGER ASSIGNED';
  if (status === 'TERMINATED') return '⛔ TERMINATED';
  return status.replace(/_/g, ' ');
}

function formatSource(source: string) {
  if (source === 'GMAIL') return 'Gmail';
  if (source === 'EXTERNAL') return 'External';
  return 'Website';
}

function getTerminationReason(project: any): string | null {
  return project.terminationReason || null;
}

function sourceColor(source: string) {
  if (source === 'GMAIL') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (source === 'EXTERNAL') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-purple-100 text-purple-700 border-purple-200';
}

function statusColor(status: string, clientReworkRequested?: boolean) {
  if (clientReworkRequested) return 'bg-red-50 text-red-600';
  if (status === 'TERMINATED') return 'bg-red-100 text-red-700';
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'ARCHIVED') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-50 text-blue-600';
}

export default function AllProjectsClient({ projects }: { projects: ProjectType[] }) {
  const [subTab, setSubTab] = useState<'all' | 'active' | 'completed' | 'terminated'>('all');
  const [searchQ, setSearchQ] = useState('');

  const filteredProjects = projects.filter((project) => {
    let passesTab = true;
    if (subTab === 'active') {
      passesTab = !['COMPLETED', 'ARCHIVED', 'TERMINATED'].includes(project.status);
    } else if (subTab === 'completed') {
      passesTab = ['COMPLETED', 'ARCHIVED'].includes(project.status);
    } else if (subTab === 'terminated') {
      passesTab = project.status === 'TERMINATED';
    }

    let passesSearch = true;
    if (searchQ) {
      passesSearch =
        project.projectCode.toLowerCase().includes(searchQ.toLowerCase()) ||
        (project.serviceRequest?.contactName ?? '').toLowerCase().includes(searchQ.toLowerCase()) ||
        (project.manager?.name ?? '').toLowerCase().includes(searchQ.toLowerCase());
    }

    return passesTab && passesSearch;
  });

  const totalCount = projects.length;
  const activeCount = projects.filter(
    (p) => !['COMPLETED', 'ARCHIVED', 'TERMINATED'].includes(p.status)
  ).length;
  const completedCount = projects.filter((p) =>
    ['COMPLETED', 'ARCHIVED'].includes(p.status)
  ).length;
  const terminatedCount = projects.filter((p) => p.status === 'TERMINATED').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            All Projects — Full History
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">
            Every valuation project ever created — active, completed, and terminated.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-center bg-white border border-[#e9ecef] rounded-lg px-4 py-2 shadow-sm">
            <p className="text-xl font-bold text-[#0f2038]">{totalCount}</p>
            <p className="text-[10px] text-[#6c757d] uppercase tracking-wider">Total</p>
          </div>
          <div className="text-center bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
            <p className="text-xl font-bold text-blue-700">{activeCount}</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wider">Active</p>
          </div>
          <div className="text-center bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2">
            <p className="text-xl font-bold text-emerald-700">{completedCount}</p>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Completed</p>
          </div>
          <div className="text-center bg-red-50 border border-red-100 rounded-lg px-4 py-2">
            <p className="text-xl font-bold text-red-700">{terminatedCount}</p>
            <p className="text-[10px] text-red-600 uppercase tracking-wider">Terminated</p>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search code, client, or manager..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#e9ecef] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 transition-shadow shadow-sm"
          />
          <svg className="w-4 h-4 text-[#6c757d] absolute left-3 top-[0.55rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-[#e9ecef] shadow-sm overflow-x-auto">
          {[
            { key: 'all', label: 'All', color: 'bg-[#0f2038]' },
            { key: 'active', label: 'Active', color: 'bg-blue-600' },
            { key: 'completed', label: 'Completed', color: 'bg-emerald-600' },
            { key: 'terminated', label: 'Terminated', color: 'bg-red-600' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSubTab(key as typeof subTab)}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                subTab === key ? `${color} text-white` : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#6c757d] ml-auto">
          Showing <span className="font-semibold text-[#0f2038]">{filteredProjects.length}</span> of {totalCount}
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#6c757d] text-sm">No projects found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa] border-b border-[#e9ecef]">
                <tr>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Project Code</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Client</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Source</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Status</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Assigned Manager</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Field Engineer</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Report Analyst</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Created</th>
                  <th className="px-5 py-3 font-medium text-[#6c757d] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
            {filteredProjects.map((project: any) => {
              const terminationReason = project.status === 'TERMINATED' ? getTerminationReason(project) : null;
              return (
                <tbody key={project.id} className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors">
                  <tr>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} font-mono font-medium text-[#0f2038]`}>
                          {project.projectCode}
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                          <p className="font-medium text-[#0f2038]">{project.serviceRequest?.contactName ?? '—'}</p>
                          <p className="text-xs text-[#6c757d]">{project.serviceRequest?.propertyType ?? ''}</p>
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceColor(project.source)}`}>
                            {formatSource(project.source)}
                          </span>
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(project.status, project.clientReworkRequested)}`}>
                            {formatStatus(project.status, project.clientReworkRequested)}
                          </span>
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                          {project.manager ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-[#0f2038] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {project.manager.name.charAt(0).toUpperCase()}
                              </span>
                              <span className="text-[#0f2038] font-medium text-xs">{project.manager.name}</span>
                            </span>
                          ) : (
                            <span className="italic text-gray-400 text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} text-[#6c757d] text-xs`}>
                          {project.fieldEmployees?.map((e: any) => e.name).join(', ') || (
                            <span className="italic text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} text-[#6c757d] text-xs`}>
                          {project.reportEmployee?.name || <span className="italic text-gray-400">Unassigned</span>}
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} text-[#6c757d] text-xs whitespace-nowrap`}>
                          {new Date(project.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className={`px-5 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                          <Link
                            href={`/portal/projects/${project.projectCode}`}
                            className="text-[#b8860b] hover:underline font-medium text-xs"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                      {project.status === 'TERMINATED' && (
                        <tr className="border-none">
                          <td colSpan={9} className="px-5 pb-4">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                              <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Termination Reason</p>
                              <p className="text-sm text-red-700">{getTerminationReason(project) || 'No reason provided'}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                </tbody>
              );
            })}
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
