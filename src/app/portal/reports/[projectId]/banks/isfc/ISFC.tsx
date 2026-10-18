'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import {
  Lock,
  Building,
  FileText,
  MapPin,
  Navigation,
  Ruler,
  ShieldAlert,
  Compass,
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
      <select
        className={`${inputCls} ${isCustom ? 'sm:w-1/2' : 'w-full'}`}
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
          className={`${inputCls} sm:w-1/2 bg-amber-50/50 border-amber-300 text-gray-900 placeholder:text-gray-400`}
          value={customValue || ''}
          onChange={(e) => onCustomChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter custom value..."
        />
      )}
    </div>
  );
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  disabled = false,
}: {
  name: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[] | string[];
  disabled?: boolean;
}) {
  const normOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  return (
    <div className="flex flex-wrap items-center gap-4 pt-1">
      {normOptions.map((opt) => {
        const isSelected = (value || normOptions[0].value).toLowerCase() === opt.value.toLowerCase();
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 cursor-pointer text-xs md:text-sm font-medium select-none ${
              disabled ? 'opacity-60 cursor-not-allowed' : 'text-gray-800 hover:text-gray-950'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
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

// ─── Section 2: APPLICATION DETAILS Component ───────────────────────────────

export function ApplicationDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // 5. Property owner s name: Prefills from Section 1 PROPERTY OWNER
  const sec1PropertyOwner = fields.isfcPropertyOwner || fields.propertyOwner || fields.customerName || '';
  const isOwnerEdit = Boolean(fields.isfcPropertyOwnerNameSec2EditOn);
  const effectivePropertyOwnerSec2 = isOwnerEdit
    ? (fields.isfcPropertyOwnerNameSec2 ?? '')
    : (sec1PropertyOwner || fields.isfcPropertyOwnerNameSec2 || '');

  // 12. Address of property documents: Prefills from Section 1 ADDRESS OF THE PROPERTY
  const sec1PropertyAddress = fields.isfcPropertyAddress || fields.propertyAddress || fields.legalAddress || '';
  const isAddressDocsEdit = Boolean(fields.isfcAddressDocumentsEditOn);
  const effectiveAddressDocuments = isAddressDocsEdit
    ? (fields.isfcAddressDocuments ?? '')
    : (sec1PropertyAddress || fields.isfcAddressDocuments || '');

  // 13. As per site: Checkbox: "Same as Address of property documents"
  const isAddressSiteSameAsDoc = Boolean(fields.isfcAddressSiteSameAsDoc);
  const isAddressSiteEdit = Boolean(fields.isfcAddressSiteEditOn);
  const effectiveAddressSite = isAddressSiteSameAsDoc
    ? (isAddressSiteEdit
        ? (fields.isfcAddressSite ?? '')
        : (effectiveAddressDocuments || fields.isfcAddressSite || ''))
    : (fields.isfcAddressSite ?? '');

  // 23 & 24. Site boundaries (Document vs Site Comparison)
  const isBoundariesSameAsDoc = Boolean(fields.isfcBoundariesSiteSameAsDoc);
  const isBoundariesSiteEdit = Boolean(fields.isfcBoundariesSiteEditOn);

  const docNorth = fields.isfcBoundaryNorthDoc ?? (fields.boundaryNorth || '');
  const docSouth = fields.isfcBoundarySouthDoc ?? (fields.boundarySouth || '');
  const docEast = fields.isfcBoundaryEastDoc ?? (fields.boundaryEast || '');
  const docWest = fields.isfcBoundaryWestDoc ?? (fields.boundaryWest || '');

  const effectiveSiteNorth = isBoundariesSameAsDoc
    ? (isBoundariesSiteEdit ? (fields.isfcBoundaryNorthSite ?? '') : (docNorth || fields.isfcBoundaryNorthSite || ''))
    : (fields.isfcBoundaryNorthSite ?? (fields.buildingBoundaryNorth || ''));

  const effectiveSiteSouth = isBoundariesSameAsDoc
    ? (isBoundariesSiteEdit ? (fields.isfcBoundarySouthSite ?? '') : (docSouth || fields.isfcBoundarySouthSite || ''))
    : (fields.isfcBoundarySouthSite ?? (fields.buildingBoundarySouth || ''));

  const effectiveSiteEast = isBoundariesSameAsDoc
    ? (isBoundariesSiteEdit ? (fields.isfcBoundaryEastSite ?? '') : (docEast || fields.isfcBoundaryEastSite || ''))
    : (fields.isfcBoundaryEastSite ?? (fields.buildingBoundaryEast || ''));

  const effectiveSiteWest = isBoundariesSameAsDoc
    ? (isBoundariesSiteEdit ? (fields.isfcBoundaryWestSite ?? '') : (docWest || fields.isfcBoundaryWestSite || ''))
    : (fields.isfcBoundaryWestSite ?? (fields.buildingBoundaryWest || ''));

  // 31. FAR deviation %: Auto-calculates from [(Constructed area at site / Sanctioned area) * 100]
  const isFarEdit = Boolean(fields.isfcFarDeviationEditOn);
  const sanctionedAreaVal = fields.isfcSanctionedAreaNA ? 0 : (parseFloat(String(fields.isfcSanctionedArea ?? '').replace(/[^0-9.]/g, '')) || 0);
  const constructedAreaVal = parseFloat(String(fields.isfcConstructedArea ?? '').replace(/[^0-9.]/g, '')) || 0;

  const autoFarDeviationStr = useMemo(() => {
    if (sanctionedAreaVal > 0 && constructedAreaVal > 0) {
      const far = (constructedAreaVal / sanctionedAreaVal) * 100;
      return `${Math.round((far + Number.EPSILON) * 100) / 100}%`;
    }
    return '';
  }, [sanctionedAreaVal, constructedAreaVal]);

  const effectiveFarDeviation = isFarEdit
    ? (fields.isfcFarDeviation ?? '')
    : (autoFarDeviationStr || fields.isfcFarDeviation || '');

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container 1: Application & Applicant Details (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Application & Applicant Details
            </h3>
          </div>
          <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Section 2: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Prospect no.: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">Prospect no.</span>
                <NaCheckbox
                  checked={Boolean(fields.isfcProspectNoNA)}
                  onChange={(checked) => {
                    handleChange('isfcProspectNoNA', checked);
                    if (checked) {
                      handleChange('isfcProspectNo', 'NA');
                    } else {
                      handleChange('isfcProspectNo', fields.loanApplicationNumber || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.isfcProspectNoNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcProspectNoNA ? 'NA' : (fields.isfcProspectNo ?? (fields.loanApplicationNumber || ''))}
              onChange={(e) => handleChange('isfcProspectNo', e.target.value)}
              disabled={isReadOnly || fields.isfcProspectNoNA}
              placeholder="e.g. ISFC/PR/2026/1029"
            />
          </Field>

          {/* Loan type: Dropdown with Custom option */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">Loan type</span>
            }
          >
            <CustomSelect
              value={fields.isfcLoanType || 'Educational'}
              customValue={fields.isfcLoanTypeCustom || ''}
              onChange={(val) => handleChange('isfcLoanType', val)}
              onCustomChange={(val) => handleChange('isfcLoanTypeCustom', val)}
              options={[
                { value: 'Home', label: 'Home' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Educational', label: 'Educational' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Loan Type"
            />
          </Field>

          {/* Name of the applicant: Input Box (Fixed) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Name of the applicant
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.isfcApplicantName ?? (fields.customerName || fields.applicantName || '')}
              onChange={(e) => handleChange('isfcApplicantName', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Saraswati Vidya Mandir"
            />
          </Field>

          {/* Contact person s nos: Input Box (Fixed) + Checkbox "NA" (Numeric validation) */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Contact person s nos
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcContactPersonNosNA)}
                  onChange={(checked) => {
                    handleChange('isfcContactPersonNosNA', checked);
                    if (checked) {
                      handleChange('isfcContactPersonNos', 'NA');
                    } else {
                      handleChange('isfcContactPersonNos', fields.contactNumber || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="tel"
              className={`${inputCls} ${fields.isfcContactPersonNosNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcContactPersonNosNA ? 'NA' : (fields.isfcContactPersonNos ?? (fields.contactNumber || ''))}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9+\s\-]/g, '');
                handleChange('isfcContactPersonNos', cleaned);
              }}
              disabled={isReadOnly || fields.isfcContactPersonNosNA}
              placeholder="e.g. +91 9876543210"
            />
          </Field>

          {/* Property owner s name: Prefill Input Box + Lock UI + Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Property owner s name
                </span>
                <EditSwitch
                  checked={isOwnerEdit}
                  onChange={(val) => {
                    handleChange('isfcPropertyOwnerNameSec2EditOn', val);
                    if (val && !fields.isfcPropertyOwnerNameSec2) {
                      handleChange('isfcPropertyOwnerNameSec2', sec1PropertyOwner);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!isOwnerEdit}
              tooltipMessage='>>Prefill from section 1, "PROPERTY OWNER"<<'
            >
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} pr-9 ${
                    !isOwnerEdit
                      ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                      : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                  }`}
                  value={effectivePropertyOwnerSec2}
                  onChange={(e) => handleChange('isfcPropertyOwnerNameSec2', e.target.value)}
                  disabled={isReadOnly || !isOwnerEdit}
                  placeholder="e.g. Property Owner Name"
                  title={!isOwnerEdit ? '>>Prefill from section 1, "PROPERTY OWNER"<<' : undefined}
                />
                {!isOwnerEdit && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Holding type: Dropdown with Custom */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">Holding type</span>
            }
          >
            <CustomSelect
              value={fields.isfcHoldingType || 'Freehold'}
              customValue={fields.isfcHoldingTypeCustom || ''}
              onChange={(val) => handleChange('isfcHoldingType', val)}
              onCustomChange={(val) => handleChange('isfcHoldingTypeCustom', val)}
              options={[
                { value: 'Freehold', label: 'Freehold' },
                { value: 'Leasehold', label: 'Leasehold' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Holding Type"
            />
          </Field>

          {/* Property usage actual: Dropdown with Custom */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Property usage actual
              </span>
            }
          >
            <CustomSelect
              value={fields.isfcPropertyUsageActual || 'Institutional'}
              customValue={fields.isfcPropertyUsageActualCustom || ''}
              onChange={(val) => handleChange('isfcPropertyUsageActual', val)}
              onCustomChange={(val) => handleChange('isfcPropertyUsageActualCustom', val)}
              options={[
                { value: 'Institutional', label: 'Institutional' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Residential', label: 'Residential' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Property Usage"
            />
          </Field>

          {/* Are sale deed & sanction plan provided: Radio Buttons (Yes / No) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Are sale deed & sanction plan provided
              </span>
            }
          >
            <RadioGroup
              name="isfcSaleDeedSanctionPlanProvided"
              value={fields.isfcSaleDeedSanctionPlanProvided || 'Yes'}
              onChange={(val) => handleChange('isfcSaleDeedSanctionPlanProvided', val)}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* Within municipal limits/outskirts: Radio Buttons */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Within municipal limits/outskirts
              </span>
            }
            span={2}
          >
            <RadioGroup
              name="isfcMunicipalLimits"
              value={fields.isfcMunicipalLimits || 'Within Municipal Limits'}
              onChange={(val) => handleChange('isfcMunicipalLimits', val)}
              options={['Within Municipal Limits', 'Outskirts', 'Gram Panchayat']}
              disabled={isReadOnly}
            />
          </Field>

          {/* Property description: Textarea (Variable size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Property description
              </span>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Provide general property description..."
              value={fields.isfcPropertyDescription ?? (fields.propertyDescription || '')}
              onChange={(e) => handleChange('isfcPropertyDescription', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* Documents details: Textarea (Variable size) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Documents details
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcDocumentsDetailsNA)}
                  onChange={(checked) => {
                    handleChange('isfcDocumentsDetailsNA', checked);
                    if (checked) {
                      handleChange('isfcDocumentsDetails', 'NA');
                    } else {
                      handleChange('isfcDocumentsDetails', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Enter details of deeds, approved plans, mutaton, patta..."
              value={fields.isfcDocumentsDetailsNA ? 'NA' : (fields.isfcDocumentsDetails ?? '')}
              onChange={(e) => handleChange('isfcDocumentsDetails', e.target.value)}
              disabled={isReadOnly || fields.isfcDocumentsDetailsNA}
              className={fields.isfcDocumentsDetailsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}
            />
          </Field>
        </div>
      </div>

      {/* ─── Container 2: Location & Address Parameters (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Property Address & Location Parameters
            </h3>
          </div>
          <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Section 2: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Address of property documents: Prefill Textarea + Lock UI */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Address of property documents
                </span>
                <EditSwitch
                  checked={isAddressDocsEdit}
                  onChange={(val) => {
                    handleChange('isfcAddressDocumentsEditOn', val);
                    if (val && !fields.isfcAddressDocuments) {
                      handleChange('isfcAddressDocuments', sec1PropertyAddress);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            <LockedFieldWrapper
              isLocked={!isAddressDocsEdit}
              tooltipMessage='>>Prefill from section 1, "ADDRESS OF THE PROPERTY"<<'
            >
              <div className="relative">
                <AutoResizeTextarea
                  rows={2}
                  className={`pr-9 ${
                    !isAddressDocsEdit
                      ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                      : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                  }`}
                  value={effectiveAddressDocuments}
                  onChange={(e) => handleChange('isfcAddressDocuments', e.target.value)}
                  disabled={isReadOnly || !isAddressDocsEdit}
                  placeholder="Property address as per title documents..."
                />
                {!isAddressDocsEdit && (
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* As per site: Checkbox + Textarea + Lock UI */}
          <Field
            label={
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700 text-xs md:text-sm">
                    As per site
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAddressSiteSameAsDoc}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleChange('isfcAddressSiteSameAsDoc', checked);
                        if (checked && !isAddressSiteEdit) {
                          handleChange('isfcAddressSite', effectiveAddressDocuments);
                        }
                      }}
                      disabled={isReadOnly}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-blue-900">
                      Same as Address of property documents
                    </span>
                  </label>
                </div>
                {isAddressSiteSameAsDoc && (
                  <EditSwitch
                    checked={isAddressSiteEdit}
                    onChange={(val) => {
                      handleChange('isfcAddressSiteEditOn', val);
                      if (val && !fields.isfcAddressSite) {
                        handleChange('isfcAddressSite', effectiveAddressDocuments);
                      }
                    }}
                    disabled={isReadOnly}
                  />
                )}
              </div>
            }
            span={2}
          >
            <LockedFieldWrapper
              isLocked={isAddressSiteSameAsDoc && !isAddressSiteEdit}
              tooltipMessage='>>Prefill from section 2, "Address of property documents"<<'
            >
              <div className="relative">
                <AutoResizeTextarea
                  rows={2}
                  className={`pr-9 ${
                    isAddressSiteSameAsDoc && !isAddressSiteEdit
                      ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                      : isAddressSiteSameAsDoc && isAddressSiteEdit
                      ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                      : ''
                  }`}
                  value={effectiveAddressSite}
                  onChange={(e) => handleChange('isfcAddressSite', e.target.value)}
                  disabled={isReadOnly || (isAddressSiteSameAsDoc && !isAddressSiteEdit)}
                  placeholder="Property address inspected at site..."
                />
                {isAddressSiteSameAsDoc && !isAddressSiteEdit && (
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* Landmark: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">Landmark</span>
                <NaCheckbox
                  checked={Boolean(fields.isfcLandmarkNA)}
                  onChange={(checked) => {
                    handleChange('isfcLandmarkNA', checked);
                    if (checked) {
                      handleChange('isfcLandmark', 'NA');
                    } else {
                      handleChange('isfcLandmark', fields.landmark || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.isfcLandmarkNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcLandmarkNA ? 'NA' : (fields.isfcLandmark ?? (fields.landmark || ''))}
              onChange={(e) => handleChange('isfcLandmark', e.target.value)}
              disabled={isReadOnly || fields.isfcLandmarkNA}
              placeholder="e.g. Near Royal Plaza"
            />
          </Field>

          {/* Locality: Input Box (Fixed) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">Locality</span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.isfcLocality ?? (fields.locality || fields.localityType || '')}
              onChange={(e) => handleChange('isfcLocality', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Patia / Chandrasekharpur"
            />
          </Field>

          {/* Nature of the location: Dropdown with Custom */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Nature of the location
              </span>
            }
          >
            <CustomSelect
              value={fields.isfcNatureOfLocation || 'Commercial'}
              customValue={fields.isfcNatureOfLocationCustom || ''}
              onChange={(val) => handleChange('isfcNatureOfLocation', val)}
              onCustomChange={(val) => handleChange('isfcNatureOfLocationCustom', val)}
              options={[
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Residential', label: 'Residential' },
                { value: 'Mixed', label: 'Mixed' },
                { value: 'Industrial', label: 'Industrial' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Nature of Location"
            />
          </Field>

          {/* Road width: Input Box (Fixed) + Checkbox "NA" + unit dropdown (ft, m) */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">Road width</span>
                <NaCheckbox
                  checked={Boolean(fields.isfcRoadWidthNA)}
                  onChange={(checked) => {
                    handleChange('isfcRoadWidthNA', checked);
                    if (checked) {
                      handleChange('isfcRoadWidth', 'NA');
                    } else {
                      handleChange('isfcRoadWidth', fields.roadWidth || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                className={`${inputCls} flex-1 ${fields.isfcRoadWidthNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
                value={fields.isfcRoadWidthNA ? 'NA' : (fields.isfcRoadWidth ?? (fields.roadWidth || ''))}
                onChange={(e) => handleChange('isfcRoadWidth', e.target.value)}
                disabled={isReadOnly || fields.isfcRoadWidthNA}
                placeholder="e.g. 40"
              />
              <select
                className={`${inputCls} w-24 shrink-0`}
                value={fields.isfcRoadWidthUnit || 'ft'}
                onChange={(e) => handleChange('isfcRoadWidthUnit', e.target.value)}
                disabled={isReadOnly || fields.isfcRoadWidthNA}
              >
                <option value="ft">ft</option>
                <option value="m">m</option>
              </select>
            </div>
          </Field>

          {/* Accessibility: Dropdown with Custom */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Accessibility
              </span>
            }
            span={2}
          >
            <CustomSelect
              value={fields.isfcAccessibility || 'Independent access'}
              customValue={fields.isfcAccessibilityCustom || ''}
              onChange={(val) => handleChange('isfcAccessibility', val)}
              onCustomChange={(val) => handleChange('isfcAccessibilityCustom', val)}
              options={[
                { value: 'Independent access', label: 'Independent access' },
                { value: 'Shared access', label: 'Shared access' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Accessibility"
            />
          </Field>
        </div>
      </div>

      {/* ─── Container 3: Proximity to Civic Amenities (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Proximity to Civic Amenities
            </h3>
          </div>
          <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Section 2: Container 3
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Proximity to Bus Stop: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Proximity to Bus Stop
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcProximityBusStopNA)}
                  onChange={(checked) => {
                    handleChange('isfcProximityBusStopNA', checked);
                    if (checked) {
                      handleChange('isfcProximityBusStop', 'NA');
                    } else {
                      handleChange('isfcProximityBusStop', fields.distanceBusStop || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.isfcProximityBusStopNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcProximityBusStopNA ? 'NA' : (fields.isfcProximityBusStop ?? (fields.distanceBusStop || ''))}
              onChange={(e) => handleChange('isfcProximityBusStop', e.target.value)}
              disabled={isReadOnly || fields.isfcProximityBusStopNA}
              placeholder="e.g. 0.5 Km"
            />
          </Field>

          {/* Proximity to Hospital: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Proximity to Hospital
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcProximityHospitalNA)}
                  onChange={(checked) => {
                    handleChange('isfcProximityHospitalNA', checked);
                    if (checked) {
                      handleChange('isfcProximityHospital', 'NA');
                    } else {
                      handleChange('isfcProximityHospital', fields.distanceHospital || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.isfcProximityHospitalNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcProximityHospitalNA ? 'NA' : (fields.isfcProximityHospital ?? (fields.distanceHospital || ''))}
              onChange={(e) => handleChange('isfcProximityHospital', e.target.value)}
              disabled={isReadOnly || fields.isfcProximityHospitalNA}
              placeholder="e.g. 1.5 Km"
            />
          </Field>

          {/* Proximity to Railway Station: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Proximity to Railway Station
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcProximityRailwayStationNA)}
                  onChange={(checked) => {
                    handleChange('isfcProximityRailwayStationNA', checked);
                    if (checked) {
                      handleChange('isfcProximityRailwayStation', 'NA');
                    } else {
                      handleChange('isfcProximityRailwayStation', fields.distanceRailway || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.isfcProximityRailwayStationNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcProximityRailwayStationNA ? 'NA' : (fields.isfcProximityRailwayStation ?? (fields.distanceRailway || ''))}
              onChange={(e) => handleChange('isfcProximityRailwayStation', e.target.value)}
              disabled={isReadOnly || fields.isfcProximityRailwayStationNA}
              placeholder="e.g. 5.0 Km"
            />
          </Field>

          {/* Proximity to Other amenities: Textarea (Variable size) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Proximity to Other amenities
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcProximityOtherAmenitiesNA)}
                  onChange={(checked) => {
                    handleChange('isfcProximityOtherAmenitiesNA', checked);
                    if (checked) {
                      handleChange('isfcProximityOtherAmenities', 'NA');
                    } else {
                      handleChange('isfcProximityOtherAmenities', fields.civicAmenitiesOther || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
            span={3}
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Schools, banks, ATMs, market places, government offices etc..."
              value={fields.isfcProximityOtherAmenitiesNA ? 'NA' : (fields.isfcProximityOtherAmenities ?? (fields.civicAmenitiesOther || ''))}
              onChange={(e) => handleChange('isfcProximityOtherAmenities', e.target.value)}
              disabled={isReadOnly || fields.isfcProximityOtherAmenitiesNA}
              className={fields.isfcProximityOtherAmenitiesNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}
            />
          </Field>
        </div>
      </div>

      {/* ─── Container 4: Site Boundaries Table (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Site Boundaries (Document vs Site Comparison)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBoundariesSameAsDoc}
                onChange={(e) => {
                  const checked = e.target.checked;
                  handleChange('isfcBoundariesSiteSameAsDoc', checked);
                  if (checked && !isBoundariesSiteEdit) {
                    handleChange('isfcBoundaryNorthSite', docNorth);
                    handleChange('isfcBoundarySouthSite', docSouth);
                    handleChange('isfcBoundaryEastSite', docEast);
                    handleChange('isfcBoundaryWestSite', docWest);
                  }
                }}
                disabled={isReadOnly}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-blue-900">
                Same as document
              </span>
            </label>
            {isBoundariesSameAsDoc && (
              <EditSwitch
                checked={isBoundariesSiteEdit}
                onChange={(val) => {
                  handleChange('isfcBoundariesSiteEditOn', val);
                  if (val) {
                    if (!fields.isfcBoundaryNorthSite) handleChange('isfcBoundaryNorthSite', docNorth);
                    if (!fields.isfcBoundarySouthSite) handleChange('isfcBoundarySouthSite', docSouth);
                    if (!fields.isfcBoundaryEastSite) handleChange('isfcBoundaryEastSite', docEast);
                    if (!fields.isfcBoundaryWestSite) handleChange('isfcBoundaryWestSite', docWest);
                  }
                }}
                disabled={isReadOnly}
              />
            )}
          </div>
        </div>

        {/* Table Format */}
        <div className="overflow-x-auto rounded-lg border border-blue-300 bg-white/70">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-blue-100/90 text-xs uppercase font-semibold text-blue-900 border-b border-blue-200">
              <tr>
                <th className="px-4 py-3 w-36">Direction</th>
                <th className="px-4 py-3">Site boundaries - As per document</th>
                <th className="px-4 py-3">Site boundaries - As per site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-200/70">
              {/* East */}
              <tr className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  East
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={docEast}
                    onChange={(e) => {
                      handleChange('isfcBoundaryEastDoc', e.target.value);
                      handleChange('boundaryEast', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="Boundary as per document (East)..."
                  />
                </td>
                <td className="px-4 py-2">
                  <LockedFieldWrapper
                    isLocked={isBoundariesSameAsDoc && !isBoundariesSiteEdit}
                    tooltipMessage='>>Prefill from section 2, "Site boundaries - As per document"<<'
                  >
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} pr-8 ${
                          isBoundariesSameAsDoc && !isBoundariesSiteEdit
                            ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                            : isBoundariesSameAsDoc && isBoundariesSiteEdit
                            ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                            : ''
                        }`}
                        value={effectiveSiteEast}
                        onChange={(e) => {
                          handleChange('isfcBoundaryEastSite', e.target.value);
                          handleChange('buildingBoundaryEast', e.target.value);
                        }}
                        disabled={isReadOnly || (isBoundariesSameAsDoc && !isBoundariesSiteEdit)}
                        placeholder="Boundary at site (East)..."
                        title={isBoundariesSameAsDoc && !isBoundariesSiteEdit ? '>>Prefill from section 2, "Site boundaries - As per document"<<' : undefined}
                      />
                      {isBoundariesSameAsDoc && !isBoundariesSiteEdit && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                    </div>
                  </LockedFieldWrapper>
                </td>
              </tr>

              {/* West */}
              <tr className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  West
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={docWest}
                    onChange={(e) => {
                      handleChange('isfcBoundaryWestDoc', e.target.value);
                      handleChange('boundaryWest', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="Boundary as per document (West)..."
                  />
                </td>
                <td className="px-4 py-2">
                  <LockedFieldWrapper
                    isLocked={isBoundariesSameAsDoc && !isBoundariesSiteEdit}
                    tooltipMessage='>>Prefill from section 2, "Site boundaries - As per document"<<'
                  >
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} pr-8 ${
                          isBoundariesSameAsDoc && !isBoundariesSiteEdit
                            ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                            : isBoundariesSameAsDoc && isBoundariesSiteEdit
                            ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                            : ''
                        }`}
                        value={effectiveSiteWest}
                        onChange={(e) => {
                          handleChange('isfcBoundaryWestSite', e.target.value);
                          handleChange('buildingBoundaryWest', e.target.value);
                        }}
                        disabled={isReadOnly || (isBoundariesSameAsDoc && !isBoundariesSiteEdit)}
                        placeholder="Boundary at site (West)..."
                        title={isBoundariesSameAsDoc && !isBoundariesSiteEdit ? '>>Prefill from section 2, "Site boundaries - As per document"<<' : undefined}
                      />
                      {isBoundariesSameAsDoc && !isBoundariesSiteEdit && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                    </div>
                  </LockedFieldWrapper>
                </td>
              </tr>

              {/* North */}
              <tr className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  North
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={docNorth}
                    onChange={(e) => {
                      handleChange('isfcBoundaryNorthDoc', e.target.value);
                      handleChange('boundaryNorth', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="Boundary as per document (North)..."
                  />
                </td>
                <td className="px-4 py-2">
                  <LockedFieldWrapper
                    isLocked={isBoundariesSameAsDoc && !isBoundariesSiteEdit}
                    tooltipMessage='>>Prefill from section 2, "Site boundaries - As per document"<<'
                  >
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} pr-8 ${
                          isBoundariesSameAsDoc && !isBoundariesSiteEdit
                            ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                            : isBoundariesSameAsDoc && isBoundariesSiteEdit
                            ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                            : ''
                        }`}
                        value={effectiveSiteNorth}
                        onChange={(e) => {
                          handleChange('isfcBoundaryNorthSite', e.target.value);
                          handleChange('buildingBoundaryNorth', e.target.value);
                        }}
                        disabled={isReadOnly || (isBoundariesSameAsDoc && !isBoundariesSiteEdit)}
                        placeholder="Boundary at site (North)..."
                        title={isBoundariesSameAsDoc && !isBoundariesSiteEdit ? '>>Prefill from section 2, "Site boundaries - As per document"<<' : undefined}
                      />
                      {isBoundariesSameAsDoc && !isBoundariesSiteEdit && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                    </div>
                  </LockedFieldWrapper>
                </td>
              </tr>

              {/* South */}
              <tr className="hover:bg-blue-50/40">
                <td className="px-4 py-3 font-semibold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  South
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={docSouth}
                    onChange={(e) => {
                      handleChange('isfcBoundarySouthDoc', e.target.value);
                      handleChange('boundarySouth', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="Boundary as per document (South)..."
                  />
                </td>
                <td className="px-4 py-2">
                  <LockedFieldWrapper
                    isLocked={isBoundariesSameAsDoc && !isBoundariesSiteEdit}
                    tooltipMessage='>>Prefill from section 2, "Site boundaries - As per document"<<'
                  >
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} pr-8 ${
                          isBoundariesSameAsDoc && !isBoundariesSiteEdit
                            ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                            : isBoundariesSameAsDoc && isBoundariesSiteEdit
                            ? 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                            : ''
                        }`}
                        value={effectiveSiteSouth}
                        onChange={(e) => {
                          handleChange('isfcBoundarySouthSite', e.target.value);
                          handleChange('buildingBoundarySouth', e.target.value);
                        }}
                        disabled={isReadOnly || (isBoundariesSameAsDoc && !isBoundariesSiteEdit)}
                        placeholder="Boundary at site (South)..."
                        title={isBoundariesSameAsDoc && !isBoundariesSiteEdit ? '>>Prefill from section 2, "Site boundaries - As per document"<<' : undefined}
                      />
                      {isBoundariesSameAsDoc && !isBoundariesSiteEdit && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}
                    </div>
                  </LockedFieldWrapper>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Container 5: Building Sanction, Construction & Deviations (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Building Sanction, Construction & Deviations
            </h3>
          </div>
          <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Section 2: Container 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sanction plan availability: Radio Buttons */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Sanction plan availability
              </span>
            }
          >
            <RadioGroup
              name="isfcSanctionPlanAvailability"
              value={fields.isfcSanctionPlanAvailability || 'Available'}
              onChange={(val) => handleChange('isfcSanctionPlanAvailability', val)}
              options={['Available', 'Not Available']}
              disabled={isReadOnly}
            />
          </Field>

          {/* Property identification: Input Box (Fixed) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Property identification
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcPropertyIdentificationNA)}
                  onChange={(checked) => {
                    handleChange('isfcPropertyIdentificationNA', checked);
                    if (checked) {
                      handleChange('isfcPropertyIdentification', 'NA');
                    } else {
                      handleChange('isfcPropertyIdentification', fields.propertyIdentification || 'Easy to identify');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${fields.isfcPropertyIdentificationNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcPropertyIdentificationNA ? 'NA' : (fields.isfcPropertyIdentification ?? (fields.propertyIdentification || 'Easy to identify'))}
              onChange={(e) => handleChange('isfcPropertyIdentification', e.target.value)}
              disabled={isReadOnly || fields.isfcPropertyIdentificationNA}
              placeholder="e.g. Easy to identify"
            />
          </Field>

          {/* Sanctioned for floors: Input Box (Numeric) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Sanctioned for floors
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcSanctionedFloorsNA)}
                  onChange={(checked) => {
                    handleChange('isfcSanctionedFloorsNA', checked);
                    if (checked) {
                      handleChange('isfcSanctionedFloors', 'NA');
                    } else {
                      handleChange('isfcSanctionedFloors', fields.sanctionedFloors || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type={fields.isfcSanctionedFloorsNA ? 'text' : 'number'}
              className={`${inputCls} ${fields.isfcSanctionedFloorsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcSanctionedFloorsNA ? 'NA' : (fields.isfcSanctionedFloors ?? (fields.sanctionedFloors || ''))}
              onChange={(e) => handleChange('isfcSanctionedFloors', e.target.value)}
              disabled={isReadOnly || fields.isfcSanctionedFloorsNA}
              placeholder="e.g. 3"
            />
          </Field>

          {/* Constructed upto floors: Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Constructed upto floors
              </span>
            }
          >
            <input
              type="number"
              className={inputCls}
              value={fields.isfcConstructedFloors ?? (fields.actualFloors || fields.numberOfFloors || '')}
              onChange={(e) => handleChange('isfcConstructedFloors', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 3"
            />
          </Field>

          {/* Sanctioned area: Input Box (Numeric) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Sanctioned area (Sq.Ft.)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcSanctionedAreaNA)}
                  onChange={(checked) => {
                    handleChange('isfcSanctionedAreaNA', checked);
                    if (checked) {
                      handleChange('isfcSanctionedArea', 'NA');
                    } else {
                      handleChange('isfcSanctionedArea', fields.sanctionedArea || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type={fields.isfcSanctionedAreaNA ? 'text' : 'number'}
              className={`${inputCls} ${fields.isfcSanctionedAreaNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcSanctionedAreaNA ? 'NA' : (fields.isfcSanctionedArea ?? (fields.sanctionedArea || ''))}
              onChange={(e) => handleChange('isfcSanctionedArea', e.target.value)}
              disabled={isReadOnly || fields.isfcSanctionedAreaNA}
              placeholder="e.g. 5000"
            />
          </Field>

          {/* Constructed area at site: Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Constructed area at site (Sq.Ft.)
              </span>
            }
          >
            <input
              type="number"
              className={inputCls}
              value={fields.isfcConstructedArea ?? (fields.constructedArea || fields.builtUpArea || '')}
              onChange={(e) => handleChange('isfcConstructedArea', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 5200"
            />
          </Field>

          {/* FAR deviation %: Auto-calculating Input (Numeric) + Lock UI + Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  FAR deviation %
                </span>
                <EditSwitch
                  checked={isFarEdit}
                  onChange={(val) => {
                    handleChange('isfcFarDeviationEditOn', val);
                    if (val && !fields.isfcFarDeviation) {
                      handleChange('isfcFarDeviation', autoFarDeviationStr);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <LockedFieldWrapper
              isLocked={!isFarEdit}
              tooltipMessage='>>Auto calculating from [(Constructed area at site / Sanctioned area) * 100]<<'
            >
              <div className="relative">
                <input
                  type={isFarEdit ? 'text' : 'text'}
                  className={`${inputCls} pr-9 ${
                    !isFarEdit
                      ? 'bg-gray-100 cursor-not-allowed text-gray-700'
                      : 'bg-[#e8f5e9] border-emerald-500 text-emerald-950 font-semibold'
                  }`}
                  value={effectiveFarDeviation}
                  onChange={(e) => handleChange('isfcFarDeviation', e.target.value)}
                  disabled={isReadOnly || !isFarEdit}
                  placeholder="0%"
                  title={!isFarEdit ? '>>Auto calculating from [(Constructed area at site / Sanctioned area) * 100]<<' : undefined}
                />
                {!isFarEdit && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>
            </LockedFieldWrapper>
          </Field>

          {/* No. of units sanctioned: Input Box (Numeric) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  No. of units sanctioned
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcUnitsSanctionedNA)}
                  onChange={(checked) => {
                    handleChange('isfcUnitsSanctionedNA', checked);
                    if (checked) {
                      handleChange('isfcUnitsSanctioned', 'NA');
                    } else {
                      handleChange('isfcUnitsSanctioned', fields.sanctionedUnits || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type={fields.isfcUnitsSanctionedNA ? 'text' : 'number'}
              className={`${inputCls} ${fields.isfcUnitsSanctionedNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcUnitsSanctionedNA ? 'NA' : (fields.isfcUnitsSanctioned ?? (fields.sanctionedUnits || ''))}
              onChange={(e) => handleChange('isfcUnitsSanctioned', e.target.value)}
              disabled={isReadOnly || fields.isfcUnitsSanctionedNA}
              placeholder="e.g. 1"
            />
          </Field>

          {/* No. of units constructed: Input Box (Numeric) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  No. of units constructed
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcUnitsConstructedNA)}
                  onChange={(checked) => {
                    handleChange('isfcUnitsConstructedNA', checked);
                    if (checked) {
                      handleChange('isfcUnitsConstructed', 'NA');
                    } else {
                      handleChange('isfcUnitsConstructed', fields.actualUnits || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type={fields.isfcUnitsConstructedNA ? 'text' : 'number'}
              className={`${inputCls} ${fields.isfcUnitsConstructedNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}`}
              value={fields.isfcUnitsConstructedNA ? 'NA' : (fields.isfcUnitsConstructed ?? (fields.actualUnits || ''))}
              onChange={(e) => handleChange('isfcUnitsConstructed', e.target.value)}
              disabled={isReadOnly || fields.isfcUnitsConstructedNA}
              placeholder="e.g. 1"
            />
          </Field>

          {/* Setback deviation comments, if any: Textarea (Variable size) + Checkbox "NA" */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Setback deviation comments, if any
                </span>
                <NaCheckbox
                  checked={Boolean(fields.isfcSetbackDeviationCommentsNA)}
                  onChange={(checked) => {
                    handleChange('isfcSetbackDeviationCommentsNA', checked);
                    if (checked) {
                      handleChange('isfcSetbackDeviationComments', 'NA');
                    } else {
                      handleChange('isfcSetbackDeviationComments', fields.setbackDeviationComments || '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              placeholder="Front, rear, side setback observations..."
              value={fields.isfcSetbackDeviationCommentsNA ? 'NA' : (fields.isfcSetbackDeviationComments ?? (fields.setbackDeviationComments || ''))}
              onChange={(e) => handleChange('isfcSetbackDeviationComments', e.target.value)}
              disabled={isReadOnly || fields.isfcSetbackDeviationCommentsNA}
              className={fields.isfcSetbackDeviationCommentsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''}
            />
          </Field>

          {/* Can the deviation be regularized ? If yes,how ?: Radio (Yes/No/NA) + Textarea */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Can the deviation be regularized ? If yes, how ?
              </span>
            }
            span={2}
          >
            <div className="space-y-3">
              <RadioGroup
                name="isfcDeviationRegularized"
                value={fields.isfcDeviationRegularized || 'No'}
                onChange={(val) => handleChange('isfcDeviationRegularized', val)}
                options={['Yes', 'No', 'NA']}
                disabled={isReadOnly}
              />
              {(fields.isfcDeviationRegularized || '').toLowerCase() === 'yes' && (
                <div className="animate-fade-in pt-1">
                  <AutoResizeTextarea
                    rows={2}
                    placeholder="Specify how the deviation can be regularized (e.g. compounding fee, revised plan approval)..."
                    value={fields.isfcDeviationRegularizedHow || ''}
                    onChange={(e) => handleChange('isfcDeviationRegularizedHow', e.target.value)}
                    disabled={isReadOnly}
                    className="bg-white border-blue-300"
                  />
                </div>
              )}
            </div>
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
    'section-2', // Replaced by Section 2: APPLICATION DETAILS
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'isfc-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'isfc-section-2', title: 'APPLICATION DETAILS' },
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
    {
      id: 'isfc-section-2',
      title: 'APPLICATION DETAILS',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ApplicationDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
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
    isfcLoanType: 'Educational',
    isfcHoldingType: 'Freehold',
    isfcSaleDeedSanctionPlanProvided: 'Yes',
    isfcPropertyUsageActual: 'Institutional',
    isfcMunicipalLimits: 'Within Municipal Limits',
    isfcNatureOfLocation: 'Commercial',
    isfcRoadWidthUnit: 'ft',
    isfcAccessibility: 'Independent access',
    isfcBoundariesSiteSameAsDoc: false,
    isfcSanctionPlanAvailability: 'Available',
    isfcDeviationRegularized: 'No',
  },
};

export default function ISFC(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ISFC_CONFIG} {...props} />;
}
