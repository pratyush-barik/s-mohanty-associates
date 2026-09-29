'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig, BaseReportFields } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';

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
    { id: 'section-11', title: 'Photos' },
    { id: 'section-12', title: 'Maps' }
  ],
  defaultValues: {
    clixReportType: 'Technical Scrutiny Report',
    clixLoanType: 'LAP'
  }
};

export default function ClixCapital(props: BankReportBuilderProps) {
  return (
    <BankReportBuilder
      config={CLIX_CAPITAL_CONFIG}
      {...props}
      renderSection={(sectionId, fields, handleChange, isReadOnly) => {
        if (sectionId === 'clix-section-1') {
          return (
            <div className="animate-fade-in space-y-6">
              <div className="border border-[#F5F5F5] bg-[#F5F5F5] rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-4">Report Type</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Report Type">
                    <select
                      className={inputCls}
                      value={fields.clixReportType || ''}
                      onChange={e => handleChange('clixReportType', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">Select Report Type</option>
                      <option value="Technical Scrutiny Report">Technical Scrutiny Report</option>
                      <option value="Valuation">Valuation</option>
                    </select>
                  </Field>

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

                  <Field label="Application No">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixApplicationNo || ''}
                      onChange={e => handleChange('clixApplicationNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="Collateral ID">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixCollateralId || ''}
                      onChange={e => handleChange('clixCollateralId', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          );
        }
        
        if (sectionId === 'clix-section-2') {
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
                  
                  <Field label="Borrower Contact No">
                    <input
                      type="text"
                      maxLength={10}
                      className={inputCls}
                      value={fields.clixBorrowerContactNo || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('clixBorrowerContactNo', val);
                      }}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                        checked={!!fields.clixRepSameAsBorrower}
                        onChange={e => {
                          const checked = e.target.checked;
                          handleChange('clixRepSameAsBorrower', checked);
                          if (checked) {
                            handleChange('clixBorrowerRepName', fields.clixBorrowerName || '');
                            handleChange('clixBorrowerRepContactNo', fields.clixBorrowerContactNo || '');
                          } else {
                            handleChange('clixBorrowerRepName', '');
                            handleChange('clixBorrowerRepContactNo', '');
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      <span className="text-sm font-medium text-gray-700">Representative same as Borrower</span>
                    </label>
                  </div>

                  <Field label="Borrower Representative Name">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixBorrowerRepName || ''}
                      onChange={e => handleChange('clixBorrowerRepName', e.target.value)}
                      disabled={isReadOnly || !!fields.clixRepSameAsBorrower}
                    />
                  </Field>
                  
                  <Field label="Borrower Rep Contact No">
                    <input
                      type="text"
                      maxLength={10}
                      className={inputCls}
                      value={fields.clixBorrowerRepContactNo || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('clixBorrowerRepContactNo', val);
                      }}
                      disabled={isReadOnly || !!fields.clixRepSameAsBorrower}
                    />
                  </Field>
                  
                  <Field label="Relationship Manager Name">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.clixRmName || ''}
                      onChange={e => handleChange('clixRmName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  
                  <Field label="Relationship Manager Contact No">
                    <input
                      type="text"
                      maxLength={10}
                      className={inputCls}
                      value={fields.clixRmContactNo || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange('clixRmContactNo', val);
                      }}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          );
        }
        return null; // For standard sections like cover, photos, maps
      }}
    />
  );
}
