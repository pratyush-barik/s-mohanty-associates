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
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5'],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFKotakBbgRenderer({ ...fields, projectCode }),
  navSections: [
    { id: 'kotak-section-1', title: '1. General Details' },
    { id: 'kotak-section-2', title: '2. Details of Property Being Appraised' },
    { id: 'kotak-section-3', title: '3. Site & Surrounding Details' },
    { id: 'kotak-section-4', title: '4. Details of Approvals & Legal Verification' },
    { id: 'kotak-section-5', title: '5. Building / Structural Details' },
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
    }
  ],
};

export default function KotakBBG(props: BankReportBuilderProps) {
  return <BankReportBuilder config={KOTAK_BBG_CONFIG} {...props} />;
}
