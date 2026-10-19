'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, FileText, CheckCircle2, Plus } from 'lucide-react';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

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

export function YesNoRadio({
  name,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-6 pt-2">
      {['Yes', 'No'].map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800 select-none"
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={(value || 'Yes') === opt}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function DocumentUploadField({
  label,
  checked,
  onCheckedChange,
  hasNa = false,
  na = false,
  onNaChange,
  fileName,
  onFileChange,
  onFileRemove,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  hasNa?: boolean;
  na?: boolean;
  onNaChange?: (v: boolean) => void;
  fileName?: string;
  onFileChange: (file: { name: string; url?: string; type?: string }) => void;
  onFileRemove: () => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onFileChange({
        name: file.name,
        url: event.target?.result as string,
        type: file.type,
      });
      if (!checked) onCheckedChange(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isItemDisabled = disabled || na;

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-150 ${
        na
          ? 'bg-gray-100/70 border-gray-300 opacity-60'
          : checked
          ? 'bg-white border-purple-300 shadow-2xs'
          : 'bg-white/90 border-purple-200/80 hover:border-purple-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Document Name + Available Checkbox */}
        <div className="flex items-start sm:items-center gap-3">
          <input
            type="checkbox"
            checked={checked && !na}
            onChange={(e) => onCheckedChange(e.target.checked)}
            disabled={isItemDisabled}
            className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
          <span
            className={`text-sm font-semibold ${
              na
                ? 'line-through text-gray-400'
                : checked
                ? 'text-purple-950 font-bold'
                : 'text-gray-800'
            }`}
          >
            {label}
          </span>
        </div>

        {/* Right: NA Checkbox + Upload Controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          {hasNa && onNaChange && (
            <NaCheckbox
              checked={!!na}
              onChange={(newNa) => {
                onNaChange(newNa);
                if (newNa && checked) onCheckedChange(false);
              }}
              disabled={disabled}
            />
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleUpload}
            disabled={isItemDisabled}
            className="hidden"
          />

          {/* Upload Button or File Badge */}
          {!na && (
            fileName ? (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-300 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-900 shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate max-w-37.5 sm:max-w-50" title={fileName}>
                  {fileName}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={onFileRemove}
                    className="ml-1 text-gray-400 hover:text-red-600 transition"
                    title="Remove file"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isItemDisabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-semibold rounded-lg border border-purple-300 transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Upload File
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const ODISHA_DISTRICTS = [
  'Khordha',
  'Cuttack',
  'Puri',
  'Ganjam',
  'Sundargarh',
  'Sambalpur',
  'Balasore',
  'Bhadrak',
  'Jajpur',
  'Kendrapada',
  'Jagatsinghpur',
  'Angul',
  'Dhenkanal',
  'Mayurbhanj',
  'Bargarh',
  'Jharsuguda',
  'Bolangir',
  'Kalahandi',
  'Rayagada',
  'Koraput',
  'Nabarangpur',
  'Malkangiri',
  'Nuapada',
  'Subarnapur',
  'Deogarh',
  'Keonjhar',
  'Boudh',
  'Kandhamal',
  'Nayagarh',
  'Gajapati',
];

export const INDIAN_STATES = [
  'Odisha',
  'West Bengal',
  'Jharkhand',
  'Chhattisgarh',
  'Andhra Pradesh',
  'Bihar',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Gujarat',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'Assam',
  'Kerala',
];

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

// ─── Section 2: General Details ─────────────────────────────────────────────

export function GeneralDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="animate-fade-in space-y-8">
      {/* ────────────────────────────────────────────────────────────────────────
          Container 1: 1-4 Basic Info (Color: Light Blue #ADD8E6)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-blue-300 shadow-sm"
        style={{ backgroundColor: '#ADD8E6' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-blue-900 shadow-xs">
              2.1
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              1-4 Basic Info
            </h3>
          </div>
          <span className="text-xs text-blue-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-blue-300/60 shadow-xs">
            1-4 Basic Info Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1 Purpose of Valuation */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                1 PURPOSE OF VALUATION
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbPurposeOfValuation || 'Mortgage / Loan Against Property'}
              customValue={fields.hdbPurposeOfValuationCustom || ''}
              onChange={(val) => handleChange('hdbPurposeOfValuation', val)}
              onCustomChange={(val) => handleChange('hdbPurposeOfValuationCustom', val)}
              options={[
                { value: 'Mortgage / Loan Against Property', label: 'Mortgage / Loan Against Property' },
                { value: 'Housing Loan', label: 'Housing Loan' },
                { value: 'Personal Loan / Business Loan', label: 'Personal Loan / Business Loan' },
                { value: 'Fair Market Value Assessment', label: 'Fair Market Value Assessment' },
                { value: 'Top-up / Balance Transfer', label: 'Top-up / Balance Transfer' },
              ]}
              disabled={isReadOnly}
              placeholder="Select purpose of valuation..."
            />
          </Field>

          {/* 2 Date on which Valuation is done */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                2 DATE ON WHICH VALUATION IS DONE
              </span>
            }
          >
            <input
              type="date"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbDateOfValuation || todayStr}
              onChange={(e) => handleChange('hdbDateOfValuation', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {/* 3 Name of the applicant /property Owner */}
          <div className="md:col-span-2">
            <Field
              label={
                <span className="font-semibold text-gray-900">
                  3 NAME OF THE APPLICANT / PROPERTY OWNER
                </span>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbApplicantOwnerName || ''}
                onChange={(e) => handleChange('hdbApplicantOwnerName', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter name of the applicant / property owner..."
                rows={2}
                className="bg-white"
              />
            </Field>
          </div>

          {/* 4 Person Name & Contact No. available During Visit */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    4 PERSON NAME & CONTACT NO. AVAILABLE DURING VISIT
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbPersonMetDuringVisitNA}
                    onChange={(checked) => {
                      handleChange('hdbPersonMetDuringVisitNA', checked);
                      if (checked) handleChange('hdbPersonMetDuringVisit', 'NA');
                      else if (fields.hdbPersonMetDuringVisit === 'NA') handleChange('hdbPersonMetDuringVisit', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbPersonMetDuringVisitNA ? 'NA' : (fields.hdbPersonMetDuringVisit || '')}
                onChange={(e) => handleChange('hdbPersonMetDuringVisit', e.target.value)}
                disabled={isReadOnly || !!fields.hdbPersonMetDuringVisitNA}
                placeholder="Enter contact person name and mobile number met at site..."
                rows={2}
                className={fields.hdbPersonMetDuringVisitNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Container 2: 5 Particulars (Color: Light Green #90EE90)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-green-300 shadow-sm"
        style={{ backgroundColor: '#90EE90' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-green-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-green-900 shadow-xs">
              2.2
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              5 Particulars
            </h3>
          </div>
          <span className="text-xs text-green-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-green-300/60 shadow-xs">
            5 Particulars Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 5.a Property Address Description */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    5.a PROPERTY ADDRESS DESCRIPTION
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbPropertyAddressDescriptionNA}
                    onChange={(checked) => {
                      handleChange('hdbPropertyAddressDescriptionNA', checked);
                      if (checked) handleChange('hdbPropertyAddressDescription', 'NA');
                      else if (fields.hdbPropertyAddressDescription === 'NA') handleChange('hdbPropertyAddressDescription', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbPropertyAddressDescriptionNA ? 'NA' : (fields.hdbPropertyAddressDescription || '')}
                onChange={(e) => handleChange('hdbPropertyAddressDescription', e.target.value)}
                disabled={isReadOnly || !!fields.hdbPropertyAddressDescriptionNA}
                placeholder="Enter detailed property address description..."
                rows={2}
                className={fields.hdbPropertyAddressDescriptionNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 5.b Plot No. & Sub Plot No. */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  5.b PLOT NO. & SUB PLOT NO.
                </span>
                <NaCheckbox
                  checked={!!fields.hdbPlotNoSubPlotNoNA}
                  onChange={(checked) => {
                    handleChange('hdbPlotNoSubPlotNoNA', checked);
                    if (checked) handleChange('hdbPlotNoSubPlotNo', 'NA');
                    else if (fields.hdbPlotNoSubPlotNo === 'NA') handleChange('hdbPlotNoSubPlotNo', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbPlotNoSubPlotNoNA ? 'NA' : (fields.hdbPlotNoSubPlotNo || '')}
              onChange={(e) => handleChange('hdbPlotNoSubPlotNo', e.target.value)}
              disabled={isReadOnly || !!fields.hdbPlotNoSubPlotNoNA}
              placeholder="Enter plot & sub-plot numbers..."
              rows={2}
              className={fields.hdbPlotNoSubPlotNoNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 5.c CTS Nos/S.Nos/Gat Nos./Hissa Nos/Khasra Nos. */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                  5.c CTS NOS / S.NOS / GAT NOS / HISSA NOS / KHASRA NOS
                </span>
                <NaCheckbox
                  checked={!!fields.hdbKhasraGatPlotNosNA}
                  onChange={(checked) => {
                    handleChange('hdbKhasraGatPlotNosNA', checked);
                    if (checked) handleChange('hdbKhasraGatPlotNos', 'NA');
                    else if (fields.hdbKhasraGatPlotNos === 'NA') handleChange('hdbKhasraGatPlotNos', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbKhasraGatPlotNosNA ? 'NA' : (fields.hdbKhasraGatPlotNos || '')}
              onChange={(e) => handleChange('hdbKhasraGatPlotNos', e.target.value)}
              disabled={isReadOnly || !!fields.hdbKhasraGatPlotNosNA}
              placeholder="Enter CTS / Survey / Gat / Hissa / Khasra numbers..."
              rows={2}
              className={fields.hdbKhasraGatPlotNosNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 5.d Village/ Town/ Location */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                5.d VILLAGE / TOWN / LOCATION
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbVillageTownLocation || ''}
              onChange={(e) => handleChange('hdbVillageTownLocation', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter village / town / location..."
            />
          </Field>

          {/* 5.e Taluka */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">5.e TALUKA / TEHSIL</span>
                <NaCheckbox
                  checked={!!fields.hdbTalukaNA}
                  onChange={(checked) => {
                    handleChange('hdbTalukaNA', checked);
                    if (checked) handleChange('hdbTaluka', 'NA');
                    else if (fields.hdbTaluka === 'NA') handleChange('hdbTaluka', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbTalukaNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbTalukaNA ? 'NA' : (fields.hdbTaluka || '')}
              onChange={(e) => handleChange('hdbTaluka', e.target.value)}
              disabled={isReadOnly || !!fields.hdbTalukaNA}
              placeholder="Enter taluka / tehsil..."
            />
          </Field>

          {/* 5.f District (Mandatory) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                5.f DISTRICT <span className="text-red-700">*</span>
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbDistrict || 'Khordha'}
              customValue={fields.hdbDistrictCustom || ''}
              onChange={(val) => handleChange('hdbDistrict', val)}
              onCustomChange={(val) => handleChange('hdbDistrictCustom', val)}
              options={ODISHA_DISTRICTS.map((d) => ({ value: d, label: d }))}
              disabled={isReadOnly}
              placeholder="Select district..."
            />
          </Field>

          {/* 5.g State (Mandatory) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                5.g STATE <span className="text-red-700">*</span>
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbState || 'Odisha'}
              customValue={fields.hdbStateCustom || ''}
              onChange={(val) => handleChange('hdbState', val)}
              onCustomChange={(val) => handleChange('hdbStateCustom', val)}
              options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
              disabled={isReadOnly}
              placeholder="Select state..."
            />
          </Field>

          {/* 5.h Pin Code (Mandatory) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                5.h PIN CODE (MANDATORY) <span className="text-red-700">*</span>
              </span>
            }
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbPinCode || ''}
              onChange={(e) => handleChange('hdbPinCode', e.target.value.replace(/\D/g, ''))}
              disabled={isReadOnly}
              placeholder="Enter 6-digit PIN code (e.g. 751001)..."
            />
          </Field>

          {/* 5.I GPS Coordinates (Mandatory) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  5.I GPS COORDINATES (MANDATORY) <span className="text-red-700">*</span>
                </span>
                <NaCheckbox
                  checked={!!fields.hdbGpsCoordinatesNA}
                  onChange={(checked) => {
                    handleChange('hdbGpsCoordinatesNA', checked);
                    if (checked) handleChange('hdbGpsCoordinates', 'NA');
                    else if (fields.hdbGpsCoordinates === 'NA') handleChange('hdbGpsCoordinates', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbGpsCoordinatesNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbGpsCoordinatesNA ? 'NA' : (fields.hdbGpsCoordinates || '')}
              onChange={(e) => handleChange('hdbGpsCoordinates', e.target.value)}
              disabled={isReadOnly || !!fields.hdbGpsCoordinatesNA}
              placeholder="e.g. 20.2961° N, 85.8245° E"
            />
          </Field>

          {/* 5.i Complete Property Address as per System */}
          <div className="md:col-span-2">
            <Field
              label={
                <span className="font-semibold text-gray-900">
                  5.i COMPLETE PROPERTY ADDRESS AS PER SYSTEM
                </span>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbSystemPropertyAddress || ''}
                onChange={(e) => handleChange('hdbSystemPropertyAddress', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter complete property address as per system / TRF..."
                rows={2}
                className="bg-white"
              />
            </Field>
          </div>

          {/* 5.J Nearest Landmark */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">5.J NEAREST LANDMARK</span>
                  <NaCheckbox
                    checked={!!fields.hdbNearestLandmarkNA}
                    onChange={(checked) => {
                      handleChange('hdbNearestLandmarkNA', checked);
                      if (checked) handleChange('hdbNearestLandmark', 'NA');
                      else if (fields.hdbNearestLandmark === 'NA') handleChange('hdbNearestLandmark', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbNearestLandmarkNA ? 'NA' : (fields.hdbNearestLandmark || '')}
                onChange={(e) => handleChange('hdbNearestLandmark', e.target.value)}
                disabled={isReadOnly || !!fields.hdbNearestLandmarkNA}
                placeholder="Enter nearest prominent landmark..."
                rows={2}
                className={fields.hdbNearestLandmarkNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 5.K Name on the Society Name Board */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  5.K NAME ON THE SOCIETY NAME BOARD
                </span>
                <NaCheckbox
                  checked={!!fields.hdbSocietyNameBoardNA}
                  onChange={(checked) => {
                    handleChange('hdbSocietyNameBoardNA', checked);
                    if (checked) handleChange('hdbSocietyNameBoard', 'NA');
                    else if (fields.hdbSocietyNameBoard === 'NA') handleChange('hdbSocietyNameBoard', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbSocietyNameBoardNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbSocietyNameBoardNA ? 'NA' : (fields.hdbSocietyNameBoard || '')}
              onChange={(e) => handleChange('hdbSocietyNameBoard', e.target.value)}
              disabled={isReadOnly || !!fields.hdbSocietyNameBoardNA}
              placeholder="Enter name on society board..."
            />
          </Field>

          {/* 5.L Name on the Property's Door/Entrance */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  5.L NAME ON THE PROPERTY&apos;S DOOR / ENTRANCE
                </span>
                <NaCheckbox
                  checked={!!fields.hdbDoorEntranceNameNA}
                  onChange={(checked) => {
                    handleChange('hdbDoorEntranceNameNA', checked);
                    if (checked) handleChange('hdbDoorEntranceName', 'NA');
                    else if (fields.hdbDoorEntranceName === 'NA') handleChange('hdbDoorEntranceName', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbDoorEntranceNameNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbDoorEntranceNameNA ? 'NA' : (fields.hdbDoorEntranceName || '')}
              onChange={(e) => handleChange('hdbDoorEntranceName', e.target.value)}
              disabled={isReadOnly || !!fields.hdbDoorEntranceNameNA}
              placeholder="Enter name on door / entrance plate..."
            />
          </Field>

          {/* 5.M Name ,Address and contact No. of Neighbor / Treasurer / Secretary / Chairman */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    5.M NAME, ADDRESS & CONTACT NO. OF NEIGHBOR / TREASURER / SECRETARY / CHAIRMAN WHO CONFIRMED OWNER NAME & EXISTENCE
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbNeighborConfirmationDetailsNA}
                    onChange={(checked) => {
                      handleChange('hdbNeighborConfirmationDetailsNA', checked);
                      if (checked) handleChange('hdbNeighborConfirmationDetails', 'NA');
                      else if (fields.hdbNeighborConfirmationDetails === 'NA') handleChange('hdbNeighborConfirmationDetails', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbNeighborConfirmationDetailsNA ? 'NA' : (fields.hdbNeighborConfirmationDetails || '')}
                onChange={(e) => handleChange('hdbNeighborConfirmationDetails', e.target.value)}
                disabled={isReadOnly || !!fields.hdbNeighborConfirmationDetailsNA}
                placeholder="Enter neighbor or society official details (name, contact, address/flat no.)..."
                rows={2}
                className={fields.hdbNeighborConfirmationDetailsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 5.N Property Address Matches as per Site & Property Documents */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                5.N PROPERTY ADDRESS MATCHES AS PER SITE & PROPERTY DOCUMENTS (***MANDATORY) <span className="text-red-700">*</span>
              </span>
            }
          >
            <YesNoRadio
              name="hdbAddressMatchesSiteDocs"
              value={fields.hdbAddressMatchesSiteDocs || 'Yes'}
              onChange={(val) => handleChange('hdbAddressMatchesSiteDocs', val)}
              disabled={isReadOnly}
            />
          </Field>

          {/* 5.O Property Enlisted For Any Negative Authority Action / Negative Area */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                5.O PROPERTY ENLISTED FOR NEGATIVE AUTHORITY ACTION / NEGATIVE AREA (***MANDATORY) <span className="text-red-700">*</span>
              </span>
            }
          >
            <YesNoRadio
              name="hdbNegativeAreaAction"
              value={fields.hdbNegativeAreaAction || 'No'}
              onChange={(val) => handleChange('hdbNegativeAreaAction', val)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Container 3: 6 Particulars (Color: Light Peach #FFDAB9)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-amber-300 shadow-sm"
        style={{ backgroundColor: '#FFDAB9' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-amber-900 shadow-xs">
              2.3
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              6 Particulars
            </h3>
          </div>
          <span className="text-xs text-amber-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-amber-300/60 shadow-xs">
            6 Particulars Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 6.a Nearest Government offices from property */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  6.a NEAREST GOVERNMENT OFFICES FROM PROPERTY
                </span>
                <NaCheckbox
                  checked={!!fields.hdbNearestGovtOfficesNA}
                  onChange={(checked) => {
                    handleChange('hdbNearestGovtOfficesNA', checked);
                    if (checked) handleChange('hdbNearestGovtOffices', 'NA');
                    else if (fields.hdbNearestGovtOffices === 'NA') handleChange('hdbNearestGovtOffices', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbNearestGovtOfficesNA ? 'NA' : (fields.hdbNearestGovtOffices || '')}
              onChange={(e) => handleChange('hdbNearestGovtOffices', e.target.value)}
              disabled={isReadOnly || !!fields.hdbNearestGovtOfficesNA}
              placeholder="e.g. Tehsil Office (3.5 km)..."
              rows={2}
              className={fields.hdbNearestGovtOfficesNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 6.b Nearest Railway Station from property */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  6.b NEAREST RAILWAY STATION FROM PROPERTY
                </span>
                <NaCheckbox
                  checked={!!fields.hdbNearestRailwayStationNA}
                  onChange={(checked) => {
                    handleChange('hdbNearestRailwayStationNA', checked);
                    if (checked) handleChange('hdbNearestRailwayStation', 'NA');
                    else if (fields.hdbNearestRailwayStation === 'NA') handleChange('hdbNearestRailwayStation', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbNearestRailwayStationNA ? 'NA' : (fields.hdbNearestRailwayStation || '')}
              onChange={(e) => handleChange('hdbNearestRailwayStation', e.target.value)}
              disabled={isReadOnly || !!fields.hdbNearestRailwayStationNA}
              placeholder="e.g. Bhubaneswar Railway Station (4.2 km)..."
              rows={2}
              className={fields.hdbNearestRailwayStationNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 6.c Nearest Bus Station from property */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  6.c NEAREST BUS STATION FROM PROPERTY
                </span>
                <NaCheckbox
                  checked={!!fields.hdbNearestBusStationNA}
                  onChange={(checked) => {
                    handleChange('hdbNearestBusStationNA', checked);
                    if (checked) handleChange('hdbNearestBusStation', 'NA');
                    else if (fields.hdbNearestBusStation === 'NA') handleChange('hdbNearestBusStation', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbNearestBusStationNA ? 'NA' : (fields.hdbNearestBusStation || '')}
              onChange={(e) => handleChange('hdbNearestBusStation', e.target.value)}
              disabled={isReadOnly || !!fields.hdbNearestBusStationNA}
              placeholder="e.g. Baramunda Bus Terminal (5.0 km)..."
              rows={2}
              className={fields.hdbNearestBusStationNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 6.d Nearest Airport Station from property */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  6.d NEAREST AIRPORT STATION FROM PROPERTY
                </span>
                <NaCheckbox
                  checked={!!fields.hdbNearestAirportNA}
                  onChange={(checked) => {
                    handleChange('hdbNearestAirportNA', checked);
                    if (checked) handleChange('hdbNearestAirport', 'NA');
                    else if (fields.hdbNearestAirport === 'NA') handleChange('hdbNearestAirport', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbNearestAirportNA ? 'NA' : (fields.hdbNearestAirport || '')}
              onChange={(e) => handleChange('hdbNearestAirport', e.target.value)}
              disabled={isReadOnly || !!fields.hdbNearestAirportNA}
              placeholder="e.g. Biju Patnaik International Airport (7.5 km)..."
              rows={2}
              className={fields.hdbNearestAirportNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 6.e Nearest National Highway from property */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    6.e NEAREST NATIONAL HIGHWAY FROM PROPERTY
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbNearestNationalHighwayNA}
                    onChange={(checked) => {
                      handleChange('hdbNearestNationalHighwayNA', checked);
                      if (checked) handleChange('hdbNearestNationalHighway', 'NA');
                      else if (fields.hdbNearestNationalHighway === 'NA') handleChange('hdbNearestNationalHighway', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbNearestNationalHighwayNA ? 'NA' : (fields.hdbNearestNationalHighway || '')}
                onChange={(e) => handleChange('hdbNearestNationalHighway', e.target.value)}
                disabled={isReadOnly || !!fields.hdbNearestNationalHighwayNA}
                placeholder="e.g. NH-16 (1.2 km)..."
                rows={2}
                className={fields.hdbNearestNationalHighwayNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 6.f Community centers like Hotels,Restaurants,Theaters, Auditoriums,Clubs, Lakes,Ponds etc Approximate Distance from Property */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    6.f COMMUNITY CENTERS (HOTELS, RESTAURANTS, THEATERS, AUDITORIUMS, CLUBS, LAKES, PONDS ETC.) APPROXIMATE DISTANCE
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbCommunityCentersDistanceNA}
                    onChange={(checked) => {
                      handleChange('hdbCommunityCentersDistanceNA', checked);
                      if (checked) handleChange('hdbCommunityCentersDistance', 'NA');
                      else if (fields.hdbCommunityCentersDistance === 'NA') handleChange('hdbCommunityCentersDistance', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbCommunityCentersDistanceNA ? 'NA' : (fields.hdbCommunityCentersDistance || '')}
                onChange={(e) => handleChange('hdbCommunityCentersDistance', e.target.value)}
                disabled={isReadOnly || !!fields.hdbCommunityCentersDistanceNA}
                placeholder="e.g. Hotels & Restaurants (0.8 km), Community Hall (1.5 km)..."
                rows={2}
                className={fields.hdbCommunityCentersDistanceNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 6.g School, College Hospital, Market etc Approximate Distance from Property */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    6.g SCHOOL, COLLEGE, HOSPITAL, MARKET ETC. APPROXIMATE DISTANCE FROM PROPERTY
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbSchoolCollegeHospitalDistanceNA}
                    onChange={(checked) => {
                      handleChange('hdbSchoolCollegeHospitalDistanceNA', checked);
                      if (checked) handleChange('hdbSchoolCollegeHospitalDistance', 'NA');
                      else if (fields.hdbSchoolCollegeHospitalDistance === 'NA') handleChange('hdbSchoolCollegeHospitalDistance', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbSchoolCollegeHospitalDistanceNA ? 'NA' : (fields.hdbSchoolCollegeHospitalDistance || '')}
                onChange={(e) => handleChange('hdbSchoolCollegeHospitalDistance', e.target.value)}
                disabled={isReadOnly || !!fields.hdbSchoolCollegeHospitalDistanceNA}
                placeholder="e.g. School (1.0 km), College (2.5 km), Hospital (1.8 km), Market (0.5 km)..."
                rows={2}
                className={fields.hdbSchoolCollegeHospitalDistanceNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 6.h Within Munical Limits */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                6.h WITHIN MUNICIPAL LIMITS
              </span>
            }
          >
            <YesNoRadio
              name="hdbWithinMunicipalLimits"
              value={fields.hdbWithinMunicipalLimits || 'Yes'}
              onChange={(val) => handleChange('hdbWithinMunicipalLimits', val)}
              disabled={isReadOnly}
            />
          </Field>

          {/* 6.i Details of Local Auhtority */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  6.i DETAILS OF LOCAL AUTHORITY
                </span>
                <NaCheckbox
                  checked={!!fields.hdbDetailsOfLocalAuthorityNA}
                  onChange={(checked) => {
                    handleChange('hdbDetailsOfLocalAuthorityNA', checked);
                    if (checked) handleChange('hdbDetailsOfLocalAuthority', 'NA');
                    else if (fields.hdbDetailsOfLocalAuthority === 'NA') handleChange('hdbDetailsOfLocalAuthority', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbDetailsOfLocalAuthorityNA ? 'NA' : (fields.hdbDetailsOfLocalAuthority || '')}
              onChange={(e) => handleChange('hdbDetailsOfLocalAuthority', e.target.value)}
              disabled={isReadOnly || !!fields.hdbDetailsOfLocalAuthorityNA}
              placeholder="e.g. Bhubaneswar Municipal Corporation (BMC)..."
              rows={2}
              className={fields.hdbDetailsOfLocalAuthorityNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Document Details ────────────────────────────────────────────

export function DocumentDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: 7 Particulars (Color: Light Lavender #E6E6FA) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-purple-200/90 shadow-sm"
        style={{ backgroundColor: '#E6E6FA' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-300/70 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-purple-900 shadow-xs">
              3
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              7 Particulars
            </h3>
          </div>
          <span className="text-xs text-purple-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-purple-300/60 shadow-xs">
            7 Particulars Container
          </span>
        </div>

        <div className="space-y-3.5">
          {/* 7.a Ownership Documents- Sale deed, ROR, and sketch map */}
          <DocumentUploadField
            label="7.a Ownership Documents- Sale deed, ROR, and sketch map"
            checked={!!fields.hdbDocOwnershipChecked}
            onCheckedChange={(val) => handleChange('hdbDocOwnershipChecked', val)}
            hasNa={false}
            fileName={fields.hdbDocOwnershipFileName}
            onFileChange={(file) => {
              handleChange('hdbDocOwnershipFileName', file.name);
              handleChange('hdbDocOwnershipFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocOwnershipFileName', '');
              handleChange('hdbDocOwnershipFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* 7.b Non Agriculture Order/Diversion Order */}
          <DocumentUploadField
            label="7.b Non Agriculture Order/Diversion Order"
            checked={!!fields.hdbDocNaOrderChecked}
            onCheckedChange={(val) => handleChange('hdbDocNaOrderChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocNaOrderNA}
            onNaChange={(val) => {
              handleChange('hdbDocNaOrderNA', val);
              if (val) {
                handleChange('hdbDocNaOrderChecked', false);
              }
            }}
            fileName={fields.hdbDocNaOrderFileName}
            onFileChange={(file) => {
              handleChange('hdbDocNaOrderFileName', file.name);
              handleChange('hdbDocNaOrderFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocNaOrderFileName', '');
              handleChange('hdbDocNaOrderFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* 7.c Commencement Certificate/ Construction Permission/ Building Permission */}
          <DocumentUploadField
            label="7.c Commencement Certificate/ Construction Permission/ Building Permission"
            checked={!!fields.hdbDocCommencementCertChecked}
            onCheckedChange={(val) => handleChange('hdbDocCommencementCertChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocCommencementCertNA}
            onNaChange={(val) => {
              handleChange('hdbDocCommencementCertNA', val);
              if (val) {
                handleChange('hdbDocCommencementCertChecked', false);
              }
            }}
            fileName={fields.hdbDocCommencementCertFileName}
            onFileChange={(file) => {
              handleChange('hdbDocCommencementCertFileName', file.name);
              handleChange('hdbDocCommencementCertFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocCommencementCertFileName', '');
              handleChange('hdbDocCommencementCertFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* 7.d SANCTIONED PLANS */}
          <DocumentUploadField
            label="7.d SANCTIONED PLANS"
            checked={!!fields.hdbDocSanctionedPlansChecked}
            onCheckedChange={(val) => handleChange('hdbDocSanctionedPlansChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocSanctionedPlansNA}
            onNaChange={(val) => {
              handleChange('hdbDocSanctionedPlansNA', val);
              if (val) {
                handleChange('hdbDocSanctionedPlansChecked', false);
              }
            }}
            fileName={fields.hdbDocSanctionedPlansFileName}
            onFileChange={(file) => {
              handleChange('hdbDocSanctionedPlansFileName', file.name);
              handleChange('hdbDocSanctionedPlansFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocSanctionedPlansFileName', '');
              handleChange('hdbDocSanctionedPlansFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* 7.e Occupancy Certificate/ Completion Certificate */}
          <DocumentUploadField
            label="7.e Occupancy Certificate/ Completion Certificate"
            checked={!!fields.hdbDocOccupancyCertChecked}
            onCheckedChange={(val) => handleChange('hdbDocOccupancyCertChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocOccupancyCertNA}
            onNaChange={(val) => {
              handleChange('hdbDocOccupancyCertNA', val);
              if (val) {
                handleChange('hdbDocOccupancyCertChecked', false);
              }
            }}
            fileName={fields.hdbDocOccupancyCertFileName}
            onFileChange={(file) => {
              handleChange('hdbDocOccupancyCertFileName', file.name);
              handleChange('hdbDocOccupancyCertFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocOccupancyCertFileName', '');
              handleChange('hdbDocOccupancyCertFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* Regularisation Certificate / Order */}
          <DocumentUploadField
            label="Regularisation Certificate / Order"
            checked={!!fields.hdbDocRegularisationOrderChecked}
            onCheckedChange={(val) => handleChange('hdbDocRegularisationOrderChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocRegularisationOrderNA}
            onNaChange={(val) => {
              handleChange('hdbDocRegularisationOrderNA', val);
              if (val) {
                handleChange('hdbDocRegularisationOrderChecked', false);
              }
            }}
            fileName={fields.hdbDocRegularisationOrderFileName}
            onFileChange={(file) => {
              handleChange('hdbDocRegularisationOrderFileName', file.name);
              handleChange('hdbDocRegularisationOrderFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocRegularisationOrderFileName', '');
              handleChange('hdbDocRegularisationOrderFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* 7.g Share Certificate */}
          <DocumentUploadField
            label="7.g Share Certificate"
            checked={!!fields.hdbDocShareCertChecked}
            onCheckedChange={(val) => handleChange('hdbDocShareCertChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocShareCertNA}
            onNaChange={(val) => {
              handleChange('hdbDocShareCertNA', val);
              if (val) {
                handleChange('hdbDocShareCertChecked', false);
              }
            }}
            fileName={fields.hdbDocShareCertFileName}
            onFileChange={(file) => {
              handleChange('hdbDocShareCertFileName', file.name);
              handleChange('hdbDocShareCertFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocShareCertFileName', '');
              handleChange('hdbDocShareCertFile', '');
            }}
            disabled={isReadOnly}
          />

          {/* 7.h Latest Property Tax Paid Bill */}
          <DocumentUploadField
            label="7.h Latest Property Tax Paid Bill"
            checked={!!fields.hdbDocTaxReceiptChecked}
            onCheckedChange={(val) => handleChange('hdbDocTaxReceiptChecked', val)}
            hasNa={true}
            na={!!fields.hdbDocTaxReceiptNA}
            onNaChange={(val) => {
              handleChange('hdbDocTaxReceiptNA', val);
              if (val) {
                handleChange('hdbDocTaxReceiptChecked', false);
              }
            }}
            fileName={fields.hdbDocTaxReceiptFileName}
            onFileChange={(file) => {
              handleChange('hdbDocTaxReceiptFileName', file.name);
              handleChange('hdbDocTaxReceiptFile', file.url || '');
            }}
            onFileRemove={() => {
              handleChange('hdbDocTaxReceiptFileName', '');
              handleChange('hdbDocTaxReceiptFile', '');
            }}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: Boundaries ──────────────────────────────────────────────────

export function BoundariesSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  const autoMatchingCount = useMemo(() => {
    const boundaries = [
      fields.hdbBoundaryEast,
      fields.hdbBoundaryWest,
      fields.hdbBoundaryNorth,
      fields.hdbBoundarySouth,
    ];
    const filledCount = boundaries.filter(
      (b) => b && b.trim() && b.trim().toUpperCase() !== 'NA'
    ).length;
    return filledCount > 0 ? String(filledCount) : '4';
  }, [
    fields.hdbBoundaryEast,
    fields.hdbBoundaryWest,
    fields.hdbBoundaryNorth,
    fields.hdbBoundarySouth,
  ]);

  const effectiveMatchingCount = fields.hdbBoundariesMatchingEditOn
    ? (fields.hdbBoundariesMatchingCount ?? '4')
    : (fields.hdbBoundariesMatchingCount || autoMatchingCount);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Container: 8 Direction (Color: Light Mint #F5FFFA) */}
      <div
        className="rounded-xl p-5 space-y-5 border border-emerald-200/80 shadow-sm"
        style={{ backgroundColor: '#F5FFFA' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-300/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-emerald-900 shadow-xs">
              4
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              8 Direction
            </h3>
          </div>
          <span className="text-xs text-emerald-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-emerald-300/60 shadow-xs">
            8 Direction Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 8.a East */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                8.a EAST
              </span>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbBoundaryEast || ''}
              onChange={(e) => handleChange('hdbBoundaryEast', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter East boundary..."
              rows={2}
              className="bg-white"
            />
          </Field>

          {/* 8.b West */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                8.b WEST
              </span>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbBoundaryWest || ''}
              onChange={(e) => handleChange('hdbBoundaryWest', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter West boundary..."
              rows={2}
              className="bg-white"
            />
          </Field>

          {/* 8.c North */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                8.c NORTH
              </span>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbBoundaryNorth || ''}
              onChange={(e) => handleChange('hdbBoundaryNorth', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter North boundary..."
              rows={2}
              className="bg-white"
            />
          </Field>

          {/* 8.d South */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                8.d SOUTH
              </span>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbBoundarySouth || ''}
              onChange={(e) => handleChange('hdbBoundarySouth', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter South boundary..."
              rows={2}
              className="bg-white"
            />
          </Field>

          {/* 8.e Number of Boundaries Matching: */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    8.e NUMBER OF BOUNDARIES MATCHING:
                  </span>
                  <EditSwitch
                    checked={!!fields.hdbBoundariesMatchingEditOn}
                    onChange={(checked) => {
                      handleChange('hdbBoundariesMatchingEditOn', checked);
                      if (!checked) {
                        handleChange('hdbBoundariesMatchingCount', autoMatchingCount);
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="relative">
                <select
                  className={`${inputCls} font-medium pr-32 ${
                    !fields.hdbBoundariesMatchingEditOn
                      ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                      : 'bg-white'
                  }`}
                  value={effectiveMatchingCount}
                  onChange={(e) => handleChange('hdbBoundariesMatchingCount', e.target.value)}
                  disabled={isReadOnly || !fields.hdbBoundariesMatchingEditOn}
                >
                  <option value="4">4 - All Boundaries Matching</option>
                  <option value="3">3 - Three Boundaries Matching</option>
                  <option value="2">2 - Two Boundaries Matching</option>
                  <option value="1">1 - One Boundary Matching</option>
                  <option value="0">0 - None Matching</option>
                </select>
                {!fields.hdbBoundariesMatchingEditOn && (
                  <div className="absolute right-8 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                    <Lock className="w-3 h-3 text-emerald-700" /> Auto-calculated
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

// ─── Section 5: Technical Details ───────────────────────────────────────────

export function TechnicalDetailsSection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (key: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // ── Auto-calculations for Land/Plot ───────────────────────────────────────
  const autoRateAdoptedLand = useMemo(() => {
    return fields.hdbMarketRateLand || fields.hdbGovtGuidelineRateLand || '';
  }, [fields.hdbMarketRateLand, fields.hdbGovtGuidelineRateLand]);

  const effectiveRateAdoptedLand = fields.hdbRateAdoptedLandEditOn
    ? (fields.hdbRateAdoptedLand ?? '')
    : (fields.hdbRateAdoptedLand || autoRateAdoptedLand);

  const autoFmvLand = useMemo(() => {
    const area = parseFloat(fields.hdbLandAreaConsidered || fields.hdbLandPlotArea || '0') || 0;
    const rate = parseFloat(effectiveRateAdoptedLand || '0') || 0;
    const fmv = area * rate;
    return fmv > 0 ? String(Math.round(fmv)) : '';
  }, [fields.hdbLandAreaConsidered, fields.hdbLandPlotArea, effectiveRateAdoptedLand]);

  const effectiveFmvLand = fields.hdbFairMarketValueLandEditOn
    ? (fields.hdbFairMarketValueLand ?? '')
    : (fields.hdbFairMarketValueLand || autoFmvLand);

  // ── Auto-calculations for Construction / Apartments ────────────────────────
  const autoResidualAge = useMemo(() => {
    if (!fields.hdbCompletionDate) return '50 Years';
    const compYear = new Date(fields.hdbCompletionDate).getFullYear();
    if (isNaN(compYear)) return '50 Years';
    const currYear = new Date().getFullYear();
    const age = Math.max(0, currYear - compYear);
    const residual = Math.max(0, 60 - age);
    return `${residual} Years`;
  }, [fields.hdbCompletionDate]);

  const effectiveResidualAge = fields.hdbResidualAgeEditOn
    ? (fields.hdbResidualAge ?? '')
    : (fields.hdbResidualAge || autoResidualAge);

  const autoFinalBuildingArea = useMemo(() => {
    return fields.hdbBuiltUpAreaMeasured || fields.hdbCarpetAreaTotal || fields.hdbCarpetAreaG1 || '';
  }, [fields.hdbBuiltUpAreaMeasured, fields.hdbCarpetAreaTotal, fields.hdbCarpetAreaG1]);

  const effectiveFinalBuildingArea = fields.hdbFinalBuildingAreaConsideredEditOn
    ? (fields.hdbFinalBuildingAreaConsidered ?? '')
    : (fields.hdbFinalBuildingAreaConsidered || autoFinalBuildingArea);

  const autoRateAdoptedBuilding = useMemo(() => {
    return fields.hdbMarketRateBuilding || fields.hdbGovtGuidelineRateBuilding || '';
  }, [fields.hdbMarketRateBuilding, fields.hdbGovtGuidelineRateBuilding]);

  const effectiveRateAdoptedBuilding = fields.hdbRateAdoptedBuildingEditOn
    ? (fields.hdbRateAdoptedBuilding ?? '')
    : (fields.hdbRateAdoptedBuilding || autoRateAdoptedBuilding);

  const autoFmvBuilding = useMemo(() => {
    const area = parseFloat(effectiveFinalBuildingArea || '0') || 0;
    const rate = parseFloat(effectiveRateAdoptedBuilding || '0') || 0;
    const depPct = fields.hdbDepreciationPctNA
      ? 0
      : parseFloat(fields.hdbDepreciationPct || '0') || 0;
    const base = area * rate;
    const fmv = base * (1 - depPct / 100);
    return fmv > 0 ? String(Math.round(fmv)) : '';
  }, [effectiveFinalBuildingArea, effectiveRateAdoptedBuilding, fields.hdbDepreciationPct, fields.hdbDepreciationPctNA]);

  const effectiveFmvBuilding = fields.hdbFairMarketValueBuildingEditOn
    ? (fields.hdbFairMarketValueBuilding ?? '')
    : (fields.hdbFairMarketValueBuilding || autoFmvBuilding);

  const autoDistressBuilding = useMemo(() => {
    const fmv = parseFloat(effectiveFmvBuilding || '0') || 0;
    return fmv > 0 ? String(Math.round(fmv * 0.85)) : '';
  }, [effectiveFmvBuilding]);

  const effectiveDistressBuilding = fields.hdbDistressValueBuildingEditOn
    ? (fields.hdbDistressValueBuilding ?? '')
    : (fields.hdbDistressValueBuilding || autoDistressBuilding);

  const autoInsurableValue = useMemo(() => {
    const area = parseFloat(effectiveFinalBuildingArea || '0') || 0;
    const rate = parseFloat(effectiveRateAdoptedBuilding || '0') || 0;
    const ins = area * rate * 0.9;
    return ins > 0 ? String(Math.round(ins)) : '';
  }, [effectiveFinalBuildingArea, effectiveRateAdoptedBuilding]);

  const effectiveInsurableValue = fields.hdbInsurableValueEditOn
    ? (fields.hdbInsurableValue ?? '')
    : (fields.hdbInsurableValue || autoInsurableValue);

  return (
    <div className="animate-fade-in space-y-8">
      {/* ────────────────────────────────────────────────────────────────────────
          Container 1: 9 Basic Technical Info (Color: Light Cyan #E0FFFF)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-cyan-300 shadow-sm"
        style={{ backgroundColor: '#E0FFFF' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-cyan-900 shadow-xs">
              5.1
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              9 Basic Technical Info
            </h3>
          </div>
          <span className="text-xs text-cyan-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-cyan-300/60 shadow-xs">
            9 Basic Technical Info Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 9 Property type */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9 PROPERTY TYPE
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbPropertyType || 'Residential Independent House'}
              customValue={fields.hdbPropertyTypeCustom || ''}
              onChange={(val) => handleChange('hdbPropertyType', val)}
              onCustomChange={(val) => handleChange('hdbPropertyTypeCustom', val)}
              options={[
                { value: 'Residential Independent House', label: 'Residential Independent House' },
                { value: 'Residential Flat / Apartment', label: 'Residential Flat / Apartment' },
                { value: 'Commercial Building / Shop', label: 'Commercial Building / Shop' },
                { value: 'Plot / Land', label: 'Plot / Land' },
                { value: 'Industrial Property', label: 'Industrial Property' },
              ]}
              disabled={isReadOnly}
              placeholder="Select property type..."
            />
          </Field>

          {/* Valuation Methodology */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                VALUATION METHODOLOGY
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbValuationMethodology || 'Land & Building Method / Cost Approach'}
              customValue={fields.hdbValuationMethodologyCustom || ''}
              onChange={(val) => handleChange('hdbValuationMethodology', val)}
              onCustomChange={(val) => handleChange('hdbValuationMethodologyCustom', val)}
              options={[
                { value: 'Land & Building Method / Cost Approach', label: 'Land & Building Method / Cost Approach' },
                { value: 'Sales Comparison / Market Approach', label: 'Sales Comparison / Market Approach' },
                { value: 'Rent Capitalization Method / Income Approach', label: 'Rent Capitalization Method / Income Approach' },
                { value: 'Residual Method', label: 'Residual Method' },
              ]}
              disabled={isReadOnly}
              placeholder="Select valuation methodology..."
            />
          </Field>

          {/* Present Occupancy */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                PRESENT OCCUPANCY
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbPresentOccupancy || 'Self Occupied'}
              customValue={fields.hdbPresentOccupancyCustom || ''}
              onChange={(val) => handleChange('hdbPresentOccupancy', val)}
              onCustomChange={(val) => handleChange('hdbPresentOccupancyCustom', val)}
              options={[
                { value: 'Self Occupied', label: 'Self Occupied' },
                { value: 'Rented', label: 'Rented' },
                { value: 'Vacant', label: 'Vacant' },
                { value: 'Partially Self Occupied & Partially Rented', label: 'Partially Self Occupied & Partially Rented' },
              ]}
              disabled={isReadOnly}
              placeholder="Select present occupancy..."
            />
          </Field>

          {/* If not Occupied by Owner */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  IF NOT OCCUPIED BY OWNER
                </span>
                <NaCheckbox
                  checked={!!fields.hdbIfNotOccupiedByOwnerNA}
                  onChange={(checked) => {
                    handleChange('hdbIfNotOccupiedByOwnerNA', checked);
                    if (checked) handleChange('hdbIfNotOccupiedByOwner', 'NA');
                    else if (fields.hdbIfNotOccupiedByOwner === 'NA') handleChange('hdbIfNotOccupiedByOwner', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbIfNotOccupiedByOwnerNA ? 'NA' : (fields.hdbIfNotOccupiedByOwner || '')}
              onChange={(e) => handleChange('hdbIfNotOccupiedByOwner', e.target.value)}
              disabled={isReadOnly || !!fields.hdbIfNotOccupiedByOwnerNA}
              placeholder="State reason or tenancy details if not owner occupied..."
              rows={2}
              className={fields.hdbIfNotOccupiedByOwnerNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 1 (Occupant Info 1) */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    1 (OCCUPANT INFO 1)
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbOccupantInfo1NA}
                    onChange={(checked) => {
                      handleChange('hdbOccupantInfo1NA', checked);
                      if (checked) handleChange('hdbOccupantInfo1', 'NA');
                      else if (fields.hdbOccupantInfo1 === 'NA') handleChange('hdbOccupantInfo1', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbOccupantInfo1NA ? 'NA' : (fields.hdbOccupantInfo1 || '')}
                onChange={(e) => handleChange('hdbOccupantInfo1', e.target.value)}
                disabled={isReadOnly || !!fields.hdbOccupantInfo1NA}
                placeholder="Occupant 1 Name, Floor/Flat, Contact details..."
                rows={2}
                className={fields.hdbOccupantInfo1NA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 2 (Occupant Info 2) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  2 (OCCUPANT INFO 2)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbOccupantInfo2NA}
                  onChange={(checked) => {
                    handleChange('hdbOccupantInfo2NA', checked);
                    if (checked) handleChange('hdbOccupantInfo2', 'NA');
                    else if (fields.hdbOccupantInfo2 === 'NA') handleChange('hdbOccupantInfo2', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbOccupantInfo2NA ? 'NA' : (fields.hdbOccupantInfo2 || '')}
              onChange={(e) => handleChange('hdbOccupantInfo2', e.target.value)}
              disabled={isReadOnly || !!fields.hdbOccupantInfo2NA}
              placeholder="Occupant 2 details (if applicable)..."
              rows={2}
              className={fields.hdbOccupantInfo2NA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>

          {/* 3 (Occupant Info 3) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  3 (OCCUPANT INFO 3)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbOccupantInfo3NA}
                  onChange={(checked) => {
                    handleChange('hdbOccupantInfo3NA', checked);
                    if (checked) handleChange('hdbOccupantInfo3', 'NA');
                    else if (fields.hdbOccupantInfo3 === 'NA') handleChange('hdbOccupantInfo3', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbOccupantInfo3NA ? 'NA' : (fields.hdbOccupantInfo3 || '')}
              onChange={(e) => handleChange('hdbOccupantInfo3', e.target.value)}
              disabled={isReadOnly || !!fields.hdbOccupantInfo3NA}
              placeholder="Occupant 3 details (if applicable)..."
              rows={2}
              className={fields.hdbOccupantInfo3NA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Container 2: 9.a LAND/PLOT- ( Applicable in Plot + Construction cases only) (Color: Light Pink #FFB6C1)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-pink-300 shadow-sm"
        style={{ backgroundColor: '#FFB6C1' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-pink-900 shadow-xs">
              5.2
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              9.a LAND/PLOT - (Applicable in Plot + Construction cases only)
            </h3>
          </div>
          <span className="text-xs text-pink-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-pink-300/60 shadow-xs">
            9.a LAND/PLOT Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 9.a.1 Area of Land /Plot */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.1 AREA OF LAND / PLOT (IN SQFT)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbLandPlotArea || ''}
              onChange={(e) => handleChange('hdbLandPlotArea', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter land area (e.g. 2400)..."
            />
          </Field>

          {/* 9.a.2 Plot Usage */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.2 PLOT USAGE
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbPlotUsage || 'Residential'}
              customValue={fields.hdbPlotUsageCustom || ''}
              onChange={(val) => handleChange('hdbPlotUsage', val)}
              onCustomChange={(val) => handleChange('hdbPlotUsageCustom', val)}
              options={[
                { value: 'Residential', label: 'Residential' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Mixed (Resi + Comm)', label: 'Mixed (Resi + Comm)' },
                { value: 'Industrial', label: 'Industrial' },
                { value: 'Agricultural', label: 'Agricultural' },
              ]}
              disabled={isReadOnly}
              placeholder="Select plot usage..."
            />
          </Field>

          {/* 9.a.3 Property Accessability */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.3 PROPERTY ACCESSABILITY
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbPropertyAccessibility || 'Good'}
              customValue={fields.hdbPropertyAccessibilityCustom || ''}
              onChange={(val) => handleChange('hdbPropertyAccessibility', val)}
              onCustomChange={(val) => handleChange('hdbPropertyAccessibilityCustom', val)}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor', label: 'Poor' },
                { value: 'Direct Road Access', label: 'Direct Road Access' },
                { value: 'Through Common Passage', label: 'Through Common Passage' },
              ]}
              disabled={isReadOnly}
              placeholder="Select accessibility..."
            />
          </Field>

          {/* 9.a.5 Margin Area/ Set Backs (ft) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.a.5 MARGIN AREA / SET BACKS (FT)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbMarginAreaSetBacksNA}
                  onChange={(checked) => {
                    handleChange('hdbMarginAreaSetBacksNA', checked);
                    if (checked) handleChange('hdbMarginAreaSetBacks', 'NA');
                    else if (fields.hdbMarginAreaSetBacks === 'NA') handleChange('hdbMarginAreaSetBacks', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbMarginAreaSetBacksNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbMarginAreaSetBacksNA ? 'NA' : (fields.hdbMarginAreaSetBacks || '')}
              onChange={(e) => handleChange('hdbMarginAreaSetBacks', e.target.value)}
              disabled={isReadOnly || !!fields.hdbMarginAreaSetBacksNA}
              placeholder="e.g. Front: 10 ft, Rear: 5 ft, Sides: 3 ft..."
            />
          </Field>

          {/* 9.a.4 Details of Access */}
          <div className="md:col-span-2">
            <Field
              label={
                <span className="font-semibold text-gray-900">
                  9.a.4 DETAILS OF ACCESS
                </span>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbDetailsOfAccess || ''}
                onChange={(e) => handleChange('hdbDetailsOfAccess', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 30 ft wide CC Road connected to main road..."
                rows={2}
                className="bg-white"
              />
            </Field>
          </div>

          {/* 9.a.6 Property Demarcated */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.6 PROPERTY DEMARCATED
              </span>
            }
          >
            <YesNoRadio
              name="hdbPropertyDemarcated"
              value={fields.hdbPropertyDemarcated || 'Yes'}
              onChange={(val) => handleChange('hdbPropertyDemarcated', val)}
              disabled={isReadOnly}
            />
          </Field>

          {/* 9.a.7 Ownership */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.7 OWNERSHIP
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbOwnershipType || 'Freehold'}
              customValue={fields.hdbOwnershipTypeCustom || ''}
              onChange={(val) => handleChange('hdbOwnershipType', val)}
              onCustomChange={(val) => handleChange('hdbOwnershipTypeCustom', val)}
              options={[
                { value: 'Freehold', label: 'Freehold' },
                { value: 'Leasehold', label: 'Leasehold' },
                { value: 'Joint Ownership', label: 'Joint Ownership' },
                { value: 'Power of Attorney', label: 'Power of Attorney' },
              ]}
              disabled={isReadOnly}
              placeholder="Select ownership type..."
            />
          </Field>

          {/* 9.a.8 Land /Plot Area Considered for Valuation(As per Measured) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.8 LAND / PLOT AREA CONSIDERED FOR VALUATION (MEASURED)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbLandAreaConsidered || fields.hdbLandPlotArea || ''}
              onChange={(e) => handleChange('hdbLandAreaConsidered', e.target.value)}
              disabled={isReadOnly}
              placeholder="Area considered for valuation in sqft..."
            />
          </Field>

          {/* Agreement Value (Rs.) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  AGREEMENT VALUE (RS.)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbAgreementValueNA}
                  onChange={(checked) => {
                    handleChange('hdbAgreementValueNA', checked);
                    if (checked) handleChange('hdbAgreementValue', 'NA');
                    else if (fields.hdbAgreementValue === 'NA') handleChange('hdbAgreementValue', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbAgreementValueNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbAgreementValueNA ? 'NA' : (fields.hdbAgreementValue || '')}
              onChange={(e) => handleChange('hdbAgreementValue', e.target.value)}
              disabled={isReadOnly || !!fields.hdbAgreementValueNA}
              placeholder="e.g. 2500000"
            />
          </Field>

          {/* 9.a.9 Government Guideline Rate(Rs.) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.9 GOVERNMENT GUIDELINE RATE (RS./SQFT)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbGovtGuidelineRateLand || ''}
              onChange={(e) => handleChange('hdbGovtGuidelineRateLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1200"
            />
          </Field>

          {/* 9.a.10 Prevailing Market Rate Range(Rs.) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.a.10 PREVAILING MARKET RATE RANGE (RS./SQFT)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbMarketRateLand || ''}
              onChange={(e) => handleChange('hdbMarketRateLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1500"
            />
          </Field>

          {/* 9.a.11 Market Reference for Land rates */}
          <div className="md:col-span-2">
            <Field
              label={
                <span className="font-semibold text-gray-900">
                  9.a.11 MARKET REFERENCE FOR LAND RATES
                </span>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbMarketReferenceLand || ''}
                onChange={(e) => handleChange('hdbMarketReferenceLand', e.target.value)}
                disabled={isReadOnly}
                placeholder="Market reference, broker inquiry, recent local sale deeds..."
                rows={2}
                className="bg-white"
              />
            </Field>
          </div>

          {/* 9.a.12 Rate Adopted for Valuation */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.a.12 RATE ADOPTED FOR VALUATION (RS./SQFT)
                </span>
                <EditSwitch
                  checked={!!fields.hdbRateAdoptedLandEditOn}
                  onChange={(checked) => {
                    handleChange('hdbRateAdoptedLandEditOn', checked);
                    if (!checked) {
                      handleChange('hdbRateAdoptedLand', autoRateAdoptedLand);
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
                className={`${inputCls} font-medium pr-28 ${
                  !fields.hdbRateAdoptedLandEditOn
                    ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={effectiveRateAdoptedLand}
                onChange={(e) => handleChange('hdbRateAdoptedLand', e.target.value)}
                disabled={isReadOnly || !fields.hdbRateAdoptedLandEditOn}
                placeholder="e.g. 1500"
              />
              {!fields.hdbRateAdoptedLandEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> Auto
                </div>
              )}
            </div>
          </Field>

          {/* 9.a.13 Fair Market Value */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.a.13 FAIR MARKET VALUE OF LAND (RS.)
                </span>
                <EditSwitch
                  checked={!!fields.hdbFairMarketValueLandEditOn}
                  onChange={(checked) => {
                    handleChange('hdbFairMarketValueLandEditOn', checked);
                    if (!checked) {
                      handleChange('hdbFairMarketValueLand', autoFmvLand);
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
                className={`${inputCls} font-bold text-gray-900 pr-28 ${
                  !fields.hdbFairMarketValueLandEditOn
                    ? 'bg-gray-100/90 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={effectiveFmvLand}
                onChange={(e) => handleChange('hdbFairMarketValueLand', e.target.value)}
                disabled={isReadOnly || !fields.hdbFairMarketValueLandEditOn}
                placeholder="Auto-calculates (Area * Rate)..."
              />
              {!fields.hdbFairMarketValueLandEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> Area × Rate
                </div>
              )}
            </div>
          </Field>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Container 3: 9.b CONSTRUCTION / APARTMENTS (Color: Light Goldenrod #FAFAD2)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-amber-300 shadow-sm"
        style={{ backgroundColor: '#FAFAD2' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-amber-900 shadow-xs">
              5.3
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              9.b CONSTRUCTION / APARTMENTS
            </h3>
          </div>
          <span className="text-xs text-amber-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-amber-300/60 shadow-xs">
            9.b CONSTRUCTION / APARTMENTS Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 9.b.1 Particulars */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    9.b.1 PARTICULARS
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbConstructionParticularsNA}
                    onChange={(checked) => {
                      handleChange('hdbConstructionParticularsNA', checked);
                      if (checked) handleChange('hdbConstructionParticulars', 'NA');
                      else if (fields.hdbConstructionParticulars === 'NA') handleChange('hdbConstructionParticulars', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbConstructionParticularsNA ? 'NA' : (fields.hdbConstructionParticulars || '')}
                onChange={(e) => handleChange('hdbConstructionParticulars', e.target.value)}
                disabled={isReadOnly || !!fields.hdbConstructionParticularsNA}
                placeholder="e.g. Ground Floor + First Floor RCC Residential Building..."
                rows={2}
                className={fields.hdbConstructionParticularsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 9.b.2 Usage */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.2 USAGE
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbBuildingUsage || 'Residential'}
              customValue={fields.hdbBuildingUsageCustom || ''}
              onChange={(val) => handleChange('hdbBuildingUsage', val)}
              onCustomChange={(val) => handleChange('hdbBuildingUsageCustom', val)}
              options={[
                { value: 'Residential', label: 'Residential' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Mixed', label: 'Mixed' },
                { value: 'Industrial', label: 'Industrial' },
              ]}
              disabled={isReadOnly}
              placeholder="Select usage..."
            />
          </Field>

          {/* 9.b.3 Structure */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.3 STRUCTURE
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbBuildingStructure || 'RCC Framed Structure'}
              customValue={fields.hdbBuildingStructureCustom || ''}
              onChange={(val) => handleChange('hdbBuildingStructure', val)}
              onCustomChange={(val) => handleChange('hdbBuildingStructureCustom', val)}
              options={[
                { value: 'RCC Framed Structure', label: 'RCC Framed Structure' },
                { value: 'Load Bearing Structure', label: 'Load Bearing Structure' },
                { value: 'Steel Structure / Truss Roof', label: 'Steel Structure / Truss Roof' },
                { value: 'Composite Structure', label: 'Composite Structure' },
              ]}
              disabled={isReadOnly}
              placeholder="Select structure type..."
            />
          </Field>

          {/* 9.b.4 No. of Storey */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.4 NO. OF STOREY
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbNoOfStorey || ''}
              onChange={(e) => handleChange('hdbNoOfStorey', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. G+1 or 2"
            />
          </Field>

          {/* 9.b.5 Property type */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.5 PROPERTY TYPE
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbBuildingPropertyType || 'Individual Residential House'}
              customValue={fields.hdbBuildingPropertyTypeCustom || ''}
              onChange={(val) => handleChange('hdbBuildingPropertyType', val)}
              onCustomChange={(val) => handleChange('hdbBuildingPropertyTypeCustom', val)}
              options={[
                { value: 'Individual Residential House', label: 'Individual Residential House' },
                { value: 'Independent Villa', label: 'Independent Villa' },
                { value: 'Apartment / Flat', label: 'Apartment / Flat' },
                { value: 'Commercial Complex', label: 'Commercial Complex' },
              ]}
              disabled={isReadOnly}
              placeholder="Select building property type..."
            />
          </Field>

          {/* 9.b.6 Completion/ Occupancy Date */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.6 COMPLETION / OCCUPANCY DATE
                </span>
                <NaCheckbox
                  checked={!!fields.hdbCompletionDateNA}
                  onChange={(checked) => {
                    handleChange('hdbCompletionDateNA', checked);
                    if (checked) handleChange('hdbCompletionDate', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="date"
              className={`${inputCls} font-medium ${
                fields.hdbCompletionDateNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbCompletionDateNA ? '' : (fields.hdbCompletionDate || '')}
              onChange={(e) => handleChange('hdbCompletionDate', e.target.value)}
              disabled={isReadOnly || !!fields.hdbCompletionDateNA}
            />
          </Field>

          {/* 9.b.7 Residual Age */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.7 RESIDUAL AGE
                </span>
                <div className="flex items-center gap-3">
                  <NaCheckbox
                    checked={!!fields.hdbResidualAgeNA}
                    onChange={(checked) => {
                      handleChange('hdbResidualAgeNA', checked);
                      if (checked) handleChange('hdbResidualAge', 'NA');
                      else if (fields.hdbResidualAge === 'NA') handleChange('hdbResidualAge', '');
                    }}
                    disabled={isReadOnly}
                  />
                  <EditSwitch
                    checked={!!fields.hdbResidualAgeEditOn}
                    onChange={(checked) => {
                      handleChange('hdbResidualAgeEditOn', checked);
                      if (!checked) {
                        handleChange('hdbResidualAge', autoResidualAge);
                      }
                    }}
                    disabled={isReadOnly || !!fields.hdbResidualAgeNA}
                  />
                </div>
              </div>
            }
          >
            <div className="relative">
              <input
                type="text"
                className={`${inputCls} font-medium pr-28 ${
                  fields.hdbResidualAgeNA
                    ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed'
                    : !fields.hdbResidualAgeEditOn
                    ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={fields.hdbResidualAgeNA ? 'NA' : effectiveResidualAge}
                onChange={(e) => handleChange('hdbResidualAge', e.target.value)}
                disabled={isReadOnly || !!fields.hdbResidualAgeNA || !fields.hdbResidualAgeEditOn}
                placeholder="e.g. 50 Years"
              />
              {!fields.hdbResidualAgeEditOn && !fields.hdbResidualAgeNA && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> Auto
                </div>
              )}
            </div>
          </Field>

          {/* 9.b.8 Carpet Area(SQFT)(G+1) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.8 CARPET AREA (SQFT) (G+1)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbCarpetAreaG1NA}
                  onChange={(checked) => {
                    handleChange('hdbCarpetAreaG1NA', checked);
                    if (checked) handleChange('hdbCarpetAreaG1', 'NA');
                    else if (fields.hdbCarpetAreaG1 === 'NA') handleChange('hdbCarpetAreaG1', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbCarpetAreaG1NA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbCarpetAreaG1NA ? 'NA' : (fields.hdbCarpetAreaG1 || '')}
              onChange={(e) => handleChange('hdbCarpetAreaG1', e.target.value)}
              disabled={isReadOnly || !!fields.hdbCarpetAreaG1NA}
              placeholder="e.g. 1800"
            />
          </Field>

          {/* 9.b.9 Carpet Area( in SQFT Only) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.9 CARPET AREA (IN SQFT ONLY)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbCarpetAreaTotalNA}
                  onChange={(checked) => {
                    handleChange('hdbCarpetAreaTotalNA', checked);
                    if (checked) handleChange('hdbCarpetAreaTotal', 'NA');
                    else if (fields.hdbCarpetAreaTotal === 'NA') handleChange('hdbCarpetAreaTotal', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbCarpetAreaTotalNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbCarpetAreaTotalNA ? 'NA' : (fields.hdbCarpetAreaTotal || '')}
              onChange={(e) => handleChange('hdbCarpetAreaTotal', e.target.value)}
              disabled={isReadOnly || !!fields.hdbCarpetAreaTotalNA}
              placeholder="e.g. 1800"
            />
          </Field>

          {/* 9.b.10 1 (Built up Area Measured) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.10 1 (BUILT UP AREA MEASURED)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbBuiltUpAreaMeasuredNA}
                  onChange={(checked) => {
                    handleChange('hdbBuiltUpAreaMeasuredNA', checked);
                    if (checked) handleChange('hdbBuiltUpAreaMeasured', 'NA');
                    else if (fields.hdbBuiltUpAreaMeasured === 'NA') handleChange('hdbBuiltUpAreaMeasured', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbBuiltUpAreaMeasuredNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbBuiltUpAreaMeasuredNA ? 'NA' : (fields.hdbBuiltUpAreaMeasured || '')}
              onChange={(e) => handleChange('hdbBuiltUpAreaMeasured', e.target.value)}
              disabled={isReadOnly || !!fields.hdbBuiltUpAreaMeasuredNA}
              placeholder="e.g. 2100"
            />
          </Field>

          {/* 9.b.11 1 (Super Builtup Area/Saleable Area) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.11 1 (SUPER BUILTUP AREA / SALEABLE AREA)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbSuperBuiltUpAreaNA}
                  onChange={(checked) => {
                    handleChange('hdbSuperBuiltUpAreaNA', checked);
                    if (checked) handleChange('hdbSuperBuiltUpArea', 'NA');
                    else if (fields.hdbSuperBuiltUpArea === 'NA') handleChange('hdbSuperBuiltUpArea', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbSuperBuiltUpAreaNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbSuperBuiltUpAreaNA ? 'NA' : (fields.hdbSuperBuiltUpArea || '')}
              onChange={(e) => handleChange('hdbSuperBuiltUpArea', e.target.value)}
              disabled={isReadOnly || !!fields.hdbSuperBuiltUpAreaNA}
              placeholder="e.g. 2400"
            />
          </Field>

          {/* 9.b.12 Structural Condition */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.12 STRUCTURAL CONDITION
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbStructuralCondition || 'Good'}
              customValue={fields.hdbStructuralConditionCustom || ''}
              onChange={(val) => handleChange('hdbStructuralCondition', val)}
              onCustomChange={(val) => handleChange('hdbStructuralConditionCustom', val)}
              options={[
                { value: 'Good', label: 'Good' },
                { value: 'Very Good', label: 'Very Good' },
                { value: 'Average', label: 'Average' },
                { value: 'Poor / Needs Repair', label: 'Poor / Needs Repair' },
                { value: 'Under Construction', label: 'Under Construction' },
              ]}
              disabled={isReadOnly}
              placeholder="Select structural condition..."
            />
          </Field>

          {/* 9.b.13 Government Guideline Rate(Rs./sqft) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.13 GOVERNMENT GUIDELINE RATE (RS./SQFT)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbGovtGuidelineRateBuilding || ''}
              onChange={(e) => handleChange('hdbGovtGuidelineRateBuilding', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1500"
            />
          </Field>

          {/* 9.b.14 Final Area in SQFT considered for Valuation as per Measured */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.14 FINAL AREA IN SQFT CONSIDERED FOR VALUATION
                </span>
                <EditSwitch
                  checked={!!fields.hdbFinalBuildingAreaConsideredEditOn}
                  onChange={(checked) => {
                    handleChange('hdbFinalBuildingAreaConsideredEditOn', checked);
                    if (!checked) {
                      handleChange('hdbFinalBuildingAreaConsidered', autoFinalBuildingArea);
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
                className={`${inputCls} font-medium pr-28 ${
                  !fields.hdbFinalBuildingAreaConsideredEditOn
                    ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={effectiveFinalBuildingArea}
                onChange={(e) => handleChange('hdbFinalBuildingAreaConsidered', e.target.value)}
                disabled={isReadOnly || !fields.hdbFinalBuildingAreaConsideredEditOn}
                placeholder="Area considered in sqft..."
              />
              {!fields.hdbFinalBuildingAreaConsideredEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> Auto
                </div>
              )}
            </div>
          </Field>

          {/* 9.b.15 Prevailing Market Rate Range(Rs./sqft) */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                9.b.15 PREVAILING MARKET RATE RANGE (RS./SQFT)
              </span>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium bg-white`}
              value={fields.hdbMarketRateBuilding || ''}
              onChange={(e) => handleChange('hdbMarketRateBuilding', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1800"
            />
          </Field>

          {/* 9.b.16 Market Reference for Property rates */}
          <div className="md:col-span-2">
            <Field
              label={
                <span className="font-semibold text-gray-900">
                  9.b.16 MARKET REFERENCE FOR PROPERTY RATES
                </span>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbMarketReferenceBuilding || ''}
                onChange={(e) => handleChange('hdbMarketReferenceBuilding', e.target.value)}
                disabled={isReadOnly}
                placeholder="Market reference for building construction rates..."
                rows={2}
                className="bg-white"
              />
            </Field>
          </div>

          {/* 9.b.17 Rate Adopted for Valuation */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.17 RATE ADOPTED FOR VALUATION (RS./SQFT)
                </span>
                <EditSwitch
                  checked={!!fields.hdbRateAdoptedBuildingEditOn}
                  onChange={(checked) => {
                    handleChange('hdbRateAdoptedBuildingEditOn', checked);
                    if (!checked) {
                      handleChange('hdbRateAdoptedBuilding', autoRateAdoptedBuilding);
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
                className={`${inputCls} font-medium pr-28 ${
                  !fields.hdbRateAdoptedBuildingEditOn
                    ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={effectiveRateAdoptedBuilding}
                onChange={(e) => handleChange('hdbRateAdoptedBuilding', e.target.value)}
                disabled={isReadOnly || !fields.hdbRateAdoptedBuildingEditOn}
                placeholder="e.g. 1800"
              />
              {!fields.hdbRateAdoptedBuildingEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> Auto
                </div>
              )}
            </div>
          </Field>

          {/* 9.b.18 Depreciation (% Only) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.18 DEPRECIATION (% ONLY)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbDepreciationPctNA}
                  onChange={(checked) => {
                    handleChange('hdbDepreciationPctNA', checked);
                    if (checked) handleChange('hdbDepreciationPct', '0');
                    else if (fields.hdbDepreciationPct === '0') handleChange('hdbDepreciationPct', '10');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbDepreciationPctNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbDepreciationPctNA ? '0' : (fields.hdbDepreciationPct ?? '10')}
              onChange={(e) => handleChange('hdbDepreciationPct', e.target.value)}
              disabled={isReadOnly || !!fields.hdbDepreciationPctNA}
              placeholder="e.g. 10"
            />
          </Field>

          {/* 9.b.19 Fair Market Value */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.19 FAIR MARKET VALUE OF BUILDING (RS.)
                </span>
                <EditSwitch
                  checked={!!fields.hdbFairMarketValueBuildingEditOn}
                  onChange={(checked) => {
                    handleChange('hdbFairMarketValueBuildingEditOn', checked);
                    if (!checked) {
                      handleChange('hdbFairMarketValueBuilding', autoFmvBuilding);
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
                className={`${inputCls} font-bold text-gray-900 pr-28 ${
                  !fields.hdbFairMarketValueBuildingEditOn
                    ? 'bg-gray-100/90 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={effectiveFmvBuilding}
                onChange={(e) => handleChange('hdbFairMarketValueBuilding', e.target.value)}
                disabled={isReadOnly || !fields.hdbFairMarketValueBuildingEditOn}
                placeholder="Auto-calculates FMV..."
              />
              {!fields.hdbFairMarketValueBuildingEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> Auto
                </div>
              )}
            </div>
          </Field>

          {/* 9.b.20 Distress Value */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.20 DISTRESS VALUE (RS.)
                </span>
                <div className="flex items-center gap-3">
                  <NaCheckbox
                    checked={!!fields.hdbDistressValueBuildingNA}
                    onChange={(checked) => {
                      handleChange('hdbDistressValueBuildingNA', checked);
                      if (checked) handleChange('hdbDistressValueBuilding', 'NA');
                      else if (fields.hdbDistressValueBuilding === 'NA') handleChange('hdbDistressValueBuilding', '');
                    }}
                    disabled={isReadOnly}
                  />
                  <EditSwitch
                    checked={!!fields.hdbDistressValueBuildingEditOn}
                    onChange={(checked) => {
                      handleChange('hdbDistressValueBuildingEditOn', checked);
                      if (!checked) {
                        handleChange('hdbDistressValueBuilding', autoDistressBuilding);
                      }
                    }}
                    disabled={isReadOnly || !!fields.hdbDistressValueBuildingNA}
                  />
                </div>
              </div>
            }
          >
            <div className="relative">
              <input
                type="text"
                className={`${inputCls} font-semibold pr-28 ${
                  fields.hdbDistressValueBuildingNA
                    ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed'
                    : !fields.hdbDistressValueBuildingEditOn
                    ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={fields.hdbDistressValueBuildingNA ? 'NA' : effectiveDistressBuilding}
                onChange={(e) => handleChange('hdbDistressValueBuilding', e.target.value)}
                disabled={isReadOnly || !!fields.hdbDistressValueBuildingNA || !fields.hdbDistressValueBuildingEditOn}
                placeholder="e.g. 85% of FMV..."
              />
              {!fields.hdbDistressValueBuildingEditOn && !fields.hdbDistressValueBuildingNA && (
                <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  <Lock className="w-3 h-3 text-emerald-700" /> 85% FMV
                </div>
              )}
            </div>
          </Field>

          {/* 9.b.21 Unapproved Construction Value(SQFT) */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.21 UNAPPROVED CONSTRUCTION AREA (SQFT)
                </span>
                <NaCheckbox
                  checked={!!fields.hdbUnapprovedConstructionAreaNA}
                  onChange={(checked) => {
                    handleChange('hdbUnapprovedConstructionAreaNA', checked);
                    if (checked) handleChange('hdbUnapprovedConstructionArea', 'NA');
                    else if (fields.hdbUnapprovedConstructionArea === 'NA') handleChange('hdbUnapprovedConstructionArea', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <input
              type="text"
              className={`${inputCls} font-medium ${
                fields.hdbUnapprovedConstructionAreaNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'
              }`}
              value={fields.hdbUnapprovedConstructionAreaNA ? 'NA' : (fields.hdbUnapprovedConstructionArea || '')}
              onChange={(e) => handleChange('hdbUnapprovedConstructionArea', e.target.value)}
              disabled={isReadOnly || !!fields.hdbUnapprovedConstructionAreaNA}
              placeholder="e.g. Nil or area in sqft..."
            />
          </Field>

          {/* 9.b.24 Demolition / Sealing Risk */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  9.b.24 DEMOLITION / SEALING RISK
                </span>
                <NaCheckbox
                  checked={!!fields.hdbDemolitionSealingRiskNA}
                  onChange={(checked) => {
                    handleChange('hdbDemolitionSealingRiskNA', checked);
                    if (checked) handleChange('hdbDemolitionSealingRisk', 'NA');
                    else if (fields.hdbDemolitionSealingRisk === 'NA') handleChange('hdbDemolitionSealingRisk', 'Low / Negligible');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <CustomSelect
              value={fields.hdbDemolitionSealingRiskNA ? 'NA' : (fields.hdbDemolitionSealingRisk || 'Low / Negligible')}
              customValue={fields.hdbDemolitionSealingRiskCustom || ''}
              onChange={(val) => handleChange('hdbDemolitionSealingRisk', val)}
              onCustomChange={(val) => handleChange('hdbDemolitionSealingRiskCustom', val)}
              options={[
                { value: 'Low / Negligible', label: 'Low / Negligible' },
                { value: 'Moderate', label: 'Moderate' },
                { value: 'High', label: 'High' },
                { value: 'None', label: 'None' },
              ]}
              disabled={isReadOnly || !!fields.hdbDemolitionSealingRiskNA}
              placeholder="Select risk level..."
            />
          </Field>

          {/* 9.b.22 Internal and External Amenities */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    9.b.22 INTERNAL AND EXTERNAL AMENITIES
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbAmenitiesInternalExternalNA}
                    onChange={(checked) => {
                      handleChange('hdbAmenitiesInternalExternalNA', checked);
                      if (checked) handleChange('hdbAmenitiesInternalExternal', 'NA');
                      else if (fields.hdbAmenitiesInternalExternal === 'NA') handleChange('hdbAmenitiesInternalExternal', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbAmenitiesInternalExternalNA ? 'NA' : (fields.hdbAmenitiesInternalExternal || '')}
                onChange={(e) => handleChange('hdbAmenitiesInternalExternal', e.target.value)}
                disabled={isReadOnly || !!fields.hdbAmenitiesInternalExternalNA}
                placeholder="e.g. Vitrified tiles, modular kitchen, electrical fittings, water supply, parking space..."
                rows={2}
                className={fields.hdbAmenitiesInternalExternalNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 9.b.23 Violation Observed */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    9.b.23 VIOLATION OBSERVED
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbViolationObservedNA}
                    onChange={(checked) => {
                      handleChange('hdbViolationObservedNA', checked);
                      if (checked) handleChange('hdbViolationObserved', 'NA');
                      else if (fields.hdbViolationObserved === 'NA') handleChange('hdbViolationObserved', 'No');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="space-y-3">
                <YesNoRadio
                  name="hdbViolationObserved"
                  value={fields.hdbViolationObserved || 'No'}
                  onChange={(val) => handleChange('hdbViolationObserved', val)}
                  disabled={isReadOnly || !!fields.hdbViolationObservedNA}
                />
                {(fields.hdbViolationObserved === 'Yes' && !fields.hdbViolationObservedNA) && (
                  <AutoResizeTextarea
                    value={fields.hdbViolationDetails || ''}
                    onChange={(e) => handleChange('hdbViolationDetails', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Specify details of violation observed..."
                    rows={2}
                    className="bg-white"
                  />
                )}
              </div>
            </Field>
          </div>

          {/* 9.b.25 Remarks on Last 3 years average price of property */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    9.b.25 REMARKS ON LAST 3 YEARS AVERAGE PRICE OF PROPERTY
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbRemarksLast3YearsPriceNA}
                    onChange={(checked) => {
                      handleChange('hdbRemarksLast3YearsPriceNA', checked);
                      if (checked) handleChange('hdbRemarksLast3YearsPrice', 'NA');
                      else if (fields.hdbRemarksLast3YearsPrice === 'NA') handleChange('hdbRemarksLast3YearsPrice', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbRemarksLast3YearsPriceNA ? 'NA' : (fields.hdbRemarksLast3YearsPrice || '')}
                onChange={(e) => handleChange('hdbRemarksLast3YearsPrice', e.target.value)}
                disabled={isReadOnly || !!fields.hdbRemarksLast3YearsPriceNA}
                placeholder="e.g. Steady appreciation of 8-10% annually observed in this locality over past 3 years..."
                rows={2}
                className={fields.hdbRemarksLast3YearsPriceNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* 9.b.26 Insurable value of Property */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    9.b.26 INSURABLE VALUE OF PROPERTY (RS.)
                  </span>
                  <div className="flex items-center gap-3">
                    <NaCheckbox
                      checked={!!fields.hdbInsurableValueNA}
                      onChange={(checked) => {
                        handleChange('hdbInsurableValueNA', checked);
                        if (checked) handleChange('hdbInsurableValue', 'NA');
                        else if (fields.hdbInsurableValue === 'NA') handleChange('hdbInsurableValue', '');
                      }}
                      disabled={isReadOnly}
                    />
                    <EditSwitch
                      checked={!!fields.hdbInsurableValueEditOn}
                      onChange={(checked) => {
                        handleChange('hdbInsurableValueEditOn', checked);
                        if (!checked) {
                          handleChange('hdbInsurableValue', autoInsurableValue);
                        }
                      }}
                      disabled={isReadOnly || !!fields.hdbInsurableValueNA}
                    />
                  </div>
                </div>
              }
            >
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} font-semibold pr-28 ${
                    fields.hdbInsurableValueNA
                      ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed'
                      : !fields.hdbInsurableValueEditOn
                      ? 'bg-gray-100/90 text-gray-800 cursor-not-allowed'
                      : 'bg-white'
                  }`}
                  value={fields.hdbInsurableValueNA ? 'NA' : effectiveInsurableValue}
                  onChange={(e) => handleChange('hdbInsurableValue', e.target.value)}
                  disabled={isReadOnly || !!fields.hdbInsurableValueNA || !fields.hdbInsurableValueEditOn}
                  placeholder="Insurable value (structure reproduction cost)..."
                />
                {!fields.hdbInsurableValueEditOn && !fields.hdbInsurableValueNA && (
                  <div className="absolute right-3 top-2.5 text-xs text-emerald-800 font-semibold pointer-events-none flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                    <Lock className="w-3 h-3 text-emerald-700" /> Structure Cost
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

// ─── Section 6: 10 SUMMARY ──────────────────────────────────────────────────

export function SummarySection({
  fields,
  handleChange,
  isReadOnly,
}: {
  fields: any;
  handleChange: (field: string, value: any) => void;
  isReadOnly: boolean;
}) {
  // ── Auto-calculations for Container 1: Final Calculation & Status ──────────
  const sec5LandArea = parseFloat(fields.hdbLandAreaConsidered || fields.hdbLandPlotArea || '0') || 0;
  const sec5LandRate = parseFloat(fields.hdbRateAdoptedLand || fields.hdbMarketRateLand || fields.hdbGovtGuidelineRateLand || '0') || 0;
  const autoSec5FmvLand = sec5LandArea > 0 && sec5LandRate > 0 ? String(Math.round(sec5LandArea * sec5LandRate)) : '';
  const autoSummaryLandValue = fields.hdbFairMarketValueLand || autoSec5FmvLand;

  const effectiveSummaryLandValue = fields.hdbSummaryLandValueEditOn
    ? (fields.hdbSummaryLandValue ?? '')
    : (fields.hdbSummaryLandValue || autoSummaryLandValue);

  const sec5BldgArea = parseFloat(fields.hdbFinalBuildingAreaConsidered || fields.hdbBuiltUpAreaMeasured || fields.hdbCarpetAreaTotal || fields.hdbCarpetAreaG1 || '0') || 0;
  const sec5BldgRate = parseFloat(fields.hdbRateAdoptedBuilding || fields.hdbMarketRateBuilding || fields.hdbGovtGuidelineRateBuilding || '0') || 0;
  const sec5DepPct = fields.hdbDepreciationPctNA ? 0 : (parseFloat(fields.hdbDepreciationPct || '0') || 0);
  const autoSec5FmvBldg = sec5BldgArea > 0 && sec5BldgRate > 0 ? String(Math.round(sec5BldgArea * sec5BldgRate * (1 - sec5DepPct / 100))) : '';
  const sec5BldgValue = fields.hdbFairMarketValueBuilding || autoSec5FmvBldg;

  const landNum = parseFloat(effectiveSummaryLandValue || '0') || 0;
  const bldgNum = parseFloat(sec5BldgValue || '0') || 0;
  const autoFinalRecommendedValue = (landNum + bldgNum > 0) ? String(Math.round(landNum + bldgNum)) : '';

  const effectiveFinalRecommendedValue = fields.hdbSummaryFinalRecommendedValueEditOn
    ? (fields.hdbSummaryFinalRecommendedValue ?? '')
    : (fields.hdbSummaryFinalRecommendedValue || autoFinalRecommendedValue);

  const finalValueNumeric = parseFloat(effectiveFinalRecommendedValue || '0') || 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* ────────────────────────────────────────────────────────────────────────
          Container 1: Final Calculation & Status (Color: Light Steel Blue #B0C4DE)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-slate-300 shadow-sm"
        style={{ backgroundColor: '#B0C4DE' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-slate-800 shadow-xs">
              6.1
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              Final Calculation & Status
            </h3>
          </div>
          <span className="text-xs text-slate-900 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-slate-300/60 shadow-xs">
            Final Calculation & Status Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 10.a Land Value */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  10.a LAND VALUE (RS.)
                </span>
                <EditSwitch
                  checked={!!fields.hdbSummaryLandValueEditOn}
                  onChange={(checked) => {
                    handleChange('hdbSummaryLandValueEditOn', checked);
                    if (!checked) {
                      handleChange('hdbSummaryLandValue', autoSummaryLandValue);
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
                className={`${inputCls} font-bold text-gray-900 pr-32 ${
                  !fields.hdbSummaryLandValueEditOn
                    ? 'bg-gray-100/90 cursor-not-allowed'
                    : 'bg-white'
                }`}
                value={effectiveSummaryLandValue}
                onChange={(e) => handleChange('hdbSummaryLandValue', e.target.value)}
                disabled={isReadOnly || !fields.hdbSummaryLandValueEditOn}
                placeholder="Auto-calculates (Linked from Section 5)..."
              />
              {!fields.hdbSummaryLandValueEditOn && (
                <div className="absolute right-3 top-2.5 text-xs text-blue-900 font-semibold pointer-events-none flex items-center gap-1 bg-white/85 px-2 py-0.5 rounded border border-blue-300 shadow-xs">
                  <Lock className="w-3 h-3 text-blue-700" /> Linked Sec 5
                </div>
              )}
            </div>
            {effectiveSummaryLandValue && !isNaN(Number(effectiveSummaryLandValue)) && Number(effectiveSummaryLandValue) > 0 && (
              <div className="mt-1.5 text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>Formatted: ₹ {formatIndianCurrency(effectiveSummaryLandValue)}</span>
              </div>
            )}
          </Field>

          {/* 12 Final Status */}
          <Field
            label={
              <span className="font-semibold text-gray-900">
                12 FINAL STATUS
              </span>
            }
          >
            <CustomSelect
              value={fields.hdbFinalStatus || 'Positive'}
              customValue={fields.hdbFinalStatusCustom || ''}
              onChange={(val) => handleChange('hdbFinalStatus', val)}
              onCustomChange={(val) => handleChange('hdbFinalStatusCustom', val)}
              options={[
                { value: 'Positive', label: 'Positive' },
                { value: 'Negative', label: 'Negative' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Conditional Positive', label: 'Conditional Positive' },
              ]}
              disabled={isReadOnly}
              placeholder="Select final status..."
            />
          </Field>

          {/* 11 Thus the Final Recommended value For the G+1 storied residential building is */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    11 THUS THE FINAL RECOMMENDED VALUE FOR THE G+1 STORIED RESIDENTIAL BUILDING IS (RS.)
                  </span>
                  <EditSwitch
                    checked={!!fields.hdbSummaryFinalRecommendedValueEditOn}
                    onChange={(checked) => {
                      handleChange('hdbSummaryFinalRecommendedValueEditOn', checked);
                      if (!checked) {
                        handleChange('hdbSummaryFinalRecommendedValue', autoFinalRecommendedValue);
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
                  className={`${inputCls} font-bold text-gray-900 text-base pr-32 ${
                    !fields.hdbSummaryFinalRecommendedValueEditOn
                      ? 'bg-gray-100/90 cursor-not-allowed'
                      : 'bg-white'
                  }`}
                  value={effectiveFinalRecommendedValue}
                  onChange={(e) => handleChange('hdbSummaryFinalRecommendedValue', e.target.value)}
                  disabled={isReadOnly || !fields.hdbSummaryFinalRecommendedValueEditOn}
                  placeholder="Auto-calculates (Total of Land + Construction)..."
                />
                {!fields.hdbSummaryFinalRecommendedValueEditOn && (
                  <div className="absolute right-3 top-2.5 text-xs text-blue-900 font-semibold pointer-events-none flex items-center gap-1 bg-white/85 px-2 py-0.5 rounded border border-blue-300 shadow-xs">
                    <Lock className="w-3 h-3 text-blue-700" /> Land + Bldg
                  </div>
                )}
              </div>
              {finalValueNumeric > 0 && (
                <div className="mt-2 text-xs font-semibold text-slate-800 bg-white/85 p-3 rounded-lg border border-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Final Recommended Value:</span>
                    <span className="font-bold text-slate-900 text-sm">₹ {formatIndianCurrency(finalValueNumeric)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-normal">In Words: </span>
                    <span className="italic uppercase text-slate-900">{rupeesInWords(finalValueNumeric)}</span>
                  </div>
                </div>
              )}
            </Field>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Container 2: 13 Mandatory Requirements (Color: Light Salmon #FFA07A)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-orange-300 shadow-sm"
        style={{ backgroundColor: '#FFA07A' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-400/50 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-orange-900 shadow-xs">
              6.2
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              13 Mandatory Requirements
            </h3>
          </div>
          <span className="text-xs text-orange-950 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-orange-300/60 shadow-xs">
            13 Mandatory Requirements Container
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* a. Setback Deviation */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    A. SETBACK DEVIATION
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbSetbackDeviationNA}
                    onChange={(checked) => {
                      handleChange('hdbSetbackDeviationNA', checked);
                      if (checked) handleChange('hdbSetbackDeviationDetails', 'NA');
                      else if (fields.hdbSetbackDeviationDetails === 'NA') handleChange('hdbSetbackDeviationDetails', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between bg-white/80 px-3 py-2 rounded-lg border border-orange-200">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fields.hdbSetbackDeviation === 'Deviated'}
                      onChange={(e) => {
                        handleChange('hdbSetbackDeviation', e.target.checked ? 'Deviated' : 'Compliant');
                      }}
                      disabled={isReadOnly || !!fields.hdbSetbackDeviationNA}
                      className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Setback Deviated (Uncheck for Compliant)
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      fields.hdbSetbackDeviation === 'Deviated'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {fields.hdbSetbackDeviation === 'Deviated' ? 'Deviated' : 'Compliant'}
                  </span>
                </div>
                <AutoResizeTextarea
                  value={fields.hdbSetbackDeviationNA ? 'NA' : (fields.hdbSetbackDeviationDetails || '')}
                  onChange={(e) => handleChange('hdbSetbackDeviationDetails', e.target.value)}
                  disabled={isReadOnly || !!fields.hdbSetbackDeviationNA}
                  placeholder={
                    fields.hdbSetbackDeviation === 'Deviated'
                      ? 'Specify setback deviation details (e.g. Front/Rear/Side deviations in ft)...'
                      : 'Setbacks are compliant as per sanctioned plan / permissible building bye-laws...'
                  }
                  rows={2}
                  className={fields.hdbSetbackDeviationNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
                />
              </div>
            </Field>
          </div>

          {/* b. FSI Violation */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    B. FSI VIOLATION
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbFsiViolationNA}
                    onChange={(checked) => {
                      handleChange('hdbFsiViolationNA', checked);
                      if (checked) handleChange('hdbFsiViolationDetails', 'NA');
                      else if (fields.hdbFsiViolationDetails === 'NA') handleChange('hdbFsiViolationDetails', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between bg-white/80 px-3 py-2 rounded-lg border border-orange-200">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!fields.hdbFsiViolationChecked}
                      onChange={(e) => handleChange('hdbFsiViolationChecked', e.target.checked)}
                      disabled={isReadOnly || !!fields.hdbFsiViolationNA}
                      className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      FSI Violation Observed
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      fields.hdbFsiViolationChecked
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {fields.hdbFsiViolationChecked ? 'Violation Observed' : 'Within Permissible FSI'}
                  </span>
                </div>
                <AutoResizeTextarea
                  value={fields.hdbFsiViolationNA ? 'NA' : (fields.hdbFsiViolationDetails || '')}
                  onChange={(e) => handleChange('hdbFsiViolationDetails', e.target.value)}
                  disabled={isReadOnly || !!fields.hdbFsiViolationNA}
                  placeholder={
                    fields.hdbFsiViolationChecked
                      ? 'Specify FSI violation percentage or excess built-up area...'
                      : 'FSI consumed is within the permissible limit as per local authority regulations...'
                  }
                  rows={2}
                  className={fields.hdbFsiViolationNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
                />
              </div>
            </Field>
          </div>

          {/* c. Locality Details */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900">
                    C. LOCALITY DETAILS
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbLocalityDetailsNA}
                    onChange={(checked) => {
                      handleChange('hdbLocalityDetailsNA', checked);
                      if (checked) handleChange('hdbLocalityDetails', 'NA');
                      else if (fields.hdbLocalityDetails === 'NA') handleChange('hdbLocalityDetails', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <AutoResizeTextarea
                value={fields.hdbLocalityDetailsNA ? 'NA' : (fields.hdbLocalityDetails || '')}
                onChange={(e) => handleChange('hdbLocalityDetails', e.target.value)}
                disabled={isReadOnly || !!fields.hdbLocalityDetailsNA}
                placeholder="Describe locality profile, infrastructure, accessibility, surrounding residential developments, and civic amenities..."
                rows={3}
                className={fields.hdbLocalityDetailsNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
              />
            </Field>
          </div>

          {/* d. Demolition Risk */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  D. DEMOLITION RISK
                </span>
                <NaCheckbox
                  checked={!!fields.hdbDemolitionRiskNA}
                  onChange={(checked) => {
                    handleChange('hdbDemolitionRiskNA', checked);
                    if (checked) handleChange('hdbDemolitionRisk', 'NA');
                    else if (fields.hdbDemolitionRisk === 'NA') handleChange('hdbDemolitionRisk', 'Low / Negligible');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <CustomSelect
              value={fields.hdbDemolitionRiskNA ? 'NA' : (fields.hdbDemolitionRisk || 'Low / Negligible')}
              customValue={fields.hdbDemolitionRiskCustom || ''}
              onChange={(val) => handleChange('hdbDemolitionRisk', val)}
              onCustomChange={(val) => handleChange('hdbDemolitionRiskCustom', val)}
              options={[
                { value: 'Low / Negligible', label: 'Low / Negligible' },
                { value: 'Moderate', label: 'Moderate' },
                { value: 'High', label: 'High' },
                { value: 'None', label: 'None' },
              ]}
              disabled={isReadOnly || !!fields.hdbDemolitionRiskNA}
              placeholder="Select demolition risk..."
            />
          </Field>

          {/* e. Property Enlisted For Any Negative Authority Action */}
          <div className="md:col-span-2">
            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    E. PROPERTY ENLISTED FOR ANY NEGATIVE AUTHORITY ACTION
                  </span>
                  <NaCheckbox
                    checked={!!fields.hdbNegativeAuthorityActionNA}
                    onChange={(checked) => {
                      handleChange('hdbNegativeAuthorityActionNA', checked);
                      if (checked) handleChange('hdbNegativeAuthorityActionDetails', 'NA');
                      else if (fields.hdbNegativeAuthorityActionDetails === 'NA') handleChange('hdbNegativeAuthorityActionDetails', '');
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              }
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between bg-white/80 px-3 py-2 rounded-lg border border-orange-200">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!fields.hdbNegativeAuthorityActionChecked}
                      onChange={(e) => handleChange('hdbNegativeAuthorityActionChecked', e.target.checked)}
                      disabled={isReadOnly || !!fields.hdbNegativeAuthorityActionNA}
                      className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Enlisted for Negative Authority Action
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      fields.hdbNegativeAuthorityActionChecked
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {fields.hdbNegativeAuthorityActionChecked ? 'Yes (Enlisted)' : 'No (Clear)'}
                  </span>
                </div>
                <AutoResizeTextarea
                  value={fields.hdbNegativeAuthorityActionNA ? 'NA' : (fields.hdbNegativeAuthorityActionDetails || '')}
                  onChange={(e) => handleChange('hdbNegativeAuthorityActionDetails', e.target.value)}
                  disabled={isReadOnly || !!fields.hdbNegativeAuthorityActionNA}
                  placeholder={
                    fields.hdbNegativeAuthorityActionChecked
                      ? 'Specify notice details, sealing order, litigation, or negative list details...'
                      : 'The subject property is not enlisted in any negative list or demolition/acquisition notice by any authority...'
                  }
                  rows={2}
                  className={fields.hdbNegativeAuthorityActionNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
                />
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          Container 3: 14 Remarks (Color: Light Gray #D3D3D3)
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5 border border-gray-400 shadow-sm"
        style={{ backgroundColor: '#D3D3D3' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-400/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-gray-800 shadow-xs">
              6.3
            </span>
            <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
              14 Remarks
            </h3>
          </div>
          <span className="text-xs text-gray-800 font-semibold bg-white/70 px-2.5 py-1 rounded-md border border-gray-300 shadow-xs">
            14 Remarks Container
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* 14 Remarks if any */}
          <Field
            label={
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-gray-900">
                  14 REMARKS IF ANY
                </span>
                <NaCheckbox
                  checked={!!fields.hdbRemarksIfAnyNA}
                  onChange={(checked) => {
                    handleChange('hdbRemarksIfAnyNA', checked);
                    if (checked) handleChange('hdbRemarksIfAny', 'NA');
                    else if (fields.hdbRemarksIfAny === 'NA') handleChange('hdbRemarksIfAny', '');
                  }}
                  disabled={isReadOnly}
                />
              </div>
            }
          >
            <AutoResizeTextarea
              value={fields.hdbRemarksIfAnyNA ? 'NA' : (fields.hdbRemarksIfAny || '')}
              onChange={(e) => handleChange('hdbRemarksIfAny', e.target.value)}
              disabled={isReadOnly || !!fields.hdbRemarksIfAnyNA}
              placeholder="Enter final remarks, observations, conditions, marketability notes, or special instructions if any..."
              rows={4}
              className={fields.hdbRemarksIfAnyNA ? 'bg-gray-100/90 text-gray-500 cursor-not-allowed' : 'bg-white'}
            />
          </Field>
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
    { id: 'hdb-section-general-details', title: 'GENERAL DETAILS' },
    { id: 'hdb-section-document-details', title: 'DOCUMENT DETAILS' },
    { id: 'hdb-section-boundaries', title: 'BOUNDARIES' },
    { id: 'hdb-section-technical-details', title: 'TECHNICAL DETAILS' },
    { id: 'hdb-section-summary', title: '10 SUMMARY' },
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

    // Section 2: Container 1 - 1-4 Basic Info
    hdbPurposeOfValuation: 'Mortgage / Loan Against Property',
    hdbPurposeOfValuationCustom: '',
    hdbDateOfValuation: '',
    hdbApplicantOwnerName: '',
    hdbPersonMetDuringVisit: '',
    hdbPersonMetDuringVisitNA: false,

    // Section 2: Container 2 - 5 Particulars
    hdbPropertyAddressDescription: '',
    hdbPropertyAddressDescriptionNA: false,
    hdbPlotNoSubPlotNo: '',
    hdbPlotNoSubPlotNoNA: false,
    hdbKhasraGatPlotNos: '',
    hdbKhasraGatPlotNosNA: false,
    hdbVillageTownLocation: '',
    hdbTaluka: '',
    hdbTalukaNA: false,
    hdbDistrict: 'Khordha',
    hdbDistrictCustom: '',
    hdbState: 'Odisha',
    hdbStateCustom: '',
    hdbPinCode: '',
    hdbSystemPropertyAddress: '',
    hdbGpsCoordinates: '',
    hdbGpsCoordinatesNA: false,
    hdbNearestLandmark: '',
    hdbNearestLandmarkNA: false,
    hdbSocietyNameBoard: '',
    hdbSocietyNameBoardNA: false,
    hdbDoorEntranceName: '',
    hdbDoorEntranceNameNA: false,
    hdbNeighborConfirmationDetails: '',
    hdbNeighborConfirmationDetailsNA: false,
    hdbAddressMatchesSiteDocs: 'Yes',
    hdbNegativeAreaAction: 'No',

    // Section 2: Container 3 - 6 Particulars
    hdbNearestGovtOffices: '',
    hdbNearestGovtOfficesNA: false,
    hdbNearestRailwayStation: '',
    hdbNearestRailwayStationNA: false,
    hdbNearestBusStation: '',
    hdbNearestBusStationNA: false,
    hdbNearestAirport: '',
    hdbNearestAirportNA: false,
    hdbNearestNationalHighway: '',
    hdbNearestNationalHighwayNA: false,
    hdbCommunityCentersDistance: '',
    hdbCommunityCentersDistanceNA: false,
    hdbSchoolCollegeHospitalDistance: '',
    hdbSchoolCollegeHospitalDistanceNA: false,
    hdbWithinMunicipalLimits: 'Yes',
    hdbDetailsOfLocalAuthority: '',
    hdbDetailsOfLocalAuthorityNA: false,

    // Section 3: Container 7 Particulars
    hdbDocOwnershipChecked: true,
    hdbDocOwnershipFile: '',
    hdbDocOwnershipFileName: '',
    hdbDocNaOrderChecked: false,
    hdbDocNaOrderNA: false,
    hdbDocNaOrderFile: '',
    hdbDocNaOrderFileName: '',
    hdbDocCommencementCertChecked: false,
    hdbDocCommencementCertNA: false,
    hdbDocCommencementCertFile: '',
    hdbDocCommencementCertFileName: '',
    hdbDocSanctionedPlansChecked: false,
    hdbDocSanctionedPlansNA: false,
    hdbDocSanctionedPlansFile: '',
    hdbDocSanctionedPlansFileName: '',
    hdbDocOccupancyCertChecked: false,
    hdbDocOccupancyCertNA: false,
    hdbDocOccupancyCertFile: '',
    hdbDocOccupancyCertFileName: '',
    hdbDocRegularisationOrderChecked: false,
    hdbDocRegularisationOrderNA: true,
    hdbDocRegularisationOrderFile: '',
    hdbDocRegularisationOrderFileName: '',
    hdbDocShareCertChecked: false,
    hdbDocShareCertNA: true,
    hdbDocShareCertFile: '',
    hdbDocShareCertFileName: '',
    hdbDocTaxReceiptChecked: true,
    hdbDocTaxReceiptNA: false,
    hdbDocTaxReceiptFile: '',
    hdbDocTaxReceiptFileName: '',

    // Section 4: Boundaries (8 Direction)
    hdbBoundaryEast: '',
    hdbBoundaryWest: '',
    hdbBoundaryNorth: '',
    hdbBoundarySouth: '',
    hdbBoundariesMatchingCount: '4',
    hdbBoundariesMatchingEditOn: false,

    // Section 5: Technical Details
    // Container 1: 9 Basic Technical Info
    hdbPropertyType: 'Residential Independent House',
    hdbPropertyTypeCustom: '',
    hdbValuationMethodology: 'Land & Building Method / Cost Approach',
    hdbValuationMethodologyCustom: '',
    hdbPresentOccupancy: 'Self Occupied',
    hdbPresentOccupancyCustom: '',
    hdbIfNotOccupiedByOwner: '',
    hdbIfNotOccupiedByOwnerNA: false,
    hdbOccupantInfo1: '',
    hdbOccupantInfo1NA: false,
    hdbOccupantInfo2: '',
    hdbOccupantInfo2NA: false,
    hdbOccupantInfo3: '',
    hdbOccupantInfo3NA: false,

    // Container 2: 9.a LAND/PLOT
    hdbLandPlotArea: '',
    hdbPlotUsage: 'Residential',
    hdbPlotUsageCustom: '',
    hdbPropertyAccessibility: 'Good',
    hdbPropertyAccessibilityCustom: '',
    hdbDetailsOfAccess: '',
    hdbMarginAreaSetBacks: '',
    hdbMarginAreaSetBacksNA: false,
    hdbPropertyDemarcated: 'Yes',
    hdbOwnershipType: 'Freehold',
    hdbOwnershipTypeCustom: '',
    hdbLandAreaConsidered: '',
    hdbAgreementValue: '',
    hdbAgreementValueNA: false,
    hdbGovtGuidelineRateLand: '',
    hdbMarketRateLand: '',
    hdbMarketReferenceLand: '',
    hdbRateAdoptedLand: '',
    hdbRateAdoptedLandEditOn: false,
    hdbFairMarketValueLand: '',
    hdbFairMarketValueLandEditOn: false,

    // Container 3: 9.b CONSTRUCTION / APARTMENTS
    hdbConstructionParticulars: '',
    hdbConstructionParticularsNA: false,
    hdbBuildingUsage: 'Residential',
    hdbBuildingUsageCustom: '',
    hdbBuildingStructure: 'RCC Framed Structure',
    hdbBuildingStructureCustom: '',
    hdbNoOfStorey: '',
    hdbBuildingPropertyType: 'Individual Residential House',
    hdbBuildingPropertyTypeCustom: '',
    hdbCompletionDate: '',
    hdbCompletionDateNA: false,
    hdbResidualAge: '',
    hdbResidualAgeEditOn: false,
    hdbResidualAgeNA: false,
    hdbCarpetAreaG1: '',
    hdbCarpetAreaG1NA: false,
    hdbCarpetAreaTotal: '',
    hdbCarpetAreaTotalNA: false,
    hdbBuiltUpAreaMeasured: '',
    hdbBuiltUpAreaMeasuredNA: false,
    hdbSuperBuiltUpArea: '',
    hdbSuperBuiltUpAreaNA: false,
    hdbStructuralCondition: 'Good',
    hdbStructuralConditionCustom: '',
    hdbGovtGuidelineRateBuilding: '',
    hdbFinalBuildingAreaConsidered: '',
    hdbFinalBuildingAreaConsideredEditOn: false,
    hdbMarketRateBuilding: '',
    hdbMarketReferenceBuilding: '',
    hdbRateAdoptedBuilding: '',
    hdbRateAdoptedBuildingEditOn: false,
    hdbDepreciationPct: '10',
    hdbDepreciationPctNA: false,
    hdbFairMarketValueBuilding: '',
    hdbFairMarketValueBuildingEditOn: false,
    hdbDistressValueBuilding: '',
    hdbDistressValueBuildingEditOn: false,
    hdbDistressValueBuildingNA: false,
    hdbUnapprovedConstructionArea: '',
    hdbUnapprovedConstructionAreaNA: false,
    hdbAmenitiesInternalExternal: '',
    hdbAmenitiesInternalExternalNA: false,
    hdbViolationObserved: 'No',
    hdbViolationDetails: '',
    hdbViolationObservedNA: false,
    hdbDemolitionSealingRisk: 'Low / Negligible',
    hdbDemolitionSealingRiskCustom: '',
    hdbDemolitionSealingRiskNA: false,
    hdbRemarksLast3YearsPrice: '',
    hdbRemarksLast3YearsPriceNA: false,
    hdbInsurableValue: '',
    hdbInsurableValueEditOn: false,
    hdbInsurableValueNA: false,

    // Section 6: 10 SUMMARY
    // Container 1: Final Calculation & Status
    hdbSummaryLandValue: '',
    hdbSummaryLandValueEditOn: false,
    hdbSummaryFinalRecommendedValue: '',
    hdbSummaryFinalRecommendedValueEditOn: false,
    hdbFinalStatus: 'Positive',
    hdbFinalStatusCustom: '',

    // Container 2: 13 Mandatory Requirements
    hdbSetbackDeviation: 'Compliant',
    hdbSetbackDeviationDetails: '',
    hdbSetbackDeviationNA: false,
    hdbFsiViolationChecked: false,
    hdbFsiViolationDetails: '',
    hdbFsiViolationNA: false,
    hdbLocalityDetails: '',
    hdbLocalityDetailsNA: false,
    hdbDemolitionRisk: 'Low / Negligible',
    hdbDemolitionRiskCustom: '',
    hdbDemolitionRiskNA: false,
    hdbNegativeAuthorityActionChecked: false,
    hdbNegativeAuthorityActionDetails: '',
    hdbNegativeAuthorityActionNA: false,

    // Container 3: 14 Remarks
    hdbRemarksIfAny: '',
    hdbRemarksIfAnyNA: false,
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
    {
      id: 'hdb-section-general-details',
      title: 'GENERAL DETAILS',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <GeneralDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'hdb-section-document-details',
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
      id: 'hdb-section-boundaries',
      title: 'BOUNDARIES',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <BoundariesSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'hdb-section-technical-details',
      title: 'TECHNICAL DETAILS',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <TechnicalDetailsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
        />
      ),
    },
    {
      id: 'hdb-section-summary',
      title: '10 SUMMARY',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <SummarySection
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

