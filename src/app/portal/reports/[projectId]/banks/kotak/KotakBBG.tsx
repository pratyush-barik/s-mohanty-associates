'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Unlock } from 'lucide-react';
import { PDFKotakBbgRenderer } from '@/lib/banks/pdf-kotak-bbg-renderer';

const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text' }: any) => {
  const [isEdit, setIsEdit] = useState(false);
  return (
    <Field label={label}>
      <div className="flex items-center space-x-2" title={!isEdit ? tooltip : ''}>
        {type === 'textarea' ? (
           <textarea
             className={inputCls + ' flex-1 resize-y'}
             value={value}
             onChange={e => onChange(e.target.value)}
             disabled={isReadOnly || !isEdit}
             rows={3}
           />
        ) : (
          <input
            type="text"
            className={inputCls + ' flex-1'}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          />
        )}
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => setIsEdit(!isEdit)}
          className={`p-1.5 border rounded shrink-0 transition-colors ${isEdit ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
          title="Toggle Edit"
        >
          {isEdit ? <Unlock size={16} /> : <Lock size={16} />}
        </button>
      </div>
    </Field>
  );
};

export const KOTAK_BBG_CONFIG: BankConfig = {
  bankId: 'KOTAK MAHINDRA BANK',
  subTemplateId: 'BUSINESS BANKING GROUP',
  displayName: 'Kotak Mahindra Bank — Business Banking Group (BBG)',
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-8', 'section-9', 'section-10'],
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
  ],
  defaultValues: {
    kotakBbgPurpose: 'To ascertain Market value, Realizable value & Distress value for bank decision-making',
  },
  extraSectionsStart: [
    {
      id: 'kotak-section-1',
      title: 'General Details',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const today = new Date().toISOString().split('T')[0];
        const valuerName = 'Er. S. Mohanty'; // Mock
        const borrowerName = fields.kotakBbgBorrowerName || '[Borrower Name from App]';
        
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Bank Name"
              value={fields.kotakBbgBankName || 'Kotak Mahindra Bank'}
              onChange={(val: string) => handleChange('kotakBbgBankName', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Client Mandate Data"
            />

            <Field label="Bank Branch / IFCS">
              <select className={inputCls} value={fields.kotakBbgBankBranch || ''} onChange={e => handleChange('kotakBbgBankBranch', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Branch</option>
                <option value="Bhubaneswar Main">Bhubaneswar Main</option>
                <option value="Cuttack Branch">Cuttack Branch</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgBankBranch === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom branch/IFCS" value={fields.kotakBbgBankBranchCustom || ''} onChange={e => handleChange('kotakBbgBankBranchCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label="Bank Reference / Application No.">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgBankRefNA || false} onChange={e => handleChange('kotakBbgBankRefNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgBankRefNA && (
                  <input type="text" className={inputCls} placeholder="Ref/App No." value={fields.kotakBbgBankRef || ''} onChange={e => handleChange('kotakBbgBankRef', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <PrefillField
              label="Purpose of Valuation"
              value={fields.kotakBbgPurpose || 'Market Value Assessment'}
              onChange={(val: string) => handleChange('kotakBbgPurpose', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
            />
            
            <PrefillField
              label="Date of Valuation"
              value={fields.kotakBbgDateOfValuation || today}
              onChange={(val: string) => handleChange('kotakBbgDateOfValuation', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Current Date"
              type="date"
            />

            <PrefillField
              label="Name of the Valuer"
              value={fields.kotakBbgValuerName || valuerName}
              onChange={(val: string) => handleChange('kotakBbgValuerName', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Valuer Profile"
            />

            <Field label="Site Engineer Inspecting Property">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgSiteEngineerNA || false} onChange={e => handleChange('kotakBbgSiteEngineerNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgSiteEngineerNA && (
                  <div className="space-y-2">
                    <select className={inputCls} value={fields.kotakBbgSiteEngineer || ''} onChange={e => handleChange('kotakBbgSiteEngineer', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Site Engineer</option>
                      <option value="Engineer 1">Engineer 1</option>
                      <option value="Engineer 2">Engineer 2</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgSiteEngineer === 'Custom' && (
                      <input type="text" className={inputCls} placeholder="Enter custom value" value={fields.kotakBbgSiteEngineerCustom || ''} onChange={e => handleChange('kotakBbgSiteEngineerCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </div>
                )}
              </div>
            </Field>

            <PrefillField
              label="Name of Customer / Borrower"
              value={borrowerName}
              onChange={(val: string) => handleChange('kotakBbgBorrowerName', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Application Data"
            />

            <Field label="Name of Property Owner(s)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgOwnerSameAsBorrower || false} onChange={e => handleChange('kotakBbgOwnerSameAsBorrower', e.target.checked)} disabled={isReadOnly} />
                  <span>Same as Borrower</span>
                </label>
                {fields.kotakBbgOwnerSameAsBorrower ? (
                  <div title='Prefill from section 1, "Name of Customer / Borrower"' className="flex items-center space-x-2">
                    <textarea 
                      className={inputCls + ' resize-y flex-1'} 
                      rows={2} 
                      value={borrowerName} 
                      disabled={true} 
                    />
                    <button type="button" disabled className="p-1.5 border rounded shrink-0 bg-white border-gray-300 text-gray-500">
                      <Lock size={16} />
                    </button>
                  </div>
                ) : (
                  <textarea className={inputCls + ' resize-y w-full'} rows={2} placeholder="Owner Name(s)" value={fields.kotakBbgOwnerName || ''} onChange={e => handleChange('kotakBbgOwnerName', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <PrefillField
              label="Date of Technical Site Visit"
              value={fields.kotakBbgDateOfSiteVisit || today}
              onChange={(val: string) => handleChange('kotakBbgDateOfSiteVisit', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Current Date"
              type="date"
            />
            
            <Field label="Person Met at Site & Contact Details">
              <div className="p-3 bg-white bg-opacity-50 border border-gray-200 rounded space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Name</span>
                  <input type="text" className={inputCls} placeholder="Name" value={fields.kotakBbgPersonMet || ''} onChange={e => handleChange('kotakBbgPersonMet', e.target.value)} disabled={isReadOnly} />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Relationship to Owner</span>
                  <select className={inputCls} value={fields.kotakBbgPersonMetRelation || ''} onChange={e => handleChange('kotakBbgPersonMetRelation', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Relationship</option>
                    <option value="Self">Self</option>
                    <option value="Relative">Relative</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Manager">Manager</option>
                    <option value="Site Guard">Site Guard</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgPersonMetRelation === 'Custom' && (
                    <input type="text" className={inputCls} placeholder="Enter custom relationship" value={fields.kotakBbgPersonMetRelationCustom || ''} onChange={e => handleChange('kotakBbgPersonMetRelationCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Phone Number</span>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked={fields.kotakBbgPersonMetContactNA || false} onChange={e => handleChange('kotakBbgPersonMetContactNA', e.target.checked)} disabled={isReadOnly} />
                    <span>Not Applicable (NA)</span>
                  </label>
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

            <Field label="Present Use / Occupancy Status">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgOccupancyNA || false} onChange={e => handleChange('kotakBbgOccupancyNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgOccupancyNA && (
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
                )}
              </div>
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

            <Field label="Brief Description of the Property">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgPropertyDescriptionNA || false} onChange={e => handleChange('kotakBbgPropertyDescriptionNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgPropertyDescriptionNA && (
                  <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Enter description..." value={fields.kotakBbgPropertyDescription || ''} onChange={e => handleChange('kotakBbgPropertyDescription', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
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
            <Field label="Complete Postal Address">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgPostalAddressNA || false} onChange={e => handleChange('kotakBbgPostalAddressNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgPostalAddressNA && (
                  <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Enter full address..." value={fields.kotakBbgPostalAddress || ''} onChange={e => handleChange('kotakBbgPostalAddress', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
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

            <Field label="State & Pin Code">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgStatePinNA || false} onChange={e => handleChange('kotakBbgStatePinNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgStatePinNA && (
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
                )}
              </div>
            </Field>

            <Field label="GPS Coordinates (Lat / Long)">
              <div className="flex space-x-2">
                <input type="number" className={inputCls + ' flex-1'} placeholder="Latitude (e.g. 20.296)" value={fields.kotakBbgLat || ''} onChange={e => handleChange('kotakBbgLat', e.target.value)} disabled={isReadOnly} />
                <input type="number" className={inputCls + ' flex-1'} placeholder="Longitude (e.g. 85.824)" value={fields.kotakBbgLng || ''} onChange={e => handleChange('kotakBbgLng', e.target.value)} disabled={isReadOnly} />
                <button type="button" className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors whitespace-nowrap" disabled={isReadOnly}>Fetch Current Location</button>
              </div>
            </Field>

            <Field label="Landmark">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLandmarkNA || false} onChange={e => handleChange('kotakBbgLandmarkNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgLandmarkNA && (
                  <input type="text" className={inputCls} placeholder="Nearest landmark..." value={fields.kotakBbgLandmark || ''} onChange={e => handleChange('kotakBbgLandmark', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Type of Locality">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLocalityTypeNA || false} onChange={e => handleChange('kotakBbgLocalityTypeNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgLocalityTypeNA && (
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
                )}
              </div>
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

            <Field label="Property Boundaries (As per Deed)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgBoundariesDocNA || false} onChange={e => handleChange('kotakBbgBoundariesDocNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgBoundariesDocNA && (
                  <div className="grid grid-cols-2 gap-4">
                    {['North', 'South', 'East', 'West'].map(dir => (
                      <div key={dir}>
                        <span className="text-sm text-gray-600 block mb-1">{dir}</span>
                        <input type="text" className={inputCls} value={boundariesDoc[dir.toLowerCase()] || ''} onChange={e => setBoundariesDoc(dir.toLowerCase(), e.target.value)} disabled={isReadOnly} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
      title: 'Title, Legal & Statutory Details',
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

            <Field label="Title Deed / Document Number">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgTitleDeedNoNA || false} onChange={e => handleChange('kotakBbgTitleDeedNoNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgTitleDeedNoNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgTitleDeedNo || ''} onChange={e => handleChange('kotakBbgTitleDeedNo', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
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

            <Field label="Sub-Registrar Office (SRO)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgSroNA || false} onChange={e => handleChange('kotakBbgSroNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgSroNA && (
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
                )}
              </div>
            </Field>

            <Field label="Town Planning / Local Authority">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLocalAuthorityNA || false} onChange={e => handleChange('kotakBbgLocalAuthorityNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgLocalAuthorityNA && (
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
                )}
              </div>
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

            <Field label="Property Tax Assessment">
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white bg-opacity-50">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgPropertyTaxNA || false} onChange={e => handleChange('kotakBbgPropertyTaxNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                
                {!fields.kotakBbgPropertyTaxNA && (
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
                )}
              </div>
            </Field>

            <Field label="RERA Registration Number">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={reraNA} onChange={e => handleChange('kotakBbgReraNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!reraNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgReraNo || ''} onChange={e => handleChange('kotakBbgReraNo', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
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

            <Field label="Type of Construction / Structural Frame">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgConstructionTypeNA || false} onChange={e => handleChange('kotakBbgConstructionTypeNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgConstructionTypeNA && (
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
                )}
              </div>
            </Field>

            <Field label="Roofing System">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgRoofingSystemNA || false} onChange={e => handleChange('kotakBbgRoofingSystemNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgRoofingSystemNA && (
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
                )}
              </div>
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

            <Field label="Exterior / Interior Finishing">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgExteriorInteriorFinishingNA || false} onChange={e => handleChange('kotakBbgExteriorInteriorFinishingNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgExteriorInteriorFinishingNA && (
                  <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgExteriorInteriorFinishing || ''} onChange={e => handleChange('kotakBbgExteriorInteriorFinishing', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Quality of Construction & Maintenance">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgQualityOfConstructionNA || false} onChange={e => handleChange('kotakBbgQualityOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgQualityOfConstructionNA && (
                  <select className={inputCls} value={fields.kotakBbgQualityOfConstruction || ''} onChange={e => handleChange('kotakBbgQualityOfConstruction', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Dilapidated">Dilapidated</option>
                  </select>
                )}
              </div>
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
      title: 'Area Measurement & Calculations',
      number: 6,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        
        return (
          <div style={{ backgroundColor: '#e0f7fa', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Total Plot / Land Area">
              <div className="flex space-x-4">
                <input type="number" className={inputCls + ' flex-1'} placeholder="Area" value={fields.kotakBbgLandArea || ''} onChange={e => handleChange('kotakBbgLandArea', e.target.value)} disabled={isReadOnly} />
                <select className={inputCls + ' w-48'} value={fields.kotakBbgLandAreaUnit || ''} onChange={e => handleChange('kotakBbgLandAreaUnit', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select Unit</option>
                  <option value="Sq.Ft">Sq.Ft</option>
                  <option value="Sq.Mts">Sq.Mts</option>
                  <option value="Acres">Acres</option>
                  <option value="Cents">Cents</option>
                </select>
              </div>
            </Field>

            <Field label="Permissible Built-Up Area (FSI/FAR)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgFsiNA || false} onChange={e => handleChange('kotakBbgFsiNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgFsiNA && (
                  <input type="number" className={inputCls} placeholder="e.g. 2.5" value={fields.kotakBbgFsi || ''} onChange={e => handleChange('kotakBbgFsi', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Actual Built-Up Area">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgActualBuaNA || isVacantLand} onChange={e => handleChange('kotakBbgActualBuaNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!(fields.kotakBbgActualBuaNA || isVacantLand) && (
                  <div className="flex space-x-4 mt-2">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Built-Up Area" value={fields.kotakBbgActualBua || ''} onChange={e => handleChange('kotakBbgActualBua', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-48'} value={fields.kotakBbgActualBuaUnit || ''} onChange={e => handleChange('kotakBbgActualBuaUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Unit</option>
                      <option value="Sq.Ft">Sq.Ft</option>
                      <option value="Sq.Mts">Sq.Mts</option>
                    </select>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Actual Carpet Area">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgActualCarpetAreaNA || false} onChange={e => handleChange('kotakBbgActualCarpetAreaNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgActualCarpetAreaNA && (
                  <div className="flex space-x-4 mt-2">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Carpet Area" value={fields.kotakBbgActualCarpetArea || ''} onChange={e => handleChange('kotakBbgActualCarpetArea', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-48'} value={fields.kotakBbgActualCarpetAreaUnit || ''} onChange={e => handleChange('kotakBbgActualCarpetAreaUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Unit</option>
                      <option value="Sq.Ft">Sq.Ft</option>
                      <option value="Sq.Mts">Sq.Mts</option>
                    </select>
                  </div>
                )}
              </div>
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-7',
      title: 'Market Value & Realizable Value Assessment',
      number: 7,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';

        const landArea = parseFloat(fields.kotakBbgLandArea) || 0;
        const landRate = parseFloat(fields.kotakBbgPrevailingMarketRateLand) || 0;
        const fmvLandCalc = landArea * landRate;
        const fmvLandVal = fields.kotakBbgFmvLand || (fmvLandCalc > 0 ? fmvLandCalc.toString() : '');

        const buildingArea = parseFloat(fields.kotakBbgActualBua) || 0;
        const replacementCost = parseFloat(fields.kotakBbgReplacementCostBuilding) || 0;
        const depreciationPercent = parseFloat(fields.kotakBbgDepreciationPercent) || 0;
        
        let fmvBuildingCalc = 0;
        if (!isVacantLand) {
            const initialBldgVal = buildingArea * replacementCost;
            fmvBuildingCalc = initialBldgVal - (initialBldgVal * (depreciationPercent / 100));
        }
        const fmvBuildingVal = fields.kotakBbgFmvBuilding || (fmvBuildingCalc > 0 ? fmvBuildingCalc.toString() : '');
        
        const totalFmvCalc = fmvLandCalc + fmvBuildingCalc;
        const totalFmvVal = fields.kotakBbgTotalFmv || (totalFmvCalc > 0 ? totalFmvCalc.toString() : '');

        return (
          <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Prevailing Market Rate of Land (INR per unit)"
              value={fields.kotakBbgPrevailingMarketRateLand || ''}
              onChange={(val: string) => handleChange('kotakBbgPrevailingMarketRateLand', val)}
              isReadOnly={isReadOnly}
              isEditableOnly={true}
            />

            <PrefillField
              label="Estimated Fair Market Value of Land (INR)"
              value={fmvLandVal}
              onChange={(val: string) => handleChange('kotakBbgFmvLand', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Land Area × Rate]"
            />

            <Field label="Replacement Cost of Building (INR per Sq.Ft) & Depreciation">
              <div className="flex space-x-4">
                <input type="number" className={inputCls + ' flex-1'} placeholder="Replacement Cost (INR per Sq.Ft)" value={fields.kotakBbgReplacementCostBuilding || ''} onChange={e => handleChange('kotakBbgReplacementCostBuilding', e.target.value)} disabled={isReadOnly} />
                <select className={inputCls + ' w-48'} value={fields.kotakBbgDepreciationPercent || ''} onChange={e => handleChange('kotakBbgDepreciationPercent', e.target.value)} disabled={isReadOnly}>
                  <option value="">Depreciation %</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                </select>
              </div>
            </Field>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={fields.kotakBbgFmvBuildingNA || isVacantLand} onChange={e => handleChange('kotakBbgFmvBuildingNA', e.target.checked)} disabled={isReadOnly || isVacantLand} />
                <span>Not Applicable (NA)</span>
              </label>
              {!(fields.kotakBbgFmvBuildingNA || isVacantLand) && (
                <PrefillField
                  label="Estimated Depreciated Value of Building (INR)"
                  value={fmvBuildingVal}
                  onChange={(val: string) => handleChange('kotakBbgFmvBuilding', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Auto calculating from [Building Area × Rate - Depreciation]"
                />
              )}
            </div>

            <PrefillField
              label="Total Estimated Fair Market Value (INR)"
              value={totalFmvVal}
              onChange={(val: string) => handleChange('kotakBbgTotalFmv', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Land Value + Building Value]"
            />
          </div>
        );
      }
    },
    {
      id: 'kotak-section-8',
      title: 'Distress / Forced Sale Value',
      number: 8,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const totalFmvCalc = parseFloat(fields.kotakBbgTotalFmv) || 0;
        const distressFactor = parseFloat(fields.kotakBbgDistressFactor !== undefined ? fields.kotakBbgDistressFactor : '80') || 80;
        const fsvCalc = totalFmvCalc * (distressFactor / 100);
        const fsvVal = fields.kotakBbgFsv || (fsvCalc > 0 ? fsvCalc.toString() : '');

        return (
          <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Distress Sale Value Factor (%)"
              value={fields.kotakBbgDistressFactor !== undefined ? fields.kotakBbgDistressFactor : '80'}
              onChange={(val: string) => handleChange('kotakBbgDistressFactor', val)}
              isReadOnly={isReadOnly}
              isEditableOnly={true}
            />

            <PrefillField
              label="Assessed Forced Sale Value / Realizable Value (INR)"
              value={fsvVal}
              onChange={(val: string) => handleChange('kotakBbgFsv', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Total Fair Market Value × Distress %]"
            />
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
              label="Standard Disclaimers & Assumptions"
              value={disclaimersVal}
              onChange={(val: string) => handleChange('kotakBbgStandardDisclaimers', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
              type="textarea"
            />

            <Field label="Key Risk Factors / Alerts">
              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgRiskFactorsNA || false} onChange={e => handleChange('kotakBbgRiskFactorsNA', e.target.checked)} disabled={isReadOnly} />
                  <span className="font-semibold text-gray-800">Not Applicable (NA) (No Risks Identified)</span>
                </label>
                {!fields.kotakBbgRiskFactorsNA && (
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
                )}
              </div>
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

            <Field label="Detailed Remarks & Additional Observations">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgRemarksNA || false} onChange={e => handleChange('kotakBbgRemarksNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgRemarksNA && (
                  <textarea className={inputCls + ' resize-y'} rows={4} placeholder="Enter any additional key remarks or observations regarding the property..." value={fields.kotakBbgRemarks || ''} onChange={e => handleChange('kotakBbgRemarks', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
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
        const clausesText = `I hereby declare that the information provided in this report is true and correct to the best of my knowledge. The valuation is strictly for bank internal use based on current market trends and visible site conditions as of ${siteVisitDate}.\n\n1. I have not withheld any material information that could affect the valuation.\n2. I have personally inspected the property and verified its physical existence.\n3. I have no direct or indirect interest in the property being valued.\n4. My liability is limited as per standard banking terms and the scope of work defined by Kotak Mahindra Bank.`;
        
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
            
            <PrefillField
              label="Report Issue Date"
              value={issueDateVal}
              onChange={(val: string) => handleChange('kotakBbgReportIssueDate', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Current Date"
              type="date"
            />

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
