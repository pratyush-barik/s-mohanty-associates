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
  ],
};

export default function GrihamHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GRIHAM_HOUSING_CONFIG} {...props} />;
}
