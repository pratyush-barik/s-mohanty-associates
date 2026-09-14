'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFAxisFinanceRenderer } from '@/lib/banks/pdf-axis-finance-renderer';
import { Field, inputCls } from '../BaseBankReportComponents';

export const AXIS_FINANCE_CONFIG: BankConfig = {
  bankId: 'AXIS FINANCE LTD',
  subTemplateId: '',
  displayName: 'Axis Finance Ltd',
  navSections: [
    { id: 'section-cover', title: 'Cover Page Details' },
    { id: 'section-2', title: 'Locality Details' },
    { id: 'section-3', title: 'Property Details' },
    { id: 'section-4', title: 'Subject Property' },
    { id: 'section-5', title: 'Structural Details' },
    { id: 'section-6', title: 'Plan Approvals' },
    { id: 'section-7', title: 'Area Valuation' },
    { id: 'section-8', title: 'Land Valuation' },
    { id: 'section-9', title: 'Valuation Abstract' },
    { id: 'section-10', title: 'Remarks' },
    { id: 'section-11', title: 'Certificate' },
    { id: 'section-12', title: 'Photographs' },
    { id: 'section-13', title: 'Sketch Maps' },
    { id: 'section-14', title: 'Location Map' },
    { id: 'section-15', title: 'Annexures' },
  ],
  hiddenSections: ['section-1'],
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  defaultValues: {
    propertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    addressOfTheProperty: '',
    presentMarketValue: '',
    distressSaleValue: '',
    enableCoverPageValueEdit: false,
    purposeOfValuationDropdown: 'default',
    purposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    preparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    preparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    preparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    preparedByStreet: 'Shiv Nagar Tankapani Road',
    preparedByCity: 'Bhubaneswar',
    preparedByState: 'Odisha',
    preparedByPinCode: '751018',
    preparedByPhone: '06742381145',
    preparedByMobile: '9937023855/9437074855',
  },
  extraSectionsStart: [
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-6">
          <div className="border border-blue-200 bg-[#f8fafc] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('propertyOwners', [...(fields.propertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.propertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('propertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="Relationship" className="w-40">
                    <input
                      list={`relations-${idx}`}
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('propertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. S/O"
                    />
                    <datalist id={`relations-${idx}`}>
                      <option value="S/O" />
                      <option value="D/O" />
                      <option value="W/O" />
                      <option value="C/O" />
                    </datalist>
                  </Field>
                  <Field label="OWNER'S RELATIVE'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.relativeName || owner.fatherName || ''}
                      onChange={(e) => {
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('propertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.propertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.propertyOwners];
                        arr.splice(idx, 1);
                        handleChange('propertyOwners', arr);
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
            <Field label="ADDRESS OF THE PROPERTY">
              <textarea className={inputCls} rows={3} value={fields.addressOfTheProperty || ''} onChange={e => handleChange('addressOfTheProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('enableCoverPageValueEdit', !fields.enableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.enableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.enableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input className={`${inputCls} ${!fields.enableCoverPageValueEdit ? 'bg-gray-50' : ''}`} value={fields.presentMarketValue || ''} onChange={(e) => handleChange('presentMarketValue', e.target.value)} disabled={isReadOnly || !fields.enableCoverPageValueEdit} />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Current Value of Property (Plot + Construction) field from Section 6.</span>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input className={`${inputCls} ${!fields.enableCoverPageValueEdit ? 'bg-gray-50' : ''}`} value={fields.distressSaleValue || ''} onChange={(e) => handleChange('distressSaleValue', e.target.value)} disabled={isReadOnly || !fields.enableCoverPageValueEdit} />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Distressed Valuation of the Property field from Section 6</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.purposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('purposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('purposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else {
                    handleChange('purposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.purposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.purposeOfValuation || ''} onChange={(e) => handleChange('purposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.preparedByCompany || ''} onChange={e => handleChange('preparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.preparedByDesignation || ''} onChange={e => handleChange('preparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.preparedByPlotNo || ''} onChange={e => handleChange('preparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.preparedByStreet || ''} onChange={e => handleChange('preparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.preparedByCity || ''} onChange={e => handleChange('preparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.preparedByState || ''} onChange={e => handleChange('preparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.preparedByPinCode || ''} onChange={e => handleChange('preparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.preparedByPhone || ''} onChange={e => { handleChange('preparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.preparedByMobile || ''} onChange={e => { handleChange('preparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      )
    }
  ],
  getPDFRenderer: (fields) => new PDFAxisFinanceRenderer(fields)
};

export default function AxisFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_FINANCE_CONFIG} {...props} />;
}
