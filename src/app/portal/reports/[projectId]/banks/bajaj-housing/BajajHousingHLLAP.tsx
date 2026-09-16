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
    { id: 'bajaj-section-8', title: 'Plot & BAU Area' },
    { id: 'bajaj-section-9', title: 'Valuation' },
    { id: 'bajaj-section-10', title: 'Remarks & Panchayat' },
    { id: 'bajaj-section-11', title: 'Declaration' },
    { id: 'section-11', title: 'Photos' },
    { id: 'section-12', title: 'Maps' },
  ],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7a', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'section-11', 'annexures'],
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

    // Section 8: Plot & BAU Area Details
    bajajPlotEWDoc: '',
    bajajPlotEWDoc_isNA: false,
    bajajPlotEWPlan: '',
    bajajPlotEWPlan_isNA: false,
    bajajPlotEWSite: '',
    bajajPlotEWSite_isNA: false,
    
    bajajPlotNSDoc: '',
    bajajPlotNSDoc_isNA: false,
    bajajPlotNSPlan: '',
    bajajPlotNSPlan_isNA: false,
    bajajPlotNSSite: '',
    bajajPlotNSSite_isNA: false,
    
    bajajLandAreaDoc: '',
    bajajLandAreaDoc_isNA: false,
    bajajLandAreaPlan: '',
    bajajLandAreaPlan_isNA: false,
    bajajLandAreaSite: '',
    bajajLandAreaSite_isNA: false,
    
    bajajBAUAreaFloors: [] as { floor: string; rooms: string; kitchens: string; bathrooms: string; sanctionedUsage: string; sanctionedUsageCustom: string; actualUsage: string; actualUsageCustom: string; rooms_isManual: boolean; kitchens_isManual: boolean; bathrooms_isManual: boolean }[],
    
    bajajPermissiblePlan: '',
    bajajPermissiblePlan_isNA: false,
    
    bajajLandComponent: '',
    bajajLandComponent_isNA: false,
    bajajLandComponent_isManual: false,
    
    bajajPermissibleFSI: '',
    bajajPermissibleFSI_isNA: false,
    
    bajajPermissibleConstruction: '',
    bajajPermissibleConstruction_isNA: false,
    bajajPermissibleConstruction_isManual: false,
    
    bajajCarpetAreaDoc: '',
    bajajCarpetAreaDoc_isNA: false,
    
    bajajActualConstruction: '',
    bajajActualConstruction_isNA: false,
    bajajActualConstruction_isManual: false,

    bajajRiskOfDemolition: '',
    bajajRiskOfDemolition_isNA: false,
    bajajRiskOfDemolitionCustom: '',

    bajajStatusOfProperty: '',
    bajajStatusOfProperty_isNA: false,
    bajajStatusOfPropertyCustom: '',

    bajajPropertyCompletedPercent: '',
    bajajPropertyCompletedPercent_isNA: false,
    bajajPropertyCompletedPercent_isManual: false,

    bajajPropertyRecommendedPercent: '',
    bajajPropertyRecommendedPercent_isNA: false,
    bajajPropertyRecommendedPercent_isManual: false,

    bajajCurrentAgeInYear: '',
    bajajCurrentAgeInYear_isNA: false,

    bajajResidualAge: '',
    bajajResidualAge_isNA: false,
    bajajResidualAge_isManual: false,

    // Section 9: Property Status & Valuation Details
    bajajValuationLandArea: '',
    bajajValuationLandArea_isNA: false,
    bajajValuationLandArea_isManual: false,
    bajajValuationLandRate: '',
    bajajValuationLandRate_isNA: false,
    
    bajajValuationBUAArea: '',
    bajajValuationBUAArea_isNA: false,
    bajajValuationBUAArea_isManual: false,
    bajajValuationBUARate: '',
    bajajValuationBUARate_isNA: false,

    bajajValuationCarParkingArea: 'NA',
    bajajValuationCarParkingArea_isNA: false,
    bajajValuationCarParkingRate: '-',
    bajajValuationCarParkingRate_isNA: false,
    bajajValuationCarParkingTotal: 'NA',
    bajajValuationCarParkingTotal_isNA: false,

    bajajAmenitiesOtherCharges: 'NA',
    bajajAmenitiesOtherCharges_isNA: false,

    bajajRealizableValue: '',
    bajajRealizableValue_isNA: false,
    bajajRealizableValue_isManual: false,

    bajajGovernmentValue: 'Rs. 1603/- per sft',
    bajajGovernmentValue_isNA: false,

    bajajDistressedValue: '',
    bajajDistressedValue_isNA: false,
    bajajDistressedValue_isManual: false,

    bajajValuationDoneEarlier: 'NO',
    bajajValuationDoneEarlier_isNA: false,
    bajajValuationDoneEarlierCustom: '',

    bajajValuationMethodology: 'Land & Building Method',
    bajajValuationMethodology_isNA: false,
    bajajValuationMethodologyCustom: '',

    bajajMunicipalDemolitionList: 'No',
    bajajMunicipalDemolitionList_isNA: false,
    bajajMunicipalDemolitionListCustom: '',

    bajajPropertyInNegativeArea: 'No',
    bajajPropertyInNegativeArea_isNA: false,
    bajajPropertyInNegativeAreaCustom: '',

    // Section 10: Remarks & Additional Checks for Panchayat Properties
    bajajRemarksIfAny: '',
    bajajRemarksIfAny_isNA: false,
    bajajRemarksIfAny_isManual: false,

    bajajPanchayatApproachRoad: 'NA',
    bajajPanchayatApproachRoad_isNA: true,
    bajajPanchayatApproachRoadCustom: '',

    bajajPanchayatDevelopment: 'NA',
    bajajPanchayatDevelopment_isNA: true,
    bajajPanchayatDevelopmentCustom: '',

    bajajPanchayatDistanceCityCentre: 'NA',
    bajajPanchayatDistanceCityCentre_isNA: true,

    bajajPanchayatDistanceCorp: 'NA',
    bajajPanchayatDistanceCorp_isNA: true,

    bajajPanchayatElectricity: 'NA',
    bajajPanchayatElectricity_isNA: true,
    bajajPanchayatElectricityCustom: '',

    bajajPanchayatElectricityDistributor: 'NA',
    bajajPanchayatElectricityDistributor_isNA: true,
    bajajPanchayatElectricityDistributorCustom: '',

    bajajPanchayatWaterSupply: 'NA',
    bajajPanchayatWaterSupply_isNA: true,
    bajajPanchayatWaterSupplyCustom: '',

    bajajPanchayatWaterDistributor: 'NA',
    bajajPanchayatWaterDistributor_isNA: true,
    bajajPanchayatWaterDistributorCustom: '',

    bajajPanchayatSewerProvision: 'NA',
    bajajPanchayatSewerProvision_isNA: true,
    bajajPanchayatSewerProvisionCustom: '',

    bajajPanchayatSewerMainConnected: 'NA',
    bajajPanchayatSewerMainConnected_isNA: true,
    bajajPanchayatSewerMainConnectedCustom: '',

    bajajPanchayatDemolitionThreat: 'NA',
    bajajPanchayatDemolitionThreat_isNA: true,
    bajajPanchayatDemolitionThreatCustom: '',

    bajajPanchayatAllNA: false,

    // Section 11: Declaration & Verification
    bajajDeclarationText: 'The final valuation has been concluded basis Land & Building Method approach and rates are cross-verified with the rates prevalent in the nearby localities.\nWe have no direct/indirect interest in the property valued.\nThe information furnished in the report is true and correct to the best of my knowledge.',
    bajajDeclarationText_isNA: false,
    bajajDeclarationText_isManual: false,

    bajajSignatureFile: '',
    bajajSignatureFile_isNA: false,

    bajajSignatureDate: new Date().toISOString().split('T')[0],
    bajajSignatureDate_isNA: false,
    bajajSignatureDate_isManual: false,

    bajajSignaturePlace: 'Bhubaneswar',
    bajajSignaturePlace_isNA: false,
    bajajSignaturePlace_isManual: false,
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

        const renderSelectWithCustomRow = (val: string, customVal: string, onChange: (v: string, c: string) => void, options: string[], dis?: boolean) => {
          return (
            <div>
              <select className="w-full text-[11px] border border-gray-200 rounded px-1 py-1" value={options.includes(val) ? val : (val ? 'Custom' : '')} onChange={e => {
                const nv = e.target.value;
                if (nv === 'Custom') {
                  onChange(nv, customVal);
                } else {
                  onChange(nv, '');
                }
              }} disabled={dis}>
                <option value="">Select</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="Custom">Custom</option>
              </select>
              {(!options.includes(val) && val) || val === 'Custom' ? (
                <input type="text" className="w-full text-[11px] mt-1 border border-gray-200 rounded px-1 py-1" value={customVal || ''} onChange={e => onChange('Custom', e.target.value)} disabled={dis} placeholder="Custom value" />
              ) : null}
            </div>
          );
        };

        // BAU Floors Logic
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

        // Map data from Section 7 Accommodation to initialize BAU floors if empty
        const initialFloors = Array.from({ length: defaultFloorsCount }).map((_, i) => {
          const accFloor = Array.isArray(fields.bajajAccommodationFloors) ? fields.bajajAccommodationFloors[i] : null;
          return {
            floor: accFloor?.floor || (i === 0 ? 'GF' : `F${i}`),
            rooms: accFloor?.bedrooms?.toString() || '',
            kitchens: accFloor?.kitchens?.toString() || '',
            bathrooms: accFloor?.bathrooms?.toString() || '',
            sanctionedUsage: fields.bajajApprovedUsages || '',
            sanctionedUsageCustom: fields.bajajApprovedUsagesCustom || '',
            actualUsage: fields.bajajNatureOfBuilding || '',
            actualUsageCustom: fields.bajajNatureOfBuildingCustom || '',
            rooms_isManual: false,
            kitchens_isManual: false,
            bathrooms_isManual: false
          };
        });

        const bauFloors = Array.isArray(fields.bajajBAUAreaFloors) && fields.bajajBAUAreaFloors.length > 0
          ? fields.bajajBAUAreaFloors
          : initialFloors;

        const handleBAUFloorChange = (idx: number, key: string, val: string) => {
          const updated = [...bauFloors];
          updated[idx] = { ...updated[idx], [key]: val };
          handleChange('bajajBAUAreaFloors', updated);
        };

        const addBAUFloor = () => {
          const updated = [...bauFloors, { 
            floor: '', rooms: '', kitchens: '', bathrooms: '', 
            sanctionedUsage: fields.bajajApprovedUsages || '', sanctionedUsageCustom: fields.bajajApprovedUsagesCustom || '', 
            actualUsage: fields.bajajNatureOfBuilding || '', actualUsageCustom: fields.bajajNatureOfBuildingCustom || '', 
            rooms_isManual: false, kitchens_isManual: false, bathrooms_isManual: false 
          }];
          handleChange('bajajBAUAreaFloors', updated);
        };

        const removeBAUFloor = (idx: number) => {
          const updated = bauFloors.filter((_, i) => i !== idx);
          handleChange('bajajBAUAreaFloors', updated);
        };

        const usageOpts = ['Residential', 'Commercial', 'Industrial', 'Mixed Usages', 'NA'];

        // Actual Construction BUA formatting
        const compileBUAString = () => {
          return "Total BUA=";
        };

        return (
          <div className="animate-fade-in space-y-6">
            
            {/* Plot Area Details */}
            <div className="border border-[#D9F99D] bg-[#F7FEE7] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Plot Area Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-lime-100 text-lime-800">
                      <th className="px-2 py-2 text-left font-semibold border border-lime-200">Plot Area Dimension</th>
                      <th className="px-2 py-2 text-left font-semibold border border-lime-200 w-[28%]">As Per Documents</th>
                      <th className="px-2 py-2 text-left font-semibold border border-lime-200 w-[28%]">As Per Plan</th>
                      <th className="px-2 py-2 text-left font-semibold border border-lime-200 w-[28%]">As Per Site Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-2 py-2 border border-lime-100 font-medium text-gray-700">East to West</td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="text" className={inputCls} value={fields.bajajPlotEWDoc || ''} onChange={e => handleChange('bajajPlotEWDoc', e.target.value)} disabled={isReadOnly || fields.bajajPlotEWDoc_isNA} />
                        <NACheckbox field="bajajPlotEWDoc" />
                      </td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="text" className={inputCls} value={fields.bajajPlotEWPlan || ''} onChange={e => handleChange('bajajPlotEWPlan', e.target.value)} disabled={isReadOnly || fields.bajajPlotEWPlan_isNA} />
                        <NACheckbox field="bajajPlotEWPlan" />
                      </td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="text" className={inputCls} value={fields.bajajPlotEWSite || ''} onChange={e => handleChange('bajajPlotEWSite', e.target.value)} disabled={isReadOnly || fields.bajajPlotEWSite_isNA} />
                        <NACheckbox field="bajajPlotEWSite" />
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-2 py-2 border border-lime-100 font-medium text-gray-700">North to South</td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="text" className={inputCls} value={fields.bajajPlotNSDoc || ''} onChange={e => handleChange('bajajPlotNSDoc', e.target.value)} disabled={isReadOnly || fields.bajajPlotNSDoc_isNA} />
                        <NACheckbox field="bajajPlotNSDoc" />
                      </td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="text" className={inputCls} value={fields.bajajPlotNSPlan || ''} onChange={e => handleChange('bajajPlotNSPlan', e.target.value)} disabled={isReadOnly || fields.bajajPlotNSPlan_isNA} />
                        <NACheckbox field="bajajPlotNSPlan" />
                      </td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="text" className={inputCls} value={fields.bajajPlotNSSite || ''} onChange={e => handleChange('bajajPlotNSSite', e.target.value)} disabled={isReadOnly || fields.bajajPlotNSSite_isNA} />
                        <NACheckbox field="bajajPlotNSSite" />
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-2 py-2 border border-lime-100 font-medium text-gray-700">Land Area (In Sq. Ft.)</td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="number" step="0.01" className={inputCls} value={fields.bajajLandAreaDoc || ''} onChange={e => handleChange('bajajLandAreaDoc', e.target.value)} disabled={isReadOnly || fields.bajajLandAreaDoc_isNA} />
                        <NACheckbox field="bajajLandAreaDoc" />
                      </td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="number" step="0.01" className={inputCls} value={fields.bajajLandAreaPlan || ''} onChange={e => handleChange('bajajLandAreaPlan', e.target.value)} disabled={isReadOnly || fields.bajajLandAreaPlan_isNA} />
                        <NACheckbox field="bajajLandAreaPlan" />
                      </td>
                      <td className="px-2 py-2 border border-lime-100 align-top">
                        <input type="number" step="0.01" className={inputCls} value={fields.bajajLandAreaSite || ''} onChange={e => handleChange('bajajLandAreaSite', e.target.value)} disabled={isReadOnly || fields.bajajLandAreaSite_isNA} />
                        <NACheckbox field="bajajLandAreaSite" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BAU Area Details */}
            <div className="border border-[#99F6E4] bg-[#F0FDFA] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">BAU Area Details</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-teal-100 text-teal-800">
                      <th className="px-2 py-1.5 text-left font-semibold border border-teal-200 whitespace-nowrap">BAU Area Details</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-teal-200">No. of Rooms</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-teal-200">No. of Kitchens</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-teal-200">No. of Bathrooms</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-teal-200 w-[15%]">Sanctioned Usages</th>
                      <th className="px-2 py-1.5 text-left font-semibold border border-teal-200 w-[20%]">Actual Usage (Residential/ Industrial/Commercial/ Mixed Usage)</th>
                      <th className="px-2 py-1.5 text-center font-semibold border border-teal-200 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bauFloors.map((row: any, idx: number) => {
                      const accFloor = Array.isArray(fields.bajajAccommodationFloors) ? fields.bajajAccommodationFloors[idx] : null;
                      return (
                      <tr key={idx} className="bg-white hover:bg-teal-50/50">
                        <td className="px-1 py-1.5 border border-teal-100">
                          <input type="text" className="w-full border border-gray-200 rounded px-1 py-1 font-medium" value={row.floor || ''} onChange={e => handleBAUFloorChange(idx, 'floor', e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="px-1 py-1.5 border border-teal-100 bg-teal-50/30">
                          <div className="flex justify-between items-center mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                const manual = !row.rooms_isManual;
                                handleBAUFloorChange(idx, 'rooms_isManual', manual as any);
                                if (!manual) handleBAUFloorChange(idx, 'rooms', accFloor?.bedrooms?.toString() || '');
                              }}
                              disabled={isReadOnly}
                              className={`relative inline-flex h-3 w-5 items-center rounded-full transition-colors focus:outline-none ${row.rooms_isManual ? 'bg-teal-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${row.rooms_isManual ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <input type="number" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.rooms || ''} onChange={e => handleBAUFloorChange(idx, 'rooms', e.target.value)} disabled={isReadOnly || !row.rooms_isManual} />
                        </td>
                        <td className="px-1 py-1.5 border border-teal-100 bg-teal-50/30">
                          <div className="flex justify-between items-center mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                const manual = !row.kitchens_isManual;
                                handleBAUFloorChange(idx, 'kitchens_isManual', manual as any);
                                if (!manual) handleBAUFloorChange(idx, 'kitchens', accFloor?.kitchens?.toString() || '');
                              }}
                              disabled={isReadOnly}
                              className={`relative inline-flex h-3 w-5 items-center rounded-full transition-colors focus:outline-none ${row.kitchens_isManual ? 'bg-teal-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${row.kitchens_isManual ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <input type="number" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.kitchens || ''} onChange={e => handleBAUFloorChange(idx, 'kitchens', e.target.value)} disabled={isReadOnly || !row.kitchens_isManual} />
                        </td>
                        <td className="px-1 py-1.5 border border-teal-100 bg-teal-50/30">
                          <div className="flex justify-between items-center mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                const manual = !row.bathrooms_isManual;
                                handleBAUFloorChange(idx, 'bathrooms_isManual', manual as any);
                                if (!manual) handleBAUFloorChange(idx, 'bathrooms', accFloor?.bathrooms?.toString() || '');
                              }}
                              disabled={isReadOnly}
                              className={`relative inline-flex h-3 w-5 items-center rounded-full transition-colors focus:outline-none ${row.bathrooms_isManual ? 'bg-teal-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${row.bathrooms_isManual ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <input type="number" min="0" className="w-full border border-gray-200 rounded px-1 py-1" value={row.bathrooms || ''} onChange={e => handleBAUFloorChange(idx, 'bathrooms', e.target.value)} disabled={isReadOnly || !row.bathrooms_isManual} />
                        </td>
                        <td className="px-1 py-1.5 border border-teal-100">
                          {renderSelectWithCustomRow(row.sanctionedUsage, row.sanctionedUsageCustom, (v, c) => {
                            const updated = [...bauFloors];
                            updated[idx].sanctionedUsage = v;
                            updated[idx].sanctionedUsageCustom = c;
                            handleChange('bajajBAUAreaFloors', updated);
                          }, usageOpts, isReadOnly)}
                        </td>
                        <td className="px-1 py-1.5 border border-teal-100">
                          {renderSelectWithCustomRow(row.actualUsage, row.actualUsageCustom, (v, c) => {
                            const updated = [...bauFloors];
                            updated[idx].actualUsage = v;
                            updated[idx].actualUsageCustom = c;
                            handleChange('bajajBAUAreaFloors', updated);
                          }, usageOpts, isReadOnly)}
                        </td>
                        <td className="px-1 py-1.5 border border-teal-100 text-center">
                          <button type="button" onClick={() => removeBAUFloor(idx)} disabled={isReadOnly || bauFloors.length <= 1} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-sm font-bold">✕</button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addBAUFloor} disabled={isReadOnly} className="mt-2 text-[10px] font-semibold text-teal-600 hover:text-teal-800 border border-dashed border-teal-300 rounded-md px-3 py-1 hover:bg-teal-50 transition-colors disabled:opacity-40">
                + Add Floor
              </button>
            </div>

            {/* Items (FSI & Construction Area) */}
            <div className="border border-[#FBCFE8] bg-[#FDF2F8] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Items (FSI & Construction Area)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Permissible area as per plan (In Sq. Ft)</label>
                  <input type="text" className={inputCls} value={fields.bajajPermissiblePlan || ''} onChange={e => handleChange('bajajPermissiblePlan', e.target.value)} disabled={isReadOnly || fields.bajajPermissiblePlan_isNA} />
                  <NACheckbox field="bajajPermissiblePlan" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Land Component (in Sq. Ft)</label>
                    <EditSwitch field="bajajLandComponent" onToggleOff={() => {
                      // Note suffix (e.g. 2003 sqft(as per ROR))
                      handleChange('bajajLandComponent', (fields.bajajLandAreaDoc || '') + (fields.bajajLandAreaDoc ? ' sqft(as per ROR)' : ''));
                    }} />
                  </div>
                  <input type="text" className={inputCls} value={fields.bajajLandComponent || ''} onChange={e => handleChange('bajajLandComponent', e.target.value)} disabled={isReadOnly || !fields.bajajLandComponent_isManual || fields.bajajLandComponent_isNA} />
                  <NACheckbox field="bajajLandComponent" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Permissible FSI</label>
                  <input type="text" className={inputCls} value={fields.bajajPermissibleFSI || ''} onChange={e => {
                    handleChange('bajajPermissibleFSI', e.target.value);
                    if (!fields.bajajPermissibleConstruction_isManual) {
                      const land = parseFloat(fields.bajajLandComponent);
                      const fsi = parseFloat(e.target.value);
                      if (!isNaN(land) && !isNaN(fsi)) {
                        handleChange('bajajPermissibleConstruction', (land * fsi).toFixed(2));
                      } else {
                        handleChange('bajajPermissibleConstruction', '');
                      }
                    }
                  }} disabled={isReadOnly || fields.bajajPermissibleFSI_isNA} />
                  <NACheckbox field="bajajPermissibleFSI" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Permissible construction as per FSI (In Sq. Ft)</label>
                    <EditSwitch field="bajajPermissibleConstruction" onToggleOff={() => {
                      const land = parseFloat(fields.bajajLandComponent);
                      const fsi = parseFloat(fields.bajajPermissibleFSI);
                      handleChange('bajajPermissibleConstruction', (!isNaN(land) && !isNaN(fsi)) ? (land * fsi).toFixed(2) : '');
                    }} />
                  </div>
                  <input type="text" className={inputCls} value={fields.bajajPermissibleConstruction || ''} onChange={e => handleChange('bajajPermissibleConstruction', e.target.value)} disabled={isReadOnly || !fields.bajajPermissibleConstruction_isManual || fields.bajajPermissibleConstruction_isNA} />
                  <NACheckbox field="bajajPermissibleConstruction" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Carpet Area as Per Document</label>
                  <input type="text" className={inputCls} value={fields.bajajCarpetAreaDoc || ''} onChange={e => handleChange('bajajCarpetAreaDoc', e.target.value)} disabled={isReadOnly || fields.bajajCarpetAreaDoc_isNA} />
                  <NACheckbox field="bajajCarpetAreaDoc" />
                </div>

                <div className="lg:col-span-3">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Actual construction (BUA) (In Sq. Ft)</label>
                    <EditSwitch field="bajajActualConstruction" onToggleOff={() => {
                      handleChange('bajajActualConstruction', compileBUAString());
                    }} />
                  </div>
                  <textarea className={inputCls} rows={4} value={fields.bajajActualConstruction || ''} onChange={e => handleChange('bajajActualConstruction', e.target.value)} disabled={isReadOnly || !fields.bajajActualConstruction_isManual || fields.bajajActualConstruction_isNA} placeholder="GF TO SF- 1617sqft each floor,&#10;3rd floor-360sqft&#10;Total BUA=5211sqft" />
                  <NACheckbox field="bajajActualConstruction" />
                </div>

                <div className="lg:col-span-3">
                  <hr className="my-2 border-pink-200" />
                  <h4 className="font-semibold text-sm text-gray-700 mt-2 mb-2">Risk, Status & Age Assessment</h4>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Risk of Demolition (High / Medium / Low)</label>
                  {renderSelectWithCustomRow(fields.bajajRiskOfDemolition, fields.bajajRiskOfDemolitionCustom, (v, c) => {
                    handleChange('bajajRiskOfDemolition', v);
                    handleChange('bajajRiskOfDemolitionCustom', c);
                  }, ['Low', 'Medium', 'High', 'NA'], isReadOnly || fields.bajajRiskOfDemolition_isNA)}
                  <NACheckbox field="bajajRiskOfDemolition" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Status of the Property</label>
                    <EditSwitch field="bajajStatusOfProperty" />
                  </div>
                  {renderSelectWithCustomRow(fields.bajajStatusOfProperty, fields.bajajStatusOfPropertyCustom, (v, c) => {
                    handleChange('bajajStatusOfProperty', v);
                    handleChange('bajajStatusOfPropertyCustom', c);
                    if (v === 'Complete' && !fields.bajajPropertyCompletedPercent_isManual) {
                      handleChange('bajajPropertyCompletedPercent', '100');
                      if (!fields.bajajPropertyRecommendedPercent_isManual) {
                        handleChange('bajajPropertyRecommendedPercent', '100');
                      }
                    }
                  }, ['Complete', 'Under Construction', 'Plot', 'Construction on Hold', 'NA'], isReadOnly || fields.bajajStatusOfProperty_isNA || !fields.bajajStatusOfProperty_isManual)}
                  <NACheckbox field="bajajStatusOfProperty" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">% Completed</label>
                    <EditSwitch field="bajajPropertyCompletedPercent" onToggleOff={() => {
                      if (fields.bajajStatusOfProperty === 'Complete') {
                        handleChange('bajajPropertyCompletedPercent', '100');
                      }
                    }} />
                  </div>
                  <div className="relative">
                    <input type="number" min="0" max="100" step="1" className={`${inputCls} pr-8`} value={fields.bajajPropertyCompletedPercent || ''} onChange={e => {
                      handleChange('bajajPropertyCompletedPercent', e.target.value);
                      if (!fields.bajajPropertyRecommendedPercent_isManual) {
                        handleChange('bajajPropertyRecommendedPercent', e.target.value);
                      }
                    }} disabled={isReadOnly || !fields.bajajPropertyCompletedPercent_isManual || fields.bajajPropertyCompletedPercent_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">%</span>
                  </div>
                  <NACheckbox field="bajajPropertyCompletedPercent" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">% Recommended</label>
                    <EditSwitch field="bajajPropertyRecommendedPercent" onToggleOff={() => {
                      handleChange('bajajPropertyRecommendedPercent', fields.bajajPropertyCompletedPercent);
                    }} />
                  </div>
                  <div className="relative">
                    <input type="number" min="0" max="100" step="1" className={`${inputCls} pr-8`} value={fields.bajajPropertyRecommendedPercent || ''} onChange={e => handleChange('bajajPropertyRecommendedPercent', e.target.value)} disabled={isReadOnly || !fields.bajajPropertyRecommendedPercent_isManual || fields.bajajPropertyRecommendedPercent_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">%</span>
                  </div>
                  <NACheckbox field="bajajPropertyRecommendedPercent" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Age of Property IN YEAR</label>
                  <div className="relative">
                    <input type="number" min="0" max="150" step="1" className={`${inputCls} pr-12`} value={fields.bajajCurrentAgeInYear || ''} onChange={e => {
                      handleChange('bajajCurrentAgeInYear', e.target.value);
                      if (!fields.bajajResidualAge_isManual) {
                        const age = parseFloat(e.target.value);
                        handleChange('bajajResidualAge', isNaN(age) ? '' : Math.max(0, 60 - age).toString());
                      }
                    }} disabled={isReadOnly || fields.bajajCurrentAgeInYear_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Years</span>
                  </div>
                  <NACheckbox field="bajajCurrentAgeInYear" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Residual Age</label>
                    <EditSwitch field="bajajResidualAge" onToggleOff={() => {
                      const age = parseFloat(fields.bajajCurrentAgeInYear);
                      handleChange('bajajResidualAge', isNaN(age) ? '' : Math.max(0, 60 - age).toString());
                    }} />
                  </div>
                  <div className="relative">
                    <input type="number" min="0" max="150" step="1" className={`${inputCls} pr-12`} value={fields.bajajResidualAge || ''} onChange={e => handleChange('bajajResidualAge', e.target.value)} disabled={isReadOnly || !fields.bajajResidualAge_isManual || fields.bajajResidualAge_isNA} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Years</span>
                  </div>
                  <NACheckbox field="bajajResidualAge" />
                </div>
                
              </div>
            </div>

          </div>
        );
      },
    },
    {
      id: 'bajaj-section-9',
      title: 'Property Status & Valuation Details',
      number: 9,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";
        
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

        const renderSelectWithCustomRow = (val: string, customVal: string, onChange: (v: string, c: string) => void, options: string[], dis?: boolean) => {
          return (
            <div>
              <select className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500" value={options.includes(val) ? val : (val ? 'Custom' : '')} onChange={e => {
                const nv = e.target.value;
                if (nv === 'Custom') {
                  onChange(nv, customVal);
                } else {
                  onChange(nv, '');
                }
              }} disabled={dis}>
                <option value="">Select</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="Custom">Custom</option>
              </select>
              {(!options.includes(val) && val) || val === 'Custom' ? (
                <input type="text" className="w-full text-sm mt-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500" value={customVal || ''} onChange={e => onChange('Custom', e.target.value)} disabled={dis} placeholder="Custom value" />
              ) : null}
            </div>
          );
        };

        // Auto-calculation logic for Section 9
        const landArea = parseFloat(fields.bajajValuationLandArea) || 0;
        const landRate = parseFloat(fields.bajajValuationLandRate) || 0;
        const landValue = landArea * landRate;

        const buaArea = parseFloat(fields.bajajValuationBUAArea) || 0;
        const buaRate = parseFloat(fields.bajajValuationBUARate) || 0;
        const buaValue = buaArea * buaRate;

        const formatINR = (num: number) => {
          return new Intl.NumberFormat('en-IN').format(num);
        };

        return (
          <div className="animate-fade-in space-y-6">
            {/* Valuation Matrix */}
            <div className="border border-[#FDE68A] bg-[#FEF3C7] rounded-xl p-4 overflow-x-auto">
              <h3 className="font-bold text-gray-700 mb-4">Valuation Matrix</h3>
              <table className="min-w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-amber-100 text-gray-700">
                    <th className="px-3 py-2 border-b border-amber-200">Items</th>
                    <th className="px-3 py-2 border-b border-amber-200">Area Details in Sq. Ft.</th>
                    <th className="px-3 py-2 border-b border-amber-200">Rate per Sq. Ft.</th>
                    <th className="px-3 py-2 border-b border-amber-200">Total Values in Rupees <span className="text-red-600 font-semibold text-[0.7em] ml-1">[Formula]</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border-b border-amber-100 font-medium">Land Value(As per ROR)</td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <input type="text" className={inputCls} value={fields.bajajValuationLandArea || ''} onChange={e => handleChange('bajajValuationLandArea', e.target.value)} disabled={isReadOnly || !fields.bajajValuationLandArea_isManual || fields.bajajValuationLandArea_isNA} />
                        <EditSwitch field="bajajValuationLandArea" onToggleOff={() => {
                           handleChange('bajajValuationLandArea', fields.bajajLandComponent || '');
                        }} />
                        <NACheckbox field="bajajValuationLandArea" />
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Rs.</span>
                        <input type="number" step="0.01" min="0" className={`${inputCls} pl-8`} value={fields.bajajValuationLandRate || ''} onChange={e => handleChange('bajajValuationLandRate', e.target.value)} disabled={isReadOnly || fields.bajajValuationLandRate_isNA} />
                        <NACheckbox field="bajajValuationLandRate" />
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">RS.</span>
                        <input type="text" className={`${inputCls} pl-8`} value={landValue ? `${formatINR(landValue)}/-` : ''} readOnly title="Formula: Numeric Area × Rate per Sq.Ft = Total Land Value" />
                      </div>
                      <span className="text-red-600 font-semibold text-[0.65em] mt-0.5 block">Area × Rate = Total</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border-b border-amber-100 font-medium">BUA Value (Measured BUA G+3)</td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <input type="text" className={inputCls} value={fields.bajajValuationBUAArea || ''} onChange={e => handleChange('bajajValuationBUAArea', e.target.value)} disabled={isReadOnly || !fields.bajajValuationBUAArea_isManual || fields.bajajValuationBUAArea_isNA} />
                        <EditSwitch field="bajajValuationBUAArea" />
                        <NACheckbox field="bajajValuationBUAArea" />
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Rs.</span>
                        <input type="number" step="0.01" min="0" className={`${inputCls} pl-8`} value={fields.bajajValuationBUARate || ''} onChange={e => handleChange('bajajValuationBUARate', e.target.value)} disabled={isReadOnly || fields.bajajValuationBUARate_isNA} />
                        <NACheckbox field="bajajValuationBUARate" />
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">RS.</span>
                        <input type="text" className={`${inputCls} pl-8`} value={buaValue ? `${formatINR(buaValue)}/-` : ''} readOnly title="Formula: Numeric Area × Rate per Sq.Ft = Total BUA Value" />
                      </div>
                      <span className="text-red-600 font-semibold text-[0.65em] mt-0.5 block">Area × Rate = Total</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border-b border-amber-100 font-medium">Car Parking Charges</td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <input type="text" className={inputCls} value={fields.bajajValuationCarParkingArea || ''} onChange={e => handleChange('bajajValuationCarParkingArea', e.target.value)} disabled={isReadOnly || fields.bajajValuationCarParkingArea_isNA} />
                        <NACheckbox field="bajajValuationCarParkingArea" />
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <input type="text" className={inputCls} value={fields.bajajValuationCarParkingRate || ''} onChange={e => handleChange('bajajValuationCarParkingRate', e.target.value)} disabled={isReadOnly || fields.bajajValuationCarParkingRate_isNA} />
                        <NACheckbox field="bajajValuationCarParkingRate" />
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <input type="text" className={inputCls} value={fields.bajajValuationCarParkingTotal || ''} onChange={e => handleChange('bajajValuationCarParkingTotal', e.target.value)} disabled={isReadOnly || fields.bajajValuationCarParkingTotal_isNA} />
                        <NACheckbox field="bajajValuationCarParkingTotal" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Valuation Summary & Statutory Checks */}
            <div className="border border-[#A7F3D0] bg-[#ECFDF5] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Valuation Summary & Statutory Checks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amenities/Other charges (Lumpsum)</label>
                  <input type="text" className={inputCls} value={fields.bajajAmenitiesOtherCharges || ''} onChange={e => handleChange('bajajAmenitiesOtherCharges', e.target.value)} disabled={isReadOnly || fields.bajajAmenitiesOtherCharges_isNA} />
                  <NACheckbox field="bajajAmenitiesOtherCharges" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Realizable value as on date <span className="text-red-600 font-semibold text-[0.85em] ml-1" title="Land Total + BUA Total + Car Parking + Amenities = Realizable Value">[Formula]</span></label>
                    <EditSwitch field="bajajRealizableValue" onToggleOff={() => {
                      let amenities = parseFloat(fields.bajajAmenitiesOtherCharges) || 0;
                      let cp = parseFloat(fields.bajajValuationCarParkingTotal) || 0;
                      const fmv = landValue + buaValue + cp + amenities;
                      handleChange('bajajRealizableValue', Math.round(fmv).toString());
                    }} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">RS.</span>
                    <input type="number" step="1" className={`${inputCls} pl-9`} value={fields.bajajRealizableValue || ''} onChange={e => handleChange('bajajRealizableValue', e.target.value)} disabled={isReadOnly || !fields.bajajRealizableValue_isManual || fields.bajajRealizableValue_isNA} />
                  </div>
                  <NACheckbox field="bajajRealizableValue" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Government Value</label>
                  <input type="text" className={inputCls} value={fields.bajajGovernmentValue || ''} onChange={e => handleChange('bajajGovernmentValue', e.target.value)} disabled={isReadOnly || fields.bajajGovernmentValue_isNA} />
                  <NACheckbox field="bajajGovernmentValue" />
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-gray-700">Distressed/ Force Value <span className="text-red-600 font-semibold text-[0.85em] ml-1" title="Realizable Value × 0.80 = Distressed Value">[Formula]</span></label>
                    <EditSwitch field="bajajDistressedValue" onToggleOff={() => {
                      const realizable = parseFloat(fields.bajajRealizableValue) || 0;
                      handleChange('bajajDistressedValue', Math.round(realizable * 0.8).toString());
                    }} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">RS.</span>
                    <input type="number" step="1" className={`${inputCls} pl-9`} value={fields.bajajDistressedValue || ''} onChange={e => handleChange('bajajDistressedValue', e.target.value)} disabled={isReadOnly || !fields.bajajDistressedValue_isManual || fields.bajajDistressedValue_isNA} />
                  </div>
                  <NACheckbox field="bajajDistressedValue" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valuation Done Earlier</label>
                  {renderSelectWithCustomRow(fields.bajajValuationDoneEarlier, fields.bajajValuationDoneEarlierCustom, (v, c) => {
                    handleChange('bajajValuationDoneEarlier', v);
                    handleChange('bajajValuationDoneEarlierCustom', c);
                  }, ['YES', 'NO', 'NA'], isReadOnly || fields.bajajValuationDoneEarlier_isNA)}
                  <NACheckbox field="bajajValuationDoneEarlier" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valuation Methodology</label>
                  {renderSelectWithCustomRow(fields.bajajValuationMethodology, fields.bajajValuationMethodologyCustom, (v, c) => {
                    handleChange('bajajValuationMethodology', v);
                    handleChange('bajajValuationMethodologyCustom', c);
                  }, ['Land & Building Method', 'Cost Approach', 'Market Comparison Method', 'Rental Capitalization Method', 'NA'], isReadOnly || fields.bajajValuationMethodology_isNA)}
                  <NACheckbox field="bajajValuationMethodology" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">In Municipal/ Development Authority Demolition List</label>
                  {renderSelectWithCustomRow(fields.bajajMunicipalDemolitionList, fields.bajajMunicipalDemolitionListCustom, (v, c) => {
                    handleChange('bajajMunicipalDemolitionList', v);
                    handleChange('bajajMunicipalDemolitionListCustom', c);
                  }, ['Yes', 'No', 'NA'], isReadOnly || fields.bajajMunicipalDemolitionList_isNA)}
                  <NACheckbox field="bajajMunicipalDemolitionList" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Is Property in Negative Area</label>
                  {renderSelectWithCustomRow(fields.bajajPropertyInNegativeArea, fields.bajajPropertyInNegativeAreaCustom, (v, c) => {
                    handleChange('bajajPropertyInNegativeArea', v);
                    handleChange('bajajPropertyInNegativeAreaCustom', c);
                  }, ['Yes', 'No', 'NA'], isReadOnly || fields.bajajPropertyInNegativeArea_isNA)}
                  <NACheckbox field="bajajPropertyInNegativeArea" />
                </div>

              </div>
            </div>

          </div>
        );
      },
    },
    {
      id: 'bajaj-section-10',
      title: 'Remarks & Additional Checks for Panchayat Properties',
      number: 10,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";
        const selectCls = "w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";
        
        const NACheckbox = ({ field, label = 'Mark as NA' }: { field: string, label?: string }) => (
          <label className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 cursor-pointer w-max">
            <input
              type="checkbox"
              checked={(fields as any)[`${field}_isNA`]}
              onChange={(e) => handleChange(`${field}_isNA`, e.target.checked)}
              disabled={isReadOnly}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            {label}
          </label>
        );

        const EditSwitch = ({ field }: { field: string }) => {
          const isManual = (fields as any)[`${field}_isManual`];
          return (
            <button
              type="button"
              onClick={() => handleChange(`${field}_isManual`, !isManual)}
              disabled={isReadOnly}
              className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                isManual 
                  ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title={isManual ? "Switch to auto-calculated" : "Switch to manual edit"}
            >
              {isManual ? 'Manual (On)' : 'Auto (Off)'}
            </button>
          );
        };

        const renderSelectWithCustom = (
          value: string,
          customValue: string,
          onChange: (val: string, custom: string) => void,
          options: string[],
          disabled: boolean
        ) => (
          <div className="space-y-2">
            <select
              className={selectCls}
              value={options.includes(value) ? value : (value ? 'Custom' : options[0])}
              onChange={e => onChange(e.target.value === 'Custom' ? customValue : e.target.value, customValue)}
              disabled={disabled}
            >
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              <option value="Custom">Custom</option>
            </select>
            {(!options.includes(value) && value) || value === 'Custom' ? (
              <input
                type="text"
                className={inputCls}
                value={customValue}
                onChange={e => onChange('Custom', e.target.value)}
                disabled={disabled}
                placeholder="Enter custom value..."
              />
            ) : null}
          </div>
        );

        // Auto-compile Remarks
        React.useEffect(() => {
          if (!fields.bajajRemarksIfAny_isManual && !fields.bajajRemarksIfAny_isNA) {
            // "Subject property is a {Floor No.} storied {Nature of Building} building having land extent of {Land Area} sqft and, having total measured BUA for {Floor No.} storied building is {Total BUA}sqft. Age of the building is about {Age of Property}-years. All civic amenities are present within 1-2 km from the property. Property is accessible with {Road Width}-feet wide road & surrounding areas are {Surrounding Nature} in nature. Property is coming under {Jurisdiction} limit & it is coming under {Zone} zone. {Occupancy breakdown details}. Valuation has been done for land & measured BUA of {Floor No.} residential building. As approved plan is not provided, it is upto the sole discretion of {Bank/Client Name} to consider the BUA value or not."
            const floorNo = fields.bajajPropertyNoOfFloors || '{Floor No.}';
            const nature = fields.bajajPropertyNatureOfProperty || '{Nature of Building}';
            const landArea = fields.bajajValuationLandArea || '{Land Area}';
            const totalBua = fields.bajajTotalBUA || '{Total BUA}';
            const age = fields.bajajAgeOfProperty || '{Age of Property}';
            const roadWidth = fields.bajajPropertyRoadWidth || '{Road Width}';
            const surrounding = fields.bajajSurroundingNature || '{Surrounding Nature}';
            const jurisdiction = fields.bajajLocationJurisdiction || '{Jurisdiction}';
            const zone = fields.bajajLocationZone || '{Zone}';
            
            const bankName = fields.bankName || 'BAJAJ HOUSING FINANCE LTD';
            let occupancy = fields.bajajPropertyOccupancyStatus || '{Occupancy breakdown details}';
            if (fields.bajajPropertyOccupancyStatus === 'Self Occupied') {
               occupancy = "Property is self occupied by the owner.";
            } else if (fields.bajajPropertyOccupancyStatus === 'Tenanted') {
               occupancy = "Property is tenanted.";
            } else if (fields.bajajPropertyOccupancyStatus === 'Vacant') {
               occupancy = "Property is currently vacant.";
            }

            const autoRemarks = `Subject property is a ${floorNo} storied ${nature} building having land extent of ${landArea} sqft and, having total measured BUA for ${floorNo} storied building is ${totalBua}sqft. Age of the building is about ${age}-years. All civic amenities are present within 1-2 km from the property. Property is accessible with ${roadWidth}-feet wide road & surrounding areas are ${surrounding} in nature. Property is coming under ${jurisdiction} limit & it is coming under ${zone} zone. ${occupancy} Valuation has been done for land & measured BUA of ${floorNo} residential building. As approved plan is not provided, it is upto the sole discretion of ${bankName} to consider the BUA value or not.`;
            
            if (fields.bajajRemarksIfAny !== autoRemarks) {
              handleChange('bajajRemarksIfAny', autoRemarks);
            }
          }
        }, [
          fields.bajajRemarksIfAny_isManual, fields.bajajRemarksIfAny_isNA,
          fields.bajajPropertyNoOfFloors, fields.bajajPropertyNatureOfProperty,
          fields.bajajValuationLandArea, fields.bajajTotalBUA, fields.bajajAgeOfProperty,
          fields.bajajPropertyRoadWidth, fields.bajajSurroundingNature, fields.bajajLocationJurisdiction,
          fields.bajajLocationZone, fields.bajajPropertyOccupancyStatus, fields.bankName
        ]);

        const showPanchayat = fields.bajajLocationJurisdiction === 'Gram Panchayat';

        return (
          <div className="animate-fade-in space-y-6">
            
            {/* General Observations & Remarks */}
            <div className="border border-[#C7D2FE] bg-[#EEF2FF] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">General Observations & Remarks</h3>
                <EditSwitch field="bajajRemarksIfAny" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Remarks If Any <span className="text-red-600 font-semibold text-[0.85em] ml-1" title="Dynamic synthesis from Sections 3, 5, 6, 7, 8, 9 data keys">[Formula / Dynamic Synthesis]</span></label>
                  <textarea 
                    className={inputCls} 
                    rows={6} 
                    value={fields.bajajRemarksIfAny_isNA ? 'NA' : (fields.bajajRemarksIfAny || '')}
                    onChange={e => handleChange('bajajRemarksIfAny', e.target.value)}
                    disabled={isReadOnly || fields.bajajRemarksIfAny_isNA || !fields.bajajRemarksIfAny_isManual}
                    placeholder="Auto-compiled summary..."
                  />
                  <NACheckbox field="bajajRemarksIfAny" />
                </div>
              </div>
            </div>

            {/* Additional checks for Panchayat properties */}
            {showPanchayat && (
              <div className="border border-[#FEF08A] bg-[#FEFCE8] rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">Additional checks for Panchayat properties</h3>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.bajajPanchayatAllNA}
                      onChange={(e) => {
                        const isNA = e.target.checked;
                        handleChange('bajajPanchayatAllNA', isNA);
                        handleChange('bajajPanchayatApproachRoad_isNA', isNA);
                        handleChange('bajajPanchayatDevelopment_isNA', isNA);
                        handleChange('bajajPanchayatDistanceCityCentre_isNA', isNA);
                        handleChange('bajajPanchayatDistanceCorp_isNA', isNA);
                        handleChange('bajajPanchayatElectricity_isNA', isNA);
                        handleChange('bajajPanchayatElectricityDistributor_isNA', isNA);
                        handleChange('bajajPanchayatWaterSupply_isNA', isNA);
                        handleChange('bajajPanchayatWaterDistributor_isNA', isNA);
                        handleChange('bajajPanchayatSewerProvision_isNA', isNA);
                        handleChange('bajajPanchayatSewerMainConnected_isNA', isNA);
                        handleChange('bajajPanchayatDemolitionThreat_isNA', isNA);
                      }}
                      disabled={isReadOnly}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 w-4 h-4"
                    />
                    Mark all as NA
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Approach Road to the property</label>
                    {renderSelectWithCustom(fields.bajajPanchayatApproachRoad, fields.bajajPanchayatApproachRoadCustom, (v, c) => {
                      handleChange('bajajPanchayatApproachRoad', v);
                      handleChange('bajajPanchayatApproachRoadCustom', c);
                    }, ['Pucca', 'Kuccha', 'Concrete', 'Bitumen', 'NA'], isReadOnly || fields.bajajPanchayatApproachRoad_isNA)}
                    <NACheckbox field="bajajPanchayatApproachRoad" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Development of surrounding areas to property</label>
                    {renderSelectWithCustom(fields.bajajPanchayatDevelopment, fields.bajajPanchayatDevelopmentCustom, (v, c) => {
                      handleChange('bajajPanchayatDevelopment', v);
                      handleChange('bajajPanchayatDevelopmentCustom', c);
                    }, ['Developed', 'Under Developed', 'Developing', 'Sparsely Populated', 'NA'], isReadOnly || fields.bajajPanchayatDevelopment_isNA)}
                    <NACheckbox field="bajajPanchayatDevelopment" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Distance from city centre in Kms</label>
                    <input 
                      type="number" step="0.1" 
                      className={inputCls} 
                      value={fields.bajajPanchayatDistanceCityCentre_isNA ? '' : fields.bajajPanchayatDistanceCityCentre} 
                      onChange={e => handleChange('bajajPanchayatDistanceCityCentre', e.target.value)} 
                      disabled={isReadOnly || fields.bajajPanchayatDistanceCityCentre_isNA} 
                    />
                    <NACheckbox field="bajajPanchayatDistanceCityCentre" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Distance from corporation limits in Kms/Bus stop</label>
                    <input 
                      type="text" 
                      className={inputCls} 
                      value={fields.bajajPanchayatDistanceCorp_isNA ? '' : fields.bajajPanchayatDistanceCorp} 
                      onChange={e => handleChange('bajajPanchayatDistanceCorp', e.target.value)} 
                      disabled={isReadOnly || fields.bajajPanchayatDistanceCorp_isNA} 
                    />
                    <NACheckbox field="bajajPanchayatDistanceCorp" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Electricity</label>
                    {renderSelectWithCustom(fields.bajajPanchayatElectricity, fields.bajajPanchayatElectricityCustom, (v, c) => {
                      handleChange('bajajPanchayatElectricity', v);
                      handleChange('bajajPanchayatElectricityCustom', c);
                    }, ['Yes', 'No', 'Available', 'NA'], isReadOnly || fields.bajajPanchayatElectricity_isNA)}
                    <NACheckbox field="bajajPanchayatElectricity" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Electricity Distributor</label>
                    {renderSelectWithCustom(fields.bajajPanchayatElectricityDistributor, fields.bajajPanchayatElectricityDistributorCustom, (v, c) => {
                      handleChange('bajajPanchayatElectricityDistributor', v);
                      handleChange('bajajPanchayatElectricityDistributorCustom', c);
                    }, ['TPCODL', 'TPNODL', 'TPSODL', 'TPWODL', 'State Board', 'NA'], isReadOnly || fields.bajajPanchayatElectricityDistributor_isNA)}
                    <NACheckbox field="bajajPanchayatElectricityDistributor" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Water supply</label>
                    {renderSelectWithCustom(fields.bajajPanchayatWaterSupply, fields.bajajPanchayatWaterSupplyCustom, (v, c) => {
                      handleChange('bajajPanchayatWaterSupply', v);
                      handleChange('bajajPanchayatWaterSupplyCustom', c);
                    }, ['Available', 'Not Available', 'Borewell', 'Municipal Supply', 'NA'], isReadOnly || fields.bajajPanchayatWaterSupply_isNA)}
                    <NACheckbox field="bajajPanchayatWaterSupply" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Water Distributor</label>
                    <input 
                      type="text" 
                      className={inputCls} 
                      value={fields.bajajPanchayatWaterDistributor_isNA ? '' : fields.bajajPanchayatWaterDistributor} 
                      onChange={e => handleChange('bajajPanchayatWaterDistributor', e.target.value)} 
                      disabled={isReadOnly || fields.bajajPanchayatWaterDistributor_isNA} 
                    />
                    <NACheckbox field="bajajPanchayatWaterDistributor" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sewer provision</label>
                    {renderSelectWithCustom(fields.bajajPanchayatSewerProvision, fields.bajajPanchayatSewerProvisionCustom, (v, c) => {
                      handleChange('bajajPanchayatSewerProvision', v);
                      handleChange('bajajPanchayatSewerProvisionCustom', c);
                    }, ['Yes', 'No', 'Septic Tank', 'Open Drain', 'Underground Sewerage', 'NA'], isReadOnly || fields.bajajPanchayatSewerProvision_isNA)}
                    <NACheckbox field="bajajPanchayatSewerProvision" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sewer line connected to main sewer</label>
                    {renderSelectWithCustom(fields.bajajPanchayatSewerMainConnected, fields.bajajPanchayatSewerMainConnectedCustom, (v, c) => {
                      handleChange('bajajPanchayatSewerMainConnected', v);
                      handleChange('bajajPanchayatSewerMainConnectedCustom', c);
                    }, ['Yes', 'No', 'NA'], isReadOnly || fields.bajajPanchayatSewerMainConnected_isNA)}
                    <NACheckbox field="bajajPanchayatSewerMainConnected" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Any demolition threat in future development/ expansion</label>
                    {renderSelectWithCustom(fields.bajajPanchayatDemolitionThreat, fields.bajajPanchayatDemolitionThreatCustom, (v, c) => {
                      handleChange('bajajPanchayatDemolitionThreat', v);
                      handleChange('bajajPanchayatDemolitionThreatCustom', c);
                    }, ['No', 'Yes', 'NA'], isReadOnly || fields.bajajPanchayatDemolitionThreat_isNA)}
                    <NACheckbox field="bajajPanchayatDemolitionThreat" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'bajaj-section-11',
      title: 'Declaration & Verification',
      number: 11,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";
        
        const NACheckbox = ({ field, label = 'Mark as NA' }: { field: string, label?: string }) => (
          <label className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 cursor-pointer w-max">
            <input
              type="checkbox"
              checked={(fields as any)[`${field}_isNA`]}
              onChange={(e) => handleChange(`${field}_isNA`, e.target.checked)}
              disabled={isReadOnly}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            {label}
          </label>
        );

        const EditSwitch = ({ field }: { field: string }) => {
          const isManual = (fields as any)[`${field}_isManual`];
          return (
            <button
              type="button"
              onClick={() => handleChange(`${field}_isManual`, !isManual)}
              disabled={isReadOnly}
              className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                isManual 
                  ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title={isManual ? "Switch to manual edit" : "Switch to auto-calculated"}
            >
              {isManual ? 'Manual (On)' : 'Auto (Off)'}
            </button>
          );
        };

        // Auto-compile Declaration based on Valuation Methodology
        React.useEffect(() => {
          if (!fields.bajajDeclarationText_isManual && !fields.bajajDeclarationText_isNA) {
            const methodologyRaw = fields.bajajValuationMethodology === 'Custom' ? fields.bajajValuationMethodologyCustom : fields.bajajValuationMethodology;
            const methodology = methodologyRaw || 'Land & Building Method';
            
            const autoDec = `The final valuation has been concluded basis ${methodology} approach and rates are cross-verified with the rates prevalent in the nearby localities.\nWe have no direct/indirect interest in the property valued.\nThe information furnished in the report is true and correct to the best of my knowledge.`;
            
            if (fields.bajajDeclarationText !== autoDec) {
              handleChange('bajajDeclarationText', autoDec);
            }
          }
        }, [
          fields.bajajDeclarationText_isManual, fields.bajajDeclarationText_isNA,
          fields.bajajValuationMethodology, fields.bajajValuationMethodologyCustom
        ]);

        // Auto-fill Place from District/Jurisdiction
        React.useEffect(() => {
          if (!fields.bajajSignaturePlace_isManual && !fields.bajajSignaturePlace_isNA) {
            const place = fields.bajajLocationDistrict || fields.bajajLocationJurisdiction || 'Bhubaneswar';
            if (fields.bajajSignaturePlace !== place) {
              handleChange('bajajSignaturePlace', place);
            }
          }
        }, [
          fields.bajajSignaturePlace_isManual, fields.bajajSignaturePlace_isNA,
          fields.bajajLocationDistrict, fields.bajajLocationJurisdiction
        ]);

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-[#EAD9D0] bg-[#FBF7F5] rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4">Declaration & Verification</h3>
              <div className="space-y-4">
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700">Declaration (I hereby declare that)</label>
                    <EditSwitch field="bajajDeclarationText" />
                  </div>
                  <textarea 
                    className={inputCls} 
                    rows={5} 
                    value={fields.bajajDeclarationText_isNA ? 'NA' : (fields.bajajDeclarationText || '')}
                    onChange={e => handleChange('bajajDeclarationText', e.target.value)}
                    disabled={isReadOnly || fields.bajajDeclarationText_isNA || !fields.bajajDeclarationText_isManual}
                  />
                  <NACheckbox field="bajajDeclarationText" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">For Seal with Signature</label>
                  <input 
                    type="file" accept="image/*,.pdf"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isReadOnly || fields.bajajSignatureFile_isNA}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Upload digital signature/seal.</p>
                  <NACheckbox field="bajajSignatureFile" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-700">Date</label>
                      <EditSwitch field="bajajSignatureDate" />
                    </div>
                    <input 
                      type="date" 
                      className={inputCls} 
                      value={fields.bajajSignatureDate_isNA ? '' : (fields.bajajSignatureDate || '')}
                      onChange={e => handleChange('bajajSignatureDate', e.target.value)}
                      disabled={isReadOnly || fields.bajajSignatureDate_isNA || !fields.bajajSignatureDate_isManual}
                    />
                    <NACheckbox field="bajajSignatureDate" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-700">Place</label>
                      <EditSwitch field="bajajSignaturePlace" />
                    </div>
                    <input 
                      type="text" 
                      className={inputCls} 
                      value={fields.bajajSignaturePlace_isNA ? 'NA' : (fields.bajajSignaturePlace || '')}
                      onChange={e => handleChange('bajajSignaturePlace', e.target.value)}
                      disabled={isReadOnly || fields.bajajSignaturePlace_isNA || !fields.bajajSignaturePlace_isManual}
                    />
                    <NACheckbox field="bajajSignaturePlace" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      },
    },
  ],
  getPDFRenderer: (fields) => {
    return new PDFBajajHousingRenderer(fields);
  },
};

export default function BajajHousingHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={BAJAJ_HOUSING_HLLAP_CONFIG} {...props} />;
}
