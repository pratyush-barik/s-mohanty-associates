'use client';

import React, { useMemo } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Scale, ShieldCheck, FileText, Plus, Trash2, IndianRupee } from 'lucide-react';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

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

// ─── Section 9: Environmental Factors Affecting the Property ────────────────

function EnvironmentalFactorsSection({
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
      {/* Container: Environmental Factors (Light Teal #e0f2f1) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-teal-200 shadow-sm"
        style={{ backgroundColor: '#e0f2f1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            ENVIRONMENTAL FACTORS AFFECTING THE PROPERTY
          </h3>
          <span className="text-xs text-teal-950 font-medium bg-teal-100 px-2.5 py-1 rounded-md border border-teal-200">
            Environmental & Hazard Assessment
          </span>
        </div>

        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">ENVIRONMENTAL OBSERVATIONS</span>
              <NaCheckbox
                checked={!!fields.grihamEnvironmentalObservationsNa}
                onChange={(checked) => {
                  handleChange('grihamEnvironmentalObservationsNa', checked);
                  handleChange('grihamEnvironmentalObservations', checked ? 'NA' : '');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <textarea
            rows={4}
            className={`${inputCls} resize-y ${
              fields.grihamEnvironmentalObservationsNa ? 'bg-gray-100 text-gray-500 italic' : 'bg-white'
            }`}
            value={
              fields.grihamEnvironmentalObservationsNa
                ? 'NA'
                : (fields.grihamEnvironmentalObservations || '')
            }
            onChange={(e) => handleChange('grihamEnvironmentalObservations', e.target.value)}
            disabled={isReadOnly || !!fields.grihamEnvironmentalObservationsNa}
            placeholder={
              fields.grihamEnvironmentalObservationsNa
                ? 'NA'
                : 'Describe environmental factors such as flood proneness, water logging, proximity to water bodies / nullahs, high tension electricity lines, seismic zone risk, natural drainage, etc...'
            }
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Section 10: Marketability of the Property ──────────────────────────────

function MarketabilitySection({
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
      {/* Container: Marketability of the Property (Light Indigo #e8eaf6) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-indigo-200 shadow-sm"
        style={{ backgroundColor: '#e8eaf6' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            MARKETABILITY OF THE PROPERTY
          </h3>
          <span className="text-xs text-indigo-950 font-medium bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200">
            Commercial Demand & Locality Rating
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Locality Class */}
          <Field label={<span className="font-semibold text-gray-700">LOCALITY CLASS</span>}>
            <CustomSelect
              value={fields.grihamLocalityClass || 'Middle class'}
              customValue={fields.grihamLocalityClassCustom || ''}
              onChange={(val) => handleChange('grihamLocalityClass', val)}
              onCustomChange={(val) => handleChange('grihamLocalityClassCustom', val)}
              options={[
                { value: 'Posh', label: 'Posh' },
                { value: 'Upper class', label: 'Upper class' },
                { value: 'Middle class', label: 'Middle class' },
                { value: 'Lower class', label: 'Lower class' },
              ]}
              disabled={isReadOnly}
              placeholder="Select locality classification..."
            />
          </Field>

          {/* 2. Marketability */}
          <Field label={<span className="font-semibold text-gray-700">MARKETABILITY</span>}>
            <CustomSelect
              value={fields.grihamMarketability || 'Standard'}
              customValue={fields.grihamMarketabilityCustom || ''}
              onChange={(val) => handleChange('grihamMarketability', val)}
              onCustomChange={(val) => handleChange('grihamMarketabilityCustom', val)}
              options={[
                { value: 'Superior', label: 'Superior' },
                { value: 'Standard', label: 'Standard' },
                { value: 'Economy', label: 'Economy' },
                { value: 'Unclassified', label: 'Unclassified' },
              ]}
              disabled={isReadOnly}
              placeholder="Select marketability rating..."
            />
          </Field>
        </div>

        {/* 3. Neighbour feedback */}
        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">NEIGHBOUR FEEDBACK</span>
              <NaCheckbox
                checked={!!fields.grihamNeighbourFeedbackNa}
                onChange={(checked) => {
                  handleChange('grihamNeighbourFeedbackNa', checked);
                  handleChange('grihamNeighbourFeedback', checked ? 'NA' : '');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <textarea
            rows={3}
            className={`${inputCls} resize-y ${
              fields.grihamNeighbourFeedbackNa ? 'bg-gray-100 text-gray-500 italic' : 'bg-white'
            }`}
            value={
              fields.grihamNeighbourFeedbackNa
                ? 'NA'
                : (fields.grihamNeighbourFeedback || '')
            }
            onChange={(e) => handleChange('grihamNeighbourFeedback', e.target.value)}
            disabled={isReadOnly || !!fields.grihamNeighbourFeedbackNa}
            placeholder={
              fields.grihamNeighbourFeedbackNa
                ? 'NA'
                : 'Details of independent inquiries, verification of ownership with neighbours, feedback regarding peaceful possession...'
            }
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Section 11: Architectural Aspects of the Property ──────────────────────

interface BuiltUpAreaRow {
  id: string;
  floor: string;
  floorCustom?: string;
  accommodation: string;
  carpetArea: string;
  actualBua: string;
  permissibleBua: string;
  adoptedBua: string;
  adoptedBuaEditOn?: boolean;
}

const FLOOR_OPTIONS = [
  { value: 'Ground Floor', label: 'Ground Floor' },
  { value: 'First Floor', label: 'First Floor' },
  { value: 'Second Floor', label: 'Second Floor' },
  { value: 'Third Floor', label: 'Third Floor' },
  { value: 'Fourth Floor', label: 'Fourth Floor' },
  { value: 'Basement', label: 'Basement' },
  { value: 'Stilt Floor', label: 'Stilt Floor' },
  { value: 'Mezzanine Floor', label: 'Mezzanine Floor' },
  { value: 'Terrace', label: 'Terrace' },
];

function ArchitecturalAspectsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const rows: BuiltUpAreaRow[] =
    Array.isArray(fields.grihamBuiltUpAreaRows) && fields.grihamBuiltUpAreaRows.length > 0
      ? fields.grihamBuiltUpAreaRows
      : [
          {
            id: '1',
            floor: 'Ground Floor',
            floorCustom: '',
            accommodation: '2 BHK (Hall, 2 Bedrooms, Kitchen, Toilet)',
            carpetArea: '',
            actualBua: '',
            permissibleBua: '',
            adoptedBua: '',
            adoptedBuaEditOn: false,
          },
        ];

  const updateRow = (id: string, updates: Partial<BuiltUpAreaRow>) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...updates } : r));
    handleChange('grihamBuiltUpAreaRows', next);
  };

  const addRow = () => {
    const newRow: BuiltUpAreaRow = {
      id: String(Date.now()),
      floor: 'First Floor',
      floorCustom: '',
      accommodation: '',
      carpetArea: '',
      actualBua: '',
      permissibleBua: '',
      adoptedBua: '',
      adoptedBuaEditOn: false,
    };
    handleChange('grihamBuiltUpAreaRows', [...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    handleChange('grihamBuiltUpAreaRows', rows.filter((r) => r.id !== id));
  };

  // Compute Totals
  const totals = useMemo(() => {
    let carpet = 0;
    let actual = 0;
    let perm = 0;
    let adopted = 0;

    rows.forEach((r) => {
      const c = parseFloat(r.carpetArea) || 0;
      const a = parseFloat(r.actualBua) || 0;
      const p = parseFloat(r.permissibleBua) || 0;
      carpet += c;
      actual += a;
      perm += p;

      let autoA = 0;
      if (a > 0 && p > 0) autoA = Math.min(a, p);
      else if (a > 0) autoA = a;
      else if (p > 0) autoA = p;

      const rowAdopted = r.adoptedBuaEditOn ? (parseFloat(r.adoptedBua) || 0) : autoA;
      adopted += rowAdopted;
    });

    return { carpet, actual, perm, adopted };
  }, [rows]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Architectural Aspects (Light Amber #fff8e1) */}
      <div
        className="rounded-xl p-5 space-y-6 border border-amber-200 shadow-sm"
        style={{ backgroundColor: '#fff8e1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            ARCHITECTURAL ASPECTS OF THE PROPERTY
          </h3>
          <span className="text-xs text-amber-950 font-medium bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
            Floor-Wise Areas & Sanitary Facilities
          </span>
        </div>

        {/* 1. Built Up Area Details Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
              Built Up Area Details Table (in Sq.ft)
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Floor Row
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-amber-100/70 border-b border-amber-200 text-amber-950 font-bold">
                  <th className="p-3 w-40">Floor</th>
                  <th className="p-3 w-56">Accommodation</th>
                  <th className="p-3 w-32">Actual Carpet Area</th>
                  <th className="p-3 w-32">Actual BUA</th>
                  <th className="p-3 w-32">Permissible BUA</th>
                  <th className="p-3 w-52">
                    <div className="flex flex-col">
                      <span>Adopted BUA / SBUA</span>
                      <span className="text-[10px] font-normal text-amber-800">
                        Auto: MIN(Actual, Permissible)
                      </span>
                    </div>
                  </th>
                  {!isReadOnly && <th className="p-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {rows.map((row, idx) => {
                  const actualVal = parseFloat(row.actualBua) || 0;
                  const permVal = parseFloat(row.permissibleBua) || 0;
                  let autoVal = 0;
                  if (actualVal > 0 && permVal > 0) autoVal = Math.min(actualVal, permVal);
                  else if (actualVal > 0) autoVal = actualVal;
                  else if (permVal > 0) autoVal = permVal;

                  const effectiveAdopted = row.adoptedBuaEditOn
                    ? (row.adoptedBua ?? '')
                    : (autoVal > 0 ? String(autoVal) : (row.adoptedBua || ''));

                  return (
                    <tr key={row.id || idx} className="hover:bg-amber-50/30">
                      {/* Floor */}
                      <td className="p-2">
                        <CustomSelect
                          value={row.floor || 'Ground Floor'}
                          customValue={row.floorCustom || ''}
                          onChange={(val) => updateRow(row.id, { floor: val })}
                          onCustomChange={(val) => updateRow(row.id, { floorCustom: val })}
                          options={FLOOR_OPTIONS}
                          disabled={isReadOnly}
                          placeholder="Select floor..."
                        />
                      </td>

                      {/* Accommodation */}
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.accommodation || ''}
                          onChange={(e) => updateRow(row.id, { accommodation: e.target.value })}
                          disabled={isReadOnly}
                          placeholder="e.g. 2 BHK, Hall, Kitchen..."
                        />
                      </td>

                      {/* Actual Carpet Area */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className={inputCls}
                          value={row.carpetArea || ''}
                          onChange={(e) => updateRow(row.id, { carpetArea: e.target.value })}
                          disabled={isReadOnly}
                          placeholder="Sq.ft"
                        />
                      </td>

                      {/* Actual BUA */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className={inputCls}
                          value={row.actualBua || ''}
                          onChange={(e) => {
                            const newActual = e.target.value;
                            updateRow(row.id, {
                              actualBua: newActual,
                              ...(!row.adoptedBuaEditOn
                                ? {
                                    adoptedBua:
                                      parseFloat(newActual) > 0 && parseFloat(row.permissibleBua) > 0
                                        ? String(Math.min(parseFloat(newActual), parseFloat(row.permissibleBua)))
                                        : newActual || row.permissibleBua || '',
                                  }
                                : {}),
                            });
                          }}
                          disabled={isReadOnly}
                          placeholder="Sq.ft"
                        />
                      </td>

                      {/* Permissible BUA */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className={inputCls}
                          value={row.permissibleBua || ''}
                          onChange={(e) => {
                            const newPerm = e.target.value;
                            updateRow(row.id, {
                              permissibleBua: newPerm,
                              ...(!row.adoptedBuaEditOn
                                ? {
                                    adoptedBua:
                                      parseFloat(row.actualBua) > 0 && parseFloat(newPerm) > 0
                                        ? String(Math.min(parseFloat(row.actualBua), parseFloat(newPerm)))
                                        : row.actualBua || newPerm || '',
                                  }
                                : {}),
                            });
                          }}
                          disabled={isReadOnly}
                          placeholder="Sq.ft"
                        />
                      </td>

                      {/* Adopted BUA / SBUA with EditSwitch */}
                      <td className="p-2">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              Override
                            </span>
                            <EditSwitch
                              checked={!!row.adoptedBuaEditOn}
                              onChange={(checked) => {
                                updateRow(row.id, {
                                  adoptedBuaEditOn: checked,
                                  adoptedBua: checked ? effectiveAdopted : (autoVal > 0 ? String(autoVal) : ''),
                                });
                              }}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className={`${inputCls} font-medium ${
                                !row.adoptedBuaEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                              }`}
                              value={effectiveAdopted}
                              onChange={(e) => updateRow(row.id, { adoptedBua: e.target.value })}
                              disabled={isReadOnly || !row.adoptedBuaEditOn}
                              placeholder="Adopted Sq.ft"
                            />
                            {!row.adoptedBuaEditOn && (
                              <div className="absolute right-2 top-2 text-[10px] text-amber-900 font-semibold pointer-events-none flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> MIN
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Delete action */}
                      {!isReadOnly && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length <= 1}
                            className={`p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors ${
                              rows.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title="Remove floor row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-amber-100/80 border-t-2 border-amber-300 font-bold text-amber-950">
                  <td colSpan={2} className="p-3 uppercase">
                    Total Area:
                  </td>
                  <td className="p-3">{totals.carpet > 0 ? totals.carpet.toFixed(2) : '—'}</td>
                  <td className="p-3">{totals.actual > 0 ? totals.actual.toFixed(2) : '—'}</td>
                  <td className="p-3">{totals.perm > 0 ? totals.perm.toFixed(2) : '—'}</td>
                  <td className="p-3">{totals.adopted > 0 ? totals.adopted.toFixed(2) : '—'}</td>
                  {!isReadOnly && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 2. Whether toilet built in house / outside... */}
        <div className="max-w-md pt-1">
          <Field label={<span className="font-semibold text-gray-700">WHETHER TOILET BUILT IN HOUSE / OUTSIDE</span>}>
            <CustomSelect
              value={fields.grihamToiletLocation || 'Inside house'}
              customValue={fields.grihamToiletLocationCustom || ''}
              onChange={(val) => handleChange('grihamToiletLocation', val)}
              onCustomChange={(val) => handleChange('grihamToiletLocationCustom', val)}
              options={[
                { value: 'Inside house', label: 'Inside house (Attached)' },
                { value: 'Outside house', label: 'Outside house' },
                { value: 'Both inside & outside', label: 'Both inside & outside' },
                { value: 'Common toilet on floor', label: 'Common toilet on floor' },
                { value: 'Attached & Common Toilets', label: 'Attached & Common Toilets' },
              ]}
              disabled={isReadOnly}
              placeholder="Select toilet arrangement..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 12: Engineering Aspects of the Property ────────────────────────

export interface SlabConstructionRow {
  id: string;
  stage: string;
  allottedPct: string;
  presentCompletionPct: string;
}

export const DEFAULT_SLAB_CONSTRUCTION_ROWS: SlabConstructionRow[] = [
  { id: '1', stage: 'Plinth Level / Foundation', allottedPct: '15', presentCompletionPct: '15' },
  { id: '2', stage: 'Ground Floor Slab', allottedPct: '20', presentCompletionPct: '20' },
  { id: '3', stage: 'First Floor Slab', allottedPct: '20', presentCompletionPct: '20' },
  { id: '4', stage: 'Brickwork & Internal Plaster', allottedPct: '15', presentCompletionPct: '15' },
  { id: '5', stage: 'Flooring, Plumbing & Electrical', allottedPct: '15', presentCompletionPct: '15' },
  { id: '6', stage: 'Finishing & Painting', allottedPct: '15', presentCompletionPct: '15' },
];

export function EngineeringAspectsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const currentYear = new Date().getFullYear();

  // Year of completion calculation
  const compYear = parseInt(fields.grihamYearOfCompletion, 10);
  const autoAge = !isNaN(compYear) && compYear >= 1800 && compYear <= currentYear + 10
    ? Math.max(0, currentYear - compYear)
    : '';

  const effectiveAge = fields.grihamPresentAgeEditOn
    ? (fields.grihamPresentAge ?? '')
    : (autoAge !== '' ? String(autoAge) : (fields.grihamPresentAge || ''));

  // Future physical life calculation: Standard Life Span (60) - Present Age
  const ageNum = parseFloat(effectiveAge);
  const autoFutureLife = !isNaN(ageNum) && ageNum >= 0 ? Math.max(0, 60 - ageNum) : '';

  const effectiveFutureLife = fields.grihamFuturePhysicalLifeEditOn
    ? (fields.grihamFuturePhysicalLife ?? '')
    : (autoFutureLife !== '' ? String(autoFutureLife) : (fields.grihamFuturePhysicalLife || ''));

  // Slab wise construction table rows
  const rows: SlabConstructionRow[] = useMemo(() => {
    if (Array.isArray(fields.grihamSlabConstructionRows) && fields.grihamSlabConstructionRows.length > 0) {
      return fields.grihamSlabConstructionRows;
    }
    return DEFAULT_SLAB_CONSTRUCTION_ROWS;
  }, [fields.grihamSlabConstructionRows]);

  const updateRows = (newRows: SlabConstructionRow[]) => {
    handleChange('grihamSlabConstructionRows', newRows);
  };

  const addRow = () => {
    const newId = String(Date.now());
    const newRow: SlabConstructionRow = {
      id: newId,
      stage: `Stage / Slab ${rows.length + 1}`,
      allottedPct: '0',
      presentCompletionPct: '0',
    };
    updateRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    updateRows(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<SlabConstructionRow>) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    updateRows(updated);
  };

  // Auto-calculated sum of all Present Completion rows
  const totals = useMemo(() => {
    let allotted = 0;
    let present = 0;
    rows.forEach((r) => {
      allotted += parseFloat(r.allottedPct) || 0;
      present += parseFloat(r.presentCompletionPct) || 0;
    });
    return {
      allotted: Math.round(allotted * 100) / 100,
      present: Math.round(present * 100) / 100,
    };
  }, [rows]);

  const effectiveTotalCompletion = fields.grihamTotalPresentCompletionEditOn
    ? (fields.grihamTotalPresentCompletionPct ?? '')
    : (totals.present > 0 ? String(totals.present) : (fields.grihamTotalPresentCompletionPct || ''));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Engineering Aspects (Light Red #ffebee) */}
      <div
        className="rounded-xl p-5 space-y-6 border border-red-200 shadow-sm"
        style={{ backgroundColor: '#ffebee' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            ENGINEERING ASPECTS OF THE PROPERTY
          </h3>
          <span className="text-xs text-red-950 font-medium bg-red-100 px-2.5 py-1 rounded-md border border-red-200">
            Structure, Age, NDMA Parameters & Construction Status
          </span>
        </div>

        {/* 1. General Engineering Aspects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* No. of Floors / Total No. of Flats */}
          <Field label={<span className="font-semibold text-gray-700">NO. OF FLOORS / TOTAL NO. OF FLATS</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.grihamNoOfFloorsFlats || ''}
              onChange={(e) => handleChange('grihamNoOfFloorsFlats', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. G+3 Floors / 8 Flats"
            />
          </Field>

          {/* Year of Completion of Property */}
          <Field label={<span className="font-semibold text-gray-700">YEAR OF COMPLETION OF PROPERTY</span>}>
            <input
              type="number"
              min="1900"
              max="2100"
              className={inputCls}
              value={fields.grihamYearOfCompletion || ''}
              onChange={(e) => {
                const val = e.target.value;
                handleChange('grihamYearOfCompletion', val);
                const yr = parseInt(val, 10);
                if (!fields.grihamPresentAgeEditOn) {
                  if (!isNaN(yr) && yr >= 1800 && yr <= currentYear + 10) {
                    const newAge = Math.max(0, currentYear - yr);
                    handleChange('grihamPresentAge', String(newAge));
                    if (!fields.grihamFuturePhysicalLifeEditOn) {
                      handleChange('grihamFuturePhysicalLife', String(Math.max(0, 60 - newAge)));
                    }
                  } else {
                    handleChange('grihamPresentAge', '');
                    if (!fields.grihamFuturePhysicalLifeEditOn) {
                      handleChange('grihamFuturePhysicalLife', '');
                    }
                  }
                }
              }}
              disabled={isReadOnly}
              placeholder="Numeric (YYYY)"
            />
          </Field>

          {/* Present Age of the Property */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">PRESENT AGE OF PROPERTY (YRS)</span>
                <EditSwitch
                  checked={!!fields.grihamPresentAgeEditOn}
                  onChange={(checked) => {
                    handleChange('grihamPresentAgeEditOn', checked);
                    if (checked) {
                      handleChange('grihamPresentAge', effectiveAge);
                    } else if (autoAge !== '') {
                      handleChange('grihamPresentAge', String(autoAge));
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                className={`${inputCls} font-medium ${
                  !fields.grihamPresentAgeEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveAge}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('grihamPresentAge', val);
                  if (!fields.grihamFuturePhysicalLifeEditOn) {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) {
                      handleChange('grihamFuturePhysicalLife', String(Math.max(0, 60 - num)));
                    }
                  }
                }}
                disabled={isReadOnly || !fields.grihamPresentAgeEditOn}
                placeholder="Age in Years"
              />
              {!fields.grihamPresentAgeEditOn && (
                <div className="absolute right-2 top-2 text-[10px] text-red-900 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Auto: {currentYear} - Year
                </div>
              )}
            </div>
          </Field>

          {/* Future Physical Life of Property */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">FUTURE PHYSICAL LIFE (YRS)</span>
                <EditSwitch
                  checked={!!fields.grihamFuturePhysicalLifeEditOn}
                  onChange={(checked) => {
                    handleChange('grihamFuturePhysicalLifeEditOn', checked);
                    if (checked) {
                      handleChange('grihamFuturePhysicalLife', effectiveFutureLife);
                    } else if (autoFutureLife !== '') {
                      handleChange('grihamFuturePhysicalLife', String(autoFutureLife));
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                className={`${inputCls} font-medium ${
                  !fields.grihamFuturePhysicalLifeEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                }`}
                value={effectiveFutureLife}
                onChange={(e) => handleChange('grihamFuturePhysicalLife', e.target.value)}
                disabled={isReadOnly || !fields.grihamFuturePhysicalLifeEditOn}
                placeholder="Residual Life (Years)"
              />
              {!fields.grihamFuturePhysicalLifeEditOn && (
                <div className="absolute right-2 top-2 text-[10px] text-red-900 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Auto: 60 - Age
                </div>
              )}
            </div>
          </Field>

          {/* Condition of the Property */}
          <Field label={<span className="font-semibold text-gray-700">CONDITION OF THE PROPERTY</span>}>
            <CustomSelect
              value={fields.grihamConditionOfProperty || 'Good'}
              customValue={fields.grihamConditionOfPropertyCustom || ''}
              onChange={(val) => handleChange('grihamConditionOfProperty', val)}
              onCustomChange={(val) => handleChange('grihamConditionOfPropertyCustom', val)}
              options={[
                { value: 'Excellent', label: 'Excellent' },
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
                { value: 'Under Construction', label: 'Under Construction' },
              ]}
              disabled={isReadOnly}
              placeholder="Select condition..."
            />
          </Field>

          {/* Type of Structure */}
          <Field label={<span className="font-semibold text-gray-700">TYPE OF STRUCTURE</span>}>
            <CustomSelect
              value={fields.grihamTypeOfStructure || 'RCC'}
              customValue={fields.grihamTypeOfStructureCustom || ''}
              onChange={(val) => handleChange('grihamTypeOfStructure', val)}
              onCustomChange={(val) => handleChange('grihamTypeOfStructureCustom', val)}
              options={[
                { value: 'RCC', label: 'RCC (Reinforced Cement Concrete)' },
                { value: 'LB', label: 'LB (Load Bearing Structure)' },
                { value: 'Truss roof', label: 'Truss roof (Steel / Timber)' },
                { value: 'Steel Framed', label: 'Steel Framed Structure' },
              ]}
              disabled={isReadOnly}
              placeholder="Select structure type..."
            />
          </Field>
        </div>

        {/* 2. NDMA PARAMETERS */}
        <div className="bg-white/90 rounded-xl p-5 border border-red-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
                NDMA PARAMETERS
              </span>
              <span className="text-[10px] text-red-900 font-semibold bg-red-100 px-2 py-0.5 rounded">
                Disaster Management & Structural Guidelines
              </span>
            </div>
            <span className="text-xs text-gray-500 italic">
              National Disaster Management Authority Parameters
            </span>
          </div>

          {/* Dropdowns (+Custom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nature of Building */}
            <Field label={<span className="text-xs font-semibold text-gray-700">NATURE OF BUILDING</span>}>
              <CustomSelect
                value={fields.grihamNdmaNatureOfBuilding || 'Residential'}
                customValue={fields.grihamNdmaNatureOfBuildingCustom || ''}
                onChange={(val) => handleChange('grihamNdmaNatureOfBuilding', val)}
                onCustomChange={(val) => handleChange('grihamNdmaNatureOfBuildingCustom', val)}
                options={[
                  { value: 'Residential', label: 'Residential' },
                  { value: 'Commercial', label: 'Commercial' },
                  { value: 'Industrial', label: 'Industrial' },
                  { value: 'Institutional', label: 'Institutional' },
                  { value: 'Mixed Use', label: 'Mixed Use' },
                ]}
                disabled={isReadOnly}
                placeholder="Select nature..."
              />
            </Field>

            {/* Structure Type */}
            <Field label={<span className="text-xs font-semibold text-gray-700">STRUCTURE TYPE</span>}>
              <CustomSelect
                value={fields.grihamNdmaStructureType || 'RCC Framed'}
                customValue={fields.grihamNdmaStructureTypeCustom || ''}
                onChange={(val) => handleChange('grihamNdmaStructureType', val)}
                onCustomChange={(val) => handleChange('grihamNdmaStructureTypeCustom', val)}
                options={[
                  { value: 'RCC Framed', label: 'RCC Framed' },
                  { value: 'Load Bearing', label: 'Load Bearing' },
                  { value: 'Steel Framed', label: 'Steel Framed' },
                  { value: 'Composite', label: 'Composite' },
                  { value: 'Timber / Precast', label: 'Timber / Precast' },
                ]}
                disabled={isReadOnly}
                placeholder="Select structure..."
              />
            </Field>

            {/* Masonry */}
            <Field label={<span className="text-xs font-semibold text-gray-700">MASONRY</span>}>
              <CustomSelect
                value={fields.grihamNdmaMasonry || 'Brick Masonry'}
                customValue={fields.grihamNdmaMasonryCustom || ''}
                onChange={(val) => handleChange('grihamNdmaMasonry', val)}
                onCustomChange={(val) => handleChange('grihamNdmaMasonryCustom', val)}
                options={[
                  { value: 'Brick Masonry', label: 'Brick Masonry' },
                  { value: 'AAC Blocks', label: 'AAC Blocks' },
                  { value: 'Fly Ash Bricks', label: 'Fly Ash Bricks' },
                  { value: 'Stone Masonry', label: 'Stone Masonry' },
                  { value: 'Concrete Blocks', label: 'Concrete Blocks' },
                ]}
                disabled={isReadOnly}
                placeholder="Select masonry..."
              />
            </Field>

            {/* Roof */}
            <Field label={<span className="text-xs font-semibold text-gray-700">ROOF</span>}>
              <CustomSelect
                value={fields.grihamNdmaRoof || 'RCC Slab'}
                customValue={fields.grihamNdmaRoofCustom || ''}
                onChange={(val) => handleChange('grihamNdmaRoof', val)}
                onCustomChange={(val) => handleChange('grihamNdmaRoofCustom', val)}
                options={[
                  { value: 'RCC Slab', label: 'RCC Slab' },
                  { value: 'Truss with CGI Sheet', label: 'Truss with CGI Sheet' },
                  { value: 'Profile Sheet Roof', label: 'Profile Sheet Roof' },
                  { value: 'Pitched Tile Roof', label: 'Pitched Tile Roof' },
                  { value: 'Flat Roof', label: 'Flat Roof' },
                ]}
                disabled={isReadOnly}
                placeholder="Select roof..."
              />
            </Field>

            {/* Mortar */}
            <Field label={<span className="text-xs font-semibold text-gray-700">MORTAR</span>}>
              <CustomSelect
                value={fields.grihamNdmaMortar || 'Cement Mortar 1:6'}
                customValue={fields.grihamNdmaMortarCustom || ''}
                onChange={(val) => handleChange('grihamNdmaMortar', val)}
                onCustomChange={(val) => handleChange('grihamNdmaMortarCustom', val)}
                options={[
                  { value: 'Cement Mortar 1:6', label: 'Cement Mortar 1:6' },
                  { value: 'Cement Mortar 1:4', label: 'Cement Mortar 1:4' },
                  { value: 'Cement Mortar 1:3', label: 'Cement Mortar 1:3' },
                  { value: 'Lime Mortar', label: 'Lime Mortar' },
                  { value: 'Composite Mortar', label: 'Composite Mortar' },
                ]}
                disabled={isReadOnly}
                placeholder="Select mortar..."
              />
            </Field>

            {/* Concrete Grade */}
            <Field label={<span className="text-xs font-semibold text-gray-700">CONCRETE GRADE</span>}>
              <CustomSelect
                value={fields.grihamNdmaConcreteGrade || 'M20'}
                customValue={fields.grihamNdmaConcreteGradeCustom || ''}
                onChange={(val) => handleChange('grihamNdmaConcreteGrade', val)}
                onCustomChange={(val) => handleChange('grihamNdmaConcreteGradeCustom', val)}
                options={[
                  { value: 'M20', label: 'M20 (1:1.5:3)' },
                  { value: 'M25', label: 'M25 (1:1:2)' },
                  { value: 'M30', label: 'M30' },
                  { value: 'M15', label: 'M15 (1:2:4)' },
                  { value: 'M35', label: 'M35' },
                ]}
                disabled={isReadOnly}
                placeholder="Select grade..."
              />
            </Field>

            {/* Footing */}
            <Field label={<span className="text-xs font-semibold text-gray-700">FOOTING</span>}>
              <CustomSelect
                value={fields.grihamNdmaFooting || 'Isolated Footing'}
                customValue={fields.grihamNdmaFootingCustom || ''}
                onChange={(val) => handleChange('grihamNdmaFooting', val)}
                onCustomChange={(val) => handleChange('grihamNdmaFootingCustom', val)}
                options={[
                  { value: 'Isolated Footing', label: 'Isolated Footing' },
                  { value: 'Raft Footing', label: 'Raft / Mat Footing' },
                  { value: 'Strip Footing', label: 'Strip Footing' },
                  { value: 'Pile Foundation', label: 'Pile Foundation' },
                  { value: 'Combined Footing', label: 'Combined Footing' },
                ]}
                disabled={isReadOnly}
                placeholder="Select footing..."
              />
            </Field>

            {/* Seismic Zone */}
            <Field label={<span className="text-xs font-semibold text-gray-700">SEISMIC ZONE</span>}>
              <CustomSelect
                value={fields.grihamNdmaSeismicZone || 'Zone III'}
                customValue={fields.grihamNdmaSeismicZoneCustom || ''}
                onChange={(val) => handleChange('grihamNdmaSeismicZone', val)}
                onCustomChange={(val) => handleChange('grihamNdmaSeismicZoneCustom', val)}
                options={[
                  { value: 'Zone II', label: 'Zone II (Low Damage Risk)' },
                  { value: 'Zone III', label: 'Zone III (Moderate Damage Risk)' },
                  { value: 'Zone IV', label: 'Zone IV (High Damage Risk)' },
                  { value: 'Zone V', label: 'Zone V (Very High Damage Risk)' },
                ]}
                disabled={isReadOnly}
                placeholder="Select seismic zone..."
              />
            </Field>
          </div>

          {/* Plan Aspect Ratio & Radio Buttons */}
          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div className="max-w-xs">
              <Field label={<span className="text-xs font-semibold text-gray-700">PLAN ASPECT RATIO</span>}>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.grihamNdmaPlanAspectRatio || ''}
                  onChange={(e) => handleChange('grihamNdmaPlanAspectRatio', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1:1.5 or < 2.0"
                />
              </Field>
            </div>

            {/* Radio Buttons (Yes / No) Grid */}
            <div>
              <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Structural & Environmental Safety Checklist (Yes / No)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'grihamNdmaProjectedParts', label: 'Projected Parts', defaultVal: 'No' },
                  { key: 'grihamNdmaExpansionJoint', label: 'Expansion Joint', defaultVal: 'No' },
                  { key: 'grihamNdmaSoilLiquefiable', label: 'Soil Liquefiable', defaultVal: 'No' },
                  { key: 'grihamNdmaCrz', label: 'CRZ (Coastal Reg. Zone)', defaultVal: 'No' },
                  { key: 'grihamNdmaFloodProne', label: 'Flood Prone', defaultVal: 'No' },
                  { key: 'grihamNdmaFireExit', label: 'Fire Exit', defaultVal: 'Yes' },
                ].map((item) => {
                  const currentVal = fields[item.key] ?? item.defaultVal;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-gray-50/70"
                    >
                      <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                      <div className="flex items-center gap-3">
                        {['Yes', 'No'].map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700 select-none"
                          >
                            <input
                              type="radio"
                              name={item.key}
                              value={opt}
                              checked={currentVal === opt}
                              onChange={(e) => handleChange(item.key, e.target.value)}
                              disabled={isReadOnly}
                              className="h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Slab wise Construction Status Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
                SLAB WISE CONSTRUCTION STATUS TABLE
              </span>
              <p className="text-[11px] text-gray-500">
                Detailed breakdown of construction stages, allotted percentages and present completion status
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Slab / Stage
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-red-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-red-100/70 border-b border-red-200 text-red-950 font-bold">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Stage / Slab Description</th>
                  <th className="p-3 w-40 text-right">Allotted %</th>
                  <th className="p-3 w-44 text-right">Present Completion %</th>
                  {!isReadOnly && <th className="p-3 w-16 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {rows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-red-50/30">
                    <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={row.stage || ''}
                        onChange={(e) => updateRow(row.id, { stage: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="e.g. Ground Floor Slab"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        className={`${inputCls} text-right`}
                        value={row.allottedPct || ''}
                        onChange={(e) => updateRow(row.id, { allottedPct: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="0.00 %"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        className={`${inputCls} text-right font-medium`}
                        value={row.presentCompletionPct || ''}
                        onChange={(e) => updateRow(row.id, { presentCompletionPct: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="0.00 %"
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                          className={`p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors ${
                            rows.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title="Remove stage row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-red-100/80 border-t-2 border-red-300 font-bold text-red-950">
                  <td colSpan={2} className="p-3 uppercase">
                    Total Allotted %: {totals.allotted > 0 ? `${totals.allotted.toFixed(2)}%` : '—'}
                  </td>
                  <td className="p-3 text-right">
                    {totals.allotted > 0 ? `${totals.allotted.toFixed(2)}%` : '0.00%'}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Override</span>
                        <EditSwitch
                          checked={!!fields.grihamTotalPresentCompletionEditOn}
                          onChange={(checked) => {
                            handleChange('grihamTotalPresentCompletionEditOn', checked);
                            if (checked) {
                              handleChange('grihamTotalPresentCompletionPct', effectiveTotalCompletion);
                            } else {
                              handleChange(
                                'grihamTotalPresentCompletionPct',
                                totals.present > 0 ? String(totals.present) : ''
                              );
                            }
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="relative w-full max-w-35">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          className={`${inputCls} text-right font-bold ${
                            !fields.grihamTotalPresentCompletionEditOn
                              ? 'bg-gray-100/90 text-red-950'
                              : 'bg-white text-gray-900'
                          }`}
                          value={effectiveTotalCompletion}
                          onChange={(e) => handleChange('grihamTotalPresentCompletionPct', e.target.value)}
                          disabled={isReadOnly || !fields.grihamTotalPresentCompletionEditOn}
                          placeholder="Total %"
                        />
                        {!fields.grihamTotalPresentCompletionEditOn && (
                          <div className="absolute left-2 top-2 text-[10px] text-red-900 font-semibold pointer-events-none flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Sum
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {!isReadOnly && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 13: Valuation Approaches & Methodology Adopted ─────────────────

export function ValuationApproachesSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // 1. Adoptable Built-up Area auto-calculated from Section 11 Adopted BUA
  const autoAdoptableBua = useMemo(() => {
    const bRows = fields.grihamBuiltUpAreaRows;
    if (!Array.isArray(bRows) || bRows.length === 0) return 0;
    let total = 0;
    bRows.forEach((r: any) => {
      const a = parseFloat(r.actualBua) || 0;
      const p = parseFloat(r.permissibleBua) || 0;
      let minVal = 0;
      if (a > 0 && p > 0) minVal = Math.min(a, p);
      else if (a > 0) minVal = a;
      else if (p > 0) minVal = p;

      const rowAdopted = r.adoptedBuaEditOn
        ? (parseFloat(r.adoptedBua) || 0)
        : (parseFloat(r.adoptedBua) || minVal);
      total += rowAdopted;
    });
    return Math.round(total * 100) / 100;
  }, [fields.grihamBuiltUpAreaRows]);

  const effectiveAdoptableBua = fields.grihamValuationAdoptableBuaEditOn
    ? (fields.grihamValuationAdoptableBua ?? '')
    : (autoAdoptableBua > 0 ? String(autoAdoptableBua) : (fields.grihamValuationAdoptableBua || ''));

  // Land Area (in Sqft)
  const landSqftNum = parseFloat(fields.grihamValuationLandAreaSqft) || 0;

  // 2. Total Land Value auto-calculated: Land Area (In Sqft) * Recommended Rate of Land
  const landRateNum = parseFloat(fields.grihamValuationRecommendedLandRate) || 0;
  const autoTotalLandValue = landSqftNum > 0 && landRateNum > 0
    ? Math.round(landSqftNum * landRateNum)
    : 0;

  const effectiveTotalLandValue = fields.grihamValuationTotalLandValueEditOn
    ? (fields.grihamValuationTotalLandValue ?? '')
    : (autoTotalLandValue > 0 ? String(autoTotalLandValue) : (fields.grihamValuationTotalLandValue || ''));

  // 3. Total Construction Value for 100% complete building: Adoptable Built-up Area * Construction Cost
  const adoptableBuaNum = parseFloat(effectiveAdoptableBua) || 0;
  const constCostNum = parseFloat(fields.grihamValuationConstructionCostPerSqft) || 0;
  const autoConst100 = adoptableBuaNum > 0 && constCostNum > 0
    ? Math.round(adoptableBuaNum * constCostNum)
    : 0;

  const effectiveConst100 = fields.grihamValuationTotalConstructionValue100EditOn
    ? (fields.grihamValuationTotalConstructionValue100 ?? '')
    : (autoConst100 > 0 ? String(autoConst100) : (fields.grihamValuationTotalConstructionValue100 || ''));

  // 4. Total Construction Value for present stage: Total Const 100% * Total Present Completion % (from Sec 12)
  const completionPct = useMemo(() => {
    if (fields.grihamTotalPresentCompletionPct && !isNaN(parseFloat(fields.grihamTotalPresentCompletionPct))) {
      return parseFloat(fields.grihamTotalPresentCompletionPct);
    }
    if (Array.isArray(fields.grihamSlabConstructionRows) && fields.grihamSlabConstructionRows.length > 0) {
      const sum = fields.grihamSlabConstructionRows.reduce(
        (acc: number, r: any) => acc + (parseFloat(r.presentCompletionPct) || 0),
        0
      );
      return Math.round(sum * 100) / 100;
    }
    return 100;
  }, [fields.grihamTotalPresentCompletionPct, fields.grihamSlabConstructionRows]);

  const const100Num = parseFloat(effectiveConst100) || 0;
  const autoConstPresent = const100Num > 0
    ? Math.round((const100Num * completionPct) / 100)
    : 0;

  const effectiveConstPresent = fields.grihamValuationTotalConstructionValuePresentEditOn
    ? (fields.grihamValuationTotalConstructionValuePresent ?? '')
    : (autoConstPresent > 0 ? String(autoConstPresent) : (fields.grihamValuationTotalConstructionValuePresent || ''));

  // 5. Market Value of Land & Building for present completed property: Total Land Value + Total Construction Value for present stage
  const landValNum = parseFloat(effectiveTotalLandValue) || 0;
  const constPresentNum = parseFloat(effectiveConstPresent) || 0;
  const autoMvPresent = (landValNum > 0 || constPresentNum > 0)
    ? Math.round(landValNum + constPresentNum)
    : 0;

  const effectiveMvPresent = fields.grihamValuationMarketValuePresentEditOn
    ? (fields.grihamValuationMarketValuePresent ?? '')
    : (autoMvPresent > 0 ? String(autoMvPresent) : (fields.grihamValuationMarketValuePresent || ''));

  // 6. Distress Value of present completed property @ 75% of MV: Market Value * 0.75
  const mvNum = parseFloat(effectiveMvPresent) || 0;
  const autoDistress = mvNum > 0 ? Math.round(mvNum * 0.75) : 0;

  const effectiveDistress = fields.grihamValuationDistressValueEditOn
    ? (fields.grihamValuationDistressValue ?? '')
    : (autoDistress > 0 ? String(autoDistress) : (fields.grihamValuationDistressValue || ''));

  // 7. Total Land Value as per Government Rate: Land Area (In Sqft) * Govt Guideline for Land
  const govtLandRateNum = parseFloat(fields.grihamValuationGovtLandRatePerSqft) || 0;
  const autoGovtLandValue = landSqftNum > 0 && govtLandRateNum > 0
    ? Math.round(landSqftNum * govtLandRateNum)
    : 0;

  const effectiveGovtLandValue = fields.grihamValuationTotalLandValueGovtEditOn
    ? (fields.grihamValuationTotalLandValueGovt ?? '')
    : (autoGovtLandValue > 0 ? String(autoGovtLandValue) : (fields.grihamValuationTotalLandValueGovt || ''));

  // 8. Total Flat / Apartment Value as per Government Rate: Adoptable Built-up Area * Govt Guideline for Flats
  const govtFlatRateNum = parseFloat(fields.grihamValuationGovtFlatRatePerSqft) || 0;
  const autoGovtFlatValue = adoptableBuaNum > 0 && govtFlatRateNum > 0
    ? Math.round(adoptableBuaNum * govtFlatRateNum)
    : 0;

  const effectiveGovtFlatValue = fields.grihamValuationTotalFlatValueGovtEditOn
    ? (fields.grihamValuationTotalFlatValueGovt ?? '')
    : (autoGovtFlatValue > 0 ? String(autoGovtFlatValue) : (fields.grihamValuationTotalFlatValueGovt || ''));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Valuation Approaches & Methodology (Mint Green #f1f8e9) */}
      <div
        className="rounded-xl p-5 space-y-6 border border-emerald-300/80 shadow-sm"
        style={{ backgroundColor: '#f1f8e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            VALUATION APPROACHES & METHODOLOGY ADOPTED
          </h3>
          <span className="text-xs text-emerald-950 font-medium bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200">
            Market Valuation, Construction Costing & Govt Guideline Rates
          </span>
        </div>

        {/* Card 1: Property Dimensions & Locality Rates */}
        <div className="bg-white/90 rounded-xl p-5 border border-emerald-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
            <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
              Property Dimensions & Locality Rates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Land Area (As per Legal Docs) */}
            <Field label={<span className="font-semibold text-gray-700">LAND AREA (AS PER LEGAL DOCS)</span>}>
              <input
                type="text"
                className={inputCls}
                value={fields.grihamValuationLandAreaDocs ?? (fields.landAreaDocs || fields.legalArea || '')}
                onChange={(e) => handleChange('grihamValuationLandAreaDocs', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Ac. 0.050 dec / 2178 sqft"
              />
            </Field>

            {/* Land Area (In Sqft) */}
            <Field label={<span className="font-semibold text-gray-700">LAND AREA (IN SQFT)</span>}>
              <input
                type="number"
                step="any"
                min="0"
                className={inputCls}
                value={fields.grihamValuationLandAreaSqft ?? (fields.landAreaSqft || '')}
                onChange={(e) => handleChange('grihamValuationLandAreaSqft', e.target.value)}
                disabled={isReadOnly}
                placeholder="Sqft (e.g. 2178)"
              />
            </Field>

            {/* Adoptable Built-up Area (in Sqft) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">ADOPTABLE BUILT-UP AREA (SQFT)</span>
                  <EditSwitch
                    checked={!!fields.grihamValuationAdoptableBuaEditOn}
                    onChange={(checked) => {
                      handleChange('grihamValuationAdoptableBuaEditOn', checked);
                      if (checked) {
                        handleChange('grihamValuationAdoptableBua', effectiveAdoptableBua);
                      } else if (autoAdoptableBua > 0) {
                        handleChange('grihamValuationAdoptableBua', String(autoAdoptableBua));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamValuationAdoptableBuaEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveAdoptableBua}
                  onChange={(e) => handleChange('grihamValuationAdoptableBua', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationAdoptableBuaEditOn}
                  placeholder="Adopted BUA (Sqft)"
                />
                {!fields.grihamValuationAdoptableBuaEditOn && (
                  <div className="absolute right-2 top-2 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: Sec 11 Adopted BUA
                  </div>
                )}
              </div>
            </Field>

            {/* Current Market Rate in the locality (Range) */}
            <Field label={<span className="font-semibold text-gray-700">CURRENT MARKET RATE IN LOCALITY (RANGE)</span>}>
              <input
                type="text"
                className={inputCls}
                value={fields.grihamValuationMarketRateRange || ''}
                onChange={(e) => handleChange('grihamValuationMarketRateRange', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 380-450 or 2500-3000 / sqft"
              />
            </Field>

            {/* Recommended Rate of Land (Rs per sqft) */}
            <Field label={<span className="font-semibold text-gray-700">RECOMMENDED RATE OF LAND (RS/SQFT)</span>}>
              <input
                type="number"
                step="any"
                min="0"
                className={inputCls}
                value={fields.grihamValuationRecommendedLandRate || ''}
                onChange={(e) => handleChange('grihamValuationRecommendedLandRate', e.target.value)}
                disabled={isReadOnly}
                placeholder="Rate in Rs. per sqft"
              />
            </Field>

            {/* Construction Cost (Rs per sft) */}
            <Field label={<span className="font-semibold text-gray-700">CONSTRUCTION COST (RS/SQFT)</span>}>
              <input
                type="number"
                step="any"
                min="0"
                className={inputCls}
                value={fields.grihamValuationConstructionCostPerSqft || ''}
                onChange={(e) => handleChange('grihamValuationConstructionCostPerSqft', e.target.value)}
                disabled={isReadOnly}
                placeholder="Cost in Rs. per sqft"
              />
            </Field>
          </div>
        </div>

        {/* Card 2: Valuation & Costing Breakdown (Market Approach) */}
        <div className="bg-white/90 rounded-xl p-5 border border-emerald-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2">
            <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
              Valuation & Costing Breakdown (Market & Cost Approach)
            </span>
            <span className="text-[11px] text-gray-500">
              Stage Completion: <strong className="text-emerald-700">{completionPct}%</strong> (from Sec 12)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Total Land Value (in Rs) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">TOTAL LAND VALUE (RS)</span>
                  <EditSwitch
                    checked={!!fields.grihamValuationTotalLandValueEditOn}
                    onChange={(checked) => {
                      handleChange('grihamValuationTotalLandValueEditOn', checked);
                      if (checked) {
                        handleChange('grihamValuationTotalLandValue', effectiveTotalLandValue);
                      } else if (autoTotalLandValue > 0) {
                        handleChange('grihamValuationTotalLandValue', String(autoTotalLandValue));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamValuationTotalLandValueEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveTotalLandValue}
                  onChange={(e) => handleChange('grihamValuationTotalLandValue', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationTotalLandValueEditOn}
                  placeholder="Total Land Value"
                />
                {!fields.grihamValuationTotalLandValueEditOn && (
                  <div className="absolute right-2 top-2 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: Area × Rate
                  </div>
                )}
              </div>
            </Field>

            {/* Total Construction Value for 100% complete building (in Rs) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">TOTAL CONST VALUE (100% COMPLETE) (RS)</span>
                  <EditSwitch
                    checked={!!fields.grihamValuationTotalConstructionValue100EditOn}
                    onChange={(checked) => {
                      handleChange('grihamValuationTotalConstructionValue100EditOn', checked);
                      if (checked) {
                        handleChange('grihamValuationTotalConstructionValue100', effectiveConst100);
                      } else if (autoConst100 > 0) {
                        handleChange('grihamValuationTotalConstructionValue100', String(autoConst100));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamValuationTotalConstructionValue100EditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveConst100}
                  onChange={(e) => handleChange('grihamValuationTotalConstructionValue100', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationTotalConstructionValue100EditOn}
                  placeholder="100% Const Value"
                />
                {!fields.grihamValuationTotalConstructionValue100EditOn && (
                  <div className="absolute right-2 top-2 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: BUA × Cost
                  </div>
                )}
              </div>
            </Field>

            {/* Total Construction Value for present construction stage (in Rs) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">CONST VALUE (PRESENT STAGE) (RS)</span>
                  <EditSwitch
                    checked={!!fields.grihamValuationTotalConstructionValuePresentEditOn}
                    onChange={(checked) => {
                      handleChange('grihamValuationTotalConstructionValuePresentEditOn', checked);
                      if (checked) {
                        handleChange('grihamValuationTotalConstructionValuePresent', effectiveConstPresent);
                      } else if (autoConstPresent > 0) {
                        handleChange('grihamValuationTotalConstructionValuePresent', String(autoConstPresent));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamValuationTotalConstructionValuePresentEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveConstPresent}
                  onChange={(e) => handleChange('grihamValuationTotalConstructionValuePresent', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationTotalConstructionValuePresentEditOn}
                  placeholder="Present Stage Value"
                />
                {!fields.grihamValuationTotalConstructionValuePresentEditOn && (
                  <div className="absolute right-2 top-2 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: 100% × {completionPct}%
                  </div>
                )}
              </div>
            </Field>
          </div>

          {/* Highlight Cards: Market Value & Distress Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-emerald-100">
            {/* Market Value of Land & Building for present completed property (in Rs) */}
            <div className="rounded-xl border border-emerald-300 bg-linear-to-br from-emerald-50/90 to-teal-50/70 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  MARKET VALUE (PRESENT COMPLETED PROPERTY)
                </span>
                <EditSwitch
                  checked={!!fields.grihamValuationMarketValuePresentEditOn}
                  onChange={(checked) => {
                    handleChange('grihamValuationMarketValuePresentEditOn', checked);
                    if (checked) {
                      handleChange('grihamValuationMarketValuePresent', effectiveMvPresent);
                    } else if (autoMvPresent > 0) {
                      handleChange('grihamValuationMarketValuePresent', String(autoMvPresent));
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} text-lg font-bold ${
                    !fields.grihamValuationMarketValuePresentEditOn
                      ? 'bg-white/90 text-emerald-950 border-emerald-300'
                      : 'bg-white text-gray-900'
                  }`}
                  value={effectiveMvPresent}
                  onChange={(e) => handleChange('grihamValuationMarketValuePresent', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationMarketValuePresentEditOn}
                  placeholder="Market Value (Rs)"
                />
                {!fields.grihamValuationMarketValuePresentEditOn && (
                  <div className="absolute right-2 top-2.5 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: Land + Stage Const
                  </div>
                )}
              </div>

              {mvNum > 0 && (
                <div className="text-xs text-emerald-900 bg-white/70 rounded-lg p-2.5 border border-emerald-200/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Formatted:</span>
                    <span className="text-emerald-950 font-mono">Rs. {formatIndianCurrency(mvNum)}/-</span>
                  </div>
                  <div className="text-[11px] text-gray-600 italic">
                    Rupees {rupeesInWords(mvNum)} Only
                  </div>
                </div>
              )}
            </div>

            {/* Distress Value of present completed property @ 75% of MV */}
            <div className="rounded-xl border border-amber-300 bg-linear-to-br from-amber-50/80 to-yellow-50/60 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  DISTRESS VALUE (@ 75% OF MV)
                </span>
                <EditSwitch
                  checked={!!fields.grihamValuationDistressValueEditOn}
                  onChange={(checked) => {
                    handleChange('grihamValuationDistressValueEditOn', checked);
                    if (checked) {
                      handleChange('grihamValuationDistressValue', effectiveDistress);
                    } else if (autoDistress > 0) {
                      handleChange('grihamValuationDistressValue', String(autoDistress));
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} text-lg font-bold ${
                    !fields.grihamValuationDistressValueEditOn
                      ? 'bg-white/90 text-amber-950 border-amber-300'
                      : 'bg-white text-gray-900'
                  }`}
                  value={effectiveDistress}
                  onChange={(e) => handleChange('grihamValuationDistressValue', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationDistressValueEditOn}
                  placeholder="Distress Value (Rs)"
                />
                {!fields.grihamValuationDistressValueEditOn && (
                  <div className="absolute right-2 top-2.5 text-[10px] text-amber-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: MV × 75%
                  </div>
                )}
              </div>

              {autoDistress > 0 && (
                <div className="text-xs text-amber-900 bg-white/70 rounded-lg p-2.5 border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Formatted:</span>
                    <span className="text-amber-950 font-mono">
                      Rs. {formatIndianCurrency(parseFloat(effectiveDistress) || autoDistress)}/-
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 italic">
                    Rupees {rupeesInWords(parseFloat(effectiveDistress) || autoDistress)} Only
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Government Guideline Rates & Statutory Valuation */}
        <div className="bg-white/90 rounded-xl p-5 border border-emerald-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
            <span className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide">
              Government Guideline Rates & Benchmark Valuation
            </span>
            <span className="text-[10px] text-emerald-900 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
              Statutory Benchmark
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Government Guideline for Land (Rs per sqft) */}
            <Field label={<span className="font-semibold text-gray-700">GOVERNMENT GUIDELINE FOR LAND (RS/SQFT)</span>}>
              <input
                type="number"
                step="any"
                min="0"
                className={inputCls}
                value={fields.grihamValuationGovtLandRatePerSqft || ''}
                onChange={(e) => handleChange('grihamValuationGovtLandRatePerSqft', e.target.value)}
                disabled={isReadOnly}
                placeholder="Govt. land rate per sqft"
              />
            </Field>

            {/* Total Land Value as per Government Rate (Rs) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">TOTAL LAND VALUE AS PER GOVT RATE (RS)</span>
                  <EditSwitch
                    checked={!!fields.grihamValuationTotalLandValueGovtEditOn}
                    onChange={(checked) => {
                      handleChange('grihamValuationTotalLandValueGovtEditOn', checked);
                      if (checked) {
                        handleChange('grihamValuationTotalLandValueGovt', effectiveGovtLandValue);
                      } else if (autoGovtLandValue > 0) {
                        handleChange('grihamValuationTotalLandValueGovt', String(autoGovtLandValue));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamValuationTotalLandValueGovtEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveGovtLandValue}
                  onChange={(e) => handleChange('grihamValuationTotalLandValueGovt', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationTotalLandValueGovtEditOn}
                  placeholder="Total Govt Land Value"
                />
                {!fields.grihamValuationTotalLandValueGovtEditOn && (
                  <div className="absolute right-2 top-2 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: Land Area × Govt Rate
                  </div>
                )}
              </div>
            </Field>

            {/* Government Guideline for Flats (Rs per sqft) */}
            <Field label={<span className="font-semibold text-gray-700">GOVERNMENT GUIDELINE FOR FLATS (RS/SQFT)</span>}>
              <input
                type="number"
                step="any"
                min="0"
                className={inputCls}
                value={fields.grihamValuationGovtFlatRatePerSqft || ''}
                onChange={(e) => handleChange('grihamValuationGovtFlatRatePerSqft', e.target.value)}
                disabled={isReadOnly}
                placeholder="Govt. flat rate per sqft"
              />
            </Field>

            {/* Total Flat / Apartment Value as per Government Rate (Rs) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">TOTAL FLAT VALUE AS PER GOVT RATE (RS)</span>
                  <EditSwitch
                    checked={!!fields.grihamValuationTotalFlatValueGovtEditOn}
                    onChange={(checked) => {
                      handleChange('grihamValuationTotalFlatValueGovtEditOn', checked);
                      if (checked) {
                        handleChange('grihamValuationTotalFlatValueGovt', effectiveGovtFlatValue);
                      } else if (autoGovtFlatValue > 0) {
                        handleChange('grihamValuationTotalFlatValueGovt', String(autoGovtFlatValue));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={`${inputCls} font-medium ${
                    !fields.grihamValuationTotalFlatValueGovtEditOn ? 'bg-gray-100/80 text-gray-800' : 'bg-white'
                  }`}
                  value={effectiveGovtFlatValue}
                  onChange={(e) => handleChange('grihamValuationTotalFlatValueGovt', e.target.value)}
                  disabled={isReadOnly || !fields.grihamValuationTotalFlatValueGovtEditOn}
                  placeholder="Total Govt Flat Value"
                />
                {!fields.grihamValuationTotalFlatValueGovtEditOn && (
                  <div className="absolute right-2 top-2 text-[10px] text-emerald-900 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Auto: Adopted BUA × Govt Flat Rate
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

// ─── Griham Housing Finance BankConfig ──────────────────────────────────────

export const GRIHUM_HOUSING_CONFIG: BankConfig = {
  bankId: 'GRIHUM HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'Grihum Housing Finance',
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
    'section-12',
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
    { id: 'griham-section-9', title: 'ENVIRONMENTAL FACTORS AFFECTING THE PROPERTY' },
    { id: 'griham-section-10', title: 'MARKETABILITY OF THE PROPERTY' },
    { id: 'griham-section-11', title: 'ARCHITECTURAL ASPECTS OF THE PROPERTY' },
    { id: 'griham-section-12', title: 'ENGINEERING ASPECTS OF THE PROPERTY' },
    { id: 'griham-section-13', title: 'VALUATION APPROACHES & METHODOLOGY ADOPTED' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-11', title: 'Property Photographs' },
  ],
  fieldLabels: {
    'documents-title': 'DOCUMENTS',
    'section-documents-title': 'DOCUMENTS',
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
    // Section 9
    grihamEnvironmentalObservations: '',
    grihamEnvironmentalObservationsNa: false,
    // Section 10
    grihamLocalityClass: 'Middle class',
    grihamLocalityClassCustom: '',
    grihamNeighbourFeedback: '',
    grihamNeighbourFeedbackNa: false,
    grihamMarketability: 'Standard',
    grihamMarketabilityCustom: '',
    // Section 11
    grihamBuiltUpAreaRows: [
      {
        id: '1',
        floor: 'Ground Floor',
        floorCustom: '',
        accommodation: '2 BHK (Hall, 2 Bedrooms, Kitchen, Toilet)',
        carpetArea: '',
        actualBua: '',
        permissibleBua: '',
        adoptedBua: '',
        adoptedBuaEditOn: false,
      },
    ],
    grihamToiletLocation: 'Inside house',
    grihamToiletLocationCustom: '',
    // Section 12
    grihamNoOfFloorsFlats: '',
    grihamYearOfCompletion: '',
    grihamPresentAge: '',
    grihamPresentAgeEditOn: false,
    grihamFuturePhysicalLife: '',
    grihamFuturePhysicalLifeEditOn: false,
    grihamConditionOfProperty: 'Good',
    grihamConditionOfPropertyCustom: '',
    grihamTypeOfStructure: 'RCC',
    grihamTypeOfStructureCustom: '',
    grihamNdmaNatureOfBuilding: 'Residential',
    grihamNdmaNatureOfBuildingCustom: '',
    grihamNdmaStructureType: 'RCC Framed',
    grihamNdmaStructureTypeCustom: '',
    grihamNdmaMasonry: 'Brick Masonry',
    grihamNdmaMasonryCustom: '',
    grihamNdmaRoof: 'RCC Slab',
    grihamNdmaRoofCustom: '',
    grihamNdmaMortar: 'Cement Mortar 1:6',
    grihamNdmaMortarCustom: '',
    grihamNdmaConcreteGrade: 'M20',
    grihamNdmaConcreteGradeCustom: '',
    grihamNdmaFooting: 'Isolated Footing',
    grihamNdmaFootingCustom: '',
    grihamNdmaSeismicZone: 'Zone III',
    grihamNdmaSeismicZoneCustom: '',
    grihamNdmaPlanAspectRatio: '',
    grihamNdmaProjectedParts: 'No',
    grihamNdmaExpansionJoint: 'No',
    grihamNdmaSoilLiquefiable: 'No',
    grihamNdmaCrz: 'No',
    grihamNdmaFloodProne: 'No',
    grihamNdmaFireExit: 'Yes',
    grihamSlabConstructionRows: DEFAULT_SLAB_CONSTRUCTION_ROWS,
    grihamTotalPresentCompletionPct: '',
    grihamTotalPresentCompletionEditOn: false,
    // Section 13
    grihamValuationLandAreaDocs: '',
    grihamValuationLandAreaSqft: '',
    grihamValuationAdoptableBua: '',
    grihamValuationAdoptableBuaEditOn: false,
    grihamValuationMarketRateRange: '',
    grihamValuationRecommendedLandRate: '',
    grihamValuationConstructionCostPerSqft: '',
    grihamValuationTotalLandValue: '',
    grihamValuationTotalLandValueEditOn: false,
    grihamValuationTotalConstructionValue100: '',
    grihamValuationTotalConstructionValue100EditOn: false,
    grihamValuationTotalConstructionValuePresent: '',
    grihamValuationTotalConstructionValuePresentEditOn: false,
    grihamValuationMarketValuePresent: '',
    grihamValuationMarketValuePresentEditOn: false,
    grihamValuationDistressValue: '',
    grihamValuationDistressValueEditOn: false,
    grihamValuationGovtLandRatePerSqft: '',
    grihamValuationTotalLandValueGovt: '',
    grihamValuationTotalLandValueGovtEditOn: false,
    grihamValuationGovtFlatRatePerSqft: '',
    grihamValuationTotalFlatValueGovt: '',
    grihamValuationTotalFlatValueGovtEditOn: false,
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
    {
      id: 'griham-section-9',
      title: 'ENVIRONMENTAL FACTORS AFFECTING THE PROPERTY',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <EnvironmentalFactorsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-10',
      title: 'MARKETABILITY OF THE PROPERTY',
      number: 10,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <MarketabilitySection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-11',
      title: 'ARCHITECTURAL ASPECTS OF THE PROPERTY',
      number: 11,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ArchitecturalAspectsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-12',
      title: 'ENGINEERING ASPECTS OF THE PROPERTY',
      number: 12,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <EngineeringAspectsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'griham-section-13',
      title: 'VALUATION APPROACHES & METHODOLOGY ADOPTED',
      number: 13,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ValuationApproachesSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ],
};

export default function GrihumHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GRIHUM_HOUSING_CONFIG} {...props} />;
}

export { GRIHUM_HOUSING_CONFIG as GRIHAM_HOUSING_CONFIG, GrihumHousing as GrihamHousing };

