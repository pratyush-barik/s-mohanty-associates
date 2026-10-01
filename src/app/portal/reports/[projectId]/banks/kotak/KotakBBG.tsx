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
  hiddenSections: ['section-1', 'section-2'],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFKotakBbgRenderer({ ...fields, projectCode }),
  navSections: [
    { id: 'kotak-section-1', title: '1. General Details' },
    { id: 'kotak-section-2', title: '2. Details of Property Being Appraised' },
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
    },
    {
      id: 'kotak-section-2',
      title: 'Details of Property Being Appraised',
      number: 2,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Technical Address (as per site)">
              <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgTechnicalAddress || ''} onChange={e => handleChange('kotakBbgTechnicalAddress', e.target.value)} disabled={isReadOnly} />
            </Field>
            <PrefillField
              label="Legal Address (as per documents)"
              value={fields.kotakBbgLegalAddress || ''}
              onChange={(val: string) => handleChange('kotakBbgLegalAddress', val)}
              isReadOnly={isReadOnly}
              type="textarea"
              tooltip="Prefill from Legal Title Deed"
            />
            <Field label="Google Coordinates">
              <div className="flex space-x-2">
                <input type="text" className={inputCls + ' flex-1'} value={fields.kotakBbgGoogleCoordinates || ''} onChange={e => handleChange('kotakBbgGoogleCoordinates', e.target.value)} disabled={isReadOnly} />
                <button type="button" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors" disabled={isReadOnly}>Fetch Location</button>
              </div>
            </Field>
            <Field label="Nature of Property">
              <select className={inputCls} value={fields.kotakBbgNatureOfProperty || ''} onChange={e => handleChange('kotakBbgNatureOfProperty', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Nature</option>
                <option value="Vacant Land">Vacant Land</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Others">Others</option>
              </select>
            </Field>
            <Field label="Tenure of Property">
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgTenure" value="Freehold" checked={fields.kotakBbgTenure === 'Freehold'} onChange={e => handleChange('kotakBbgTenure', e.target.value)} disabled={isReadOnly} />
                  <span>Freehold</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgTenure" value="Leasehold" checked={fields.kotakBbgTenure === 'Leasehold'} onChange={e => handleChange('kotakBbgTenure', e.target.value)} disabled={isReadOnly} />
                  <span>Leasehold</span>
                </label>
              </div>
            </Field>
            <Field label="Lease Terms (if applicable)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLeaseTermsNA || false} onChange={e => handleChange('kotakBbgLeaseTermsNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgLeaseTermsNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgLeaseTerms || ''} onChange={e => handleChange('kotakBbgLeaseTerms', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
            <Field label="Transferability of Leasehold Rights">
              <select className={inputCls} value={fields.kotakBbgTransferability || ''} onChange={e => handleChange('kotakBbgTransferability', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </Field>
            <Field label="Occupancy Details">
              <select className={inputCls} value={fields.kotakBbgOccupancy || ''} onChange={e => handleChange('kotakBbgOccupancy', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Occupancy</option>
                <option value="Self Occupied">Self Occupied</option>
                <option value="Tenanted">Tenanted</option>
                <option value="Vacant">Vacant</option>
                <option value="Partly Occupied">Partly Occupied</option>
              </select>
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
