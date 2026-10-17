'use client';

import React, { useMemo } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { rupeesInWords } from '@/lib/numberToWords';

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
      <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? 'text-emerald-700' : 'text-gray-400'}`}>
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
      {isCustom && (
        <input
          type="text"
          className={inputCls}
          value={customValue || ''}
          onChange={(e) => onCustomChange?.(e.target.value)}
          disabled={disabled}
          placeholder="Enter custom value..."
        />
      )}
    </div>
  );
}

// ─── Default Constants ──────────────────────────────────────────────────────

const DEFAULT_PREPARED_BY = `M/s. S MOHANTY ASSOCIATES
Er. Satyajit Mohanty (Approved Valuer & Chartered Engineer)
Plot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018`;

const DEFAULT_TO = `TO,
THE BRANCH MANAGER,
GIC HOUSING FINANCE LTD,
BHUBANESWAR BRANCH`;

const DEFAULT_PANEL_VALUER = 'Er. Satyajit Mohanty';
const DEFAULT_VALUER_CODE = 'SMA/GIC/01';

export interface ValuationHouseRow {
  id: string;
  description: string;
  areaSqft: string;
  unitRate: string;
  estimatedMarketValue: string;
  estimatedMarketValueEditOn: boolean;
  guidelineUnitRate: string;
  guidelineValue: string;
  guidelineValueEditOn: boolean;
}

const DEFAULT_HOUSE_ROWS: ValuationHouseRow[] = [
  {
    id: 'row-land',
    description: 'Land',
    areaSqft: '',
    unitRate: '',
    estimatedMarketValue: '',
    estimatedMarketValueEditOn: false,
    guidelineUnitRate: '',
    guidelineValue: '',
    guidelineValueEditOn: false,
  },
  {
    id: 'row-building',
    description: 'Building',
    areaSqft: '',
    unitRate: '',
    estimatedMarketValue: '',
    estimatedMarketValueEditOn: false,
    guidelineUnitRate: '',
    guidelineValue: '',
    guidelineValueEditOn: false,
  },
  {
    id: 'row-amenities',
    description: 'Amenities',
    areaSqft: '',
    unitRate: '',
    estimatedMarketValue: '',
    estimatedMarketValueEditOn: false,
    guidelineUnitRate: '',
    guidelineValue: '',
    guidelineValueEditOn: false,
  },
];

// ─── Section 1: Report of Valuation of Immovable Property ───────────────────

function CoverPageDetailsContainer({
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

  // 1. Owner of the property
  const ownerValue = fields.gicOwnerOfTheProperty ?? (fields.ownerName || '');

  // 2. Value of the property (Auto-calculate Number & Words)
  const autoCalculatedValue =
    fields.gicTotalValueBeforeRenovation ||
    fields.gicFlatMarketValue ||
    fields.gicTotalValuation ||
    fields.presentMarketValue ||
    fields.netValue ||
    fields.totalValuation ||
    fields.gicValueOfProperty ||
    '';

  const effectivePropertyValue = fields.gicValueOfPropertyEditOn
    ? (fields.gicValueOfProperty ?? '')
    : autoCalculatedValue;

  const numericPropValue = parseFloat(String(effectivePropertyValue).replace(/[^0-9.]/g, '')) || 0;
  const effectivePropertyValueWords =
    numericPropValue > 0
      ? rupeesInWords(numericPropValue)
      : (fields.gicValueOfPropertyWords || 'Zero Rupees Only');

  // 3. Prepared by (Prefill + Variable size)
  const effectivePreparedBy = fields.gicPreparedByEditOn
    ? (fields.gicPreparedBy ?? '')
    : (fields.gicPreparedBy || DEFAULT_PREPARED_BY);

  // 4. Ref No (Input + NA Checkbox)
  const isRefNoNA = !!fields.gicRefNoNA;
  const effectiveRefNo = isRefNoNA ? 'NA' : (fields.gicRefNo ?? projectCode ?? '');

  // 5. Date (Prefill current date + Edit Switch)
  const effectiveDate = fields.gicDateEditOn
    ? (fields.gicDate ?? '')
    : (fields.gicDate || todayStr);

  // 6. To, (Variable size text area)
  const effectiveTo = fields.gicTo ?? DEFAULT_TO;

  // 7. Subject (Auto-calculate from Applicant & Property Details + Edit Switch)
  const applicantName = (fields.gicOwnerOfTheProperty || fields.ownerName || fields.applicantName || '').trim();
  const propertyDetails = (fields.gicPropertyAddress || fields.propertyAddress || '').trim();

  let autoSubject = '';
  if (applicantName && propertyDetails) {
    autoSubject = `Valuation report of immovable property belonging to ${applicantName} situated at ${propertyDetails}.`;
  } else if (applicantName) {
    autoSubject = `Valuation report of immovable property belonging to ${applicantName}.`;
  } else if (propertyDetails) {
    autoSubject = `Valuation report of immovable property situated at ${propertyDetails}.`;
  } else {
    autoSubject = 'Valuation report of immovable property.';
  }

  const effectiveSubject = fields.gicSubjectEditOn
    ? (fields.gicSubject ?? '')
    : (fields.gicSubject || autoSubject);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Cover Page Details (Light Gray #f5f5f5) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-300 shadow-sm"
        style={{ backgroundColor: '#f5f5f5' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-gray-300 pb-2 uppercase tracking-wide">
          Cover Page Details
        </h3>

        {/* Row 1: Owner of the Property & Value of the Property */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* OWNER OF THE PROPERTY */}
          <Field label={<span className="font-semibold text-gray-700">OWNER OF THE PROPERTY</span>}>
            <input
              type="text"
              className={inputCls}
              value={ownerValue}
              onChange={(e) => handleChange('gicOwnerOfTheProperty', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter owner name of the property..."
            />
          </Field>

          {/* VALUE OF THE PROPERTY */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">VALUE OF THE PROPERTY</span>
                <EditSwitch
                  checked={!!fields.gicValueOfPropertyEditOn}
                  onChange={(v) => {
                    handleChange('gicValueOfPropertyEditOn', v);
                    if (v && !fields.gicValueOfProperty && autoCalculatedValue) {
                      handleChange('gicValueOfProperty', autoCalculatedValue);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} pr-8 ${
                    !fields.gicValueOfPropertyEditOn
                      ? 'bg-gray-100 cursor-not-allowed font-semibold text-gray-800'
                      : 'bg-white'
                  }`}
                  value={effectivePropertyValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('gicValueOfProperty', val);
                    const n = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                    if (n > 0) {
                      handleChange('gicValueOfPropertyWords', rupeesInWords(n));
                    }
                  }}
                  disabled={isReadOnly || !fields.gicValueOfPropertyEditOn}
                  placeholder="Enter or auto-calculated valuation..."
                />
                {!fields.gicValueOfPropertyEditOn && (
                  <div
                    className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    title="Auto-calculated from property valuation"
                  >
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 font-medium bg-white/80 p-2 rounded border border-gray-200">
                <span className="font-bold text-gray-700">In Words: </span>
                <span>{effectivePropertyValueWords}</span>
              </div>
            </div>
          </Field>
        </div>

        {/* Row 2: PREPARED BY */}
        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">PREPARED BY</span>
              <EditSwitch
                checked={!!fields.gicPreparedByEditOn}
                onChange={(v) => {
                  handleChange('gicPreparedByEditOn', v);
                  if (v && !fields.gicPreparedBy) {
                    handleChange('gicPreparedBy', DEFAULT_PREPARED_BY);
                  }
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <div className="relative">
            <textarea
              rows={3}
              className={`${inputCls} resize-y pr-8 ${
                !fields.gicPreparedByEditOn ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'
              }`}
              value={effectivePreparedBy}
              onChange={(e) => handleChange('gicPreparedBy', e.target.value)}
              disabled={isReadOnly || !fields.gicPreparedByEditOn}
              placeholder="Enter valuer / firm details..."
            />
            {!fields.gicPreparedByEditOn && (
              <div
                className="absolute top-2.5 right-2.5 pointer-events-none"
                title="Prefilled with valuer firm details"
              >
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </Field>

        {/* Row 3: REF NO & DATE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* REF NO */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">REF NO</span>
                <NaCheckbox
                  checked={isRefNoNA}
                  onChange={(checked) => {
                    handleChange('gicRefNoNA', checked);
                    if (checked) {
                      handleChange('gicRefNo', 'NA');
                    } else {
                      handleChange('gicRefNo', projectCode || '');
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
                isRefNoNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={effectiveRefNo}
              onChange={(e) => handleChange('gicRefNo', e.target.value)}
              disabled={isReadOnly || isRefNoNA}
              placeholder="e.g. GIC/VAL/2026/01"
            />
          </Field>

          {/* DATE */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">DATE</span>
                <EditSwitch
                  checked={!!fields.gicDateEditOn}
                  onChange={(v) => {
                    handleChange('gicDateEditOn', v);
                    if (v && !fields.gicDate) {
                      handleChange('gicDate', todayStr);
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="date"
                className={`${inputCls} pr-8 ${
                  !fields.gicDateEditOn ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'
                }`}
                value={effectiveDate}
                onChange={(e) => handleChange('gicDate', e.target.value)}
                disabled={isReadOnly || !fields.gicDateEditOn}
              />
              {!fields.gicDateEditOn && (
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  title="Prefilled with current date"
                >
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          </Field>
        </div>

        {/* Row 4: TO, */}
        <Field label={<span className="font-semibold text-gray-700">TO,</span>}>
          <textarea
            rows={3}
            className={`${inputCls} resize-y bg-white`}
            value={effectiveTo}
            onChange={(e) => handleChange('gicTo', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter addressee / branch..."
          />
        </Field>

        {/* Row 5: SUBJECT: */}
        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">SUBJECT:</span>
              <EditSwitch
                checked={!!fields.gicSubjectEditOn}
                onChange={(v) => {
                  handleChange('gicSubjectEditOn', v);
                  if (v && !fields.gicSubject) {
                    handleChange('gicSubject', autoSubject);
                  }
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <div className="relative">
            <textarea
              rows={3}
              className={`${inputCls} resize-y pr-8 ${
                !fields.gicSubjectEditOn ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'
              }`}
              value={effectiveSubject}
              onChange={(e) => handleChange('gicSubject', e.target.value)}
              disabled={isReadOnly || !fields.gicSubjectEditOn}
              placeholder="Enter subject line..."
            />
            {!fields.gicSubjectEditOn && (
              <div
                className="absolute top-2.5 right-2.5 pointer-events-none"
                title="Auto-generates from Applicant & Property Details"
              >
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </Field>
      </div>
    </div>
  );
}

// ─── Section 2: Valuation Report ────────────────────────────────────────────

function BasicValuationDetailsContainer({
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
  // 1. FILE NO (Input Box + NA Checkbox)
  const isFileNoNA = !!fields.gicFileNoNA;
  const effectiveFileNo = isFileNoNA ? 'NA' : (fields.gicFileNo ?? projectCode ?? '');

  // 2. NAME OF PANEL VALUER (Prefill field + Edit Switch)
  const effectivePanelValuer = fields.gicNameOfPanelValuerEditOn
    ? (fields.gicNameOfPanelValuer ?? '')
    : (fields.gicNameOfPanelValuer || DEFAULT_PANEL_VALUER);

  // 3. CODE NO (Prefill field + Edit Switch)
  const effectiveCodeNo = fields.gicCodeNoEditOn
    ? (fields.gicCodeNo ?? '')
    : (fields.gicCodeNo || DEFAULT_VALUER_CODE);

  // 4. DATE OF INSPECTION (Date Picker)
  const effectiveDateOfInspection = fields.gicDateOfInspection || '';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Basic Valuation Details (Light Blue #e3f2fd) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-blue-200 shadow-sm"
        style={{ backgroundColor: '#e3f2fd' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-blue-200 pb-2 uppercase tracking-wide">
          Basic Valuation Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* FILE NO */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">FILE NO</span>
                <NaCheckbox
                  checked={isFileNoNA}
                  onChange={(checked) => {
                    handleChange('gicFileNoNA', checked);
                    if (checked) {
                      handleChange('gicFileNo', 'NA');
                    } else {
                      handleChange('gicFileNo', projectCode || '');
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
                isFileNoNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={effectiveFileNo}
              onChange={(e) => handleChange('gicFileNo', e.target.value)}
              disabled={isReadOnly || isFileNoNA}
              placeholder="e.g. GIC/2026/FN-01"
            />
          </Field>

          {/* NAME OF PANEL VALUER */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">NAME OF PANEL VALUER</span>
                <EditSwitch
                  checked={!!fields.gicNameOfPanelValuerEditOn}
                  onChange={(v) => {
                    handleChange('gicNameOfPanelValuerEditOn', v);
                    if (v && !fields.gicNameOfPanelValuer) {
                      handleChange('gicNameOfPanelValuer', DEFAULT_PANEL_VALUER);
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
                className={`${inputCls} pr-8 ${
                  !fields.gicNameOfPanelValuerEditOn
                    ? 'bg-gray-100 cursor-not-allowed font-medium text-gray-800'
                    : 'bg-white'
                }`}
                value={effectivePanelValuer}
                onChange={(e) => handleChange('gicNameOfPanelValuer', e.target.value)}
                disabled={isReadOnly || !fields.gicNameOfPanelValuerEditOn}
                placeholder="Enter valuer name..."
              />
              {!fields.gicNameOfPanelValuerEditOn && (
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  title="Prefilled with panel valuer name"
                >
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          </Field>

          {/* CODE NO */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">CODE NO</span>
                <EditSwitch
                  checked={!!fields.gicCodeNoEditOn}
                  onChange={(v) => {
                    handleChange('gicCodeNoEditOn', v);
                    if (v && !fields.gicCodeNo) {
                      handleChange('gicCodeNo', DEFAULT_VALUER_CODE);
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
                className={`${inputCls} pr-8 ${
                  !fields.gicCodeNoEditOn
                    ? 'bg-gray-100 cursor-not-allowed font-medium text-gray-800'
                    : 'bg-white'
                }`}
                value={effectiveCodeNo}
                onChange={(e) => handleChange('gicCodeNo', e.target.value)}
                disabled={isReadOnly || !fields.gicCodeNoEditOn}
                placeholder="Enter code number..."
              />
              {!fields.gicCodeNoEditOn && (
                <div
                  className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  title="Prefilled with valuer code"
                >
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          </Field>

          {/* DATE OF INSPECTION */}
          <Field label={<span className="font-semibold text-gray-700">DATE OF INSPECTION</span>}>
            <input
              type="date"
              className={`${inputCls} bg-white`}
              value={effectiveDateOfInspection}
              onChange={(e) => handleChange('gicDateOfInspection', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Property Details ────────────────────────────────────────────

function PropertyDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container 1: Applicant & Location Information (Light Green #e8f5e9) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-green-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-green-200 pb-2 uppercase tracking-wide">
          Applicant & Location Information
        </h3>

        {/* NAME OF APPLICANT/ CO- APPLICANT */}
        <Field label={<span className="font-semibold text-gray-700">NAME OF APPLICANT/ CO- APPLICANT</span>}>
          <input
            type="text"
            className={inputCls}
            value={fields.gicApplicantName ?? fields.ownerName ?? ''}
            onChange={(e) => handleChange('gicApplicantName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter name of applicant / co-applicant..."
          />
        </Field>

        {/* DOCUMENT PERUSED & VERIFIED */}
        <Field label={<span className="font-semibold text-gray-700">DOCUMENT PERUSED & VERIFIED</span>}>
          <div className="flex flex-wrap gap-4 pt-1">
            {['Sale Deed', 'ROR', 'Approved Plan', 'Estimate'].map((doc) => {
              const selected = (fields.gicDocsVerified || []).includes(doc);
              return (
                <label
                  key={doc}
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const current = fields.gicDocsVerified || [];
                      if (e.target.checked) {
                        handleChange('gicDocsVerified', [...current, doc]);
                      } else {
                        handleChange('gicDocsVerified', current.filter((item: string) => item !== doc));
                      }
                    }}
                    disabled={isReadOnly}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{doc}</span>
                </label>
              );
            })}
          </div>
        </Field>

        {/* ADDRESS OF PROPERTY Section Header */}
        <div className="pt-2">
          <h4 className="font-bold text-gray-700 text-xs md:text-sm border-b border-green-300 pb-1 uppercase tracking-wide">
            ADDRESS OF PROPERTY
          </h4>
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SURVEY NO */}
          <Field label={<span className="font-semibold text-gray-700">SURVEY NO</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.gicSurveyNo || ''}
              onChange={(e) => handleChange('gicSurveyNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter Survey No..."
            />
          </Field>

          {/* /MOUZA */}
          <Field label={<span className="font-semibold text-gray-700">/MOUZA</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.gicMouza || ''}
              onChange={(e) => handleChange('gicMouza', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter Mouza..."
            />
          </Field>

          {/* WARD NO/ TALUK */}
          <Field label={<span className="font-semibold text-gray-700">WARD NO/ TALUK</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.gicWardNoTaluk || ''}
              onChange={(e) => handleChange('gicWardNoTaluk', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter Ward No / Taluk..."
            />
          </Field>

          {/* DISTRICT */}
          <Field label={<span className="font-semibold text-gray-700">DISTRICT</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.gicDistrict || ''}
              onChange={(e) => handleChange('gicDistrict', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter District..."
            />
          </Field>
        </div>
      </div>

      {/* Container 2: Boundaries (Light Green #e8f5e9) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-green-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-green-200 pb-2 uppercase tracking-wide">
          Boundaries
        </h3>

        {/* LOCATION SALE DEED VERIFIED */}
        <Field label={<span className="font-semibold text-gray-700">LOCATION SALE DEED VERIFIED</span>}>
          <CustomSelect
            value={fields.gicLocationSaleDeedVerified || ''}
            customValue={fields.gicLocationSaleDeedVerifiedCustom || ''}
            onChange={(val) => handleChange('gicLocationSaleDeedVerified', val)}
            onCustomChange={(val) => handleChange('gicLocationSaleDeedVerifiedCustom', val)}
            options={[
              { value: 'Sketch Map', label: 'Sketch Map' },
              { value: 'Physical', label: 'Physical' },
            ]}
            disabled={isReadOnly}
            placeholder="Select verification method..."
          />
        </Field>

        {/* Boundaries (Sale Deed) */}
        <div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
            Sale Deed Boundaries
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NORTH (Sale Deed) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">NORTH (Sale Deed)</span>
                  <NaCheckbox
                    checked={!!fields.gicBoundarySaleDeedNorthNA}
                    onChange={(checked) => {
                      handleChange('gicBoundarySaleDeedNorthNA', checked);
                      if (checked) handleChange('gicBoundarySaleDeedNorth', 'NA');
                      else handleChange('gicBoundarySaleDeedNorth', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.gicBoundarySaleDeedNorthNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicBoundarySaleDeedNorthNA ? 'NA' : (fields.gicBoundarySaleDeedNorth || '')}
                onChange={(e) => handleChange('gicBoundarySaleDeedNorth', e.target.value)}
                disabled={isReadOnly || !!fields.gicBoundarySaleDeedNorthNA}
                placeholder="North boundary..."
              />
            </Field>

            {/* SOUTH (Sale Deed) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">SOUTH (Sale Deed)</span>
                  <NaCheckbox
                    checked={!!fields.gicBoundarySaleDeedSouthNA}
                    onChange={(checked) => {
                      handleChange('gicBoundarySaleDeedSouthNA', checked);
                      if (checked) handleChange('gicBoundarySaleDeedSouth', 'NA');
                      else handleChange('gicBoundarySaleDeedSouth', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.gicBoundarySaleDeedSouthNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicBoundarySaleDeedSouthNA ? 'NA' : (fields.gicBoundarySaleDeedSouth || '')}
                onChange={(e) => handleChange('gicBoundarySaleDeedSouth', e.target.value)}
                disabled={isReadOnly || !!fields.gicBoundarySaleDeedSouthNA}
                placeholder="South boundary..."
              />
            </Field>

            {/* EAST (Sale Deed) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">EAST (Sale Deed)</span>
                  <NaCheckbox
                    checked={!!fields.gicBoundarySaleDeedEastNA}
                    onChange={(checked) => {
                      handleChange('gicBoundarySaleDeedEastNA', checked);
                      if (checked) handleChange('gicBoundarySaleDeedEast', 'NA');
                      else handleChange('gicBoundarySaleDeedEast', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.gicBoundarySaleDeedEastNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicBoundarySaleDeedEastNA ? 'NA' : (fields.gicBoundarySaleDeedEast || '')}
                onChange={(e) => handleChange('gicBoundarySaleDeedEast', e.target.value)}
                disabled={isReadOnly || !!fields.gicBoundarySaleDeedEastNA}
                placeholder="East boundary..."
              />
            </Field>

            {/* WEST (Sale Deed) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">WEST (Sale Deed)</span>
                  <NaCheckbox
                    checked={!!fields.gicBoundarySaleDeedWestNA}
                    onChange={(checked) => {
                      handleChange('gicBoundarySaleDeedWestNA', checked);
                      if (checked) handleChange('gicBoundarySaleDeedWest', 'NA');
                      else handleChange('gicBoundarySaleDeedWest', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.gicBoundarySaleDeedWestNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicBoundarySaleDeedWestNA ? 'NA' : (fields.gicBoundarySaleDeedWest || '')}
                onChange={(e) => handleChange('gicBoundarySaleDeedWest', e.target.value)}
                disabled={isReadOnly || !!fields.gicBoundarySaleDeedWestNA}
                placeholder="West boundary..."
              />
            </Field>
          </div>
        </div>

        {/* BOUNDARIES & DIMENSIONS */}
        <Field label={<span className="font-semibold text-gray-700">BOUNDARIES & DIMENSIONS</span>}>
          <input
            type="text"
            className={inputCls}
            value={fields.gicBoundariesAndDimensions || ''}
            onChange={(e) => handleChange('gicBoundariesAndDimensions', e.target.value)}
            disabled={isReadOnly}
            placeholder="Enter boundaries & dimensions details..."
          />
        </Field>

        {/* Actual Boundaries */}
        <div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
            Actual Boundaries
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NORTH (Actual) */}
            <Field label={<span className="font-semibold text-gray-700">NORTH (Actual)</span>}>
              <input
                type="text"
                className={inputCls}
                value={fields.gicBoundaryActualNorth || ''}
                onChange={(e) => handleChange('gicBoundaryActualNorth', e.target.value)}
                disabled={isReadOnly}
                placeholder="North boundary actual..."
              />
            </Field>

            {/* SOUTH (Actual) */}
            <Field label={<span className="font-semibold text-gray-700">SOUTH (Actual)</span>}>
              <input
                type="text"
                className={inputCls}
                value={fields.gicBoundaryActualSouth || ''}
                onChange={(e) => handleChange('gicBoundaryActualSouth', e.target.value)}
                disabled={isReadOnly}
                placeholder="South boundary actual..."
              />
            </Field>

            {/* EAST (Actual) */}
            <Field label={<span className="font-semibold text-gray-700">EAST (Actual)</span>}>
              <input
                type="text"
                className={inputCls}
                value={fields.gicBoundaryActualEast || ''}
                onChange={(e) => handleChange('gicBoundaryActualEast', e.target.value)}
                disabled={isReadOnly}
                placeholder="East boundary actual..."
              />
            </Field>

            {/* WEST (Actual) */}
            <Field label={<span className="font-semibold text-gray-700">WEST (Actual)</span>}>
              <input
                type="text"
                className={inputCls}
                value={fields.gicBoundaryActualWest || ''}
                onChange={(e) => handleChange('gicBoundaryActualWest', e.target.value)}
                disabled={isReadOnly}
                placeholder="West boundary actual..."
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Container 3: Surroundings & Usage (Light Green #e8f5e9) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-green-200 shadow-sm"
        style={{ backgroundColor: '#e8f5e9' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-green-200 pb-2 uppercase tracking-wide">
          Surroundings & Usage
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* F. TYPE OF PROPERTY */}
          <Field label={<span className="font-semibold text-gray-700">F. TYPE OF PROPERTY</span>}>
            <CustomSelect
              value={fields.gicTypeOfProperty || ''}
              customValue={fields.gicTypeOfPropertyCustom || ''}
              onChange={(val) => handleChange('gicTypeOfProperty', val)}
              onCustomChange={(val) => handleChange('gicTypeOfPropertyCustom', val)}
              options={[
                { value: 'Residential Land & Building', label: 'Residential Land & Building' },
                { value: 'Commercial', label: 'Commercial' },
              ]}
              disabled={isReadOnly}
              placeholder="Select property type..."
            />
          </Field>

          {/* G. OCCUPANT */}
          <Field label={<span className="font-semibold text-gray-700">G. OCCUPANT</span>}>
            <div className="flex flex-wrap gap-4 pt-1">
              {['Owner', 'Tenant', 'Vacant'].map((occ) => (
                <label
                  key={occ}
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="gicOccupant"
                    value={occ}
                    checked={fields.gicOccupant === occ}
                    onChange={() => handleChange('gicOccupant', occ)}
                    disabled={isReadOnly}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{occ}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* IF OCCUPIED NAME OF THE OCCUPANT */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">IF OCCUPIED NAME OF THE OCCUPANT</span>
                <NaCheckbox
                  checked={!!fields.gicOccupantNameNA}
                  onChange={(checked) => {
                    handleChange('gicOccupantNameNA', checked);
                    if (checked) handleChange('gicOccupantName', 'NA');
                    else handleChange('gicOccupantName', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicOccupantNameNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicOccupantNameNA ? 'NA' : (fields.gicOccupantName || '')}
              onChange={(e) => handleChange('gicOccupantName', e.target.value)}
              disabled={isReadOnly || !!fields.gicOccupantNameNA}
              placeholder="Enter name of occupant..."
            />
          </Field>

          {/* IF RENTED LIST OF OCCUPANT */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">IF RENTED LIST OF OCCUPANT</span>
                <NaCheckbox
                  checked={!!fields.gicRentedListOfOccupantsNA}
                  onChange={(checked) => {
                    handleChange('gicRentedListOfOccupantsNA', checked);
                    if (checked) handleChange('gicRentedListOfOccupants', 'NA');
                    else handleChange('gicRentedListOfOccupants', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={2}
              className={`${inputCls} resize-y ${
                fields.gicRentedListOfOccupantsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicRentedListOfOccupantsNA ? 'NA' : (fields.gicRentedListOfOccupants || '')}
              onChange={(e) => handleChange('gicRentedListOfOccupants', e.target.value)}
              disabled={isReadOnly || !!fields.gicRentedListOfOccupantsNA}
              placeholder="Enter list of occupants if rented..."
            />
          </Field>

          {/* H. USAGE OF THE BUILDING */}
          <Field label={<span className="font-semibold text-gray-700">H. USAGE OF THE BUILDING</span>}>
            <CustomSelect
              value={fields.gicUsageOfBuilding || ''}
              customValue={fields.gicUsageOfBuildingCustom || ''}
              onChange={(val) => handleChange('gicUsageOfBuilding', val)}
              onCustomChange={(val) => handleChange('gicUsageOfBuildingCustom', val)}
              options={[
                { value: 'Residential', label: 'Residential' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Mixed', label: 'Mixed' },
              ]}
              disabled={isReadOnly}
              placeholder="Select usage of building..."
            />
          </Field>

          {/* I. DETAILS OF NEARBY PROMINENT LANDMARK */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">I. DETAILS OF NEARBY PROMINENT LANDMARK</span>
                <NaCheckbox
                  checked={!!fields.gicNearbyLandmarkNA}
                  onChange={(checked) => {
                    handleChange('gicNearbyLandmarkNA', checked);
                    if (checked) handleChange('gicNearbyLandmark', 'NA');
                    else handleChange('gicNearbyLandmark', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicNearbyLandmarkNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicNearbyLandmarkNA ? 'NA' : (fields.gicNearbyLandmark || '')}
              onChange={(e) => handleChange('gicNearbyLandmark', e.target.value)}
              disabled={isReadOnly || !!fields.gicNearbyLandmarkNA}
              placeholder="Enter nearby landmark..."
            />
          </Field>

          {/* J. DEVELOPMENT OF SURROUNDING AREA... */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                J. DEVELOPMENT OF SURROUNDING AREA...
              </span>
            }
          >
            <CustomSelect
              value={fields.gicSurroundingDevelopment || ''}
              customValue={fields.gicSurroundingDevelopmentCustom || ''}
              onChange={(val) => handleChange('gicSurroundingDevelopment', val)}
              onCustomChange={(val) => handleChange('gicSurroundingDevelopmentCustom', val)}
              options={[
                { value: 'Developing Residential Area', label: 'Developing Residential Area' },
                { value: 'Developed', label: 'Developed' },
              ]}
              disabled={isReadOnly}
              placeholder="Select development status..."
            />
          </Field>

          {/* K. WHETHER BASIC AMENITIES LIKE WATER ELECTRICITY, ROADS, SEWERAGE ARE AVAILABLE? */}
          <Field
            label={
              <span className="font-semibold text-gray-700">
                K. WHETHER BASIC AMENITIES LIKE WATER ELECTRICITY, ROADS, SEWERAGE ARE AVAILABLE?
              </span>
            }
          >
            <div className="flex gap-4 pt-1">
              {['Yes', 'No'].map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="gicBasicAmenitiesAvailable"
                    value={val}
                    checked={fields.gicBasicAmenitiesAvailable === val}
                    onChange={() => handleChange('gicBasicAmenitiesAvailable', val)}
                    disabled={isReadOnly}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{val}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* DISTANCE OF NEARBY RAILWAY STATION */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">DISTANCE OF NEARBY RAILWAY STATION</span>
                <NaCheckbox
                  checked={!!fields.gicDistanceRailwayStationNA}
                  onChange={(checked) => {
                    handleChange('gicDistanceRailwayStationNA', checked);
                    if (checked) handleChange('gicDistanceRailwayStation', 'NA');
                    else handleChange('gicDistanceRailwayStation', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicDistanceRailwayStationNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicDistanceRailwayStationNA ? 'NA' : (fields.gicDistanceRailwayStation || '')}
              onChange={(e) => handleChange('gicDistanceRailwayStation', e.target.value)}
              disabled={isReadOnly || !!fields.gicDistanceRailwayStationNA}
              placeholder="e.g. 5 km"
            />
          </Field>

          {/* BUS STAND */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">BUS STAND</span>
                <NaCheckbox
                  checked={!!fields.gicDistanceBusStandNA}
                  onChange={(checked) => {
                    handleChange('gicDistanceBusStandNA', checked);
                    if (checked) handleChange('gicDistanceBusStand', 'NA');
                    else handleChange('gicDistanceBusStand', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicDistanceBusStandNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicDistanceBusStandNA ? 'NA' : (fields.gicDistanceBusStand || '')}
              onChange={(e) => handleChange('gicDistanceBusStand', e.target.value)}
              disabled={isReadOnly || !!fields.gicDistanceBusStandNA}
              placeholder="e.g. 1.5 km"
            />
          </Field>
        </div>

        {/* Full-width Variable-size Text Areas */}
        <div className="space-y-4 pt-2">
          {/* L. ANY FAVORABLE CONSIDERATION... */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  L. ANY FAVORABLE CONSIDERATION...
                </span>
                <NaCheckbox
                  checked={!!fields.gicFavorableConsiderationNA}
                  onChange={(checked) => {
                    handleChange('gicFavorableConsiderationNA', checked);
                    if (checked) handleChange('gicFavorableConsideration', 'NA');
                    else handleChange('gicFavorableConsideration', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={2}
              className={`${inputCls} resize-y ${
                fields.gicFavorableConsiderationNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicFavorableConsiderationNA ? 'NA' : (fields.gicFavorableConsideration || '')}
              onChange={(e) => handleChange('gicFavorableConsideration', e.target.value)}
              disabled={isReadOnly || !!fields.gicFavorableConsiderationNA}
              placeholder="Enter any favorable consideration..."
            />
          </Field>

          {/* M. ANY NEGATIVE TO THE LOCALITY */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">M. ANY NEGATIVE TO THE LOCALITY</span>
                <NaCheckbox
                  checked={!!fields.gicNegativeToLocalityNA}
                  onChange={(checked) => {
                    handleChange('gicNegativeToLocalityNA', checked);
                    if (checked) handleChange('gicNegativeToLocality', 'NA');
                    else handleChange('gicNegativeToLocality', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={2}
              className={`${inputCls} resize-y ${
                fields.gicNegativeToLocalityNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicNegativeToLocalityNA ? 'NA' : (fields.gicNegativeToLocality || '')}
              onChange={(e) => handleChange('gicNegativeToLocality', e.target.value)}
              disabled={isReadOnly || !!fields.gicNegativeToLocalityNA}
              placeholder="Enter any negative factors to the locality..."
            />
          </Field>

          {/* N. ANY OTHER FEATURE... */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">N. ANY OTHER FEATURE...</span>
                <NaCheckbox
                  checked={!!fields.gicAnyOtherFeatureNA}
                  onChange={(checked) => {
                    handleChange('gicAnyOtherFeatureNA', checked);
                    if (checked) handleChange('gicAnyOtherFeature', 'NA');
                    else handleChange('gicAnyOtherFeature', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={2}
              className={`${inputCls} resize-y ${
                fields.gicAnyOtherFeatureNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicAnyOtherFeatureNA ? 'NA' : (fields.gicAnyOtherFeature || '')}
              onChange={(e) => handleChange('gicAnyOtherFeature', e.target.value)}
              disabled={isReadOnly || !!fields.gicAnyOtherFeatureNA}
              placeholder="Enter any other features..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: Planning Approvals ──────────────────────────────────────────

function PlanningApprovalsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Approval Documents (Light Yellow #fffde7) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-amber-200 shadow-sm"
        style={{ backgroundColor: '#fffde7' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-amber-200 pb-2 uppercase tracking-wide">
          Approval Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* APPROVAL DETAILS (Authority) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">APPROVAL DETAILS (Authority)</span>
                <NaCheckbox
                  checked={!!fields.gicApprovalAuthorityDetailsNA}
                  onChange={(checked) => {
                    handleChange('gicApprovalAuthorityDetailsNA', checked);
                    if (checked) handleChange('gicApprovalAuthorityDetails', 'NA');
                    else handleChange('gicApprovalAuthorityDetails', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={3}
              className={`${inputCls} resize-y ${
                fields.gicApprovalAuthorityDetailsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicApprovalAuthorityDetailsNA ? 'NA' : (fields.gicApprovalAuthorityDetails || '')}
              onChange={(e) => handleChange('gicApprovalAuthorityDetails', e.target.value)}
              disabled={isReadOnly || !!fields.gicApprovalAuthorityDetailsNA}
              placeholder="Enter approval authority details..."
            />
          </Field>

          {/* APPROVAL NO. & DATE */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">APPROVAL NO. & DATE</span>
                <NaCheckbox
                  checked={!!fields.gicApprovalNoAndDateNA}
                  onChange={(checked) => {
                    handleChange('gicApprovalNoAndDateNA', checked);
                    if (checked) handleChange('gicApprovalNoAndDate', 'NA');
                    else handleChange('gicApprovalNoAndDate', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicApprovalNoAndDateNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicApprovalNoAndDateNA ? 'NA' : (fields.gicApprovalNoAndDate || '')}
              onChange={(e) => handleChange('gicApprovalNoAndDate', e.target.value)}
              disabled={isReadOnly || !!fields.gicApprovalNoAndDateNA}
              placeholder="e.g. Letter No: BP/BDA/009678 on dated 07.05.2024"
            />
          </Field>
        </div>

        {/* C. WHAT ARE THE DEVIATION BETWEEN APPROVAL DRAWING & ACTUAL */}
        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">
                C. WHAT ARE THE DEVIATION BETWEEN APPROVAL DRAWING & ACTUAL
              </span>
              <NaCheckbox
                checked={!!fields.gicDeviationDrawingActualNA}
                onChange={(checked) => {
                  handleChange('gicDeviationDrawingActualNA', checked);
                  if (checked) handleChange('gicDeviationDrawingActual', 'NA');
                  else handleChange('gicDeviationDrawingActual', '');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <textarea
            rows={3}
            className={`${inputCls} resize-y ${
              fields.gicDeviationDrawingActualNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
            }`}
            value={fields.gicDeviationDrawingActualNA ? 'NA' : (fields.gicDeviationDrawingActual || '')}
            onChange={(e) => handleChange('gicDeviationDrawingActual', e.target.value)}
            disabled={isReadOnly || !!fields.gicDeviationDrawingActualNA}
            placeholder="Describe any deviation between approved drawing and actual construction..."
          />
        </Field>

        {/* WHETHER DEVIATIONS ARE MINOR/MAJOR IN NATURE */}
        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">
                WHETHER DEVIATIONS ARE MINOR/MAJOR IN NATURE
              </span>
              <NaCheckbox
                checked={!!fields.gicDeviationsNatureNA}
                onChange={(checked) => {
                  handleChange('gicDeviationsNatureNA', checked);
                  if (checked) handleChange('gicDeviationsNature', 'NA');
                  else handleChange('gicDeviationsNature', 'None');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <div className="flex flex-wrap gap-4 pt-1">
            {['Minor', 'Major', 'None'].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${
                  fields.gicDeviationsNatureNA
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-700 cursor-pointer border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="gicDeviationsNature"
                  value={opt}
                  checked={fields.gicDeviationsNature === opt && !fields.gicDeviationsNatureNA}
                  onChange={() => handleChange('gicDeviationsNature', opt)}
                  disabled={isReadOnly || !!fields.gicDeviationsNatureNA}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

// ─── Section 5: Building Details ────────────────────────────────────────────

function BuildingDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Construction & Lifespan (Light Purple #f3e5f5) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-purple-200 shadow-sm"
        style={{ backgroundColor: '#f3e5f5' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-purple-200 pb-2 uppercase tracking-wide">
          Construction & Lifespan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* MARKETABILITY OF THE PROPERTY */}
          <Field label={<span className="font-semibold text-gray-700">MARKETABILITY OF THE PROPERTY</span>}>
            <CustomSelect
              value={fields.gicMarketability || ''}
              customValue={fields.gicMarketabilityCustom || ''}
              onChange={(val) => handleChange('gicMarketability', val)}
              onCustomChange={(val) => handleChange('gicMarketabilityCustom', val)}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
              ]}
              disabled={isReadOnly}
              placeholder="Select marketability..."
            />
          </Field>

          {/* AGE OF THE BUILDING */}
          <Field label={<span className="font-semibold text-gray-700">AGE OF THE BUILDING</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.gicAgeOfBuilding ?? (fields.ageOfProperty || '')}
              onChange={(e) => handleChange('gicAgeOfBuilding', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 5 Years"
            />
          </Field>

          {/* FUTURE RESIDUAL LIFE EXPECTED */}
          <Field label={<span className="font-semibold text-gray-700">FUTURE RESIDUAL LIFE EXPECTED</span>}>
            <input
              type="text"
              className={inputCls}
              value={fields.gicFutureResidualLife ?? (fields.estimatedFutureLife || '')}
              onChange={(e) => handleChange('gicFutureResidualLife', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 55 Years"
            />
          </Field>

          {/* FLOOR SPACE INDEX */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">FLOOR SPACE INDEX</span>
                <NaCheckbox
                  checked={!!fields.gicFloorSpaceIndexNA}
                  onChange={(checked) => {
                    handleChange('gicFloorSpaceIndexNA', checked);
                    if (checked) handleChange('gicFloorSpaceIndex', 'NA');
                    else handleChange('gicFloorSpaceIndex', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicFloorSpaceIndexNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicFloorSpaceIndexNA ? 'NA' : (fields.gicFloorSpaceIndex || '')}
              onChange={(e) => handleChange('gicFloorSpaceIndex', e.target.value)}
              disabled={isReadOnly || !!fields.gicFloorSpaceIndexNA}
              placeholder="e.g. 1.50"
            />
          </Field>

          {/* QUALITY OF CONSTRUCTION */}
          <Field label={<span className="font-semibold text-gray-700">QUALITY OF CONSTRUCTION</span>}>
            <CustomSelect
              value={fields.gicQualityOfConstruction || ''}
              customValue={fields.gicQualityOfConstructionCustom || ''}
              onChange={(val) => handleChange('gicQualityOfConstruction', val)}
              onCustomChange={(val) => handleChange('gicQualityOfConstructionCustom', val)}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
              ]}
              disabled={isReadOnly}
              placeholder="Select quality..."
            />
          </Field>

          {/* WHETHER OCCUPATION CERTIFICATE IS OBTAINED */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">WHETHER OCCUPATION CERTIFICATE IS OBTAINED</span>
                <NaCheckbox
                  checked={!!fields.gicOccupationCertificateNA}
                  onChange={(checked) => {
                    handleChange('gicOccupationCertificateNA', checked);
                    if (checked) handleChange('gicOccupationCertificate', 'NA');
                    else handleChange('gicOccupationCertificate', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} ${
                fields.gicOccupationCertificateNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicOccupationCertificateNA ? 'NA' : (fields.gicOccupationCertificate || '')}
              onChange={(e) => handleChange('gicOccupationCertificate', e.target.value)}
              disabled={isReadOnly || !!fields.gicOccupationCertificateNA}
              placeholder="e.g. Obtained / Under Process / Not Obtained"
            />
          </Field>
        </div>

        {/* 2-col fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* IF IT IS A FLAT WHETHER LIFT FACILITY IS AVAILABLE? */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  IF IT IS A FLAT WHETHER LIFT FACILITY IS AVAILABLE?
                </span>
                <NaCheckbox
                  checked={!!fields.gicLiftFacilityAvailableNA}
                  onChange={(checked) => {
                    handleChange('gicLiftFacilityAvailableNA', checked);
                    if (checked) handleChange('gicLiftFacilityAvailable', 'N.A.');
                    else handleChange('gicLiftFacilityAvailable', 'No');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="flex flex-wrap gap-4 pt-1">
              {['Yes', 'No', 'N.A.'].map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${
                    fields.gicLiftFacilityAvailableNA
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 cursor-pointer border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="gicLiftFacilityAvailable"
                    value={opt}
                    checked={fields.gicLiftFacilityAvailable === opt && !fields.gicLiftFacilityAvailableNA}
                    onChange={() => handleChange('gicLiftFacilityAvailable', opt)}
                    disabled={isReadOnly || !!fields.gicLiftFacilityAvailableNA}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* DETAILS OF SPECIFICATION TO BE GIVEN */}
          <Field label={<span className="font-semibold text-gray-700">DETAILS OF SPECIFICATION TO BE GIVEN</span>}>
            <CustomSelect
              value={fields.gicSpecificationClass || ''}
              customValue={fields.gicSpecificationClassCustom || ''}
              onChange={(val) => handleChange('gicSpecificationClass', val)}
              onCustomChange={(val) => handleChange('gicSpecificationClassCustom', val)}
              options={[
                { value: 'Class-I', label: 'Class-I' },
                { value: 'Class-II', label: 'Class-II' },
              ]}
              disabled={isReadOnly}
              placeholder="Select specification class..."
            />
          </Field>
        </div>

        {/* Full-width textareas */}
        <div className="space-y-4 pt-1">
          {/* 5. SPECIFICATION DETAILS */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">5. SPECIFICATION DETAILS</span>
                <NaCheckbox
                  checked={!!fields.gicSpecificationDetailsNA}
                  onChange={(checked) => {
                    handleChange('gicSpecificationDetailsNA', checked);
                    if (checked) handleChange('gicSpecificationDetails', 'NA');
                    else handleChange('gicSpecificationDetails', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={3}
              className={`${inputCls} resize-y ${
                fields.gicSpecificationDetailsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicSpecificationDetailsNA ? 'NA' : (fields.gicSpecificationDetails || '')}
              onChange={(e) => handleChange('gicSpecificationDetails', e.target.value)}
              disabled={isReadOnly || !!fields.gicSpecificationDetailsNA}
              placeholder="Enter detailed specification details (foundation, structure, flooring, doors/windows, fittings)..."
            />
          </Field>

          {/* DETAILS OF DIMENSIONS OF EACH ROOM... */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  DETAILS OF DIMENSIONS OF EACH ROOM...
                </span>
                <NaCheckbox
                  checked={!!fields.gicRoomDimensionsDetailsNA}
                  onChange={(checked) => {
                    handleChange('gicRoomDimensionsDetailsNA', checked);
                    if (checked) handleChange('gicRoomDimensionsDetails', 'NA');
                    else handleChange('gicRoomDimensionsDetails', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={3}
              className={`${inputCls} resize-y ${
                fields.gicRoomDimensionsDetailsNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicRoomDimensionsDetailsNA ? 'NA' : (fields.gicRoomDimensionsDetails || '')}
              onChange={(e) => handleChange('gicRoomDimensionsDetails', e.target.value)}
              disabled={isReadOnly || !!fields.gicRoomDimensionsDetailsNA}
              placeholder="Enter dimensions of each room / plinth / carpet area details..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Valuation Details ──────────────────────────────────────────

function ValuationDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  const houseRows: ValuationHouseRow[] =
    fields.gicHouseValuationRows && Array.isArray(fields.gicHouseValuationRows) && fields.gicHouseValuationRows.length > 0
      ? fields.gicHouseValuationRows
      : DEFAULT_HOUSE_ROWS;

  const updateHouseRow = (index: number, patch: Partial<ValuationHouseRow>) => {
    const updated = houseRows.map((r, idx) => {
      if (idx !== index) return r;
      const next = { ...r, ...patch };
      const area = parseFloat(next.areaSqft) || 0;
      if (!next.estimatedMarketValueEditOn) {
        const rate = parseFloat(next.unitRate) || 0;
        next.estimatedMarketValue = area && rate ? String(Math.round(area * rate)) : '';
      }
      if (!next.guidelineValueEditOn) {
        const glRate = parseFloat(next.guidelineUnitRate) || 0;
        next.guidelineValue = area && glRate ? String(Math.round(area * glRate)) : '';
      }
      return next;
    });
    handleChange('gicHouseValuationRows', updated);

    if (!fields.gicTotalValueBeforeRenovationEditOn) {
      const sum = updated.reduce((s, r) => {
        const area = parseFloat(r.areaSqft) || 0;
        const rate = parseFloat(r.unitRate) || 0;
        const val = r.estimatedMarketValueEditOn ? parseFloat(r.estimatedMarketValue) || 0 : area * rate;
        return s + val;
      }, 0);
      if (sum > 0) {
        handleChange('gicTotalValueBeforeRenovation', String(Math.round(sum)));
      }
    }
  };

  const addHouseRow = () => {
    const newRow: ValuationHouseRow = {
      id: `row-${Date.now()}`,
      description: 'Amenities / Other',
      areaSqft: '',
      unitRate: '',
      estimatedMarketValue: '',
      estimatedMarketValueEditOn: false,
      guidelineUnitRate: '',
      guidelineValue: '',
      guidelineValueEditOn: false,
    };
    handleChange('gicHouseValuationRows', [...houseRows, newRow]);
  };

  const removeHouseRow = (index: number) => {
    if (houseRows.length <= 1) return;
    const updated = houseRows.filter((_, idx) => idx !== index);
    handleChange('gicHouseValuationRows', updated);
  };

  // House sum of market values
  const totalSumHouseMarketValue = useMemo(() => {
    return houseRows.reduce((sum, r) => {
      const area = parseFloat(r.areaSqft) || 0;
      const rate = parseFloat(r.unitRate) || 0;
      const val = r.estimatedMarketValueEditOn
        ? parseFloat(r.estimatedMarketValue) || 0
        : area * rate;
      return sum + val;
    }, 0);
  }, [houseRows]);

  const effectiveTotalBeforeRenovation = fields.gicTotalValueBeforeRenovationEditOn
    ? (fields.gicTotalValueBeforeRenovation ?? '')
    : (totalSumHouseMarketValue > 0 ? String(Math.round(totalSumHouseMarketValue)) : (fields.gicTotalValueBeforeRenovation || ''));

  // Flat calculations
  const flatArea = parseFloat(fields.gicFlatBua) || parseFloat(fields.gicFlatCarpetArea) || 0;
  const flatAdoptedRate = parseFloat(fields.gicFlatAdoptedRate) || 0;
  const flatGuidelineRate = parseFloat(fields.gicFlatGuidelineRate) || 0;

  const autoFlatMarketVal = flatArea && flatAdoptedRate ? flatArea * flatAdoptedRate : 0;
  const effectiveFlatMarketVal = fields.gicFlatMarketValueEditOn
    ? (fields.gicFlatMarketValue ?? '')
    : (autoFlatMarketVal > 0 ? String(Math.round(autoFlatMarketVal)) : (fields.gicFlatMarketValue || ''));

  const autoFlatGuidelineVal = flatArea && flatGuidelineRate ? flatArea * flatGuidelineRate : 0;
  const effectiveFlatGuidelineVal = fields.gicFlatGuidelineValueEditOn
    ? (fields.gicFlatGuidelineValue ?? '')
    : (autoFlatGuidelineVal > 0 ? String(Math.round(autoFlatGuidelineVal)) : (fields.gicFlatGuidelineValue || ''));

  return (
    <div className="animate-fade-in space-y-6">
      {/* ─── Container 1: Table A: Valuation of Property (If it is a House) ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            A. VALUATION OF PROPERTY ( IF IT IS A HOUSE )
          </h3>
          <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-cyan-300">
            <span className="text-xs font-semibold text-gray-700">Entire Table NA:</span>
            <NaCheckbox
              checked={!!fields.gicValuationHouseNA}
              onChange={(checked) => handleChange('gicValuationHouseNA', checked)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {fields.gicValuationHouseNA ? (
          <div className="p-4 bg-white/80 border border-cyan-300 rounded-lg text-sm text-cyan-900 font-medium flex items-center justify-between">
            <span>Table A (House Valuation) has been marked as Not Applicable (NA).</span>
            <button
              type="button"
              onClick={() => handleChange('gicValuationHouseNA', false)}
              disabled={isReadOnly}
              className="text-xs font-bold text-cyan-800 underline hover:text-cyan-950"
            >
              Unmark NA
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-cyan-300 bg-white shadow-sm">
              <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-cyan-100/70 border-b border-cyan-200 text-gray-800 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[130px]">DESCRIPTION</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">AREA (SQFT)</th>
                    <th className="py-2.5 px-3 min-w-[110px] text-right">UNIT RATE (RS.)</th>
                    <th className="py-2.5 px-3 min-w-[185px] text-right">ESTIMATED MARKET VALUE (RS.)</th>
                    <th className="py-2.5 px-3 min-w-[110px] text-right">UNIT RATE (RS.) [Guideline]</th>
                    <th className="py-2.5 px-3 min-w-[185px] text-right">GUIDELINE VALUE (RS.)</th>
                    {!isReadOnly && <th className="py-2.5 px-2 w-10 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {houseRows.map((row, index) => {
                    const rowArea = parseFloat(row.areaSqft) || 0;
                    const rowRate = parseFloat(row.unitRate) || 0;
                    const rowGlRate = parseFloat(row.guidelineUnitRate) || 0;
                    const calcMkt = rowArea && rowRate ? rowArea * rowRate : 0;
                    const calcGl = rowArea && rowGlRate ? rowArea * rowGlRate : 0;
                    const effMkt = row.estimatedMarketValueEditOn
                      ? row.estimatedMarketValue
                      : (calcMkt > 0 ? String(Math.round(calcMkt)) : '');
                    const effGl = row.guidelineValueEditOn
                      ? row.guidelineValue
                      : (calcGl > 0 ? String(Math.round(calcGl)) : '');

                    return (
                      <tr key={row.id || index} className="hover:bg-cyan-50/40 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-gray-500">{index + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.description}
                            onChange={(e) => updateHouseRow(index, { description: e.target.value })}
                            disabled={isReadOnly}
                            placeholder="Description"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className={`${inputCls} text-right`}
                            value={row.areaSqft}
                            onChange={(e) => updateHouseRow(index, { areaSqft: e.target.value })}
                            disabled={isReadOnly}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className={`${inputCls} text-right`}
                            value={row.unitRate}
                            onChange={(e) => updateHouseRow(index, { unitRate: e.target.value })}
                            disabled={isReadOnly}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-end">
                              <EditSwitch
                                checked={!!row.estimatedMarketValueEditOn}
                                onChange={(checked) => {
                                  updateHouseRow(index, {
                                    estimatedMarketValueEditOn: checked,
                                    estimatedMarketValue: checked ? (row.estimatedMarketValue || String(Math.round(calcMkt))) : String(Math.round(calcMkt)),
                                  });
                                }}
                                disabled={isReadOnly}
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                className={`${inputCls} text-right font-semibold ${
                                  !row.estimatedMarketValueEditOn ? 'bg-cyan-50/50 text-gray-800' : 'bg-white'
                                }`}
                                value={effMkt}
                                onChange={(e) => updateHouseRow(index, { estimatedMarketValue: e.target.value })}
                                disabled={isReadOnly || !row.estimatedMarketValueEditOn}
                                placeholder="0"
                              />
                              {!row.estimatedMarketValueEditOn && effMkt && (
                                <span className="absolute left-2 top-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Auto
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className={`${inputCls} text-right`}
                            value={row.guidelineUnitRate}
                            onChange={(e) => updateHouseRow(index, { guidelineUnitRate: e.target.value })}
                            disabled={isReadOnly}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-end">
                              <EditSwitch
                                checked={!!row.guidelineValueEditOn}
                                onChange={(checked) => {
                                  updateHouseRow(index, {
                                    guidelineValueEditOn: checked,
                                    guidelineValue: checked ? (row.guidelineValue || String(Math.round(calcGl))) : String(Math.round(calcGl)),
                                  });
                                }}
                                disabled={isReadOnly}
                              />
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                className={`${inputCls} text-right font-semibold ${
                                  !row.guidelineValueEditOn ? 'bg-cyan-50/50 text-gray-800' : 'bg-white'
                                }`}
                                value={effGl}
                                onChange={(e) => updateHouseRow(index, { guidelineValue: e.target.value })}
                                disabled={isReadOnly || !row.guidelineValueEditOn}
                                placeholder="0"
                              />
                              {!row.guidelineValueEditOn && effGl && (
                                <span className="absolute left-2 top-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Auto
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {!isReadOnly && (
                          <td className="py-2 px-2 text-center">
                            {houseRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeHouseRow(index)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isReadOnly && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={addHouseRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-cyan-300 text-cyan-800 hover:bg-cyan-50 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('gicHouseValuationRows', DEFAULT_HOUSE_ROWS)}
                  className="text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Reset Rows (Land, Building, Amenities)
                </button>
              </div>
            )}

            {/* Total Value & Source in Table A */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-cyan-200">
              <Field
                label={
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-gray-700">TOTAL VALUE BEFORE RENOVATION</span>
                    <EditSwitch
                      checked={!!fields.gicTotalValueBeforeRenovationEditOn}
                      onChange={(checked) => {
                        handleChange('gicTotalValueBeforeRenovationEditOn', checked);
                        if (!checked && totalSumHouseMarketValue > 0) {
                          handleChange('gicTotalValueBeforeRenovation', String(Math.round(totalSumHouseMarketValue)));
                        }
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                }
              >
                <div className="relative">
                  <input
                    type="number"
                    className={`${inputCls} font-bold text-gray-900 ${
                      !fields.gicTotalValueBeforeRenovationEditOn ? 'bg-white/80' : 'bg-white'
                    }`}
                    value={effectiveTotalBeforeRenovation}
                    onChange={(e) => handleChange('gicTotalValueBeforeRenovation', e.target.value)}
                    disabled={isReadOnly || !fields.gicTotalValueBeforeRenovationEditOn}
                    placeholder="Auto-calculated (Sum of Market Values)"
                  />
                  {!fields.gicTotalValueBeforeRenovationEditOn && effectiveTotalBeforeRenovation && (
                    <div className="absolute right-3 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Auto (Sum)
                    </div>
                  )}
                </div>
              </Field>

              <Field label={<span className="font-semibold text-gray-700">STATE THE SOURCE FOR ARRIVING AT THE MARKET VALUE</span>}>
                <CustomSelect
                  value={fields.gicSourceMarketValueHouse || 'Market Survey'}
                  customValue={fields.gicSourceMarketValueHouseCustom || ''}
                  onChange={(val) => handleChange('gicSourceMarketValueHouse', val)}
                  onCustomChange={(val) => handleChange('gicSourceMarketValueHouseCustom', val)}
                  options={[
                    { value: 'Market Survey', label: 'Market Survey' },
                    { value: 'Local Enquiry', label: 'Local Enquiry' },
                    { value: 'Sub-Registrar Office Guideline Rates', label: 'Sub-Registrar Office Guideline Rates' },
                    { value: 'Recent Registered Transactions', label: 'Recent Registered Transactions' },
                  ]}
                  disabled={isReadOnly}
                  placeholder="Select source..."
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* ─── Container 2: Table B: Valuation of Property (If it is a Flat) ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            B. VALUATION OF PROPERTY ( IF IT IS A FLAT)
          </h3>
          <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-cyan-300">
            <span className="text-xs font-semibold text-gray-700">Entire Table NA:</span>
            <NaCheckbox
              checked={!!fields.gicValuationFlatNA}
              onChange={(checked) => handleChange('gicValuationFlatNA', checked)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {fields.gicValuationFlatNA ? (
          <div className="p-4 bg-white/80 border border-cyan-300 rounded-lg text-sm text-cyan-900 font-medium flex items-center justify-between">
            <span>Table B (Flat Valuation) has been marked as Not Applicable (NA).</span>
            <button
              type="button"
              onClick={() => handleChange('gicValuationFlatNA', false)}
              disabled={isReadOnly}
              className="text-xs font-bold text-cyan-800 underline hover:text-cyan-950"
            >
              Unmark NA
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* FLAT NO */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">FLAT NO</span>
                  <NaCheckbox
                    checked={!!fields.gicFlatNoNA}
                    onChange={(checked) => {
                      handleChange('gicFlatNoNA', checked);
                      if (checked) handleChange('gicFlatNo', 'NA');
                      else handleChange('gicFlatNo', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="text"
                className={`${inputCls} ${
                  fields.gicFlatNoNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicFlatNoNA ? 'NA' : (fields.gicFlatNo || '')}
                onChange={(e) => handleChange('gicFlatNo', e.target.value)}
                disabled={isReadOnly || !!fields.gicFlatNoNA}
                placeholder="e.g. Flat No. 204, 2nd Floor"
              />
            </Field>

            {/* CARPET AREA */}
            <Field label={<span className="font-semibold text-gray-700">CARPET AREA (SQFT)</span>}>
              <input
                type="number"
                className={inputCls}
                value={fields.gicFlatCarpetArea || ''}
                onChange={(e) => handleChange('gicFlatCarpetArea', e.target.value)}
                disabled={isReadOnly}
                placeholder="Carpet Area in Sqft"
              />
            </Field>

            {/* 1. UNDIVIDED SHARE OF LAND */}
            <Field label={<span className="font-semibold text-gray-700">1. UNDIVIDED SHARE OF LAND (UDS SQFT)</span>}>
              <input
                type="number"
                className={inputCls}
                value={fields.gicFlatUdsArea || ''}
                onChange={(e) => handleChange('gicFlatUdsArea', e.target.value)}
                disabled={isReadOnly}
                placeholder="Undivided share of land in Sqft"
              />
            </Field>

            {/* 2. BUILT UP AREA OF THE FLAT */}
            <Field label={<span className="font-semibold text-gray-700">2. BUILT UP AREA OF THE FLAT (SQFT)</span>}>
              <input
                type="number"
                className={inputCls}
                value={fields.gicFlatBua || ''}
                onChange={(e) => handleChange('gicFlatBua', e.target.value)}
                disabled={isReadOnly}
                placeholder="Built up area in Sqft"
              />
            </Field>

            {/* 3. ADOPTED UNIT COMPOSITE RATE */}
            <Field label={<span className="font-semibold text-gray-700">3. ADOPTED UNIT COMPOSITE RATE (RS./SQFT)</span>}>
              <input
                type="number"
                className={inputCls}
                value={fields.gicFlatAdoptedRate || ''}
                onChange={(e) => handleChange('gicFlatAdoptedRate', e.target.value)}
                disabled={isReadOnly}
                placeholder="Composite rate in Rs./Sqft"
              />
            </Field>

            {/* 4. ESTIMATED VALUE / MARKET VALUE */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">4. ESTIMATED VALUE / MARKET VALUE (RS.)</span>
                  <EditSwitch
                    checked={!!fields.gicFlatMarketValueEditOn}
                    onChange={(checked) => {
                      handleChange('gicFlatMarketValueEditOn', checked);
                      if (!checked && autoFlatMarketVal > 0) {
                        handleChange('gicFlatMarketValue', String(Math.round(autoFlatMarketVal)));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  className={`${inputCls} font-bold text-gray-900 ${
                    !fields.gicFlatMarketValueEditOn ? 'bg-white/80' : 'bg-white'
                  }`}
                  value={effectiveFlatMarketVal}
                  onChange={(e) => handleChange('gicFlatMarketValue', e.target.value)}
                  disabled={isReadOnly || !fields.gicFlatMarketValueEditOn}
                  placeholder="Auto-calculates (BUA × Adopted Rate)"
                />
                {!fields.gicFlatMarketValueEditOn && effectiveFlatMarketVal && (
                  <div className="absolute right-3 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Auto (BUA × Rate)
                  </div>
                )}
              </div>
            </Field>

            {/* GUIDELINE UNIT RATE (RS.) */}
            <Field label={<span className="font-semibold text-gray-700">GUIDELINE UNIT RATE (RS./SQFT)</span>}>
              <input
                type="number"
                className={inputCls}
                value={fields.gicFlatGuidelineRate || ''}
                onChange={(e) => handleChange('gicFlatGuidelineRate', e.target.value)}
                disabled={isReadOnly}
                placeholder="Guideline composite rate in Rs./Sqft"
              />
            </Field>

            {/* GUIDELINE VALUE (RS.) */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">GUIDELINE VALUE (RS.)</span>
                  <EditSwitch
                    checked={!!fields.gicFlatGuidelineValueEditOn}
                    onChange={(checked) => {
                      handleChange('gicFlatGuidelineValueEditOn', checked);
                      if (!checked && autoFlatGuidelineVal > 0) {
                        handleChange('gicFlatGuidelineValue', String(Math.round(autoFlatGuidelineVal)));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <input
                  type="number"
                  className={`${inputCls} font-bold text-gray-900 ${
                    !fields.gicFlatGuidelineValueEditOn ? 'bg-white/80' : 'bg-white'
                  }`}
                  value={effectiveFlatGuidelineVal}
                  onChange={(e) => handleChange('gicFlatGuidelineValue', e.target.value)}
                  disabled={isReadOnly || !fields.gicFlatGuidelineValueEditOn}
                  placeholder="Auto-calculates (BUA × Guideline Rate)"
                />
                {!fields.gicFlatGuidelineValueEditOn && effectiveFlatGuidelineVal && (
                  <div className="absolute right-3 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Auto (BUA × GL Rate)
                  </div>
                )}
              </div>
            </Field>

            {/* 5. STATE THE SOURCE FOR ARRIVING AT THE MARKET VALUE */}
            <Field label={<span className="font-semibold text-gray-700">5. STATE THE SOURCE FOR ARRIVING AT THE MARKET VALUE</span>}>
              <CustomSelect
                value={fields.gicSourceMarketValueFlat || 'Market Survey'}
                customValue={fields.gicSourceMarketValueFlatCustom || ''}
                onChange={(val) => handleChange('gicSourceMarketValueFlat', val)}
                onCustomChange={(val) => handleChange('gicSourceMarketValueFlatCustom', val)}
                options={[
                  { value: 'Market Survey', label: 'Market Survey' },
                  { value: 'Local Enquiry', label: 'Local Enquiry' },
                  { value: 'Sub-Registrar Office Guideline Rates', label: 'Sub-Registrar Office Guideline Rates' },
                  { value: 'Builder / Developer Rate', label: 'Builder / Developer Rate' },
                ]}
                disabled={isReadOnly}
                placeholder="Select source..."
              />
            </Field>
          </div>
        )}
      </div>

      {/* ─── Container 3: Container: 6. ADD FOR EXTRA AMENITIES IF ANY ─── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-cyan-200 shadow-sm"
        style={{ backgroundColor: '#e0f7fa' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            ADD FOR EXTRA AMENITIES IF ANY
          </h3>
          <NaCheckbox
            checked={!!fields.gicDetailsExtraAmenitiesNA}
            onChange={(checked) => {
              handleChange('gicDetailsExtraAmenitiesNA', checked);
              if (checked) handleChange('gicDetailsExtraAmenities', 'NA');
              else handleChange('gicDetailsExtraAmenities', '');
            }}
            disabled={isReadOnly}
          />
        </div>

        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">DETAILS OF EXTRA AMENITIES</span>
              <NaCheckbox
                checked={!!fields.gicDetailsExtraAmenitiesNA}
                onChange={(checked) => {
                  handleChange('gicDetailsExtraAmenitiesNA', checked);
                  if (checked) handleChange('gicDetailsExtraAmenities', 'NA');
                  else handleChange('gicDetailsExtraAmenities', '');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <textarea
            rows={4}
            className={`${inputCls} resize-y ${
              fields.gicDetailsExtraAmenitiesNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
            }`}
            value={fields.gicDetailsExtraAmenitiesNA ? 'NA' : (fields.gicDetailsExtraAmenities || '')}
            onChange={(e) => handleChange('gicDetailsExtraAmenities', e.target.value)}
            disabled={isReadOnly || !!fields.gicDetailsExtraAmenitiesNA}
            placeholder="Enter details of extra amenities (e.g. modular kitchen, wardrobe, false ceiling, dedicated parking, clubhouse, swimming pool, power backup, etc.)..."
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Section 7: Estimate for Repair & Renovation ────────────────────────────

function RepairAndRenovationSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Renovation Costs (Light Orange #fff3e0) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-orange-200 shadow-sm"
        style={{ backgroundColor: '#fff3e0' }}
      >
        <h3 className="font-bold text-gray-800 text-sm md:text-base border-b border-orange-200 pb-2 uppercase tracking-wide">
          Renovation Costs
        </h3>

        <div className="space-y-5">
          {/* 1. DESCRIPTION OF REPAIR WORKS AS PER APPLICANTS ESTIMATE */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  1. DESCRIPTION OF REPAIR WORKS AS PER APPLICANTS ESTIMATE
                </span>
                <NaCheckbox
                  checked={!!fields.gicRepairWorksDescriptionNA}
                  onChange={(checked) => {
                    handleChange('gicRepairWorksDescriptionNA', checked);
                    if (checked) handleChange('gicRepairWorksDescription', 'NA');
                    else handleChange('gicRepairWorksDescription', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <textarea
              rows={3}
              className={`${inputCls} resize-y ${
                fields.gicRepairWorksDescriptionNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
              }`}
              value={fields.gicRepairWorksDescriptionNA ? 'NA' : (fields.gicRepairWorksDescription || '')}
              onChange={(e) => handleChange('gicRepairWorksDescription', e.target.value)}
              disabled={isReadOnly || !!fields.gicRepairWorksDescriptionNA}
              placeholder="Enter description of proposed repair and renovation works as per applicant's estimate..."
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 2. AMOUNT ESTIMATED BY THE APPLICANT... */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    2. AMOUNT ESTIMATED BY THE APPLICANT (RS.)
                  </span>
                  <NaCheckbox
                    checked={!!fields.gicRepairEstimateApplicantNA}
                    onChange={(checked) => {
                      handleChange('gicRepairEstimateApplicantNA', checked);
                      if (checked) handleChange('gicRepairEstimateApplicant', 'NA');
                      else handleChange('gicRepairEstimateApplicant', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="number"
                className={`${inputCls} ${
                  fields.gicRepairEstimateApplicantNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicRepairEstimateApplicantNA ? 'NA' : (fields.gicRepairEstimateApplicant || '')}
                onChange={(e) => handleChange('gicRepairEstimateApplicant', e.target.value)}
                disabled={isReadOnly || !!fields.gicRepairEstimateApplicantNA}
                placeholder="Enter amount in Rs."
              />
            </Field>

            {/* 3. WHETHER THE ESTIMATE SUBMITTED BY THE APPLICANT IS REASONABLE */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    3. WHETHER THE ESTIMATE SUBMITTED BY THE APPLICANT IS REASONABLE
                  </span>
                  <NaCheckbox
                    checked={!!fields.gicIsEstimateReasonableNA}
                    onChange={(checked) => {
                      handleChange('gicIsEstimateReasonableNA', checked);
                      if (checked) handleChange('gicIsEstimateReasonable', 'NA');
                      else handleChange('gicIsEstimateReasonable', 'Yes');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="flex items-center gap-6 h-10 px-1">
                {['Yes', 'No'].map((opt) => (
                  <label
                    key={opt}
                    className={`inline-flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-700 ${
                      fields.gicIsEstimateReasonableNA || isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="gicIsEstimateReasonable"
                      value={opt}
                      checked={fields.gicIsEstimateReasonable === opt && !fields.gicIsEstimateReasonableNA}
                      onChange={() => handleChange('gicIsEstimateReasonable', opt)}
                      disabled={isReadOnly || !!fields.gicIsEstimateReasonableNA}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
                {fields.gicIsEstimateReasonableNA && (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    NA
                  </span>
                )}
              </div>
            </Field>

            {/* IF NOT WHAT WOULD BE THE REASONABLE ESTIMATE */}
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-700">
                    IF NOT WHAT WOULD BE THE REASONABLE ESTIMATE (RS.)
                  </span>
                  <NaCheckbox
                    checked={!!fields.gicReasonableEstimateAmountNA}
                    onChange={(checked) => {
                      handleChange('gicReasonableEstimateAmountNA', checked);
                      if (checked) handleChange('gicReasonableEstimateAmount', 'NA');
                      else handleChange('gicReasonableEstimateAmount', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <input
                type="number"
                className={`${inputCls} ${
                  fields.gicReasonableEstimateAmountNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                }`}
                value={fields.gicReasonableEstimateAmountNA ? 'NA' : (fields.gicReasonableEstimateAmount || '')}
                onChange={(e) => handleChange('gicReasonableEstimateAmount', e.target.value)}
                disabled={isReadOnly || !!fields.gicReasonableEstimateAmountNA}
                placeholder="Enter reasonable estimate in Rs."
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: Progress of Work ────────────────────────────────────────────

export interface GICWorkProgressRow {
  id: string;
  slNo: string;
  slNoEditOn?: boolean;
  description: string;
  descriptionNA?: boolean;
  amountIncurred: string;
  valuersOpinion: string;
}

const DEFAULT_WORK_PROGRESS_ROWS: GICWorkProgressRow[] = [
  {
    id: 'row-prog-1',
    slNo: '1',
    slNoEditOn: false,
    description: '',
    descriptionNA: false,
    amountIncurred: '',
    valuersOpinion: '',
  },
];

function ProgressOfWorkSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
  projectCode?: string;
}) {
  const rows: GICWorkProgressRow[] =
    fields.gicWorkProgressRows && Array.isArray(fields.gicWorkProgressRows) && fields.gicWorkProgressRows.length > 0
      ? fields.gicWorkProgressRows
      : DEFAULT_WORK_PROGRESS_ROWS;

  const updateRow = (index: number, patch: Partial<GICWorkProgressRow>) => {
    const updated = rows.map((r, idx) => {
      if (idx !== index) return r;
      return { ...r, ...patch };
    });
    handleChange('gicWorkProgressRows', updated);
  };

  const addRow = () => {
    const newRow: GICWorkProgressRow = {
      id: `row-prog-${Date.now()}`,
      slNo: String(rows.length + 1),
      slNoEditOn: false,
      description: '',
      descriptionNA: false,
      amountIncurred: '',
      valuersOpinion: '',
    };
    handleChange('gicWorkProgressRows', [...rows, newRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const updated = rows.filter((_, idx) => idx !== index);
    handleChange('gicWorkProgressRows', updated);
  };

  // Calculate sum of amounts incurred from rows
  const sumAmountIncurred = useMemo(() => {
    return rows.reduce((acc, r) => acc + (parseFloat(r.amountIncurred) || 0), 0);
  }, [rows]);

  // Base property value + completed repair value
  const basePropertyValue =
    parseFloat(fields.gicTotalValueBeforeRenovation) ||
    parseFloat(fields.gicFlatMarketValue) ||
    parseFloat(fields.gicValueOfProperty) ||
    0;

  const completedRepairValue =
    parseFloat(fields.gicValueOfRepairWorkCompleted) ||
    sumAmountIncurred ||
    0;

  const autoPropertyValueAsOnDate = basePropertyValue + completedRepairValue;

  const effectivePropertyValueAsOnDate = fields.gicPropertyValueAsOnDateEditOn
    ? (fields.gicPropertyValueAsOnDate ?? '')
    : (autoPropertyValueAsOnDate > 0 ? String(Math.round(autoPropertyValueAsOnDate)) : (fields.gicPropertyValueAsOnDate || ''));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: Work Completion Status (Light Pink #fce4ec) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-pink-200 shadow-sm"
        style={{ backgroundColor: '#fce4ec' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200 pb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base uppercase tracking-wide">
            Work Completion Status
          </h3>
          <span className="text-xs text-pink-900 font-medium bg-pink-100/80 px-2.5 py-1 rounded-md border border-pink-300">
            Progress Tracking & Valuation
          </span>
        </div>

        {/* 1. VALUE OF REPAIR WORK COMPLETED */}
        <Field
          label={
            <div className="flex justify-between items-center w-full">
              <span className="font-semibold text-gray-700">
                1. VALUE OF REPAIR WORK COMPLETED (RS.)
              </span>
              <NaCheckbox
                checked={!!fields.gicValueOfRepairWorkCompletedNA}
                onChange={(checked) => {
                  handleChange('gicValueOfRepairWorkCompletedNA', checked);
                  if (checked) handleChange('gicValueOfRepairWorkCompleted', 'NA');
                  else handleChange('gicValueOfRepairWorkCompleted', '');
                }}
                disabled={isReadOnly}
              />
            </div>
          }
        >
          <input
            type="number"
            className={`${inputCls} ${
              fields.gicValueOfRepairWorkCompletedNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
            }`}
            value={fields.gicValueOfRepairWorkCompletedNA ? 'NA' : (fields.gicValueOfRepairWorkCompleted || '')}
            onChange={(e) => handleChange('gicValueOfRepairWorkCompleted', e.target.value)}
            disabled={isReadOnly || !!fields.gicValueOfRepairWorkCompletedNA}
            placeholder="Enter value of repair work completed in Rs."
          />
        </Field>

        {/* Table: Work Completion Status */}
        <div className="overflow-x-auto rounded-lg border border-pink-300 bg-white shadow-sm">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-pink-100/70 border-b border-pink-200 text-gray-800 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3 min-w-[120px]">SL NO</th>
                <th className="py-2.5 px-3 min-w-[240px]">DESCRIPTION OF WORK</th>
                <th className="py-2.5 px-3 min-w-[170px] text-right">
                  AMOUNT INCURRED AS PER APPLICANT’S ESTIMATE (RS.)
                </th>
                <th className="py-2.5 px-3 min-w-[200px]">VALUER’S OPINION</th>
                {!isReadOnly && <th className="py-2.5 px-2 w-10 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, index) => {
                const autoSlNo = String(index + 1);
                const effSlNo = row.slNoEditOn ? row.slNo : autoSlNo;

                return (
                  <tr key={row.id || index} className="hover:bg-pink-50/40 transition-colors">
                    {/* SL NO: Prefill field [Edit Switch] (1, 2, 3...) */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">SL NO</span>
                          <EditSwitch
                            checked={!!row.slNoEditOn}
                            onChange={(checked) => {
                              updateRow(index, {
                                slNoEditOn: checked,
                                slNo: checked ? (row.slNo || autoSlNo) : autoSlNo,
                              });
                            }}
                            disabled={isReadOnly}
                          />
                        </div>
                        <input
                          type="text"
                          className={`${inputCls} font-semibold ${
                            !row.slNoEditOn ? 'bg-pink-50/60 text-gray-800' : 'bg-white'
                          }`}
                          value={effSlNo}
                          onChange={(e) => updateRow(index, { slNo: e.target.value })}
                          disabled={isReadOnly || !row.slNoEditOn}
                          placeholder={autoSlNo}
                        />
                      </div>
                    </td>

                    {/* DESCRIPTION OF WORK: Input Box [NA Checkbox] */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-end">
                          <NaCheckbox
                            checked={!!row.descriptionNA}
                            onChange={(checked) => {
                              updateRow(index, {
                                descriptionNA: checked,
                                description: checked ? 'NA' : '',
                              });
                            }}
                            disabled={isReadOnly}
                          />
                        </div>
                        <input
                          type="text"
                          className={`${inputCls} ${
                            row.descriptionNA ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                          }`}
                          value={row.descriptionNA ? 'NA' : (row.description || '')}
                          onChange={(e) => updateRow(index, { description: e.target.value })}
                          disabled={isReadOnly || !!row.descriptionNA}
                          placeholder="e.g. Foundation & Plinth repair, Painting, Flooring..."
                        />
                      </div>
                    </td>

                    {/* AMOUNT INCURRED AS PER APPLICANT’S ESTIMATE: Input Box (Numeric) */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        className={`${inputCls} text-right`}
                        value={row.amountIncurred || ''}
                        onChange={(e) => updateRow(index, { amountIncurred: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </td>

                    {/* VALUER’S OPINION: Input Box */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        className={inputCls}
                        value={row.valuersOpinion || ''}
                        onChange={(e) => updateRow(index, { valuersOpinion: e.target.value })}
                        disabled={isReadOnly}
                        placeholder="e.g. Work in progress, satisfactory, 60% done"
                      />
                    </td>

                    {/* Action */}
                    {!isReadOnly && (
                      <td className="py-2 px-2 text-center">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isReadOnly && (
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-pink-300 text-pink-800 hover:bg-pink-50 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
            <span className="text-xs text-gray-500">
              Total Incurred Amount: <strong className="text-gray-800">Rs. {sumAmountIncurred.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        )}

        {/* PROPERTY VALUE AS ON DATE: Auto-calculates field [Edit Switch] */}
        <div className="pt-3 border-t border-pink-200">
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-700">
                  PROPERTY VALUE AS ON DATE (RS.)
                </span>
                <EditSwitch
                  checked={!!fields.gicPropertyValueAsOnDateEditOn}
                  onChange={(checked) => {
                    handleChange('gicPropertyValueAsOnDateEditOn', checked);
                    if (!checked && autoPropertyValueAsOnDate > 0) {
                      handleChange('gicPropertyValueAsOnDate', String(Math.round(autoPropertyValueAsOnDate)));
                    }
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <div className="relative">
              <input
                type="number"
                className={`${inputCls} font-bold text-gray-900 ${
                  !fields.gicPropertyValueAsOnDateEditOn ? 'bg-pink-50/70 border-pink-300' : 'bg-white'
                }`}
                value={effectivePropertyValueAsOnDate}
                onChange={(e) => handleChange('gicPropertyValueAsOnDate', e.target.value)}
                disabled={isReadOnly || !fields.gicPropertyValueAsOnDateEditOn}
                placeholder="Auto-calculated (Base Property Value + Completed Work)"
              />
              {!fields.gicPropertyValueAsOnDateEditOn && effectivePropertyValueAsOnDate && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-700 font-semibold pointer-events-none flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Auto (Base + Completed Work)
                </div>
              )}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── GIC Housing Finance BankConfig ─────────────────────────────────────────

export const GIC_HOUSING_CONFIG: BankConfig = {
  bankId: 'GIC HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'GIC Housing Finance Ltd',
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
    'layout-config',
    'annexures',
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  hideDefaultDeclarationAndCertificate: true,
  navSections: [
    { id: 'gic-section-1', title: 'REPORT OF VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'gic-section-2', title: 'VALUATION REPORT' },
    { id: 'gic-section-3', title: 'PROPERTY DETAILS' },
    { id: 'gic-section-4', title: 'PLANNING APPROVALS' },
    { id: 'gic-section-5', title: 'BUILDING DETAILS' },
    { id: 'gic-section-6', title: 'VALUATION DETAILS' },
    { id: 'gic-section-7', title: 'ESTIMATE FOR REPAIR & RENOVATION' },
    { id: 'gic-section-8', title: 'PROGRESS OF WORK' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-12', title: 'Maps' },
    { id: 'section-11', title: 'Property Photographs' },
  ],
  fieldLabels: {
    'documents-title': 'DOCUMENTS',
    'section-documents-title': 'DOCUMENTS',
    'section-12-title': 'MAPS',
    'section-11-title': 'PROPERTY PHOTOGRAPHS',
  },
  defaultValues: {
    purpose: 'Housing Loan Valuation',
    gicOwnerOfTheProperty: '',
    gicValueOfProperty: '',
    gicValueOfPropertyEditOn: false,
    gicValueOfPropertyWords: '',
    gicPreparedBy: DEFAULT_PREPARED_BY,
    gicPreparedByEditOn: false,
    gicRefNo: '',
    gicRefNoNA: false,
    gicDate: '',
    gicDateEditOn: false,
    gicTo: DEFAULT_TO,
    gicSubject: '',
    gicSubjectEditOn: false,
    gicFileNo: '',
    gicFileNoNA: false,
    gicNameOfPanelValuer: DEFAULT_PANEL_VALUER,
    gicNameOfPanelValuerEditOn: false,
    gicCodeNo: DEFAULT_VALUER_CODE,
    gicCodeNoEditOn: false,
    gicDateOfInspection: '',

    // Section 3: Property Details
    gicApplicantName: '',
    gicDocsVerified: ['Sale Deed', 'ROR'],
    gicSurveyNo: '',
    gicMouza: '',
    gicWardNoTaluk: '',
    gicDistrict: '',

    gicLocationSaleDeedVerified: 'Sketch Map',
    gicLocationSaleDeedVerifiedCustom: '',
    gicBoundarySaleDeedNorth: '',
    gicBoundarySaleDeedNorthNA: false,
    gicBoundarySaleDeedSouth: '',
    gicBoundarySaleDeedSouthNA: false,
    gicBoundarySaleDeedEast: '',
    gicBoundarySaleDeedEastNA: false,
    gicBoundarySaleDeedWest: '',
    gicBoundarySaleDeedWestNA: false,
    gicBoundariesAndDimensions: '',
    gicBoundaryActualNorth: '',
    gicBoundaryActualSouth: '',
    gicBoundaryActualEast: '',
    gicBoundaryActualWest: '',

    gicTypeOfProperty: 'Residential Land & Building',
    gicTypeOfPropertyCustom: '',
    gicOccupant: 'Owner',
    gicOccupantName: '',
    gicOccupantNameNA: false,
    gicRentedListOfOccupants: '',
    gicRentedListOfOccupantsNA: true,
    gicUsageOfBuilding: 'Residential',
    gicUsageOfBuildingCustom: '',
    gicNearbyLandmark: '',
    gicNearbyLandmarkNA: false,
    gicSurroundingDevelopment: 'Developing Residential Area',
    gicSurroundingDevelopmentCustom: '',
    gicBasicAmenitiesAvailable: 'Yes',
    gicDistanceRailwayStation: '',
    gicDistanceRailwayStationNA: false,
    gicDistanceBusStand: '',
    gicDistanceBusStandNA: false,
    gicFavorableConsideration: '',
    gicFavorableConsiderationNA: false,
    gicNegativeToLocality: '',
    gicNegativeToLocalityNA: false,
    gicAnyOtherFeature: '',
    gicAnyOtherFeatureNA: false,

    // Section 4: Planning Approvals
    gicApprovalAuthorityDetails: '',
    gicApprovalAuthorityDetailsNA: false,
    gicApprovalNoAndDate: '',
    gicApprovalNoAndDateNA: false,
    gicDeviationDrawingActual: '',
    gicDeviationDrawingActualNA: false,
    gicDeviationsNature: 'None',
    gicDeviationsNatureNA: false,

    // Section 5: Building Details
    gicMarketability: 'Good',
    gicMarketabilityCustom: '',
    gicAgeOfBuilding: '',
    gicFutureResidualLife: '55 Years',
    gicFloorSpaceIndex: '',
    gicFloorSpaceIndexNA: false,
    gicSpecificationDetails: '',
    gicSpecificationDetailsNA: false,
    gicQualityOfConstruction: 'Good',
    gicQualityOfConstructionCustom: '',
    gicOccupationCertificate: '',
    gicOccupationCertificateNA: false,
    gicLiftFacilityAvailable: 'N.A.',
    gicLiftFacilityAvailableNA: false,
    gicSpecificationClass: 'Class-I',
    gicSpecificationClassCustom: '',
    gicRoomDimensionsDetails: '',
    gicRoomDimensionsDetailsNA: false,

    // Section 6: Valuation Details
    gicValuationHouseNA: false,
    gicHouseValuationRows: DEFAULT_HOUSE_ROWS,
    gicTotalValueBeforeRenovation: '',
    gicTotalValueBeforeRenovationEditOn: false,
    gicSourceMarketValueHouse: 'Market Survey',
    gicSourceMarketValueHouseCustom: '',

    gicValuationFlatNA: false,
    gicFlatNo: '',
    gicFlatNoNA: false,
    gicFlatCarpetArea: '',
    gicFlatUdsArea: '',
    gicFlatBua: '',
    gicFlatAdoptedRate: '',
    gicFlatMarketValue: '',
    gicFlatMarketValueEditOn: false,
    gicFlatGuidelineRate: '',
    gicFlatGuidelineValue: '',
    gicFlatGuidelineValueEditOn: false,
    gicSourceMarketValueFlat: 'Market Survey',
    gicSourceMarketValueFlatCustom: '',

    gicDetailsExtraAmenities: '',
    gicDetailsExtraAmenitiesNA: false,

    // Section 7: Estimate for Repair & Renovation
    gicRepairWorksDescription: '',
    gicRepairWorksDescriptionNA: false,
    gicRepairEstimateApplicant: '',
    gicRepairEstimateApplicantNA: false,
    gicIsEstimateReasonable: 'Yes',
    gicIsEstimateReasonableNA: false,
    gicReasonableEstimateAmount: '',
    gicReasonableEstimateAmountNA: false,

    // Section 8: Progress of Work
    gicValueOfRepairWorkCompleted: '',
    gicValueOfRepairWorkCompletedNA: false,
    gicWorkProgressRows: DEFAULT_WORK_PROGRESS_ROWS,
    gicPropertyValueAsOnDate: '',
    gicPropertyValueAsOnDateEditOn: false,
  },
  extraSectionsStart: [
    {
      id: 'gic-section-1',
      title: 'REPORT OF VALUATION OF IMMOVABLE PROPERTY',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <CoverPageDetailsContainer
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-2',
      title: 'VALUATION REPORT',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <BasicValuationDetailsContainer
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-3',
      title: 'PROPERTY DETAILS',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <PropertyDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-4',
      title: 'PLANNING APPROVALS',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <PlanningApprovalsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-5',
      title: 'BUILDING DETAILS',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <BuildingDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-6',
      title: 'VALUATION DETAILS',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <ValuationDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-7',
      title: 'ESTIMATE FOR REPAIR & RENOVATION',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <RepairAndRenovationSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
    {
      id: 'gic-section-8',
      title: 'PROGRESS OF WORK',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => (
        <ProgressOfWorkSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          projectCode={projectCode}
        />
      ),
    },
  ],
};

// ─── Default Export ─────────────────────────────────────────────────────────

export default function GICHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GIC_HOUSING_CONFIG} {...props} />;
}
