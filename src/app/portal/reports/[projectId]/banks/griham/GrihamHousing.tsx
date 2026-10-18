'use client';

import React, { useMemo } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Scale, ShieldCheck, FileText } from 'lucide-react';

// ─── Reusable Helper Components ─────────────────────────────────────────────

export function EditSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? 'text-emerald-700' : 'text-gray-400'}`}>
        {checked ? 'Edit On' : 'Edit Off'}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-emerald-500' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow ${
            checked ? 'translate-x-4.5' : 'translate-x-0.75'
          }`}
        />
      </button>
    </div>
  );
}

export function NaCheckbox({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">NA</span>
    </label>
  );
}

export function CustomSelect({
  value,
  customValue,
  onChange,
  onCustomChange,
  options,
  disabled = false,
  placeholder = 'Select option...',
}: {
  value: string;
  customValue?: string;
  onChange: (val: string) => void;
  onCustomChange?: (val: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const isCustom = value === 'Custom' || value === 'custom';
  return (
    <div className="space-y-2">
      <select
        className={inputCls}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        <option value="Custom">Custom</option>
      </select>
      {isCustom && onCustomChange && (
        <input
          type="text"
          className={inputCls}
          value={customValue || ''}
          onChange={(e) => onCustomChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter custom value..."
        />
      )}
    </div>
  );
}

// ─── Section 1: Objective ───────────────────────────────────────────────────

const DEFAULT_VALUATION_AGENCY = 'S MOHANTY ASSOCIATES';

function ObjectiveSection({
  fields,
  handleChange,
  isReadOnly,
  projectCode,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Name of Valuation Agency
  const effectiveAgency = fields.grihamValuationAgencyEditOn
    ? (fields.grihamValuationAgency ?? '')
    : (fields.grihamValuationAgency || DEFAULT_VALUATION_AGENCY);

  // 2. Date of Valuation
  const effectiveDate = fields.grihamDateOfValuationEditOn
    ? (fields.grihamDateOfValuation ?? '')
    : (fields.grihamDateOfValuation || todayStr);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Objective Details (Light Gray #f5f5f5) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            OBJECTIVE
          </h3>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Valuation Overview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Name of Valuation Agency */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">NAME OF VALUATION AGENCY</span>
                <EditSwitch
                  checked={!!fields.grihamValuationAgencyEditOn}
                  onChange={(checked) => {
                    handleChange('grihamValuationAgencyEditOn', checked);
                    if (!checked) handleChange('grihamValuationAgency', DEFAULT_VALUATION_AGENCY);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="text"
                className={`${inputCls} font-medium ${
                  !fields.grihamValuationAgencyEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveAgency}
                onChange={(e) => handleChange('grihamValuationAgency', e.target.value)}
                disabled={isReadOnly || !fields.grihamValuationAgencyEditOn}
                placeholder="Enter Valuation Agency name"
              />
              {!fields.grihamValuationAgencyEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Prefilled
                </div>
              )}
            </div>
          </Field>

          {/* 2. Date of Valuation */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">DATE OF VALUATION</span>
                <EditSwitch
                  checked={!!fields.grihamDateOfValuationEditOn}
                  onChange={(checked) => {
                    handleChange('grihamDateOfValuationEditOn', checked);
                    if (!checked) handleChange('grihamDateOfValuation', todayStr);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="date"
                className={`${inputCls} font-medium ${
                  !fields.grihamDateOfValuationEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveDate}
                onChange={(e) => handleChange('grihamDateOfValuation', e.target.value)}
                disabled={isReadOnly || !fields.grihamDateOfValuationEditOn}
              />
              {!fields.grihamDateOfValuationEditOn && (
                <div className="absolute right-8 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Today
                </div>
              )}
            </div>
          </Field>

          {/* 3. Sourcing Branch */}
          <Field label={<span className="font-semibold text-gray-700">SOURCING BRANCH</span>}>
            <CustomSelect
              value={fields.grihamSourcingBranch || 'Bhubaneswar'}
              customValue={fields.grihamSourcingBranchCustom || ''}
              onChange={(val) => handleChange('grihamSourcingBranch', val)}
              onCustomChange={(val) => handleChange('grihamSourcingBranchCustom', val)}
              options={[
                { value: 'Bhubaneswar', label: 'Bhubaneswar' },
                { value: 'Cuttack', label: 'Cuttack' },
                { value: 'Rourkela', label: 'Rourkela' },
                { value: 'Berhampur', label: 'Berhampur' },
                { value: 'Sambalpur', label: 'Sambalpur' },
                { value: 'Kolkata', label: 'Kolkata' },
              ]}
              disabled={isReadOnly}
              placeholder="Select sourcing branch..."
            />
          </Field>

          {/* 4. Distance from Sourcing Branch */}
          <Field label={<span className="font-semibold text-gray-700">DISTANCE FROM SOURCING BRANCH</span>}>
            <div className="relative">
              <input
                type="number"
                step="any"
                className={`${inputCls} pr-12`}
                value={fields.grihamDistanceSourcingBranch || ''}
                onChange={(e) => handleChange('grihamDistanceSourcingBranch', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 5.5"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-semibold pointer-events-none">
                Kms
              </span>
            </div>
          </Field>

          {/* 5. Proposal No */}
          <Field label={<span className="font-semibold text-gray-700">PROPOSAL NO</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamProposalNo ?? (projectCode ?? '')}
              onChange={(e) => handleChange('grihamProposalNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter proposal / file number"
            />
          </Field>

          {/* 6. Case Type */}
          <Field label={<span className="font-semibold text-gray-700">CASE TYPE</span>}>
            <CustomSelect
              value={fields.grihamCaseType || 'LAP'}
              customValue={fields.grihamCaseTypeCustom || ''}
              onChange={(val) => handleChange('grihamCaseType', val)}
              onCustomChange={(val) => handleChange('grihamCaseTypeCustom', val)}
              options={[
                { value: 'LAP', label: 'LAP (Loan Against Property)' },
                { value: 'Self Construction', label: 'Self Construction' },
                { value: 'BT & Top Up', label: 'BT & Top Up' },
                { value: 'Home Loan', label: 'Home Loan' },
                { value: 'Purchase of Flat / House', label: 'Purchase of Flat / House' },
                { value: 'Plot Purchase + Construction', label: 'Plot Purchase + Construction' },
              ]}
              disabled={isReadOnly}
              placeholder="Select case type..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Scope of Enquiries and Investigation ────────────────────────

const DEFAULT_SIGNATORY = 'S MOHANTY ASSOCIATES';

function ScopeOfEnquiriesSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Date of Report Submission
  const effectiveSubmissionDate = fields.grihamDateOfReportSubmissionEditOn
    ? (fields.grihamDateOfReportSubmission ?? '')
    : (fields.grihamDateOfReportSubmission || todayStr);

  // Authorized Signatory
  const effectiveSignatory = fields.grihamAuthorizedSignatoryEditOn
    ? (fields.grihamAuthorizedSignatory ?? '')
    : (fields.grihamAuthorizedSignatory || DEFAULT_SIGNATORY);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Scope of Enquiries (Light Blue #e3f2fd) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            SCOPE OF ENQUIRIES AND INVESTIGATION
          </h3>
          <span className="text-xs text-blue-800 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200">
            Inspection & Verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Date of Inspection / Site visit */}
          <Field label={<span className="font-semibold text-gray-700">DATE OF INSPECTION / SITE VISIT</span>}>
            <input
              type="date"
              className={inputCls}
              value={fields.grihamDateOfInspection || ''}
              onChange={(e) => handleChange('grihamDateOfInspection', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* 2. Name of the Person met at site & Contact No. */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">PERSON MET AT SITE & CONTACT NO.</span>
                <NaCheckbox
                  checked={!!fields.grihamPersonMetAtSiteNa}
                  onChange={(checked) => {
                    handleChange('grihamPersonMetAtSiteNa', checked);
                    handleChange('grihamPersonMetAtSite', checked ? 'NA' : '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.grihamPersonMetAtSiteNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
              value={fields.grihamPersonMetAtSiteNa ? 'NA' : (fields.grihamPersonMetAtSite || '')}
              onChange={(e) => handleChange('grihamPersonMetAtSite', e.target.value)}
              disabled={isReadOnly || !!fields.grihamPersonMetAtSiteNa}
              placeholder="Name & Contact number"
            />
          </Field>

          {/* 3. Identified Through */}
          <Field label={<span className="font-semibold text-gray-700">IDENTIFIED THROUGH</span>}>
            <CustomSelect
              value={fields.grihamIdentifiedThrough || 'Legal docs'}
              customValue={fields.grihamIdentifiedThroughCustom || ''}
              onChange={(val) => handleChange('grihamIdentifiedThrough', val)}
              onCustomChange={(val) => handleChange('grihamIdentifiedThroughCustom', val)}
              options={[
                { value: 'Legal docs', label: 'Legal docs' },
                { value: 'Site Map', label: 'Site Map' },
                { value: 'Customer', label: 'Customer' },
                { value: 'Local enquiry', label: 'Local enquiry' },
              ]}
              disabled={isReadOnly}
              placeholder="Select identification method..."
            />
          </Field>

          {/* 4. Date of Report Submission */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">DATE OF REPORT SUBMISSION</span>
                <EditSwitch
                  checked={!!fields.grihamDateOfReportSubmissionEditOn}
                  onChange={(checked) => {
                    handleChange('grihamDateOfReportSubmissionEditOn', checked);
                    if (!checked) handleChange('grihamDateOfReportSubmission', todayStr);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="date"
                className={`${inputCls} font-medium ${
                  !fields.grihamDateOfReportSubmissionEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveSubmissionDate}
                onChange={(e) => handleChange('grihamDateOfReportSubmission', e.target.value)}
                disabled={isReadOnly || !fields.grihamDateOfReportSubmissionEditOn}
              />
              {!fields.grihamDateOfReportSubmissionEditOn && (
                <div className="absolute right-8 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Today
                </div>
              )}
            </div>
          </Field>

          {/* 5. Authorized Signatory Name & Signature */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">AUTHORIZED SIGNATORY NAME</span>
                <EditSwitch
                  checked={!!fields.grihamAuthorizedSignatoryEditOn}
                  onChange={(checked) => {
                    handleChange('grihamAuthorizedSignatoryEditOn', checked);
                    if (!checked) handleChange('grihamAuthorizedSignatory', DEFAULT_SIGNATORY);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="text"
                className={`${inputCls} font-medium ${
                  !fields.grihamAuthorizedSignatoryEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveSignatory}
                onChange={(e) => handleChange('grihamAuthorizedSignatory', e.target.value)}
                disabled={isReadOnly || !fields.grihamAuthorizedSignatoryEditOn}
                placeholder="Authorized Signatory Name"
              />
              {!fields.grihamAuthorizedSignatoryEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Prefilled
                </div>
              )}
            </div>
          </Field>

          {/* 6. Name of Engineer Visited the property */}
          <Field label={<span className="font-semibold text-gray-700">NAME OF VISITING ENGINEER</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamEngineerVisited || ''}
              onChange={(e) => handleChange('grihamEngineerVisited', e.target.value)}
              disabled={isReadOnly}
              placeholder="Engineer name"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Basis of Valuation ──────────────────────────────────────────

const BASIS_OF_VALUATION_TEXT = {
  regulatory:
    'This valuation report is prepared in accordance with the professional valuation standards recognized by the Insolvency and Bankruptcy Board of India (IBBI), the Companies (Registered Valuers and Valuation) Rules, 2017, and accepted National & International Valuation Standards (IVS). The purpose dictates the basis of value applied (Fair Market Value, Realizable Value, and Distress / Forced Sale Value).',
  methodology:
    'The property has been valued using the Land and Building Method incorporating prevailing market parameters:\n• Market Approach (Comparable Sales & Local Enquiry): Adopted for the land valuation based on registered circle rates, recent market transactions, and independent local inquiries in the micro-market.\n• Cost Approach (Depreciated Replacement Cost - DRC): Adopted for the building/structures based on current construction costs, specification levels (as per PWD/CPWD standard schedules), less depreciation based on structural age and estimated residual life.',
  reliance:
    'The valuation relies on physical site verification, visual inspection, verified identification of boundaries as per the legal deeds/plans supplied by the client/institution, and local inquiries. All assessments are carried out without any undisclosed conflict of interest.',
};

function BasisOfValuationSection() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Basis of Valuation (Light Green #e8f5e9) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-emerald-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-800 shrink-0" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              BASIS OF VALUATION
            </h3>
          </div>
          <span className="text-xs text-emerald-800 font-medium bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Statutory & Methodology Framework
          </span>
        </div>

        {/* Static Read-only Container */}
        <div className="bg-white/90 backdrop-blur-xs rounded-xl p-5 border border-emerald-200/80 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Standard Valuation Standards & Methodology
            </span>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide">
              Read-Only Boilerplate
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                1. Regulatory Framework & Valuation Standards (IBBI)
              </h4>
              <p className="text-gray-700">
                {BASIS_OF_VALUATION_TEXT.regulatory}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                2. Valuation Approach & Methodology Basis
              </h4>
              <div className="text-gray-700 whitespace-pre-line pl-1">
                {BASIS_OF_VALUATION_TEXT.methodology}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                3. Physical Inspection & Marketability Assessment
              </h4>
              <p className="text-gray-700">
                {BASIS_OF_VALUATION_TEXT.reliance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: Brief Description of the Property ───────────────────────────

function BriefDescriptionSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const effectiveTrfAddress = fields.grihamAddressAsPerTrf ?? (fields.propertyAddress ?? '');
  const effectiveActualAddress = fields.grihamAddressActualSiteEditOn
    ? (fields.grihamAddressActualSite ?? '')
    : (fields.grihamAddressActualSite || effectiveTrfAddress);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Brief Description (Light Yellow #fffde7) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-yellow-200 shadow-sm"
        style={{ backgroundColor: '#fffde7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-yellow-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            BRIEF DESCRIPTION OF THE PROPERTY
          </h3>
          <span className="text-xs text-amber-900 font-medium bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
            Property Classification & Occupancy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Name of the Customer/ Applicant & Contact Details */}
          <Field label={<span className="font-semibold text-gray-700">NAME OF CUSTOMER/APPLICANT & CONTACT DETAILS</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamCustomerName ?? (fields.borrowerName ?? '')}
              onChange={(e) => handleChange('grihamCustomerName', e.target.value)}
              disabled={isReadOnly}
              placeholder="Applicant Name & Contact details"
            />
          </Field>

          {/* 2. Name of the Co-Applicant */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">NAME OF CO-APPLICANT</span>
                <NaCheckbox
                  checked={!!fields.grihamCoApplicantNa}
                  onChange={(checked) => {
                    handleChange('grihamCoApplicantNa', checked);
                    handleChange('grihamCoApplicantName', checked ? 'NA' : '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.grihamCoApplicantNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
              value={fields.grihamCoApplicantNa ? 'NA' : (fields.grihamCoApplicantName || '')}
              onChange={(e) => handleChange('grihamCoApplicantName', e.target.value)}
              disabled={isReadOnly || !!fields.grihamCoApplicantNa}
              placeholder="Co-Applicant name"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 3. Address of property being appraised : As per TRF */}
          <Field label={<span className="font-semibold text-gray-700">ADDRESS AS PER TRF</span>}>
            <textarea
              rows={3}
              className={`${inputCls} resize-y`}
              value={fields.grihamAddressAsPerTrf ?? (fields.propertyAddress ?? '')}
              onChange={(e) => handleChange('grihamAddressAsPerTrf', e.target.value)}
              disabled={isReadOnly}
              placeholder="Address of the property as per Title / TRF"
            />
          </Field>

          {/* 4. Address of property being appraised : As per Actual at site */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">ADDRESS AS PER ACTUAL AT SITE</span>
                <EditSwitch
                  checked={!!fields.grihamAddressActualSiteEditOn}
                  onChange={(checked) => {
                    handleChange('grihamAddressActualSiteEditOn', checked);
                    if (!checked) handleChange('grihamAddressActualSite', effectiveTrfAddress);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <textarea
                rows={3}
                className={`${inputCls} resize-y font-medium ${
                  !fields.grihamAddressActualSiteEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveActualAddress}
                onChange={(e) => handleChange('grihamAddressActualSite', e.target.value)}
                disabled={isReadOnly || !fields.grihamAddressActualSiteEditOn}
                placeholder="Address as found actual at site"
              />
              {!fields.grihamAddressActualSiteEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-amber-900 font-semibold pointer-events-none flex items-center gap-1 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3 h-3" /> Mirrors TRF
                </div>
              )}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 5. Type of Property */}
          <Field label={<span className="font-semibold text-gray-700">TYPE OF PROPERTY</span>}>
            <CustomSelect
              value={fields.grihamPropertyType || 'Flat'}
              customValue={fields.grihamPropertyTypeCustom || ''}
              onChange={(val) => handleChange('grihamPropertyType', val)}
              onCustomChange={(val) => handleChange('grihamPropertyTypeCustom', val)}
              options={[
                { value: 'Flat', label: 'Flat' },
                { value: 'Row house', label: 'Row house' },
                { value: 'Shop', label: 'Shop' },
                { value: 'Office', label: 'Office' },
                { value: 'Industrial', label: 'Industrial' },
              ]}
              disabled={isReadOnly}
              placeholder="Select property type..."
            />
          </Field>

          {/* 6. Classification of Area */}
          <Field label={<span className="font-semibold text-gray-700">CLASSIFICATION OF AREA</span>}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {['Urban', 'Semi urban', 'Rural'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                  <input
                    type="radio"
                    name="grihamAreaClassification"
                    value={opt}
                    checked={(fields.grihamAreaClassification || 'Urban') === opt}
                    onChange={(e) => handleChange('grihamAreaClassification', e.target.value)}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* 7. Location/Zoning */}
          <Field label={<span className="font-semibold text-gray-700">LOCATION / ZONING</span>}>
            <CustomSelect
              value={fields.grihamLocationZoning || 'Resi'}
              customValue={fields.grihamLocationZoningCustom || ''}
              onChange={(val) => handleChange('grihamLocationZoning', val)}
              onCustomChange={(val) => handleChange('grihamLocationZoningCustom', val)}
              options={[
                { value: 'Resi', label: 'Resi (Residential)' },
                { value: 'Comm', label: 'Comm (Commercial)' },
                { value: 'Mixed', label: 'Mixed' },
                { value: 'Industrial', label: 'Industrial' },
              ]}
              disabled={isReadOnly}
              placeholder="Select location/zoning..."
            />
          </Field>

          {/* 8. Property Usage */}
          <Field label={<span className="font-semibold text-gray-700">PROPERTY USAGE</span>}>
            <CustomSelect
              value={fields.grihamPropertyUsage || 'Resi'}
              customValue={fields.grihamPropertyUsageCustom || ''}
              onChange={(val) => handleChange('grihamPropertyUsage', val)}
              onCustomChange={(val) => handleChange('grihamPropertyUsageCustom', val)}
              options={[
                { value: 'Resi', label: 'Resi (Residential)' },
                { value: 'Comm', label: 'Comm (Commercial)' },
                { value: 'Mixed', label: 'Mixed' },
                { value: 'Industrial', label: 'Industrial' },
                { value: 'Vacant', label: 'Vacant' },
              ]}
              disabled={isReadOnly}
              placeholder="Select property usage..."
            />
          </Field>

          {/* 9. Occupation Status */}
          <Field label={<span className="font-semibold text-gray-700">OCCUPATION STATUS</span>}>
            <CustomSelect
              value={fields.grihamOccupationStatus || 'Self'}
              customValue={fields.grihamOccupationStatusCustom || ''}
              onChange={(val) => handleChange('grihamOccupationStatus', val)}
              onCustomChange={(val) => handleChange('grihamOccupationStatusCustom', val)}
              options={[
                { value: 'Self', label: 'Self occupied' },
                { value: 'Tenanted', label: 'Tenanted' },
                { value: 'Mixed', label: 'Mixed' },
                { value: 'Vacant', label: 'Vacant' },
                { value: 'Seller occupied', label: 'Seller occupied' },
              ]}
              disabled={isReadOnly}
              placeholder="Select occupation status..."
            />
          </Field>

          {/* 10. No. of Tenants */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">NO. OF TENANTS</span>
                <NaCheckbox
                  checked={!!fields.grihamNoOfTenantsNa}
                  onChange={(checked) => {
                    handleChange('grihamNoOfTenantsNa', checked);
                    handleChange('grihamNoOfTenants', checked ? 'NA' : '0');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type={fields.grihamNoOfTenantsNa ? 'text' : 'number'}
              min="0"
              className={`${inputCls} ${fields.grihamNoOfTenantsNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
              value={fields.grihamNoOfTenantsNa ? 'NA' : (fields.grihamNoOfTenants ?? '')}
              onChange={(e) => handleChange('grihamNoOfTenants', e.target.value)}
              disabled={isReadOnly || !!fields.grihamNoOfTenantsNa}
              placeholder={fields.grihamNoOfTenantsNa ? 'NA' : 'e.g. 0'}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Town Planning Parameters ────────────────────────────────────

function TownPlanningSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const directions = [
    { key: 'North', label: 'North' },
    { key: 'South', label: 'South' },
    { key: 'East', label: 'East' },
    { key: 'West', label: 'West' },
  ];

  const setbacks = [
    { key: 'Front', label: 'Front' },
    { key: 'Rear', label: 'Rear' },
    { key: 'Left', label: 'Left Side' },
    { key: 'Right', label: 'Right Side' },
  ];

  // Height / Stories logic
  const effectiveSanctionedStories = fields.grihamStoriesSanctionedNa
    ? 'NA'
    : (fields.grihamStoriesSanctioned ?? '');

  const effectiveActualStories = fields.grihamStoriesActualEditOn
    ? (fields.grihamStoriesActual ?? '')
    : (fields.grihamStoriesActual || effectiveSanctionedStories);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Town Planning Parameters (Light Purple #f3e5f5) */}
      <div
        className="rounded-xl p-5 space-y-6 border border-purple-200 shadow-sm"
        style={{ backgroundColor: '#f3e5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            TOWN PLANNING PARAMETERS
          </h3>
          <span className="text-xs text-purple-900 font-medium bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200">
            Planning Regulations & Boundaries
          </span>
        </div>

        {/* 1. Boundaries Table */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
              Boundaries Table
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-900 font-semibold">Row 2 (Actual) Override:</span>
              <EditSwitch
                checked={!!fields.grihamBoundariesActualEditOn}
                onChange={(checked) => {
                  handleChange('grihamBoundariesActualEditOn', checked);
                  if (!checked) {
                    directions.forEach((d) => {
                      const docsVal = fields[`grihamBoundary${d.key}Docs`] ?? (fields[`${d.key.toLowerCase()}Deed`] ?? '');
                      handleChange(`grihamBoundary${d.key}Actual`, docsVal);
                    });
                  }
                }}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-purple-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/70 border-b border-purple-200 text-purple-950 font-bold">
                  <th className="p-3 w-44">Direction</th>
                  {directions.map((d) => (
                    <th key={d.key} className="p-3">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-purple-50/40">
                    Row 1 (As per Docs)
                  </td>
                  {directions.map((d) => {
                    const docsKey = `grihamBoundary${d.key}Docs`;
                    const fallbackVal = fields[`${d.key.toLowerCase()}Deed`] ?? '';
                    return (
                      <td key={d.key} className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields[docsKey] ?? fallbackVal}
                          onChange={(e) => handleChange(docsKey, e.target.value)}
                          disabled={isReadOnly}
                          placeholder={`${d.label} (Docs)`}
                        />
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-purple-50/40">
                    <div className="flex items-center justify-between gap-1">
                      <span>Row 2 (As per Actual)</span>
                      {!fields.grihamBoundariesActualEditOn && (
                        <span className="text-[10px] text-purple-800 font-bold bg-purple-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Mirrors Docs
                        </span>
                      )}
                    </div>
                  </td>
                  {directions.map((d) => {
                    const actualKey = `grihamBoundary${d.key}Actual`;
                    const docsKey = `grihamBoundary${d.key}Docs`;
                    const docsVal = fields[docsKey] ?? (fields[`${d.key.toLowerCase()}Deed`] ?? '');
                    const val = fields.grihamBoundariesActualEditOn
                      ? (fields[actualKey] ?? '')
                      : (fields[actualKey] || docsVal);

                    return (
                      <td key={d.key} className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} font-medium ${
                            !fields.grihamBoundariesActualEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                          }`}
                          value={val}
                          onChange={(e) => handleChange(actualKey, e.target.value)}
                          disabled={isReadOnly || !fields.grihamBoundariesActualEditOn}
                          placeholder={`${d.label} (Actual)`}
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Boundaries Matching & Conditional Reason */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Boundaries Matching */}
          <Field label={<span className="font-semibold text-gray-700">BOUNDARIES MATCHING</span>}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {['Yes', 'Partly matching', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                  <input
                    type="radio"
                    name="grihamBoundariesMatching"
                    value={opt}
                    checked={(fields.grihamBoundariesMatching || 'Yes') === opt}
                    onChange={(e) => {
                      handleChange('grihamBoundariesMatching', e.target.value);
                      if (opt === 'Yes') {
                        handleChange('grihamBoundariesMismatchReason', '');
                      }
                    }}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* If No, then reason thereon */}
          {(fields.grihamBoundariesMatching === 'Partly matching' || fields.grihamBoundariesMatching === 'No') && (
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">IF NO / PARTLY MATCHING, REASON THEREON</span>
                  <NaCheckbox
                    checked={!!fields.grihamBoundariesMismatchReasonNa}
                    onChange={(checked) => {
                      handleChange('grihamBoundariesMismatchReasonNa', checked);
                      handleChange('grihamBoundariesMismatchReason', checked ? 'NA' : '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <textarea
                rows={2}
                className={`${inputCls} resize-y ${fields.grihamBoundariesMismatchReasonNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
                value={fields.grihamBoundariesMismatchReasonNa ? 'NA' : (fields.grihamBoundariesMismatchReason || '')}
                onChange={(e) => handleChange('grihamBoundariesMismatchReason', e.target.value)}
                disabled={isReadOnly || !!fields.grihamBoundariesMismatchReasonNa}
                placeholder="Specify reason for mismatch in boundaries..."
              />
            </Field>
          )}
        </div>

        {/* 3. Setbacks / Margins Table */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
              Setbacks / Margins Table (in Metres / Feet)
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-900 font-semibold">Row 2 (Actual) Override:</span>
              <EditSwitch
                checked={!!fields.grihamSetbackActualEditOn}
                onChange={(checked) => {
                  handleChange('grihamSetbackActualEditOn', checked);
                  if (!checked) {
                    setbacks.forEach((s) => {
                      const sanctionedVal = fields.grihamSetbackSanctionedNa
                        ? 'NA'
                        : (fields[`grihamSetback${s.key}Sanctioned`] || '');
                      handleChange(`grihamSetback${s.key}Actual`, sanctionedVal);
                    });
                  }
                }}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-purple-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-100/70 border-b border-purple-200 text-purple-950 font-bold">
                  <th className="p-3 w-44">Setback Parameter</th>
                  {setbacks.map((s) => (
                    <th key={s.key} className="p-3">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-purple-50/40">
                    <div className="flex items-center justify-between gap-2">
                      <span>Row 1 (Sanctioned)</span>
                      <NaCheckbox
                        checked={!!fields.grihamSetbackSanctionedNa}
                        onChange={(checked) => {
                          handleChange('grihamSetbackSanctionedNa', checked);
                          setbacks.forEach((s) => {
                            handleChange(`grihamSetback${s.key}Sanctioned`, checked ? 'NA' : '');
                          });
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                  </td>
                  {setbacks.map((s) => {
                    const key = `grihamSetback${s.key}Sanctioned`;
                    return (
                      <td key={s.key} className="p-2">
                        <input
                          type={fields.grihamSetbackSanctionedNa ? 'text' : 'number'}
                          step="any"
                          className={`${inputCls} ${fields.grihamSetbackSanctionedNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
                          value={fields.grihamSetbackSanctionedNa ? 'NA' : (fields[key] ?? '')}
                          onChange={(e) => handleChange(key, e.target.value)}
                          disabled={isReadOnly || !!fields.grihamSetbackSanctionedNa}
                          placeholder={fields.grihamSetbackSanctionedNa ? 'NA' : 'e.g. 1.5'}
                        />
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-gray-700 bg-purple-50/40">
                    <div className="flex items-center justify-between gap-1">
                      <span>Row 2 (Actual)</span>
                      {!fields.grihamSetbackActualEditOn && (
                        <span className="text-[10px] text-purple-800 font-bold bg-purple-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Mirrors Sanctioned
                        </span>
                      )}
                    </div>
                  </td>
                  {setbacks.map((s) => {
                    const actualKey = `grihamSetback${s.key}Actual`;
                    const sanctionedKey = `grihamSetback${s.key}Sanctioned`;
                    const sanctionedVal = fields.grihamSetbackSanctionedNa
                      ? 'NA'
                      : (fields[sanctionedKey] ?? '');
                    const val = fields.grihamSetbackActualEditOn
                      ? (fields[actualKey] ?? '')
                      : (fields[actualKey] || sanctionedVal);

                    return (
                      <td key={s.key} className="p-2">
                        <input
                          type={val === 'NA' ? 'text' : 'number'}
                          step="any"
                          className={`${inputCls} font-medium ${
                            !fields.grihamSetbackActualEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                          }`}
                          value={val}
                          onChange={(e) => handleChange(actualKey, e.target.value)}
                          disabled={isReadOnly || !fields.grihamSetbackActualEditOn}
                          placeholder="Actual setback"
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Height / Stories (Sanctioned vs Actual) */}
        <div className="space-y-2 pt-1">
          <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
            Height / Stories
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sanctioned Height/Stories */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">HEIGHT / STORIES (SANCTIONED)</span>
                  <NaCheckbox
                    checked={!!fields.grihamStoriesSanctionedNa}
                    onChange={(checked) => {
                      handleChange('grihamStoriesSanctionedNa', checked);
                      handleChange('grihamStoriesSanctioned', checked ? 'NA' : '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type={fields.grihamStoriesSanctionedNa ? 'text' : 'number'}
                step="any"
                min="0"
                className={`${inputCls} ${fields.grihamStoriesSanctionedNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
                value={effectiveSanctionedStories}
                onChange={(e) => handleChange('grihamStoriesSanctioned', e.target.value)}
                disabled={isReadOnly || !!fields.grihamStoriesSanctionedNa}
                placeholder={fields.grihamStoriesSanctionedNa ? 'NA' : 'e.g. 2'}
              />
            </Field>

            {/* Actual Height/Stories */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">HEIGHT / STORIES (ACTUAL)</span>
                  <EditSwitch
                    checked={!!fields.grihamStoriesActualEditOn}
                    onChange={(checked) => {
                      handleChange('grihamStoriesActualEditOn', checked);
                      if (!checked) {
                        handleChange('grihamStoriesActual', effectiveSanctionedStories);
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type={effectiveActualStories === 'NA' ? 'text' : 'number'}
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamStoriesActualEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveActualStories}
                  onChange={(e) => handleChange('grihamStoriesActual', e.target.value)}
                  disabled={isReadOnly || !fields.grihamStoriesActualEditOn}
                  placeholder="e.g. 2"
                />
                {!fields.grihamStoriesActualEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-purple-900 font-semibold pointer-events-none flex items-center gap-1 bg-purple-100/90 px-2 py-0.5 rounded border border-purple-200">
                    <Lock className="w-3 h-3" /> Mirrors Sanctioned
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Document Details and Legal Aspects ──────────────────────────

const AVAILABLE_DOCS_LIST = [
  'Sale Deed',
  'ROR (Record of Rights / Patta)',
  'Sketch map',
  'Tax Receipt',
  'Approved Building Plan',
  'Mutation / Conversion Order',
  'Electricity Bill',
];

function LegalAspectsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const effectiveTrfAddress = fields.grihamAddressAsPerTrf ?? (fields.propertyAddress ?? '');
  const effectiveDocAddress = fields.grihamAddressAsPerDocumentEditOn
    ? (fields.grihamAddressAsPerDocument ?? '')
    : (fields.grihamAddressAsPerDocument || effectiveTrfAddress);

  const selectedDocs: string[] = Array.isArray(fields.grihamDocsProvided)
    ? fields.grihamDocsProvided
    : typeof fields.grihamDocsProvided === 'string' && fields.grihamDocsProvided
    ? fields.grihamDocsProvided.split(',').map((s: string) => s.trim()).filter(Boolean)
    : ['Sale Deed', 'ROR (Record of Rights / Patta)', 'Tax Receipt'];

  const toggleDoc = (doc: string) => {
    const next = [...selectedDocs];
    const idx = next.indexOf(doc);
    if (idx > -1) {
      next.splice(idx, 1);
    } else {
      next.push(doc);
    }
    handleChange('grihamDocsProvided', next);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Document Details and Legal Aspects (Light Cyan #e0f7fa) */}
      <div
        className="rounded-xl p-5 space-y-6 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            DOCUMENT DETAILS AND LEGAL ASPECTS OF THE PROPERTY
          </h3>
          <span className="text-xs text-cyan-900 font-medium bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-200">
            Legal & Municipal Approvals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Name of Current Owner / Seller */}
          <Field label={<span className="font-semibold text-gray-700">NAME OF CURRENT OWNER / SELLER</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamCurrentOwnerSeller ?? (fields.propertyOwner ?? '')}
              onChange={(e) => handleChange('grihamCurrentOwnerSeller', e.target.value)}
              disabled={isReadOnly}
              placeholder="Name of title holder / seller"
            />
          </Field>

          {/* 2. Address of property being appraised : As per Document */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">ADDRESS AS PER DOCUMENT</span>
                <EditSwitch
                  checked={!!fields.grihamAddressAsPerDocumentEditOn}
                  onChange={(checked) => {
                    handleChange('grihamAddressAsPerDocumentEditOn', checked);
                    if (!checked) handleChange('grihamAddressAsPerDocument', effectiveTrfAddress);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <textarea
                rows={2}
                className={`${inputCls} resize-y font-medium ${
                  !fields.grihamAddressAsPerDocumentEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveDocAddress}
                onChange={(e) => handleChange('grihamAddressAsPerDocument', e.target.value)}
                disabled={isReadOnly || !fields.grihamAddressAsPerDocumentEditOn}
                placeholder="Property address as per legal documents"
              />
              {!fields.grihamAddressAsPerDocumentEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-cyan-900 font-semibold pointer-events-none flex items-center gap-1 bg-cyan-100/90 px-2 py-0.5 rounded border border-cyan-200">
                  <Lock className="w-3 h-3" /> Mirrors TRF
                </div>
              )}
            </div>
          </Field>
        </div>

        {/* 3. Documents Provided by GHFL */}
        <div className="space-y-2.5">
          <span className="font-semibold text-xs sm:text-sm text-gray-700 uppercase tracking-wide">
            DOCUMENTS PROVIDED BY GHFL
          </span>
          <div className="p-3.5 bg-white/90 rounded-lg border border-cyan-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_DOCS_LIST.map((doc) => {
                const checked = selectedDocs.includes(doc);
                return (
                  <label
                    key={doc}
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-semibold shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    } ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDoc(doc)}
                      disabled={isReadOnly}
                      className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>{doc}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 4. Status of Land Holding */}
          <Field label={<span className="font-semibold text-gray-700">STATUS OF LAND HOLDING</span>}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {['Freehold', 'Leasehold'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                  <input
                    type="radio"
                    name="grihamLandHoldingStatus"
                    value={opt}
                    checked={(fields.grihamLandHoldingStatus || 'Freehold') === opt}
                    onChange={(e) => handleChange('grihamLandHoldingStatus', e.target.value)}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* 5. Developed By */}
          <Field label={<span className="font-semibold text-gray-700">DEVELOPED BY</span>}>
            <CustomSelect
              value={fields.grihamDevelopedBy || 'Self'}
              customValue={fields.grihamDevelopedByCustom || ''}
              onChange={(val) => handleChange('grihamDevelopedBy', val)}
              onCustomChange={(val) => handleChange('grihamDevelopedByCustom', val)}
              options={[
                { value: 'Self', label: 'Self' },
                { value: 'Colonizer', label: 'Colonizer' },
                { value: 'Builder', label: 'Builder' },
                { value: 'Authority', label: 'Authority (BDA/CDA/Housing Board)' },
              ]}
              disabled={isReadOnly}
              placeholder="Select developer..."
            />
          </Field>

          {/* 6. Plot Demarcation */}
          <Field label={<span className="font-semibold text-gray-700">PLOT DEMARCATION</span>}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {['Yes', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                  <input
                    type="radio"
                    name="grihamPlotDemarcation"
                    value={opt}
                    checked={(fields.grihamPlotDemarcation || 'Yes') === opt}
                    onChange={(e) => handleChange('grihamPlotDemarcation', e.target.value)}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 7. Construction as per approved/sanctioned plans */}
          <Field label={<span className="font-semibold text-gray-700">CONSTRUCTION AS PER APPROVED PLANS</span>}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {['Yes', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                  <input
                    type="radio"
                    name="grihamConstructionAsPerSanction"
                    value={opt}
                    checked={(fields.grihamConstructionAsPerSanction || 'Yes') === opt}
                    onChange={(e) => handleChange('grihamConstructionAsPerSanction', e.target.value)}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* 8. Details of approved plan with approval no and date */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">APPROVED PLAN DETAILS (NO. & DATE)</span>
                <NaCheckbox
                  checked={!!fields.grihamApprovedPlanDetailsNa}
                  onChange={(checked) => {
                    handleChange('grihamApprovedPlanDetailsNa', checked);
                    handleChange('grihamApprovedPlanDetails', checked ? 'NA' : '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.grihamApprovedPlanDetailsNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
              value={fields.grihamApprovedPlanDetailsNa ? 'NA' : (fields.grihamApprovedPlanDetails || '')}
              onChange={(e) => handleChange('grihamApprovedPlanDetails', e.target.value)}
              disabled={isReadOnly || !!fields.grihamApprovedPlanDetailsNa}
              placeholder="e.g. Plan No. 123/2023 Dt. 12/04/2023"
            />
          </Field>

          {/* 9. Construction permission Number and date */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">CONSTRUCTION PERMISSION (NO. & DATE)</span>
                <NaCheckbox
                  checked={!!fields.grihamConstructionPermissionDetailsNa}
                  onChange={(checked) => {
                    handleChange('grihamConstructionPermissionDetailsNa', checked);
                    handleChange('grihamConstructionPermissionDetails', checked ? 'NA' : '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.grihamConstructionPermissionDetailsNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
              value={fields.grihamConstructionPermissionDetailsNa ? 'NA' : (fields.grihamConstructionPermissionDetails || '')}
              onChange={(e) => handleChange('grihamConstructionPermissionDetails', e.target.value)}
              disabled={isReadOnly || !!fields.grihamConstructionPermissionDetailsNa}
              placeholder="e.g. Permission No. CP-456 Dt. 15/06/2023"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 10. Violations Observed if Any */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">VIOLATIONS OBSERVED IF ANY</span>
                <NaCheckbox
                  checked={!!fields.grihamViolationsObservedNa}
                  onChange={(checked) => {
                    handleChange('grihamViolationsObservedNa', checked);
                    handleChange('grihamViolationsObserved', checked ? 'NA' : '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={2}
              className={`${inputCls} resize-y ${fields.grihamViolationsObservedNa ? 'bg-gray-100 text-gray-500 italic' : ''}`}
              value={fields.grihamViolationsObservedNa ? 'NA' : (fields.grihamViolationsObserved || '')}
              onChange={(e) => handleChange('grihamViolationsObserved', e.target.value)}
              disabled={isReadOnly || !!fields.grihamViolationsObservedNa}
              placeholder="State any deviations / violations observed..."
            />
          </Field>

          {/* 11. If plans not available then is the structure confirming to local byelaws */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">CONFIRMING TO LOCAL BYELAWS?</span>
                <NaCheckbox
                  checked={!!fields.grihamStructureConfirmingByelawsNa}
                  onChange={(checked) => {
                    handleChange('grihamStructureConfirmingByelawsNa', checked);
                    if (checked) {
                      handleChange('grihamStructureConfirmingByelaws', 'NA');
                    } else {
                      handleChange('grihamStructureConfirmingByelaws', 'Yes');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.grihamStructureConfirmingByelawsNa ? (
              <div className="py-2.5 px-3 bg-gray-100 rounded-lg text-xs italic text-gray-500 font-medium border border-gray-200">
                Marked as Not Applicable (NA)
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                    <input
                      type="radio"
                      name="grihamStructureConfirmingByelaws"
                      value={opt}
                      checked={(fields.grihamStructureConfirmingByelaws || 'Yes') === opt}
                      onChange={(e) => handleChange('grihamStructureConfirmingByelaws', e.target.value)}
                      disabled={isReadOnly || !!fields.grihamStructureConfirmingByelawsNa}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </Field>

          {/* 12. Property Identifiable */}
          <Field label={<span className="font-semibold text-gray-700">PROPERTY IDENTIFIABLE</span>}>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {['Yes', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 select-none">
                  <input
                    type="radio"
                    name="grihamPropertyIdentifiable"
                    value={opt}
                    checked={(fields.grihamPropertyIdentifiable || 'Yes') === opt}
                    onChange={(e) => handleChange('grihamPropertyIdentifiable', e.target.value)}
                    disabled={isReadOnly}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 7: Functional and Infrastructure Aspects ───────────────────────

const AMENITIES_OPTIONS = [
  'Lift',
  'Swimming pool',
  'Club House',
  'Park',
  'None',
];

function InfrastructureAspectsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const selectedAmenities: string[] = Array.isArray(fields.grihamAmenitiesAvailable)
    ? fields.grihamAmenitiesAvailable
    : typeof fields.grihamAmenitiesAvailable === 'string' && fields.grihamAmenitiesAvailable
    ? fields.grihamAmenitiesAvailable.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const toggleAmenity = (amenity: string) => {
    if (amenity === 'None') {
      if (selectedAmenities.includes('None')) {
        handleChange('grihamAmenitiesAvailable', []);
      } else {
        handleChange('grihamAmenitiesAvailable', ['None']);
      }
      return;
    }

    const withoutNone = selectedAmenities.filter((a) => a !== 'None');
    const idx = withoutNone.indexOf(amenity);
    if (idx > -1) {
      withoutNone.splice(idx, 1);
    } else {
      withoutNone.push(amenity);
    }
    handleChange('grihamAmenitiesAvailable', withoutNone);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Functional and Infrastructure Aspects (Light Orange #fff3e0) */}
      <div
        className="rounded-xl p-5 space-y-6 border border-orange-200 shadow-sm"
        style={{ backgroundColor: '#fff3e0' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            FUNCTIONAL AND INFRASTRUCTURE ASPECTS OF THE PROPERTY
          </h3>
          <span className="text-xs text-orange-950 font-medium bg-orange-100 px-2.5 py-1 rounded-md border border-orange-200">
            Connectivity & Amenities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Nearest Railway Station */}
          <Field label={<span className="font-semibold text-gray-700">NEAREST RAILWAY STATION</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamNearestRailwayStation ?? (fields.railwayStation ?? '')}
              onChange={(e) => handleChange('grihamNearestRailwayStation', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Bhubaneswar Railway Station"
            />
          </Field>

          {/* 2. Nearest Bus Stop */}
          <Field label={<span className="font-semibold text-gray-700">NEAREST BUS STOP</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamNearestBusStop ?? (fields.busStop ?? '')}
              onChange={(e) => handleChange('grihamNearestBusStop', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Baramunda Bus Stand"
            />
          </Field>

          {/* 3. Distance from Property in KM */}
          <Field label={<span className="font-semibold text-gray-700">DISTANCE FROM PROPERTY IN KM</span>}>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                className={`${inputCls} pr-12`}
                value={fields.grihamDistanceRailwayBusKm ?? ''}
                onChange={(e) => handleChange('grihamDistanceRailwayBusKm', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 3.5"
              />
              <span className="absolute right-3 top-2.5 text-xs text-orange-900 font-semibold pointer-events-none">
                KM
              </span>
            </div>
          </Field>
        </div>

        {/* 4. Amenities available */}
        <div className="space-y-2.5">
          <span className="font-semibold text-xs sm:text-sm text-gray-700 uppercase tracking-wide">
            AMENITIES AVAILABLE
          </span>
          <div className="p-3.5 bg-white/90 rounded-lg border border-orange-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {AMENITIES_OPTIONS.map((amenity) => {
                const checked = selectedAmenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer select-none transition-all ${
                      checked
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-semibold shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    } ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(amenity)}
                      disabled={isReadOnly}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: Socio-Cultural Aspects of the Property ──────────────────────

function SocioCulturalSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Socio-Cultural Aspects (Light Pink #fce4ec) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-pink-200 shadow-sm"
        style={{ backgroundColor: '#fce4ec' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            SOCIO-CULTURAL ASPECTS OF THE PROPERTY
          </h3>
          <span className="text-xs text-pink-950 font-medium bg-pink-100 px-2.5 py-1 rounded-md border border-pink-200">
            Neighborhood & Community Profile
          </span>
        </div>

        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">SOCIO-CULTURAL OBSERVATIONS</span>
              <NaCheckbox
                checked={!!fields.grihamSocioCulturalObservationsNa}
                onChange={(checked) => {
                  handleChange('grihamSocioCulturalObservationsNa', checked);
                  handleChange('grihamSocioCulturalObservations', checked ? 'NA' : '');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <textarea
            rows={4}
            className={`${inputCls} resize-y ${
              fields.grihamSocioCulturalObservationsNa ? 'bg-gray-100 text-gray-500 italic' : 'bg-white'
            }`}
            value={
              fields.grihamSocioCulturalObservationsNa
                ? 'NA'
                : (fields.grihamSocioCulturalObservations || '')
            }
            onChange={(e) => handleChange('grihamSocioCulturalObservations', e.target.value)}
            disabled={isReadOnly || !!fields.grihamSocioCulturalObservationsNa}
            placeholder={
              fields.grihamSocioCulturalObservationsNa
                ? 'NA'
                : 'Describe neighborhood profile, community demographics, socio-economic habits, surroundings, and general living conditions...'
            }
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Griham Housing Finance BankConfig ──────────────────────────────────────

export const GRIHAM_HOUSING_CONFIG: BankConfig = {
  bankId: 'GRIHAM HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'Griham Housing Finance',
  hiddenSections: [
    'section-1',
    'section-1a',
    'section-2',
    'section-3',
    'section-4',
    'section-5',
    'section-6',
    'section-7',
    'section-7b',
    'section-7c',
    'section-8',
    'section-9',
    'section-10',
    'layout-config',
    'annexures',
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  hideDefaultDeclarationAndCertificate: true,
  navSections: [
    { id: 'griham-section-1', title: 'OBJECTIVE' },
    { id: 'griham-section-2', title: 'SCOPE OF ENQUIRIES AND INVESTIGATION' },
    { id: 'griham-section-3', title: 'BASIS OF VALUATION' },
    { id: 'griham-section-4', title: 'BRIEF DESCRIPTION OF THE PROPERTY' },
    { id: 'griham-section-5', title: 'TOWN PLANNING PARAMETERS' },
    { id: 'griham-section-6', title: 'DOCUMENT DETAILS AND LEGAL ASPECTS OF THE PROPERTY' },
    { id: 'griham-section-7', title: 'FUNCTIONAL AND INFRASTRUCTURE ASPECTS OF THE PROPERTY' },
    { id: 'griham-section-8', title: 'SOCIO-CULTURAL ASPECTS OF THE PROPERTY' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-12', title: 'Maps' },
    { id: 'section-11', title: 'Property Photographs' },
  ],
  fieldLabels: {
    'documents-title': 'DOCUMENTS',
    'section-documents-title': 'DOCUMENTS',
    'section-12-title': 'MAPS',
    'section-11-title': 'PROPERTY PHOTOGRAPHS',
  },
  defaultValues: {
    purpose: 'Housing Loan / Mortgage',
    // Section 1
    grihamValuationAgency: DEFAULT_VALUATION_AGENCY,
    grihamValuationAgencyEditOn: false,
    grihamDateOfValuation: '',
    grihamDateOfValuationEditOn: false,
    grihamSourcingBranch: 'Bhubaneswar',
    grihamSourcingBranchCustom: '',
    grihamDistanceSourcingBranch: '',
    grihamProposalNo: '',
    grihamCaseType: 'LAP',
    grihamCaseTypeCustom: '',
    // Section 2
    grihamDateOfInspection: '',
    grihamPersonMetAtSite: '',
    grihamPersonMetAtSiteNa: false,
    grihamIdentifiedThrough: 'Legal docs',
    grihamIdentifiedThroughCustom: '',
    grihamDateOfReportSubmission: '',
    grihamDateOfReportSubmissionEditOn: false,
    grihamAuthorizedSignatory: DEFAULT_SIGNATORY,
    grihamAuthorizedSignatoryEditOn: false,
    grihamEngineerVisited: '',
    // Section 4
    grihamCustomerName: '',
    grihamCoApplicantName: '',
    grihamCoApplicantNa: false,
    grihamAddressAsPerTrf: '',
    grihamAddressActualSite: '',
    grihamAddressActualSiteEditOn: false,
    grihamPropertyType: 'Flat',
    grihamPropertyTypeCustom: '',
    grihamAreaClassification: 'Urban',
    grihamLocationZoning: 'Resi',
    grihamLocationZoningCustom: '',
    grihamPropertyUsage: 'Resi',
    grihamPropertyUsageCustom: '',
    grihamOccupationStatus: 'Self',
    grihamOccupationStatusCustom: '',
    grihamNoOfTenants: '0',
    grihamNoOfTenantsNa: false,
    // Section 5
    grihamBoundaryNorthDocs: '',
    grihamBoundarySouthDocs: '',
    grihamBoundaryEastDocs: '',
    grihamBoundaryWestDocs: '',
    grihamBoundariesActualEditOn: false,
    grihamBoundaryNorthActual: '',
    grihamBoundarySouthActual: '',
    grihamBoundaryEastActual: '',
    grihamBoundaryWestActual: '',
    grihamBoundariesMatching: 'Yes',
    grihamBoundariesMismatchReason: '',
    grihamBoundariesMismatchReasonNa: false,
    grihamSetbackSanctionedNa: false,
    grihamSetbackFrontSanctioned: '',
    grihamSetbackRearSanctioned: '',
    grihamSetbackLeftSanctioned: '',
    grihamSetbackRightSanctioned: '',
    grihamSetbackActualEditOn: false,
    grihamSetbackFrontActual: '',
    grihamSetbackRearActual: '',
    grihamSetbackLeftActual: '',
    grihamSetbackRightActual: '',
    grihamStoriesSanctioned: '',
    grihamStoriesSanctionedNa: false,
    grihamStoriesActual: '',
    grihamStoriesActualEditOn: false,
    // Section 6
    grihamCurrentOwnerSeller: '',
    grihamAddressAsPerDocument: '',
    grihamAddressAsPerDocumentEditOn: false,
    grihamDocsProvided: ['Sale Deed', 'ROR (Record of Rights / Patta)', 'Tax Receipt'],
    grihamLandHoldingStatus: 'Freehold',
    grihamDevelopedBy: 'Self',
    grihamDevelopedByCustom: '',
    grihamPlotDemarcation: 'Yes',
    grihamConstructionAsPerSanction: 'Yes',
    grihamApprovedPlanDetails: '',
    grihamApprovedPlanDetailsNa: false,
    grihamConstructionPermissionDetails: '',
    grihamConstructionPermissionDetailsNa: false,
    grihamViolationsObserved: '',
    grihamViolationsObservedNa: true,
    grihamStructureConfirmingByelaws: 'Yes',
    grihamStructureConfirmingByelawsNa: false,
    grihamPropertyIdentifiable: 'Yes',
    // Section 7
    grihamNearestRailwayStation: '',
    grihamNearestBusStop: '',
    grihamDistanceRailwayBusKm: '',
    grihamAmenitiesAvailable: ['Lift'],
    // Section 8
    grihamSocioCulturalObservations: '',
    grihamSocioCulturalObservationsNa: false,
  },
  extraSectionsStart: [
    {
      id: 'griham-section-1',
      title: 'OBJECTIVE',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <ObjectiveSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'griham-section-2',
      title: 'SCOPE OF ENQUIRIES AND INVESTIGATION',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ScopeOfEnquiriesSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-3',
      title: 'BASIS OF VALUATION',
      number: 3,
      defaultOpen: true,
      render: () => <BasisOfValuationSection />,
    },
    {
      id: 'griham-section-4',
      title: 'BRIEF DESCRIPTION OF THE PROPERTY',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <BriefDescriptionSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-5',
      title: 'TOWN PLANNING PARAMETERS',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <TownPlanningSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-6',
      title: 'DOCUMENT DETAILS AND LEGAL ASPECTS OF THE PROPERTY',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <LegalAspectsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-7',
      title: 'FUNCTIONAL AND INFRASTRUCTURE ASPECTS OF THE PROPERTY',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <InfrastructureAspectsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-8',
      title: 'SOCIO-CULTURAL ASPECTS OF THE PROPERTY',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <SocioCulturalSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ],
};

export default function GrihamHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GRIHAM_HOUSING_CONFIG} {...props} />;
}
