'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFAxisSBBRenderer } from '@/lib/banks/pdf-axis-sbb-renderer';
import { Field, inputCls } from '../BaseBankReportComponents';

export const AXIS_SBB_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'SBB',
  displayName: 'Axis Bank — SBB (Small Business Banking)',
  hiddenSections: ['section-1', 'section-2'],
  extraSections: [],
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  fieldLabels: {},
  defaultValues: {
    axisSbbReportRefNo: '',
    axisSbbReportInitiatedBy: '',
    axisSbbAreaName: '',
    axisSbbOwnerName: '',
    axisSbbCustomerName: '',
    axisSbbDateOfVisit: '',
    axisSbbDateOfReport: '',
    axisSbbSaleDeedDiscretions: '',
    axisSbbPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    axisSbbAddressOfTheProperty: '',
    axisSbbPresentMarketValue: '',
    axisSbbDistressSaleValue: '',
    axisSbbEnableCoverPageValueEdit: false,
    axisSbbPurposeOfValuationDropdown: 'default',
    axisSbbPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    axisSbbPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    axisSbbPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    axisSbbPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    axisSbbPreparedByStreet: 'Shiv Nagar Tankapani Road',
    axisSbbPreparedByCity: 'Bhubaneswar',
    axisSbbPreparedByState: 'Odisha',
    axisSbbPreparedByPinCode: '751018',
    axisSbbPreparedByPhone: '06742381145',
    axisSbbPreparedByMobile: '9937023855/9437074855',
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
                onClick={() => handleChange('axisSbbPropertyOwners', [...(fields.axisSbbPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.axisSbbPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="Relationship" className="w-40">
                    <input
                      list={`sbb-relations-${idx}`}
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. S/O"
                    />
                    <datalist id={`sbb-relations-${idx}`}>
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
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.axisSbbPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.axisSbbPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('axisSbbPropertyOwners', arr);
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
              <textarea className={inputCls} rows={3} value={fields.axisSbbAddressOfTheProperty || ''} onChange={e => handleChange('axisSbbAddressOfTheProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('axisSbbEnableCoverPageValueEdit', !fields.axisSbbEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.axisSbbEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.axisSbbEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.axisSbbEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.axisSbbEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbPresentMarketValue || '') : (() => {
                      const v8 = Number(fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
                      if (v8 > 0) return v8.toFixed(2);
                      const v7 = Number(fields.axisSbbMarketValueOfTheUnit || 0);
                      return v7 > 0 ? v7.toFixed(2) : '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbPresentMarketValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Current Value of Property (Plot + Construction) from Section 7 / Section 8</span>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbDistressSaleValue || '') : (() => {
                      const v9 = Number(fields.axisSbbDistressValueOfTheProperty || 0);
                      return v9 > 0 ? v9.toFixed(2) : '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbDistressSaleValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Distress Valuation of the Property field from Section 9</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.axisSbbPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('axisSbbPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('axisSbbPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else {
                    handleChange('axisSbbPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.axisSbbPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.axisSbbPurposeOfValuation || ''} onChange={(e) => handleChange('axisSbbPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.axisSbbPreparedByCompany || ''} onChange={e => handleChange('axisSbbPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.axisSbbPreparedByDesignation || ''} onChange={e => handleChange('axisSbbPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.axisSbbPreparedByPlotNo || ''} onChange={e => handleChange('axisSbbPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.axisSbbPreparedByStreet || ''} onChange={e => handleChange('axisSbbPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.axisSbbPreparedByCity || ''} onChange={e => handleChange('axisSbbPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.axisSbbPreparedByState || ''} onChange={e => handleChange('axisSbbPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.axisSbbPreparedByPinCode || ''} onChange={e => handleChange('axisSbbPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.axisSbbPreparedByPhone || ''} onChange={e => { handleChange('axisSbbPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.axisSbbPreparedByMobile || ''} onChange={e => { handleChange('axisSbbPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'axis-sbb-section-2',
      title: 'Case Details & Report Metadata',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const isOwnerEditOn = fields.axisSbbEnableOwnerNameEdit || false;
        const computedOwnersText = (fields.axisSbbPropertyOwners || [])
          .filter((o: any) => o.name)
          .map((o: any) => `${o.name}`)
          .join(' & ');
        const propertyOwnerValue = isOwnerEditOn ? (fields.axisSbbOwnerName ?? computedOwnersText) : computedOwnersText;

        const maxVisitDate = new Date().toISOString().split('T')[0];

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }}>
            <h3 className="font-bold text-gray-700 mb-4">CASE DETAILS & REPORT METADATA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Report Reference Number">
                <input className={inputCls} required value={fields.axisSbbReportRefNo || ''} onChange={e => handleChange('axisSbbReportRefNo', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SMA/1/07-26/09" />
              </Field>
              <Field label="Report Initiated By Area">
                <input list="axisSbbInitiatedByList" className={inputCls} value={fields.axisSbbReportInitiatedBy || ''} onChange={e => handleChange('axisSbbReportInitiatedBy', e.target.value)} disabled={isReadOnly} placeholder="E.g., BHUBANESWAR" />
                <datalist id="axisSbbInitiatedByList">
                  <option value="BHUBANESWAR" />
                  <option value="CUTTACK" />
                  <option value="SAMBALPUR" />
                </datalist>
              </Field>
              <Field label="Name of Area">
                <input className={inputCls} value={fields.axisSbbAreaName || ''} onChange={e => handleChange('axisSbbAreaName', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SAMBALPUR" />
              </Field>

              <div className="col-span-1 w-full flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Name of Owner <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isOwnerEditOn ? 'On' : 'Off'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwnerEditOn && !fields.axisSbbOwnerName) {
                           handleChange('axisSbbOwnerName', computedOwnersText);
                        }
                        handleChange('axisSbbEnableOwnerNameEdit', !isOwnerEditOn);
                      }}
                      disabled={isReadOnly}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isOwnerEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isOwnerEditOn ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
                <input
                  className={inputCls}
                  required
                  value={propertyOwnerValue}
                  onChange={e => handleChange('axisSbbOwnerName', e.target.value.toUpperCase())}
                  readOnly={!isOwnerEditOn}
                  disabled={isReadOnly || !isOwnerEditOn}
                />
              </div>

              <Field label="Name of Customer">
                <input className={inputCls} required value={fields.axisSbbCustomerName || ''} onChange={e => handleChange('axisSbbCustomerName', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SHREE MATESWARI ENTERPRISES" />
              </Field>
              <Field label="Date of Property Visit">
                <input type="date" max={maxVisitDate} className={inputCls} value={fields.axisSbbDateOfVisit || ''} onChange={e => handleChange('axisSbbDateOfVisit', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Report">
                <input type="date" min={fields.axisSbbDateOfVisit || ''} className={inputCls} value={fields.axisSbbDateOfReport || ''} onChange={e => handleChange('axisSbbDateOfReport', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sale Deed Discretions For Which Valuation Done" span={2}>
                <textarea className={inputCls} rows={2} value={fields.axisSbbSaleDeedDiscretions || ''} onChange={e => handleChange('axisSbbSaleDeedDiscretions', e.target.value)} disabled={isReadOnly} placeholder="E.g., COPY OF SALE DEED, ROR & SKETCH MAP" />
              </Field>
            </div>
          </div>
        </div>
        );
      }
    },
  ],
  getPDFRenderer: (fields: any) => new PDFAxisSBBRenderer(fields),
};

export default function AxisSBB(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_SBB_CONFIG} {...props} />;
}
