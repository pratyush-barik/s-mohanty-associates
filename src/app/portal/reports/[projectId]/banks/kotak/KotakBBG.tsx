'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Unlock } from 'lucide-react';
import { PDFKotakBbgRenderer } from '@/lib/banks/pdf-kotak-bbg-renderer';

const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text', fallbackValue, options }: any) => {
  const [isEdit, setIsEdit] = useState(false);

  const handleToggle = () => {
    const newEditState = !isEdit;
    setIsEdit(newEditState);
    if (!newEditState && fallbackValue !== undefined) {
      onChange(fallbackValue);
    }
  };

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
             value={value || ''}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
             rows={3}
           />
        ) : type === 'select' ? (
          <select
             className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
             value={value || ''}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
          >
            {/* @ts-ignore */}
            {options?.map((opt: any, i: number) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={value || ''}
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
    { id: 'kotak-section-2', title: '2. Details of the Property Being Appraised', shortName: '2. Property Details' },
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
              label="Purpose of Valuation"
              value={purposeVal}
              onChange={(val: string) => handleChange('kotakBbgPurpose', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
              fallbackValue={newPurpose}
            />
            
            <Field label="Date of Valuation">
              <input
                type="date"
                className={inputCls}
                value={fields.kotakBbgDateOfValuation || today}
                onChange={e => handleChange('kotakBbgDateOfValuation', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Name of the Valuer">
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
                      <span className="flex-1 pr-4">Name of the qualified/ experienced Site engineer inspecting the property</span>
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

            <Field label="Name of Customer">
              <input
                type="text"
                className={inputCls}
                value={borrowerName}
                onChange={e => handleChange('kotakBbgBorrowerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Name of the property owner/owners as per legal docs">
              <textarea 
                className={inputCls + ' resize-y w-full'} 
                rows={2} 
                placeholder="Owner Name(s)" 
                value={fields.kotakBbgOwnerName !== undefined ? fields.kotakBbgOwnerName : borrowerName} 
                onChange={e => handleChange('kotakBbgOwnerName', e.target.value)} 
                disabled={isReadOnly} 
              />
            </Field>

            <Field label="Date of Technical Site Visit">
              <input
                type="date"
                className={inputCls}
                value={fields.kotakBbgDateOfSiteVisit || today}
                onChange={e => handleChange('kotakBbgDateOfSiteVisit', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            
            <Field label="Person Met at Site & Contact Details">
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
            <Field label="Technical Address of the Property (Please be descriptive mentioning landmark, road, post code etc)">
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
                  label="Legal Address of the Property"
                  value={legalAddrVal}
                  onChange={(val: string) => handleChange('kotakBbgLegalAddress', val)}
                  isReadOnly={isReadOnly}
                  tooltip='Prefill from section 2, "Technical Address"'
                  fallbackValue={techAddr}
                  type="textarea"
                />
              );
            })()}

            <Field label="Google Coordinates">
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

            <Field label="Nature of the property">
              <div className="space-y-2">
                <select className={inputCls} value={fields.kotakBbgNatureOfProperty || ''} onChange={e => handleChange('kotakBbgNatureOfProperty', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Nature</option>
                  <option value="Vacant Land">Vacant Land</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.kotakBbgNatureOfProperty === 'Custom' && (
                  <input type="text" className={inputCls} placeholder="Enter custom nature" value={fields.kotakBbgNatureOfPropertyCustom || ''} onChange={e => handleChange('kotakBbgNatureOfPropertyCustom', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Tenure of the property (Freehold/leasehold)">
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
                <span>If leasehold please stipulate important lease terms</span>
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
                <span>Are the leasehold rights transferable?</span>
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
                <span>Occupancy details (Details if rented)</span>
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
        
        // b. Whether boundaries matching
        const matchingDocVal = sameAsDoc ? 'Yes' : (fields.kotakBbgBoundariesMatching || '');

        // c. Discrepancy
        const isDiscrepancyNA = matchingDocVal === 'Yes' || !!fields.kotakBbgBoundariesDiscrepancyNA;

        // d. Documents basis identified
        const docBasisTemplate = "By Boundaries matching at site as per the sketch map & documents provided";

        // k. Proximity
        const amenitiesTemplate = "All civic amenities like schools, hospitals, offices, markets, cinemas, etc. are within a radius of 3Kms to 5Kms from our subject property";

        return (
          <div style={{ backgroundColor: '#e8f5e9', padding: '24px', borderRadius: '12px' }} className="space-y-6 shadow-sm border border-[#c8e6c9]">
            {/* a. Boundaries as per legal / Sale Deed & Boundaries As Per Site */}
            <div className="p-4 bg-white/80 rounded-xl border border-[#c8e6c9] shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-800">a. Boundaries as per legal / Sale Deed & Boundaries As Per Site</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* b. Whether Boundaries matching */}
            <PrefillField
              label="b. Whether Boundaries matching (actual site verification with Legal docs)"
              value={fields.kotakBbgBoundariesMatching}
              onChange={(val: string) => handleChange('kotakBbgBoundariesMatching', val)}
              isReadOnly={isReadOnly}
              tooltip={sameAsDoc ? 'Auto calculating from Same as Legal / Sale Deed' : 'Prefill from system'}
              fallbackValue={matchingDocVal}
              type="select"
              options={[
                { label: 'Select Option', value: '' },
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />

            {/* c. Discrepancy found */}
            <Field label={
              <div className="flex items-center justify-between w-full">
                <span>c. Discrepancy found in Boundaries, if any, pl specify/ elaborate</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" title={matchingDocVal === 'Yes' ? "Auto-checked because boundaries match" : ""}>
                  <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50" checked={isDiscrepancyNA} onChange={e => handleChange('kotakBbgBoundariesDiscrepancyNA', e.target.checked)} disabled={isReadOnly || matchingDocVal === 'Yes'} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NA</span>
                </label>
              </div>
            }>
              {!isDiscrepancyNA ? (
                <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Specify discrepancies..." value={fields.kotakBbgBoundariesDiscrepancy || ''} onChange={e => handleChange('kotakBbgBoundariesDiscrepancy', e.target.value)} disabled={isReadOnly} />
              ) : (
                <div title={matchingDocVal === 'Yes' ? "Auto calculating from field b (Yes)" : ""} className="relative group flex items-center cursor-help">
                  <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed pr-8 text-gray-500'} value="NA" disabled />
                  {matchingDocVal === 'Yes' && <Lock size={14} className="absolute right-3 text-gray-400 group-hover:text-gray-600" />}
                </div>
              )}
            </Field>

            {/* d. Documents basis which property is identified */}
            <PrefillField
              label="d. Documents basis which property is identified"
              value={fields.kotakBbgDocumentsIdentified}
              onChange={(val: string) => handleChange('kotakBbgDocumentsIdentified', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from System Template'
              fallbackValue={docBasisTemplate}
              type="textarea"
            />

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
              <div className="p-4 bg-white/80 rounded-xl border border-[#c8e6c9] shadow-sm space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Classification</span>
                  <select className={inputCls} value={fields.kotakBbgLocalityClassification || ''} onChange={e => handleChange('kotakBbgLocalityClassification', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Classification</option>
                    <option value="Developing Gram Panchayat">Developing Gram Panchayat</option>
                    <option value="Developed Residential">Developed Residential</option>
                    <option value="Urban Commercial">Urban Commercial</option>
                    <option value="Industrial Hub">Industrial Hub</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgLocalityClassification === 'Custom' && (
                    <input type="text" className={`${inputCls} mt-2 border-emerald-300 focus:ring-emerald-500`} placeholder="Enter custom classification" value={fields.kotakBbgLocalityClassificationCustom || ''} onChange={e => handleChange('kotakBbgLocalityClassificationCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Detailed Condition Description</span>
                  <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Describe the condition..." value={fields.kotakBbgLocalityCondition || ''} onChange={e => handleChange('kotakBbgLocalityCondition', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/80 rounded-xl border border-[#c8e6c9] shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Width</span>
                  <div className="flex space-x-2">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Width" value={fields.kotakBbgAccessWidth || ''} onChange={e => handleChange('kotakBbgAccessWidth', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-28 bg-gray-50 border-gray-200'} value={fields.kotakBbgAccessWidthUnit || 'Feet'} onChange={e => handleChange('kotakBbgAccessWidthUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="Feet">Feet</option>
                      <option value="Meters">Meters</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Road Type/Ownership</span>
                  <select className={inputCls} value={fields.kotakBbgAccessType || ''} onChange={e => handleChange('kotakBbgAccessType', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Road Type</option>
                    <option value="Govt. Road">Govt. Road</option>
                    <option value="Private Road">Private Road</option>
                    <option value="NH">NH</option>
                    <option value="SH">SH</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgAccessType === 'Custom' && (
                    <input type="text" className={`${inputCls} mt-2 border-emerald-300 focus:ring-emerald-500`} placeholder="Enter custom type" value={fields.kotakBbgAccessTypeCustom || ''} onChange={e => handleChange('kotakBbgAccessTypeCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              </div>
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
            <PrefillField
              label="k. Proximity to civic amenities like schools, hospitals, offices, markets, cinemas, etc."
              value={fields.kotakBbgCivicAmenities}
              onChange={(val: string) => handleChange('kotakBbgCivicAmenities', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from System Template'
              fallbackValue={amenitiesTemplate}
              type="textarea"
            />
          </div>
        );
      }
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
                  <span className="text-sm font-medium text-gray-700">Document Type</span>
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
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Registration / Document Number</span>
                  <input type="text" className={inputCls} value={fields.kotakBbgDeedNo || ''} onChange={e => handleChange('kotakBbgDeedNo', e.target.value)} disabled={isReadOnly} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Date</span>
                  <input type="date" className={inputCls} value={fields.kotakBbgDeedDate || ''} onChange={e => handleChange('kotakBbgDeedDate', e.target.value)} disabled={isReadOnly} />
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
    },
    {
      id: 'kotak-section-5',
      title: '5. Building/ Flat/ Office/ Shop Details',
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
                    <span className="text-sm font-medium text-gray-700">Type of Construction</span>
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
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Roofing</span>
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
                </div>
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Special Architectural Features</span>
                  <input type="text" className={inputCls} placeholder="Enter special features if any" value={fields.kotakBbgSpecialFeatures || ''} onChange={e => handleChange('kotakBbgSpecialFeatures', e.target.value)} disabled={isReadOnly} />
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
              <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-white/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Number of Floors</span>
                    <input type="number" className={inputCls} min="1" value={fields.kotakBbgNumberOfFloors || ''} onChange={e => handleChange('kotakBbgNumberOfFloors', e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-sm font-medium text-gray-700">Elevation Profile</span>
                    <select className={inputCls} value={fields.kotakBbgElevationProfile || ''} onChange={e => handleChange('kotakBbgElevationProfile', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="G+1 Storied">G+1 Storied</option>
                      <option value="G+2 Storied">G+2 Storied</option>
                      <option value="G+3 Storied">G+3 Storied</option>
                      <option value="Stilt+G+4 Storied">Stilt+G+4 Storied</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgElevationProfile === 'Custom' && (
                      <input type="text" className={`${inputCls} mt-2`} placeholder="Enter custom elevation" value={fields.kotakBbgElevationProfileCustom || ''} onChange={e => handleChange('kotakBbgElevationProfileCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
                </div>
              </div>
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
              <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-white/80 shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Flooring System</span>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Vitrified Tiles', 'Marble', 'Granite', 'Ceramic Tiles', 'AS Flooring'].map(type => (
                      <label key={type} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={flooringSystems.includes(type)} onChange={() => toggleFlooring(type)} disabled={isReadOnly} />
                        <span>{type}</span>
                      </label>
                    ))}
                    <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={!!fields.kotakBbgFlooringSystemCustomChecked} onChange={e => handleChange('kotakBbgFlooringSystemCustomChecked', e.target.checked)} disabled={isReadOnly} />
                      <span>Custom</span>
                    </label>
                  </div>
                  {fields.kotakBbgFlooringSystemCustomChecked && (
                    <input type="text" className={`${inputCls} mt-2`} placeholder="Enter custom flooring" value={fields.kotakBbgFlooringSystemCustom || ''} onChange={e => handleChange('kotakBbgFlooringSystemCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
                
                <div className="flex flex-col space-y-1.5 pt-2 border-t border-orange-100">
                  <span className="text-sm font-medium text-gray-700">Fittings & Fixtures</span>
                  <select className={inputCls} value={fields.kotakBbgFittingsFixtures || ''} onChange={e => handleChange('kotakBbgFittingsFixtures', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Good quality fittings & fixtures">Good quality fittings & fixtures</option>
                    <option value="Average quality">Average quality</option>
                    <option value="Poor quality">Poor quality</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgFittingsFixtures === 'Custom' && (
                    <input type="text" className={`${inputCls} mt-2`} placeholder="Enter custom fittings & fixtures" value={fields.kotakBbgFittingsFixturesCustom || ''} onChange={e => handleChange('kotakBbgFittingsFixturesCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>

                <div className="flex flex-col space-y-1.5 pt-2 border-t border-orange-100">
                  <span className="text-sm font-medium text-gray-700">Interior/Exterior Finishing Details</span>
                  <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter finishing details..." value={fields.kotakBbgExteriorInteriorFinishing || ''} onChange={e => handleChange('kotakBbgExteriorInteriorFinishing', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
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
      title: 'Details of Measurements',
      number: 6,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        const buaTable: any[] = Array.isArray(fields.kotakBbgBuildingBuaTable) ? fields.kotakBbgBuildingBuaTable : [];
        const addBuaRow = () => handleChange('kotakBbgBuildingBuaTable', [...buaTable, { floor: '', carpet: '', builtUp: '', superBuiltUp: '' }]);
        const removeBuaRow = (idx: number) => handleChange('kotakBbgBuildingBuaTable', buaTable.filter((_: any, i: number) => i !== idx));
        const updateBuaRow = (idx: number, key: string, val: string) => {
          const updated = buaTable.map((r: any, i: number) => i === idx ? { ...r, [key]: val } : r);
          handleChange('kotakBbgBuildingBuaTable', updated);
        };

        return (
          <div style={{ backgroundColor: '#e0f7fa', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Land Area (Primary) */}
            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Land Area (Primary)</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgLandAreaNA} onChange={e => handleChange('kotakBbgLandAreaNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgLandAreaNA ? (
    <div className="flex space-x-4">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Area" value={fields.kotakBbgLandArea || ''} onChange={e => handleChange('kotakBbgLandArea', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-48'} value={fields.kotakBbgLandAreaUnit || ''} onChange={e => handleChange('kotakBbgLandAreaUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Unit</option>
                      <option value="Sq.Ft">Sq.Ft</option>
                      <option value="Sq.Mts">Sq.Mts</option>
                      <option value="Acres">Acres</option>
                      <option value="Cents">Cents</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgLandAreaUnit === 'Custom' && (
                      <input type="text" className={inputCls + ' w-48'} placeholder="Custom unit" value={fields.kotakBbgLandAreaUnitCustom || ''} onChange={e => handleChange('kotakBbgLandAreaUnitCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            {/* Land Area (Secondary) */}
            <Field label="Land Area (Secondary)">
              <div className="space-y-2">
                {!fields.kotakBbgLandAreaNA && (
                  <div className="flex space-x-4">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Secondary Area" value={fields.kotakBbgLandAreaSecondary || ''} onChange={e => handleChange('kotakBbgLandAreaSecondary', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-48'} value={fields.kotakBbgLandAreaSecondaryUnit || ''} onChange={e => handleChange('kotakBbgLandAreaSecondaryUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Unit</option>
                      <option value="Sq.Ft">Sq.Ft</option>
                      <option value="Sq.Mts">Sq.Mts</option>
                      <option value="Acres">Acres</option>
                      <option value="Cents">Cents</option>
                    </select>
                  </div>
                )}
                {fields.kotakBbgLandAreaNA && (
                  <span className="text-sm text-gray-500 italic">Disabled — Land Area marked NA</span>
                )}
              </div>
            </Field>

            {/* Documentary Proof Source */}
            <Field label="Documentary Proof Source">
              <select className={inputCls} value={fields.kotakBbgLandAreaProofSource || ''} onChange={e => handleChange('kotakBbgLandAreaProofSource', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Source</option>
                <option value="Sale Deed">Sale Deed</option>
                <option value="Revenue Records">Revenue Records</option>
                <option value="Sanctioned Plan">Sanctioned Plan</option>
                <option value="Measurement Report">Measurement Report</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgLandAreaProofSource === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom proof source" value={fields.kotakBbgLandAreaProofSourceCustom || ''} onChange={e => handleChange('kotakBbgLandAreaProofSourceCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            {/* Building Built-up Area (BUA) */}
            <Field label="Building Built-up Area (BUA)">
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgBuildingBuaNA || isVacantLand} onChange={e => handleChange('kotakBbgBuildingBuaNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!(fields.kotakBbgBuildingBuaNA || isVacantLand) && (
                  <>
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" checked={fields.kotakBbgBuildingBuaAnnexure || false} onChange={e => handleChange('kotakBbgBuildingBuaAnnexure', e.target.checked)} disabled={isReadOnly} />
                      <span>Details attached in Annexure-II</span>
                    </label>
                    {!fields.kotakBbgBuildingBuaAnnexure && (
                      <div className="space-y-2">
                        {buaTable.map((row: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-5 gap-2 items-end p-2 bg-white bg-opacity-60 rounded border border-cyan-200">
                            <div>
                              <span className="text-xs text-gray-500">Floor</span>
                              <input type="text" className={inputCls} placeholder="e.g. Ground" value={row.floor || ''} onChange={e => updateBuaRow(idx, 'floor', e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Carpet Area</span>
                              <input type="number" className={inputCls} placeholder="Sq.Ft" value={row.carpet || ''} onChange={e => updateBuaRow(idx, 'carpet', e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Built-up Area</span>
                              <input type="number" className={inputCls} placeholder="Sq.Ft" value={row.builtUp || ''} onChange={e => updateBuaRow(idx, 'builtUp', e.target.value)} disabled={isReadOnly} />
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Super Built-up</span>
                              <input type="number" className={inputCls} placeholder="Sq.Ft" value={row.superBuiltUp || ''} onChange={e => updateBuaRow(idx, 'superBuiltUp', e.target.value)} disabled={isReadOnly} />
                            </div>
                            <button type="button" onClick={() => removeBuaRow(idx)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 text-sm pb-1">Remove</button>
                          </div>
                        ))}
                        <button type="button" onClick={addBuaRow} disabled={isReadOnly} className="px-3 py-1.5 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700 transition-colors">+ Add Floor Row</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Field>

            {/* Total Built-up Area */}
            {!(fields.kotakBbgBuildingBuaNA || isVacantLand) && !fields.kotakBbgBuildingBuaAnnexure && (
              <Field label="Total Built-up Area">
                <input type="number" className={inputCls} placeholder="Total BUA (Sq.Ft)" value={fields.kotakBbgTotalBua || ''} onChange={e => handleChange('kotakBbgTotalBua', e.target.value)} disabled={isReadOnly} />
              </Field>
            )}

            {/* Deviations / Violations */}
            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Deviations / Violations</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgDeviationsNA} onChange={e => handleChange('kotakBbgDeviationsNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgDeviationsNA ? (
    <>
                    <select className={inputCls} value={fields.kotakBbgDeviations || ''} onChange={e => handleChange('kotakBbgDeviations', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Deviation</option>
                      <option value="No Deviation">No Deviation</option>
                      <option value="Minor Deviation">Minor Deviation</option>
                      <option value="Major Deviation">Major Deviation</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgDeviations === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Describe deviations/violations" value={fields.kotakBbgDeviationsCustom || ''} onChange={e => handleChange('kotakBbgDeviationsCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-7',
      title: 'Valuation Calculations & Rate Analysis',
      number: 7,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const bldgRateTable: any[] = Array.isArray(fields.kotakBbgAdoptedBuildingRateTable) ? fields.kotakBbgAdoptedBuildingRateTable : [];
        const addBldgRate = () => handleChange('kotakBbgAdoptedBuildingRateTable', [...bldgRateTable, { floor: '', rate: '' }]);
        const removeBldgRate = (idx: number) => handleChange('kotakBbgAdoptedBuildingRateTable', bldgRateTable.filter((_: any, i: number) => i !== idx));
        const updateBldgRate = (idx: number, key: string, val: string) => {
          const updated = bldgRateTable.map((r: any, i: number) => i === idx ? { ...r, [key]: val } : r);
          handleChange('kotakBbgAdoptedBuildingRateTable', updated);
        };

        return (
          <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Valuation Methodology Adopted */}
            <Field label="Valuation Methodology Adopted">
              <select className={inputCls} value={fields.kotakBbgValuationMethodology || ''} onChange={e => handleChange('kotakBbgValuationMethodology', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Methodology</option>
                <option value="Market Approach">Market Approach</option>
                <option value="Cost Approach">Cost Approach</option>
                <option value="Income Approach">Income Approach</option>
                <option value="Combination Approach">Combination Approach</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgValuationMethodology === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom methodology" value={fields.kotakBbgValuationMethodologyCustom || ''} onChange={e => handleChange('kotakBbgValuationMethodologyCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            {/* Source of Rate Selection */}
            <Field label="Source of Rate Selection">
              <input type="text" className={inputCls} placeholder="e.g. Local Enquiry, Ready Reckoner, etc." value={fields.kotakBbgSourceOfRateSelection || ''} onChange={e => handleChange('kotakBbgSourceOfRateSelection', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* Comparables Relied Upon */}
            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Comparables Relied Upon</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgComparablesReliedNA} onChange={e => handleChange('kotakBbgComparablesReliedNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgComparablesReliedNA ? (
    <textarea className={inputCls + ' resize-y'} rows={3} placeholder="List the comparables relied upon..." value={fields.kotakBbgComparablesRelied || ''} onChange={e => handleChange('kotakBbgComparablesRelied', e.target.value)} disabled={isReadOnly} />
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            {/* Analysis of Comparables & Justification */}
            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Analysis of Comparables & Justification</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgAnalysisComparablesNA} onChange={e => handleChange('kotakBbgAnalysisComparablesNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgAnalysisComparablesNA ? (
    <div className="space-y-4 rounded-lg bg-white bg-opacity-50">
      <div className="p-3 bg-white bg-opacity-50 border border-gray-200 rounded space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Base Market Rate (Rs / sq. ft.)</span>
                        <input type="number" className={inputCls} placeholder="e.g. 5000" value={fields.kotakBbgBaseMarketRate || ''} onChange={e => handleChange('kotakBbgBaseMarketRate', e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block mb-1">Discount / Premium Adjustment (%)</span>
                        <input type="number" className={inputCls} placeholder="e.g. -10 or +15" value={fields.kotakBbgDiscountPremium || ''} onChange={e => handleChange('kotakBbgDiscountPremium', e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Justification Narrative</span>
                      <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Explain justification for rate selection..." value={fields.kotakBbgJustificationNarrative || ''} onChange={e => handleChange('kotakBbgJustificationNarrative', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>
    </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            {/* Adopted Land Rate */}
            <Field label="Adopted Land Rate (Rs / sq. ft.)">
              <input type="number" className={inputCls} placeholder="e.g. 5000" value={fields.kotakBbgAdoptedLandRate || ''} onChange={e => handleChange('kotakBbgAdoptedLandRate', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* Adopted Building Rate(s) */}
            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Adopted Building Rate(s) (Rs / sq. ft.)</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgAdoptedBuildingRateNA} onChange={e => handleChange('kotakBbgAdoptedBuildingRateNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgAdoptedBuildingRateNA ? (
    <div className="space-y-4 rounded-lg bg-white bg-opacity-50">
      <div className="space-y-2">
                    {bldgRateTable.map((row: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 items-end p-2 bg-white bg-opacity-60 rounded border border-purple-200">
                        <div>
                          <span className="text-xs text-gray-500">Floor / Component</span>
                          <input type="text" className={inputCls} placeholder="e.g. Ground Floor" value={row.floor || ''} onChange={e => updateBldgRate(idx, 'floor', e.target.value)} disabled={isReadOnly} />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Rate (Rs / sq. ft.)</span>
                          <input type="number" className={inputCls} placeholder="e.g. 2500" value={row.rate || ''} onChange={e => updateBldgRate(idx, 'rate', e.target.value)} disabled={isReadOnly} />
                        </div>
                        <button type="button" onClick={() => removeBldgRate(idx)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 text-sm pb-1">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={addBldgRate} disabled={isReadOnly} className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">+ Add Building Rate Row</button>
                  </div>
    </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            {/* Valuation Calculations Breakdown */}
            <Field label="Valuation Calculations Breakdown">
              <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Detail the calculation steps..." value={fields.kotakBbgValuationBreakdown || ''} onChange={e => handleChange('kotakBbgValuationBreakdown', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* Guideline / Circle Rate */}
            <Field label="Guideline / Circle Rate & Guideline Valuation">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Guideline / Circle Rate (Rs / sq. ft.)</span>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" checked={fields.kotakBbgGuidelineRateNA || false} onChange={e => handleChange('kotakBbgGuidelineRateNA', e.target.checked)} disabled={isReadOnly} />
                      <span>NA</span>
                    </label>
                    {!fields.kotakBbgGuidelineRateNA && (
                      <input type="number" className={inputCls} placeholder="e.g. 3500" value={fields.kotakBbgGuidelineRate || ''} onChange={e => handleChange('kotakBbgGuidelineRate', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Guideline Valuation (INR)</span>
                  <input type="number" className={inputCls} placeholder="e.g. 5000000" value={fields.kotakBbgGuidelineValuation || ''} onChange={e => handleChange('kotakBbgGuidelineValuation', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-8',
      title: 'Valuation Financial Summary',
      number: 8,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        const isIvNA = fields.kotakBbgIvNA !== undefined ? fields.kotakBbgIvNA : isVacantLand;

        return (
          <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Exact FMV */}
            <Field label="Exact Fair Market Value (FMV)">
              <input type="number" className={inputCls} placeholder="INR" value={fields.kotakBbgFmvExact || ''} onChange={e => handleChange('kotakBbgFmvExact', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* Rounded FMV */}
            <Field label="Rounded Fair Market Value (Say Value)">
              <input type="number" className={inputCls} placeholder="INR" value={fields.kotakBbgFmvRounded || ''} onChange={e => handleChange('kotakBbgFmvRounded', e.target.value)} disabled={isReadOnly} />
            </Field>

            {/* Realizable Value */}
            <Field label="Realizable Value (RV)">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">RV Percentage (%)</span>
                  <PrefillField
                    label=""
                    value={fields.kotakBbgRvPercent !== undefined ? fields.kotakBbgRvPercent : '90'}
                    onChange={(val: string) => handleChange('kotakBbgRvPercent', val)}
                    isReadOnly={isReadOnly}
                    tooltip="Auto calculating from [FMV × RV%]"
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Realizable Value (INR)</span>
                  <input type="number" className={inputCls} placeholder="INR" value={fields.kotakBbgRv || ''} onChange={e => handleChange('kotakBbgRv', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
            </Field>

            {/* Distress Value */}
            <Field label="Distress Value (DV)">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">DV Percentage (%)</span>
                  <PrefillField
                    label=""
                    value={fields.kotakBbgDvPercent !== undefined ? fields.kotakBbgDvPercent : '80'}
                    onChange={(val: string) => handleChange('kotakBbgDvPercent', val)}
                    isReadOnly={isReadOnly}
                    tooltip="Auto calculating from [FMV × DV%]"
                  />
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Distress Value (INR)</span>
                  <input type="number" className={inputCls} placeholder="INR" value={fields.kotakBbgDv || ''} onChange={e => handleChange('kotakBbgDv', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
            </Field>

            {/* Insurable Value */}
            <Field label="Insurable Value (IV)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={isIvNA} onChange={e => handleChange('kotakBbgIvNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!isIvNA && (
                  <input type="number" className={inputCls} placeholder="INR" value={fields.kotakBbgIv || ''} onChange={e => handleChange('kotakBbgIv', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
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
      title: 'Valuer Declaration & Signoff',
      number: 10,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const siteVisitDate = fields.kotakBbgDateOfSiteVisit || '[Date from Section 1]';
        const clausesText = `I hereby declare that the information provided in this report is true and correct to the best of my knowledge. The valuation is strictly for bank internal use based on current market trends and visible site conditions as of ${siteVisitDate}.\n\n1. I have not withheld any material information that could affect the valuation.\n2. I have personally inspected the property and verified its physical existence.\n3. I have no direct or indirect interest in the property being valued.\n4. My liability is limited as per standard banking terms and the scope of work defined by Kotak Mahindra Bank Limited (KMBL).`;
        
        const today = new Date().toISOString().split('T')[0];
        const issueDateVal = fields.kotakBbgReportIssueDate || today;

        const defaultCredentials = "Name: Er. S. Mohanty\nQualifications: B.Tech (Civil), M.Tech (Structures), FIV\nIBBI Reg No: IBBI/RV/00/0000\nWealth Tax Reg No: CAT-I/000";
        const credentialsVal = fields.kotakBbgValuerCredentials || defaultCredentials;

        return (
          <div style={{ backgroundColor: '#e8eaf6', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Standard Declaration & Legal Clauses">
              <div className="space-y-3">
                <div className="p-3 bg-white border border-gray-300 rounded text-sm text-gray-700 h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {clausesText}
                </div>
                <label className="flex items-start space-x-2 text-sm text-indigo-900 font-semibold bg-indigo-50 p-3 rounded border border-indigo-200 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={fields.kotakBbgDeclarationConfirmed || false} onChange={e => handleChange('kotakBbgDeclarationConfirmed', e.target.checked)} disabled={isReadOnly} />
                  <span>I have read and legally bind myself to the above declarations.</span>
                </label>
              </div>
            </Field>
            
            <Field label="Report Issue Date">
              <input
                type="date"
                className={inputCls}
                value={issueDateVal}
                onChange={e => handleChange('kotakBbgReportIssueDate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Report Issue Place">
              <div title="Prefill from Valuer Profile">
                <select className={inputCls} value={fields.kotakBbgReportIssuePlace || 'Bhubaneswar'} onChange={e => handleChange('kotakBbgReportIssuePlace', e.target.value)} disabled={isReadOnly}>
                  <option value="Bhubaneswar">Bhubaneswar</option>
                  <option value="Cuttack">Cuttack</option>
                  <option value="Rourkela">Rourkela</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.kotakBbgReportIssuePlace === 'Custom' && (
                  <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom place" value={fields.kotakBbgReportIssuePlaceCustom || ''} onChange={e => handleChange('kotakBbgReportIssuePlaceCustom', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <PrefillField
              label="Valuer Credentials (Name, Qualifications, Reg No.)"
              value={credentialsVal}
              onChange={(val: string) => handleChange('kotakBbgValuerCredentials', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Valuer Profile"
              type="textarea"
            />

            <Field label="Valuer Signature & Official Stamp">
              <div className="space-y-4" title="Prefill from Valuer Profile">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded bg-white flex flex-col items-center justify-center">
                  <span className="text-gray-500 mb-2 font-semibold">System Generated Signature & Stamp</span>
                  <div className="w-64 h-32 bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 italic rounded">
                    [Preview: Profile Signature Image]
                  </div>
                  <label className="mt-4 text-sm text-indigo-600 cursor-pointer hover:underline font-medium">
                    <input type="file" className="hidden" disabled={isReadOnly} />
                    Override with Manual File Upload
                  </label>
                </div>
                
                <label className="flex items-start space-x-2 text-sm text-indigo-900 font-semibold bg-indigo-50 p-3 rounded border border-indigo-200 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={fields.kotakBbgSignatureConfirmed || false} onChange={e => handleChange('kotakBbgSignatureConfirmed', e.target.checked)} disabled={isReadOnly} />
                  <span>I confirm and verify this signature, stamp, and credential block for final submission.</span>
                </label>
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
