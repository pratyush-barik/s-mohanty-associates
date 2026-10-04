'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Unlock } from 'lucide-react';
import { PDFKotakBbgRenderer } from '@/lib/banks/pdf-kotak-bbg-renderer';

const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text' }: any) => {
  const [isEdit, setIsEdit] = useState(false);

  const labelWithToggle = (
    <div className="flex justify-between items-center w-full">
      <div className="flex-1 flex items-center pr-4">{label}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsEdit(!isEdit)}
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
             value={value}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
             rows={3}
           />
        ) : (
          <input
            type="text"
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={value}
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
    { id: 'kotak-section-2', title: '2. Nature & Scope of Property' },
    { id: 'kotak-section-3', title: '3. Location & Address Details' },
    { id: 'kotak-section-4', title: '4. Details of Approvals & Legal Verification' },
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
      title: 'Nature & Scope of Property',
      number: 2,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Nature of Property">
              <select className={inputCls} value={fields.kotakBbgNatureOfProperty || ''} onChange={e => handleChange('kotakBbgNatureOfProperty', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Nature</option>
                <option value="Vacant Land">Vacant Land</option>
                <option value="Independent House">Independent House</option>
                <option value="Apartment/Flat">Apartment/Flat</option>
                <option value="Commercial Shop">Commercial Shop</option>
                <option value="Industrial Shed">Industrial Shed</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgNatureOfProperty === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgNatureOfPropertyCustom || ''} onChange={e => handleChange('kotakBbgNatureOfPropertyCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Present Use / Occupancy Status</span>
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
                      <option value="Self-Occupied">Self-Occupied</option>
                      <option value="Tenanted">Tenanted</option>
                      <option value="Vacant">Vacant</option>
                      <option value="Under Construction">Under Construction</option>
                      <option value="Industrial Use">Industrial Use</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgOccupancy === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgOccupancyCustom || ''} onChange={e => handleChange('kotakBbgOccupancyCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Type of Ownership">
              <div className="p-3 bg-white bg-opacity-50 border border-gray-200 rounded space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Primary Ownership Type</span>
                  <select className={inputCls} value={fields.kotakBbgTenure || ''} onChange={e => handleChange('kotakBbgTenure', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Ownership</option>
                    <option value="Freehold">Freehold</option>
                    <option value="Leasehold">Leasehold</option>
                    <option value="Allotment">Allotment</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgTenure === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom ownership" value={fields.kotakBbgTenureCustom || ''} onChange={e => handleChange('kotakBbgTenureCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>

                {fields.kotakBbgTenure === 'Leasehold' && (
                  <>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-semibold text-gray-700">Lease Tenure (Remaining Years)</span>
                      <input type="number" className={inputCls} placeholder="Years" value={fields.kotakBbgLeaseRemainingYears || ''} onChange={e => handleChange('kotakBbgLeaseRemainingYears', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm font-semibold text-gray-700">Lease Expiry Date</span>
                      <input type="date" className={inputCls} value={fields.kotakBbgLeaseExpiryDate || ''} onChange={e => handleChange('kotakBbgLeaseExpiryDate', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </>
                )}
              </div>
            </Field>

            <PrefillField
              label="Scope of Valuation (Property Share %)"
              value={fields.kotakBbgScopeOfValuation || '100%'}
              onChange={(val: string) => handleChange('kotakBbgScopeOfValuation', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Scope of Work / Mandate"
            />

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Brief Description of the Property</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgPropertyDescriptionNA} onChange={e => handleChange('kotakBbgPropertyDescriptionNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgPropertyDescriptionNA ? (
    <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Enter description..." value={fields.kotakBbgPropertyDescription || ''} onChange={e => handleChange('kotakBbgPropertyDescription', e.target.value)} disabled={isReadOnly} />
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
      title: 'Location & Address Details',
      number: 3,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const boundariesDoc = fields.kotakBbgBoundariesDoc || { north: '', south: '', east: '', west: '' };
        const boundariesSite = fields.kotakBbgBoundariesSite || { north: '', south: '', east: '', west: '' };
        
        const setBoundariesDoc = (key: string, val: string) => {
          handleChange('kotakBbgBoundariesDoc', { ...boundariesDoc, [key]: val });
        };
        const setBoundariesSite = (key: string, val: string) => {
          handleChange('kotakBbgBoundariesSite', { ...boundariesSite, [key]: val });
        };
        
        return (
          <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Complete Postal Address</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgPostalAddressNA} onChange={e => handleChange('kotakBbgPostalAddressNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgPostalAddressNA ? (
    <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter full address..." value={fields.kotakBbgPostalAddress || ''} onChange={e => handleChange('kotakBbgPostalAddress', e.target.value)} disabled={isReadOnly} />
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>
            
            <Field label="Administrative Divisions">
              <div className="p-3 bg-white bg-opacity-50 border border-gray-200 rounded space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">District</span>
                  <select className={inputCls} value={fields.kotakBbgDistrict || ''} onChange={e => handleChange('kotakBbgDistrict', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select District</option>
                    <option value="Khordha">Khordha</option>
                    <option value="Cuttack">Cuttack</option>
                    <option value="Ganjam">Ganjam</option>
                    <option value="Puri">Puri</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgDistrict === 'Custom' && (
                    <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom district" value={fields.kotakBbgDistrictCustom || ''} onChange={e => handleChange('kotakBbgDistrictCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Tehsil / Mandal</span>
                  <select className={inputCls} value={fields.kotakBbgTehsil || ''} onChange={e => handleChange('kotakBbgTehsil', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Tehsil</option>
                    <option value="Bhubaneswar">Bhubaneswar</option>
                    <option value="Jatni">Jatni</option>
                    <option value="Cuttack Sadar">Cuttack Sadar</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgTehsil === 'Custom' && (
                    <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom tehsil" value={fields.kotakBbgTehsilCustom || ''} onChange={e => handleChange('kotakBbgTehsilCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Ward No. / Village / Mouza</span>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={fields.kotakBbgWardNA || false} onChange={e => handleChange('kotakBbgWardNA', e.target.checked)} disabled={isReadOnly} />
                    <span>Not Applicable (NA)</span>
                  </label>
                  {!fields.kotakBbgWardNA && (
                    <input type="text" className={inputCls} placeholder="Enter ward/village" value={fields.kotakBbgWard || ''} onChange={e => handleChange('kotakBbgWard', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>State & Pin Code</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgStatePinNA} onChange={e => handleChange('kotakBbgStatePinNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgStatePinNA ? (
    <div className="flex space-x-4">
                    <select className={inputCls + ' flex-1'} value={fields.kotakBbgState || ''} onChange={e => handleChange('kotakBbgState', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select State</option>
                      <option value="Odisha">Odisha</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                    </select>
                    <input type="text" maxLength={6} className={inputCls + ' w-32'} placeholder="Pin Code" value={fields.kotakBbgPinCode || ''} onChange={e => handleChange('kotakBbgPinCode', e.target.value.replace(/\D/g, ''))} disabled={isReadOnly} />
                  </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="GPS Coordinates (Lat / Long)">
              <div className="flex space-x-2">
                <input type="number" className={inputCls + ' flex-1'} placeholder="Latitude (e.g. 20.296)" value={fields.kotakBbgLat || ''} onChange={e => handleChange('kotakBbgLat', e.target.value)} disabled={isReadOnly} />
                <input type="number" className={inputCls + ' flex-1'} placeholder="Longitude (e.g. 85.824)" value={fields.kotakBbgLng || ''} onChange={e => handleChange('kotakBbgLng', e.target.value)} disabled={isReadOnly} />
                <button type="button" className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors whitespace-nowrap" disabled={isReadOnly}>Fetch Current Location</button>
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Landmark</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgLandmarkNA} onChange={e => handleChange('kotakBbgLandmarkNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgLandmarkNA ? (
    <input type="text" className={inputCls} placeholder="Nearest landmark..." value={fields.kotakBbgLandmark || ''} onChange={e => handleChange('kotakBbgLandmark', e.target.value)} disabled={isReadOnly} />
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Type of Locality</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgLocalityTypeNA} onChange={e => handleChange('kotakBbgLocalityTypeNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgLocalityTypeNA ? (
    <div className="space-y-2">
                    <select className={inputCls} value={fields.kotakBbgLocalityType || ''} onChange={e => handleChange('kotakBbgLocalityType', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Type</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Slum / Gram Panchayat">Slum / Gram Panchayat</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgLocalityType === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom locality type" value={fields.kotakBbgLocalityTypeCustom || ''} onChange={e => handleChange('kotakBbgLocalityTypeCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Access Road Width & Type">
              <div className="p-3 bg-white bg-opacity-50 border border-gray-200 rounded space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Width</span>
                  <div className="flex space-x-2">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Width" value={fields.kotakBbgRoadWidth || ''} onChange={e => handleChange('kotakBbgRoadWidth', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-32'} value={fields.kotakBbgRoadWidthUnit || 'Feet'} onChange={e => handleChange('kotakBbgRoadWidthUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="Feet">Feet</option>
                      <option value="Meters">Meters</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Type</span>
                  <select className={inputCls} value={fields.kotakBbgRoadType || ''} onChange={e => handleChange('kotakBbgRoadType', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Road Type</option>
                    <option value="Tar/Asphalt">Tar/Asphalt</option>
                    <option value="Concrete">Concrete</option>
                    <option value="WBM">WBM</option>
                    <option value="Mud/Kutcha">Mud/Kutcha</option>
                  </select>
                </div>
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Property Boundaries (As per Deed)</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgBoundariesDocNA} onChange={e => handleChange('kotakBbgBoundariesDocNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgBoundariesDocNA ? (
    <div className="grid grid-cols-2 gap-4">
                    {['North', 'South', 'East', 'West'].map(dir => (
                      <div key={dir}>
                        <span className="text-sm text-gray-600 block mb-1">{dir}</span>
                        <input type="text" className={inputCls} value={boundariesDoc[dir.toLowerCase()] || ''} onChange={e => setBoundariesDoc(dir.toLowerCase(), e.target.value)} disabled={isReadOnly} />
                      </div>
                    ))}
                  </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Property Boundaries (As per Site)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgBoundariesSiteSameAsDoc || false} onChange={e => handleChange('kotakBbgBoundariesSiteSameAsDoc', e.target.checked)} disabled={isReadOnly} />
                  <span>Site Boundaries match Deed</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['North', 'South', 'East', 'West'].map(dir => {
                    const isLocked = fields.kotakBbgBoundariesSiteSameAsDoc;
                    const val = isLocked ? boundariesDoc[dir.toLowerCase()] : boundariesSite[dir.toLowerCase()];
                    return (
                      <div key={dir}>
                        <span className="text-sm text-gray-600 block mb-1">{dir}</span>
                        {isLocked ? (
                          <div title='Prefill from section 3, "Property Boundaries (As per Deed)"' className="flex items-center space-x-2">
                            <input type="text" className={inputCls + ' flex-1'} value={val || ''} disabled={true} />
                            <button type="button" disabled className="p-1.5 border rounded shrink-0 bg-white border-gray-300 text-gray-500">
                              <Lock size={16} />
                            </button>
                          </div>
                        ) : (
                          <input type="text" className={inputCls} value={val || ''} onChange={e => setBoundariesSite(dir.toLowerCase(), e.target.value)} disabled={isReadOnly} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-4',
      title: 'Details of Approvals & Legal Verification',
      number: 4,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantOrIndependent = fields.kotakBbgNatureOfProperty === 'Vacant Land' || fields.kotakBbgNatureOfProperty === 'Independent House';
        const reraNA = fields.kotakBbgReraNA !== undefined ? fields.kotakBbgReraNA : isVacantOrIndependent;

        return (
          <div style={{ backgroundColor: '#fff9c4', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Nature of Title Deed">
              <select className={inputCls} value={fields.kotakBbgTitleDeedNature || ''} onChange={e => handleChange('kotakBbgTitleDeedNature', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Sale Deed">Sale Deed</option>
                <option value="Gift Deed">Gift Deed</option>
                <option value="Lease Deed">Lease Deed</option>
                <option value="Partition Deed">Partition Deed</option>
                <option value="Conveyance Deed">Conveyance Deed</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgTitleDeedNature === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom Nature of Title Deed" value={fields.kotakBbgTitleDeedNatureCustom || ''} onChange={e => handleChange('kotakBbgTitleDeedNatureCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Title Deed / Document Number</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgTitleDeedNoNA} onChange={e => handleChange('kotakBbgTitleDeedNoNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgTitleDeedNoNA ? (
    <input type="text" className={inputCls} value={fields.kotakBbgTitleDeedNo || ''} onChange={e => handleChange('kotakBbgTitleDeedNo', e.target.value)} disabled={isReadOnly} />
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Date of Execution & Registration">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Execution Date</span>
                  <input type="date" className={inputCls} value={fields.kotakBbgExecutionDate || ''} onChange={e => handleChange('kotakBbgExecutionDate', e.target.value)} disabled={isReadOnly} />
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Registration Date</span>
                  <input type="date" className={inputCls} value={fields.kotakBbgRegistrationDate || ''} onChange={e => handleChange('kotakBbgRegistrationDate', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Sub-Registrar Office (SRO)</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgSroNA} onChange={e => handleChange('kotakBbgSroNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgSroNA ? (
    <>
                    <select className={inputCls} value={fields.kotakBbgSro || ''} onChange={e => handleChange('kotakBbgSro', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="SRO 1">SRO 1</option>
                      <option value="SRO 2">SRO 2</option>
                      <option value="SRO 3">SRO 3</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgSro === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom SRO" value={fields.kotakBbgSroCustom || ''} onChange={e => handleChange('kotakBbgSroCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Town Planning / Local Authority</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgLocalAuthorityNA} onChange={e => handleChange('kotakBbgLocalAuthorityNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgLocalAuthorityNA ? (
    <>
                    <select className={inputCls} value={fields.kotakBbgLocalAuthority || ''} onChange={e => handleChange('kotakBbgLocalAuthority', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="Municipal Corporation">Municipal Corporation</option>
                      <option value="Municipality">Municipality</option>
                      <option value="Gram Panchayat">Gram Panchayat</option>
                      <option value="Development Authority">Development Authority</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgLocalAuthority === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom Authority" value={fields.kotakBbgLocalAuthorityCustom || ''} onChange={e => handleChange('kotakBbgLocalAuthorityCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Approved Building Plan Details">
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white bg-opacity-50">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Approval Status</span>
                  <select className={inputCls} value={fields.kotakBbgApprovedPlanStatus || ''} onChange={e => handleChange('kotakBbgApprovedPlanStatus', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Approved">Approved</option>
                    <option value="Not Approved">Not Approved</option>
                    <option value="In Process">In Process</option>
                    <option value="NA">NA</option>
                  </select>
                </div>
                
                {fields.kotakBbgApprovedPlanStatus === 'Approved' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Plan Number</span>
                      <input type="text" className={inputCls} value={fields.kotakBbgApprovedPlanNo || ''} onChange={e => handleChange('kotakBbgApprovedPlanNo', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Plan Date</span>
                      <input type="date" className={inputCls} value={fields.kotakBbgApprovedPlanDate || ''} onChange={e => handleChange('kotakBbgApprovedPlanDate', e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm text-gray-600 block mb-1">Deviation from Approved Plan</span>
                  <div className="flex space-x-4">
                    <select className={inputCls} value={fields.kotakBbgPlanDeviation || ''} onChange={e => handleChange('kotakBbgPlanDeviation', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="No Deviation">No Deviation</option>
                      <option value="Minor Deviation">Minor Deviation</option>
                      <option value="Major Deviation">Major Deviation</option>
                    </select>
                    {(fields.kotakBbgPlanDeviation === 'Minor Deviation' || fields.kotakBbgPlanDeviation === 'Major Deviation') && (
                      <div className="flex-1 flex items-center space-x-2">
                        <input type="number" className={inputCls} placeholder="%" value={fields.kotakBbgPlanDeviationPercent || ''} onChange={e => handleChange('kotakBbgPlanDeviationPercent', e.target.value)} disabled={isReadOnly} />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Property Tax Assessment</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgPropertyTaxNA} onChange={e => handleChange('kotakBbgPropertyTaxNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgPropertyTaxNA ? (
    <div className="space-y-4 rounded-lg bg-white bg-opacity-50">
      <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Assessment/Holding Number</span>
                      <input type="text" className={inputCls} value={fields.kotakBbgPropertyTaxNo || ''} onChange={e => handleChange('kotakBbgPropertyTaxNo', e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Tax Paid Up To (Year)</span>
                      <select className={inputCls} value={fields.kotakBbgTaxPaidYear || ''} onChange={e => handleChange('kotakBbgTaxPaidYear', e.target.value)} disabled={isReadOnly}>
                        <option value="">Select Option</option>
                        <option value="2022-23">2022-23</option>
                        <option value="2023-24">2023-24</option>
                        <option value="2024-25">2024-25</option>
                        <option value="2025-26">2025-26</option>
                        <option value="Custom">Custom</option>
                      </select>
                      {fields.kotakBbgTaxPaidYear === 'Custom' && (
                        <input type="text" className={inputCls + ' mt-2'} placeholder="Enter Custom Year" value={fields.kotakBbgTaxPaidYearCustom || ''} onChange={e => handleChange('kotakBbgTaxPaidYearCustom', e.target.value)} disabled={isReadOnly} />
                      )}
                    </div>
                  </div>
    </div>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>RERA Registration Number</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgReraNA} onChange={e => handleChange('kotakBbgReraNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgReraNA ? (
    <div className="space-y-4 rounded-lg bg-white bg-opacity-50">
      <input type="text" className={inputCls} value={fields.kotakBbgReraNo || ''} onChange={e => handleChange('kotakBbgReraNo', e.target.value)} disabled={isReadOnly} />
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
      id: 'kotak-section-5',
      title: 'Building / Structural Details',
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
        let calculatedAge = '';
        if (fields.kotakBbgYearOfConstruction) {
          const age = currentYear - parseInt(fields.kotakBbgYearOfConstruction, 10);
          calculatedAge = age >= 0 ? age.toString() : '0';
        }
        const ageVal = fields.kotakBbgAgeOfBuilding || calculatedAge;

        let calculatedResidualAge = '';
        if (ageVal !== '') {
          const typeOfConstruction = fields.kotakBbgConstructionType;
          let standardLife = 60; // default for RCC
          if (typeOfConstruction === 'Load Bearing Walls') standardLife = 50;
          if (typeOfConstruction === 'Composite') standardLife = 55;
          if (typeOfConstruction === 'Temporary/Kutcha') standardLife = 20;
          const resAge = standardLife - parseInt(ageVal, 10);
          calculatedResidualAge = resAge > 0 ? resAge.toString() : '0';
        }
        const residualAgeVal = fields.kotakBbgResidualStructuralAge || calculatedResidualAge;

        const flooringSystems = Array.isArray(fields.kotakBbgFlooringSystem) ? fields.kotakBbgFlooringSystem : [];
        const toggleFlooring = (val: string) => {
          if (flooringSystems.includes(val)) {
            handleChange('kotakBbgFlooringSystem', flooringSystems.filter(v => v !== val));
          } else {
            handleChange('kotakBbgFlooringSystem', [...flooringSystems, val]);
          }
        };

        const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

        return (
          <div style={{ backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {isVacantLand && overridden && (
              <label className="flex items-center space-x-2 text-sm text-gray-500 pb-2 border-b border-gray-200">
                <input type="checkbox" checked={overridden} onChange={e => handleChange('kotakBbgSection5Override', e.target.checked)} disabled={isReadOnly} />
                <span>Manually overriding "Vacant Land" disable lock</span>
              </label>
            )}

            <Field label="Year of Construction & Age of Building">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Year of Construction</span>
                  <select className={inputCls} value={fields.kotakBbgYearOfConstruction || ''} onChange={e => handleChange('kotakBbgYearOfConstruction', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Year</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <PrefillField
                    label="Age of Building (Years)"
                    value={ageVal}
                    onChange={(val: string) => handleChange('kotakBbgAgeOfBuilding', val)}
                    isReadOnly={isReadOnly}
                    tooltip="Auto calculating from [Current Year - Year of Construction]"
                  />
                </div>
              </div>
            </Field>

            <Field label="Floor Configuration">
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white bg-opacity-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Number of Floors</span>
                    <input type="number" className={inputCls} value={fields.kotakBbgNumberOfFloors || ''} onChange={e => handleChange('kotakBbgNumberOfFloors', e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Elevation Profile</span>
                    <select className={inputCls} value={fields.kotakBbgElevationProfile || ''} onChange={e => handleChange('kotakBbgElevationProfile', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="G+1">G+1</option>
                      <option value="G+2">G+2</option>
                      <option value="B+G+3">B+G+3</option>
                      <option value="Stilt+G+4">Stilt+G+4</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgElevationProfile === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter Custom Elevation Profile" value={fields.kotakBbgElevationProfileCustom || ''} onChange={e => handleChange('kotakBbgElevationProfileCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
                </div>
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Type of Construction / Structural Frame</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgConstructionTypeNA} onChange={e => handleChange('kotakBbgConstructionTypeNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgConstructionTypeNA ? (
    <>
                    <select className={inputCls} value={fields.kotakBbgConstructionType || ''} onChange={e => handleChange('kotakBbgConstructionType', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="RCC Framed Structure">RCC Framed Structure</option>
                      <option value="Load Bearing Walls">Load Bearing Walls</option>
                      <option value="Composite">Composite</option>
                      <option value="Temporary/Kutcha">Temporary/Kutcha</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgConstructionType === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgConstructionTypeCustom || ''} onChange={e => handleChange('kotakBbgConstructionTypeCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Roofing System</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgRoofingSystemNA} onChange={e => handleChange('kotakBbgRoofingSystemNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgRoofingSystemNA ? (
    <>
                    <select className={inputCls} value={fields.kotakBbgRoofingSystem || ''} onChange={e => handleChange('kotakBbgRoofingSystem', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="RCC Slab">RCC Slab</option>
                      <option value="GI/CGI Sheets">GI/CGI Sheets</option>
                      <option value="Asbestos Sheets">Asbestos Sheets</option>
                      <option value="Mangalore Tiles">Mangalore Tiles</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgRoofingSystem === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgRoofingSystemCustom || ''} onChange={e => handleChange('kotakBbgRoofingSystemCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label="Flooring System">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-4">
                  {['Vitrified Tiles', 'Marble', 'Granite', 'Ceramic Tiles', 'Mosaic', 'Kota Stone'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input type="checkbox" checked={flooringSystems.includes(type)} onChange={() => toggleFlooring(type)} disabled={isReadOnly} />
                      <span>{type}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={fields.kotakBbgFlooringSystemCustomChecked || false} onChange={e => handleChange('kotakBbgFlooringSystemCustomChecked', e.target.checked)} disabled={isReadOnly} />
                    <span>Custom</span>
                  </label>
                </div>
                {fields.kotakBbgFlooringSystemCustomChecked && (
                  <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom flooring" value={fields.kotakBbgFlooringSystemCustom || ''} onChange={e => handleChange('kotakBbgFlooringSystemCustom', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Exterior / Interior Finishing</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgExteriorInteriorFinishingNA} onChange={e => handleChange('kotakBbgExteriorInteriorFinishingNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgExteriorInteriorFinishingNA ? (
    <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgExteriorInteriorFinishing || ''} onChange={e => handleChange('kotakBbgExteriorInteriorFinishing', e.target.value)} disabled={isReadOnly} />
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <Field label={
    <div className="flex items-center justify-between w-full">
      <span>Quality of Construction & Maintenance</span>
      <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal normal-case">
        <input type="checkbox" className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!fields.kotakBbgQualityOfConstructionNA} onChange={e => handleChange('kotakBbgQualityOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
        <span className="text-[10px] font-bold text-gray-500 tracking-wider">NA</span>
      </label>
    </div>
  }>
  {!fields.kotakBbgQualityOfConstructionNA ? (
    <select className={inputCls} value={fields.kotakBbgQualityOfConstruction || ''} onChange={e => handleChange('kotakBbgQualityOfConstruction', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Dilapidated">Dilapidated</option>
                  </select>
  ) : (
    <input type="text" className={inputCls + ' bg-gray-100 cursor-not-allowed'} value="NA" disabled />
  )}
</Field>

            <PrefillField
              label="Residual / Remaining Economic Life (Years)"
              value={residualAgeVal}
              onChange={(val: string) => handleChange('kotakBbgResidualStructuralAge', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Standard Building Life - Age of Building]"
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
