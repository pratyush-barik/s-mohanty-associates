'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';
import { PDFIciciBankHlLapBbgRenderer } from '@/lib/banks/pdf-icici-bank-hllap-bbg-renderer';

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isReadOnly}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${isEdit ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
          <span className={`text-[10px] font-bold uppercase ${isEdit ? 'text-emerald-700' : 'text-gray-400'}`}>
            {isEdit ? 'Edit On' : 'Edit Off'}
          </span>
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
        ) : (
          <input
            type="text"
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

export const ICICI_BANK_HL_LAP_BBG_CONFIG: BankConfig = {
  bankId: 'ICICI BANK',
  subTemplateId: 'HL-LAP-BBG',
  displayName: 'ICICI Bank — HL-LAP-BBG',
  id: 'icici-hllap-bbg',
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'section-15', 'annexures'],
  sectionNumbers: {
    'documents': 11,
    'section-12': 12,
    'section-11': 13,
    'section-15': 15,
  },
  navSections: [
    { id: 'icici-section-1', title: '1 CUSTOMER DETAILS' },
    { id: 'icici-section-2', title: '2 PROPERTY DETAILS' },
    { id: 'icici-section-3', title: '3 DOCUMENT DETAILS' },
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFIciciBankHlLapBbgRenderer({ ...fields, projectCode }),
  extraSectionsStart: [
    {
      id: 'icici-section-1',
      title: '1 CUSTOMER DETAILS',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly, projectCode) => {
        const today = new Date().toISOString().split('T')[0];
        const refNoVal = projectCode || '';
        
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Ref No"
              value={fields.iciciBbgRefNo}
              onChange={(val: string) => handleChange('iciciBbgRefNo', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Project Case ID"
              fallbackValue={refNoVal}
            />
            <PrefillField
              label="Date"
              type="text" // Date picker simulation
              value={fields.iciciBbgDate}
              onChange={(val: string) => handleChange('iciciBbgDate', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Current Date"
              fallbackValue={today}
              customInputProps={{ type: 'date' }} // Can handle in UI, but standard input type=text fallback is fine if not explicitly implemented in PrefillField date type. Let's adapt below.
            />
            {/* The PrefillField doesn't natively support type=date beautifully, let's fix the Date field manually to match specs */}
            <Field label="Format for Resale / LAP / Builder (if non APF) / Balance Transfer/ Land Loan">
              <select
                className={inputCls}
                value={fields.iciciBbgFormat || ''}
                onChange={e => handleChange('iciciBbgFormat', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Format...</option>
                <option value="Resale">Resale</option>
                <option value="LAP">LAP</option>
                <option value="Builder">Builder</option>
                <option value="Balance Transfer">Balance Transfer</option>
                <option value="Land Loan">Land Loan</option>
              </select>
            </Field>

            <Field label="Customer Name">
              <textarea
                className={`${inputCls} resize-y`}
                rows={2}
                value={fields.iciciBbgCustomerName || ''}
                onChange={e => handleChange('iciciBbgCustomerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Application Number">
              <input
                type="text"
                className={inputCls}
                value={fields.iciciBbgAppNo || ''}
                onChange={e => handleChange('iciciBbgAppNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="DMA/ Nodal Point">
              <input
                type="text"
                className={inputCls}
                value={fields.iciciBbgDmaNodal || ''}
                onChange={e => handleChange('iciciBbgDmaNodal', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Case Type">
              <select
                className={inputCls}
                value={fields.iciciBbgCaseType || ''}
                onChange={e => handleChange('iciciBbgCaseType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Case Type...</option>
                <option value="Home Loan">Home Loan</option>
                <option value="LAP">LAP</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.iciciBbgCaseType === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom case type"
                  className={`${inputCls} mt-2`}
                  value={fields.iciciBbgCaseTypeCustom || ''}
                  onChange={e => handleChange('iciciBbgCaseTypeCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>
          </div>
        );
      }
    },
    {
      id: 'icici-section-2',
      title: '2 PROPERTY DETAILS',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Address of Property">
              <textarea
                className={`${inputCls} resize-y`}
                rows={3}
                value={fields.iciciBbgAddressOfProperty || ''}
                onChange={e => handleChange('iciciBbgAddressOfProperty', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={!!fields.iciciBbgLegalAddressSame}
                  onChange={e => handleChange('iciciBbgLegalAddressSame', e.target.checked)}
                  disabled={isReadOnly}
                />
                Legal Address is same as Address of Property
              </label>
            </Field>

            <PrefillField
              label="Legal Address (Survey No. / FP No. / Khasra No./ Plot No)"
              type="textarea"
              rows={3}
              value={fields.iciciBbgLegalAddress}
              onChange={(val: string) => handleChange('iciciBbgLegalAddress', val)}
              isReadOnly={isReadOnly}
              tooltip={fields.iciciBbgLegalAddressSame ? 'Prefill from section 2, "Address of Property"' : ''}
              fallbackValue={fields.iciciBbgLegalAddressSame ? fields.iciciBbgAddressOfProperty : undefined}
            />

            <Field label="Nearby landmark">
              <input
                type="text"
                className={inputCls}
                value={fields.iciciBbgNearbyLandmark || ''}
                onChange={e => handleChange('iciciBbgNearbyLandmark', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        );
      }
    },
    {
      id: 'icici-section-3',
      title: '3 DOCUMENT DETAILS',
      number: 3,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Layout Plan Provided">
              <div className="flex gap-4">
                {['YES', 'NO', 'NA'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="iciciBbgLayoutProvided" value={opt} checked={fields.iciciBbgLayoutProvided === opt} onChange={e => handleChange('iciciBbgLayoutProvided', e.target.value)} disabled={isReadOnly} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            
            <Field label="Approving Authority">
              <input type="text" className={inputCls} value={fields.iciciBbgLayoutAuth || ''} onChange={e => handleChange('iciciBbgLayoutAuth', e.target.value)} disabled={isReadOnly} />
            </Field>
            
            <Field label="Approval Number">
              <input type="text" className={inputCls} value={fields.iciciBbgLayoutApprovalNo || ''} onChange={e => handleChange('iciciBbgLayoutApprovalNo', e.target.value)} disabled={isReadOnly} />
            </Field>

            <Field label="Building Plan Provided">
              <div className="flex gap-4">
                {['YES', 'NO', 'NA'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="iciciBbgBldgPlanProvided" value={opt} checked={fields.iciciBbgBldgPlanProvided === opt} onChange={e => handleChange('iciciBbgBldgPlanProvided', e.target.value)} disabled={isReadOnly} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            
            <Field label="Approving Authority">
              <input type="text" className={inputCls} value={fields.iciciBbgBldgPlanAuth || ''} onChange={e => handleChange('iciciBbgBldgPlanAuth', e.target.value)} disabled={isReadOnly} />
            </Field>
            
            <Field label="Number of Floors">
              <input type="number" className={inputCls} value={fields.iciciBbgBldgPlanFloors || ''} onChange={e => handleChange('iciciBbgBldgPlanFloors', e.target.value)} disabled={isReadOnly} />
            </Field>

            <Field label="Construction Permission">
              <div className="flex gap-4">
                {['YES', 'NO', 'NA'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="iciciBbgConstPermProvided" value={opt} checked={fields.iciciBbgConstPermProvided === opt} onChange={e => handleChange('iciciBbgConstPermProvided', e.target.value)} disabled={isReadOnly} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            
            <Field label="Approving Authority">
              <input type="text" className={inputCls} value={fields.iciciBbgConstPermAuth || ''} onChange={e => handleChange('iciciBbgConstPermAuth', e.target.value)} disabled={isReadOnly} />
            </Field>
            
            <Field label="Number of Floors">
              <input type="number" className={inputCls} value={fields.iciciBbgConstPermFloors || ''} onChange={e => handleChange('iciciBbgConstPermFloors', e.target.value)} disabled={isReadOnly} />
            </Field>

            <Field label="Legal Document (Resale/LAP)">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={!!fields.iciciBbgDocRor} onChange={e => handleChange('iciciBbgDocRor', e.target.checked)} disabled={isReadOnly} />
                    COPY OF ROR
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={!!fields.iciciBbgDocSaleDeed} onChange={e => handleChange('iciciBbgDocSaleDeed', e.target.checked)} disabled={isReadOnly} />
                    SALE DEED
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={!!fields.iciciBbgDocOther} onChange={e => handleChange('iciciBbgDocOther', e.target.checked)} disabled={isReadOnly} />
                    OTHER
                  </label>
                </div>
                {fields.iciciBbgDocOther && (
                  <textarea
                    className={`${inputCls} resize-y mt-2`}
                    rows={2}
                    placeholder="Enter other documents..."
                    value={fields.iciciBbgDocOtherText || ''}
                    onChange={e => handleChange('iciciBbgDocOtherText', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </div>
            </Field>
          </div>
        );
      }
    }
  ]
};

export default function ICICIBankHLLAPBBG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ICICI_BANK_HL_LAP_BBG_CONFIG} {...props} />;
}
