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
