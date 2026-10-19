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
  Building2,
  MapPin,
  Table,
  Plus,
  Trash2,
  Layers,
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

// ─── Section 7: Building details ───────────────────────────────────────────

const FLOOR_VALUED_PRESETS = [
  'Basement',
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  'Entire Building',
];

const BASIC_AMENITIES_LIST = ['Water', 'Sewer', 'Electrical', 'Road'];

function BuildingDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const currentFloors: string[] = (
    fields.poonawallaFloorValued ??
    fields.floorValued ??
    ''
  )
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const handleFloorToggle = (floor: string) => {
    let next: string[];
    if (currentFloors.includes(floor)) {
      next = currentFloors.filter((f) => f !== floor);
    } else {
      next = [...currentFloors, floor];
    }
    const val = next.join(', ');
    handleChange('poonawallaFloorValued', val);
    handleChange('floorValued', val);
  };

  const currentAmenities: string[] = Array.isArray(fields.poonawallaBasicAmenities)
    ? fields.poonawallaBasicAmenities
    : typeof fields.poonawallaBasicAmenities === 'string'
    ? fields.poonawallaBasicAmenities
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    : ['Water', 'Sewer', 'Electrical', 'Road'];

  const handleAmenityToggle = (amenity: string) => {
    let next: string[];
    if (currentAmenities.includes(amenity)) {
      next = currentAmenities.filter((a) => a !== amenity);
    } else {
      next = [...currentAmenities, amenity];
    }
    handleChange('poonawallaBasicAmenities', next);
    handleChange('basicAmenities', next.join(', '));
  };

  return (
    <div className="space-y-6">
      {/* ─── Container: Structural Details (Use Light Pink '#fce4ec') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-pink-200 shadow-sm"
        style={{ backgroundColor: '#fce4ec' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-pink-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Structural Details
            </h3>
          </div>
          <span className="text-xs text-pink-900 font-medium bg-pink-100 px-2.5 py-1 rounded-md border border-pink-300">
            Section 7: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Property Demarcation: Input Box / Dropdown */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Property Demarcation
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaPropertyDemarcation || 'Demarcated'}
              customValue={fields.poonawallaPropertyDemarcationCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaPropertyDemarcation', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaPropertyDemarcationCustom || ''
                    : val;
                handleChange('propertyDemarcation', finalVal);
                handleChange('demarcated', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaPropertyDemarcationCustom', val);
                handleChange('propertyDemarcation', val);
                handleChange('demarcated', val);
              }}
              options={[
                { value: 'Demarcated', label: 'Demarcated' },
                { value: 'Not Demarcated', label: 'Not Demarcated' },
                { value: 'Partly Demarcated', label: 'Partly Demarcated' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Demarcation..."
            />
          </Field>

          {/* Property Identified through: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Property Identified through
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaPropertyIdentifiedThrough ??
                fields.propertyIdentifiedThrough ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaPropertyIdentifiedThrough', e.target.value);
                handleChange('propertyIdentifiedThrough', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Boundary match / Inquiries / Site inspection..."
            />
          </Field>

          {/* Type of structure: Dropdown (Options: RCC, Load Bearing, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Type of structure
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaTypeOfStructure || 'RCC'}
              customValue={fields.poonawallaTypeOfStructureCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaTypeOfStructure', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaTypeOfStructureCustom || ''
                    : val;
                handleChange('typeOfStructure', finalVal);
                handleChange('structureType', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaTypeOfStructureCustom', val);
                handleChange('typeOfStructure', val);
                handleChange('structureType', val);
              }}
              options={[
                { value: 'RCC', label: 'RCC' },
                { value: 'Load Bearing', label: 'Load Bearing' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Type of structure..."
            />
          </Field>

          {/* Plot Area: Input Box with Unit */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Plot Area
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                className={inputCls}
                value={fields.poonawallaPlotArea ?? fields.plotArea ?? ''}
                onChange={(e) => {
                  handleChange('poonawallaPlotArea', e.target.value);
                  handleChange('plotArea', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Plot Area..."
              />
              <select
                className="w-24 md:w-28 h-10 px-2 py-1 bg-white border border-pink-300 rounded-lg text-xs md:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 shrink-0"
                value={fields.poonawallaPlotAreaUnit || 'Sq.ft'}
                onChange={(e) => {
                  handleChange('poonawallaPlotAreaUnit', e.target.value);
                  handleChange('plotAreaUnit', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Sq.ft">Sq.ft</option>
                <option value="Sq.mt">Sq.mt</option>
                <option value="Sq.yd">Sq.yd</option>
                <option value="Decimal">Decimal</option>
                <option value="Acre">Acre</option>
              </select>
            </div>
          </Field>

          {/* No. of Floors: Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                No. of Floors
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaNoOfFloors ??
                fields.noOfFloors ??
                fields.numberOfFloors ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaNoOfFloors', e.target.value);
                handleChange('noOfFloors', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. G+2 / 3"
            />
          </Field>

          {/* Floor Valued: Checkbox Group / Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Floor Valued
              </span>
            }
            span={2}
          >
            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-lg border border-pink-200 flex flex-wrap gap-2">
                {FLOOR_VALUED_PRESETS.map((floor) => {
                  const isChecked = currentFloors.includes(floor);
                  return (
                    <label
                      key={floor}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded cursor-pointer transition-colors text-xs select-none ${
                        isChecked
                          ? 'bg-pink-100 border border-pink-300 text-pink-900 font-bold'
                          : 'hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFloorToggle(floor)}
                        disabled={isReadOnly}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                      <span>{floor}</span>
                    </label>
                  );
                })}
              </div>
              <input
                type="text"
                className={inputCls}
                value={fields.poonawallaFloorValued ?? fields.floorValued ?? ''}
                onChange={(e) => {
                  handleChange('poonawallaFloorValued', e.target.value);
                  handleChange('floorValued', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Selected floor(s) or enter custom..."
              />
            </div>
          </Field>

          {/* No of unit per floor: Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                No of unit per floor
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaUnitsPerFloor ??
                fields.unitsPerFloor ??
                fields.noOfUnitsPerFloor ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaUnitsPerFloor', e.target.value);
                handleChange('unitsPerFloor', e.target.value);
                handleChange('noOfUnitsPerFloor', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. 1 / 2 / 4"
            />
          </Field>

          {/* No. of lifts: Input Box (Numeric) + [ ] NA Checkbox */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  No. of lifts
                </span>
                <NaCheckbox
                  checked={Boolean(fields.poonawallaNoOfLiftsNA)}
                  onChange={(checked) => {
                    handleChange('poonawallaNoOfLiftsNA', checked);
                    if (checked) {
                      handleChange('poonawallaNoOfLifts', 'NA');
                      handleChange('noOfLifts', 'NA');
                    } else {
                      handleChange('poonawallaNoOfLifts', '');
                      handleChange('noOfLifts', '');
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
                fields.poonawallaNoOfLiftsNA
                  ? 'bg-gray-100 text-gray-500 font-semibold cursor-not-allowed'
                  : ''
              }`}
              value={
                fields.poonawallaNoOfLiftsNA
                  ? 'NA'
                  : fields.poonawallaNoOfLifts ?? fields.noOfLifts ?? ''
              }
              onChange={(e) => {
                handleChange('poonawallaNoOfLifts', e.target.value);
                handleChange('noOfLifts', e.target.value);
              }}
              disabled={isReadOnly || Boolean(fields.poonawallaNoOfLiftsNA)}
              placeholder={fields.poonawallaNoOfLiftsNA ? 'NA' : 'e.g. 1 / 2'}
            />
          </Field>

          {/* Unit details No. of rooms: Input Box / Multi-field container */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Unit details No. of rooms
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaUnitDetailsRooms ??
                fields.unitDetailsRooms ??
                fields.noOfRooms ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaUnitDetailsRooms', e.target.value);
                handleChange('unitDetailsRooms', e.target.value);
                handleChange('noOfRooms', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. 1 Hall, 1 Kitchen, 2 Bedrooms, 2 Bathrooms"
            />
          </Field>

          {/* Super Built up area (Permissible Area): Input Box with Unit */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Super Built up area (Permissible Area)
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                className={inputCls}
                value={
                  fields.poonawallaSuperBuiltUpArea ??
                  fields.superBuiltUpArea ??
                  fields.permissibleArea ??
                  ''
                }
                onChange={(e) => {
                  handleChange('poonawallaSuperBuiltUpArea', e.target.value);
                  handleChange('superBuiltUpArea', e.target.value);
                  handleChange('permissibleArea', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Super Built up area..."
              />
              <select
                className="w-24 md:w-28 h-10 px-2 py-1 bg-white border border-pink-300 rounded-lg text-xs md:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 shrink-0"
                value={fields.poonawallaSuperBuiltUpAreaUnit || 'Sq.ft'}
                onChange={(e) => {
                  handleChange('poonawallaSuperBuiltUpAreaUnit', e.target.value);
                  handleChange('superBuiltUpAreaUnit', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Sq.ft">Sq.ft</option>
                <option value="Sq.mt">Sq.mt</option>
                <option value="Sq.yd">Sq.yd</option>
              </select>
            </div>
          </Field>

          {/* Carpet area (Of Actual Area): Input Box with Unit */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Carpet area (Of Actual Area)
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                className={inputCls}
                value={
                  fields.poonawallaCarpetArea ??
                  fields.carpetArea ??
                  fields.actualArea ??
                  ''
                }
                onChange={(e) => {
                  handleChange('poonawallaCarpetArea', e.target.value);
                  handleChange('carpetArea', e.target.value);
                  handleChange('actualArea', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Carpet area..."
              />
              <select
                className="w-24 md:w-28 h-10 px-2 py-1 bg-white border border-pink-300 rounded-lg text-xs md:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 shrink-0"
                value={fields.poonawallaCarpetAreaUnit || 'Sq.ft'}
                onChange={(e) => {
                  handleChange('poonawallaCarpetAreaUnit', e.target.value);
                  handleChange('carpetAreaUnit', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Sq.ft">Sq.ft</option>
                <option value="Sq.mt">Sq.mt</option>
                <option value="Sq.yd">Sq.yd</option>
              </select>
            </div>
          </Field>

          {/* Remarks on view from property: Input Box with Variable Size (Textarea) + [ ] NA Checkbox */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Remarks on view from property
                </span>
                <NaCheckbox
                  checked={Boolean(fields.poonawallaRemarksOnViewNA)}
                  onChange={(checked) => {
                    handleChange('poonawallaRemarksOnViewNA', checked);
                    if (checked) {
                      handleChange('poonawallaRemarksOnView', 'NA');
                      handleChange('remarksOnView', 'NA');
                    } else {
                      handleChange('poonawallaRemarksOnView', '');
                      handleChange('remarksOnView', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            {fields.poonawallaRemarksOnViewNA ? (
              <input
                type="text"
                readOnly
                disabled
                className={`${inputCls} bg-gray-100 text-gray-500 font-semibold cursor-not-allowed`}
                value="NA"
              />
            ) : (
              <AutoResizeTextarea
                rows={2}
                value={fields.poonawallaRemarksOnView ?? fields.remarksOnView ?? ''}
                onChange={(e) => {
                  handleChange('poonawallaRemarksOnView', e.target.value);
                  handleChange('remarksOnView', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. Road facing / Garden view / Good surrounding view..."
              />
            )}
          </Field>

          {/* Quality of construction: Dropdown (Options: Average, Good, Poor, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Quality of construction
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaQualityOfConstruction || 'Good'}
              customValue={fields.poonawallaQualityOfConstructionCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaQualityOfConstruction', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaQualityOfConstructionCustom || ''
                    : val;
                handleChange('qualityOfConstruction', finalVal);
                handleChange('constructionQuality', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaQualityOfConstructionCustom', val);
                handleChange('qualityOfConstruction', val);
                handleChange('constructionQuality', val);
              }}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Quality of construction..."
            />
          </Field>

          {/* Interiors/Exteriors: Dropdown (Options: Average, Good, Poor, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Interiors/Exteriors
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaInteriorsExteriors || 'Good'}
              customValue={fields.poonawallaInteriorsExteriorsCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaInteriorsExteriors', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaInteriorsExteriorsCustom || ''
                    : val;
                handleChange('interiorsExteriors', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaInteriorsExteriorsCustom', val);
                handleChange('interiorsExteriors', val);
              }}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Interiors/Exteriors..."
            />
          </Field>

          {/* Age of the property: Input Box (Numeric / Years) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Age of the property
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaAgeOfProperty ??
                fields.ageOfProperty ??
                fields.propertyAge ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaAgeOfProperty', e.target.value);
                handleChange('ageOfProperty', e.target.value);
                handleChange('propertyAge', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. 5 Years"
            />
          </Field>
        </div>
      </div>

      {/* ─── Container: Locality Attributes (Use Light Gray '#f3f4f6') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f3f4f6' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Locality Attributes
            </h3>
          </div>
          <span className="text-xs text-gray-700 font-medium bg-gray-200 px-2.5 py-1 rounded-md border border-gray-400">
            Section 7: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Location Type (Comm., Res, Ind, Mix): Dropdown + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Location Type (Comm., Res, Ind, Mix)
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaLocationType || 'Commercial'}
              customValue={fields.poonawallaLocationTypeCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaLocationType', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaLocationTypeCustom || ''
                    : val;
                handleChange('locationType', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaLocationTypeCustom', val);
                handleChange('locationType', val);
              }}
              options={[
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Residential', label: 'Residential' },
                { value: 'Industrial', label: 'Industrial' },
                { value: 'Mixed', label: 'Mixed' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Location Type..."
            />
          </Field>

          {/* Class of Locality: Dropdown (Options: High class, Middle class, Low class, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Class of Locality
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaClassOfLocality || 'Middle class'}
              customValue={fields.poonawallaClassOfLocalityCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaClassOfLocality', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaClassOfLocalityCustom || ''
                    : val;
                handleChange('classOfLocality', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaClassOfLocalityCustom', val);
                handleChange('classOfLocality', val);
              }}
              options={[
                { value: 'High class', label: 'High class' },
                { value: 'Middle class', label: 'Middle class' },
                { value: 'Low class', label: 'Low class' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Class of Locality..."
            />
          </Field>

          {/* Site is (Dev, Under Dev): Radio Button / Dropdown (Options: Developed, Under Developed, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Site is (Dev, Under Dev)
              </span>
            }
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-wrap items-center gap-4 pt-1">
                {['Developed', 'Under Developed', 'Custom'].map((opt) => {
                  const currentStatus =
                    fields.poonawallaSiteDevelopmentStatus || 'Developed';
                  const isSelected =
                    currentStatus.toLowerCase() === opt.toLowerCase();
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
                        name="poonawallaSiteDevelopmentStatus"
                        value={opt}
                        checked={isSelected}
                        onChange={(e) => {
                          handleChange('poonawallaSiteDevelopmentStatus', e.target.value);
                          const finalVal =
                            e.target.value === 'Custom'
                              ? fields.poonawallaSiteDevelopmentStatusCustom || ''
                              : e.target.value;
                          handleChange('siteDevelopmentStatus', finalVal);
                          handleChange('developmentStatus', finalVal);
                        }}
                        disabled={isReadOnly}
                        className="h-4 w-4 text-gray-700 focus:ring-gray-500 border-gray-300"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {(fields.poonawallaSiteDevelopmentStatus === 'Custom' ||
                fields.poonawallaSiteDevelopmentStatus === 'custom') && (
                <input
                  type="text"
                  className={`${inputCls} bg-amber-50/50 border-amber-300 text-gray-900 placeholder:text-gray-400 mt-1`}
                  value={fields.poonawallaSiteDevelopmentStatusCustom || ''}
                  onChange={(e) => {
                    handleChange('poonawallaSiteDevelopmentStatusCustom', e.target.value);
                    handleChange('siteDevelopmentStatus', e.target.value);
                    handleChange('developmentStatus', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="Enter custom development status..."
                />
              )}
            </div>
          </Field>

          {/* Proximity to civic amenities/public transport: Input Box with Variable Size */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Proximity to civic amenities/public transport
              </span>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              value={
                fields.poonawallaProximityToAmenities ??
                fields.proximityToAmenities ??
                fields.civicAmenities ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaProximityToAmenities', e.target.value);
                handleChange('proximityToAmenities', e.target.value);
                handleChange('civicAmenities', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Bus stop 200m, Hospital 1km, School 500m, Railway Station 3km..."
            />
          </Field>

          {/* Close Vicinity/Landmark: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Close Vicinity/Landmark
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaCloseVicinityLandmark ??
                fields.closeVicinityLandmark ??
                fields.landmark ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaCloseVicinityLandmark', e.target.value);
                handleChange('closeVicinityLandmark', e.target.value);
                handleChange('landmark', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Close Vicinity/Landmark..."
            />
          </Field>

          {/* Property within municipal Limits: Radio Button (Yes/No) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Property within municipal Limits
              </span>
            }
          >
            <RadioGroup
              name="poonawallaPropertyWithinMunicipalLimits"
              value={fields.poonawallaPropertyWithinMunicipalLimits || 'Yes'}
              onChange={(val) => {
                handleChange('poonawallaPropertyWithinMunicipalLimits', val);
                handleChange('propertyWithinMunicipalLimits', val);
                handleChange('withinMunicipalLimits', val);
              }}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* Name of Municipal Corporation: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Name of Municipal Corporation
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaMunicipalCorporationName ??
                fields.municipalCorporationName ??
                fields.municipalAuthority ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaMunicipalCorporationName', e.target.value);
                handleChange('municipalCorporationName', e.target.value);
                handleChange('municipalAuthority', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Bhubaneswar Municipal Corporation (BMC)"
            />
          </Field>

          {/* Site Access: Input Box (Standard size) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Site Access
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={
                fields.poonawallaSiteAccess ??
                fields.siteAccess ??
                fields.approachRoad ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaSiteAccess', e.target.value);
                handleChange('siteAccess', e.target.value);
                handleChange('approachRoad', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. 30 ft wide bitumen road"
            />
          </Field>

          {/* Availability of basic amenities (Water, Sewer, Electrical, Road): Checkbox Group / Radio Button */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Availability of basic amenities (Water, Sewer, Electrical, Road)
              </span>
            }
            span={2}
          >
            <div className="p-3 bg-white rounded-lg border border-gray-300 flex flex-wrap gap-2.5">
              {BASIC_AMENITIES_LIST.map((amenity) => {
                const isChecked = currentAmenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs select-none ${
                      isChecked
                        ? 'bg-gray-100 border border-gray-400 text-gray-900 font-bold'
                        : 'hover:bg-gray-50 border border-gray-200 text-gray-600 font-medium'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAmenityToggle(amenity)}
                      disabled={isReadOnly}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-gray-700 focus:ring-gray-500"
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          {/* Marketability: Dropdown (Options: Good, Average, Poor, Custom) + Conditional Standard Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Marketability
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaMarketability || 'Good'}
              customValue={fields.poonawallaMarketabilityCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaMarketability', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaMarketabilityCustom || ''
                    : val;
                handleChange('marketability', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaMarketabilityCustom', val);
                handleChange('marketability', val);
              }}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Marketability..."
            />
          </Field>

          {/* Electricity Meter No.: Input Box (Standard size) + [ ] NA Checkbox */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Electricity Meter No.
                </span>
                <NaCheckbox
                  checked={Boolean(fields.poonawallaElectricityMeterNoNA)}
                  onChange={(checked) => {
                    handleChange('poonawallaElectricityMeterNoNA', checked);
                    if (checked) {
                      handleChange('poonawallaElectricityMeterNo', 'NA');
                      handleChange('electricityMeterNo', 'NA');
                    } else {
                      handleChange('poonawallaElectricityMeterNo', '');
                      handleChange('electricityMeterNo', '');
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
                fields.poonawallaElectricityMeterNoNA
                  ? 'bg-gray-100 text-gray-500 font-semibold cursor-not-allowed'
                  : ''
              }`}
              value={
                fields.poonawallaElectricityMeterNoNA
                  ? 'NA'
                  : fields.poonawallaElectricityMeterNo ??
                    fields.electricityMeterNo ??
                    ''
              }
              onChange={(e) => {
                handleChange('poonawallaElectricityMeterNo', e.target.value);
                handleChange('electricityMeterNo', e.target.value);
              }}
              disabled={isReadOnly || Boolean(fields.poonawallaElectricityMeterNoNA)}
              placeholder={
                fields.poonawallaElectricityMeterNoNA
                  ? 'NA'
                  : 'Enter Electricity Meter No...'
              }
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: Floor Wise Area (In Sqft.) ──────────────────────────────────

const FLOOR_AREA_ROWS = [
  { key: 'Base', label: 'Base.' },
  { key: 'Stilt', label: 'Stilt' },
  { key: 'Ground', label: 'Ground' },
  { key: 'First', label: 'First' },
  { key: 'Second', label: 'Second' },
  { key: 'Third', label: 'Third/above' },
] as const;

function FloorWiseAreaSection({
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

  // Sum of Actual: Base. Actual + Stilt Actual + Ground Actual + First Actual + Second Actual + Third/above Actual
  const autoTotalActual = FLOOR_AREA_ROWS.reduce((acc, row) => {
    return acc + parseNum(fields[`poonawallaFloor${row.key}Actual`]);
  }, 0);

  // Sum of Permissible: Base. Permissible + Stilt Permissible + Ground Permissible + First Permissible + Second Permissible + Third/above Permissible
  const autoTotalPermissible = FLOOR_AREA_ROWS.reduce((acc, row) => {
    return acc + parseNum(fields[`poonawallaFloor${row.key}Permissible`]);
  }, 0);

  const effectiveTotalActual = fields.poonawallaTotalActualAreaEdit
    ? parseNum(fields.poonawallaTotalActualAreaManual)
    : autoTotalActual;

  const effectiveTotalPermissible = fields.poonawallaTotalPermissibleAreaEdit
    ? parseNum(fields.poonawallaTotalPermissibleAreaManual)
    : autoTotalPermissible;

  // Auto-calculated Extra Coverage (in %)
  const autoExtraCoveragePercent =
    effectiveTotalPermissible > 0
      ? (((effectiveTotalActual - effectiveTotalPermissible) / effectiveTotalPermissible) * 100).toFixed(2)
      : '0';

  // Saleable (In Sqft) auto calculation fallback
  const autoSaleable =
    effectiveTotalActual > 0
      ? effectiveTotalActual
      : parseNum(fields.poonawallaSuperBuiltUpArea) || 0;

  return (
    <div className="space-y-6">
      {/* ─── Container: Area Breakdown Table (Use Light Indigo '#e8eaf6') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-indigo-200 shadow-sm"
        style={{ backgroundColor: '#e8eaf6' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-3">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Area Breakdown Table
            </h3>
          </div>
          <span className="text-xs text-indigo-900 font-medium bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-300">
            Section 8: Container 1
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-indigo-200 shadow-xs bg-white">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-indigo-200 bg-indigo-100/70 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                <th className="p-3 w-40 border-r border-indigo-200">
                  Floor
                </th>
                <th className="p-3 border-r border-indigo-200">
                  Actual (In Sqft.)
                </th>
                <th className="p-3">
                  Permissible (In Sqft.)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {FLOOR_AREA_ROWS.map(({ key, label }) => (
                <tr key={key} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="p-3 font-bold text-gray-800 text-xs md:text-sm bg-indigo-50/50 border-r border-indigo-200">
                    <span className="inline-block px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 font-bold tracking-wide">
                      {label}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-indigo-200">
                    <input
                      type="number"
                      step="any"
                      className={inputCls}
                      value={fields[`poonawallaFloor${key}Actual`] ?? ''}
                      onChange={(e) =>
                        handleChange(`poonawallaFloor${key}Actual`, e.target.value)
                      }
                      disabled={isReadOnly}
                      placeholder={`Enter ${label} Actual area...`}
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      step="any"
                      className={inputCls}
                      value={fields[`poonawallaFloor${key}Permissible`] ?? ''}
                      onChange={(e) =>
                        handleChange(`poonawallaFloor${key}Permissible`, e.target.value)
                      }
                      disabled={isReadOnly}
                      placeholder={`Enter ${label} Permissible area...`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-100/60 font-bold text-indigo-950 border-t-2 border-indigo-200">
                <td className="p-3 text-xs md:text-sm uppercase tracking-wide border-r border-indigo-200">
                  Total (Sum)
                </td>
                <td className="p-3 border-r border-indigo-200 text-sm md:text-base font-extrabold text-indigo-900">
                  {autoTotalActual > 0 ? `${autoTotalActual.toLocaleString('en-IN')} Sqft.` : '0 Sqft.'}
                </td>
                <td className="p-3 text-sm md:text-base font-extrabold text-indigo-900">
                  {autoTotalPermissible > 0 ? `${autoTotalPermissible.toLocaleString('en-IN')} Sqft.` : '0 Sqft.'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── Container: Area Specifications (Use Light Amber '#fff8e1') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-amber-300 shadow-sm"
        style={{ backgroundColor: '#fff8e1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Area Specifications
            </h3>
          </div>
          <span className="text-xs text-amber-900 font-medium bg-amber-100 px-2.5 py-1 rounded-md border border-amber-400">
            Section 8: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Total Actual (In Sqft)(G+2): Auto-calculated Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Total Actual (In Sqft)(G+2)
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaTotalActualAreaEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaTotalActualAreaEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaTotalActualAreaEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-amber-400 font-bold text-gray-900 text-base md:text-lg`}
                value={
                  fields.poonawallaTotalActualAreaManual ??
                  (autoTotalActual > 0 ? autoTotalActual : '')
                }
                onChange={(e) => {
                  handleChange('poonawallaTotalActualAreaManual', e.target.value);
                  handleChange('totalActualArea', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Total Actual Area..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Auto calculating from Sum(Base. Actual + Stilt Actual + Ground Actual + First Actual + Second Actual + Third/above Actual)"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-amber-50/70 border-amber-300 font-bold text-gray-900 text-base md:text-lg cursor-not-allowed`}
                  value={
                    autoTotalActual > 0
                      ? `${autoTotalActual.toLocaleString('en-IN')} Sqft.`
                      : '0 Sqft.'
                  }
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Total Permissible (In Sqft)(G+1): Auto-calculated Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Total Permissible (In Sqft)(G+1)
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaTotalPermissibleAreaEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaTotalPermissibleAreaEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.poonawallaTotalPermissibleAreaEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-amber-400 font-bold text-gray-900 text-base md:text-lg`}
                value={
                  fields.poonawallaTotalPermissibleAreaManual ??
                  (autoTotalPermissible > 0 ? autoTotalPermissible : '')
                }
                onChange={(e) => {
                  handleChange('poonawallaTotalPermissibleAreaManual', e.target.value);
                  handleChange('totalPermissibleArea', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Total Permissible Area..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Auto calculating from Sum(Base. Permissible + Stilt Permissible + Ground Permissible + First Permissible + Second Permissible + Third/above Permissible)"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-amber-50/70 border-amber-300 font-bold text-gray-900 text-base md:text-lg cursor-not-allowed`}
                  value={
                    autoTotalPermissible > 0
                      ? `${autoTotalPermissible.toLocaleString('en-IN')} Sqft.`
                      : '0 Sqft.'
                  }
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Extra Coverage (in %): Input Box (Numeric) / Auto-calculated */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Extra Coverage (in %)
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                className={inputCls}
                value={
                  fields.poonawallaExtraCoveragePercent ??
                  (autoExtraCoveragePercent !== '0' ? autoExtraCoveragePercent : '')
                }
                onChange={(e) => {
                  handleChange('poonawallaExtraCoveragePercent', e.target.value);
                  handleChange('extraCoveragePercent', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder={autoExtraCoveragePercent ? `${autoExtraCoveragePercent}%` : '0%'}
              />
              <span className="px-3 py-2 bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-300 text-xs md:text-sm shrink-0">
                %
              </span>
            </div>
          </Field>

          {/* Saleable (In Sqft): Input Box (Numeric) / Auto-calculated */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Saleable (In Sqft)
              </span>
            }
          >
            <input
              type="number"
              step="any"
              className={inputCls}
              value={
                fields.poonawallaSaleableArea ??
                (autoSaleable > 0 ? autoSaleable : '')
              }
              onChange={(e) => {
                handleChange('poonawallaSaleableArea', e.target.value);
                handleChange('saleableArea', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder={autoSaleable > 0 ? `${autoSaleable} Sqft.` : 'Enter Saleable area in Sqft...'}
            />
          </Field>

          {/* Composite Extra Coverage: Checkbox + Input Box */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Composite Extra Coverage
              </span>
            }
            span={2}
          >
            <div className="flex items-center gap-2.5">
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none bg-white px-3 py-2 rounded-lg border border-amber-300 shadow-xs hover:bg-amber-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(fields.poonawallaCompositeExtraCoverageCheck)}
                  onChange={(e) =>
                    handleChange('poonawallaCompositeExtraCoverageCheck', e.target.checked)
                  }
                  disabled={isReadOnly}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-amber-900">Applicable</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={fields.poonawallaCompositeExtraCoverage ?? ''}
                onChange={(e) =>
                  handleChange('poonawallaCompositeExtraCoverage', e.target.value)
                }
                disabled={isReadOnly}
                placeholder="Enter composite extra coverage details..."
              />
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 9: (A)Description of Constructed Area and Rates ────────────────

const DEFAULT_RATE_ROWS = [
  { description: 'Ground Floor', area: '', rate: '' },
  { description: 'First Floor', area: '', rate: '' },
  { description: 'Second Floor', area: '', rate: '' },
];

function ConstructedAreaRatesSection({
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

  const rowCount: number =
    typeof fields.poonawallaRateRowsCount === 'number'
      ? fields.poonawallaRateRowsCount
      : 3;
  const rowIndices = Array.from({ length: rowCount }, (_, i) => i);

  const handleAddRow = () => {
    handleChange('poonawallaRateRowsCount', rowCount + 1);
  };

  const handleRemoveRow = (indexToRemove: number) => {
    if (rowCount <= 1) return;
    for (let i = indexToRemove; i < rowCount - 1; i++) {
      handleChange(`poonawallaRateDesc_${i}`, fields[`poonawallaRateDesc_${i + 1}`]);
      handleChange(`poonawallaRateArea_${i}`, fields[`poonawallaRateArea_${i + 1}`]);
      handleChange(`poonawallaRatePrice_${i}`, fields[`poonawallaRatePrice_${i + 1}`]);
      handleChange(`poonawallaRateAmountEdit_${i}`, fields[`poonawallaRateAmountEdit_${i + 1}`]);
      handleChange(`poonawallaRateAmountManual_${i}`, fields[`poonawallaRateAmountManual_${i + 1}`]);
    }
    handleChange('poonawallaRateRowsCount', rowCount - 1);
  };

  // Compute total constructed area amount (A)
  let totalConstructedAreaAmount = 0;
  rowIndices.forEach((i) => {
    const area = parseNum(fields[`poonawallaRateArea_${i}`]);
    const rate = parseNum(fields[`poonawallaRatePrice_${i}`]);
    const autoAmount = area * rate;
    const effectiveAmount = fields[`poonawallaRateAmountEdit_${i}`]
      ? parseNum(fields[`poonawallaRateAmountManual_${i}`])
      : autoAmount;
    totalConstructedAreaAmount += effectiveAmount;
  });

  // Land Value (i) calculation
  const landSqyds = parseNum(fields.poonawallaLandSqyds ?? fields.landSqyds);
  const landValue =
    parseNum(fields.poonawallaLandValue) ||
    (landSqyds * (parseNum(fields.poonawallaLandRateSqyds) || parseNum(fields.landRate) || 0)) ||
    parseNum(fields.landValue) ||
    0;

  // Construction Value (ii) calculation
  const constructionValue =
    totalConstructedAreaAmount > 0
      ? totalConstructedAreaAmount
      : parseNum(fields.poonawallaConstructionValue) ||
        (parseNum(fields.poonawallaConstructionCompositeRate) * (parseNum(fields.poonawallaPlotArea) || parseNum(fields.totalActualArea) || 0)) ||
        0;

  // Auto Total Building Value (A+B) = Land Value (i) + Construction Value (ii)
  const autoTotalBuildingValue = landValue + constructionValue;

  const effectiveTotalBuildingValue = fields.poonawallaTotalBuildingValueEdit
    ? parseNum(fields.poonawallaTotalBuildingValueManual)
    : autoTotalBuildingValue;

  // Sync to outer form values for downstream sections (like Section 2)
  useEffect(() => {
    if (!fields.poonawallaTotalBuildingValueEdit && autoTotalBuildingValue > 0) {
      if (fields.poonawallaTotalBuildingValue !== autoTotalBuildingValue) {
        handleChange('poonawallaTotalBuildingValue', autoTotalBuildingValue);
        handleChange('totalBuildingValue', autoTotalBuildingValue);
        handleChange('buildingValue', autoTotalBuildingValue);
      }
    }
  }, [autoTotalBuildingValue, fields.poonawallaTotalBuildingValueEdit]);

  return (
    <div className="space-y-6">
      {/* ─── Container: Constructed Area Rates Table (Use Peach '#ffe0b2') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-orange-200 shadow-sm"
        style={{ backgroundColor: '#ffe0b2' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Constructed Area Rates Table
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-orange-950 font-medium bg-orange-100 px-2.5 py-1 rounded-md border border-orange-300">
              Section 9: Container 1
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-orange-200 shadow-xs bg-white">
          <table className="w-full text-sm text-left border-collapse min-w-160">
            <thead>
              <tr className="border-b border-orange-200 bg-orange-100/70 text-orange-950 font-bold text-xs uppercase tracking-wider">
                <th className="p-3 w-2/5 border-r border-orange-200">
                  Description
                </th>
                <th className="p-3 w-1/5 border-r border-orange-200">
                  Area
                </th>
                <th className="p-3 w-1/5 border-r border-orange-200">
                  Rate (in Rs.)
                </th>
                <th className="p-3 w-1/4 border-r border-orange-200">
                  Amount (in Rs.)
                </th>
                {!isReadOnly && rowCount > 1 && (
                  <th className="p-3 w-10 text-center"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {rowIndices.map((i) => {
                const descKey = `poonawallaRateDesc_${i}`;
                const areaKey = `poonawallaRateArea_${i}`;
                const priceKey = `poonawallaRatePrice_${i}`;
                const amountEditKey = `poonawallaRateAmountEdit_${i}`;
                const amountManualKey = `poonawallaRateAmountManual_${i}`;

                const defaultDesc =
                  i < DEFAULT_RATE_ROWS.length
                    ? DEFAULT_RATE_ROWS[i].description
                    : `Floor ${i + 1}`;

                const areaVal = parseNum(fields[areaKey]);
                const rateVal = parseNum(fields[priceKey]);
                const rowAutoAmount = areaVal * rateVal;
                const isRowEdit = Boolean(fields[amountEditKey]);

                return (
                  <tr key={i} className="hover:bg-orange-50/40 transition-colors">
                    <td className="p-2.5 border-r border-orange-200">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields[descKey] ?? defaultDesc}
                        onChange={(e) => handleChange(descKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Ground Floor / First Floor..."
                      />
                    </td>
                    <td className="p-2.5 border-r border-orange-200">
                      <input
                        type="number"
                        step="any"
                        className={inputCls}
                        value={fields[areaKey] ?? ''}
                        onChange={(e) => handleChange(areaKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Area (Sqft)..."
                      />
                    </td>
                    <td className="p-2.5 border-r border-orange-200">
                      <input
                        type="number"
                        step="any"
                        className={inputCls}
                        value={fields[priceKey] ?? ''}
                        onChange={(e) => handleChange(priceKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Rate (₹)..."
                      />
                    </td>
                    <td className="p-2.5 border-r border-orange-200">
                      <div className="flex items-center gap-2">
                        {isRowEdit ? (
                          <input
                            type="number"
                            step="any"
                            className={`${inputCls} bg-white border-orange-400 font-bold text-gray-900`}
                            value={
                              fields[amountManualKey] ??
                              (rowAutoAmount > 0 ? rowAutoAmount : '')
                            }
                            onChange={(e) =>
                              handleChange(amountManualKey, e.target.value)
                            }
                            disabled={isReadOnly}
                            placeholder="Amount..."
                          />
                        ) : (
                          <LockedFieldWrapper
                            isLocked={true}
                            tooltipMessage="Auto calculating from Area * Rate"
                          >
                            <input
                              type="text"
                              readOnly
                              disabled
                              className={`${inputCls} bg-orange-50/60 border-orange-200 font-bold text-gray-900 cursor-not-allowed`}
                              value={
                                rowAutoAmount > 0
                                  ? `₹${rowAutoAmount.toLocaleString('en-IN')}`
                                  : '₹0'
                              }
                            />
                          </LockedFieldWrapper>
                        )}
                        <EditSwitch
                          checked={isRowEdit}
                          onChange={(checked) =>
                            handleChange(amountEditKey, checked)
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                    {!isReadOnly && rowCount > 1 && (
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(i)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove Row"
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
              <tr className="bg-orange-100/60 font-bold text-orange-950 border-t-2 border-orange-200">
                <td className="p-3 text-xs md:text-sm uppercase tracking-wide border-r border-orange-200" colSpan={3}>
                  Total Constructed Area Amount (A)
                </td>
                <td className="p-3 text-sm md:text-base font-extrabold text-orange-900" colSpan={!isReadOnly && rowCount > 1 ? 2 : 1}>
                  ₹{totalConstructedAreaAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── Container: Construction & Building Value (Use Lavender '#ede7f6') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-purple-200 shadow-sm"
        style={{ backgroundColor: '#ede7f6' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Construction & Building Value
            </h3>
          </div>
          <span className="text-xs text-purple-900 font-medium bg-purple-100 px-2.5 py-1 rounded-md border border-purple-300">
            Section 9: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Land (sqyds.) ..(i): Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Land (sqyds.) ..(i)
              </span>
            }
          >
            <input
              type="number"
              step="any"
              className={inputCls}
              value={
                fields.poonawallaLandSqyds ??
                fields.landSqyds ??
                fields.landAreaSqyds ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaLandSqyds', e.target.value);
                handleChange('landSqyds', e.target.value);
                handleChange('landAreaSqyds', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Land in sqyds..."
            />
          </Field>

          {/* Construction /Composite Rate (sqft): Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Construction /Composite Rate (sqft)
              </span>
            }
          >
            <input
              type="number"
              step="any"
              className={inputCls}
              value={
                fields.poonawallaConstructionCompositeRate ??
                fields.constructionCompositeRate ??
                fields.compositeRate ??
                ''
              }
              onChange={(e) => {
                handleChange('poonawallaConstructionCompositeRate', e.target.value);
                handleChange('constructionCompositeRate', e.target.value);
                handleChange('compositeRate', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Construction / Composite Rate per sqft..."
            />
          </Field>

          {/* Stage of construction: Input Box / Dropdown */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Stage of construction
              </span>
            }
          >
            <CustomSelect
              value={fields.poonawallaStageOfConstruction || 'Completed'}
              customValue={fields.poonawallaStageOfConstructionCustom || ''}
              onChange={(val) => {
                handleChange('poonawallaStageOfConstruction', val);
                const finalVal =
                  val === 'Custom'
                    ? fields.poonawallaStageOfConstructionCustom || ''
                    : val;
                handleChange('stageOfConstruction', finalVal);
              }}
              onCustomChange={(val) => {
                handleChange('poonawallaStageOfConstructionCustom', val);
                handleChange('stageOfConstruction', val);
              }}
              options={[
                { value: 'Completed', label: 'Completed' },
                { value: 'Finishing Stage', label: 'Finishing Stage' },
                { value: 'Plastering / Flooring', label: 'Plastering / Flooring' },
                { value: 'Brickwork & Slab', label: 'Brickwork & Slab' },
                { value: 'Plinth Level', label: 'Plinth Level' },
                { value: 'Under Construction', label: 'Under Construction' },
              ]}
              disabled={isReadOnly}
              placeholder="Select Stage of construction..."
            />
          </Field>

          {/* Stage %: Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Stage %
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min={0}
                max={100}
                className={inputCls}
                value={fields.poonawallaStagePercent ?? '100'}
                onChange={(e) => {
                  handleChange('poonawallaStagePercent', e.target.value);
                  handleChange('stagePercent', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="100"
              />
              <span className="px-3 py-2 bg-purple-100 text-purple-900 font-bold rounded-lg border border-purple-300 text-xs md:text-sm shrink-0">
                %
              </span>
            </div>
          </Field>

          {/* Recommended %: Input Box (Numeric) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Recommended %
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min={0}
                max={100}
                className={inputCls}
                value={fields.poonawallaRecommendedPercent ?? '100'}
                onChange={(e) => {
                  handleChange('poonawallaRecommendedPercent', e.target.value);
                  handleChange('recommendedPercent', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="100"
              />
              <span className="px-3 py-2 bg-purple-100 text-purple-900 font-bold rounded-lg border border-purple-300 text-xs md:text-sm shrink-0">
                %
              </span>
            </div>
          </Field>

          {/* Total Building Value (A+B): Auto-calculated Field with Lock UI, Edit Switch */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Total Building Value (A+B)
                </span>
                <EditSwitch
                  checked={Boolean(fields.poonawallaTotalBuildingValueEdit)}
                  onChange={(checked) =>
                    handleChange('poonawallaTotalBuildingValueEdit', checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            }
            span={2}
          >
            {fields.poonawallaTotalBuildingValueEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-purple-400 font-bold text-gray-900 text-base md:text-lg`}
                value={
                  fields.poonawallaTotalBuildingValueManual ??
                  (autoTotalBuildingValue > 0 ? autoTotalBuildingValue : '')
                }
                onChange={(e) => {
                  handleChange('poonawallaTotalBuildingValueManual', e.target.value);
                  handleChange('poonawallaTotalBuildingValue', e.target.value);
                  handleChange('totalBuildingValue', e.target.value);
                  handleChange('buildingValue', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="Enter Total Building Value..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage="Auto calculating from Land Value (i) + Construction Value (ii)"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-purple-50/70 border-purple-300 font-bold text-gray-900 text-base md:text-lg cursor-not-allowed`}
                  value={
                    effectiveTotalBuildingValue > 0
                      ? `₹${effectiveTotalBuildingValue.toLocaleString('en-IN')}`
                      : '₹0'
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
    'section-7', // Replaced by Section 7: Building details
    'section-8', // Replaced by Section 8: Floor Wise Area (In Sqft.)
    'section-9', // Replaced by Section 9: (A)Description of Constructed Area and Rates
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'poonawalla-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'poonawalla-section-2', title: 'VALUE OF THE PROPERTY' },
    { id: 'poonawalla-section-3', title: 'PURPOSE OF VALUATION' },
    { id: 'poonawalla-section-4', title: 'PREPARED BY' },
    { id: 'poonawalla-section-5', title: 'SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS' },
    { id: 'poonawalla-section-6', title: 'Boundaries as Per Documents & Site' },
    { id: 'poonawalla-section-7', title: 'Building details' },
    { id: 'poonawalla-section-8', title: 'Floor Wise Area (In Sqft.)' },
    { id: 'poonawalla-section-9', title: 'Description of Constructed Area and Rates' },
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
    {
      id: 'poonawalla-section-7',
      title: 'Building details',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <BuildingDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-8',
      title: 'Floor Wise Area (In Sqft.)',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <FloorWiseAreaSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'poonawalla-section-9',
      title: '(A)Description of Constructed Area and Rates',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ConstructedAreaRatesSection
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
    poonawallaPropertyDemarcation: 'Demarcated',
    poonawallaTypeOfStructure: 'RCC',
    poonawallaQualityOfConstruction: 'Good',
    poonawallaInteriorsExteriors: 'Good',
    poonawallaLocationType: 'Commercial',
    poonawallaClassOfLocality: 'Middle class',
    poonawallaSiteDevelopmentStatus: 'Developed',
    poonawallaPropertyWithinMunicipalLimits: 'Yes',
    poonawallaMarketability: 'Good',
    poonawallaBasicAmenities: ['Water', 'Sewer', 'Electrical', 'Road'],
    poonawallaStageOfConstruction: 'Completed',
    poonawallaStagePercent: '100',
    poonawallaRecommendedPercent: '100',
  },
};

export default function PoonawallaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={POONAWALLA_FINANCE_CONFIG} {...props} />;
}
