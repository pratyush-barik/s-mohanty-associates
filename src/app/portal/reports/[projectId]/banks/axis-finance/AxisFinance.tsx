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
    { id: 'axis-section-2', title: 'Client & Application Details' },
    { id: 'axis-section-3', title: 'Property Location & Locality Details' },
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
  hiddenSections: ['section-1', 'section-2', 'section-3'],
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
    },
    {
      id: 'axis-section-2',
      title: 'Client & Application Details',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const isOwnerEditOn = fields.enablePropertyOwnerEdit || false;
        const computedOwnersText = (fields.propertyOwners || [])
          .filter((o: any) => o.name)
          .map((o: any) => `${o.name}, ${o.relationship || 'S/O'}- ${o.relativeName || o.fatherName || ''}`)
          .join('\n');
        const propertyOwnerValue = isOwnerEditOn ? (fields.propertyOwnerNames ?? computedOwnersText) : computedOwnersText;
        
        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0F7FF', borderColor: '#BAE6FD' }}>
            <h3 className="font-bold text-gray-700 mb-4">CUSTOMER & LOAN INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Product / Loan Category (LOAN AGAINST PROPERTY (LAP))"><input className={inputCls} value={fields.productLoanCategory || ''} onChange={e => handleChange('productLoanCategory', e.target.value)} disabled={isReadOnly} placeholder="e.g., LAP – RESIDENTIAL BUILDING" /></Field>
              <Field label="Application Number"><input className={inputCls} value={fields.loanApplicationNo || ''} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Date"><input type="date" className={inputCls} value={fields.dateOfValuation || ''} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Name of the Customer"><input className={inputCls} value={fields.ownerName || ''} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} /></Field>
              
              <div className="col-span-1 w-full flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Name of the Property Owner(S)</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isOwnerEditOn ? 'On' : 'Off'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwnerEditOn && !fields.propertyOwnerNames) {
                           handleChange('propertyOwnerNames', computedOwnersText);
                        }
                        handleChange('enablePropertyOwnerEdit', !isOwnerEditOn);
                      }}
                      disabled={isReadOnly}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isOwnerEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isOwnerEditOn ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
                <textarea
                  className={inputCls}
                  rows={isOwnerEditOn ? 3 : Math.max(1, (fields.propertyOwners || []).length)}
                  value={propertyOwnerValue}
                  onChange={e => handleChange('propertyOwnerNames', e.target.value)}
                  readOnly={!isOwnerEditOn}
                  disabled={isReadOnly || !isOwnerEditOn}
                />
              </div>

              <Field label="Collateral Ownership"><input className={inputCls} value={fields.collateralOwnership || ''} onChange={e => handleChange('collateralOwnership', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Collateral Category"><input className={inputCls} value={fields.collateralCategory || ''} onChange={e => handleChange('collateralCategory', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Property Documents Received" span={2}>
                <textarea className={inputCls} rows={3} value={fields.propertyDocumentsReceived || ''} onChange={e => handleChange('propertyDocumentsReceived', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      );
      }
    },
    {
      id: 'axis-section-3',
      title: 'Property Location & Locality Details',
      number: 3,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        let computedCity = '';
        let computedDistrict = '';
        let computedState = '';
        let computedPinCode = '';
        
        const address = [fields.propertyDetailsAxis, fields.propertyAddressAxis, fields.addressOfTheProperty].filter(Boolean).join(' ');
        if (address) {
          const pinMatch = address.match(/\b(\d{6})\b/);
          if (pinMatch) computedPinCode = pinMatch[1];
          
          const distMatch = address.match(/(?:Dist|District)[\s-]*([A-Za-z]+)/i);
          if (distMatch && distMatch[1]) {
            computedDistrict = distMatch[1];
            computedCity = computedDistrict;
          }
          
          const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'];
          for (const s of states) {
            if (address.toLowerCase().includes(s.toLowerCase())) {
              computedState = s;
              break;
            }
          }
          
          if (!computedDistrict) {
            const parts = address.split(',').map((p: string) => p.trim());
            const stateIdx = parts.findIndex((p: string) => computedState && p.toLowerCase().includes(computedState.toLowerCase()));
            if (stateIdx > 0) {
              computedCity = parts[stateIdx - 1];
            } else if (parts.length >= 3) {
              computedCity = parts[parts.length - 3];
            }
          }
        }

        const renderDropdownWithCustom = (label: string, fieldKey: string, options: string[]) => {
          const isCustomKey = `${fieldKey}_isCustom`;
          const isCustom = fields[isCustomKey] || false;
          return (
            <Field label={label}>
              <select
                className={inputCls}
                value={isCustom ? 'Custom' : (fields[fieldKey] || '')}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Custom') {
                    handleChange(isCustomKey, true);
                    handleChange(fieldKey, '');
                  } else {
                    handleChange(isCustomKey, false);
                    handleChange(fieldKey, val);
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {isCustom && (
                <input className={`${inputCls} mt-2`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly} placeholder="Enter custom value..." />
              )}
            </Field>
          );
        };

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY ADDRESS & IDENTIFICATION</h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Edit {fields.enableAddressEdit ? 'On' : 'Off'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (fields.enableAddressEdit) {
                      // Turning off: clear manual edits so it falls back to computed
                      handleChange('propertyDetailsAxis', undefined);
                      handleChange('propertyAddressAxis', undefined);
                      handleChange('city', undefined);
                      handleChange('district', undefined);
                      handleChange('state', undefined);
                      handleChange('pinCode', undefined);
                    }
                    handleChange('enableAddressEdit', !fields.enableAddressEdit);
                  }}
                  disabled={isReadOnly}
                  className={`w-8 h-4 rounded-full relative transition-colors ${fields.enableAddressEdit ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${fields.enableAddressEdit ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property details" span={2}>
                <textarea className={inputCls} rows={3} value={fields.enableAddressEdit ? (fields.propertyDetailsAxis ?? fields.addressOfTheProperty ?? '') : (fields.addressOfTheProperty ?? '')} onChange={e => handleChange('propertyDetailsAxis', e.target.value)} disabled={isReadOnly || !fields.enableAddressEdit} />
              </Field>
              <Field label="Property Address" span={2}>
                <textarea className={inputCls} rows={3} value={fields.enableAddressEdit ? (fields.propertyAddressAxis ?? fields.addressOfTheProperty ?? '') : (fields.addressOfTheProperty ?? '')} onChange={e => handleChange('propertyAddressAxis', e.target.value)} disabled={isReadOnly || !fields.enableAddressEdit} />
              </Field>
              <Field label="City"><input className={inputCls} value={fields.enableAddressEdit ? (fields.city ?? computedCity) : computedCity} onChange={e => handleChange('city', e.target.value)} disabled={isReadOnly || !fields.enableAddressEdit} /></Field>
              <Field label="District"><input className={inputCls} value={fields.enableAddressEdit ? (fields.district ?? computedDistrict) : computedDistrict} onChange={e => handleChange('district', e.target.value)} disabled={isReadOnly || !fields.enableAddressEdit} /></Field>
              <Field label="State"><input className={inputCls} value={fields.enableAddressEdit ? (fields.state ?? computedState) : computedState} onChange={e => handleChange('state', e.target.value)} disabled={isReadOnly || !fields.enableAddressEdit} /></Field>
              <Field label="Pin Code"><input className={inputCls} value={fields.enableAddressEdit ? (fields.pinCode ?? computedPinCode) : computedPinCode} onChange={e => handleChange('pinCode', e.target.value)} disabled={isReadOnly || !fields.enableAddressEdit} /></Field>
            </div>
          </div>
          
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
            <h3 className="font-bold text-gray-700 mb-4">LOCALITY & OCCUPANCY CHARACTERISTICS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nearby Land Mark"><input className={inputCls} value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Distance from City Center"><input className={inputCls} value={fields.distanceFromCityCenter || ''} onChange={e => handleChange('distanceFromCityCenter', e.target.value)} disabled={isReadOnly} /></Field>
              
              {renderDropdownWithCustom('Classification of Locality', 'classificationOfLocalityAxis', ['Developing', 'Developed', 'Underdeveloped', 'Stagnant / Fully Developed', 'Decaying / Declining', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Approved by Town', 'approvedByTownAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Agricultural', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Locality Classification', 'localityClassificationAxis', ['IMP_OPTIONS', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Building Type', 'buildingTypeAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Institutional', 'Warehouse', 'NA', 'Custom'])}
              <Field label="Class of Locality"><input className={inputCls} value={fields.classOfLocality || ''} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly} /></Field>
              {renderDropdownWithCustom('Type of Locality', 'typeOfLocalityAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Mixed Use', 'Rural / Village Abadi', 'NA', 'Custom'])}
              <Field label="Condition of Building"><input className={inputCls} value={fields.conditionOfBuildingAxis || ''} onChange={e => handleChange('conditionOfBuildingAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Occupancy Details"><input className={inputCls} value={fields.occupancyDetailsAxis || ''} onChange={e => handleChange('occupancyDetailsAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Monthly Rentals for Freehold Prop"><input className={inputCls} value={fields.monthlyRentalsFreeholdAxis || ''} onChange={e => handleChange('monthlyRentalsFreeholdAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Name of the Lease"><input className={inputCls} value={fields.nameOfTheLeaseAxis || ''} onChange={e => handleChange('nameOfTheLeaseAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Type Of Property"><input className={inputCls} value={fields.propertyType || ''} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Status Of Property"><input className={inputCls} value={fields.statusOfPropertyAxis || ''} onChange={e => handleChange('statusOfPropertyAxis', e.target.value)} disabled={isReadOnly} /></Field>
              {renderDropdownWithCustom('Actual Usage Of Property', 'actualUsageOfPropertyAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Mixed (Residential + Commercial)', 'Vacant', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Approved Usage of Property', 'approvedUsageOfPropertyAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'NA / Unapproved / GP Limit', 'NA', 'Custom'])}
              <Field label="Property Demarcation at Site"><input className={inputCls} value={fields.plotDemarcated || ''} onChange={e => handleChange('plotDemarcated', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Distance: Nearest Metro / Bus Station / Railway Station/Airport"><input className={inputCls} value={fields.distanceNearestMetroBusRailwayAirportAxis || ''} onChange={e => handleChange('distanceNearestMetroBusRailwayAirportAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Nearness to recreation facilities"><input className={inputCls} value={fields.nearnessToRecreationFacilitiesAxis || ''} onChange={e => handleChange('nearnessToRecreationFacilitiesAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Quality of Interiors"><input className={inputCls} value={fields.qualityOfInteriorsAxis || ''} onChange={e => handleChange('qualityOfInteriorsAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Vastu Compliance or direction of the entrance"><input className={inputCls} value={fields.vastuComplianceDirectionAxis || ''} onChange={e => handleChange('vastuComplianceDirectionAxis', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
        </div>
      );
      }
    }
  ],
  getPDFRenderer: (fields) => {
    // Inject computed fields if edit is off so PDF renderer sees them
    if (!fields.enableAddressEdit) {
      const address = [fields.propertyDetailsAxis, fields.propertyAddressAxis, fields.addressOfTheProperty].filter(Boolean).join(' ');
      let computedCity = '';
      let computedDistrict = '';
      let computedState = '';
      let computedPinCode = '';
      if (address) {
        const pinMatch = address.match(/\b(\d{6})\b/);
        if (pinMatch) computedPinCode = pinMatch[1];
        const distMatch = address.match(/(?:Dist|District)[\s-]*([A-Za-z]+)/i);
        if (distMatch && distMatch[1]) {
          computedDistrict = distMatch[1];
          computedCity = computedDistrict;
        }
        const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'];
        for (const s of states) {
          if (address.toLowerCase().includes(s.toLowerCase())) {
            computedState = s;
            break;
          }
        }
        if (!computedDistrict) {
          const parts = address.split(',').map((p: string) => p.trim());
          const stateIdx = parts.findIndex((p: string) => computedState && p.toLowerCase().includes(computedState.toLowerCase()));
          if (stateIdx > 0) computedCity = parts[stateIdx - 1];
          else if (parts.length >= 3) computedCity = parts[parts.length - 3];
        }
      }
      fields = {
        ...fields,
        propertyDetailsAxis: fields.addressOfTheProperty || '',
        propertyAddressAxis: fields.addressOfTheProperty || '',
        city: computedCity,
        district: computedDistrict,
        state: computedState,
        pinCode: computedPinCode
      };
    }
    return new PDFAxisFinanceRenderer(fields);
  }
};

export default function AxisFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_FINANCE_CONFIG} {...props} />;
}
