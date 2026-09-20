'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFBankOfBarodaRenderer } from '@/lib/banks/pdf-bank-of-baroda-renderer';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';

export const BANK_OF_BARODA_CONFIG: BankConfig = {
  bankId: 'BANK OF BARODA',
  subTemplateId: 'Standard',
  displayName: 'Bank of Baroda — Standard',
  hiddenSections: [
    'section-1', 'section-1a', 'section-2', 'section-3', 'section-4', 'section-5',
    'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10',
    'layout-config', 'section-11', 'section-12', 'annexures'
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  hideDefaultDeclarationAndCertificate: true,
  navSections: [
    { id: 'section-cover', title: '1. Cover Page Details' },
  ],
  fieldLabels: {},
  defaultValues: {
    bobPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    bobAddressOfTheProperty: '',
    bobEnableCoverPageValueEdit: true,
    bobPresentMarketValue: '',
    bobDistressSaleValue: '',
    bobRealizableValue: '',
    bobPurposeOfValuationDropdown: 'default',
    bobPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    bobPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    bobPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    bobPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    bobPreparedByStreet: 'Shiv Nagar Tankapani Road',
    bobPreparedByCity: 'Bhubaneswar',
    bobPreparedByState: 'Odisha',
    bobPreparedByPinCode: '751018',
    bobPreparedByPhone: '06742381145',
    bobPreparedByMobile: '9937023855/9437074855',
  },
  extraSectionsStart: [
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Mock computation since Section 9 isn't implemented for BOB yet
        const presentMarketValue = 0;
        const distressSaleValue = 0;
        const realizableValue = 0;

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border border-blue-200 bg-[#f8fafc] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('bobPropertyOwners', [...(fields.bobPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.bobPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.bobPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('bobPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="RELATIONSHIP" className="w-40">
                    <select
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.bobPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('bobPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      <option value="">Select</option>
                      <option value="S/O">S/O</option>
                      <option value="D/O">D/O</option>
                      <option value="W/O">W/O</option>
                      <option value="C/O">C/O</option>
                    </select>
                  </Field>
                  <Field label="OWNER'S RELATIVE'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.relativeName || owner.fatherName || ''}
                      onChange={(e) => {
                        const arr = [...(fields.bobPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('bobPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.bobPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.bobPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('bobPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label={<span>ADDRESS OF THE PROPERTY <span className="text-red-500">*</span></span>}>
              <textarea className={inputCls} rows={3} value={fields.bobAddressOfTheProperty || ''} onChange={e => handleChange('bobAddressOfTheProperty', e.target.value)} disabled={isReadOnly} required />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('bobEnableCoverPageValueEdit', !fields.bobEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.bobEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.bobEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.bobEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.bobEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1">
                    <input 
                      className={`${inputCls} pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobPresentMarketValue || '') : presentMarketValue.toFixed(2)} 
                      onChange={(e) => handleChange('bobPresentMarketValue', e.target.value)} 
                      disabled={isReadOnly || !fields.bobEnableCoverPageValueEdit} 
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked calculation (Currently 0)'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1">
                    <input 
                      className={`${inputCls} pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobDistressSaleValue || '') : distressSaleValue.toFixed(2)} 
                      onChange={(e) => handleChange('bobDistressSaleValue', e.target.value)} 
                      disabled={isReadOnly || !fields.bobEnableCoverPageValueEdit} 
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked calculation (Currently 0)'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">REALIZABLE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1">
                    <input 
                      className={`${inputCls} pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobRealizableValue || '') : realizableValue.toFixed(2)} 
                      onChange={(e) => handleChange('bobRealizableValue', e.target.value)} 
                      disabled={isReadOnly || !fields.bobEnableCoverPageValueEdit} 
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked calculation (Currently 0)'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.bobPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('bobPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('bobPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else if (val === 'present_market_value') {
                    handleChange('bobPurposeOfValuation', 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY');
                  } else {
                    handleChange('bobPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="present_market_value">TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.bobPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.bobPurposeOfValuation || ''} onChange={(e) => handleChange('bobPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.bobPreparedByCompany || ''} onChange={e => handleChange('bobPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.bobPreparedByDesignation || ''} onChange={e => handleChange('bobPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.bobPreparedByPlotNo || ''} onChange={e => handleChange('bobPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.bobPreparedByStreet || ''} onChange={e => handleChange('bobPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.bobPreparedByCity || ''} onChange={e => handleChange('bobPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.bobPreparedByState || ''} onChange={e => handleChange('bobPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.bobPreparedByPinCode || ''} onChange={e => handleChange('bobPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.bobPreparedByPhone || ''} onChange={e => { handleChange('bobPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.bobPreparedByMobile || ''} onChange={e => { handleChange('bobPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
        );
      }
    }
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFBankOfBarodaRenderer({
    ...fields,
  })
};

export default function BankOfBaroda(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANK_OF_BARODA_CONFIG} {...props} />;
}
