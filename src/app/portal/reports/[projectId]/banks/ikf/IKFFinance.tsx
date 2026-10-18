'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, FileText, CheckCircle2, Building, MapPin, Ruler, Compass } from 'lucide-react';

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
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          checked ? 'text-emerald-700' : 'text-gray-400'
        }`}
      >
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
    <div className="space-y-2 w-full">
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
          className={`${inputCls} bg-amber-50/50 border-amber-300 text-gray-900 placeholder:text-gray-400`}
          value={customValue || ''}
          onChange={(e) => onCustomChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter custom value..."
        />
      )}
    </div>
  );
}

export function AutoResizeTextarea({
  value,
  onChange,
  disabled = false,
  placeholder = '',
  rows = 2,
  className = '',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    onChange(e);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value || ''}
      onChange={handleInput}
      disabled={disabled}
      placeholder={placeholder}
      className={`${inputCls} overflow-hidden resize-none transition-[height] duration-100 ${className}`}
    />
  );
}

export function YesNoRadio({
  name,
  value,
  onChange,
  disabled = false,
  options = ['YES', 'NO'],
}: {
  name: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  options?: string[];
}) {
  return (
    <div className="flex items-center gap-6 pt-2">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800 select-none"
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={(value || options[0]).toUpperCase() === opt.toUpperCase()}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function LockedFieldWrapper({
  isLocked,
  tooltipMessage,
  children,
}: {
  isLocked: boolean;
  tooltipMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group/lock w-full cursor-help">
      {children}
      {isLocked && (
        <div className="absolute z-30 invisible group-hover/lock:visible opacity-0 group-hover/lock:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900/95 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1.5 border border-gray-700">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{tooltipMessage}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95" />
        </div>
      )}
    </div>
  );
}

// ─── Document Options for Container 3 ────────────────────────────────────────

const DOCUMENT_CHECKLIST_OPTIONS = [
  'Sale Deed',
  'Record of Rights (ROR) / Patta',
  'Approved Building Plan',
  'Mutation Certificate / Order',
  'Holding Tax / Property Tax Receipt',
  'Encumbrance Certificate (EC)',
  'Electricity Bill / Utility Bill',
  'Site Plan / Layout Plan',
  'Possession Certificate / Allotment Letter',
  'Conversion Order (Agricultural to Non-Agricultural)',
  'Other Documents',
];

// ─── Section 1: VALUATION REPORT Component ──────────────────────────────────

export function ValuationReportSection({
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

  // Effective report date (Prefill with current date, Edit button: OFF)
  const effectiveReportDate = fields.ikfReportDateEditOn
    ? (fields.ikfReportDate ?? '')
    : (fields.ikfReportDate || todayStr);

  // Address as per documents fallback
  const docsAddress = fields.ikfAddressDocuments ?? (fields.propertyAddress || fields.legalAddress || '');

  // Address as per site visit (Prefill from "Property Address as per documents", Edit button: OFF)
  const effectiveSiteVisitAddress = fields.ikfAddressSiteVisitEditOn
    ? (fields.ikfAddressSiteVisit ?? '')
    : (fields.ikfAddressSiteVisit || docsAddress);

  // Parse checked documents array
  const checkedDocs: string[] = useMemo(() => {
    if (Array.isArray(fields.ikfDocsReceivedChecked)) return fields.ikfDocsReceivedChecked;
    if (typeof fields.ikfDocsReceivedChecked === 'string') {
      try {
        const parsed = JSON.parse(fields.ikfDocsReceivedChecked);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return fields.ikfDocsReceivedChecked.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [fields.ikfDocsReceivedChecked]);

  const handleDocCheckboxToggle = (docName: string) => {
    let next: string[];
    if (checkedDocs.includes(docName)) {
      next = checkedDocs.filter((d) => d !== docName);
    } else {
      next = [...checkedDocs, docName];
    }
    handleChange('ikfDocsReceivedChecked', next);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container 1: Basic Details (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Basic Details
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Lead & Applicant Overview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Ref. No: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Ref. No</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. SMA/2026/001"
              value={fields.ikfRefNo ?? (projectCode || fields.refNo || '')}
              onChange={(e) => handleChange('ikfRefNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* IKFFL Lead No: Input Box (Number/Text) */}
          <Field label={<span className="font-semibold text-gray-700">IKFFL Lead No</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. IKFFL-2026-98745"
              value={fields.ikfLeadNo ?? (fields.loanApplicationNumber || '')}
              onChange={(e) => handleChange('ikfLeadNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* IKFFL Branch: Dropdown with Custom */}
          <Field label={<span className="font-semibold text-gray-700">IKFFL Branch</span>}>
            <CustomSelect
              value={fields.ikfBranch || 'Bhubaneswar'}
              customValue={fields.ikfBranchCustom || ''}
              onChange={(val) => handleChange('ikfBranch', val)}
              onCustomChange={(val) => handleChange('ikfBranchCustom', val)}
              options={[
                { value: 'Bhubaneswar', label: 'Bhubaneswar' },
                { value: 'Cuttack', label: 'Cuttack' },
                { value: 'Puri', label: 'Puri' },
                { value: 'Rourkela', label: 'Rourkela' },
                { value: 'Berhampur', label: 'Berhampur' },
                { value: 'Sambalpur', label: 'Sambalpur' },
                { value: 'Balasore', label: 'Balasore' },
                { value: 'Jajpur', label: 'Jajpur' },
                { value: 'Angul', label: 'Angul' },
                { value: 'Kolkata', label: 'Kolkata' },
                { value: 'Ranchi', label: 'Ranchi' },
                { value: 'Raipur', label: 'Raipur' },
              ]}
              disabled={isReadOnly}
              placeholder="Select IKFFL Branch..."
            />
          </Field>

          {/* Valuation Initiation Date: Date Picker */}
          <Field label={<span className="font-semibold text-gray-700">Valuation Initiation Date</span>}>
            <input
              type="date"
              className={inputCls}
              value={fields.ikfValuationInitiationDate || ''}
              onChange={(e) => handleChange('ikfValuationInitiationDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Valuation Inspection Date: Date Picker */}
          <Field label={<span className="font-semibold text-gray-700">Valuation Inspection Date</span>}>
            <input
              type="date"
              className={inputCls}
              value={fields.ikfValuationInspectionDate ?? (fields.dateOfInspection || '')}
              onChange={(e) => handleChange('ikfValuationInspectionDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Report Date: Date Picker (Prefill with current date, Edit button: OFF) [Lock UI Hover: >>Auto calculating from [Current System Date]<<] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Report Date</span>
                <EditSwitch
                  checked={!!fields.ikfReportDateEditOn}
                  onChange={(checked) => {
                    handleChange('ikfReportDateEditOn', checked);
                    if (!checked) handleChange('ikfReportDate', todayStr);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!fields.ikfReportDateEditOn}
              tooltipMessage=">>Auto calculating from [Current System Date]<<"
            >
              <div className="relative">
                <input
                  type="date"
                  className={`${inputCls} ${
                    fields.ikfReportDateEditOn
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-medium focus:ring-emerald-500'
                      : 'bg-gray-100/80 text-gray-700 cursor-not-allowed font-medium'
                  }`}
                  value={effectiveReportDate}
                  onChange={(e) => handleChange('ikfReportDate', e.target.value)}
                  disabled={isReadOnly || !fields.ikfReportDateEditOn}
                />
                {!fields.ikfReportDateEditOn && (
                  <div className="absolute right-8 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Current Date
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Purpose of valuation: Input Box (Variable Size) */}
          <div className="md:col-span-2 lg:col-span-3">
            <Field label={<span className="font-semibold text-gray-700">Purpose of valuation</span>}>
              <AutoResizeTextarea
                rows={2}
                placeholder="e.g. Mortgage / MSME Loan / Construction Loan"
                value={fields.ikfPurposeOfValuation ?? (fields.purpose || 'Mortgage / MSME Loan')}
                onChange={(e) => handleChange('ikfPurposeOfValuation', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Name of the Applicants: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Name of the Applicants</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Mr. Pramod Chandra Rath"
              value={fields.ikfApplicantName ?? (fields.customerName || fields.applicantName || '')}
              onChange={(e) => handleChange('ikfApplicantName', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Name of the owners: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Name of the owners</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Mr. Pramod Chandra Rath"
              value={fields.ikfOwnerName ?? (fields.ownerName || fields.customerName || '')}
              onChange={(e) => handleChange('ikfOwnerName', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Person met/Nos & Contact No-: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Person met/Nos & Contact No-</span>
                <NaCheckbox
                  checked={!!fields.ikfPersonMetAndContactNA}
                  onChange={(checked) => {
                    handleChange('ikfPersonMetAndContactNA', checked);
                    if (checked) handleChange('ikfPersonMetAndContact', 'NA');
                    else if (fields.ikfPersonMetAndContact === 'NA') handleChange('ikfPersonMetAndContact', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfPersonMetAndContactNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Mr. Pramod Chandra Rath / 9437208628"
              value={fields.ikfPersonMetAndContactNA ? 'NA' : (fields.ikfPersonMetAndContact || '')}
              onChange={(e) => handleChange('ikfPersonMetAndContact', e.target.value)}
              disabled={isReadOnly || !!fields.ikfPersonMetAndContactNA}
            />
          </Field>

          {/* Whether customer was present or not: Radio (YES / NO) */}
          <div className="md:col-span-2 lg:col-span-3">
            <Field label={<span className="font-semibold text-gray-700">Whether customer was present or not</span>}>
              <YesNoRadio
                name="ikfCustomerPresent"
                value={fields.ikfCustomerPresent || 'YES'}
                onChange={(val) => handleChange('ikfCustomerPresent', val)}
                disabled={isReadOnly}
                options={['YES', 'NO']}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Container 2: Property Address Details (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Property Address Details
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Address Verification & Site Visit
          </span>
        </div>

        <div className="space-y-4">
          {/* Property Address as per initiation: Input Box (Variable Size) */}
          <Field label={<span className="font-semibold text-gray-700">Property Address as per initiation</span>}>
            <AutoResizeTextarea
              rows={2}
              placeholder="Enter property address as per loan initiation request..."
              value={fields.ikfAddressInitiation ?? (fields.propertyAddress || '')}
              onChange={(e) => handleChange('ikfAddressInitiation', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Property Address as per documents: Input Box (Variable Size) */}
          <Field label={<span className="font-semibold text-gray-700">Property Address as per documents</span>}>
            <AutoResizeTextarea
              rows={2}
              placeholder="Enter property address as per title deeds, ROR, or revenue documents..."
              value={docsAddress}
              onChange={(e) => {
                handleChange('ikfAddressDocuments', e.target.value);
                // Also update site visit address if Edit button is OFF
                if (!fields.ikfAddressSiteVisitEditOn) {
                  handleChange('ikfAddressSiteVisit', e.target.value);
                }
              }}
              disabled={isReadOnly}
            />
          </Field>

          {/* Property Address as per site visit: Input Box (Variable Size) (Prefill from "Property Address as per documents", Edit button: OFF) [Lock UI Hover: >>Prefill from section 1, "Property Address as per documents"<<] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Property Address as per site visit</span>
                <EditSwitch
                  checked={!!fields.ikfAddressSiteVisitEditOn}
                  onChange={(checked) => {
                    handleChange('ikfAddressSiteVisitEditOn', checked);
                    if (!checked) {
                      handleChange('ikfAddressSiteVisit', docsAddress);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!fields.ikfAddressSiteVisitEditOn}
              tooltipMessage=">>Prefill from section 1, &quot;Property Address as per documents&quot;<<"
            >
              <div className="relative">
                <AutoResizeTextarea
                  rows={2}
                  placeholder="Enter property address verified physically at site visit..."
                  className={
                    fields.ikfAddressSiteVisitEditOn
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-medium focus:ring-emerald-500'
                      : 'bg-gray-100/80 text-gray-700 cursor-not-allowed font-medium'
                  }
                  value={effectiveSiteVisitAddress}
                  onChange={(e) => handleChange('ikfAddressSiteVisit', e.target.value)}
                  disabled={isReadOnly || !fields.ikfAddressSiteVisitEditOn}
                />
                {!fields.ikfAddressSiteVisitEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Prefilled from Documents
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>
        </div>
      </div>

      {/* ─── Container 3: Documentation & Area Parameters (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Documentation & Area Parameters
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Legal & Municipal Approvals
          </span>
        </div>

        <div className="space-y-5">
          {/* List of Documents received / verified: Checkbox group (Sale deed, ROR, etc.) / Input Box (Variable Size) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              List of Documents received / verified
            </label>
            <div className="p-4 bg-white rounded-lg border border-gray-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
              {DOCUMENT_CHECKLIST_OPTIONS.map((docName) => {
                const isChecked = checkedDocs.includes(docName);
                return (
                  <label
                    key={docName}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors text-xs select-none ${
                      isChecked
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'
                        : 'hover:bg-gray-50 border border-transparent text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleDocCheckboxToggle(docName)}
                      disabled={isReadOnly}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{docName}</span>
                  </label>
                );
              })}
            </div>
            <AutoResizeTextarea
              rows={2}
              placeholder="Additional details / notes on received and verified documents..."
              value={fields.ikfDocsReceivedNotes || ''}
              onChange={(e) => handleChange('ikfDocsReceivedNotes', e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          {/* Approvals for drawings from Mun. authorities / occupation certificate... [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-start gap-2 w-full">
                <span className="font-semibold text-gray-700">
                  Approvals for drawings from Mun. authorities / occupation certificate. ULC clearance / F.S.I. available and balance for future use / F.S.I. from T.D.R./ Society & Details
                </span>
                <NaCheckbox
                  checked={!!fields.ikfDrawingApprovalsAndDetailsNA}
                  onChange={(checked) => {
                    handleChange('ikfDrawingApprovalsAndDetailsNA', checked);
                    if (checked) handleChange('ikfDrawingApprovalsAndDetails', 'NA');
                    else if (fields.ikfDrawingApprovalsAndDetails === 'NA') handleChange('ikfDrawingApprovalsAndDetails', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Enter municipal drawing approvals, OC, ULC clearance, FSI details or check NA..."
              className={fields.ikfDrawingApprovalsAndDetailsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              value={fields.ikfDrawingApprovalsAndDetailsNA ? 'NA' : (fields.ikfDrawingApprovalsAndDetails || '')}
              onChange={(e) => handleChange('ikfDrawingApprovalsAndDetails', e.target.value)}
              disabled={isReadOnly || !!fields.ikfDrawingApprovalsAndDetailsNA}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Area of property (permitted as per approved plan/building byelaws) [with NA Checkbox] */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    Area of property (permitted as per approved plan/building byelaws)
                  </span>
                  <NaCheckbox
                    checked={!!fields.ikfAreaPermittedByPlanNA}
                    onChange={(checked) => {
                      handleChange('ikfAreaPermittedByPlanNA', checked);
                      if (checked) handleChange('ikfAreaPermittedByPlan', 'NA');
                      else if (fields.ikfAreaPermittedByPlan === 'NA') handleChange('ikfAreaPermittedByPlan', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.ikfAreaPermittedByPlanNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder="e.g. 1,450 Sq. Ft. / Conforms to Bye-laws"
                value={fields.ikfAreaPermittedByPlanNA ? 'NA' : (fields.ikfAreaPermittedByPlan || '')}
                onChange={(e) => handleChange('ikfAreaPermittedByPlan', e.target.value)}
                disabled={isReadOnly || !!fields.ikfAreaPermittedByPlanNA}
              />
            </Field>

            {/* Area as per sale agreement / Deeds: Input Box (Number/Text) */}
            <Field label={<span className="font-semibold text-gray-700">Area as per sale agreement / Deeds</span>}>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. 1,500 Sq. Ft. (Land Area: 3.44 Dec.)"
                value={fields.ikfAreaAsPerDeed || ''}
                onChange={(e) => handleChange('ikfAreaAsPerDeed', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Container 4: Locality & Surroundings (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Locality & Surroundings
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Neighborhood, Proximity & Accessibility
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Brief description of the property: Dropdown with Custom */}
          <Field label={<span className="font-semibold text-gray-700">Brief description of the property</span>}>
            <CustomSelect
              value={fields.ikfPropertyDescription || 'Independent House'}
              customValue={fields.ikfPropertyDescriptionCustom || ''}
              onChange={(val) => handleChange('ikfPropertyDescription', val)}
              onCustomChange={(val) => handleChange('ikfPropertyDescriptionCustom', val)}
              options={[
                { value: 'Independent House', label: 'Independent House' },
                { value: 'Apartment Flat', label: 'Apartment Flat' },
                { value: 'Group House Flat', label: 'Group House Flat' },
                { value: 'Plot', label: 'Plot' },
                { value: 'Villa', label: 'Villa' },
                { value: 'Shop', label: 'Shop' },
                { value: 'Commercial Office', label: 'Commercial Office' },
              ]}
              disabled={isReadOnly}
              placeholder="Select property description..."
            />
          </Field>

          {/* Classification of locality: Dropdown with Custom */}
          <Field label={<span className="font-semibold text-gray-700">Classification of locality</span>}>
            <CustomSelect
              value={fields.ikfLocalityClassification || 'Residential'}
              customValue={fields.ikfLocalityClassificationCustom || ''}
              onChange={(val) => handleChange('ikfLocalityClassification', val)}
              onCustomChange={(val) => handleChange('ikfLocalityClassificationCustom', val)}
              options={[
                { value: 'Residential', label: 'Residential' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Industrial', label: 'Industrial' },
                { value: 'Agricultural', label: 'Agricultural' },
              ]}
              disabled={isReadOnly}
              placeholder="Select locality classification..."
            />
          </Field>

          {/* Nature of locality: Dropdown with Custom */}
          <Field label={<span className="font-semibold text-gray-700">Nature of locality</span>}>
            <CustomSelect
              value={fields.ikfLocalityNature || 'Developing'}
              customValue={fields.ikfLocalityNatureCustom || ''}
              onChange={(val) => handleChange('ikfLocalityNature', val)}
              onCustomChange={(val) => handleChange('ikfLocalityNatureCustom', val)}
              options={[
                { value: 'Slum', label: 'Slum' },
                { value: 'Under-Developed', label: 'Under-Developed' },
                { value: 'Developing', label: 'Developing' },
                { value: 'Developed', label: 'Developed' },
              ]}
              disabled={isReadOnly}
              placeholder="Select nature of locality..."
            />
          </Field>

          {/* Marketability of the Property: Dropdown (Low / Average / Good) */}
          <Field label={<span className="font-semibold text-gray-700">Marketability of the Property</span>}>
            <select
              className={inputCls}
              value={fields.ikfMarketability || 'Good'}
              onChange={(e) => handleChange('ikfMarketability', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Low">Low</option>
              <option value="Average">Average</option>
              <option value="Good">Good</option>
            </select>
          </Field>

          {/* Railway Station [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Railway Station</span>
                <NaCheckbox
                  checked={!!fields.ikfRailwayStationNA}
                  onChange={(checked) => {
                    handleChange('ikfRailwayStationNA', checked);
                    if (checked) handleChange('ikfRailwayStation', 'NA');
                    else if (fields.ikfRailwayStation === 'NA') handleChange('ikfRailwayStation', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfRailwayStationNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Bhubaneswar Railway Station (approx. 4.5 Km)"
              value={fields.ikfRailwayStationNA ? 'NA' : (fields.ikfRailwayStation || '')}
              onChange={(e) => handleChange('ikfRailwayStation', e.target.value)}
              disabled={isReadOnly || !!fields.ikfRailwayStationNA}
            />
          </Field>

          {/* Bus Stand [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Bus Stand</span>
                <NaCheckbox
                  checked={!!fields.ikfBusStandNA}
                  onChange={(checked) => {
                    handleChange('ikfBusStandNA', checked);
                    if (checked) handleChange('ikfBusStand', 'NA');
                    else if (fields.ikfBusStand === 'NA') handleChange('ikfBusStand', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfBusStandNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Baramunda Bus Terminal (approx. 3.0 Km)"
              value={fields.ikfBusStandNA ? 'NA' : (fields.ikfBusStand || '')}
              onChange={(e) => handleChange('ikfBusStand', e.target.value)}
              disabled={isReadOnly || !!fields.ikfBusStandNA}
            />
          </Field>

          {/* Hospital [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Hospital</span>
                <NaCheckbox
                  checked={!!fields.ikfHospitalNA}
                  onChange={(checked) => {
                    handleChange('ikfHospitalNA', checked);
                    if (checked) handleChange('ikfHospital', 'NA');
                    else if (fields.ikfHospital === 'NA') handleChange('ikfHospital', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfHospitalNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. AIIMS / Capital Hospital (approx. 2.5 Km)"
              value={fields.ikfHospitalNA ? 'NA' : (fields.ikfHospital || '')}
              onChange={(e) => handleChange('ikfHospital', e.target.value)}
              disabled={isReadOnly || !!fields.ikfHospitalNA}
            />
          </Field>

          {/* Property Distance from IKFFL Branch: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Property Distance from IKFFL Branch</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Approx. 6.5 Km"
              value={fields.ikfDistanceFromBranch || ''}
              onChange={(e) => handleChange('ikfDistanceFromBranch', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Modes of transport to the property: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Modes of transport to the property</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Auto-rickshaw, City Bus, Taxi, Private Vehicles"
              value={fields.ikfModesOfTransport || ''}
              onChange={(e) => handleChange('ikfModesOfTransport', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Proximity to civic amenities: Input Box (Variable Size) */}
          <div className="md:col-span-2 lg:col-span-3">
            <Field label={<span className="font-semibold text-gray-700">Proximity to civic amenities</span>}>
              <AutoResizeTextarea
                rows={2}
                placeholder="e.g. Schools, colleges, local markets, banks, and ATMs are available within 1-2 Km radius."
                value={fields.ikfCivicAmenitiesProximity || ''}
                onChange={(e) => handleChange('ikfCivicAmenitiesProximity', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Container 5: Land Details (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Land Details
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Tenure, Demarcation & Verification
          </span>
        </div>

        <div className="space-y-4">
          {/* Land freehold or leasehold, term of lease, period expired, balance and lease rent: Input Box (Variable Size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                Land freehold or leasehold, term of lease, period expired, balance and lease rent
              </span>
            }
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="e.g. Freehold property with clear and marketable title / or Leasehold details..."
              value={fields.ikfLandTenureDetails || ''}
              onChange={(e) => handleChange('ikfLandTenureDetails', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {/* Whether property falls in the list Prohibited or unautorized properties: Radio (Yes / No) */}
            <Field
              label={
                <span className="font-semibold text-gray-700 text-xs">
                  Whether property falls in the list Prohibited or unauthorized properties
                </span>
              }
            >
              <YesNoRadio
                name="ikfPropertyProhibitedOrUnauthorized"
                value={fields.ikfPropertyProhibitedOrUnauthorized || 'No'}
                onChange={(val) => handleChange('ikfPropertyProhibitedOrUnauthorized', val)}
                disabled={isReadOnly}
                options={['Yes', 'No']}
              />
            </Field>

            {/* Property is demarcated: Radio (YES / NO) */}
            <Field label={<span className="font-semibold text-gray-700 text-xs">Property is demarcated</span>}>
              <YesNoRadio
                name="ikfPropertyDemarcated"
                value={fields.ikfPropertyDemarcated || 'YES'}
                onChange={(val) => handleChange('ikfPropertyDemarcated', val)}
                disabled={isReadOnly}
                options={['YES', 'NO']}
              />
            </Field>

            {/* Prorperty is easily identifiable: Radio (YES / NO) */}
            <Field label={<span className="font-semibold text-gray-700 text-xs">Property is easily identifiable</span>}>
              <YesNoRadio
                name="ikfPropertyIdentifiable"
                value={fields.ikfPropertyIdentifiable || 'YES'}
                onChange={(val) => handleChange('ikfPropertyIdentifiable', val)}
                disabled={isReadOnly}
                options={['YES', 'NO']}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Table 1: Land Measurements (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Table: Land Measurements
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Actual vs Document Comparison
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-700 font-bold uppercase border-b border-gray-300">
              <tr>
                <th className="py-2.5 px-4">Parameter</th>
                <th className="py-2.5 px-4">As Per Document</th>
                <th className="py-2.5 px-4">Actual at Site</th>
                <th className="py-2.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-gray-800">
                  Land Measurement / Area
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. 1,500 Sq. Ft. / 3.44 Dec."
                    value={fields.ikfLandMeasurementDoc || ''}
                    onChange={(e) => handleChange('ikfLandMeasurementDoc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. 1,500 Sq. Ft. / 3.44 Dec."
                    value={fields.ikfLandMeasurementActual || ''}
                    onChange={(e) => handleChange('ikfLandMeasurementActual', e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Matches deed boundaries"
                    value={fields.ikfLandMeasurementRemarks || ''}
                    onChange={(e) => handleChange('ikfLandMeasurementRemarks', e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Table 2: Boundaries of the Land / Boundaries of the Flat (Light Gray '#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Table: Boundaries of the Land / Boundaries of the Flat
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Four Directions Verification & Measurements
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-700 font-bold uppercase border-b border-gray-300">
              <tr>
                <th className="py-2.5 px-4 w-28">Direction</th>
                <th className="py-2.5 px-4">As Per Document</th>
                <th className="py-2.5 px-4">Actual at Site</th>
                <th className="py-2.5 px-4">Measurement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {[
                { dir: 'East', key: 'East' },
                { dir: 'West', key: 'West' },
                { dir: 'North', key: 'North' },
                { dir: 'South', key: 'South' },
              ].map(({ dir, key }) => {
                const docKey = `ikfBound${key}Doc`;
                const docNaKey = `ikfBound${key}DocNA`;
                const actualKey = `ikfBound${key}Actual`;
                const actualNaKey = `ikfBound${key}ActualNA`;
                const measKey = `ikfBound${key}Meas`;
                const measNaKey = `ikfBound${key}MeasNA`;

                const isDocNA = !!fields[docNaKey];
                const isActualNA = !!fields[actualNaKey];
                const isMeasNA = !!fields[measNaKey];

                return (
                  <tr key={dir} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-bold text-gray-800 uppercase tracking-wide text-xs">
                      {dir}
                    </td>

                    {/* As Per Document */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${
                            isDocNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                          }`}
                          placeholder={`e.g. Plot / Road on ${dir}`}
                          value={isDocNA ? 'NA' : (fields[docKey] || '')}
                          onChange={(e) => handleChange(docKey, e.target.value)}
                          disabled={isReadOnly || isDocNA}
                        />
                        <NaCheckbox
                          checked={isDocNA}
                          onChange={(checked) => {
                            handleChange(docNaKey, checked);
                            if (checked) handleChange(docKey, 'NA');
                            else if (fields[docKey] === 'NA') handleChange(docKey, '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* Actual at Site */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${
                            isActualNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                          }`}
                          placeholder={`e.g. Plot / Road on ${dir}`}
                          value={isActualNA ? 'NA' : (fields[actualKey] || '')}
                          onChange={(e) => handleChange(actualKey, e.target.value)}
                          disabled={isReadOnly || isActualNA}
                        />
                        <NaCheckbox
                          checked={isActualNA}
                          onChange={(checked) => {
                            handleChange(actualNaKey, checked);
                            if (checked) handleChange(actualKey, 'NA');
                            else if (fields[actualKey] === 'NA') handleChange(actualKey, '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* Measurement */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${
                            isMeasNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                          }`}
                          placeholder="e.g. 50'-0&quot;"
                          value={isMeasNA ? 'NA' : (fields[measKey] || '')}
                          onChange={(e) => handleChange(measKey, e.target.value)}
                          disabled={isReadOnly || isMeasNA}
                        />
                        <NaCheckbox
                          checked={isMeasNA}
                          onChange={(checked) => {
                            handleChange(measNaKey, checked);
                            if (checked) handleChange(measKey, 'NA');
                            else if (fields[measKey] === 'NA') handleChange(measKey, '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: II) DETAILS OF STRUCTURE AND SPECIFICATIONS Component ───────

const CRITICAL_OBSERVATION_OPTIONS = [
  'Railway Track (within 50m)',
  'Nala > 10 feet / Open Drain',
  'Lake / River / Water Body',
  'High Tension Power Line (HT Line)',
  'Graveyard / Cremation Ground',
  'Low Lying / Water Logging Area',
  'Steep Slope / Hilly Terrain',
  'Industrial Pollution / Hazardous Unit',
  'No Critical Observations (Clear / Favorable)',
];

export function StructureAndSpecificationsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Auto-calculated age & future life based on "Year of construction" vs Current Year:
  const calculatedAge = useMemo(() => {
    const yoc = parseInt(fields.ikfYearOfConstruction || '', 10);
    if (!isNaN(yoc) && yoc > 1800 && yoc <= currentYear) {
      const age = currentYear - yoc;
      const expectedLife = 60; // standard RCC design life
      const futureLife = Math.max(0, expectedLife - age);
      return `${age} Years (Anticipated Future Life: ${futureLife} Years)`;
    }
    return '';
  }, [fields.ikfYearOfConstruction, currentYear]);

  const effectiveAgeAndLife = fields.ikfAgeAndLifeOfBuildingEditOn
    ? (fields.ikfAgeAndLifeOfBuilding ?? '')
    : (fields.ikfAgeAndLifeOfBuilding || calculatedAge || 'Age: 0 Years (Future Life: 60 Years)');

  // Parse critical observations
  const checkedObs: string[] = useMemo(() => {
    if (Array.isArray(fields.ikfCriticalObservations)) return fields.ikfCriticalObservations;
    if (typeof fields.ikfCriticalObservations === 'string') {
      try {
        const parsed = JSON.parse(fields.ikfCriticalObservations);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return fields.ikfCriticalObservations.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [fields.ikfCriticalObservations]);

  const handleObsToggle = (obs: string) => {
    let next: string[];
    if (checkedObs.includes(obs)) {
      next = checkedObs.filter((o) => o !== obs);
    } else {
      next = [...checkedObs, obs];
    }
    handleChange('ikfCriticalObservations', next);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container: Building Information (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Building Information
            </h3>
          </div>
          <span className="text-xs text-blue-800 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Structural Details & Specifications
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Year of construction of the building: Input Box (Number/Year) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Year of construction of the building</span>
                <NaCheckbox
                  checked={!!fields.ikfYearOfConstructionNA}
                  onChange={(checked) => {
                    handleChange('ikfYearOfConstructionNA', checked);
                    if (checked) handleChange('ikfYearOfConstruction', 'NA');
                    else if (fields.ikfYearOfConstruction === 'NA') handleChange('ikfYearOfConstruction', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfYearOfConstructionNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 2018"
              value={fields.ikfYearOfConstructionNA ? 'NA' : (fields.ikfYearOfConstruction || '')}
              onChange={(e) => handleChange('ikfYearOfConstruction', e.target.value)}
              disabled={isReadOnly || !!fields.ikfYearOfConstructionNA}
            />
          </Field>

          {/* Age of the building and anticipated future life of the building: Input Box (Number) (Auto-calculate Age based on "Year of construction" vs Current Year, Edit button: OFF) [with NA Checkbox] [Lock UI Hover: >>Auto calculating from [Current Year - Year of construction of the building]<<] */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    Age of the building and anticipated future life of the building
                  </span>
                  <div className="flex items-center gap-3">
                    <NaCheckbox
                      checked={!!fields.ikfAgeAndLifeOfBuildingNA}
                      onChange={(checked) => {
                        handleChange('ikfAgeAndLifeOfBuildingNA', checked);
                        if (checked) handleChange('ikfAgeAndLifeOfBuilding', 'NA');
                        else if (fields.ikfAgeAndLifeOfBuilding === 'NA') handleChange('ikfAgeAndLifeOfBuilding', '');
                      }}
                      disabled={isReadOnly}
                    />
                    <EditSwitch
                      checked={!!fields.ikfAgeAndLifeOfBuildingEditOn}
                      onChange={(checked) => {
                        handleChange('ikfAgeAndLifeOfBuildingEditOn', checked);
                        if (!checked) {
                          handleChange('ikfAgeAndLifeOfBuilding', calculatedAge);
                        }
                      }}
                      disabled={isReadOnly || !!fields.ikfAgeAndLifeOfBuildingNA}
                    />
                  </div>
                </div>
              }
            >
              <LockedFieldWrapper
                isLocked={!fields.ikfAgeAndLifeOfBuildingEditOn && !fields.ikfAgeAndLifeOfBuildingNA}
                tooltipMessage=">>Auto calculating from [Current Year - Year of construction of the building]<<"
              >
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputCls} ${
                      fields.ikfAgeAndLifeOfBuildingNA
                        ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed'
                        : fields.ikfAgeAndLifeOfBuildingEditOn
                        ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-medium focus:ring-emerald-500'
                        : 'bg-gray-100/80 text-gray-700 cursor-not-allowed font-medium'
                    }`}
                    placeholder="e.g. 8 Years (Anticipated Future Life: 52 Years)"
                    value={
                      fields.ikfAgeAndLifeOfBuildingNA
                        ? 'NA'
                        : effectiveAgeAndLife
                    }
                    onChange={(e) => handleChange('ikfAgeAndLifeOfBuilding', e.target.value)}
                    disabled={isReadOnly || !!fields.ikfAgeAndLifeOfBuildingNA || !fields.ikfAgeAndLifeOfBuildingEditOn}
                  />
                  {!fields.ikfAgeAndLifeOfBuildingEditOn && !fields.ikfAgeAndLifeOfBuildingNA && (
                    <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Auto-calculated
                    </div>
                  )}
                </div>
              </LockedFieldWrapper>
            </Field>
          </div>

          {/* Present condition of the flat or building or Structure: Dropdown (Excellent / Good / Average / Poor / Not Applicable / Custom) [Custom Option: ON] */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                Present condition of the flat or building or Structure
              </span>
            }
          >
            <CustomSelect
              value={fields.ikfPresentCondition || 'Good'}
              customValue={fields.ikfPresentConditionCustom || ''}
              onChange={(val) => handleChange('ikfPresentCondition', val)}
              onCustomChange={(val) => handleChange('ikfPresentConditionCustom', val)}
              options={[
                { value: 'Excellent', label: 'Excellent' },
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
                { value: 'Not Applicable', label: 'Not Applicable' },
              ]}
              disabled={isReadOnly}
              placeholder="Select condition..."
            />
          </Field>

          {/* Type of construction: Dropdown (RCC / Load Bearing / ACC / Mangalore Roof / Plot / Custom) [Custom Option: ON] */}
          <Field label={<span className="font-semibold text-gray-700">Type of construction</span>}>
            <CustomSelect
              value={fields.ikfTypeOfConstruction || 'RCC'}
              customValue={fields.ikfTypeOfConstructionCustom || ''}
              onChange={(val) => handleChange('ikfTypeOfConstruction', val)}
              onCustomChange={(val) => handleChange('ikfTypeOfConstructionCustom', val)}
              options={[
                { value: 'RCC', label: 'RCC' },
                { value: 'Load Bearing', label: 'Load Bearing' },
                { value: 'ACC', label: 'ACC' },
                { value: 'Mangalore Roof', label: 'Mangalore Roof' },
                { value: 'Plot', label: 'Plot' },
              ]}
              disabled={isReadOnly}
              placeholder="Select construction type..."
            />
          </Field>

          {/* Permitted use of the property: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Permitted use of the property</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Residential"
              value={fields.ikfPermittedUse ?? (fields.propertyType || 'Residential')}
              onChange={(e) => handleChange('ikfPermittedUse', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Actual use of the Property: Input Box (Text) */}
          <Field label={<span className="font-semibold text-gray-700">Actual use of the Property</span>}>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Residential (Self-Occupied)"
              value={fields.ikfActualUse ?? (fields.propertyType || 'Residential (Self-Occupied)')}
              onChange={(e) => handleChange('ikfActualUse', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* No. of floors for building and additional structures: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  No. of floors for building and additional structures
                </span>
                <NaCheckbox
                  checked={!!fields.ikfNoOfFloorsNA}
                  onChange={(checked) => {
                    handleChange('ikfNoOfFloorsNA', checked);
                    if (checked) handleChange('ikfNoOfFloors', 'NA');
                    else if (fields.ikfNoOfFloors === 'NA') handleChange('ikfNoOfFloors', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfNoOfFloorsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. G + 1 Floor"
              value={fields.ikfNoOfFloorsNA ? 'NA' : (fields.ikfNoOfFloors || '')}
              onChange={(e) => handleChange('ikfNoOfFloors', e.target.value)}
              disabled={isReadOnly || !!fields.ikfNoOfFloorsNA}
            />
          </Field>

          {/* No. of lifts with capacity and type: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">No. of lifts with capacity and type</span>
                <NaCheckbox
                  checked={!!fields.ikfNoOfLiftsNA}
                  onChange={(checked) => {
                    handleChange('ikfNoOfLiftsNA', checked);
                    if (checked) handleChange('ikfNoOfLifts', 'NA');
                    else if (fields.ikfNoOfLifts === 'NA') handleChange('ikfNoOfLifts', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfNoOfLiftsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 1 Lift (6 Passenger) / NA"
              value={fields.ikfNoOfLiftsNA ? 'NA' : (fields.ikfNoOfLifts || '')}
              onChange={(e) => handleChange('ikfNoOfLifts', e.target.value)}
              disabled={isReadOnly || !!fields.ikfNoOfLiftsNA}
            />
          </Field>

          {/* Type of underground, overhead tanks and pumps: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  Type of underground, overhead tanks and pumps
                </span>
                <NaCheckbox
                  checked={!!fields.ikfTanksAndPumpsNA}
                  onChange={(checked) => {
                    handleChange('ikfTanksAndPumpsNA', checked);
                    if (checked) handleChange('ikfTanksAndPumps', 'NA');
                    else if (fields.ikfTanksAndPumps === 'NA') handleChange('ikfTanksAndPumps', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfTanksAndPumpsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. PVC Syntex OHT 1000L with 0.5 HP Pump"
              value={fields.ikfTanksAndPumpsNA ? 'NA' : (fields.ikfTanksAndPumps || '')}
              onChange={(e) => handleChange('ikfTanksAndPumps', e.target.value)}
              disabled={isReadOnly || !!fields.ikfTanksAndPumpsNA}
            />
          </Field>

          {/* Flooring in open spaces and stilts and staircase: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  Flooring in open spaces and stilts and staircase
                </span>
                <NaCheckbox
                  checked={!!fields.ikfFlooringOpenStiltsStairsNA}
                  onChange={(checked) => {
                    handleChange('ikfFlooringOpenStiltsStairsNA', checked);
                    if (checked) handleChange('ikfFlooringOpenStiltsStairs', 'NA');
                    else if (fields.ikfFlooringOpenStiltsStairs === 'NA') handleChange('ikfFlooringOpenStiltsStairs', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfFlooringOpenStiltsStairsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. PCC / Paver Tiles in open, Marble/Tiles in staircase"
              value={fields.ikfFlooringOpenStiltsStairsNA ? 'NA' : (fields.ikfFlooringOpenStiltsStairs || '')}
              onChange={(e) => handleChange('ikfFlooringOpenStiltsStairs', e.target.value)}
              disabled={isReadOnly || !!fields.ikfFlooringOpenStiltsStairsNA}
            />
          </Field>

          {/* Compound wall and gates & security: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Compound wall and gates & security</span>
                <NaCheckbox
                  checked={!!fields.ikfCompoundWallAndGateNA}
                  onChange={(checked) => {
                    handleChange('ikfCompoundWallAndGateNA', checked);
                    if (checked) handleChange('ikfCompoundWallAndGate', 'NA');
                    else if (fields.ikfCompoundWallAndGate === 'NA') handleChange('ikfCompoundWallAndGate', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfCompoundWallAndGateNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Brick wall up to 5 ft height with MS Iron Gate"
              value={fields.ikfCompoundWallAndGateNA ? 'NA' : (fields.ikfCompoundWallAndGate || '')}
              onChange={(e) => handleChange('ikfCompoundWallAndGate', e.target.value)}
              disabled={isReadOnly || !!fields.ikfCompoundWallAndGateNA}
            />
          </Field>

          {/* Building elevation: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Building elevation</span>
                <NaCheckbox
                  checked={!!fields.ikfBuildingElevationNA}
                  onChange={(checked) => {
                    handleChange('ikfBuildingElevationNA', checked);
                    if (checked) handleChange('ikfBuildingElevation', 'NA');
                    else if (fields.ikfBuildingElevation === 'NA') handleChange('ikfBuildingElevation', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfBuildingElevationNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Standard aesthetic finish with weather coat painting"
              value={fields.ikfBuildingElevationNA ? 'NA' : (fields.ikfBuildingElevation || '')}
              onChange={(e) => handleChange('ikfBuildingElevation', e.target.value)}
              disabled={isReadOnly || !!fields.ikfBuildingElevationNA}
            />
          </Field>

          {/* Critical Observations at the Property / Boundary: Checkbox group (Railway Track, Nala >10 feet, Lake, etc.) with Input Box for "Other" [with NA Checkbox] */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    Critical Observations at the Property / Boundary
                  </span>
                  <NaCheckbox
                    checked={!!fields.ikfCriticalObservationsNA}
                    onChange={(checked) => {
                      handleChange('ikfCriticalObservationsNA', checked);
                      if (checked) {
                        handleChange('ikfCriticalObservations', ['NA']);
                        handleChange('ikfCriticalObservationsOther', 'NA');
                      } else {
                        handleChange('ikfCriticalObservations', []);
                        handleChange('ikfCriticalObservationsOther', '');
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className={`p-4 rounded-lg border border-blue-200 transition-colors ${fields.ikfCriticalObservationsNA ? 'bg-gray-100/90' : 'bg-white'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
                  {CRITICAL_OBSERVATION_OPTIONS.map((obs) => {
                    const isChecked = checkedObs.includes(obs);
                    return (
                      <label
                        key={obs}
                        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors text-xs select-none ${
                          fields.ikfCriticalObservationsNA
                            ? 'opacity-50 cursor-not-allowed'
                            : isChecked
                            ? 'bg-blue-50 border border-blue-300 text-blue-900 font-medium'
                            : 'hover:bg-gray-50 border border-transparent text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleObsToggle(obs)}
                          disabled={isReadOnly || !!fields.ikfCriticalObservationsNA}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{obs}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <input
                    type="text"
                    className={`${inputCls} ${fields.ikfCriticalObservationsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    placeholder="Other critical observations (if any)..."
                    value={fields.ikfCriticalObservationsNA ? 'NA' : (fields.ikfCriticalObservationsOther || '')}
                    onChange={(e) => handleChange('ikfCriticalObservationsOther', e.target.value)}
                    disabled={isReadOnly || !!fields.ikfCriticalObservationsNA}
                  />
                </div>
              </div>
            </Field>
          </div>

          {/* Other amenities and special amenities and features: Input Box (Variable Size) [with NA Checkbox] */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    Other amenities and special amenities and features
                  </span>
                  <NaCheckbox
                    checked={!!fields.ikfOtherAmenitiesFeaturesNA}
                    onChange={(checked) => {
                      handleChange('ikfOtherAmenitiesFeaturesNA', checked);
                      if (checked) handleChange('ikfOtherAmenitiesFeatures', 'NA');
                      else if (fields.ikfOtherAmenitiesFeatures === 'NA') handleChange('ikfOtherAmenitiesFeatures', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                rows={2}
                placeholder="e.g. 24-hr Water Supply, Concealed Copper Wiring, Good Quality Sanitary Fittings, etc."
                className={fields.ikfOtherAmenitiesFeaturesNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
                value={fields.ikfOtherAmenitiesFeaturesNA ? 'NA' : (fields.ikfOtherAmenitiesFeatures || '')}
                onChange={(e) => handleChange('ikfOtherAmenitiesFeatures', e.target.value)}
                disabled={isReadOnly || !!fields.ikfOtherAmenitiesFeaturesNA}
              />
            </Field>
          </div>

          {/* General comments on specifications: Input Box (Variable Size) [with NA Checkbox] */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    General comments on specifications
                  </span>
                  <NaCheckbox
                    checked={!!fields.ikfGeneralCommentsSpecificationsNA}
                    onChange={(checked) => {
                      handleChange('ikfGeneralCommentsSpecificationsNA', checked);
                      if (checked) handleChange('ikfGeneralCommentsSpecifications', 'NA');
                      else if (fields.ikfGeneralCommentsSpecifications === 'NA') handleChange('ikfGeneralCommentsSpecifications', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                rows={2}
                placeholder="e.g. The building is constructed with quality workmanship and standard materials. Maintenance level is good and structure is sound."
                className={fields.ikfGeneralCommentsSpecificationsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
                value={fields.ikfGeneralCommentsSpecificationsNA ? 'NA' : (fields.ikfGeneralCommentsSpecifications || '')}
                onChange={(e) => handleChange('ikfGeneralCommentsSpecifications', e.target.value)}
                disabled={isReadOnly || !!fields.ikfGeneralCommentsSpecificationsNA}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── IKF Finance BankConfig ──────────────────────────────────────────────────

export const IKF_FINANCE_CONFIG: BankConfig = {
  bankId: 'IKF FINANCE',
  subTemplateId: '',
  displayName: 'IKF Finance',
  hiddenSections: [
    'section-1', // Replaced by Section 1: VALUATION REPORT
    'section-2', // Replaced by Section 2: II) DETAILS OF STRUCTURE AND SPECIFICATIONS
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'ikf-section-1', title: 'VALUATION REPORT' },
    { id: 'ikf-section-2', title: 'II) DETAILS OF STRUCTURE AND SPECIFICATIONS' },
    { id: 'section-3', title: 'Property Details' },
    { id: 'section-4', title: 'Subject Property' },
    { id: 'section-5', title: 'Street and Details' },
    { id: 'section-6', title: 'Plan Approvals' },
    { id: 'section-7', title: 'Area Valuation' },
    { id: 'section-8', title: 'Land Valuation' },
    { id: 'section-9', title: 'Valuation Abstract' },
    { id: 'section-10', title: 'Remarks' },
    { id: 'section-12', title: 'Certificate' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'section-11', title: 'Photographs' },
    { id: 'annexures', title: 'Annexures' },
  ],
  extraSectionsStart: [
    {
      id: 'ikf-section-1',
      title: 'VALUATION REPORT',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <ValuationReportSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'ikf-section-2',
      title: 'II) DETAILS OF STRUCTURE AND SPECIFICATIONS',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <StructureAndSpecificationsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ],
  defaultValues: {
    purpose: 'Mortgage / MSME Loan',
    ikfCustomerPresent: 'YES',
    ikfPropertyProhibitedOrUnauthorized: 'No',
    ikfPropertyDemarcated: 'YES',
    ikfPropertyIdentifiable: 'YES',
    ikfBranch: 'Bhubaneswar',
    ikfMarketability: 'Good',
    ikfPresentCondition: 'Good',
    ikfTypeOfConstruction: 'RCC',
  },
};

export default function IKFFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={IKF_FINANCE_CONFIG} {...props} />;
}

