'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';
import { PDFIciciBankNpaRenderer } from '@/lib/banks/pdf-icici-bank-npa-renderer';

// ─── PrefillField component (same pattern as ICICIBankHLLAPBBG) ─────────────
const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text', fallbackValue, options, customInputProps, hideEditToggle = false, rows = 3 }: any) => {
  const [isEdit, setIsEdit] = useState(false);

  React.useEffect(() => {
    if (!isEdit && fallbackValue !== undefined && value !== fallbackValue) {
      onChange(fallbackValue);
    }
  }, [isEdit, fallbackValue, value, onChange]);

  const handleToggle = () => setIsEdit(!isEdit);
  const displayValue = isEdit ? (value || '') : (fallbackValue !== undefined ? (fallbackValue || '') : (value || ''));

  const labelWithToggle = (
    <div className="flex justify-between items-center w-full">
      <div className="flex-1 flex items-center pr-4">{label}</div>
      {!hideEditToggle && (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase ${isEdit ? 'text-emerald-700' : 'text-gray-400'}`}>
            {isEdit ? 'Edit On' : 'Edit Off'}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isReadOnly}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${isEdit ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Field label={labelWithToggle}>
      <div className="relative mt-1">
        {type === 'textarea' ? (
           <textarea
             className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
             value={displayValue}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
             rows={rows}
           />
        ) : type === 'select' ? (
          (() => {
            const optionValues = options?.map((opt: any) => opt.value) || [];
            const isKnownOption = optionValues.includes(displayValue);
            if (!isEdit && !isKnownOption && displayValue) {
              return <input type="text" className={`${inputCls} pr-8 bg-gray-100 cursor-not-allowed text-gray-700`} value={displayValue} disabled />;
            }
            return (
              <>
                <select
                   className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
                   value={displayValue}
                   onChange={e => onChange(e.target.value)}
                   disabled={isReadOnly || !isEdit}
                >
                  {options?.map((opt: any, i: number) => <option key={i} value={opt.value}>{opt.label}</option>)}
                </select>
                {displayValue === 'Custom' && customInputProps && (
                  <input
                    type="text"
                    className={`${inputCls} mt-2 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
                    value={customInputProps.value || ''}
                    onChange={e => customInputProps.onChange(e.target.value)}
                    disabled={isReadOnly || !isEdit}
                  />
                )}
              </>
            );
          })()
        ) : type === 'radio' ? (
          <div className="flex gap-4 items-center h-full pt-2 pl-2">
            {options?.map((opt: string) => (
              <label key={opt} className={`flex items-center gap-2 text-sm font-medium ${!isEdit ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer text-gray-700'}`}>
                <input type="radio" value={opt} checked={displayValue === opt} onChange={e => onChange(e.target.value)} disabled={isReadOnly || !isEdit} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-50" />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <input
            type={type === 'number' ? 'number' : 'text'}
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          />
        )}
        {!isEdit && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={tooltip}>
            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        )}
      </div>
    </Field>
  );
};

// ─── Bank Config ─────────────────────────────────────────────────────────────
export const ICICI_BANK_NPA_CONFIG: BankConfig = {
  bankId: 'ICICI BANK',
  subTemplateId: 'NPA',
  displayName: 'ICICI Bank — NPA',
  id: 'icici-npa',
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'section-15', 'annexures'],
  navSections: [
    { id: 'icicinpa-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFIciciBankNpaRenderer({ ...fields, projectCode }),
  extraSectionsStart: [
    // ── SECTION 1: VALUATION OF IMMOVABLE PROPERTY ──────────────────
    {
      id: 'icicinpa-section-1',
      title: 'VALUATION OF IMMOVABLE PROPERTY',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Container: General Information */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
              General Information
            </h4>

            {/* PROPERTY OWNER — prefill from Customer Name (Section 2) */}
            <PrefillField
              label="PROPERTY OWNER"
              type="text"
              value={fields.icicinpaPropOwner}
              onChange={(val: string) => handleChange('icicinpaPropOwner', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Customer Name (Section 2)'
              fallbackValue={fields.icicinpaCustomerName}
            />

            {/* ADDRESS OF THE PROPERTY — prefill from Property Address (Section 3) */}
            <PrefillField
              label="ADDRESS OF THE PROPERTY"
              type="textarea"
              rows={3}
              value={fields.icicinpaPropAddress}
              onChange={(val: string) => handleChange('icicinpaPropAddress', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Property Address (Section 3)'
              fallbackValue={fields.icicinpaPropertyAddress}
            />

            {/* PRESENT MARKET VALUE — prefill from Round Off Total (Section 9) */}
            <PrefillField
              label="PRESENT MARKET VALUE"
              type="number"
              value={fields.icicinpaPresentMarketValue}
              onChange={(val: string) => handleChange('icicinpaPresentMarketValue', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Round Off Total (Section 9)'
              fallbackValue={fields.icicinpaRoundOffTotal}
            />

            {/* DISTRESS SALE VALUE — prefill from Distress Value (Section 7) */}
            <PrefillField
              label="DISTRESS SALE VALUE"
              type="number"
              value={fields.icicinpaDistressSaleValue}
              onChange={(val: string) => handleChange('icicinpaDistressSaleValue', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Distress Value (Section 7)'
              fallbackValue={fields.icicinpaDistressValue}
            />

            {/* REALIZABLE VALUE — prefill from Realize Value (Section 7) */}
            <PrefillField
              label="REALIZABLE VALUE"
              type="number"
              value={fields.icicinpaRealizableValue}
              onChange={(val: string) => handleChange('icicinpaRealizableValue', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Realize Value (Section 7)'
              fallbackValue={fields.icicinpaRealizeValue}
            />

            {/* PURPOSE OF VALUATION — Dropdown */}
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.icicinpaPurposeOfValuation || ''}
                onChange={e => handleChange('icicinpaPurposeOfValuation', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Purpose...</option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR NPA PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR NPA PURPOSES
                </option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR LOAN PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR LOAN PURPOSES
                </option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR MORTGAGE PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR MORTGAGE PURPOSES
                </option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR AUCTION PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR AUCTION PURPOSES
                </option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaPurposeOfValuation === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom purpose..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaPurposeOfValuationCustom || ''}
                  onChange={e => handleChange('icicinpaPurposeOfValuationCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* PREPARED BY — prefill from logged-in valuer profile */}
            <PrefillField
              label="PREPARED BY"
              type="text"
              value={fields.icicinpaPreparedBy}
              onChange={(val: string) => handleChange('icicinpaPreparedBy', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from logged-in valuer profile'
              fallbackValue={fields.valuerName}
            />
          </div>
        );
      }
    },
    // Additional sections will be added here as prompts are provided
  ]
};

export default function ICICIBankNPA(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ICICI_BANK_NPA_CONFIG} {...props} />;
}
