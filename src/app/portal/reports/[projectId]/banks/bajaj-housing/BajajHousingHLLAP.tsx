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

    // Section 4: Schedule of the Property
    bajajBoundaryNorthDeed: '',
    bajajBoundaryNorthDeed_isNA: false,
    bajajBoundaryEastDeed: '',
    bajajBoundaryEastDeed_isNA: false,
    bajajBoundarySouthDeed: '',
    bajajBoundarySouthDeed_isNA: false,
    bajajBoundaryWestDeed: '',
    bajajBoundaryWestDeed_isNA: false,
    
    bajajBoundaryNorthActual: '',
    bajajBoundaryNorthActual_isNA: false,
    
    bajajBoundaryEastActual: '',
    bajajBoundaryEastActual_isNA: false,
    
    bajajBoundarySouthActual: '',
    bajajBoundarySouthActual_isNA: false,
    
    bajajBoundaryWestActual: '',
    bajajBoundaryWestActual_isNA: false,

    bajajBoundaryMatching: '',
    bajajBoundaryMatchingCustom: '',
    bajajBoundaryMatching_isNA: false,
    bajajBoundaryMatching_isManual: false,
    
    bajajPropertyIdentifiable: '',
    bajajPropertyIdentifiableCustom: '',
    bajajPropertyIdentifiable_isNA: false,
    
    bajajApproachRoadSize: '',
    bajajApproachRoadSizeCustom: '',
    bajajApproachRoadSize_isNA: false,

    // Section 5: NDMA Parameters
    bajajNatureOfBuilding: '',
    bajajNatureOfBuildingCustom: '',
    bajajNatureOfBuilding_isNA: false,
    
    bajajPlanAspectRatio: '',
    bajajPlanAspectRatioCustom: '',
    bajajPlanAspectRatio_isNA: false,
    
    bajajStructureType: '',
    bajajStructureTypeCustom: '',
    bajajStructureType_isNA: false,
    
    bajajProjectedParts: '',
    bajajProjectedPartsCustom: '',
    bajajProjectedParts_isNA: false,
    
    bajajTypeOfMasonry: '',
    bajajTypeOfMasonryCustom: '',
    bajajTypeOfMasonry_isNA: false,

    bajajExpansionJointsAvailable: '',
    bajajExpansionJointsAvailableCustom: '',
    bajajExpansionJointsAvailable_isNA: false,
    
    bajajRoofType: '',
    bajajRoofTypeCustom: '',
    bajajRoofType_isNA: false,
    
    bajajSteelGrade: '',
    bajajSteelGradeCustom: '',
    bajajSteelGrade_isNA: false,

    bajajMortarType: '',
    bajajMortarTypeCustom: '',
    bajajMortarType_isNA: false,
    
    bajajConcreteGrade: '',
    bajajConcreteGradeCustom: '',
    bajajConcreteGrade_isNA: false,
    
    bajajEnvironmentExposureCondition: '',
    bajajEnvironmentExposureConditionCustom: '',
    bajajEnvironmentExposureCondition_isNA: false,

    bajajFootingType: '',
    bajajFootingTypeCustom: '',
    bajajFootingType_isNA: false,
    
    bajajSeismicZone: '',
    bajajSeismicZoneCustom: '',
    bajajSeismicZone_isNA: false,
    
    bajajSoilLiquefiable: '',
    bajajSoilLiquefiableCustom: '',
    bajajSoilLiquefiable_isNA: false,

    bajajCoastalRegulatoryZone: '',
    bajajCoastalRegulatoryZoneCustom: '',
    bajajCoastalRegulatoryZone_isNA: false,
    
    bajajSoilSlopeVulnerableToLandslide: '',
    bajajSoilSlopeVulnerableToLandslideCustom: '',
    bajajSoilSlopeVulnerableToLandslide_isNA: false,
    
    bajajFloodProneArea: '',
    bajajFloodProneAreaCustom: '',
    bajajFloodProneArea_isNA: false,
    
    bajajGroundSlopeMoreThan20: '',
    bajajGroundSlopeMoreThan20Custom: '',
    bajajGroundSlopeMoreThan20_isNA: false,

    bajajFireExit: '',
    bajajFireExitCustom: '',
    bajajFireExit_isNA: false,

    // Section 6: Approved Plan Details
    bajajSanctionedPlanProvided: '',
    bajajSanctionedPlanProvidedCustom: '',
    bajajSanctionedPlanProvided_isNA: false,
    
    bajajLayoutPlanNo: '',
    bajajLayoutPlanNo_isNA: false,
    
    bajajConstructionPlanNo: '',
    bajajConstructionPlanNo_isNA: false,
    
    bajajDateOfSanction: '',
    bajajDateOfSanction_isNA: false,
    
    bajajPlanValidity: '',
    bajajPlanValidity_isNA: false,
    
    bajajApprovingAuthority: '',
    bajajApprovingAuthorityCustom: '',
    bajajApprovingAuthority_isNA: false,
    bajajApprovingAuthority_isManual: false,
    
    bajajApprovedCategory: '',
    bajajApprovedCategoryCustom: '',
    bajajApprovedCategory_isNA: false,
    bajajApprovedCategory_isManual: false,
    
    bajajNumberOfFloorsBuilding: '',
    bajajNumberOfFloorsBuilding_isNA: false,
    bajajNumberOfFloorsBuilding_isManual: false,

    // Section 7: Technical Details
    bajajConstructionQuality: '',
    bajajConstructionQualityCustom: '',
    bajajConstructionQuality_isNA: false,
    
    bajajLiftAvailable: '',
    bajajLiftAvailableCustom: '',
    bajajLiftAvailable_isNA: false,
    
    bajajNoOfLifts: '',
    bajajNoOfLifts_isNA: false,
    bajajNoOfLifts_isManual: false,
    
    bajajCurrentOccupant: '',
    bajajCurrentOccupant_isNA: false,
    bajajCurrentOccupant_isManual: false,
    bajajFloorOccupancy: [] as { floor: string; status: string }[],
    
    bajajSeparateAccess: '',
    bajajSeparateAccessCustom: '',
    bajajSeparateAccess_isNA: false,
    
    bajajAccommodationDetails: '',
    bajajAccommodationDetails_isNA: false,
    bajajAccommodationDetails_isManual: false,
    bajajAccommodationFloors: [] as { floor: string; occupancy: string; bedrooms: number; halls: number; dining: number; kitchens: number; bathrooms: number; other: string }[],

    // Section 8: Area Details & Valuation (BAU Details)
    bajajPlotAreaDeed: '',
    bajajPlotAreaDeed_isNA: false,
    bajajPlotAreaPlan: '',
    bajajPlotAreaPlan_isNA: false,
    bajajPlotAreaSite: '',
    bajajPlotAreaSite_isNA: false,
    bajajPlotAreaConsidered: '',
    bajajPlotAreaConsidered_isNA: false,
    bajajPlotAreaConsidered_isManual: false,
    bajajPlotAreaUnit: 'Sq.ft',
    bajajPlotAreaUnitCustom: '',
    
    bajajBAUFloors: [] as { floor: string, areaDeed: string, areaPlan: string, areaSite: string, areaConsidered: string, areaConsidered_isManual: boolean, replacementRate: string, structureValue: string }[],
    
    bajajTotalBAUConsidered: '',
    bajajTotalBAUConsidered_isNA: false,
    bajajTotalBAUConsidered_isManual: false,
    
    bajajAgeOfBuilding: '',
    bajajAgeOfBuilding_isNA: false,
    
    bajajResidualLife: '',
    bajajResidualLife_isNA: false,
    bajajResidualLife_isManual: false,
    
    bajajDepreciationRate: '',
    bajajDepreciationRate_isNA: false,
    bajajDepreciationRate_isManual: false,
    
    bajajDepreciatedValue: '',
    bajajDepreciatedValue_isNA: false,
    bajajDepreciatedValue_isManual: false,

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
      title: 'Schedule of the Property',
      number: 4,
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

        const handleBoundaryChange = (fieldToUpdate: string, value: string) => {
          handleChange(fieldToUpdate, value);
          
          if (!fields.bajajBoundaryMatching_isManual && !fields.bajajBoundaryMatching_isNA) {
            const getLatest = (f: string) => f === fieldToUpdate ? value : (fields[f] || '');
            
            const nMatch = getLatest('bajajBoundaryNorthDeed').trim().toLowerCase() === getLatest('bajajBoundaryNorthActual').trim().toLowerCase();
            const eMatch = getLatest('bajajBoundaryEastDeed').trim().toLowerCase() === getLatest('bajajBoundaryEastActual').trim().toLowerCase();
            const sMatch = getLatest('bajajBoundarySouthDeed').trim().toLowerCase() === getLatest('bajajBoundarySouthActual').trim().toLowerCase();
            const wMatch = getLatest('bajajBoundaryWestDeed').trim().toLowerCase() === getLatest('bajajBoundaryWestActual').trim().toLowerCase();
            
            const allMatch = nMatch && eMatch && sMatch && wMatch;
            
            const allEmpty = 
              !getLatest('bajajBoundaryNorthDeed') && !getLatest('bajajBoundaryNorthActual') &&
              !getLatest('bajajBoundaryEastDeed') && !getLatest('bajajBoundaryEastActual') &&
              !getLatest('bajajBoundarySouthDeed') && !getLatest('bajajBoundarySouthActual') &&
              !getLatest('bajajBoundaryWestDeed') && !getLatest('bajajBoundaryWestActual');

            if (allEmpty) {
              handleChange('bajajBoundaryMatching', '');
            } else {
              handleChange('bajajBoundaryMatching', allMatch ? 'Yes' : 'No');
            }
          }
        };

        const syncBoundaryMatching = () => {
          const nMatch = (fields.bajajBoundaryNorthDeed || '').trim().toLowerCase() === (fields.bajajBoundaryNorthActual || '').trim().toLowerCase();
          const eMatch = (fields.bajajBoundaryEastDeed || '').trim().toLowerCase() === (fields.bajajBoundaryEastActual || '').trim().toLowerCase();
          const sMatch = (fields.bajajBoundarySouthDeed || '').trim().toLowerCase() === (fields.bajajBoundarySouthActual || '').trim().toLowerCase();
          const wMatch = (fields.bajajBoundaryWestDeed || '').trim().toLowerCase() === (fields.bajajBoundaryWestActual || '').trim().toLowerCase();
          const allMatch = nMatch && eMatch && sMatch && wMatch;
          handleChange('bajajBoundaryMatching', allMatch ? 'Yes' : 'No');
        };

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#C7D2FE] bg-[#EEF2FF] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Schedule of the Property</h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm text-left text-gray-600 border-collapse">
                  <thead className="bg-indigo-50 border-b border-indigo-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-1/5">Schedule of the Property</th>
                      <th className="px-4 py-3 font-semibold w-2/5">As per legal documents(Sub Plot No-J & Sub plot no-K-1(Part))</th>
                      <th className="px-4 py-3 font-semibold w-2/5">As per site visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['North', 'East', 'West', 'South'] as const).map(dir => (
                      <tr key={dir} className="border-b border-indigo-50 hover:bg-white/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-700">{dir}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="text"
                            className={`${inputCls} capitalize`}
                            value={fields[`bajajBoundary${dir}Deed`] || ''} 
                            onChange={e => handleBoundaryChange(`bajajBoundary${dir}Deed`, e.target.value)} 
                            disabled={isReadOnly || fields[`bajajBoundary${dir}Deed_isNA`]} 
                          />
                          <NACheckbox field={`bajajBoundary${dir}Deed`} />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text"
                            className={`${inputCls} capitalize`}
                            value={fields[`bajajBoundary${dir}Actual`] || ''} 
                            onChange={e => handleBoundaryChange(`bajajBoundary${dir}Actual`, e.target.value)} 
                            disabled={isReadOnly || fields[`bajajBoundary${dir}Actual_isNA`]} 
                          />
                          <NACheckbox field={`bajajBoundary${dir}Actual`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Boundaries Matching (Yes/No)</label>
                    <EditSwitch 
                      field="bajajBoundaryMatching" 
                      onToggleOff={syncBoundaryMatching} 
                    />
                  </div>
                  <select 
                    className={inputCls} 
                    value={fields.bajajBoundaryMatching === 'NA' ? 'NA' : (['Yes', 'No'].includes(fields.bajajBoundaryMatching || '') ? fields.bajajBoundaryMatching : (fields.bajajBoundaryMatching ? 'Custom' : ''))} 
                    onChange={e => {
                      if (e.target.value === 'Custom') {
                        handleChange('bajajBoundaryMatching', fields.bajajBoundaryMatchingCustom || '');
                      } else {
                        handleChange('bajajBoundaryMatching', e.target.value);
                      }
                    }} 
                    disabled={isReadOnly || !fields.bajajBoundaryMatching_isManual || fields.bajajBoundaryMatching_isNA}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Custom">Custom</option>
                  </select>
                  {!['Yes', 'No'].includes(fields.bajajBoundaryMatching || '') && fields.bajajBoundaryMatching && fields.bajajBoundaryMatching !== 'NA' && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        className={inputCls} 
                        placeholder="Enter custom value"
                        value={fields.bajajBoundaryMatchingCustom || ''} 
                        onChange={e => {
                          handleChange('bajajBoundaryMatchingCustom', e.target.value);
                          handleChange('bajajBoundaryMatching', e.target.value);
                        }}
                        disabled={isReadOnly || !fields.bajajBoundaryMatching_isManual || fields.bajajBoundaryMatching_isNA}
                      />
                    </div>
                  )}
                  <NACheckbox field="bajajBoundaryMatching" />
                </div>
                
                {renderSelectWithCustom('bajajPropertyIdentifiable', ['Yes', 'No'], 'Property Identified (Yes/No)')}
                {renderSelectWithCustom('bajajApproachRoadSize', ['<5 ft', '5-10 ft', '10-15 ft', '15ft'], 'Approach Road Size (<5 ft/5-10 ft/ 10-15 ft/ 15ft)')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-5',
      title: 'NDMA Parameters',
      number: 5,
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
            <div className="border border-[#FECDD3] bg-[#FFF1F2] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">NDMA Parameters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSelectWithCustom('bajajNatureOfBuilding', ['Residential', 'Commercial', 'Industrial', 'Mixed'], 'Nature of Building/Wing')}
                {renderSelectWithCustom('bajajPlanAspectRatio', ['YES', 'NO'], 'Plan Aspect Ratio')}
                {renderSelectWithCustom('bajajStructureType', ['Load Bearing', 'RCC', 'Composite Structure', 'Others'], 'Structure Type (Load Bearing, RCC, Composite Structure, Others)')}
                {renderSelectWithCustom('bajajProjectedParts', ['Yes', 'No'], 'Projected Parts Available')}
                {renderSelectWithCustom('bajajTypeOfMasonry', ['Brick Masonry', 'Stone Masonry', 'Concrete Blocks', 'Fly Ash'], 'Type of Masonry')}
                {renderSelectWithCustom('bajajExpansionJointsAvailable', ['YES', 'NO'], 'Expansion Joints Available')}
                {renderSelectWithCustom('bajajRoofType', ['FLAT Roof', 'Pitched Roof', 'Sloped Roof', 'GI Sheet Roof'], 'Roof Type')}
                {renderSelectWithCustom('bajajSteelGrade', ['FE 415', 'FE 500', 'FE 550D'], 'Steel Grade')}
                {renderSelectWithCustom('bajajMortarType', ['Cement Mortar', 'Lime Mortar', 'Mud Mortar'], 'Mortar Type')}
                {renderSelectWithCustom('bajajConcreteGrade', ['M15', 'M20', 'M25', 'M30'], 'Concrete Grade')}
                {renderSelectWithCustom('bajajEnvironmentExposureCondition', ['MILD', 'MODERATE', 'SEVERE', 'VERY SEVERE', 'EXTREME'], 'Environment Exposure Condition')}
                {renderSelectWithCustom('bajajFootingType', ['Stepped Footing', 'Isolated Footing', 'Combined Footing', 'Raft / Mat Foundation', 'Pile Foundation'], 'Footing Type')}
                {renderSelectWithCustom('bajajSeismicZone', ['Zone II', 'Zone III', 'II & III', 'Zone IV', 'Zone V'], 'Sesmic Zone')}
                {renderSelectWithCustom('bajajSoilLiquefiable', ['YES', 'NO'], 'Soil Liquefiable')}
                {renderSelectWithCustom('bajajCoastalRegulatoryZone', ['Yes', 'No'], 'Coastal Regulatory Zone (Yes/No)')}
                {renderSelectWithCustom('bajajSoilSlopeVulnerableToLandslide', ['YES', 'NO'], 'Soil Slope Vulnerable to Landslide')}
                {renderSelectWithCustom('bajajFloodProneArea', ['YES', 'NO'], 'Flood Prone Area')}
                {renderSelectWithCustom('bajajGroundSlopeMoreThan20', ['YES', 'NO'], 'Ground Slope More than 20%')}
                {renderSelectWithCustom('bajajFireExit', ['Yes', 'No'], 'Fire Exit')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-6',
      title: 'Approved Plan Details',
      number: 6,
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

        const isPlanLocked = ['No', 'NA'].includes(fields.bajajSanctionedPlanProvided) || fields.bajajSanctionedPlanProvided_isNA;
        const globalDisabled = isReadOnly || isPlanLocked;

        const handleSanctionedPlanChange = (val: string) => {
          handleChange('bajajSanctionedPlanProvided', val);
          if (['No', 'NA'].includes(val)) {
            ['bajajLayoutPlanNo', 'bajajConstructionPlanNo', 'bajajDateOfSanction', 'bajajPlanValidity', 'bajajApprovingAuthority', 'bajajApprovedCategory', 'bajajNumberOfFloorsBuilding'].forEach(f => {
               if (!fields[`${f}_isManual`]) {
                 handleChange(`${f}_isNA`, true);
                 handleChange(f, 'NA');
               }
            });
          }
        };

        const renderSelectWithCustom = (field: string, options: string[], label: string, isFieldDisabled: boolean = false) => (
          <div>
            <Field label={label}>
              <select 
                className={inputCls} 
                value={fields[field] === 'NA' ? 'NA' : (options.includes(fields[field] || '') ? fields[field] : (fields[field] ? 'Custom' : ''))} 
                onChange={e => {
                  if (e.target.value === 'Custom') {
                    if (field === 'bajajSanctionedPlanProvided') handleSanctionedPlanChange(fields[`${field}Custom`] || '');
                    else handleChange(field, fields[`${field}Custom`] || '');
                  } else {
                    if (field === 'bajajSanctionedPlanProvided') handleSanctionedPlanChange(e.target.value);
                    else handleChange(field, e.target.value);
                  }
                }} 
                disabled={isFieldDisabled || fields[`${field}_isNA`]}
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
                    if (field === 'bajajSanctionedPlanProvided') handleSanctionedPlanChange(e.target.value);
                    else handleChange(field, e.target.value);
                  }}
                  disabled={isFieldDisabled || fields[`${field}_isNA`]}
                />
              </div>
            )}
            <NACheckbox field={field} />
          </div>
        );

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#FED7AA] bg-[#FFF7ED] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Approved Plan Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSelectWithCustom('bajajSanctionedPlanProvided', ['Yes', 'No'], 'Sanctioned Plan Provided (Yes/No)', isReadOnly)}
                
                <div>
                  <Field label="Layout Plan Details: Sanctioned No./Permit No.">
                    <input className={inputCls} value={fields.bajajLayoutPlanNo || ''} onChange={e => handleChange('bajajLayoutPlanNo', e.target.value)} disabled={globalDisabled || fields.bajajLayoutPlanNo_isNA} />
                  </Field>
                  <NACheckbox field="bajajLayoutPlanNo" />
                </div>
                
                <div>
                  <Field label="Construction Plan Details: Sanctioned No/Permit No.">
                    <input className={inputCls} value={fields.bajajConstructionPlanNo || ''} onChange={e => handleChange('bajajConstructionPlanNo', e.target.value)} disabled={globalDisabled || fields.bajajConstructionPlanNo_isNA} />
                  </Field>
                  <NACheckbox field="bajajConstructionPlanNo" />
                </div>
                
                <div>
                  <Field label="Date of Sanction">
                    <input type="date" className={inputCls} value={fields.bajajDateOfSanction || ''} onChange={e => handleChange('bajajDateOfSanction', e.target.value)} disabled={globalDisabled || fields.bajajDateOfSanction_isNA} />
                  </Field>
                  <NACheckbox field="bajajDateOfSanction" />
                </div>
                
                <div>
                  <Field label="Plan Validity">
                    <input type="date" className={inputCls} value={fields.bajajPlanValidity || ''} onChange={e => handleChange('bajajPlanValidity', e.target.value)} disabled={globalDisabled || fields.bajajPlanValidity_isNA} />
                  </Field>
                  <NACheckbox field="bajajPlanValidity" />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Approving Authority</label>
                    <EditSwitch 
                      field="bajajApprovingAuthority" 
                      onToggleOff={() => {
                        handleChange('bajajApprovingAuthority_isNA', false);
                        handleChange('bajajApprovingAuthority', fields.bajajJurisdictionMunicipalBody || '');
                      }} 
                    />
                  </div>
                  <select 
                    className={inputCls} 
                    value={fields.bajajApprovingAuthority === 'NA' ? 'NA' : (['BDA', 'BMC', 'CMC', 'Gram Panchayat', 'Not Provided'].includes(fields.bajajApprovingAuthority || '') ? fields.bajajApprovingAuthority : (fields.bajajApprovingAuthority ? 'Custom' : ''))} 
                    onChange={e => {
                      if (e.target.value === 'Custom') {
                        handleChange('bajajApprovingAuthority', fields.bajajApprovingAuthorityCustom || '');
                      } else {
                        handleChange('bajajApprovingAuthority', e.target.value);
                      }
                    }} 
                    disabled={globalDisabled || !fields.bajajApprovingAuthority_isManual || fields.bajajApprovingAuthority_isNA}
                  >
                    <option value="">Select</option>
                    {['BDA', 'BMC', 'CMC', 'Gram Panchayat', 'Not Provided'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    <option value="Custom">Custom</option>
                  </select>
                  {!['BDA', 'BMC', 'CMC', 'Gram Panchayat', 'Not Provided'].includes(fields.bajajApprovingAuthority || '') && fields.bajajApprovingAuthority && fields.bajajApprovingAuthority !== 'NA' && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        className={inputCls} 
                        placeholder="Enter custom value"
                        value={fields.bajajApprovingAuthorityCustom || ''} 
                        onChange={e => {
                          handleChange('bajajApprovingAuthorityCustom', e.target.value);
                          handleChange('bajajApprovingAuthority', e.target.value);
                        }}
                        disabled={globalDisabled || !fields.bajajApprovingAuthority_isManual || fields.bajajApprovingAuthority_isNA}
                      />
                    </div>
                  )}
                  <NACheckbox field="bajajApprovingAuthority" />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Approved Usages (Residential/Industrial/Commercial/Mixed Usages)</label>
                    <EditSwitch 
                      field="bajajApprovedCategory" 
                      onToggleOff={() => {
                        handleChange('bajajApprovedCategory_isNA', false);
                        handleChange('bajajApprovedCategory', fields.bajajNatureOfBuilding || '');
                      }} 
                    />
                  </div>
                  <select 
                    className={inputCls} 
                    value={fields.bajajApprovedCategory === 'NA' ? 'NA' : (['Residential', 'Commercial', 'Industrial', 'Mixed Usages'].includes(fields.bajajApprovedCategory || '') ? fields.bajajApprovedCategory : (fields.bajajApprovedCategory ? 'Custom' : ''))} 
                    onChange={e => {
                      if (e.target.value === 'Custom') {
                        handleChange('bajajApprovedCategory', fields.bajajApprovedCategoryCustom || '');
                      } else {
                        handleChange('bajajApprovedCategory', e.target.value);
                      }
                    }} 
                    disabled={globalDisabled || !fields.bajajApprovedCategory_isManual || fields.bajajApprovedCategory_isNA}
                  >
                    <option value="">Select</option>
                    {['Residential', 'Commercial', 'Industrial', 'Mixed Usages'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    <option value="Custom">Custom</option>
                  </select>
                  {!['Residential', 'Commercial', 'Industrial', 'Mixed Usages'].includes(fields.bajajApprovedCategory || '') && fields.bajajApprovedCategory && fields.bajajApprovedCategory !== 'NA' && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        className={inputCls} 
                        placeholder="Enter custom value"
                        value={fields.bajajApprovedCategoryCustom || ''} 
                        onChange={e => {
                          handleChange('bajajApprovedCategoryCustom', e.target.value);
                          handleChange('bajajApprovedCategory', e.target.value);
                        }}
                        disabled={globalDisabled || !fields.bajajApprovedCategory_isManual || fields.bajajApprovedCategory_isNA}
                      />
                    </div>
                  )}
                  <NACheckbox field="bajajApprovedCategory" />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Number of Floor in Building</label>
                    <EditSwitch 
                      field="bajajNumberOfFloorsBuilding" 
                      onToggleOff={() => {
                        handleChange('bajajNumberOfFloorsBuilding_isNA', false);
                        handleChange('bajajNumberOfFloorsBuilding', fields.bajajFloorNo || '');
                      }} 
                    />
                  </div>
                  <input 
                    type="text"
                    className={inputCls} 
                    value={fields.bajajNumberOfFloorsBuilding || ''} 
                    onChange={e => handleChange('bajajNumberOfFloorsBuilding', e.target.value)} 
                    disabled={globalDisabled || !fields.bajajNumberOfFloorsBuilding_isManual || fields.bajajNumberOfFloorsBuilding_isNA} 
                  />
                  <NACheckbox field="bajajNumberOfFloorsBuilding" />
                </div>
                
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-7',
      title: 'Technical Details',
      number: 7,
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

        const renderSelectWithCustom = (field: string, options: string[], label: string, onChangeExt?: (val: string) => void) => (
          <div>
            <Field label={label}>
              <select 
                className={inputCls} 
                value={fields[field] === 'NA' ? 'NA' : (options.includes(fields[field] || '') ? fields[field] : (fields[field] ? 'Custom' : ''))} 
                onChange={e => {
                  let val = e.target.value;
                  if (val === 'Custom') val = fields[`${field}Custom`] || '';
                  handleChange(field, val);
                  if (onChangeExt) onChangeExt(val);
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
                    if (onChangeExt) onChangeExt(e.target.value);
                  }}
                  disabled={isReadOnly || fields[`${field}_isNA`]}
                />
              </div>
            )}
            <NACheckbox field={field} />
          </div>
        );

        // ── Floor-Occupancy helpers ──
        const FLOOR_LABELS = ['GF', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH'];
        const STATUS_OPTIONS = ['Owner', 'Tenant', 'Vacant'];

        const getFloorCount = (): number => {
          const raw = fields.bajajNumberOfFloorsBuilding || fields.bajajFloorNo || '';
          const match = raw.match(/G\+(\d+)/i);
          if (match) return parseInt(match[1], 10) + 1;
          const num = parseInt(raw, 10);
          return isNaN(num) ? 1 : Math.max(1, num);
        };

        const floorOccupancy: { floor: string; status: string }[] = Array.isArray(fields.bajajFloorOccupancy) && fields.bajajFloorOccupancy.length > 0
          ? fields.bajajFloorOccupancy
          : FLOOR_LABELS.slice(0, getFloorCount()).map((fl: string) => ({
              floor: fl,
              status: fields.bajajOccupiedBy === 'Self Occupied' ? 'Owner' : (fields.bajajOccupiedBy === 'Tenant' ? 'Tenant' : (fields.bajajOccupiedBy === 'Vacant' ? 'Vacant' : ''))
            }));

        const compileOccupantString = (occ: { floor: string; status: string }[]) => {
          const grouped: Record<string, string[]> = {};
          for (const item of occ) {
            if (!item.status) continue;
            if (!grouped[item.status.toUpperCase()]) grouped[item.status.toUpperCase()] = [];
            grouped[item.status.toUpperCase()].push(item.floor);
          }
          return Object.entries(grouped).map(([status, floors]) => `${floors.join(' & ')}- ${status}`).join('\n');
        };

        const handleFloorStatusChange = (idx: number, status: string) => {
          const updated = [...floorOccupancy];
          updated[idx] = { ...updated[idx], status };
          handleChange('bajajFloorOccupancy', updated);
          if (!fields.bajajCurrentOccupant_isManual) {
            handleChange('bajajCurrentOccupant', compileOccupantString(updated));
          }
        };

        // ── Accommodation Table helpers ──
        const accommodationFloors: { floor: string; occupancy: string; bedrooms: number; halls: number; dining: number; kitchens: number; bathrooms: number; other: string }[] = 
          Array.isArray(fields.bajajAccommodationFloors) && fields.bajajAccommodationFloors.length > 0
            ? fields.bajajAccommodationFloors
            : FLOOR_LABELS.slice(0, getFloorCount()).map((fl: string, i: number) => ({
                floor: fl,
                occupancy: floorOccupancy[i]?.status || '',
                bedrooms: 0, halls: 0, dining: 0, kitchens: 0, bathrooms: 0, other: ''
              }));

        const compileAccommodationString = (rows: typeof accommodationFloors) => {
          return rows.map(r => {
            const parts: string[] = [];
            if (r.bedrooms > 0) parts.push(`${r.bedrooms} BEDROOM`);
            if (r.halls > 0) parts.push(`${r.halls} DRAWING`);
            if (r.dining > 0) parts.push(`${r.dining} DINING`);
            if (r.kitchens > 0) parts.push(`${r.kitchens} KITCHEN`);
            if (r.bathrooms > 0) parts.push(`${r.bathrooms} TOILET`);
            if (r.other) parts.push(r.other.toUpperCase());
            return `${r.floor}- ${parts.join(', ') || 'NA'}`;
          }).join('\n');
        };

        const handleAccFloorChange = (idx: number, key: string, value: any) => {
          const updated = [...accommodationFloors];
          updated[idx] = { ...updated[idx], [key]: value };
          handleChange('bajajAccommodationFloors', updated);
          if (!fields.bajajAccommodationDetails_isManual) {
            handleChange('bajajAccommodationDetails', compileAccommodationString(updated));
          }
        };

        const addAccFloor = () => {
          const updated = [...accommodationFloors, { floor: '', occupancy: '', bedrooms: 0, halls: 0, dining: 0, kitchens: 0, bathrooms: 0, other: '' }];
          handleChange('bajajAccommodationFloors', updated);
        };

        const removeAccFloor = (idx: number) => {
          const updated = accommodationFloors.filter((_: any, i: number) => i !== idx);
          handleChange('bajajAccommodationFloors', updated);
          if (!fields.bajajAccommodationDetails_isManual) {
            handleChange('bajajAccommodationDetails', compileAccommodationString(updated));
          }
        };

        const NumericStepper = ({ value, onChange, disabled: dis }: { value: number; onChange: (v: number) => void; disabled?: boolean }) => (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={dis} className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs font-bold disabled:opacity-40">−</button>
            <span className="w-5 text-center text-xs font-medium">{value}</span>
            <button type="button" onClick={() => onChange(Math.min(9, value + 1))} disabled={dis} className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs font-bold disabled:opacity-40">+</button>
          </div>
        );

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#E9D5FF] bg-[#FAF5FF] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Technical Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSelectWithCustom('bajajConstructionQuality', ['Good', 'Average', 'Poor'], 'Construction Quality (Good/Average/Poor)')}
                
                {renderSelectWithCustom('bajajLiftAvailable', ['Yes', 'No'], 'Lift Available (Yes/No)', (val) => {
                  if (['No', 'NA'].includes(val)) {
                    if (!fields.bajajNoOfLifts_isManual) {
                      handleChange('bajajNoOfLifts', '0');
                    }
                  }
                })}
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">No. of Lifts</label>
                    <EditSwitch 
                      field="bajajNoOfLifts" 
                      onToggleOff={() => {
                        handleChange('bajajNoOfLifts_isNA', false);
                        if (['No', 'NA'].includes(fields.bajajLiftAvailable)) {
                          handleChange('bajajNoOfLifts', '0');
                        }
                      }} 
                    />
                  </div>
                  <input 
                    type="number"
                    min="0"
                    step="1"
                    className={inputCls} 
                    value={fields.bajajNoOfLifts || ''} 
                    onChange={e => handleChange('bajajNoOfLifts', e.target.value)} 
                    disabled={isReadOnly || (!fields.bajajNoOfLifts_isManual && ['No', 'NA'].includes(fields.bajajLiftAvailable)) || fields.bajajNoOfLifts_isNA} 
                  />
                  <NACheckbox field="bajajNoOfLifts" />
                </div>

                {renderSelectWithCustom('bajajSeparateAccess', ['Yes', 'No'], 'Separate Independent Access (Yes/No)')}
              </div>

              {/* ── Current Occupant: Interactive Floor-Occupancy Tag Group ── */}
              <div className="mt-6 border border-purple-200 bg-purple-50/40 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-gray-700">Current Occupant of Property (Owner/Tenant/Vacant)</label>
                  <EditSwitch 
                    field="bajajCurrentOccupant" 
                    onToggleOff={() => {
                      handleChange('bajajCurrentOccupant_isNA', false);
                      handleChange('bajajCurrentOccupant', compileOccupantString(floorOccupancy));
                    }} 
                  />
                </div>
                
                {!fields.bajajCurrentOccupant_isManual && !fields.bajajCurrentOccupant_isNA ? (
                  <>
                    {/* Floor Status Pill Grid */}
                    <div className="space-y-2">
                      {floorOccupancy.map((item: { floor: string; status: string }, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm border border-purple-100">
                          <span className="text-xs font-bold text-purple-700 w-8 shrink-0">{item.floor}</span>
                          <div className="flex gap-1 flex-1">
                            {STATUS_OPTIONS.map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleFloorStatusChange(idx, opt)}
                                disabled={isReadOnly}
                                className={`flex-1 px-2 py-1 text-[10px] font-semibold rounded-full border transition-all duration-150 ${
                                  item.status === opt
                                    ? opt === 'Owner' ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                    : opt === 'Tenant' ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                    : 'bg-slate-500 text-white border-slate-600 shadow-sm'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Auto-compiled Summary */}
                    <div className="mt-3 bg-white rounded-lg border border-purple-200 p-3">
                      <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider mb-1">Auto-compiled Summary</p>
                      <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">{compileOccupantString(floorOccupancy) || '—'}</pre>
                    </div>
                  </>
                ) : (
                  /* Raw textarea override when Edit On */
                  <textarea
                    className={inputCls} 
                    rows={3}
                    placeholder="e.g. GF & 2ND- TENANT&#10;1ST & 3RD- OWNER"
                    value={fields.bajajCurrentOccupant === 'NA' ? 'NA' : fields.bajajCurrentOccupant || ''} 
                    onChange={e => handleChange('bajajCurrentOccupant', e.target.value)} 
                    disabled={isReadOnly || fields.bajajCurrentOccupant_isNA} 
                  />
                )}
                <NACheckbox field="bajajCurrentOccupant" />
              </div>

              {/* ── Accommodation Details: Dynamic Floor Breakdown Table ── */}
              <div className="mt-6 border border-purple-200 bg-purple-50/40 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-gray-700">Accommodation details: Floor wise and Occupancy</label>
                  <EditSwitch 
                    field="bajajAccommodationDetails" 
                    onToggleOff={() => {
                      handleChange('bajajAccommodationDetails_isNA', false);
                      handleChange('bajajAccommodationDetails', compileAccommodationString(accommodationFloors));
                    }} 
                  />
                </div>

                {!fields.bajajAccommodationDetails_isManual && !fields.bajajAccommodationDetails_isNA ? (
                  <>
                    {/* Dynamic Repeater Grid */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-purple-100 text-purple-800">
                            <th className="px-2 py-1.5 text-left font-semibold border border-purple-200 whitespace-nowrap">Floor</th>
                            <th className="px-2 py-1.5 text-left font-semibold border border-purple-200 whitespace-nowrap">Occupancy</th>
                            <th className="px-2 py-1.5 text-center font-semibold border border-purple-200 whitespace-nowrap">Bedrooms</th>
                            <th className="px-2 py-1.5 text-center font-semibold border border-purple-200 whitespace-nowrap">Halls/Drawing</th>
                            <th className="px-2 py-1.5 text-center font-semibold border border-purple-200 whitespace-nowrap">Dining</th>
                            <th className="px-2 py-1.5 text-center font-semibold border border-purple-200 whitespace-nowrap">Kitchens</th>
                            <th className="px-2 py-1.5 text-center font-semibold border border-purple-200 whitespace-nowrap">Bathrooms</th>
                            <th className="px-2 py-1.5 text-left font-semibold border border-purple-200 whitespace-nowrap">Other</th>
                            <th className="px-2 py-1.5 text-center font-semibold border border-purple-200 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {accommodationFloors.map((row: any, idx: number) => (
                            <tr key={idx} className="bg-white hover:bg-purple-50/50">
                              <td className="px-1 py-1 border border-purple-100">
                                <select className="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5" value={row.floor} onChange={e => handleAccFloorChange(idx, 'floor', e.target.value)} disabled={isReadOnly}>
                                  <option value="">Select</option>
                                  {['GF', 'FF', 'SF', 'TF', '1ST', '2ND', '3RD', '4TH', '5TH'].map(f => <option key={f} value={f}>{f}</option>)}
                                  <option value="Custom">Custom</option>
                                </select>
                              </td>
                              <td className="px-1 py-1 border border-purple-100">
                                <select className="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5" value={row.occupancy} onChange={e => handleAccFloorChange(idx, 'occupancy', e.target.value)} disabled={isReadOnly}>
                                  <option value="">Select</option>
                                  {['Owner', 'Tenant', 'Vacant'].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </td>
                              <td className="px-1 py-1 border border-purple-100 text-center"><NumericStepper value={row.bedrooms || 0} onChange={v => handleAccFloorChange(idx, 'bedrooms', v)} disabled={isReadOnly} /></td>
                              <td className="px-1 py-1 border border-purple-100 text-center"><NumericStepper value={row.halls || 0} onChange={v => handleAccFloorChange(idx, 'halls', v)} disabled={isReadOnly} /></td>
                              <td className="px-1 py-1 border border-purple-100 text-center"><NumericStepper value={row.dining || 0} onChange={v => handleAccFloorChange(idx, 'dining', v)} disabled={isReadOnly} /></td>
                              <td className="px-1 py-1 border border-purple-100 text-center"><NumericStepper value={row.kitchens || 0} onChange={v => handleAccFloorChange(idx, 'kitchens', v)} disabled={isReadOnly} /></td>
                              <td className="px-1 py-1 border border-purple-100 text-center"><NumericStepper value={row.bathrooms || 0} onChange={v => handleAccFloorChange(idx, 'bathrooms', v)} disabled={isReadOnly} /></td>
                              <td className="px-1 py-1 border border-purple-100">
                                <input type="text" className="w-full text-[10px] border border-gray-200 rounded px-1 py-0.5" placeholder="e.g. 1 Storeroom" value={row.other || ''} onChange={e => handleAccFloorChange(idx, 'other', e.target.value)} disabled={isReadOnly} />
                              </td>
                              <td className="px-1 py-1 border border-purple-100 text-center">
                                <button type="button" onClick={() => removeAccFloor(idx)} disabled={isReadOnly || accommodationFloors.length <= 1} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-sm font-bold">✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={addAccFloor} disabled={isReadOnly} className="mt-2 text-[10px] font-semibold text-purple-600 hover:text-purple-800 border border-dashed border-purple-300 rounded-md px-3 py-1 hover:bg-purple-50 transition-colors disabled:opacity-40">
                      + Add Floor
                    </button>

                    {/* Compiled Preview */}
                    <div className="mt-3 bg-white rounded-lg border border-purple-200 p-3">
                      <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider mb-1">Auto-compiled Preview</p>
                      <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">{compileAccommodationString(accommodationFloors) || '—'}</pre>
                    </div>
                  </>
                ) : (
                  /* Raw textarea override when Edit On */
                  <textarea 
                    className={inputCls} 
                    rows={5}
                    placeholder="e.g. GF- 2 BEDROOM, 1 DINING, 1 DRAWING, 2 TOILET, 1 KITCHEN"
                    value={fields.bajajAccommodationDetails || ''} 
                    onChange={e => handleChange('bajajAccommodationDetails', e.target.value)} 
                    disabled={isReadOnly || fields.bajajAccommodationDetails_isNA} 
                  />
                )}
                <NACheckbox field="bajajAccommodationDetails" />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-8',
      title: 'Area Details & Valuation (BAU Details)',
      number: 8,
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

        const getMinArea = (...areas: (string | number)[]) => {
          const nums = areas.map(a => parseFloat(String(a))).filter(n => !isNaN(n) && n > 0);
          return nums.length > 0 ? Math.min(...nums).toFixed(2) : '';
        };

        // Plot Area Logic
        const handlePlotAreaChange = (key: string, val: string) => {
          handleChange(key, val);
          if (!fields.bajajPlotAreaConsidered_isManual) {
            const deed = key === 'bajajPlotAreaDeed' ? val : fields.bajajPlotAreaDeed;
            const plan = key === 'bajajPlotAreaPlan' ? val : fields.bajajPlotAreaPlan;
            const site = key === 'bajajPlotAreaSite' ? val : fields.bajajPlotAreaSite;
            handleChange('bajajPlotAreaConsidered', getMinArea(deed, plan, site));
          }
        };

        // BAU Floors Logic
        const FLOOR_LABELS = ['GF', '1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH'];
        const getFloorCount = (): number => {
          const raw = fields.bajajNumberOfFloorsBuilding || fields.bajajFloorNo || '';
          const match = raw.match(/G\+(\d+)/i);
          if (match) return parseInt(match[1], 10) + 1;
          const num = parseInt(raw, 10);
          return isNaN(num) ? 1 : Math.max(1, num);
        };
        const defaultFloorsCount = Math.max(
          getFloorCount(), 
          Array.isArray(fields.bajajAccommodationFloors) ? fields.bajajAccommodationFloors.length : 1
        );

        const bauFloors = Array.isArray(fields.bajajBAUFloors) && fields.bajajBAUFloors.length > 0
          ? fields.bajajBAUFloors
          : Array.from({ length: defaultFloorsCount }).map((_, i) => ({
              floor: FLOOR_LABELS[i] || `F`+(i+1),
              areaDeed: '', areaPlan: '', areaSite: '', areaConsidered: '', areaConsidered_isManual: false, replacementRate: '', structureValue: ''
            }));

        const calcTotalBAU = (floors: any[]) => {
          return floors.reduce((acc, f) => {
            const val = parseFloat(f.areaConsidered);
            return acc + (isNaN(val) ? 0 : val);
          }, 0).toFixed(2);
        };

        const calcTotalStructValue = (floors: any[]) => {
          return floors.reduce((acc, f) => {
            const val = parseFloat(f.structureValue);
            return acc + (isNaN(val) ? 0 : val);
          }, 0);
        };

        const handleBAUFloorChange = (idx: number, key: string, val: string) => {
          const updated = [...bauFloors];
          const row = { ...updated[idx], [key]: val };

          // Recalculate areaConsidered (min of plan and site) if not manual
          if (key === 'areaPlan' || key === 'areaSite' || key === 'areaConsidered_isManual') {
            if (!row.areaConsidered_isManual) {
              row.areaConsidered = getMinArea(row.areaPlan, row.areaSite);
            }
          }

          // Recalculate structure value
          if (key === 'areaConsidered' || key === 'replacementRate' || key === 'areaPlan' || key === 'areaSite') {
            const area = parseFloat(row.areaConsidered);
            const rate = parseFloat(row.replacementRate);
            row.structureValue = (!isNaN(area) && !isNaN(rate)) ? (area * rate).toFixed(2) : '';
          }

          updated[idx] = row;
          handleChange('bajajBAUFloors', updated);

          if (!fields.bajajTotalBAUConsidered_isManual) {
            handleChange('bajajTotalBAUConsidered', calcTotalBAU(updated));
          }
          if (!fields.bajajDepreciatedValue_isManual) {
            recalcDepreciatedValue(updated, fields.bajajDepreciationRate);
          }
        };

        const addBAUFloor = () => {
          const updated = [...bauFloors, { floor: '', areaDeed: '', areaPlan: '', areaSite: '', areaConsidered: '', areaConsidered_isManual: false, replacementRate: '', structureValue: '' }];
          handleChange('bajajBAUFloors', updated);
        };

        const removeBAUFloor = (idx: number) => {
          const updated = bauFloors.filter((_, i) => i !== idx);
          handleChange('bajajBAUFloors', updated);
          if (!fields.bajajTotalBAUConsidered_isManual) {
            handleChange('bajajTotalBAUConsidered', calcTotalBAU(updated));
          }
          if (!fields.bajajDepreciatedValue_isManual) {
            recalcDepreciatedValue(updated, fields.bajajDepreciationRate);
          }
        };

        // Summary Calculations
        const recalcDepreciatedValue = (floors = bauFloors, depRate = fields.bajajDepreciationRate) => {
          const totalStruct = calcTotalStructValue(floors);
          const rate = parseFloat(depRate);
          const finalVal = (!isNaN(totalStruct) && !isNaN(rate)) ? Math.round(totalStruct * (1 - rate / 100)) : (isNaN(totalStruct) ? '' : Math.round(totalStruct));
          handleChange('bajajDepreciatedValue', finalVal.toString());
        };

        const handleAgeChange = (val: string) => {
          handleChange('bajajAgeOfBuilding', val);
          const age = parseFloat(val);
          if (!isNaN(age)) {
            if (!fields.bajajResidualLife_isManual) {
              handleChange('bajajResidualLife', Math.max(0, 60 - age).toString());
            }
            if (!fields.bajajDepreciationRate_isManual) {
              const rate = ((age / 60) * 100).toFixed(2);
              handleChange('bajajDepreciationRate', rate);
              if (!fields.bajajDepreciatedValue_isManual) {
                recalcDepreciatedValue(bauFloors, rate);
              }
            }
          }
        };

        return (
          <div className="animate-fade-in space-y-6">
            
            {/* Plot Area Details */}
            <div className="border border-[#BAE6FD] bg-[#F0F9FF] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Plot Area Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-sky-100 text-sky-800">
                      <th className="px-2 py-2 text-left font-semibold border border-sky-200">Parameter</th>
                      <th className="px-2 py-2 text-left font-semibold border border-sky-200">Area as per Deed</th>
                      <th className="px-2 py-2 text-left font-semibold border border-sky-200">Area as per Plan</th>
                      <th className="px-2 py-2 text-left font-semibold border border-sky-200">Area as per Site Measurement</th>
                      <th className="px-2 py-2 text-left font-semibold border border-sky-200 w-1/5">Area Considered for Valuation</th>
                      <th className="px-2 py-2 text-left font-semibold border border-sky-200 w-1/6">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-2 py-2 border border-sky-100 font-medium text-gray-700">Plot Area</td>
                      <td className="px-2 py-2 border border-sky-100 align-top">
                        <input type="number" step="0.01" min="0" className={inputCls} value={fields.bajajPlotAreaDeed || ''} onChange={e => handlePlotAreaChange('bajajPlotAreaDeed', e.target.value)} disabled={isReadOnly || fields.bajajPlotAreaDeed_isNA} />
                        <NACheckbox field="bajajPlotAreaDeed" />
                      </td>
                      <td className="px-2 py-2 border border-sky-100 align-top">
                        <input type="number" step="0.01" min="0" className={inputCls} value={fields.bajajPlotAreaPlan || ''} onChange={e => handlePlotAreaChange('bajajPlotAreaPlan', e.target.value)} disabled={isReadOnly || fields.bajajPlotAreaPlan_isNA} />
                        <NACheckbox field="bajajPlotAreaPlan" />
                      </td>
                      <td className="px-2 py-2 border border-sky-100 align-top">
                        <input type="number" step="0.01" min="0" className={inputCls} value={fields.bajajPlotAreaSite || ''} onChange={e => handlePlotAreaChange('bajajPlotAreaSite', e.target.value)} disabled={isReadOnly || fields.bajajPlotAreaSite_isNA} />
                        <NACheckbox field="bajajPlotAreaSite" />
                      </td>
                      <td className="px-2 py-2 border border-sky-100 bg-sky-50 align-top">
                        <div className="flex justify-between items-end mb-1">
                          <EditSwitch field="bajajPlotAreaConsidered" onToggleOff={() => handleChange('bajajPlotAreaConsidered', getMinArea(fields.bajajPlotAreaDeed, fields.bajajPlotAreaPlan, fields.bajajPlotAreaSite))} />
                        </div>
                        <input type="number" step="0.01" min="0" className={inputCls} value={fields.bajajPlotAreaConsidered || ''} onChange={e => handleChange('bajajPlotAreaConsidered', e.target.value)} disabled={isReadOnly || !fields.bajajPlotAreaConsidered_isManual || fields.bajajPlotAreaConsidered_isNA} />
                        <NACheckbox field="bajajPlotAreaConsidered" />
                      </td>
                      <td className="px-2 py-2 border border-sky-100 align-top">
                        <select className={inputCls} value={['Sq.ft', 'Sq.yd', 'Decimal', 'Acre', 'NA'].includes(fields.bajajPlotAreaUnit) ? fields.bajajPlotAreaUnit : 'Custom'} onChange={e => {
                          let val = e.target.value;
                          if (val === 'Custom') val = fields.bajajPlotAreaUnitCustom || '';
                          handleChange('bajajPlotAreaUnit', val);
                        }} disabled={isReadOnly}>
                          {['Sq.ft', 'Sq.yd', 'Decimal', 'Acre', 'NA', 'Custom'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {!['Sq.ft', 'Sq.yd', 'Decimal', 'Acre', 'NA'].includes(fields.bajajPlotAreaUnit || '') && fields.bajajPlotAreaUnit && (
                          <input type="text" className={`mt-2 ${inputCls}`} placeholder="Enter custom unit" value={fields.bajajPlotAreaUnitCustom || ''} onChange={e => {
                            handleChange('bajajPlotAreaUnitCustom', e.target.value);
                            handleChange('bajajPlotAreaUnit', e.target.value);
                          }} disabled={isReadOnly} />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Built-up Area (BAU) Details */}
            <div className="border border-[#A7F3D0] bg-[#ECFDF5] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Built-up Area (BAU) Details & Floor-wise Valuation</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-800">
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200 whitespace-nowrap">Floor Level</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200">Built-up Area as per Deed (Sq.ft)</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200">Built-up Area as per Plan (Sq.ft)</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200">Built-up Area as per Site (Sq.ft)</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200">Area Considered for Valuation (Sq.ft)</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200">Replacement Rate (Rs./Sq.ft)</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-emerald-200">Structure Value (Rs.)</th>
                      <th className="px-2 py-1.5 text-center font-semibold border border-emerald-200 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bauFloors.map((row: any, idx: number) => (
                      <tr key={idx} className="bg-white hover:bg-emerald-50/50">
                        <td className="px-1 py-1.5 border border-emerald-100">
                          <select className="w-full border border-gray-200 rounded px-1 py-1" value={row.floor} onChange={e => handleBAUFloorChange(idx, 'floor', e.target.value)} disabled={isReadOnly}>
                            <option value="">Select</option>
                            {['GF', 'FF', 'SF', 'TF', '1ST', '2ND', '3RD', '4TH', '5TH'].map(f => <option key={f} value={f}>{f}</option>)}
                            <option value="Custom">Custom</option>
                          </select>
                        </td>
                        <td className="px-1 py-1.5 border border-emerald-100"><input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.areaDeed || ''} onChange={e => handleBAUFloorChange(idx, 'areaDeed', e.target.value)} disabled={isReadOnly} /></td>
                        <td className="px-1 py-1.5 border border-emerald-100"><input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.areaPlan || ''} onChange={e => handleBAUFloorChange(idx, 'areaPlan', e.target.value)} disabled={isReadOnly} /></td>
                        <td className="px-1 py-1.5 border border-emerald-100"><input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.areaSite || ''} onChange={e => handleBAUFloorChange(idx, 'areaSite', e.target.value)} disabled={isReadOnly} /></td>
                        <td className="px-1 py-1.5 border border-emerald-100 bg-emerald-50/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-gray-500">Edit</span>
                            <button
                              type="button"
                              onClick={() => {
                                const manual = !row.areaConsidered_isManual;
                                handleBAUFloorChange(idx, 'areaConsidered_isManual', manual as any);
                              }}
                              disabled={isReadOnly}
                              className={`relative inline-flex h-3 w-5 items-center rounded-full transition-colors focus:outline-none ${row.areaConsidered_isManual ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${row.areaConsidered_isManual ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.areaConsidered || ''} onChange={e => handleBAUFloorChange(idx, 'areaConsidered', e.target.value)} disabled={isReadOnly || !row.areaConsidered_isManual} />
                        </td>
                        <td className="px-1 py-1.5 border border-emerald-100"><input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.replacementRate || ''} onChange={e => handleBAUFloorChange(idx, 'replacementRate', e.target.value)} disabled={isReadOnly} /></td>
                        <td className="px-1 py-1.5 border border-emerald-100 bg-gray-50"><input type="number" className="w-full border border-gray-200 rounded px-1 py-1 bg-gray-50" value={row.structureValue || ''} readOnly /></td>
                        <td className="px-1 py-1.5 border border-emerald-100 text-center">
                          <button type="button" onClick={() => removeBAUFloor(idx)} disabled={isReadOnly || bauFloors.length <= 1} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-sm font-bold">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addBAUFloor} disabled={isReadOnly} className="mt-2 text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 border border-dashed border-emerald-300 rounded-md px-3 py-1 hover:bg-emerald-50 transition-colors disabled:opacity-40">
                + Add Floor
              </button>

              <hr className="my-6 border-emerald-200" />

              <h4 className="font-semibold text-sm text-gray-700 mb-4">Summary Fields: Total Areas & Depreciated Structure Value</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Total Built-up Area Considered</label>
                    <EditSwitch field="bajajTotalBAUConsidered" onToggleOff={() => handleChange('bajajTotalBAUConsidered', calcTotalBAU(bauFloors))} />
                  </div>
                  <div className="relative">
                    <input type="number" step="0.01" className={`${inputCls} pr-12`} value={fields.bajajTotalBAUConsidered || ''} onChange={e => handleChange('bajajTotalBAUConsidered', e.target.value)} disabled={isReadOnly || !fields.bajajTotalBAUConsidered_isManual || fields.bajajTotalBAUConsidered_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Sq.ft</span>
                  </div>
                  <NACheckbox field="bajajTotalBAUConsidered" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Age of Building</label>
                  <div className="relative">
                    <input type="number" min="0" max="150" className={`${inputCls} pr-12 mt-4`} value={fields.bajajAgeOfBuilding || ''} onChange={e => handleAgeChange(e.target.value)} disabled={isReadOnly || fields.bajajAgeOfBuilding_isNA} />
                    <span className="absolute right-3 top-1/2 translate-y-1 text-xs text-gray-500 font-medium pointer-events-none">Years</span>
                  </div>
                  <NACheckbox field="bajajAgeOfBuilding" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Residual Life of Building</label>
                    <EditSwitch field="bajajResidualLife" onToggleOff={() => {
                      const age = parseFloat(fields.bajajAgeOfBuilding);
                      handleChange('bajajResidualLife', isNaN(age) ? '' : Math.max(0, 60 - age).toString());
                    }} />
                  </div>
                  <div className="relative">
                    <input type="number" min="0" max="150" className={`${inputCls} pr-12`} value={fields.bajajResidualLife || ''} onChange={e => handleChange('bajajResidualLife', e.target.value)} disabled={isReadOnly || !fields.bajajResidualLife_isManual || fields.bajajResidualLife_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Years</span>
                  </div>
                  <NACheckbox field="bajajResidualLife" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Depreciation Rate</label>
                    <EditSwitch field="bajajDepreciationRate" onToggleOff={() => {
                      const age = parseFloat(fields.bajajAgeOfBuilding);
                      const rate = isNaN(age) ? '' : ((age / 60) * 100).toFixed(2);
                      handleChange('bajajDepreciationRate', rate);
                      recalcDepreciatedValue(bauFloors, rate);
                    }} />
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" min="0" max="100" className={`${inputCls} pr-8`} value={fields.bajajDepreciationRate || ''} onChange={e => {
                      handleChange('bajajDepreciationRate', e.target.value);
                      recalcDepreciatedValue(bauFloors, e.target.value);
                    }} disabled={isReadOnly || !fields.bajajDepreciationRate_isManual || fields.bajajDepreciationRate_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">%</span>
                  </div>
                  <NACheckbox field="bajajDepreciationRate" />
                </div>

                <div className="lg:col-span-2">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Depreciated Value of Structure</label>
                    <EditSwitch field="bajajDepreciatedValue" onToggleOff={() => recalcDepreciatedValue()} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-700 font-medium pointer-events-none">₹</span>
                    <input type="number" step="1" className={`${inputCls} pl-8 font-semibold text-emerald-800 bg-white shadow-sm border-emerald-300`} value={fields.bajajDepreciatedValue || ''} onChange={e => handleChange('bajajDepreciatedValue', e.target.value)} disabled={isReadOnly || !fields.bajajDepreciatedValue_isManual || fields.bajajDepreciatedValue_isNA} />
                  </div>
                  <NACheckbox field="bajajDepreciatedValue" />
                </div>
                
              </div>
            </div>
          </div>
        );
      },
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
