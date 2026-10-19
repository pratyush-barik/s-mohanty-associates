'use client';

import React, { useRef, useEffect } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import {
  Building,
  Lock,
  Calculator,
} from 'lucide-react';

// ─── Reusable Helper Components ─────────────────────────────────────────────

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

// ─── Poonawalla Finance BankConfig ──────────────────────────────────────────

export const POONAWALLA_FINANCE_CONFIG: BankConfig = {
  bankId: 'POONAWALLA FINANCE',
  subTemplateId: '',
  displayName: 'Poonawalla Fincorp Ltd',
  hiddenSections: [
    'section-1', // Replaced by Section 1: VALUATION OF IMMOVABLE PROPERTY
    'section-2', // Replaced by Section 2: VALUE OF THE PROPERTY
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  navSections: [
    { id: 'poonawalla-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'poonawalla-section-2', title: 'VALUE OF THE PROPERTY' },
    { id: 'section-3', title: 'Property Details' },
    { id: 'section-4', title: 'Subject Property' },
    { id: 'section-5', title: 'Structural Details' },
    { id: 'section-6', title: 'Plan Approvals' },
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
  ],
  defaultValues: {
    purpose: 'Mortgage / Business Finance / LAP',
  },
};

export default function PoonawallaFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={POONAWALLA_FINANCE_CONFIG} {...props} />;
}
