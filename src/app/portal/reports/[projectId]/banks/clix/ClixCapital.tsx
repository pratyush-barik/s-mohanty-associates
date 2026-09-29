'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig, BaseReportFields } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';

export const CLIX_CAPITAL_CONFIG: BankConfig = {
  bankId: 'CLIX CAPITAL LTD',
  subTemplateId: '',
  displayName: 'Clix Capital Ltd',
  hiddenSections: [
    'section-1', 'section-1a', 'section-2', 'section-3', 
    'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 
    'section-8', 'section-9', 'section-10', 'section-13', 'section-14', 'section-15'
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  navSections: [
    { id: 'section-cover', title: 'COVER PAGE' },
    { id: 'clix-section-1', title: 'Report Type' },
    { id: 'clix-section-2', title: 'Customer Details' },
    { id: 'clix-section-3', title: 'Property Address' },
    { id: 'section-11', title: 'Photos' },
    { id: 'section-12', title: 'Maps' }
  ],
  
  extraSectionsStart: [
    {
      id: 'clix-section-1',
      title: 'Report Type',
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
            <div className="animate-fade-in space-y-6">
              <div className="border border-[#F5F5F5] bg-[#F5F5F5] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Report Type</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Field label="Report Type">
                      <select
                        className={inputCls}
                        value={fields.clixReportType || ''}
                        onChange={e => {
                          handleChange('clixReportType', e.target.value);
                          if (e.target.value !== 'Custom') {
                            handleChange('clixReportTypeCustom', '');
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="">Select Report Type</option>
                        <option value="Technical Scrutiny Report">Technical Scrutiny Report</option>
                        <option value="Valuation">Valuation</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </Field>
                    {fields.clixReportType === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom report type"
                        className={inputCls}
                        value={fields.clixReportTypeCustom || ''}
                        onChange={e => handleChange('clixReportTypeCustom', e.target.value)}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>

                  <Field label="LAP/HL/Top up">
                    <div className="flex gap-4 h-10 items-center">
                      {['LAP', 'HL', 'Top up'].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="clixLoanType"
                            value={type}
                            checked={fields.clixLoanType === type}
                            onChange={(e) => handleChange('clixLoanType', e.target.value)}
                            disabled={isReadOnly}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Application No</span>
                      {renderNaToggle('clixApplicationNoNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixApplicationNoNA ? 'NA' : (fields.clixApplicationNo || '')}
                      onChange={e => handleChange('clixApplicationNo', e.target.value)}
                      disabled={isReadOnly || !!fields.clixApplicationNoNA}
                    />
                  </Field>

                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Collateral ID</span>
                      {renderNaToggle('clixCollateralIdNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixCollateralIdNA ? 'NA' : (fields.clixCollateralId || '')}
                      onChange={e => handleChange('clixCollateralId', e.target.value)}
                      disabled={isReadOnly || !!fields.clixCollateralIdNA}
                    />
                  </Field>
                </div>
              </div>
            </div>
          );
      }
    },
    {
      id: 'clix-section-2',
      title: 'Customer Details',
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
            <div className="animate-fade-in space-y-6">
              <div className="border border-[#E3F2FD] bg-[#E3F2FD] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Customer Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Borrower Name">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixBorrowerName || ''}
                      onChange={e => handleChange('clixBorrowerName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Borrower Contact No</span>
                      {renderNaToggle('clixBorrowerContactNoNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      maxLength={10}
                      className={inputCls}
                      value={fields.clixBorrowerContactNoNA ? 'NA' : (fields.clixBorrowerContactNo || '')}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('clixBorrowerContactNo', val);
                      }}
                      disabled={isReadOnly || !!fields.clixBorrowerContactNoNA}
                    />
                  </Field>

                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                        checked={!!fields.clixRepSameAsBorrower}
                        onChange={e => handleChange('clixRepSameAsBorrower', e.target.checked)}
                        disabled={isReadOnly}
                      />
                      <span className="text-sm font-medium text-gray-700">Representative same as Borrower</span>
                    </label>
                  </div>

                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center">
                        <span>Borrower Representative Name</span>
                        {renderNaToggle('clixBorrowerRepNameNA', fields, handleChange, isReadOnly)}
                      </div>
                      {renderEditSwitch('clixBorrowerRepNameEdit', fields, handleChange, isReadOnly, !!fields.clixBorrowerRepNameNA)}
                    </div>
                  }>
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} pr-10 ${fields.clixBorrowerRepNameEdit && !fields.clixBorrowerRepNameNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                        value={fields.clixBorrowerRepNameNA ? 'NA' : (fields.clixBorrowerRepNameEdit ? (fields.clixBorrowerRepName || '') : (fields.clixRepSameAsBorrower ? (fields.clixBorrowerName || '') : (fields.clixBorrowerRepName || '')))}
                        onChange={e => handleChange('clixBorrowerRepName', e.target.value)}
                        disabled={isReadOnly || !!fields.clixBorrowerRepNameNA || !fields.clixBorrowerRepNameEdit}
                      />
                      {!fields.clixBorrowerRepNameEdit && !fields.clixBorrowerRepNameNA && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                          <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                        </div>
                      )}
                    </div>
                  </Field>
                  
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center">
                        <span>Borrower Rep Contact No</span>
                        {renderNaToggle('clixBorrowerRepContactNoNA', fields, handleChange, isReadOnly)}
                      </div>
                      {renderEditSwitch('clixBorrowerRepContactNoEdit', fields, handleChange, isReadOnly, !!fields.clixBorrowerRepContactNoNA)}
                    </div>
                  }>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={10}
                        className={`${inputCls} pr-10 ${fields.clixBorrowerRepContactNoEdit && !fields.clixBorrowerRepContactNoNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                        value={fields.clixBorrowerRepContactNoNA ? 'NA' : (fields.clixBorrowerRepContactNoEdit ? (fields.clixBorrowerRepContactNo || '') : (fields.clixRepSameAsBorrower ? (fields.clixBorrowerContactNo || '') : (fields.clixBorrowerRepContactNo || '')))}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleChange('clixBorrowerRepContactNo', val);
                        }}
                        disabled={isReadOnly || !!fields.clixBorrowerRepContactNoNA || !fields.clixBorrowerRepContactNoEdit}
                      />
                      {!fields.clixBorrowerRepContactNoEdit && !fields.clixBorrowerRepContactNoNA && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                          <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                        </div>
                      )}
                    </div>
                  </Field>
                  
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Relationship Manager Name</span>
                      {renderNaToggle('clixRmNameNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixRmNameNA ? 'NA' : (fields.clixRmName || '')}
                      onChange={e => handleChange('clixRmName', e.target.value)}
                      disabled={isReadOnly || !!fields.clixRmNameNA}
                    />
                  </Field>
                  
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Relationship Manager Contact No</span>
                      {renderNaToggle('clixRmContactNoNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      maxLength={10}
                      className={inputCls}
                      value={fields.clixRmContactNoNA ? 'NA' : (fields.clixRmContactNo || '')}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('clixRmContactNo', val);
                      }}
                      disabled={isReadOnly || !!fields.clixRmContactNoNA}
                    />
                  </Field>
                </div>
              </div>
            </div>
          );
      }
    },
    {
      id: 'clix-section-3',
      title: 'Property Address',
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
            <div className="animate-fade-in space-y-6">
              <div className="border border-[#E8F5E9] bg-[#E8F5E9] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Property Address</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Field label="Property Address (as per initiation)">
                      <textarea
                        className={`${inputCls} resize-y min-h-15`}
                        rows={2}
                        value={fields.clixPropertyAddressInitiation || ''}
                        onChange={e => handleChange('clixPropertyAddressInitiation', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <Field label={
                      <div className="w-full flex items-center justify-between">
                        <span>Property Address (as per site)</span>
                        {renderEditSwitch('clixPropertyAddressSiteEdit', fields, handleChange, isReadOnly)}
                      </div>
                    }>
                      <div className="relative">
                        <textarea 
                          className={`${inputCls} pr-10 resize-y min-h-15 ${fields.clixPropertyAddressSiteEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                          rows={2}
                          value={fields.clixPropertyAddressSiteEdit ? (fields.clixPropertyAddressSite || '') : (fields.clixPropertyAddressInitiation || '')} 
                          onChange={e => handleChange('clixPropertyAddressSite', e.target.value)} 
                          disabled={isReadOnly || !fields.clixPropertyAddressSiteEdit} 
                          title='>>Prefill from "Property Address (as per initiation)"<<'
                        />
                        {!fields.clixPropertyAddressSiteEdit && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from "Property Address (as per initiation)"<<'>
                            <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                          </div>
                        )}
                      </div>
                    </Field>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <Field label={
                      <div className="w-full flex items-center justify-between">
                        <span>Property Address (as per documents)</span>
                        {renderEditSwitch('clixPropertyAddressDocsEdit', fields, handleChange, isReadOnly)}
                      </div>
                    }>
                      <div className="relative">
                        <textarea 
                          className={`${inputCls} pr-10 resize-y min-h-15 ${fields.clixPropertyAddressDocsEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                          rows={2}
                          value={fields.clixPropertyAddressDocsEdit ? (fields.clixPropertyAddressDocs || '') : (fields.clixPropertyAddressInitiation || '')} 
                          onChange={e => handleChange('clixPropertyAddressDocs', e.target.value)} 
                          disabled={isReadOnly || !fields.clixPropertyAddressDocsEdit} 
                          title='>>Prefill from "Property Address (as per initiation)"<<'
                        />
                        {!fields.clixPropertyAddressDocsEdit && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from "Property Address (as per initiation)"<<'>
                            <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                          </div>
                        )}
                      </div>
                    </Field>
                  </div>

                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Nearest Landmark</span>
                      {renderNaToggle('clixNearestLandmarkNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixNearestLandmarkNA ? 'NA' : (fields.clixNearestLandmark || '')}
                      onChange={e => handleChange('clixNearestLandmark', e.target.value)}
                      disabled={isReadOnly || !!fields.clixNearestLandmarkNA}
                    />
                  </Field>

                  <div className="flex flex-col gap-2">
                    <Field label="City">
                      <select
                        className={inputCls}
                        value={fields.clixCity || ''}
                        onChange={e => {
                          handleChange('clixCity', e.target.value);
                          if (e.target.value !== 'Custom') {
                            handleChange('clixCityCustom', '');
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="">Select City</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Kolkata">Kolkata</option>
                        <option value="Pune">Pune</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </Field>
                    {fields.clixCity === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom city"
                        className={inputCls}
                        value={fields.clixCityCustom || ''}
                        onChange={e => handleChange('clixCityCustom', e.target.value)}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Field label="State">
                      <select
                        className={inputCls}
                        value={fields.clixState || ''}
                        onChange={e => {
                          handleChange('clixState', e.target.value);
                          if (e.target.value !== 'Custom') {
                            handleChange('clixStateCustom', '');
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                        <option value="Assam">Assam</option>
                        <option value="Bihar">Bihar</option>
                        <option value="Chhattisgarh">Chhattisgarh</option>
                        <option value="Goa">Goa</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Himachal Pradesh">Himachal Pradesh</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Manipur">Manipur</option>
                        <option value="Meghalaya">Meghalaya</option>
                        <option value="Mizoram">Mizoram</option>
                        <option value="Nagaland">Nagaland</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Sikkim">Sikkim</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tripura">Tripura</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Uttarakhand">Uttarakhand</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                        <option value="Ladakh">Ladakh</option>
                        <option value="Lakshadweep">Lakshadweep</option>
                        <option value="Puducherry">Puducherry</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </Field>
                    {fields.clixState === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom state"
                        className={inputCls}
                        value={fields.clixStateCustom || ''}
                        onChange={e => handleChange('clixStateCustom', e.target.value)}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>

                  <Field label="Pin Code">
                    <input
                      type="text"
                      maxLength={6}
                      className={inputCls}
                      value={fields.clixPinCode || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('clixPinCode', val);
                      }}
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
  defaultValues: {
    clixReportType: 'Technical Scrutiny Report',
    clixLoanType: 'LAP'
  }
};

const renderNaToggle = (
  fieldKey: string,
  fields: Partial<BaseReportFields>,
  handleChange: (k: string, v: any) => void,
  isReadOnly: boolean
) => {
  const isNa = !!fields[fieldKey as keyof BaseReportFields];
  return (
    <label className="flex items-center gap-1 cursor-pointer ml-3">
      <input
        type="checkbox"
        className="rounded text-emerald-600 focus:ring-emerald-500"
        checked={isNa}
        onChange={(e) => {
          const checked = e.target.checked;
          handleChange(fieldKey, checked);
          if (checked) {
            handleChange(fieldKey.replace('NA', ''), 'NA');
          } else {
            handleChange(fieldKey.replace('NA', ''), '');
          }
        }}
        disabled={isReadOnly}
      />
      <span className="text-[10px] uppercase font-bold text-gray-400">NA</span>
    </label>
  );
};

const renderEditSwitch = (
  fieldKey: string,
  fields: Partial<BaseReportFields>,
  handleChange: (k: string, v: any) => void,
  isReadOnly: boolean,
  isNa: boolean = false
) => {
  const editOn = !!fields[fieldKey as keyof BaseReportFields];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase font-bold text-gray-400">Edit {editOn ? 'On' : 'Off'}</span>
      <button
        type="button"
        onClick={() => handleChange(fieldKey, !editOn)}
        disabled={isReadOnly || isNa}
        className={`w-10 h-5 rounded-full relative transition-colors ${(editOn && !isNa) ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editOn ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
};

export default function ClixCapital(props: BankReportBuilderProps) {
  return (
    <BankReportBuilder
      config={CLIX_CAPITAL_CONFIG}
      {...props}
      />
  );
}
