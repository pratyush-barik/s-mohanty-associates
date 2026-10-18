'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, FileText, CheckCircle2 } from 'lucide-react';

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

// ─── Section 1: Header Details ──────────────────────────────────────────────

export const DEFAULT_VALUER_PROFILE =
  'Er. Satyajit Mohanty (M/s. S MOHANTY ASSOCIATES) | Mob: +91 9937023855 / 9437166164 | Email: smohantyassociates@gmail.com | Valuer Code: HDB/VAL/01';

export function HeaderDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const effectiveValuerProfile = fields.hdbValuerProfileDetailsEditOn
    ? (fields.hdbValuerProfileDetails ?? '')
    : (fields.hdbValuerProfileDetails || DEFAULT_VALUER_PROFILE);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Details Container (Color: Light Coral #F08080) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-red-300/80 shadow-sm"
        style={{ backgroundColor: '#F08080' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-red-900 shadow-xs">
              1
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              Header Details
            </h3>
          </div>
          <span className="text-xs text-red-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-red-300/60 shadow-xs">
            Header Details Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LOS NO. */}
          <Field label={<span className="font-semibold text-gray-900">LOS NO.</span>}>
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbLosNo || ''}
              onChange={(e) => handleChange('hdbLosNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter LOS No..."
            />
          </Field>

          {/* Branch Name or DSA Name */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                BRANCH NAME OR DSA NAME
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbBranchOrDsaName || ''}
              customValue={fields.hdbBranchOrDsaNameCustom || ''}
              onChange={(val) => handleChange('hdbBranchOrDsaName', val)}
              onCustomChange={(val) => handleChange('hdbBranchOrDsaNameCustom', val)}
              options={[
                { value: 'Bhubaneswar', label: 'Bhubaneswar' },
                { value: 'Cuttack', label: 'Cuttack' },
                { value: 'Rourkela', label: 'Rourkela' },
                { value: 'Berhampur', label: 'Berhampur' },
                { value: 'Sambalpur', label: 'Sambalpur' },
                { value: 'Balasore', label: 'Balasore' },
                { value: 'Jajpur', label: 'Jajpur' },
                { value: 'Angul', label: 'Angul' },
                { value: 'Puri', label: 'Puri' },
                { value: 'DSA / Direct Sales Associate', label: 'DSA / Direct Sales Associate' },
              ]}
              disabled={isReadOnly}
              placeholder="Select branch or DSA name..."
            />
          </Field>

          {/* Valuer Name,Contact Details,Email ID & Code */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    VALUER NAME, CONTACT DETAILS, EMAIL ID & CODE
                  </span>
                  <EditSwitch
                    checked={!!fields.hdbValuerProfileDetailsEditOn}
                    onChange={(checked) => {
                      handleChange('hdbValuerProfileDetailsEditOn', checked);
                      if (!checked) {
                        handleChange('hdbValuerProfileDetails', DEFAULT_VALUER_PROFILE);
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} font-medium pr-24 ${
                    !fields.hdbValuerProfileDetailsEditOn
                      ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                      : 'bg-white'
                  }`}
                  value={effectiveValuerProfile}
                  onChange={(e) => handleChange('hdbValuerProfileDetails', e.target.value)}
                  disabled={isReadOnly || !fields.hdbValuerProfileDetailsEditOn}
                  placeholder="Enter valuer details..."
                />
                {!fields.hdbValuerProfileDetailsEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                    <Lock className="w-3 h-3 text-emerald-700" /> Prefilled
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

// ─── HDB Financial Services BankConfig ──────────────────────────────────────

export const HDB_FINANCIAL_CONFIG: BankConfig = {
  bankId: 'HDB FINANCIAL SERVICES',
  subTemplateId: '',
  displayName: 'HDB Financial Services',
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
    { id: 'hdb-section-header', title: 'HEADER DETAILS' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-11', title: 'Property Photographs' },
  ],
  fieldLabels: {
    'documents-title': 'DOCUMENTS',
    'section-documents-title': 'DOCUMENTS',
    'section-11-title': 'PROPERTY PHOTOGRAPHS',
  },
  defaultValues: {
    purpose: 'Mortgage / Loan Against Property',
    // Section 1: Header Details
    hdbLosNo: '',
    hdbValuerProfileDetails: DEFAULT_VALUER_PROFILE,
    hdbValuerProfileDetailsEditOn: false,
    hdbBranchOrDsaName: 'Bhubaneswar',
    hdbBranchOrDsaNameCustom: '',
  },
  extraSectionsStart: [
    {
      id: 'hdb-section-header',
      title: 'HEADER DETAILS',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <HeaderDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ],
};

export default function HDBFinancial(props: BankReportBuilderProps) {
  return <BankReportBuilder config={HDB_FINANCIAL_CONFIG} {...props} />;
}
