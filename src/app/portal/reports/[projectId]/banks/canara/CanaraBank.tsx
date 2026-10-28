'use client';
import React, { useState, ReactNode } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFCanaraBankRenderer } from '@/lib/banks/pdf-canara-bank-renderer';
import * as XLSX from 'xlsx';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import { Lock, Info } from 'lucide-react';
import { rupeesInWords } from '@/lib/numberToWords';

/* ═══════════════════════════════════════════════════════════════════════
   CNRB-SPECIFIC SECTION (Olive Green Accordion Header)
   ═══════════════════════════════════════════════════════════════════════ */
function CanaraSection({ title, number, id, children, defaultOpen = true }: {
  title: string; number?: number | string; id?: string; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const secId = id || (number ? `canara-section-${number}` : undefined);
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
   MULTI SELECT COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
function MultiSelectDocs({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean; }) {
  const [open, setOpen] = useState(false);
  const options = ['Sale Deed', 'Patta', 'Road Agreement', 'Sketch Map', 'Approval Plan'];
  
  const selectedOptions = options.filter(opt => value.includes(opt));
  const customParts = value.split(', ').filter(p => p && !options.includes(p));
  const [customText, setCustomText] = useState(customParts.join(', '));

  const toggleOption = (opt: string) => {
    let next;
    if (selectedOptions.includes(opt)) {
      next = selectedOptions.filter(o => o !== opt);
    } else {
      next = [...selectedOptions, opt];
    }
    const finalVal = [...next, ...(customText ? [customText] : [])].join(', ');
    onChange(finalVal);
  };

  const updateCustomText = (txt: string) => {
    setCustomText(txt);
    const finalVal = [...selectedOptions, ...(txt ? [txt] : [])].join(', ');
    onChange(finalVal);
  };

  return (
    <div className="relative flex-1 text-sm font-sans">
      <div 
        className={`${inputCls} min-h-10.5 cursor-pointer flex items-center justify-between ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="truncate pr-4">{value || 'Select...'}</span>
        <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {options.map(opt => (
              <label key={opt} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 m-0">
                <input 
                  type="checkbox" 
                  className="mr-2 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={selectedOptions.includes(opt)} 
                  onChange={() => toggleOption(opt)}
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))}
            <div className="p-2 border-t border-gray-100 bg-gray-50">
              <input
                type="text"
                placeholder="Other (Custom)..."
                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-gray-700"
                value={customText}
                onChange={e => updateCustomText(e.target.value)}
              />
            </div>
          </div>
        </>
      )}
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
  
  const complexLabel = (
    <div className="flex items-center gap-3">
      <span>{label}</span>
      {naKey && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
        </label>
      )}
    </div>
  );

  return (
    <Field label={complexLabel}>
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

  const complexLabel = (
    <div className="flex items-center gap-3">
      <span>{label}</span>
      {naKey && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
        </label>
      )}
    </div>
  );

  return (
    <Field label={complexLabel}>
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

  const complexLabel = (
    <div className="flex items-center gap-3">
      <span>{label}</span>
      {naKey && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
        </label>
      )}
    </div>
  );

  return (
    <Field label={complexLabel}>
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
      </div>
    </Field>
  );
}

function AutoCalcField({ label, fieldKey, fields, handleChange, isReadOnly, calcValue, hoverText }: {
  label: string | ReactNode; fieldKey: string; fields: any; handleChange: any; isReadOnly: boolean;
  calcValue: number | string; hoverText: string;
}) {
  const editOnKey = `${fieldKey}EditOn`;
  const isEditOn = fields[editOnKey] === true;
  const displayVal = isEditOn ? (fields[fieldKey] || '') : String(calcValue);
  
  const switchEl = (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isEditOn ? 'text-emerald-700' : 'text-gray-400'}`}>
        {isEditOn ? 'Edit On' : 'Edit Off'}
      </span>
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
  );

  return (
    <Field label={<div className="flex items-center justify-between w-full"><span>{label}</span>{switchEl}</div>}>
      <div className="relative" title={!isEditOn ? hoverText : undefined}>
        <input
          className={`${inputCls} pr-10 ${!isEditOn ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}`}
          value={displayVal}
          onChange={e => handleChange(fieldKey, e.target.value)}
          disabled={isReadOnly}
          readOnly={!isEditOn}
          placeholder={isEditOn ? 'Enter value...' : ''}
          title={!isEditOn ? hoverText : undefined}
        />
        {!isEditOn && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={hoverText}>
            <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
          </div>
        )}
      </div>
    </Field>
  );
}

/** Prefill field with Lock icon only (no edit switch) */
function PrefillField({ label, value, hoverText, isReadOnly }: {
  label: string | ReactNode; value: string; hoverText: string; isReadOnly?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="relative" title={hoverText}>
        <input
          className={`${inputCls} pr-10 bg-gray-100 text-gray-700 cursor-not-allowed`}
          value={value}
          disabled={isReadOnly}
          readOnly
          title={hoverText}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={hoverText}>
          <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
        </div>
      </div>
    </Field>
  );
}

/** Segmented toggle for Manual Grid Input vs Upload file */
function DirectFileUploadToggle({ modeKey, fields, handleChange, isReadOnly }: {
  modeKey: string; fields: any; handleChange: any; isReadOnly: boolean;
}) {
  const isAnnexure = fields[modeKey] === 'annexure';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File exceeds 5MB limit.'); return; }
    
    e.target.value = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const ref = ws['!ref'];
      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        let allRows: string[][] = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: string[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            row.push(cell ? String(XLSX.utils.format_cell(cell)) : '');
          }
          allRows.push(row);
        }
        const parsedData = {
          headers: allRows[0]?.map(h => String(h)) || [],
          rows: allRows.slice(1).map(row => row.map(c => String(c))),
          allRows,
        };
        handleChange(`${modeKey}_fileName`, file.name);
        handleChange(`${modeKey}_parsedData`, parsedData);
      }
    } catch (parseErr) {
      console.warn('Could not parse Excel/CSV file:', parseErr);
      alert('Error parsing file. Please ensure it is a valid Excel or CSV file.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit text-xs">
        <button type="button" onClick={() => handleChange(modeKey, 'manual')} disabled={isReadOnly}
          className={`px-3 py-1.5 rounded-md transition-all font-medium ${!isAnnexure ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
          Manual Grid Input
        </button>
        <button type="button" onClick={() => handleChange(modeKey, 'annexure')} disabled={isReadOnly}
          className={`px-3 py-1.5 rounded-md transition-all font-medium ${isAnnexure ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
          Upload file
        </button>
      </div>

      {isAnnexure && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex-1">
            {fields[`${modeKey}_parsedData`] ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-800">File uploaded: {fields[`${modeKey}_fileName`]}</p>
                    <p className="text-xs text-green-600">{fields[`${modeKey}_parsedData`].rows?.length || 0} rows parsed successfully.</p>
                  </div>
                  {!isReadOnly && (
                    <button type="button" onClick={() => {
                      handleChange(`${modeKey}_fileName`, null);
                      handleChange(`${modeKey}_parsedData`, null);
                    }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 font-medium">Remove File</button>
                  )}
                </div>
                
                <div className="border border-[#dee2e6] rounded-xl overflow-hidden shadow-xs mt-2">
                  <div className="bg-white px-4 py-2 border-b border-[#dee2e6] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Spreadsheet Preview</span>
                  </div>
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                          {fields[`${modeKey}_parsedData`].headers.map((h: string, hi: number) => (
                            <th key={hi} className="px-3 py-2 font-bold text-gray-700 border-r border-[#dee2e6] whitespace-nowrap">{h || `Col ${hi + 1}`}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fields[`${modeKey}_parsedData`].rows.map((row: string[], ri: number) => (
                          <tr key={ri} className="border-b border-[#eee] hover:bg-slate-50">
                            {row.map((cell: string, ci: number) => (
                              <td key={ci} className="px-3 py-1.5 border-r border-[#eee] text-gray-600 whitespace-nowrap">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-amber-800 mb-2">Upload Excel/CSV File</p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={isReadOnly} className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition-colors cursor-pointer" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Extracts the Year of Construction from field c) text.
 * Priority:
 *   1. Look for "Year of Construction-YYYY" pattern specifically.
 *   2. If not found, fall back to the smallest (earliest) 4-digit year.
 * This prevents incorrect extraction when "Year of Completion" appears first.
 */
function extractYearOfConstruction(raw: string): number {
  if (!raw) return 0;
  // 1. Look for the labeled pattern first
  const labeledMatch = raw.match(/year\s*of\s*construction\s*[-–—:]\s*(\d{4})/i);
  if (labeledMatch) return parseInt(labeledMatch[1]);
  // 2. Fall back: collect ALL 4-digit years, pick the smallest (earliest)
  const allYears = Array.from(raw.matchAll(/(\d{4})/g)).map(m => parseInt(m[1])).filter(y => y >= 1900 && y <= 2100);
  return allYears.length > 0 ? Math.min(...allYears) : 0;
}

/* ═══════════════════════════════════════════════════════════════════════
   CANARA BANK CONFIGURATION
   ═══════════════════════════════════════════════════════════════════════ */


export function EditSwitch({ checked, onChange, disabled }: { checked: boolean, onChange: (v: boolean) => void, disabled: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? 'text-emerald-700' : 'text-gray-400'}`}>
        {checked ? 'Edit On' : 'Edit Off'}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow ${checked ? 'translate-x-4.5' : 'translate-x-0.75'}`} />
      </button>
    </div>
  );
}

export const CANARA_BANK_CONFIG: BankConfig = {
  bankId: 'CANARA BANK',
  subTemplateId: '',
  displayName: 'Canara Bank',
  hiddenSections: [
    'section-1', 'section-1a', 'section-2', 'section-3', 'section-4', 'section-5',
    'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10',
    'layout-config', 'annexures'
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  hideDefaultDeclarationAndCertificate: true,
  navSections: [
    { id: 'section-cover', title: 'Cover Page Details' },
    { id: 'canara-section-general', title: 'Part I — GENERAL' },
    { id: 'canara-section-characteristics', title: 'Part II — CHARACTERISTICS' },
    { id: 'canara-section-land', title: 'Part A — Land Valuation' },
    { id: 'canara-section-building', title: 'Part B — Building Valuation' },
    { id: 'canara-section-valuation-details', title: 'Valuation & Amenities' },
    { id: 'canara-section-abstract', title: 'Total Abstract & Remarks' },
    { id: 'canara-section-affirmations', title: 'Declaration (Affirmations)' },
    { id: 'canara-section-questionnaire', title: 'Declaration (Questionnaire)' },
    { id: 'canara-section-code-of-conduct', title: 'Code of Conduct' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-12', title: 'Maps' },
    { id: 'section-11', title: 'Property Photographs' },
  ],
  fieldLabels: {
    'documents-title': 'DOCUMENTS',
    'section-documents-title': 'DOCUMENTS',
    'section-12-title': 'MAPS',
    'section-11-title': 'PROPERTY PHOTOGRAPHS',
  },
  defaultValues: {
    // ── Section 1: Cover Page ──
    canaraPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    canaraAddressOfTheProperty: '',
    canaraEnableCoverPageValueEdit: false,
    canaraPresentMarketValue: '',
    canaraRealizableValue: '',
    canaraForcedSaleValue: '',
    canaraGovtValue: '',
    canaraBankBranchDetails: 'CANARA BANK, BARAMUNDA BRANCH, BHUBANESWAR, DIST: KHURDA, ODISHA', canaraBankBranchDetailsEditOn: false,
    canaraAsOnDate: '2026-02-20', canaraAsOnDateEditOn: false,
    canaraAddressee: 'TO, THE BRANCH MANAGER,', canaraAddresseeEditOn: false,
    canaraReportTitle: 'VALUATION REPORT (IN RESPECT OF LAND / SITE AND BUILDING)', canaraReportTitleEditOn: false,
    canaraRefNo: '', canaraRefNoEditOn: false,
    canaraEnableDateOfValuationEdit: false,
    canaraFullLegalPropertyDescription: '',
    canaraEnableLegalDescEdit: false,
    canaraEnablePurposeEdit: false,
    canaraPurposeOfValuationDropdown: 'default',
    canaraPurposeOfValuation: 'To assess the present market value of the property for loan purpose',
    canaraPreparedByValuerName: 'Er. Satyajit Mohanty, (B.E, Civil) FIV',
    canaraPreparedByValuerNameNA: false,
    canaraPreparedByGovtReg: 'Registered Valuer, Govt. of India (Regd. No.-107/2016-17, Cat -I)',
    canaraPreparedByGovtRegNA: false,
    canaraPreparedByAcademicDegrees: 'B.E.(Civil) Utkal, M. Tech(Civil), MBA(HR), Approved Valuer',
    canaraPreparedByAcademicDegreesNA: false,
    canaraPreparedByIoVMembership: 'Life, Fellow & Approved Valuer from Institution of Valuers (New Delhi), Membership No.F-26377',
    canaraPreparedByIoVMembershipNA: false,
    canaraPreparedByIoEMembership: 'Member in Institution of Engineer (India)',
    canaraPreparedByIoEMembershipNA: false,
    canaraPreparedByCharteredEng: 'Chartered Engineer (Regd. No.-M-156096-9)',
    canaraPreparedByCharteredEngNA: false,
    canaraPreparedByBankEmpanelment: 'Empanelled Valuer of Canara Bank',
    canaraPreparedByBankEmpanelmentNA: false,
    canaraPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    canaraPreparedByPlotNoNA: false,
    canaraPreparedByStreet: 'Shiv Nagar Tankapani Road',
    canaraPreparedByStreetNA: false,
    canaraPreparedByCity: 'Bhubaneswar',
    canaraPreparedByCityNA: false,
    canaraPreparedByState: 'Odisha',
    canaraPreparedByStateNA: false,
    canaraPreparedByPinCode: '751018',
    canaraPreparedByPinCodeNA: false,
    canaraPreparedByPhone: '06742381145',
    canaraPreparedByPhoneNA: false,
    canaraPreparedByMobile: '9937023855/9437074855',
    canaraPreparedByMobileNA: false,
    // ── Section 2: Part I — GENERAL ──
    canaraPurposeForValuation: '',
    canaraDateOfInspection: '',
    canaraDateOfValuationMade: '',
    canaraDocumentI: '', canaraDocumentINA: false,
    canaraDocumentII: '', canaraDocumentIINA: false,
    canaraDocumentIII: '', canaraDocumentIIINA: false,
    canaraOwnerNamesAddresses: '',
    canaraBriefDescriptionDropdown: '', canaraBriefDescription: '',
    canaraPlotNo: '', canaraDoorNo: '', canaraDoorNoNA: false,
    canaraTSNoVillage: '', canaraWardTaluka: '', canaraMandalDistrict: '',
    canaraPostalAddress: '',
    canaraCityTown: '', canaraCityTownNA: false,
    canaraClassHighMiddlePoor: '', canaraClassHighMiddlePoorNA: false,
    canaraClassUrbanRural: '', canaraClassUrbanRuralNA: false,
    canaraCorporationLimit: '', canaraCorporationLimitNA: false,
    canaraCoveredUnderEnactments: '', canaraCoveredUnderEnactmentsNA: false,
    canaraAgriculturalConversion: '', canaraAgriculturalConversionNA: false,
    canaraBoundaries: { sketchEast: '', sketchWest: '', sketchNorth: '', sketchSouth: '', verifyEast: '', verifyWest: '', verifyNorth: '', verifySouth: '' },
    canaraDimensions: { deedEast: '', deedWest: '', deedNorth: '', deedSouth: '', actualEast: '', actualWest: '', actualNorth: '', actualSouth: '' },
    canaraLatLong: '',
    canaraExtentOfSite: '',
    canaraExtentForValuation: '', canaraExtentForValuationEditOn: false,
    canaraOccupancy: '', canaraOccupancyDetails: '', canaraOccupancyNA: false,
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
        const dimensions = fields.canaraDimensions || {};
        const deedArea = (parseFloat(dimensions.deedEast || '0') || 0) + (parseFloat(dimensions.deedWest || '0') || 0) + (parseFloat(dimensions.deedNorth || '0') || 0) + (parseFloat(dimensions.deedSouth || '0') || 0);
        const actualArea = (parseFloat(dimensions.actualEast || '0') || 0) + (parseFloat(dimensions.actualWest || '0') || 0) + (parseFloat(dimensions.actualNorth || '0') || 0) + (parseFloat(dimensions.actualSouth || '0') || 0);
        const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
        const areaSft = minArea * 43560;

        const acreValue = parseFloat(fields.canaraGovtBenchmarkPerAcre || '0') || 0;
        const sftRate = acreValue > 0 ? Math.round(acreValue / 43560) : 0;
        const landGovtValue = areaSft > 0 && sftRate > 0 ? Math.round(areaSft * sftRate) : 0;

        const adoptedRate = parseFloat(fields.canaraAdoptedRate || '0') || 0;
        const calculatedLandMarketValue = areaSft > 0 && adoptedRate > 0 ? Math.round(areaSft * adoptedRate) : 0;
        const landMarketValue = fields.canaraEstimatedLandValueEditOn
          ? (parseFloat(fields.canaraEstimatedLandValue || '0') || 0)
          : calculatedLandMarketValue;

        const buildingRows: any[] = fields.canaraBuildingValuationRows || [];
        const currentYear = new Date().getFullYear();
        const yearOfConstStr = fields.canaraYearOfConstruction || '';
        const yearMatch = yearOfConstStr.match(/\d{4}/);
        const yearOfConst = yearMatch ? parseInt(yearMatch[0], 10) : 0;
        const bAge = fields.canaraBuildingAgeEditOn ? (parseFloat(fields.canaraBuildingAge || '0') || 0) : (yearOfConst > 0 ? currentYear - yearOfConst : 0);
        const buildingMarketValue = buildingRows.reduce((sum: number, row: any) => {
          const p = parseFloat(row.plinthArea || '0') || 0;
          const r = parseFloat(row.replacementRate || '0') || 0;
          const est = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : p * r;
          const dep = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : est * 0.01 * bAge;
          const net = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : est - dep;
          return sum + net;
        }, 0);

        const amenitiesMarketValue = Array.from({ length: 10 }, (_, i) => parseFloat(fields[`canaraAmenity_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);
        const miscMarketValue = Array.from({ length: 4 }, (_, i) => parseFloat(fields[`canaraMisc_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);
        const servicesMarketValue = Array.from({ length: 5 }, (_, i) => parseFloat(fields[`canaraService_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);

        const calcTotalGovt = landGovtValue;
        const calcTotalMarket = landMarketValue + buildingMarketValue + amenitiesMarketValue + miscMarketValue + servicesMarketValue;
        const calcTotalRealizable = calcTotalMarket * 0.95;
        const calcTotalDistress = calcTotalMarket * 0.85;

        const presentMarketValue = Math.round(calcTotalMarket / 1000) * 1000;
        const realizableValue = Math.round(calcTotalRealizable / 1000) * 1000;
        const forcedSaleValue = Math.round(calcTotalDistress / 1000) * 1000;
        const govtValue = Math.round(calcTotalGovt / 1000) * 1000;

        const fmtINR = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);


        return (
        <div className="animate-fade-in space-y-6">
          {/* Container 1: Bank & Report Header */}
          <div className="rounded-xl p-5 space-y-4 border border-blue-200" style={{ backgroundColor: '#e6f2ff' }}>
            <h3 className="font-bold text-gray-700 border-b border-blue-200 pb-2">BANK & REPORT HEADER</h3>
            <Field label="BANK & BRANCH DETAILS">
              <textarea className={inputCls} rows={2} value={fields.canaraBankBranchDetails || ''} onChange={e => handleChange('canaraBankBranchDetails', e.target.value)} disabled={isReadOnly} placeholder="e.g., CANARA BANK, BARAMUNDA BRANCH, BHUBANESWAR, DIST: KHURDA, ODISHA" />
            </Field>
            <Field label="AS ON DATE">
              <input
                type="date"
                className={inputCls}
                value={fields.canaraAsOnDate || ''}
                onChange={e => handleChange('canaraAsOnDate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Container 4: Valuation of Land & Property Summary */}
          <div className="rounded-xl p-5 space-y-4 border border-red-200" style={{ backgroundColor: '#ffe6e6' }}>
            <h3 className="font-bold text-gray-700 border-b border-red-200 pb-2">VALUATION OF LAND & PROPERTY SUMMARY</h3>
            <Field label="FULL LEGAL PROPERTY DESCRIPTION">
              <textarea
                className={inputCls} rows={3}
                value={fields.canaraFullLegalPropertyDescription || ''}
                onChange={e => handleChange('canaraFullLegalPropertyDescription', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Container 2: Property Owner Details */}
          <div className="rounded-xl p-5 space-y-4 border border-green-200" style={{ backgroundColor: '#e6ffe6' }}>
            <div className="flex justify-between items-center mb-4 border-b border-green-200 pb-2">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER DETAILS</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('canaraPropertyOwners', [...(fields.canaraPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.canaraPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.canaraPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('canaraPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. MR. BISWOJIT BAHIRA"
                    />
                  </Field>
                  <Field label="RELATIONSHIP" className="w-40">
                    <select
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.canaraPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('canaraPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      <option value="">Select</option>
                      <option value="S/O">S/O</option>
                      <option value="D/O">D/O</option>
                      <option value="W/O">W/O</option>
                      <option value="C/O">C/O</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  <Field label="OWNER'S RELATIVE'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.relativeName || owner.fatherName || ''}
                      onChange={(e) => {
                        const arr = [...(fields.canaraPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('canaraPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. MR. ARTA BAHIRA"
                    />
                  </Field>
                  {(fields.canaraPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.canaraPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('canaraPropertyOwners', arr);
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

          {/* Container 3: Address of the Property */}
          <div className="rounded-xl p-5 space-y-4 border border-yellow-200" style={{ backgroundColor: '#ffffe6' }}>
            <Field label={<span>ADDRESS OF THE PROPERTY <span className="text-red-500">*</span></span>}>
              <textarea className={inputCls} rows={3} value={fields.canaraAddressOfTheProperty || ''} onChange={e => handleChange('canaraAddressOfTheProperty', e.target.value)} disabled={isReadOnly} required placeholder="e.g., Plot No: 2306/8048 & 2305/8047, Pratap Sasan..." />
            </Field>
          </div>

          {/* Container 5: Value of the Property (Abstract Summary) */}
          <div className="rounded-xl p-5 space-y-4 border border-purple-200" style={{ backgroundColor: '#f2e6ff' }}>
            <div className="flex justify-between items-center mb-4 border-b border-purple-200 pb-2">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY (ABSTRACT SUMMARY)</h3>
              <EditSwitch checked={fields.canaraEnableCoverPageValueEdit} onChange={v => handleChange('canaraEnableCoverPageValueEdit', v)} disabled={isReadOnly} />
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1" title={!fields.canaraEnableCoverPageValueEdit ? '>>Auto-calculated from TOTAL ABSTRACT (OR SAY row) - MARKET VALUE IN RS.<<' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.canaraEnableCoverPageValueEdit ? 'text-gray-500' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.canaraEnableCoverPageValueEdit ? 'bg-gray-100 cursor-not-allowed font-bold text-gray-700' : 'bg-white'}`}
                      value={fields.canaraEnableCoverPageValueEdit ? (fields.canaraPresentMarketValue || '') : fmtINR(presentMarketValue)}
                      onChange={(e) => handleChange('canaraPresentMarketValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.canaraEnableCoverPageValueEdit}
                    />
                    {!fields.canaraEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
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
                  <div className="relative mt-1" title={!fields.canaraEnableCoverPageValueEdit ? '>>Auto-calculated from TOTAL ABSTRACT (OR SAY row) - REALIZABLE VALUE (95%)<<' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.canaraEnableCoverPageValueEdit ? 'text-gray-500' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.canaraEnableCoverPageValueEdit ? 'bg-gray-100 cursor-not-allowed font-bold text-gray-700' : 'bg-white'}`}
                      value={fields.canaraEnableCoverPageValueEdit ? (fields.canaraRealizableValue || '') : fmtINR(realizableValue)}
                      onChange={(e) => handleChange('canaraRealizableValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.canaraEnableCoverPageValueEdit}
                    />
                    {!fields.canaraEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
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
                  <div className="relative mt-1" title={!fields.canaraEnableCoverPageValueEdit ? '>>Auto-calculated from TOTAL ABSTRACT (OR SAY row) - DISTRESS VALUE (85%)<<' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.canaraEnableCoverPageValueEdit ? 'text-gray-500' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.canaraEnableCoverPageValueEdit ? 'bg-gray-100 cursor-not-allowed font-bold text-gray-700' : 'bg-white'}`}
                      value={fields.canaraEnableCoverPageValueEdit ? (fields.canaraForcedSaleValue || '') : fmtINR(forcedSaleValue)}
                      onChange={(e) => handleChange('canaraForcedSaleValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.canaraEnableCoverPageValueEdit}
                    />
                    {!fields.canaraEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
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
                  <div className="relative mt-1" title={!fields.canaraEnableCoverPageValueEdit ? '>>Auto-calculated from TOTAL ABSTRACT (OR SAY row) - GOVT. VALUE IN RS.<<' : undefined}>
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold ${!fields.canaraEnableCoverPageValueEdit ? 'text-gray-500' : 'text-gray-500'}`}>RS.</span>
                    <input
                      type="text"
                      className={`${inputCls} pl-10 pr-8 ${!fields.canaraEnableCoverPageValueEdit ? 'bg-gray-100 cursor-not-allowed font-bold text-gray-700' : 'bg-white'}`}
                      value={fields.canaraEnableCoverPageValueEdit ? (fields.canaraGovtValue || '') : fmtINR(govtValue)}
                      onChange={(e) => handleChange('canaraGovtValue', e.target.value.replace(/[^0-9.]/g, ''))}
                      readOnly={isReadOnly || !fields.canaraEnableCoverPageValueEdit}
                    />
                    {!fields.canaraEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Container 6: Purpose of Valuation */}
          <div className="rounded-xl p-5 space-y-4 border border-teal-200" style={{ backgroundColor: '#e6fffa' }}>
            <h3 className="font-bold text-gray-700 border-b border-teal-200 pb-2">PURPOSE OF VALUATION</h3>
            <Field label="PURPOSE OF VALUATION">
              <div className="space-y-3">
                <select
                  className={inputCls}
                  value={fields.canaraPurposeOfValuationDropdown || 'default'}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('canaraPurposeOfValuationDropdown', val);
                    if (val === 'default') {
                      handleChange('canaraPurposeOfValuation', 'To assess the present market value of the property for loan purpose');
                    } else if (val === 'presentmarket') {
                      handleChange('canaraPurposeOfValuation', 'To assess the present market value of the property');
                    } else if (val === 'incometax') {
                      handleChange('canaraPurposeOfValuation', 'To assess capital gain for income tax');
                    } else {
                      handleChange('canaraPurposeOfValuation', '');
                    }
                  }}
                  disabled={isReadOnly}
                >
                  <option value="default">To assess the present market value of the property for loan purpose</option>
                  <option value="presentmarket">To assess the present market value of the property</option>
                  <option value="incometax">To assess capital gain for income tax</option>
                  <option value="custom">Custom</option>
                </select>
                {fields.canaraPurposeOfValuationDropdown === 'custom' && (
                  <textarea className={inputCls} rows={2} placeholder="Enter custom purpose of valuation..." value={fields.canaraPurposeOfValuation || ''} onChange={(e) => handleChange('canaraPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
          </div>

          {/* Container 7: Prepared By */}
          <div className="rounded-xl p-5 space-y-4 border border-orange-200" style={{ backgroundColor: '#fff0e6' }}>
            <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2">PREPARED BY (VALUER CREDENTIALS)</h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label={<><span>VALUER NAME & QUALIFICATION</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByValuerNameNA || false} onChange={e => { handleChange('canaraPreparedByValuerNameNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByValuerName', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <input className={inputCls} value={fields.canaraPreparedByValuerName || ''} onChange={e => handleChange('canaraPreparedByValuerName', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByValuerNameNA} placeholder="e.g. Er. Satyajit Mohanty, (B.E, Civil) FIV" />
              </Field>
              <Field label={<><span>GOVERNMENT REGISTRATION / CATEGORY</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByGovtRegNA || false} onChange={e => { handleChange('canaraPreparedByGovtRegNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByGovtReg', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <textarea className={inputCls} rows={2} value={fields.canaraPreparedByGovtReg || ''} onChange={e => handleChange('canaraPreparedByGovtReg', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByGovtRegNA} placeholder="e.g. Registered Valuer, Govt. of India..." />
              </Field>
              <Field label={<><span>ACADEMIC & PROFESSIONAL DEGREES</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByAcademicDegreesNA || false} onChange={e => { handleChange('canaraPreparedByAcademicDegreesNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByAcademicDegrees', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <textarea className={inputCls} rows={2} value={fields.canaraPreparedByAcademicDegrees || ''} onChange={e => handleChange('canaraPreparedByAcademicDegrees', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByAcademicDegreesNA} placeholder="e.g. B.E.(Civil) Utkal, M. Tech(Civil)..." />
              </Field>
              <Field label={<><span>INSTITUTION OF VALUERS MEMBERSHIP</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByIoVMembershipNA || false} onChange={e => { handleChange('canaraPreparedByIoVMembershipNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByIoVMembership', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <textarea className={inputCls} rows={2} value={fields.canaraPreparedByIoVMembership || ''} onChange={e => handleChange('canaraPreparedByIoVMembership', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByIoVMembershipNA} placeholder="e.g. Life, Fellow & Approved Valuer..." />
              </Field>
              <Field label={<><span>INSTITUTION OF ENGINEERS MEMBERSHIP</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByIoEMembershipNA || false} onChange={e => { handleChange('canaraPreparedByIoEMembershipNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByIoEMembership', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <textarea className={inputCls} rows={2} value={fields.canaraPreparedByIoEMembership || ''} onChange={e => handleChange('canaraPreparedByIoEMembership', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByIoEMembershipNA} placeholder="e.g. Member in Institution of Engineer (India)" />
              </Field>
              <Field label={<><span>CHARTERED ENGINEER REGISTRATION NO.</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByCharteredEngNA || false} onChange={e => { handleChange('canaraPreparedByCharteredEngNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByCharteredEng', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <input className={inputCls} value={fields.canaraPreparedByCharteredEng || ''} onChange={e => handleChange('canaraPreparedByCharteredEng', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByCharteredEngNA} placeholder="e.g. Chartered Engineer (Regd. No.-M-156096-9)" />
              </Field>
              <Field label={<><span>BANK EMPANELMENT DETAILS</span><label className="flex items-center gap-1.5 cursor-pointer select-none font-normal normal-case tracking-normal shrink-0"><input type="checkbox" checked={fields.canaraPreparedByBankEmpanelmentNA || false} onChange={e => { handleChange('canaraPreparedByBankEmpanelmentNA', e.target.checked); if (e.target.checked) handleChange('canaraPreparedByBankEmpanelment', 'NA'); }} disabled={isReadOnly} className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">N/A</span></label></>}>
                <input className={inputCls} value={fields.canaraPreparedByBankEmpanelment || ''} onChange={e => handleChange('canaraPreparedByBankEmpanelment', e.target.value)} disabled={isReadOnly || fields.canaraPreparedByBankEmpanelmentNA} placeholder="e.g. Empanelled Valuer of Canara Bank" />
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
      id: 'canara-section-general',
      title: 'Part I — GENERAL',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean, projectCode?: string) => {
        const boundaries = fields.canaraBoundaries || {};
        const dimensions = fields.canaraDimensions || {};

        // Auto-calc: Extent for valuation = MIN(deed area, actual area)
        // Area = SUM of all four directional measurements (East + West + North + South)
        const deedArea = (parseFloat(dimensions.deedEast || '0') || 0)
          + (parseFloat(dimensions.deedWest || '0') || 0)
          + (parseFloat(dimensions.deedNorth || '0') || 0)
          + (parseFloat(dimensions.deedSouth || '0') || 0);
        const actualArea = (parseFloat(dimensions.actualEast || '0') || 0)
          + (parseFloat(dimensions.actualWest || '0') || 0)
          + (parseFloat(dimensions.actualNorth || '0') || 0)
          + (parseFloat(dimensions.actualSouth || '0') || 0);
        const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
        const sftValue = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minArea * 43560);
        const calcExtent = minArea > 0 
          ? `Total Area: Ac. ${minArea} Dec i.e. ${sftValue} Sft` 
          : 'Total Area: Ac. 0.00 Dec i.e. 0.00 Sft';

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 0: Report Header & Bank Details ── */}
            <div className="rounded-xl p-5 space-y-4 border border-slate-200" style={{ backgroundColor: '#f0f4f8' }}>
              <h3 className="font-bold text-gray-700 border-b border-slate-200 pb-2">Report Header & Bank Details</h3>
              
              <Field label={<div className="flex items-center justify-between w-full"><span>ADDRESSEE</span><EditSwitch checked={fields.canaraAddresseeEditOn} onChange={v => { handleChange('canaraAddresseeEditOn', v); if (v) handleChange('canaraAddressee', ''); }} disabled={isReadOnly} /></div>}>
                <div className="relative">
                    <textarea
                      className={`${inputCls} ${!fields.canaraAddresseeEditOn ? 'bg-[#f8f9fa] cursor-not-allowed text-[#475569] font-bold' : ''}`}
                      rows={2}
                      value={fields.canaraAddresseeEditOn ? (fields.canaraAddressee || '') : 'TO, THE BRANCH MANAGER,'}
                      onChange={e => handleChange('canaraAddressee', e.target.value)}
                      readOnly={isReadOnly || !fields.canaraAddresseeEditOn}
                    />
                    {!fields.canaraAddresseeEditOn && (
                      <div className="absolute top-2 right-2 flex items-center pr-1 group">
                        <Lock className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800" />
                      </div>
                    )}
                  </div>
              </Field>

              <Field label="BANK & BRANCH DETAILS">
                <div className="relative" title='>>Prefills from Section 1 (Cover Page)<<.'>
                  <textarea
                    className={`${inputCls} bg-[#f8f9fa] cursor-not-allowed text-[#475569] font-bold`}
                    rows={2}
                    value={fields.canaraBankBranchDetails || ''}
                    readOnly
                  />
                  <div className="absolute top-2 right-2 flex items-center pr-1 group">
                    <Lock className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800" />
                  </div>
                </div>
              </Field>

              <Field label={<div className="flex items-center justify-between w-full"><span>REPORT TITLE</span><EditSwitch checked={fields.canaraReportTitleEditOn} onChange={v => { handleChange('canaraReportTitleEditOn', v); if (v) handleChange('canaraReportTitle', ''); }} disabled={isReadOnly} /></div>}>
                <div className="relative">
                    <textarea
                      className={`${inputCls} ${!fields.canaraReportTitleEditOn ? 'bg-[#f8f9fa] cursor-not-allowed text-[#475569] font-bold' : ''}`}
                      rows={2}
                      value={fields.canaraReportTitleEditOn ? (fields.canaraReportTitle || '') : 'VALUATION REPORT (IN RESPECT OF LAND / SITE AND BUILDING)'}
                      onChange={e => handleChange('canaraReportTitle', e.target.value)}
                      readOnly={isReadOnly || !fields.canaraReportTitleEditOn}
                    />
                    {!fields.canaraReportTitleEditOn && (
                      <div className="absolute top-2 right-2 flex items-center pr-1 group">
                        <Lock className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800" />
                      </div>
                    )}
                  </div>
              </Field>

              <Field label="REF. NO.">
                <div className="relative" title='>>Prefills from Project Case ID<<.'>
                    <input
                      type="text"
                      className={`${inputCls} bg-[#f8f9fa] cursor-not-allowed text-[#475569] font-bold`}
                      value={projectCode || ''}
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 group">
                      <Lock className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800" />
                    </div>
                  </div>
              </Field>

              <Field label="REPORT DATE">
                <div className="relative" title='>>Prefills from Section 1 (Cover Page)<<.'>
                  <input
                    type="date"
                    className={`${inputCls} bg-[#f8f9fa] cursor-not-allowed text-[#475569] font-bold`}
                    value={fields.canaraAsOnDate || ''}
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 group">
                    <Lock className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800" />
                  </div>
                </div>
              </Field>
            </div>

            {/* ── Container 1: Inspection Details ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6f2ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-blue-200 pb-2">Inspection Details</h3>
              <Field label={<div className="flex items-center justify-between w-full"><span>1. Purpose for which the valuation is made</span><EditSwitch checked={fields.canaraEnablePurposeEdit} onChange={v => handleChange('canaraEnablePurposeEdit', v)} disabled={isReadOnly} /></div>}>
                <div className="relative" title={!fields.canaraEnablePurposeEdit ? '>>Prefill from section 1, field "PURPOSE OF VALUATION"<<.' : undefined}>
                    <textarea
                      className={`${inputCls} ${!fields.canaraEnablePurposeEdit ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                      rows={3}
                      value={fields.canaraEnablePurposeEdit ? (fields.canaraPurposeForValuation || '') : (fields.canaraPurposeOfValuation || '')}
                      onChange={e => handleChange('canaraPurposeForValuation', e.target.value)}
                      readOnly={isReadOnly || !fields.canaraEnablePurposeEdit}
                      placeholder="Enter purpose of valuation..."
                    />
                    {!fields.canaraEnablePurposeEdit && (
                      <div className="absolute top-2 right-2 flex items-center pr-1 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    )}
                  </div>
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="2. a) Date of inspection">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.canaraDateOfInspection || ''}
                    onChange={e => handleChange('canaraDateOfInspection', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label={<div className="flex items-center justify-between w-full"><span>2. b) Date on which the valuation is made</span><EditSwitch checked={fields.canaraEnableDateOfValuationEdit} onChange={v => handleChange('canaraEnableDateOfValuationEdit', v)} disabled={isReadOnly} /></div>}>
                <div className="relative" title={!fields.canaraEnableDateOfValuationEdit ? '>>Prefill from section 1, field "AS ON DATE"<<.' : undefined}>
                      <input
                        type="date"
                        className={`${inputCls} ${!fields.canaraEnableDateOfValuationEdit ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                        value={fields.canaraEnableDateOfValuationEdit ? (fields.canaraDateOfValuationMade || '') : (fields.canaraAsOnDate || '')}
                        onChange={e => handleChange('canaraDateOfValuationMade', e.target.value)}
                        readOnly={isReadOnly || !fields.canaraEnableDateOfValuationEdit}
                      />
                      {!fields.canaraEnableDateOfValuationEdit && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                          <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      )}
                    </div>
              </Field>
              </div>
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">3. List of documents produced for perusal</span>
                {['I', 'II', 'III'].map((num) => {
                  const key = `canaraDocument${num}`;
                  const naKey = `${key}NA`;
                  const isNA = fields[naKey] === true;
                  return (
                    <div key={num} className="flex gap-2 items-center bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-sm text-gray-500 w-8 shrink-0">{num.toLowerCase()})</span>
                      <MultiSelectDocs
                        value={fields[key] || ''}
                        onChange={v => handleChange(key, v)}
                        disabled={isReadOnly || isNA}
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                        <input type="checkbox" checked={isNA}
                          onChange={e => { handleChange(naKey, e.target.checked); if (e.target.checked) { handleChange(key, 'NA'); } }}
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
              <Field label={<div className="flex items-center justify-between w-full"><span>4. NAME OF THE OWNER(S) AND HIS / THEIR ADDRESS(ES) WITH PHONE NO. (DETAILS OF SHARE OF EACH OWNER IN CASE OF JOINT OWNERSHIP)</span><EditSwitch checked={fields.canaraEnableOwnerAddressEdit} onChange={v => handleChange('canaraEnableOwnerAddressEdit', v)} disabled={isReadOnly} /></div>}>
                <div className="relative" title={!fields.canaraEnableOwnerAddressEdit ? '>>Prefill from section 1 (Cover Page)<<.' : undefined}>
                  <textarea
                    className={`${inputCls} ${!fields.canaraEnableOwnerAddressEdit ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                    rows={3}
                    value={fields.canaraEnableOwnerAddressEdit ? (fields.canaraOwnerNamesAddresses || '') : (() => {
                      const ownersList = (fields.canaraPropertyOwners || []).map((o: any) => {
                        const parts = [];
                        if (o.name) parts.push(o.name);
                        if (o.relationship && (o.relativeName || o.fatherName)) parts.push(`${o.relationship}: ${o.relativeName || o.fatherName}`);
                        return parts.join(', ');
                      }).filter(Boolean).join(', ');
                      return [ownersList, fields.canaraAddressOfTheProperty ? `At: ${fields.canaraAddressOfTheProperty}` : ''].filter(Boolean).join(', ');
                    })()}
                    onChange={e => handleChange('canaraOwnerNamesAddresses', e.target.value)}
                    readOnly={isReadOnly || !fields.canaraEnableOwnerAddressEdit}
                    placeholder="Enter owner details, addresses, phone numbers..."
                  />
                  {!fields.canaraEnableOwnerAddressEdit && (
                    <div className="absolute top-2 right-2 flex items-center pr-1 group cursor-help">
                      <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  )}
                </div>
              </Field>
              <Field label={<div className="flex items-center justify-between w-full"><span>5. Brief description of the property (Including leasehold / freehold etc)</span><EditSwitch checked={fields.canaraEnableLegalDescEdit} onChange={v => handleChange('canaraEnableLegalDescEdit', v)} disabled={isReadOnly} /></div>}>
                <div className="relative" title={!fields.canaraEnableLegalDescEdit ? '>>Prefill from section 1, field "FULL LEGAL PROPERTY DESCRIPTION"<<.' : undefined}>
                    <textarea
                      className={`${inputCls} ${!fields.canaraEnableLegalDescEdit ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                      rows={3}
                      value={fields.canaraEnableLegalDescEdit ? (fields.canaraBriefDescription || '') : (fields.canaraFullLegalPropertyDescription || '')}
                      onChange={e => handleChange('canaraBriefDescription', e.target.value)}
                      readOnly={isReadOnly || !fields.canaraEnableLegalDescEdit}
                      placeholder="Enter brief property description..."
                    />
                    {!fields.canaraEnableLegalDescEdit && (
                      <div className="absolute top-2 right-2 flex items-center pr-1 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    )}
                  </div>
              </Field>
            </div>

            {/* ── Container 3: Location Details ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#ffffe6' }}>
              <h3 className="font-bold text-gray-700 border-b border-yellow-200 pb-2">Location Details</h3>
              <span className="text-sm font-medium text-gray-700">6. Location of property</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                <Field label="a) Plot No. / Survey No.">
                  <input className={inputCls} value={fields.canaraPlotNo || ''} onChange={e => handleChange('canaraPlotNo', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label={
  <div className="flex items-center gap-3">
    <span>b) Door No.</span>
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={fields.canaraDoorNoNA || false}
        onChange={e => { handleChange('canaraDoorNoNA', e.target.checked); if (e.target.checked) handleChange('canaraDoorNo', 'NA'); else handleChange('canaraDoorNo', ''); }}
        disabled={isReadOnly}
        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
    </label>
  </div>
}>
  <input className={`${inputCls} flex-1`} value={fields.canaraDoorNo || ''} onChange={e => handleChange('canaraDoorNo', e.target.value)} disabled={isReadOnly || fields.canaraDoorNoNA} />
</Field>
                <Field label="c) T. S. No. / Village">
                  <input className={inputCls} value={fields.canaraTSNoVillage || ''} onChange={e => handleChange('canaraTSNoVillage', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="d) Ward / Taluka">
                  <input className={inputCls} value={fields.canaraWardTaluka || ''} onChange={e => handleChange('canaraWardTaluka', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="e) Mandal / District">
                  <input className={inputCls} value={fields.canaraMandalDistrict || ''} onChange={e => handleChange('canaraMandalDistrict', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label={<div className="flex items-center justify-between w-full"><span>7. Postal address of the property</span><EditSwitch checked={fields.canaraEnablePostalAddressEdit} onChange={v => handleChange('canaraEnablePostalAddressEdit', v)} disabled={isReadOnly} /></div>}>
                <div className="flex flex-col gap-3">
                  <div className="relative" title={!fields.canaraEnablePostalAddressEdit ? '>>Prefills from "ADDRESS OF THE PROPERTY" of section 1 cover page<<.' : undefined}>
                    <textarea
                      className={`${inputCls} ${!fields.canaraEnablePostalAddressEdit ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
                      rows={3}
                      value={fields.canaraEnablePostalAddressEdit ? (fields.canaraPostalAddress || '') : (fields.canaraAddressOfTheProperty || '')}
                      onChange={e => handleChange('canaraPostalAddress', e.target.value)}
                      readOnly={isReadOnly || !fields.canaraEnablePostalAddressEdit}
                      placeholder="Enter postal address..."
                    />
                    {!fields.canaraEnablePostalAddressEdit && (
                      <div className="absolute top-2 right-2 flex items-center pr-1 group cursor-help">
                        <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    )}
                  </div>
                  <Field label={
  <div className="flex items-center gap-3">
    <span>PINCODE</span>
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={fields.canaraPinCodeNA || false}
        onChange={e => { handleChange('canaraPinCodeNA', e.target.checked); if (e.target.checked) handleChange('canaraPinCode', 'NA'); else handleChange('canaraPinCode', ''); }}
        disabled={isReadOnly}
        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
    </label>
  </div>
}>
  <input 
    type="text" 
    className={`${inputCls} flex-1`}
    value={fields.canaraPinCode || ''} 
    onChange={e => {
      if (!fields.canaraPinCodeNA) {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        handleChange('canaraPinCode', val);
      }
    }} 
    disabled={isReadOnly || fields.canaraPinCodeNA} 
    placeholder="Enter 6-digit PIN..." 
  />
</Field>
                </div>
              </Field>
            </div>

            {/* ── Container 4: Area Classification & Jurisdiction ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#ffe6e6' }}>
              <h3 className="font-bold text-gray-700 border-b border-red-200 pb-2">Area Classification & Jurisdiction</h3>
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">8. City / Town & Area Classification</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                  <Field label="City / Town">
                    <input className={inputCls} value={fields.canaraCityTown || ''} onChange={e => handleChange('canaraCityTown', e.target.value)} disabled={isReadOnly} placeholder="e.g. Village" />
                  </Field>
                  <Field label="Area Classification (Select One)">
                    <div className="flex flex-wrap items-center gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          checked={fields.canaraResidentialArea === 'Residential Area'}
                          onChange={e => {
                            if (e.target.checked) {
                              handleChange('canaraResidentialArea', 'Residential Area');
                              handleChange('canaraCommercialArea', 'NA');
                              handleChange('canaraIndustrialArea', 'NA');
                            } else {
                              handleChange('canaraResidentialArea', '');
                            }
                          }}
                          disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700">Residential Area</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          checked={fields.canaraCommercialArea === 'Commercial Area'}
                          onChange={e => {
                            if (e.target.checked) {
                              handleChange('canaraCommercialArea', 'Commercial Area');
                              handleChange('canaraResidentialArea', 'NA');
                              handleChange('canaraIndustrialArea', 'NA');
                            } else {
                              handleChange('canaraCommercialArea', '');
                            }
                          }}
                          disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700">Commercial Area</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          checked={fields.canaraIndustrialArea === 'Industrial Area'}
                          onChange={e => {
                            if (e.target.checked) {
                              handleChange('canaraIndustrialArea', 'Industrial Area');
                              handleChange('canaraResidentialArea', 'NA');
                              handleChange('canaraCommercialArea', 'NA');
                            } else {
                              handleChange('canaraIndustrialArea', '');
                            }
                          }}
                          disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700">Industrial Area</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          checked={fields.canaraResidentialArea === 'NA' && fields.canaraCommercialArea === 'NA' && fields.canaraIndustrialArea === 'NA'}
                          onChange={e => {
                            if (e.target.checked) {
                              handleChange('canaraResidentialArea', 'NA');
                              handleChange('canaraCommercialArea', 'NA');
                              handleChange('canaraIndustrialArea', 'NA');
                            } else {
                              handleChange('canaraResidentialArea', '');
                              handleChange('canaraCommercialArea', '');
                              handleChange('canaraIndustrialArea', '');
                            }
                          }}
                          disabled={isReadOnly}
                        />
                        <span className="text-sm text-gray-700 font-medium">N/A</span>
                      </label>
                    </div>
                  </Field>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">9. Classification of the area</span>
                <div className="pl-4 space-y-3">
                  <DropdownWithCustom
                    label="I) HIGH / MIDDLE / POOR"
                    fieldKey="canaraClassHighMiddlePoor"
                    options={['High Class', 'Middle Class', 'Poor Class']}
                    fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                    naKey="canaraClassHighMiddlePoorNA"
                  />
                  <DropdownWithCustom
                    label="II) URBAN / SEMI URBAN / RURAL"
                    fieldKey="canaraClassUrbanRural"
                    options={['Urban Area', 'Semi Urban Area', 'Rural Area']}
                    fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                    naKey="canaraClassUrbanRuralNA"
                  />
                </div>
              </div>
              <DropdownWithCustom
                label="10. Coming under Corporation limit / Village Panchayat / Municipality"
                fieldKey="canaraCorporationLimit"
                options={['Corporation limit', 'Village Panchayat', 'Municipality']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="canaraCorporationLimitNA"
              />
              <DropdownWithCustom
                label="11. Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area"
                fieldKey="canaraCoveredUnderEnactments"
                options={['Yes', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="canaraCoveredUnderEnactmentsNA"
              />
              <DropdownWithCustom
                label="12. In case it is an agricultural land, any conversion to house site plots is contemplated"
                fieldKey="canaraAgriculturalConversion"
                options={['Yes', 'No', 'The Plot is already converted to Homestead']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                naKey="canaraAgriculturalConversionNA"
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
                              onChange={e => handleChange('canaraBoundaries', { ...boundaries, [`sketch${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls}
                              value={boundaries[`verify${dir}`] || ''}
                              onChange={e => handleChange('canaraBoundaries', { ...boundaries, [`verify${dir}`]: e.target.value })}
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
                              onChange={e => handleChange('canaraDimensions', { ...dimensions, [`deed${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                          <td className="border border-gray-300 px-1 py-1">
                            <input className={inputCls}
                              value={dimensions[`actual${dir}`] || ''}
                              onChange={e => handleChange('canaraDimensions', { ...dimensions, [`actual${dir}`]: e.target.value })}
                              disabled={isReadOnly} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">14.2 Latitude, Longitude and Coordinates of the site</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4">
                  <Field label="a. Latitude">
                    <input className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 20.207639" />
                  </Field>
                  <Field label="b. Longitude">
                    <input className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 85.876887" />
                  </Field>
                  <Field label="c. Coordinates">
                    <input className={inputCls} value={fields.canaraCoordinates || ''} onChange={e => handleChange('canaraCoordinates', e.target.value)} disabled={isReadOnly} placeholder="e.g. 20°12'27.5''N 85°52'36.0''E" />
                  </Field>
                </div>
              </div>

              <Field label="15. Extent of the site">
                <input className={inputCls} value={fields.canaraExtentOfSite || ''} onChange={e => handleChange('canaraExtentOfSite', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2000 Sq.ft." />
              </Field>

              <Field label="16. Extent of the site considered for valuation (least of 14 A & 14 B)">
                <div className="relative" title=">>Auto-calculated minimum area from Field 14.1 (As per Deed vs Actual)<<">
                  <textarea
                    className={`${inputCls} pr-10 bg-gray-100 cursor-not-allowed text-gray-600`}
                    rows={2}
                    value={calcExtent}
                    readOnly
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                    <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
              </Field>

              <div>
                <DropdownWithCustom
                  label="17. Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent Received per month."
                  fieldKey="canaraOccupancy"
                  options={['Occupied by Owner', 'Occupied by Tenant', 'Vacant']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                  naKey="canaraOccupancyNA"
                />
                {fields.canaraOccupancyDropdown === 'Occupied by Tenant' && (
                  <div className="mt-2 pl-4">
                    <textarea className={inputCls} rows={2}
                      value={fields.canaraOccupancyDetails || ''}
                      onChange={e => handleChange('canaraOccupancyDetails', e.target.value)}
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
      id: 'canara-section-characteristics',
      title: 'Part II — CHARACTERISTICS OF THE SITE',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 6: Site Environment & Approvals ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6fffa' }}>
              <h3 className="font-bold text-gray-700 border-b border-teal-200 pb-2">Site Environment & Approvals</h3>
              <DropdownWithCustom label="1. Classification of locality" fieldKey="canaraClassificationOfLocality"
                options={['Developed', 'Developing', 'Underdeveloped']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="canaraClassificationOfLocalityNA" />
              <Field label="2. Development of surrounding areas">
                <textarea className={inputCls} rows={2} value={fields.canaraDevelopmentOfSurrounding || ''} onChange={e => handleChange('canaraDevelopmentOfSurrounding', e.target.value)} disabled={isReadOnly} placeholder="Describe surrounding development..." />
              </Field>
              <DropdownWithCustom label="3. Possibility of frequent flooding / sub-merging" fieldKey="canaraFloodingPossibility"
                options={['Yes', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="canaraFloodingPossibilityNA" />
              <Field label="4. Feasibility to the Civic amenities like school, hospital, bus stop, market etc.">
                <div className="flex flex-col gap-2 pl-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {['All the civic amenities are within 2-3 km radious from the site.', 'NA', 'Custom'].map(opt => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="radio" name="canaraCivicAmenities" value={opt} checked={fields.canaraCivicAmenitiesRadio === opt}
                          onChange={() => {
                            handleChange('canaraCivicAmenitiesRadio', opt);
                            if (opt !== 'Custom') handleChange('canaraCivicAmenities', opt);
                            else handleChange('canaraCivicAmenities', fields.canaraCivicAmenitiesCustom || '');
                          }}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-sm font-medium text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {fields.canaraCivicAmenitiesRadio === 'Custom' && (
                    <input className={inputCls} value={fields.canaraCivicAmenitiesCustom || ''} onChange={e => {
                      handleChange('canaraCivicAmenitiesCustom', e.target.value);
                      handleChange('canaraCivicAmenities', e.target.value);
                    }} disabled={isReadOnly} placeholder="Enter custom value..." />
                  )}
                </div>
              </Field>
              <DropdownWithInput label="5. Level of land with topographical Conditions" fieldKey="canaraLevelOfLand"
                options={['Leveled and Plain', 'Sloping', 'Undulating']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="6. Shape of land" fieldKey="canaraShapeOfLand"
                options={['Regular in Size', 'Irregular in Size']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="7. Type of use to which it can be put" fieldKey="canaraTypeOfUse"
                options={['Residential Purpose', 'Commercial Purpose', 'Industrial Purpose', 'Agriculture Purpose']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="8. Any usage restriction" fieldKey="canaraUsageRestriction"
                options={['None', 'Industrial', 'Commercial']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="canaraUsageRestrictionNA" />
              <DropdownWithCustom label="9. Is plot in town planning approved layout?" fieldKey="canaraTownPlanningApproved"
                options={['Yes', 'No']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="10. Corner plot or intermittent plot?" fieldKey="canaraCornerOrIntermittent"
                options={['Corner Plot', 'Intermittent Plot']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
            </div>

            {/* ── Container 7: Infrastructure & Utilities ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fff0e6' }}>
              <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2">Infrastructure & Utilities</h3>
              <DropdownWithCustom label="11. Road facilities" fieldKey="canaraRoadFacilities"
                options={['Yes, Available at the site', 'No, Not Available at the site']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="12. Type of road available at present" fieldKey="canaraTypeOfRoad"
                options={['Morrum Road', 'Concrete Road', 'Tar Road', 'Earthen Road']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithInput label="13. Width of road – is it below 20 ft. or more than 20 ft." fieldKey="canaraWidthOfRoad"
                options={['Below 20 ft', '20 ft wide Road', 'More than 20 ft']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="14. Is it a land – locked land?" fieldKey="canaraLandLocked"
                options={['Yes, It is a locked land', 'No, It is free land']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="15. Water potentiality" fieldKey="canaraWaterPotentiality"
                options={['Good', 'Average', 'Poor']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="16. Underground sewerage system" fieldKey="canaraSewerage"
                options={['Yes, Available at the site', 'No, Not Available at the site']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              <DropdownWithCustom label="17. Is power supply available at the site?" fieldKey="canaraPowerSupply"
                options={['Yes, Available at the site', 'No, Not Available at the site']}
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
            </div>

            {/* ── Container 8: Remarks ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f9e6ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-purple-200 pb-2">Remarks</h3>
              <Field label="18. Advantage of the site">
                <textarea className={inputCls} rows={3} value={fields.canaraAdvantageOfSite || ''} onChange={e => handleChange('canaraAdvantageOfSite', e.target.value)} disabled={isReadOnly} placeholder="Describe advantages..." />
              </Field>
              <Field label="19. Special remarks, if any, like threat of acquisition of land for public service purposes, road widening or applicability of CRZ provisions etc. (Distance from sea-coast / tidal level must be incorporated)">
                <div className="flex gap-2 items-start">
                  <textarea className={`${inputCls} flex-1`} rows={3} value={fields.canaraSpecialRemarks || ''} onChange={e => handleChange('canaraSpecialRemarks', e.target.value)}
                    disabled={isReadOnly || fields.canaraSpecialRemarksNA} placeholder="Enter special remarks..." />
                  <label className="flex items-center gap-1.5 mt-2 cursor-pointer select-none shrink-0">
                    <input type="checkbox" checked={fields.canaraSpecialRemarksNA || false}
                      onChange={e => { handleChange('canaraSpecialRemarksNA', e.target.checked); if (e.target.checked) handleChange('canaraSpecialRemarks', 'NA'); }}
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
      id: 'canara-section-land',
      title: 'Part A — Valuation of Land',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const dimensions = fields.canaraDimensions || {};

        // ── Field 1: Size of plot — prefill from 14.1 "As per the Deed" ──
        const deedNorth = dimensions.deedNorth || '';
        const deedSouth = dimensions.deedSouth || '';
        const deedEast = dimensions.deedEast || '';
        const deedWest = dimensions.deedWest || '';
        const calcNS = (deedNorth && deedSouth && deedNorth !== deedSouth) ? `${deedNorth} & ${deedSouth}` : (deedNorth || deedSouth || '');
        const calcEW = (deedEast && deedWest && deedEast !== deedWest) ? `${deedEast} & ${deedWest}` : (deedEast || deedWest || '');
        const displayNS = fields.canaraLandSizeNSEditOn ? (fields.canaraLandSizeNS || '') : calcNS;
        const displayEW = fields.canaraLandSizeEWEditOn ? (fields.canaraLandSizeEW || '') : calcEW;

        // ── Field 2: Total extent — mirror Field 16 string ──
        const deedArea = (parseFloat(deedEast || '0') || 0)
          + (parseFloat(deedWest || '0') || 0)
          + (parseFloat(deedNorth || '0') || 0)
          + (parseFloat(deedSouth || '0') || 0);
        const actualArea = (parseFloat(dimensions.actualEast || '0') || 0)
          + (parseFloat(dimensions.actualWest || '0') || 0)
          + (parseFloat(dimensions.actualNorth || '0') || 0)
          + (parseFloat(dimensions.actualSouth || '0') || 0);
        const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
        const areaSft = minArea * 43560;
        const areaSftFormatted = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(areaSft);
        const calcTotalExtent = minArea > 0
          ? `Total Area: Ac. ${minArea} Dec i.e. ${areaSftFormatted} Sft`
          : 'Total Area: Ac. 0.00 Dec i.e. 0.00 Sft';
        const displayTotalExtent = fields.canaraLandTotalExtentEditOn ? (fields.canaraLandTotalExtent || '') : calcTotalExtent;

        // ── Field 4: Guideline rate calculation ──
        const acreValue = parseFloat(fields.canaraGovtBenchmarkPerAcre || '0') || 0;
        const sftRate = acreValue > 0 ? Math.round(acreValue / 43560) : 0;
        const totalGuideline = areaSft > 0 && sftRate > 0 ? Math.round(areaSft * sftRate) : 0;
        const fmtINR = (v: number) => new Intl.NumberFormat('en-IN').format(v);
        const guidelineStr1 = acreValue > 0
          ? `Govt. Benchmark Value: Rs.${fmtINR(acreValue)}/- Per Acre i.e. Rs.${fmtINR(sftRate)}/- Per Sft`
          : 'Govt. Benchmark Value: Rs.00.00/- Per Acre i.e. Rs.00.00/- Per Sft';
        const guidelineStr2 = totalGuideline > 0
          ? `Guideline Value of Land= ${areaSftFormatted} Sft X Rs.${fmtINR(sftRate)}/- Per Sft = Rs.${fmtINR(totalGuideline)}/-`
          : 'Guideline Value of Land= 00.00 Sft X Rs.00.00/- Per Sft = Rs.00.00/-';

        // ── Field 5: Validation — parse min/max from Field 3 ──
        const marketRateText = fields.canaraPrevailingMarketRate || '';
        let rateMin = -Infinity;
        let rateMax = Infinity;
        let singleRateValue: number | null = null;
        // Try to extract a range like "Rs.1700/- to Rs.1900/-" or "1700 to 1900"
        const rangeMatch = marketRateText.match(/(?:Rs\.?\s*)?([\d,]+)\/?-?\s*(?:to|-)\s*(?:Rs\.?\s*)?([\d,]+)/i);
        if (rangeMatch) {
          rateMin = parseFloat(rangeMatch[1].replace(/,/g, '')) || -Infinity;
          rateMax = parseFloat(rangeMatch[2].replace(/,/g, '')) || Infinity;
          if (rateMin > rateMax) { const tmp = rateMin; rateMin = rateMax; rateMax = tmp; }
        } else {
          // Try to extract a single numeric value
          const singleMatch = marketRateText.match(/(?:Rs\.?\s*)?([\d,]+)/);
          if (singleMatch) {
            singleRateValue = parseFloat(singleMatch[1].replace(/,/g, ''));
          }
        }
        // Prefill Field 5 if single value found and field is empty
        if (singleRateValue !== null && !fields.canaraAdoptedRate && !fields._canaraAdoptedRateUserCleared) {
          handleChange('canaraAdoptedRate', String(singleRateValue));
        }
        const adoptedRate = parseFloat(fields.canaraAdoptedRate || '0') || 0;
        const adoptedRateValid = adoptedRate === 0 || (adoptedRate >= rateMin && adoptedRate <= rateMax);

        // ── Field 6: Estimated value of land ──
        const estimatedValue = areaSft > 0 && adoptedRate > 0 ? Math.round(areaSft * adoptedRate) : 0;
        const calcEstimatedStr = estimatedValue > 0
          ? `Total Market Value of Land: ${areaSftFormatted} Sft X Rs.${fmtINR(adoptedRate)}/- Per Sft = Rs.${fmtINR(estimatedValue)}/-`
          : 'Total Market Value of Land: 0.00 Sft X Rs.0/- Per Sft = Rs.0/-';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6ebff' }}>
              <h3 className="font-bold text-gray-700 border-b border-indigo-200 pb-2">Land Valuation Metrics</h3>

              {/* ── Field 1: Size of plot ── */}
              <div>
                <span className="text-sm font-medium text-gray-700">1. Size of plot</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pl-4">
                  <Field label={<div className="flex items-center justify-between w-full"><span>North & South</span><EditSwitch checked={fields.canaraLandSizeNSEditOn || false} onChange={v => { handleChange('canaraLandSizeNSEditOn', v); if (v) handleChange('canaraLandSizeNS', ''); }} disabled={isReadOnly} /></div>}>
                    <div className="relative" title={!fields.canaraLandSizeNSEditOn ? '>>Prefills from Field 14.1 (Dimensions of the site)<<' : undefined}>
                      <input
                        className={`${inputCls} pr-10 ${!fields.canaraLandSizeNSEditOn ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}`}
                        value={displayNS}
                        onChange={e => handleChange('canaraLandSizeNS', e.target.value)}
                        disabled={isReadOnly}
                        readOnly={!fields.canaraLandSizeNSEditOn}
                        placeholder={fields.canaraLandSizeNSEditOn ? 'Enter value...' : ''}
                        title={!fields.canaraLandSizeNSEditOn ? '>>Prefills from Field 14.1 (Dimensions of the site)<<' : undefined}
                      />
                      {!fields.canaraLandSizeNSEditOn && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                          <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                        </div>
                      )}
                    </div>
                  </Field>
                  <Field label={<div className="flex items-center justify-between w-full"><span>East & West</span><EditSwitch checked={fields.canaraLandSizeEWEditOn || false} onChange={v => { handleChange('canaraLandSizeEWEditOn', v); if (v) handleChange('canaraLandSizeEW', ''); }} disabled={isReadOnly} /></div>}>
                    <div className="relative" title={!fields.canaraLandSizeEWEditOn ? '>>Prefills from Field 14.1 (Dimensions of the site)<<' : undefined}>
                      <input
                        className={`${inputCls} pr-10 ${!fields.canaraLandSizeEWEditOn ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : ''}`}
                        value={displayEW}
                        onChange={e => handleChange('canaraLandSizeEW', e.target.value)}
                        disabled={isReadOnly}
                        readOnly={!fields.canaraLandSizeEWEditOn}
                        placeholder={fields.canaraLandSizeEWEditOn ? 'Enter value...' : ''}
                        title={!fields.canaraLandSizeEWEditOn ? '>>Prefills from Field 14.1 (Dimensions of the site)<<' : undefined}
                      />
                      {!fields.canaraLandSizeEWEditOn && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                          <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                        </div>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              {/* ── Field 2: Total extent of the plot ── */}
              <AutoCalcField
                label="2. Total extent of the plot"
                fieldKey="canaraLandTotalExtent"
                fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                calcValue={calcTotalExtent}
                hoverText=">>Prefills exact string from Field 16 (General Section)<<."
              />

              {/* ── Field 3: Prevailing market rate ── */}
              <Field label="3. Prevailing market rate (Along with details /reference of at least two latest deals/ transactions with respect to adjacent properties in the areas)">
                <textarea className={inputCls} rows={3} value={fields.canaraPrevailingMarketRate || ''} onChange={e => handleChange('canaraPrevailingMarketRate', e.target.value)} disabled={isReadOnly} placeholder="Enter market rate details with references..." />
              </Field>

              {/* ── Field 4: Guideline rate — structured calculation ── */}
              <div>
                <span className="text-sm font-medium text-gray-700">4. Guideline rate obtained from the Registrar's Office (an evidence thereof to be enclosed)</span>
                <div className="pl-4 mt-2 space-y-3">
                  <Field label="Govt. Benchmark Value (Per Acre)">
                    <input
                      className={inputCls}
                      type="number"
                      value={fields.canaraGovtBenchmarkPerAcre || ''}
                      onChange={e => handleChange('canaraGovtBenchmarkPerAcre', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 25788000"
                    />
                  </Field>
                  <div className="relative" title=">>Auto-calculated from Benchmark Value / 43560<<">
                    <textarea
                      className={`${inputCls} pr-10 bg-gray-100 text-gray-700 cursor-not-allowed`}
                      rows={2}
                      value={guidelineStr1}
                      readOnly
                      title=">>Auto-calculated from Benchmark Value / 43560<<"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                      <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                    </div>
                  </div>
                  <div className="relative" title=">>Auto-calculated: Area (Sft) x Rate Per Sft<<">
                    <textarea
                      className={`${inputCls} pr-10 bg-gray-100 text-gray-700 cursor-not-allowed`}
                      rows={2}
                      value={guidelineStr2}
                      readOnly
                      title=">>Auto-calculated: Area (Sft) x Rate Per Sft<<"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                      <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Field 5: Assessed / adopted rate with validation ── */}
              <Field label="5. Assessed / adopted rate of valuation">
                <input
                  className={`${inputCls} ${!adoptedRateValid ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-300 focus:border-red-500' : ''}`}
                  type="number" step="0.01"
                  value={fields.canaraAdoptedRate || ''}
                  onChange={e => {
                    handleChange('canaraAdoptedRate', e.target.value);
                    handleChange('_canaraAdoptedRateUserCleared', true);
                  }}
                  disabled={isReadOnly}
                  placeholder={singleRateValue !== null ? `Suggested: ${singleRateValue}` : 'e.g. 1800'}
                />
                {!adoptedRateValid && (
                  <p className="text-red-600 text-xs mt-1 font-medium">
                    Error: The adopted rate must fall between the prevailing market range of Rs.{fmtINR(rateMin)} and Rs.{fmtINR(rateMax)}.
                  </p>
                )}
              </Field>

              {/* ── Field 6: Estimated value of land (strict read-only) ── */}
              <Field label="6. Estimated value of land">
                <div className="relative" title=">>Auto-calculated: Area (Sft) x Adopted Rate<<">
                  <textarea
                    className={`${inputCls} pr-10 bg-gray-100 text-gray-700 cursor-not-allowed`}
                    rows={2}
                    value={calcEstimatedStr}
                    readOnly
                    title=">>Auto-calculated: Area (Sft) x Adopted Rate<<"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help">
                    <Lock className="w-4 h-4 text-emerald-800 group-hover:text-emerald-900" />
                  </div>
                </div>
              </Field>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 5: PART B — VALUATION OF BUILDING  (Containers 10-12)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'canara-section-building',
      title: 'Part B — Valuation of Building',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const currentYear = new Date().getFullYear();
        const yearOfConstruction = extractYearOfConstruction(fields.canaraYearOfConstruction || '');
        const calcAge = yearOfConstruction > 0 ? (currentYear - yearOfConstruction) : 0;

        const structuralRows = [
          { label: '1. Foundation', key: 'foundation', options: ['Column Foundation', 'Load Bearing Foundation'] },
          { label: '2. Basement', key: 'basement', options: ['Yes', 'No'] },
          { label: '3. Superstructure', key: 'superstructure', options: ['Brick Masonary Super Structure'] },
          { label: '4. Joinery / Doors & Windows', key: 'joinery', options: [], isTextarea: true },
          { label: '5. RCC works', key: 'rccWorks', options: ['Lintel, Chajja, Beam'] },
          { label: '6. Plastering', key: 'plastering', options: ['Cement Plastering'] },
          { label: '7. Flooring, Skirting, dadoing', key: 'flooring', options: ['VT Flooring', 'Marble Flooring', 'Tiles Flooring'] },
          { label: '8. Special finish as marble, granite, wooden paneling, grills, etc', key: 'specialFinish', options: ['Yes', 'No'], hasInput: true },
          { label: '9. Roofing including weather proof course', key: 'roofing', options: ['RCC Roof', 'Asbestos Roof'] },
          { label: '10. Drainage', key: 'drainage', options: ['Surface Drainage', 'Underground Drainage'] },
        ];

        const structural = fields.canaraStructuralDetails || {};
        const updateStructural = (key: string, col: string, val: string) => {
          handleChange('canaraStructuralDetails', { ...structural, [`${key}_${col}`]: val });
        };
        const updateStructuralMultiple = (updates: Record<string, string>) => {
          handleChange('canaraStructuralDetails', { ...structural, ...updates });
        };

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 10: Technical Details ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f0ffe6' }}>
              <h3 className="font-bold text-gray-700 border-b border-green-200 pb-2">Technical Details of the Building</h3>
              <span className="text-sm font-medium text-gray-700">1. Technical details of the building</span>
              <div className="pl-4 space-y-3">
                <DropdownWithCustom label="a) Type of Building" fieldKey="canaraBuildingType"
                  options={['Residential Building', 'Commercial Building', 'Industrial Building']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                <DropdownWithCustom label="b) Type of construction" fieldKey="canaraConstructionType"
                  options={['Load bearing', 'RCC Frame', 'Steel Framed']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                <Field label="c) Year of construction">
                  <textarea className={inputCls} rows={2} value={fields.canaraYearOfConstruction || ''} onChange={e => handleChange('canaraYearOfConstruction', e.target.value)} disabled={isReadOnly} placeholder="" />
                </Field>
                <Field label="d) Number of floors and height of each floor including basement, if any">
                  <textarea className={inputCls} rows={2} value={fields.canaraFloorsDescription || ''} onChange={e => handleChange('canaraFloorsDescription', e.target.value)} disabled={isReadOnly} placeholder="" />
                </Field>
                <div>
                  <span className="text-sm font-medium text-gray-700">e) Plinth area floor-wise</span>
                  <div className="pl-4 mt-2 space-y-3">
                    <Field label="As Per Approval">
                      <textarea className={inputCls} rows={2} value={fields.canaraPlinthAreaApproval || ''} onChange={e => handleChange('canaraPlinthAreaApproval', e.target.value)} disabled={isReadOnly} placeholder="" />
                    </Field>
                    <Field label="As Per Actual">
                      <textarea className={inputCls} rows={2} value={fields.canaraPlinthAreaActual || ''} onChange={e => handleChange('canaraPlinthAreaActual', e.target.value)} disabled={isReadOnly} placeholder="" />
                    </Field>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">f) Condition of the building</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pl-4">
                    <DropdownWithCustom label="i) Exterior" fieldKey="canaraConditionExterior"
                      options={['Excellent', 'Good', 'Normal', 'Poor']}
                      fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                    <DropdownWithCustom label="ii) Interior" fieldKey="canaraConditionInterior"
                      options={['Excellent', 'Good', 'Normal', 'Poor']}
                      fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                  </div>
                </div>
                <Field label={
  <div className="flex items-center gap-3">
    <span>g) Date of issue and validity of layout of approved map / plan</span>
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={fields.canaraApprovedMapDateNA || false}
        onChange={e => { handleChange('canaraApprovedMapDateNA', e.target.checked); if (e.target.checked) handleChange('canaraApprovedMapDate', 'NA'); else handleChange('canaraApprovedMapDate', ''); }}
        disabled={isReadOnly}
        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
    </label>
  </div>
}>
  <input className={`${inputCls} flex-1`} value={fields.canaraApprovedMapDate || ''} onChange={e => handleChange('canaraApprovedMapDate', e.target.value)} disabled={isReadOnly || fields.canaraApprovedMapDateNA} />
</Field>
                <Field label={
  <div className="flex items-center gap-3">
    <span>h) Approved map / plan issuing authority</span>
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={fields.canaraApprovedMapAuthorityNA || false}
        onChange={e => { handleChange('canaraApprovedMapAuthorityNA', e.target.checked); if (e.target.checked) handleChange('canaraApprovedMapAuthority', 'NA'); else handleChange('canaraApprovedMapAuthority', ''); }}
        disabled={isReadOnly}
        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NA</span>
    </label>
  </div>
}>
  <textarea className={`${inputCls} flex-1`} rows={2} value={fields.canaraApprovedMapAuthority || ''} onChange={e => handleChange('canaraApprovedMapAuthority', e.target.value)} disabled={isReadOnly || fields.canaraApprovedMapAuthorityNA} />
</Field>
                <DropdownWithCustom label="i) Whether genuineness or authenticity of approved map / plan is verified" fieldKey="canaraApprovedMapVerified"
                  options={['Yes, Verified', 'No, Not Verified']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="canaraApprovedMapVerifiedNA" />
                <DropdownWithCustom label="j) Any other comments by our empanelled valuers on authentic of approved plan" fieldKey="canaraApprovedMapComments"
                  options={['The approval plan is authenticated', 'The approval plan is not authenticated']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey="canaraApprovedMapCommentsNA" />
                <AutoCalcField
                  label="k) Age of the Building"
                  fieldKey="canaraBuildingAge"
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly}
                  calcValue={calcAge > 0 ? `${calcAge} years` : '0'}
                  hoverText={`>>Auto calculates from [Current Year (${currentYear})] - [Year of construction]<<.`}
                />
                <Field label="l) Residual life of the building">
                  <input className={inputCls} value={fields.canaraResidualLife || ''} onChange={e => handleChange('canaraResidualLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 40 years" />
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
                            <input type="checkbox" checked={fields.canaraOtherFloorsNA || false}
                              onChange={e => handleChange('canaraOtherFloorsNA', e.target.checked)}
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
                                  if (v === 'custom') {
                                    updateStructuralMultiple({ [`${row.key}_groundDropdown`]: v });
                                  } else {
                                    updateStructuralMultiple({ [`${row.key}_groundDropdown`]: v, [`${row.key}_ground`]: v });
                                  }
                                }}
                                disabled={isReadOnly}>
                                <option value="">Select</option>
                                {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="custom">Custom</option>
                              </select>
                              {structural[`${row.key}_groundDropdown`] === 'custom' && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_groundCustom`] || ''}
                                  onChange={e => updateStructuralMultiple({ [`${row.key}_groundCustom`]: e.target.value, [`${row.key}_ground`]: e.target.value })}
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
                              disabled={isReadOnly || fields.canaraOtherFloorsNA} placeholder="Enter details..." />
                          ) : row.options.length > 0 ? (
                            <div>
                              <select className={inputCls}
                                value={structural[`${row.key}_otherDropdown`] || ''}
                                onChange={e => {
                                  const v = e.target.value;
                                  if (v === 'custom') {
                                    updateStructuralMultiple({ [`${row.key}_otherDropdown`]: v });
                                  } else {
                                    updateStructuralMultiple({ [`${row.key}_otherDropdown`]: v, [`${row.key}_other`]: v });
                                  }
                                }}
                                disabled={isReadOnly || fields.canaraOtherFloorsNA}>
                                <option value="">Select</option>
                                {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="custom">Custom</option>
                              </select>
                              {structural[`${row.key}_otherDropdown`] === 'custom' && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_otherCustom`] || ''}
                                  onChange={e => updateStructuralMultiple({ [`${row.key}_otherCustom`]: e.target.value, [`${row.key}_other`]: e.target.value })}
                                  disabled={isReadOnly || fields.canaraOtherFloorsNA} placeholder="Custom..." />
                              )}
                              {row.hasInput && (
                                <input className={`${inputCls} mt-1`}
                                  value={structural[`${row.key}_otherInput`] || ''}
                                  onChange={e => updateStructural(row.key, 'otherInput', e.target.value)}
                                  disabled={isReadOnly || fields.canaraOtherFloorsNA} placeholder="Details..." />
                              )}
                            </div>
                          ) : (
                            <input className={inputCls}
                              value={structural[`${row.key}_other`] || ''}
                              onChange={e => updateStructural(row.key, 'other', e.target.value)}
                              disabled={isReadOnly || fields.canaraOtherFloorsNA} />
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
                <DropdownWithCustom label="1. Compound wall (Status)" fieldKey="canaraCompoundWall"
                  options={['Yes', 'No']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                {(fields.canaraCompoundWallDropdown === 'Yes' || fields.canaraCompoundWall === 'Yes') && (
                  <div className="pl-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field label="Height">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} value={fields.canaraCompoundWallHeight || ''} onChange={e => handleChange('canaraCompoundWallHeight', e.target.value)} disabled={isReadOnly || fields.canaraCompoundWallHeightNA} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields.canaraCompoundWallHeightNA || false} onChange={e => { handleChange('canaraCompoundWallHeightNA', e.target.checked); if (e.target.checked) handleChange('canaraCompoundWallHeight', 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-xs text-gray-500">N/A</span>
                        </label>
                      </div>
                    </Field>
                    <Field label="Length">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} value={fields.canaraCompoundWallLength || ''} onChange={e => handleChange('canaraCompoundWallLength', e.target.value)} disabled={isReadOnly || fields.canaraCompoundWallLengthNA} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields.canaraCompoundWallLengthNA || false} onChange={e => { handleChange('canaraCompoundWallLengthNA', e.target.checked); if (e.target.checked) handleChange('canaraCompoundWallLength', 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                          <span className="text-xs text-gray-500">N/A</span>
                        </label>
                      </div>
                    </Field>
                    <Field label="Type of construction">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputCls} flex-1`} value={fields.canaraCompoundWallType || ''} onChange={e => handleChange('canaraCompoundWallType', e.target.value)} disabled={isReadOnly || fields.canaraCompoundWallTypeNA} />
                        <label className="flex items-center gap-1 cursor-pointer select-none shrink-0">
                          <input type="checkbox" checked={fields.canaraCompoundWallTypeNA || false} onChange={e => { handleChange('canaraCompoundWallTypeNA', e.target.checked); if (e.target.checked) handleChange('canaraCompoundWallType', 'NA'); }} disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
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
                    { label: 'Type of wiring', key: 'canaraElectricalWiring', options: ['Concealed', 'Open'] },
                    { label: 'Class of fittings (superior / ordinary / poor)', key: 'canaraElectricalFittings', options: ['Superior', 'Ordinary', 'Poor'] },
                  ].map(item => (
                    <DropdownWithCustom key={item.key} label={item.label} fieldKey={item.key}
                      options={item.options}
                      fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} naKey={`${item.key}NA`} />
                  ))}
                  {[
                    { label: 'Number of light points', key: 'canaraElectricalLightPoints', type: 'number' },
                    { label: 'Fan points', key: 'canaraElectricalFanPoints', type: 'number' },
                    { label: 'Spare plug points', key: 'canaraElectricalPlugPoints', type: 'number' },
                    { label: 'Any other item', key: 'canaraElectricalOther', type: 'text' },
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
                <DropdownWithCustom label="3. Plumbing installation (Status)" fieldKey="canaraPlumbing"
                  options={['Yes', 'No']}
                  fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
                {(fields.canaraPlumbingDropdown === 'Yes' || fields.canaraPlumbing === 'Yes') && (
                  <div className="pl-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'a) No. of water closets and their type', key: 'canaraWaterClosets', type: 'text' },
                      { label: 'b) No. of wash basins', key: 'canaraWashBasins', type: 'number' },
                      { label: 'c) No. of urinals', key: 'canaraUrinals', type: 'number' },
                      { label: 'd) No. of bath tubs', key: 'canaraBathTubs', type: 'number' },
                      { label: 'e) Water meter, taps, etc.', key: 'canaraWaterMeterTaps', type: 'text' },
                      { label: 'f) Any other fixtures', key: 'canaraOtherFixtures', type: 'text' },
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
      id: 'canara-section-valuation-details',
      title: 'Details of Valuation & Amenities',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // ── Container 13: Building Valuation (Dynamic rows) ──
        const buildingRows: any[] = fields.canaraBuildingValuationRows || [{ particulars: '', particularsDropdown: '', plinthArea: '', roofHeight: '', replacementRate: '' }];
        const currentYear = new Date().getFullYear();
        const yearOfConstruction = extractYearOfConstruction(fields.canaraYearOfConstruction || '');
        const buildingAge = fields.canaraBuildingAgeEditOn ? (parseFloat(fields.canaraBuildingAge || '0') || 0) : (yearOfConstruction > 0 ? currentYear - yearOfConstruction : 0);

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
        const amenitiesTotal = getTableTotal('canaraAmenity_', amenityItems);
        const miscTotal = getTableTotal('canaraMisc_', miscItems);
        const servicesTotal = getTableTotal('canaraService_', serviceItems);

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 13: Building Valuation Table ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fdf5e6' }}>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2 flex-1">Building Valuation Table</h3>
                <button type="button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                  onClick={() => handleChange('canaraBuildingValuationRows', [...buildingRows, { particulars: '', particularsDropdown: '', plinthArea: '', roofHeight: '', replacementRate: '' }])}
                  disabled={isReadOnly}>
                  + Add Row
                </button>
              </div>
              <DirectFileUploadToggle modeKey="canaraBuildingValuationMode" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              {fields.canaraBuildingValuationMode !== 'annexure' && (<>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 w-[16%]">PARTICULARS OF ITEMS</th>
                      <th className="border border-gray-300 px-2 py-2 w-[10%]">PLINTH AREA IN SQFT</th>
                      <th className="border border-gray-300 px-2 py-2 w-[8%]">ROOF HEIGHT</th>
                      <th className="border border-gray-300 px-2 py-2 w-[8%]" title=">>Prefill from section 5, field 'Age of the Building'<<.">AGE OF THE BUILDING IN YEARS</th>
                      <th className="border border-gray-300 px-2 py-2 w-[10%]">REPLACEMENT RATE OF CONSTRUCTION</th>
                      <th className="border border-gray-300 px-2 py-2 w-[13%]" title=">>Auto calculates from [PLINTH AREA (SQFT)] * [REPLACEMENT RATE]<<.">ESTIMATED REPLACEMENT COST OF CONSTRUCTION</th>
                      <th className="border border-gray-300 px-2 py-2 w-[13%]" title=">>Auto calculates from [EST. COST] * 0.01 * [AGE (YRS)]<<.">DEPRECIATION AMOUNT IN RS. (1% per Anm)</th>
                      <th className="border border-gray-300 px-2 py-2 w-[13%]" title=">>Auto calculates from [EST. COST] - [DEPRECIATION]<<.">NET VALUE AFTER DEPRECIATION</th>
                      <th className="border border-gray-300 px-2 py-2 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingRows.map((row: any, idx: number) => {
                      const calcs = getRowCalcs(row);
                      const updateRow = (key: string, val: any) => {
                        const rows = [...buildingRows];
                        rows[idx] = { ...rows[idx], [key]: val };
                        handleChange('canaraBuildingValuationRows', rows);
                      };
                      const updateRowMultiple = (updates: Record<string, any>) => {
                        const rows = [...buildingRows];
                        rows[idx] = { ...rows[idx], ...updates };
                        handleChange('canaraBuildingValuationRows', rows);
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
                                  const val = e.target.value;
                                  updateRowMultiple({
                                    particularsDropdown: val,
                                    particulars: val === 'Custom' ? '' : val
                                  });
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
                              <input className={`${inputCls} bg-gray-100 text-gray-700 cursor-not-allowed pr-6`}
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
                              <input className={`${inputCls} pr-14 ${!row.estCostEditOn ? 'bg-gray-100 text-gray-700' : ''}`}
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
                              <input className={`${inputCls} pr-14 ${!row.depreciationEditOn ? 'bg-gray-100 text-gray-700' : ''}`}
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
                              <input className={`${inputCls} pr-14 ${!row.netValueEditOn ? 'bg-gray-100 text-gray-700' : ''}`}
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
                              <button type="button" onClick={() => { const r = [...buildingRows]; r.splice(idx, 1); handleChange('canaraBuildingValuationRows', r); }}
                                disabled={isReadOnly} className="text-red-500 hover:text-red-700 text-lg font-bold">×</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={7} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <PrefillField label="" value={calcBuildingTotal.toFixed(2)} isReadOnly={isReadOnly}
                          hoverText=">>Auto calculates from SUM([NET VALUE AFTER DEPRECIATION] of all rows)<<." />
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </>)}
            </div>

            {/* ── Container 14: Part D - Amenities ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f0f8ff' }}>
              <h3 className="font-bold text-gray-700 border-b border-blue-200 pb-2">Part D — Amenities</h3>
              <DirectFileUploadToggle modeKey="canaraAmenitiesMode" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              {fields.canaraAmenitiesMode !== 'annexure' && (<>
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
                          <input className={inputCls} type="number" step="0.01" value={fields[`canaraAmenity_${idx}`] || ''} onChange={e => handleChange(`canaraAmenity_${idx}`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <PrefillField label="" value={amenitiesTotal.toFixed(2)} isReadOnly={isReadOnly}
                          hoverText=">>Auto calculates from SUM([AMOUNT] of all Amenities rows)<<." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </>)}
            </div>

            {/* ── Container 15: Part E - Miscellaneous ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f5fffa' }}>
              <h3 className="font-bold text-gray-700 border-b border-green-200 pb-2">Part E — Miscellaneous</h3>
              <DirectFileUploadToggle modeKey="canaraMiscMode" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              {fields.canaraMiscMode !== 'annexure' && (<>
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
                          <input className={inputCls} type="number" step="0.01" value={fields[`canaraMisc_${idx}`] || ''} onChange={e => handleChange(`canaraMisc_${idx}`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <PrefillField label="" value={miscTotal.toFixed(2)} isReadOnly={isReadOnly}
                          hoverText=">>Auto calculates from SUM([AMOUNT] of all Miscellaneous rows)<<." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </>)}
            </div>

            {/* ── Container 16: Part F - Services ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fff5ee' }}>
              <h3 className="font-bold text-gray-700 border-b border-orange-200 pb-2">Part F — Services</h3>
              <DirectFileUploadToggle modeKey="canaraServicesMode" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              {fields.canaraServicesMode !== 'annexure' && (<>
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
                          <input className={inputCls} type="number" step="0.01" value={fields[`canaraService_${idx}`] || ''} onChange={e => handleChange(`canaraService_${idx}`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <PrefillField label="" value={servicesTotal.toFixed(2)} isReadOnly={isReadOnly}
                          hoverText=">>Auto calculates from SUM([AMOUNT] of all Services rows)<<." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </>)}
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 7: TOTAL ABSTRACT & REMARKS (Containers 17-18)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'canara-section-abstract',
      title: 'TOTAL ABSTRACT & REMARKS',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const acreValue = parseFloat(fields.canaraGovtBenchmarkPerAcre || '0') || 0;
        const sftRate = acreValue > 0 ? Math.round(acreValue / 43560) : 0;
        
        // We need areaSft from landMarketValue calculation
        const dimensions = fields.canaraDimensions || {};
        const deedArea = (parseFloat(dimensions.deedEast || '0') || 0) + (parseFloat(dimensions.deedWest || '0') || 0) + (parseFloat(dimensions.deedNorth || '0') || 0) + (parseFloat(dimensions.deedSouth || '0') || 0);
        const actualArea = (parseFloat(dimensions.actualEast || '0') || 0) + (parseFloat(dimensions.actualWest || '0') || 0) + (parseFloat(dimensions.actualNorth || '0') || 0) + (parseFloat(dimensions.actualSouth || '0') || 0);
        const minArea = (deedArea > 0 && actualArea > 0) ? Math.min(deedArea, actualArea) : (deedArea || actualArea || 0);
        const areaSft = minArea * 43560;
        
        const landGovtValue = areaSft > 0 && sftRate > 0 ? Math.round(areaSft * sftRate) : 0;
        
        const adoptedRate = parseFloat(fields.canaraAdoptedRate || '0') || 0;
        const calculatedLandMarketValue = areaSft > 0 && adoptedRate > 0 ? Math.round(areaSft * adoptedRate) : 0;
        const landMarketValue = fields.canaraEstimatedLandValueEditOn
          ? (parseFloat(fields.canaraEstimatedLandValue || '0') || 0)
          : calculatedLandMarketValue;

        const buildingRows: any[] = fields.canaraBuildingValuationRows || [];
        const currentYear = new Date().getFullYear();
        const yearOfConstStr = fields.canaraYearOfConstruction || '';
        const yearMatch = yearOfConstStr.match(/\d{4}/);
        const yearOfConst = yearMatch ? parseInt(yearMatch[0], 10) : 0;
        const bAge = fields.canaraBuildingAgeEditOn ? (parseFloat(fields.canaraBuildingAge || '0') || 0) : (yearOfConst > 0 ? currentYear - yearOfConst : 0);
        const buildingMarketValue = buildingRows.reduce((sum: number, row: any) => {
          const p = parseFloat(row.plinthArea || '0') || 0;
          const r = parseFloat(row.replacementRate || '0') || 0;
          const est = row.estCostEditOn ? (parseFloat(row.estCost || '0') || 0) : p * r;
          const dep = row.depreciationEditOn ? (parseFloat(row.depreciation || '0') || 0) : est * 0.01 * bAge;
          const net = row.netValueEditOn ? (parseFloat(row.netValue || '0') || 0) : est - dep;
          return sum + net;
        }, 0);

        const amenityItems = 10;
        const amenitiesMarketValue = Array.from({ length: amenityItems }, (_, i) => parseFloat(fields[`canaraAmenity_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);
        const miscMarketValue = Array.from({ length: 4 }, (_, i) => parseFloat(fields[`canaraMisc_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);
        const servicesMarketValue = Array.from({ length: 5 }, (_, i) => parseFloat(fields[`canaraService_${i}`] || '0') || 0).reduce((a, b) => a + b, 0);

        const abstractRows = [
          { 
            label: 'LAND', 
            key: 'land', 
            govtVal: landGovtValue, 
            marketVal: landMarketValue,
            govtHover: '>>Auto-calculated from Part A — Field 4<<',
            marketHover: '>>Auto-calculated from Part A — Field 6<<'
          },
          { 
            label: 'BUILDING', 
            key: 'building', 
            govtVal: 0, 
            marketVal: buildingMarketValue,
            govtHover: '>>Auto-calculated from Building statutory value<<',
            marketHover: '>>Auto-calculated from Details of Valuation Grid<<'
          },
          { 
            label: 'EXTRA ITEMS', 
            key: 'extraItems', 
            govtVal: 0, 
            marketVal: 0,
            govtHover: '>>Auto-calculated from preceding grid total<<',
            marketHover: '>>Auto-calculated from preceding grid total<<'
          },
          { 
            label: 'AMENITIES', 
            key: 'amenities', 
            govtVal: amenitiesMarketValue, 
            marketVal: amenitiesMarketValue,
            govtHover: '>>Auto-calculated from preceding grid total<<',
            marketHover: '>>Auto-calculated from preceding grid total<<'
          },
          { 
            label: 'MISCELLANEOUS', 
            key: 'miscellaneous', 
            govtVal: miscMarketValue, 
            marketVal: miscMarketValue,
            govtHover: '>>Auto-calculated from preceding grid total<<',
            marketHover: '>>Auto-calculated from preceding grid total<<'
          },
          { 
            label: 'SERVICES', 
            key: 'services', 
            govtVal: servicesMarketValue, 
            marketVal: servicesMarketValue,
            govtHover: '>>Auto-calculated from preceding grid total<<',
            marketHover: '>>Auto-calculated from preceding grid total<<'
          },
        ].map(row => ({
          ...row,
          realizableVal: row.marketVal * 0.95,
          distressVal: row.marketVal * 0.85,
          realizableHover: '>>Auto-calculated: Market Value x 0.95<<',
          distressHover: '>>Auto-calculated: Market Value x 0.85<<'
        }));

        const calcTotalGovt = abstractRows.reduce((sum, r) => sum + r.govtVal, 0);
        const calcTotalMarket = abstractRows.reduce((sum, r) => sum + r.marketVal, 0);
        const calcTotalRealizable = abstractRows.reduce((sum, r) => sum + r.realizableVal, 0);
        const calcTotalDistress = abstractRows.reduce((sum, r) => sum + r.distressVal, 0);
        
        const orSayGovt = Math.round(calcTotalGovt / 1000) * 1000;
        const orSayMarket = Math.round(calcTotalMarket / 1000) * 1000;
        const orSayRealizable = Math.round(calcTotalRealizable / 1000) * 1000;
        const orSayDistress = Math.round(calcTotalDistress / 1000) * 1000;

        const marketValNum = fields.canaraEnableCoverPageValueEdit ? (parseFloat(fields.canaraPresentMarketValue || '0') || 0) : orSayMarket;
        const realizableValNum = fields.canaraEnableCoverPageValueEdit ? (parseFloat(fields.canaraRealizableValue || '0') || 0) : orSayRealizable;
        const distressValNum = fields.canaraEnableCoverPageValueEdit ? (parseFloat(fields.canaraForcedSaleValue || '0') || 0) : orSayDistress;
        const govtValNum = fields.canaraEnableCoverPageValueEdit ? (parseFloat(fields.canaraGovtValue || '0') || 0) : orSayGovt;

        const buildingType = fields.canaraBuildingType || '';
        const areaSftFormatted = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(areaSft);
        const calcLandExtent = minArea > 0
          ? `(AC.${minArea} DEC i.e. ${areaSftFormatted} SFT)`
          : '(AC.0.00 DEC i.e. 0.00 SFT)';
        const landExtentStr = fields.canaraLandTotalExtentEditOn ? (fields.canaraLandTotalExtent || '') : calcLandExtent;

        const fmtINR = (val: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

        const defaultValuationConclusion = `As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is Rs.${fmtINR(marketValNum)}/- (${rupeesInWords(marketValNum)}). The Realizable Value of the above Property is Rs.${fmtINR(realizableValNum)}/- (${rupeesInWords(realizableValNum)}). The book value of the above property as of Land is Rs.${fmtINR(govtValNum)}/- (${rupeesInWords(govtValNum)}) and the distress value Rs.${fmtINR(distressValNum)}/- (${rupeesInWords(distressValNum)})`;

        let parsedEndorsementDate = '';
        if (fields.canaraAsOnDate) {
          const m = fields.canaraAsOnDate.match(/(\d{4})-(\d{2})-(\d{2})/);
          parsedEndorsementDate = m ? `${m[3]}-${m[2]}-${m[1]}` : fields.canaraAsOnDate;
        }
        const defaultEndorsement = `The undersigned has inspected the property detailed in the Valuation Report on dated ${parsedEndorsementDate || '________'}. We are satisfied that the fair and reasonable market value of the property is Rs. ${fmtINR(marketValNum)}/- (${rupeesInWords(marketValNum)}).`;

        const ReadOnlyCell = ({ val, hoverTitle }: { val: number; hoverTitle: string }) => (
          <div className="relative group cursor-help" title={hoverTitle}>
            <input 
              className={`${inputCls} bg-gray-50 text-gray-700 cursor-not-allowed`}
              value={`Rs. ${fmtINR(val)}`}
              readOnly 
              title={hoverTitle}
            />
            <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 group-hover:text-emerald-700 transition-colors" />
          </div>
        );

        return (
          <div className="animate-fade-in space-y-6">

            {/* ── Container 17: Final Values Abstract Table ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#f5f5dc' }}>
              <div className="flex justify-between items-center border-b border-yellow-300 pb-2">
                <h3 className="font-bold text-gray-700">Final Values Abstract Table</h3>
                <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200 shadow-sm flex items-center gap-1 cursor-help" title=">>Values are auto-calculated from previous valuation sections<<">
                  <Lock className="w-3 h-3" /> Auto-Calculated
                </span>
              </div>
              <DirectFileUploadToggle modeKey="canaraAbstractMode" fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
              {fields.canaraAbstractMode !== 'annexure' && (<>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left">PERTICULARS</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">GOVT. VALUE</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">MARKET VALUE</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">REALIZABLE VALUE (95%)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left w-[18%]">DISTRESS VALUE (85%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abstractRows.map(row => (
                      <tr key={row.key}>
                        <td className="border border-gray-300 px-3 py-2 font-medium bg-white">{row.label}</td>
                        <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={row.govtVal} hoverTitle={row.govtHover} /></td>
                        <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={row.marketVal} hoverTitle={row.marketHover} /></td>
                        <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={row.realizableVal} hoverTitle={row.realizableHover} /></td>
                        <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={row.distressVal} hoverTitle={row.distressHover} /></td>
                      </tr>
                    ))}
                    {/* ── TOTAL Row ── */}
                    <tr className="bg-amber-50 font-bold">
                      <td className="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={calcTotalGovt} hoverTitle=">>Auto-calculated: Vertical sum of column<<" /></td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={calcTotalMarket} hoverTitle=">>Auto-calculated: Vertical sum of column<<" /></td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={calcTotalRealizable} hoverTitle=">>Auto-calculated: Vertical sum of column<<" /></td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={calcTotalDistress} hoverTitle=">>Auto-calculated: Vertical sum of column<<" /></td>
                    </tr>
                    {/* ── OR SAY Row ── */}
                    <tr className="bg-emerald-50 font-bold">
                      <td className="border border-gray-300 px-3 py-2 text-right text-emerald-900">OR SAY:</td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={orSayGovt} hoverTitle=">>Auto-calculated: Rounded to nearest thousand<<" /></td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={orSayMarket} hoverTitle=">>Auto-calculated: Rounded to nearest thousand<<" /></td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={orSayRealizable} hoverTitle=">>Auto-calculated: Rounded to nearest thousand<<" /></td>
                      <td className="border border-gray-300 px-1 py-1"><ReadOnlyCell val={orSayDistress} hoverTitle=">>Auto-calculated: Rounded to nearest thousand<<" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </>)}
            </div>

            {/* ── Container 17.5: Remarks ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#ffe4e1' }}>
              <h3 className="font-bold text-gray-700 border-b border-red-200 pb-2">Remarks</h3>
              
              <Field label="PROPERTY & LEGAL REMARKS">
                <textarea className={inputCls} rows={4} value={fields.canaraPropertyLegalRemarks || ''} onChange={e => handleChange('canaraPropertyLegalRemarks', e.target.value)} disabled={isReadOnly} placeholder="Enter location details, municipal limits, civic amenities, legal observations, etc." />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2 mt-4">
                  <span className="text-sm font-semibold text-gray-700">VALUATION CONCLUSION</span>
                  <label className="flex items-center cursor-pointer">
                    <span className="mr-2 text-xs font-medium text-gray-600">Edit Text</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={fields.canaraValuationConclusionEditOn || false} onChange={e => handleChange('canaraValuationConclusionEditOn', e.target.checked)} disabled={isReadOnly} />
                      <div className={`block w-8 h-5 rounded-full transition-colors ${fields.canaraValuationConclusionEditOn ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${fields.canaraValuationConclusionEditOn ? 'transform translate-x-3' : ''}`}></div>
                    </div>
                  </label>
                </div>
                <div className="relative group cursor-help" title={!fields.canaraValuationConclusionEditOn ? '>>Auto-populated from TOTAL ABSTRACT (OR SAY row) calculations<<' : undefined}>
                  <textarea 
                    className={`${inputCls} ${!fields.canaraValuationConclusionEditOn ? 'bg-gray-50 cursor-not-allowed text-gray-700' : ''}`} 
                    rows={5} 
                    value={fields.canaraValuationConclusionEditOn ? (fields.canaraValuationConclusion || '') : defaultValuationConclusion} 
                    onChange={e => handleChange('canaraValuationConclusion', e.target.value)} 
                    disabled={isReadOnly || !fields.canaraValuationConclusionEditOn} 
                  />
                  {!fields.canaraValuationConclusionEditOn && <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 group-hover:text-emerald-700 transition-colors" />}
                </div>
              </div>
            </div>

            {/* ── Container 18: Valuer Sign-off & Bank Endorsement ── */}
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e0ffff' }}>
              <h3 className="font-bold text-gray-700 border-b border-cyan-200 pb-2">Valuer Sign-off & Bank Endorsement</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="PLACE:">
                  <input className={inputCls} value={fields.canaraSignoffPlace ?? 'Bhubaneswar'} onChange={e => handleChange('canaraSignoffPlace', e.target.value)} disabled={isReadOnly} />
                </Field>
                <PrefillField label="DATE:" value={fields.canaraAsOnDate ? fields.canaraAsOnDate.split('-').reverse().join('-') : ''} hoverText='>>Auto-populates from Cover Page Date<<' />
              </div>

              <Field label="SIGNATURE (NAME AND OFFICIAL SEAL OF THE APPROVED VALUER)">
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onload = () => handleChange('canaraSignoffSignature', reader.result); reader.readAsDataURL(file); }
                  }} disabled={isReadOnly} />
                {fields.canaraSignoffSignature && <img src={fields.canaraSignoffSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2 mt-4">
                  <span className="text-sm font-semibold text-gray-700">Endorsement Paragraph ("THE UNDERSIGNED...")</span>
                  <label className="flex items-center cursor-pointer">
                    <span className="mr-2 text-xs font-medium text-gray-600">Edit Text</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={fields.canaraBankEndorsementEditOn || false} onChange={e => handleChange('canaraBankEndorsementEditOn', e.target.checked)} disabled={isReadOnly} />
                      <div className={`block w-8 h-5 rounded-full transition-colors ${fields.canaraBankEndorsementEditOn ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${fields.canaraBankEndorsementEditOn ? 'transform translate-x-3' : ''}`}></div>
                    </div>
                  </label>
                </div>
                <div className="relative group cursor-help" title={!fields.canaraBankEndorsementEditOn ? '>>Auto-populated: Date from Cover Page | Market Value from Total Abstract (OR SAY row)<<' : undefined}>
                  <textarea 
                    className={`${inputCls} ${!fields.canaraBankEndorsementEditOn ? 'bg-gray-50 cursor-not-allowed text-gray-700' : ''}`} 
                    rows={4} 
                    value={fields.canaraBankEndorsementEditOn ? (fields.canaraBankEndorsement || '') : defaultEndorsement} 
                    onChange={e => handleChange('canaraBankEndorsement', e.target.value)} 
                    disabled={isReadOnly || !fields.canaraBankEndorsementEditOn} 
                  />
                  {!fields.canaraBankEndorsementEditOn && <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-3 group-hover:text-emerald-700 transition-colors" />}
                </div>
              </div>

              {/* Branch Manager Fields in Light Grey Container */}
              <div className="rounded-xl p-5 space-y-4 mt-6 border border-blue-100" style={{ backgroundColor: '#e6f7ff' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="DATE:">
                    <BaseDateInput value={fields.canaraEndorsementDate || ''} onChange={val => handleChange('canaraEndorsementDate', val)} disabled={isReadOnly} />
                  </Field>
                  <div />
                </div>

                <Field label="SIGNATURE (NAME OF THE BRANCH MANAGER WITH OFFICIAL SEAL)">
                  <input type="file" accept="image/*" className={inputCls}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { const reader = new FileReader(); reader.onload = () => handleChange('canaraBankManagerSignature', reader.result); reader.readAsDataURL(file); }
                    }} disabled={isReadOnly} />
                  {fields.canaraBankManagerSignature && <img src={fields.canaraBankManagerSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 8: DECLARATION FROM VALUERS (Affirmations) (Container 20)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'canara-section-affirmations',
      title: 'DECLARATION FROM VALUERS (Affirmations)',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const affirmChecks = fields.canaraAffirmationChecks || {};
        const updateCheck = (key: string, val: boolean) => handleChange('canaraAffirmationChecks', { ...affirmChecks, [key]: val });

        const formatDotDate = (dateStr?: string) => {
          if (!dateStr) return '________';
          const m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
          if (m) return `${m[3]}.${m[2]}.${m[1]}`;
          return dateStr;
        };

        const affirmationItems: { key: string; text: string; hasNA?: boolean; hasInput?: boolean; inputKey?: string; }[] = [
          { key: 'a', text: 'I am citizen of India.' },
          { key: 'b', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
          { key: 'c', text: `The information furnished in my valuation report dated ${formatDotDate(fields.canaraAsOnDate)} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
          { key: 'd', text: `I have personally inspected the property on ${formatDotDate(fields.canaraDateOfInspection)} & I have valued the property which is identified by documents & help of customer. The work is not sub-contracted to any other valuer & carried out by myself.` },
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
          { key: 'o', text: 'My PAN Card number as applicable is', hasInput: true, inputKey: 'canaraAffirmationPAN' },
          { key: 'p', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
          { key: 'q', text: 'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure' },
          { key: 'r', text: 'I have read the hand book on policy, standards & procedure for real Estate valuation, 2011 of the IBA & this report is in conformity to the "Standards" enshrined for valuation in the part -B of the above handbook to the best of my knowledge.' },
          { key: 's', text: 'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.' },
          { key: 't', text: 'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.' },
          { key: 'u', text: 'I am registered under Section 34 AB of the Wealth Tax Act,1957.' },
          { key: 'v', text: 'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI)' },
          { key: 'w', text: 'My CIBIL Score and credit worthiness is as per Bank\'s guidelines.' },
          { key: 'x', text: 'I am the authorized official of the firm who is competent to sign this valuation report' },
          { key: 'y', text: 'I will undertake the valuation work on receipt of letter of Engagement generated from the System. (i.e. LLMS/LOS) only' },
          { key: 'z', text: 'Further, I hereby provide the following information.' },
        ];

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#e6e6fa' }}>
              <h3 className="font-bold text-gray-700 border-b border-indigo-200 pb-2">Affirmation Statements</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg p-4 border border-gray-100">
                <Field label="I Mr.">
                  <input className={inputCls} value={fields.canaraAffirmationName ?? 'Satyajit Mohanty'} onChange={e => handleChange('canaraAffirmationName', e.target.value)} disabled={isReadOnly} placeholder="Full Name" />
                </Field>
                <Field label="S/o: Mr">
                  <input className={inputCls} value={fields.canaraAffirmationFatherName ?? 'Nityananda Mohanty'} onChange={e => handleChange('canaraAffirmationFatherName', e.target.value)} disabled={isReadOnly} placeholder="Father's Name" />
                </Field>
              </div>

              <p className="text-sm text-gray-600 italic">do hereby solemnly affirm and state that:</p>

              <div className="space-y-3">
                {affirmationItems.map(item => (
                  <div key={item.key} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    <input
                      type="checkbox"
                      checked={affirmChecks[item.key] !== false}
                      onChange={e => updateCheck(item.key, e.target.checked)}
                      disabled={isReadOnly}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                    <div className="flex-1 text-justify">
                      <span className="text-sm text-gray-700 leading-relaxed">
                        <strong>{item.key}.</strong> {item.text}
                        {item.hasInput && (
                          <input className={`${inputCls} inline-block w-40 ml-2`} value={fields[item.inputKey!] || ''} onChange={e => handleChange(item.inputKey!, e.target.value)} disabled={isReadOnly} placeholder="PAN Number" />
                        )}
                      </span>
                    </div>
                    {item.hasNA && (
                      <label className="flex items-center gap-1 cursor-pointer select-none shrink-0 mt-1">
                        <input type="checkbox" checked={fields[`canaraAffirmation_${item.key}_NA`] || false}
                          onChange={e => handleChange(`canaraAffirmation_${item.key}_NA`, e.target.checked)}
                          disabled={isReadOnly} className="w-4 h-4 rounded border-gray-300 text-emerald-600" />
                        <span className="text-xs text-gray-500">N/A</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {affirmChecks.z && (
                <div className="mt-2">
                  <textarea className={inputCls} rows={3} value={fields.canaraAffirmationAdditionalInfo || ''} onChange={e => handleChange('canaraAffirmationAdditionalInfo', e.target.value)} disabled={isReadOnly || fields.canaraAffirmation_z_NA} placeholder="Enter additional information..." />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <PrefillField label="Date:" value={fields.canaraAsOnDate || ''} hoverText='Prefill from section 2, field "As On Date"' />
                <Field label="Place:">
                  <input className={inputCls} value={fields.canaraAffirmationPlace ?? 'Bhubaneswar'} onChange={e => handleChange('canaraAffirmationPlace', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label="Signature (Name and Official seal of the Approved Valuer)">
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onload = () => handleChange('canaraAffirmationSignature', reader.result); reader.readAsDataURL(file); }
                  }} disabled={isReadOnly} />
                {fields.canaraAffirmationSignature && <img src={fields.canaraAffirmationSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
              </Field>
            </div>
          </div>
        );
      }
    },

    /* ──────────────────────────────────────────────────────────────────────
       SECTION 9: DECLARATION FROM VALUERS (Questionnaire) (Container 19)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'canara-section-questionnaire',
      title: 'DECLARATION FROM VALUERS (Questionnaire)',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const formatDate = (dateString: string) => {
          if (!dateString) return '';
          const parts = dateString.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return dateString;
        };

        const vName = fields.canaraTSNoVillage || '[Village]';
        const pOffice = fields.canaraWardTaluka || '[Post Office]';
        const dName = fields.canaraMandalDistrict || '[District]';
        const generatedBackground = `The property is situated in a good developed Residential area of ${vName}, ${pOffice},${dName}`;

        const generatedPurpose = fields.canaraPurposeOfValuation ? `${fields.canaraPurposeOfValuation}. The Manager of above said bank is the Appointing authority.` : 'The Manager of above said bank is the Appointing authority.';
        
        const appDateStr = formatDate(fields.canaraQuestionnaireAppointmentDate || '');
        const valDateStr = formatDate(fields.canaraDateOfInspection || '');
        const repDateStr = formatDate(fields.canaraAsOnDate || '');
        const generatedDates = `Date of Appointment: ${appDateStr}\nValuation Date: ${valDateStr}\nDate of Report: ${repDateStr}`;

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
        const qAnswers: string[] = fields.canaraDeclarationQuestionnaire || new Array(11).fill('');

        const getDisplayValue = (idx: number) => {
          const val = qAnswers[idx];
          if (val === '__CLEARED__') return '';
          if (val && val !== '') return val;
          if (idx === 0) return generatedBackground;
          if (idx === 1) return generatedPurpose;
          if (idx === 4) return generatedDates;
          return '';
        };

        return (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#fafad2' }}>
              <div className="flex justify-between items-center border-b border-yellow-300 pb-2">
                <h3 className="font-bold text-gray-700">Engagement Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-yellow-200 mb-2">
                <Field label="Appointment Date">
                  <BaseDateInput value={fields.canaraQuestionnaireAppointmentDate || ''} onChange={(val: string) => handleChange('canaraQuestionnaireAppointmentDate', val)} disabled={isReadOnly} />
                </Field>
                <div />
              </div>

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
                          <textarea className={inputCls} rows={idx === 4 ? 3 : 2}
                            value={getDisplayValue(idx)}
                            onChange={e => {
                              const arr = [...qAnswers];
                              arr[idx] = e.target.value === '' ? '__CLEARED__' : e.target.value;
                              handleChange('canaraDeclarationQuestionnaire', arr);
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
       SECTION 10: MODEL CODE OF CONDUCT FOR VALUERS (Container 21)
       ────────────────────────────────────────────────────────────────────── */
    {
      id: 'canara-section-code-of-conduct',
      title: 'MODEL CODE OF CONDUCT FOR VALUERS',
      number: 10,
      defaultOpen: true,
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

        const cocValues = fields.canaraCodeOfConductValues || {};

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
                        <div key={item.num} className="mb-2">
                          <p className="text-sm text-gray-700 leading-relaxed text-justify"><strong>{item.num}.</strong> {item.text}</p>
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
                    checked={fields.canaraCodeOfConductAccepted !== false}
                    onChange={e => handleChange('canaraCodeOfConductAccepted', e.target.checked)}
                    disabled={isReadOnly}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">I acknowledge and agree to the Model Code of Conduct (Items 1-30)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <PrefillField label="Date:" value={fields.canaraAsOnDate ? fields.canaraAsOnDate.split('-').reverse().join('-') : ''} hoverText='>>Auto-populated from Cover Page Date<<' />
                <Field label="Place:">
                  <input className={inputCls} value={fields.canaraCodeOfConductPlace ?? 'Bhubaneswar'} onChange={e => handleChange('canaraCodeOfConductPlace', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label="Signature of the Approved Valuer and Seal">
                <input type="file" accept="image/*" className={inputCls}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { const reader = new FileReader(); reader.onload = () => handleChange('canaraCodeOfConductSignature', reader.result); reader.readAsDataURL(file); }
                  }} disabled={isReadOnly} />
                {fields.canaraCodeOfConductSignature && <img src={fields.canaraCodeOfConductSignature} alt="Signature" className="mt-2 max-h-24 border rounded" />}
              </Field>
            </div>
          </div>
        );
      }
    }
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFCanaraBankRenderer({
    ...fields,
    canaraRefNo: fields.canaraRefNo || projectCode || '',
  })
};

export default function CanaraBank(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CANARA_BANK_CONFIG} {...props} />;
}


