'use client';

import React, { useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import {
  Building,
  Lock,
  Calculator,
  Target,
  UserCheck,
  Users,
  FileCheck,
  Compass,
  Home,
} from 'lucide-react';

// ─── Reusable Helper Components ─────────────────────────────────────────────

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

export function AutoResizeTextarea({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  placeholder = '',
  rows = 2,
  className = '',
  title,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;
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
      readOnly={readOnly}
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
    <div className="flex flex-wrap items-center gap-6 pt-1">
      {normOptions.map((opt) => {
        const isSelected =
          (value || normOptions[0].value).toLowerCase() ===
          opt.value.toLowerCase();
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 cursor-pointer text-xs md:text-sm font-medium select-none ${
              disabled
                ? 'opacity-60 cursor-not-allowed'
                : 'text-gray-800 hover:text-gray-950'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
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
        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
        NA
      </span>
    </label>
  );
}

// ─── Section 1: VALUATION OF IMMOVABLE PROPERTY ─────────────────────────────

function PropertyDetailsSection({
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
      {/* ─── Container: Property Details (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Property Details
            </h3>
          </div>
          <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Section 1: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* PROPERTY OWNER: Input Box (Text, Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                PROPERTY OWNER
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.poonawallaPropertyOwner ?? fields.propertyOwner ?? fields.ownerName ?? ''}
              onChange={(e) => {
                handleChange('poonawallaPropertyOwner', e.target.value);
                handleChange('propertyOwner', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Property Owner..."
            />
          </Field>

          {/* ADDRESS OF THE PROPERTY: Input Box with Variable Size (Textarea) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                ADDRESS OF THE PROPERTY
              </span>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={3}
              value={fields.poonawallaPropertyAddress ?? fields.propertyAddress ?? fields.address ?? ''}
              onChange={(e) => {
                handleChange('poonawallaPropertyAddress', e.target.value);
                handleChange('propertyAddress', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Address of the Property..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: VALUE OF THE PROPERTY ───────────────────────────────────────

function ValueOfThePropertySection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const parseNum = (v: any): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (typeof v === 'string') return parseFloat(v.replace(/,/g, '') || '0') || 0;
    return 0;
  };

  const totalBuildingValue =
    parseNum(fields.poonawallaTotalBuildingValue) ||
    parseNum(fields.totalBuildingValue) ||
    parseNum(fields.buildingValue) ||
    parseNum(fields.valuationAmount) ||
    0;

  const totalAmenitiesCharges =
    parseNum(fields.poonawallaAmenitiesCharges) ||
    parseNum(fields.amenitiesCharges) ||
    parseNum(fields.totalAmenitiesCharges) ||
    parseNum(fields.amenitiesValue) ||
    0;

  const autoMarketValue =
    totalBuildingValue > 0 || totalAmenitiesCharges > 0
      ? totalBuildingValue + totalAmenitiesCharges
      : parseNum(fields.marketValue) || parseNum(fields.presentMarketValue) || parseNum(fields.totalPropertyValue) || 0;

  const effectiveMarketValue = fields.poonawallaMarketValueEdit
    ? parseNum(fields.poonawallaMarketValueManual)
    : autoMarketValue;

  const autoDistressValue = Math.round(effectiveMarketValue * 0.8);
  const effectiveDistressValue = fields.poonawallaDistressValueEdit
    ? parseNum(fields.poonawallaDistressValueManual)
    : autoDistressValue;

  return (
    <div className="space-y-6">
      {/* ─── Container: Value Breakdown (Use Light Green '#e8f5e9') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-emerald-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Value Breakdown
            </h3>
          </div>
          <span className="text-xs text-emerald-800 font-medium bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
            Section 2: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* PRESENT MARKET VALUE: Auto-calculated Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  PRESENT MARKET VALUE
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaMarketValueEdit)}
                  onChange={(checked) => handleChange('poonawallaMarketValueEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaMarketValueEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-emerald-400 font-bold text-gray-900 text-base md:text-lg`}
                value={fields.poonawallaMarketValueManual ?? (autoMarketValue > 0 ? autoMarketValue : '')}
                onChange={(e) => {
                  handleChange('poonawallaMarketValueManual', e.target.value);
                  handleChange('marketValue', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Present Market Value..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Auto calculating from Total Building Value + Total Amenities charges"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950 cursor-not-allowed text-base md:text-lg`}
                  value={
                    effectiveMarketValue > 0
                      ? `₹ ${effectiveMarketValue.toLocaleString('en-IN')}`
                      : '₹ 0'
                  }
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* DISTRESS SALE VALUE: Auto-calculated Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  DISTRESS SALE VALUE
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaDistressValueEdit)}
                  onChange={(checked) => handleChange('poonawallaDistressValueEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaDistressValueEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-emerald-400 font-bold text-gray-900 text-base md:text-lg`}
                value={fields.poonawallaDistressValueManual ?? (autoDistressValue > 0 ? autoDistressValue : '')}
                onChange={(e) => {
                  handleChange('poonawallaDistressValueManual', e.target.value);
                  handleChange('distressValue', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Distress Sale Value..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Auto calculating from Market Value * 0.80"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950 cursor-not-allowed text-base md:text-lg`}
                  value={
                    effectiveDistressValue > 0
                      ? `₹ ${effectiveDistressValue.toLocaleString('en-IN')}`
                      : '₹ 0'
                  }
                />
              </LockedFieldWrapper>
            )}
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: PURPOSE OF VALUATION ────────────────────────────────────────

function PurposeOfValuationSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const isCustomVal =
    fields.poonawallaPurposeOfValuation === 'Custom' ||
    (fields.poonawallaPurposeOfValuation &&
      fields.poonawallaPurposeOfValuation !==
        'To assess the fair market value of the collateral security');

  const selectedValue =
    fields.poonawallaPurposeOfValuation ||
    (fields.purpose &&
    fields.purpose !== 'To assess the fair market value of the collateral security'
      ? 'Custom'
      : 'To assess the fair market value of the collateral security');

  const customVal =
    fields.poonawallaPurposeOfValuationCustom ??
    (isCustomVal ? fields.poonawallaPurposeOfValuation ?? fields.purpose ?? '' : '');

  return (
    <div className="space-y-6">
      {/* ─── Container: Valuation Objective (Use Light Yellow '#fffde7') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-yellow-200 shadow-sm"
        style={{ backgroundColor: '#fffde7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-yellow-200 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Valuation Objective
            </h3>
          </div>
          <span className="text-xs text-amber-800 font-medium bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
            Section 3: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* PURPOSE OF VALUATION: Dropdown (Options: To assess the fair market value of the collateral security, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                PURPOSE OF VALUATION
              </span>
            }
          >
            <CustomSelect
              value={selectedValue}
              customValue={customVal}
              onChange={(val) => {
                handleChange('poonawallaPurposeOfValuation', val);
                const finalVal = val === 'Custom' ? customVal : val;
                handleChange('purposeOfValuation', finalVal);
                handleChange('purpose', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaPurposeOfValuationCustom', val);
                handleChange('purposeOfValuation', val);
                handleChange('purpose', val);
              }}
              options={[
                {
                  value: 'To assess the fair market value of the collateral security',
                  label: 'To assess the fair market value of the collateral security',
                },
              ]}
              disabled={isReadOnly}
              placeholder="Select Purpose of Valuation..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Default Agency Profile Constants ───────────────────────────────────────

const DEFAULT_AGENCY_PREPARED_BY =
  'M/s. S MOHANTY ASSOCIATES, Plot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018';
const DEFAULT_AGENCY_PHONE = '06742381145';
const DEFAULT_AGENCY_MOBILE = '9937023855 / 9437074855';
const DEFAULT_AGENCY_VALUER_NAME = 'Er. Satyajit Mohanty (M/s. S MOHANTY ASSOCIATES)';

// ─── Section 4: PREPARED BY ─────────────────────────────────────────────────

function PreparedBySection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const preparedByNameAndAddressVal =
    fields.poonawallaPreparedByNameAndAddress ??
    fields.preparedByNameAndAddress ??
    DEFAULT_AGENCY_PREPARED_BY;

  const phoneVal = fields.poonawallaPhone ?? fields.phone ?? DEFAULT_AGENCY_PHONE;
  const mobileVal = fields.poonawallaMobile ?? fields.mobile ?? DEFAULT_AGENCY_MOBILE;
  const valuerNameVal =
    fields.poonawallaValuerName ?? fields.valuerName ?? DEFAULT_AGENCY_VALUER_NAME;

  const defaultValuationReportSeq =
    fields.refNo || fields.caseRefNo || fields.projectCode || 'VR/POONAWALLA/2026/01';
  const valuationReportVal =
    fields.poonawallaValuationReportNo ??
    fields.valuationReportNo ??
    defaultValuationReportSeq;

  const sec1Address =
    fields.poonawallaPropertyAddress ??
    fields.propertyAddress ??
    fields.address ??
    '';

  const addressAtSiteVal =
    fields.poonawallaAddressAtSite ?? (sec1Address || '');
  const addressAsPerDocVal =
    fields.poonawallaAddressAsPerDoc ?? (sec1Address || '');

  return (
    <div className="space-y-6">
      {/* ─── Container: Valuer Details (Use Light Orange '#fff3e0') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-orange-200 shadow-sm"
        style={{ backgroundColor: '#fff3e0' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Valuer Details
            </h3>
          </div>
          <span className="text-xs text-orange-800 font-medium bg-orange-100 px-2.5 py-1 rounded-md border border-orange-300">
            Section 4: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* PREPARED BY (Name and Address): Prefill Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  PREPARED BY (Name and Address)
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaPreparedByNameAndAddressEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaPreparedByNameAndAddressEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            {fields.poonawallaPreparedByNameAndAddressEdit ? (
              <AutoResizeTextarea
                rows={2}
                className="bg-white border-orange-400 font-medium text-gray-900"
                value={fields.poonawallaPreparedByNameAndAddress ?? preparedByNameAndAddressVal}
                onChange={(e) => {
                  handleChange('poonawallaPreparedByNameAndAddress', e.target.value);
                  handleChange('preparedByNameAndAddress', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Name and Address..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Prefill from agency profile"
              >
                <AutoResizeTextarea
                  rows={2}
                  readOnly
                  disabled
                  className="bg-orange-50/70 border-orange-200 font-medium text-gray-800 cursor-not-allowed"
                  value={preparedByNameAndAddressVal}
                  onChange={() => {}}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* PHONE: Prefill Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  PHONE
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaPhoneEdit)}
                  onChange={(checked) => handleChange('poonawallaPhoneEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaPhoneEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white border-orange-400 font-medium text-gray-900`}
                value={fields.poonawallaPhone ?? phoneVal}
                onChange={(e) => {
                  handleChange('poonawallaPhone', e.target.value);
                  handleChange('phone', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Phone..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Prefill from agency profile"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-orange-50/70 border-orange-200 font-medium text-gray-800 cursor-not-allowed`}
                  value={phoneVal}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* MOBILE: Prefill Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  MOBILE
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaMobileEdit)}
                  onChange={(checked) => handleChange('poonawallaMobileEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaMobileEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white border-orange-400 font-medium text-gray-900`}
                value={fields.poonawallaMobile ?? mobileVal}
                onChange={(e) => {
                  handleChange('poonawallaMobile', e.target.value);
                  handleChange('mobile', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Mobile..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Prefill from agency profile"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-orange-50/70 border-orange-200 font-medium text-gray-800 cursor-not-allowed`}
                  value={mobileVal}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* VALUATION REPORT: Auto-generated / Prefill Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  VALUATION REPORT
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaValuationReportEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaValuationReportEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaValuationReportEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white border-orange-400 font-medium text-gray-900`}
                value={fields.poonawallaValuationReportNo ?? valuationReportVal}
                onChange={(e) => {
                  handleChange('poonawallaValuationReportNo', e.target.value);
                  handleChange('valuationReportNo', e.target.value);
                  handleChange('refNo', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Valuation Report No..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Prefill from system sequence"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-orange-50/70 border-orange-200 font-medium text-gray-800 cursor-not-allowed`}
                  value={valuationReportVal}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Valuer Name: Prefill Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Valuer Name
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaValuerNameEdit)}
                  onChange={(checked) => handleChange('poonawallaValuerNameEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaValuerNameEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white border-orange-400 font-medium text-gray-900`}
                value={fields.poonawallaValuerName ?? valuerNameVal}
                onChange={(e) => {
                  handleChange('poonawallaValuerName', e.target.value);
                  handleChange('valuerName', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Valuer Name..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Prefill from agency profile"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-orange-50/70 border-orange-200 font-medium text-gray-800 cursor-not-allowed`}
                  value={valuerNameVal}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Deal No: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Deal No
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.poonawallaDealNo ?? fields.dealNo ?? ''}
              onChange={(e) => {
                handleChange('poonawallaDealNo', e.target.value);
                handleChange('dealNo', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Deal No..."
            />
          </Field>

          {/* Vertical Branch Name: Dropdown (Options: Fullerton, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Vertical Branch Name
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaVerticalBranchName || 'Fullerton'}
              customValue={fields.poonawallaVerticalBranchNameCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaVerticalBranchName', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaVerticalBranchNameCustom || ''
                    : val;
                handleChange('verticalBranchName', finalVal);
                handleChange('branchName', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaVerticalBranchNameCustom', val);
                handleChange('verticalBranchName', val);
                handleChange('branchName', val);
              }}
              options={[{ value: 'Fullerton', label: 'Fullerton' }]}
              disabled={isReadOnly}
              placeholder="Select Vertical Branch Name..."
            />
          </Field>

          {/* Type of Case: Dropdown (Options: Standard, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Type of Case
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaTypeOfCase || 'Standard'}
              customValue={fields.poonawallaTypeOfCaseCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaTypeOfCase', val);
                const finalVal =
                  val === 'Custom' ? fields.poonawallaTypeOfCaseCustom || '' : val;
                handleChange('typeOfCase', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaTypeOfCaseCustom', val);
                handleChange('typeOfCase', val);
              }}
              options={[{ value: 'Standard', label: 'Standard' }]}
              disabled={isReadOnly}
              placeholder="Select Type of Case..."
            />
          </Field>

          {/* Date of Initiate: Date Picker */}
          <BaseDateInput
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Date of Initiate
              </span>
            }
            value={fields.poonawallaDateOfInitiate ?? fields.dateOfInitiate ?? ''}
            onChange={(val) => {
              handleChange('poonawallaDateOfInitiate', val);
              handleChange('dateOfInitiate', val);
            }}
            disabled={isReadOnly}
            placeholder="DD/MM/YYYY"
          />

          {/* Date of visit: Date Picker */}
          <BaseDateInput
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Date of visit
              </span>
            }
            value={
              fields.poonawallaDateOfVisit ??
              fields.dateOfVisit ??
              fields.inspectionDate ??
              ''
            }
            onChange={(val) => {
              handleChange('poonawallaDateOfVisit', val);
              handleChange('dateOfVisit', val);
              handleChange('inspectionDate', val);
            }}
            disabled={isReadOnly}
            placeholder="DD/MM/YYYY"
          />

          {/* Date of Report: Date Picker */}
          <BaseDateInput
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Date of Report
              </span>
            }
            value={
              fields.poonawallaDateOfReport ??
              fields.dateOfReport ??
              fields.reportDate ??
              ''
            }
            onChange={(val) => {
              handleChange('poonawallaDateOfReport', val);
              handleChange('dateOfReport', val);
              handleChange('reportDate', val);
            }}
            disabled={isReadOnly}
            placeholder="DD/MM/YYYY"
          />
        </div>
      </div>

      {/* ─── Container: Applicant & Basic Information (Use Light Purple '#f3e5f5') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-purple-200 shadow-sm"
        style={{ backgroundColor: '#f3e5f5' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Applicant & Basic Information
            </h3>
          </div>
          <span className="text-xs text-purple-800 font-medium bg-purple-100 px-2.5 py-1 rounded-md border border-purple-300">
            Section 4: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Contacted Person at site (ID proof details): Input Box with variable size */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Contacted Person at site (ID proof details)
              </span>
            }
          >
            <AutoResizeTextarea
              rows={2}
              value={fields.poonawallaContactedPersonAtSite ?? fields.contactedPersonAtSite ?? ''}
              onChange={(e) => {
                handleChange('poonawallaContactedPersonAtSite', e.target.value);
                handleChange('contactedPersonAtSite', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter contacted person & ID proof details..."
            />
          </Field>

          {/* Name/s of the applicant/s: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Name/s of the applicant/s
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.poonawallaApplicantName ?? fields.applicantName ?? fields.customerName ?? ''}
              onChange={(e) => {
                handleChange('poonawallaApplicantName', e.target.value);
                handleChange('applicantName', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter applicant name/s..."
            />
          </Field>

          {/* Type of property: Dropdown (Options: G+2 storied commercial building, Residential, Commercial, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Type of property
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaPropertyType || 'G+2 storied commercial building'}
              customValue={fields.poonawallaPropertyTypeCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaPropertyType', val);
                const finalVal =
                  val === 'Custom' ? fields.poonawallaPropertyTypeCustom || '' : val;
                handleChange('propertyType', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaPropertyTypeCustom', val);
                handleChange('propertyType', val);
              }}
              options={[
                {
                  value: 'G+2 storied commercial building',
                  label: 'G+2 storied commercial building',
                },
                { value: 'Residential', label: 'Residential' },
                { value: 'Commercial', label: 'Commercial' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Type of property..."
            />
          </Field>

          {/* Current Usage: Dropdown (Options: Commercial, Residential, Mixed, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Current Usage
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaCurrentUsage || 'Commercial'}
              customValue={fields.poonawallaCurrentUsageCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaCurrentUsage', val);
                const finalVal =
                  val === 'Custom' ? fields.poonawallaCurrentUsageCustom || '' : val;
                handleChange('currentUsage', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaCurrentUsageCustom', val);
                handleChange('currentUsage', val);
              }}
              options={[
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Residential', label: 'Residential' },
                { value: 'Mixed', label: 'Mixed' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Current Usage..."
            />
          </Field>

          {/* Address as per firing: Input Box with Variable Size (Textarea) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Address as per firing
              </span>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              value={fields.poonawallaAddressAsPerFiring ?? fields.addressAsPerFiring ?? ''}
              onChange={(e) => {
                handleChange('poonawallaAddressAsPerFiring', e.target.value);
                handleChange('addressAsPerFiring', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Address as per firing..."
            />
          </Field>

          {/* Address at site: Prefill Field with Lock UI (Hover Message: Prefill from section 1, "ADDRESS OF THE PROPERTY"), Edit Switch + Input Box with Variable Size (Textarea) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Address at site
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaAddressAtSiteEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaAddressAtSiteEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            {fields.poonawallaAddressAtSiteEdit ? (
              <AutoResizeTextarea
                rows={2}
                className="bg-white border-purple-400 font-medium text-gray-900"
                value={fields.poonawallaAddressAtSite ?? addressAtSiteVal}
                onChange={(e) => {
                  handleChange('poonawallaAddressAtSite', e.target.value);
                  handleChange('addressAtSite', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Address at site..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='Prefill from section 1, "ADDRESS OF THE PROPERTY"'
              >
                <AutoResizeTextarea
                  rows={2}
                  readOnly
                  disabled
                  className="bg-purple-50/70 border-purple-200 font-medium text-gray-800 cursor-not-allowed"
                  value={addressAtSiteVal}
                  onChange={() => {}}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Address as per document: Prefill Field with Lock UI (Hover Message: Prefill from section 1, "ADDRESS OF THE PROPERTY"), Edit Switch + Input Box with Variable Size (Textarea) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Address as per document
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaAddressAsPerDocEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaAddressAsPerDocEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            {fields.poonawallaAddressAsPerDocEdit ? (
              <AutoResizeTextarea
                rows={2}
                className="bg-white border-purple-400 font-medium text-gray-900"
                value={fields.poonawallaAddressAsPerDoc ?? addressAsPerDocVal}
                onChange={(e) => {
                  handleChange('poonawallaAddressAsPerDoc', e.target.value);
                  handleChange('addressAsPerDocument', e.target.value);
                  handleChange('addressAsPerDoc', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Address as per document..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='Prefill from section 1, "ADDRESS OF THE PROPERTY"'
              >
                <AutoResizeTextarea
                  rows={2}
                  readOnly
                  disabled
                  className="bg-purple-50/70 border-purple-200 font-medium text-gray-800 cursor-not-allowed"
                  value={addressAsPerDocVal}
                  onChange={() => {}}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Has the valuator done valuation of this property before this? If yes, when, for whom?: Radio Button (Yes/No) + Conditional Input Box (Variable size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Has the valuator done valuation of this property before this? If yes, when, for whom?
              </span>
            }
            span={2}
          >
            <div className="space-y-3">
              <RadioGroup
                name="poonawallaDoneValuationBefore"
                value={fields.poonawallaDoneValuationBefore || 'No'}
                onChange={(val) => {
                  handleChange('poonawallaDoneValuationBefore', val);
                  handleChange('previousValuation', val);
                  handleChange('priorValuation', val);
                }}
                options={['Yes', 'No']}
                disabled={isReadOnly}
              />
              {(fields.poonawallaDoneValuationBefore || '').toLowerCase() === 'yes' && (
                <div className="pt-1">
                  <AutoResizeTextarea
                    rows={2}
                    placeholder="Please specify when and for whom the valuation was conducted..."
                    value={fields.poonawallaDoneValuationBeforeDetails || ''}
                    onChange={(e) => {
                      handleChange('poonawallaDoneValuationBeforeDetails', e.target.value);
                      handleChange('previousValuationDetails', e.target.value);
                    }}
                    disabled={isReadOnly}
                    className="bg-purple-50/50 border-purple-300"
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

// ─── Document Checklist Constants for Section 5 ─────────────────────────────

const PROPERTY_DOCUMENTS_LIST = [
  'Sale Deed',
  'Gift deed',
  'ROR',
  'Approved plan',
  'Mutation / Patta',
  'Holding Tax Receipt',
  'Electricity Bill',
  'Other Document',
];

// ─── Section 5: SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS: ───────────

function SanctionPlanAndDocumentsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const checkedDocs: string[] = Array.isArray(fields.poonawallaPropertyDocsVerified)
    ? fields.poonawallaPropertyDocsVerified
    : typeof fields.poonawallaPropertyDocsVerified === 'string'
    ? fields.poonawallaPropertyDocsVerified
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const handleDocToggle = (docName: string) => {
    let next: string[];
    if (checkedDocs.includes(docName)) {
      next = checkedDocs.filter((d) => d !== docName);
    } else {
      next = [...checkedDocs, docName];
    }
    handleChange('poonawallaPropertyDocsVerified', next);
    handleChange('documentsVerified', next.join(', '));
  };

  return (
    <div className="space-y-6">
      {/* ─── Container: Plan & Document Verification (Use Light Teal '#e0f2f1') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-teal-200 shadow-sm"
        style={{ backgroundColor: '#e0f2f1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Plan & Document Verification
            </h3>
          </div>
          <span className="text-xs text-teal-800 font-medium bg-teal-100 px-2.5 py-1 rounded-md border border-teal-300">
            Section 5: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sanctioned plans verified with approval no: Checkbox + Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Sanctioned plans verified with approval no
              </span>
            }
          >
            <div className="flex items-center gap-2.5">
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none bg-white px-2.5 py-2 rounded-lg border border-teal-300 shadow-xs hover:bg-teal-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(fields.poonawallaSanctionPlanVerified)}
                  onChange={(e) =>
                    handleChange('poonawallaSanctionPlanVerified', e.target.checked)
                  }
                  disabled={isReadOnly}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-teal-900">Verified</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={
                  fields.poonawallaSanctionPlanApprovalNo ??
                  fields.sanctionPlanApprovalNo ??
                  ''
                }
                onChange={(e) => {
                  handleChange('poonawallaSanctionPlanApprovalNo', e.target.value);
                  handleChange('sanctionPlanApprovalNo', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter approval no..."
              />
            </div>
          </Field>

          {/* Plan no.: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Plan no.
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.poonawallaPlanNo ?? fields.planNo ?? ''}
              onChange={(e) => {
                handleChange('poonawallaPlanNo', e.target.value);
                handleChange('planNo', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Plan no..."
            />
          </Field>

          {/* Structure: Dropdown (Options: RCC, Load Bearing, Custom) + Conditional Standard Input Box + [ ] NA Checkbox */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Structure
                </span>
                <NaCheckbox
                  checked={Boolean(fields.poonawallaStructureNA)}
                  onChange={(checked) => {
                    handleChange('poonawallaStructureNA', checked);
                    if (checked) {
                      handleChange('poonawallaStructure', 'NA');
                    } else {
                      handleChange('poonawallaStructure', 'RCC');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaStructureNA ? (
              <input
                type="text"
                readOnly
                disabled
                className={`${inputCls} bg-gray-100 text-gray-500 font-semibold cursor-not-allowed`}
                value="NA"
              />
            ) : (
              <CustomSelect
                value={fields.poonawallaStructure || 'RCC'}
                customValue={fields.poonawallaStructureCustom || ''}
                onChange={(val) => {
                  handleChange('poonawallaStructure', val);
                  const finalVal =
                    val === 'Custom' ? fields.poonawallaStructureCustom || '' : val;
                  handleChange('structureType', finalVal);
                  handleChange('structure', finalVal);
                }}
                onCustomChange={(val) => {
                  handleChange('poonawallaStructureCustom', val);
                  handleChange('structureType', val);
                  handleChange('structure', val);
                }}
                options={[
                  { value: 'RCC', label: 'RCC' },
                  { value: 'Load Bearing', label: 'Load Bearing' },
                ]}
                disabled={isReadOnly}
                placeholder="Select Structure..."
              />
            )}
          </Field>

          {/* Authority: Dropdown (Options: CDA, GCIT, Custom) + Conditional Standard Input Box + [ ] NA Checkbox */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Authority
                </span>
                <NaCheckbox
                  checked={Boolean(fields.poonawallaAuthorityNA)}
                  onChange={(checked) => {
                    handleChange('poonawallaAuthorityNA', checked);
                    if (checked) {
                      handleChange('poonawallaAuthority', 'NA');
                    } else {
                      handleChange('poonawallaAuthority', 'CDA');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaAuthorityNA ? (
              <input
                type="text"
                readOnly
                disabled
                className={`${inputCls} bg-gray-100 text-gray-500 font-semibold cursor-not-allowed`}
                value="NA"
              />
            ) : (
              <CustomSelect
                value={fields.poonawallaAuthority || 'CDA'}
                customValue={fields.poonawallaAuthorityCustom || ''}
                onChange={(val) => {
                  handleChange('poonawallaAuthority', val);
                  const finalVal =
                    val === 'Custom' ? fields.poonawallaAuthorityCustom || '' : val;
                  handleChange('approvalAuthority', finalVal);
                  handleChange('sanctionAuthority', finalVal);
                }}
                onCustomChange={(val) => {
                  handleChange('poonawallaAuthorityCustom', val);
                  handleChange('approvalAuthority', val);
                  handleChange('sanctionAuthority', val);
                }}
                options={[
                  { value: 'CDA', label: 'CDA' },
                  { value: 'GCIT', label: 'GCIT' },
                ]}
                disabled={isReadOnly}
                placeholder="Select Authority..."
              />
            )}
          </Field>

          {/* Area: Input Box (Standard size) + [ ] NA Checkbox */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Area
                </span>
                <NaCheckbox
                  checked={Boolean(fields.poonawallaAreaNA)}
                  onChange={(checked) => {
                    handleChange('poonawallaAreaNA', checked);
                    if (checked) {
                      handleChange('poonawallaArea', 'NA');
                    } else {
                      handleChange('poonawallaArea', '');
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
                fields.poonawallaAreaNA
                  ? 'bg-gray-100 text-gray-500 font-semibold cursor-not-allowed'
                  : ''
              }`}
              value={fields.poonawallaAreaNA ? 'NA' : fields.poonawallaArea ?? ''}
              onChange={(e) => handleChange('poonawallaArea', e.target.value)}
              disabled={isReadOnly || Boolean(fields.poonawallaAreaNA)}
              placeholder={fields.poonawallaAreaNA ? 'NA' : 'Enter Area (e.g. 1500 Sq.ft)...'}
            />
          </Field>

          {/* Ownership type: Dropdown (Options: Freehold, Leasehold, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Ownership type
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaOwnershipType || 'Freehold'}
              customValue={fields.poonawallaOwnershipTypeCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaOwnershipType', val);
                const finalVal =
                  val === 'Custom' ? fields.poonawallaOwnershipTypeCustom || '' : val;
                handleChange('ownershipType', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaOwnershipTypeCustom', val);
                handleChange('ownershipType', val);
              }}
              options={[
                { value: 'Freehold', label: 'Freehold' },
                { value: 'Leasehold', label: 'Leasehold' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Ownership type..."
            />
          </Field>

          {/* Construction as per approved Building plan/Bye Laws: Dropdown (Options: Bye Laws, Approved Plan, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Construction as per approved Building plan/Bye Laws
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaConstructionCompliance || 'Approved Plan'}
              customValue={fields.poonawallaConstructionComplianceCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaConstructionCompliance', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaConstructionComplianceCustom || ''
                    : val;
                handleChange('constructionCompliance', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaConstructionComplianceCustom', val);
                handleChange('constructionCompliance', val);
              }}
              options={[
                { value: 'Approved Plan', label: 'Approved Plan' },
                { value: 'Bye Laws', label: 'Bye Laws' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Compliance..."
            />
          </Field>

          {/* Permissible usage allows as per master plan: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Permissible usage allows as per master plan
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.poonawallaPermissibleUsage ?? fields.permissibleUsage ?? ''}
              onChange={(e) => {
                handleChange('poonawallaPermissibleUsage', e.target.value);
                handleChange('permissibleUsage', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Residential / Commercial / Master Plan not Published"
            />
          </Field>

          {/* Property Documents verified: Checkbox Group (Sale Deed, Gift deed, ROR, Approved plan, etc.) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Property Documents verified
              </span>
            }
            span={2}
          >
            <div className="p-4 bg-white rounded-lg border border-teal-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {PROPERTY_DOCUMENTS_LIST.map((doc) => {
                const isChecked = checkedDocs.includes(doc);
                return (
                  <label
                    key={doc}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs select-none ${
                      isChecked
                        ? 'bg-teal-50 border border-teal-300 text-teal-950 font-semibold'
                        : 'hover:bg-gray-50 border border-transparent text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleDocToggle(doc)}
                      disabled={isReadOnly}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{doc}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          {/* Is the property in demolition list, if yes Details: Radio Button (Yes/No) + Conditional Input Box with Variable Size */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Is the property in demolition list, if yes Details
              </span>
            }
            span={2}
          >
            <div className="space-y-3">
              <RadioGroup
                name="poonawallaPropertyInDemolitionList"
                value={fields.poonawallaPropertyInDemolitionList || 'No'}
                onChange={(val) => {
                  handleChange('poonawallaPropertyInDemolitionList', val);
                  handleChange('demolitionList', val);
                }}
                options={['Yes', 'No']}
                disabled={isReadOnly}
              />
              {(fields.poonawallaPropertyInDemolitionList || '').toLowerCase() === 'yes' && (
                <div className="pt-1">
                  <AutoResizeTextarea
                    rows={2}
                    placeholder="Enter details of demolition list / notices / authority action..."
                    value={fields.poonawallaDemolitionDetails || ''}
                    onChange={(e) =>
                      handleChange('poonawallaDemolitionDetails', e.target.value)
                    }
                    disabled={isReadOnly}
                    className="bg-teal-50/50 border-teal-300"
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

// ─── Section 6: Boundaries as Per Documents & Site: ─────────────────────────

const BOUNDARY_DIRECTIONS: Array<{
  key: 'East' | 'West' | 'North' | 'South';
  label: string;
}> = [
  { key: 'East', label: 'EAST' },
  { key: 'West', label: 'WEST' },
  { key: 'North', label: 'NORTH' },
  { key: 'South', label: 'SOUTH' },
];

const OCCUPANCY_OPTIONS = ['Vacant', 'Occupied', 'Tenant', 'Custom'];

const RELATION_OPTIONS = [
  { value: 'Self', label: 'Self' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Brother', label: 'Brother' },
  { value: 'Sister', label: 'Sister' },
  { value: 'Tenant', label: 'Tenant' },
];

function BoundariesAndOccupancySection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const updateBoundary = (
    direction: 'East' | 'West' | 'North' | 'South',
    type: 'SaleDeed' | 'Site',
    val: string
  ) => {
    if (type === 'SaleDeed') {
      handleChange(`poonawallaBoundary${direction}SaleDeed`, val);
      handleChange(`boundary${direction}SaleDeed`, val);
      handleChange(`boundary${direction}Doc`, val);
      handleChange(`boundary${direction}Deed`, val);
      handleChange(`${direction.toLowerCase()}AsPerDeed`, val);
    } else {
      handleChange(`poonawallaBoundary${direction}Site`, val);
      handleChange(`boundary${direction}Site`, val);
      handleChange(`${direction.toLowerCase()}AtSite`, val);
      handleChange(`${direction.toLowerCase()}Actual`, val);
    }
  };

  const getBoundaryVal = (
    direction: 'East' | 'West' | 'North' | 'South',
    type: 'SaleDeed' | 'Site'
  ): string => {
    if (type === 'SaleDeed') {
      return (
        fields[`poonawallaBoundary${direction}SaleDeed`] ??
        fields[`boundary${direction}SaleDeed`] ??
        fields[`boundary${direction}Doc`] ??
        fields[`boundary${direction}Deed`] ??
        fields[`${direction.toLowerCase()}AsPerDeed`] ??
        ''
      );
    }
    return (
      fields[`poonawallaBoundary${direction}Site`] ??
      fields[`boundary${direction}Site`] ??
      fields[`${direction.toLowerCase()}AtSite`] ??
      fields[`${direction.toLowerCase()}Actual`] ??
      ''
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Container: Boundaries Table (Use Light Cyan '#e0f7fa') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Boundaries Table
            </h3>
          </div>
          <span className="text-xs text-cyan-900 font-medium bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-300">
            Section 6: Container 1
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-cyan-200 shadow-xs bg-white">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-cyan-200 bg-cyan-100/60 text-cyan-950 font-bold text-xs uppercase tracking-wider">
                <th className="p-3 w-32 md:w-40 border-r border-cyan-200">
                  Direction
                </th>
                <th className="p-3 border-r border-cyan-200">
                  As per Sale deed
                </th>
                <th className="p-3">
                  At site
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-100">
              {BOUNDARY_DIRECTIONS.map(({ key, label }) => (
                <tr key={key} className="hover:bg-cyan-50/40 transition-colors">
                  <td className="p-3 font-bold text-gray-800 text-xs md:text-sm bg-cyan-50/50 border-r border-cyan-200">
                    <span className="inline-block px-2.5 py-1 rounded bg-cyan-100 text-cyan-900 font-bold tracking-wide">
                      {label}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-cyan-200">
                    <input
                      type="text"
                      className={inputCls}
                      value={getBoundaryVal(key, 'SaleDeed')}
                      onChange={(e) => updateBoundary(key, 'SaleDeed', e.target.value)}
                      disabled={isReadOnly}
                      placeholder={`Enter ${label} boundary as per Sale deed...`}
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      className={inputCls}
                      value={getBoundaryVal(key, 'Site')}
                      onChange={(e) => updateBoundary(key, 'Site', e.target.value)}
                      disabled={isReadOnly}
                      placeholder={`Enter ${label} boundary at site...`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Container: Occupancy & Status (Use Light Red '#ffebee') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-red-200 shadow-sm"
        style={{ backgroundColor: '#ffebee' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200 pb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-red-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Occupancy & Status
            </h3>
          </div>
          <span className="text-xs text-red-800 font-medium bg-red-100 px-2.5 py-1 rounded-md border border-red-300">
            Section 6: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Boundaries Matching: Dropdown (Options: Matching, Partly matching, Not matching, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Boundaries Matching
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaBoundariesMatching || 'Matching'}
              customValue={fields.poonawallaBoundariesMatchingCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaBoundariesMatching', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaBoundariesMatchingCustom || ''
                    : val;
                handleChange('boundariesMatching', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaBoundariesMatchingCustom', val);
                handleChange('boundariesMatching', val);
              }}
              options={[
                { value: 'Matching', label: 'Matching' },
                { value: 'Partly matching', label: 'Partly matching' },
                { value: 'Not matching', label: 'Not matching' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Boundaries Matching..."
            />
          </Field>

          {/* Occupant Vacant/Occupied/Tenant: Radio Button / Dropdown (Options: Vacant, Occupied, Tenant, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Occupant Vacant/Occupied/Tenant
              </span>
            }
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {OCCUPANCY_OPTIONS.map((opt) => {
                  const currentStatus = fields.poonawallaOccupancyStatus || 'Occupied';
                  const isSelected = currentStatus.toLowerCase() === opt.toLowerCase();
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 cursor-pointer text-xs md:text-sm font-medium select-none ${
                        isReadOnly
                          ? 'opacity-60 cursor-not-allowed'
                          : 'text-gray-800 hover:text-gray-950'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poonawallaOccupancyStatus"
                        value={opt}
                        checked={isSelected}
                        onChange={(e) => {
                          handleChange('poonawallaOccupancyStatus', e.target.value);
                          const finalVal =
                            e.target.value === 'Custom'
                              ? fields.poonawallaOccupancyStatusCustom || ''
                              : e.target.value;
                          handleChange('occupancyStatus', finalVal);
                          handleChange('occupantStatus', finalVal);
                          handleChange('propertyOccupancy', finalVal);
                        }}
                        disabled={isReadOnly}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {(fields.poonawallaOccupancyStatus === 'Custom' ||
                fields.poonawallaOccupancyStatus === 'custom') && (
                <input
                  type="text"
                  className={`${inputCls} bg-amber-50/50 border-amber-300 text-gray-900 placeholder:text-gray-400 mt-1`}
                  value={fields.poonawallaOccupancyStatusCustom || ''}
                  onChange={(e) => {
                    handleChange('poonawallaOccupancyStatusCustom', e.target.value);
                    handleChange('occupancyStatus', e.target.value);
                    handleChange('occupantStatus', e.target.value);
                    handleChange('propertyOccupancy', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="Enter custom occupancy status..."
                />
              )}
            </div>
          </Field>

          {/* Name of Occupant: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Name of Occupant
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaOccupantName ??
                fields.occupantName ??
                fields.nameOfOccupant ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaOccupantName', e.target.value);
                handleChange('occupantName', e.target.value);
                handleChange('nameOfOccupant', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Name of Occupant..."
            />
          </Field>

          {/* Occupied from: Date Picker / Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Occupied from
              </span>
            }
          >
            <BaseDateInput
              value={fields.poonawallaOccupiedFrom ?? fields.occupiedFrom ?? ''}
              onChange={(val) => {
                handleChange('poonawallaOccupiedFrom', val);
                handleChange('occupiedFrom', val);
                handleChange('occupancyFrom', val);
              }}
              disabled={isReadOnly}
              placeholder="DD/MM/YYYY"
            />
          </Field>

          {/* Relation with applicant: Input Box / Dropdown */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Relation with applicant
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaRelationWithApplicant || 'Self'}
              customValue={fields.poonawallaRelationWithApplicantCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaRelationWithApplicant', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaRelationWithApplicantCustom || ''
                    : val;
                handleChange('relationWithApplicant', finalVal);
                handleChange('relationshipWithApplicant', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaRelationWithApplicantCustom', val);
                handleChange('relationWithApplicant', val);
                handleChange('relationshipWithApplicant', val);
              }}
              options={RELATION_OPTIONS}
              disabled={isReadOnly}
              placeholder="Select Relation with applicant..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Poonawalla Finance BankConfig ──────────────────────────────────────────

export const POONAWALLA_FINANCE_CONFIG: BankConfig = {
  bankId: 'POONAWALLA FINANCE',
  subTemplateId: '',
  displayName: 'Poonawalla Fincorp Ltd',
  hiddenSections: [
    'section-1', // Replaced by Section 1: VALUATION OF IMMOVABLE PROPERTY
    'section-2', // Replaced by Section 2: VALUE OF THE PROPERTY
    'section-3', // Replaced by Section 3: PURPOSE OF VALUATION
    'section-4', // Replaced by Section 4: PREPARED BY
    'section-5', // Replaced by Section 5: SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS:
    'section-6', // Replaced by Section 6: Boundaries as Per Documents & Site:
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'poonawalla-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'poonawalla-section-2', title: 'VALUE OF THE PROPERTY' },
    { id: 'poonawalla-section-3', title: 'PURPOSE OF VALUATION' },
    { id: 'poonawalla-section-4', title: 'PREPARED BY' },
    { id: 'poonawalla-section-5', title: 'SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS' },
    { id: 'poonawalla-section-6', title: 'Boundaries as Per Documents & Site' },
    { id: 'section-7', title: 'Area Valuation' },
    { id: 'section-8', title: 'Land Valuation' },
    { id: 'section-9', title: 'Valuation Abstract' },
    { id: 'section-10', title: 'Remarks' },
    { id: 'section-11', title: 'Certificate' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'photographs', title: 'Photographs' },
    { id: 'annexures', title: 'Annexures' },
  ],
  extraSectionsStart: [
    {
      id: 'poonawalla-section-1',
      title: 'VALUATION OF IMMOVABLE PROPERTY',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <PropertyDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-2',
      title: 'VALUE OF THE PROPERTY',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ValueOfThePropertySection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-3',
      title: 'PURPOSE OF VALUATION',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <PurposeOfValuationSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-4',
      title: 'PREPARED BY',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <PreparedBySection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-5',
      title: 'SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS:',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <SanctionPlanAndDocumentsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-6',
      title: 'Boundaries as Per Documents & Site:',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <BoundariesAndOccupancySection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
  ],
  defaultValues: {
    poonawallaPurposeOfValuation: 'To assess the fair market value of the collateral security',
    purpose: 'To assess the fair market value of the collateral security',
    purposeOfValuation: 'To assess the fair market value of the collateral security',
    poonawallaPreparedByNameAndAddress: DEFAULT_AGENCY_PREPARED_BY,
    poonawallaPhone: DEFAULT_AGENCY_PHONE,
    poonawallaMobile: DEFAULT_AGENCY_MOBILE,
    poonawallaValuerName: DEFAULT_AGENCY_VALUER_NAME,
    poonawallaVerticalBranchName: 'Fullerton',
    poonawallaTypeOfCase: 'Standard',
    poonawallaPropertyType: 'G+2 storied commercial building',
    poonawallaCurrentUsage: 'Commercial',
    poonawallaDoneValuationBefore: 'No',
    poonawallaStructure: 'RCC',
    poonawallaAuthority: 'CDA',
    poonawallaOwnershipType: 'Freehold',
    poonawallaConstructionCompliance: 'Approved Plan',
    poonawallaPropertyInDemolitionList: 'No',
    poonawallaBoundariesMatching: 'Matching',
    boundariesMatching: 'Matching',
    poonawallaOccupancyStatus: 'Occupied',
    occupancyStatus: 'Occupied',
    poonawallaRelationWithApplicant: 'Self',
  },
};

export default function PoonawallaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={POONAWALLA_FINANCE_CONFIG} {...props} />;
}
