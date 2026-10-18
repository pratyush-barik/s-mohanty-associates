'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Building } from 'lucide-react';

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

// ─── Section 1: VALUATION OF IMMOVABLE PROPERTY Component ────────────────────

export function ValuationImmovablePropertySection({
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

  // 1. PROPERTY OWNER: Textarea (Variable size)
  const effectivePropertyOwner = fields.isfcPropertyOwner ?? (fields.propertyOwner || fields.customerName || '');

  // 2. ADDRESS OF THE PROPERTY: Textarea (Variable size)
  const effectivePropertyAddress = fields.isfcPropertyAddress ?? (fields.propertyAddress || fields.legalAddress || '');

  // 3. PRESENT MARKET VALUE: Auto-calculating from Section 5 "Total value"
  const isPmvEdit = Boolean(fields.isfcPresentMarketValueEditOn);
  const section5TotalVal = useMemo(() => {
    const raw = fields.isfcSection5TotalValue ?? fields.isfcTotalValue ?? fields.totalMarketValue ?? fields.fairMarketValue ?? fields.totalValuation ?? '';
    const cleaned = String(raw).replace(/[^0-9.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }, [fields.isfcSection5TotalValue, fields.isfcTotalValue, fields.totalMarketValue, fields.fairMarketValue, fields.totalValuation]);

  const autoPmvStr = section5TotalVal > 0 ? String(section5TotalVal) : (fields.isfcPresentMarketValue || fields.presentMarketValue || '');
  const effectivePmv = isPmvEdit
    ? (fields.isfcPresentMarketValue ?? '')
    : autoPmvStr;

  // 4. DISTRESS SALE VALUE: Auto-calculates as 75% of PRESENT MARKET VALUE
  const isDistressEdit = Boolean(fields.isfcDistressSaleValueEditOn);
  const pmvNum = useMemo(() => {
    const cleaned = String(effectivePmv).replace(/[^0-9.]/g, '');
    return cleaned ? parseFloat(cleaned) : 0;
  }, [effectivePmv]);

  const autoDistressStr = useMemo(() => {
    if (pmvNum > 0) {
      return String(Math.round(pmvNum * 0.75));
    }
    return '';
  }, [pmvNum]);

  const effectiveDistress = isDistressEdit
    ? (fields.isfcDistressSaleValue ?? '')
    : (autoDistressStr || fields.isfcDistressSaleValue || fields.distressSaleValue || '');

  // 5. PURPOSE OF VALUATION: Dropdown with Custom option
  const purposeVal = fields.isfcPurposeOfValuation || 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY';
  const isCustomPurpose = purposeVal === 'Custom';

  // 6. PREPARED BY: Prefill logged-in Valuer Firm (System prefill, no lock)
  const isPreparedByEdit = Boolean(fields.isfcPreparedByEditOn);
  const defaultFirm = fields.valuerFirm || 'S. MOHANTY & ASSOCIATES';
  const effectivePreparedBy = isPreparedByEdit
    ? (fields.isfcPreparedBy ?? '')
    : (fields.isfcPreparedBy || defaultFirm);

  // 7. Ref:-: Input Box (Fixed) + Checkbox "NA"
  const isRefNA = Boolean(fields.isfcRefNoNA);
  const effectiveRef = isRefNA
    ? 'NA'
    : (fields.isfcRefNo ?? (projectCode || fields.refNo || ''));

  // 8. Date:-: Date Picker (System prefill, no lock)
  const isDateEdit = Boolean(fields.isfcDateEditOn);
  const effectiveDate = isDateEdit
    ? (fields.isfcDate ?? '')
    : (fields.isfcDate || todayStr);

  // 9. Valuer s Name: Prefill logged-in user (System prefill, no lock)
  const isValuerNameEdit = Boolean(fields.isfcValuerNameEditOn);
  const defaultValuer = fields.engineerName || fields.valuerName || 'Er. S. Mohanty';
  const effectiveValuerName = isValuerNameEdit
    ? (fields.isfcValuerName ?? '')
    : (fields.isfcValuerName || defaultValuer);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Section 1 Containers: Light Gray ('#f5f5f5') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              VALUATION OF IMMOVABLE PROPERTY
            </h3>
          </div>
          <span className="text-xs text-gray-600 font-medium bg-gray-200/80 px-2.5 py-1 rounded-md border border-gray-300">
            Section 1 Details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* PROPERTY OWNER: Textarea (Variable size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                PROPERTY OWNER
              </span>
            }
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Enter property owner name(s)..."
              value={effectivePropertyOwner}
              onChange={(e) => {
                handleChange('isfcPropertyOwner', e.target.value);
                handleChange('propertyOwner', e.target.value);
              }}
              disabled={isReadOnly}
            />
          </Field>

          {/* ADDRESS OF THE PROPERTY: Textarea (Variable size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                ADDRESS OF THE PROPERTY
              </span>
            }
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Enter complete address of the property..."
              value={effectivePropertyAddress}
              onChange={(e) => {
                handleChange('isfcPropertyAddress', e.target.value);
                handleChange('propertyAddress', e.target.value);
              }}
              disabled={isReadOnly}
            />
          </Field>

          {/* PRESENT MARKET VALUE: Auto-calculating Input (Numeric) + Lock UI + Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  PRESENT MARKET VALUE
                </span>
                <EditSwitch
                  checked={isPmvEdit}
                  onChange={(val) => {
                    handleChange('isfcPresentMarketValueEditOn', val);
                    if (val && !fields.isfcPresentMarketValue) {
                      handleChange('isfcPresentMarketValue', autoPmvStr);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!isPmvEdit}
              tooltipMessage='>>Auto calculating from [Section 5 "Total value"]<<'
            >
              <div className="relative">
                <input
                  type={isPmvEdit ? 'number' : 'text'}
                  className={`${inputCls} pr-9 ${
                    !isPmvEdit
                      ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                      : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                  }`}
                  placeholder="0"
                  value={effectivePmv}
                  onChange={(e) => {
                    handleChange('isfcPresentMarketValue', e.target.value);
                    handleChange('presentMarketValue', e.target.value);
                  }}
                  disabled={isReadOnly || !isPmvEdit}
                  title={!isPmvEdit ? '>>Auto calculating from [Section 5 "Total value"]<<' : undefined}
                />
                {!isPmvEdit && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* DISTRESS SALE VALUE: Auto-calculating Input (Numeric) + Lock UI + Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  DISTRESS SALE VALUE
                </span>
                <EditSwitch
                  checked={isDistressEdit}
                  onChange={(val) => {
                    handleChange('isfcDistressSaleValueEditOn', val);
                    if (val && !fields.isfcDistressSaleValue) {
                      handleChange('isfcDistressSaleValue', autoDistressStr);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!isDistressEdit}
              tooltipMessage='>>Auto calculating from [Section 1 "PRESENT MARKET VALUE" * 0.75]<<'
            >
              <div className="relative">
                <input
                  type={isDistressEdit ? 'number' : 'text'}
                  className={`${inputCls} pr-9 ${
                    !isDistressEdit
                      ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                      : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                  }`}
                  placeholder="0"
                  value={effectiveDistress}
                  onChange={(e) => {
                    handleChange('isfcDistressSaleValue', e.target.value);
                    handleChange('distressSaleValue', e.target.value);
                  }}
                  disabled={isReadOnly || !isDistressEdit}
                  title={!isDistressEdit ? '>>Auto calculating from [Section 1 "PRESENT MARKET VALUE" * 0.75]<<' : undefined}
                />
                {!isDistressEdit && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* PURPOSE OF VALUATION: Dropdown with Custom option (Fixed Size adjacent Input Box) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                PURPOSE OF VALUATION
              </span>
            }
            span={2}
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                className={`${inputCls} ${isCustomPurpose ? 'sm:w-1/2' : 'w-full'}`}
                value={purposeVal}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('isfcPurposeOfValuation', val);
                  if (val !== 'Custom') {
                    handleChange('purpose', val);
                  } else if (fields.isfcPurposeOfValuationCustom) {
                    handleChange('purpose', fields.isfcPurposeOfValuationCustom);
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY">
                  TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY
                </option>
                <option value="Mortgage">Mortgage</option>
                <option value="Sale">Sale</option>
                <option value="Custom">Custom</option>
              </select>
              {isCustomPurpose && (
                <input
                  type="text"
                  className={`${inputCls} sm:w-1/2 bg-amber-50/50 border-amber-300 text-gray-900 placeholder:text-gray-400`}
                  placeholder="Enter custom purpose of valuation..."
                  value={fields.isfcPurposeOfValuationCustom || ''}
                  onChange={(e) => {
                    handleChange('isfcPurposeOfValuationCustom', e.target.value);
                    handleChange('purpose', e.target.value);
                  }}
                  disabled={isReadOnly}
                />
              )}
            </div>
          </Field>

          {/* PREPARED BY: Prefill Input Box (System prefill, no lock) */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  PREPARED BY
                </span>
                <EditSwitch
                  checked={isPreparedByEdit}
                  onChange={(val) => {
                    handleChange('isfcPreparedByEditOn', val);
                    if (val && !fields.isfcPreparedBy) {
                      handleChange('isfcPreparedBy', defaultFirm);
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
                !isPreparedByEdit
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                  : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
              }`}
              value={effectivePreparedBy}
              onChange={(e) => handleChange('isfcPreparedBy', e.target.value)}
              disabled={isReadOnly || !isPreparedByEdit}
              placeholder="e.g. S. MOHANTY & ASSOCIATES"
            />
          </Field>

          {/* Valuer s Name: Prefill Input Box (System prefill, no lock) */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Valuer s Name
                </span>
                <EditSwitch
                  checked={isValuerNameEdit}
                  onChange={(val) => {
                    handleChange('isfcValuerNameEditOn', val);
                    if (val && !fields.isfcValuerName) {
                      handleChange('isfcValuerName', defaultValuer);
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
                !isValuerNameEdit
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                  : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
              }`}
              value={effectiveValuerName}
              onChange={(e) => handleChange('isfcValuerName', e.target.value)}
              disabled={isReadOnly || !isValuerNameEdit}
              placeholder="e.g. Er. S. Mohanty"
            />
          </Field>

          {/* Ref:-: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">Ref:-</span>
                <NaCheckbox
                  checked={isRefNA}
                  onChange={(checked) => {
                    handleChange('isfcRefNoNA', checked);
                    if (checked) {
                      handleChange('isfcRefNo', 'NA');
                    } else {
                      handleChange('isfcRefNo', projectCode || fields.refNo || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${isRefNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={effectiveRef}
              onChange={(e) => handleChange('isfcRefNo', e.target.value)}
              disabled={isReadOnly || isRefNA}
              placeholder="e.g. SMA/ISFC/2026/001"
            />
          </Field>

          {/* Date:-: Date Picker (System prefill, no lock) */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">Date:-</span>
                <EditSwitch
                  checked={isDateEdit}
                  onChange={(val) => {
                    handleChange('isfcDateEditOn', val);
                    if (val && !fields.isfcDate) {
                      handleChange('isfcDate', todayStr);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="date"
              className={`${inputCls} ${
                !isDateEdit
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                  : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
              }`}
              value={effectiveDate}
              onChange={(e) => {
                handleChange('isfcDate', e.target.value);
                handleChange('dateOfValuation', e.target.value);
              }}
              disabled={isReadOnly || !isDateEdit}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── ISFC BankConfig ─────────────────────────────────────────────────────────

export const ISFC_CONFIG: BankConfig = {
  bankId: 'ISFC',
  subTemplateId: '',
  displayName: 'Indian School Finance Company (ISFC)',
  hiddenSections: [
    'section-1', // Replaced by Section 1: VALUATION OF IMMOVABLE PROPERTY
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'isfc-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'section-2', title: 'Physical Details' },
    { id: 'section-3', title: 'Boundaries' },
    { id: 'section-4', title: 'Building Specifications' },
    { id: 'section-5', title: 'Valuation Calculation' },
    { id: 'section-6', title: 'NDMA & ESG' },
    { id: 'section-7', title: 'Critical Checks & Summary' },
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
      id: 'isfc-section-1',
      title: 'VALUATION OF IMMOVABLE PROPERTY',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <ValuationImmovablePropertySection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
  ],
  defaultValues: {
    purpose: 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY',
    isfcPurposeOfValuation: 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY',
    isfcPreparedBy: 'S. MOHANTY & ASSOCIATES',
    isfcValuerName: 'Er. S. Mohanty',
    isfcDate: new Date().toISOString().split('T')[0],
  },
};

export default function ISFC(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ISFC_CONFIG} {...props} />;
}
