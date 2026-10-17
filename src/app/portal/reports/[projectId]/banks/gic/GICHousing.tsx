'use client';

import React, { useMemo } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';
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
  ],
};

// ─── Default Export ─────────────────────────────────────────────────────────

export default function GICHousing(props: BankReportBuilderProps) {
  return <BankReportBuilder config={GIC_HOUSING_CONFIG} {...props} />;
}
