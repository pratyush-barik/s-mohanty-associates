'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';

export const CANFIN_HOMES_CONFIG: BankConfig = {
  bankId: 'CANFIN HOMES LTD',
  subTemplateId: '',
  displayName: 'CanFin Homes Ltd',
  hiddenSections: ['section-1', 'section-1a', 'section-2', 'section-3'],
  navSections: [
    { id: 'section-cover', title: '1. Cover Page Details' },
    { id: 'canfin-section-2', title: '2. General' },
    { id: 'canfin-section-3', title: '3. Details of the Property' },
  ],
  defaultValues: {
    purpose: 'Housing Loan / Composite Loan',
    
    // Section 3 Variables
    canfinHomesEnablePlotNoEdit: false,
    canfinHomesFlatHousePlotNo: '',
    canfinHomesTypeOfProperty: 'Commercial',
    canfinHomesNoOfStories: '',
    canfinHomesTotalNoOfUnits: '',
    canfinHomesNoOfUnitsOnEachFloor: '',
    canfinHomesDetailsOfUnit: '',
    canfinHomesAgeOfTheProperty: '',
    canfinHomesEstimatedTotalLifespan: '60',
    canfinHomesEnableResidualAgeEdit: false,
    canfinHomesResidualAgeOfTheProperty: '',
    canfinHomesOccupancyDetails: 'Self occupied',
    canfinHomesVacantOrTenantedDetails: '',
    canfinHomesEnableTechnicalAddressEdit: false,
    canfinHomesTechnicalAddress: '',
    canfinHomesSameAsTechnicalAddress: false,
    canfinHomesLegalAddress: '',
    canfinHomesEnablePinCodeEdit: false,
    canfinHomesPinCode: '',
    canfinHomesDateOfValuation: '',
    
    // Section 2 Variables
    canfinHomesEnableDocHolderEdit: false,
    canfinHomesPurposeOfLoanDropdown: 'Home Loan',
    canfinHomesPurposeOfLoan: '',
    canfinHomesCustomerName: '',
    canfinHomesDocHolderName: '',
    canfinHomesDateOfTechnicalVisit: '',
    canfinHomesBuildingSocietyName: '',
    canfinHomesBuildingSocietyNameNA: false,
    canfinHomesBuilderSellerName: '',
    canfinHomesBuilderSellerNameNA: false,
    canfinHomesPersonsMet: '',
    
    // Cover Page Variables
    canfinHomesPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    canfinHomesAddressOfTheProperty: '',
    canfinHomesPresentMarketValue: '',
    canfinHomesDistressSaleValue: '',
    canfinHomesRealizableValue: '',
    canfinHomesEnableCoverPageValueEdit: false,
    canfinHomesPurposeOfValuationDropdown: 'default',
    canfinHomesPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    canfinHomesPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    canfinHomesPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    canfinHomesPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    canfinHomesPreparedByStreet: 'Shiv Nagar Tankapani Road',
    canfinHomesPreparedByCity: 'Bhubaneswar',
    canfinHomesPreparedByState: 'Odisha',
    canfinHomesPreparedByPinCode: '751018',
    canfinHomesPreparedByPhone: '06742381145',
    canfinHomesPreparedByMobile: '9937023855/9437074855',
  },
  extraSectionsStart: [
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Fallbacks if not edited (for now defaults to 0 as in screenshot when empty)
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
                onClick={() => handleChange('canfinHomesPropertyOwners', [...(fields.canfinHomesPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.canfinHomesPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.canfinHomesPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('canfinHomesPropertyOwners', arr);
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
                        const arr = [...(fields.canfinHomesPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('canfinHomesPropertyOwners', arr);
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
                        const arr = [...(fields.canfinHomesPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('canfinHomesPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.canfinHomesPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.canfinHomesPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('canfinHomesPropertyOwners', arr);
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
              <textarea className={inputCls} rows={3} value={fields.canfinHomesAddressOfTheProperty || ''} onChange={e => handleChange('canfinHomesAddressOfTheProperty', e.target.value)} disabled={isReadOnly} required />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('canfinHomesEnableCoverPageValueEdit', !fields.canfinHomesEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.canfinHomesEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.canfinHomesEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
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
                      className={`${inputCls} pr-8 ${!fields.canfinHomesEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableCoverPageValueEdit ? (fields.canfinHomesPresentMarketValue || '') : presentMarketValue.toFixed(2)} 
                      onChange={(e) => handleChange('canfinHomesPresentMarketValue', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableCoverPageValueEdit} 
                    />
                    {!fields.canfinHomesEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked'>
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
                      className={`${inputCls} pr-8 ${!fields.canfinHomesEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableCoverPageValueEdit ? (fields.canfinHomesDistressSaleValue || '') : distressSaleValue.toFixed(2)} 
                      onChange={(e) => handleChange('canfinHomesDistressSaleValue', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableCoverPageValueEdit} 
                    />
                    {!fields.canfinHomesEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked'>
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
                      className={`${inputCls} pr-8 ${!fields.canfinHomesEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableCoverPageValueEdit ? (fields.canfinHomesRealizableValue || '') : realizableValue.toFixed(2)} 
                      onChange={(e) => handleChange('canfinHomesRealizableValue', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableCoverPageValueEdit} 
                    />
                    {!fields.canfinHomesEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked'>
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
                value={fields.canfinHomesPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('canfinHomesPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('canfinHomesPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else if (val === 'present_market_value') {
                    handleChange('canfinHomesPurposeOfValuation', 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY');
                  } else {
                    handleChange('canfinHomesPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="present_market_value">TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.canfinHomesPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.canfinHomesPurposeOfValuation || ''} onChange={(e) => handleChange('canfinHomesPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.canfinHomesPreparedByCompany || ''} onChange={e => handleChange('canfinHomesPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.canfinHomesPreparedByDesignation || ''} onChange={e => handleChange('canfinHomesPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.canfinHomesPreparedByPlotNo || ''} onChange={e => handleChange('canfinHomesPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.canfinHomesPreparedByStreet || ''} onChange={e => handleChange('canfinHomesPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.canfinHomesPreparedByCity || ''} onChange={e => handleChange('canfinHomesPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.canfinHomesPreparedByState || ''} onChange={e => handleChange('canfinHomesPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.canfinHomesPreparedByPinCode || ''} onChange={e => handleChange('canfinHomesPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.canfinHomesPreparedByPhone || ''} onChange={e => { handleChange('canfinHomesPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.canfinHomesPreparedByMobile || ''} onChange={e => { handleChange('canfinHomesPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
        );
      }
    },
    {
      id: 'canfin-section-2',
      title: '2. GENERAL',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const prefilledDocHolder = fields.canfinHomesPropertyOwners?.map((o: any) => o.name).filter(Boolean).join(', ') || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-blue-200 bg-[#e3f2fd] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Loan & Customer Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Field label="Purpose Of Loan">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesPurposeOfLoanDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesPurposeOfLoanDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesPurposeOfLoan', e.target.value);
                        } else {
                          handleChange('canfinHomesPurposeOfLoan', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Home Loan">Home Loan</option>
                      <option value="Loan Against Property">Loan Against Property</option>
                      <option value="Working Capital">Working Capital</option>
                      <option value="Priority Banking">Priority Banking</option>
                      <option value="Agri">Agri</option>
                      <option value="CC">CC</option>
                      <option value="BT">BT</option>
                      <option value="TL">TL</option>
                      <option value="LAP DOD">LAP DOD</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesPurposeOfLoanDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom purpose..."
                      value={fields.canfinHomesPurposeOfLoan || ''} 
                      onChange={e => handleChange('canfinHomesPurposeOfLoan', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <Field label="Name of the Customer">
                  <input className={inputCls} value={fields.canfinHomesCustomerName || ''} onChange={e => handleChange('canfinHomesCustomerName', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Name of Document holder as per legal docs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableDocHolderEdit', !fields.canfinHomesEnableDocHolderEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableDocHolderEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableDocHolderEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <input 
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnableDocHolderEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableDocHolderEdit ? (fields.canfinHomesDocHolderName || '') : prefilledDocHolder} 
                      onChange={e => handleChange('canfinHomesDocHolderName', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableDocHolderEdit} 
                      title='>>Prefill from section 1, field "PROPERTY OWNER"<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 1, field "PROPERTY OWNER"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableDocHolderEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
                <Field label="Date of Technical Visit">
                  <BaseDateInput
                    value={fields.canfinHomesDateOfTechnicalVisit || ''}
                    onChange={(val) => handleChange('canfinHomesDateOfTechnicalVisit', val)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Name of The Building/Society</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesBuildingSocietyNameNA} 
                        onChange={e => {
                          handleChange('canfinHomesBuildingSocietyNameNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesBuildingSocietyName', 'NA');
                          else handleChange('canfinHomesBuildingSocietyName', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesBuildingSocietyNameNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesBuildingSocietyNameNA ? 'NA' : (fields.canfinHomesBuildingSocietyName || '')} 
                    onChange={e => handleChange('canfinHomesBuildingSocietyName', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesBuildingSocietyNameNA} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Name of the Builder/Seller</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesBuilderSellerNameNA} 
                        onChange={e => {
                          handleChange('canfinHomesBuilderSellerNameNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesBuilderSellerName', 'NA');
                          else handleChange('canfinHomesBuilderSellerName', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesBuilderSellerNameNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesBuilderSellerNameNA ? 'NA' : (fields.canfinHomesBuilderSellerName || '')} 
                    onChange={e => handleChange('canfinHomesBuilderSellerName', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesBuilderSellerNameNA} 
                  />
                </Field>
                <Field label="Person(s) Met [Name & Designation]">
                  <input className={inputCls} value={fields.canfinHomesPersonsMet || ''} onChange={e => handleChange('canfinHomesPersonsMet', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'canfin-section-3',
      title: '3. DETAILS OF THE PROPERTY',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const prefilledPlotNo = fields.canfinHomesPreparedByPlotNo || '';
        const estimatedLifespan = Number(fields.canfinHomesEstimatedTotalLifespan || 60);
        const ageOfProperty = Number(fields.canfinHomesAgeOfTheProperty || 0);
        const autoResidualAge = Math.max(0, estimatedLifespan - ageOfProperty).toString();
        const prefilledTechnicalAddress = fields.canfinHomesAddressOfTheProperty || '';
        const prefilledPinCode = fields.canfinHomesPreparedByPinCode || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Property Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Flat/House/Plot No.">
                  <div className="relative">
                    <input 
                      className={`${inputCls} pr-10 ${!fields.canfinHomesEnablePlotNoEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnablePlotNoEdit ? (fields.canfinHomesFlatHousePlotNo || '') : prefilledPlotNo} 
                      onChange={e => handleChange('canfinHomesFlatHousePlotNo', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnablePlotNoEdit} 
                      title='>>Prefill from section 1, field "PLOT NUMBER"<<'
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700"
                      onClick={() => handleChange('canfinHomesEnablePlotNoEdit', !fields.canfinHomesEnablePlotNoEdit)}
                      disabled={isReadOnly}
                      title='>>Prefill from section 1, field "PLOT NUMBER"<<'
                    >
                      <Lock className={`w-4 h-4 ${!fields.canfinHomesEnablePlotNoEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </Field>
                <Field label="Type of Property">
                  <select className={inputCls} value={fields.canfinHomesTypeOfProperty || ''} onChange={e => handleChange('canfinHomesTypeOfProperty', e.target.value)} disabled={isReadOnly}>
                    <option value="Commercial">Commercial</option>
                    <option value="Godown">Godown</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Specialized property">Specialized property</option>
                    <option value="Vacant Plot">Vacant Plot</option>
                    <option value="Hotel">Hotel</option>
                  </select>
                </Field>
                <Field label="No. of Stories">
                  <input type="number" className={inputCls} value={fields.canfinHomesNoOfStories || ''} onChange={e => handleChange('canfinHomesNoOfStories', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Multi-Storey Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="For Multi storey building: Total no of units">
                  <input type="number" className={inputCls} value={fields.canfinHomesTotalNoOfUnits || ''} onChange={e => handleChange('canfinHomesTotalNoOfUnits', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="No of Units on each floor">
                  <input type="number" className={inputCls} value={fields.canfinHomesNoOfUnitsOnEachFloor || ''} onChange={e => handleChange('canfinHomesNoOfUnitsOnEachFloor', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Details of unit" className="md:col-span-2">
                  <input className={inputCls} value={fields.canfinHomesDetailsOfUnit || ''} onChange={e => handleChange('canfinHomesDetailsOfUnit', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Age & Occupancy Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Age Of The property">
                  <input type="number" className={inputCls} value={fields.canfinHomesAgeOfTheProperty || ''} onChange={e => handleChange('canfinHomesAgeOfTheProperty', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Residual age of the Property">
                  <div className="relative">
                    <input 
                      className={`${inputCls} pr-10 ${!fields.canfinHomesEnableResidualAgeEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableResidualAgeEdit ? (fields.canfinHomesResidualAgeOfTheProperty || '') : autoResidualAge} 
                      onChange={e => handleChange('canfinHomesResidualAgeOfTheProperty', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableResidualAgeEdit} 
                      title='>>Auto calculates values from [Estimated Total Lifespan - Age Of The property]<<'
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700"
                      onClick={() => handleChange('canfinHomesEnableResidualAgeEdit', !fields.canfinHomesEnableResidualAgeEdit)}
                      disabled={isReadOnly}
                      title='>>Auto calculates values from [Estimated Total Lifespan - Age Of The property]<<'
                    >
                      <Lock className={`w-4 h-4 ${!fields.canfinHomesEnableResidualAgeEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </Field>
                <Field label="Occupancy details" className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Self occupied', 'Vacant', 'Tenanted'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="canfinHomesOccupancyDetails"
                          value={opt}
                          checked={fields.canfinHomesOccupancyDetails === opt}
                          onChange={(e) => handleChange('canfinHomesOccupancyDetails', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                {(fields.canfinHomesOccupancyDetails === 'Vacant' || fields.canfinHomesOccupancyDetails === 'Tenanted') && (
                  <Field label="IF Vacant then from how long/ If tenanted then Name/List of Tenants" className="md:col-span-2">
                    <input className={inputCls} value={fields.canfinHomesVacantOrTenantedDetails || ''} onChange={e => handleChange('canfinHomesVacantOrTenantedDetails', e.target.value)} disabled={isReadOnly} />
                  </Field>
                )}
              </div>
            </div>

            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Technical Address of property (Survey No./Plot no/House no/Flat No.) Location/District/State">
                  <div className="relative">
                    <textarea 
                      className={`${inputCls} pr-10 ${!fields.canfinHomesEnableTechnicalAddressEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      rows={3}
                      value={fields.canfinHomesEnableTechnicalAddressEdit ? (fields.canfinHomesTechnicalAddress || '') : prefilledTechnicalAddress} 
                      onChange={e => handleChange('canfinHomesTechnicalAddress', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableTechnicalAddressEdit} 
                      title='>>Prefill from section 1, field "ADDRESS OF THE PROPERTY"<<'
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700"
                      onClick={() => handleChange('canfinHomesEnableTechnicalAddressEdit', !fields.canfinHomesEnableTechnicalAddressEdit)}
                      disabled={isReadOnly}
                      title='>>Prefill from section 1, field "ADDRESS OF THE PROPERTY"<<'
                    >
                      <Lock className={`w-4 h-4 ${!fields.canfinHomesEnableTechnicalAddressEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </Field>
                <div className="flex flex-col gap-2">
                  <Field label="Legal Address of property (Survey No./Plot no/House no/Flat No.) Location/District/State Pls mention as per deed">
                    <div className="relative">
                      <textarea 
                        className={`${inputCls} pr-10 ${fields.canfinHomesSameAsTechnicalAddress ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                        rows={3}
                        value={fields.canfinHomesSameAsTechnicalAddress ? (fields.canfinHomesEnableTechnicalAddressEdit ? (fields.canfinHomesTechnicalAddress || '') : prefilledTechnicalAddress) : (fields.canfinHomesLegalAddress || '')} 
                        onChange={e => handleChange('canfinHomesLegalAddress', e.target.value)} 
                        disabled={isReadOnly || fields.canfinHomesSameAsTechnicalAddress} 
                        title={fields.canfinHomesSameAsTechnicalAddress ? '>>Prefill from section 3, field "Technical Address of property"<<' : ''}
                      />
                      {fields.canfinHomesSameAsTechnicalAddress && (
                        <div
                          className="absolute top-2 right-0 flex items-center pr-3 group text-emerald-700"
                          title='>>Prefill from section 3, field "Technical Address of property"<<'
                        >
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </Field>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={fields.canfinHomesSameAsTechnicalAddress}
                      onChange={(e) => handleChange('canfinHomesSameAsTechnicalAddress', e.target.checked)}
                      disabled={isReadOnly}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Same as Technical Address</span>
                  </label>
                </div>
                <Field label="Pin Code">
                  <div className="relative">
                    <input 
                      type="number"
                      className={`${inputCls} pr-10 ${!fields.canfinHomesEnablePinCodeEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnablePinCodeEdit ? (fields.canfinHomesPinCode || '') : prefilledPinCode} 
                      onChange={e => handleChange('canfinHomesPinCode', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnablePinCodeEdit} 
                      title='>>Prefill from section 1, field "PIN CODE"<<'
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700"
                      onClick={() => handleChange('canfinHomesEnablePinCodeEdit', !fields.canfinHomesEnablePinCodeEdit)}
                      disabled={isReadOnly}
                      title='>>Prefill from section 1, field "PIN CODE"<<'
                    >
                      <Lock className={`w-4 h-4 ${!fields.canfinHomesEnablePinCodeEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </button>
                  </div>
                </Field>
                <Field label="Date of Valuation">
                  <BaseDateInput
                    value={fields.canfinHomesDateOfValuation || ''}
                    onChange={(val) => handleChange('canfinHomesDateOfValuation', val)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        );
      }
    }
  ],
  getPDFRenderer: (data, projectCode) => {
    const { PDFCanFinHomesRenderer } = require('@/lib/banks/pdf-canfin-homes-renderer');
    return new PDFCanFinHomesRenderer(data, projectCode);
  },
};

export default function CanFinHomes(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CANFIN_HOMES_CONFIG} {...props} />;
}
