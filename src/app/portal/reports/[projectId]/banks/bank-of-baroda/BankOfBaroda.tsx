'use client';
import React, { useState, ReactNode } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFBankOfBarodaRenderer } from '@/lib/banks/pdf-bank-of-baroda-renderer';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   BOB-SPECIFIC SECTION (Olive Green Accordion Header)
   ═══════════════════════════════════════════════════════════════════════ */
function BobSection({ title, number, id, children, defaultOpen = false }: {
  title: string; number?: number | string; id?: string; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const secId = id || (number ? `bob-section-${number}` : undefined);
  return (
    <div id={secId} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24 rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-white hover:brightness-110 transition-all"
        style={{ backgroundColor: '#4A5D23' }}
      >
        <div className="flex items-center gap-3">
          {number && (
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
              style={{ backgroundColor: '#3a4a1b' }}>
              {number}
            </span>
          )}
          <span className="font-semibold text-sm tracking-wide whitespace-pre-line text-left">{title}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   REUSABLE HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

/** Dropdown with mandatory "Custom" option; shows text input when Custom is selected */
function DropdownWithCustom({ label, fieldKey, options, fields, handleChange, isReadOnly, naKey, placeholder }: {
  label: string | ReactNode; fieldKey: string; options: string[]; fields: any; handleChange: any; isReadOnly: boolean;
  naKey?: string; placeholder?: string;
}) {
  const isNA = naKey ? fields[naKey] === true : false;
  const dropdownKey = `${fieldKey}Dropdown`;
  const dropdownVal = fields[dropdownKey] || '';
  const customKey = `${fieldKey}Custom`;
  return (
    <Field label={label}>
      <div className="flex gap-2 items-start flex-wrap">
        <div className="flex-1 min-w-50">
          <select
            className={inputCls}
            value={dropdownVal}
            onChange={e => {
              const v = e.target.value;
              handleChange(dropdownKey, v);
              if (v !== 'custom') {
                handleChange(fieldKey, v);
                handleChange(customKey, '');
              } else {
                handleChange(fieldKey, fields[customKey] || '');
              }
            }}
            disabled={isReadOnly || isNA}
          >
            <option value="">Select</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="custom">Custom</option>
          </select>
          {dropdownVal === 'custom' && (
            <input
              className={`${inputCls} mt-2`}
              value={fields[customKey] || ''}
              onChange={e => {
                handleChange(customKey, e.target.value);
                handleChange(fieldKey, e.target.value);
              }}
              disabled={isReadOnly || isNA}
              placeholder={placeholder || 'Enter custom value...'}
            />
          )}
        </div>
        {naKey && (
          <label className="flex items-center gap-1.5 mt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNA}
              onChange={e => {
                handleChange(naKey, e.target.checked);
                if (e.target.checked) {
                  handleChange(fieldKey, 'NA');
                  handleChange(dropdownKey, '');
                }
              }}
              disabled={isReadOnly}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-500 font-medium">N/A</span>
          </label>
        )}
      </div>
    </Field>
  );
}

/** Dropdown + Variable Size input combo (dropdown sets initial, text area for elaboration) */
function DropdownWithTextarea({ label, fieldKey, options, fields, handleChange, isReadOnly, naKey, placeholder }: {
  label: string | ReactNode; fieldKey: string; options: string[]; fields: any; handleChange: any; isReadOnly: boolean;
  naKey?: string; placeholder?: string;
}) {
  const isNA = naKey ? fields[naKey] === true : false;
  const dropdownKey = `${fieldKey}Dropdown`;
  const dropdownVal = fields[dropdownKey] || '';
  const customKey = `${fieldKey}Custom`;
  return (
    <Field label={label}>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <select
            className={`${inputCls} flex-1`}
            value={dropdownVal}
            onChange={e => {
              const v = e.target.value;
              handleChange(dropdownKey, v);
              if (v !== 'custom') {
                handleChange(fieldKey, v);
              } else {
                handleChange(fieldKey, fields[customKey] || '');
              }
            }}
            disabled={isReadOnly || isNA}
          >
            <option value="">Select</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="custom">Custom</option>
          </select>
          {naKey && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={isNA}
                onChange={e => {
                  handleChange(naKey, e.target.checked);
                  if (e.target.checked) { handleChange(fieldKey, 'NA'); handleChange(dropdownKey, ''); }
                }}
                disabled={isReadOnly}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 font-medium">N/A</span>
            </label>
          )}
        </div>
        {(dropdownVal === 'custom' || (!dropdownVal && !isNA)) && (
          <textarea
            className={inputCls}
            rows={2}
            value={dropdownVal === 'custom' ? (fields[customKey] || '') : (fields[fieldKey] || '')}
            onChange={e => {
              if (dropdownVal === 'custom') {
                handleChange(customKey, e.target.value);
                handleChange(fieldKey, e.target.value);
              } else {
                handleChange(fieldKey, e.target.value);
              }
            }}
            disabled={isReadOnly || isNA}
            placeholder={placeholder || 'Enter details...'}
          />
        )}
      </div>
    </Field>
  );
}

/** Dropdown + Input Box combo */
function DropdownWithInput({ label, fieldKey, options, fields, handleChange, isReadOnly, naKey, placeholder }: {
  label: string | ReactNode; fieldKey: string; options: string[]; fields: any; handleChange: any; isReadOnly: boolean;
  naKey?: string; placeholder?: string;
}) {
  const isNA = naKey ? fields[naKey] === true : false;
  const dropdownKey = `${fieldKey}Dropdown`;
  const dropdownVal = fields[dropdownKey] || '';
  const customKey = `${fieldKey}Custom`;
  return (
    <Field label={label}>
      <div className="flex gap-2 items-start flex-wrap">
        <div className="flex-1 min-w-50">
          <select
            className={inputCls}
            value={dropdownVal}
            onChange={e => {
              const v = e.target.value;
              handleChange(dropdownKey, v);
              if (v !== 'custom') {
                handleChange(fieldKey, v);
                handleChange(customKey, '');
              } else {
                handleChange(fieldKey, fields[customKey] || '');
              }
            }}
            disabled={isReadOnly || isNA}
          >
            <option value="">Select</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            <option value="custom">Custom</option>
          </select>
          {dropdownVal === 'custom' && (
            <input
              className={`${inputCls} mt-2`}
              value={fields[customKey] || ''}
              onChange={e => {
                handleChange(customKey, e.target.value);
                handleChange(fieldKey, e.target.value);
              }}
              disabled={isReadOnly || isNA}
              placeholder={placeholder || 'Enter custom value...'}
            />
          )}
        </div>
        {naKey && (
          <label className="flex items-center gap-1.5 mt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNA}
              onChange={e => {
                handleChange(naKey, e.target.checked);
                if (e.target.checked) { handleChange(fieldKey, 'NA'); handleChange(dropdownKey, ''); }
              }}
              disabled={isReadOnly}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-500 font-medium">N/A</span>
          </label>
        )}
      </div>
    </Field>
  );
}

/** Auto-calculated field with Lock + Edit Switch */
function AutoCalcField({ label, fieldKey, fields, handleChange, isReadOnly, calcValue, hoverText }: {
  label: string | ReactNode; fieldKey: string; fields: any; handleChange: any; isReadOnly: boolean;
  calcValue: number | string; hoverText: string;
}) {
  const editOnKey = `${fieldKey}EditOn`;
  const isEditOn = fields[editOnKey] === true;
  const displayVal = isEditOn ? (fields[fieldKey] || '') : String(calcValue);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          className={`${inputCls} pr-20 ${!isEditOn ? 'bg-[#A7F3D0] font-bold text-emerald-800 cursor-not-allowed' : ''}`}
          value={displayVal}
          onChange={e => handleChange(fieldKey, e.target.value)}
          disabled={isReadOnly || !isEditOn}
          placeholder={isEditOn ? 'Enter value...' : ''}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2">
          {!isEditOn && (
            <div className="group cursor-help" title={hoverText}>
              <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              handleChange(editOnKey, !isEditOn);
              if (isEditOn) handleChange(fieldKey, '');
            }}
            disabled={isReadOnly}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEditOn ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow ${isEditOn ? 'translate-x-4.5' : 'translate-x-0.75'}`} />
          </button>
        </div>
      </div>
    </Field>
  );
}

/** Prefill field with Lock icon only (no edit switch) */
function PrefillField({ label, value, hoverText }: {
  label: string | ReactNode; value: string; hoverText: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          className={`${inputCls} pr-10 bg-[#A7F3D0] font-bold text-emerald-800 cursor-not-allowed`}
          value={value}
          disabled
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={hoverText}>
          <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
        </div>
      </div>
    </Field>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   BANK OF BARODA CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════ */

export const BANK_OF_BARODA_CONFIG: BankConfig = {
  bankId: 'BANK OF BARODA',
  subTemplateId: 'Standard',
  displayName: 'Bank of Baroda — Standard',
  hiddenSections: [
    'section-1', 'section-1a', 'section-2', 'section-3', 'section-4', 'section-5',
    'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10',
    'layout-config'
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  hideDefaultDeclarationAndCertificate: true,
  navSections: [
    { id: 'group-cover', scrollId: 'section-cover', title: '1. Title & Cover', indent: false },
    { id: 'section-cover', title: '↳ Cover Page Details', indent: true },
    
    { id: 'group-part1', scrollId: 'bob-section-general', title: '2. Property Details', indent: false },
    { id: 'bob-section-general', title: '↳ Part I — GENERAL', indent: true },
    { id: 'bob-section-characteristics', title: '↳ Part II — CHARACTERISTICS', indent: true },
    
    { id: 'group-valuation', scrollId: 'bob-section-land', title: '3. Valuation Parts', indent: false },
    { id: 'bob-section-land', title: '↳ Part A — Land Valuation', indent: true },
    { id: 'bob-section-building', title: '↳ Part B — Building Valuation', indent: true },
    { id: 'bob-section-valuation-details', title: '↳ Valuation & Amenities', indent: true },
    
    { id: 'group-abstract', scrollId: 'bob-section-abstract', title: '4. Final Assessment', indent: false },
    { id: 'bob-section-abstract', title: '↳ Total Abstract & Remarks', indent: true },
    
    { id: 'group-declaration', scrollId: 'bob-section-questionnaire', title: '5. Declarations & Compliance', indent: false },
    { id: 'bob-section-questionnaire', title: '↳ Declaration (Questionnaire)', indent: true },
    { id: 'bob-section-affirmations', title: '↳ Declaration (Affirmations)', indent: true },
    { id: 'bob-section-code-of-conduct', title: '↳ Code of Conduct', indent: true },
    
    { id: 'group-annexures', scrollId: 'section-11', title: '6. Annexures & Appendices', indent: false },
    { id: 'section-11', title: '↳ Property Photographs', indent: true },
    { id: 'section-12', title: '↳ Maps & Documents', indent: true },
    { id: 'annexures', title: '↳ Annexures', indent: true },
  ],
  fieldLabels: {
    'section-11-title': '11. PROPERTY PHOTOGRAPHS',
    'section-12-title': '12. MAPS & DOCUMENTS',
  },
  defaultValues: {
    // ── Section 1: Cover Page ──
    bobPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    bobAddressOfTheProperty: '',
    bobEnableCoverPageValueEdit: false,
    bobPresentMarketValue: '',
    bobRealizableValue: '',
    bobForcedSaleValue: '',
    bobGovtValue: '',
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
    // ── Section 2: Part I — GENERAL ──
    bobPurposeForValuation: '',
    bobDateOfInspection: '',
    bobDateOfValuationMade: '',
    bobDocumentI: '', bobDocumentINA: false,
    bobDocumentII: '', bobDocumentIINA: false,
    bobDocumentIII: '', bobDocumentIIINA: false,
    bobOwnerNamesAddresses: '',
    bobBriefDescriptionDropdown: '', bobBriefDescription: '',
    bobPlotNo: '', bobDoorNo: '', bobDoorNoNA: false,
    bobTSNoVillage: '', bobWardTaluka: '', bobMandalDistrict: '',
    bobPostalAddress: '',
    bobCityTown: '', bobCityTownNA: false,
    bobClassHighMiddlePoor: '', bobClassHighMiddlePoorNA: false,
    bobClassUrbanRural: '', bobClassUrbanRuralNA: false,
    bobCorporationLimit: '', bobCorporationLimitNA: false,
    bobCoveredUnderEnactments: '', bobCoveredUnderEnactmentsNA: false,
    bobAgriculturalConversion: '', bobAgriculturalConversionNA: false,
    bobBoundaries: { sketchEast: '', sketchWest: '', sketchNorth: '', sketchSouth: '', verifyEast: '', verifyWest: '', verifyNorth: '', verifySouth: '' },
    bobDimensions: { deedEast: '', deedWest: '', deedNorth: '', deedSouth: '', actualEast: '', actualWest: '', actualNorth: '', actualSouth: '' },
    bobLatLong: '',
    bobExtentOfSite: '',
    bobExtentForValuation: '', bobExtentForValuationEditOn: false,
    bobOccupancy: '', bobOccupancyDetails: '', bobOccupancyNA: false,
  } as any,
  extraSectionsStart: [
    /* ──────────────────────────────────────────────────────────────────────
       SECTION 1: COVER PAGE DETAILS
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const presentMarketValue = 0;
        const realizableValue = 0;
        const forcedSaleValue = 0;
        const govtValue = 0;

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
                  <div className="relative mt-1" title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "MARKET VALUE IN RS." (Row: OR SAY, Container 17)<<.' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.bobEnableCoverPageValueEdit ? 'text-emerald-800' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`}
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobPresentMarketValue || '') : presentMarketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      onChange={(e) => handleChange('bobPresentMarketValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.bobEnableCoverPageValueEdit}
                      title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "MARKET VALUE IN RS." (Row: OR SAY, Container 17)<<.' : undefined}
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from section 6, field "MARKET VALUE IN RS." (Row: OR SAY, Container 17)<<.'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">REALIZABLE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1" title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "REALIZABLE VALUE (95%)" (Row: OR SAY, Container 17)<<.' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.bobEnableCoverPageValueEdit ? 'text-emerald-800' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`}
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobRealizableValue || '') : realizableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      onChange={(e) => handleChange('bobRealizableValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.bobEnableCoverPageValueEdit}
                      title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "REALIZABLE VALUE (95%)" (Row: OR SAY, Container 17)<<.' : undefined}
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from section 6, field "REALIZABLE VALUE (95%)" (Row: OR SAY, Container 17)<<.'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">FORCED SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1" title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "DISTRESS VALUE (85%)" (Row: OR SAY, Container 17)<<.' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.bobEnableCoverPageValueEdit ? 'text-emerald-800' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`}
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobForcedSaleValue || '') : forcedSaleValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      onChange={(e) => handleChange('bobForcedSaleValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.bobEnableCoverPageValueEdit}
                      title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "DISTRESS VALUE (85%)" (Row: OR SAY, Container 17)<<.' : undefined}
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from section 6, field "DISTRESS VALUE (85%)" (Row: OR SAY, Container 17)<<.'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">GOVT. VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1" title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "GOVT. VALUE IN RS." (Row: OR SAY, Container 17)<<.' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.bobEnableCoverPageValueEdit ? 'text-emerald-800' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.bobEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`}
                      value={fields.bobEnableCoverPageValueEdit ? (fields.bobGovtValue || '') : govtValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      onChange={(e) => handleChange('bobGovtValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.bobEnableCoverPageValueEdit}
                      title={!fields.bobEnableCoverPageValueEdit ? '>>Prefill from section 6, field "GOVT. VALUE IN RS." (Row: OR SAY, Container 17)<<.' : undefined}
                    />
                    {!fields.bobEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='>>Prefill from section 6, field "GOVT. VALUE IN RS." (Row: OR SAY, Container 17)<<.'>
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
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 2: PART I — GENERAL  (Containers 1-5)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-general',
      title: 'Part I — GENERAL',
      number: 2,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const boundaries = fields.bobBoundaries || {};
        const dimensions = fields.bobDimensions || {};

        // Auto-calc: Extent for valuation = MIN(deed area, actual area)
        // Using simple average-based area estimate from dimensions
        const deedNS = parseFloat(dimensions.deedNorth || '0') || parseFloat(dimensions.deedSouth || '0') || 0;
        const deedEW = parseFloat(dimensions.deedEast || '0') || parseFloat(dimensions.deedWest || '0') || 0;
        const actualNS = parseFloat(dimensions.actualNorth || '0') || parseFloat(dimensions.actualSouth || '0') || 0;
        const actualEW = parseFloat(dimensions.actualEast || '0') || parseFloat(dimensions.actualWest || '0') || 0;
        const deedArea = deedNS * deedEW;
        const actualArea = actualNS * actualEW;
        const calcExtent = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea).toFixed(2) : (deedArea || actualArea || 0).toFixed(2);

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 1: Inspection Details ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6f2ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-blue-200 pb-2">Inspection Details</h3>
              <Field label="1. Purpose for which the valuation is made">
                <textarea
                  className={inputCls} rows={3}
                  value={fields.bobPurposeForValuation || ''}
                  onChange={e => handleChange('bobPurposeForValuation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Enter purpose of valuation..."
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseDateInput
                  label="2. a) Date of inspection"
                  value={fields.bobDateOfInspection || ''}
                  onChange={val => handleChange('bobDateOfInspection', val)}
                  disabled={isReadOnly}
                />
                <BaseDateInput
                  label="2. b) Date on which the valuation is made"
                  value={fields.bobDateOfValuationMade || ''}
                  onChange={val => handleChange('bobDateOfValuationMade', val)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">3. List of documents produced for perusal</span>
                {['I', 'II', 'III'].map((num) => {
                  const key = `bobDocument${num}`;
                  const naKey = `${key}NA`;
                  const isNA = fields[naKey] === true;
                  const dKey = `${key}Dropdown`;
                  return (
                    <div key={num} className="flex gap-2 items-center bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-sm text-gray-500 w-8 shrink-0">{num.toLowerCase()})</span>
                      <select
                        className={`${inputCls} flex-1`}
                        value={fields[dKey] || ''}
                        onChange={e => {
                          const v = e.target.value;
                          handleChange(dKey, v);
                          if (v !== 'custom') handleChange(key, v);
                          else handleChange(key, fields[`${key}Custom`] || '');
                        }}
                        disabled={isReadOnly || isNA}
                      >
                        <option value="">Select</option>
                        <option value="Sale Deed">Sale Deed</option>
                        <option value="Patta">Patta</option>
                        <option value="Road Agreement">Road Agreement</option>
                        <option value="Sketch Map">Sketch Map</option>
                        <option value="Approval Plan">Approval Plan</option>
                        <option value="custom">Custom</option>
                      </select>
                      {fields[dKey] === 'custom' && (
                        <input
                          className={`${inputCls} flex-1`}
                          value={fields[`${key}Custom`] || ''}
                          onChange={e => { handleChange(`${key}Custom`, e.target.value); handleChange(key, e.target.value); }}
                          disabled={isReadOnly || isNA}
                          placeholder="Enter document name..."
                        />
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                        <input type="checkbox" checked={isNA}
                          onChange={e => { handleChange(naKey, e.target.checked); if (e.target.checked) { handleChange(key, 'NA'); handleChange(dKey, ''); } }}
                          disabled={isReadOnly}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-500 font-medium">N/A</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Container 2: Ownership & Property Summary ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6ffe6' }}>
              <h3 className="font-bold text-gray-700 border-b border-green-200 pb-2">Ownership & Property Summary</h3>
              <Field label="4. Name of the owner(s) and his / their address(es) with Phone no. (details of share of each owner in case of joint ownership)">
                <textarea
                  className={inputCls} rows={3}
                  value={fields.bobOwnerNamesAddresses || ''}
                  onChange={e => handleChange('bobOwnerNamesAddresses', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Enter owner details, addresses, phone numbers..."
                />
              </Field>
              <DropdownWithTextarea
                label="5. Brief description of the property (Including leasehold / freehold etc)"
                fieldKey="bobBriefDescription"
                options={['Freehold', 'Leasehold']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                placeholder="Enter brief property description..."
              />
            </div>

            {/* ── Container 3: Location Details ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#ffffe6' }}>
              <h3 className="font-bold text-gray-700 border-b border-yellow-200 pb-2">Location Details</h3>
              <span className="text-sm font-medium text-gray-700">6. Location of property</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                <Field label="a) Plot No. / Survey No.">
                  <input className={inputCls} value={fields.bobPlotNo || ''} onChange={e => handleChange('bobPlotNo', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="b) Door No.">
                  <div className="flex gap-2 items-center">
                    <input className={`${inputCls} flex-1`} value={fields.bobDoorNo || ''} onChange={e => handleChange('bobDoorNo', e.target.value)} disabled={isReadOnly || fields.bobDoorNoNA} />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                      <input type="checkbox" checked={fields.bobDoorNoNA || false}
                        onChange={e => { handleChange('bobDoorNoNA', e.target.checked); if (e.target.checked) handleChange('bobDoorNo', 'NA'); }}
                        disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs text-gray-500 font-medium">N/A</span>
                    </label>
                  </div>
                </Field>
                <Field label="c) T. S. No. / Village">
                  <input className={inputCls} value={fields.bobTSNoVillage || ''} onChange={e => handleChange('bobTSNoVillage', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="d) Ward / Taluka">
                  <input className={inputCls} value={fields.bobWardTaluka || ''} onChange={e => handleChange('bobWardTaluka', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="e) Mandal / District">
                  <input className={inputCls} value={fields.bobMandalDistrict || ''} onChange={e => handleChange('bobMandalDistrict', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label="7. Postal address of the property">
                <textarea className={inputCls} rows={3} value={fields.bobPostalAddress || ''} onChange={e => handleChange('bobPostalAddress', e.target.value)} disabled={isReadOnly} placeholder="Enter postal address..." />
              </Field>
            </div>

            {/* ── Container 4: Area Classification & Jurisdiction ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#ffe6e6' }}>
              <h3 className="font-bold text-gray-700 border-b border-red-200 pb-2">Area Classification & Jurisdiction</h3>
              <DropdownWithCustom
                label="8. City / Town"
                fieldKey="bobCityTown"
                options={['Village', 'Residential Area', 'Commercial Area', 'Industrial Area']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="bobCityTownNA"
              />
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">9. Classification of the area</span>
                <div className="pl-4 space-y-3">
                  <DropdownWithCustom
                    label="i) High / Middle / Poor"
                    fieldKey="bobClassHighMiddlePoor"
                    options={['High', 'Middle', 'Poor']}
                    fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                    naKey="bobClassHighMiddlePoorNA"
                  />
                  <DropdownWithCustom
                    label="ii) Urban / Semi Urban / Rural"
                    fieldKey="bobClassUrbanRural"
                    options={['Urban', 'Semi Urban', 'Rural']}
                    fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                    naKey="bobClassUrbanRuralNA"
                  />
                </div>
              </div>
              <DropdownWithCustom
                label="10. Coming under Corporation limit / Village Panchayat / Municipality"
                fieldKey="bobCorporationLimit"
                options={['Corporation limit', 'Village Panchayat', 'Municipality']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="bobCorporationLimitNA"
              />
              <DropdownWithCustom
                label="11. Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area"
                fieldKey="bobCoveredUnderEnactments"
                options={['Yes', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="bobCoveredUnderEnactmentsNA"
              />
              <DropdownWithCustom
                label="12. In case it is an agricultural land, any conversion to house site plots is contemplated"
                fieldKey="bobAgriculturalConversion"
                options={['Yes', 'No', 'The Plot is already converted to Homestead']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="bobAgriculturalConversionNA"
              />
            </div>

            {/* ── Container 5: Boundaries, Dimensions & Extent ── */}
            <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: '#f2e6ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-purple-200 pb-2">Boundaries, Dimensions & Extent</h3>

              {/* Table: 13. Boundaries */}
              <div>
                <span className="text-sm font-medium text-gray-700">13. Boundaries of the property</span>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left w-24">Direction</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">As per Sketch Map</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">As per Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['East', 'West', 'North', 'South'].map(dir => (
                        <tr key={dir}>
                          <td className="border border-gray-300 px-3 py-2 font-medium bg-white">{dir}</td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls}
                              value={boundaries[`sketch${dir}`] || ''}
                              onChange={e => handleChange('bobBoundaries', { ...boundaries, [`sketch${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls}
                              value={boundaries[`verify${dir}`] || ''}
                              onChange={e => handleChange('bobBoundaries', { ...boundaries, [`verify${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table: 14.1 Dimensions */}
              <div>
                <span className="text-sm font-medium text-gray-700">14.1 Dimensions of the site</span>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left w-24">Direction</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">As per the Deed</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['East', 'West', 'North', 'South'].map(dir => (
                        <tr key={dir}>
                          <td className="border border-gray-300 px-3 py-2 font-medium bg-white">{dir}</td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls}
                              value={dimensions[`deed${dir}`] || ''}
                              onChange={e => handleChange('bobDimensions', { ...dimensions, [`deed${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls}
                              value={dimensions[`actual${dir}`] || ''}
                              onChange={e => handleChange('bobDimensions', { ...dimensions, [`actual${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Field label="14.2 Latitude, Longitude and Coordinates of the site">
                <input className={inputCls} value={fields.bobLatLong || ''} onChange={e => handleChange('bobLatLong', e.target.value)} disabled={isReadOnly} placeholder="e.g. 20.2961° N, 85.8245° E" />
              </Field>

              <Field label="15. Extent of the site">
                <input className={inputCls} value={fields.bobExtentOfSite || ''} onChange={e => handleChange('bobExtentOfSite', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2000 Sq.ft." />
              </Field>

              <AutoCalcField
                label="16. Extent of the site considered for valuation (least of 14 A & 14 B)"
                fieldKey="bobExtentForValuation"
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                calcValue={calcExtent}
                hoverText=">>Auto calculates from MIN([14.1 Actual Area], [14.1 As per the Deed Area])<<."
              />

              <div>
                <DropdownWithCustom
                  label="17. Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent Received per month."
                  fieldKey="bobOccupancy"
                  options={['Occupied by Owner', 'Occupied by Tenant', 'Vacant']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                  naKey="bobOccupancyNA"
                />
                {fields.bobOccupancyDropdown === 'Occupied by Tenant' && (
                  <div className="mt-2 pl-4">
                    <textarea className={inputCls} rows={2}
                      value={fields.bobOccupancyDetails || ''}
                      onChange={e => handleChange('bobOccupancyDetails', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Since how long? Rent received per month..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 3: PART II — CHARACTERISTICS OF THE SITE  (Containers 6-8)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-characteristics',
      title: 'Part II — CHARACTERISTICS OF THE SITE',
      number: 3,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 6: Site Environment & Approvals ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6fffa' }}>
              <h3 className="font-bold text-gray-700 border-b border-teal-200 pb-2">Site Environment & Approvals</h3>
              <DropdownWithCustom label="1. Classification of locality" fieldKey="bobClassificationOfLocality"
                options={['Developed', 'Developing', 'Underdeveloped']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="bobClassificationOfLocalityNA" />
              <DropdownWithTextarea label="2. Development of surrounding areas" fieldKey="bobDevelopmentOfSurrounding"
                options={['Developing with Residential buildings', 'Developing with Commercial buildings', 'Industrial Development']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} placeholder="Describe surrounding development..." />
              <DropdownWithCustom label="3. Possibility of frequent flooding / sub-merging" fieldKey="bobFloodingPossibility"
                options={['Yes', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="bobFloodingPossibilityNA" />
              <DropdownWithTextarea label="4. Feasibility to the Civic amenities like school, hospital, bus stop, market etc." fieldKey="bobCivicAmenities"
                options={['Available within 1 km', 'Available within 2-3 km', 'Not easily accessible']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} placeholder="Describe civic amenities..." />
              <DropdownWithInput label="5. Level of land with topographical Conditions" fieldKey="bobLevelOfLand"
                options={['Leveled and Plain', 'Sloping', 'Undulating']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="6. Shape of land" fieldKey="bobShapeOfLand"
                options={['Regular in Size', 'Irregular in Size']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="7. Type of use to which it can be put" fieldKey="bobTypeOfUse"
                options={['Residential Purpose', 'Commercial Purpose', 'Industrial Purpose', 'Agricultural']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="8. Any usage restriction" fieldKey="bobUsageRestriction"
                options={['None', 'Industrial', 'Commercial']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="bobUsageRestrictionNA" />
              <DropdownWithCustom label="9. Is plot in town planning approved layout?" fieldKey="bobTownPlanningApproved"
                options={['Yes', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="10. Corner plot or intermittent plot?" fieldKey="bobCornerOrIntermittent"
                options={['Corner Plot', 'Intermittent Plot']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
            </div>

            {/* ── Container 7: Infrastructure & Utilities ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fff0e6' }}>
              <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2">Infrastructure & Utilities</h3>
              <DropdownWithCustom label="11. Road facilities" fieldKey="bobRoadFacilities"
                options={['Yes Available at the site', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="12. Type of road available at present" fieldKey="bobTypeOfRoad"
                options={['Morrum Road', 'Concrete Road', 'Tar Road', 'Earthen Road']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="13. Width of road – is it below 20 ft. or more than 20 ft." fieldKey="bobWidthOfRoad"
                options={['Below 20 ft', '20 ft wide Road', 'More than 20 ft']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="14. Is it a land – locked land?" fieldKey="bobLandLocked"
                options={['Yes', 'No It is free land']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="15. Water potentiality" fieldKey="bobWaterPotentiality"
                options={['Good', 'Average', 'Poor']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="16. Underground sewerage system" fieldKey="bobSewerage"
                options={['Yes Available at the site', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="17. Is power supply available at the site?" fieldKey="bobPowerSupply"
                options={['Yes Available at the site', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
            </div>

            {/* ── Container 8: Remarks ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f9e6ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-purple-200 pb-2">Remarks</h3>
              <Field label="18. Advantage of the site">
                <textarea className={inputCls} rows={3} value={fields.bobAdvantageOfSite || ''} onChange={e => handleChange('bobAdvantageOfSite', e.target.value)} disabled={isReadOnly} placeholder="Describe advantages..." />
              </Field>
              <Field label="19. Special remarks, if any, like threat of acquisition of land for public service purposes, road widening or applicability of CRZ provisions etc. (Distance from sea-coast / tidal level must be incorporated)">
                <div className="flex gap-2 items-start">
                  <textarea className={`${inputCls} flex-1`} rows={3} value={fields.bobSpecialRemarks || ''} onChange={e => handleChange('bobSpecialRemarks', e.target.value)}
                    disabled={isReadOnly || fields.bobSpecialRemarksNA} placeholder="Enter special remarks..." />
                  <label className="flex items-center gap-1.5 mt-2 cursor-pointer select-none shrink-0">
                    <input type="checkbox" checked={fields.bobSpecialRemarksNA || false}
                      onChange={e => { handleChange('bobSpecialRemarksNA', e.target.checked); if (e.target.checked) handleChange('bobSpecialRemarks', 'NA'); }}
                      disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-xs text-gray-500 font-medium">N/A</span>
                  </label>
                </div>
              </Field>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 4: PART A — VALUATION OF LAND  (Container 9)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-land',
      title: 'Part A — Valuation of Land',
      number: 4,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const sizeNS = parseFloat(fields.bobLandSizeNS || '0') || 0;
        const sizeEW = parseFloat(fields.bobLandSizeEW || '0') || 0;
        const calcTotalExtent = (sizeNS > 0 && sizeEW > 0) ? (sizeNS * sizeEW).toFixed(2) : '0.00';
        const totalExtent = fields.bobLandTotalExtentEditOn ? parseFloat(fields.bobLandTotalExtent || '0') : parseFloat(calcTotalExtent);
        const adoptedRate = parseFloat(fields.bobAdoptedRate || '0') || 0;
        const calcEstimatedValue = (totalExtent * adoptedRate).toFixed(2);

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6ebff' }}>
              <h3 className="font-bold text-gray-700 border-b border-indigo-200 pb-2">Land Valuation Metrics</h3>
              <div>
                <span className="text-sm font-medium text-gray-700">1. Size of plot</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pl-4">
                  <Field label="North & South">
                    <input className={inputCls} value={fields.bobLandSizeNS || ''} onChange={e => handleChange('bobLandSizeNS', e.target.value)} disabled={isReadOnly} placeholder="e.g. 50 ft" />
                  </Field>
                  <Field label="East & West">
                    <input className={inputCls} value={fields.bobLandSizeEW || ''} onChange={e => handleChange('bobLandSizeEW', e.target.value)} disabled={isReadOnly} placeholder="e.g. 40 ft" />
                  </Field>
                </div>
              </div>
              <AutoCalcField
                label="2. Total extent of the plot"
                fieldKey="bobLandTotalExtent"
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                calcValue={calcTotalExtent}
                hoverText=">>Auto calculates from [North & South] * [East & West]<<."
              />
              <Field label="3. Prevailing market rate (Along with details /reference of at least two latest deals/ transactions with respect to adjacent properties in the areas)">
                <textarea className={inputCls} rows={3} value={fields.bobPrevailingMarketRate || ''} onChange={e => handleChange('bobPrevailingMarketRate', e.target.value)} disabled={isReadOnly} placeholder="Enter market rate details with references..." />
              </Field>
              <Field label="4. Guideline rate obtained from the Registrar's Office (an evidence thereof to be enclosed)">
                <textarea className={inputCls} rows={3} value={fields.bobGuidelineRate || ''} onChange={e => handleChange('bobGuidelineRate', e.target.value)} disabled={isReadOnly} placeholder="Enter guideline rate details..." />
              </Field>
              <Field label="5. Assessed / adopted rate of valuation">
                <input className={inputCls} type="number" step="0.01" value={fields.bobAdoptedRate || ''} onChange={e => handleChange('bobAdoptedRate', e.target.value)} disabled={isReadOnly} placeholder="e.g. 500" />
              </Field>
              <AutoCalcField
                label="6. Estimated value of land"
                fieldKey="bobEstimatedLandValue"
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                calcValue={calcEstimatedValue}
                hoverText=">>Auto calculates from [Total extent of the plot] * [Assessed / adopted rate of valuation]<<."
              />
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 5: PART B — VALUATION OF BUILDING  (Containers 10-12)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-building',
      title: 'Part B — Valuation of Building',
      number: 5,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const currentYear = new Date().getFullYear();
        const yearOfConstruction = parseInt(fields.bobYearOfConstruction || '0') || 0;
        const calcAge = yearOfConstruction > 0 ? (currentYear - yearOfConstruction) : 0;

        const structuralRows = [
          { label: '1. Foundation', key: 'foundation', options: ['Column Foundation', 'Load Bearing Foundation'] },
          { label: '2. Basement', key: 'basement', options: ['Yes', 'No'] },
          { label: '3. Superstructure', key: 'superstructure', options: ['Brick Masonary Super Structure'] },
          { label: '4. Joinery / Doors & Windows', key: 'joinery', options: [], isTextarea: true },
          { label: '5. RCC works', key: 'rccWorks', options: ['Lintel Chajja Beam'] },
          { label: '6. Plastering', key: 'plastering', options: ['Cement Plastering'] },
          { label: '7. Flooring, Skirting, dadoing', key: 'flooring', options: ['VT Flooring', 'Marble Flooring', 'Tiles Flooring'] },
          { label: '8. Special finish as marble, granite, wooden paneling, grills, etc', key: 'specialFinish', options: ['Yes', 'No'], hasInput: true },
          { label: '9. Roofing including weather proof course', key: 'roofing', options: ['RCC Roof', 'Asbestos Roof'] },
          { label: '10. Drainage', key: 'drainage', options: ['Surface Drainage', 'Underground Drainage'] },
        ];

        const structural = fields.bobStructuralDetails || {};
        const updateStructural = (key: string, col: string, val: string) => {
          handleChange('bobStructuralDetails', { ...structural, [`${key}_${col}`]: val });
        };

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 10: Technical Details ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f0ffe6' }}>
              <h3 className="font-bold text-gray-700 border-b border-green-200 pb-2">Technical Details of the Building</h3>
              <span className="text-sm font-medium text-gray-700">1. Technical details of the building</span>
              <div className="pl-4 space-y-3">
                <DropdownWithCustom label="a) Type of Building" fieldKey="bobBuildingType"
                  options={['Residential Building', 'Commercial Building', 'Industrial Building']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                <DropdownWithCustom label="b) Type of construction" fieldKey="bobConstructionType"
                  options={['Load bearing', 'RCC Frame', 'Steel Framed']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                <Field label="c) Year of construction">
                  <input className={inputCls} type="number" value={fields.bobYearOfConstruction || ''} onChange={e => handleChange('bobYearOfConstruction', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2010" />
                </Field>
                <Field label="d) Number of floors and height of each floor including basement, if any">
                  <textarea className={inputCls} rows={2} value={fields.bobFloorsDescription || ''} onChange={e => handleChange('bobFloorsDescription', e.target.value)} disabled={isReadOnly} placeholder="e.g. G+1, Ground floor height 10ft, First floor height 10ft" />
                </Field>
                <Field label="e) Plinth area floor-wise">
                  <textarea className={inputCls} rows={2} value={fields.bobPlinthArea || ''} onChange={e => handleChange('bobPlinthArea', e.target.value)} disabled={isReadOnly} placeholder="e.g. Ground floor: 800 sqft, First floor: 750 sqft" />
                </Field>
                <div>
                  <span className="text-sm font-medium text-gray-700">f) Condition of the building</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pl-4">
                    <DropdownWithCustom label="i) Exterior" fieldKey="bobConditionExterior"
                      options={['Excellent', 'Good', 'Normal', 'Poor']}
                      fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                    <DropdownWithCustom label="ii) Interior" fieldKey="bobConditionInterior"
                      options={['Excellent', 'Good', 'Normal', 'Poor']}
                      fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                  </div>
                </div>
                <Field label="g) Date of issue and validity of layout of approved map / plan">
                  <div className="flex gap-2 items-center">
                    <input className={`${inputCls} flex-1`} value={fields.bobApprovedMapDate || ''} onChange={e => handleChange('bobApprovedMapDate', e.target.value)} disabled={isReadOnly || fields.bobApprovedMapDateNA} />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                      <input type="checkbox" checked={fields.bobApprovedMapDateNA || false}
                        onChange={e => { handleChange('bobApprovedMapDateNA', e.target.checked); if (e.target.checked) handleChange('bobApprovedMapDate', 'NA'); }}
                        disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs text-gray-500 font-medium">N/A</span>
                    </label>
                  </div>
                </Field>
                <Field label="h) Approved map / plan issuing authority">
                  <div className="flex gap-2 items-center">
                    <input className={`${inputCls} flex-1`} value={fields.bobApprovedMapAuthority || ''} onChange={e => handleChange('bobApprovedMapAuthority', e.target.value)} disabled={isReadOnly || fields.bobApprovedMapAuthorityNA} />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                      <input type="checkbox" checked={fields.bobApprovedMapAuthorityNA || false}
                        onChange={e => { handleChange('bobApprovedMapAuthorityNA', e.target.checked); if (e.target.checked) handleChange('bobApprovedMapAuthority', 'NA'); }}
                        disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs text-gray-500 font-medium">N/A</span>
                    </label>
                  </div>
                </Field>
                <DropdownWithCustom label="i) Whether genuineness or authenticity of approved map / plan is verified" fieldKey="bobApprovedMapVerified"
                  options={['Yes Verified', 'No']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="bobApprovedMapVerifiedNA" />
                <Field label="j) Any other comments by our empanelled valuers on authentic of approved plan">
                  <div className="flex gap-2 items-start">
                    <textarea className={`${inputCls} flex-1`} rows={2} value={fields.bobApprovedMapComments || ''} onChange={e => handleChange('bobApprovedMapComments', e.target.value)}
                      disabled={isReadOnly || fields.bobApprovedMapCommentsNA} placeholder="Enter comments..." />
                    <label className="flex items-center gap-1.5 mt-2 cursor-pointer select-none shrink-0">
                      <input type="checkbox" checked={fields.bobApprovedMapCommentsNA || false}
                        onChange={e => { handleChange('bobApprovedMapCommentsNA', e.target.checked); if (e.target.checked) handleChange('bobApprovedMapComments', 'NA'); }}
                        disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs text-gray-500 font-medium">N/A</span>
                    </label>
                  </div>
                </Field>
                <AutoCalcField
                  label="k) Age of the Building"
                  fieldKey="bobBuildingAge"
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                  calcValue={calcAge > 0 ? `${calcAge} years` : '0'}
                  hoverText={`>>Auto calculates from [Current Year (${currentYear})] - [Year of construction]<<.`}
                />
                <Field label="l) Residual life of the building">
                  <input className={inputCls} value={fields.bobResidualLife || ''} onChange={e => handleChange('bobResidualLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 40 years" />
                </Field>
              </div>
            </div>

            {/* ── Container 11: Structural Descriptions ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#ffe6f0' }}>
              <h3 className="font-bold text-gray-700 border-b border-pink-200 pb-2">Structural Descriptions</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left w-[40%]">Description</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[30%]">Ground Floor</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[30%]">
                        <div className="flex items-center gap-2">
                          <span>Other Floors</span>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input type="checkbox" checked={fields.bobOtherFloorsNA || false}
                              onChange={e => handleChange('bobOtherFloorsNA', e.target.checked)}
                              disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-xs text-gray-500 font-medium">N/A</span>
                          </label>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuralRows.map(row => (
                      <tr key={row.key}>
                        <td className="border border-gray-300 px-3 py-2 font-medium bg-white text-xs">{row.label}</td>
                        <td className="border border-gray-300 px-1 py-1">
                          {row.isTextarea ? (
                            <textarea className={inputCls} rows={2}
                              value={structural[`${row.key}_ground`] || ''}
                              onChange={e => updateStructural(row.key, 'ground', e.target.value)}
                              disabled={isReadOnly} placeholder="Enter details..." />
                          ) : row.options.length > 0 ? (
                            <div>
                              <select className={inputCls}
                                value={structural[`${row.key}_groundDropdown`] || ''}
                                onChange={e => {
                                  const v = e.target.value;
                                  updateStructural(row.key, 'groundDropdown', v);
                                  if (v !== 'custom') updateStructural(row.key, 'ground', v);
                                }}
                                disabled={isReadOnly}>
                                <option value="">Select</option>
                                {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="custom">Custom</option>
                              </select>
                              {structural[`${row.key}_groundDropdown`] === 'custom' && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_groundCustom`] || ''}
                                  onChange={e => { updateStructural(row.key, 'groundCustom', e.target.value); updateStructural(row.key, 'ground', e.target.value); }}
                                  disabled={isReadOnly} placeholder="Custom..." />
                              )}
                              {row.hasInput && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_groundInput`] || ''}
                                  onChange={e => updateStructural(row.key, 'groundInput', e.target.value)}
                                  disabled={isReadOnly} placeholder="Details..." />
                              )}
                            </div>
                          ) : (
                            <input className={inputCls}
                              value={structural[`${row.key}_ground`] || ''}
                              onChange={e => updateStructural(row.key, 'ground', e.target.value)}
                              disabled={isReadOnly} />
                          )}
                        </td>
                        <td className="border border-gray-300 px-1 py-1">
                          {row.isTextarea ? (
                            <textarea className={inputCls} rows={2}
                              value={structural[`${row.key}_other`] || ''}
                              onChange={e => updateStructural(row.key, 'other', e.target.value)}
                              disabled={isReadOnly || fields.bobOtherFloorsNA} placeholder="Enter details..." />
                          ) : row.options.length > 0 ? (
                            <div>
                              <select className={inputCls}
                                value={structural[`${row.key}_otherDropdown`] || ''}
                                onChange={e => {
                                  const v = e.target.value;
                                  updateStructural(row.key, 'otherDropdown', v);
                                  if (v !== 'custom') updateStructural(row.key, 'other', v);
                                }}
                                disabled={isReadOnly || fields.bobOtherFloorsNA}>
                                <option value="">Select</option>
                                {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="custom">Custom</option>
                              </select>
                              {structural[`${row.key}_otherDropdown`] === 'custom' && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_otherCustom`] || ''}
                                  onChange={e => { updateStructural(row.key, 'otherCustom', e.target.value); updateStructural(row.key, 'other', e.target.value); }}
                                  disabled={isReadOnly || fields.bobOtherFloorsNA} placeholder="Custom..." />
                              )}
                              {row.hasInput && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_otherInput`] || ''}
                                  onChange={e => updateStructural(row.key, 'otherInput', e.target.value)}
                                  disabled={isReadOnly || fields.bobOtherFloorsNA} placeholder="Details..." />
                              )}
                            </div>
                          ) : (
                            <input className={inputCls}
                              value={structural[`${row.key}_other`] || ''}
                              onChange={e => updateStructural(row.key, 'other', e.target.value)}
                              disabled={isReadOnly || fields.bobOtherFloorsNA} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Container 12: Floor-wise Construction Specifications ── */}
            <div className="rounded-xl p-5 space-y-5" style={{ backgroundColor: '#e6ffff' }}>
              <h3 className="font-bold text-gray-700 border-b border-cyan-200 pb-2">Floor-wise Construction Specifications</h3>

              {/* 1. Compound wall */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 space-y-3">
                <DropdownWithCustom label="1. Compound wall" fieldKey="bobCompoundWall"
                  options={['Yes', 'No']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                {(fields.bobCompoundWallDropdown === 'Yes' || fields.bobCompoundWall === 'Yes') && (
                  <div className="pl-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field label="Height">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} value={fields.bobCompoundWallHeight || ''} onChange={e => handleChange('bobCompoundWallHeight', e.target.value)} disabled={isReadOnly || fields.bobCompoundWallHeightNA} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields.bobCompoundWallHeightNA || false} onChange={e => { handleChange('bobCompoundWallHeightNA', e.target.checked); if (e.target.checked) handleChange('bobCompoundWallHeight', 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-xs text-gray-500">N/A</span>
                        </label>
                      </div>
                    </Field>
                    <Field label="Length">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} value={fields.bobCompoundWallLength || ''} onChange={e => handleChange('bobCompoundWallLength', e.target.value)} disabled={isReadOnly || fields.bobCompoundWallLengthNA} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields.bobCompoundWallLengthNA || false} onChange={e => { handleChange('bobCompoundWallLengthNA', e.target.checked); if (e.target.checked) handleChange('bobCompoundWallLength', 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-xs text-gray-500">N/A</span>
                        </label>
                      </div>
                    </Field>
                    <Field label="Type of construction">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} value={fields.bobCompoundWallType || ''} onChange={e => handleChange('bobCompoundWallType', e.target.value)} disabled={isReadOnly || fields.bobCompoundWallTypeNA} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields.bobCompoundWallTypeNA || false} onChange={e => { handleChange('bobCompoundWallTypeNA', e.target.checked); if (e.target.checked) handleChange('bobCompoundWallType', 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-xs text-gray-500">N/A</span>
                        </label>
                      </div>
                    </Field>
                  </div>
                )}
              </div>

              {/* 2. Electrical installation */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 space-y-3">
                <span className="text-sm font-bold text-gray-700">2. Electrical installation</span>
                <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Type of wiring', key: 'bobElectricalWiring', options: ['Concealed', 'Open'] },
                    { label: 'Class of fittings', key: 'bobElectricalFittings', options: ['Superior', 'Ordinary', 'Poor'] },
                  ].map(item => (
                    <DropdownWithCustom key={item.key} label={item.label} fieldKey={item.key}
                      options={item.options}
                      fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey={`${item.key}NA`} />
                  ))}
                  {[
                    { label: 'Number of light points', key: 'bobElectricalLightPoints', type: 'number' },
                    { label: 'Fan points', key: 'bobElectricalFanPoints', type: 'number' },
                    { label: 'Spare plug points', key: 'bobElectricalPlugPoints', type: 'number' },
                    { label: 'Any other item', key: 'bobElectricalOther', type: 'text' },
                  ].map(item => (
                    <Field key={item.key} label={item.label}>
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} type={item.type} value={fields[item.key] || ''} onChange={e => handleChange(item.key, e.target.value)} disabled={isReadOnly || fields[`${item.key}NA`]} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields[`${item.key}NA`] || false} onChange={e => { handleChange(`${item.key}NA`, e.target.checked); if (e.target.checked) handleChange(item.key, 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-xs text-gray-500">N/A</span>
                        </label>
                      </div>
                    </Field>
                  ))}
                </div>
              </div>

              {/* 3. Plumbing installation */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 space-y-3">
                <DropdownWithCustom label="3. Plumbing installation" fieldKey="bobPlumbing"
                  options={['Yes', 'No']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                {(fields.bobPlumbingDropdown === 'Yes' || fields.bobPlumbing === 'Yes') && (
                  <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'a) No. of water closets and their type', key: 'bobWaterClosets', type: 'text' },
                      { label: 'b) No. of wash basins', key: 'bobWashBasins', type: 'number' },
                      { label: 'c) No. of urinals', key: 'bobUrinals', type: 'number' },
                      { label: 'd) No. of bath tubs', key: 'bobBathTubs', type: 'number' },
                      { label: 'e) Water meter, taps, etc.', key: 'bobWaterMeterTaps', type: 'text' },
                      { label: 'f) Any other fixtures', key: 'bobOtherFixtures', type: 'text' },
                    ].map(item => (
                      <Field key={item.key} label={item.label}>
                        <div className="flex gap-2 items-center">
                          <input className={`${inputCls} flex-1`} type={item.type} value={fields[item.key] || ''} onChange={e => handleChange(item.key, e.target.value)} disabled={isReadOnly || fields[`${item.key}NA`]} />
                          <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                            <input type="checkbox" checked={fields[`${item.key}NA`] || false} onChange={e => { handleChange(`${item.key}NA`, e.target.checked); if (e.target.checked) handleChange(item.key, 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                            <span className="text-xs text-gray-500">N/A</span>
                          </label>
                        </div>
                      </Field>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 6: DETAILS OF VALUATION & AMENITIES (Containers 13-16)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-valuation-details',
      title: 'Details of Valuation & Amenities',
      number: 6,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // ── Container 13: Building Valuation (Dynamic rows) ──
        const buildingRows: any[] = fields.bobBuildingValuationRows || [{ particulars: '', particularsDropdown: '', plinthArea: '', roofHeight: '', replacementRate: '' }];
        const currentYear = new Date().getFullYear();
        const yearOfConstruction = parseInt(fields.bobYearOfConstruction || '0') || 0;
        const buildingAge = fields.bobBuildingAgeEditOn ? (parseFloat(fields.bobBuildingAge || '0') || 0) : (yearOfConstruction > 0 ? currentYear - yearOfConstruction : 0);

        const getRowCalcs = (row: any) => {
          const plinth = parseFloat(row.plinthArea || '0') || 0;
          const rate = parseFloat(row.replacementRate || '0') || 0;
          const estCost = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : plinth * rate;
          const depreciation = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : estCost * 0.01 * buildingAge;
          const netValue = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : estCost - depreciation;
          return { estCost, depreciation, netValue, age: buildingAge };
        };

        const calcBuildingTotal = buildingRows.reduce((sum, row) => sum + getRowCalcs(row).netValue, 0);

        // ── Container 14-16: Fixed tables ──
        const amenityItems = ['Wardrobes & Cupboard', 'Modular Kitchen', 'Extra sinks and bath tub', 'Marble / Ceramic tiles flooring', 'Interior decorations', 'Architectural elevation works', 'Paneling works', 'Aluminium works', 'Aluminium hand rails', 'False ceiling'];
        const miscItems = ['Separate toilet room', 'Separate lumber room', 'Separate water tank/ sump', 'Trees , gardening'];
        const serviceItems = ['Bore Well with Motor', 'Head Room, Parapet Wall, Grinding', 'Compound Wall', 'Marble Flooring in staircase & Steel Handrail', 'Add extra cost for 2 nos of Lifts with installation charges in LS'];

        const getTableTotal = (prefix: string, items: string[]) => items.reduce((sum, _, idx) => sum + (parseFloat(fields[`${prefix}${idx}`] || '0') || 0), 0);
        const amenitiesTotal = getTableTotal('bobAmenity_', amenityItems);
        const miscTotal = getTableTotal('bobMisc_', miscItems);
        const servicesTotal = getTableTotal('bobService_', serviceItems);

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 13: Building Valuation Table ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fdf5e6' }}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2 flex-1">Building Valuation Table</h3>
                <button type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                  onClick={() => handleChange('bobBuildingValuationRows', [...buildingRows, { particulars: '', particularsDropdown: '', plinthArea: '', roofHeight: '', replacementRate: '' }])}
                  disabled={isReadOnly}>
                  + Add Row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 w-[16%]">PARTICULARS</th>
                      <th className="border border-gray-300 px-2 py-2 w-[10%]">PLINTH AREA (SQFT)</th>
                      <th className="border border-gray-300 px-2 py-2 w-[8%]">ROOF HEIGHT</th>
                      <th className="border border-gray-300 px-2 py-2 w-[8%]" title=">>Prefill from section 5, field 'Age of the Building'<<.">AGE (YRS) <span title=">>Prefill from section 5, field 'Age of the Building'<<.">🔒</span></th>
                      <th className="border border-gray-300 px-2 py-2 w-[10%]">REPLACEMENT RATE</th>
                      <th className="border border-gray-300 px-2 py-2 w-[13%]" title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<.">EST. COST <span title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<.">🔒🎚️</span></th>
                      <th className="border border-gray-300 px-2 py-2 w-[13%]" title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<.">DEPRECIATION <span title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<.">🔒🎚️</span></th>
                      <th className="border border-gray-300 px-2 py-2 w-[13%]" title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<.">NET VALUE <span title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<.">🔒🎚️</span></th>
                      <th className="border border-gray-300 px-2 py-2 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingRows.map((row: any, idx: number) => {
                      const calcs = getRowCalcs(row);
                      const updateRow = (key: string, val: any) => {
                        const rows = [...buildingRows];
                        rows[idx] = { ...rows[idx], [key]: val };
                        handleChange('bobBuildingValuationRows', rows);
                      };
                      return (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-1 py-1">
                            {row.particularsDropdown === 'Custom' ? (
                              <div className="flex flex-col gap-1">
                                <select className={inputCls} value="Custom" onChange={() => { }} disabled={isReadOnly}>
                                  <option value="Custom">Custom</option>
                                </select>
                                <input className={inputCls} placeholder="Enter custom value" value={row.particulars || ''} onChange={e => updateRow('particulars', e.target.value)} disabled={isReadOnly} />
                              </div>
                            ) : (
                              <select className={inputCls} value={row.particularsDropdown || ''}
                                onChange={e => {
                                  updateRow('particularsDropdown', e.target.value);
                                  updateRow('particulars', e.target.value === 'Custom' ? '' : e.target.value);
                                }} disabled={isReadOnly}>
                                <option value="">Select</option>
                                <option value="Ground Floor">Ground Floor</option>
                                <option value="First Floor">First Floor</option>
                                <option value="Second Floor">Second Floor</option>
                                <option value="Third Floor">Third Floor</option>
                                <option value="Custom">Custom</option>
                              </select>
                            )}
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls} type="number" step="0.01" value={row.plinthArea || ''}
                              onChange={e => updateRow('plinthArea', e.target.value)} disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls} type="text" value={row.roofHeight || ''}
                              onChange={e => updateRow('roofHeight', e.target.value)} disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <div className="relative group">
                              <input className={`${inputCls} bg-[#A7F3D0] font-bold text-emerald-800 cursor-not-allowed pr-6`}
                                value={calcs.age} disabled title=">>Prefill from section 5, field 'Age of the Building'<<." />
                              <Lock className="w-3 h-3 text-emerald-800 absolute right-2 top-1/2 -translate-y-1/2" />
                            </div>
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls} type="number" step="0.01" value={row.replacementRate || ''}
                              onChange={e => updateRow('replacementRate', e.target.value)} disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <div className="relative" title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<.">
                              <input className={`${inputCls} pr-14 ${!row.estCostEditOn ? 'bg-[#A7F3D0] font-bold text-emerald-800' : ''}`}
                                value={row.estCostEditOn ? (row.estCost || '') : calcs.estCost.toFixed(2)}
                                onChange={e => updateRow('estCost', e.target.value)}
                                readOnly={isReadOnly || !row.estCostEditOn}
                                title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<." />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5" title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<.">
                                {!row.estCostEditOn && <Lock className="w-3 h-3 text-emerald-800" />}
                                <button type="button" onClick={() => updateRow('estCostEditOn', !row.estCostEditOn)} disabled={isReadOnly}
                                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${row.estCostEditOn ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                  title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<.">
                                  <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ${row.estCostEditOn ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <div className="relative" title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<.">
                              <input className={`${inputCls} pr-14 ${!row.depreciationEditOn ? 'bg-[#A7F3D0] font-bold text-emerald-800' : ''}`}
                                value={row.depreciationEditOn ? (row.depreciation || '') : calcs.depreciation.toFixed(2)}
                                onChange={e => updateRow('depreciation', e.target.value)}
                                readOnly={isReadOnly || !row.depreciationEditOn}
                                title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<." />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5" title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<.">
                                {!row.depreciationEditOn && <Lock className="w-3 h-3 text-emerald-800" />}
                                <button type="button" onClick={() => updateRow('depreciationEditOn', !row.depreciationEditOn)} disabled={isReadOnly}
                                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${row.depreciationEditOn ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                  title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<.">
                                  <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ${row.depreciationEditOn ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <div className="relative" title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<.">
                              <input className={`${inputCls} pr-14 ${!row.netValueEditOn ? 'bg-[#A7F3D0] font-bold text-emerald-800' : ''}`}
                                value={row.netValueEditOn ? (row.netValue || '') : calcs.netValue.toFixed(2)}
                                onChange={e => updateRow('netValue', e.target.value)}
                                readOnly={isReadOnly || !row.netValueEditOn}
                                title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<." />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5" title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<.">
                                {!row.netValueEditOn && <Lock className="w-3 h-3 text-emerald-800" />}
                                <button type="button" onClick={() => updateRow('netValueEditOn', !row.netValueEditOn)} disabled={isReadOnly}
                                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${row.netValueEditOn ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                  title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<.">
                                  <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ${row.netValueEditOn ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-1 py-1 text-center">
                            {buildingRows.length > 1 && (
                              <button type="button" onClick={() => { const r = [...buildingRows]; r.splice(idx, 1); handleChange('bobBuildingValuationRows', r); }}
                                disabled={isReadOnly} className="text-red-500 hover:text-red-700 text-lg font-bold">×</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={7} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <AutoCalcField label="" fieldKey="bobBuildingValuationTotal" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                          calcValue={calcBuildingTotal.toFixed(2)}
                          hoverText=">>Auto calculates from SUM([NET VALUE AFTER DEPRECIATION] of all rows)<<." />
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Container 14: Part D - Amenities ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f0f8ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-blue-200 pb-2">Part D — Amenities</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left w-12">SL NO.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">ITEM</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amenityItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{item}</td>
                        <td className="border border-gray-300 px-1 py-1">
                          <input className={inputCls} type="number" step="0.01" value={fields[`bobAmenity_${idx}`] || ''} onChange={e => handleChange(`bobAmenity_${idx}`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <AutoCalcField label="" fieldKey="bobAmenitiesTotalOverride" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                          calcValue={amenitiesTotal.toFixed(2)}
                          hoverText=">>Auto calculates from SUM([AMOUNT] of all Amenities rows)<<." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Container 15: Part E - Miscellaneous ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f5fffa' }}>
              <h3 className="font-bold text-gray-700 border-b border-green-200 pb-2">Part E — Miscellaneous</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left w-12">SL NO.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">ITEM</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {miscItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{item}</td>
                        <td className="border border-gray-300 px-1 py-1">
                          <input className={inputCls} type="number" step="0.01" value={fields[`bobMisc_${idx}`] || ''} onChange={e => handleChange(`bobMisc_${idx}`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <AutoCalcField label="" fieldKey="bobMiscTotalOverride" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                          calcValue={miscTotal.toFixed(2)}
                          hoverText=">>Auto calculates from SUM([AMOUNT] of all Miscellaneous rows)<<." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Container 16: Part F - Services ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fff5ee' }}>
              <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2">Part F — Services</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left w-12">SL NO.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">ITEM</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-40">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{item}</td>
                        <td className="border border-gray-300 px-1 py-1">
                          <input className={inputCls} type="number" step="0.01" value={fields[`bobService_${idx}`] || ''} onChange={e => handleChange(`bobService_${idx}`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <AutoCalcField label="" fieldKey="bobServicesTotalOverride" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                          calcValue={servicesTotal.toFixed(2)}
                          hoverText=">>Auto calculates from SUM([AMOUNT] of all Services rows)<<." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 7: TOTAL ABSTRACT & REMARKS (Containers 17-18)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-abstract',
      title: 'TOTAL ABSTRACT & REMARKS',
      number: 7,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Prefills from other sections
        const landMarketValue = fields.bobEstimatedLandValueEditOn ? parseFloat(fields.bobEstimatedLandValue || '0') : (() => {
          const sizeNS = parseFloat(fields.bobLandSizeNS || '0') || 0;
          const sizeEW = parseFloat(fields.bobLandSizeEW || '0') || 0;
          const totalExtent = fields.bobLandTotalExtentEditOn ? parseFloat(fields.bobLandTotalExtent || '0') : sizeNS * sizeEW;
          return totalExtent * (parseFloat(fields.bobAdoptedRate || '0') || 0);
        })();

        const buildingRows: any[] = fields.bobBuildingValuationRows || [];
        const currentYear = new Date().getFullYear();
        const yearOfConst = parseInt(fields.bobYearOfConstruction || '0') || 0;
        const bAge = fields.bobBuildingAgeEditOn ? (parseFloat(fields.bobBuildingAge || '0') || 0) : (yearOfConst > 0 ? currentYear - yearOfConst : 0);
        const buildingMarketValue = buildingRows.reduce((sum: number, row: any) => {
          const p = parseFloat(row.plinthArea || '0') || 0;
          const r = parseFloat(row.replacementRate || '0') || 0;
          const est = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : p * r;
          const dep = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : est * 0.01 * bAge;
          const net = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : est - dep;
          return sum + net;
        }, 0);

        const amenityItems = 10;
        const amenitiesMarketValue = Array.from({ length: amenityItems }, (_, i) => parseFloat(fields[`bobAmenity_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);
        const miscMarketValue = Array.from({ length: 4 }, (_, i) => parseFloat(fields[`bobMisc_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);
        const servicesMarketValue = Array.from({ length: 5 }, (_, i) => parseFloat(fields[`bobService_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);

        const abstractRows = [
          { label: 'LAND', key: 'land', prefillMarket: landMarketValue, prefillHover: '>>Prefill from section 4, field "Estimated value of land"<<.' },
          { label: 'BUILDING', key: 'building', prefillMarket: buildingMarketValue, prefillHover: '>>Prefill from section 6, field "TOTAL" (Container 13)<<.' },
          { label: 'EXTRA ITEMS', key: 'extraItems', prefillMarket: null, prefillHover: '' },
          { label: 'AMENITIES', key: 'amenities', prefillMarket: amenitiesMarketValue, prefillHover: '>>Prefill from section 6, field "TOTAL" (Part D)<<.' },
          { label: 'MISCELLANEOUS', key: 'miscellaneous', prefillMarket: miscMarketValue, prefillHover: '>>Prefill from section 6, field "TOTAL" (Part E)<<.' },
          { label: 'SERVICES', key: 'services', prefillMarket: servicesMarketValue, prefillHover: '>>Prefill from section 6, field "TOTAL" (Part F)<<.' },
        ];

        const getAbstractVal = (key: string, col: string) => parseFloat(fields[`bobAbstract_${key}_${col}`] || '0') || 0;

        // Per-row resolved values (needed for TOTAL row sums)
        const resolvedRows = abstractRows.map(row => {
          const govtVal = getAbstractVal(row.key, 'govt');
          const marketVal = row.prefillMarket !== null ? row.prefillMarket : getAbstractVal(row.key, 'market');
          const realizableVal = fields[`bobAbstract_${row.key}_realizableEditOn`]
            ? (parseFloat(fields[`bobAbstract_${row.key}_realizable`] || '0') || 0)
            : marketVal * 0.95;
          const distressVal = fields[`bobAbstract_${row.key}_distressEditOn`]
            ? (parseFloat(fields[`bobAbstract_${row.key}_distress`] || '0') || 0)
            : marketVal * 0.85;
          return { ...row, govtVal, marketVal, realizableVal, distressVal };
        });

        // TOTAL row: SUM of all 6 rows for each column, with edit switch override
        const calcTotalGovt = resolvedRows.reduce((sum, r) => sum + r.govtVal, 0);
        const calcTotalMarket = resolvedRows.reduce((sum, r) => sum + r.marketVal, 0);
        const calcTotalRealizable = resolvedRows.reduce((sum, r) => sum + r.realizableVal, 0);
        const calcTotalDistress = resolvedRows.reduce((sum, r) => sum + r.distressVal, 0);

        const totalGovt = fields.bobAbstractTotalGovtEditOn ? (parseFloat(fields.bobAbstractTotalGovt || '0') || 0) : calcTotalGovt;
        const totalMarket = fields.bobAbstractTotalMarketEditOn ? (parseFloat(fields.bobAbstractTotalMarket || '0') || 0) : calcTotalMarket;
        const totalRealizable = fields.bobAbstractTotalRealizableEditOn ? (parseFloat(fields.bobAbstractTotalRealizable || '0') || 0) : calcTotalRealizable;
        const totalDistress = fields.bobAbstractTotalDistressEditOn ? (parseFloat(fields.bobAbstractTotalDistress || '0') || 0) : calcTotalDistress;

        // Reusable cell with Lock + Edit Switch
        const EditSwitchCell = ({ fieldKey, autoValue, hoverText }: { fieldKey: string; autoValue: number; hoverText: string }) => {
          const editOnKey = `${fieldKey}EditOn`;
          const isEditing = !!fields[editOnKey];
          return (
            <div className="relative">
              <input
                className={`${inputCls} pr-14 ${!isEditing ? 'bg-[#A7F3D0] font-bold text-emerald-800' : ''}`}
                type="number" step="0.01"
                value={isEditing ? (fields[fieldKey] || '') : autoValue.toFixed(2)}
                onChange={e => handleChange(fieldKey, e.target.value)}
                readOnly={isReadOnly || !isEditing}
                title={hoverText}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5" title={hoverText}>
                {!isEditing && <Lock className="w-3 h-3 text-emerald-800" />}
                <button type="button" onClick={() => handleChange(editOnKey, !isEditing)} disabled={isReadOnly}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isEditing ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  title={hoverText}>
                  <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ${isEditing ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          );
        };

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 17: Final Values Abstract Table ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f5f5dc' }}>
              <h3 className="font-bold text-gray-700 border-b border-yellow-300 pb-2">Final Values Abstract Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">PERTICULARS</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">GOVT. VALUE IN RS.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">MARKET VALUE IN RS.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">REALIZABLE VALUE (95%)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">DISTRESS VALUE (85%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedRows.map(row => (
                      <tr key={row.key}>
                        <td className="border border-gray-300 px-3 py-2 font-medium bg-white">{row.label}</td>
                        {/* GOVT. VALUE */}
                        <td className="border border-gray-300 px-1 py-1">
                          <input className={inputCls} type="number" step="0.01" value={fields[`bobAbstract_${row.key}_govt`] || ''} onChange={e => handleChange(`bobAbstract_${row.key}_govt`, e.target.value)} disabled={isReadOnly} />
                        </td>
                        {/* MARKET VALUE */}
                        <td className="border border-gray-300 px-1 py-1">
                          {row.prefillMarket !== null ? (
                            <div className="relative group">
                              <input className={`${inputCls} bg-[#A7F3D0] font-bold text-emerald-800 cursor-not-allowed pr-6`}
                                value={row.prefillMarket.toFixed(2)} disabled title={row.prefillHover} />
                              <Lock className="w-3 h-3 text-emerald-800 absolute right-2 top-1/2 -translate-y-1/2" />
                            </div>
                          ) : (
                            <input className={inputCls} type="number" step="0.01" value={fields[`bobAbstract_${row.key}_market`] || ''} onChange={e => handleChange(`bobAbstract_${row.key}_market`, e.target.value)} disabled={isReadOnly} />
                          )}
                        </td>
                        {/* REALIZABLE VALUE (95%) 🔒🎚️ */}
                        <td className="border border-gray-300 px-1 py-1">
                          <EditSwitchCell
                            fieldKey={`bobAbstract_${row.key}_realizable`}
                            autoValue={row.marketVal * 0.95}
                            hoverText=">>Auto calculates from [MARKET VALUE IN RS.] * 0.95<<."
                          />
                        </td>
                        {/* DISTRESS VALUE (85%) 🔒🎚️ */}
                        <td className="border border-gray-300 px-1 py-1">
                          <EditSwitchCell
                            fieldKey={`bobAbstract_${row.key}_distress`}
                            autoValue={row.marketVal * 0.85}
                            hoverText=">>Auto calculates from [MARKET VALUE IN RS.] * 0.85<<."
                          />
                        </td>
                      </tr>
                    ))}
                    {/* ── TOTAL Row: auto-summed with edit switches ── */}
                    <tr className="bg-amber-50 font-bold">
                      <td className="border border-gray-300 px-3 py-2">TOTAL</td>
                      {/* TOTAL — Govt */}
                      <td className="border border-gray-300 px-1 py-1">
                        <EditSwitchCell
                          fieldKey="bobAbstractTotalGovt"
                          autoValue={calcTotalGovt}
                          hoverText=">>Auto calculates from SUM(LAND, BUILDING, EXTRA ITEMS, AMENITIES, MISCELLANEOUS, SERVICES) for this column<<."
                        />
                      </td>
                      {/* TOTAL — Market */}
                      <td className="border border-gray-300 px-1 py-1">
                        <EditSwitchCell
                          fieldKey="bobAbstractTotalMarket"
                          autoValue={calcTotalMarket}
                          hoverText=">>Auto calculates from SUM(LAND, BUILDING, EXTRA ITEMS, AMENITIES, MISCELLANEOUS, SERVICES) for this column<<."
                        />
                      </td>
                      {/* TOTAL — Realizable */}
                      <td className="border border-gray-300 px-1 py-1">
                        <EditSwitchCell
                          fieldKey="bobAbstractTotalRealizable"
                          autoValue={calcTotalRealizable}
                          hoverText=">>Auto calculates from SUM(LAND, BUILDING, EXTRA ITEMS, AMENITIES, MISCELLANEOUS, SERVICES) for this column<<."
                        />
                      </td>
                      {/* TOTAL — Distress */}
                      <td className="border border-gray-300 px-1 py-1">
                        <EditSwitchCell
                          fieldKey="bobAbstractTotalDistress"
                          autoValue={calcTotalDistress}
                          hoverText=">>Auto calculates from SUM(LAND, BUILDING, EXTRA ITEMS, AMENITIES, MISCELLANEOUS, SERVICES) for this column<<."
                        />
                      </td>
                    </tr>
                    {/* ── OR SAY Row: Manual rounding input ── */}
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 font-medium">OR SAY</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input className={inputCls} type="number" step="0.01" value={fields.bobAbstractOrSayGovt || ''} onChange={e => handleChange('bobAbstractOrSayGovt', e.target.value)} disabled={isReadOnly} placeholder="Manual" />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input className={inputCls} type="number" step="0.01" value={fields.bobAbstractOrSayMarket || ''} onChange={e => handleChange('bobAbstractOrSayMarket', e.target.value)} disabled={isReadOnly} placeholder="Manual" />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input className={inputCls} type="number" step="0.01" value={fields.bobAbstractOrSayRealizable || ''} onChange={e => handleChange('bobAbstractOrSayRealizable', e.target.value)} disabled={isReadOnly} placeholder="Manual" />
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <input className={inputCls} type="number" step="0.01" value={fields.bobAbstractOrSayDistress || ''} onChange={e => handleChange('bobAbstractOrSayDistress', e.target.value)} disabled={isReadOnly} placeholder="Manual" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Container 18: Valuer Sign-off & Bank Endorsement ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e0ffff' }}>
              <h3 className="font-bold text-gray-700 border-b border-cyan-200 pb-2">Valuer Sign-off & Bank Endorsement</h3>
              <Field label="REMARKS">
                <textarea className={inputCls} rows={3} value={fields.bobRemarks || ''} onChange={e => handleChange('bobRemarks', e.target.value)} disabled={isReadOnly} placeholder="Enter remarks..." />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Place:">
                  <input className={inputCls} value={fields.bobSignOffPlace || ''} onChange={e => handleChange('bobSignOffPlace', e.target.value)} disabled={isReadOnly} />
                </Field>
                <PrefillField label="Date:" value={fields.bobDateOfValuationMade || ''} hoverText='>>Prefill from section 2, field "Date on which the valuation is made"<<.' />
              </div>
              <Field label="Signature (Name and Official seal of the Approved Valuer)">
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onload = () => handleChange('bobSignOffSignature', reader.result); reader.readAsDataURL(file); }
                  }} disabled={isReadOnly} />
                {fields.bobSignOffSignature && <img src={fields.bobSignOffSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
              </Field>
              <Field label="The undersigned has inspected the property detailed in the Valuation Report. We are satisfied that the fair and reasonable market value of the property is as stated above.">
                <textarea className={inputCls} rows={3} value={fields.bobBankEndorsementText || ''} onChange={e => handleChange('bobBankEndorsementText', e.target.value)} disabled={isReadOnly} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseDateInput label="Date:" value={fields.bobBankEndorsementDate || ''} onChange={val => handleChange('bobBankEndorsementDate', val)} disabled={isReadOnly} />
                <Field label="Signature (Name of the Branch Manager with Official seal)">
                  <input type="file" accept="image/*" className={inputCls}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { const reader = new FileReader(); reader.onload = () => handleChange('bobBankManagerSignature', reader.result); reader.readAsDataURL(file); }
                    }} disabled={isReadOnly} />
                  {fields.bobBankManagerSignature && <img src={fields.bobBankManagerSignature} alt="Branch Manager Signature" className="mt-2 max-h-24 border rounded" />}
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 8: DECLARATION FROM VALUERS (Questionnaire) (Container 19)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-questionnaire',
      title: 'DECLARATION FROM VALUERS (Questionnaire)',
      number: 8,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const questionnaireItems = [
          'Background information of the asset being valued;',
          'Purpose of valuation and appointing authority',
          'Identity of the Valuers and any other experts involved in the valuation;',
          'Disclosure of Valuers interest or conflict, if any;',
          'Date of appointment, valuation date and date of report;',
          'Inspections and/or investigations undertaken;',
          'Nature and sources of the information used or relied upon;',
          'Procedures adopted in carrying out the valuation and valuation standards followed;',
          'Restrictions on use of the report, if any;',
          'Major factors that were taken into account during the valuation;',
          'Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuers, which shall not be for the purpose of limiting his responsibility for the valuation report.',
        ];
        const qAnswers: string[] = fields.bobDeclarationQuestionnaire || new Array(11).fill('');

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fafad2' }}>
              <h3 className="font-bold text-gray-700 border-b border-yellow-300 pb-2">Engagement Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left w-12">Sl No.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[50%]">Particulars</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Valuers Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionnaireItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2 bg-white">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 bg-white text-xs">{item}</td>
                        <td className="border border-gray-300 px-1 py-1">
                          <textarea className={inputCls} rows={2}
                            value={qAnswers[idx] || ''}
                            onChange={e => {
                              const arr = [...qAnswers];
                              arr[idx] = e.target.value;
                              handleChange('bobDeclarationQuestionnaire', arr);
                            }}
                            disabled={isReadOnly}
                            placeholder="Enter comment..." />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 9: DECLARATION FROM VALUERS (Affirmations) (Container 20)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-affirmations',
      title: 'DECLARATION FROM VALUERS (Affirmations)',
      number: 9,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const affirmChecks = fields.bobAffirmationChecks || {};
        const updateCheck = (key: string, val: boolean) => handleChange('bobAffirmationChecks', { ...affirmChecks, [key]: val });

        const affirmationItems: { key: string; text: string; hasNA?: boolean; hasInput?: boolean; inputKey?: string; }[] = [
          { key: 'a', text: 'I am citizen of India.' },
          { key: 'b', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
          { key: 'c', text: 'The information furnished in my valuation report is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.' },
          { key: 'd', text: 'I have personally inspected the property & I have valued the property which is identified by documents & help of customer. The work is not sub-contracted to any other valuer & carried out by myself.' },
          { key: 'e', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
          { key: 'f', text: 'I have not been depanelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
          { key: 'g', text: 'I have not been removed from service earlier.' },
          { key: 'h', text: 'I have not been convicted of any offence & sentenced to a term of imprisonment' },
          { key: 'i', text: 'I have not been declared to be unsound mind.' },
          { key: 'j', text: 'I have not been found guilty of misconduct in my professional capacity.' },
          { key: 'k', text: 'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.' },
          { key: 'l', text: 'I have not undischarged insolvent.' },
          { key: 'm', text: 'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.' },
          { key: 'n', text: 'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.' },
          { key: 'o', text: 'My PAN Card number as applicable is', hasInput: true, inputKey: 'bobAffirmationPAN' },
          { key: 'p', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
          { key: 'q', text: 'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure' },
          { key: 'r', text: 'I have read the hand book on policy, standards & procedure for real Estate valuation, 2011 of the IBA & this report is in conformity to the "Standards" enshrined for valuation in the part -B of the above handbook to the best of my knowledge.' },
          { key: 's', text: 'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.' },
          { key: 't', text: 'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.' },
          { key: 'u', text: 'I am registered under Section 34 AB of the Wealth Tax Act,1957.', hasNA: true },
          { key: 'v', text: 'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI)', hasNA: true },
          { key: 'w', text: 'My CIBIL Score and credit worthiness is as per Bank\'s guidelines.' },
          { key: 'x', text: 'I am the authorized official of the firm who is competent to sign this valuation report' },
          { key: 'y', text: 'I will undertake the valuation work on receipt of letter of Engagement generated from the System. (i.e. LLMS/LOS) only' },
          { key: 'z', text: 'Further, I hereby provide the following information.', hasNA: true },
        ];

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6e6fa' }}>
              <h3 className="font-bold text-gray-700 border-b border-indigo-200 pb-2">Affirmation Statements</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg p-4 border border-gray-100">
                <Field label="I Mr.">
                  <input className={inputCls} value={fields.bobAffirmationName || ''} onChange={e => handleChange('bobAffirmationName', e.target.value)} disabled={isReadOnly} placeholder="Full Name" />
                </Field>
                <Field label="S/o: Mr">
                  <input className={inputCls} value={fields.bobAffirmationFatherName || ''} onChange={e => handleChange('bobAffirmationFatherName', e.target.value)} disabled={isReadOnly} placeholder="Father's Name" />
                </Field>
              </div>

              <p className="text-sm text-gray-600 italic">do hereby solemnly affirm and state that:</p>

              <div className="space-y-3">
                {affirmationItems.map(item => (
                  <div key={item.key} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={affirmChecks[item.key] || false}
                      onChange={e => updateCheck(item.key, e.target.checked)}
                      disabled={isReadOnly}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">
                        <strong>{item.key}.</strong> {item.text}
                        {item.hasInput && (
                          <input className={`${inputCls} inline-block w-40 ml-2`} value={fields[item.inputKey!] || ''} onChange={e => handleChange(item.inputKey!, e.target.value)} disabled={isReadOnly} placeholder="PAN Number" />
                        )}
                      </span>
                    </div>
                    {item.hasNA && (
                      <label className="flex items-center gap-1 cursor-pointer select-none shrink-0 mt-1">
                        <input type="checkbox" checked={fields[`bobAffirmation_${item.key}_NA`] || false}
                          onChange={e => handleChange(`bobAffirmation_${item.key}_NA`, e.target.checked)}
                          disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                        <span className="text-xs text-gray-500">N/A</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {affirmChecks.z && (
                <div className="mt-2">
                  <textarea className={inputCls} rows={3} value={fields.bobAffirmationAdditionalInfo || ''} onChange={e => handleChange('bobAffirmationAdditionalInfo', e.target.value)} disabled={isReadOnly || fields.bobAffirmation_z_NA} placeholder="Enter additional information..." />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <PrefillField label="Date:" value={fields.bobDateOfValuationMade || ''} hoverText='>>Prefill from section 2, field "Date on which the valuation is made"<<.' />
                <Field label="Place:">
                  <input className={inputCls} value={fields.bobAffirmationPlace || ''} onChange={e => handleChange('bobAffirmationPlace', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label="Signature (Name and Official seal of the Approved Valuer)">
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onload = () => handleChange('bobAffirmationSignature', reader.result); reader.readAsDataURL(file); }
                  }} disabled={isReadOnly} />
                {fields.bobAffirmationSignature && <img src={fields.bobAffirmationSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
              </Field>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 10: MODEL CODE OF CONDUCT FOR VALUERS (Container 21)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'bob-section-code-of-conduct',
      title: 'MODEL CODE OF CONDUCT FOR VALUERS',
      number: 10,
      defaultOpen: false,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const codeOfConductSections = [
          { heading: 'Integrity and Fairness', items: [
            { num: 1, text: 'A Valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other Valuers.' },
            { num: 2, text: 'A Valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.' },
            { num: 3, text: 'A Valuer shall endeavor to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.' },
            { num: 4, text: 'A Valuer shall refrain from being involved in any action that would bring disrepute to the profession.' },
            { num: 5, text: 'A Valuer shall keep public interest foremost while delivering his services.' },
          ]},
          { heading: 'Professional Competence and Due Care', items: [
            { num: 6, text: 'A Valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.' },
            { num: 7, text: 'A Valuer shall carry out professional services in accordance with the relevant technical and professional standards that may be specified from time to time' },
            { num: 8, text: 'A Valuer shall continuously maintain professional knowledge and skill to provide competent professional service based on up-to-date developments in practice, prevailing regulations/guidelines and techniques.' },
            { num: 9, text: 'In the preparation of a valuation report, the Valuer shall not disclaim liability for his/its expertise or deny his/its duty of care, except to the extent that the assumptions are based on statements of fact provided by the company or its auditors or consultants or information available in public domain and not generated by the Valuer.' },
            { num: 10, text: 'A Valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.' },
            { num: 11, text: 'A Valuer shall clearly state to his client the services that he would be competent to provide and the services for which he would be relying on other Valuers or professionals or for which the client can have a separate arrangement with other Valuers.' },
          ]},
          { heading: 'Independence and Disclosure of Interest', items: [
            { num: 12, text: 'A Valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.' },
            { num: 13, text: 'A Valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent in terms of association to the company.' },
            { num: 14, text: 'A Valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.' },
            { num: 15, text: 'A Valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.' },
            { num: 16, text: 'A Valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation, and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.' },
            { num: 17, text: 'A Valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client\'s needs.' },
            { num: 18, text: 'As an independent Valuer, the Valuer shall not charge success fee (Success fees may be defined as a compensation / incentive paid to any third party for successful closure of transaction. In this case, approval of credit proposals).' },
            { num: 19, text: 'In any fairness opinion or independent expert opinion submitted by a Valuer, if there has been a prior engagement in an unconnected transaction, the Valuer shall declare the association with the company during the last five years.' },
          ]},
          { heading: 'Confidentiality', items: [
            { num: 20, text: 'A Valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.' },
            { num: 21, text: 'A Valuer shall ensure that he/it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.' },
            { num: 22, text: 'A Valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorized by the authority, the registered values\' organization with which he/it is registered or any other statutory regulatory body.' },
            { num: 23, text: 'A Valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organization with which he/it is registered, or any other statutory regulatory body.' },
            { num: 24, text: 'A Valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.' },
          ]},
          { heading: 'Gifts and Hospitality', items: [
            { num: 25, text: 'A Valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a Valuer.' },
            { num: 26, text: 'A Valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.' },
          ]},
          { heading: 'Remuneration and Costs', items: [
            { num: 27, text: 'A Valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.' },
            { num: 28, text: 'A Valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service.' },
          ]},
          { heading: 'Occupation, Employability and Restrictions', items: [
            { num: 29, text: 'A Valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/ its assignments.' },
            { num: 30, text: 'A Valuer shall not conduct business which in the opinion of the authority or the registered Valuer organization discredits the profession.' },
          ]},
        ];

        const cocValues = fields.bobCodeOfConductValues || {};

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fffacd' }}>
              <h3 className="font-bold text-gray-700 border-b border-yellow-300 pb-2">Code of Conduct Acknowledgment</h3>
              <p className="text-xs text-gray-500 italic">Adopted in line with Companies (Registered Valuers and Valuation Rules, 2017)</p>
              <p className="text-sm text-gray-600">All Valuers empanelled with bank shall strictly adhere to the following code of conduct:</p>

              <div className="max-h-150 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white space-y-4">
                {codeOfConductSections.map((section, sIdx) => (
                  <div key={sIdx}>
                    <h4 className="font-bold text-gray-800 text-sm mb-2 bg-gray-50 px-3 py-2 rounded border-l-4 border-[#4A5D23]">{section.heading}</h4>
                    <div className="space-y-2 pl-2">
                      {section.items.map(item => (
                        <div key={item.num} className="space-y-1">
                          <p className="text-xs text-gray-700"><strong>{item.num}.</strong> {item.text}</p>
                          <textarea
                            className={`${inputCls} text-xs`}
                            rows={2}
                            value={cocValues[`item_${item.num}`] || item.text}
                            onChange={e => handleChange('bobCodeOfConductValues', { ...cocValues, [`item_${item.num}`]: e.target.value })}
                            disabled={isReadOnly}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-100 mt-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fields.bobCodeOfConductAcknowledged || false}
                    onChange={e => handleChange('bobCodeOfConductAcknowledged', e.target.checked)}
                    disabled={isReadOnly}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">I acknowledge and agree to the Model Code of Conduct (Items 1-30)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <PrefillField label="Date:" value={fields.bobDateOfValuationMade || ''} hoverText='>>Prefill from section 2, field "Date on which the valuation is made"<<.' />
                <Field label="Place:">
                  <input className={inputCls} value={fields.bobCodeOfConductPlace || ''} onChange={e => handleChange('bobCodeOfConductPlace', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label="Signature of the Approved Valuer and Seal">
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onload = () => handleChange('bobCodeOfConductSignature', reader.result); reader.readAsDataURL(file); }
                  }} disabled={isReadOnly} />
                {fields.bobCodeOfConductSignature && <img src={fields.bobCodeOfConductSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
              </Field>
            </div>
          </div>
        );
      }
    },
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFBankOfBarodaRenderer({
    ...fields,
  })
};

export default function BankOfBaroda(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BANK_OF_BARODA_CONFIG} {...props} />;
}
