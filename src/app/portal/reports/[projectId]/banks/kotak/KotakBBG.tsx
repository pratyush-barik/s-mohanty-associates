'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Unlock } from 'lucide-react';
import { PDFKotakBbgRenderer } from '@/lib/banks/pdf-kotak-bbg-renderer';

const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text' }: any) => {
  const [isEdit, setIsEdit] = useState(false);
  return (
    <Field label={label}>
      <div className="flex items-center space-x-2" title={!isEdit ? tooltip : ''}>
        {type === 'textarea' ? (
           <textarea
             className={inputCls + ' flex-1 resize-y'}
             value={value}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
             rows={3}
           />
        ) : (
          <input
            type="text"
            className={inputCls + ' flex-1'}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          />
        )}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setIsEdit(!isEdit)}
          className={`p-1.5 border rounded flex-shrink-0 transition-colors ${isEdit ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
          title="Toggle Edit"
        >
          {isEdit ? <Unlock size={16} /> : <Lock size={16} />}
        </button>
      </div>
    </Field>
  );
};

export const KOTAK_BBG_CONFIG: BankConfig = {
  bankId: 'KOTAK MAHINDRA BANK',
  subTemplateId: 'BUSINESS BANKING GROUP',
  displayName: 'Kotak Mahindra Bank — Business Banking Group (BBG)',
  hiddenSections: ['section-1'],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFKotakBbgRenderer({ ...fields, projectCode }),
  navSections: [
    { id: 'kotak-section-1', title: '1. General Details' },
  ],
  defaultValues: {
    kotakBbgPurpose: 'To ascertain Market value, Realizable value & Distress value for bank decision-making',
  },
  extraSectionsStart: [
    {
      id: 'kotak-section-1',
      title: 'General Details',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Purpose of Valuation"
              value={fields.kotakBbgPurpose || ''}
              onChange={(val: string) => handleChange('kotakBbgPurpose', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
            />
            <Field label="Date of Valuation">
              <input type="date" className={inputCls} value={fields.kotakBbgDateOfValuation || ''} onChange={(e) => handleChange('kotakBbgDateOfValuation', e.target.value)} disabled={isReadOnly} />
            </Field>
            <PrefillField
              label="Name of the Valuer"
              value={fields.kotakBbgValuerName || ''}
              onChange={(val: string) => handleChange('kotakBbgValuerName', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Valuer Profile"
            />
            <Field label="Site Engineer Inspecting Property">
              <input type="text" className={inputCls} placeholder="Enter Site Engineer Name" value={fields.kotakBbgSiteEngineer || ''} onChange={e => handleChange('kotakBbgSiteEngineer', e.target.value)} disabled={isReadOnly} />
            </Field>
            <PrefillField
              label="Name of Customer / Borrower"
              value={fields.kotakBbgBorrowerName || ''}
              onChange={(val: string) => handleChange('kotakBbgBorrowerName', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Application Data"
            />
            <Field label="Name of Property Owner(s)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgOwnerSameAsBorrower || false} onChange={e => handleChange('kotakBbgOwnerSameAsBorrower', e.target.checked)} disabled={isReadOnly} />
                  <span>Same as Borrower</span>
                </label>
                {!fields.kotakBbgOwnerSameAsBorrower && (
                  <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgOwnerName || ''} onChange={e => handleChange('kotakBbgOwnerName', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
            <Field label="Date of Technical Site Visit">
              <input type="date" className={inputCls} value={fields.kotakBbgDateOfVisit || ''} onChange={(e) => handleChange('kotakBbgDateOfVisit', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Person Met at Site & Contact Details">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgPersonMetNA || false} onChange={e => handleChange('kotakBbgPersonMetNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Available (NA)</span>
                </label>
                {!fields.kotakBbgPersonMetNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgPersonMet || ''} onChange={e => handleChange('kotakBbgPersonMet', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
          </div>
        );
      }
    }
  ],
};

export default function KotakBBG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={KOTAK_BBG_CONFIG} {...props} />;
}
