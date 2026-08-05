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

function getTerminationReason(messages: { content: string }[] | undefined): string | null {
  if (!messages || messages.length === 0) return null;
  const content = messages[0].content;
  // Format: **Project Terminated**\n\nReason: <reason>
  const match = content.match(/Reason:\s*(.+)/i);
  return match ? match[1].trim() : null;
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
    if (tab === 'completed' || tab === 'all') {
      if (tab === 'completed') passesTab = isCompleted;
      // When tab === 'all', passesTab stays true (show everything), then apply subTab below
      if (tab === 'all') passesTab = true;

      // Sub-tab filter: only refine within completed/terminated when subTab is not 'all'
      if (tab === 'completed') {
        if (subTab === 'completed') passesTab = ['COMPLETED', 'ARCHIVED'].includes(project.status);
        if (subTab === 'terminated') passesTab = project.status === 'TERMINATED';
        // subTab === 'all' keeps passesTab as isCompleted
      }
      if (tab === 'all') {
        if (subTab === 'completed') passesTab = ['COMPLETED', 'ARCHIVED'].includes(project.status);
        if (subTab === 'terminated') passesTab = project.status === 'TERMINATED';
        // subTab === 'all' keeps passesTab as true (everything)
      }
    }

    // Search filter
    let passesSearch = true;
    if (searchQ) {
      passesSearch = project.projectCode.toLowerCase().includes(searchQ.toLowerCase());
    }

    return passesTab && passesSearch;
  });

  const showSubTabs = tab === 'completed' || tab === 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            {title}
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-col lg:flex-row items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0">
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

          {/* Main Tabs + Sub-tabs stacked */}
          <div className="flex flex-col gap-1.5 w-full lg:w-auto">
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
                onClick={() => { setTab('all'); setSubTab('all'); }}
                className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                  tab === 'all' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
                }`}
              >
                All
              </button>
            </div>

            {/* Sub-tabs — shown directly under main tabs when Completed or All is active */}
            {showSubTabs && (
              <div className="flex items-center gap-1 bg-[#f8f9fa] p-1 rounded-md border border-[#e9ecef] shadow-sm w-full lg:w-auto overflow-x-auto">
                <button
                  onClick={() => setSubTab('all')}
                  className={`px-3 py-0.5 rounded-sm text-[11px] font-medium transition-colors whitespace-nowrap ${
                    subTab === 'all' ? 'bg-[#b8860b] text-white' : 'text-[#6c757d] hover:bg-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSubTab('completed')}
                  className={`px-3 py-0.5 rounded-sm text-[11px] font-medium transition-colors whitespace-nowrap ${
                    subTab === 'completed' ? 'bg-emerald-600 text-white' : 'text-[#6c757d] hover:bg-white'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setSubTab('terminated')}
                  className={`px-3 py-0.5 rounded-sm text-[11px] font-medium transition-colors whitespace-nowrap ${
                    subTab === 'terminated' ? 'bg-red-600 text-white' : 'text-[#6c757d] hover:bg-white'
                  }`}
                >
                  Terminated
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
            {filteredProjects.map((project: any) => {
              const terminationReason = project.status === 'TERMINATED' ? getTerminationReason(project.messages) : null;
              return (
                <tbody key={project.id} className="border-b border-[#e9ecef] hover:bg-[#f8f9fa] transition-colors">
                  <tr>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} font-mono font-medium text-[#0f2038]`}>
                        {project.projectCode}
                      </td>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                        <p className="font-medium text-[#0f2038]">{project.serviceRequest.contactName}</p>
                        <p className="text-xs text-[#6c757d]">{project.serviceRequest.propertyType}</p>
                      </td>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceColor(project.source)}`}>
                          {formatSource(project.source)}
                        </span>
                      </td>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(project.status, project.clientReworkRequested)}`}>
                          {formatStatus(project.status, project.clientReworkRequested)}
                        </span>
                      </td>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} text-[#6c757d]`}>
                        {project.fieldEmployees.map((e: any) => e.name).join(', ') || <span className="italic text-gray-400">Unassigned</span>}
                      </td>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'} text-[#6c757d]`}>
                        {project.reportEmployee?.name || <span className="italic text-gray-400">Unassigned</span>}
                      </td>
                      <td className={`px-6 pt-4 ${terminationReason ? 'pb-1' : 'pb-4'}`}>
                        <Link
                          href={`/portal/projects/${project.projectCode}`}
                          className="text-[#b8860b] hover:underline font-medium text-xs"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                    {terminationReason && (
                      <tr className="border-none">
                        <td colSpan={7} className="px-6 pb-4 pt-1">
                          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider mr-1.5">Reason:</span>
                          <span className="text-[11px] font-bold text-red-600">{terminationReason}</span>
                        </td>
                      </tr>
                    )}
                </tbody>
              );
            })}
          </table>
        )}
      </div>
    </div>
  );
}
