'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, FileText, CheckCircle2, Plus } from 'lucide-react';

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
                <span className="truncate max-w-[150px] sm:max-w-[200px]" title={fileName}>
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
  ],
};

export default function HDBFinancial(props: BankReportBuilderProps) {
  return <BankReportBuilder config={HDB_FINANCIAL_CONFIG} {...props} />;
}
