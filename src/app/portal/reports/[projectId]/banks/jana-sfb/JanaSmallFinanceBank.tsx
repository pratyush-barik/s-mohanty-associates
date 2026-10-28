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
  Building,
  MapPin,
  FileCheck,
  Compass,
  Map,
  Home,
  Layers,
  Key,
  AlertTriangle,
  Calculator,
  TrendingUp,
  Hammer,
  Plus,
  Trash2,
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
              disabled={true}
              readOnly={true}
              placeholder="SMA-YYYY/MM-NNNN"
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

// ─── Section 2: PROPERTY DETAILS ─────────────────────────────────────────────

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
      {/* ─── Container 1: PROPERTY DETAILS (Light Blue '#e3f2fd') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              PROPERTY DETAILS
            </h3>
          </div>
          <span className="text-xs text-blue-700 font-medium bg-blue-100 px-2.5 py-1 rounded-md border border-blue-300">
            Section 2: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 2.1 Address of Property (as per site visit) -> [Input Box: Variable size / Textarea] */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                2.1 Address of Property (as per site visit)
              </span>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              value={fields.janaAddressOfProperty ?? fields.propertyAddress ?? fields.address ?? ''}
              onChange={(e) => {
                handleChange('janaAddressOfProperty', e.target.value);
                handleChange('propertyAddress', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Address of Property as per site visit..."
            />
          </Field>

          {/* 2.2 Pin Code -> [Input Box: Fixed size] */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                2.2 Pin Code
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.janaPinCode ?? fields.pincode ?? fields.pinCode ?? ''}
              onChange={(e) => {
                handleChange('janaPinCode', e.target.value);
                handleChange('pincode', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. 751024"
            />
          </Field>

          {/* 2.3 Latitude & Longitude -> [Input Box: Fixed size] [Checkbox: NA] */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  2.3 Latitude & Longitude
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaLatitudeLongitudeNA)}
                  onChange={(checked) => {
                    handleChange('janaLatitudeLongitudeNA', checked);
                    if (checked) {
                      handleChange('janaLatitudeLongitude', 'NA');
                    } else {
                      handleChange('janaLatitudeLongitude', '');
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
                fields.janaLatitudeLongitudeNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaLatitudeLongitudeNA
                  ? 'NA'
                  : (fields.janaLatitudeLongitude ??
                     fields.coordinates ??
                     (fields.latitude && fields.longitude
                       ? `${fields.latitude}, ${fields.longitude}`
                       : ''))
              }
              onChange={(e) => {
                handleChange('janaLatitudeLongitude', e.target.value);
                handleChange('coordinates', e.target.value);
              }}
              disabled={isReadOnly || fields.janaLatitudeLongitudeNA}
              placeholder={fields.janaLatitudeLongitudeNA ? 'NA' : 'e.g. 20.2961, 85.8245'}
            />
          </Field>

          {/* 2.4 Legal Address of the Property (as per site visit) -> [Input Box: Variable size / Textarea] */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                2.4 Legal Address of the Property (as per site visit)
              </span>
            }
            span={2}
          >
            <AutoResizeTextarea
              rows={2}
              value={fields.janaLegalAddressOfProperty ?? fields.legalAddress ?? fields.propertyAddress ?? ''}
              onChange={(e) => {
                handleChange('janaLegalAddressOfProperty', e.target.value);
                handleChange('legalAddress', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Enter Legal Address of the Property..."
            />
          </Field>

          {/* 2.5 Nearby Landmark -> [Input Box: Fixed size] [Checkbox: NA] */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  2.5 Nearby Landmark
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaNearbyLandmarkNA)}
                  onChange={(checked) => {
                    handleChange('janaNearbyLandmarkNA', checked);
                    if (checked) {
                      handleChange('janaNearbyLandmark', 'NA');
                    } else {
                      handleChange('janaNearbyLandmark', '');
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
                fields.janaNearbyLandmarkNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaNearbyLandmarkNA
                  ? 'NA'
                  : (fields.janaNearbyLandmark ?? fields.nearestLandmark ?? fields.landmark ?? '')
              }
              onChange={(e) => {
                handleChange('janaNearbyLandmark', e.target.value);
                handleChange('nearestLandmark', e.target.value);
              }}
              disabled={isReadOnly || fields.janaNearbyLandmarkNA}
              placeholder={fields.janaNearbyLandmarkNA ? 'NA' : 'Enter Nearby Landmark'}
            />
          </Field>

          {/* 2.6 Seismic Zone -> [Dropdown] */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                2.6 Seismic Zone
              </span>
            }
          >
            <select
              className={inputCls}
              value={fields.janaSeismicZone || 'Zone III'}
              onChange={(e) => handleChange('janaSeismicZone', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Zone II">Zone II (Low Damage Risk Zone)</option>
              <option value="Zone III">Zone III (Moderate Damage Risk Zone)</option>
              <option value="Zone IV">Zone IV (High Damage Risk Zone)</option>
              <option value="Zone V">Zone V (Very High Damage Risk Zone)</option>
            </select>
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: DOCUMENT DETAILS ─────────────────────────────────────────────

function DocumentDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const otherLegalOptions = [
    'Sale Deed',
    'Title Deed',
    'Patta / RoR',
    'Tax Receipt',
    'Conversion Order',
    'Khata / Mutation',
  ];

  const selectedOtherDocs: string[] = Array.isArray(fields.janaOtherLegalDocsSelected)
    ? fields.janaOtherLegalDocsSelected
    : typeof fields.janaOtherLegalDocsSelected === 'string' && fields.janaOtherLegalDocsSelected
    ? fields.janaOtherLegalDocsSelected.split(',').map((s: string) => s.trim())
    : ['Sale Deed'];

  const handleToggleOtherDoc = (doc: string) => {
    let updated: string[];
    if (selectedOtherDocs.includes(doc)) {
      updated = selectedOtherDocs.filter((d) => d !== doc);
    } else {
      updated = [...selectedOtherDocs, doc];
    }
    handleChange('janaOtherLegalDocsSelected', updated);
  };

  return (
    <div className="space-y-6">
      {/* ─── Table: DOCUMENT DETAILS (Light Green '#e8f5e9') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-emerald-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              DOCUMENT DETAILS
            </h3>
          </div>
          <span className="text-xs text-emerald-800 font-medium bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
            Section 3: Table 1
          </span>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto rounded-xl border border-emerald-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-175">
            <thead>
              <tr className="bg-emerald-100/80 border-b border-emerald-300 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/3 min-w-46.25">Document Name & Status</th>
                <th className="py-3 px-4 w-1/3 min-w-46.25">Approving Authority</th>
                <th className="py-3 px-4 w-1/3 min-w-46.25">Approval No. & Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {/* Row 3.1: Layout Plan Provided */}
              <tr className="hover:bg-emerald-50/40 transition-colors">
                <td className="p-4 align-top">
                  <div className="space-y-2">
                    <span className="font-bold text-gray-900 text-xs md:text-sm block">
                      3.1 Layout Plan Provided (Y/N)
                    </span>
                    <RadioGroup
                      name="janaLayoutPlanProvided"
                      value={fields.janaLayoutPlanProvided || 'No'}
                      onChange={(val) => handleChange('janaLayoutPlanProvided', val)}
                      options={['Yes', 'No']}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approving Authority
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaLayoutPlanApprovingAuthNA)}
                        onChange={(checked) => {
                          handleChange('janaLayoutPlanApprovingAuthNA', checked);
                          if (checked) {
                            handleChange('janaLayoutPlanApprovingAuth', 'NA');
                          } else {
                            handleChange('janaLayoutPlanApprovingAuth', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaLayoutPlanApprovingAuthNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaLayoutPlanApprovingAuthNA
                          ? 'NA'
                          : (fields.janaLayoutPlanApprovingAuth ?? '')
                      }
                      onChange={(e) => handleChange('janaLayoutPlanApprovingAuth', e.target.value)}
                      disabled={isReadOnly || fields.janaLayoutPlanApprovingAuthNA}
                      placeholder={fields.janaLayoutPlanApprovingAuthNA ? 'NA' : 'e.g. BDA / Municipal Corp'}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approval No. & Date
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaLayoutPlanApprovalNoDateNA)}
                        onChange={(checked) => {
                          handleChange('janaLayoutPlanApprovalNoDateNA', checked);
                          if (checked) {
                            handleChange('janaLayoutPlanApprovalNoDate', 'NA');
                          } else {
                            handleChange('janaLayoutPlanApprovalNoDate', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaLayoutPlanApprovalNoDateNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaLayoutPlanApprovalNoDateNA
                          ? 'NA'
                          : (fields.janaLayoutPlanApprovalNoDate ?? '')
                      }
                      onChange={(e) => handleChange('janaLayoutPlanApprovalNoDate', e.target.value)}
                      disabled={isReadOnly || fields.janaLayoutPlanApprovalNoDateNA}
                      placeholder={fields.janaLayoutPlanApprovalNoDateNA ? 'NA' : 'e.g. LP/2022/104 dt 15.03.2022'}
                    />
                  </div>
                </td>
              </tr>

              {/* Row 3.2: Building Plan Provided */}
              <tr className="hover:bg-emerald-50/40 transition-colors">
                <td className="p-4 align-top">
                  <div className="space-y-2">
                    <span className="font-bold text-gray-900 text-xs md:text-sm block">
                      3.2 Building Plan Provided (Y/N)
                    </span>
                    <RadioGroup
                      name="janaBuildingPlanProvided"
                      value={fields.janaBuildingPlanProvided || 'Yes'}
                      onChange={(val) => handleChange('janaBuildingPlanProvided', val)}
                      options={['Yes', 'No']}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approving Authority
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaBuildingPlanApprovingAuthNA)}
                        onChange={(checked) => {
                          handleChange('janaBuildingPlanApprovingAuthNA', checked);
                          if (checked) {
                            handleChange('janaBuildingPlanApprovingAuth', 'NA');
                          } else {
                            handleChange('janaBuildingPlanApprovingAuth', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaBuildingPlanApprovingAuthNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaBuildingPlanApprovingAuthNA
                          ? 'NA'
                          : (fields.janaBuildingPlanApprovingAuth ?? fields.approvingAuthority ?? '')
                      }
                      onChange={(e) => handleChange('janaBuildingPlanApprovingAuth', e.target.value)}
                      disabled={isReadOnly || fields.janaBuildingPlanApprovingAuthNA}
                      placeholder={fields.janaBuildingPlanApprovingAuthNA ? 'NA' : 'e.g. BMC / Gram Panchayat'}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approval No. & Date
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaBuildingPlanApprovalNoDateNA)}
                        onChange={(checked) => {
                          handleChange('janaBuildingPlanApprovalNoDateNA', checked);
                          if (checked) {
                            handleChange('janaBuildingPlanApprovalNoDate', 'NA');
                          } else {
                            handleChange('janaBuildingPlanApprovalNoDate', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaBuildingPlanApprovalNoDateNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaBuildingPlanApprovalNoDateNA
                          ? 'NA'
                          : (fields.janaBuildingPlanApprovalNoDate ?? fields.sanctionPlanNo ?? '')
                      }
                      onChange={(e) => handleChange('janaBuildingPlanApprovalNoDate', e.target.value)}
                      disabled={isReadOnly || fields.janaBuildingPlanApprovalNoDateNA}
                      placeholder={fields.janaBuildingPlanApprovalNoDateNA ? 'NA' : 'e.g. BP/512/2021 dt 10.08.2021'}
                    />
                  </div>
                </td>
              </tr>

              {/* Row 3.3: Construction Permission */}
              <tr className="hover:bg-emerald-50/40 transition-colors">
                <td className="p-4 align-top">
                  <div className="space-y-2">
                    <span className="font-bold text-gray-900 text-xs md:text-sm block">
                      3.3 Construction Permission (Y/N)
                    </span>
                    <RadioGroup
                      name="janaConstructionPermissionProvided"
                      value={fields.janaConstructionPermissionProvided || 'Yes'}
                      onChange={(val) => handleChange('janaConstructionPermissionProvided', val)}
                      options={['Yes', 'No']}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approving Authority
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaConstPermApprovingAuthNA)}
                        onChange={(checked) => {
                          handleChange('janaConstPermApprovingAuthNA', checked);
                          if (checked) {
                            handleChange('janaConstPermApprovingAuth', 'NA');
                          } else {
                            handleChange('janaConstPermApprovingAuth', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaConstPermApprovingAuthNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaConstPermApprovingAuthNA
                          ? 'NA'
                          : (fields.janaConstPermApprovingAuth ?? '')
                      }
                      onChange={(e) => handleChange('janaConstPermApprovingAuth', e.target.value)}
                      disabled={isReadOnly || fields.janaConstPermApprovingAuthNA}
                      placeholder={fields.janaConstPermApprovingAuthNA ? 'NA' : 'e.g. Competent Authority'}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approval No. & Date
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaConstPermApprovalNoDateNA)}
                        onChange={(checked) => {
                          handleChange('janaConstPermApprovalNoDateNA', checked);
                          if (checked) {
                            handleChange('janaConstPermApprovalNoDate', 'NA');
                          } else {
                            handleChange('janaConstPermApprovalNoDate', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaConstPermApprovalNoDateNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaConstPermApprovalNoDateNA
                          ? 'NA'
                          : (fields.janaConstPermApprovalNoDate ?? '')
                      }
                      onChange={(e) => handleChange('janaConstPermApprovalNoDate', e.target.value)}
                      disabled={isReadOnly || fields.janaConstPermApprovalNoDateNA}
                      placeholder={fields.janaConstPermApprovalNoDateNA ? 'NA' : 'e.g. CP/88/2021 dt 12.10.2021'}
                    />
                  </div>
                </td>
              </tr>

              {/* Row 3.4: Other Legal Document Provided */}
              <tr className="hover:bg-emerald-50/40 transition-colors">
                <td className="p-4 align-top">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-900 text-xs md:text-sm">
                        3.4 Other Legal Document Provided
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaOtherLegalDocNA)}
                        onChange={(checked) => {
                          handleChange('janaOtherLegalDocNA', checked);
                          if (checked) {
                            handleChange('janaOtherLegalDocsCustom', 'NA');
                          } else {
                            handleChange('janaOtherLegalDocsCustom', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>

                    {!fields.janaOtherLegalDocNA ? (
                      <div className="space-y-2.5">
                        {/* Checkbox Group */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {otherLegalOptions.map((doc) => {
                            const isChecked = selectedOtherDocs.includes(doc);
                            return (
                              <label
                                key={doc}
                                className={`flex items-center gap-1.5 p-1.5 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-semibold'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-emerald-50/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleOtherDoc(doc)}
                                  disabled={isReadOnly}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="truncate">{doc}</span>
                              </label>
                            );
                          })}
                        </div>
                        {/* Additional / Custom Legal Document Input Box */}
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.janaOtherLegalDocsCustom ?? ''}
                          onChange={(e) => handleChange('janaOtherLegalDocsCustom', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Other documents (e.g. Encumbrance Cert, Electricity Bill)..."
                        />
                      </div>
                    ) : (
                      <div className="p-2.5 bg-gray-100 rounded-lg text-gray-500 italic text-xs border border-gray-200">
                        No other legal documents provided (NA)
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approving Authority
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaOtherDocApprovingAuthNA)}
                        onChange={(checked) => {
                          handleChange('janaOtherDocApprovingAuthNA', checked);
                          if (checked) {
                            handleChange('janaOtherDocApprovingAuth', 'NA');
                          } else {
                            handleChange('janaOtherDocApprovingAuth', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaOtherDocApprovingAuthNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaOtherDocApprovingAuthNA
                          ? 'NA'
                          : (fields.janaOtherDocApprovingAuth ?? '')
                      }
                      onChange={(e) => handleChange('janaOtherDocApprovingAuth', e.target.value)}
                      disabled={isReadOnly || fields.janaOtherDocApprovingAuthNA}
                      placeholder={fields.janaOtherDocApprovingAuthNA ? 'NA' : 'e.g. Sub-Registrar / Tahasildar'}
                    />
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">
                        Approval No. & Date
                      </span>
                      <NaCheckbox
                        checked={Boolean(fields.janaOtherDocApprovalNoDateNA)}
                        onChange={(checked) => {
                          handleChange('janaOtherDocApprovalNoDateNA', checked);
                          if (checked) {
                            handleChange('janaOtherDocApprovalNoDate', 'NA');
                          } else {
                            handleChange('janaOtherDocApprovalNoDate', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <input
                      type="text"
                      className={`${inputCls} ${
                        fields.janaOtherDocApprovalNoDateNA
                          ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                          : ''
                      }`}
                      value={
                        fields.janaOtherDocApprovalNoDateNA
                          ? 'NA'
                          : (fields.janaOtherDocApprovalNoDate ?? '')
                      }
                      onChange={(e) => handleChange('janaOtherDocApprovalNoDate', e.target.value)}
                      disabled={isReadOnly || fields.janaOtherDocApprovalNoDateNA}
                      placeholder={fields.janaOtherDocApprovalNoDateNA ? 'NA' : 'e.g. Doc No. 1245/2019'}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: PHYSICAL DETAILS ─────────────────────────────────────────────

function PhysicalDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // Helper for boundary cells with NA support
  const renderBoundaryCell = (
    fieldName: string,
    naFieldName: string,
    direction: string,
    placeholder?: string
  ) => {
    const isNa = Boolean(fields[naFieldName]);
    const val = fields[fieldName] ?? '';
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {direction}
          </span>
          <NaCheckbox
            checked={isNa}
            onChange={(checked) => {
              handleChange(naFieldName, checked);
              if (checked) {
                handleChange(fieldName, 'NA');
              } else {
                handleChange(fieldName, '');
              }
            }}
            disabled={isReadOnly}
          />
        </div>
        <input
          type="text"
          className={`${inputCls} ${
            isNa ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic' : ''
          }`}
          value={isNa ? 'NA' : val}
          onChange={(e) => handleChange(fieldName, e.target.value)}
          disabled={isReadOnly || isNa}
          placeholder={isNa ? 'NA' : placeholder || `Enter ${direction}...`}
        />
      </div>
    );
  };

  // Dropdown options
  const plotDemarcatedOptions = [
    { value: 'Permanent', label: 'Permanent' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Demarcated by Boundary Wall', label: 'Demarcated by Boundary Wall' },
    { value: 'Demarcated by Pillars', label: 'Demarcated by Pillars' },
    { value: 'Not Demarcated', label: 'Not Demarcated' },
    { value: 'Open Land', label: 'Open Land' },
  ];

  const typeOfLocalityOptions = [
    { value: 'Residential', label: 'Residential' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Mix', label: 'Mix' },
    { value: 'Industrial', label: 'Industrial' },
    { value: 'Others', label: 'Others' },
  ];

  const classOfLocalityOptions = [
    { value: 'Posh', label: 'Posh' },
    { value: 'High', label: 'High' },
    { value: 'Middle', label: 'Middle' },
    { value: 'Low', label: 'Low' },
    { value: 'Slum', label: 'Slum' },
  ];

  const propertyLocationOptions = [
    { value: 'Municipal Corporation (MC)', label: 'MC (Municipal Corporation)' },
    { value: 'Gram Panchayat (GP)', label: 'GP (Gram Panchayat)' },
    { value: 'Panchayat under Development Authority', label: 'Panchayat under Development Authority' },
    { value: 'Municipality / NAC', label: 'Municipality / NAC' },
  ];

  const typeOfPropertyOptions = [
    { value: 'Land', label: 'Land' },
    { value: 'Bungalow', label: 'Bungalow' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Builder Floor', label: 'Builder Floor' },
    { value: 'Factory', label: 'Factory' },
    { value: 'Commercial Shop', label: 'Commercial Shop' },
    { value: 'Commercial Office', label: 'Commercial Office' },
    { value: 'Institute', label: 'Institute' },
    { value: 'Farm House', label: 'Farm House' },
    { value: 'Residential Building', label: 'Residential Building' },
    { value: 'Others', label: 'Others' },
  ];

  const structureOptions = [
    { value: 'RCC', label: 'RCC' },
    { value: 'Load Bearing', label: 'Load Bearing' },
    { value: 'Mixed', label: 'Mixed' },
    { value: 'Steel Structure', label: 'Steel Structure' },
  ];

  // 4.8 Vicinity Amenities multi-select
  const vicinityAmenitiesList = ['Electricity', 'Water', 'Drainage'];
  const selectedVicinity: string[] = Array.isArray(fields.janaVicinityAmenities)
    ? fields.janaVicinityAmenities
    : typeof fields.janaVicinityAmenities === 'string' && fields.janaVicinityAmenities
    ? fields.janaVicinityAmenities.split(',').map((s: string) => s.trim())
    : ['Electricity', 'Water', 'Drainage'];

  const handleToggleVicinity = (amenity: string) => {
    let updated: string[];
    if (selectedVicinity.includes(amenity)) {
      updated = selectedVicinity.filter((a) => a !== amenity);
    } else {
      updated = [...selectedVicinity, amenity];
    }
    handleChange('janaVicinityAmenities', updated);
  };

  // 4.17 Unit Details integer parser & auto-sum calculations
  const parsePositiveInt = (v: any): number => {
    if (v === '' || v === undefined || v === null) return 0;
    const parsed = parseInt(String(v).replace(/,/g, ''), 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const gfRooms = parsePositiveInt(fields.janaUnitDetails_GF_rooms);
  const ffRooms = parsePositiveInt(fields.janaUnitDetails_FF_rooms);
  const sfRooms = parsePositiveInt(fields.janaUnitDetails_SF_rooms);
  const tfRooms = parsePositiveInt(fields.janaUnitDetails_TF_rooms);
  const autoTotalRooms = gfRooms + ffRooms + sfRooms + tfRooms;

  const gfKitchen = parsePositiveInt(fields.janaUnitDetails_GF_kitchen);
  const ffKitchen = parsePositiveInt(fields.janaUnitDetails_FF_kitchen);
  const sfKitchen = parsePositiveInt(fields.janaUnitDetails_SF_kitchen);
  const tfKitchen = parsePositiveInt(fields.janaUnitDetails_TF_kitchen);
  const autoTotalKitchen = gfKitchen + ffKitchen + sfKitchen + tfKitchen;

  const gfBath = parsePositiveInt(fields.janaUnitDetails_GF_bath);
  const ffBath = parsePositiveInt(fields.janaUnitDetails_FF_bath);
  const sfBath = parsePositiveInt(fields.janaUnitDetails_SF_bath);
  const tfBath = parsePositiveInt(fields.janaUnitDetails_TF_bath);
  const autoTotalBath = gfBath + ffBath + sfBath + tfBath;

  const gfOthers = parsePositiveInt(fields.janaUnitDetails_GF_others);
  const ffOthers = parsePositiveInt(fields.janaUnitDetails_FF_others);
  const sfOthers = parsePositiveInt(fields.janaUnitDetails_SF_others);
  const tfOthers = parsePositiveInt(fields.janaUnitDetails_TF_others);
  const autoTotalOthers = gfOthers + ffOthers + sfOthers + tfOthers;

  // 4.23 Residual Age Auto-calculation
  const propAge = fields.janaAgeOfProperty ? parsePositiveInt(fields.janaAgeOfProperty) : 0;
  const autoResidualAge = fields.janaAgeOfPropertyNA
    ? 'NA'
    : fields.janaAgeOfProperty !== undefined && fields.janaAgeOfProperty !== ''
    ? String(Math.max(0, 60 - propAge))
    : '60';

  return (
    <div className="space-y-6">
      {/* ─── 1. Table: Four Boundaries of property (Light Yellow '#fffde7') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-amber-200 shadow-sm"
        style={{ backgroundColor: '#fffde7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Four Boundaries of Property
            </h3>
          </div>
          <span className="text-xs text-amber-800 font-medium bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
            Section 4: Table 1
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-amber-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-175">
            <thead>
              <tr className="bg-amber-100/80 border-b border-amber-300 text-amber-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/5 min-w-36">Directions</th>
                <th className="py-3 px-4 w-1/5 min-w-36">East</th>
                <th className="py-3 px-4 w-1/5 min-w-36">West</th>
                <th className="py-3 px-4 w-1/5 min-w-36">North</th>
                <th className="py-3 px-4 w-1/5 min-w-36">South</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {/* Row 4.1: As per Sale Deed */}
              <tr className="hover:bg-amber-50/50 transition-colors">
                <td className="p-4 align-top font-bold text-gray-900 text-xs md:text-sm">
                  4.1 As per Sale Deed
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesDeedEast',
                    'janaBoundariesDeedEastNA',
                    'East'
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesDeedWest',
                    'janaBoundariesDeedWestNA',
                    'West'
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesDeedNorth',
                    'janaBoundariesDeedNorthNA',
                    'North'
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesDeedSouth',
                    'janaBoundariesDeedSouthNA',
                    'South'
                  )}
                </td>
              </tr>

              {/* Row 4.2: As per sketch map */}
              <tr className="hover:bg-amber-50/50 transition-colors">
                <td className="p-4 align-top font-bold text-gray-900 text-xs md:text-sm">
                  4.2 As per sketch map
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesMapEast',
                    'janaBoundariesMapEastNA',
                    'East'
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesMapWest',
                    'janaBoundariesMapWestNA',
                    'West'
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesMapNorth',
                    'janaBoundariesMapNorthNA',
                    'North'
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesMapSouth',
                    'janaBoundariesMapSouthNA',
                    'South'
                  )}
                </td>
              </tr>

              {/* Row 4.3: Actual at site */}
              <tr className="hover:bg-amber-50/50 transition-colors">
                <td className="p-4 align-top font-bold text-gray-900 text-xs md:text-sm">
                  4.3 Actual at site
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesSiteEast',
                    'janaBoundariesSiteEastNA',
                    'East',
                    fields.boundaryEast || ''
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesSiteWest',
                    'janaBoundariesSiteWestNA',
                    'West',
                    fields.boundaryWest || ''
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesSiteNorth',
                    'janaBoundariesSiteNorthNA',
                    'North',
                    fields.boundaryNorth || ''
                  )}
                </td>
                <td className="p-3 align-top">
                  {renderBoundaryCell(
                    'janaBoundariesSiteSouth',
                    'janaBoundariesSiteSouthNA',
                    'South',
                    fields.boundarySouth || ''
                  )}
                </td>
              </tr>

              {/* Row 4.4: Boundaries Matching & Remarks */}
              <tr className="bg-amber-50/70 border-t border-amber-200">
                <td colSpan={5} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-4 space-y-2">
                      <span className="font-bold text-gray-900 text-xs md:text-sm block">
                        4.4 Boundaries Matching (Y/N)
                      </span>
                      <RadioGroup
                        name="janaBoundariesMatching"
                        value={fields.janaBoundariesMatching || 'Yes'}
                        onChange={(val) => handleChange('janaBoundariesMatching', val)}
                        options={['Yes', 'No']}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="md:col-span-8 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700">
                          If Not, remarks
                        </span>
                        <NaCheckbox
                          checked={Boolean(fields.janaBoundariesRemarksNA)}
                          onChange={(checked) => {
                            handleChange('janaBoundariesRemarksNA', checked);
                            if (checked) {
                              handleChange('janaBoundariesRemarks', 'NA');
                            } else {
                              handleChange('janaBoundariesRemarks', '');
                            }
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <AutoResizeTextarea
                        value={
                          fields.janaBoundariesRemarksNA
                            ? 'NA'
                            : (fields.janaBoundariesRemarks ?? '')
                        }
                        onChange={(e) => handleChange('janaBoundariesRemarks', e.target.value)}
                        disabled={isReadOnly || fields.janaBoundariesRemarksNA}
                        placeholder={
                          fields.janaBoundariesRemarksNA
                            ? 'NA'
                            : 'Mention discrepancies in boundaries between deed, map and site...'
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 2. Container: Plot & Locality Attributes (Light Orange '#fff3e0') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-orange-200 shadow-sm"
        style={{ backgroundColor: '#fff3e0' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200 pb-3">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Plot & Locality Attributes
            </h3>
          </div>
          <span className="text-xs text-orange-800 font-medium bg-orange-100 px-2.5 py-1 rounded-md border border-orange-300">
            Section 4: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* 4.5 Plot Details (Plot Area) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.5 Plot Details (Plot Area)
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                className={inputCls}
                value={fields.janaPlotArea ?? fields.plotArea ?? fields.landArea ?? ''}
                onChange={(e) => handleChange('janaPlotArea', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 1500"
              />
              <select
                className={`${inputCls} w-32 shrink-0 bg-white font-medium`}
                value={fields.janaPlotAreaUnit || 'Sq. Ft.'}
                onChange={(e) => handleChange('janaPlotAreaUnit', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Sq. Ft.">Sq. Ft.</option>
                <option value="Sq. Mtr.">Sq. Mtr.</option>
                <option value="Sq. Yds.">Sq. Yds.</option>
                <option value="Decimal">Decimal</option>
                <option value="Acre">Acre</option>
                <option value="Gunta">Gunta</option>
                <option value="Cent">Cent</option>
              </select>
            </div>
          </Field>

          {/* 4.6 Plot demarcated at site */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.6 Plot demarcated at site
              </span>
            }
          >
            <CustomSelect
              value={fields.janaPlotDemarcated || 'Permanent'}
              customValue={fields.janaPlotDemarcatedCustom || ''}
              onChange={(val) => handleChange('janaPlotDemarcated', val)}
              onCustomChange={(val) => handleChange('janaPlotDemarcatedCustom', val)}
              options={plotDemarcatedOptions}
              disabled={isReadOnly}
              placeholder="Select demarcation status..."
            />
          </Field>

          {/* 4.7 Land Use (As per master plan) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  4.7 Land Use (As per master plan)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaLandUseNA)}
                  onChange={(checked) => {
                    handleChange('janaLandUseNA', checked);
                    if (checked) {
                      handleChange('janaLandUse', 'NA');
                    } else {
                      handleChange('janaLandUse', '');
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
                fields.janaLandUseNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={fields.janaLandUseNA ? 'NA' : (fields.janaLandUse ?? '')}
              onChange={(e) => handleChange('janaLandUse', e.target.value)}
              disabled={isReadOnly || fields.janaLandUseNA}
              placeholder={fields.janaLandUseNA ? 'NA' : 'e.g. Residential / Mixed Use'}
            />
          </Field>

          {/* 4.8 Electricity, water, drainage in vicinity */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.8 Electricity, Water, Drainage in Vicinity (Y/N)
              </span>
            }
          >
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                {vicinityAmenitiesList.map((amenity) => {
                  const isChecked = selectedVicinity.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => !isReadOnly && handleToggleVicinity(amenity)}
                      disabled={isReadOnly}
                      className={`py-1.5 px-2 rounded-md border text-center text-[11px] font-semibold transition-all ${
                        isChecked
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {amenity} {isChecked ? '✓' : '✗'}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-1 text-[11px] text-gray-500">
                <span>
                  Status:{' '}
                  <strong className="text-gray-800">
                    {selectedVicinity.length === 3
                      ? 'All Present (Y)'
                      : selectedVicinity.length > 0
                      ? selectedVicinity.join(', ')
                      : 'None Present (N)'}
                  </strong>
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      !isReadOnly &&
                      handleChange('janaVicinityAmenities', ['Electricity', 'Water', 'Drainage'])
                    }
                    disabled={isReadOnly}
                    className="text-orange-700 hover:underline text-[10px] font-semibold"
                  >
                    All (Y)
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => !isReadOnly && handleChange('janaVicinityAmenities', [])}
                    disabled={isReadOnly}
                    className="text-gray-500 hover:underline text-[10px]"
                  >
                    None (N)
                  </button>
                </div>
              </div>
            </div>
          </Field>

          {/* 4.9 Type of Locality */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.9 Type of Locality
              </span>
            }
          >
            <CustomSelect
              value={fields.janaTypeOfLocality || 'Residential'}
              customValue={fields.janaTypeOfLocalityCustom || ''}
              onChange={(val) => handleChange('janaTypeOfLocality', val)}
              onCustomChange={(val) => handleChange('janaTypeOfLocalityCustom', val)}
              options={typeOfLocalityOptions}
              disabled={isReadOnly}
              placeholder="Select locality type..."
            />
          </Field>

          {/* 4.10' Class of Locality */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.10 Class of Locality
              </span>
            }
          >
            <CustomSelect
              value={fields.janaClassOfLocality || 'Middle'}
              customValue={fields.janaClassOfLocalityCustom || ''}
              onChange={(val) => handleChange('janaClassOfLocality', val)}
              onCustomChange={(val) => handleChange('janaClassOfLocalityCustom', val)}
              options={classOfLocalityOptions}
              disabled={isReadOnly}
              placeholder="Select locality class..."
            />
          </Field>

          {/* 4.11 Is community dominated area */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.11 Community Dominated Area
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-gray-500 block">Dominated (Y/N)</span>
                <RadioGroup
                  name="janaCommunityDominated"
                  value={fields.janaCommunityDominated || 'No'}
                  onChange={(val) => handleChange('janaCommunityDominated', val)}
                  options={['Yes', 'No']}
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">%</span>
                  <NaCheckbox
                    checked={Boolean(fields.janaCommunityDominatedPercentNA)}
                    onChange={(checked) => {
                      handleChange('janaCommunityDominatedPercentNA', checked);
                      if (checked) {
                        handleChange('janaCommunityDominatedPercent', 'NA');
                      } else {
                        handleChange('janaCommunityDominatedPercent', '');
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
                <input
                  type="text"
                  className={`${inputCls} ${
                    fields.janaCommunityDominatedPercentNA
                      ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                      : ''
                  }`}
                  value={
                    fields.janaCommunityDominatedPercentNA
                      ? 'NA'
                      : (fields.janaCommunityDominatedPercent ?? '')
                  }
                  onChange={(e) => handleChange('janaCommunityDominatedPercent', e.target.value)}
                  disabled={isReadOnly || fields.janaCommunityDominatedPercentNA}
                  placeholder={fields.janaCommunityDominatedPercentNA ? 'NA' : 'e.g. 50%'}
                />
              </div>
            </div>
          </Field>

          {/* 4.12 Width of public road */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  4.12 Width of Public Road (ft)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaRoadWidthNA)}
                  onChange={(checked) => {
                    handleChange('janaRoadWidthNA', checked);
                    if (checked) {
                      handleChange('janaRoadWidth', 'NA');
                    } else {
                      handleChange('janaRoadWidth', '');
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
                fields.janaRoadWidthNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={fields.janaRoadWidthNA ? 'NA' : (fields.janaRoadWidth ?? '')}
              onChange={(e) => handleChange('janaRoadWidth', e.target.value)}
              disabled={isReadOnly || fields.janaRoadWidthNA}
              placeholder={fields.janaRoadWidthNA ? 'NA' : 'e.g. 30 ft'}
            />
          </Field>

          {/* 4.13 Is property easily located and identified */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.13 Easily Located & Identified (Y/N)
              </span>
            }
          >
            <div className="space-y-2">
              <RadioGroup
                name="janaEasilyLocated"
                value={fields.janaEasilyLocated || 'Yes'}
                onChange={(val) => handleChange('janaEasilyLocated', val)}
                options={['Yes', 'No']}
                disabled={isReadOnly}
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">
                    If No, mention reasons
                  </span>
                  <NaCheckbox
                    checked={Boolean(fields.janaNotLocatedReasonsNA)}
                    onChange={(checked) => {
                      handleChange('janaNotLocatedReasonsNA', checked);
                      if (checked) {
                        handleChange('janaNotLocatedReasons', 'NA');
                      } else {
                        handleChange('janaNotLocatedReasons', '');
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
                <AutoResizeTextarea
                  value={
                    fields.janaNotLocatedReasonsNA
                      ? 'NA'
                      : (fields.janaNotLocatedReasons ?? '')
                  }
                  onChange={(e) => handleChange('janaNotLocatedReasons', e.target.value)}
                  disabled={isReadOnly || fields.janaNotLocatedReasonsNA}
                  placeholder={
                    fields.janaNotLocatedReasonsNA
                      ? 'NA'
                      : 'Provide details if hard to locate...'
                  }
                  rows={2}
                />
              </div>
            </div>
          </Field>

          {/* 4.14 Property Location */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.14 Property Location
              </span>
            }
          >
            <CustomSelect
              value={fields.janaPropertyLocation || 'Municipal Corporation (MC)'}
              customValue={fields.janaPropertyLocationCustom || ''}
              onChange={(val) => handleChange('janaPropertyLocation', val)}
              onCustomChange={(val) => handleChange('janaPropertyLocationCustom', val)}
              options={propertyLocationOptions}
              disabled={isReadOnly}
              placeholder="Select property location authority..."
            />
          </Field>

          {/* 4.15 Distance from City Center */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  4.15 Distance from City Center (Km)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaDistanceFromCityCenterNA)}
                  onChange={(checked) => {
                    handleChange('janaDistanceFromCityCenterNA', checked);
                    if (checked) {
                      handleChange('janaDistanceFromCityCenter', 'NA');
                    } else {
                      handleChange('janaDistanceFromCityCenter', '');
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
                fields.janaDistanceFromCityCenterNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaDistanceFromCityCenterNA
                  ? 'NA'
                  : (fields.janaDistanceFromCityCenter ?? '')
              }
              onChange={(e) => handleChange('janaDistanceFromCityCenter', e.target.value)}
              disabled={isReadOnly || fields.janaDistanceFromCityCenterNA}
              placeholder={fields.janaDistanceFromCityCenterNA ? 'NA' : 'e.g. 5 Km'}
            />
          </Field>

          {/* 4.16 Type of Property */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.16 Type of Property
              </span>
            }
          >
            <CustomSelect
              value={fields.janaTypeOfProperty || 'Residential Building'}
              customValue={fields.janaTypeOfPropertyCustom || ''}
              onChange={(val) => handleChange('janaTypeOfProperty', val)}
              onCustomChange={(val) => handleChange('janaTypeOfPropertyCustom', val)}
              options={typeOfPropertyOptions}
              disabled={isReadOnly}
              placeholder="Select type of property..."
            />
          </Field>
        </div>
      </div>

      {/* ─── 3. Table: Unit Details (Light Purple '#f3e8ff') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-purple-200 shadow-sm"
        style={{ backgroundColor: '#f3e8ff' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 pb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              4.17 Unit Details
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <EditSwitch
              checked={Boolean(fields.janaUnitDetailsTotalEdit)}
              onChange={(checked) => handleChange('janaUnitDetailsTotalEdit', checked)}
              disabled={isReadOnly}
            />
            <span className="text-xs text-purple-800 font-medium bg-purple-100 px-2.5 py-1 rounded-md border border-purple-300">
              Section 4: Table 2
            </span>
          </div>
        </div>

        {/* Responsive Unit Details Table */}
        <div className="overflow-x-auto rounded-xl border border-purple-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-160">
            <thead>
              <tr className="bg-purple-100/80 border-b border-purple-300 text-purple-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/5 min-w-36">Detail</th>
                <th className="py-3 px-4 w-1/5 min-w-28 text-center">No. of Rooms</th>
                <th className="py-3 px-4 w-1/5 min-w-28 text-center">No. of Kitchen</th>
                <th className="py-3 px-4 w-1/5 min-w-28 text-center">No. of Bathrooms</th>
                <th className="py-3 px-4 w-1/5 min-w-32 text-center">Others (Hall/Puja Room)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {/* Ground Floor */}
              <tr className="hover:bg-purple-50/50 transition-colors">
                <td className="p-3.5 font-bold text-gray-800 text-xs md:text-sm">
                  Ground Floor
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_GF_rooms ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_GF_rooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_GF_kitchen ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_GF_kitchen', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_GF_bath ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_GF_bath', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_GF_others ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_GF_others', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
              </tr>

              {/* First Floor */}
              <tr className="hover:bg-purple-50/50 transition-colors">
                <td className="p-3.5 font-bold text-gray-800 text-xs md:text-sm">
                  First Floor
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_FF_rooms ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_FF_rooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_FF_kitchen ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_FF_kitchen', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_FF_bath ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_FF_bath', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_FF_others ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_FF_others', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
              </tr>

              {/* Second Floor */}
              <tr className="hover:bg-purple-50/50 transition-colors">
                <td className="p-3.5 font-bold text-gray-800 text-xs md:text-sm">
                  Second Floor
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_SF_rooms ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_SF_rooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_SF_kitchen ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_SF_kitchen', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_SF_bath ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_SF_bath', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_SF_others ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_SF_others', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
              </tr>

              {/* Third Floor */}
              <tr className="hover:bg-purple-50/50 transition-colors">
                <td className="p-3.5 font-bold text-gray-800 text-xs md:text-sm">
                  Third Floor
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_TF_rooms ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_TF_rooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_TF_kitchen ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_TF_kitchen', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_TF_bath ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_TF_bath', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td className="p-2.5">
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} text-center`}
                    value={fields.janaUnitDetails_TF_others ?? ''}
                    onChange={(e) => handleChange('janaUnitDetails_TF_others', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
              </tr>

              {/* Total Row with Auto-calculation and Edit Toggle */}
              <tr className="bg-purple-100/90 font-bold border-t-2 border-purple-300">
                <td className="p-3.5 font-extrabold text-purple-950 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span>Total</span>
                    <span className="text-[10px] font-normal text-purple-700 bg-purple-200/60 px-1.5 py-0.5 rounded">
                      {fields.janaUnitDetailsTotalEdit ? 'Manual' : 'Auto'}
                    </span>
                  </div>
                </td>
                <td className="p-2.5">
                  {fields.janaUnitDetailsTotalEdit ? (
                    <input
                      type="number"
                      min="0"
                      className={`${inputCls} text-center font-bold bg-white text-purple-950 border-purple-400`}
                      value={fields.janaUnitDetails_Total_rooms ?? autoTotalRooms}
                      onChange={(e) => handleChange('janaUnitDetails_Total_rooms', e.target.value)}
                      disabled={isReadOnly}
                    />
                  ) : (
                    <LockedFieldWrapper
                      isLocked={true}
                      tooltipMessage=">>Auto calculating from [Ground Floor + First Floor + Second Floor + Third Floor]<<"
                    >
                      <input
                        type="number"
                        readOnly
                        disabled
                        className={`${inputCls} text-center font-bold bg-purple-50/80 border-purple-300 text-purple-950 cursor-not-allowed`}
                        value={autoTotalRooms}
                      />
                    </LockedFieldWrapper>
                  )}
                </td>
                <td className="p-2.5">
                  {fields.janaUnitDetailsTotalEdit ? (
                    <input
                      type="number"
                      min="0"
                      className={`${inputCls} text-center font-bold bg-white text-purple-950 border-purple-400`}
                      value={fields.janaUnitDetails_Total_kitchen ?? autoTotalKitchen}
                      onChange={(e) => handleChange('janaUnitDetails_Total_kitchen', e.target.value)}
                      disabled={isReadOnly}
                    />
                  ) : (
                    <LockedFieldWrapper
                      isLocked={true}
                      tooltipMessage=">>Auto calculating from [Ground Floor + First Floor + Second Floor + Third Floor]<<"
                    >
                      <input
                        type="number"
                        readOnly
                        disabled
                        className={`${inputCls} text-center font-bold bg-purple-50/80 border-purple-300 text-purple-950 cursor-not-allowed`}
                        value={autoTotalKitchen}
                      />
                    </LockedFieldWrapper>
                  )}
                </td>
                <td className="p-2.5">
                  {fields.janaUnitDetailsTotalEdit ? (
                    <input
                      type="number"
                      min="0"
                      className={`${inputCls} text-center font-bold bg-white text-purple-950 border-purple-400`}
                      value={fields.janaUnitDetails_Total_bath ?? autoTotalBath}
                      onChange={(e) => handleChange('janaUnitDetails_Total_bath', e.target.value)}
                      disabled={isReadOnly}
                    />
                  ) : (
                    <LockedFieldWrapper
                      isLocked={true}
                      tooltipMessage=">>Auto calculating from [Ground Floor + First Floor + Second Floor + Third Floor]<<"
                    >
                      <input
                        type="number"
                        readOnly
                        disabled
                        className={`${inputCls} text-center font-bold bg-purple-50/80 border-purple-300 text-purple-950 cursor-not-allowed`}
                        value={autoTotalBath}
                      />
                    </LockedFieldWrapper>
                  )}
                </td>
                <td className="p-2.5">
                  {fields.janaUnitDetailsTotalEdit ? (
                    <input
                      type="number"
                      min="0"
                      className={`${inputCls} text-center font-bold bg-white text-purple-950 border-purple-400`}
                      value={fields.janaUnitDetails_Total_others ?? autoTotalOthers}
                      onChange={(e) => handleChange('janaUnitDetails_Total_others', e.target.value)}
                      disabled={isReadOnly}
                    />
                  ) : (
                    <LockedFieldWrapper
                      isLocked={true}
                      tooltipMessage=">>Auto calculating from [Ground Floor + First Floor + Second Floor + Third Floor]<<"
                    >
                      <input
                        type="number"
                        readOnly
                        disabled
                        className={`${inputCls} text-center font-bold bg-purple-50/80 border-purple-300 text-purple-950 cursor-not-allowed`}
                        value={autoTotalOthers}
                      />
                    </LockedFieldWrapper>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. Container: Structure Attributes (Light Cyan '#e0f7fa') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Structure Attributes
            </h3>
          </div>
          <span className="text-xs text-cyan-800 font-medium bg-cyan-100 px-2.5 py-1 rounded-md border border-cyan-300">
            Section 4: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* 4.18 Structure */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.18 Structure
              </span>
            }
          >
            <CustomSelect
              value={fields.janaStructure || 'RCC'}
              customValue={fields.janaStructureCustom || ''}
              onChange={(val) => handleChange('janaStructure', val)}
              onCustomChange={(val) => handleChange('janaStructureCustom', val)}
              options={structureOptions}
              disabled={isReadOnly}
              placeholder="Select structure type..."
            />
          </Field>

          {/* 4.19 Interior Quality */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.19 Interior Quality
              </span>
            }
          >
            <select
              className={inputCls}
              value={fields.janaInteriorQuality || 'Average'}
              onChange={(e) => handleChange('janaInteriorQuality', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Premium">Premium</option>
              <option value="Average">Average</option>
              <option value="Satisfactory">Satisfactory</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>

          {/* 4.20' Exterior Quality */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.20 Exterior Quality
              </span>
            }
          >
            <select
              className={inputCls}
              value={fields.janaExteriorQuality || 'Average'}
              onChange={(e) => handleChange('janaExteriorQuality', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Premium">Premium</option>
              <option value="Average">Average</option>
              <option value="Satisfactory">Satisfactory</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>

          {/* 4.21 Maintenance level */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                4.21 Maintenance Level
              </span>
            }
          >
            <select
              className={inputCls}
              value={fields.janaMaintenanceLevel || 'Good'}
              onChange={(e) => handleChange('janaMaintenanceLevel', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>

          {/* 4.22 Age of Property (Years) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  4.22 Age of Property (Years)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaAgeOfPropertyNA)}
                  onChange={(checked) => {
                    handleChange('janaAgeOfPropertyNA', checked);
                    if (checked) {
                      handleChange('janaAgeOfProperty', 'NA');
                    } else {
                      handleChange('janaAgeOfProperty', '');
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
                fields.janaAgeOfPropertyNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaAgeOfPropertyNA
                  ? 'NA'
                  : (fields.janaAgeOfProperty ?? '')
              }
              onChange={(e) => handleChange('janaAgeOfProperty', e.target.value)}
              disabled={isReadOnly || fields.janaAgeOfPropertyNA}
              placeholder={fields.janaAgeOfPropertyNA ? 'NA' : 'e.g. 5'}
            />
          </Field>

          {/* 4.23 Residual Age of property (Years) with Auto-calculate and Edit Toggle */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  4.23 Residual Age of Property (Years)
                </span>
                <div className="flex items-center gap-2">
                  <EditSwitch
                    checked={Boolean(fields.janaResidualAgeEdit)}
                    onChange={(checked) => handleChange('janaResidualAgeEdit', checked)}
                    disabled={isReadOnly || fields.janaResidualAgeNA}
                  />
                  <NaCheckbox
                    checked={Boolean(fields.janaResidualAgeNA)}
                    onChange={(checked) => {
                      handleChange('janaResidualAgeNA', checked);
                      if (checked) {
                        handleChange('janaResidualAgeManual', 'NA');
                      } else {
                        handleChange('janaResidualAgeManual', '');
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            }
          >
            {fields.janaResidualAgeNA ? (
              <input
                type="text"
                disabled
                className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-500 italic`}
                value="NA"
              />
            ) : fields.janaResidualAgeEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white border-cyan-400 font-bold text-gray-900`}
                value={fields.janaResidualAgeManual ?? autoResidualAge}
                onChange={(e) => handleChange('janaResidualAgeManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter residual age in years..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage=">>Auto calculating from [Standard Life - 4.22 Age of Property]<<"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-cyan-50/80 border-cyan-300 font-bold text-cyan-950 cursor-not-allowed`}
                  value={autoResidualAge}
                />
              </LockedFieldWrapper>
            )}
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: OCCUPANCY DETAILS ─────────────────────────────────────────────

function OccupancyDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const occupancyStatusOptions = [
    { value: 'Self Occupied', label: 'Self Occupied' },
    { value: 'Tenanted / Rented', label: 'Tenanted / Rented' },
    { value: 'Vacant', label: 'Vacant' },
    { value: 'Partially Self Occupied & Partially Tenanted', label: 'Partially Self Occupied & Partially Tenanted' },
    { value: 'Under Construction / Unoccupied', label: 'Under Construction / Unoccupied' },
  ];

  const occupantRelationshipOptions = [
    { value: 'Self', label: 'Self' },
    { value: 'Family / Relative', label: 'Family / Relative' },
    { value: 'Tenant', label: 'Tenant' },
    { value: 'Employee / Caretaker', label: 'Employee / Caretaker' },
    { value: 'Vacant / Not Applicable', label: 'Vacant / Not Applicable' },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Container: OCCUPANCY DETAILS (Light Pink '#fce4ec') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-pink-200 shadow-sm"
        style={{ backgroundColor: '#fce4ec' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-pink-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              OCCUPANCY DETAILS
            </h3>
          </div>
          <span className="text-xs text-pink-800 font-medium bg-pink-100 px-2.5 py-1 rounded-md border border-pink-300">
            Section 5: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* 5.1 Status of Occupancy */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                5.1 Status of Occupancy
              </span>
            }
          >
            <CustomSelect
              value={fields.janaOccupancyStatus || 'Self Occupied'}
              customValue={fields.janaOccupancyStatusCustom || ''}
              onChange={(val) => handleChange('janaOccupancyStatus', val)}
              onCustomChange={(val) => handleChange('janaOccupancyStatusCustom', val)}
              options={occupancyStatusOptions}
              disabled={isReadOnly}
              placeholder="Select occupancy status..."
            />
          </Field>

          {/* 5.2 Relationship of Occupant with customer */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                5.2 Relationship with Customer
              </span>
            }
          >
            <CustomSelect
              value={fields.janaOccupantRelationship || 'Self'}
              customValue={fields.janaOccupantRelationshipCustom || ''}
              onChange={(val) => handleChange('janaOccupantRelationship', val)}
              onCustomChange={(val) => handleChange('janaOccupantRelationshipCustom', val)}
              options={occupantRelationshipOptions}
              disabled={isReadOnly}
              placeholder="Select relationship..."
            />
          </Field>

          {/* 5.3 Occupied by */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  5.3 Occupied By
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaOccupiedByNA)}
                  onChange={(checked) => {
                    handleChange('janaOccupiedByNA', checked);
                    if (checked) {
                      handleChange('janaOccupiedBy', 'NA');
                    } else {
                      handleChange('janaOccupiedBy', '');
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
                fields.janaOccupiedByNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaOccupiedByNA
                  ? 'NA'
                  : (fields.janaOccupiedBy ?? fields.occupiedBy ?? '')
              }
              onChange={(e) => handleChange('janaOccupiedBy', e.target.value)}
              disabled={isReadOnly || fields.janaOccupiedByNA}
              placeholder={fields.janaOccupiedByNA ? 'NA' : 'e.g. Self / Name of Tenant'}
            />
          </Field>

          {/* 5.4 Occupied Since */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  5.4 Occupied Since
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaOccupiedSinceNA)}
                  onChange={(checked) => {
                    handleChange('janaOccupiedSinceNA', checked);
                    if (checked) {
                      handleChange('janaOccupiedSince', 'NA');
                    } else {
                      handleChange('janaOccupiedSince', '');
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
                fields.janaOccupiedSinceNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaOccupiedSinceNA
                  ? 'NA'
                  : (fields.janaOccupiedSince ?? '')
              }
              onChange={(e) => handleChange('janaOccupiedSince', e.target.value)}
              disabled={isReadOnly || fields.janaOccupiedSinceNA}
              placeholder={fields.janaOccupiedSinceNA ? 'NA' : 'e.g. 2018 or 10 Years'}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Violations Observed if any ────────────────────────────────────

function ViolationsObservedSection({
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
      {/* ─── Container: Violations Observed if any (Light Grey '#f1f5f9') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-slate-300 shadow-sm"
        style={{ backgroundColor: '#f1f5f9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Violations Observed if any
            </h3>
          </div>
          <span className="text-xs text-slate-800 font-medium bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300">
            Section 6: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* 6.1 Is there encroachment of land (Y/N) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                6.1 Is there Encroachment of Land (Y/N)
              </span>
            }
          >
            <RadioGroup
              name="janaLandEncroachment"
              value={fields.janaLandEncroachment || 'No'}
              onChange={(val) => {
                handleChange('janaLandEncroachment', val);
                if (val === 'No') {
                  handleChange('janaEncroachmentAreaNA', true);
                  handleChange('janaEncroachmentArea', 'NA');
                } else {
                  handleChange('janaEncroachmentAreaNA', false);
                  handleChange('janaEncroachmentArea', '');
                }
              }}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.2 Area of encroachment */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  6.2 Area of Encroachment
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaEncroachmentAreaNA)}
                  onChange={(checked) => {
                    handleChange('janaEncroachmentAreaNA', checked);
                    if (checked) {
                      handleChange('janaEncroachmentArea', 'NA');
                    } else {
                      handleChange('janaEncroachmentArea', '');
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
                fields.janaEncroachmentAreaNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaEncroachmentAreaNA
                  ? 'NA'
                  : (fields.janaEncroachmentArea ?? '')
              }
              onChange={(e) => handleChange('janaEncroachmentArea', e.target.value)}
              disabled={isReadOnly || fields.janaEncroachmentAreaNA}
              placeholder={fields.janaEncroachmentAreaNA ? 'NA' : 'e.g. 50 Sq. Ft.'}
            />
          </Field>

          {/* 6.3 Any Deviation in Structure */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  6.3 Any Deviation in Structure
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaStructureDeviationNA)}
                  onChange={(checked) => {
                    handleChange('janaStructureDeviationNA', checked);
                    if (checked) {
                      handleChange('janaStructureDeviation', 'NA');
                    } else {
                      handleChange('janaStructureDeviation', 'No');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaStructureDeviationNA ? (
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500 italic text-xs border border-gray-200">
                Not Applicable (NA)
              </div>
            ) : (
              <RadioGroup
                name="janaStructureDeviation"
                value={fields.janaStructureDeviation || 'No'}
                onChange={(val) => handleChange('janaStructureDeviation', val)}
                options={['Yes', 'No']}
                disabled={isReadOnly}
              />
            )}
          </Field>

          {/* 6.4 Risk of Demolition/ Sealing */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                6.4 Risk of Demolition/ Sealing
              </span>
            }
          >
            <RadioGroup
              name="janaDemolitionRisk"
              value={fields.janaDemolitionRisk || 'No'}
              onChange={(val) => handleChange('janaDemolitionRisk', val)}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.5 Is there HT line near to the property? */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                6.5 HT Line Near to Property?
              </span>
            }
          >
            <RadioGroup
              name="janaHtLineNear"
              value={fields.janaHtLineNear || 'No'}
              onChange={(val) => {
                handleChange('janaHtLineNear', val);
                if (val === 'No') {
                  handleChange('janaHtLineDistanceVoltageNA', true);
                  handleChange('janaHtLineDistanceVoltage', 'NA');
                } else {
                  handleChange('janaHtLineDistanceVoltageNA', false);
                  handleChange('janaHtLineDistanceVoltage', '');
                }
              }}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.6 Distance of HT line from the property and Voltage in kiloVolt */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  6.6 Distance of HT Line & Voltage (kV)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaHtLineDistanceVoltageNA)}
                  onChange={(checked) => {
                    handleChange('janaHtLineDistanceVoltageNA', checked);
                    if (checked) {
                      handleChange('janaHtLineDistanceVoltage', 'NA');
                    } else {
                      handleChange('janaHtLineDistanceVoltage', '');
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
                fields.janaHtLineDistanceVoltageNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaHtLineDistanceVoltageNA
                  ? 'NA'
                  : (fields.janaHtLineDistanceVoltage ?? '')
              }
              onChange={(e) => handleChange('janaHtLineDistanceVoltage', e.target.value)}
              disabled={isReadOnly || fields.janaHtLineDistanceVoltageNA}
              placeholder={
                fields.janaHtLineDistanceVoltageNA ? 'NA' : 'e.g. 50 meters, 11 kV'
              }
            />
          </Field>

          {/* 6.7 Is property in buffer zone/ no construction zone */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                6.7 Buffer Zone / No Construction Zone?
              </span>
            }
          >
            <RadioGroup
              name="janaBufferZone"
              value={fields.janaBufferZone || 'No'}
              onChange={(val) => {
                handleChange('janaBufferZone', val);
                if (val === 'No') {
                  handleChange('janaBufferZoneDetailsNA', true);
                  handleChange('janaBufferZoneDetails', 'NA');
                } else {
                  handleChange('janaBufferZoneDetailsNA', false);
                  handleChange('janaBufferZoneDetails', '');
                }
              }}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.8 Details of buffer zone/ no construction zone */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  6.8 Details of Buffer Zone
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaBufferZoneDetailsNA)}
                  onChange={(checked) => {
                    handleChange('janaBufferZoneDetailsNA', checked);
                    if (checked) {
                      handleChange('janaBufferZoneDetails', 'NA');
                    } else {
                      handleChange('janaBufferZoneDetails', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={
                fields.janaBufferZoneDetailsNA
                  ? 'NA'
                  : (fields.janaBufferZoneDetails ?? '')
              }
              onChange={(e) => handleChange('janaBufferZoneDetails', e.target.value)}
              disabled={isReadOnly || fields.janaBufferZoneDetailsNA}
              placeholder={
                fields.janaBufferZoneDetailsNA
                  ? 'NA'
                  : 'Mention restrictions or buffer zone specifications...'
              }
              rows={2}
            />
          </Field>

          {/* 6.9 Is there any litigation notice on the property from any FI */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                6.9 Litigation Notice from any FI?
              </span>
            }
          >
            <RadioGroup
              name="janaLitigationNotice"
              value={fields.janaLitigationNotice || 'No'}
              onChange={(val) => {
                handleChange('janaLitigationNotice', val);
                if (val === 'No') {
                  handleChange('janaNoticeByFiDetailsNA', true);
                  handleChange('janaNoticeByFiDetails', 'NA');
                } else {
                  handleChange('janaNoticeByFiDetailsNA', false);
                  handleChange('janaNoticeByFiDetails', '');
                }
              }}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.10' Details of any notice by FI */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  6.10 Details of Any Notice by FI
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaNoticeByFiDetailsNA)}
                  onChange={(checked) => {
                    handleChange('janaNoticeByFiDetailsNA', checked);
                    if (checked) {
                      handleChange('janaNoticeByFiDetails', 'NA');
                    } else {
                      handleChange('janaNoticeByFiDetails', '');
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={
                fields.janaNoticeByFiDetailsNA
                  ? 'NA'
                  : (fields.janaNoticeByFiDetails ?? '')
              }
              onChange={(e) => handleChange('janaNoticeByFiDetails', e.target.value)}
              disabled={isReadOnly || fields.janaNoticeByFiDetailsNA}
              placeholder={
                fields.janaNoticeByFiDetailsNA
                  ? 'NA'
                  : 'Enter details of any notice / proceedings from FI...'
              }
              rows={2}
            />
          </Field>

          {/* 6.11 Is property near to graveyard/ crematorium or burning ghats */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                6.11 Near Graveyard / Crematorium?
              </span>
            }
          >
            <RadioGroup
              name="janaGraveyardNear"
              value={fields.janaGraveyardNear || 'No'}
              onChange={(val) => handleChange('janaGraveyardNear', val)}
              options={['Yes', 'No']}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.12 Habitation (%) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  6.12 Habitation (%)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaHabitationPercentNA)}
                  onChange={(checked) => {
                    handleChange('janaHabitationPercentNA', checked);
                    if (checked) {
                      handleChange('janaHabitationPercent', 'NA');
                    } else {
                      handleChange('janaHabitationPercent', '');
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
                fields.janaHabitationPercentNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaHabitationPercentNA
                  ? 'NA'
                  : (fields.janaHabitationPercent ?? '')
              }
              onChange={(e) => handleChange('janaHabitationPercent', e.target.value)}
              disabled={isReadOnly || fields.janaHabitationPercentNA}
              placeholder={fields.janaHabitationPercentNA ? 'NA' : 'e.g. 80%'}
            />
          </Field>

          {/* 6.14 Any other remarks */}
          <div className="md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-gray-700 text-xs md:text-sm">
                    6.14 Any Other Remarks
                  </span>
                  <NaCheckbox
                    checked={Boolean(fields.janaViolationsOtherRemarksNA)}
                    onChange={(checked) => {
                      handleChange('janaViolationsOtherRemarksNA', checked);
                      if (checked) {
                        handleChange('janaViolationsOtherRemarks', 'NA');
                      } else {
                        handleChange('janaViolationsOtherRemarks', '');
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={
                  fields.janaViolationsOtherRemarksNA
                    ? 'NA'
                    : (fields.janaViolationsOtherRemarks ?? '')
                }
                onChange={(e) => handleChange('janaViolationsOtherRemarks', e.target.value)}
                disabled={isReadOnly || fields.janaViolationsOtherRemarksNA}
                placeholder={
                  fields.janaViolationsOtherRemarksNA
                    ? 'NA'
                    : 'Mention any other violations, risks, or site observations...'
                }
                rows={2}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 7: VALUATION ───────────────────────────────────────────────────

function ValuationSection({
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

  // ─── 1. Land Value Calculations ───
  const effectiveLandUnit = fields.janaLandUnitEdit
    ? fields.janaLandUnitManual || fields.janaPlotAreaUnit || 'Sq. Ft.'
    : fields.janaPlotAreaUnit || 'Sq. Ft.';

  const prefillLandArea =
    fields.janaPlotArea !== undefined && fields.janaPlotArea !== ''
      ? fields.janaPlotArea
      : fields.plotArea !== undefined && fields.plotArea !== ''
      ? fields.plotArea
      : fields.landArea ?? '';

  const effectiveLandArea = fields.janaLandAreaEdit
    ? parseNum(fields.janaLandAreaManual)
    : parseNum(prefillLandArea);

  const effectiveLandRate = parseNum(fields.janaLandRate);
  const autoLandValue = Math.round(effectiveLandArea * effectiveLandRate);
  const effectiveLandValue = fields.janaLandValueEdit
    ? parseNum(fields.janaLandValueManual)
    : autoLandValue;

  // ─── 2. Existing Construction Rows ───
  const existingRows = [
    { id: 'as_measured_gf', label: 'As per measured GF' },
    { id: 'gf_rcc', label: '7.5 GF RCC' },
    { id: 'ff_acc', label: '7.6 FF ACC' },
    { id: 'sf_uc', label: '7.7 SF UC' },
    { id: 'sf', label: '7.8 SF' },
    { id: 'tf', label: 'TF' },
  ];

  const existingRowAmounts: number[] = existingRows.map((r) => {
    const area = parseNum(fields['janaConstArea_' + r.id]);
    const rate = parseNum(fields['janaConstRate_' + r.id]);
    const autoAmt = Math.round(area * rate);
    const isEdit = Boolean(fields['janaConstAmountEdit_' + r.id]);
    return isEdit ? parseNum(fields['janaConstAmount_' + r.id]) : autoAmt;
  });

  const autoTotalExisting = existingRowAmounts.reduce((acc, curr) => acc + curr, 0);
  const effectiveExistingTotal = fields.janaExistingTotalEdit
    ? parseNum(fields.janaExistingTotalManual)
    : autoTotalExisting;

  // 7.10' Total Existing Value of Property (A+B)
  const autoTotalExistingPropertyValue = effectiveLandValue + effectiveExistingTotal;
  const effectiveTotalExistingPropertyValue = fields.janaTotalExistingPropertyValueEdit
    ? parseNum(fields.janaTotalExistingPropertyValueManual)
    : autoTotalExistingPropertyValue;

  // ─── 3. Proposed Construction Rows ───
  const proposedRows = [
    { id: 'gf', label: '7.12 GF' },
    { id: 'ff', label: '7.13 FF' },
    { id: 'sf', label: '7.14 SF' },
  ];

  const proposedRowAmounts: number[] = proposedRows.map((p) => {
    const area = parseNum(fields['janaProposedArea_' + p.id]);
    const rate = parseNum(fields['janaProposedRate_' + p.id]);
    const autoAmt = Math.round(area * rate);
    const isEdit = Boolean(fields['janaProposedAmountEdit_' + p.id]);
    return isEdit ? parseNum(fields['janaProposedAmount_' + p.id]) : autoAmt;
  });

  const autoProposedTotal = proposedRowAmounts.reduce((acc, curr) => acc + curr, 0);
  const effectiveProposedTotal = fields.janaProposedTotalEdit
    ? parseNum(fields.janaProposedTotalManual)
    : autoProposedTotal;

  // ─── 4. Description of Proposed Construction / Improvement Rows ───
  const improvementRowCount = fields.janaImprovementRowsCount || 3;
  const improvementIndices = Array.from({ length: improvementRowCount }, (_, i) => i);

  const effectiveExtraAmenities = fields.janaValueExtraAmenitiesNA
    ? 0
    : parseNum(fields.janaValueExtraAmenities);

  // ─── 5. Final Valuation Calculations ───
  // 7.21 Total Future Value (A+B+C)
  const autoFuturePropertyValue =
    effectiveTotalExistingPropertyValue + effectiveProposedTotal + effectiveExtraAmenities;
  const effectiveFuturePropertyValue = fields.janaFuturePropertyValueEdit
    ? parseNum(fields.janaFuturePropertyValueManual)
    : autoFuturePropertyValue;

  // 7.25 Land value as per Govt Rate
  const govtRate = parseNum(fields.janaGovtGuidelineRate);
  const autoGovtLandValue = Math.round(effectiveLandArea * govtRate);
  const effectiveGovtLandValue = fields.janaGovtLandValueEdit
    ? parseNum(fields.janaGovtLandValueManual)
    : autoGovtLandValue;

  // 7.22 Distressed Value (75% of Future Value)
  const autoDistressedValue = Math.round(effectiveFuturePropertyValue * 0.75);
  const effectiveDistressedValue = fields.janaDistressedValueEdit
    ? parseNum(fields.janaDistressedValueManual)
    : autoDistressedValue;

  const existingAreaTypeOptions = [
    { value: 'Built Up Area', label: 'Built Up Area' },
    { value: 'Super Built Up Area', label: 'Super Built Up Area' },
    { value: 'Carpet Area', label: 'Carpet Area' },
  ];

  return (
    <div className="space-y-6">
      {/* ─── 1. Container: Land Value (Light Indigo '#e8eaf6') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-indigo-200 shadow-sm"
        style={{ backgroundColor: '#e8eaf6' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Land Value
            </h3>
          </div>
          <span className="text-xs text-indigo-800 font-medium bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-300">
            Section 7: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* 7.1 Land Value | Land Measurement Unit */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.1 Land Measurement Unit
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaLandUnitEdit)}
                  onChange={(checked) => handleChange('janaLandUnitEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaLandUnitEdit ? (
              <select
                className={`${inputCls} bg-white font-medium border-indigo-300`}
                value={fields.janaLandUnitManual ?? (fields.janaPlotAreaUnit || 'Sq. Ft.')}
                onChange={(e) => handleChange('janaLandUnitManual', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Sq. Ft.">Sq. Ft.</option>
                <option value="Sq. Mtr.">Sq. Mtr.</option>
                <option value="Sq. Yds.">Sq. Yds.</option>
                <option value="Decimal">Decimal</option>
                <option value="Acre">Acre</option>
                <option value="Gunta">Gunta</option>
                <option value="Cent">Cent</option>
              </select>
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='>>Prefill from section 4, "Plot Details (Plot Area) Unit"<<'
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-indigo-50/70 border-indigo-200 font-semibold text-indigo-950 cursor-not-allowed`}
                  value={fields.janaPlotAreaUnit || 'Sq. Ft.'}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* 7.2 Land Rate */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                7.2 Land Rate (per {effectiveLandUnit})
              </span>
            }
          >
            <input
              type="number"
              step="any"
              className={inputCls}
              value={fields.janaLandRate ?? ''}
              onChange={(e) => handleChange('janaLandRate', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 2500"
            />
          </Field>

          {/* 7.3 Permissible FSI */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.3 Permissible FSI
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaPermissibleFsiNA)}
                  onChange={(checked) => {
                    handleChange('janaPermissibleFsiNA', checked);
                    if (checked) {
                      handleChange('janaPermissibleFsi', 'NA');
                    } else {
                      handleChange('janaPermissibleFsi', '');
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
                fields.janaPermissibleFsiNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaPermissibleFsiNA
                  ? 'NA'
                  : (fields.janaPermissibleFsi ?? '')
              }
              onChange={(e) => handleChange('janaPermissibleFsi', e.target.value)}
              disabled={isReadOnly || fields.janaPermissibleFsiNA}
              placeholder={fields.janaPermissibleFsiNA ? 'NA' : 'e.g. 1.5 or 2.0'}
            />
          </Field>

          {/* 7.23 Land Area */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.23 Land Area ({effectiveLandUnit})
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaLandAreaEdit)}
                  onChange={(checked) => handleChange('janaLandAreaEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaLandAreaEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-indigo-400 font-bold`}
                value={fields.janaLandAreaManual ?? prefillLandArea}
                onChange={(e) => handleChange('janaLandAreaManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter land area..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='>>Prefill from section 4, "Plot Details (Plot Area)"<<'
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-indigo-50/70 border-indigo-200 font-semibold text-indigo-950 cursor-not-allowed`}
                  value={prefillLandArea ? `${prefillLandArea} ${effectiveLandUnit}` : '0'}
                  placeholder="Prefilled from 4.5"
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* 7.24 Land Value (A) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.24 Land Value (A) (Rs.)
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaLandValueEdit)}
                  onChange={(checked) => handleChange('janaLandValueEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaLandValueEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-indigo-400 font-bold text-gray-900`}
                value={fields.janaLandValueManual ?? autoLandValue}
                onChange={(e) => handleChange('janaLandValueManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter land value..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage=">>Auto calculating from [7.23 Land Area * 7.2 Land Rate]<<"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-indigo-50/70 border-indigo-200 font-bold text-indigo-950 cursor-not-allowed`}
                  value={
                    autoLandValue > 0
                      ? `₹ ${autoLandValue.toLocaleString('en-IN')}`
                      : '₹ 0'
                  }
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* 7.24 FSI Considered for valuation */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.24 FSI Considered for Valuation
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaFsiConsideredNA)}
                  onChange={(checked) => {
                    handleChange('janaFsiConsideredNA', checked);
                    if (checked) {
                      handleChange('janaFsiConsidered', 'NA');
                    } else {
                      handleChange('janaFsiConsidered', '');
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
                fields.janaFsiConsideredNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaFsiConsideredNA
                  ? 'NA'
                  : (fields.janaFsiConsidered ?? '')
              }
              onChange={(e) => handleChange('janaFsiConsidered', e.target.value)}
              disabled={isReadOnly || fields.janaFsiConsideredNA}
              placeholder={fields.janaFsiConsideredNA ? 'NA' : 'e.g. 1.25 or 1.5'}
            />
          </Field>
        </div>
      </div>

      {/* ─── 2. Table: Existing Construction Value (Light Teal '#e0f2f1') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-teal-200 shadow-sm"
        style={{ backgroundColor: '#e0f2f1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-200 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Existing Construction Value (B)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-teal-800 font-medium bg-teal-100 px-2.5 py-1 rounded-md border border-teal-300">
              Section 7: Table 1
            </span>
          </div>
        </div>

        {/* 7.4 Area Type Dropdown */}
        <div className="max-w-md">
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                7.4 Existing Construction Value | Type of Area
              </span>
            }
          >
            <CustomSelect
              value={fields.janaExistingAreaType || 'Built Up Area'}
              customValue={fields.janaExistingAreaTypeCustom || ''}
              onChange={(val) => handleChange('janaExistingAreaType', val)}
              onCustomChange={(val) => handleChange('janaExistingAreaTypeCustom', val)}
              options={existingAreaTypeOptions}
              disabled={isReadOnly}
              placeholder="Select area type..."
            />
          </Field>
        </div>

        {/* Responsive Existing Construction Table */}
        <div className="overflow-x-auto rounded-xl border border-teal-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-160">
            <thead>
              <tr className="bg-teal-100/80 border-b border-teal-300 text-teal-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/4 min-w-36">Floor</th>
                <th className="py-3 px-4 w-1/4 min-w-28 text-center">Area (Sqft)</th>
                <th className="py-3 px-4 w-1/4 min-w-28 text-center">Rate (per Sqft)</th>
                <th className="py-3 px-4 w-1/4 min-w-36 text-right">Amount (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-100">
              {existingRows.map((r, idx) => {
                const areaKey = 'janaConstArea_' + r.id;
                const rateKey = 'janaConstRate_' + r.id;
                const amtKey = 'janaConstAmount_' + r.id;
                const editKey = 'janaConstAmountEdit_' + r.id;
                const isEdit = Boolean(fields[editKey]);
                const area = parseNum(fields[areaKey]);
                const rate = parseNum(fields[rateKey]);
                const autoAmt = Math.round(area * rate);

                return (
                  <tr key={r.id} className="hover:bg-teal-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-gray-800 text-xs md:text-sm">
                      {r.label}
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-center`}
                        value={fields[areaKey] ?? ''}
                        onChange={(e) => handleChange(areaKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-center`}
                        value={fields[rateKey] ?? ''}
                        onChange={(e) => handleChange(rateKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEdit ? (
                          <input
                            type="number"
                            step="any"
                            className={`${inputCls} text-right font-bold bg-white text-teal-950 border-teal-400`}
                            value={fields[amtKey] ?? autoAmt}
                            onChange={(e) => handleChange(amtKey, e.target.value)}
                            disabled={isReadOnly}
                          />
                        ) : (
                          <LockedFieldWrapper
                            isLocked={true}
                            tooltipMessage=">>Auto calculating from [Area (Sqft) * Rate (per Sqft)]<<"
                          >
                            <input
                              type="text"
                              readOnly
                              disabled
                              className={`${inputCls} text-right font-bold bg-teal-50/80 border-teal-300 text-teal-950 cursor-not-allowed`}
                              value={
                                autoAmt > 0
                                  ? `₹ ${autoAmt.toLocaleString('en-IN')}`
                                  : '₹ 0'
                              }
                            />
                          </LockedFieldWrapper>
                        )}
                        <EditSwitch
                          checked={isEdit}
                          onChange={(checked) => handleChange(editKey, checked)}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* 7.9 Total (Rs) Row */}
              <tr className="bg-teal-100/90 font-bold border-t-2 border-teal-300">
                <td colSpan={3} className="p-3.5 font-extrabold text-teal-950 text-xs md:text-sm">
                  7.9 Total (Rs) (B)
                </td>
                <td className="p-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {fields.janaExistingTotalEdit ? (
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-right font-extrabold bg-white text-teal-950 border-teal-500`}
                        value={fields.janaExistingTotalManual ?? autoTotalExisting}
                        onChange={(e) => handleChange('janaExistingTotalManual', e.target.value)}
                        disabled={isReadOnly}
                      />
                    ) : (
                      <LockedFieldWrapper
                        isLocked={true}
                        tooltipMessage=">>Auto calculating from [Sum of Amount (Rs) across all floors]<<"
                      >
                        <input
                          type="text"
                          readOnly
                          disabled
                          className={`${inputCls} text-right font-extrabold bg-teal-100 border-teal-400 text-teal-950 cursor-not-allowed`}
                          value={
                            autoTotalExisting > 0
                              ? `₹ ${autoTotalExisting.toLocaleString('en-IN')}`
                              : '₹ 0'
                          }
                        />
                      </LockedFieldWrapper>
                    )}
                    <EditSwitch
                      checked={Boolean(fields.janaExistingTotalEdit)}
                      onChange={(checked) => handleChange('janaExistingTotalEdit', checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              </tr>

              {/* 7.10' Total Existing Value of Property (A+B) */}
              <tr className="bg-teal-200/60 font-bold border-t border-teal-300">
                <td colSpan={3} className="p-3.5 font-extrabold text-teal-950 text-xs md:text-sm">
                  7.10 Total Existing Value of Property (A+B) (Rs)
                </td>
                <td className="p-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {fields.janaTotalExistingPropertyValueEdit ? (
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-right font-extrabold bg-white text-teal-950 border-teal-600`}
                        value={
                          fields.janaTotalExistingPropertyValueManual ??
                          autoTotalExistingPropertyValue
                        }
                        onChange={(e) =>
                          handleChange('janaTotalExistingPropertyValueManual', e.target.value)
                        }
                        disabled={isReadOnly}
                      />
                    ) : (
                      <LockedFieldWrapper
                        isLocked={true}
                        tooltipMessage=">>Auto calculating from [7.24 Land Value + 7.9 Total (Rs)]<<"
                      >
                        <input
                          type="text"
                          readOnly
                          disabled
                          className={`${inputCls} text-right font-extrabold bg-teal-200/90 border-teal-400 text-teal-950 cursor-not-allowed`}
                          value={
                            autoTotalExistingPropertyValue > 0
                              ? `₹ ${autoTotalExistingPropertyValue.toLocaleString('en-IN')}`
                              : '₹ 0'
                          }
                        />
                      </LockedFieldWrapper>
                    )}
                    <EditSwitch
                      checked={Boolean(fields.janaTotalExistingPropertyValueEdit)}
                      onChange={(checked) =>
                        handleChange('janaTotalExistingPropertyValueEdit', checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 3. Table: To Be Filled For Construction & Improvement Cases (Light Brown '#efebe9') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-stone-300 shadow-sm"
        style={{ backgroundColor: '#efebe9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-300 pb-3">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              7.11 Proposed Construction Details (C)
            </h3>
          </div>
          <span className="text-xs text-stone-800 font-medium bg-stone-200 px-2.5 py-1 rounded-md border border-stone-300">
            Section 7: Table 2
          </span>
        </div>

        {/* Responsive Proposed Construction Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-160">
            <thead>
              <tr className="bg-stone-200/80 border-b border-stone-300 text-stone-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/4 min-w-36">Floor</th>
                <th className="py-3 px-4 w-1/4 min-w-28 text-center">Area (Sq.ft.)</th>
                <th className="py-3 px-4 w-1/4 min-w-28 text-center">Rate (per Sq.ft.)</th>
                <th className="py-3 px-4 w-1/4 min-w-36 text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {proposedRows.map((p, idx) => {
                const areaKey = 'janaProposedArea_' + p.id;
                const rateKey = 'janaProposedRate_' + p.id;
                const amtKey = 'janaProposedAmount_' + p.id;
                const editKey = 'janaProposedAmountEdit_' + p.id;
                const isEdit = Boolean(fields[editKey]);
                const area = parseNum(fields[areaKey]);
                const rate = parseNum(fields[rateKey]);
                const autoAmt = Math.round(area * rate);

                return (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-gray-800 text-xs md:text-sm">
                      {p.label}
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-center`}
                        value={fields[areaKey] ?? ''}
                        onChange={(e) => handleChange(areaKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-center`}
                        value={fields[rateKey] ?? ''}
                        onChange={(e) => handleChange(rateKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEdit ? (
                          <input
                            type="number"
                            step="any"
                            className={`${inputCls} text-right font-bold bg-white text-stone-950 border-stone-400`}
                            value={fields[amtKey] ?? autoAmt}
                            onChange={(e) => handleChange(amtKey, e.target.value)}
                            disabled={isReadOnly}
                          />
                        ) : (
                          <LockedFieldWrapper
                            isLocked={true}
                            tooltipMessage=">>Auto calculating from [Area (Sq.ft.) * Rate (per Sq.ft.)]<<"
                          >
                            <input
                              type="text"
                              readOnly
                              disabled
                              className={`${inputCls} text-right font-bold bg-stone-100 border-stone-300 text-stone-950 cursor-not-allowed`}
                              value={
                                autoAmt > 0
                                  ? `₹ ${autoAmt.toLocaleString('en-IN')}`
                                  : '₹ 0'
                              }
                            />
                          </LockedFieldWrapper>
                        )}
                        <EditSwitch
                          checked={isEdit}
                          onChange={(checked) => handleChange(editKey, checked)}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* 7.15 Total */}
              <tr className="bg-stone-200/90 font-bold border-t-2 border-stone-300">
                <td colSpan={3} className="p-3.5 font-extrabold text-stone-950 text-xs md:text-sm">
                  7.15 Total (Rs.) (C)
                </td>
                <td className="p-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {fields.janaProposedTotalEdit ? (
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-right font-extrabold bg-white text-stone-950 border-stone-500`}
                        value={fields.janaProposedTotalManual ?? autoProposedTotal}
                        onChange={(e) => handleChange('janaProposedTotalManual', e.target.value)}
                        disabled={isReadOnly}
                      />
                    ) : (
                      <LockedFieldWrapper
                        isLocked={true}
                        tooltipMessage=">>Auto calculating from [Sum of Amount (Rs.) across all floors]<<"
                      >
                        <input
                          type="text"
                          readOnly
                          disabled
                          className={`${inputCls} text-right font-extrabold bg-stone-200 border-stone-400 text-stone-950 cursor-not-allowed`}
                          value={
                            autoProposedTotal > 0
                              ? `₹ ${autoProposedTotal.toLocaleString('en-IN')}`
                              : '₹ 0'
                          }
                        />
                      </LockedFieldWrapper>
                    )}
                    <EditSwitch
                      checked={Boolean(fields.janaProposedTotalEdit)}
                      onChange={(checked) => handleChange('janaProposedTotalEdit', checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cost & Rate as per Customer Estimate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-300">
          {/* 7.16 Cost as per Estimate of Customer */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.16 Cost as per Estimate of Customer (Rs.)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaCostEstimateCustomerNA)}
                  onChange={(checked) => {
                    handleChange('janaCostEstimateCustomerNA', checked);
                    if (checked) {
                      handleChange('janaCostEstimateCustomer', 'NA');
                    } else {
                      handleChange('janaCostEstimateCustomer', '');
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
                fields.janaCostEstimateCustomerNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaCostEstimateCustomerNA
                  ? 'NA'
                  : (fields.janaCostEstimateCustomer ?? '')
              }
              onChange={(e) => handleChange('janaCostEstimateCustomer', e.target.value)}
              disabled={isReadOnly || fields.janaCostEstimateCustomerNA}
              placeholder={fields.janaCostEstimateCustomerNA ? 'NA' : 'e.g. 1500000'}
            />
          </Field>

          {/* 7.17 Rate/ Sq.ft. as per Estimate of customer */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.17 Rate/ Sq.ft. as per Estimate of Customer (Rs.)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaRateEstimateCustomerNA)}
                  onChange={(checked) => {
                    handleChange('janaRateEstimateCustomerNA', checked);
                    if (checked) {
                      handleChange('janaRateEstimateCustomer', 'NA');
                    } else {
                      handleChange('janaRateEstimateCustomer', '');
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
                fields.janaRateEstimateCustomerNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaRateEstimateCustomerNA
                  ? 'NA'
                  : (fields.janaRateEstimateCustomer ?? '')
              }
              onChange={(e) => handleChange('janaRateEstimateCustomer', e.target.value)}
              disabled={isReadOnly || fields.janaRateEstimateCustomerNA}
              placeholder={fields.janaRateEstimateCustomerNA ? 'NA' : 'e.g. 1800'}
            />
          </Field>
        </div>
      </div>

      {/* ─── 4. Table: Description of proposed construction/ improvement (Light Lime '#f7fee7') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-lime-300 shadow-sm"
        style={{ backgroundColor: '#f7fee7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lime-300 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-lime-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              7.18 Description of Proposed Construction / Improvement
            </h3>
          </div>
          <span className="text-xs text-lime-800 font-medium bg-lime-100 px-2.5 py-1 rounded-md border border-lime-300">
            Section 7: Table 3
          </span>
        </div>

        {/* 7.18 Material at site (Yes/No) */}
        <div className="max-w-md bg-white/70 p-3 rounded-lg border border-lime-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-700">
              Material at site (Yes/ No)
            </span>
            <NaCheckbox
              checked={Boolean(fields.janaMaterialAtSiteNA)}
              onChange={(checked) => {
                handleChange('janaMaterialAtSiteNA', checked);
                if (checked) {
                  handleChange('janaMaterialAtSite', 'NA');
                } else {
                  handleChange('janaMaterialAtSite', 'Yes');
                }
              }}
              disabled={isReadOnly}
            />
          </div>
          {fields.janaMaterialAtSiteNA ? (
            <div className="text-[11px] text-gray-500 italic mt-1">Not Applicable (NA)</div>
          ) : (
            <div className="mt-2">
              <RadioGroup
                name="janaMaterialAtSite"
                value={fields.janaMaterialAtSite || 'Yes'}
                onChange={(val) => handleChange('janaMaterialAtSite', val)}
                options={['Yes', 'No']}
                disabled={isReadOnly}
              />
            </div>
          )}
        </div>

        {/* 7.19 Data Rows Table */}
        <div className="overflow-x-auto rounded-xl border border-lime-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-160">
            <thead>
              <tr className="bg-lime-200/70 border-b border-lime-300 text-lime-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-2/5 min-w-40">Description</th>
                <th className="py-3 px-4 w-1/5 min-w-28 text-center">Rs./ sqft</th>
                <th className="py-3 px-4 w-1/5 min-w-24 text-center">Qty.</th>
                <th className="py-3 px-4 w-1/5 min-w-36 text-right">Total Value (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lime-100">
              {improvementIndices.map((i) => {
                const descKey = 'janaImprovementDesc_' + i;
                const rateKey = 'janaImprovementRate_' + i;
                const qtyKey = 'janaImprovementQty_' + i;
                const valKey = 'janaImprovementVal_' + i;
                const editKey = 'janaImprovementValEdit_' + i;
                const isEdit = Boolean(fields[editKey]);
                const rate = parseNum(fields[rateKey]);
                const qty = parseNum(fields[qtyKey]);
                const autoVal = Math.round(rate * qty);

                return (
                  <tr key={i} className="hover:bg-lime-50/50 transition-colors">
                    <td className="p-2.5">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields[descKey] ?? ''}
                        onChange={(e) => handleChange(descKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder={
                          i === 0
                            ? 'Civil Construction Work'
                            : i === 1
                            ? 'Finishing & Flooring'
                            : 'Plumbing & Electrical Work'
                        }
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-center`}
                        value={fields[rateKey] ?? ''}
                        onChange={(e) => handleChange(rateKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        step="any"
                        className={`${inputCls} text-center`}
                        value={fields[qtyKey] ?? ''}
                        onChange={(e) => handleChange(qtyKey, e.target.value)}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEdit ? (
                          <input
                            type="number"
                            step="any"
                            className={`${inputCls} text-right font-bold bg-white text-lime-950 border-lime-400`}
                            value={fields[valKey] ?? autoVal}
                            onChange={(e) => handleChange(valKey, e.target.value)}
                            disabled={isReadOnly}
                          />
                        ) : (
                          <LockedFieldWrapper
                            isLocked={true}
                            tooltipMessage=">>Auto calculating from [Rs./ sqft * Qty.]<<"
                          >
                            <input
                              type="text"
                              readOnly
                              disabled
                              className={`${inputCls} text-right font-bold bg-lime-50/80 border-lime-300 text-lime-950 cursor-not-allowed`}
                              value={
                                autoVal > 0
                                  ? `₹ ${autoVal.toLocaleString('en-IN')}`
                                  : '₹ 0'
                              }
                            />
                          </LockedFieldWrapper>
                        )}
                        <EditSwitch
                          checked={isEdit}
                          onChange={(checked) => handleChange(editKey, checked)}
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

        {/* 7.20' Value of extra Amenities */}
        <div className="pt-2 border-t border-lime-300 max-w-md">
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.20 Value of Extra Amenities (Rs.)
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaValueExtraAmenitiesNA)}
                  onChange={(checked) => {
                    handleChange('janaValueExtraAmenitiesNA', checked);
                    if (checked) {
                      handleChange('janaValueExtraAmenities', 'NA');
                    } else {
                      handleChange('janaValueExtraAmenities', '');
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
                fields.janaValueExtraAmenitiesNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={
                fields.janaValueExtraAmenitiesNA
                  ? 'NA'
                  : (fields.janaValueExtraAmenities ?? '')
              }
              onChange={(e) => handleChange('janaValueExtraAmenities', e.target.value)}
              disabled={isReadOnly || fields.janaValueExtraAmenitiesNA}
              placeholder={fields.janaValueExtraAmenitiesNA ? 'NA' : 'e.g. 50000'}
            />
          </Field>
        </div>
      </div>

      {/* ─── 5. Container: Final Valuation (Light Amber '#fef3c7') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-amber-300 shadow-sm"
        style={{ backgroundColor: '#fef3c7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Final Valuation
            </h3>
          </div>
          <span className="text-xs text-amber-900 font-medium bg-amber-200 px-2.5 py-1 rounded-md border border-amber-300">
            Section 7: Container 2
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {/* 7.21 Total Future Value of Property after completion of proposed construction (A+B+C) */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-gray-900 text-xs md:text-sm">
                    7.21 Total Future Value of Property (A+B+C) (Rs.)
                  </span>
                  <EditSwitch
                    checked={Boolean(fields.janaFuturePropertyValueEdit)}
                    onChange={(checked) => handleChange('janaFuturePropertyValueEdit', checked)}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              {fields.janaFuturePropertyValueEdit ? (
                <input
                  type="number"
                  step="any"
                  className={`${inputCls} bg-white border-amber-500 font-black text-amber-950 text-base md:text-lg`}
                  value={fields.janaFuturePropertyValueManual ?? autoFuturePropertyValue}
                  onChange={(e) =>
                    handleChange('janaFuturePropertyValueManual', e.target.value)
                  }
                  disabled={isReadOnly}
                  placeholder="Enter future property value..."
                />
              ) : (
                <LockedFieldWrapper
                  isLocked={true}
                  tooltipMessage=">>Auto calculating from [7.10' Total Existing Value of Property (A+B) (Rs) + 7.15 Total + 7.20' Value of extra Amenities]<<"
                >
                  <input
                    type="text"
                    readOnly
                    disabled
                    className={`${inputCls} bg-amber-100/90 border-amber-400 font-black text-amber-950 text-base md:text-lg cursor-not-allowed`}
                    value={
                      autoFuturePropertyValue > 0
                        ? `₹ ${autoFuturePropertyValue.toLocaleString('en-IN')}`
                        : '₹ 0'
                    }
                  />
                </LockedFieldWrapper>
              )}
            </Field>
          </div>

          {/* 7.22 Valuation as per Govt. Guideline Rate | Rate (per sqft) */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                7.22 Govt. Guideline Rate (per sqft) (Rs.)
              </span>
            }
          >
            <input
              type="number"
              step="any"
              className={inputCls}
              value={fields.janaGovtGuidelineRate ?? ''}
              onChange={(e) => handleChange('janaGovtGuidelineRate', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1200"
            />
          </Field>

          {/* 7.25 Land value as per Government Guideline Rate (Rs) */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  7.25 Land Value as per Govt. Guideline Rate (Rs.)
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaGovtLandValueEdit)}
                  onChange={(checked) => handleChange('janaGovtLandValueEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaGovtLandValueEdit ? (
              <input
                type="number"
                step="any"
                className={`${inputCls} bg-white border-amber-400 font-bold text-gray-900`}
                value={fields.janaGovtLandValueManual ?? autoGovtLandValue}
                onChange={(e) => handleChange('janaGovtLandValueManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter Govt Land Value..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage=">>Auto calculating from [7.23 Land Area * 7.22 Valuation as per Govt. Guideline Rate (per sqft)]<<"
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-amber-50/90 border-amber-300 font-bold text-amber-950 cursor-not-allowed`}
                  value={
                    autoGovtLandValue > 0
                      ? `₹ ${autoGovtLandValue.toLocaleString('en-IN')}`
                      : '₹ 0'
                  }
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* 7.22 Distressed Value of Property (Rs) (75% of market value) */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-gray-900 text-xs md:text-sm">
                    7.22 Distressed Value of Property (75% of Market Value) (Rs.)
                  </span>
                  <EditSwitch
                    checked={Boolean(fields.janaDistressedValueEdit)}
                    onChange={(checked) =>
                      handleChange('janaDistressedValueEdit', checked)
                    }
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              {fields.janaDistressedValueEdit ? (
                <input
                  type="number"
                  step="any"
                  className={`${inputCls} bg-white border-amber-500 font-bold text-amber-950 text-base`}
                  value={fields.janaDistressedValueManual ?? autoDistressedValue}
                  onChange={(e) =>
                    handleChange('janaDistressedValueManual', e.target.value)
                  }
                  disabled={isReadOnly}
                  placeholder="Enter distressed value..."
                />
              ) : (
                <LockedFieldWrapper
                  isLocked={true}
                  tooltipMessage=">>Auto calculating from [7.21 Total Future Value of Property * 0.75]<<"
                >
                  <input
                    type="text"
                    readOnly
                    disabled
                    className={`${inputCls} bg-amber-100/90 border-amber-400 font-bold text-amber-950 text-base cursor-not-allowed`}
                    value={
                      autoDistressedValue > 0
                        ? `₹ ${autoDistressedValue.toLocaleString('en-IN')}`
                        : '₹ 0'
                    }
                  />
                </LockedFieldWrapper>
              )}
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: STAGE OF CONSTRUCTION ────────────────────────────────────────

function StageOfConstructionSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const structureOptions = [
    { value: 'RCC', label: 'RCC' },
    { value: 'Load Bearing', label: 'Load Bearing' },
    { value: 'Mix', label: 'Mix' },
    { value: 'Steel Structure', label: 'Steel Structure' },
    { value: 'Prefabricated', label: 'Prefabricated' },
  ];

  const stageOptions = [
    { value: 'Initial', label: 'Initial' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Final', label: 'Final' },
    { value: 'Initial (Foundation / Plinth Level)', label: 'Initial (Foundation / Plinth Level)' },
    { value: 'Intermediate (Lintel / Slab / Brickwork Level)', label: 'Intermediate (Lintel / Slab / Brickwork Level)' },
    { value: 'Intermediate (Plastering / Flooring)', label: 'Intermediate (Plastering / Flooring)' },
    { value: 'Final (Finishing / Ready for Possession)', label: 'Final (Finishing / Ready for Possession)' },
    { value: 'Completed (100%)', label: 'Completed (100%)' },
    { value: 'Under Construction', label: 'Under Construction' },
  ];

  const rowCount = Math.max(1, fields.janaStageRowsCount || 2);
  const rowIndices = Array.from({ length: rowCount }, (_, i) => i);

  const handleAddRow = () => {
    handleChange('janaStageRowsCount', rowCount + 1);
  };

  const handleRemoveRow = (indexToRemove: number) => {
    if (rowCount <= 1) return;
    for (let i = indexToRemove; i < rowCount - 1; i++) {
      handleChange('janaStageStructure_' + i, fields['janaStageStructure_' + (i + 1)]);
      handleChange('janaStageStructureCustom_' + i, fields['janaStageStructureCustom_' + (i + 1)]);
      handleChange('janaStageDesc_' + i, fields['janaStageDesc_' + (i + 1)]);
      handleChange('janaStageDescCustom_' + i, fields['janaStageDescCustom_' + (i + 1)]);
      handleChange('janaStageCompletedPercent_' + i, fields['janaStageCompletedPercent_' + (i + 1)]);
      handleChange('janaStageRecommendedPercent_' + i, fields['janaStageRecommendedPercent_' + (i + 1)]);
    }
    handleChange('janaStageRowsCount', rowCount - 1);
  };

  return (
    <div className="space-y-6">
      {/* ─── Table: STAGE OF CONSTRUCTION (Light Coral '#fff1f2') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-rose-200 shadow-sm"
        style={{ backgroundColor: '#fff1f2' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 pb-3">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-rose-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              STAGE OF CONSTRUCTION
            </h3>
          </div>
          <span className="text-xs text-rose-800 font-medium bg-rose-100 px-2.5 py-1 rounded-md border border-rose-300">
            Section 8: Table 1
          </span>
        </div>

        {/* 8.1 Subtitle Banner */}
        <div className="p-3 bg-white/80 rounded-lg border border-rose-200 text-xs text-rose-950 font-medium flex items-center justify-between gap-2">
          <span>
            <strong>8.1 Description of Stage:</strong> Based on standard cost of construction & description of stage (Initial / Intermediate / Final)
          </span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stage Row</span>
            </button>
          )}
        </div>

        {/* 8.2 Data Rows Table */}
        <div className="overflow-x-auto rounded-xl border border-rose-300 bg-white/90 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse min-w-175">
            <thead>
              <tr className="bg-rose-100/80 border-b border-rose-300 text-rose-950 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-1/3 min-w-44">
                  Description of Structure (RCC/ Load Bearing /Mix)
                </th>
                <th className="py-3 px-4 w-1/3 min-w-48">
                  Description of Stage
                </th>
                <th className="py-3 px-3 w-1/6 min-w-28 text-center">
                  % Completed
                </th>
                <th className="py-3 px-3 w-1/6 min-w-28 text-center">
                  % Recommended
                </th>
                {!isReadOnly && rowCount > 1 && (
                  <th className="py-3 px-2 w-10 text-center"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100">
              {rowIndices.map((i) => {
                const structKey = 'janaStageStructure_' + i;
                const structCustomKey = 'janaStageStructureCustom_' + i;
                const descKey = 'janaStageDesc_' + i;
                const descCustomKey = 'janaStageDescCustom_' + i;
                const compKey = 'janaStageCompletedPercent_' + i;
                const recKey = 'janaStageRecommendedPercent_' + i;

                return (
                  <tr key={i} className="hover:bg-rose-50/50 transition-colors">
                    <td className="p-3 align-top">
                      <CustomSelect
                        value={fields[structKey] || 'RCC'}
                        customValue={fields[structCustomKey] || ''}
                        onChange={(val) => handleChange(structKey, val)}
                        onCustomChange={(val) => handleChange(structCustomKey, val)}
                        options={structureOptions}
                        disabled={isReadOnly}
                        placeholder="Select structure..."
                      />
                    </td>
                    <td className="p-3 align-top">
                      <CustomSelect
                        value={
                          fields[descKey] ||
                          (i === 0
                            ? 'Completed (100%)'
                            : 'Intermediate (Plastering / Flooring)')
                        }
                        customValue={fields[descCustomKey] || ''}
                        onChange={(val) => handleChange(descKey, val)}
                        onCustomChange={(val) => handleChange(descCustomKey, val)}
                        options={stageOptions}
                        disabled={isReadOnly}
                        placeholder="Select stage..."
                      />
                    </td>
                    <td className="p-3 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          className={`${inputCls} text-center font-semibold`}
                          value={fields[compKey] ?? ''}
                          onChange={(e) => handleChange(compKey, e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. 100"
                        />
                        <span className="text-gray-500 font-bold text-xs">%</span>
                      </div>
                    </td>
                    <td className="p-3 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          className={`${inputCls} text-center font-semibold`}
                          value={fields[recKey] ?? ''}
                          onChange={(e) => handleChange(recKey, e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. 100"
                        />
                        <span className="text-gray-500 font-bold text-xs">%</span>
                      </div>
                    </td>
                    {!isReadOnly && rowCount > 1 && (
                      <td className="p-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(i)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-100 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
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

// ─── Section 9: Reference Detail ─────────────────────────────────────────────

function ReferenceDetailSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const referenceTypeOptions = [
    { value: 'Broker', label: 'Broker' },
    { value: 'Builder', label: 'Builder' },
    { value: 'Colonizer', label: 'Colonizer' },
    { value: 'Neighbor', label: 'Neighbor' },
    { value: 'Shop Owner', label: 'Shop Owner' },
    { value: 'Valuer', label: 'Valuer' },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Container: Reference Detail (Light Green Yellow '#f7fee7') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-lime-300 shadow-sm"
        style={{ backgroundColor: '#f7fee7' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lime-200 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-lime-800" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Reference Detail
            </h3>
          </div>
          <span className="text-xs text-lime-800 font-medium bg-lime-100 px-2.5 py-1 rounded-md border border-lime-300">
            Section 9: Container 1
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* 9.1 Reference Type */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                9.1 Reference Type
              </span>
            }
          >
            <CustomSelect
              value={fields.janaRefType || 'Neighbor'}
              customValue={fields.janaRefTypeCustom || ''}
              onChange={(val) => handleChange('janaRefType', val)}
              onCustomChange={(val) => handleChange('janaRefTypeCustom', val)}
              options={referenceTypeOptions}
              disabled={isReadOnly}
              placeholder="Select reference type..."
            />
          </Field>

          {/* 9.2 Reference Contact Number */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  9.2 Reference Contact Number
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaRefContactNumberNA)}
                  onChange={(checked) => {
                    handleChange('janaRefContactNumberNA', checked);
                    if (checked) {
                      handleChange('janaRefContactNumber', 'NA');
                    } else {
                      handleChange('janaRefContactNumber', '');
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
                fields.janaRefContactNumberNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={fields.janaRefContactNumber ?? ''}
              onChange={(e) => handleChange('janaRefContactNumber', e.target.value)}
              disabled={isReadOnly || Boolean(fields.janaRefContactNumberNA)}
              placeholder="e.g. +91 9876543210"
            />
          </Field>

          {/* 9.3 Reference Name */}
          <Field
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  9.3 Reference Name
                </span>
                <NaCheckbox
                  checked={Boolean(fields.janaRefNameNA)}
                  onChange={(checked) => {
                    handleChange('janaRefNameNA', checked);
                    if (checked) {
                      handleChange('janaRefName', 'NA');
                    } else {
                      handleChange('janaRefName', '');
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
                fields.janaRefNameNA
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                  : ''
              }`}
              value={fields.janaRefName ?? ''}
              onChange={(e) => handleChange('janaRefName', e.target.value)}
              disabled={isReadOnly || Boolean(fields.janaRefNameNA)}
              placeholder="Enter reference person name..."
            />
          </Field>

          {/* 9.4 Remarks, if any */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-gray-700 text-xs md:text-sm">
                    9.4 Remarks, if any
                  </span>
                  <NaCheckbox
                    checked={Boolean(fields.janaRefRemarksNA)}
                    onChange={(checked) => {
                      handleChange('janaRefRemarksNA', checked);
                      if (checked) {
                        handleChange('janaRefRemarks', 'NA');
                      } else {
                        handleChange('janaRefRemarks', '');
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                rows={2}
                className={
                  fields.janaRefRemarksNA
                    ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                    : ''
                }
                value={fields.janaRefRemarks ?? ''}
                onChange={(e) => handleChange('janaRefRemarks', e.target.value)}
                disabled={isReadOnly || Boolean(fields.janaRefRemarksNA)}
                placeholder="Enter any reference remarks, market feedback, or observations..."
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 10: Exceptions (Not to be filled) (For JSFB internal use only) ──

function ExceptionsInternalSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const residualAge = fields.janaResidualAgeEdit
    ? (fields.janaResidualAgeManual || '')
    : fields.janaAgeOfPropertyNA
    ? 'NA'
    : fields.janaAgeOfProperty !== undefined && fields.janaAgeOfProperty !== ''
    ? String(Math.max(0, 60 - (parseInt(fields.janaAgeOfProperty, 10) || 0)))
    : '60';

  const exceptionItems = [
    {
      num: '10.1',
      label: 'Seismic Zone',
      hover: '>>Prefill from section 2, "Seismic Zone"<<',
      editKey: 'janaExSeismicZoneEdit',
      manualKey: 'janaExSeismicZoneManual',
      prefill: fields.janaSeismicZone || 'Zone III',
    },
    {
      num: '10.2',
      label: 'Layout Plan Provided (Y/N)',
      hover: '>>Prefill from section 3, "Layout Plan Provided (Y/N)"<<',
      editKey: 'janaExLayoutPlanProvidedEdit',
      manualKey: 'janaExLayoutPlanProvidedManual',
      prefill: fields.janaLayoutPlanProvided || 'No',
    },
    {
      num: '10.3',
      label: 'Construction Permission (Y/N)',
      hover: '>>Prefill from section 3, "Construction Permission (Y/N)"<<',
      editKey: 'janaExConstructionPermissionEdit',
      manualKey: 'janaExConstructionPermissionManual',
      prefill: fields.janaConstructionPermissionProvided || 'Yes',
    },
    {
      num: '10.4',
      label: 'Boundaries Matching',
      hover: '>>Prefill from section 4, "Boundaries Matching"<<',
      editKey: 'janaExBoundariesMatchingEdit',
      manualKey: 'janaExBoundariesMatchingManual',
      prefill: fields.janaBoundariesMatching || 'Yes',
    },
    {
      num: '10.5',
      label: 'Plot demarcated at site',
      hover: '>>Prefill from section 4, "Plot demarcated at site - (Permanent/ temporary)"<<',
      editKey: 'janaExPlotDemarcatedEdit',
      manualKey: 'janaExPlotDemarcatedManual',
      prefill:
        fields.janaPlotDemarcated === 'Custom'
          ? (fields.janaPlotDemarcatedCustom || 'Custom')
          : (fields.janaPlotDemarcated || 'Permanent'),
    },
    {
      num: '10.6',
      label: 'Class of Locality (Posh/ High/ Middle/ Low/ Slum)',
      hover: '>>Prefill from section 4, "Class of Locality (Posh/ High/ Middle/ Low/ Slum)"<<',
      editKey: 'janaExClassOfLocalityEdit',
      manualKey: 'janaExClassOfLocalityManual',
      prefill:
        fields.janaClassOfLocality === 'Custom'
          ? (fields.janaClassOfLocalityCustom || 'Custom')
          : (fields.janaClassOfLocality || 'Middle'),
    },
    {
      num: '10.7',
      label: 'Is community dominated area (Yes/ No)',
      hover: '>>Prefill from section 4, "Is community dominated area (Yes/ No)"<<',
      editKey: 'janaExCommunityDominatedEdit',
      manualKey: 'janaExCommunityDominatedManual',
      prefill: fields.janaCommunityDominated || 'No',
    },
    {
      num: '10.8',
      label: 'Width of public road (ft)',
      hover: '>>Prefill from section 4, "Width of public road (ft)"<<',
      editKey: 'janaExRoadWidthEdit',
      manualKey: 'janaExRoadWidthManual',
      prefill: fields.janaRoadWidthNA ? 'NA' : (fields.janaRoadWidth || ''),
    },
    {
      num: '10.9',
      label: 'Is property easily located and identified (Yes/ No)',
      hover: '>>Prefill from section 4, "Is property easily located and identified (Yes/ No)"<<',
      editKey: 'janaExEasilyLocatedEdit',
      manualKey: 'janaExEasilyLocatedManual',
      prefill: fields.janaEasilyLocated || 'Yes',
    },
    {
      num: "10.10'",
      label: 'Distance from City Center (Km)',
      hover: '>>Prefill from section 4, "Distance from City Center (Km)"<<',
      editKey: 'janaExDistanceFromCityCenterEdit',
      manualKey: 'janaExDistanceFromCityCenterManual',
      prefill: fields.janaDistanceFromCityCenterNA ? 'NA' : (fields.janaDistanceFromCityCenter || ''),
    },
    {
      num: '10.11',
      label: 'Property Location (MC/ GP/ Panchayat under Development Authority)',
      hover: '>>Prefill from section 4, "Property Location (MC/ GP/ Panchayat under Development Authority)"<<',
      editKey: 'janaExPropertyLocationEdit',
      manualKey: 'janaExPropertyLocationManual',
      prefill:
        fields.janaPropertyLocation === 'Custom'
          ? (fields.janaPropertyLocationCustom || 'Custom')
          : (fields.janaPropertyLocation || 'Municipal Corporation (MC)'),
    },
    {
      num: '10.12',
      label: 'Maintenance level (Good/ Average/ Poor)',
      hover: '>>Prefill from section 4, "Maintenance level (Good/ Average/ Poor)"<<',
      editKey: 'janaExMaintenanceLevelEdit',
      manualKey: 'janaExMaintenanceLevelManual',
      prefill: fields.janaMaintenanceLevel || 'Good',
    },
    {
      num: '10.13',
      label: 'Residual Age of property (Years)',
      hover: '>>Prefill from section 4, "Residual Age of property (Years)"<<',
      editKey: 'janaExResidualAgeEdit',
      manualKey: 'janaExResidualAgeManual',
      prefill: residualAge,
    },
    {
      num: '10.14',
      label: 'Risk of Demolition/ Sealing',
      hover: '>>Prefill from section 6, "Risk of Demolition/ Sealing"<<',
      editKey: 'janaExDemolitionRiskEdit',
      manualKey: 'janaExDemolitionRiskManual',
      prefill: fields.janaDemolitionRisk || 'No',
    },
    {
      num: '10.15',
      label: 'Is there encroachment of land (Y/N)',
      hover: '>>Prefill from section 6, "Is there encroachment of land (Y/N)"<<',
      editKey: 'janaExLandEncroachmentEdit',
      manualKey: 'janaExLandEncroachmentManual',
      prefill: fields.janaLandEncroachment || 'No',
    },
    {
      num: '10.16',
      label: 'Is there HT line near to the property?',
      hover: '>>Prefill from section 6, "Is there HT line near to the property?"<<',
      editKey: 'janaExHtLineNearEdit',
      manualKey: 'janaExHtLineNearManual',
      prefill: fields.janaHtLineNear || 'No',
    },
    {
      num: '10.17',
      label: 'Is property in buffer zone/no construction zone as per local guidelines',
      hover: '>>Prefill from section 6, "Is property in buffer zone/ no construction zone as per local guidelines"<<',
      editKey: 'janaExBufferZoneEdit',
      manualKey: 'janaExBufferZoneManual',
      prefill: fields.janaBufferZone || 'No',
    },
    {
      num: '10.18',
      label: 'Is there any litigation notice on the property from any FI',
      hover: '>>Prefill from section 6, "Is there any litigation notice on the property from any FI"<<',
      editKey: 'janaExLitigationNoticeEdit',
      manualKey: 'janaExLitigationNoticeManual',
      prefill: fields.janaLitigationNotice || 'No',
    },
    {
      num: '10.19',
      label: 'Is property near to graveyard/ crematorium or burning ghats',
      hover: '>>Prefill from section 6, "Is property near to graveyard/ crematorium or burning ghats"<<',
      editKey: 'janaExGraveyardNearEdit',
      manualKey: 'janaExGraveyardNearManual',
      prefill: fields.janaGraveyardNear || 'No',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Container: Exceptions (Internal QA) (Light Slate Grey '#f1f5f9') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-5 border border-slate-300 shadow-sm"
        style={{ backgroundColor: '#f1f5f9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Exceptions (Internal QA)
            </h3>
          </div>
          <span className="text-xs text-slate-700 font-semibold bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300">
            Section 10: Container 1
          </span>
        </div>

        {/* Note banner */}
        <div className="p-3 bg-white/85 rounded-lg border border-slate-300 text-xs text-slate-700 font-medium flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Note:</strong> All fields in this container are prefilled from respective sections above with Edit Toggle (Default Off) and feature Lock UI (For JSFB internal use only).
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {exceptionItems.map((item) => {
            const isEdit = Boolean(fields[item.editKey]);
            const displayVal = isEdit
              ? (fields[item.manualKey] ?? item.prefill)
              : item.prefill;

            return (
              <Field
                key={item.num}
                label={
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-semibold text-gray-700 text-xs md:text-sm">
                      {item.num} {item.label}
                    </span>
                    <EditSwitch
                      checked={isEdit}
                      onChange={(checked) => handleChange(item.editKey, checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                }
              >
                {isEdit ? (
                  <input
                    type="text"
                    className={`${inputCls} bg-white font-medium border-slate-400`}
                    value={displayVal}
                    onChange={(e) => handleChange(item.manualKey, e.target.value)}
                    disabled={isReadOnly}
                    placeholder={`Enter ${item.label}...`}
                  />
                ) : (
                  <LockedFieldWrapper isLocked={true} tooltipMessage={item.hover}>
                    <input
                      type="text"
                      readOnly
                      disabled
                      className={`${inputCls} bg-slate-100/90 border-slate-300 font-semibold text-slate-800 cursor-not-allowed`}
                      value={displayVal || ''}
                    />
                  </LockedFieldWrapper>
                )}
              </Field>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Section 11: Remarks, if any :- ─────────────────────────────────────────

function SignatureSealInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [activeTab, setActiveTab] = React.useState<'upload' | 'draw'>('upload');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || disabled) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    onChange(canvas.toDataURL('image/png'));
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2 border-b border-sky-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'upload'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'bg-white text-gray-700 hover:bg-sky-50 border border-sky-200'
          }`}
        >
          Upload Image / Seal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('draw')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'draw'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'bg-white text-gray-700 hover:bg-sky-50 border border-sky-200'
          }`}
        >
          E-Signature Pad
        </button>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClearCanvas}
            className="ml-auto text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {activeTab === 'upload' && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={disabled}
            className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-800 hover:file:bg-sky-200 cursor-pointer disabled:opacity-50"
          />
        </div>
      )}

      {activeTab === 'draw' && (
        <div className="space-y-2">
          <div className="border border-sky-300 rounded-lg bg-white overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              width={400}
              height={140}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-35 cursor-crosshair bg-white"
            />
          </div>
          <p className="text-[11px] text-gray-500 italic">
            Draw your signature or place seal marks using mouse, stylus, or touch.
          </p>
        </div>
      )}

      {value && (
        <div className="p-3 bg-white/95 rounded-lg border border-sky-200 flex items-center gap-4 shadow-2xs">
          <div className="w-32 h-16 bg-slate-50 border border-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
            <img src={value} alt="Signature Preview" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Signature & Seal Attached
            </span>
            <p className="text-[11px] text-gray-500 mt-1 truncate">
              Ready for inclusion in official valuation report document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FinalDeclarationsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (name: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const prefillValuerRep = fields.janaVisitDoneBy || fields.engineerName || 'Er. S. Mohanty';
  const prefillDate = fields.janaDateOfInspection || fields.dateOfInspection || '';
  const prefillCustomerName = fields.janaCustomerName || fields.applicantName || '';
  const prefillAppNo = fields.janaApplicationNumber || fields.applicationNo || '';
  const prefillAddress = fields.janaAddressOfProperty || fields.propertyAddress || fields.address || '';

  return (
    <div className="space-y-6">
      {/* ─── Container: Final Declarations (Light Sky Blue '#f0f9ff') ─── */}
      <div
        className="rounded-xl p-5 md:p-6 space-y-6 border border-sky-300 shadow-sm"
        style={{ backgroundColor: '#f0f9ff' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-sky-700" />
            <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
              Final Declarations
            </h3>
          </div>
          <span className="text-xs text-sky-800 font-medium bg-sky-100 px-2.5 py-1 rounded-md border border-sky-300">
            Section 11: Container 1
          </span>
        </div>

        {/* Remarks */}
        <Field
          label={
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Remarks
              </span>
              <NaCheckbox
                checked={Boolean(fields.janaFinalRemarksNA)}
                onChange={(checked) => {
                  handleChange('janaFinalRemarksNA', checked);
                  if (checked) {
                    handleChange('janaFinalRemarks', 'NA');
                  } else {
                    handleChange('janaFinalRemarks', '');
                  }
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <AutoResizeTextarea
            rows={3}
            className={
              fields.janaFinalRemarksNA
                ? 'bg-gray-100 cursor-not-allowed text-gray-500 italic'
                : ''
            }
            value={fields.janaFinalRemarks ?? ''}
            onChange={(e) => handleChange('janaFinalRemarks', e.target.value)}
            disabled={isReadOnly || Boolean(fields.janaFinalRemarksNA)}
            placeholder="Enter general remarks, observations, caveats, or conditional notes..."
          />
        </Field>

        {/* Declaration */}
        <div className="p-4 md:p-5 bg-white/95 rounded-xl border border-sky-200 space-y-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="janaDeclarationAgreed"
              checked={fields.janaDeclarationAgreed !== undefined ? Boolean(fields.janaDeclarationAgreed) : true}
              onChange={(e) => handleChange('janaDeclarationAgreed', e.target.checked)}
              disabled={isReadOnly}
              className="mt-0.5 h-4.5 w-4.5 rounded border-sky-300 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer"
            />
            <label
              htmlFor="janaDeclarationAgreed"
              className="text-xs md:text-sm font-bold text-gray-900 cursor-pointer select-none"
            >
              I/We hereby declare that, <span className="text-red-500 text-xs font-semibold ml-1">(Mandatory check to proceed)</span>
            </label>
          </div>
          <ol className="list-decimal list-inside pl-7 text-xs md:text-sm text-gray-700 space-y-1.5 font-medium leading-relaxed">
            <li>The property was inspected by our representative.</li>
            <li>I/We have no direct or Indirect Interest in the property valued.</li>
            <li>The information furnished above is true and correct to my/our knowledge.</li>
          </ol>
        </div>

        {/* Signature with Seal */}
        <Field
          label={
            <span className="font-semibold text-gray-700 text-xs md:text-sm">
              Signature with seal :- [File Upload / E-Signature Pad]
            </span>
          }
        >
          <SignatureSealInput
            value={fields.janaSignatureWithSeal || ''}
            onChange={(val) => handleChange('janaSignatureWithSeal', val)}
            disabled={isReadOnly}
          />
        </Field>

        {/* Metadata & Signoff Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Valuer Name (S MOHANTY ASSOCIATES) [Input Box: Fixed size] */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Valuer Name (S MOHANTY ASSOCIATES)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-semibold`}
              value={fields.janaValuerName ?? 'S MOHANTY ASSOCIATES'}
              onChange={(e) => handleChange('janaValuerName', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. S MOHANTY ASSOCIATES"
            />
          </Field>

          {/* Valuer Representative Name [Prefill from 1.8 with Edit Toggle] [Lock UI] */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Valuer Representative Name
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaValuerRepNameEdit)}
                  onChange={(checked) => handleChange('janaValuerRepNameEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaValuerRepNameEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white font-medium border-sky-400`}
                value={fields.janaValuerRepNameManual ?? prefillValuerRep}
                onChange={(e) => handleChange('janaValuerRepNameManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter Representative Name..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='>>Prefill from section 1, "Visit Done By"<<'
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-sky-50/70 border-sky-200 font-semibold text-sky-950 cursor-not-allowed`}
                  value={prefillValuerRep}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Date [Prefill from 1.3 with Edit Toggle] [Lock UI] */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Date
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaDeclarationDateEdit)}
                  onChange={(checked) => handleChange('janaDeclarationDateEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaDeclarationDateEdit ? (
              <input
                type="date"
                className={`${inputCls} bg-white font-medium border-sky-400`}
                value={fields.janaDeclarationDateManual ?? prefillDate}
                onChange={(e) => handleChange('janaDeclarationDateManual', e.target.value)}
                disabled={isReadOnly}
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='>>Prefill from section 1, "Date of Inspection"<<'
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-sky-50/70 border-sky-200 font-semibold text-sky-950 cursor-not-allowed`}
                  value={prefillDate || ''}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Place [Input Box: Fixed size] */}
          <Field
            label={
              <span className="font-semibold text-gray-700 text-xs md:text-sm">
                Place
              </span>
            }
          >
            <input
              type="text"
              className={inputCls}
              value={fields.janaDeclarationPlace ?? 'Bhubaneswar'}
              onChange={(e) => handleChange('janaDeclarationPlace', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Bhubaneswar"
            />
          </Field>

          {/* Customer Name [Prefill from 1.2 with Edit Toggle] [Lock UI] */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Customer Name
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaDeclarationCustomerNameEdit)}
                  onChange={(checked) => handleChange('janaDeclarationCustomerNameEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaDeclarationCustomerNameEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white font-medium border-sky-400`}
                value={fields.janaDeclarationCustomerNameManual ?? prefillCustomerName}
                onChange={(e) => handleChange('janaDeclarationCustomerNameManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter Customer Name..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='>>Prefill from section 1, "Customer Name"<<'
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-sky-50/70 border-sky-200 font-semibold text-sky-950 cursor-not-allowed`}
                  value={prefillCustomerName || ''}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Application Number [Prefill from 1.1 with Edit Toggle] [Lock UI] */}
          <Field
            label={
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="font-semibold text-gray-700 text-xs md:text-sm">
                  Application Number
                </span>
                <EditSwitch
                  checked={Boolean(fields.janaDeclarationAppNoEdit)}
                  onChange={(checked) => handleChange('janaDeclarationAppNoEdit', checked)}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            {fields.janaDeclarationAppNoEdit ? (
              <input
                type="text"
                className={`${inputCls} bg-white font-medium border-sky-400`}
                value={fields.janaDeclarationAppNoManual ?? prefillAppNo}
                onChange={(e) => handleChange('janaDeclarationAppNoManual', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter Application Number..."
              />
            ) : (
              <LockedFieldWrapper
                isLocked={true}
                tooltipMessage='>>Prefill from section 1, "Application Number"<<'
              >
                <input
                  type="text"
                  readOnly
                  disabled
                  className={`${inputCls} bg-sky-50/70 border-sky-200 font-semibold text-sky-950 cursor-not-allowed`}
                  value={prefillAppNo || ''}
                />
              </LockedFieldWrapper>
            )}
          </Field>

          {/* Address of Property [Prefill from 2.1 with Edit Toggle] [Lock UI] */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Field
              label={
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-semibold text-gray-700 text-xs md:text-sm">
                    Address of Property
                  </span>
                  <EditSwitch
                    checked={Boolean(fields.janaDeclarationPropAddressEdit)}
                    onChange={(checked) => handleChange('janaDeclarationPropAddressEdit', checked)}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              {fields.janaDeclarationPropAddressEdit ? (
                <AutoResizeTextarea
                  rows={2}
                  className="bg-white font-medium border-sky-400"
                  value={fields.janaDeclarationPropAddressManual ?? prefillAddress}
                  onChange={(e) => handleChange('janaDeclarationPropAddressManual', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Enter Address of Property..."
                />
              ) : (
                <LockedFieldWrapper
                  isLocked={true}
                  tooltipMessage='>>Prefill from section 2, "Address of Property (as per site visit)"<<'
                >
                  <AutoResizeTextarea
                    rows={2}
                    readOnly
                    disabled
                    className="bg-sky-50/70 border-sky-200 font-semibold text-sky-950 cursor-not-allowed"
                    value={prefillAddress || ''}
                    onChange={() => {}}
                  />
                </LockedFieldWrapper>
              )}
            </Field>
          </div>
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
    'section-2', // Replaced by Section 2: PROPERTY DETAILS
    'section-3', // Replaced by Section 3: DOCUMENT DETAILS
    'section-4', // Replaced by Section 4: PHYSICAL DETAILS
    'section-5', // Replaced by Section 5: OCCUPANCY DETAILS
    'section-6', // Replaced by Section 6: Violations Observed if any
    'section-7', // Replaced by Section 7: VALUATION
    'section-7a',
    'section-7b',
    'section-7c',
    'section-8', // Replaced by Section 8: STAGE OF CONSTRUCTION
    'section-8a',
    'section-9', // Replaced by Section 9: Reference Detail
    'section-10', // Replaced by Section 10: Exceptions (Not to be filled)
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'jana-section-1', title: 'CUSTOMER DETAILS' },
    { id: 'jana-section-2', title: 'PROPERTY DETAILS' },
    { id: 'jana-section-3', title: 'DOCUMENT DETAILS' },
    { id: 'jana-section-4', title: 'PHYSICAL DETAILS' },
    { id: 'jana-section-5', title: 'OCCUPANCY DETAILS' },
    { id: 'jana-section-6', title: 'Violations Observed if any' },
    { id: 'jana-section-7', title: 'VALUATION' },
    { id: 'jana-section-8', title: 'STAGE OF CONSTRUCTION' },
    { id: 'jana-section-9', title: 'Reference Detail' },
    { id: 'jana-section-10', title: 'Exceptions (Internal QA)' },
    { id: 'jana-section-11', title: 'Final Declarations' },
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
    {
      id: 'jana-section-2',
      title: 'PROPERTY DETAILS',
      number: 2,
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
      id: 'jana-section-3',
      title: 'DOCUMENT DETAILS',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <DocumentDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-4',
      title: 'PHYSICAL DETAILS',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <PhysicalDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-5',
      title: 'OCCUPANCY DETAILS',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <OccupancyDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-6',
      title: 'Violations Observed if any',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ViolationsObservedSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-7',
      title: 'VALUATION',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ValuationSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-8',
      title: 'STAGE OF CONSTRUCTION',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <StageOfConstructionSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-9',
      title: 'Reference Detail',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ReferenceDetailSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-10',
      title: 'Exceptions (Not to be filled) (For JSFB internal use only)',
      number: 10,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <ExceptionsInternalSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'jana-section-11',
      title: 'Remarks, if any :-',
      number: 11,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <FinalDeclarationsSection
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
    janaSeismicZone: 'Zone III',
    janaLayoutPlanProvided: 'No',
    janaBuildingPlanProvided: 'Yes',
    janaConstructionPermissionProvided: 'Yes',
    janaOtherLegalDocNA: false,
    janaBoundariesMatching: 'Yes',
    janaPlotAreaUnit: 'Sq. Ft.',
    janaPlotDemarcated: 'Permanent',
    janaTypeOfLocality: 'Residential',
    janaClassOfLocality: 'Middle',
    janaCommunityDominated: 'No',
    janaEasilyLocated: 'Yes',
    janaPropertyLocation: 'Municipal Corporation (MC)',
    janaTypeOfProperty: 'Residential Building',
    janaStructure: 'RCC',
    janaInteriorQuality: 'Average',
    janaExteriorQuality: 'Average',
    janaMaintenanceLevel: 'Good',
    janaOccupancyStatus: 'Self Occupied',
    janaOccupantRelationship: 'Self',
    janaOccupiedByNA: false,
    janaOccupiedSinceNA: false,
    janaLandEncroachment: 'No',
    janaEncroachmentAreaNA: true,
    janaEncroachmentArea: 'NA',
    janaStructureDeviation: 'No',
    janaDemolitionRisk: 'No',
    janaHtLineNear: 'No',
    janaHtLineDistanceVoltageNA: true,
    janaHtLineDistanceVoltage: 'NA',
    janaBufferZone: 'No',
    janaBufferZoneDetailsNA: true,
    janaBufferZoneDetails: 'NA',
    janaLitigationNotice: 'No',
    janaNoticeByFiDetailsNA: true,
    janaNoticeByFiDetails: 'NA',
    janaGraveyardNear: 'No',
    janaHabitationPercent: '80%',
    janaViolationsOtherRemarks: 'Nil',
    janaExistingAreaType: 'Built Up Area',
    janaMaterialAtSite: 'Yes',
    janaImprovementRowsCount: 3,
    janaStageStructure_0: 'RCC',
    janaStageDesc_0: 'Completed (100%)',
    janaStageCompletedPercent_0: '100',
    janaStageRecommendedPercent_0: '100',
    janaStageStructure_1: 'RCC',
    janaStageDesc_1: 'Intermediate (Plastering / Flooring)',
    janaStageCompletedPercent_1: '75',
    janaStageRecommendedPercent_1: '70',
    janaStageRowsCount: 2,
    janaRefType: 'Neighbor',
    janaRefContactNumberNA: false,
    janaRefNameNA: false,
    janaRefRemarksNA: false,
    janaValuerName: 'S MOHANTY ASSOCIATES',
    janaDeclarationPlace: 'Bhubaneswar',
    janaDeclarationAgreed: true,
    janaFinalRemarksNA: false,
  },
};

export default function JanaSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={JANA_SMALL_FINANCE_BANK_CONFIG} {...props} />;
}

