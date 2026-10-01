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
          className={`p-1.5 border rounded flex-shrink-0 transition-colors ${isEdit ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
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
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-8', 'section-9'],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFKotakBbgRenderer({ ...fields, projectCode }),
  navSections: [
    { id: 'kotak-section-1', title: '1. General Details' },
    { id: 'kotak-section-2', title: '2. Details of Property Being Appraised' },
    { id: 'kotak-section-3', title: '3. Site & Surrounding Details' },
    { id: 'kotak-section-4', title: '4. Details of Approvals & Legal Verification' },
    { id: 'kotak-section-5', title: '5. Building / Structural Details' },
    { id: 'kotak-section-6', title: '6. Details of Measurements' },
    { id: 'kotak-section-7', title: '7. Valuation Calculations & Rate Analysis' },
    { id: 'kotak-section-8', title: '8. Valuation Financial Summary' },
    { id: 'kotak-section-9', title: '9. Remarks / Key Observations' },
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
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Purpose of Valuation"
              value={fields.kotakBbgPurpose || ''}
              onChange={(val: string) => handleChange('kotakBbgPurpose', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from System Standard Template"
            />
            <Field label="Date of Valuation">
              <input type="date" className={inputCls} value={fields.kotakBbgDateOfValuation || ''} onChange={(e) => handleChange('kotakBbgDateOfValuation', e.target.value)} disabled={isReadOnly} />
            </Field>
            <PrefillField
              label="Name of the Valuer"
              value={fields.kotakBbgValuerName || ''}
              onChange={(val: string) => handleChange('kotakBbgValuerName', val)}
              isReadOnly={isReadOnly}
              tooltip="Prefill from Valuer Profile"
            />
            <Field label="Site Engineer Inspecting Property">
              <select className={inputCls} value={fields.kotakBbgSiteEngineer || ''} onChange={e => handleChange('kotakBbgSiteEngineer', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Site Engineer</option>
                <option value="Engineer 1">Engineer 1</option>
                <option value="Engineer 2">Engineer 2</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgSiteEngineer === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgSiteEngineerCustom || ''} onChange={e => handleChange('kotakBbgSiteEngineerCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>
            <PrefillField
              label="Name of Customer / Borrower"
              value={fields.kotakBbgBorrowerName || ''}
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
                      rows={3} 
                      value={fields.kotakBbgBorrowerName || ''} 
                      disabled={true} 
                    />
                    <button type="button" disabled className="p-1.5 border rounded flex-shrink-0 bg-white border-gray-300 text-gray-500">
                      <Lock size={16} />
                    </button>
                  </div>
                ) : (
                  <textarea className={inputCls + ' resize-y w-full'} rows={3} value={fields.kotakBbgOwnerName || ''} onChange={e => handleChange('kotakBbgOwnerName', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
            <Field label="Date of Technical Site Visit">
              <input type="date" className={inputCls} value={fields.kotakBbgDateOfVisit || ''} onChange={(e) => handleChange('kotakBbgDateOfVisit', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Person Met at Site & Contact Details">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgPersonMetNA || false} onChange={e => handleChange('kotakBbgPersonMetNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Available (NA)</span>
                </label>
                {!fields.kotakBbgPersonMetNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgPersonMet || ''} onChange={e => handleChange('kotakBbgPersonMet', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-2',
      title: 'Details of Property Being Appraised',
      number: 2,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Technical Address (as per site)">
              <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgTechnicalAddress || ''} onChange={e => handleChange('kotakBbgTechnicalAddress', e.target.value)} disabled={isReadOnly} />
            </Field>
            <PrefillField
              label="Legal Address (as per documents)"
              value={fields.kotakBbgLegalAddress || ''}
              onChange={(val: string) => handleChange('kotakBbgLegalAddress', val)}
              isReadOnly={isReadOnly}
              type="textarea"
              tooltip="Prefill from Legal Title Deed"
            />
            <Field label="Google Coordinates">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgGoogleCoordinatesNA || false} onChange={e => handleChange('kotakBbgGoogleCoordinatesNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgGoogleCoordinatesNA && (
                  <div className="flex space-x-2">
                    <input type="text" className={inputCls + ' flex-1'} value={fields.kotakBbgGoogleCoordinates || ''} onChange={e => handleChange('kotakBbgGoogleCoordinates', e.target.value)} disabled={isReadOnly} />
                    <button type="button" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors" disabled={isReadOnly}>Fetch Location</button>
                  </div>
                )}
              </div>
            </Field>
            <Field label="Nature of Property">
              <select className={inputCls} value={fields.kotakBbgNatureOfProperty || ''} onChange={e => handleChange('kotakBbgNatureOfProperty', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Nature</option>
                <option value="Vacant Land">Vacant Land</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Others">Others</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgNatureOfProperty === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgNatureOfPropertyCustom || ''} onChange={e => handleChange('kotakBbgNatureOfPropertyCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>
            <Field label="Tenure of Property">
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgTenure" value="Freehold" checked={fields.kotakBbgTenure === 'Freehold'} onChange={e => handleChange('kotakBbgTenure', e.target.value)} disabled={isReadOnly} />
                  <span>Freehold</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgTenure" value="Leasehold" checked={fields.kotakBbgTenure === 'Leasehold'} onChange={e => handleChange('kotakBbgTenure', e.target.value)} disabled={isReadOnly} />
                  <span>Leasehold</span>
                </label>
              </div>
            </Field>
            <Field label="Lease Terms (if applicable)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLeaseTermsNA || false} onChange={e => handleChange('kotakBbgLeaseTermsNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgLeaseTermsNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgLeaseTerms || ''} onChange={e => handleChange('kotakBbgLeaseTerms', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
            <Field label="Transferability of Leasehold Rights">
              <select className={inputCls} value={fields.kotakBbgTransferability || ''} onChange={e => handleChange('kotakBbgTransferability', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </Field>
            <Field label="Occupancy Details">
              <select className={inputCls} value={fields.kotakBbgOccupancy || ''} onChange={e => handleChange('kotakBbgOccupancy', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Occupancy</option>
                <option value="Self Occupied">Self Occupied</option>
                <option value="Tenanted">Tenanted</option>
                <option value="Vacant">Vacant</option>
                <option value="Partly Occupied">Partly Occupied</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgOccupancy === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgOccupancyCustom || ''} onChange={e => handleChange('kotakBbgOccupancyCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>
          </div>
        );
      }
    },
    {
      id: 'kotak-section-3',
      title: 'Site & Surrounding Details',
      number: 3,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const surroundingDev = Array.isArray(fields.kotakBbgSurroundingDev) ? fields.kotakBbgSurroundingDev : [];
        const toggleSurroundingDev = (val: string) => {
          if (surroundingDev.includes(val)) {
            handleChange('kotakBbgSurroundingDev', surroundingDev.filter(v => v !== val));
          } else {
            handleChange('kotakBbgSurroundingDev', [...surroundingDev, val]);
          }
        };

        const boundaries = fields.kotakBbgBoundariesTable || { northDoc: '', northSite: '', southDoc: '', southSite: '', eastDoc: '', eastSite: '', westDoc: '', westSite: '' };
        const setBoundary = (key: string, val: string) => {
          handleChange('kotakBbgBoundariesTable', { ...boundaries, [key]: val });
        };

        return (
          <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Property Boundaries Comparison">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Direction</th>
                      <th className="border border-gray-300 p-2 text-left">As per Document</th>
                      <th className="border border-gray-300 p-2 text-left">As per Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['North', 'South', 'East', 'West'].map(dir => (
                      <tr key={dir}>
                        <td className="border border-gray-300 p-2 font-medium">{dir}</td>
                        <td className="border border-gray-300 p-2">
                          <input type="text" className={inputCls} value={boundaries[`${dir.toLowerCase()}Doc`] || ''} onChange={e => setBoundary(`${dir.toLowerCase()}Doc`, e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input type="text" className={inputCls} value={boundaries[`${dir.toLowerCase()}Site`] || ''} onChange={e => setBoundary(`${dir.toLowerCase()}Site`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Field>

            <Field label="Boundaries Matching Verification">
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgBoundariesMatching" value="Yes" checked={fields.kotakBbgBoundariesMatching === 'Yes'} onChange={e => handleChange('kotakBbgBoundariesMatching', e.target.value)} disabled={isReadOnly} />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgBoundariesMatching" value="No" checked={fields.kotakBbgBoundariesMatching === 'No'} onChange={e => handleChange('kotakBbgBoundariesMatching', e.target.value)} disabled={isReadOnly} />
                  <span>No</span>
                </label>
              </div>
            </Field>

            <Field label="Discrepancy in Boundaries">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgBoundariesDiscrepancyNA || false} onChange={e => handleChange('kotakBbgBoundariesDiscrepancyNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgBoundariesDiscrepancyNA && (
                  <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgBoundariesDiscrepancy || ''} onChange={e => handleChange('kotakBbgBoundariesDiscrepancy', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Document Basis for Property Identification">
              <select className={inputCls} value={fields.kotakBbgDocumentBasis || ''} onChange={e => handleChange('kotakBbgDocumentBasis', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Document Basis</option>
                <option value="Sale Deed">Sale Deed</option>
                <option value="Conveyance Deed">Conveyance Deed</option>
                <option value="Gift Deed">Gift Deed</option>
                <option value="Others">Others</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgDocumentBasis === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgDocumentBasisCustom || ''} onChange={e => handleChange('kotakBbgDocumentBasisCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label="Valuer Confirmation of Property Identification">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={fields.kotakBbgValuerConfirmation || false} onChange={e => handleChange('kotakBbgValuerConfirmation', e.target.checked)} disabled={isReadOnly} />
                <span>I confirm the property is correctly identified</span>
              </label>
            </Field>

            <Field label="Plot Demarcated at Site">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={fields.kotakBbgPlotDemarcated || false} onChange={e => handleChange('kotakBbgPlotDemarcated', e.target.checked)} disabled={isReadOnly} />
                <span>Yes, physically demarcated</span>
              </label>
            </Field>

            <Field label="Locality Type, Condition & Classification">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLocalityTypeNA || false} onChange={e => handleChange('kotakBbgLocalityTypeNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgLocalityTypeNA && (
                  <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgLocalityType || ''} onChange={e => handleChange('kotakBbgLocalityType', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Development of Surrounding Areas">
              <div className="flex space-x-4 mt-2">
                {['Industrial', 'Commercial', 'Residential'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input type="checkbox" checked={surroundingDev.includes(type)} onChange={() => toggleSurroundingDev(type)} disabled={isReadOnly} />
                    <span>{type}</span>
                  </label>
                ))}
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={fields.kotakBbgSurroundingDevCustomChecked || false} onChange={e => handleChange('kotakBbgSurroundingDevCustomChecked', e.target.checked)} disabled={isReadOnly} />
                  <span>Custom</span>
                </label>
              </div>
              {fields.kotakBbgSurroundingDevCustomChecked && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgSurroundingDevCustom || ''} onChange={e => handleChange('kotakBbgSurroundingDevCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label="Access to Property">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgAccessNA || false} onChange={e => handleChange('kotakBbgAccessNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgAccessNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgAccess || ''} onChange={e => handleChange('kotakBbgAccess', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
            
            <Field label="Approach Road Name & Condition">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgApproachRoadNA || false} onChange={e => handleChange('kotakBbgApproachRoadNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgApproachRoadNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgApproachRoad || ''} onChange={e => handleChange('kotakBbgApproachRoad', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>
            
            <Field label="Proximity to Civic Amenities">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgProximityNA || false} onChange={e => handleChange('kotakBbgProximityNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgProximityNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgProximity || ''} onChange={e => handleChange('kotakBbgProximity', e.target.value)} disabled={isReadOnly} />
                )}
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
        const otherDocs = Array.isArray(fields.kotakBbgOtherDocumentsPerused) ? fields.kotakBbgOtherDocumentsPerused : [];
        const toggleOtherDocs = (val: string) => {
          if (otherDocs.includes(val)) {
            handleChange('kotakBbgOtherDocumentsPerused', otherDocs.filter(v => v !== val));
          } else {
            handleChange('kotakBbgOtherDocumentsPerused', [...otherDocs, val]);
          }
        };

        return (
          <div style={{ backgroundColor: '#fffde7', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Non-Agricultural (N.A.) Conversion Status">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgNaConversionStatusNA || false} onChange={e => handleChange('kotakBbgNaConversionStatusNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgNaConversionStatusNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgNaConversionStatus || ''} onChange={e => handleChange('kotakBbgNaConversionStatus', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Land Zoning / Restrictions">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgLandZoningGPLimitNA || false} onChange={e => handleChange('kotakBbgLandZoningGPLimitNA', e.target.checked)} disabled={isReadOnly} />
                  <span>GP Limit / NA</span>
                </label>
                {!fields.kotakBbgLandZoningGPLimitNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgLandZoning || ''} onChange={e => handleChange('kotakBbgLandZoning', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Approved Plan Details">
              <select className={inputCls} value={fields.kotakBbgApprovedPlanDetails || ''} onChange={e => handleChange('kotakBbgApprovedPlanDetails', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgApprovedPlanDetails === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgApprovedPlanDetailsCustom || ''} onChange={e => handleChange('kotakBbgApprovedPlanDetailsCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label="Authority Granting Approval">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgAuthorityApprovalNA || false} onChange={e => handleChange('kotakBbgAuthorityApprovalNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgAuthorityApprovalNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgAuthorityApproval || ''} onChange={e => handleChange('kotakBbgAuthorityApproval', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Plans Approved by Competent Authority">
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgPlansApprovedByCompetentAuthority" value="Yes" checked={fields.kotakBbgPlansApprovedByCompetentAuthority === 'Yes'} onChange={e => handleChange('kotakBbgPlansApprovedByCompetentAuthority', e.target.value)} disabled={isReadOnly} />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="kotakBbgPlansApprovedByCompetentAuthority" value="No" checked={fields.kotakBbgPlansApprovedByCompetentAuthority === 'No'} onChange={e => handleChange('kotakBbgPlansApprovedByCompetentAuthority', e.target.value)} disabled={isReadOnly} />
                  <span>No</span>
                </label>
              </div>
            </Field>

            <Field label="Commencement Certificate / Building Permit Details">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgCommencementCertificateNA || false} onChange={e => handleChange('kotakBbgCommencementCertificateNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgCommencementCertificateNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgCommencementCertificate || ''} onChange={e => handleChange('kotakBbgCommencementCertificate', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Occupation / Completion Certificate">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgOccupationCertificateNA || false} onChange={e => handleChange('kotakBbgOccupationCertificateNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgOccupationCertificateNA && (
                  <input type="text" className={inputCls} value={fields.kotakBbgOccupationCertificate || ''} onChange={e => handleChange('kotakBbgOccupationCertificate', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Sale / Lease Deed Details">
              <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgSaleLeaseDeedDetails || ''} onChange={e => handleChange('kotakBbgSaleLeaseDeedDetails', e.target.value)} disabled={isReadOnly} placeholder="Enter Date, Reg No., Sale consideration, etc." />
            </Field>

            <Field label="Other Documents Perused">
              <div className="flex flex-wrap gap-4 mt-2">
                {['Sale Deed', 'ROR', 'Sketch Map', 'Approved Plan'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input type="checkbox" checked={otherDocs.includes(type)} onChange={() => toggleOtherDocs(type)} disabled={isReadOnly} />
                    <span>{type}</span>
                  </label>
                ))}
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={fields.kotakBbgOtherDocumentsPerusedCustomChecked || false} onChange={e => handleChange('kotakBbgOtherDocumentsPerusedCustomChecked', e.target.checked)} disabled={isReadOnly} />
                  <span>Custom</span>
                </label>
              </div>
              {fields.kotakBbgOtherDocumentsPerusedCustomChecked && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgOtherDocumentsPerusedCustom || ''} onChange={e => handleChange('kotakBbgOtherDocumentsPerusedCustom', e.target.value)} disabled={isReadOnly} />
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
            <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '8px' }}>
              <p className="text-gray-600 text-sm italic mb-2">This section is auto-disabled because Nature of Property is "Vacant Land".</p>
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={overridden} onChange={e => handleChange('kotakBbgSection5Override', e.target.checked)} disabled={isReadOnly} />
                <span>Manually override and enable this section</span>
              </label>
            </div>
          );
        }

        const amenities = Array.isArray(fields.kotakBbgAmenitiesProvided) ? fields.kotakBbgAmenitiesProvided : [];
        const toggleAmenities = (val: string) => {
          if (amenities.includes(val)) {
            handleChange('kotakBbgAmenitiesProvided', amenities.filter(v => v !== val));
          } else {
            handleChange('kotakBbgAmenitiesProvided', [...amenities, val]);
          }
        };

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

        let calculatedAge = '';
        if (fields.kotakBbgYearOfConstruction) {
          const age = currentYear - parseInt(fields.kotakBbgYearOfConstruction, 10);
          const standardLifespan = fields.kotakBbgConstructionRoofing === 'RCC Framed Structure' ? 60 : 50;
          calculatedAge = Math.max(0, standardLifespan - age).toString();
        }
        const residualAgeVal = fields.kotakBbgResidualStructuralAge || calculatedAge;

        return (
          <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {isVacantLand && overridden && (
              <label className="flex items-center space-x-2 text-sm text-gray-500 pb-2 border-b border-gray-200">
                <input type="checkbox" checked={overridden} onChange={e => handleChange('kotakBbgSection5Override', e.target.checked)} disabled={isReadOnly} />
                <span>Manually overriding "Vacant Land" disable lock</span>
              </label>
            )}
            
            <Field label="Type of Construction & Roofing">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgConstructionRoofingNA || false} onChange={e => handleChange('kotakBbgConstructionRoofingNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgConstructionRoofingNA && (
                  <>
                    <select className={inputCls} value={fields.kotakBbgConstructionRoofing || ''} onChange={e => handleChange('kotakBbgConstructionRoofing', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="RCC Framed Structure">RCC Framed Structure</option>
                      <option value="Load Bearing">Load Bearing</option>
                      <option value="GCI Roofing Shed">GCI Roofing Shed</option>
                      <option value="Composite">Composite</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgConstructionRoofing === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgConstructionRoofingCustom || ''} onChange={e => handleChange('kotakBbgConstructionRoofingCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
                )}
              </div>
            </Field>

            <Field label="Year of Construction">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgYearOfConstructionNA || false} onChange={e => handleChange('kotakBbgYearOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgYearOfConstructionNA && (
                  <select className={inputCls} value={fields.kotakBbgYearOfConstruction || ''} onChange={e => handleChange('kotakBbgYearOfConstruction', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Year</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            </Field>

            <Field label="Stage of Construction (%)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgStageOfConstructionNA || false} onChange={e => handleChange('kotakBbgStageOfConstructionNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgStageOfConstructionNA && (
                  <div className="flex items-center space-x-4">
                    <input type="range" min="0" max="100" className="flex-1" value={fields.kotakBbgStageOfConstruction || 0} onChange={e => handleChange('kotakBbgStageOfConstruction', e.target.value)} disabled={isReadOnly} />
                    <input type="number" min="0" max="100" className={inputCls + ' w-20'} value={fields.kotakBbgStageOfConstruction || ''} onChange={e => handleChange('kotakBbgStageOfConstruction', e.target.value)} disabled={isReadOnly} />
                  </div>
                )}
              </div>
            </Field>

            <PrefillField
              label="Residual Structural Age"
              value={residualAgeVal}
              onChange={(val: string) => handleChange('kotakBbgResidualStructuralAge', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Standard Lifespan - (Current Year - Year of Construction)]"
            />

            <Field label="Number of Floors">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgNumberOfFloorsNA || false} onChange={e => handleChange('kotakBbgNumberOfFloorsNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgNumberOfFloorsNA && (
                  <>
                    <select className={inputCls} value={fields.kotakBbgNumberOfFloors || ''} onChange={e => handleChange('kotakBbgNumberOfFloors', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="Ground">Ground</option>
                      <option value="G+1">G+1</option>
                      <option value="G+2">G+2</option>
                      <option value="G+3">G+3</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgNumberOfFloors === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgNumberOfFloorsCustom || ''} onChange={e => handleChange('kotakBbgNumberOfFloorsCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
                )}
              </div>
            </Field>

            <Field label="Quality of Construction">
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
                  </select>
                )}
              </div>
            </Field>

            <Field label="Technical Details (Finishing & Interiors)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgTechnicalDetailsFinishingNA || false} onChange={e => handleChange('kotakBbgTechnicalDetailsFinishingNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgTechnicalDetailsFinishingNA && (
                  <textarea className={inputCls + ' resize-y'} rows={3} value={fields.kotakBbgTechnicalDetailsFinishing || ''} onChange={e => handleChange('kotakBbgTechnicalDetailsFinishing', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Amenities Provided">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgAmenitiesProvidedNA || false} onChange={e => handleChange('kotakBbgAmenitiesProvidedNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgAmenitiesProvidedNA && (
                  <>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {['Boundary Wall', 'Parking', 'Firefighting', 'Lifts', 'Power Backup'].map(type => (
                        <label key={type} className="flex items-center space-x-2">
                          <input type="checkbox" checked={amenities.includes(type)} onChange={() => toggleAmenities(type)} disabled={isReadOnly} />
                          <span>{type}</span>
                        </label>
                      ))}
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={fields.kotakBbgAmenitiesProvidedCustomChecked || false} onChange={e => handleChange('kotakBbgAmenitiesProvidedCustomChecked', e.target.checked)} disabled={isReadOnly} />
                        <span>Custom</span>
                      </label>
                    </div>
                    {fields.kotakBbgAmenitiesProvidedCustomChecked && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgAmenitiesProvidedCustom || ''} onChange={e => handleChange('kotakBbgAmenitiesProvidedCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
                )}
              </div>
            </Field>

            <Field label="Usage of Property">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgUsageOfPropertyNA || false} onChange={e => handleChange('kotakBbgUsageOfPropertyNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgUsageOfPropertyNA && (
                  <>
                    <select className={inputCls} value={fields.kotakBbgUsageOfProperty || ''} onChange={e => handleChange('kotakBbgUsageOfProperty', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed-use">Mixed-use</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgUsageOfProperty === 'Custom' && (
                      <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgUsageOfPropertyCustom || ''} onChange={e => handleChange('kotakBbgUsageOfPropertyCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
                )}
              </div>
            </Field>
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
        const buaData = Array.isArray(fields.kotakBbgBuildingBuaTable) ? fields.kotakBbgBuildingBuaTable : [{ floor: 'Ground', carpet: '', builtUp: '', superBuiltUp: '' }];

        const updateBuaRow = (index: number, key: string, value: string) => {
          const newData = [...buaData];
          newData[index][key] = value;
          handleChange('kotakBbgBuildingBuaTable', newData);
        };

        const addBuaRow = () => {
          handleChange('kotakBbgBuildingBuaTable', [...buaData, { floor: '', carpet: '', builtUp: '', superBuiltUp: '' }]);
        };

        const removeBuaRow = (index: number) => {
          const newData = [...buaData];
          newData.splice(index, 1);
          handleChange('kotakBbgBuildingBuaTable', newData);
        };

        // Land Area conversions
        let calculatedSecondaryArea = '';
        let calculatedSecondaryUnit = fields.kotakBbgLandAreaSecondaryUnit || 'Acres';
        if (fields.kotakBbgLandArea && fields.kotakBbgLandAreaUnit) {
          const area = parseFloat(fields.kotakBbgLandArea);
          if (!isNaN(area)) {
             if (fields.kotakBbgLandAreaUnit === 'sq. ft.') {
               calculatedSecondaryArea = (area / 43560).toFixed(3);
               calculatedSecondaryUnit = fields.kotakBbgLandAreaSecondaryUnit || 'Acres';
             } else if (fields.kotakBbgLandAreaUnit === 'Acres') {
               calculatedSecondaryArea = (area * 43560).toFixed(2);
               calculatedSecondaryUnit = fields.kotakBbgLandAreaSecondaryUnit || 'sq. ft.';
             } else if (fields.kotakBbgLandAreaUnit === 'Decimals') {
               calculatedSecondaryArea = (area * 435.6).toFixed(2);
               calculatedSecondaryUnit = fields.kotakBbgLandAreaSecondaryUnit || 'sq. ft.';
             } else if (fields.kotakBbgLandAreaUnit === 'Hectares') {
               calculatedSecondaryArea = (area * 107639.1).toFixed(2);
               calculatedSecondaryUnit = fields.kotakBbgLandAreaSecondaryUnit || 'sq. ft.';
             }
          }
        }
        const secondaryAreaVal = fields.kotakBbgLandAreaSecondary || calculatedSecondaryArea;
        const isEditSecondary = fields.kotakBbgLandAreaSecondaryEditMode || false;

        // Total BUA calculation
        let calculatedTotalBua = 0;
        buaData.forEach((r: any) => {
          const val = parseFloat(r.builtUp);
          if (!isNaN(val)) calculatedTotalBua += val;
        });
        const totalBuaVal = fields.kotakBbgTotalBua || (calculatedTotalBua > 0 ? calculatedTotalBua.toString() : '');

        return (
          <div style={{ backgroundColor: '#e0f7fa', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Land Area & Physical Features">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-50 rounded border border-cyan-100">
                  <div className="text-sm font-semibold text-gray-700">Primary Area</div>
                  <div className="flex space-x-4">
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Area" value={fields.kotakBbgLandArea || ''} onChange={e => handleChange('kotakBbgLandArea', e.target.value)} disabled={isReadOnly} />
                    <select className={inputCls + ' w-48'} value={fields.kotakBbgLandAreaUnit || ''} onChange={e => handleChange('kotakBbgLandAreaUnit', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Unit</option>
                      <option value="sq. ft.">sq. ft.</option>
                      <option value="Acres">Acres</option>
                      <option value="Decimals">Decimals</option>
                      <option value="Hectares">Hectares</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-50 rounded border border-cyan-100">
                  <div className="text-sm font-semibold text-gray-700">Secondary Area (Alternate Unit)</div>
                  {!isEditSecondary ? (
                    <div className="flex space-x-2" title="Auto calculating from [Primary Area Unit Conversion]">
                      <input type="text" className={inputCls + ' flex-1 opacity-70 bg-gray-100'} value={secondaryAreaVal} disabled />
                      <select className={inputCls + ' w-48 opacity-70 bg-gray-100'} value={calculatedSecondaryUnit} disabled>
                        <option value="sq. ft.">sq. ft.</option>
                        <option value="Acres">Acres</option>
                        <option value="Decimals">Decimals</option>
                        <option value="Hectares">Hectares</option>
                      </select>
                      {!isReadOnly && (
                        <button type="button" onClick={() => handleChange('kotakBbgLandAreaSecondaryEditMode', true)} className="p-1.5 border rounded flex-shrink-0 bg-white border-gray-300 text-gray-500 hover:bg-gray-50">
                          <Lock size={16} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <input type="number" className={inputCls + ' flex-1'} value={fields.kotakBbgLandAreaSecondary || ''} onChange={e => handleChange('kotakBbgLandAreaSecondary', e.target.value)} disabled={isReadOnly} />
                      <select className={inputCls + ' w-48'} value={fields.kotakBbgLandAreaSecondaryUnit || 'sq. ft.'} onChange={e => handleChange('kotakBbgLandAreaSecondaryUnit', e.target.value)} disabled={isReadOnly}>
                        <option value="sq. ft.">sq. ft.</option>
                        <option value="Acres">Acres</option>
                        <option value="Decimals">Decimals</option>
                        <option value="Hectares">Hectares</option>
                      </select>
                      {!isReadOnly && (
                        <button type="button" onClick={() => handleChange('kotakBbgLandAreaSecondaryEditMode', false)} className="p-1.5 border rounded flex-shrink-0 bg-green-50 border-green-300 text-green-600 hover:bg-green-100">
                          <Unlock size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-50 rounded border border-cyan-100">
                  <div className="text-sm font-semibold text-gray-700">Documentary Proof Source</div>
                  <select className={inputCls} value={fields.kotakBbgLandAreaProofSource || ''} onChange={e => handleChange('kotakBbgLandAreaProofSource', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select Option</option>
                    <option value="As per Sale Deed">As per Sale Deed</option>
                    <option value="As per ROR">As per ROR</option>
                    <option value="As per Sketch Map">As per Sketch Map</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {fields.kotakBbgLandAreaProofSource === 'Custom' && (
                    <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom value" value={fields.kotakBbgLandAreaProofSourceCustom || ''} onChange={e => handleChange('kotakBbgLandAreaProofSourceCustom', e.target.value)} disabled={isReadOnly} />
                  )}
                </div>
              </div>
            </Field>

            <Field label="Building Built-up Area (BUA)">
              <div className="space-y-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgBuildingBuaNA || false} onChange={e => handleChange('kotakBbgBuildingBuaNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA) (e.g., Vacant Land)</span>
                </label>
                {!fields.kotakBbgBuildingBuaNA && (
                  <>
                    <label className="flex items-center space-x-2 text-sm text-cyan-800">
                      <input type="checkbox" checked={fields.kotakBbgBuildingBuaAnnexure || false} onChange={e => handleChange('kotakBbgBuildingBuaAnnexure', e.target.checked)} disabled={isReadOnly} />
                      <span>Details attached in Annexure-II (bypass row-by-row entry)</span>
                    </label>
                    {!fields.kotakBbgBuildingBuaAnnexure && (
                      <div className="space-y-2">
                        {buaData.map((row: any, i: number) => (
                          <div key={i} className="flex space-x-2">
                            <input type="text" className={inputCls + ' w-1/4'} placeholder="Floor (e.g. Ground)" value={row.floor || ''} onChange={e => updateBuaRow(i, 'floor', e.target.value)} disabled={isReadOnly} />
                            <input type="number" className={inputCls + ' w-1/4'} placeholder="Carpet Area" value={row.carpet || ''} onChange={e => updateBuaRow(i, 'carpet', e.target.value)} disabled={isReadOnly} />
                            <input type="number" className={inputCls + ' w-1/4'} placeholder="Built-up Area" value={row.builtUp || ''} onChange={e => updateBuaRow(i, 'builtUp', e.target.value)} disabled={isReadOnly} />
                            <input type="number" className={inputCls + ' w-1/4'} placeholder="Super Built-up Area" value={row.superBuiltUp || ''} onChange={e => updateBuaRow(i, 'superBuiltUp', e.target.value)} disabled={isReadOnly} />
                            {!isReadOnly && (
                              <button type="button" onClick={() => removeBuaRow(i)} className="text-red-500 font-bold px-2">X</button>
                            )}
                          </div>
                        ))}
                        {!isReadOnly && (
                          <button type="button" onClick={addBuaRow} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">+ Add Floor</button>
                        )}
                      </div>
                    )}
                    <PrefillField
                      label="Total Built-up Area (BUA)"
                      value={totalBuaVal}
                      onChange={(val: string) => handleChange('kotakBbgTotalBua', val)}
                      isReadOnly={isReadOnly}
                      tooltip="Auto calculating from [Sum of Floor Built-up Areas]"
                    />
                  </>
                )}
              </div>
            </Field>

            <Field label="Deviations / Violations">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgDeviationsNA || false} onChange={e => handleChange('kotakBbgDeviationsNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgDeviationsNA && (
                  <>
                    <select className={inputCls} value={fields.kotakBbgDeviations || ''} onChange={e => handleChange('kotakBbgDeviations', e.target.value)} disabled={isReadOnly}>
                      <option value="">Select Option</option>
                      <option value="Approved Plan not Available">Approved Plan not Available</option>
                      <option value="No Deviations">No Deviations</option>
                      <option value="Setback Violation">Setback Violation</option>
                      <option value="Encroachment">Encroachment</option>
                      <option value="Custom">Custom</option>
                    </select>
                    {fields.kotakBbgDeviations === 'Custom' && (
                      <textarea className={inputCls + ' resize-y mt-2'} rows={3} placeholder="Enter custom deviations" value={fields.kotakBbgDeviationsCustom || ''} onChange={e => handleChange('kotakBbgDeviationsCustom', e.target.value)} disabled={isReadOnly} />
                    )}
                  </>
                )}
              </div>
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
        // Adopted Land Rate calculation
        const baseRate = parseFloat(fields.kotakBbgBaseMarketRate) || 0;
        const discountPremium = parseFloat(fields.kotakBbgDiscountPremium) || 0;
        const calcLandRate = baseRate + (baseRate * (discountPremium / 100));
        const adoptedLandRateVal = fields.kotakBbgAdoptedLandRate || (calcLandRate > 0 ? calcLandRate.toString() : '');

        // BUA table for Adopted Building Rates
        const sec6BuaData = Array.isArray(fields.kotakBbgBuildingBuaTable) ? fields.kotakBbgBuildingBuaTable : [];
        const adoptedBldgRates = Array.isArray(fields.kotakBbgAdoptedBuildingRateTable) ? fields.kotakBbgAdoptedBuildingRateTable : [];

        const updateBldgRate = (index: number, val: string) => {
          const newData = [...adoptedBldgRates];
          if (!newData[index]) newData[index] = { floor: sec6BuaData[index]?.floor || `Floor ${index + 1}`, rate: '' };
          newData[index].rate = val;
          handleChange('kotakBbgAdoptedBuildingRateTable', newData);
        };

        // Valuation Calculations Breakdown
        const landArea = parseFloat(fields.kotakBbgLandArea) || 0;
        const landValue = landArea * parseFloat(adoptedLandRateVal || '0');

        let buildingValue = 0;
        if (!fields.kotakBbgBuildingBuaNA && !fields.kotakBbgAdoptedBuildingRateNA) {
          sec6BuaData.forEach((r: any, i: number) => {
            const area = parseFloat(r.builtUp) || 0;
            const rate = parseFloat(adoptedBldgRates[i]?.rate) || 0;
            buildingValue += (area * rate);
          });
        }
        const totalAssetValue = landValue + buildingValue;
        
        let breakdownText = '';
        if (totalAssetValue > 0) {
          breakdownText = `(i) Land Value: ₹${landValue.toFixed(2)}\n(ii) Building Value: ₹${buildingValue.toFixed(2)}\nTotal Asset Value (i+ii): ₹${totalAssetValue.toFixed(2)}`;
        }
        const valuationBreakdownVal = fields.kotakBbgValuationBreakdown || breakdownText;

        const guidelineRate = parseFloat(fields.kotakBbgGuidelineRate) || 0;
        const guidelineValCalc = (landArea * guidelineRate);
        const guidelineValVal = fields.kotakBbgGuidelineValuation || (guidelineValCalc > 0 ? guidelineValCalc.toString() : '');

        return (
          <div style={{ backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <Field label="Valuation Methodology Adopted">
              <select className={inputCls} value={fields.kotakBbgValuationMethodology || ''} onChange={e => handleChange('kotakBbgValuationMethodology', e.target.value)} disabled={isReadOnly}>
                <option value="">Select Option</option>
                <option value="Sales Comparison Method">Sales Comparison Method</option>
                <option value="Cost Approach (Land & Building)">Cost Approach (Land & Building)</option>
                <option value="Income Capitalization">Income Capitalization</option>
                <option value="Custom">Custom</option>
              </select>
              {fields.kotakBbgValuationMethodology === 'Custom' && (
                <input type="text" className={inputCls + ' mt-2'} placeholder="Enter custom methodology" value={fields.kotakBbgValuationMethodologyCustom || ''} onChange={e => handleChange('kotakBbgValuationMethodologyCustom', e.target.value)} disabled={isReadOnly} />
              )}
            </Field>

            <Field label="Source of Rate Selection">
              <div className="flex space-x-4">
                {['Comparable Sale Deeds', 'Local Market Inquiries', 'Both'].map(src => (
                  <label key={src} className="flex items-center space-x-2">
                    <input type="radio" name="kotakBbgSourceOfRateSelection" value={src} checked={fields.kotakBbgSourceOfRateSelection === src} onChange={e => handleChange('kotakBbgSourceOfRateSelection', e.target.value)} disabled={isReadOnly} />
                    <span>{src}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Comparables Relied Upon">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgComparablesReliedNA || false} onChange={e => handleChange('kotakBbgComparablesReliedNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgComparablesReliedNA && (
                  <textarea className={inputCls + ' resize-y'} rows={3} placeholder="List comparable properties or market feedback here" value={fields.kotakBbgComparablesRelied || ''} onChange={e => handleChange('kotakBbgComparablesRelied', e.target.value)} disabled={isReadOnly} />
                )}
              </div>
            </Field>

            <Field label="Analysis of Comparables & Justification">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-50 rounded border border-orange-100">
                  <div className="text-sm font-semibold text-gray-700">Base Market Rate (₹ / sq. ft.)</div>
                  <input type="number" className={inputCls} placeholder="Rate" value={fields.kotakBbgBaseMarketRate || ''} onChange={e => handleChange('kotakBbgBaseMarketRate', e.target.value)} disabled={isReadOnly} />
                </div>
                
                <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-50 rounded border border-orange-100">
                  <div className="text-sm font-semibold text-gray-700">Discount/Premium Applied (%)</div>
                  <input type="number" className={inputCls} placeholder="e.g. -30 for discount, 10 for premium" value={fields.kotakBbgDiscountPremium || ''} onChange={e => handleChange('kotakBbgDiscountPremium', e.target.value)} disabled={isReadOnly} />
                </div>

                <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-50 rounded border border-orange-100">
                  <div className="text-sm font-semibold text-gray-700">Justification Narrative</div>
                  <textarea className={inputCls + ' resize-y'} rows={3} placeholder="Explain the discount/premium applied" value={fields.kotakBbgJustificationNarrative || ''} onChange={e => handleChange('kotakBbgJustificationNarrative', e.target.value)} disabled={isReadOnly} />
                </div>
              </div>
            </Field>

            <PrefillField
              label="Adopted Land Rate (₹ / sq. ft.)"
              value={adoptedLandRateVal}
              onChange={(val: string) => handleChange('kotakBbgAdoptedLandRate', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Base Market Rate + (Base Market Rate * Discount/Premium %)]"
            />

            <Field label="Adopted Building Rate(s) (₹ / sq. ft.)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgAdoptedBuildingRateNA || false} onChange={e => handleChange('kotakBbgAdoptedBuildingRateNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA) (e.g., Vacant Land)</span>
                </label>
                {!fields.kotakBbgAdoptedBuildingRateNA && (
                  <div className="space-y-2">
                    {sec6BuaData.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No BUA floors defined in Section 6.</p>
                    ) : (
                      sec6BuaData.map((row: any, i: number) => (
                        <div key={i} className="flex space-x-2 items-center">
                          <span className="w-1/3 text-sm text-gray-700 font-medium">{row.floor || `Floor ${i+1}`} ({row.builtUp || 0} sqft)</span>
                          <span className="flex items-center text-gray-500 font-bold px-2 border rounded bg-gray-50">₹</span>
                          <input type="number" className={inputCls + ' flex-1'} placeholder="Rate per sq. ft." value={adoptedBldgRates[i]?.rate || ''} onChange={e => updateBldgRate(i, e.target.value)} disabled={isReadOnly} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Field>

            <PrefillField
              label="Valuation Calculations Breakdown"
              value={valuationBreakdownVal}
              onChange={(val: string) => handleChange('kotakBbgValuationBreakdown', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Land Value (Area * Rate) + Building Value (Sum of Floor BUA * Rate)]"
              type="textarea"
            />

            <Field label="Guideline / Circle / Ready Reckoner Rate (₹ / sq. ft.)">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={fields.kotakBbgGuidelineRateNA || false} onChange={e => handleChange('kotakBbgGuidelineRateNA', e.target.checked)} disabled={isReadOnly} />
                  <span>Not Applicable (NA)</span>
                </label>
                {!fields.kotakBbgGuidelineRateNA && (
                  <div className="flex space-x-2">
                    <span className="flex items-center text-gray-500 font-bold px-2 border rounded bg-gray-50">₹</span>
                    <input type="number" className={inputCls + ' flex-1'} placeholder="Guideline Rate" value={fields.kotakBbgGuidelineRate || ''} onChange={e => handleChange('kotakBbgGuidelineRate', e.target.value)} disabled={isReadOnly} />
                  </div>
                )}
              </div>
            </Field>

            <PrefillField
              label="Guideline / Circle / Ready Reckoner Valuation Calculation"
              value={guidelineValVal}
              onChange={(val: string) => handleChange('kotakBbgGuidelineValuation', val)}
              isReadOnly={isReadOnly}
              tooltip="Auto calculating from [Primary Land Area * Guideline Land Rate]"
            />
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
        // Shared calculations from Section 7
        const landArea = parseFloat(fields.kotakBbgLandArea) || 0;
        
        const baseRate = parseFloat(fields.kotakBbgBaseMarketRate) || 0;
        const discountPremium = parseFloat(fields.kotakBbgDiscountPremium) || 0;
        const calcLandRate = baseRate + (baseRate * (discountPremium / 100));
        const adoptedLandRateVal = fields.kotakBbgAdoptedLandRate || (calcLandRate > 0 ? calcLandRate.toString() : '0');
        const landValue = landArea * parseFloat(adoptedLandRateVal);

        let buildingValue = 0;
        if (!fields.kotakBbgBuildingBuaNA && !fields.kotakBbgAdoptedBuildingRateNA) {
          const sec6BuaData = Array.isArray(fields.kotakBbgBuildingBuaTable) ? fields.kotakBbgBuildingBuaTable : [];
          const adoptedBldgRates = Array.isArray(fields.kotakBbgAdoptedBuildingRateTable) ? fields.kotakBbgAdoptedBuildingRateTable : [];
          sec6BuaData.forEach((r: any, i: number) => {
            const area = parseFloat(r.builtUp) || 0;
            const rate = parseFloat(adoptedBldgRates[i]?.rate) || 0;
            buildingValue += (area * rate);
          });
        }
        const totalAssetValue = landValue + buildingValue;

        // Section 8 calculations
        const fmvExactCalc = totalAssetValue;
        const fmvExactVal = fields.kotakBbgFmvExact || (fmvExactCalc > 0 ? fmvExactCalc.toString() : '');

        const roundingPref = fields.kotakBbgRoundingPreference || 'Nearest 1,00,000';
        let roundedFmvCalc = fmvExactCalc;
        if (fmvExactCalc > 0) {
           if (roundingPref === 'Nearest 1,000') {
             roundedFmvCalc = Math.round(fmvExactCalc / 1000) * 1000;
           } else if (roundingPref === 'Nearest 1,00,000') {
             roundedFmvCalc = Math.round(fmvExactCalc / 100000) * 100000;
           }
        }
        const fmvRoundedVal = fields.kotakBbgFmvRounded || (roundedFmvCalc > 0 ? roundedFmvCalc.toString() : '');

        const guidelineRate = parseFloat(fields.kotakBbgGuidelineRate) || 0;
        const guidelineValCalc = (landArea * guidelineRate);
        const isFmvLowerThanGuideline = roundedFmvCalc > 0 && guidelineValCalc > 0 && roundedFmvCalc < guidelineValCalc;

        const rvPercent = parseFloat(fields.kotakBbgRvPercent !== undefined ? fields.kotakBbgRvPercent : '90') || 90;
        const rvCalc = roundedFmvCalc * (rvPercent / 100);
        const rvVal = fields.kotakBbgRv || (rvCalc > 0 ? rvCalc.toString() : '');

        const dvPercent = parseFloat(fields.kotakBbgDvPercent !== undefined ? fields.kotakBbgDvPercent : '80') || 80;
        const dvCalc = roundedFmvCalc * (dvPercent / 100);
        const dvVal = fields.kotakBbgDv || (dvCalc > 0 ? dvCalc.toString() : '');

        const ivCalc = buildingValue;
        const ivVal = fields.kotakBbgIv || (ivCalc > 0 ? ivCalc.toString() : '');
        
        const isVacantLand = fields.kotakBbgNatureOfProperty === 'Vacant Land';
        const isIvNA = fields.kotakBbgIvNA !== undefined ? fields.kotakBbgIvNA : isVacantLand;

        return (
          <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            <PrefillField
              label="Exact Fair Market Value (FMV) (₹)"
              value={fmvExactVal}
              onChange={(val: string) => handleChange('kotakBbgFmvExact', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from section 7, "Total Asset Value (i + ii)"'
            />

            <Field label="Rounding Preference">
              <select className={inputCls} value={fields.kotakBbgRoundingPreference || 'Nearest 1,00,000'} onChange={e => handleChange('kotakBbgRoundingPreference', e.target.value)} disabled={isReadOnly}>
                <option value="Nearest 1,000">Nearest 1,000</option>
                <option value="Nearest 1,00,000">Nearest 1,00,000</option>
                <option value="No Rounding">No Rounding</option>
              </select>
            </Field>
            
            <div className="space-y-2">
              <PrefillField
                label='Rounded Fair Market Value ("Say Value") (₹)'
                value={fmvRoundedVal}
                onChange={(val: string) => handleChange('kotakBbgFmvRounded', val)}
                isReadOnly={isReadOnly}
                tooltip={`Auto calculating from [Round(Exact Fair Market Value (FMV), ${roundingPref})]`}
              />
              {isFmvLowerThanGuideline && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm font-semibold flex items-start space-x-2">
                  <span>⚠️</span>
                  <span>Alert: Rounded Fair Market Value (₹{roundedFmvCalc.toLocaleString()}) is strictly lower than the Guideline Valuation (₹{guidelineValCalc.toLocaleString()}).</span>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-white bg-opacity-50 rounded border border-pink-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700 w-32">RV Percentage:</span>
                <input type="number" className={inputCls + ' w-24'} value={fields.kotakBbgRvPercent !== undefined ? fields.kotakBbgRvPercent : '90'} onChange={e => handleChange('kotakBbgRvPercent', e.target.value)} disabled={isReadOnly} />
                <span className="text-sm text-gray-700">%</span>
              </div>
              <PrefillField
                label="Realizable Value (RV) (₹)"
                value={rvVal}
                onChange={(val: string) => handleChange('kotakBbgRv', val)}
                isReadOnly={isReadOnly}
                tooltip="Auto calculating from [RV Percentage * Rounded Fair Market Value]"
              />
            </div>
            
            <div className="p-3 bg-white bg-opacity-50 rounded border border-pink-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700 w-32">DV Percentage:</span>
                <input type="number" className={inputCls + ' w-24'} value={fields.kotakBbgDvPercent !== undefined ? fields.kotakBbgDvPercent : '80'} onChange={e => handleChange('kotakBbgDvPercent', e.target.value)} disabled={isReadOnly} />
                <span className="text-sm text-gray-700">%</span>
              </div>
              <PrefillField
                label="Distress Value (DV) (₹)"
                value={dvVal}
                onChange={(val: string) => handleChange('kotakBbgDv', val)}
                isReadOnly={isReadOnly}
                tooltip="Auto calculating from [DV Percentage * Rounded Fair Market Value]"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-pink-800">
                <input type="checkbox" checked={isIvNA} onChange={e => handleChange('kotakBbgIvNA', e.target.checked)} disabled={isReadOnly} />
                <span>Not Applicable (NA) for Insurable Value (e.g. Vacant Land)</span>
              </label>
              {!isIvNA && (
                <PrefillField
                  label="Insurable Value (IV) (₹)"
                  value={ivVal}
                  onChange={(val: string) => handleChange('kotakBbgIv', val)}
                  isReadOnly={isReadOnly}
                  tooltip='Prefill from section 7, "Building Value (ii)"'
                />
              )}
            </div>
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
    }
  ],
};

export default function KotakBBG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={KOTAK_BBG_CONFIG} {...props} />;
}
