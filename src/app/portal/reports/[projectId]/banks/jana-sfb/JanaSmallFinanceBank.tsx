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
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'jana-section-1', title: 'CUSTOMER DETAILS' },
    { id: 'jana-section-2', title: 'PROPERTY DETAILS' },
    { id: 'jana-section-3', title: 'DOCUMENT DETAILS' },
    { id: 'jana-section-4', title: 'PHYSICAL DETAILS' },
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
  },
};

export default function JanaSmallFinanceBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={JANA_SMALL_FINANCE_BANK_CONFIG} {...props} />;
}

