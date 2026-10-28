'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, FileText, CheckCircle2, Building, MapPin, Ruler, Compass, Home, Plus, Trash2, ShieldAlert, Leaf, Calculator, Navigation, Zap, Upload, Image as ImageIcon, Calendar } from 'lucide-react';

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
              value={fields.refNo || fields.ikfRefNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
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

// ─── Section 3: III) DETAILS FOR THE PROPERTY UNDER REFERENCE Component ──────

export function PropertyUnderReferenceSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // Area considered for the purpose of valuation: (Prefill from "Area as per sale agreement", Edit button: OFF)
  const defaultArea = fields.ikfAreaAsPerDeed || '';
  const effectiveAreaConsidered = fields.ikfAreaConsideredForValuationEditOn
    ? (fields.ikfAreaConsideredForValuation ?? '')
    : (fields.ikfAreaConsideredForValuation || defaultArea);

  // Table 14: Adherence to Sanction Plan rows
  const adherenceRows = useMemo(() => {
    if (Array.isArray(fields.ikfAdherenceFloorRows) && fields.ikfAdherenceFloorRows.length > 0) {
      return fields.ikfAdherenceFloorRows;
    }
    return [
      { id: '1', floor: 'Ground Floor', permissible: '', permissibleNA: false, actual: '', actualNA: false, remarks: '', remarksNA: false },
      { id: '2', floor: 'First Floor', permissible: '', permissibleNA: false, actual: '', actualNA: false, remarks: '', remarksNA: false },
      { id: '3', floor: 'Second Floor', permissible: '', permissibleNA: false, actual: '', actualNA: false, remarks: '', remarksNA: false },
    ];
  }, [fields.ikfAdherenceFloorRows]);

  const updateAdherenceRow = (idx: number, fieldName: string, val: any) => {
    const updated = adherenceRows.map((row: any, i: number) => {
      if (i === idx) {
        return { ...row, [fieldName]: val };
      }
      return row;
    });
    handleChange('ikfAdherenceFloorRows', updated);
  };

  const addAdherenceRow = () => {
    const newRow = {
      id: Date.now().toString(),
      floor: `Floor ${adherenceRows.length + 1}`,
      permissible: '',
      permissibleNA: false,
      actual: '',
      actualNA: false,
      remarks: '',
      remarksNA: false,
    };
    handleChange('ikfAdherenceFloorRows', [...adherenceRows, newRow]);
  };

  const removeAdherenceRow = (idx: number) => {
    if (adherenceRows.length <= 1) return;
    const updated = adherenceRows.filter((_: any, i: number) => i !== idx);
    handleChange('ikfAdherenceFloorRows', updated);
  };

  // Table 17: Property Currently Occupied by & Future / Present Rental Value
  const rentalRows = useMemo(() => {
    if (Array.isArray(fields.ikfRentalValueRows) && fields.ikfRentalValueRows.length > 0) {
      return fields.ikfRentalValueRows;
    }
    return [
      { id: '1', byelaws: 'Residential (As per norms)', byelawsNA: false, units: '1', unitsNA: false, typeOfUnit: '2 BHK', typeOfUnitNA: false, rentPm: '10,000', rentPmNA: false, occupiedBy: 'Self-Occupied', occupiedByNA: false },
      { id: '2', byelaws: 'Residential (As per norms)', byelawsNA: false, units: '1', unitsNA: false, typeOfUnit: '2 BHK', typeOfUnitNA: false, rentPm: '8,000', rentPmNA: false, occupiedBy: 'Tenant', occupiedByNA: false },
    ];
  }, [fields.ikfRentalValueRows]);

  const updateRentalRow = (idx: number, fieldName: string, val: any) => {
    const updated = rentalRows.map((row: any, i: number) => {
      if (i === idx) {
        return { ...row, [fieldName]: val };
      }
      return row;
    });
    handleChange('ikfRentalValueRows', updated);
  };

  const addRentalRow = () => {
    const newRow = {
      id: Date.now().toString(),
      byelaws: 'Residential',
      byelawsNA: false,
      units: '1',
      unitsNA: false,
      typeOfUnit: 'Unit',
      typeOfUnitNA: false,
      rentPm: '',
      rentPmNA: false,
      occupiedBy: 'Self-Occupied',
      occupiedByNA: false,
    };
    handleChange('ikfRentalValueRows', [...rentalRows, newRow]);
  };

  const removeRentalRow = (idx: number) => {
    if (rentalRows.length <= 1) return;
    const updated = rentalRows.filter((_: any, i: number) => i !== idx);
    handleChange('ikfRentalValueRows', updated);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container: Property Particulars (Light Green '#e8f5e9') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-emerald-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Property Particulars
            </h3>
          </div>
          <span className="text-xs text-emerald-800 font-medium bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
            Internal Details, Finishes & Valuation Parameters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* No. of floors and flats on each floor: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">No. of floors and flats on each floor</span>
                <NaCheckbox
                  checked={!!fields.ikfFloorsAndFlatsOnEachNA}
                  onChange={(checked) => {
                    handleChange('ikfFloorsAndFlatsOnEachNA', checked);
                    if (checked) handleChange('ikfFloorsAndFlatsOnEach', 'NA');
                    else if (fields.ikfFloorsAndFlatsOnEach === 'NA') handleChange('ikfFloorsAndFlatsOnEach', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfFloorsAndFlatsOnEachNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. G+1 Floors, 1 Flat per floor"
              value={fields.ikfFloorsAndFlatsOnEachNA ? 'NA' : (fields.ikfFloorsAndFlatsOnEach || '')}
              onChange={(e) => handleChange('ikfFloorsAndFlatsOnEach', e.target.value)}
              disabled={isReadOnly || !!fields.ikfFloorsAndFlatsOnEachNA}
            />
          </Field>

          {/* No. of rooms/portions for the building: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">No. of rooms/portions for the building</span>
                <NaCheckbox
                  checked={!!fields.ikfRoomsPortionsBuildingNA}
                  onChange={(checked) => {
                    handleChange('ikfRoomsPortionsBuildingNA', checked);
                    if (checked) handleChange('ikfRoomsPortionsBuilding', 'NA');
                    else if (fields.ikfRoomsPortionsBuilding === 'NA') handleChange('ikfRoomsPortionsBuilding', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfRoomsPortionsBuildingNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Ground Floor: 2 BHK, First Floor: 2 BHK"
              value={fields.ikfRoomsPortionsBuildingNA ? 'NA' : (fields.ikfRoomsPortionsBuilding || '')}
              onChange={(e) => handleChange('ikfRoomsPortionsBuilding', e.target.value)}
              disabled={isReadOnly || !!fields.ikfRoomsPortionsBuildingNA}
            />
          </Field>

          {/* Balconies to rooms separate or merged: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Balconies to rooms separate or merged</span>
                <NaCheckbox
                  checked={!!fields.ikfBalconiesSeparateOrMergedNA}
                  onChange={(checked) => {
                    handleChange('ikfBalconiesSeparateOrMergedNA', checked);
                    if (checked) handleChange('ikfBalconiesSeparateOrMerged', 'NA');
                    else if (fields.ikfBalconiesSeparateOrMerged === 'NA') handleChange('ikfBalconiesSeparateOrMerged', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfBalconiesSeparateOrMergedNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Separate balconies provided in front & rear"
              value={fields.ikfBalconiesSeparateOrMergedNA ? 'NA' : (fields.ikfBalconiesSeparateOrMerged || '')}
              onChange={(e) => handleChange('ikfBalconiesSeparateOrMerged', e.target.value)}
              disabled={isReadOnly || !!fields.ikfBalconiesSeparateOrMergedNA}
            />
          </Field>

          {/* Walls, plaster and painting: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Walls, plaster and painting</span>
                <NaCheckbox
                  checked={!!fields.ikfWallsPlasterPaintingNA}
                  onChange={(checked) => {
                    handleChange('ikfWallsPlasterPaintingNA', checked);
                    if (checked) handleChange('ikfWallsPlasterPainting', 'NA');
                    else if (fields.ikfWallsPlasterPainting === 'NA') handleChange('ikfWallsPlasterPainting', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfWallsPlasterPaintingNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Brick masonry, cement plaster with emulsion/OBD paint"
              value={fields.ikfWallsPlasterPaintingNA ? 'NA' : (fields.ikfWallsPlasterPainting || '')}
              onChange={(e) => handleChange('ikfWallsPlasterPainting', e.target.value)}
              disabled={isReadOnly || !!fields.ikfWallsPlasterPaintingNA}
            />
          </Field>

          {/* Doors and windows: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Doors and windows</span>
                <NaCheckbox
                  checked={!!fields.ikfDoorsAndWindowsNA}
                  onChange={(checked) => {
                    handleChange('ikfDoorsAndWindowsNA', checked);
                    if (checked) handleChange('ikfDoorsAndWindows', 'NA');
                    else if (fields.ikfDoorsAndWindows === 'NA') handleChange('ikfDoorsAndWindows', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfDoorsAndWindowsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Teak wood panel main door, flush doors, aluminium glass windows"
              value={fields.ikfDoorsAndWindowsNA ? 'NA' : (fields.ikfDoorsAndWindows || '')}
              onChange={(e) => handleChange('ikfDoorsAndWindows', e.target.value)}
              disabled={isReadOnly || !!fields.ikfDoorsAndWindowsNA}
            />
          </Field>

          {/* Type of flooring in rooms, skirting/cladding: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Type of flooring in rooms, skirting/cladding</span>
                <NaCheckbox
                  checked={!!fields.ikfFlooringRoomsSkirtingNA}
                  onChange={(checked) => {
                    handleChange('ikfFlooringRoomsSkirtingNA', checked);
                    if (checked) handleChange('ikfFlooringRoomsSkirting', 'NA');
                    else if (fields.ikfFlooringRoomsSkirting === 'NA') handleChange('ikfFlooringRoomsSkirting', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfFlooringRoomsSkirtingNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Vitrified tiles flooring with 4&quot; matching skirting"
              value={fields.ikfFlooringRoomsSkirtingNA ? 'NA' : (fields.ikfFlooringRoomsSkirting || '')}
              onChange={(e) => handleChange('ikfFlooringRoomsSkirting', e.target.value)}
              disabled={isReadOnly || !!fields.ikfFlooringRoomsSkirtingNA}
            />
          </Field>

          {/* Deviation from sanction Plan/building byelaws (if any): Input Box (Variable Size) [with NA Checkbox] */}
          <div className="md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    Deviation from sanction Plan/building byelaws (if any)
                  </span>
                  <NaCheckbox
                    checked={!!fields.ikfDeviationSanctionPlanNA}
                    onChange={(checked) => {
                      handleChange('ikfDeviationSanctionPlanNA', checked);
                      if (checked) handleChange('ikfDeviationSanctionPlan', 'NA');
                      else if (fields.ikfDeviationSanctionPlan === 'NA') handleChange('ikfDeviationSanctionPlan', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                rows={2}
                placeholder="e.g. No major deviation observed. Construction adheres substantially to approved norms / or detail deviations..."
                className={fields.ikfDeviationSanctionPlanNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
                value={fields.ikfDeviationSanctionPlanNA ? 'NA' : (fields.ikfDeviationSanctionPlan || '')}
                onChange={(e) => handleChange('ikfDeviationSanctionPlan', e.target.value)}
                disabled={isReadOnly || !!fields.ikfDeviationSanctionPlanNA}
              />
            </Field>
          </div>

          {/* Risk of Demolition (valuers views): Dropdown (Low / Medium / High / NA) */}
          <Field label={<span className="font-semibold text-gray-700">Risk of Demolition (valuers views)</span>}>
            <select
              className={inputCls}
              value={fields.ikfRiskOfDemolition || 'Low'}
              onChange={(e) => handleChange('ikfRiskOfDemolition', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="NA">NA</option>
            </select>
          </Field>

          {/* Area considered for the purpose of valuation: Input Box (Number) (Prefill from "Area as per sale agreement", Edit button: OFF) [Lock UI Hover: >>Prefill from section 1, "Area as per sale agreement / Deeds"<<] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Area considered for the purpose of valuation</span>
                <EditSwitch
                  checked={!!fields.ikfAreaConsideredForValuationEditOn}
                  onChange={(checked) => {
                    handleChange('ikfAreaConsideredForValuationEditOn', checked);
                    if (!checked) {
                      handleChange('ikfAreaConsideredForValuation', defaultArea);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!fields.ikfAreaConsideredForValuationEditOn}
              tooltipMessage=">>Prefill from section 1, &quot;Area as per sale agreement / Deeds&quot;<<"
            >
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} ${
                    fields.ikfAreaConsideredForValuationEditOn
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-medium focus:ring-emerald-500'
                      : 'bg-gray-100/80 text-gray-700 cursor-not-allowed font-medium'
                  }`}
                  placeholder="e.g. 1,500 Sq. Ft."
                  value={effectiveAreaConsidered}
                  onChange={(e) => handleChange('ikfAreaConsideredForValuation', e.target.value)}
                  disabled={isReadOnly || !fields.ikfAreaConsideredForValuationEditOn}
                />
                {!fields.ikfAreaConsideredForValuationEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Prefilled from Deeds Area
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Market rates of properties in the vicinity and surrounding area: Input Box (Text) */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                Market rates of properties in the vicinity and surrounding area
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Rs. 3,200 - 3,500 per Sq. Ft."
              value={fields.ikfMarketRateVicinity || ''}
              onChange={(e) => handleChange('ikfMarketRateVicinity', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Govt. Guideline Value for the Property (Land & Building): Input Box (Number/Text) [with NA Checkbox] */}
          <div className="md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    Govt. Guideline Value for the Property (Land & Building)
                  </span>
                  <NaCheckbox
                    checked={!!fields.ikfGovtGuidelineValueNA}
                    onChange={(checked) => {
                      handleChange('ikfGovtGuidelineValueNA', checked);
                      if (checked) handleChange('ikfGovtGuidelineValue', 'NA');
                      else if (fields.ikfGovtGuidelineValue === 'NA') handleChange('ikfGovtGuidelineValue', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.ikfGovtGuidelineValueNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder="e.g. Rs. 2,000 per Sq. Ft. / Benchmark value: Rs. 18,00,000"
                value={fields.ikfGovtGuidelineValueNA ? 'NA' : (fields.ikfGovtGuidelineValue || '')}
                onChange={(e) => handleChange('ikfGovtGuidelineValue', e.target.value)}
                disabled={isReadOnly || !!fields.ikfGovtGuidelineValueNA}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Table: 14. Adherence to Sanction Plan/building byelaws (Light Green '#e8f5e9') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-emerald-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              14. Adherence to Sanction Plan / Building Byelaws
            </h3>
          </div>
          <button
            type="button"
            onClick={addAdherenceRow}
            disabled={isReadOnly}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Floor Row
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-emerald-100/70 text-gray-800 font-bold uppercase border-b border-gray-300">
              <tr>
                <th className="py-2.5 px-3 w-36">Floor / Level</th>
                <th className="py-2.5 px-3">Permissible Area (Sq. Ft.)</th>
                <th className="py-2.5 px-3">Actual Constructed (Sq. Ft.)</th>
                <th className="py-2.5 px-3">Deviation / Adherence Remarks</th>
                {!isReadOnly && <th className="py-2.5 px-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {adherenceRows.map((row: any, idx: number) => {
                return (
                  <tr key={row.id || idx} className="hover:bg-gray-50/70">
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        className={inputCls}
                        value={row.floor || ''}
                        onChange={(e) => updateAdherenceRow(idx, 'floor', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Floor name..."
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.permissibleNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. 750"
                          value={row.permissibleNA ? 'NA' : (row.permissible || '')}
                          onChange={(e) => updateAdherenceRow(idx, 'permissible', e.target.value)}
                          disabled={isReadOnly || !!row.permissibleNA}
                        />
                        <NaCheckbox
                          checked={!!row.permissibleNA}
                          onChange={(checked) => {
                            updateAdherenceRow(idx, 'permissibleNA', checked);
                            if (checked) updateAdherenceRow(idx, 'permissible', 'NA');
                            else if (row.permissible === 'NA') updateAdherenceRow(idx, 'permissible', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.actualNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. 750"
                          value={row.actualNA ? 'NA' : (row.actual || '')}
                          onChange={(e) => updateAdherenceRow(idx, 'actual', e.target.value)}
                          disabled={isReadOnly || !!row.actualNA}
                        />
                        <NaCheckbox
                          checked={!!row.actualNA}
                          onChange={(checked) => {
                            updateAdherenceRow(idx, 'actualNA', checked);
                            if (checked) updateAdherenceRow(idx, 'actual', 'NA');
                            else if (row.actual === 'NA') updateAdherenceRow(idx, 'actual', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.remarksNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. As per plan / 0% deviation"
                          value={row.remarksNA ? 'NA' : (row.remarks || '')}
                          onChange={(e) => updateAdherenceRow(idx, 'remarks', e.target.value)}
                          disabled={isReadOnly || !!row.remarksNA}
                        />
                        <NaCheckbox
                          checked={!!row.remarksNA}
                          onChange={(checked) => {
                            updateAdherenceRow(idx, 'remarksNA', checked);
                            if (checked) updateAdherenceRow(idx, 'remarks', 'NA');
                            else if (row.remarks === 'NA') updateAdherenceRow(idx, 'remarks', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                    {!isReadOnly && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeAdherenceRow(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Table: 17. Property Currently Occupied by & Future / Present Rental Value (Light Green '#e8f5e9') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-emerald-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              17. Property Currently Occupied by & Future / Present Rental Value
            </h3>
          </div>
          <button
            type="button"
            onClick={addRentalRow}
            disabled={isReadOnly}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Occupancy Row
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-emerald-100/70 text-gray-800 font-bold uppercase border-b border-gray-300">
              <tr>
                <th className="py-2.5 px-3">Byelaws / Floor</th>
                <th className="py-2.5 px-3 w-28">No. of Units</th>
                <th className="py-2.5 px-3 w-36">Type of Unit</th>
                <th className="py-2.5 px-3 w-36">Rent P.M. (Rs.)</th>
                <th className="py-2.5 px-3">Occupied by</th>
                {!isReadOnly && <th className="py-2.5 px-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {rentalRows.map((row: any, idx: number) => {
                return (
                  <tr key={row.id || idx} className="hover:bg-gray-50/70">
                    {/* Byelaws / Floor */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.byelawsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. Residential (Ground)"
                          value={row.byelawsNA ? 'NA' : (row.byelaws || '')}
                          onChange={(e) => updateRentalRow(idx, 'byelaws', e.target.value)}
                          disabled={isReadOnly || !!row.byelawsNA}
                        />
                        <NaCheckbox
                          checked={!!row.byelawsNA}
                          onChange={(checked) => {
                            updateRentalRow(idx, 'byelawsNA', checked);
                            if (checked) updateRentalRow(idx, 'byelaws', 'NA');
                            else if (row.byelaws === 'NA') updateRentalRow(idx, 'byelaws', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* No. of Units */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.unitsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. 1"
                          value={row.unitsNA ? 'NA' : (row.units || '')}
                          onChange={(e) => updateRentalRow(idx, 'units', e.target.value)}
                          disabled={isReadOnly || !!row.unitsNA}
                        />
                        <NaCheckbox
                          checked={!!row.unitsNA}
                          onChange={(checked) => {
                            updateRentalRow(idx, 'unitsNA', checked);
                            if (checked) updateRentalRow(idx, 'units', 'NA');
                            else if (row.units === 'NA') updateRentalRow(idx, 'units', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* Type of Unit */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.typeOfUnitNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. 2 BHK Flat"
                          value={row.typeOfUnitNA ? 'NA' : (row.typeOfUnit || '')}
                          onChange={(e) => updateRentalRow(idx, 'typeOfUnit', e.target.value)}
                          disabled={isReadOnly || !!row.typeOfUnitNA}
                        />
                        <NaCheckbox
                          checked={!!row.typeOfUnitNA}
                          onChange={(checked) => {
                            updateRentalRow(idx, 'typeOfUnitNA', checked);
                            if (checked) updateRentalRow(idx, 'typeOfUnit', 'NA');
                            else if (row.typeOfUnit === 'NA') updateRentalRow(idx, 'typeOfUnit', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* Rent P.M. */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.rentPmNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. 10,000"
                          value={row.rentPmNA ? 'NA' : (row.rentPm || '')}
                          onChange={(e) => updateRentalRow(idx, 'rentPm', e.target.value)}
                          disabled={isReadOnly || !!row.rentPmNA}
                        />
                        <NaCheckbox
                          checked={!!row.rentPmNA}
                          onChange={(checked) => {
                            updateRentalRow(idx, 'rentPmNA', checked);
                            if (checked) updateRentalRow(idx, 'rentPm', 'NA');
                            else if (row.rentPm === 'NA') updateRentalRow(idx, 'rentPm', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {/* Occupied by */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className={`${inputCls} ${row.occupiedByNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                          placeholder="e.g. Self / Tenant"
                          value={row.occupiedByNA ? 'NA' : (row.occupiedBy || '')}
                          onChange={(e) => updateRentalRow(idx, 'occupiedBy', e.target.value)}
                          disabled={isReadOnly || !!row.occupiedByNA}
                        />
                        <NaCheckbox
                          checked={!!row.occupiedByNA}
                          onChange={(checked) => {
                            updateRentalRow(idx, 'occupiedByNA', checked);
                            if (checked) updateRentalRow(idx, 'occupiedBy', 'NA');
                            else if (row.occupiedBy === 'NA') updateRentalRow(idx, 'occupiedBy', '');
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>

                    {!isReadOnly && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRentalRow(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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

// ─── Section 4: National Disaster Management Authority (NDMA) Parameters Component ───

export function NdmaParametersSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // Structure Type prefill from "Type of construction" field
  const defaultStructureType = fields.ikfTypeOfConstruction || 'RCC Framed Structure';
  const effectiveStructureType = fields.ikfStructureTypeEditOn
    ? (fields.ikfStructureType ?? '')
    : (fields.ikfStructureType || defaultStructureType);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container: NDMA Details (Light Yellow '#fffde7') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-amber-200 shadow-sm"
        style={{ backgroundColor: '#fffde7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              NDMA Details
            </h3>
          </div>
          <span className="text-xs text-amber-800 font-medium bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
            Disaster Vulnerability & Structural Safety
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Seismic Zone Details: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Seismic Zone Details</span>
                <NaCheckbox
                  checked={!!fields.ikfSeismicZoneDetailsNA}
                  onChange={(checked) => {
                    handleChange('ikfSeismicZoneDetailsNA', checked);
                    if (checked) handleChange('ikfSeismicZoneDetails', 'NA');
                    else if (fields.ikfSeismicZoneDetails === 'NA') handleChange('ikfSeismicZoneDetails', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfSeismicZoneDetailsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Zone III (Moderate Damage Risk Zone)"
              value={fields.ikfSeismicZoneDetailsNA ? 'NA' : (fields.ikfSeismicZoneDetails ?? 'Zone III')}
              onChange={(e) => handleChange('ikfSeismicZoneDetails', e.target.value)}
              disabled={isReadOnly || !!fields.ikfSeismicZoneDetailsNA}
            />
          </Field>

          {/* Structure Type: Input Box (Text) (Prefill from "Type of construction" field, Edit button: OFF) [with NA Checkbox] [Lock UI Hover: >>Prefill from section 2, "Type of construction"<<] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Structure Type</span>
                <div className="flex items-center gap-3">
                  <NaCheckbox
                    checked={!!fields.ikfStructureTypeNA}
                    onChange={(checked) => {
                      handleChange('ikfStructureTypeNA', checked);
                      if (checked) handleChange('ikfStructureType', 'NA');
                      else if (fields.ikfStructureType === 'NA') handleChange('ikfStructureType', '');
                    }}
                    disabled={isReadOnly}
                  />
                  <EditSwitch
                    checked={!!fields.ikfStructureTypeEditOn}
                    onChange={(checked) => {
                      handleChange('ikfStructureTypeEditOn', checked);
                      if (!checked) {
                        handleChange('ikfStructureType', defaultStructureType);
                      }
                    }}
                    disabled={isReadOnly || !!fields.ikfStructureTypeNA}
                  />
                </div>
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!fields.ikfStructureTypeEditOn && !fields.ikfStructureTypeNA}
              tooltipMessage=">>Prefill from section 2, &quot;Type of construction&quot;<<"
            >
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} ${
                    fields.ikfStructureTypeNA
                      ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed'
                      : fields.ikfStructureTypeEditOn
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-medium focus:ring-emerald-500'
                      : 'bg-gray-100/80 text-gray-700 cursor-not-allowed font-medium'
                  }`}
                  placeholder="e.g. RCC Framed Structure"
                  value={fields.ikfStructureTypeNA ? 'NA' : effectiveStructureType}
                  onChange={(e) => handleChange('ikfStructureType', e.target.value)}
                  disabled={isReadOnly || !!fields.ikfStructureTypeNA || !fields.ikfStructureTypeEditOn}
                />
                {!fields.ikfStructureTypeEditOn && !fields.ikfStructureTypeNA && (
                  <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Prefilled from Section 2
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Footing Type: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Footing Type</span>
                <NaCheckbox
                  checked={!!fields.ikfFootingTypeNA}
                  onChange={(checked) => {
                    handleChange('ikfFootingTypeNA', checked);
                    if (checked) handleChange('ikfFootingType', 'NA');
                    else if (fields.ikfFootingType === 'NA') handleChange('ikfFootingType', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfFootingTypeNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Isolated Column Footing / R.C.C. Footing"
              value={fields.ikfFootingTypeNA ? 'NA' : (fields.ikfFootingType || '')}
              onChange={(e) => handleChange('ikfFootingType', e.target.value)}
              disabled={isReadOnly || !!fields.ikfFootingTypeNA}
            />
          </Field>

          {/* Roof Type: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Roof Type</span>
                <NaCheckbox
                  checked={!!fields.ikfRoofTypeNA}
                  onChange={(checked) => {
                    handleChange('ikfRoofTypeNA', checked);
                    if (checked) handleChange('ikfRoofType', 'NA');
                    else if (fields.ikfRoofType === 'NA') handleChange('ikfRoofType', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfRoofTypeNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. R.C.C. Slab / Flat Roof"
              value={fields.ikfRoofTypeNA ? 'NA' : (fields.ikfRoofType || '')}
              onChange={(e) => handleChange('ikfRoofType', e.target.value)}
              disabled={isReadOnly || !!fields.ikfRoofTypeNA}
            />
          </Field>

          {/* Type of Masonry: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Type of Masonry</span>
                <NaCheckbox
                  checked={!!fields.ikfTypeOfMasonryNA}
                  onChange={(checked) => {
                    handleChange('ikfTypeOfMasonryNA', checked);
                    if (checked) handleChange('ikfTypeOfMasonry', 'NA');
                    else if (fields.ikfTypeOfMasonry === 'NA') handleChange('ikfTypeOfMasonry', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfTypeOfMasonryNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Brick Masonry in Cement Mortar (1:6)"
              value={fields.ikfTypeOfMasonryNA ? 'NA' : (fields.ikfTypeOfMasonry || '')}
              onChange={(e) => handleChange('ikfTypeOfMasonry', e.target.value)}
              disabled={isReadOnly || !!fields.ikfTypeOfMasonryNA}
            />
          </Field>

          {/* Soil Type: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Soil Type</span>
                <NaCheckbox
                  checked={!!fields.ikfSoilTypeNA}
                  onChange={(checked) => {
                    handleChange('ikfSoilTypeNA', checked);
                    if (checked) handleChange('ikfSoilType', 'NA');
                    else if (fields.ikfSoilType === 'NA') handleChange('ikfSoilType', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfSoilTypeNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Clayey Silt / Hard Murrum / Normal Soil"
              value={fields.ikfSoilTypeNA ? 'NA' : (fields.ikfSoilType || '')}
              onChange={(e) => handleChange('ikfSoilType', e.target.value)}
              disabled={isReadOnly || !!fields.ikfSoilTypeNA}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: ESG Monitoring Parameters Component ──────────────────────────

export const NATURAL_DISASTER_OPTIONS = [
  'Earthquake',
  'Floods',
  'Cyclones',
  'Landslides',
  'NA',
];

export function EsgMonitoringSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const currentDisaster = fields.ikfVulnerableNaturalDisasters;

  // Selected disaster tags/checkboxes
  const checkedDisasters: string[] = useMemo(() => {
    if (Array.isArray(fields.ikfVulnerableNaturalDisastersList)) {
      return fields.ikfVulnerableNaturalDisastersList;
    }
    if (typeof currentDisaster === 'string' && currentDisaster) {
      if (currentDisaster === 'Custom' || currentDisaster === 'NA') return [currentDisaster];
      return currentDisaster.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return ['NA'];
  }, [fields.ikfVulnerableNaturalDisastersList, currentDisaster]);

  const handleDisasterToggle = (opt: string) => {
    let next: string[];
    if (opt === 'NA') {
      next = ['NA'];
      handleChange('ikfVulnerableNaturalDisastersCustom', '');
      handleChange('ikfVulnerableNaturalDisastersSelect', 'NA');
      handleChange('ikfVulnerableNaturalDisasters', 'NA');
    } else {
      const filtered = checkedDisasters.filter((x) => x !== 'NA' && x !== 'Custom');
      if (filtered.includes(opt)) {
        next = filtered.filter((x) => x !== opt);
        if (next.length === 0) next = ['NA'];
      } else {
        next = [...filtered, opt];
      }
      const valStr = next.join(', ');
      handleChange('ikfVulnerableNaturalDisasters', valStr);
      handleChange(
        'ikfVulnerableNaturalDisastersSelect',
        next.length === 1 ? next[0] : next.length > 1 ? 'Multiple' : 'NA'
      );
    }
    handleChange('ikfVulnerableNaturalDisastersList', next);
  };

  const handleDropdownChange = (val: string) => {
    handleChange('ikfVulnerableNaturalDisastersSelect', val);
    if (val === 'Custom') {
      handleChange('ikfVulnerableNaturalDisasters', 'Custom');
      handleChange('ikfVulnerableNaturalDisastersList', ['Custom']);
    } else if (val === 'NA') {
      handleChange('ikfVulnerableNaturalDisasters', 'NA');
      handleChange('ikfVulnerableNaturalDisastersList', ['NA']);
      handleChange('ikfVulnerableNaturalDisastersCustom', '');
    } else {
      handleChange('ikfVulnerableNaturalDisasters', val);
      handleChange('ikfVulnerableNaturalDisastersList', [val]);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container: ESG Details (Light Purple '#f3e5f5') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-purple-200 shadow-sm"
        style={{ backgroundColor: '#f3e5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-purple-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              ESG Details
            </h3>
          </div>
          <span className="text-xs text-purple-800 font-medium bg-purple-100 px-2.5 py-1 rounded-md border border-purple-300">
            Environmental, Social & Governance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Property location in areas vulnerable to natural disasters: Dropdown/Checkbox (Earthquake / Floods / Cyclones / Landslides / NA / Custom) [Custom Option: ON] */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field
              label={
                <span className="font-semibold text-gray-700">
                  Property location in areas vulnerable to natural disasters
                </span>
              }
            >
              <div className="space-y-3 p-4 rounded-lg border border-purple-200 bg-white/95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 block mb-1">
                      Quick Dropdown Selection
                    </label>
                    <CustomSelect
                      value={
                        fields.ikfVulnerableNaturalDisastersSelect ||
                        (checkedDisasters.includes('NA')
                          ? 'NA'
                          : checkedDisasters.length === 1
                          ? checkedDisasters[0]
                          : 'Custom')
                      }
                      customValue={fields.ikfVulnerableNaturalDisastersCustom || ''}
                      onChange={handleDropdownChange}
                      onCustomChange={(val) => {
                        handleChange('ikfVulnerableNaturalDisastersCustom', val);
                        handleChange('ikfVulnerableNaturalDisasters', val);
                      }}
                      options={[
                        { value: 'NA', label: 'NA (Not Vulnerable)' },
                        { value: 'Earthquake', label: 'Earthquake' },
                        { value: 'Floods', label: 'Floods' },
                        { value: 'Cyclones', label: 'Cyclones' },
                        { value: 'Landslides', label: 'Landslides' },
                      ]}
                      disabled={isReadOnly}
                      placeholder="Select disaster vulnerability..."
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 block mb-1">
                      Multi-Select Checkbox Options
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {NATURAL_DISASTER_OPTIONS.map((opt) => {
                        const isChecked = checkedDisasters.includes(opt);
                        return (
                          <label
                            key={opt}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                              isChecked
                                ? 'bg-purple-100 border-purple-400 text-purple-950 font-bold shadow-xs'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleDisasterToggle(opt)}
                              disabled={isReadOnly}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Show custom input if Custom option is selected */}
                {(fields.ikfVulnerableNaturalDisastersSelect === 'Custom' ||
                  checkedDisasters.includes('Custom')) && (
                  <div className="pt-2 border-t border-purple-100">
                    <input
                      type="text"
                      className={`${inputCls} bg-purple-50/50 border-purple-300 text-gray-900`}
                      placeholder="Specify custom natural disaster vulnerability..."
                      value={fields.ikfVulnerableNaturalDisastersCustom || ''}
                      onChange={(e) => {
                        handleChange('ikfVulnerableNaturalDisastersCustom', e.target.value);
                        handleChange('ikfVulnerableNaturalDisasters', e.target.value);
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                )}
              </div>
            </Field>
          </div>

          {/* Physical condition of property: Dropdown (No visual cracks / Fine hairline cracks observed / Significant cracks observed / Dilapidated structure / Custom) [Custom Option: ON] */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                Physical condition of property
              </span>
            }
          >
            <CustomSelect
              value={fields.ikfPhysicalCondition || 'No visual cracks'}
              customValue={fields.ikfPhysicalConditionCustom || ''}
              onChange={(val) => handleChange('ikfPhysicalCondition', val)}
              onCustomChange={(val) => handleChange('ikfPhysicalConditionCustom', val)}
              options={[
                { value: 'No visual cracks', label: 'No visual cracks' },
                { value: 'Fine hairline cracks observed', label: 'Fine hairline cracks observed' },
                { value: 'Significant cracks observed', label: 'Significant cracks observed' },
                { value: 'Dilapidated structure', label: 'Dilapidated structure' },
              ]}
              disabled={isReadOnly}
              placeholder="Select physical condition..."
            />
          </Field>

          {/* Presence of easement rights for access (road) or use of resources (water from wells etc.) in the property: Dropdown (Access Road / Water / NA / Custom) [Custom Option: ON] */}
          <div className="col-span-1 md:col-span-2">
            <Field
              label={
                <span className="font-semibold text-gray-700">
                  Presence of easement rights for access (road) or use of resources (water from wells etc.) in the property
                </span>
              }
            >
              <CustomSelect
                value={fields.ikfEasementRights || 'NA'}
                customValue={fields.ikfEasementRightsCustom || ''}
                onChange={(val) => handleChange('ikfEasementRights', val)}
                onCustomChange={(val) => handleChange('ikfEasementRightsCustom', val)}
                options={[
                  { value: 'Access Road', label: 'Access Road' },
                  { value: 'Water', label: 'Water' },
                  { value: 'NA', label: 'NA' },
                ]}
                disabled={isReadOnly}
                placeholder="Select easement rights..."
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: CONCLUSION AND VALUATION OF THE PROPERTY: Component ──────────

export interface ValuationDetailRow {
  id: string;
  item: string;
  area: string;
  rate: string;
  completion: string;
  amount: string;
  amountEditOn?: boolean;
}

export const DEFAULT_VALUATION_DETAIL_ROWS: ValuationDetailRow[] = [
  { id: '1', item: 'Land Area Valuation', area: '1500', rate: '2500', completion: '100', amount: '3750000', amountEditOn: false },
  { id: '2', item: 'Ground Floor Construction', area: '1200', rate: '1800', completion: '100', amount: '2160000', amountEditOn: false },
  { id: '3', item: 'First Floor Construction', area: '1200', rate: '1800', completion: '80', amount: '1728000', amountEditOn: false },
];

export function ConclusionAndValuationSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // ── Valuation Details Rows ──
  const valuationRows: ValuationDetailRow[] =
    Array.isArray(fields.ikfValuationDetailRows) && fields.ikfValuationDetailRows.length > 0
      ? fields.ikfValuationDetailRows
      : DEFAULT_VALUATION_DETAIL_ROWS;

  const updateValuationRow = (idx: number, patch: Partial<ValuationDetailRow>) => {
    const updated = valuationRows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    handleChange('ikfValuationDetailRows', updated);
  };

  const addValuationRow = () => {
    const newRow: ValuationDetailRow = {
      id: Date.now().toString(),
      item: 'Additional Floor / Structure',
      area: '',
      rate: '',
      completion: '100',
      amount: '',
      amountEditOn: false,
    };
    handleChange('ikfValuationDetailRows', [...valuationRows, newRow]);
  };

  const removeValuationRow = (idx: number) => {
    if (valuationRows.length <= 1) return;
    const updated = valuationRows.filter((_, i) => i !== idx);
    handleChange('ikfValuationDetailRows', updated);
  };

  // Helper to compute row amount
  const getRowAutoAmount = (r: ValuationDetailRow): number => {
    const area = parseFloat(r.area) || 0;
    const rate = parseFloat(r.rate) || 0;
    const compVal = r.completion !== undefined && r.completion !== '' ? parseFloat(r.completion) : 100;
    const compRatio = compVal > 1 ? compVal / 100 : (compVal >= 0 ? compVal : 1);
    return Math.round(area * rate * compRatio);
  };

  const getRowEffectiveAmount = (r: ValuationDetailRow): number => {
    if (r.amountEditOn) {
      return parseFloat(r.amount) || 0;
    }
    return getRowAutoAmount(r);
  };

  // Sum of Amount column in Valuation Details Calculation
  const sumValuationAmount = useMemo(() => {
    return valuationRows.reduce((acc, r) => acc + getRowEffectiveAmount(r), 0);
  }, [valuationRows]);

  // Fair Market Value of property (Auto-calculate from the sum of Amount column, Edit button: OFF)
  const defaultFairMarketValue = sumValuationAmount > 0 ? String(sumValuationAmount) : (fields.ikfFairMarketValue || '7638000');
  const effectiveFairMarketValue = fields.ikfFairMarketValueEditOn
    ? (fields.ikfFairMarketValue ?? '')
    : (sumValuationAmount > 0 ? String(sumValuationAmount) : (fields.ikfFairMarketValue || defaultFairMarketValue));

  // Depreciation of the Building
  const depNumber = fields.ikfDepreciationOfBuildingNA ? 0 : (parseFloat(fields.ikfDepreciationOfBuilding) || 0);

  // Total Market Value of the Property (After Depreciation) (Fair Market Value - Depreciation, Edit button: OFF)
  const fmvNumber = parseFloat(effectiveFairMarketValue) || 0;
  const autoTotalMarketValue = Math.max(0, fmvNumber - depNumber);
  const defaultTotalMarketValue = autoTotalMarketValue > 0 ? String(autoTotalMarketValue) : (fields.ikfTotalMarketValueAfterDepreciation || String(fmvNumber));
  const effectiveTotalMarketValue = fields.ikfTotalMarketValueAfterDepreciationEditOn
    ? (fields.ikfTotalMarketValueAfterDepreciation ?? '')
    : (autoTotalMarketValue > 0 ? String(autoTotalMarketValue) : defaultTotalMarketValue);

  // Value of the property as on date (Prefilled matching Total Market Value, Edit button: OFF)
  const effectiveValueOfPropertyAsOnDate = fields.ikfValueOfPropertyAsOnDateEditOn
    ? (fields.ikfValueOfPropertyAsOnDate ?? '')
    : (fields.ikfValueOfPropertyAsOnDate || effectiveTotalMarketValue);

  // Geo tag details (Longitude & Latitude) (Prefill from device location if available, Edit button: OFF)
  const defaultGeo = (fields.latitude && fields.longitude)
    ? `${fields.latitude}, ${fields.longitude}`
    : (fields.ikfGeoTagDetails || '20.2961° N, 85.8245° E');
  const effectiveGeoTagDetails = fields.ikfGeoTagDetailsEditOn
    ? (fields.ikfGeoTagDetails ?? '')
    : (fields.ikfGeoTagDetails || defaultGeo);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Block 1: Table: Built Up Areas (Light Cyan '#e0f7fa') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-cyan-900" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Table: Built Up Areas
            </h3>
          </div>
          <span className="text-xs text-cyan-900 font-medium bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-300">
            Area Statement & Measurements
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-cyan-300 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-cyan-100/70 text-gray-800 font-bold uppercase border-b border-cyan-300">
              <tr>
                <th className="py-2.5 px-4">Area Parameter</th>
                <th className="py-2.5 px-4">Area (in Sq. Ft.)</th>
                <th className="py-2.5 px-4 w-32 text-center">NA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {/* Super Built up Area */}
              <tr className="hover:bg-cyan-50/50">
                <td className="py-3 px-4 font-semibold text-gray-800">
                  Super Built up Area
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="number"
                    step="any"
                    className={`${inputCls} ${
                      fields.ikfSuperBuiltUpAreaNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="e.g. 1500"
                    value={fields.ikfSuperBuiltUpAreaNA ? 'NA' : (fields.ikfSuperBuiltUpArea ?? '')}
                    onChange={(e) => handleChange('ikfSuperBuiltUpArea', e.target.value)}
                    disabled={isReadOnly || !!fields.ikfSuperBuiltUpAreaNA}
                  />
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex justify-center">
                    <NaCheckbox
                      checked={!!fields.ikfSuperBuiltUpAreaNA}
                      onChange={(checked) => {
                        handleChange('ikfSuperBuiltUpAreaNA', checked);
                        if (checked) handleChange('ikfSuperBuiltUpArea', 'NA');
                        else if (fields.ikfSuperBuiltUpArea === 'NA') handleChange('ikfSuperBuiltUpArea', '');
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              </tr>

              {/* Built up Area */}
              <tr className="hover:bg-cyan-50/50">
                <td className="py-3 px-4 font-semibold text-gray-800">
                  Built up Area
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="number"
                    step="any"
                    className={`${inputCls} ${
                      fields.ikfBuiltUpAreaNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="e.g. 1250"
                    value={fields.ikfBuiltUpAreaNA ? 'NA' : (fields.ikfBuiltUpArea ?? '')}
                    onChange={(e) => handleChange('ikfBuiltUpArea', e.target.value)}
                    disabled={isReadOnly || !!fields.ikfBuiltUpAreaNA}
                  />
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex justify-center">
                    <NaCheckbox
                      checked={!!fields.ikfBuiltUpAreaNA}
                      onChange={(checked) => {
                        handleChange('ikfBuiltUpAreaNA', checked);
                        if (checked) handleChange('ikfBuiltUpArea', 'NA');
                        else if (fields.ikfBuiltUpArea === 'NA') handleChange('ikfBuiltUpArea', '');
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              </tr>

              {/* Carpet Area */}
              <tr className="hover:bg-cyan-50/50">
                <td className="py-3 px-4 font-semibold text-gray-800">
                  Carpet Area
                </td>
                <td className="py-2.5 px-4">
                  <input
                    type="number"
                    step="any"
                    className={`${inputCls} ${
                      fields.ikfCarpetAreaNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="e.g. 1000"
                    value={fields.ikfCarpetAreaNA ? 'NA' : (fields.ikfCarpetArea ?? '')}
                    onChange={(e) => handleChange('ikfCarpetArea', e.target.value)}
                    disabled={isReadOnly || !!fields.ikfCarpetAreaNA}
                  />
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex justify-center">
                    <NaCheckbox
                      checked={!!fields.ikfCarpetAreaNA}
                      onChange={(checked) => {
                        handleChange('ikfCarpetAreaNA', checked);
                        if (checked) handleChange('ikfCarpetArea', 'NA');
                        else if (fields.ikfCarpetArea === 'NA') handleChange('ikfCarpetArea', '');
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Block 2: Container: Fair Market Value (Light Cyan '#e0f7fa') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-900" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Fair Market Value
            </h3>
          </div>
          <span className="text-xs text-cyan-900 font-medium bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-300">
            Valuation Details Sum
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Fair Market Value of property: Input Box (Number) (Auto-calculate from the sum of Amount column in Valuation Details, Edit button: OFF) [Lock UI Hover: >>Auto calculating from [Sum of Amount column in Valuation Details Calculation]<<] */}
          <div className="col-span-1 md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">Fair Market Value of property (Rs.)</span>
                  <EditSwitch
                    checked={!!fields.ikfFairMarketValueEditOn}
                    onChange={(checked) => {
                      handleChange('ikfFairMarketValueEditOn', checked);
                      if (!checked) {
                        handleChange('ikfFairMarketValue', String(sumValuationAmount));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <LockedFieldWrapper
                isLocked={!fields.ikfFairMarketValueEditOn}
                tooltipMessage=">>Auto calculating from [Sum of Amount column in Valuation Details Calculation]<<"
              >
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    className={`${inputCls} text-base font-bold ${
                      fields.ikfFairMarketValueEditOn
                        ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 focus:ring-emerald-500'
                        : 'bg-gray-100/80 text-cyan-950 cursor-not-allowed'
                    }`}
                    placeholder="e.g. 7638000"
                    value={effectiveFairMarketValue}
                    onChange={(e) => handleChange('ikfFairMarketValue', e.target.value)}
                    disabled={isReadOnly || !fields.ikfFairMarketValueEditOn}
                  />
                  {!fields.ikfFairMarketValueEditOn && (
                    <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Auto-calculated from Valuation Details
                    </div>
                  )}
                </div>
              </LockedFieldWrapper>
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Block 3: Table: Valuation Details Calculation (Light Cyan '#e0f7fa') ─── */}
      <div
        className="rounded-xl p-5 space-y-4 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-900" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Table: Valuation Details Calculation
            </h3>
          </div>
          <button
            type="button"
            onClick={addValuationRow}
            disabled={isReadOnly}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-800 text-white rounded-md text-xs font-semibold hover:bg-cyan-900 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Valuation Item
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-cyan-300 bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-cyan-100/70 text-gray-800 font-bold uppercase border-b border-cyan-300">
              <tr>
                <th className="py-2.5 px-3">Item / Description</th>
                <th className="py-2.5 px-3 w-32">Area (Sq. Ft.)</th>
                <th className="py-2.5 px-3 w-32">Rate (Rs./Sq. Ft.)</th>
                <th className="py-2.5 px-3 w-28">Completion %</th>
                <th className="py-2.5 px-3 w-56">Amount (Rs.)</th>
                {!isReadOnly && <th className="py-2.5 px-2 w-12 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {valuationRows.map((row, idx) => {
                const autoRowAmount = getRowAutoAmount(row);
                return (
                  <tr key={row.id || idx} className="hover:bg-cyan-50/50">
                    {/* Item */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="e.g. Ground Floor Construction"
                        value={row.item || ''}
                        onChange={(e) => updateValuationRow(idx, { item: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </td>

                    {/* Area */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="any"
                        className={inputCls}
                        placeholder="Area"
                        value={row.area ?? ''}
                        onChange={(e) => {
                          const newArea = e.target.value;
                          const updatedRow = { ...row, area: newArea };
                          if (!row.amountEditOn) {
                            updatedRow.amount = getRowAutoAmount(updatedRow).toString();
                          }
                          updateValuationRow(idx, updatedRow);
                        }}
                        disabled={isReadOnly}
                      />
                    </td>

                    {/* Rate */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="any"
                        className={inputCls}
                        placeholder="Rate"
                        value={row.rate ?? ''}
                        onChange={(e) => {
                          const newRate = e.target.value;
                          const updatedRow = { ...row, rate: newRate };
                          if (!row.amountEditOn) {
                            updatedRow.amount = getRowAutoAmount(updatedRow).toString();
                          }
                          updateValuationRow(idx, updatedRow);
                        }}
                        disabled={isReadOnly}
                      />
                    </td>

                    {/* Completion % */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="any"
                        className={inputCls}
                        placeholder="100"
                        value={row.completion ?? '100'}
                        onChange={(e) => {
                          const newComp = e.target.value;
                          const updatedRow = { ...row, completion: newComp };
                          if (!row.amountEditOn) {
                            updatedRow.amount = getRowAutoAmount(updatedRow).toString();
                          }
                          updateValuationRow(idx, updatedRow);
                        }}
                        disabled={isReadOnly}
                      />
                    </td>

                    {/* Amount column: Auto-calculate (Area * Rate * Completion %), Edit button: OFF [Lock UI Hover: >>Auto calculating from [Area * Rate * Completion %]<<] */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <div className="flex justify-end">
                          <EditSwitch
                            checked={!!row.amountEditOn}
                            onChange={(checked) => {
                              updateValuationRow(idx, {
                                amountEditOn: checked,
                                amount: checked ? (row.amount || autoRowAmount.toString()) : autoRowAmount.toString(),
                              });
                            }}
                            disabled={isReadOnly}
                          />
                        </div>
                        <LockedFieldWrapper
                          isLocked={!row.amountEditOn}
                          tooltipMessage=">>Auto calculating from [Area * Rate * Completion %]<<"
                        >
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              className={`${inputCls} font-semibold ${
                                row.amountEditOn
                                  ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 focus:ring-emerald-500'
                                  : 'bg-gray-100/80 text-gray-800 cursor-not-allowed'
                              }`}
                              placeholder="0"
                              value={row.amountEditOn ? (row.amount ?? '') : autoRowAmount}
                              onChange={(e) => updateValuationRow(idx, { amount: e.target.value })}
                              disabled={isReadOnly || !row.amountEditOn}
                            />
                            {!row.amountEditOn && (
                              <div className="absolute right-2 top-2 text-[10px] text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" /> Auto
                              </div>
                            )}
                          </div>
                        </LockedFieldWrapper>
                      </div>
                    </td>

                    {/* Action */}
                    {!isReadOnly && (
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeValuationRow(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove row"
                          disabled={valuationRows.length <= 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-cyan-50 font-bold border-t-2 border-cyan-300 text-gray-900">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs text-cyan-950">
                  Total Valuation Details Amount:
                </td>
                <td className="py-2.5 px-3 font-bold text-cyan-950 text-sm">
                  ₹ {sumValuationAmount.toLocaleString('en-IN')}
                </td>
                {!isReadOnly && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── Block 4: Container: Final Valuation Outcomes (Light Cyan '#e0f7fa') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-900" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Final Valuation Outcomes
            </h3>
          </div>
          <span className="text-xs text-cyan-900 font-medium bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-300">
            Valuation Summary & Parameters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Depreciation of the Building: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Depreciation of the Building (Rs.)</span>
                <NaCheckbox
                  checked={!!fields.ikfDepreciationOfBuildingNA}
                  onChange={(checked) => {
                    handleChange('ikfDepreciationOfBuildingNA', checked);
                    if (checked) handleChange('ikfDepreciationOfBuilding', 'NA');
                    else if (fields.ikfDepreciationOfBuilding === 'NA') handleChange('ikfDepreciationOfBuilding', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfDepreciationOfBuildingNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 0"
              value={fields.ikfDepreciationOfBuildingNA ? 'NA' : (fields.ikfDepreciationOfBuilding ?? '')}
              onChange={(e) => handleChange('ikfDepreciationOfBuilding', e.target.value)}
              disabled={isReadOnly || !!fields.ikfDepreciationOfBuildingNA}
            />
          </Field>

          {/* Total Market Value of the Property (After Depreciation): Auto-calculate (Fair Market Value - Depreciation), Edit button: OFF [Lock UI Hover: >>Auto calculating from [Fair Market Value of property - Depreciation of the Building]<<] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Total Market Value (After Depreciation)</span>
                <EditSwitch
                  checked={!!fields.ikfTotalMarketValueAfterDepreciationEditOn}
                  onChange={(checked) => {
                    handleChange('ikfTotalMarketValueAfterDepreciationEditOn', checked);
                    if (!checked) {
                      handleChange('ikfTotalMarketValueAfterDepreciation', defaultTotalMarketValue);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!fields.ikfTotalMarketValueAfterDepreciationEditOn}
              tooltipMessage=">>Auto calculating from [Fair Market Value of property - Depreciation of the Building]<<"
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  className={`${inputCls} font-bold ${
                    fields.ikfTotalMarketValueAfterDepreciationEditOn
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 focus:ring-emerald-500'
                      : 'bg-gray-100/80 text-cyan-950 cursor-not-allowed'
                  }`}
                  placeholder="e.g. 7638000"
                  value={effectiveTotalMarketValue}
                  onChange={(e) => handleChange('ikfTotalMarketValueAfterDepreciation', e.target.value)}
                  disabled={isReadOnly || !fields.ikfTotalMarketValueAfterDepreciationEditOn}
                />
                {!fields.ikfTotalMarketValueAfterDepreciationEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Auto-calculated
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Overall Stage of Construction of the Building (% of Construction): Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Overall Stage of Construction (% of Const.)</span>
                <NaCheckbox
                  checked={!!fields.ikfOverallStageOfConstructionNA}
                  onChange={(checked) => {
                    handleChange('ikfOverallStageOfConstructionNA', checked);
                    if (checked) handleChange('ikfOverallStageOfConstruction', 'NA');
                    else if (fields.ikfOverallStageOfConstruction === 'NA') handleChange('ikfOverallStageOfConstruction', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfOverallStageOfConstructionNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 100"
              value={fields.ikfOverallStageOfConstructionNA ? 'NA' : (fields.ikfOverallStageOfConstruction ?? '')}
              onChange={(e) => handleChange('ikfOverallStageOfConstruction', e.target.value)}
              disabled={isReadOnly || !!fields.ikfOverallStageOfConstructionNA}
            />
          </Field>

          {/* Estimated Date of Completion of Construction: Date Picker [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Estimated Date of Completion</span>
                <NaCheckbox
                  checked={!!fields.ikfEstimatedDateOfCompletionNA}
                  onChange={(checked) => {
                    handleChange('ikfEstimatedDateOfCompletionNA', checked);
                    if (checked) handleChange('ikfEstimatedDateOfCompletion', 'NA');
                    else if (fields.ikfEstimatedDateOfCompletion === 'NA') handleChange('ikfEstimatedDateOfCompletion', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type={fields.ikfEstimatedDateOfCompletionNA ? 'text' : 'date'}
              className={`${inputCls} ${
                fields.ikfEstimatedDateOfCompletionNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.ikfEstimatedDateOfCompletionNA ? 'NA' : (fields.ikfEstimatedDateOfCompletion || '')}
              onChange={(e) => handleChange('ikfEstimatedDateOfCompletion', e.target.value)}
              disabled={isReadOnly || !!fields.ikfEstimatedDateOfCompletionNA}
            />
          </Field>

          {/* Construction estimate given by the customer: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Customer Construction Estimate (Rs.)</span>
                <NaCheckbox
                  checked={!!fields.ikfCustomerConstructionEstimateNA}
                  onChange={(checked) => {
                    handleChange('ikfCustomerConstructionEstimateNA', checked);
                    if (checked) handleChange('ikfCustomerConstructionEstimate', 'NA');
                    else if (fields.ikfCustomerConstructionEstimate === 'NA') handleChange('ikfCustomerConstructionEstimate', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfCustomerConstructionEstimateNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 4500000"
              value={fields.ikfCustomerConstructionEstimateNA ? 'NA' : (fields.ikfCustomerConstructionEstimate ?? '')}
              onChange={(e) => handleChange('ikfCustomerConstructionEstimate', e.target.value)}
              disabled={isReadOnly || !!fields.ikfCustomerConstructionEstimateNA}
            />
          </Field>

          {/* Value of the property as on date: Auto-calculate (Prefilled matching Total Market Value), Edit button: OFF [Lock UI Hover: >>Prefill from section 6, "Total Market Value of the Property (After Depreciation)"<<] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Value of Property as on Date (Rs.)</span>
                <EditSwitch
                  checked={!!fields.ikfValueOfPropertyAsOnDateEditOn}
                  onChange={(checked) => {
                    handleChange('ikfValueOfPropertyAsOnDateEditOn', checked);
                    if (!checked) {
                      handleChange('ikfValueOfPropertyAsOnDate', effectiveTotalMarketValue);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!fields.ikfValueOfPropertyAsOnDateEditOn}
              tooltipMessage=">>Prefill from section 6, &quot;Total Market Value of the Property (After Depreciation)&quot;<<"
            >
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  className={`${inputCls} font-bold ${
                    fields.ikfValueOfPropertyAsOnDateEditOn
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 focus:ring-emerald-500'
                      : 'bg-gray-100/80 text-cyan-950 cursor-not-allowed'
                  }`}
                  placeholder="e.g. 7638000"
                  value={effectiveValueOfPropertyAsOnDate}
                  onChange={(e) => handleChange('ikfValueOfPropertyAsOnDate', e.target.value)}
                  disabled={isReadOnly || !fields.ikfValueOfPropertyAsOnDateEditOn}
                />
                {!fields.ikfValueOfPropertyAsOnDateEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Prefilled from Total Market Value
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Insurance Values: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Insurance Values (Rs.)</span>
                <NaCheckbox
                  checked={!!fields.ikfInsuranceValuesNA}
                  onChange={(checked) => {
                    handleChange('ikfInsuranceValuesNA', checked);
                    if (checked) handleChange('ikfInsuranceValues', 'NA');
                    else if (fields.ikfInsuranceValues === 'NA') handleChange('ikfInsuranceValues', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfInsuranceValuesNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 5000000"
              value={fields.ikfInsuranceValuesNA ? 'NA' : (fields.ikfInsuranceValues ?? '')}
              onChange={(e) => handleChange('ikfInsuranceValues', e.target.value)}
              disabled={isReadOnly || !!fields.ikfInsuranceValuesNA}
            />
          </Field>

          {/* Re construction value: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Re construction value (Rs.)</span>
                <NaCheckbox
                  checked={!!fields.ikfReconstructionValueNA}
                  onChange={(checked) => {
                    handleChange('ikfReconstructionValueNA', checked);
                    if (checked) handleChange('ikfReconstructionValue', 'NA');
                    else if (fields.ikfReconstructionValue === 'NA') handleChange('ikfReconstructionValue', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfReconstructionValueNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 4800000"
              value={fields.ikfReconstructionValueNA ? 'NA' : (fields.ikfReconstructionValue ?? '')}
              onChange={(e) => handleChange('ikfReconstructionValue', e.target.value)}
              disabled={isReadOnly || !!fields.ikfReconstructionValueNA}
            />
          </Field>

          {/* Realizable Value of the Property: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Realizable Value of Property (Rs.)</span>
                <NaCheckbox
                  checked={!!fields.ikfRealizableValueOfPropertyNA}
                  onChange={(checked) => {
                    handleChange('ikfRealizableValueOfPropertyNA', checked);
                    if (checked) handleChange('ikfRealizableValueOfProperty', 'NA');
                    else if (fields.ikfRealizableValueOfProperty === 'NA') handleChange('ikfRealizableValueOfProperty', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfRealizableValueOfPropertyNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 6500000"
              value={fields.ikfRealizableValueOfPropertyNA ? 'NA' : (fields.ikfRealizableValueOfProperty ?? '')}
              onChange={(e) => handleChange('ikfRealizableValueOfProperty', e.target.value)}
              disabled={isReadOnly || !!fields.ikfRealizableValueOfPropertyNA}
            />
          </Field>

          {/* Distress/Forced Sale Value: Input Box (Number) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Distress/Forced Sale Value (Rs.)</span>
                <NaCheckbox
                  checked={!!fields.ikfDistressForcedSaleValueNA}
                  onChange={(checked) => {
                    handleChange('ikfDistressForcedSaleValueNA', checked);
                    if (checked) handleChange('ikfDistressForcedSaleValue', 'NA');
                    else if (fields.ikfDistressForcedSaleValue === 'NA') handleChange('ikfDistressForcedSaleValue', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="number"
              step="any"
              className={`${inputCls} ${
                fields.ikfDistressForcedSaleValueNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. 5700000"
              value={fields.ikfDistressForcedSaleValueNA ? 'NA' : (fields.ikfDistressForcedSaleValue ?? '')}
              onChange={(e) => handleChange('ikfDistressForcedSaleValue', e.target.value)}
              disabled={isReadOnly || !!fields.ikfDistressForcedSaleValueNA}
            />
          </Field>

          {/* Geo tag details (Longitude & Latitude): Input Box (Text) (Prefill from device location if available, Edit button: OFF) [Lock UI Hover: >>Auto calculating from [Device GPS Coordinates]<<] */}
          <div className="col-span-1 md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Geo tag details (Longitude & Latitude)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const lat = position.coords.latitude.toFixed(6);
                              const lng = position.coords.longitude.toFixed(6);
                              const coords = `${lat}° N, ${lng}° E`;
                              handleChange('ikfGeoTagDetails', coords);
                            },
                            (err) => {
                              console.warn('Geolocation fetch error:', err);
                            }
                          );
                        }
                      }}
                      disabled={isReadOnly}
                      className="text-xs text-cyan-800 hover:text-cyan-950 font-semibold underline flex items-center gap-1"
                      title="Fetch device GPS coordinates"
                    >
                      <Navigation className="w-3 h-3" /> Fetch Current GPS
                    </button>
                  </div>
                  <EditSwitch
                    checked={!!fields.ikfGeoTagDetailsEditOn}
                    onChange={(checked) => {
                      handleChange('ikfGeoTagDetailsEditOn', checked);
                      if (!checked) {
                        handleChange('ikfGeoTagDetails', defaultGeo);
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <LockedFieldWrapper
                isLocked={!fields.ikfGeoTagDetailsEditOn}
                tooltipMessage=">>Auto calculating from [Device GPS Coordinates]<<"
              >
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputCls} ${
                      fields.ikfGeoTagDetailsEditOn
                        ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 focus:ring-emerald-500'
                        : 'bg-gray-100/80 text-gray-800 cursor-not-allowed'
                    }`}
                    placeholder="e.g. 20.2961° N, 85.8245° E"
                    value={effectiveGeoTagDetails}
                    onChange={(e) => handleChange('ikfGeoTagDetails', e.target.value)}
                    disabled={isReadOnly || !fields.ikfGeoTagDetailsEditOn}
                  />
                  {!fields.ikfGeoTagDetailsEditOn && (
                    <div className="absolute right-3 top-2.5 text-xs text-amber-700 font-semibold pointer-events-none flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200">
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Device Location
                    </div>
                  )}
                </div>
              </LockedFieldWrapper>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 7: Other Critical Check - Points Component ──────────────────────

export function OtherCriticalChecksSection({
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
      {/* ─── Container: Critical Checks & Utilities (Light Orange '#fff3e0') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-orange-200 shadow-sm"
        style={{ backgroundColor: '#fff3e0' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Critical Checks & Utilities
            </h3>
          </div>
          <span className="text-xs text-orange-800 font-medium bg-orange-100 px-2.5 py-1 rounded-md border border-orange-300">
            Verification & Utility Infrastructure
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* How the property was identified: Input Box (Variable Size) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field label={<span className="font-semibold text-gray-700">How the property was identified</span>}>
              <AutoResizeTextarea
                rows={2}
                placeholder="e.g. Identified during physical site inspection through customer/representative, verification with boundary landmarks, municipal road, and relevant deed details."
                value={fields.ikfHowPropertyIdentified || ''}
                onChange={(e) => handleChange('ikfHowPropertyIdentified', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Water Connection Status: Dropdown (Active / In-Active / Not Available / Custom) [Custom Option: ON] */}
          <Field label={<span className="font-semibold text-gray-700">Water Connection Status</span>}>
            <CustomSelect
              value={fields.ikfWaterConnectionStatus || 'Active'}
              customValue={fields.ikfWaterConnectionStatusCustom || ''}
              onChange={(val) => handleChange('ikfWaterConnectionStatus', val)}
              onCustomChange={(val) => handleChange('ikfWaterConnectionStatusCustom', val)}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'In-Active', label: 'In-Active' },
                { value: 'Not Available', label: 'Not Available' },
              ]}
              disabled={isReadOnly}
              placeholder="Select water status..."
            />
          </Field>

          {/* Electricity Connection Status: Dropdown (Active / In-Active / Not Available / Custom) [Custom Option: ON] */}
          <Field label={<span className="font-semibold text-gray-700">Electricity Connection Status</span>}>
            <CustomSelect
              value={fields.ikfElectricityConnectionStatus || 'Active'}
              customValue={fields.ikfElectricityConnectionStatusCustom || ''}
              onChange={(val) => handleChange('ikfElectricityConnectionStatus', val)}
              onCustomChange={(val) => handleChange('ikfElectricityConnectionStatusCustom', val)}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'In-Active', label: 'In-Active' },
                { value: 'Not Available', label: 'Not Available' },
              ]}
              disabled={isReadOnly}
              placeholder="Select electricity status..."
            />
          </Field>

          {/* Electricity Connection No & Owner Name: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Electricity Connection No & Owner Name</span>
                <NaCheckbox
                  checked={!!fields.ikfElectricityConnectionNoAndOwnerNA}
                  onChange={(checked) => {
                    handleChange('ikfElectricityConnectionNoAndOwnerNA', checked);
                    if (checked) handleChange('ikfElectricityConnectionNoAndOwner', 'NA');
                    else if (fields.ikfElectricityConnectionNoAndOwner === 'NA') handleChange('ikfElectricityConnectionNoAndOwner', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfElectricityConnectionNoAndOwnerNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Consumer No: 4120019284, Owner: Sri Santosh Kumar Sahoo"
              value={fields.ikfElectricityConnectionNoAndOwnerNA ? 'NA' : (fields.ikfElectricityConnectionNoAndOwner || '')}
              onChange={(e) => handleChange('ikfElectricityConnectionNoAndOwner', e.target.value)}
              disabled={isReadOnly || !!fields.ikfElectricityConnectionNoAndOwnerNA}
            />
          </Field>

          {/* Latest Electricity Bill to be collected & enclosed in report: Radio (Yes / No / NA) */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                Latest Electricity Bill to be collected & enclosed in report
              </span>
            }
          >
            <YesNoRadio
              name="ikfLatestElectricityBillCollected"
              value={fields.ikfLatestElectricityBillCollected || 'Yes'}
              onChange={(val) => handleChange('ikfLatestElectricityBillCollected', val)}
              options={['Yes', 'No', 'NA']}
              disabled={isReadOnly}
            />
          </Field>

          {/* Electricity Bill Online verification to be done & update screen shot in report: Radio (Yes / No / NA) */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                Electricity Bill Online verification to be done & update screen shot in report
              </span>
            }
          >
            <YesNoRadio
              name="ikfElectricityBillOnlineVerified"
              value={fields.ikfElectricityBillOnlineVerified || 'Yes'}
              onChange={(val) => handleChange('ikfElectricityBillOnlineVerified', val)}
              options={['Yes', 'No', 'NA']}
              disabled={isReadOnly}
            />
          </Field>

          {/* Name of the Apartment / Building: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Name of the Apartment / Building</span>
                <NaCheckbox
                  checked={!!fields.ikfNameOfApartmentOrBuildingNA}
                  onChange={(checked) => {
                    handleChange('ikfNameOfApartmentOrBuildingNA', checked);
                    if (checked) handleChange('ikfNameOfApartmentOrBuilding', 'NA');
                    else if (fields.ikfNameOfApartmentOrBuilding === 'NA') handleChange('ikfNameOfApartmentOrBuilding', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.ikfNameOfApartmentOrBuildingNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. Maa Tarini Nilaya / Sai Residency"
              value={fields.ikfNameOfApartmentOrBuildingNA ? 'NA' : (fields.ikfNameOfApartmentOrBuilding || '')}
              onChange={(e) => handleChange('ikfNameOfApartmentOrBuilding', e.target.value)}
              disabled={isReadOnly || !!fields.ikfNameOfApartmentOrBuildingNA}
            />
          </Field>

          {/* Occupancy status of Entire Building / Flat: Dropdown (Self / Tenant / Vacant / Custom) [Custom Option: ON] */}
          <Field label={<span className="font-semibold text-gray-700">Occupancy status of Entire Building / Flat</span>}>
            <CustomSelect
              value={fields.ikfOccupancyStatus || 'Self'}
              customValue={fields.ikfOccupancyStatusCustom || ''}
              onChange={(val) => handleChange('ikfOccupancyStatus', val)}
              onCustomChange={(val) => handleChange('ikfOccupancyStatusCustom', val)}
              options={[
                { value: 'Self', label: 'Self' },
                { value: 'Tenant', label: 'Tenant' },
                { value: 'Vacant', label: 'Vacant' },
              ]}
              disabled={isReadOnly}
              placeholder="Select occupancy status..."
            />
          </Field>

          {/* Period of Un-occupancy Entire Building / Flat: Input Box (Text) [with NA Checkbox] */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">Period of Un-occupancy Entire Building / Flat</span>
                <NaCheckbox
                  checked={fields.ikfPeriodOfUnoccupancyNA ?? true}
                  onChange={(checked) => {
                    handleChange('ikfPeriodOfUnoccupancyNA', checked);
                    if (checked) handleChange('ikfPeriodOfUnoccupancy', 'NA');
                    else if (fields.ikfPeriodOfUnoccupancy === 'NA') handleChange('ikfPeriodOfUnoccupancy', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                (fields.ikfPeriodOfUnoccupancyNA ?? true) ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              placeholder="e.g. NA / Vacant since 2 months"
              value={(fields.ikfPeriodOfUnoccupancyNA ?? true) ? 'NA' : (fields.ikfPeriodOfUnoccupancy || '')}
              onChange={(e) => handleChange('ikfPeriodOfUnoccupancy', e.target.value)}
              disabled={isReadOnly || (fields.ikfPeriodOfUnoccupancyNA ?? true)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: NOTE & Declaration Component ──────────────────────────────────

export function SignatureStampUpload({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-700 text-white text-xs font-semibold hover:bg-pink-800 transition-colors cursor-pointer shadow-xs ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Signature & Stamp Image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Image
          </button>
        )}
      </div>

      {value ? (
        <div className="p-3 border-2 border-dashed border-pink-300 rounded-xl bg-white flex flex-col items-center justify-center gap-2 max-w-md">
          <img
            src={value}
            alt="Valuer Signature & Stamp"
            className="max-h-36 object-contain rounded"
          />
          <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Signature & stamp image uploaded
          </span>
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed border-pink-200 rounded-xl bg-white/70 text-center max-w-md">
          <ImageIcon className="w-8 h-8 text-pink-300 mx-auto mb-1" />
          <p className="text-xs text-gray-500">
            Upload valuer signature with official seal/stamp (PNG, JPG, WebP)
          </p>
        </div>
      )}
    </div>
  );
}

export const DECLARATIONS_LIST = [
  {
    key: 'ikfDeclTrueAndCorrect',
    label: 'Statements of fact are true and correct',
    description: 'The statements of fact contained in this report are true and correct to the best of our knowledge and belief.',
  },
  {
    key: 'ikfDeclLimitingConditions',
    label: 'Limiting conditions have been disclosed',
    description: 'The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions.',
  },
  {
    key: 'ikfDeclNoInterest',
    label: 'We have no interest (present or future) in the transaction or property',
    description: 'We have no present or prospective interest in the property that is the subject of this report, and no personal interest with respect to the parties involved.',
  },
  {
    key: 'ikfDeclCompensationNotContingent',
    label: 'Compensation is not contingent upon rendering a specified value',
    description: 'Our engagement in this assignment was not contingent upon developing or reporting predetermined results or minimum values.',
  },
  {
    key: 'ikfDeclCompliedAppraisalRequirements',
    label: 'We have complied with all of the real estate appraisal program requirements',
    description: 'Our analyses, opinions, and conclusions were developed in conformity with the relevant standards of the real estate appraisal program.',
  },
  {
    key: 'ikfDeclInspectionPerformed',
    label: 'An inspection of the property was performed',
    description: 'A personal site inspection of the subject property was performed by us.',
  },
  {
    key: 'ikfDeclNoAssistanceReceived',
    label: 'Assistance was not received in the preparation of the appraisal',
    description: 'No person other than those named provided professional assistance in the preparation of this appraisal report.',
  },
];

export function NoteAndDeclarationSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const handleSelectAllDeclarations = () => {
    DECLARATIONS_LIST.forEach((item) => {
      handleChange(item.key, true);
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container 1: Final Remarks (Light Pink '#fce4ec') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-pink-200 shadow-sm"
        style={{ backgroundColor: '#fce4ec' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Final Remarks
            </h3>
          </div>
          <span className="text-xs text-pink-800 font-medium bg-pink-100 px-2.5 py-1 rounded-md border border-pink-300">
            Valuer Conclusion & Endorsement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Remarks: Input Box (Variable Size/Textarea) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field label={<span className="font-semibold text-gray-700">Remarks</span>}>
              <AutoResizeTextarea
                rows={4}
                placeholder="e.g. 1. The property under reference has been physically inspected by us.\n2. Boundaries matching as per site inspection and deed.\n3. The valuation has been assessed as per prevailing market conditions and standard norms."
                value={fields.ikfFinalRemarks || ''}
                onChange={(e) => handleChange('ikfFinalRemarks', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Date: Date Picker */}
          <Field label={<span className="font-semibold text-gray-700">Date</span>}>
            <input
              type="date"
              className={inputCls}
              value={fields.ikfValuationDate || ''}
              onChange={(e) => handleChange('ikfValuationDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Valuer Signature & stamp: File Upload (Image) */}
          <div className="col-span-1 md:col-span-2">
            <Field label={<span className="font-semibold text-gray-700">Valuer Signature & stamp</span>}>
              <SignatureStampUpload
                value={fields.ikfValuerSignatureAndStamp || ''}
                onChange={(val) => handleChange('ikfValuerSignatureAndStamp', val)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Container 2: Declarations Checklist (Light Pink '#fce4ec') ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-pink-200 shadow-sm"
        style={{ backgroundColor: '#fce4ec' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-pink-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Declarations Checklist
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAllDeclarations}
              disabled={isReadOnly}
              className="text-xs text-pink-800 hover:text-pink-950 font-semibold underline disabled:opacity-50"
            >
              Select All Declarations
            </button>
            <span className="text-xs text-pink-800 font-medium bg-pink-100 px-2.5 py-1 rounded-md border border-pink-300">
              Mandatory Appraiser Undertakings
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {DECLARATIONS_LIST.map((decl) => {
            const isChecked = !!fields[decl.key];
            return (
              <label
                key={decl.key}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-colors cursor-pointer select-none ${
                  isChecked
                    ? 'bg-pink-50/90 border-pink-300 text-pink-950 font-medium'
                    : 'bg-white border-pink-200 text-gray-700 hover:bg-pink-50/40'
                } ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  required
                  checked={isChecked}
                  onChange={(e) => handleChange(decl.key, e.target.checked)}
                  disabled={isReadOnly}
                  className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs md:text-sm font-semibold text-gray-900">
                      {decl.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                      Required
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {decl.description}
                  </p>
                </div>
              </label>
            );
          })}
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
    'section-3', // Replaced by Section 3: III) DETAILS FOR THE PROPERTY UNDER REFERENCE
    'section-4', // Replaced by Section 4: National Disaster Management Authority (NDMA) Parameters
    'section-5', // Replaced by Section 5: ESG Monitoring Parameters
    'section-6', // Replaced by Section 6: CONCLUSION AND VALUATION OF THE PROPERTY:
    'section-7', // Replaced by Section 7: Other Critical Check - Points
    'section-8', // Replaced by Section 8: NOTE & Declaration
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'ikf-section-1', title: 'VALUATION REPORT' },
    { id: 'ikf-section-2', title: 'II) DETAILS OF STRUCTURE AND SPECIFICATIONS' },
    { id: 'ikf-section-3', title: 'III) DETAILS FOR THE PROPERTY UNDER REFERENCE' },
    { id: 'ikf-section-4', title: 'National Disaster Management Authority (NDMA) Parameters' },
    { id: 'ikf-section-5', title: 'ESG Monitoring Parameters' },
    { id: 'ikf-section-6', title: 'CONCLUSION AND VALUATION OF THE PROPERTY:' },
    { id: 'ikf-section-7', title: 'Other Critical Check - Points' },
    { id: 'ikf-section-8', title: 'NOTE & Declaration' },
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
    {
      id: 'ikf-section-3',
      title: 'III) DETAILS FOR THE PROPERTY UNDER REFERENCE',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <PropertyUnderReferenceSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'ikf-section-4',
      title: 'National Disaster Management Authority (NDMA) Parameters',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <NdmaParametersSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'ikf-section-5',
      title: 'ESG Monitoring Parameters',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <EsgMonitoringSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'ikf-section-6',
      title: 'CONCLUSION AND VALUATION OF THE PROPERTY:',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ConclusionAndValuationSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'ikf-section-7',
      title: 'Other Critical Check - Points',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <OtherCriticalChecksSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'ikf-section-8',
      title: 'NOTE & Declaration',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <NoteAndDeclarationSection
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
    ikfRiskOfDemolition: 'Low',
    ikfSeismicZoneDetails: 'Zone III',
    ikfFootingType: 'Isolated Column Footing',
    ikfRoofType: 'R.C.C. Slab',
    ikfTypeOfMasonry: 'Brick Masonry in Cement Mortar',
    ikfSoilType: 'Clayey Silt / Normal Soil',
    ikfVulnerableNaturalDisasters: 'NA',
    ikfVulnerableNaturalDisastersSelect: 'NA',
    ikfVulnerableNaturalDisastersList: ['NA'],
    ikfPhysicalCondition: 'No visual cracks',
    ikfEasementRights: 'NA',
    ikfSuperBuiltUpArea: '1500',
    ikfBuiltUpArea: '1250',
    ikfCarpetArea: '1000',
    ikfFairMarketValue: '7638000',
    ikfDepreciationOfBuilding: '0',
    ikfOverallStageOfConstruction: '100',
    ikfEstimatedDateOfCompletion: '',
    ikfCustomerConstructionEstimate: '',
    ikfInsuranceValues: '5000000',
    ikfReconstructionValue: '4800000',
    ikfRealizableValueOfProperty: '6500000',
    ikfDistressForcedSaleValue: '5700000',
    ikfGeoTagDetails: '20.2961° N, 85.8245° E',
    ikfHowPropertyIdentified: 'Identified during site visit with the help of the customer, boundary verification with title deed, and site survey.',
    ikfWaterConnectionStatus: 'Active',
    ikfElectricityConnectionStatus: 'Active',
    ikfElectricityConnectionNoAndOwner: '',
    ikfLatestElectricityBillCollected: 'Yes',
    ikfElectricityBillOnlineVerified: 'Yes',
    ikfNameOfApartmentOrBuilding: '',
    ikfOccupancyStatus: 'Self',
    ikfPeriodOfUnoccupancy: 'NA',
    ikfPeriodOfUnoccupancyNA: true,
    ikfFinalRemarks: '1. The property has been inspected by us personally and all physical observations noted.\n2. Boundaries matching as per site inspection and deed.\n3. The valuation has been assessed as per prevailing market conditions and standard norms.',
    ikfValuationDate: new Date().toISOString().split('T')[0],
    ikfValuerSignatureAndStamp: '',
    ikfDeclTrueAndCorrect: true,
    ikfDeclLimitingConditions: true,
    ikfDeclNoInterest: true,
    ikfDeclCompensationNotContingent: true,
    ikfDeclCompliedAppraisalRequirements: true,
    ikfDeclInspectionPerformed: true,
    ikfDeclNoAssistanceReceived: true,
  },
};

export default function IKFFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={IKF_FINANCE_CONFIG} {...props} />;
}


