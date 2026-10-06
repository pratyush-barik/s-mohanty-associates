'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Unlock } from 'lucide-react';
import { PDFKotakBbgRenderer } from '@/lib/banks/pdf-kotak-bbg-renderer';

const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text', fallbackValue, options, customInputProps }: any) => {
  const [isEdit, setIsEdit] = useState(false);

  // When in edit-off mode, always sync stored value to fallbackValue so the
  // dependent field dynamically tracks the source field in real time.
  React.useEffect(() => {
    if (!isEdit && fallbackValue !== undefined && value !== fallbackValue) {
      onChange(fallbackValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, fallbackValue]);

  const handleToggle = () => {
    setIsEdit(!isEdit);
  };

  // The displayed value: when edit is off, always show fallbackValue (live-tracking)
  const displayValue = isEdit ? (value || '') : (fallbackValue !== undefined ? (fallbackValue || '') : (value || ''));

  const labelWithToggle = (
    <div className="flex justify-between items-center w-full">
      <div className="flex-1 flex items-center pr-4">{label}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isReadOnly}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${isEdit ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
        <span className={`text-[10px] font-bold uppercase ${isEdit ? 'text-emerald-700' : 'text-gray-400'}`}>
          {isEdit ? 'Edit On' : 'Edit Off'}
        </span>
      </div>
    </div>
  );

  return (
    <Field label={labelWithToggle}>
      <div className="relative mt-1">
        {type === 'textarea' ? (
           <textarea
             className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
             value={displayValue}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
             rows={3}
           />
        ) : type === 'select' ? (
          (() => {
            // When edit is off and the value doesn't match any option, show as plain text input
            const optionValues = options?.map((opt: any) => opt.value) || [];
            const isKnownOption = optionValues.includes(displayValue);
            if (!isEdit && !isKnownOption && displayValue) {
              return (
                <input
                  type="text"
                  className={`${inputCls} pr-8 bg-gray-100 cursor-not-allowed text-gray-700`}
                  value={displayValue}
                  disabled
                />
              );
            }
            return (
              <>
                <select
                   className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
                   value={displayValue}
                   onChange={e => onChange(e.target.value)}
                   disabled={isReadOnly || !isEdit}
                >
                  {/* @ts-ignore */}
                  {options?.map((opt: any, i: number) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {displayValue === 'Custom' && customInputProps && (
                  <input
                    type="text"
                    className={`${inputCls} mt-2 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
                    placeholder={customInputProps.placeholder}
                    value={customInputProps.value || ''}
                    onChange={e => customInputProps.onChange(e.target.value)}
                    disabled={isReadOnly || !isEdit}
                  />
                )}
              </>
            );
          })()
        ) : (
          <input
            type="text"
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          />
        )}
        {!isEdit && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={tooltip}>
            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        )}
      </div>
    </Field>
  );
};

export const KOTAK_BBG_CONFIG: BankConfig = {
  bankId: 'KOTAK MAHINDRA BANK',
  subTemplateId: 'BUSINESS BANKING GROUP',
  displayName: 'Kotak Mahindra Bank — Business Banking Group (BBG)',
  id: 'kotak-bbg',
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'section-15', 'annexures'],
  sectionNumbers: {
    'documents': 11,
    'section-12': 12,
    'section-11': 13,
    'section-15': 15,
  },
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFKotakBbgRenderer({ ...fields, projectCode }),
  navSections: [
    { id: 'kotak-section-1', title: '1. General Details' },
    { id: 'kotak-section-2', title: '2. Details of the Property Being Appraised', shortName: 'Property Details' },
    { id: 'kotak-section-3', title: '3. Site & Surrounding' },
    { id: 'kotak-section-4', title: '4. Details of Approvals verified' },
    { id: 'kotak-section-5', title: '5. Building / Structural Details' },
    { id: 'kotak-section-6', title: '6. Details of Measurements' },
    { id: 'kotak-section-7', title: '7. Valuation Calculations & Rate Analysis' },
    { id: 'kotak-section-8', title: '8. Valuation Financial Summary' },
    { id: 'kotak-section-9', title: '9. Remarks / Key Observations' },
    { id: 'kotak-section-10', title: '10. Valuer Declaration & Signoff' },
    { id: 'section-documents', title: '11. Documents' },
    { id: 'section-12', title: '12. Maps' },
    { id: 'section-11', title: '13. Photographs' },
  ],
  defaultValues: {
    kotakBbgPurpose: 'To ascertain Market value, Realizable value & Distress value of the property for assisting Kotak Mahindra Bank Limited in making prudent banking decision',
  },
  extraSectionsStart: [
    {
      id: 'kotak-section-1',
      title: 'General Details',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly, projectCode) => {
        const today = new Date().toISOString().split('T')[0];
        const valuerName = 'Er. S. Mohanty'; // Mock
        const borrowerName = fields.kotakBbgBorrowerName != null && fields.kotakBbgBorrowerName !== undefined ? fields.kotakBbgBorrowerName : '[Borrower Name from App]';
        
        // Ensure legacy pre-fills are overwritten with new text
        const oldBankName = 'Kotak Mahindra Bank';
        const newBankName = 'Kotak Mahindra Bank Limited (KMBL)';
        const bankNameVal = (!fields.kotakBbgBankName || fields.kotakBbgBankName === oldBankName) ? newBankName : fields.kotakBbgBankName;

        const oldPurpose = 'To ascertain Market value, Realizable value & Distress value for bank decision-making';
        const newPurpose = 'To ascertain Market value, Realizable value & Distress value of the property for assisting Kotak Mahindra Bank Limited in making prudent banking decision';
        const purposeVal = (fields.kotakBbgPurpose == null || fields.kotakBbgPurpose === undefined || fields.kotakBbgPurpose === oldPurpose || fields.kotakBbgPurpose === 'Market Value Assessment') ? newPurpose : fields.kotakBbgPurpose;

        // Bank Reference is permanently locked to the project case ID
        const bankRefVal = projectCode || '';
        
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Bank Name">
              <div className="relative mt-1" title="Auto-filled from Bank Configuration (permanently locked)">
                <input
                  type="text"
                  className={`${inputCls} pr-8 bg-gray-100 cursor-not-allowed text-gray-700`}
                  value={bankNameVal}
                  disabled
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Locked — derived from Bank configuration">
                  <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
            </Field>


            <Field label="Reference / Application No.">
              <div className="relative mt-1" title="Auto-filled from Project Case ID (permanently locked)">
                <input
                  type="text"
                  className={`${inputCls} pr-8 bg-gray-100 cursor-not-allowed text-gray-700`}
                  value={bankRefVal}
                  disabled
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Locked — derived from Project Case ID">
                  <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
            </Field>

            <PrefillField
              label="a. Purpose of Valuation"
              value={purposeVal}
              onChange={(val: string) => handleChange('kotakBbgPurpose', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
              fallbackValue={newPurpose}
            />
            
            <Field label="b. Date of valuation">
              <input
                type="date"
                className={inputCls}
                value={fields.kotakBbgDateOfValuation || today}
                onChange={e => handleChange('kotakBbgDateOfValuation', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="c. Name of the Valuer">
              <input
                type="text"
                className={inputCls}
                value={fields.kotakBbgValuerName || ''}
                onChange={e => handleChange('kotakBbgValuerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {(() => {
              const siteEngineerPrefillVal = fields.kotakBbgSiteEngineerNA
                ? 'NA'
                : (fields.kotakBbgSiteEngineer != null && fields.kotakBbgSiteEngineer !== undefined ? fields.kotakBbgSiteEngineer : (fields.nameOfEngineerVisitingProperty || ''));
              return (
                <PrefillField
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span className="flex-1 pr-4">d. Name of the qualified/ experienced Site engineer inspecting the property</span>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case shrink-0">
                        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgSiteEngineerNA} onChange={e => handleChange('kotakBbgSiteEngineerNA', e.target.checked)} disabled={isReadOnly} />
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
                      </label>
                    </div>
                  }
                  value={siteEngineerPrefillVal}
                  onChange={(val: string) => handleChange('kotakBbgSiteEngineer', val)}
                  isReadOnly={isReadOnly || !!fields.kotakBbgSiteEngineerNA}
                  tooltip="Auto-filled from the Field Agent assigned to this project — toggle Edit to override"
                  fallbackValue={fields.nameOfEngineerVisitingProperty || ''}
                />
              );
            })()}

            <Field label="e. Name of the customer">
              <input
                type="text"
                className={inputCls}
                value={borrowerName}
                onChange={e => handleChange('kotakBbgBorrowerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="f. Name of the property owner/owners as per legal docs">
              <textarea 
                className={inputCls + ' resize-y w-full'} 
                rows={2} 
                placeholder="Owner Name(s)" 
                value={fields.kotakBbgOwnerName !== undefined ? fields.kotakBbgOwnerName : borrowerName} 
                onChange={e => handleChange('kotakBbgOwnerName', e.target.value)} 
                disabled={isReadOnly} 
              />
            </Field>

            <Field label="g. Date of Technical Visit">
              <input
                type="date"
                className={inputCls}
                value={fields.kotakBbgDateOfSiteVisit || today}
                onChange={e => handleChange('kotakBbgDateOfSiteVisit', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            
            <Field label="h. Person met at the time of site visit">
              <div className="p-3 bg-white bg-opacity-50 border border-gray-200 rounded space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Name</span>
                  <input type="text" className={inputCls} placeholder="Name" value={fields.kotakBbgPersonMet || ''} onChange={e => handleChange('kotakBbgPersonMet', e.target.value)} disabled={isReadOnly} />
                </div>
                
                {/* Removed Relationship to Owner */}

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgPersonMetContactNA} onChange={e => handleChange('kotakBbgPersonMetContactNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgPersonMetContactNA && (
                    <input type="text" maxLength={10} className={inputCls} placeholder="10-digit number" value={fields.kotakBbgPersonMetContact || ''} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      handleChange('kotakBbgPersonMetContact', val);
                    }} disabled={isReadOnly} />
                  )}
                </div>
              </div>
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-2',
      title: 'Details of the Property Being Appraised',
      number: 2,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        // Leasehold logic
        const isFreehold = fields.kotakBbgTenure === 'Freehold';
        const leaseTermsNA = isFreehold ? true : !!fields.kotakBbgLeaseTermsNA;
        const leaseTransferableNA = isFreehold ? true : !!fields.kotakBbgLeaseTransferableNA;



        return (
          <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="a. Technical Address of the Property (Please be descriptive mentioning landmark, road, post code etc)">
              <textarea 
                className={inputCls + ' resize-y w-full'} 
                rows={4} 
                placeholder="Enter Technical Address..." 
                value={fields.kotakBbgTechnicalAddress || ''} 
                onChange={e => handleChange('kotakBbgTechnicalAddress', e.target.value)} 
                disabled={isReadOnly} 
              />
            </Field>

            {(() => {
              const techAddr = fields.kotakBbgTechnicalAddress || '';
              const legalAddrVal = (fields.kotakBbgLegalAddress === undefined || fields.kotakBbgLegalAddress === null) ? techAddr : fields.kotakBbgLegalAddress;
              return (
                <PrefillField
                  label="b. Legal Address of the Property"
                  value={legalAddrVal}
                  onChange={(val: string) => handleChange('kotakBbgLegalAddress', val)}
                  isReadOnly={isReadOnly}
                  tooltip='Prefill from section 2, "Technical Address"'
                  fallbackValue={techAddr}
                  type="textarea"
                />
              );
            })()}

            <Field label="c. Google Coordinates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Latitude</span>
                  <input type="number" className={inputCls} placeholder="Latitude" value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Longitude</span>
                  <input type="number" className={inputCls} placeholder="Longitude" value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
            </Field>

            <Field label="d. Nature of the property">
              <div className="space-y-2">
                <select className={inputCls} value={fields.kotakBbgNatureOfProperty || ''} onChange={e => handleChange('kotakBbgNatureOfProperty', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Nature</option>
                  <option value="Vacant Land">Vacant Land</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Industrial(Flour Mill)">Industrial(Flour Mill)</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.kotakBbgNatureOfProperty === 'Custom' && (
                  <input type="text" className={inputCls} placeholder="Enter custom nature" value={fields.kotakBbgNatureOfPropertyCustom || ''} onChange={e => handleChange('kotakBbgNatureOfPropertyCustom', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="e. Tenure of the property (Freehold/leasehold)">
              <div className="space-y-2">
                <select className={inputCls} value={fields.kotakBbgTenure || ''} onChange={e => handleChange('kotakBbgTenure', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Tenure</option>
                  <option value="Freehold">Freehold</option>
                  <option value="Leasehold">Leasehold</option>
                  <option value="Allotment">Allotment</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.kotakBbgTenure === 'Custom' && (
                  <input type="text" className={inputCls} placeholder="Enter custom tenure" value={fields.kotakBbgTenureCustom || ''} onChange={e => handleChange('kotakBbgTenureCustom', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>f. If leasehold please stipulate important lease terms</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case" title={isFreehold ? "Auto-checked because Tenure is Freehold" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={leaseTermsNA} onChange={e => handleChange('kotakBbgLeaseTermsNA', e.target.checked)} disabled={isReadOnly || isFreehold} />
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!leaseTermsNA ? (
                <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter lease terms..." value={fields.kotakBbgLeaseTerms || ''} onChange={e => handleChange('kotakBbgLeaseTerms', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
              )}
            </Field>

            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>g. Are the leasehold rights transferable?</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case" title={isFreehold ? "Auto-checked because Tenure is Freehold" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={leaseTransferableNA} onChange={e => handleChange('kotakBbgLeaseTransferableNA', e.target.checked)} disabled={isReadOnly || isFreehold} />
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!leaseTransferableNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgLeaseTransferable || ''} onChange={e => handleChange('kotakBbgLeaseTransferable', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgLeaseTransferable === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom value" value={fields.kotakBbgLeaseTransferableCustom || ''} onChange={e => handleChange('kotakBbgLeaseTransferableCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
              )}
            </Field>

            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>h. Occupancy details (Details if rented)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgOccupancyNA} onChange={e => handleChange('kotakBbgOccupancyNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgOccupancyNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgOccupancy || ''} onChange={e => handleChange('kotakBbgOccupancy', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Occupancy</option>
                    <option value="Self Occupied">Self Occupied</option>
                    <option value="Tenanted">Tenanted</option>
                    <option value="Vacant Land">Vacant Land</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgOccupancy === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom value" value={fields.kotakBbgOccupancyCustom || ''} onChange={e => handleChange('kotakBbgOccupancyCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
              )}
            </Field>

          </div>
        );
      }
    },
    {
      id: 'kotak-section-3',
      title: 'Site & Surrounding',
      number: 3,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        // a. Boundaries
        const boundariesDoc = fields.kotakBbgBoundariesDoc || { north: '', south: '', east: '', west: '' };
        const boundariesSite = fields.kotakBbgBoundariesSite || { north: '', south: '', east: '', west: '' };
        const setBoundariesDoc = (key: string, val: string) => handleChange('kotakBbgBoundariesDoc', { ...boundariesDoc, [key]: val });
        const setBoundariesSite = (key: string, val: string) => handleChange('kotakBbgBoundariesSite', { ...boundariesSite, [key]: val });
        
        const sameAsDoc = !!fields.kotakBbgBoundariesSiteSameAsDoc;
        
        // c. Discrepancy
        const matchingVal = fields.kotakBbgBoundariesMatching;
        const isDiscrepancyNA = matchingVal === 'Yes' || !!fields.kotakBbgBoundariesDiscrepancyNA;

        return (
          <div style={{ backgroundColor: '#e8f5e9', padding: '24px', borderRadius: '12px' }} className="space-y-6 shadow-sm border border-[#c8e6c9]">
            {/* a. Boundaries as per legal / Sale Deed & Boundaries As Per Site */}
            <Field label="a. BOUNDARIES AS PER LEGAL / SALE DEED & BOUNDARIES AS PER SITE">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-[#c8e6c9] rounded-lg bg-white/80 shadow-sm">
                {/* Legal Boundaries */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100">Legal / Sale Deed Boundaries</h4>
                  <div className="space-y-2">
                    {['North', 'South', 'East', 'West'].map(dir => (
                      <div key={`doc-${dir}`} className="flex flex-col">
                        <span className="text-xs text-gray-500 font-medium ml-1">{dir}</span>
                        <input type="text" className={inputCls} value={boundariesDoc[dir.toLowerCase()] || ''} onChange={e => setBoundariesDoc(dir.toLowerCase(), e.target.value)} disabled={isReadOnly} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Site Boundaries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-emerald-50 p-2 rounded border border-emerald-100">
                    <h4 className="text-sm font-semibold text-emerald-800">Site Boundaries</h4>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" checked={sameAsDoc} onChange={e => handleChange('kotakBbgBoundariesSiteSameAsDoc', e.target.checked)} disabled={isReadOnly} />
                      <span className="font-medium text-emerald-800">Same as Legal / Sale Deed</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    {['North', 'South', 'East', 'West'].map(dir => {
                      const val = sameAsDoc ? boundariesDoc[dir.toLowerCase()] : boundariesSite[dir.toLowerCase()];
                      return (
                        <div key={`site-${dir}`} className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium ml-1">{dir}</span>
                          {sameAsDoc ? (
                            <div title='Prefill from section 3, "a. Boundaries as per legal / Sale Deed"' className="relative group flex items-center">
                              <input type="text" className={`${inputCls} flex-1 bg-gray-50 cursor-not-allowed text-gray-600 border-gray-200 pr-8`} value={val || ''} disabled={true} />
                              <Lock size={14} className="absolute right-3 text-gray-400 group-hover:text-gray-600 cursor-help" />
                            </div>
                          ) : (
                            <input type="text" className={inputCls} value={val || ''} onChange={e => setBoundariesSite(dir.toLowerCase(), e.target.value)} disabled={isReadOnly} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Field>

            {/* b. Whether Boundaries matching */}
            <Field label="b. Whether Boundaries matching (actual site verification with Legal docs)">
              <select className={inputCls} value={fields.kotakBbgBoundariesMatching || ''} onChange={e => handleChange('kotakBbgBoundariesMatching', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>

            {/* c. Discrepancy found */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>c. Discrepancy found in Boundaries, if any, pl specify/ elaborate</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" title={matchingVal === 'Yes' ? "Auto-checked because boundaries match" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={isDiscrepancyNA} onChange={e => handleChange('kotakBbgBoundariesDiscrepancyNA', e.target.checked)} disabled={isReadOnly || matchingVal === 'Yes'} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!isDiscrepancyNA ? (
                <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Specify discrepancies..." value={fields.kotakBbgBoundariesDiscrepancy || ''} onChange={e => handleChange('kotakBbgBoundariesDiscrepancy', e.target.value)} disabled={isReadOnly} />
              ) : (
                <div title={matchingVal === 'Yes' ? "Auto calculating from field b (Yes)" : ""} className="relative group flex items-center cursor-help">
                  <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed pr-8 text-gray-500'} value="NA" disabled />
                  {matchingVal === 'Yes' && <Lock size={14} className="absolute right-3 text-gray-400 group-hover:text-gray-600" />}
                </div>
              )}
            </Field>

            {/* d. Documents basis which property is identified */}
            <Field label="d. Documents basis which property is identified">
              <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter documents basis..." value={fields.kotakBbgDocumentsIdentified || ''} onChange={e => handleChange('kotakBbgDocumentsIdentified', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* e. Confirmation from the valuer that the correct property is identified */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>e. Confirmation from the valuer that the correct property is identified</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgValuerConfirmationNA} onChange={e => handleChange('kotakBbgValuerConfirmationNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgValuerConfirmationNA ? (
                <select className={inputCls} value={fields.kotakBbgValuerConfirmation || ''} onChange={e => handleChange('kotakBbgValuerConfirmation', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* f. Plot/ Property Demarcated at Site */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>f. Plot/ Property Demarcated at Site</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgDemarcatedNA} onChange={e => handleChange('kotakBbgDemarcatedNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgDemarcatedNA ? (
                <select className={inputCls} value={fields.kotakBbgDemarcated || ''} onChange={e => handleChange('kotakBbgDemarcated', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* g. Type, Condition, Classification of the Locality */}
            <Field label="g. Type, Condition, Classification of the Locality">
              <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter type, condition, classification..." value={fields.kotakBbgLocalityClassification || ''} onChange={e => handleChange('kotakBbgLocalityClassification', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* h. Development of surrounding areas */}
            <Field label="h. Development of surrounding areas">
              <div className="space-y-2">
                <select className={inputCls} value={fields.kotakBbgSurroundingDev || ''} onChange={e => handleChange('kotakBbgSurroundingDev', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Development</option>
                  <option value="Industrial/Commercial/Residential">Industrial/Commercial/Residential</option>
                  <option value="Predominantly Residential">Predominantly Residential</option>
                  <option value="Predominantly Commercial">Predominantly Commercial</option>
                  <option value="Predominantly Industrial">Predominantly Industrial</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.kotakBbgSurroundingDev === 'Custom' && (
                  <input type="text" className={`${inputCls} border-emerald-300 focus:ring-emerald-500`} placeholder="Enter custom development" value={fields.kotakBbgSurroundingDevCustom || ''} onChange={e => handleChange('kotakBbgSurroundingDevCustom', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            {/* i. Access to property */}
            <Field label="i. Access to property">
              <input type="text" className={inputCls} placeholder="Enter access to property details" value={fields.kotakBbgAccessType || ''} onChange={e => handleChange('kotakBbgAccessType', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* j. Name and condition of Approach Road */}
            <Field label="j. Name and condition of Approach Road">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/80 rounded-xl border border-[#c8e6c9] shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Name</span>
                  <input type="text" className={inputCls} placeholder="e.g. NH-16" value={fields.kotakBbgApproachRoadName || ''} onChange={e => handleChange('kotakBbgApproachRoadName', e.target.value)} disabled={isReadOnly} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Condition</span>
                  <select className={inputCls} value={fields.kotakBbgApproachRoadCondition || ''} onChange={e => handleChange('kotakBbgApproachRoadCondition', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Condition</option>
                    <option value="BT Road">BT Road</option>
                    <option value="CC/Concrete Road">CC/Concrete Road</option>
                    <option value="Tar/Asphalt">Tar/Asphalt</option>
                    <option value="Mud/Kutcha">Mud/Kutcha</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgApproachRoadCondition === 'Custom' && (
                    <input type="text" className={`${inputCls} mt-2 border-emerald-300 focus:ring-emerald-500`} placeholder="Enter custom condition" value={fields.kotakBbgApproachRoadConditionCustom || ''} onChange={e => handleChange('kotakBbgApproachRoadConditionCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              </div>
            </Field>

            {/* k. Proximity to civic amenities */}
            <Field label="k. Proximity to civic amenities like schools, hospitals, offices, markets, cinemas, etc.">
              <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter proximity to civic amenities..." value={fields.kotakBbgCivicAmenities || ''} onChange={e => handleChange('kotakBbgCivicAmenities', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-4',
      title: 'Details of Approvals verified',
      number: 4,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        // c. Approved plans Details Status
        const planStatus = fields.kotakBbgApprovedPlanStatus;
        const planNotAvail = planStatus === 'Approved Plan not available';

        return (
          <div style={{ backgroundColor: '#fff9c4', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* a. Land Non Agricultural/ conversion permission */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>a. Land Non Agricultural/ conversion permission</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgLandConversionNA} onChange={e => handleChange('kotakBbgLandConversionNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgLandConversionNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgLandConversion || ''} onChange={e => handleChange('kotakBbgLandConversion', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Non Agricultural / Homestead in Nature">Non Agricultural / Homestead in Nature</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgLandConversion === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom value" value={fields.kotakBbgLandConversionCustom || ''} onChange={e => handleChange('kotakBbgLandConversionCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* b. Land Zoning/ Restrictions (if any) */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>b. Land Zoning/ Restrictions (if any)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgLandZoningNA} onChange={e => handleChange('kotakBbgLandZoningNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgLandZoningNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgLandZoning || ''} onChange={e => handleChange('kotakBbgLandZoning', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Not Applicable (GP Limit)">Not Applicable (GP Limit)</option>
                    <option value="Residential Zone">Residential Zone</option>
                    <option value="Commercial Zone">Commercial Zone</option>
                    <option value="Green Belt">Green Belt</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgLandZoning === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom value" value={fields.kotakBbgLandZoningCustom || ''} onChange={e => handleChange('kotakBbgLandZoningCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* c. Approved plans Details */}
            <Field label="c. Approved plans Details">
              <div className="space-y-4 p-4 border border-[#c8e6c9] rounded-lg bg-white/80 shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Availability Status</span>
                  <select className={inputCls} value={planStatus || ''} onChange={e => handleChange('kotakBbgApprovedPlanStatus', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Status</option>
                    <option value="Available">Available</option>
                    <option value="Approved Plan not available">Approved Plan not available</option>
                    <option value="In Process">In Process</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Plan Details/Remarks</span>
                  {planNotAvail ? (
                    <div title="Auto calculating from Availability Status" className="relative group flex items-center cursor-help">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed pr-8 text-gray-500'} value="NA" disabled />
                      <Lock size={14} className="absolute right-3 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  ) : (
                    <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter plan details..." value={fields.kotakBbgApprovedPlanDetails || ''} onChange={e => handleChange('kotakBbgApprovedPlanDetails', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              </div>
            </Field>

            {/* d. Name of the Authority granting approvals */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>d. Name of the Authority granting approvals</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgAuthorityApprovalsNA} onChange={e => handleChange('kotakBbgAuthorityApprovalsNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgAuthorityApprovalsNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgAuthorityApprovals || ''} onChange={e => handleChange('kotakBbgAuthorityApprovals', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Gram Panchayat">Gram Panchayat</option>
                    <option value="Municipal Corporation">Municipal Corporation</option>
                    <option value="Development Authority">Development Authority</option>
                    <option value="Town Planning">Town Planning</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgAuthorityApprovals === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom authority" value={fields.kotakBbgAuthorityApprovalsCustom || ''} onChange={e => handleChange('kotakBbgAuthorityApprovalsCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* e. Are the plans approved from competent authority? */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>e. Are the plans approved from competent authority?</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" title={planNotAvail ? "Auto-checked because Plan is not available" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={planNotAvail || !!fields.kotakBbgPlansApprovedNA} onChange={e => handleChange('kotakBbgPlansApprovedNA', e.target.checked)} disabled={isReadOnly || planNotAvail} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!(planNotAvail || !!fields.kotakBbgPlansApprovedNA) ? (
                <select className={inputCls} value={fields.kotakBbgPlansApproved || ''} onChange={e => handleChange('kotakBbgPlansApproved', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="NA">NA</option>
                </select>
              ) : (
                <div title={planNotAvail ? "Auto calculating from c. Approved plans Details" : ""} className="relative group flex items-center cursor-help">
                  <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed pr-8 text-gray-500'} value="NA" disabled />
                  {planNotAvail && <Lock size={14} className="absolute right-3 text-gray-400 group-hover:text-gray-600" />}
                </div>
              )}
            </Field>

            {/* f. Commencement Certificate / Building Permit Details. */}
            <Field label="f. Commencement Certificate / Building Permit Details.">
              <div className="space-y-4 p-4 border border-[#c8e6c9] rounded-lg bg-white/80 shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <select className={inputCls} value={fields.kotakBbgCommencementStatus || ''} onChange={e => handleChange('kotakBbgCommencementStatus', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Status</option>
                    <option value="Provided">Provided</option>
                    <option value="Not provided">Not provided</option>
                  </select>
                </div>
                {fields.kotakBbgCommencementStatus === 'Provided' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">Permit Number</span>
                      <input type="text" className={inputCls} value={fields.kotakBbgCommencementNo || ''} onChange={e => handleChange('kotakBbgCommencementNo', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">Date of Issue</span>
                      <input type="date" className={inputCls} value={fields.kotakBbgCommencementDate || ''} onChange={e => handleChange('kotakBbgCommencementDate', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>
                )}
              </div>
            </Field>

            {/* g. Occupation/Completion certificate details. */}
            <Field label="g. Occupation/Completion certificate details.">
              <div className="space-y-4 p-4 border border-[#c8e6c9] rounded-lg bg-white/80 shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <select className={inputCls} value={fields.kotakBbgOccupationStatus || ''} onChange={e => handleChange('kotakBbgOccupationStatus', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Status</option>
                    <option value="Provided">Provided</option>
                    <option value="Not Provided">Not Provided</option>
                  </select>
                </div>
                {fields.kotakBbgOccupationStatus === 'Provided' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">Certificate Number</span>
                      <input type="text" className={inputCls} value={fields.kotakBbgOccupationNo || ''} onChange={e => handleChange('kotakBbgOccupationNo', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">Date of Issue</span>
                      <input type="date" className={inputCls} value={fields.kotakBbgOccupationDate || ''} onChange={e => handleChange('kotakBbgOccupationDate', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>
                )}
              </div>
            </Field>

            {/* h. Sale/lease deed details */}
            <Field label="h. Sale/lease deed details (Date, Reg No., Sale consideration etc)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-[#c8e6c9] rounded-lg bg-white/80 shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700">Document Type</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgDeedTypeNA} onChange={e => handleChange('kotakBbgDeedTypeNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgDeedTypeNA ? (
                    <div className="space-y-2">
                      <select className={inputCls} value={fields.kotakBbgDeedType || ''} onChange={e => handleChange('kotakBbgDeedType', e.target.value)} disabled={isReadOnly}>
                        <option value="">Select Option</option>
                        <option value="Net ROR(Bhu-Naksha)">Net ROR(Bhu-Naksha)</option>
                        <option value="Sale Deed">Sale Deed</option>
                        <option value="Lease Deed">Lease Deed</option>
                        <option value="Gift Deed">Gift Deed</option>
                        <option value="Allotment Letter">Allotment Letter</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {fields.kotakBbgDeedType === 'Custom' && (
                        <input type="text" className={`${inputCls} mt-2`} placeholder="Enter custom value" value={fields.kotakBbgDeedTypeCustom || ''} onChange={e => handleChange('kotakBbgDeedTypeCustom', e.target.value)} disabled={isReadOnly} />
                      )}
                    </div>
                  ) : (
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700">Registration / Document Number</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgDeedNoNA} onChange={e => handleChange('kotakBbgDeedNoNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgDeedNoNA ? (
                    <input type="text" className={inputCls} value={fields.kotakBbgDeedNo || ''} onChange={e => handleChange('kotakBbgDeedNo', e.target.value)} disabled={isReadOnly} />
                  ) : (
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700">Date</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgDeedDateNA} onChange={e => handleChange('kotakBbgDeedDateNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgDeedDateNA ? (
                    <input type="date" className={inputCls} value={fields.kotakBbgDeedDate || ''} onChange={e => handleChange('kotakBbgDeedDate', e.target.value)} disabled={isReadOnly} />
                  ) : (
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700">Sale Consideration (INR)</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgDeedSaleConsiderationNA} onChange={e => handleChange('kotakBbgDeedSaleConsiderationNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgDeedSaleConsiderationNA ? (
                    <input type="number" className={inputCls} value={fields.kotakBbgDeedSaleConsideration || ''} onChange={e => handleChange('kotakBbgDeedSaleConsideration', e.target.value)} disabled={isReadOnly} />
                  ) : (
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                  )}
                </div>
              </div>
            </Field>

            {/* i. Details of other documents perused (pl list) */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>i. Details of other documents perused (pl list)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgOtherDocsNA} onChange={e => handleChange('kotakBbgOtherDocsNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgOtherDocsNA ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Sale Deed', 'ROR', 'Approved Letter', 'Approved plan', 'Bhu-Naksha', 'Mutation Extract'].map(doc => {
                      const list = fields.kotakBbgOtherDocsList || [];
                      const isChecked = list.includes(doc);
                      return (
                        <label key={doc} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={isChecked}
                            onChange={(e) => {
                              const newList = e.target.checked ? [...list, doc] : list.filter((i: string) => i !== doc);
                              handleChange('kotakBbgOtherDocsList', newList);
                            }}
                            disabled={isReadOnly}
                          />
                          {doc}
                        </label>
                      );
                    })}
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={!!fields.kotakBbgOtherDocsCustomChecked}
                        onChange={(e) => handleChange('kotakBbgOtherDocsCustomChecked', e.target.checked)}
                        disabled={isReadOnly}
                      />
                      Custom
                    </label>
                  </div>
                  {fields.kotakBbgOtherDocsCustomChecked && (
                    <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter other custom documents perused..." value={fields.kotakBbgOtherDocsCustom || ''} onChange={e => handleChange('kotakBbgOtherDocsCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

          </div>
        );
      }
    },
    {
      id: 'kotak-section-5',
      title: 'Building/ Flat/ Office/ Shop Details',
      number: 5,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        const overridden = fields.kotakBbgSection5Override || false;
        
        if (isVacantLand && !overridden) {
          return (
            <div style={{ backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px' }}>
              <p className="text-gray-600 text-sm italic mb-2">This section is auto-disabled because Nature of Property is "Vacant Land".</p>
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={overridden} onChange={e => handleChange('kotakBbgSection5Override', e.target.checked)} disabled={isReadOnly} />
                <span>Manually override and enable this section</span>
              </label>
            </div>
          );
        }

        const currentYear = new Date().getFullYear();
        let calculatedAge = 0;
        if (fields.kotakBbgYearOfConstruction && !fields.kotakBbgYearOfConstructionNA) {
          const age = currentYear - parseInt(fields.kotakBbgYearOfConstruction, 10);
          calculatedAge = age > 0 ? age : 0;
        }

        let standardLife = 60; // default for RCC/Composite
        const typeOfConstruction = fields.kotakBbgConstructionType;
        if (typeOfConstruction === 'Load Bearing Walls') standardLife = 50;
        if (typeOfConstruction === 'Shed') standardLife = 20;
        
        const resAge = standardLife - calculatedAge;
        const calculatedResidualAge = resAge > 0 ? resAge.toString() : '0';

        const flooringSystems = Array.isArray(fields.kotakBbgFlooringSystem) ? fields.kotakBbgFlooringSystem : [];
        const toggleFlooring = (val: string) => {
          if (flooringSystems.includes(val)) {
            handleChange('kotakBbgFlooringSystem', flooringSystems.filter(v => v !== val));
          } else {
            handleChange('kotakBbgFlooringSystem', [...flooringSystems, val]);
          }
        };

        const amenities = Array.isArray(fields.kotakBbgAmenities) ? fields.kotakBbgAmenities : [];
        const toggleAmenity = (val: string) => {
          if (amenities.includes(val)) {
            handleChange('kotakBbgAmenities', amenities.filter(v => v !== val));
          } else {
            handleChange('kotakBbgAmenities', [...amenities, val]);
          }
        };

        return (
          <div style={{ backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {isVacantLand && overridden && (
              <label className="flex items-center space-x-2 text-sm text-gray-500 pb-2 border-b border-gray-200">
                <input type="checkbox" checked={overridden} onChange={e => handleChange('kotakBbgSection5Override', e.target.checked)} disabled={isReadOnly} />
                <span>Manually overriding "Vacant Land" disable lock</span>
              </label>
            )}

            {/* a. Type of Construction/ Roofing/ Special architectural features */}
            <Field label="a. Type of Construction/ Roofing/ Special architectural features">
              <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium text-gray-700">Type of Construction</span>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgConstructionTypeNA} onChange={e => handleChange('kotakBbgConstructionTypeNA', e.target.checked)} disabled={isReadOnly} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                      </label>
                    </div>
                    {!fields.kotakBbgConstructionTypeNA ? (
                      <div className="space-y-2">
                        <select className={inputCls} value={fields.kotakBbgConstructionType || ''} onChange={e => handleChange('kotakBbgConstructionType', e.target.value)} disabled={isReadOnly}>
                          <option value="">Select Option</option>
                          <option value="RCC Framed Structure">RCC Framed Structure</option>
                          <option value="Load Bearing Walls">Load Bearing Walls</option>
                          <option value="Composite">Composite</option>
                          <option value="Shed">Shed</option>
                          <option value="Custom">Custom</option>
                        </select>
                        {fields.kotakBbgConstructionType === 'Custom' && (
                          <input type="text" className={`${inputCls} mt-2`} placeholder="Enter custom type" value={fields.kotakBbgConstructionTypeCustom || ''} onChange={e => handleChange('kotakBbgConstructionTypeCustom', e.target.value)} disabled={isReadOnly} />
                        )}
                      </div>
                    ) : (
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                    )}
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium text-gray-700">Roofing</span>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgRoofingSystemNA} onChange={e => handleChange('kotakBbgRoofingSystemNA', e.target.checked)} disabled={isReadOnly} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                      </label>
                    </div>
                    {!fields.kotakBbgRoofingSystemNA ? (
                      <div className="space-y-2">
                        <select className={inputCls} value={fields.kotakBbgRoofingSystem || ''} onChange={e => handleChange('kotakBbgRoofingSystem', e.target.value)} disabled={isReadOnly}>
                          <option value="">Select Option</option>
                          <option value="RCC Slab">RCC Slab</option>
                          <option value="GCI Sheets">GCI Sheets</option>
                          <option value="Asbestos Sheets">Asbestos Sheets</option>
                          <option value="Mangalore Tiles">Mangalore Tiles</option>
                          <option value="Custom">Custom</option>
                        </select>
                        {fields.kotakBbgRoofingSystem === 'Custom' && (
                          <input type="text" className={`${inputCls} mt-2`} placeholder="Enter custom roofing" value={fields.kotakBbgRoofingSystemCustom || ''} onChange={e => handleChange('kotakBbgRoofingSystemCustom', e.target.value)} disabled={isReadOnly} />
                        )}
                      </div>
                    ) : (
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700">Special Architectural Features</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgSpecialFeaturesNA} onChange={e => handleChange('kotakBbgSpecialFeaturesNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgSpecialFeaturesNA ? (
                    <input type="text" className={inputCls} placeholder="Enter special features if any" value={fields.kotakBbgSpecialFeatures || ''} onChange={e => handleChange('kotakBbgSpecialFeatures', e.target.value)} disabled={isReadOnly} />
                  ) : (
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                  )}
                </div>
              </div>
            </Field>

            {/* b. Year of construction */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>b. Year of construction</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgYearOfConstructionNA} onChange={e => handleChange('kotakBbgYearOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgYearOfConstructionNA ? (
                <input type="number" className={inputCls} placeholder="YYYY" min="1800" max={currentYear} value={fields.kotakBbgYearOfConstruction || ''} onChange={e => handleChange('kotakBbgYearOfConstruction', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* c. Stage of construction in % */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>c. Stage of construction in % (if applicable)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgStageOfConstructionNA} onChange={e => handleChange('kotakBbgStageOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgStageOfConstructionNA ? (
                <div className="relative">
                  <input type="number" className={inputCls + ' pr-8'} placeholder="100" min="0" max="100" value={fields.kotakBbgStageOfConstruction !== undefined ? fields.kotakBbgStageOfConstruction : '100'} onChange={e => handleChange('kotakBbgStageOfConstruction', e.target.value)} disabled={isReadOnly} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* d. Residual age of the Property */}
            <PrefillField
              label="d. Residual age of the Property"
              value={fields.kotakBbgResidualStructuralAge}
              onChange={(val: string) => handleChange('kotakBbgResidualStructuralAge', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Standard Building Life - Age of Building]"
              fallbackValue={calculatedResidualAge}
              type="text"
            />

            {/* e. No of Floors */}
            <Field label="e. No of Floors">
              <input type="text" className={inputCls} placeholder="Enter no of floors" value={fields.kotakBbgNumberOfFloors || ''} onChange={e => handleChange('kotakBbgNumberOfFloors', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* f. Quality of The Construction */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>f. Quality of The Construction</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgQualityOfConstructionNA} onChange={e => handleChange('kotakBbgQualityOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgQualityOfConstructionNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgQualityOfConstruction || ''} onChange={e => handleChange('kotakBbgQualityOfConstruction', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Dilapidated">Dilapidated</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgQualityOfConstruction === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom quality" value={fields.kotakBbgQualityOfConstructionCustom || ''} onChange={e => handleChange('kotakBbgQualityOfConstructionCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* g. Technical details (Finishing, interiors) */}
            <Field label="g. Technical details (Finishing, interiors)">
              <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter technical details..." value={fields.kotakBbgTechnicalDetails || ''} onChange={e => handleChange('kotakBbgTechnicalDetails', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* h. Amenities provided in building/ Complex (lifts, parking etc) */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>h. Amenities provided in building/ Complex (lifts, parking etc)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgAmenitiesNA} onChange={e => handleChange('kotakBbgAmenitiesNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgAmenitiesNA ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4">
                    {['Parking', 'Lifts', 'Firefighting Arrangement', 'Boundary wall with MS gate', 'Power Backup', 'Security'].map(type => (
                      <label key={type} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={amenities.includes(type)} onChange={() => toggleAmenity(type)} disabled={isReadOnly} />
                        <span>{type}</span>
                      </label>
                    ))}
                    <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={!!fields.kotakBbgAmenitiesCustomChecked} onChange={e => handleChange('kotakBbgAmenitiesCustomChecked', e.target.checked)} disabled={isReadOnly} />
                      <span>Custom</span>
                    </label>
                  </div>
                  {fields.kotakBbgAmenitiesCustomChecked && (
                    <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter other custom amenities..." value={fields.kotakBbgAmenitiesCustom || ''} onChange={e => handleChange('kotakBbgAmenitiesCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* i. Usage of the property */}
            <PrefillField
              label="i. Usage of the property"
              value={fields.kotakBbgUsageOfProperty}
              onChange={(val: string) => handleChange('kotakBbgUsageOfProperty', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from section 2, "Nature of the property"'
              fallbackValue={fields.kotakBbgNatureOfProperty === 'Custom' ? fields.kotakBbgNatureOfPropertyCustom : fields.kotakBbgNatureOfProperty}
              type="select"
              options={[
                { label: 'Select Option', value: '' },
                { label: 'Industrial', value: 'Industrial' },
                { label: 'Industrial(Flour Mill)', value: 'Industrial(Flour Mill)' },
                { label: 'Commercial', value: 'Commercial' },
                { label: 'Residential', value: 'Residential' },
                { label: 'Custom', value: 'Custom' }
              ]}
              customInputProps={{
                placeholder: "Enter custom usage",
                value: fields.kotakBbgUsageOfPropertyCustom || '',
                onChange: (val: string) => handleChange('kotakBbgUsageOfPropertyCustom', val)
              }}
            />

          </div>
        );
      }
    },
    {
      id: 'kotak-section-6',
      title: 'Details of measurements',
      number: 6,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        
        let calculatedAcres = '';
        if (fields.kotakBbgLandAreaDescriptiveDetails && !fields.kotakBbgLandAreaDescriptiveDetailsNA) {
          const match = fields.kotakBbgLandAreaDescriptiveDetails.match(/[\d,]+(\.\d+)?/);
          if (match) {
            const numStr = match[0].replace(/,/g, '');
            const acres = parseFloat(numStr) / 43560;
            calculatedAcres = isNaN(acres) ? '' : acres.toFixed(3);
          }
        }

        return (
          <div style={{ backgroundColor: '#e0f7fa', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* a. Area of land */}
            <Field label="a. Area of land (if applicable) supported by documentary proof, shape, dimensions and physical features FSI permissible, utilized, balance">
              <div className="space-y-4 p-4 border border-cyan-200 rounded-lg bg-white/80 shadow-sm">
                
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-gray-700">Land Area (Sq.Ft) & Descriptive Details</span>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                      <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgLandAreaDescriptiveDetailsNA} onChange={e => handleChange('kotakBbgLandAreaDescriptiveDetailsNA', e.target.checked)} disabled={isReadOnly} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                    </label>
                  </div>
                  {!fields.kotakBbgLandAreaDescriptiveDetailsNA ? (
                    <textarea className={inputCls + ' resize-y'} rows={3} placeholder='e.g. "137214 As per Sale Deed/ROR", shape, physical features...' value={fields.kotakBbgLandAreaDescriptiveDetails || ''} onChange={e => handleChange('kotakBbgLandAreaDescriptiveDetails', e.target.value)} disabled={isReadOnly} />
                  ) : (
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                  )}
                </div>

                <div className="flex flex-col space-y-1.5 pt-2 border-t border-cyan-100">
                  <span className="text-sm font-medium text-gray-700">Auto-Converted Land Area (Acres/Decs)</span>
                  <div className="relative">
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={calculatedAcres} disabled />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Auto calculating from [Sq.Ft / 43,560]">
                      <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </div>
                </div>

              </div>
            </Field>

            {/* b. Building/ flat/ office/ shop/ unit/ showroom area */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>b. Building/ flat/ office/ shop/ unit/ showroom area (please specify the measurement unit, Area - Carpet, Built up, Super built up and basis of building area)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case" title={isVacantLand ? "Auto-checked because Nature of Property is Vacant Land" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgBuildingAreaDetailsNA || isVacantLand} onChange={e => handleChange('kotakBbgBuildingAreaDetailsNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!(fields.kotakBbgBuildingAreaDetailsNA || isVacantLand) ? (
                <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Enter building area details..." value={fields.kotakBbgBuildingAreaDetails || ''} onChange={e => handleChange('kotakBbgBuildingAreaDetails', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* c. Deviations/ violations (if any, please elaborate) */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>c. Deviations/ violations (if any, please elaborate)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgDeviationsNA} onChange={e => handleChange('kotakBbgDeviationsNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgDeviationsNA ? (
                <div className="space-y-2">
                  <select className={inputCls} value={fields.kotakBbgDeviations || ''} onChange={e => handleChange('kotakBbgDeviations', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Approved Plan not Available">Approved Plan not Available</option>
                    <option value="No Deviations">No Deviations</option>
                    <option value="Minor Deviations">Minor Deviations</option>
                    <option value="Major Deviations">Major Deviations</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgDeviations === 'Custom' && (
                    <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Describe deviations/violations" value={fields.kotakBbgDeviationsCustom || ''} onChange={e => handleChange('kotakBbgDeviationsCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-7',
      title: 'Valuation',
      number: 7,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        const valMethodologyTemplate = "The Cost or Land and Building Method of valuation, also known as the Cost Approach, determines a property's value by summing the market value of the land and the depreciated reproduction or replacement cost of the building. It is most appropriate for valuing new or unique properties for which there is a significant variation between the market value and the benchmark value of the property because sale deeds are often executed at lower rates to avoid higher stamp duty.";

        // Extract SqFt from Section 6a descriptive text
        let extractedSqFt = 0;
        if (fields.kotakBbgLandAreaDescriptiveDetails && !fields.kotakBbgLandAreaDescriptiveDetailsNA) {
          const match = fields.kotakBbgLandAreaDescriptiveDetails.match(/[\d,]+(\.\d+)?/);
          if (match) {
            extractedSqFt = parseFloat(match[0].replace(/,/g, '')) || 0;
          }
        }

        // d. Land Rate
        const landRate = parseFloat(fields.kotakBbgAdoptedLandRate) || 0;

        // f. Calculated values
        const calculatedLandValue = extractedSqFt * landRate;
        const buildingValue = parseFloat(fields.kotakBbgBuildingValue) || 0;
        const totalValuation = calculatedLandValue + (fields.kotakBbgBuildingValueNA || isVacantLand ? 0 : buildingValue);

        // f. Generated calculation summary
        const calcSummary = `Land = ${extractedSqFt.toLocaleString('en-IN')}sqft @ Rs.${landRate.toLocaleString('en-IN')}/- per Sqft = Rs.${calculatedLandValue.toLocaleString('en-IN')}/-...........(i)\nBuilding=Rs.${(fields.kotakBbgBuildingValueNA || isVacantLand ? 0 : buildingValue).toLocaleString('en-IN')}/-...........(ii)\nTotal(i+ii)=Rs.${totalValuation.toLocaleString('en-IN')}/-`;

        // g. Guideline Rate
        const guidelineRate = parseFloat(fields.kotakBbgGuidelineRate) || 0;
        const calculatedGuidelineValuation = extractedSqFt * guidelineRate;
        const guidelineSummary = `Land = ${extractedSqFt.toLocaleString('en-IN')}sqft @ Rs.${guidelineRate.toLocaleString('en-IN')}/- per Sqft = Rs.${calculatedGuidelineValuation.toLocaleString('en-IN')}/-`;

        return (
          <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">

            {/* a. Details of Valuation methodology */}
            <PrefillField
              label="a. Details of Valuation methodology and reason for the same"
              value={fields.kotakBbgValuationMethodology}
              onChange={(val: string) => handleChange('kotakBbgValuationMethodology', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
              fallbackValue={valMethodologyTemplate}
              type="textarea"
            />

            {/* b. Comparables relied upon (Minimum three) */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>b. Comparables relied upon (Minimum three)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgComparablesReliedNA} onChange={e => handleChange('kotakBbgComparablesReliedNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgComparablesReliedNA ? (
                <textarea className={inputCls + ' resize-y'} rows={4} placeholder="List the comparables relied upon..." value={fields.kotakBbgComparablesRelied || ''} onChange={e => handleChange('kotakBbgComparablesRelied', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* c. Analysis of comparables */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>c. Analysis of comparables and basis for adopting a particular rate (Please exhaustively elaborate)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgAnalysisComparablesNA} onChange={e => handleChange('kotakBbgAnalysisComparablesNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgAnalysisComparablesNA ? (
                <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Explain justification for rate selection..." value={fields.kotakBbgAnalysisComparables || ''} onChange={e => handleChange('kotakBbgAnalysisComparables', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* d. Land Rate Adopted */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>d. Land Rate Adopted (if applicable) (INR per Sq.Ft)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgAdoptedLandRateNA} onChange={e => handleChange('kotakBbgAdoptedLandRateNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgAdoptedLandRateNA ? (
                <input type="number" className={inputCls} placeholder="e.g. 1260" value={fields.kotakBbgAdoptedLandRate || ''} onChange={e => handleChange('kotakBbgAdoptedLandRate', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* e. Building rate (depreciated/composite) */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>e. Building/ flat/ office/ shop/ unit/ showroom rate (depreciated/ composite) adopted and reason for the same (Please exhaustively elaborate)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case" title={isVacantLand ? "Auto-checked because Nature of Property is Vacant Land" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgAdoptedBuildingRateNA || isVacantLand} onChange={e => handleChange('kotakBbgAdoptedBuildingRateNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!(fields.kotakBbgAdoptedBuildingRateNA || isVacantLand) ? (
                <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Enter building rate details and reasoning..." value={fields.kotakBbgAdoptedBuildingRateDetails || ''} onChange={e => handleChange('kotakBbgAdoptedBuildingRateDetails', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* f. Valuation calculations */}
            <Field label="f. Valuation calculations">
              <div className="space-y-4 p-4 border border-purple-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Land Area (Sq.Ft) - locked from Section 6a */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Land Area (Sq.Ft)</span>
                    <div className="relative">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={extractedSqFt ? extractedSqFt.toLocaleString('en-IN') : ''} disabled title='Prefill from section 6, "a. Area of land (Sq.Ft)"' />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 6, "a. Area of land (Sq.Ft)"'>
                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Land Value (INR) - locked auto-calc */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Calculated Land Value (INR)</span>
                    <div className="relative">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={calculatedLandValue ? `₹ ${calculatedLandValue.toLocaleString('en-IN')}` : ''} disabled title="Auto calculating from [Land Area × Adopted Land Rate]" />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Auto calculating from [Land Area × Adopted Land Rate]">
                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-100">
                  {/* Building Value (INR) */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium text-gray-700">Building Value (INR)</span>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" title={isVacantLand ? "Auto-checked because Nature of Property is Vacant Land" : ""}>
                        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgBuildingValueNA || isVacantLand} onChange={e => handleChange('kotakBbgBuildingValueNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                      </label>
                    </div>
                    {!(fields.kotakBbgBuildingValueNA || isVacantLand) ? (
                      <input type="number" className={inputCls} placeholder="Enter building value" value={fields.kotakBbgBuildingValue || ''} onChange={e => handleChange('kotakBbgBuildingValue', e.target.value)} disabled={isReadOnly} />
                    ) : (
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
                    )}
                  </div>

                  {/* Total Valuation (INR) - locked auto-calc */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Total Valuation (INR)</span>
                    <div className="relative">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={totalValuation ? `₹ ${totalValuation.toLocaleString('en-IN')}` : ''} disabled title="Auto calculating from [Land Value + Building Value]" />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Auto calculating from [Land Value + Building Value]">
                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generated Calculation Summary */}
                <div className="pt-2 border-t border-purple-100">
                  <PrefillField
                    label="Generated Calculation Summary"
                    value={fields.kotakBbgValuationCalcSummary}
                    onChange={(val: string) => handleChange('kotakBbgValuationCalcSummary', val)}
                    isReadOnly={isReadOnly}
                    tooltip="Auto-generated from valuation calculations"
                    fallbackValue={calcSummary}
                    type="textarea"
                  />
                </div>
              </div>
            </Field>

            {/* g. Guideline/ Circle/ Ready Reckoner Rate */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>g. Guideline/ Circle/ Ready Reckoner Rate (INR per Sq.Ft)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgGuidelineRateNA} onChange={e => handleChange('kotakBbgGuidelineRateNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!fields.kotakBbgGuidelineRateNA ? (
                <input type="number" className={inputCls} placeholder="e.g. 161" value={fields.kotakBbgGuidelineRate || ''} onChange={e => handleChange('kotakBbgGuidelineRate', e.target.value)} disabled={isReadOnly} />
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

            {/* h. Guideline/ Circle/ Ready Reckoner Valuation */}
            <Field label="h. Guideline/ Circle/ Ready Reckoner Valuation (please elaborate)">
              <div className="space-y-4 p-4 border border-purple-200 rounded-lg bg-white/80 shadow-sm">
                {/* Calculated Guideline Valuation (INR) - locked auto-calc */}
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Calculated Guideline Valuation (INR)</span>
                  <div className="relative">
                    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={calculatedGuidelineValuation ? `₹ ${calculatedGuidelineValuation.toLocaleString('en-IN')}` : ''} disabled title="Auto calculating from [Land Area × Guideline Rate]" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Auto calculating from [Land Area × Guideline Rate]">
                      <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Generated Guideline Summary */}
                <div className="pt-2 border-t border-purple-100">
                  <PrefillField
                    label="Generated Guideline Summary"
                    value={fields.kotakBbgGuidelineSummary}
                    onChange={(val: string) => handleChange('kotakBbgGuidelineSummary', val)}
                    isReadOnly={isReadOnly}
                    tooltip="Auto-generated from guideline calculations"
                    fallbackValue={guidelineSummary}
                    type="textarea"
                  />
                </div>
              </div>
            </Field>

          </div>
        );
      }
    },
    {
      id: 'kotak-section-8',
      title: 'Summary',
      number: 8,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        
        // Recalculate values from previous sections
        let extractedSqFt = 0;
        if (fields.kotakBbgLandAreaDescriptiveDetails && !fields.kotakBbgLandAreaDescriptiveDetailsNA) {
          const match = fields.kotakBbgLandAreaDescriptiveDetails.match(/[\d,]+(\.\d+)?/);
          if (match) {
            extractedSqFt = parseFloat(match[0].replace(/,/g, '')) || 0;
          }
        }
        const landRate = parseFloat(fields.kotakBbgAdoptedLandRate) || 0;
        const calculatedLandValue = extractedSqFt * landRate;
        const buildingValue = parseFloat(fields.kotakBbgBuildingValue) || 0;
        const exactBuildingValue = fields.kotakBbgBuildingValueNA || isVacantLand ? 0 : buildingValue;
        const exactFmv = calculatedLandValue + exactBuildingValue;
        
        const roundedFmv = parseFloat(fields.kotakBbgFmvRounded) || 0;
        const fmvSummary = `Rs.${exactFmv.toLocaleString('en-IN')}/- or Say Rs.${roundedFmv.toLocaleString('en-IN')}/-`;

        const rvPercent = fields.kotakBbgRvPercent !== undefined ? parseFloat(fields.kotakBbgRvPercent) : 90;
        const calcRv = (roundedFmv * rvPercent) / 100;
        
        const dvPercent = fields.kotakBbgDvPercent !== undefined ? parseFloat(fields.kotakBbgDvPercent) : 80;
        const calcDv = (roundedFmv * dvPercent) / 100;

        return (
          <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            
            {/* a. Fair Market Value */}
            <Field label="a. Fair Market Value (To be rounded to the nearest Cr/Lakh)">
              <div className="space-y-4 p-4 border border-pink-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Exact FMV (INR)</span>
                    <div className="relative">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={exactFmv ? `₹ ${exactFmv.toLocaleString('en-IN')}` : ''} disabled title='Prefill from section 7, "f. Total Valuation (INR)"' />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 7, "f. Total Valuation (INR)"'>
                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Rounded FMV (Say Value) (INR)</span>
                    <input type="number" className={inputCls} placeholder="e.g. 310900000" value={fields.kotakBbgFmvRounded || ''} onChange={e => handleChange('kotakBbgFmvRounded', e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
                <div className="pt-2 border-t border-pink-100">
                  <PrefillField
                    label="Generated FMV Summary"
                    value={fields.kotakBbgFmvSummary}
                    onChange={(val: string) => handleChange('kotakBbgFmvSummary', val)}
                    isReadOnly={isReadOnly}
                    tooltip="Auto-generated from FMV values"
                    fallbackValue={fmvSummary}
                    type="textarea"
                  />
                </div>
              </div>
            </Field>

            {/* b. Realizable Value */}
            <Field label="b. Realizable Value (To be rounded to the nearest Cr/Lakh)">
              <div className="space-y-4 p-4 border border-pink-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Realizable Value Factor (%)</span>
                    <div className="relative">
                      <input type="number" className={inputCls + ' pr-8'} placeholder="90" value={fields.kotakBbgRvPercent !== undefined ? fields.kotakBbgRvPercent : '90'} onChange={e => handleChange('kotakBbgRvPercent', e.target.value)} disabled={isReadOnly} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Calculated RV (INR)</span>
                    <div className="relative">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={calcRv ? `₹ ${calcRv.toLocaleString('en-IN')}` : ''} disabled title="Auto calculating from [Rounded FMV × RV %]" />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Auto calculating from [Rounded FMV × RV %]">
                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Rounded RV (Say Value) (INR)</span>
                    <input type="number" className={inputCls} placeholder="Enter rounded RV" value={fields.kotakBbgRvRounded || ''} onChange={e => handleChange('kotakBbgRvRounded', e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
              </div>
            </Field>

            {/* c. Distress Value */}
            <Field label="c. Distress Value (To be rounded to the nearest Cr/Lakh)">
              <div className="space-y-4 p-4 border border-pink-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Distress Value Factor (%)</span>
                    <div className="relative">
                      <input type="number" className={inputCls + ' pr-8'} placeholder="80" value={fields.kotakBbgDvPercent !== undefined ? fields.kotakBbgDvPercent : '80'} onChange={e => handleChange('kotakBbgDvPercent', e.target.value)} disabled={isReadOnly} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Calculated DV (INR)</span>
                    <div className="relative">
                      <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={calcDv ? `₹ ${calcDv.toLocaleString('en-IN')}` : ''} disabled title="Auto calculating from [Rounded FMV × DV %]" />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="Auto calculating from [Rounded FMV × DV %]">
                        <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Rounded DV (Say Value) (INR)</span>
                    <input type="number" className={inputCls} placeholder="Enter rounded DV" value={fields.kotakBbgDvRounded || ''} onChange={e => handleChange('kotakBbgDvRounded', e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
              </div>
            </Field>

            {/* d. Insurable Value */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>d. Insurable Value (To be rounded to the nearest Cr/Lakh)</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case" title={isVacantLand ? "Auto-checked because Nature of Property is Vacant Land" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={!!fields.kotakBbgIvNA || isVacantLand} onChange={e => handleChange('kotakBbgIvNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!(fields.kotakBbgIvNA || isVacantLand) ? (
                <div className="space-y-4 p-4 border border-pink-200 rounded-lg bg-white/80 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">Exact Insurable Value (INR)</span>
                      <div className="relative">
                        <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-700 pr-8'} value={exactBuildingValue ? `₹ ${exactBuildingValue.toLocaleString('en-IN')}` : ''} disabled title='Prefill from section 7, "f. Building Value (INR)"' />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefill from section 7, "f. Building Value (INR)"'>
                          <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-sm font-medium text-gray-700">Rounded Insurable Value (Say Value) (INR)</span>
                      <input type="number" className={inputCls} placeholder="Enter rounded IV" value={fields.kotakBbgIvRounded || ''} onChange={e => handleChange('kotakBbgIvRounded', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>
                </div>
              ) : (
                <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed text-gray-500'} value="NA" disabled />
              )}
            </Field>

          </div>
        );
      }
    },
    {
      id: 'kotak-section-9',
      title: 'Remarks / Key Observations',
      number: 9,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const defaultDisclaimers = "The valuer assumes no responsibility for legal title. The valuation is strictly for bank internal use based on current market trends and visible site conditions.";
        const disclaimersVal = fields.kotakBbgStandardDisclaimers || defaultDisclaimers;
        
        const riskOptions = ['High-Tension Line overhead', 'Encroachment', 'Boundary Dispute', 'Road Access Issue', 'Low-Lying Flood Prone', 'Custom'];
        const currentRisks = Array.isArray(fields.kotakBbgRiskFactors) ? fields.kotakBbgRiskFactors : [];
        const toggleRisk = (risk: string) => {
          let newRisks = [...currentRisks];
          if (newRisks.includes(risk)) {
            newRisks = newRisks.filter(r => r !== risk);
          } else {
            newRisks.push(risk);
          }
          handleChange('kotakBbgRiskFactors', newRisks);
        };

        return (
          <div style={{ backgroundColor: '#e0f2f1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Standard Disclaimers"
              value={disclaimersVal}
              onChange={(val: string) => handleChange('kotakBbgStandardDisclaimers', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
              type="textarea"
            />

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Key Risk Factors / Alerts</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgRiskFactorsNA} onChange={e => handleChange('kotakBbgRiskFactorsNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgRiskFactorsNA ? (
    <div className="space-y-4 rounded-lg bg-white bg-opacity-50">
      <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {riskOptions.map(risk => (
                        <label key={risk} className="flex items-center space-x-2 text-sm bg-white bg-opacity-50 p-2 rounded border border-teal-100">
                          <input type="checkbox" checked={currentRisks.includes(risk)} onChange={() => toggleRisk(risk)} disabled={isReadOnly} />
                          <span>{risk}</span>
                        </label>
                      ))}
                    </div>
                    {currentRisks.includes('Custom') && (
                      <input type="text" className={inputCls} placeholder="Enter custom risk factor" value={fields.kotakBbgRiskFactorsCustom || ''} onChange={e => handleChange('kotakBbgRiskFactorsCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
    </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Final Recommendation">
              <select className={inputCls} value={fields.kotakBbgFinalRecommendation || ''} onChange={e => handleChange('kotakBbgFinalRecommendation', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Recommended for Funding">Recommended for Funding</option>
                <option value="Recommended with Conditions">Recommended with Conditions</option>
                <option value="Not Recommended">Not Recommended</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgFinalRecommendation === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom recommendation" value={fields.kotakBbgFinalRecommendationCustom || ''} onChange={e => handleChange('kotakBbgFinalRecommendationCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Detailed Remarks & Additional Observations</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgRemarksNA} onChange={e => handleChange('kotakBbgRemarksNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgRemarksNA ? (
    <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Enter any additional key remarks or observations regarding the property..." value={fields.kotakBbgRemarks || ''} onChange={e => handleChange('kotakBbgRemarks', e.target.value)} disabled={isReadOnly} />
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-10',
      title: 'Declaration',
      number: 10,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const siteVisitDate = fields.kotakBbgDateOfVisit || '[Date from Section 1]';
        const clausesText = `I hereby declare that -
(a) the Valuation Report prepared and the information contained herein is true and correct to the best of my knowledge and belief :
(b) I have no direct or indirect interest in the property valued;
(c) I have personally inspected the property on / I have deputed my employed qualified/ experienced site engineer for inspecting the property on ${siteVisitDate}`;
        
        const today = new Date().toISOString().split('T')[0];

        return (
          <div style={{ backgroundColor: '#e8eaf6', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            
            {/* a. Standard Declaration Legal Clauses */}
            <Field label="a. Standard Declaration Legal Clauses">
              <div className="space-y-4 p-4 border border-indigo-200 rounded-lg bg-white/80 shadow-sm relative group">
                <div className="p-3 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner cursor-not-allowed">
                  {clausesText}
                </div>
                <div className="absolute top-2 right-2 cursor-help" title="Auto calculating from [Section 1 Inspection Date]">
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
                <label className="flex items-start space-x-2 text-sm text-indigo-900 font-semibold bg-indigo-50 p-3 rounded border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" checked={fields.kotakBbgDeclarationConfirmed || false} onChange={e => handleChange('kotakBbgDeclarationConfirmed', e.target.checked)} disabled={isReadOnly} />
                  <span>I have read and legally bind myself to the above declarations</span>
                </label>
              </div>
            </Field>
            
            {/* b. Date & Place of Issue */}
            <Field label="b. Date & Place of Issue">
              <div className="space-y-4 p-4 border border-indigo-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Date</span>
                    <PrefillField
                      label=""
                      value={fields.kotakBbgReportIssueDate !== undefined ? fields.kotakBbgReportIssueDate : today}
                      onChange={(val: string) => handleChange('kotakBbgReportIssueDate', val)}
                      isReadOnly={isReadOnly}
                      tooltip="Prefill from System Current Date"
                      type="date"
                    />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Place</span>
                    <PrefillField
                      label=""
                      value={fields.kotakBbgReportIssuePlace !== undefined ? fields.kotakBbgReportIssuePlace : 'Bhubaneswar'}
                      onChange={(val: string) => handleChange('kotakBbgReportIssuePlace', val)}
                      isReadOnly={isReadOnly}
                      tooltip="Prefill from Valuer Profile"
                      type="select"
                      options={[
                        { label: 'Bhubaneswar', value: 'Bhubaneswar' },
                        { label: 'Cuttack', value: 'Cuttack' },
                        { label: 'Rourkela', value: 'Rourkela' },
                        { label: 'Custom', value: 'Custom' }
                      ]}
                    />
                    {fields.kotakBbgReportIssuePlace === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom place" value={fields.kotakBbgReportIssuePlaceCustom || ''} onChange={e => handleChange('kotakBbgReportIssuePlaceCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
                </div>
              </div>
            </Field>

            {/* c. Signature / Stamp of empanelled valuer */}
            <Field label="c. Signature / Stamp of empanelled valuer">
              <div className="space-y-4 p-4 border border-indigo-200 rounded-lg bg-white/80 shadow-sm">
                <PrefillField
                  label="System Generated Signature & Stamp"
                  value={fields.kotakBbgSignatureConfirmed ? 'Confirmed' : ''}
                  onChange={() => handleChange('kotakBbgSignatureConfirmed', !fields.kotakBbgSignatureConfirmed)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill from Valuer Profile"
                  type="text" 
                  renderCustomInput={(isLocked) => (
                    <div className="space-y-4">
                      {isLocked ? (
                        <div className="w-full h-32 bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400 italic rounded shadow-inner cursor-not-allowed">
                          <span className="text-gray-500 mb-2 font-semibold">Digitized Signature & Stamp</span>
                          [Preview: Profile Signature Image]
                        </div>
                      ) : (
                        <div className="w-full p-4 border-2 border-dashed border-indigo-300 rounded bg-white flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
                          <span className="text-gray-600 mb-2 font-medium">Override with Manual File Upload</span>
                          <label className="text-sm text-white bg-indigo-600 px-4 py-2 rounded cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                            <input type="file" className="hidden" disabled={isReadOnly} />
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </Field>

          </div>
        );
      }
    }
  ],
};

export default function KotakBBG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={KOTAK_BBG_CONFIG} {...props} />;
}
