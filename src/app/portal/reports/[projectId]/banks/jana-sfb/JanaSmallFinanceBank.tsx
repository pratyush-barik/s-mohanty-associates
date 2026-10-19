'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import {
  Lock,
  Users,
  Calendar,
  Phone,
  FileText,
  UserCheck,
} from 'lucide-react';

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

export function AutoResizeTextarea({
  value,
  onChange,
  disabled = false,
  placeholder = '',
  rows = 2,
  className = '',
  title,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
  title?: string;
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
      title={title}
      className={`${inputCls} overflow-hidden resize-none transition-[height] duration-100 ${className}`}
    />
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
    <div className="flex flex-col gap-2 w-full">
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

// ─── Section 1: CUSTOMER DETAILS ─────────────────────────────────────────────

function CustomerDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* ─── Container 1: CUSTOMER DETAILS (Light Red '#ffebee') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-red-200 shadow-sm"
        style={{ backgroundColor: '#ffebee' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              CUSTOMER DETAILS
            </h3>
          </div>
          <span className="text-xs text-red-700 font-medium bg-red-100 px-2.5 py-1 rounded-md border border-red-300">
            Section 1: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1.1 Application Number */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.1 Application Number
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.janaApplicationNumber ?? fields.applicationNo ?? ''}
              onChange={(e) => {
                handleChange('janaApplicationNumber', e.target.value);
                handleChange('applicationNo', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Application Number"
            />
          </Field>

          {/* 1.2 Customer Name */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.2 Customer Name
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.janaCustomerName ?? fields.applicantName ?? ''}
              onChange={(e) => {
                handleChange('janaCustomerName', e.target.value);
                handleChange('applicantName', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Customer Name"
            />
          </Field>

          {/* 1.3 Date of Inspection */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.3 Date of Inspection
              </span>
            }
          >
            <input
              type="date"
              className={inputCls}
              value={fields.janaDateOfInspection ?? fields.dateOfInspection ?? ''}
              onChange={(e) => {
                handleChange('janaDateOfInspection', e.target.value);
                handleChange('dateOfInspection', e.target.value);
              }}
              disabled={isReadOnly}
            />
          </Field>

          {/* 1.4 Case Type */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.4 Case Type
              </span>
            }
          >
            <CustomSelect
              value={fields.janaCaseType || 'Home Loan'}
              customValue={fields.janaCaseTypeCustom || ''}
              onChange={(val) => handleChange('janaCaseType', val)}
              onCustomChange={(val) => handleChange('janaCaseTypeCustom', val)}
              options={[
                { value: 'Home Loan', label: 'Home Loan' },
                { value: 'LAP (Loan Against Property)', label: 'LAP (Loan Against Property)' },
                { value: 'MSME Loan', label: 'MSME Loan' },
                { value: 'Affordable Housing', label: 'Affordable Housing' },
                { value: 'Plot Purchase + Construction', label: 'Plot Purchase + Construction' },
                { value: 'Balance Transfer', label: 'Balance Transfer' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Case Type"
            />
          </Field>

          {/* 1.5 Contact Number of person met at site */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  1.5 Contact Number of person met at site
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaContactNumberMetAtSiteNA)}
                  onChange={(checked) => {
                    handleChange('janaContactNumberMetAtSiteNA', checked);
                    if (checked) {
                      handleChange('janaContactNumberMetAtSite', 'NA');
                    } else {
                      handleChange('janaContactNumberMetAtSite', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.janaContactNumberMetAtSiteNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaContactNumberMetAtSiteNA
                  ? 'NA'
                  : (fields.janaContactNumberMetAtSite ?? '')
              }
              onChange={(e) => handleChange('janaContactNumberMetAtSite', e.target.value)}
              disabled={isReadOnly || fields.janaContactNumberMetAtSiteNA}
              placeholder={fields.janaContactNumberMetAtSiteNA ? 'NA' : 'Enter Contact Number'}
            />
          </Field>

          {/* 1.6 Reference Number */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  1.6 Reference Number
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaReferenceNumberNA)}
                  onChange={(checked) => {
                    handleChange('janaReferenceNumberNA', checked);
                    if (checked) {
                      handleChange('janaReferenceNumber', 'NA');
                    } else {
                      handleChange('janaReferenceNumber', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.janaReferenceNumberNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaReferenceNumberNA
                  ? 'NA'
                  : (fields.janaReferenceNumber ?? fields.refNo ?? '')
              }
              onChange={(e) => {
                handleChange('janaReferenceNumber', e.target.value);
                handleChange('refNo', e.target.value);
              }}
              disabled={isReadOnly || fields.janaReferenceNumberNA}
              placeholder={fields.janaReferenceNumberNA ? 'NA' : 'Enter Reference Number'}
            />
          </Field>

          {/* 1.7 Property owner name as per Ownership document */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.7 Property owner name as per Ownership document
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.janaPropertyOwnerName ?? fields.propertyOwner ?? fields.ownerName ?? ''}
              onChange={(e) => {
                handleChange('janaPropertyOwnerName', e.target.value);
                handleChange('propertyOwner', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Property Owner Name"
            />
          </Field>

          {/* 1.8 Visit Done By */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.8 Visit Done By
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.janaVisitDoneBy ?? fields.engineerName ?? fields.valuerName ?? 'Er. S. Mohanty'}
              onChange={(e) => {
                handleChange('janaVisitDoneBy', e.target.value);
                handleChange('engineerName', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Valuer / Visiting Engineer Name"
            />
          </Field>

          {/* 1.9 Person met at site */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  1.9 Person met at site
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaPersonMetAtSiteNA)}
                  onChange={(checked) => {
                    handleChange('janaPersonMetAtSiteNA', checked);
                    if (checked) {
                      handleChange('janaPersonMetAtSite', 'NA');
                    } else {
                      handleChange('janaPersonMetAtSite', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.janaPersonMetAtSiteNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaPersonMetAtSiteNA
                  ? 'NA'
                  : (fields.janaPersonMetAtSite ?? '')
              }
              onChange={(e) => handleChange('janaPersonMetAtSite', e.target.value)}
              disabled={isReadOnly || fields.janaPersonMetAtSiteNA}
              placeholder={fields.janaPersonMetAtSiteNA ? 'NA' : 'Enter Person Met at Site'}
            />
          </Field>

          {/* 1.1 Relation with Customer */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                1.1 Relation with Customer
              </span>
            }
          >
            <CustomSelect
              value={fields.janaRelationWithCustomer || 'Self'}
              customValue={fields.janaRelationWithCustomerCustom || ''}
              onChange={(val) => handleChange('janaRelationWithCustomer', val)}
              onCustomChange={(val) => handleChange('janaRelationWithCustomerCustom', val)}
              options={[
                { value: 'Self', label: 'Self' },
                { value: 'Spouse', label: 'Spouse' },
                { value: 'Father', label: 'Father' },
                { value: 'Mother', label: 'Mother' },
                { value: 'Son', label: 'Son' },
                { value: 'Daughter', label: 'Daughter' },
                { value: 'Brother', label: 'Brother' },
                { value: 'Sister', label: 'Sister' },
                { value: 'Relative', label: 'Relative' },
                { value: 'Tenant', label: 'Tenant' },
                { value: 'Care Taker', label: 'Care Taker' },
                { value: 'Representative', label: 'Representative' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Relation"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Jana Small Finance Bank BankConfig ──────────────────────────────────────

export const JANA_SMALL_FINANCE_BANK_CONFIG: BankConfig = {
  bankId: 'JANA SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Jana Small Finance Bank',
  hiddenSections: [
    'section-1', // Replaced by Section 1: CUSTOMER DETAILS
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'jana-section-1', title: 'CUSTOMER DETAILS' },
    { id: 'section-2', title: 'Technical Details' },
    { id: 'section-3', title: 'Valuation' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'section-11', title: 'Photographs' },
    { id: 'annexures', title: 'Annexures' },
  ],
  extraSectionsStart: [
    {
      id: 'jana-section-1',
      title: 'CUSTOMER DETAILS',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <CustomerDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ],
  defaultValues: {
    purpose: 'Affordable Housing / MSME Loan',
    janaCaseType: 'Home Loan',
    janaRelationWithCustomer: 'Self',
    janaVisitDoneBy: 'Er. S. Mohanty',
  },
};

export default function JanaSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={JANA_SMALL_FINANCE_BANK_CONFIG} {...props} />;
}
