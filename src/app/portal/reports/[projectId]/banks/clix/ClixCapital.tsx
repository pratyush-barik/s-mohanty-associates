'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig, BaseReportFields } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Plus, Trash2 } from 'lucide-react';

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
    { id: 'clix-section-4', title: 'Visit Details' },
    { id: 'clix-section-5', title: 'Document Details' },
    { id: 'clix-section-6', title: 'Property Details' },
    { id: 'clix-section-7', title: 'Specifications' },
    { id: 'clix-section-8', title: 'Boundaries and Set Backs' },
    { id: 'clix-section-9', title: 'Area and Usage Detail' },
    { id: 'clix-section-10', title: 'Fair Market Value' },
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
                        title={!fields.clixBorrowerRepNameEdit && !fields.clixBorrowerRepNameNA ? 'Prefill from section 2, "Borrower Name"' : undefined}
                        className={`${inputCls} pr-10 ${fields.clixBorrowerRepNameEdit && !fields.clixBorrowerRepNameNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                        value={fields.clixBorrowerRepNameNA ? 'NA' : (fields.clixBorrowerRepNameEdit ? (fields.clixBorrowerRepName || '') : (fields.clixRepSameAsBorrower ? (fields.clixBorrowerName || '') : (fields.clixBorrowerRepName || '')))}
                        onChange={e => handleChange('clixBorrowerRepName', e.target.value)}
                        disabled={isReadOnly || !!fields.clixBorrowerRepNameNA || !fields.clixBorrowerRepNameEdit}
                      />
                      {!fields.clixBorrowerRepNameEdit && !fields.clixBorrowerRepNameNA && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 2, "Borrower Name"'>
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
                        title={!fields.clixBorrowerRepContactNoEdit && !fields.clixBorrowerRepContactNoNA ? 'Prefill from section 2, "Borrower Contact No"' : undefined}
                        className={`${inputCls} pr-10 ${fields.clixBorrowerRepContactNoEdit && !fields.clixBorrowerRepContactNoNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                        value={fields.clixBorrowerRepContactNoNA ? 'NA' : (fields.clixBorrowerRepContactNoEdit ? (fields.clixBorrowerRepContactNo || '') : (fields.clixRepSameAsBorrower ? (fields.clixBorrowerContactNo || '') : (fields.clixBorrowerRepContactNo || '')))}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleChange('clixBorrowerRepContactNo', val);
                        }}
                        disabled={isReadOnly || !!fields.clixBorrowerRepContactNoNA || !fields.clixBorrowerRepContactNoEdit}
                      />
                      {!fields.clixBorrowerRepContactNoEdit && !fields.clixBorrowerRepContactNoNA && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 2, "Borrower Contact No"'>
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
                          title={!fields.clixPropertyAddressSiteEdit ? 'Prefill from section 3, "Property Address (as per initiation)"' : undefined}
                        />
                        {!fields.clixPropertyAddressSiteEdit && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 3, "Property Address (as per initiation)"'>
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
                          title={!fields.clixPropertyAddressDocsEdit ? 'Prefill from section 3, "Property Address (as per initiation)"' : undefined}
                        />
                        {!fields.clixPropertyAddressDocsEdit && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 3, "Property Address (as per initiation)"'>
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
    },

    {
      id: 'clix-section-4',
      title: 'Visit Details',
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
            <div className="animate-fade-in space-y-6">
              <div className="border border-[#fffde7] bg-[#fffde7] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Visit Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center">
                        <span>Contact Person Name</span>
                        {renderNaToggle('clixContactPersonNameNA', fields, handleChange, isReadOnly)}
                      </div>
                      {renderEditSwitch('clixContactPersonNameEdit', fields, handleChange, isReadOnly, !!fields.clixContactPersonNameNA)}
                    </div>
                  }>
                    <div className="relative">
                      <input
                        type="text"
                        title={!fields.clixContactPersonNameEdit && !fields.clixContactPersonNameNA ? 'Prefill from section 2, "Borrower Representative Name"' : undefined}
                        className={`${inputCls} pr-10 ${fields.clixContactPersonNameEdit && !fields.clixContactPersonNameNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                        value={fields.clixContactPersonNameNA ? 'NA' : (fields.clixContactPersonNameEdit ? (fields.clixContactPersonName || '') : (fields.clixBorrowerRepName || ''))}
                        onChange={e => handleChange('clixContactPersonName', e.target.value)}
                        disabled={isReadOnly || !!fields.clixContactPersonNameNA || !fields.clixContactPersonNameEdit}
                      />
                      {!fields.clixContactPersonNameEdit && !fields.clixContactPersonNameNA && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 2, "Borrower Representative Name"'>
                          <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                        </div>
                      )}
                    </div>
                  </Field>

                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center">
                        <span>Contact Person Mobile No</span>
                        {renderNaToggle('clixContactPersonMobileNoNA', fields, handleChange, isReadOnly)}
                      </div>
                      {renderEditSwitch('clixContactPersonMobileNoEdit', fields, handleChange, isReadOnly, !!fields.clixContactPersonMobileNoNA)}
                    </div>
                  }>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={10}
                        title={!fields.clixContactPersonMobileNoEdit && !fields.clixContactPersonMobileNoNA ? 'Prefill from section 2, "Borrower Rep Contact No"' : undefined}
                        className={`${inputCls} pr-10 ${fields.clixContactPersonMobileNoEdit && !fields.clixContactPersonMobileNoNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                        value={fields.clixContactPersonMobileNoNA ? 'NA' : (fields.clixContactPersonMobileNoEdit ? (fields.clixContactPersonMobileNo || '') : (fields.clixBorrowerRepContactNo || ''))}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleChange('clixContactPersonMobileNo', val);
                        }}
                        disabled={isReadOnly || !!fields.clixContactPersonMobileNoNA || !fields.clixContactPersonMobileNoEdit}
                      />
                      {!fields.clixContactPersonMobileNoEdit && !fields.clixContactPersonMobileNoNA && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 2, "Borrower Rep Contact No"'>
                          <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                        </div>
                      )}
                    </div>
                  </Field>

                  <div className="flex flex-col gap-2">
                    <Field label="Relationship with Customer">
                      <select
                        className={inputCls}
                        value={fields.clixRelationshipWithCustomer || ''}
                        onChange={e => {
                          handleChange('clixRelationshipWithCustomer', e.target.value);
                          if (e.target.value !== 'Custom') {
                            handleChange('clixRelationshipWithCustomerCustom', '');
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="">Select Relationship</option>
                        <option value="Self">Self</option>
                        <option value="Relative">Relative</option>
                        <option value="Employee">Employee</option>
                        <option value="NA">NA</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </Field>
                    {fields.clixRelationshipWithCustomer === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom relationship"
                        className={inputCls}
                        value={fields.clixRelationshipWithCustomerCustom || ''}
                        onChange={e => handleChange('clixRelationshipWithCustomerCustom', e.target.value)}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>

                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>ID Proof details</span>
                      {renderNaToggle('clixIdProofDetailsNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixIdProofDetailsNA ? 'NA' : (fields.clixIdProofDetails || '')}
                      onChange={e => handleChange('clixIdProofDetails', e.target.value)}
                      disabled={isReadOnly || !!fields.clixIdProofDetailsNA}
                    />
                  </Field>

                  <div className="col-span-1 md:col-span-2">
                    <Field label={
                      <div className="w-full flex items-center justify-between">
                        <span>Property identified through</span>
                        {renderNaToggle('clixPropertyIdentifiedThroughNA', fields, handleChange, isReadOnly)}
                      </div>
                    }>
                      <textarea
                        className={`${inputCls} resize-y min-h-15`}
                        rows={2}
                        value={fields.clixPropertyIdentifiedThroughNA ? 'NA' : (fields.clixPropertyIdentifiedThrough || '')}
                        onChange={e => handleChange('clixPropertyIdentifiedThrough', e.target.value)}
                        disabled={isReadOnly || !!fields.clixPropertyIdentifiedThroughNA}
                      />
                    </Field>
                  </div>

                </div>
              </div>
            </div>
          );
      }
    },

    {
      id: 'clix-section-5',
      title: '5. DOCUMENT DETAILS',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const legalDocs = fields.clixLegalDocs || [{ id: '1', docName: '', docNameCustom: '', docNameNA: false, status: '', statusCustom: '' }];
        const DEFAULT_FLOORS = [
          { id: 'basement', label: 'Basement',     description: '', isNA: false },
          { id: 'ground',   label: 'Ground Floor',  description: '', isNA: false },
          { id: 'first',    label: 'First Floor',   description: '', isNA: false },
          { id: 'second',   label: 'Second Floor',  description: '', isNA: false },
          { id: 'third',    label: 'Third Floor',   description: '', isNA: false },
          { id: 'fourth',   label: 'Fourth Floor',  description: '', isNA: false },
        ];
        const accFloors: any[] = fields.clixAccFloors || DEFAULT_FLOORS;

        const updateDoc = (id: string, key: string, val: any) => {
          handleChange('clixLegalDocs', legalDocs.map((d: any) => d.id === id ? { ...d, [key]: val } : d));
        };
        const removeDoc = (id: string) => {
          handleChange('clixLegalDocs', legalDocs.filter((d: any) => d.id !== id));
        };
        const addDoc = () => {
          handleChange('clixLegalDocs', [...legalDocs, { id: Math.random().toString(), docName: '', docNameCustom: '', docNameNA: false, status: '', statusCustom: '' }]);
        };

        const updateFloor = (id: string, key: string, val: any) => {
          handleChange('clixAccFloors', accFloors.map((f: any) => f.id === id ? { ...f, [key]: val } : f));
        };
        const removeFloor = (id: string) => {
          handleChange('clixAccFloors', accFloors.filter((f: any) => f.id !== id));
        };
        const addFloor = () => {
          handleChange('clixAccFloors', [...accFloors, { id: Math.random().toString(), label: 'Additional Floor', description: '', isNA: false }]);
        };

        return (
            <div className="animate-fade-in space-y-6">
              {/* ── Legal Documents Table ── */}
              <div className="border border-[#F3E5F5] bg-[#F3E5F5] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Legal Documents</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 w-16">S.No.</th>
                        <th className="px-4 py-3">Document Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {legalDocs.map((doc: any, index: number) => (
                        <tr key={doc.id} className="bg-white border-b">
                          {/* S.No. */}
                          <td className="px-4 py-3 align-top">
                            <span className="font-medium bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1" title={`Auto calculating from ${index + 1}`}>
                              {index + 1}
                              <Lock className="w-3 h-3 text-emerald-800" />
                            </span>
                          </td>

                          {/* Document Name */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded text-emerald-600"
                                  checked={doc.docNameNA}
                                  onChange={e => {
                                    updateDoc(doc.id, 'docNameNA', e.target.checked);
                                    if (e.target.checked) {
                                      updateDoc(doc.id, 'docName', '');
                                      updateDoc(doc.id, 'docNameCustom', '');
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                                <span className="text-[10px] uppercase font-bold text-gray-400">NA</span>
                              </label>
                              <select
                                className={inputCls}
                                value={doc.docNameNA ? 'NA' : doc.docName}
                                onChange={e => {
                                  updateDoc(doc.id, 'docName', e.target.value);
                                  if (e.target.value !== 'Custom') updateDoc(doc.id, 'docNameCustom', '');
                                }}
                                disabled={isReadOnly || doc.docNameNA}
                              >
                                <option value="">Select Document</option>
                                <option value="Lease Deed">Lease Deed</option>
                                <option value="Sale Deed">Sale Deed</option>
                                <option value="Approved Plan">Approved Plan</option>
                                <option value="Sketch Map">Sketch Map</option>
                                <option value="Custom">Custom</option>
                              </select>
                              {doc.docName === 'Custom' && !doc.docNameNA && (
                                <input
                                  type="text"
                                  placeholder="Enter document name"
                                  className={inputCls}
                                  value={doc.docNameCustom}
                                  onChange={e => updateDoc(doc.id, 'docNameCustom', e.target.value)}
                                  disabled={isReadOnly}
                                />
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-2">
                              <select
                                className={inputCls}
                                value={doc.status}
                                onChange={e => {
                                  updateDoc(doc.id, 'status', e.target.value);
                                  if (e.target.value !== 'Custom') updateDoc(doc.id, 'statusCustom', '');
                                }}
                                disabled={isReadOnly}
                              >
                                <option value="">Select Status</option>
                                <option value="Available">Available</option>
                                <option value="NA">NA</option>
                                <option value="Custom">Custom</option>
                              </select>
                              {doc.status === 'Custom' && (
                                <input
                                  type="text"
                                  placeholder="Custom status"
                                  className={inputCls}
                                  value={doc.statusCustom}
                                  onChange={e => updateDoc(doc.id, 'statusCustom', e.target.value)}
                                  disabled={isReadOnly}
                                />
                              )}
                            </div>
                          </td>

                          {/* Delete */}
                          <td className="px-4 py-3 align-top text-right">
                            <button
                              type="button"
                              onClick={() => removeDoc(doc.id)}
                              disabled={isReadOnly || legalDocs.length === 1}
                              className="text-red-500 hover:text-red-700 disabled:opacity-30 mt-1"
                              title="Delete Row"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    onClick={addDoc}
                    disabled={isReadOnly}
                    className="mt-4 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add Row
                  </button>
                </div>
              </div>

              {/* ── Accommodation Table ── */}
              <div className="border border-[#F3E5F5] bg-[#F3E5F5] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Accommodation Table</h3>
                <div className="grid grid-cols-1 gap-4">
                  {accFloors.map((floor: any) => (
                    <div key={floor.id} className="relative">
                      <Field label={
                        <div className="w-full flex items-center justify-between">
                          <input
                            type="text"
                            className="font-semibold text-sm text-gray-700 bg-transparent border-none outline-none w-40"
                            value={floor.label}
                            onChange={e => updateFloor(floor.id, 'label', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Floor label"
                          />
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded text-emerald-600"
                                checked={floor.isNA}
                                onChange={e => {
                                  updateFloor(floor.id, 'isNA', e.target.checked);
                                  if (e.target.checked) updateFloor(floor.id, 'description', 'Not Constructed/NA');
                                  else updateFloor(floor.id, 'description', '');
                                }}
                                disabled={isReadOnly}
                              />
                              <span className="text-[10px] uppercase font-bold text-gray-400">Not Constructed/NA</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeFloor(floor.id)}
                              disabled={isReadOnly || accFloors.length === 1}
                              className="text-red-400 hover:text-red-600 disabled:opacity-30"
                              title="Remove Floor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      }>
                        <textarea
                          className={`${inputCls} resize-y min-h-15`}
                          rows={2}
                          value={floor.description}
                          onChange={e => updateFloor(floor.id, 'description', e.target.value)}
                          disabled={isReadOnly || floor.isNA}
                          placeholder={floor.isNA ? 'Not Constructed/NA' : 'Describe accommodation...'}
                        />
                      </Field>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFloor}
                    disabled={isReadOnly}
                    className="mt-2 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add Floor
                  </button>
                </div>
              </div>
            </div>
          );
      }
    },
    {
      id: 'clix-section-6',
      title: '6. PROPERTY DETAILS',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // ── Sub-type options filtered by property type ──
        const subTypeMap: Record<string, string[]> = {
          Commercial:  ['Shop', 'Office', 'Showroom', 'Warehouse', 'Hotel/Restaurant', 'Mall/Complex'],
          Residential: ['Apartment/Flat', 'Independent House', 'Villa', 'Row House', 'Plot'],
          Industrial:  ['Factory', 'Workshop', 'Industrial Shed', 'Industrial Plot', 'Godown'],
        };
        const subTypeOptions: string[] = subTypeMap[fields.clixPropertyType] || [];

        // ── Residual Age auto-calc ──
        const ageNum = parseFloat(fields.clixAgeOfProperty || '');
        const autoResidualAge = !isNaN(ageNum) ? String(Math.max(0, 60 - ageNum)) : '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#E0F7FA] bg-[#E0F7FA] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Property Type */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Property Type</span>
                      {renderNaToggle('clixPropertyTypeNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select
                      className={inputCls}
                      value={fields.clixPropertyTypeNA ? 'NA' : (fields.clixPropertyType || '')}
                      onChange={e => {
                        handleChange('clixPropertyType', e.target.value);
                        handleChange('clixPropertySubType', '');
                        handleChange('clixPropertySubTypeCustom', '');
                        if (e.target.value !== 'Custom') handleChange('clixPropertyTypeCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixPropertyTypeNA}
                    >
                      <option value="">Select Type</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Residential">Residential</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixPropertyType === 'Custom' && !fields.clixPropertyTypeNA && (
                    <input type="text" placeholder="Enter property type" className={inputCls}
                      value={fields.clixPropertyTypeCustom || ''}
                      onChange={e => handleChange('clixPropertyTypeCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

                {/* Property Sub Type */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Property Sub Type</span>
                      {renderNaToggle('clixPropertySubTypeNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select
                      className={inputCls}
                      value={fields.clixPropertySubTypeNA ? 'NA' : (fields.clixPropertySubType || '')}
                      onChange={e => {
                        handleChange('clixPropertySubType', e.target.value);
                        if (e.target.value !== 'Custom') handleChange('clixPropertySubTypeCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixPropertySubTypeNA}
                    >
                      <option value="">Select Sub Type</option>
                      {subTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixPropertySubType === 'Custom' && !fields.clixPropertySubTypeNA && (
                    <input type="text" placeholder="Enter sub type" className={inputCls}
                      value={fields.clixPropertySubTypeCustom || ''}
                      onChange={e => handleChange('clixPropertySubTypeCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

                {/* Type of Ownership */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Type of Ownership</span>
                    {renderNaToggle('clixOwnershipTypeNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <div className="flex gap-4 h-10 items-center">
                    {['Freehold', 'Lease Hold'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="clixOwnershipType" value={type}
                          checked={fields.clixOwnershipType === type}
                          onChange={e => handleChange('clixOwnershipType', e.target.value)}
                          disabled={isReadOnly || !!fields.clixOwnershipTypeNA}
                          className="text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-sm font-medium text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                {/* Geo Latitude */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Geo Location (Latitude)</span>
                    {renderNaToggle('clixGeoLatitudeNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input type="text" className={inputCls}
                    value={fields.clixGeoLatitudeNA ? 'NA' : (fields.clixGeoLatitude || '')}
                    onChange={e => { const v = e.target.value; if (/^-?\d*\.?\d*$/.test(v)) handleChange('clixGeoLatitude', v); }}
                    disabled={isReadOnly || !!fields.clixGeoLatitudeNA}
                    placeholder="e.g. 28.6139" />
                </Field>

                {/* Longitude */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Longitude</span>
                    {renderNaToggle('clixGeoLongitudeNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input type="text" className={inputCls}
                    value={fields.clixGeoLongitudeNA ? 'NA' : (fields.clixGeoLongitude || '')}
                    onChange={e => { const v = e.target.value; if (/^-?\d*\.?\d*$/.test(v)) handleChange('clixGeoLongitude', v); }}
                    disabled={isReadOnly || !!fields.clixGeoLongitudeNA}
                    placeholder="e.g. 77.2090" />
                </Field>

                {/* Property ID Number */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Property Identification Number</span>
                    {renderNaToggle('clixPropertyIdNumberNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input type="text" className={inputCls}
                    value={fields.clixPropertyIdNumberNA ? 'NA' : (fields.clixPropertyIdNumber || '')}
                    onChange={e => handleChange('clixPropertyIdNumber', e.target.value)}
                    disabled={isReadOnly || !!fields.clixPropertyIdNumberNA} />
                </Field>

                {/* Electricity Meter Number */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Electricity Meter Number</span>
                    {renderNaToggle('clixElectricityMeterNoNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input type="text" className={inputCls}
                    value={fields.clixElectricityMeterNoNA ? 'NA' : (fields.clixElectricityMeterNo || '')}
                    onChange={e => handleChange('clixElectricityMeterNo', e.target.value)}
                    disabled={isReadOnly || !!fields.clixElectricityMeterNoNA} />
                </Field>

                {/* Distance from city center */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Distance from City Center</span>
                    {renderNaToggle('clixDistanceFromCityNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <div className="flex items-center gap-2">
                    <input type="text" className={`${inputCls} flex-1`}
                      value={fields.clixDistanceFromCityNA ? 'NA' : (fields.clixDistanceFromCity || '')}
                      onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) handleChange('clixDistanceFromCity', v); }}
                      disabled={isReadOnly || !!fields.clixDistanceFromCityNA}
                      placeholder="0.0" />
                    <span className="text-sm font-semibold text-gray-500 shrink-0">Kms</span>
                  </div>
                </Field>

                {/* Distance from branch */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Distance from Branch</span>
                    {renderNaToggle('clixDistanceFromBranchNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <div className="flex items-center gap-2">
                    <input type="text" className={`${inputCls} flex-1`}
                      value={fields.clixDistanceFromBranchNA ? 'NA' : (fields.clixDistanceFromBranch || '')}
                      onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) handleChange('clixDistanceFromBranch', v); }}
                      disabled={isReadOnly || !!fields.clixDistanceFromBranchNA}
                      placeholder="0.0" />
                    <span className="text-sm font-semibold text-gray-500 shrink-0">Kms</span>
                  </div>
                </Field>

                {/* Property Location */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Property Location (MC/BDA/GP/DTCP etc.)</span>
                      {renderNaToggle('clixPropertyLocationNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls}
                      value={fields.clixPropertyLocationNA ? 'NA' : (fields.clixPropertyLocation || '')}
                      onChange={e => {
                        handleChange('clixPropertyLocation', e.target.value);
                        if (e.target.value !== 'Custom') handleChange('clixPropertyLocationCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixPropertyLocationNA}>
                      <option value="">Select Location Type</option>
                      <option value="MC">MC (Municipal Corporation)</option>
                      <option value="BDA">BDA (Development Authority)</option>
                      <option value="GP">GP (Gram Panchayat)</option>
                      <option value="DTCP">DTCP</option>
                      <option value="HMDA">HMDA</option>
                      <option value="CMDA">CMDA</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixPropertyLocation === 'Custom' && !fields.clixPropertyLocationNA && (
                    <input type="text" placeholder="Enter location type" className={inputCls}
                      value={fields.clixPropertyLocationCustom || ''}
                      onChange={e => handleChange('clixPropertyLocationCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

                {/* Access Road */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Access Road</span>
                    {renderNaToggle('clixAccessRoadNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input type="text" className={inputCls}
                    value={fields.clixAccessRoadNA ? 'NA' : (fields.clixAccessRoad || '')}
                    onChange={e => handleChange('clixAccessRoad', e.target.value)}
                    disabled={isReadOnly || !!fields.clixAccessRoadNA} />
                </Field>

                {/* Surrounding Infrastructure */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Surrounding Infrastructure</span>
                      {renderNaToggle('clixSurroundingInfraNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls}
                      value={fields.clixSurroundingInfraNA ? 'NA' : (fields.clixSurroundingInfra || '')}
                      onChange={e => {
                        handleChange('clixSurroundingInfra', e.target.value);
                        if (e.target.value !== 'Custom') handleChange('clixSurroundingInfraCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixSurroundingInfraNA}>
                      <option value="">Select</option>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixSurroundingInfra === 'Custom' && !fields.clixSurroundingInfraNA && (
                    <input type="text" placeholder="Enter description" className={inputCls}
                      value={fields.clixSurroundingInfraCustom || ''}
                      onChange={e => handleChange('clixSurroundingInfraCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

                {/* Class of Locality */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Class of Locality</span>
                      {renderNaToggle('clixClassOfLocalityNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls}
                      value={fields.clixClassOfLocalityNA ? 'NA' : (fields.clixClassOfLocality || '')}
                      onChange={e => {
                        handleChange('clixClassOfLocality', e.target.value);
                        if (e.target.value !== 'Custom') handleChange('clixClassOfLocalityCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixClassOfLocalityNA}>
                      <option value="">Select</option>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixClassOfLocality === 'Custom' && !fields.clixClassOfLocalityNA && (
                    <input type="text" placeholder="Enter description" className={inputCls}
                      value={fields.clixClassOfLocalityCustom || ''}
                      onChange={e => handleChange('clixClassOfLocalityCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

                {/* Permitted Usage / Zoning */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Permitted Usage / Zoning as per master plan</span>
                      {renderNaToggle('clixPermittedUsageNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls}
                      value={fields.clixPermittedUsageNA ? 'NA' : (fields.clixPermittedUsage || '')}
                      onChange={e => {
                        handleChange('clixPermittedUsage', e.target.value);
                        if (e.target.value !== 'Custom') handleChange('clixPermittedUsageCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixPermittedUsageNA}>
                      <option value="">Select Zone</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed Use">Mixed Use</option>
                      <option value="Agricultural">Agricultural</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixPermittedUsage === 'Custom' && !fields.clixPermittedUsageNA && (
                    <input type="text" placeholder="Enter permitted usage" className={inputCls}
                      value={fields.clixPermittedUsageCustom || ''}
                      onChange={e => handleChange('clixPermittedUsageCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

                {/* Existing Usage — prefill from Permitted Usage */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center">
                      <span>Existing Usage</span>
                      {renderNaToggle('clixExistingUsageNA', fields, handleChange, isReadOnly)}
                    </div>
                    {renderEditSwitch('clixExistingUsageEdit', fields, handleChange, isReadOnly, !!fields.clixExistingUsageNA)}
                  </div>
                }>
                  <div className="relative">
                    <input type="text"
                      title={!fields.clixExistingUsageEdit && !fields.clixExistingUsageNA ? 'Prefill from section 6, "Permitted Usage / Zoning as per master plan"' : undefined}
                      className={`${inputCls} pr-10 ${fields.clixExistingUsageEdit && !fields.clixExistingUsageNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                      value={fields.clixExistingUsageNA ? 'NA' : (fields.clixExistingUsageEdit ? (fields.clixExistingUsage || '') : (fields.clixPermittedUsage || ''))}
                      onChange={e => handleChange('clixExistingUsage', e.target.value)}
                      disabled={isReadOnly || !!fields.clixExistingUsageNA || !fields.clixExistingUsageEdit} />
                    {!fields.clixExistingUsageEdit && !fields.clixExistingUsageNA && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-help" title='Prefill from section 6, "Permitted Usage / Zoning as per master plan"'>
                        <Lock className="w-5 h-5 text-emerald-800" />
                      </div>
                    )}
                  </div>
                </Field>

                {/* Age of Property */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Age of Property (Years)</span>
                    {renderNaToggle('clixAgeOfPropertyNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input type="text" className={inputCls}
                    value={fields.clixAgeOfPropertyNA ? 'NA' : (fields.clixAgeOfProperty || '')}
                    onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) handleChange('clixAgeOfProperty', v); }}
                    disabled={isReadOnly || !!fields.clixAgeOfPropertyNA}
                    placeholder="e.g. 10" />
                </Field>

                {/* Residual Age — auto-calc: 60 - Age */}
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center">
                      <span>Residual Age (Years)</span>
                      {renderNaToggle('clixResidualAgeNA', fields, handleChange, isReadOnly)}
                    </div>
                    {renderEditSwitch('clixResidualAgeEdit', fields, handleChange, isReadOnly, !!fields.clixResidualAgeNA)}
                  </div>
                }>
                  <div className="relative">
                    <input type="text"
                      title={!fields.clixResidualAgeEdit && !fields.clixResidualAgeNA ? 'Auto calculating from [Standard Life Expectancy (60) - Age of Property]' : undefined}
                      className={`${inputCls} pr-10 ${fields.clixResidualAgeEdit && !fields.clixResidualAgeNA ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`}
                      value={fields.clixResidualAgeNA ? 'NA' : (fields.clixResidualAgeEdit ? (fields.clixResidualAge || '') : autoResidualAge)}
                      onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) handleChange('clixResidualAge', v); }}
                      disabled={isReadOnly || !!fields.clixResidualAgeNA || !fields.clixResidualAgeEdit}
                      placeholder="Auto" />
                    {!fields.clixResidualAgeEdit && !fields.clixResidualAgeNA && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-help" title='Auto calculating from [Standard Life Expectancy (60) - Age of Property]'>
                        <Lock className="w-5 h-5 text-emerald-800" />
                      </div>
                    )}
                  </div>
                </Field>

                {/* Marketability */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span>Marketability</span>
                      {renderNaToggle('clixMarketabilityNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls}
                      value={fields.clixMarketabilityNA ? 'NA' : (fields.clixMarketability || '')}
                      onChange={e => {
                        handleChange('clixMarketability', e.target.value);
                        if (e.target.value !== 'Custom') handleChange('clixMarketabilityCustom', '');
                      }}
                      disabled={isReadOnly || !!fields.clixMarketabilityNA}>
                      <option value="">Select</option>
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Difficult">Difficult</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixMarketability === 'Custom' && !fields.clixMarketabilityNA && (
                    <input type="text" placeholder="Enter marketability" className={inputCls}
                      value={fields.clixMarketabilityCustom || ''}
                      onChange={e => handleChange('clixMarketabilityCustom', e.target.value)}
                      disabled={isReadOnly} />
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'clix-section-7',
      title: '7. SPECIFICATIONS',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-orange-200 bg-[#fff3e0] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Type of Structure */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Type of Structure</span>
                      {renderNaToggle('clixTypeOfStructureNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixTypeOfStructureDropdown || ''} onChange={e => {
                      handleChange('clixTypeOfStructureDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixTypeOfStructure', e.target.value);
                      else handleChange('clixTypeOfStructure', '');
                    }} disabled={isReadOnly || fields.clixTypeOfStructureNA}>
                      <option value="RCC">RCC</option>
                      <option value="Load Bearing">Load Bearing</option>
                      <option value="Composite">Composite</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixTypeOfStructureDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom type..." value={fields.clixTypeOfStructureNA ? 'NA' : (fields.clixTypeOfStructure || '')} onChange={e => handleChange('clixTypeOfStructure', e.target.value)} disabled={isReadOnly || fields.clixTypeOfStructureNA} />
                  )}
                </div>

                {/* Painting */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Painting</span>
                      {renderNaToggle('clixPaintingNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixPaintingDropdown || ''} onChange={e => {
                      handleChange('clixPaintingDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixPainting', e.target.value);
                      else handleChange('clixPainting', '');
                    }} disabled={isReadOnly || fields.clixPaintingNA}>
                      <option value="Completed">Completed</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Not Started">Not Started</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixPaintingDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom painting status..." value={fields.clixPaintingNA ? 'NA' : (fields.clixPainting || '')} onChange={e => handleChange('clixPainting', e.target.value)} disabled={isReadOnly || fields.clixPaintingNA} />
                  )}
                </div>

                {/* Flooring */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Flooring</span>
                      {renderNaToggle('clixFlooringNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixFlooringDropdown || ''} onChange={e => {
                      handleChange('clixFlooringDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixFlooring', e.target.value);
                      else handleChange('clixFlooring', '');
                    }} disabled={isReadOnly || fields.clixFlooringNA}>
                      <option value="Tiles">Tiles</option>
                      <option value="Marble">Marble</option>
                      <option value="Granite">Granite</option>
                      <option value="Cement">Cement</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixFlooringDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom flooring..." value={fields.clixFlooringNA ? 'NA' : (fields.clixFlooring || '')} onChange={e => handleChange('clixFlooring', e.target.value)} disabled={isReadOnly || fields.clixFlooringNA} />
                  )}
                </div>

                {/* Bathroom/ Plumbing fittings */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Bathroom/ Plumbing fittings</span>
                      {renderNaToggle('clixBathroomFittingsNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixBathroomFittingsDropdown || ''} onChange={e => {
                      handleChange('clixBathroomFittingsDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixBathroomFittings', e.target.value);
                      else handleChange('clixBathroomFittings', '');
                    }} disabled={isReadOnly || fields.clixBathroomFittingsNA}>
                      <option value="Completed">Completed</option>
                      <option value="Concealed">Concealed</option>
                      <option value="Open">Open</option>
                      <option value="Not Started">Not Started</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixBathroomFittingsDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom bathroom fittings..." value={fields.clixBathroomFittingsNA ? 'NA' : (fields.clixBathroomFittings || '')} onChange={e => handleChange('clixBathroomFittings', e.target.value)} disabled={isReadOnly || fields.clixBathroomFittingsNA} />
                  )}
                </div>

                {/* Electrical fittings */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Electrical fittings</span>
                      {renderNaToggle('clixElectricalFittingsNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixElectricalFittingsDropdown || ''} onChange={e => {
                      handleChange('clixElectricalFittingsDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixElectricalFittings', e.target.value);
                      else handleChange('clixElectricalFittings', '');
                    }} disabled={isReadOnly || fields.clixElectricalFittingsNA}>
                      <option value="Concealed wiring">Concealed wiring</option>
                      <option value="Open wiring">Open wiring</option>
                      <option value="None">None</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixElectricalFittingsDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom electrical fittings..." value={fields.clixElectricalFittingsNA ? 'NA' : (fields.clixElectricalFittings || '')} onChange={e => handleChange('clixElectricalFittings', e.target.value)} disabled={isReadOnly || fields.clixElectricalFittingsNA} />
                  )}
                </div>

                {/* Kitchen */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Kitchen</span>
                      {renderNaToggle('clixKitchenNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixKitchenDropdown || ''} onChange={e => {
                      handleChange('clixKitchenDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixKitchen', e.target.value);
                      else handleChange('clixKitchen', '');
                    }} disabled={isReadOnly || fields.clixKitchenNA}>
                      <option value="Tile Flooring & Steel Sink">Tile Flooring & Steel Sink</option>
                      <option value="Granite Platform">Granite Platform</option>
                      <option value="Bare">Bare</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixKitchenDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom kitchen details..." value={fields.clixKitchenNA ? 'NA' : (fields.clixKitchen || '')} onChange={e => handleChange('clixKitchen', e.target.value)} disabled={isReadOnly || fields.clixKitchenNA} />
                  )}
                </div>

                {/* Interiors (Fixed) */}
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Interiors (Fixed)</span>
                      {renderNaToggle('clixInteriorsNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <select className={inputCls} value={fields.clixInteriorsDropdown || ''} onChange={e => {
                      handleChange('clixInteriorsDropdown', e.target.value);
                      if(e.target.value !== 'Custom') handleChange('clixInteriors', e.target.value);
                      else handleChange('clixInteriors', '');
                    }} disabled={isReadOnly || fields.clixInteriorsNA}>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                      <option value="None">None</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.clixInteriorsDropdown === 'Custom' && (
                    <input className={inputCls} placeholder="Enter custom interiors..." value={fields.clixInteriorsNA ? 'NA' : (fields.clixInteriors || '')} onChange={e => handleChange('clixInteriors', e.target.value)} disabled={isReadOnly || fields.clixInteriorsNA} />
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'clix-section-8',
      title: '8. BOUNDARIES AND SET BACKS',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-pink-200 bg-[#fce4ec] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Directional Boundaries Table</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-pink-100">
                    <tr>
                      <th className="px-4 py-2">Direction</th>
                      <th className="px-4 py-2">As per documents</th>
                      <th className="px-4 py-2">As per site</th>
                      <th className="px-4 py-2">Dimensions (Feet/Meters)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['North', 'South', 'East', 'West'].map((dir) => (
                      <tr key={dir} className="bg-[#fce4ec] border-b border-pink-200">
                        <td className="px-4 py-2 font-medium text-gray-900">{dir}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className={`${inputCls} ${fields[`clixS8Boundaries${dir}AsPerDocNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                              value={fields[`clixS8Boundaries${dir}AsPerDocNA`] ? 'NA' : (fields[`clixS8Boundaries${dir}AsPerDoc`] || '')}
                              onChange={(e) => handleChange(`clixS8Boundaries${dir}AsPerDoc`, e.target.value)}
                              disabled={isReadOnly || fields[`clixS8Boundaries${dir}AsPerDocNA`]}
                            />
                            {renderNaToggle(`clixS8Boundaries${dir}AsPerDocNA`, fields, handleChange, isReadOnly)}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              className={`${inputCls} ${fields[`clixS8Boundaries${dir}AsPerSiteNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                              value={fields[`clixS8Boundaries${dir}AsPerSiteNA`] ? 'NA' : (fields[`clixS8Boundaries${dir}AsPerSite`] || '')}
                              onChange={(e) => handleChange(`clixS8Boundaries${dir}AsPerSite`, e.target.value)}
                              disabled={isReadOnly || fields[`clixS8Boundaries${dir}AsPerSiteNA`]}
                            />
                            {renderNaToggle(`clixS8Boundaries${dir}AsPerSiteNA`, fields, handleChange, isReadOnly)}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type={fields[`clixS8Boundaries${dir}DimensionNA`] ? "text" : "number"}
                              className={`${inputCls} ${fields[`clixS8Boundaries${dir}DimensionNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                              value={fields[`clixS8Boundaries${dir}DimensionNA`] ? 'NA' : (fields[`clixS8Boundaries${dir}Dimension`] || '')}
                              onChange={(e) => handleChange(`clixS8Boundaries${dir}Dimension`, e.target.value)}
                              disabled={isReadOnly || fields[`clixS8Boundaries${dir}DimensionNA`]}
                            />
                            {renderNaToggle(`clixS8Boundaries${dir}DimensionNA`, fields, handleChange, isReadOnly)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Demarcation & Matching</span>
                      {renderNaToggle('clixS8DemarcationMatchingNA', fields, handleChange, isReadOnly)}
                    </div>
                  }>
                    <div className="flex gap-4">
                      {['Yes', 'No'].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="clixS8DemarcationMatching"
                            value={opt}
                            checked={!fields.clixS8DemarcationMatchingNA && fields.clixS8DemarcationMatching === opt}
                            onChange={(e) => handleChange('clixS8DemarcationMatching', e.target.value)}
                            disabled={isReadOnly || fields.clixS8DemarcationMatchingNA}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <span className="text-gray-700 text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  {fields.clixS8DemarcationMatching === 'No' && !fields.clixS8DemarcationMatchingNA && (
                    <textarea 
                      className={`${inputCls} bg-white mt-2`} 
                      rows={3}
                      placeholder="Explanation for Mismatch"
                      value={fields.clixS8DemarcationMismatchExplanation || ''} 
                      onChange={e => handleChange('clixS8DemarcationMismatchExplanation', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Notes for demarcation</span>
                    {renderNaToggle('clixS8NotesForDemarcationNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <textarea 
                    className={`${inputCls} ${fields.clixS8NotesForDemarcationNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                    rows={3}
                    value={fields.clixS8NotesForDemarcationNA ? 'NA' : (fields.clixS8NotesForDemarcation || '')} 
                    onChange={e => handleChange('clixS8NotesForDemarcation', e.target.value)} 
                    disabled={isReadOnly || fields.clixS8NotesForDemarcationNA} 
                  />
                </Field>
              </div>

              <h3 className="font-bold text-gray-700 mb-4">Setbacks Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-pink-100">
                    <tr>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Approved</th>
                      <th className="px-4 py-2">Actual</th>
                      <th className="px-4 py-2">Deviations</th>
                      <th className="px-4 py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Front', 'Rear', 'LeftSide', 'RightSide'].map((side) => {
                      const displaySide = side === 'LeftSide' ? 'Left Side' : side === 'RightSide' ? 'Right Side' : side;
                      const appValStr = fields[`clixS8Setbacks${side}Approved`];
                      const actValStr = fields[`clixS8Setbacks${side}Actual`];
                      const appVal = parseFloat(appValStr || '0') || 0;
                      const actVal = parseFloat(actValStr || '0') || 0;
                      const autoDev = (actVal - appVal).toFixed(2);
                      const isDevEdit = fields[`clixS8EnableSetbacks${side}DeviationsEdit`];
                      const devValue = isDevEdit ? (fields[`clixS8Setbacks${side}Deviations`] || '') : autoDev;

                      return (
                        <tr key={side} className="bg-[#fce4ec] border-b border-pink-200">
                          <td className="px-4 py-2 font-medium text-gray-900">{displaySide}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type={fields[`clixS8Setbacks${side}ApprovedNA`] ? "text" : "number"}
                                className={`${inputCls} ${fields[`clixS8Setbacks${side}ApprovedNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                value={fields[`clixS8Setbacks${side}ApprovedNA`] ? 'NA' : (appValStr || '')}
                                onChange={(e) => handleChange(`clixS8Setbacks${side}Approved`, e.target.value)}
                                disabled={isReadOnly || fields[`clixS8Setbacks${side}ApprovedNA`]}
                              />
                              {renderNaToggle(`clixS8Setbacks${side}ApprovedNA`, fields, handleChange, isReadOnly)}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type={fields[`clixS8Setbacks${side}ActualNA`] ? "text" : "number"}
                                className={`${inputCls} ${fields[`clixS8Setbacks${side}ActualNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                value={fields[`clixS8Setbacks${side}ActualNA`] ? 'NA' : (actValStr || '')}
                                onChange={(e) => handleChange(`clixS8Setbacks${side}Actual`, e.target.value)}
                                disabled={isReadOnly || fields[`clixS8Setbacks${side}ActualNA`]}
                              />
                              {renderNaToggle(`clixS8Setbacks${side}ActualNA`, fields, handleChange, isReadOnly)}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              {renderEditSwitch(`clixS8EnableSetbacks${side}DeviationsEdit`, fields, handleChange, isReadOnly)}
                              <div className="flex items-center gap-2 relative">
                                {isDevEdit ? (
                                  <input
                                    type={fields[`clixS8Setbacks${side}DeviationsNA`] ? "text" : "number"}
                                    className={`${inputCls} ${fields[`clixS8Setbacks${side}DeviationsNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                    value={fields[`clixS8Setbacks${side}DeviationsNA`] ? 'NA' : devValue}
                                    onChange={(e) => handleChange(`clixS8Setbacks${side}Deviations`, e.target.value)}
                                    disabled={isReadOnly || fields[`clixS8Setbacks${side}DeviationsNA`]}
                                  />
                                ) : (
                                  <div className="relative w-full">
                                    <input 
                                      className={`${inputCls} pr-10 bg-white text-gray-700`} 
                                      value={devValue} 
                                      readOnly 
                                      disabled={isReadOnly}
                                      title=">>Auto calculating from [Actual - Approved]<<"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title=">>Auto calculating from [Actual - Approved]<<">
                                      <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                                    </div>
                                  </div>
                                )}
                                {renderNaToggle(`clixS8Setbacks${side}DeviationsNA`, fields, handleChange, isReadOnly)}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                className={`${inputCls} ${fields[`clixS8Setbacks${side}RemarksNA`] ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                value={fields[`clixS8Setbacks${side}RemarksNA`] ? 'NA' : (fields[`clixS8Setbacks${side}Remarks`] || '')}
                                onChange={(e) => handleChange(`clixS8Setbacks${side}Remarks`, e.target.value)}
                                disabled={isReadOnly || fields[`clixS8Setbacks${side}RemarksNA`]}
                              />
                              {renderNaToggle(`clixS8Setbacks${side}RemarksNA`, fields, handleChange, isReadOnly)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        );
      }
    },
    {
      id: 'clix-section-9',
      title: '9. AREA AND USAGE DETAIL',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const DEFAULT_FLOORS = [
          { id: 'basement', label: 'Basement',     description: '', isNA: false },
          { id: 'ground',   label: 'Ground Floor',  description: '', isNA: false },
          { id: 'first',    label: 'First Floor',   description: '', isNA: false },
          { id: 'second',   label: 'Second Floor',  description: '', isNA: false },
          { id: 'third',    label: 'Third Floor',   description: '', isNA: false },
          { id: 'fourth',   label: 'Fourth Floor',  description: '', isNA: false },
        ];
        const accFloors: any[] = fields.clixAccFloors || DEFAULT_FLOORS;
        const activeFloors = accFloors.filter((f: any) => !f.isNA);
        const s9Rows = fields.clixS9BuaRows || [];

        const getRowData = (floorId: string) => {
          return s9Rows.find((r: any) => r.id === floorId) || {};
        };
        const updateRow = (floorId: string, key: string, val: any) => {
          const existing = s9Rows.find((r: any) => r.id === floorId);
          if (existing) {
             handleChange('clixS9BuaRows', s9Rows.map((r: any) => r.id === floorId ? { ...r, [key]: val } : r));
          } else {
             handleChange('clixS9BuaRows', [...s9Rows, { id: floorId, [key]: val }]);
          }
        };

        const renderRowNaToggle = (floorId: string, fieldKey: string) => {
          const isNa = !!getRowData(floorId)[fieldKey];
          return (
            <label className="flex items-center gap-1 cursor-pointer ml-3">
              <input
                type="checkbox"
                className="rounded text-emerald-600 focus:ring-emerald-500"
                checked={isNa}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateRow(floorId, fieldKey, checked);
                  if (checked) {
                    updateRow(floorId, fieldKey.replace('NA', ''), 'NA');
                  } else {
                    updateRow(floorId, fieldKey.replace('NA', ''), '');
                  }
                }}
                disabled={isReadOnly}
              />
              <span className="text-[10px] uppercase font-bold text-gray-400">NA</span>
            </label>
          );
        };

        const renderRowEditSwitch = (floorId: string, fieldKey: string, isNa: boolean = false) => {
          const editOn = !!getRowData(floorId)[fieldKey];
          return (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {editOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => updateRow(floorId, fieldKey, !editOn)}
                disabled={isReadOnly || isNa}
                className={`w-10 h-5 rounded-full relative transition-colors ${(editOn && !isNa) ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editOn ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          );
        };

        let totalAdopted = 0;
        activeFloors.forEach((f: any) => {
          const rowData = getRowData(f.id);
          const actualStr = rowData.actual || '0';
          const isEdit = rowData.adoptedEdit;
          const adoptedStr = isEdit ? (rowData.adopted || '0') : actualStr;
          totalAdopted += (parseFloat(adoptedStr) || 0);
        });

        const autoTotalAdopted = totalAdopted.toFixed(2);
        const isTotalEdit = fields.clixEnableS9TotalBuaAdoptedEdit;
        const finalTotalAdopted = isTotalEdit ? (fields.clixS9TotalBuaAdopted || '') : autoTotalAdopted;

        const approvedFloors = parseFloat(fields.clixS9FloorsApproved || '0') || 0;
        const constructedFloors = parseFloat(fields.clixS9FloorsConstructed || '0') || 0;
        let autoDev = '0';
        if (approvedFloors > 0) {
          autoDev = (((constructedFloors - approvedFloors) / approvedFloors) * 100).toFixed(2);
        } else if (constructedFloors > 0 && (fields.clixS9FloorsApprovedNA || approvedFloors === 0)) {
          autoDev = '100'; 
        }
        
        const isDevEdit = fields.clixEnableS9FloorsDeviationEdit;
        const finalDev = isDevEdit ? (fields.clixS9FloorsDeviation || '') : autoDev;

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-teal-200 bg-[#e0f2f1] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Built-up Area (BUA) Table</h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-teal-100">
                    <tr>
                      <th className="px-4 py-2 min-w-[150px]">Floor</th>
                      <th className="px-4 py-2 min-w-[200px]">Area (Sale deed) (Sq.Ft.)</th>
                      <th className="px-4 py-2 min-w-[200px]">Area (as per actual) (Sq.Ft.)</th>
                      <th className="px-4 py-2 min-w-[250px]">Area Adopted for valuation (Sq.Ft.)</th>
                      <th className="px-4 py-2 min-w-[200px]">Occupancy Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFloors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500 bg-[#e0f2f1]">
                          No active floors found. Please add floors in Section 5 (Accommodation Table).
                        </td>
                      </tr>
                    )}
                    {activeFloors.map((floor: any) => {
                      const rowData = getRowData(floor.id);
                      const isAdoptedEdit = rowData.adoptedEdit;
                      const actualArea = rowData.actual || '';
                      const adoptedVal = isAdoptedEdit ? (rowData.adopted || '') : actualArea;
                      const occDrop = rowData.occupancyDropdown;

                      return (
                        <tr key={floor.id} className="bg-[#e0f2f1] border-b border-teal-200">
                          <td className="px-4 py-2 font-medium text-gray-900">{floor.label}</td>
                          
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type={rowData.saleDeedNA ? "text" : "number"}
                                className={`${inputCls} ${rowData.saleDeedNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                value={rowData.saleDeedNA ? 'NA' : (rowData.saleDeed || '')}
                                onChange={(e) => updateRow(floor.id, 'saleDeed', e.target.value)}
                                disabled={isReadOnly || rowData.saleDeedNA}
                              />
                              {renderRowNaToggle(floor.id, 'saleDeedNA')}
                            </div>
                          </td>

                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type={rowData.actualNA ? "text" : "number"}
                                className={`${inputCls} ${rowData.actualNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                value={rowData.actualNA ? 'NA' : actualArea}
                                onChange={(e) => updateRow(floor.id, 'actual', e.target.value)}
                                disabled={isReadOnly || rowData.actualNA}
                              />
                              {renderRowNaToggle(floor.id, 'actualNA')}
                            </div>
                          </td>

                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              {renderRowEditSwitch(floor.id, 'adoptedEdit')}
                              <div className="flex items-center gap-2 relative">
                                {isAdoptedEdit ? (
                                  <input
                                    type={rowData.adoptedNA ? "text" : "number"}
                                    className={`${inputCls} ${rowData.adoptedNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                    value={rowData.adoptedNA ? 'NA' : adoptedVal}
                                    onChange={(e) => updateRow(floor.id, 'adopted', e.target.value)}
                                    disabled={isReadOnly || rowData.adoptedNA}
                                  />
                                ) : (
                                  <div className="relative w-full">
                                    <input 
                                      className={`${inputCls} pr-10 bg-white text-gray-700`} 
                                      value={rowData.adoptedNA ? 'NA' : adoptedVal} 
                                      readOnly 
                                      disabled={isReadOnly || rowData.adoptedNA}
                                      title='>>Prefill from section 9, "Area (as per actual)"<<'
                                    />
                                    {!rowData.adoptedNA && (
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from section 9, "Area (as per actual)"<<'>
                                        <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                {renderRowNaToggle(floor.id, 'adoptedNA')}
                              </div>
                            </div>
                          </td>

                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <select
                                  className={`${inputCls} ${rowData.occupancyNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                  value={rowData.occupancyNA ? 'NA' : (occDrop || '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateRow(floor.id, 'occupancyDropdown', val);
                                    if (val !== 'Custom') {
                                      updateRow(floor.id, 'occupancy', val);
                                    } else {
                                      updateRow(floor.id, 'occupancy', '');
                                    }
                                  }}
                                  disabled={isReadOnly || rowData.occupancyNA}
                                >
                                  <option value="">Select Option</option>
                                  <option value="Self-Occupied">Self-Occupied</option>
                                  <option value="Vacant">Vacant</option>
                                  <option value="Tenanted">Tenanted</option>
                                  <option value="Custom">Custom</option>
                                </select>
                                {renderRowNaToggle(floor.id, 'occupancyNA')}
                              </div>
                              {occDrop === 'Custom' && !rowData.occupancyNA && (
                                <input
                                  type="text"
                                  className={`${inputCls} bg-white`}
                                  placeholder="Enter custom occupancy..."
                                  value={rowData.occupancy || ''}
                                  onChange={(e) => updateRow(floor.id, 'occupancy', e.target.value)}
                                  disabled={isReadOnly}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Total Built-up area (Sq.Ft.)</span>
                    <div className="flex items-center gap-2">
                      {renderEditSwitch('clixEnableS9TotalBuaAdoptedEdit', fields, handleChange, isReadOnly, fields.clixS9TotalBuaAdoptedNA)}
                      {renderNaToggle('clixS9TotalBuaAdoptedNA', fields, handleChange, isReadOnly)}
                    </div>
                  </div>
                }>
                  <div className="relative">
                    {isTotalEdit ? (
                      <input 
                        type={fields.clixS9TotalBuaAdoptedNA ? "text" : "number"}
                        className={`${inputCls} ${fields.clixS9TotalBuaAdoptedNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                        value={fields.clixS9TotalBuaAdoptedNA ? 'NA' : finalTotalAdopted} 
                        onChange={e => handleChange('clixS9TotalBuaAdopted', e.target.value)} 
                        disabled={isReadOnly || fields.clixS9TotalBuaAdoptedNA} 
                      />
                    ) : (
                      <div className="relative w-full">
                        <input 
                          className={`${inputCls} pr-10 bg-white text-gray-700`} 
                          value={fields.clixS9TotalBuaAdoptedNA ? 'NA' : finalTotalAdopted} 
                          readOnly 
                          disabled={isReadOnly || fields.clixS9TotalBuaAdoptedNA} 
                          title=">>Auto calculating from [Sum of all Area Adopted for valuation]<<"
                        />
                        {!fields.clixS9TotalBuaAdoptedNA && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title=">>Auto calculating from [Sum of all Area Adopted for valuation]<<">
                            <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                <div className="hidden md:block"></div>

                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Floors (Approved)</span>
                    {renderNaToggle('clixS9FloorsApprovedNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input
                    type={fields.clixS9FloorsApprovedNA ? "text" : "number"}
                    className={`${inputCls} ${fields.clixS9FloorsApprovedNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    value={fields.clixS9FloorsApprovedNA ? 'NA' : (fields.clixS9FloorsApproved || '')}
                    onChange={(e) => handleChange('clixS9FloorsApproved', e.target.value)}
                    disabled={isReadOnly || fields.clixS9FloorsApprovedNA}
                  />
                </Field>

                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Floors (Constructed)</span>
                    {renderNaToggle('clixS9FloorsConstructedNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <input
                    type={fields.clixS9FloorsConstructedNA ? "text" : "number"}
                    className={`${inputCls} ${fields.clixS9FloorsConstructedNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    value={fields.clixS9FloorsConstructedNA ? 'NA' : (fields.clixS9FloorsConstructed || '')}
                    onChange={(e) => handleChange('clixS9FloorsConstructed', e.target.value)}
                    disabled={isReadOnly || fields.clixS9FloorsConstructedNA}
                  />
                </Field>

                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>% Deviation</span>
                    <div className="flex items-center gap-2">
                      {renderEditSwitch('clixEnableS9FloorsDeviationEdit', fields, handleChange, isReadOnly, fields.clixS9FloorsDeviationNA)}
                      {renderNaToggle('clixS9FloorsDeviationNA', fields, handleChange, isReadOnly)}
                    </div>
                  </div>
                }>
                  <div className="relative">
                    {isDevEdit ? (
                      <input 
                        type={fields.clixS9FloorsDeviationNA ? "text" : "number"}
                        className={`${inputCls} ${fields.clixS9FloorsDeviationNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                        value={fields.clixS9FloorsDeviationNA ? 'NA' : finalDev} 
                        onChange={e => handleChange('clixS9FloorsDeviation', e.target.value)} 
                        disabled={isReadOnly || fields.clixS9FloorsDeviationNA} 
                      />
                    ) : (
                      <div className="relative w-full">
                        <input 
                          className={`${inputCls} pr-10 bg-white text-gray-700`} 
                          value={fields.clixS9FloorsDeviationNA ? 'NA' : finalDev} 
                          readOnly 
                          disabled={isReadOnly || fields.clixS9FloorsDeviationNA} 
                          title=">>Auto calculating from [((Constructed - Approved) / Approved) * 100]<<"
                        />
                        {!fields.clixS9FloorsDeviationNA && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title=">>Auto calculating from [((Constructed - Approved) / Approved) * 100]<<">
                            <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Demolition List">
                  <div className="flex gap-4 mt-2">
                    {['Yes', 'No', 'NA'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clixS9DemolitionList"
                          value={opt}
                          checked={fields.clixS9DemolitionList === opt}
                          onChange={(e) => handleChange('clixS9DemolitionList', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'clix-section-10',
      title: '10. FAIR MARKET VALUE',
      number: 10,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const DEFAULT_FLOORS = [
          { id: 'basement', label: 'Basement',     description: '', isNA: false },
          { id: 'ground',   label: 'Ground Floor',  description: '', isNA: false },
          { id: 'first',    label: 'First Floor',   description: '', isNA: false },
          { id: 'second',   label: 'Second Floor',  description: '', isNA: false },
          { id: 'third',    label: 'Third Floor',   description: '', isNA: false },
          { id: 'fourth',   label: 'Fourth Floor',  description: '', isNA: false },
        ];
        const accFloors: any[] = fields.clixAccFloors || DEFAULT_FLOORS;
        const activeFloors = accFloors.filter((f: any) => !f.isNA);
        
        const s9Rows = fields.clixS9BuaRows || [];
        const s10Rows = fields.clixS10ValuationRows || [];
        
        const formatINR = (val: string | number) => {
          if (!val && val !== 0) return '';
          if (val === 'NA') return 'NA';
          const num = parseFloat(val.toString().replace(/,/g, ''));
          if (isNaN(num)) return val.toString();
          // Using maximumFractionDigits: 2 to keep consistency like .toFixed(2)
          return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);
        };
        const parseINR = (val: string) => val.replace(/[^0-9.]/g, '');

        const getRowData = (floorId: string) => {
          return s10Rows.find((r: any) => r.id === floorId) || {};
        };
        const getS9AdoptedArea = (floorId: string) => {
          const s9 = s9Rows.find((r: any) => r.id === floorId) || {};
          const isAdoptedEdit = s9.adoptedEdit;
          const actualArea = s9.actual || '0';
          return isAdoptedEdit ? (s9.adopted || '0') : actualArea;
        };

        const updateRow = (floorId: string, key: string, val: any) => {
          const existing = s10Rows.find((r: any) => r.id === floorId);
          if (existing) {
             handleChange('clixS10ValuationRows', s10Rows.map((r: any) => r.id === floorId ? { ...r, [key]: val } : r));
          } else {
             handleChange('clixS10ValuationRows', [...s10Rows, { id: floorId, [key]: val }]);
          }
        };

        const renderRowNaToggle = (floorId: string, fieldKey: string) => {
          const isNa = !!getRowData(floorId)[fieldKey];
          return (
            <label className="flex items-center gap-1 cursor-pointer ml-3">
              <input
                type="checkbox"
                className="rounded text-emerald-600 focus:ring-emerald-500"
                checked={isNa}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateRow(floorId, fieldKey, checked);
                  if (checked) {
                    updateRow(floorId, fieldKey.replace('NA', ''), 'NA');
                  } else {
                    updateRow(floorId, fieldKey.replace('NA', ''), '');
                  }
                }}
                disabled={isReadOnly}
              />
              <span className="text-[10px] uppercase font-bold text-gray-400">NA</span>
            </label>
          );
        };

        const renderRowEditSwitch = (floorId: string, fieldKey: string, isNa: boolean = false) => {
          const editOn = !!getRowData(floorId)[fieldKey];
          return (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {editOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => updateRow(floorId, fieldKey, !editOn)}
                disabled={isReadOnly || isNa}
                className={`w-10 h-5 rounded-full relative transition-colors ${(editOn && !isNa) ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editOn ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          );
        };

        let autoTotalBua = 0;
        activeFloors.forEach((f: any) => {
          const r = getRowData(f.id);
          const s9AreaStr = getS9AdoptedArea(f.id);
          const adoptedAreaStr = r.areaEdit ? (r.area || '0') : s9AreaStr;
          const areaNum = parseFloat(adoptedAreaStr) || 0;
          const rateNum = parseFloat(r.rate || '0') || 0;
          const autoAmt = areaNum * rateNum;
          
          const amtStr = r.amountEdit ? (r.amount || '0') : autoAmt.toString();
          autoTotalBua += (parseFloat(amtStr) || 0);
        });

        const autoTotalBuaStr = autoTotalBua.toString();
        const isTotalBuaEdit = fields.clixEnableS10TotalBuaEdit;
        const finalTotalBua = isTotalBuaEdit ? (fields.clixS10TotalBua || '') : autoTotalBuaStr;

        const landAmt = parseFloat(fields.clixS10LandAmount || '0') || 0;
        const autoFmv = (landAmt + parseFloat(finalTotalBua || '0')).toString();
        const isFmvEdit = fields.clixEnableS10FmvEdit;
        const finalFmv = isFmvEdit ? (fields.clixS10Fmv || '') : autoFmv;

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-indigo-200 bg-[#e8eaf6] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Valuation Tables (General & Self Construction)</h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-indigo-100">
                    <tr>
                      <th className="px-4 py-2 min-w-[150px]">Floor</th>
                      <th className="px-4 py-2 min-w-[200px]">Area (Sqft)</th>
                      <th className="px-4 py-2 min-w-[200px]">Rate (per Sqft)</th>
                      <th className="px-4 py-2 min-w-[200px]">Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFloors.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-gray-500 bg-[#e8eaf6]">
                          No active floors found. Please add floors in Section 5.
                        </td>
                      </tr>
                    )}
                    {activeFloors.map((floor: any) => {
                      const rowData = getRowData(floor.id);
                      
                      const s9AreaStr = getS9AdoptedArea(floor.id);
                      const isAreaEdit = rowData.areaEdit;
                      const finalArea = isAreaEdit ? (rowData.area || '') : s9AreaStr;
                      
                      const rateNum = parseFloat(rowData.rate || '0') || 0;
                      const areaNum = parseFloat(finalArea || '0') || 0;
                      const autoAmtStr = (areaNum * rateNum).toString();
                      const isAmtEdit = rowData.amountEdit;
                      const finalAmt = isAmtEdit ? (rowData.amount || '') : autoAmtStr;

                      return (
                        <tr key={floor.id} className="bg-[#e8eaf6] border-b border-indigo-200">
                          <td className="px-4 py-2 font-medium text-gray-900">{floor.label}</td>
                          
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              {renderRowEditSwitch(floor.id, 'areaEdit')}
                              <div className="flex items-center gap-2 relative">
                                {isAreaEdit ? (
                                  <input
                                    type={rowData.areaNA ? "text" : "number"}
                                    className={`${inputCls} ${rowData.areaNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                    value={rowData.areaNA ? 'NA' : finalArea}
                                    onChange={(e) => updateRow(floor.id, 'area', e.target.value)}
                                    disabled={isReadOnly || rowData.areaNA}
                                  />
                                ) : (
                                  <div className="relative w-full">
                                    <input 
                                      className={`${inputCls} pr-10 bg-white text-gray-700`} 
                                      value={rowData.areaNA ? 'NA' : finalArea} 
                                      readOnly 
                                      disabled={isReadOnly || rowData.areaNA}
                                      title='>>Prefill from section 9, "Area Adopted for valuation (Sq.Ft.)"<<'
                                    />
                                    {!rowData.areaNA && (
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from section 9, "Area Adopted for valuation (Sq.Ft.)"<<'>
                                        <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                {renderRowNaToggle(floor.id, 'areaNA')}
                              </div>
                            </div>
                          </td>

                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">₹</span>
                              <input
                                type="text"
                                className={`${inputCls} pl-7 ${rowData.rateNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                value={rowData.rateNA ? 'NA' : formatINR(rowData.rate || '')}
                                onChange={(e) => updateRow(floor.id, 'rate', parseINR(e.target.value))}
                                disabled={isReadOnly || rowData.rateNA}
                              />
                              {renderRowNaToggle(floor.id, 'rateNA')}
                            </div>
                          </td>

                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              {renderRowEditSwitch(floor.id, 'amountEdit')}
                              <div className="flex items-center gap-2 relative">
                                {isAmtEdit ? (
                                  <div className="relative w-full">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">₹</span>
                                    <input
                                      type="text"
                                      className={`${inputCls} pl-7 ${rowData.amountNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                      value={rowData.amountNA ? 'NA' : formatINR(finalAmt)}
                                      onChange={(e) => updateRow(floor.id, 'amount', parseINR(e.target.value))}
                                      disabled={isReadOnly || rowData.amountNA}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative w-full">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">₹</span>
                                    <input 
                                      className={`${inputCls} pl-7 pr-10 bg-white text-gray-700`} 
                                      value={rowData.amountNA ? 'NA' : formatINR(finalAmt)} 
                                      readOnly 
                                      disabled={isReadOnly || rowData.amountNA}
                                      title=">>Auto calculating from [Area * Rate]<<"
                                    />
                                    {!rowData.amountNA && (
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title=">>Auto calculating from [Area * Rate]<<">
                                        <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                {renderRowNaToggle(floor.id, 'amountNA')}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Land Amount (Rs)</span>
                    {renderNaToggle('clixS10LandAmountNA', fields, handleChange, isReadOnly)}
                  </div>
                }>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">₹</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-7 ${fields.clixS10LandAmountNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                      value={fields.clixS10LandAmountNA ? 'NA' : formatINR(fields.clixS10LandAmount || '')}
                      onChange={(e) => handleChange('clixS10LandAmount', parseINR(e.target.value))}
                      disabled={isReadOnly || fields.clixS10LandAmountNA}
                    />
                  </div>
                </Field>

                <Field label={
                  <div className="w-full flex items-center justify-between">
                    <span>Total BUA value (Rs)</span>
                    <div className="flex items-center gap-2">
                      {renderEditSwitch('clixEnableS10TotalBuaEdit', fields, handleChange, isReadOnly, fields.clixS10TotalBuaNA)}
                      {renderNaToggle('clixS10TotalBuaNA', fields, handleChange, isReadOnly)}
                    </div>
                  </div>
                }>
                  <div className="relative">
                    {isTotalBuaEdit ? (
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">₹</span>
                        <input 
                          type="text"
                          className={`${inputCls} pl-7 ${fields.clixS10TotalBuaNA ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
                          value={fields.clixS10TotalBuaNA ? 'NA' : formatINR(finalTotalBua)} 
                          onChange={e => handleChange('clixS10TotalBua', parseINR(e.target.value))} 
                          disabled={isReadOnly || fields.clixS10TotalBuaNA} 
                        />
                      </div>
                    ) : (
                      <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">₹</span>
                        <input 
                          className={`${inputCls} pl-7 pr-10 bg-white text-gray-700`} 
                          value={fields.clixS10TotalBuaNA ? 'NA' : formatINR(finalTotalBua)} 
                          readOnly 
                          disabled={isReadOnly || fields.clixS10TotalBuaNA} 
                          title=">>Auto calculating from [Sum of all Amount (Rs)]<<"
                        />
                        {!fields.clixS10TotalBuaNA && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title=">>Auto calculating from [Sum of all Amount (Rs)]<<">
                            <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                <div className="md:col-span-2">
                  <Field label={
                    <div className="w-full flex items-center justify-between">
                      <span className="text-indigo-900 font-bold text-base">Fair Market Value (Rs)</span>
                      <div className="flex items-center gap-2">
                        {renderEditSwitch('clixEnableS10FmvEdit', fields, handleChange, isReadOnly, fields.clixS10FmvNA)}
                        {renderNaToggle('clixS10FmvNA', fields, handleChange, isReadOnly)}
                      </div>
                    </div>
                  }>
                    <div className="relative">
                      {isFmvEdit ? (
                        <div className="relative w-full">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900 font-bold z-10 text-lg">₹</span>
                          <input 
                            type="text"
                            className={`${inputCls} pl-8 py-3 text-lg font-bold text-indigo-900 border-indigo-400 focus:border-indigo-600 focus:ring-indigo-500 ${fields.clixS10FmvNA ? 'bg-indigo-100 cursor-not-allowed' : 'bg-indigo-50/80 shadow-inner'}`} 
                            value={fields.clixS10FmvNA ? 'NA' : formatINR(finalFmv)} 
                            onChange={e => handleChange('clixS10Fmv', parseINR(e.target.value))} 
                            disabled={isReadOnly || fields.clixS10FmvNA} 
                          />
                        </div>
                      ) : (
                        <div className="relative w-full">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-900 font-bold z-10 text-lg">₹</span>
                          <input 
                            className={`${inputCls} pl-8 pr-10 py-3 text-lg font-bold text-indigo-900 border-indigo-400 bg-indigo-50/80 shadow-inner`} 
                            value={fields.clixS10FmvNA ? 'NA' : formatINR(finalFmv)} 
                            readOnly 
                            disabled={isReadOnly || fields.clixS10FmvNA} 
                            title=">>Auto calculating from [Land Amount + Total BUA value]<<"
                          />
                          {!fields.clixS10FmvNA && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title=">>Auto calculating from [Land Amount + Total BUA value]<<">
                              <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

              </div>
            </div>
          </div>
        );
      }
    }
  ],
  defaultValues: {
    clixReportType: 'Technical Scrutiny Report',
    clixLoanType: 'LAP',
    
    // Section 7 Variables
    clixTypeOfStructureDropdown: 'RCC',
    clixTypeOfStructure: 'RCC',
    clixTypeOfStructureNA: false,
    clixPaintingDropdown: 'Completed',
    clixPainting: 'Completed',
    clixPaintingNA: false,
    clixFlooringDropdown: 'Tiles',
    clixFlooring: 'Tiles',
    clixFlooringNA: false,
    clixBathroomFittingsDropdown: 'Completed',
    clixBathroomFittings: 'Completed',
    clixBathroomFittingsNA: false,
    clixElectricalFittingsDropdown: 'Concealed wiring',
    clixElectricalFittings: 'Concealed wiring',
    clixElectricalFittingsNA: false,
    clixKitchenDropdown: 'Tile Flooring & Steel Sink',
    clixKitchen: 'Tile Flooring & Steel Sink',
    clixKitchenNA: false,
    clixInteriorsDropdown: 'Good',
    clixInteriors: 'Good',
    clixInteriorsNA: false,
    
    // Section 8 Variables
    clixS8BoundariesNorthAsPerDoc: '', clixS8BoundariesNorthAsPerDocNA: false,
    clixS8BoundariesNorthAsPerSite: '', clixS8BoundariesNorthAsPerSiteNA: false,
    clixS8BoundariesNorthDimension: '', clixS8BoundariesNorthDimensionNA: false,
    clixS8BoundariesSouthAsPerDoc: '', clixS8BoundariesSouthAsPerDocNA: false,
    clixS8BoundariesSouthAsPerSite: '', clixS8BoundariesSouthAsPerSiteNA: false,
    clixS8BoundariesSouthDimension: '', clixS8BoundariesSouthDimensionNA: false,
    clixS8BoundariesEastAsPerDoc: '', clixS8BoundariesEastAsPerDocNA: false,
    clixS8BoundariesEastAsPerSite: '', clixS8BoundariesEastAsPerSiteNA: false,
    clixS8BoundariesEastDimension: '', clixS8BoundariesEastDimensionNA: false,
    clixS8BoundariesWestAsPerDoc: '', clixS8BoundariesWestAsPerDocNA: false,
    clixS8BoundariesWestAsPerSite: '', clixS8BoundariesWestAsPerSiteNA: false,
    clixS8BoundariesWestDimension: '', clixS8BoundariesWestDimensionNA: false,
    clixS8DemarcationMatching: 'Yes', clixS8DemarcationMatchingNA: false,
    clixS8DemarcationMismatchExplanation: '',
    clixS8NotesForDemarcation: '', clixS8NotesForDemarcationNA: false,
    clixS8SetbacksFrontApproved: '', clixS8SetbacksFrontApprovedNA: false,
    clixS8SetbacksFrontActual: '', clixS8SetbacksFrontActualNA: false,
    clixS8EnableSetbacksFrontDeviationsEdit: false,
    clixS8SetbacksFrontDeviations: '', clixS8SetbacksFrontDeviationsNA: false,
    clixS8SetbacksFrontRemarks: '', clixS8SetbacksFrontRemarksNA: false,
    clixS8SetbacksRearApproved: '', clixS8SetbacksRearApprovedNA: false,
    clixS8SetbacksRearActual: '', clixS8SetbacksRearActualNA: false,
    clixS8EnableSetbacksRearDeviationsEdit: false,
    clixS8SetbacksRearDeviations: '', clixS8SetbacksRearDeviationsNA: false,
    clixS8SetbacksRearRemarks: '', clixS8SetbacksRearRemarksNA: false,
    clixS8SetbacksLeftSideApproved: '', clixS8SetbacksLeftSideApprovedNA: false,
    clixS8SetbacksLeftSideActual: '', clixS8SetbacksLeftSideActualNA: false,
    clixS8EnableSetbacksLeftSideDeviationsEdit: false,
    clixS8SetbacksLeftSideDeviations: '', clixS8SetbacksLeftSideDeviationsNA: false,
    clixS8SetbacksLeftSideRemarks: '', clixS8SetbacksLeftSideRemarksNA: false,
    clixS8SetbacksRightSideApproved: '', clixS8SetbacksRightSideApprovedNA: false,
    clixS8SetbacksRightSideActual: '', clixS8SetbacksRightSideActualNA: false,
    clixS8EnableSetbacksRightSideDeviationsEdit: false,
    clixS8SetbacksRightSideDeviations: '', clixS8SetbacksRightSideDeviationsNA: false,
    clixS8SetbacksRightSideRemarks: '', clixS8SetbacksRightSideRemarksNA: false,
    
    // Section 9 Variables
    clixS9BuaRows: [],
    
    clixEnableS9TotalBuaAdoptedEdit: false,
    clixS9TotalBuaAdopted: '', clixS9TotalBuaAdoptedNA: false,
    
    clixS9FloorsApproved: '', clixS9FloorsApprovedNA: false,
    clixS9FloorsConstructed: '', clixS9FloorsConstructedNA: false,
    
    clixEnableS9FloorsDeviationEdit: false,
    clixS9FloorsDeviation: '', clixS9FloorsDeviationNA: false,
    
    clixS9DemolitionList: 'NA',

    // Section 10 Variables
    clixS10ValuationRows: [],
    clixS10LandAmount: '', clixS10LandAmountNA: false,
    clixEnableS10TotalBuaEdit: false,
    clixS10TotalBua: '', clixS10TotalBuaNA: false,
    clixEnableS10FmvEdit: false,
    clixS10Fmv: '', clixS10FmvNA: false,
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
