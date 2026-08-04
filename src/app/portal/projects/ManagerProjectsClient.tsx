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

export default function ManagerProjectsClient({
  projects,
  title,
  subtitle,
}: {
  projects: ProjectType[];
  title: string;
  subtitle: string;
}) {
  const [tab, setTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [subTab, setSubTab] = useState<'all' | 'completed' | 'terminated'>('all');
  const [searchQ, setSearchQ] = useState('');

  const filteredProjects = projects.filter((project) => {
    const isCompleted = ['COMPLETED', 'ARCHIVED', 'TERMINATED'].includes(project.status);

    // Main tab filter
    let passesTab = true;
    if (tab === 'pending') passesTab = !isCompleted;
    if (tab === 'completed') {
      passesTab = isCompleted;
      // Sub-tab filter within "completed"
      if (subTab === 'completed') passesTab = ['COMPLETED', 'ARCHIVED'].includes(project.status);
      if (subTab === 'terminated') passesTab = project.status === 'TERMINATED';
      // subTab === 'all' keeps all completed+archived+terminated
    }

    // Search filter
    let passesSearch = true;
    if (searchQ) {
      passesSearch = project.projectCode.toLowerCase().includes(searchQ.toLowerCase());
    }

    return passesTab && passesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {/* Search */}
          <div className="relative w-full lg:w-64">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search Project Code..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#e9ecef] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 transition-shadow shadow-sm"
            />
            <svg className="w-4 h-4 text-[#6c757d] absolute left-3 top-[0.55rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Main Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-[#e9ecef] shadow-sm w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setTab('pending')}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                tab === 'pending' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => { setTab('completed'); setSubTab('all'); }}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                tab === 'completed' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                tab === 'all' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Sub-toggle for Completed tab */}
      {tab === 'completed' && (
        <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-[#e9ecef] shadow-sm w-fit">
          <button
            onClick={() => setSubTab('all')}
            className={`px-3.5 py-1 rounded-sm text-[12px] font-medium transition-colors whitespace-nowrap ${
              subTab === 'all' ? 'bg-[#b8860b] text-white' : 'text-[#6c757d] hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSubTab('completed')}
            className={`px-3.5 py-1 rounded-sm text-[12px] font-medium transition-colors whitespace-nowrap ${
              subTab === 'completed' ? 'bg-emerald-600 text-white' : 'text-[#6c757d] hover:bg-gray-50'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setSubTab('terminated')}
            className={`px-3.5 py-1 rounded-sm text-[12px] font-medium transition-colors whitespace-nowrap ${
              subTab === 'terminated' ? 'bg-red-600 text-white' : 'text-[#6c757d] hover:bg-gray-50'
            }`}
          >
            Terminated
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#6c757d] text-sm">No projects found.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fa] border-b border-[#e9ecef]">
              <tr>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Project Code</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Client</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Source</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Status</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Field Agent</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Report Agent</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9ecef]">
              {filteredProjects.map((project: any) => (
                <tr key={project.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-[#0f2038]">
                    {project.projectCode}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#0f2038]">{project.serviceRequest.contactName}</p>
                    <p className="text-xs text-[#6c757d]">{project.serviceRequest.propertyType}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceColor(project.source)}`}>
                      {formatSource(project.source)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(project.status, project.clientReworkRequested)}`}>
                      {formatStatus(project.status, project.clientReworkRequested)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6c757d]">
                    {project.fieldEmployees.map((e: any) => e.name).join(', ') || <span className="italic text-gray-400">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 text-[#6c757d]">
                    {project.reportEmployee?.name || <span className="italic text-gray-400">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/portal/projects/${project.projectCode}`}
                      className="text-[#b8860b] hover:underline font-medium text-xs"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
