'use client';

/**
 * IBBIReportBuilder — Report Builder for IBBI-IVS Valuation Reports
 * (Organisation Client: IBBI)
 *
 * This is a placeholder component. Sections and fields will be populated
 * based on the IBBI-IVS sample valuation report master file located at:
 *   Banks/IBBI-IVS-SAMPLE VALAUTION REPORT/
 *
 * Architecture mirrors GeneralReportBuilder.tsx but with IBBI-specific
 * sections, fields, PDF layout, and validation rules.
 */

import React from 'react';

// ── Placeholder Props (will be expanded with IBBI-specific fields) ──
interface IBBIReportBuilderProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole?: string;
  bucketImages?: any[];
  prefill?: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    propertyAddress: string;
    propertyType: string;
    purpose: string;
  };
}

export default function IBBIReportBuilder({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole = 'REPORT_EMPLOYEE',
  bucketImages = [],
  prefill,
}: IBBIReportBuilderProps) {
  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2038] to-[#1a3a5c] rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold tracking-wider">
            IBBI-IVS
          </span>
          <span className="bg-amber-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-amber-200">
            ORGANISATION CLIENT
          </span>
        </div>
        <h1 className="text-2xl font-bold font-mono">{projectCode}</h1>
        <p className="text-white/60 text-sm mt-1">
          IBBI-IVS Valuation Report Builder
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-12 text-center">
        <div className="text-5xl mb-4">🏗️</div>
        <h2 className="text-xl font-bold text-[#0f2038] mb-3">
          IBBI Report Builder — Coming Soon
        </h2>
        <p className="text-[#6c757d] text-sm max-w-md mx-auto leading-relaxed">
          This report builder is being constructed based on the IBBI-IVS Sample
          Valuation Report master file. Sections and fields will be added
          incrementally.
        </p>
        <div className="mt-6 text-xs text-amber-600 font-mono">
          Project: {projectId} · Status: {status} · Role: {userRole}
        </div>
      </div>
    </div>
  );
}
