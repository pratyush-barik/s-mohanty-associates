'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFBajajHousingRenderer } from '@/lib/banks/pdf-bajaj-housing-renderer';
import { Field, inputCls } from '../BaseBankReportComponents';

export const BAJAJ_HOUSING_HLLAP_CONFIG: BankConfig = {
  bankId: 'BAJAJ HOUSING FINANCE LTD',
  subTemplateId: 'HL-LAP',
  displayName: 'Bajaj Housing Finance Ltd — HL-LAP',
  navSections: [
    { id: 'bajaj-section-1', title: 'Application' },
    { id: 'bajaj-section-2', title: 'Location' },
    { id: 'bajaj-section-3', title: 'Property' },
    { id: 'bajaj-section-4', title: 'Boundaries' },
    { id: 'bajaj-section-5', title: 'Approvals' },
    { id: 'bajaj-section-6', title: 'Technical' },
    { id: 'bajaj-section-7', title: 'Area & Floor' },
    { id: 'bajaj-section-8', title: 'Valuation' },
    { id: 'bajaj-section-9', title: 'Remarks' },
    { id: 'section-11', title: 'Photos' },
    { id: 'section-12', title: 'Maps' },
  ],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7a', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'annexures'],
  hideDefaultDeclarationAndCertificate: true,
  extraSections: [],
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  fieldLabels: {
    'section-11-title': 'Property Photographs',
    'section-12-title': 'Location & Sketch Maps',
  },
  defaultValues: {
    // Section 1: Application Details
    bajajFileNo: '',
    bajajFileNo_isNA: false,

    bajajDateOfReport: '',

    bajajNameOfApplicant: '',

    bajajContactPersonName: '',
    bajajContactPersonPhone: '',
    bajajContactPerson_isManual: false,
    bajajContactPerson_isNA: false,
    
    bajajLoanType: '',
    bajajLoanTypeCustom: '',

    bajajPersonMetAtSite: '',
    bajajPersonMetAtSite_isManual: false,
    bajajPersonMetAtSite_isNA: false,

    bajajPropertyOwnerName: '',
    bajajPropertyOwnerRelation: 'S/O',
    bajajPropertyOwnerRelationCustom: '',
    bajajPropertyOwnerRelative: '',
    bajajPropertyOwner_isManual: false,
    bajajPropertyOwner_isNA: false,

    bajajDocumentsProvided: '',
    bajajDocumentsProvided_isNA: false,

    // Section 2: Location Details
    bajajAddressAsPerSite: '',
    bajajAddressAsPerSite_isNA: false,
    bajajLocalityName: '',
    bajajLocalityName_isNA: false,
    bajajLandmarkNearBy: '',
    bajajLandmarkNearBy_isNA: false,
    bajajDistanceFromCityCentre: '',
    bajajDistanceFromCityCentre_isNA: false,
    
    bajajLatitude: '',
    bajajLatitude_isManual: false,
    bajajLatitude_isNA: false,
    bajajLongitude: '',
    bajajLongitude_isManual: false,
    bajajLongitude_isNA: false,
    
    bajajAddressAsPerInitiation: '',
    bajajAddressAsPerInitiation_isNA: false,
    
    // Section 3: Legal Address & Property Details
    bajajLegalAddressOfProperty: '',
    bajajLegalAddressOfProperty_isNA: false,
    bajajLegalAddressOfProperty_isManual: false,
    
    bajajFloorNoOfProperty: '',
    bajajFloorNoOfProperty_isNA: false,
    
    bajajPropertyState: '',
    bajajPropertyStateCustom: '',
    bajajPropertyState_isNA: false,
    
    bajajPropertyCity: '',
    bajajPropertyCity_isNA: false,
    
    bajajPropertyPinCode: '',
    bajajPropertyPinCode_isNA: false,
    
    bajajAddressMatching: '',
    bajajAddressMatchingCustom: '',
    bajajAddressMatching_isNA: false,
    
    bajajJurisdictionMunicipalBody: '',
    bajajJurisdictionMunicipalBody_isNA: false,
    
    bajajPropertyHoldingType: '',
    bajajPropertyHoldingTypeCustom: '',
    bajajPropertyHoldingType_isNA: false,
    
    bajajMarketability: '',
    bajajMarketabilityCustom: '',
    bajajMarketability_isNA: false,
    
    bajajPropertyOccupiedBy: '',
    bajajPropertyOccupiedByCustom: '',
    bajajPropertyOccupiedBy_isNA: false,
    
    bajajTypeOfProperty: '',
    bajajTypeOfPropertyCustom: '',
    bajajTypeOfProperty_isNA: false,
    
    bajajOccupancy: '',
    bajajOccupancyCustom: '',
    bajajOccupancy_isNA: false,
    bajajOccupancy_isManual: false,
    
    bajajSOBP: '',
    bajajScheduleOfProperty: '',

    // Section 4: Boundaries
    bajajBoundaryNorthDeed: '',
    bajajBoundaryEastDeed: '',
    bajajBoundarySouthDeed: '',
    bajajBoundaryWestDeed: '',
    bajajBoundaryNorthActual: '',
    bajajBoundaryEastActual: '',
    bajajBoundarySouthActual: '',
    bajajBoundaryWestActual: '',
    bajajBoundaryMatching: '',
    bajajPropertyIdentifiable: '',
    bajajApproachRoadSize: '',

    // Section 5: Approval Details
    bajajSanctionedPlanProvided: '',
    bajajLayoutPlanNo: '',
    bajajConstructionPlanNo: '',
    bajajDateOfSanction: '',
    bajajPlanValidity: '',
    bajajApprovingAuthority: '',
    bajajApprovedCategory: '',
    bajajNumberOfFloorsBuilding: '',

    // Section 6: Technical Details - NDMA
    bajajNatureOfBuilding: '',
    bajajPlanAspectRatio: '',
    bajajStructureType: '',
    bajajProjectedParts: '',
    bajajTypeOfMasonry: '',
    bajajRoofType: '',
    bajajSteelGrade: '',
    bajajConcreteGrade: '',
    bajajEnvironmentExposure: '',
    bajajSeismicZone: '',
    bajajSoilLiquefable: '',
    bajajVulnerableToLandslide: '',
    bajajFloodProneArea: '',
    // Technical Details
    bajajConstructionQuality: '',
    bajajLiftAvailable: '',
    bajajNoOfLifts: '',
    bajajSeparateAccess: '',
    bajajCurrentOccupant: '',
    bajajNoOfStoreys: '',
    bajajAccommodationDetails: '',

    // Section 7: Area & Floor Details
    bajajPlotNSDoc: '',
    bajajPlotNSPlan: '',
    bajajPlotNSSite: '',
    bajajPlotEWDoc: '',
    bajajPlotEWPlan: '',
    bajajPlotEWSite: '',
    bajajLandAreaDoc: '',
    bajajLandAreaPlan: '',
    bajajLandAreaSite: '',
    // Floor-wise
    bajajFloorGroundRooms: '',
    bajajFloorGroundKitchen: '',
    bajajFloorGroundBathrooms: '',
    bajajFloorGroundSanctionedUsage: '',
    bajajFloorGroundActualUsage: '',
    bajajFloor1stFloorRooms: '',
    bajajFloor1stFloorKitchen: '',
    bajajFloor1stFloorBathrooms: '',
    bajajFloor1stFloorSanctionedUsage: '',
    bajajFloor1stFloorActualUsage: '',
    bajajFloor2ndFloorRooms: '',
    bajajFloor2ndFloorKitchen: '',
    bajajFloor2ndFloorBathrooms: '',
    bajajFloor2ndFloorSanctionedUsage: '',
    bajajFloor2ndFloorActualUsage: '',
    bajajFloor3rdFloorRooms: '',
    bajajFloor3rdFloorKitchen: '',
    bajajFloor3rdFloorBathrooms: '',
    bajajFloor3rdFloorSanctionedUsage: '',
    bajajFloor3rdFloorActualUsage: '',
    // Rooms
    bajajPermissiblePlan: '',
    bajajLandComponent: '',
    bajajPermissibleRsd: '',
    bajajPermissibleRBI: '',
    bajajCarpetAreaDoc: '',
    bajajActualConstruction: '',
    // Risk/Status/Age
    bajajRiskOfDeviations: '',
    bajajStatusOfProperty: '',
    bajajPercentCompleted: '',
    bajajDisbursementRecommended: '',
    bajajCurrentAge: '',
    bajajResidualAge: '',

    // Section 8: Valuation
    bajajLandAreaSqft: '',
    bajajLandRatePerSqft: '',
    bajajLandTotalValue: '',
    bajajBUAAreaSqft: '',
    bajajBUARatePerSqft: '',
    bajajBUATotalValue: '',
    bajajCarParkingArea: '',
    bajajCarParkingRate: '',
    bajajCarParkingValue: '',
    bajajAmenitiesOtherCharges: '',
    bajajRealizableValue: '',
    bajajGovernmentRates: '',
    bajajDistressedForcedValue: '',
    bajajValuationFloorRate: '',
    bajajValuationMethodology: '',
    bajajMunicipalDemolitionList: '',
    bajajPropertyInNegativeArea: '',
    bajajWorkCompleted: '',
    bajajDisbursementRecommendedVal: '',
    bajajCurrentValueOfProperty: '',
    bajajDateOfPropertyVisit: '',
    bajajValuationGovtReckoner: '',
    bajajDistressedValuation: '',
    bajajRentalValuePerMonth: '',

    // Section 9: Remarks & Declaration
    bajajRemarks: '',
    bajajSignatureDate: '',
    bajajSignaturePlace: 'Bhubaneswar',
  },
  extraSectionsStart: [
    {
      id: 'bajaj-section-1',
      title: 'Application Details',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-6">
          <div className="border border-[#B9DBFE] bg-[#F0F7FF] rounded-xl p-4">
            <h3 className="font-bold text-gray-700 mb-4">Application Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="File No./LAN No./System No.">
                <input className={inputCls} value={fields.bajajFileNo || ''} onChange={e => handleChange('bajajFileNo', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Report">
                <input type="date" className={inputCls} value={fields.bajajDateOfReport || ''} onChange={e => handleChange('bajajDateOfReport', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Name of Applicant">
                <input className={inputCls} value={fields.bajajNameOfApplicant || ''} onChange={e => handleChange('bajajNameOfApplicant', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Contact Person Name & No.">
                <input className={inputCls} value={fields.bajajContactPersonNameNo || ''} onChange={e => handleChange('bajajContactPersonNameNo', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Loan Type (HL/LAP/BT)">
                <input className={inputCls} value={fields.bajajLoanType || ''} onChange={e => handleChange('bajajLoanType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Person Met at Site">
                <input className={inputCls} value={fields.bajajPersonMetAtSite || ''} onChange={e => handleChange('bajajPersonMetAtSite', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Name of Property Owner as per Legal Document">
                <input className={inputCls} value={fields.bajajPropertyOwnerName || ''} onChange={e => handleChange('bajajPropertyOwnerName', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Documents Provided">
                <textarea className={inputCls} rows={2} value={fields.bajajDocumentsProvided || ''} onChange={e => handleChange('bajajDocumentsProvided', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'bajaj-section-2',
      title: 'Location Details',
      number: 2,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        // Helpers
        const NACheckbox = ({ field, label = 'Mark as NA' }: { field: string, label?: string }) => (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 mt-1 hover:text-gray-700">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              checked={!!fields[`${field}_isNA`]}
              onChange={(e) => {
                handleChange(`${field}_isNA`, e.target.checked);
                if (e.target.checked) handleChange(field, 'NA');
                else handleChange(field, '');
              }}
              disabled={isReadOnly}
            />
            <span>{label}</span>
          </label>
        );

        const EditSwitch = ({ field, onToggleOff }: { field: string, onToggleOff?: () => void }) => (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                const manual = !fields[`${field}_isManual`];
                handleChange(`${field}_isManual`, manual);
                if (!manual && onToggleOff) {
                  onToggleOff();
                }
              }}
              disabled={isReadOnly}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields[`${field}_isManual`] ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields[`${field}_isManual`] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${fields[`${field}_isManual`] ? 'text-emerald-600' : 'text-gray-400'}`}>
              {fields[`${field}_isManual`] ? 'Edit On' : 'Edit Off'}
            </span>
          </div>
        );

        const handleSiteAddressChange = (val: string) => {
          handleChange('bajajAddressAsPerSite', val);
        };

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#A7F3D0] bg-[#ECFDF5] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Location Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Field label="Address of Property (Address as per Site)">
                    <textarea 
                      className={inputCls} 
                      rows={3} 
                      value={fields.bajajAddressAsPerSite || ''} 
                      onChange={e => handleSiteAddressChange(e.target.value)} 
                      disabled={isReadOnly || fields.bajajAddressAsPerSite_isNA} 
                    />
                  </Field>
                  <NACheckbox field="bajajAddressAsPerSite" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Locality Name">
                      <input 
                        type="text"
                        className={inputCls} 
                        value={fields.bajajLocalityName || ''} 
                        onChange={e => handleChange('bajajLocalityName', e.target.value)} 
                        disabled={isReadOnly || fields.bajajLocalityName_isNA} 
                      />
                    </Field>
                    <NACheckbox field="bajajLocalityName" />
                  </div>
                  <div>
                    <Field label="Landmark Near By">
                      <input 
                        type="text"
                        className={inputCls} 
                        value={fields.bajajLandmarkNearBy || ''} 
                        onChange={e => handleChange('bajajLandmarkNearBy', e.target.value)} 
                        disabled={isReadOnly || fields.bajajLandmarkNearBy_isNA} 
                      />
                    </Field>
                    <NACheckbox field="bajajLandmarkNearBy" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Distance from City Centre">
                      <div className="relative flex items-center">
                        <input 
                          type="number"
                          step="0.1"
                          min="0"
                          className={`${inputCls} pr-12`} 
                          value={fields.bajajDistanceFromCityCentre || ''} 
                          onChange={e => handleChange('bajajDistanceFromCityCentre', e.target.value)} 
                          disabled={isReadOnly || fields.bajajDistanceFromCityCentre_isNA} 
                        />
                        <span className="absolute right-3 text-gray-500 text-sm font-medium">Kms</span>
                      </div>
                    </Field>
                    <NACheckbox field="bajajDistanceFromCityCentre" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-xs font-medium text-gray-700">LATITUDE</label>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((position) => {
                                handleChange('bajajLatitude', position.coords.latitude.toFixed(6));
                              });
                            }
                          }}
                          disabled={isReadOnly || fields.bajajLatitude_isNA}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Fetch Current GPS
                        </button>
                        <EditSwitch field="bajajLatitude" />
                      </div>
                    </div>
                    <input 
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      className={inputCls} 
                      value={fields.bajajLatitude || ''} 
                      onChange={e => handleChange('bajajLatitude', e.target.value)} 
                      disabled={isReadOnly || !fields.bajajLatitude_isManual || fields.bajajLatitude_isNA} 
                    />
                    <NACheckbox field="bajajLatitude" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-xs font-medium text-gray-700">LONGITUDE</label>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((position) => {
                                handleChange('bajajLongitude', position.coords.longitude.toFixed(6));
                              });
                            }
                          }}
                          disabled={isReadOnly || fields.bajajLongitude_isNA}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Fetch Current GPS
                        </button>
                        <EditSwitch field="bajajLongitude" />
                      </div>
                    </div>
                    <input 
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      className={inputCls} 
                      value={fields.bajajLongitude || ''} 
                      onChange={e => handleChange('bajajLongitude', e.target.value)} 
                      disabled={isReadOnly || !fields.bajajLongitude_isManual || fields.bajajLongitude_isNA} 
                    />
                    <NACheckbox field="bajajLongitude" />
                  </div>
                </div>

                <div>
                  <Field label="Address as per Initiation">
                    <textarea 
                      className={inputCls} 
                      rows={3} 
                      value={fields.bajajAddressAsPerInitiation || ''} 
                      onChange={e => handleChange('bajajAddressAsPerInitiation', e.target.value)} 
                      disabled={isReadOnly || fields.bajajAddressAsPerInitiation_isNA} 
                    />
                  </Field>
                  <NACheckbox field="bajajAddressAsPerInitiation" />
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-3',
      title: 'Legal Address & Property Details',
      number: 3,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => {
        const NACheckbox = ({ field, label = 'Mark as NA' }: { field: string, label?: string }) => (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 mt-1 hover:text-gray-700">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
              checked={!!fields[`${field}_isNA`]}
              onChange={(e) => {
                handleChange(`${field}_isNA`, e.target.checked);
                if (e.target.checked) handleChange(field, 'NA');
                else handleChange(field, '');
              }}
              disabled={isReadOnly}
            />
            <span>{label}</span>
          </label>
        );

        const EditSwitch = ({ field, onToggleOff }: { field: string, onToggleOff?: () => void }) => (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                const manual = !fields[`${field}_isManual`];
                handleChange(`${field}_isManual`, manual);
                if (!manual && onToggleOff) {
                  onToggleOff();
                }
              }}
              disabled={isReadOnly}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields[`${field}_isManual`] ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields[`${field}_isManual`] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${fields[`${field}_isManual`] ? 'text-emerald-600' : 'text-gray-400'}`}>
              {fields[`${field}_isManual`] ? 'Edit On' : 'Edit Off'}
            </span>
          </div>
        );

        const handleOccupiedByChange = (val: string) => {
          handleChange('bajajPropertyOccupiedBy', val);
          if (!fields.bajajOccupancy_isManual && !fields.bajajOccupancy_isNA) {
            if (val === 'Self') handleChange('bajajOccupancy', 'SORP (Self-Occupied Residential Property)');
            else if (val === 'Tenant') handleChange('bajajOccupancy', 'Rented');
            else if (val === 'Vacant') handleChange('bajajOccupancy', 'Vacant');
            else handleChange('bajajOccupancy', '');
          }
        };

        const renderSelectWithCustom = (field: string, options: string[], label: string) => (
          <div>
            <Field label={label}>
              <select 
                className={inputCls} 
                value={fields[field] === 'NA' ? 'NA' : (options.includes(fields[field] || '') ? fields[field] : (fields[field] ? 'Custom' : ''))} 
                onChange={e => {
                  if (e.target.value === 'Custom') {
                    handleChange(field, fields[`${field}Custom`] || '');
                  } else {
                    handleChange(field, e.target.value);
                  }
                }} 
                disabled={isReadOnly || fields[`${field}_isNA`]}
              >
                <option value="">Select</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                <option value="Custom">Custom</option>
              </select>
            </Field>
            {!options.includes(fields[field] || '') && fields[field] && fields[field] !== 'NA' && (
              <div className="mt-2">
                <input 
                  type="text" 
                  className={inputCls} 
                  placeholder="Enter custom value"
                  value={fields[`${field}Custom`] || ''} 
                  onChange={e => {
                    handleChange(`${field}Custom`, e.target.value);
                    handleChange(field, e.target.value);
                  }}
                  disabled={isReadOnly || fields[`${field}_isNA`]}
                />
              </div>
            )}
            <NACheckbox field={field} />
          </div>
        );

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#A5F3FC] bg-[#ECFEFF] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Legal Address of the Property: (As per Title Deed or Sanctioned Plan)</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Address of Property</label>
                    <EditSwitch 
                      field="bajajLegalAddressOfProperty" 
                      onToggleOff={() => handleChange('bajajLegalAddressOfProperty', fields.bajajAddressAsPerInitiation || '')} 
                    />
                  </div>
                  <textarea 
                    className={inputCls} 
                    rows={3} 
                    value={fields.bajajLegalAddressOfProperty || ''} 
                    onChange={e => handleChange('bajajLegalAddressOfProperty', e.target.value)} 
                    disabled={isReadOnly || !fields.bajajLegalAddressOfProperty_isManual || fields.bajajLegalAddressOfProperty_isNA} 
                  />
                  <NACheckbox field="bajajLegalAddressOfProperty" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Field label="Floor No. of Property">
                      <input 
                        type="text"
                        className={inputCls} 
                        value={fields.bajajFloorNoOfProperty || ''} 
                        onChange={e => handleChange('bajajFloorNoOfProperty', e.target.value)} 
                        disabled={isReadOnly || fields.bajajFloorNoOfProperty_isNA} 
                      />
                    </Field>
                    <NACheckbox field="bajajFloorNoOfProperty" />
                  </div>
                  {renderSelectWithCustom('bajajPropertyState', ['Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Karnataka', 'Maharashtra', 'Odisha', 'Punjab', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal', 'Other States / UTs'], 'Property State')}
                  
                  <div>
                    <Field label="Property City">
                      <input 
                        type="text"
                        className={inputCls} 
                        value={fields.bajajPropertyCity || ''} 
                        onChange={e => handleChange('bajajPropertyCity', e.target.value)} 
                        disabled={isReadOnly || fields.bajajPropertyCity_isNA} 
                      />
                    </Field>
                    <NACheckbox field="bajajPropertyCity" />
                  </div>
                  <div>
                    <Field label="Property Pin code">
                      <input 
                        type="number"
                        className={inputCls} 
                        value={fields.bajajPropertyPinCode || ''} 
                        onChange={e => handleChange('bajajPropertyPinCode', e.target.value)} 
                        disabled={isReadOnly || fields.bajajPropertyPinCode_isNA} 
                      />
                    </Field>
                    <NACheckbox field="bajajPropertyPinCode" />
                  </div>
                  
                  {renderSelectWithCustom('bajajAddressMatching', ['Yes', 'No'], 'Address Matching (Yes/No)')}
                  
                  <div>
                    <Field label="Jurisdiction/Local Municipal Body">
                      <input 
                        type="text"
                        className={inputCls} 
                        value={fields.bajajJurisdictionMunicipalBody || ''} 
                        onChange={e => handleChange('bajajJurisdictionMunicipalBody', e.target.value)} 
                        disabled={isReadOnly || fields.bajajJurisdictionMunicipalBody_isNA} 
                      />
                    </Field>
                    <NACheckbox field="bajajJurisdictionMunicipalBody" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#FDE68A] bg-[#FFFBEB] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Property Character & Occupancy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSelectWithCustom('bajajPropertyHoldingType', ['Freehold', 'Lease hold'], 'Property Holding Type (Freehold/Lease hold)')}
                {renderSelectWithCustom('bajajMarketability', ['Good', 'Fair', 'Poor'], 'Marketability (Poor/Fair/Good)')}
                
                <div>
                  <Field label="Property Occupied by (Self/Tenant/Vacant/Under Construction)">
                    <select 
                      className={inputCls} 
                      value={fields.bajajPropertyOccupiedBy === 'NA' ? 'NA' : (['Self', 'Tenant', 'Vacant', 'Under Construction'].includes(fields.bajajPropertyOccupiedBy || '') ? fields.bajajPropertyOccupiedBy : (fields.bajajPropertyOccupiedBy ? 'Custom' : ''))} 
                      onChange={e => {
                        if (e.target.value === 'Custom') {
                          handleOccupiedByChange(fields.bajajPropertyOccupiedByCustom || '');
                        } else {
                          handleOccupiedByChange(e.target.value);
                        }
                      }} 
                      disabled={isReadOnly || fields.bajajPropertyOccupiedBy_isNA}
                    >
                      <option value="">Select</option>
                      <option value="Self">Self</option>
                      <option value="Tenant">Tenant</option>
                      <option value="Vacant">Vacant</option>
                      <option value="Under Construction">Under Construction</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {!['Self', 'Tenant', 'Vacant', 'Under Construction'].includes(fields.bajajPropertyOccupiedBy || '') && fields.bajajPropertyOccupiedBy && fields.bajajPropertyOccupiedBy !== 'NA' && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        className={inputCls} 
                        placeholder="Enter custom value"
                        value={fields.bajajPropertyOccupiedByCustom || ''} 
                        onChange={e => {
                          handleChange('bajajPropertyOccupiedByCustom', e.target.value);
                          handleOccupiedByChange(e.target.value);
                        }}
                        disabled={isReadOnly || fields.bajajPropertyOccupiedBy_isNA}
                      />
                    </div>
                  )}
                  <NACheckbox field="bajajPropertyOccupiedBy" />
                </div>
                
                {renderSelectWithCustom('bajajTypeOfProperty', ['Flat', 'Bungalow', 'Commercial Building', 'Commercial Unit', 'Industrial', 'Plot'], 'Type of the Property')}
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Occupancy Status SORP/SOCP/Rented/Vacant (Please mentioned only one)</label>
                    <EditSwitch 
                      field="bajajOccupancy" 
                      onToggleOff={() => handleOccupiedByChange(fields.bajajPropertyOccupiedBy || '')} 
                    />
                  </div>
                  <select 
                    className={inputCls} 
                    value={fields.bajajOccupancy === 'NA' ? 'NA' : (['SORP (Self-Occupied Residential Property)', 'SOCP (Self-Occupied Commercial Property)', 'Rented', 'Vacant'].includes(fields.bajajOccupancy || '') ? fields.bajajOccupancy : (fields.bajajOccupancy ? 'Custom' : ''))} 
                    onChange={e => {
                      if (e.target.value === 'Custom') {
                        handleChange('bajajOccupancy', fields.bajajOccupancyCustom || '');
                      } else {
                        handleChange('bajajOccupancy', e.target.value);
                      }
                    }} 
                    disabled={isReadOnly || !fields.bajajOccupancy_isManual || fields.bajajOccupancy_isNA}
                  >
                    <option value="">Select</option>
                    <option value="SORP (Self-Occupied Residential Property)">SORP (Self-Occupied Residential Property)</option>
                    <option value="SOCP (Self-Occupied Commercial Property)">SOCP (Self-Occupied Commercial Property)</option>
                    <option value="Rented">Rented</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {!['SORP (Self-Occupied Residential Property)', 'SOCP (Self-Occupied Commercial Property)', 'Rented', 'Vacant'].includes(fields.bajajOccupancy || '') && fields.bajajOccupancy && fields.bajajOccupancy !== 'NA' && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        className={inputCls} 
                        placeholder="Enter custom value"
                        value={fields.bajajOccupancyCustom || ''} 
                        onChange={e => {
                          handleChange('bajajOccupancyCustom', e.target.value);
                          handleChange('bajajOccupancy', e.target.value);
                        }}
                        disabled={isReadOnly || !fields.bajajOccupancy_isManual || fields.bajajOccupancy_isNA}
                      />
                    </div>
                  )}
                  <NACheckbox field="bajajOccupancy" />
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-4',
      title: 'Boundaries & Schedule',
      number: 4,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-4">
          <p className="text-xs text-gray-500 italic">Section details will be configured with detailed prompts.</p>
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Boundaries - As per Sale Deed</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['North', 'East', 'South', 'West'] as const).map(dir => (
                <Field key={dir} label={dir}>
                  <input className={inputCls} value={fields[`bajajBoundary${dir}Deed`] || ''} onChange={e => handleChange(`bajajBoundary${dir}Deed`, e.target.value)} disabled={isReadOnly} />
                </Field>
              ))}
            </div>
          </div>
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Boundaries - As per Actual</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['North', 'East', 'South', 'West'] as const).map(dir => (
                <Field key={dir} label={dir}>
                  <input className={inputCls} value={fields[`bajajBoundary${dir}Actual`] || ''} onChange={e => handleChange(`bajajBoundary${dir}Actual`, e.target.value)} disabled={isReadOnly} />
                </Field>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Boundary Matching (Yes/No)">
              <select className={inputCls} value={fields.bajajBoundaryMatching || ''} onChange={e => handleChange('bajajBoundaryMatching', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Property Identifiable">
              <select className={inputCls} value={fields.bajajPropertyIdentifiable || ''} onChange={e => handleChange('bajajPropertyIdentifiable', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
          </div>
          <Field label="Approach Road Size">
            <input className={inputCls} value={fields.bajajApproachRoadSize || ''} onChange={e => handleChange('bajajApproachRoadSize', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      ),
    },
    {
      id: 'bajaj-section-5',
      title: 'Approval Details',
      number: 5,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-4">
          <p className="text-xs text-gray-500 italic">Section details will be configured with detailed prompts.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Sanctioned Plan Provided (Yes/No)">
              <select className={inputCls} value={fields.bajajSanctionedPlanProvided || ''} onChange={e => handleChange('bajajSanctionedPlanProvided', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Layout Plan No">
              <input className={inputCls} value={fields.bajajLayoutPlanNo || ''} onChange={e => handleChange('bajajLayoutPlanNo', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="Construction Plan Details: Sanctioned No/Permit No.">
            <input className={inputCls} value={fields.bajajConstructionPlanNo || ''} onChange={e => handleChange('bajajConstructionPlanNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date of Sanction">
              <input type="date" className={inputCls} value={fields.bajajDateOfSanction || ''} onChange={e => handleChange('bajajDateOfSanction', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Plan Validity">
              <input className={inputCls} value={fields.bajajPlanValidity || ''} onChange={e => handleChange('bajajPlanValidity', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="Approving Authority">
            <input className={inputCls} value={fields.bajajApprovingAuthority || ''} onChange={e => handleChange('bajajApprovingAuthority', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Approved Category">
            <select className={inputCls} value={fields.bajajApprovedCategory || ''} onChange={e => handleChange('bajajApprovedCategory', e.target.value)} disabled={isReadOnly}>
              <option value="">Select</option>
              <option value="Residential">Residential</option>
              <option value="Industrial">Industrial</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed">Mixed</option>
            </select>
          </Field>
          <Field label="Number of Floors in Building">
            <input className={inputCls} value={fields.bajajNumberOfFloorsBuilding || ''} onChange={e => handleChange('bajajNumberOfFloorsBuilding', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      ),
    },
    {
      id: 'bajaj-section-6',
      title: 'Technical Details',
      number: 6,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-4">
          <p className="text-xs text-gray-500 italic">Section details will be configured with detailed prompts.</p>
          {/* NDMA Parameters */}
          <div className="border border-blue-200 bg-blue-50/30 rounded-md p-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">NDMA Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nature of Building/Wing">
                <input className={inputCls} value={fields.bajajNatureOfBuilding || ''} onChange={e => handleChange('bajajNatureOfBuilding', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Plan Aspect Ratio">
                <input className={inputCls} value={fields.bajajPlanAspectRatio || ''} onChange={e => handleChange('bajajPlanAspectRatio', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Structure Type">
                <input className={inputCls} value={fields.bajajStructureType || ''} onChange={e => handleChange('bajajStructureType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Projected Parts">
                <input className={inputCls} value={fields.bajajProjectedParts || ''} onChange={e => handleChange('bajajProjectedParts', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Type of Masonry">
                <input className={inputCls} value={fields.bajajTypeOfMasonry || ''} onChange={e => handleChange('bajajTypeOfMasonry', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Roof Type">
                <input className={inputCls} value={fields.bajajRoofType || ''} onChange={e => handleChange('bajajRoofType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Steel Grade">
                <input className={inputCls} value={fields.bajajSteelGrade || ''} onChange={e => handleChange('bajajSteelGrade', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Concrete Grade">
                <input className={inputCls} value={fields.bajajConcreteGrade || ''} onChange={e => handleChange('bajajConcreteGrade', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Environment Exposure Condition">
                <input className={inputCls} value={fields.bajajEnvironmentExposure || ''} onChange={e => handleChange('bajajEnvironmentExposure', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Seismic Zone">
                <input className={inputCls} value={fields.bajajSeismicZone || ''} onChange={e => handleChange('bajajSeismicZone', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Soil Liquefable">
                <select className={inputCls} value={fields.bajajSoilLiquefable || ''} onChange={e => handleChange('bajajSoilLiquefable', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Vulnerable to Landslide">
                <select className={inputCls} value={fields.bajajVulnerableToLandslide || ''} onChange={e => handleChange('bajajVulnerableToLandslide', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Flood Prone Area">
                <select className={inputCls} value={fields.bajajFloodProneArea || ''} onChange={e => handleChange('bajajFloodProneArea', e.target.value)} disabled={isReadOnly}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>
          </div>
          {/* Technical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Construction Quality">
              <select className={inputCls} value={fields.bajajConstructionQuality || ''} onChange={e => handleChange('bajajConstructionQuality', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
                <option value="Luxury">Luxury</option>
              </select>
            </Field>
            <Field label="Lift Available">
              <select className={inputCls} value={fields.bajajLiftAvailable || ''} onChange={e => handleChange('bajajLiftAvailable', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="No. of Lifts">
              <input className={inputCls} value={fields.bajajNoOfLifts || ''} onChange={e => handleChange('bajajNoOfLifts', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Separate Independent Access">
              <select className={inputCls} value={fields.bajajSeparateAccess || ''} onChange={e => handleChange('bajajSeparateAccess', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Current Occupant of Property">
              <select className={inputCls} value={fields.bajajCurrentOccupant || ''} onChange={e => handleChange('bajajCurrentOccupant', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Owner">Owner</option>
                <option value="Tenant">Tenant</option>
                <option value="Vacant">Vacant</option>
              </select>
            </Field>
            <Field label="No. of Storeys">
              <input className={inputCls} value={fields.bajajNoOfStoreys || ''} onChange={e => handleChange('bajajNoOfStoreys', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="Accommodation details / Floor wise and Occupancy">
            <textarea className={inputCls} rows={3} value={fields.bajajAccommodationDetails || ''} onChange={e => handleChange('bajajAccommodationDetails', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      ),
    },
    {
      id: 'bajaj-section-7',
      title: 'Area & Floor Details',
      number: 7,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-4">
          <p className="text-xs text-gray-500 italic">Section details will be configured with detailed prompts.</p>
          {/* Plot Area Details */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Plot Area Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Doc', 'Plan', 'Site'].map(src => (
                <div key={src}>
                  <h5 className="text-xs font-medium text-gray-500 mb-2">As Per {src === 'Doc' ? 'Documents' : src === 'Plan' ? 'Plan' : 'Site Visit'}</h5>
                  <Field label="North to South">
                    <input className={inputCls} value={fields[`bajajPlotNS${src}`] || ''} onChange={e => handleChange(`bajajPlotNS${src}`, e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="East to West">
                    <input className={inputCls} value={fields[`bajajPlotEW${src}`] || ''} onChange={e => handleChange(`bajajPlotEW${src}`, e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Land Area (sq.ft.)">
                    <input className={inputCls} value={fields[`bajajLandArea${src}`] || ''} onChange={e => handleChange(`bajajLandArea${src}`, e.target.value)} disabled={isReadOnly} />
                  </Field>
                </div>
              ))}
            </div>
          </div>
          {/* Risk/Status/Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Risk of Deviations">
              <select className={inputCls} value={fields.bajajRiskOfDeviations || ''} onChange={e => handleChange('bajajRiskOfDeviations', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </Field>
            <Field label="Status of the Property">
              <input className={inputCls} value={fields.bajajStatusOfProperty || ''} onChange={e => handleChange('bajajStatusOfProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="% Completed">
              <input className={inputCls} value={fields.bajajPercentCompleted || ''} onChange={e => handleChange('bajajPercentCompleted', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="% Disbursement Recommended">
              <input className={inputCls} value={fields.bajajDisbursementRecommended || ''} onChange={e => handleChange('bajajDisbursementRecommended', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Current Age of Property (Years)">
              <input className={inputCls} value={fields.bajajCurrentAge || ''} onChange={e => handleChange('bajajCurrentAge', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Residual Age">
              <input className={inputCls} value={fields.bajajResidualAge || ''} onChange={e => handleChange('bajajResidualAge', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </div>
      ),
    },
    {
      id: 'bajaj-section-8',
      title: 'Valuation Summary',
      number: 8,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-4">
          <p className="text-xs text-gray-500 italic">Section details will be configured with detailed prompts.</p>
          {/* Valuation Table */}
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Valuation Items</h4>
            {[
              { label: 'Land Value (as per RORL)', areaKey: 'bajajLandAreaSqft', rateKey: 'bajajLandRatePerSqft', totalKey: 'bajajLandTotalValue' },
              { label: 'BUA Value (Measured BUA)', areaKey: 'bajajBUAAreaSqft', rateKey: 'bajajBUARatePerSqft', totalKey: 'bajajBUATotalValue' },
              { label: 'Car Parking Charges', areaKey: 'bajajCarParkingArea', rateKey: 'bajajCarParkingRate', totalKey: 'bajajCarParkingValue' },
            ].map(item => (
              <div key={item.label} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 items-end">
                <span className="text-sm font-medium text-gray-700 self-center">{item.label}</span>
                <Field label="Area (Sq.Ft.)">
                  <input className={inputCls} value={fields[item.areaKey] || ''} onChange={e => handleChange(item.areaKey, e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Rate / Sq.Ft.">
                  <input className={inputCls} value={fields[item.rateKey] || ''} onChange={e => handleChange(item.rateKey, e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Total Value (Rs.)">
                  <input className={inputCls} value={fields[item.totalKey] || ''} onChange={e => handleChange(item.totalKey, e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Amenities/Other charges">
              <input className={inputCls} value={fields.bajajAmenitiesOtherCharges || ''} onChange={e => handleChange('bajajAmenitiesOtherCharges', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Realizable value as on date">
              <input className={inputCls} value={fields.bajajRealizableValue || ''} onChange={e => handleChange('bajajRealizableValue', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Government Rates">
              <input className={inputCls} value={fields.bajajGovernmentRates || ''} onChange={e => handleChange('bajajGovernmentRates', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Distressed / Forced Value">
              <input className={inputCls} value={fields.bajajDistressedForcedValue || ''} onChange={e => handleChange('bajajDistressedForcedValue', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Valuation (Floor Rate)">
              <input className={inputCls} value={fields.bajajValuationFloorRate || ''} onChange={e => handleChange('bajajValuationFloorRate', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Valuation Methodology">
              <input className={inputCls} value={fields.bajajValuationMethodology || ''} onChange={e => handleChange('bajajValuationMethodology', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Is Municipal Demolition List (Yes/No)">
              <select className={inputCls} value={fields.bajajMunicipalDemolitionList || ''} onChange={e => handleChange('bajajMunicipalDemolitionList', e.target.value)} disabled={isReadOnly}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Is Property in Negative Area">
              <input className={inputCls} value={fields.bajajPropertyInNegativeArea || ''} onChange={e => handleChange('bajajPropertyInNegativeArea', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="% Work completed">
              <input className={inputCls} value={fields.bajajWorkCompleted || ''} onChange={e => handleChange('bajajWorkCompleted', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="% Disbursement Recommended">
              <input className={inputCls} value={fields.bajajDisbursementRecommendedVal || ''} onChange={e => handleChange('bajajDisbursementRecommendedVal', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Current Value of the Property (Plot + construction)">
              <input className={inputCls} value={fields.bajajCurrentValueOfProperty || ''} onChange={e => handleChange('bajajCurrentValueOfProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Date of Property Visit">
              <input type="date" className={inputCls} value={fields.bajajDateOfPropertyVisit || ''} onChange={e => handleChange('bajajDateOfPropertyVisit', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Valuation as per Government reckoner rates">
              <input className={inputCls} value={fields.bajajValuationGovtReckoner || ''} onChange={e => handleChange('bajajValuationGovtReckoner', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Distressed valuation of the Property">
              <input className={inputCls} value={fields.bajajDistressedValuation || ''} onChange={e => handleChange('bajajDistressedValuation', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Rental value per month">
              <input className={inputCls} value={fields.bajajRentalValuePerMonth || ''} onChange={e => handleChange('bajajRentalValuePerMonth', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </div>
      ),
    },
    {
      id: 'bajaj-section-9',
      title: 'Remarks & Declaration',
      number: 9,
      defaultOpen: false,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-4">
          <p className="text-xs text-gray-500 italic">Section details will be configured with detailed prompts.</p>
          <Field label="Remarks">
            <textarea className={inputCls} rows={5} value={fields.bajajRemarks || ''} onChange={e => handleChange('bajajRemarks', e.target.value)} disabled={isReadOnly} placeholder="Comment on - resistance for valuation, rented property, community dominated areas, approach road, etc." />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Signature Date">
              <input type="date" className={inputCls} value={fields.bajajSignatureDate || ''} onChange={e => handleChange('bajajSignatureDate', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Place">
              <input className={inputCls} value={fields.bajajSignaturePlace || 'Bhubaneswar'} onChange={e => handleChange('bajajSignaturePlace', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </div>
      ),
    },
  ],
  getPDFRenderer: (fields) => {
    return new PDFBajajHousingRenderer(fields);
  },
};

export default function BajajHousingHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BAJAJ_HOUSING_HLLAP_CONFIG} {...props} />;
}
