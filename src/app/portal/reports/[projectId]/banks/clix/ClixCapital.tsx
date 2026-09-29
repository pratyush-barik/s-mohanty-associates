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
