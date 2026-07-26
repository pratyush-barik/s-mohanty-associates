'use client';

import { useState } from 'react';
import Link from 'next/link';

type ProjectType = any; // Using any for simplicity as it's a complex prisma inclusion

export default function MyProjectsClient({ 
  initialProjects, 
  userId 
}: { 
  initialProjects: ProjectType[]; 
  userId: string;
}) {
  const [tab, setTab] = useState<'pending' | 'completed' | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');

  const filteredProjects = initialProjects.filter((project) => {
    // Determine agent's completion status
    // For a report agent, it's considered "completed" if it's in manager review, completed, or archived
    const isCompleted = ['MANAGER_REVIEW', 'COMPLETED', 'ARCHIVED'].includes(project.status) && project.report?.status !== 'REVISION_REQUESTED';
    
    // Tab filter
    let passesTab = true;
    if (tab === 'pending') passesTab = !isCompleted;
    if (tab === 'completed') passesTab = isCompleted;

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
            My Projects
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">
            Draft and submit valuation reports for verification.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {/* Search Form */}
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

          {/* Tabs */}
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
              onClick={() => setTab('completed')}
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

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="card p-12 text-center text-[#6c757d] text-sm">
            No projects found.
          </div>
        ) : (
          filteredProjects.map((project: any) => {
            // Determine report status visually
            let statusLabel = 'DRAFTING';
            let statusColor = 'bg-blue-50 text-blue-700';
            
            if (project.status === 'MANAGER_REVIEW') {
              statusLabel = 'IN VERIFICATION';
              statusColor = 'bg-orange-50 text-orange-700';
            } else if (project.report?.status === 'REVISION_REQUESTED') {
              statusLabel = 'REVISION NEEDED';
              statusColor = 'bg-red-50 text-red-700';
            } else if (['COMPLETED', 'ARCHIVED'].includes(project.status)) {
              statusLabel = 'COMPLETED';
              statusColor = 'bg-emerald-50 text-emerald-700';
            }

            return (
              <div key={project.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#e9ecef] hover:border-[#b8860b] transition-all hover:shadow-md">
                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Status & Code */}
                  <div className="w-40 shrink-0">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <h3 className="font-mono text-[#0f2038] font-bold mt-2 text-base">
                      {project.projectCode}
                    </h3>
                  </div>
                  {/* Property Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0f2038] truncate">{project.serviceRequest.contactName}</h4>
                    <p className="text-xs font-semibold text-[#b8860b] mt-0.5">{project.serviceRequest.propertyType}</p>
                    <p className="text-xs text-[#6c757d] truncate mt-1">{project.serviceRequest.propertyAddress}</p>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={`/portal/reports/${project.id}`}
                    className="btn btn-primary text-sm py-2.5 px-6 block w-full text-center md:inline-block font-semibold"
                  >
                    {['MANAGER_REVIEW', 'COMPLETED', 'ARCHIVED'].includes(project.status) ? 'View Report' : 'Draft Report'}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
