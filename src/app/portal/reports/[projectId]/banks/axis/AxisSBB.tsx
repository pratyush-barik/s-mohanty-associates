'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFAxisSBBRenderer } from '@/lib/banks/pdf-axis-sbb-renderer';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';

export const AXIS_SBB_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'SBB',
  displayName: 'Axis Bank — SBB (Small Business Banking)',
  hiddenSections: [
    'section-1', 'section-1a', 'section-2', 'section-3', 'section-4', 'section-5',
    'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10',
    'layout-config'
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo', 'bankName', 'branchName'],
  hideDefaultDeclarationAndCertificate: true,
  navSections: [
    { id: 'section-cover', title: '1. Header & Bank Details' },
    { id: 'axis-sbb-section-2', title: '2. Purpose & Schedule' },
    { id: 'axis-sbb-section-3', title: '3. Location & Address' },
    { id: 'axis-sbb-section-4', title: '4. Title & Legal Docs' },
    { id: 'axis-sbb-section-5', title: '5. Surroundings & Infra' },
    { id: 'axis-sbb-section-6', title: '6. Boundaries & Access' },
    { id: 'axis-sbb-section-7', title: '7. Structure & Approvals' },
    { id: 'axis-sbb-section-8', title: '8. Floor Break Up' },
    { id: 'axis-sbb-section-9', title: '9. Valuation Engine' },
    { id: 'axis-sbb-section-10', title: '10. Remarks & Undertaking' },
    { id: 'section-11', title: 'Photos' },
    { id: 'section-12', title: 'Maps' },
    { id: 'annexures', title: 'Annextures' },
  ],
  fieldLabels: {
    'section-11-title': '11. PROPERTY PHOTOGRAPHS',
    'section-12-title': '12. LOCATION & SKECTH MAP OR MAPS',
    'annexures-title': '13. DOCUMENTS AND ANNEXTURE'
  },
  cadastralMapLabelOverride: 'Benchmark',
  defaultValues: {
    axisSbbDeedNumberDate: '',
    axisSbbDeedNumberDateIsNA: false,
    axisSbbDeedNumberDateEditOn: false,
    axisSbbPlotKhasraNo: '',
    axisSbbPlotKhasraNoIsNA: false,
    axisSbbPlotKhasraNoEditOn: false,
    axisSbbRoadWidthMaterial: '',
    axisSbbRoadWidthMaterialIsNA: false,
    axisSbbColonySector: '',
    axisSbbColonySectorIsNA: false,
    axisSbbLocalityLandmark: '',
    axisSbbLocalityLandmarkIsNA: false,
    axisSbbVillageCity: '',
    axisSbbVillageCityIsNA: false,
    axisSbbVillageCityEditOn: false,
    axisSbbDistrict: '',
    axisSbbDistrictIsNA: false,
    axisSbbDistrictEditOn: false,
    axisSbbDistrictDropdown: '',
    axisSbbState: 'ODISHA',
    axisSbbStateIsNA: false,
    axisSbbStateEditOn: false,
    axisSbbStateDropdown: 'ODISHA',
    axisSbbPinCode: '',
    axisSbbPinCodeIsNA: false,
    axisSbbPinCodeEditOn: false,
    axisSbbDistanceFromCityCenter: '',
    axisSbbDistanceFromCityCenterIsNA: false,
    axisSbbDistanceFromCityCenterEditOn: false,
    axisSbbDistanceKm: '',
    
    // SECTION 5
    axisSbbPropertyType: [],
    axisSbbPropertyTypeIsNA: false,
    axisSbbLevelOfLand: '',
    axisSbbLevelOfLandIsNA: false,
    axisSbbLevelOfLandEditOn: false,
    axisSbbLevelOfLandDropdown: '',
    axisSbbAnyConstructionObserved: '',
    axisSbbAnyConstructionObservedIsNA: false,
    axisSbbPercentOfConstruction: '',
    axisSbbPercentOfConstructionIsNA: false,
    axisSbbPercentOfConstructionEditOn: false,
    axisSbbVacantLandDemarcated: '',
    axisSbbVacantLandDemarcatedIsNA: false,
    axisSbbResidentialProperty: [],
    axisSbbResidentialPropertyIsNA: false,
    axisSbbCommercialIndustrialProperty: [],
    axisSbbCommercialIndustrialPropertyIsNA: false,
    
    axisSbbCivicAmenities: '',
    axisSbbCivicAmenitiesIsNA: false,
    axisSbbCivicAmenitiesEditOn: false,
    axisSbbLocalTransport: [],
    axisSbbLocalTransportIsNA: false,
    axisSbbDistRailwayStationKm: '03',
    axisSbbDistRailwayStationName: '',
    axisSbbDistRailwayStation: '',
    axisSbbDistRailwayStationIsNA: false,
    axisSbbDistRailwayStationEditOn: false,
    axisSbbDistBusStopKm: '03',
    axisSbbDistBusStopName: '',
    axisSbbDistBusStop: '',
    axisSbbDistBusStopIsNA: false,
    axisSbbDistBusStopEditOn: false,

    // SECTION 6
    axisSbbApproachRoadSmall: '',
    axisSbbApproachRoadSmallIsNA: false,
    axisSbbApproachRoadRemark: '',
    axisSbbApproachRoadRemarkIsNA: false,
    axisSbbApproachRoadRemarkEditOn: false,
    axisSbbFireExtinguisher: 'YES',
    axisSbbFireExtinguisherIsNA: false,
    axisSbbFireExtinguisherEditOn: false,
    axisSbbLandLockedArea: 'NO',
    axisSbbLandLockedAreaIsNA: false,
    axisSbbLandLockedAreaEditOn: false,
    axisSbbCommunityDominatedArea: 'NO',
    axisSbbCommunityDominatedAreaIsNA: false,
    axisSbbCommunityDominatedAreaEditOn: false,
    axisSbbBoundariesMatchDocument: 'YES',
    axisSbbBoundariesMatchDocumentIsNA: false,
    axisSbbBoundariesMatchDocumentEditOn: false,

    axisSbbNorthAsPerDeed: '',
    axisSbbNorthAsPerDeedIsNA: false,
    axisSbbNorthAsPerActual: '',
    axisSbbNorthAsPerActualIsNA: false,
    axisSbbNorthEditOn: false,
    axisSbbSouthAsPerDeed: '',
    axisSbbSouthAsPerDeedIsNA: false,
    axisSbbSouthAsPerActual: '',
    axisSbbSouthAsPerActualIsNA: false,
    axisSbbSouthEditOn: false,
    axisSbbEastAsPerDeed: '',
    axisSbbEastAsPerDeedIsNA: false,
    axisSbbEastAsPerActual: '',
    axisSbbEastAsPerActualIsNA: false,
    axisSbbEastEditOn: false,
    axisSbbWestAsPerDeed: '',
    axisSbbWestAsPerDeedIsNA: false,
    axisSbbWestAsPerActual: '',
    axisSbbWestAsPerActualIsNA: false,
    axisSbbWestEditOn: false,

    axisSbbPlotAreaAsPerDocument: '',
    axisSbbPlotAreaAsPerDocumentIsNA: false,
    axisSbbPlotAreaAsPerDocumentEditOn: false,
    axisSbbPlotAreaSqft: '',
    axisSbbPlotAreaAcres: '',
    axisSbbPlotAreaAsPerSaleDeed: '',
    axisSbbPlotAreaAsPerSaleDeedIsNA: false,
    axisSbbPlotAreaAsPerSaleDeedEditOn: false,
    axisSbbClassOfLocality: '',
    axisSbbClassOfLocalityIsNA: false,
    axisSbbQualityOfInfrastructure: '',
    axisSbbQualityOfInfrastructureIsNA: false,
    axisSbbOwnershipStatus: '',
    axisSbbOwnershipStatusIsNA: false,
    axisSbbOwnershipStatusSpecify: '',
    axisSbbApprovedUsage: '',
    axisSbbApprovedUsageIsNA: false,
    axisSbbActualUsage: '',
    axisSbbActualUsageIsNA: false,
    axisSbbRestrictiveCovenants: '',
    axisSbbRestrictiveCovenantsIsNA: false,

    // SECTION 7
    axisSbbTypeOfStructureGCI: false,
    axisSbbTypeOfStructureTinShed: false,
    axisSbbTypeOfStructureRCC: true,
    axisSbbTypeOfStructureAluform: false,
    axisSbbTypeOfStructureIsNA: false,
    axisSbbTypeOfStructureEditOn: false,

    axisSbbNoOfFloors: 'G+1',
    axisSbbNoOfFloorsIsNA: false,
    axisSbbNoOfFloorsEditOn: false,
    
    axisSbbOccupancyDetails: 'SELF-OCCUPIED',
    axisSbbOccupancyDetailsIsNA: false,
    axisSbbOccupancyDetailsEditOn: false,
    
    axisSbbPropertyOnRent: 'NO',
    axisSbbPropertyOnRentIsNA: false,
    axisSbbPropertyOnRentEditOn: false,

    axisSbbNumberOfTenantsDetails: 'NA',
    axisSbbNumberOfTenantsDetailsIsNA: false,
    axisSbbNumberOfTenantsDetailsEditOn: false,

    axisSbbNameOfTenantLease: 'NA',
    axisSbbNameOfTenantLeaseIsNA: false,
    axisSbbNameOfTenantLeaseEditOn: false,

    axisSbbYearsInTenancy: 'NA',
    axisSbbYearsInTenancyIsNA: false,
    axisSbbYearsInTenancyEditOn: false,

    axisSbbResistanceForValuation: 'NO',
    axisSbbResistanceForValuationIsNA: false,
    axisSbbResistanceForValuationEditOn: false,

    axisSbbResistanceFromOccupants: 'NO',
    axisSbbResistanceFromOccupantsIsNA: false,
    axisSbbResistanceFromOccupantsEditOn: false,

    axisSbbBasicAmenitiesElectricity: true,
    axisSbbBasicAmenitiesWater: true,
    axisSbbBasicAmenitiesDrainage: false,
    axisSbbBasicAmenitiesIsNA: false,
    axisSbbBasicAmenitiesEditOn: false,

    axisSbbDevelopmentSurroundingArea: 'DEVELOPING',
    axisSbbDevelopmentSurroundingAreaIsNA: false,
    axisSbbDevelopmentSurroundingAreaEditOn: false,

    axisSbbLayoutApprovalNumber: 'NA',
    axisSbbLayoutApprovalNumberIsNA: false,
    axisSbbLayoutApprovalNumberEditOn: false,
    
    axisSbbLayoutApprovalDate: 'NOT PROVIDED',
    axisSbbLayoutApprovalDateIsNA: false,
    axisSbbLayoutApprovalDateEditOn: false,
    
    axisSbbLayoutExpiryDate: 'NOT PROVIDED',
    axisSbbLayoutExpiryDateIsNA: false,
    axisSbbLayoutExpiryDateEditOn: false,
    
    axisSbbBuildingPlanApprovalNumber: 'NA',
    axisSbbBuildingPlanApprovalNumberIsNA: false,
    axisSbbBuildingPlanApprovalNumberEditOn: false,

    axisSbbBuildingPlanApprovalDate: 'NOT PROVIDED',
    axisSbbBuildingPlanApprovalDateIsNA: false,
    axisSbbBuildingPlanApprovalDateEditOn: false,

    axisSbbBuildingPlanExpiryDate: 'NOT PROVIDED',
    axisSbbBuildingPlanExpiryDateIsNA: false,
    axisSbbBuildingPlanExpiryDateEditOn: false,

    axisSbbAreaOfThePlot: '',
    axisSbbAreaOfThePlotIsNA: false,
    axisSbbAreaOfThePlotEditOn: false,

    axisSbbApprovedBuiltUpArea: '',
    axisSbbApprovedBuiltUpAreaIsNA: false,
    axisSbbApprovedBuiltUpAreaEditOn: false,

    axisSbbDemarcationAtSite: 'YES',
    axisSbbDemarcationAtSiteIsNA: false,
    axisSbbDemarcationAtSiteEditOn: false,

    // SECTION 8
    axisSbbFloorData: JSON.stringify([
      { id: "1", floorName: "GROUND FLOOR RCC", constructedArea: null, constructedAreaIsNA: false, approvedArea: null, approvedAreaIsNA: true, permissibleArea: null, permissibleAreaIsNA: true, valuationArea: null, valuationAreaIsNA: false, accommodation: "", accommodationIsNA: true, usageStorage: false, usageParking: false, usageCommercial: false, usageResidential: false, usageIndustry: false },
      { id: "2", floorName: "1ST FLOOR* (RCC)", constructedArea: null, constructedAreaIsNA: false, approvedArea: null, approvedAreaIsNA: true, permissibleArea: null, permissibleAreaIsNA: true, valuationArea: null, valuationAreaIsNA: false, accommodation: "", accommodationIsNA: true, usageStorage: false, usageParking: false, usageCommercial: false, usageResidential: false, usageIndustry: false }
    ]),
    axisSbbTotalConstructedArea: '0 SQFT',
    axisSbbTotalConstructedAreaEditOn: false,
    axisSbbTotalValuationArea: '0 SQFT',
    axisSbbTotalValuationAreaEditOn: false,
    axisSbbTotalCarpetArea: '0 SQFT',
    axisSbbTotalCarpetAreaEditOn: false,
    axisSbbTotalSaleableArea: '0 SQFT',
    axisSbbTotalSaleableAreaEditOn: false,

    axisSbbConstructionAsPerApprovedPlan: 'NOT APPLICABLE BYE LAWS',
    axisSbbConstructionAsPerApprovedPlanIsNA: false,

    axisSbbFSIAsPerPlan: 'NA',
    axisSbbFSIAsPerPlanIsNA: false,
    axisSbbFSIAsPerPlanEditOn: false,

    axisSbbExtraConstructionDetails: 'NA',
    axisSbbExtraConstructionDetailsIsNA: false,
    axisSbbExtraConstructionDetailsEditOn: false,

    axisSbbExtraConstructionPercentage: 'NA',
    axisSbbExtraConstructionPercentageIsNA: false,
    axisSbbExtraConstructionPercentageEditOn: false,

    axisSbbCompoundable: 'NA',
    axisSbbCompoundableIsCustom: false,
    axisSbbCompoundableEditOn: false,

    axisSbbQualityOfConstruction: '',
    axisSbbQualityOfConstructionIsNA: false,
    axisSbbQualityOfConstructionEditOn: false,
    axisSbbQualityOfConstructionRoofRCC: true,
    axisSbbQualityOfConstructionRoofPatti: false,
    axisSbbQualityOfConstructionRoofTinShed: true,
    axisSbbQualityOfConstructionRoofClayTiles: false,
    axisSbbQualityOfConstructionFloorTiles: true,
    axisSbbQualityOfConstructionFloorMarble: false,
    axisSbbQualityOfConstructionFloorKotaStone: false,
    axisSbbQualityOfConstructionFloorLocalStone: false,
    axisSbbQualityOfConstructionFloorCC: false,

    axisSbbMaintenanceOfProperty: 'GOOD',
    axisSbbMaintenanceOfPropertyIsCustom: false,
    axisSbbMaintenanceOfPropertyEditOn: false,

    axisSbbCurrentLifeOfStructure: '25-YEARS',
    axisSbbCurrentLifeOfStructureIsNA: false,
    axisSbbCurrentLifeOfStructureEditOn: false,

    axisSbbProjectedLifeOfStructure: '35-YEARS',
    axisSbbProjectedLifeOfStructureIsNA: false,
    axisSbbProjectedLifeOfStructureEditOn: false,

    axisSbbPropertyLocation: '',
    axisSbbGoverningBody: '',
    axisSbbTownPlanningSubType: '',
    axisSbbDocPrevValuation: false,
    axisSbbDocApprovedLayout: false,
    axisSbbDocCommencement: false,
    axisSbbDocApprovedBuildingPlan: false,
    axisSbbDocSaleDeed: false,
    axisSbbDocOccupancy: false,
    axisSbbDocPartitionDeed: false,
    axisSbbDocSketchMap: false,
    axisSbbReportRefNo: '',
    axisSbbReportInitiatedBy: '',
    axisSbbAreaName: '',
    axisSbbOwnerName: '',
    axisSbbCustomerName: '',
    axisSbbDateOfVisit: '',
    axisSbbDateOfReport: '',
    axisSbbSaleDeedDiscretions: '',
    axisSbbPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    axisSbbAddressOfTheProperty: '',
    axisSbbPresentMarketValue: '',
    axisSbbDistressSaleValue: '',
    axisSbbEnableCoverPageValueEdit: false,
    axisSbbPurposeOfValuationDropdown: 'default',
    axisSbbPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    axisSbbPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    axisSbbPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    axisSbbPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    axisSbbPreparedByStreet: 'Shiv Nagar Tankapani Road',
    axisSbbPreparedByCity: 'Bhubaneswar',
    axisSbbPreparedByState: 'Odisha',
    axisSbbPreparedByPinCode: '751018',
    axisSbbPreparedByPhone: '06742381145',
    axisSbbPreparedByMobile: '9937023855/9437074855',

    // SECTION 9
    axisSbbValuationLandArea: '',
    axisSbbValuationLandAreaIsNA: false,
    axisSbbValuationLandAreaEditOn: false,
    axisSbbValuationLandRate: '',
    axisSbbValuationLandRateIsNA: false,
    axisSbbValuationLandAmount: '',
    axisSbbValuationLandAmountIsNA: false,
    axisSbbValuationLandAmountEditOn: false,
    axisSbbValuationBuildingItemDescription: 'Building G+1',
    axisSbbValuationBuildingFarLabel: '',
    axisSbbValuationBuildingArea: '',
    axisSbbValuationBuildingAreaIsNA: false,
    axisSbbValuationBuildingAreaEditOn: false,
    axisSbbValuationBuildingRate: '',
    axisSbbValuationBuildingRateIsNA: false,
    axisSbbValuationBuildingAmount: '',
    axisSbbValuationBuildingAmountIsNA: false,
    axisSbbValuationBuildingAmountEditOn: false,
    axisSbbValuationAmenitiesArea: '',
    axisSbbValuationAmenitiesAreaIsNA: false,
    axisSbbValuationAmenitiesRate: '',
    axisSbbValuationAmenitiesRateIsNA: false,
    axisSbbValuationAmenitiesAmount: '',
    axisSbbValuationAmenitiesAmountIsNA: false,
    axisSbbValuationTotalAmount: '',
    axisSbbValuationTotalAmountIsNA: false,
    axisSbbValuationTotalAmountEditOn: false,
    axisSbbValuationTotalSayAmount: '',
    axisSbbValuationTotalSayAmountIsNA: false,
    axisSbbValuationTotalSayAmountEditOn: false,

    axisSbbGovtLandArea: '',
    axisSbbGovtLandAreaIsNA: false,
    axisSbbGovtLandAreaEditOn: false,
    axisSbbGovtLandRate: '',
    axisSbbGovtLandRateIsNA: false,
    axisSbbGovtLandAmount: '',
    axisSbbGovtLandAmountIsNA: false,
    axisSbbGovtLandAmountEditOn: false,
    axisSbbGovtBuildingArea: '',
    axisSbbGovtBuildingAreaIsNA: false,
    axisSbbGovtBuildingAreaEditOn: false,
    axisSbbGovtBuildingRate: '',
    axisSbbGovtBuildingRateIsNA: false,
    axisSbbGovtBuildingAmount: '',
    axisSbbGovtBuildingAmountIsNA: false,
    axisSbbGovtBuildingAmountEditOn: false,

    axisSbbFinalMarketValue: '',
    axisSbbFinalMarketValueIsNA: false,
    axisSbbFinalMarketValueEditOn: false,
    axisSbbFinalDistressValue: '',
    axisSbbFinalDistressValueIsNA: false,
    axisSbbFinalDistressValueEditOn: false,
    axisSbbFinalRealizableValue: '',
    axisSbbFinalRealizableValueIsNA: false,
    axisSbbFinalRealizableValueEditOn: false,
    axisSbbFinalInsurableValue: '',
    axisSbbFinalInsurableValueIsNA: false,
    axisSbbFinalInsurableValueEditOn: false,
    
    // Section 10
    axisSbbRemarks: '',
    axisSbbRemarksIsNA: false,
    axisSbbRemarksEditOn: false,
    axisSbbRemarksNote: 'THE TIN-SHEET ROOF GODOWN HAS NOT BEEN CONSIDERED FOR VALUATION, AS IT IS A TEMPORARY STRUCTURE',
    axisSbbRemarksNoteIsNA: false,
    axisSbbUndertakingIsNA: false,
    axisSbbUndertakingClause1: true,
    axisSbbUndertakingClause2: true,
    axisSbbUndertakingClause3: true,
    axisSbbUndertakingClause4: true,
    axisSbbUndertakingClause5: true,
    axisSbbUndertakingClause6: true,
    axisSbbUndertakingClause7: true,
  },
  extraSectionsStart: [
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => (
        <div className="animate-fade-in space-y-6">
          <div className="border border-blue-200 bg-[#f8fafc] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('axisSbbPropertyOwners', [...(fields.axisSbbPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.axisSbbPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="RELATIONSHIP" className="w-40">
                    <select
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      <option value="">Select</option>
                      <option value="S/O">S/O</option>
                      <option value="D/O">D/O</option>
                      <option value="W/O">W/O</option>
                      <option value="C/O">C/O</option>
                    </select>
                  </Field>
                  <Field label="OWNER'S RELATIVE'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.relativeName || owner.fatherName || ''}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.axisSbbPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.axisSbbPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="ADDRESS OF THE PROPERTY">
              <textarea className={inputCls} rows={3} value={fields.axisSbbAddressOfTheProperty || ''} onChange={e => handleChange('axisSbbAddressOfTheProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('axisSbbEnableCoverPageValueEdit', !fields.axisSbbEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.axisSbbEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.axisSbbEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.axisSbbEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.axisSbbEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: ROUND(Total Valuation 100% Completion (I+II), -3) = PRESENT MARKET VALUE]</span></span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbPresentMarketValue || '') : (() => {
                      const v = Number(fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
                      if (v > 0) return (Math.round(v / 1000) * 1000).toFixed(2);
                      return '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbPresentMarketValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Current Value of Property from Section 9</span>
                </div>
              </div>
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: ROUND(PRESENT MARKET VALUE * 0.90, -3) = DISTRESS SALE VALUE]</span></span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbDistressSaleValue || '') : (() => {
                      const baseV = Number(fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
                      const pmv = baseV > 0 ? Math.round(baseV / 1000) * 1000 : 0;
                      return pmv > 0 ? (Math.round((pmv * 0.90) / 1000) * 1000).toFixed(2) : '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbDistressSaleValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Calculated instantly based on PRESENT MARKET VALUE</span>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">REALIZABLE VALUE <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: ROUND(PRESENT MARKET VALUE * 0.95, -3) = REALIZABLE VALUE]</span></span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbRealizableValue || '') : (() => {
                      const baseV = Number(fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
                      const pmv = baseV > 0 ? Math.round(baseV / 1000) * 1000 : 0;
                      return pmv > 0 ? (Math.round((pmv * 0.95) / 1000) * 1000).toFixed(2) : '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbRealizableValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Calculated instantly based on PRESENT MARKET VALUE</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.axisSbbPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('axisSbbPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('axisSbbPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else if (val === 'present_market_value') {
                    handleChange('axisSbbPurposeOfValuation', 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY');
                  } else {
                    handleChange('axisSbbPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="present_market_value">TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.axisSbbPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.axisSbbPurposeOfValuation || ''} onChange={(e) => handleChange('axisSbbPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.axisSbbPreparedByCompany || ''} onChange={e => handleChange('axisSbbPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.axisSbbPreparedByDesignation || ''} onChange={e => handleChange('axisSbbPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.axisSbbPreparedByPlotNo || ''} onChange={e => handleChange('axisSbbPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.axisSbbPreparedByStreet || ''} onChange={e => handleChange('axisSbbPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.axisSbbPreparedByCity || ''} onChange={e => handleChange('axisSbbPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.axisSbbPreparedByState || ''} onChange={e => handleChange('axisSbbPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.axisSbbPreparedByPinCode || ''} onChange={e => handleChange('axisSbbPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.axisSbbPreparedByPhone || ''} onChange={e => { handleChange('axisSbbPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.axisSbbPreparedByMobile || ''} onChange={e => { handleChange('axisSbbPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'axis-sbb-section-2',
      title: 'Case Details & Report Metadata',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly, projectCode) => {
        const isOwnerEditOn = fields.axisSbbEnableOwnerNameEdit || false;
        const computedOwnersText = (fields.axisSbbPropertyOwners || [])
          .filter((o: any) => o.name)
          .map((o: any) => `${o.name}`)
          .join(' & ');
        const propertyOwnerValue = isOwnerEditOn ? (fields.axisSbbOwnerName ?? computedOwnersText) : computedOwnersText;

        const isReportRefEditOn = fields.axisSbbEnableReportRefNoEdit || false;
        const defaultReportRefNo = projectCode || '';
        const reportRefNoValue = isReportRefEditOn ? (fields.axisSbbReportRefNo ?? defaultReportRefNo) : defaultReportRefNo;

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }}>
            <h3 className="font-bold text-gray-700 mb-4">CASE DETAILS & REPORT METADATA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 w-full flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Report Reference No</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isReportRefEditOn ? 'On' : 'Off'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isReportRefEditOn && !fields.axisSbbReportRefNo) {
                           handleChange('axisSbbReportRefNo', defaultReportRefNo);
                        }
                        handleChange('axisSbbEnableReportRefNoEdit', !isReportRefEditOn);
                      }}
                      disabled={isReadOnly}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isReportRefEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isReportRefEditOn ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
                <input
                  className={inputCls}
                  required
                  value={reportRefNoValue}
                  onChange={e => handleChange('axisSbbReportRefNo', e.target.value.toUpperCase())}
                  readOnly={!isReportRefEditOn}
                  disabled={isReadOnly || !isReportRefEditOn}
                  placeholder="E.g., SMA/1/07-26/09"
                />
              </div>
              <Field label="Report Initiated By Area">
                <input list="axisSbbInitiatedByList" className={inputCls} value={fields.axisSbbReportInitiatedBy || ''} onChange={e => handleChange('axisSbbReportInitiatedBy', e.target.value)} disabled={isReadOnly} placeholder="E.g., BHUBANESWAR" />
                <datalist id="axisSbbInitiatedByList">
                  <option value="BHUBANESWAR" />
                  <option value="CUTTACK" />
                  <option value="SAMBALPUR" />
                </datalist>
              </Field>
              <Field label="Name of Area">
                <input className={inputCls} value={fields.axisSbbAreaName || ''} onChange={e => handleChange('axisSbbAreaName', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SAMBALPUR" />
              </Field>

              <div className="col-span-1 w-full flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Name of Owner <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isOwnerEditOn ? 'On' : 'Off'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwnerEditOn && !fields.axisSbbOwnerName) {
                           handleChange('axisSbbOwnerName', computedOwnersText);
                        }
                        handleChange('axisSbbEnableOwnerNameEdit', !isOwnerEditOn);
                      }}
                      disabled={isReadOnly}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isOwnerEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isOwnerEditOn ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
                <input
                  className={inputCls}
                  required
                  value={propertyOwnerValue}
                  onChange={e => handleChange('axisSbbOwnerName', e.target.value.toUpperCase())}
                  readOnly={!isOwnerEditOn}
                  disabled={isReadOnly || !isOwnerEditOn}
                />
              </div>

              <Field label="Name of Customer">
                <input className={inputCls} required value={fields.axisSbbCustomerName || ''} onChange={e => handleChange('axisSbbCustomerName', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SHREE MATESWARI ENTERPRISES" />
              </Field>
              <BaseDateInput
                label="Date of Property Visit"
                value={fields.axisSbbDateOfVisit || ''}
                onChange={val => handleChange('axisSbbDateOfVisit', val)}
                disabled={isReadOnly}
              />
              <BaseDateInput
                label="Date of Report"
                value={fields.axisSbbDateOfReport || ''}
                onChange={val => handleChange('axisSbbDateOfReport', val)}
                disabled={isReadOnly}
              />
              <Field label="Sale Deed Discretions For Which Valuation Done" span={2}>
                <textarea className={inputCls} rows={2} value={fields.axisSbbSaleDeedDiscretions || ''} onChange={e => handleChange('axisSbbSaleDeedDiscretions', e.target.value)} disabled={isReadOnly} placeholder="E.g., COPY OF SALE DEED, ROR & SKETCH MAP" />
              </Field>
            </div>
          </div>
        </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-3',
      title: 'Legal Verification & Property Classification',
      number: 3,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const isGramPanchayat = fields.axisSbbGoverningBody === 'Town or Gram Panchayat or Rural';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
              <h3 className="font-bold text-gray-700 mb-4">LOCATION CLASSIFICATION & LOCAL AUTHORITY</h3>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Location of Property <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  {['Urban', 'Semi-Urban', 'Rural/Gram Panchayat'].map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-sky-200 shadow-sm hover:bg-sky-50 transition-colors">
                      <input
                        type="radio"
                        name="property_location"
                        value={opt}
                        checked={fields.axisSbbPropertyLocation === opt}
                        onChange={e => handleChange('axisSbbPropertyLocation', e.target.value)}
                        disabled={isReadOnly}
                        className="text-sky-600 focus:ring-sky-500"
                        required
                      />
                      <span className={`text-sm ${fields.axisSbbPropertyLocation === opt ? 'font-bold text-black' : 'font-medium text-gray-700'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Governing Body Authority <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  {['Corporation', 'Municipality', 'Town or Gram Panchayat or Rural'].map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-sky-200 shadow-sm hover:bg-sky-50 transition-colors">
                      <input
                        type="radio"
                        name="governing_body"
                        value={opt}
                        checked={fields.axisSbbGoverningBody === opt}
                        onChange={e => {
                          handleChange('axisSbbGoverningBody', e.target.value);
                          if (e.target.value !== 'Town or Gram Panchayat or Rural') {
                            handleChange('axisSbbTownPlanningSubType', '');
                          }
                        }}
                        disabled={isReadOnly}
                        className="text-sky-600 focus:ring-sky-500"
                        required
                      />
                      <span className={`text-sm ${fields.axisSbbGoverningBody === opt ? 'font-bold text-black' : 'font-medium text-gray-700'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={`mt-4 p-4 border rounded-lg transition-all duration-300 ${isGramPanchayat ? 'bg-white border-sky-200' : 'bg-slate-50 border-slate-200 opacity-60 grayscale-50'}`}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Town / Gram Panchayat Planning Sub-Type <span className="text-red-500">*</span></label>
                <div className="flex flex-col space-y-3">
                  {[
                    'Type 1: Layout plan & individual construction both are approved by Town Planning Authority.',
                    'Type 2A: Layout plan approved by Town Planning Authority and construction approved by Grampanchayat.',
                    'Type 2B: Layout plan & individual construction both are approved by Grampanchayat but property now falls in Municipality.',
                    'Type 3: Layout plan & individual construction both are approved by Grampanchayat but property now falls inside Gram Panchayat.'
                  ].map((opt) => (
                    <label key={opt} className={`flex items-start space-x-3 p-2 rounded-md transition-colors ${isGramPanchayat ? 'cursor-pointer hover:bg-sky-50' : 'cursor-not-allowed'}`}>
                      <input
                        type="radio"
                        name="town_gp_subtype"
                        value={opt}
                        checked={fields.axisSbbTownPlanningSubType === opt}
                        onChange={e => handleChange('axisSbbTownPlanningSubType', e.target.value)}
                        disabled={isReadOnly || !isGramPanchayat}
                        className={`mt-1 ${isGramPanchayat ? 'text-sky-600 focus:ring-sky-500' : 'text-slate-400'}`}
                        required={isGramPanchayat}
                      />
                      <span className={`text-sm ${fields.axisSbbTownPlanningSubType === opt ? 'font-bold text-black' : (isGramPanchayat ? 'text-gray-700 font-medium' : 'text-gray-400')}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <h3 className="font-bold text-gray-700 mb-4">DOCUMENTS PROVIDED CHECKLIST</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'axisSbbDocPrevValuation', label: 'Copy of Previous Valuation Report' },
                  { id: 'axisSbbDocApprovedLayout', label: 'Approved Layout' },
                  { id: 'axisSbbDocCommencement', label: 'Commencement Certificate' },
                  { id: 'axisSbbDocApprovedBuildingPlan', label: 'Approved Building Plan' },
                  { id: 'axisSbbDocSaleDeed', label: 'Copy of Sale Deed / Patta Certificate' },
                  { id: 'axisSbbDocOccupancy', label: 'Occupancy Certificate' },
                  { id: 'axisSbbDocPartitionDeed', label: 'Copy Partition Deed' },
                  { id: 'axisSbbDocSketchMap', label: 'Sketch Map / ROR' }
                ].map((doc) => {
                  const isChecked = !!fields[doc.id];
                  return (
                  <div key={doc.id} className={`flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm transition-colors ${isChecked ? 'border-emerald-300 bg-emerald-50/30' : 'border-emerald-100 hover:bg-emerald-50'}`}>
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => handleChange(doc.id, e.target.checked)}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      />
                      <span className={`text-sm ${isChecked ? 'font-bold text-black' : 'font-medium text-gray-700'}`}>{doc.label}</span>
                    </label>
                    {isChecked && (
                      <label className="cursor-pointer p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors flex items-center justify-center animate-fade-in" title="Attach Document / View Link">
                        <input type="file" accept=".pdf,image/*" className="hidden" disabled={isReadOnly} />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </label>
                    )}
                  </div>
                )})}
              </div>
              
              {!fields.axisSbbDocSaleDeed && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md animate-fade-in flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Required:</strong> At least one title ownership document (e.g., Copy of Sale Deed / Patta Certificate) must be selected.</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-4',
      title: 'Property Identification & Postal Address',
      number: 4,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const address = fields.axisSbbAddressOfTheProperty || '';
        
        // Auto-fill computations from address
        let plotComputedStr = address.split(/MOUZA|VILLAGE|MZ\s*-/i)[0].trim();
        if (plotComputedStr.endsWith(',')) plotComputedStr = plotComputedStr.slice(0, -1).trim();
        const plotComputed = plotComputedStr.toUpperCase() || 'KHATA NO. XX, PLOT NO. YY';
        
        const mouzaMatch = address.match(/(?:MOUZA|VILLAGE|MZ\s*-)[-\s]*[\s\S]*?(?=,|$|DIST|TAH)/i);
        const mouzaComputed = mouzaMatch ? mouzaMatch[0].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() : '';
        
        const distMatch = address.match(/DIST(?:RICT)?[-\s]*([\s\S]*?)(?=,|-|PIN|$)/i);
        const distComputed = distMatch ? distMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() : '';
        
        const pinMatch = address.match(/PIN[-\s]*(\d{6})/i) || address.match(/\b(\d{6})\b/);
        const pinComputed = pinMatch ? pinMatch[1] : '';
        
        const STATES_OF_INDIA = [
          "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR", "CHHATTISGARH", "DELHI", "GOA", "GUJARAT",
          "HARYANA", "HIMACHAL PRADESH", "JHARKHAND", "KARNATAKA", "KERALA", "MADHYA PRADESH", 
          "MAHARASHTRA", "MANIPUR", "MEGHALAYA", "MIZORAM", "NAGALAND", "ODISHA", "PUNJAB",
          "RAJASTHAN", "SIKKIM", "TAMIL NADU", "TELANGANA", "TRIPURA", "UTTAR PRADESH", "UTTARAKHAND",
          "WEST BENGAL"
        ].sort();
        const foundState = STATES_OF_INDIA.find(s => address.toUpperCase().includes(s));
        const stateComputed = foundState || '';

        const distanceKm = fields.axisSbbDistanceKm || '03';
        const refCity = distComputed || mouzaComputed || 'CITY';
        const distanceComputed = `${distanceKm}- KMS FROM ${refCity} CITY CENTRE`.toUpperCase();

        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-10 h-5 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          );
        };

        const distDropdown = fields.axisSbbDistrictDropdown || '';
        const stateDropdown = fields.axisSbbStateDropdown || 'ODISHA';
        
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
              <h3 className="font-bold text-gray-700 mb-4">CADASTRAL & POSTAL ADDRESS DETAILS</h3>
              
              <div className="grid grid-cols-1 gap-5">
                
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">LEASE/SALE DEED NUMBER(S) & DATE <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbDeedNumberDate')}
                    </div>
                  </div>
                  <textarea
                    className={`${inputCls} resize-y min-h-10`}
                    rows={1}
                    value={fields.axisSbbDeedNumberDateIsNA ? 'NA' : (fields.axisSbbDeedNumberDate || '')}
                    onChange={e => handleChange('axisSbbDeedNumberDate', e.target.value.toUpperCase())}
                    disabled={isReadOnly || fields.axisSbbDeedNumberDateIsNA}
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PLOT NO/ S.NO/ G.NO/ KHASRA NO/PATTA NO <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbPlotKhasraNo')}
                    </div>
                    {renderEditSwitch('axisSbbPlotKhasraNo', !!fields.axisSbbPlotKhasraNoIsNA)}
                  </div>
                  <textarea
                    className={`${inputCls} resize-y min-h-10`}
                    rows={1}
                    value={fields.axisSbbPlotKhasraNoIsNA ? 'NA' : (fields.axisSbbPlotKhasraNoEditOn ? (fields.axisSbbPlotKhasraNo || '') : plotComputed)}
                    onChange={e => handleChange('axisSbbPlotKhasraNo', e.target.value.toUpperCase())}
                    readOnly={!fields.axisSbbPlotKhasraNoEditOn || fields.axisSbbPlotKhasraNoIsNA}
                    disabled={isReadOnly || (!fields.axisSbbPlotKhasraNoEditOn && !fields.axisSbbPlotKhasraNoIsNA)}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">Parsed from Section 1 Address</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ROAD <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbRoadWidthMaterial')}
                    </div>
                    <input
                      className={inputCls}
                      required
                      value={fields.axisSbbRoadWidthMaterialIsNA ? 'NA' : (fields.axisSbbRoadWidthMaterial || '')}
                      onChange={e => handleChange('axisSbbRoadWidthMaterial', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbRoadWidthMaterialIsNA}
                      disabled={isReadOnly || fields.axisSbbRoadWidthMaterialIsNA}
                      placeholder="20 FEET WIDE CC ROAD"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">COLONY/NAGAR/SECTOR</label>
                      {renderNaToggle('axisSbbColonySector')}
                    </div>
                    <input
                      className={inputCls}
                      value={fields.axisSbbColonySectorIsNA ? 'NA' : (fields.axisSbbColonySector || '')}
                      onChange={e => handleChange('axisSbbColonySector', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbColonySectorIsNA}
                      disabled={isReadOnly || fields.axisSbbColonySectorIsNA}
                      placeholder="SAMBALPUR"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">LOCALITY/ LANDMARK <span className="text-red-500">*</span></label>
                    {renderNaToggle('axisSbbLocalityLandmark')}
                  </div>
                  <input
                    className={inputCls}
                    required
                    value={fields.axisSbbLocalityLandmarkIsNA ? 'NA' : (fields.axisSbbLocalityLandmark || '')}
                    onChange={e => {
                      const val = e.target.value;
                      const cap = val.replace(/\b\w/g, char => char.toUpperCase());
                      handleChange('axisSbbLocalityLandmark', cap);
                    }}
                    readOnly={fields.axisSbbLocalityLandmarkIsNA}
                    disabled={isReadOnly || fields.axisSbbLocalityLandmarkIsNA}
                    placeholder="Near Pratima Clinic"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">VILLAGE/TOWN/CITY <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbVillageCity')}
                    </div>
                    {renderEditSwitch('axisSbbVillageCity', !!fields.axisSbbVillageCityIsNA)}
                  </div>
                  <textarea
                    className={`${inputCls} resize-y min-h-10`}
                    rows={1}
                    value={fields.axisSbbVillageCityIsNA ? 'NA' : (fields.axisSbbVillageCityEditOn ? (fields.axisSbbVillageCity || '') : (mouzaComputed || fields.axisSbbVillageCity || ''))}
                    onChange={e => handleChange('axisSbbVillageCity', e.target.value.toUpperCase())}
                    readOnly={!fields.axisSbbVillageCityEditOn || fields.axisSbbVillageCityIsNA}
                    disabled={isReadOnly || (!fields.axisSbbVillageCityEditOn && !fields.axisSbbVillageCityIsNA)}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">Parsed from Section 1 Address</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DISTRICT <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistrict')}
                      </div>
                      {renderEditSwitch('axisSbbDistrict', !!fields.axisSbbDistrictIsNA)}
                    </div>
                    <select
                      className={inputCls}
                      required
                      value={fields.axisSbbDistrictIsNA ? 'NA' : (fields.axisSbbDistrictEditOn ? distDropdown : 'AUTO')}
                      onChange={e => {
                        const v = e.target.value;
                        handleChange('axisSbbDistrictDropdown', v);
                        if (v !== 'CUSTOM') {
                          handleChange('axisSbbDistrict', v);
                        }
                      }}
                      disabled={isReadOnly || !fields.axisSbbDistrictEditOn || fields.axisSbbDistrictIsNA}
                    >
                      {!fields.axisSbbDistrictEditOn && (distComputed || fields.axisSbbDistrict) && <option value="AUTO">{distComputed || fields.axisSbbDistrict}</option>}
                      {!fields.axisSbbDistrictEditOn && !(distComputed || fields.axisSbbDistrict) && <option value="AUTO">Select District</option>}
                      <option value="">Select District</option>
                      <option value="SAMBALPUR">SAMBALPUR</option>
                      <option value="CUTTACK">CUTTACK</option>
                      <option value="BHUBANESWAR">BHUBANESWAR</option>
                      <option value="CUSTOM">Custom...</option>
                    </select>
                    {fields.axisSbbDistrictEditOn && distDropdown === 'CUSTOM' && !fields.axisSbbDistrictIsNA && (
                      <input
                        className={`${inputCls} mt-2`}
                        value={fields.axisSbbDistrict || ''}
                        onChange={e => handleChange('axisSbbDistrict', e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        placeholder="Enter Custom District"
                      />
                    )}
                    <span className="text-[10px] text-gray-400 mt-1">Parsed from Section 1 Address</span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">STATE <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbState')}
                      </div>
                      {renderEditSwitch('axisSbbState', !!fields.axisSbbStateIsNA)}
                    </div>
                    <select
                      className={inputCls}
                      required
                      value={fields.axisSbbStateIsNA ? 'NA' : (fields.axisSbbStateEditOn ? stateDropdown : ((stateComputed || fields.axisSbbState) ? 'AUTO' : ''))}
                      onChange={e => {
                        const v = e.target.value;
                        handleChange('axisSbbStateDropdown', v);
                        if (v !== 'CUSTOM') {
                          handleChange('axisSbbState', v);
                        }
                      }}
                      disabled={isReadOnly || !fields.axisSbbStateEditOn || fields.axisSbbStateIsNA}
                    >
                      {!fields.axisSbbStateEditOn && (stateComputed || fields.axisSbbState) && <option value="AUTO">{stateComputed || fields.axisSbbState}</option>}
                      {!fields.axisSbbStateEditOn && !(stateComputed || fields.axisSbbState) && <option value="AUTO">Select State</option>}
                      <option value="">Select State</option>
                      {STATES_OF_INDIA.map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="CUSTOM">Custom...</option>
                    </select>
                    {fields.axisSbbStateEditOn && stateDropdown === 'CUSTOM' && !fields.axisSbbStateIsNA && (
                      <input
                        className={`${inputCls} mt-2`}
                        value={fields.axisSbbState || ''}
                        onChange={e => handleChange('axisSbbState', e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        placeholder="Enter Custom State"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PIN CODE <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbPinCode')}
                      </div>
                      {renderEditSwitch('axisSbbPinCode', !!fields.axisSbbPinCodeIsNA)}
                    </div>
                    <input
                      className={inputCls}
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={fields.axisSbbPinCodeIsNA ? 'NA' : (fields.axisSbbPinCodeEditOn ? (fields.axisSbbPinCode || '') : (pinComputed || fields.axisSbbPinCode || ''))}
                      onChange={e => handleChange('axisSbbPinCode', e.target.value.replace(/\D/g, ''))}
                      readOnly={!fields.axisSbbPinCodeEditOn || fields.axisSbbPinCodeIsNA}
                      disabled={isReadOnly || (!fields.axisSbbPinCodeEditOn && !fields.axisSbbPinCodeIsNA)}
                      placeholder="768006"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DISTANCE FROM CITY CENTRE <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistanceFromCityCenter')}
                      </div>
                      {renderEditSwitch('axisSbbDistanceFromCityCenter', !!fields.axisSbbDistanceFromCityCenterIsNA)}
                    </div>
                    {!fields.axisSbbDistanceFromCityCenterEditOn && !fields.axisSbbDistanceFromCityCenterIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-20`}
                          placeholder="KM"
                          value={fields.axisSbbDistanceKm || ''}
                          onChange={e => handleChange('axisSbbDistanceKm', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">KM from {refCity}</span>
                      </div>
                    )}
                    <textarea
                      className={`${inputCls} resize-y min-h-10 ${!fields.axisSbbDistanceFromCityCenterEditOn && !fields.axisSbbDistanceFromCityCenterIsNA ? 'bg-amber-50 text-amber-800 border-amber-300' : ''}`}
                      rows={1}
                      value={fields.axisSbbDistanceFromCityCenterIsNA ? 'NA' : (fields.axisSbbDistanceFromCityCenterEditOn ? (fields.axisSbbDistanceFromCityCenter || '') : distanceComputed)}
                      onChange={e => handleChange('axisSbbDistanceFromCityCenter', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbDistanceFromCityCenterEditOn || fields.axisSbbDistanceFromCityCenterIsNA}
                      disabled={isReadOnly || (!fields.axisSbbDistanceFromCityCenterEditOn && !fields.axisSbbDistanceFromCityCenterIsNA)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-5',
      title: 'Property Characteristics & Physical Site Assessment',
      number: 5,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const handleMultiSelect = (field: string, val: string) => {
          const arr = Array.isArray(fields[field]) ? [...fields[field]] : [];
          if (arr.includes(val)) {
            handleChange(field, arr.filter(x => x !== val));
          } else {
            handleChange(field, [...arr, val]);
          }
        };

        const renderMultiSelect = (field: string, options: string[], isNA: boolean) => (
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {options.map(opt => {
              const isChecked = Array.isArray(fields[field]) && fields[field].includes(opt);
              return (
                <label key={opt} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-yellow-50/50 border-yellow-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMultiSelect(field, opt)}
                    disabled={isReadOnly || isNA}
                    className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                  />
                  <span className={`text-xs ${isChecked ? 'font-bold text-black' : 'font-semibold text-gray-700'}`}>{opt}</span>
                </label>
              );
            })}
          </div>
        );

        // Auto computed station and bus stand names based on address
        const address = fields.axisSbbAddressOfTheProperty || '';
        const distMatch = address.match(/DIST(?:RICT)?[-\s]*([\s\S]*?)(?=,|-|PIN|$)/i);
        const mouzaMatch = address.match(/(?:MOUZA|VILLAGE|MZ\s*-)[-\s]*([\s\S]*?)(?=,|$|DIST|TAH)/i);
        const parsedCity = (distMatch ? distMatch[1] : (mouzaMatch ? mouzaMatch[1] : 'CITY')).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

        const stationName = fields.axisSbbDistRailwayStationName || parsedCity;
        const busStopName = fields.axisSbbDistBusStopName || parsedCity;
        const stationDistKm = fields.axisSbbDistRailwayStationKm || '03';
        const busStopDistKm = fields.axisSbbDistBusStopKm || '03';

        const stationComputed = `${stationDistKm}-KMS (${stationName} RAILWAY STATION)`.toUpperCase();
        const busStopComputed = `${busStopDistKm}-KMS. (${busStopName} BUS STOP)`.toUpperCase();

        const levelDropdown = fields.axisSbbLevelOfLandDropdown || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }}>
              <h3 className="font-bold text-gray-700 mb-4">TYPE OF PROPERTY</h3>
              
              <div className="space-y-6">
                
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">(A) PLOT/UNDER CONSTRUCTION</label>
                    {renderNaToggle('axisSbbPropertyType')}
                  </div>
                  {renderMultiSelect('axisSbbPropertyType', ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND/PLOT'], !!fields.axisSbbPropertyTypeIsNA)}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">LEVEL OF LAND WITH TOPOGRAPHICAL CONDITIONS <span className="text-red-500">*</span></label>
                    {renderNaToggle('axisSbbLevelOfLand')}
                  </div>
                  <select
                    className={inputCls}
                    value={fields.axisSbbLevelOfLandIsNA ? 'NA' : levelDropdown}
                    onChange={e => {
                      const v = e.target.value;
                      handleChange('axisSbbLevelOfLandDropdown', v);
                      if (v !== 'CUSTOM') handleChange('axisSbbLevelOfLand', v);
                    }}
                    disabled={isReadOnly || fields.axisSbbLevelOfLandIsNA}
                  >
                    <option value="" disabled>Select Level of Land...</option>
                    <option value="PLAIN">PLAIN</option>
                    <option value="SLOPING">SLOPING</option>
                    <option value="LOW LYING">LOW LYING</option>
                    <option value="ELEVATED / HILLY">ELEVATED / HILLY</option>
                    <option value="CUSTOM">Custom...</option>
                  </select>
                  {levelDropdown === 'CUSTOM' && !fields.axisSbbLevelOfLandIsNA && (
                    <input
                      className={`${inputCls} mt-2`}
                      value={fields.axisSbbLevelOfLand || ''}
                      onChange={e => handleChange('axisSbbLevelOfLand', e.target.value.toUpperCase())}
                      disabled={isReadOnly}
                      placeholder="Enter custom level of land"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ANY CONSTRUCTION OBSERVED ON PLOT <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbAnyConstructionObserved')}
                    </div>
                    <div className={`flex space-x-4 ${fields.axisSbbAnyConstructionObservedIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {['YES', 'NO'].map(opt => (
                        <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="any_construction_observed_on_plot"
                            value={opt}
                            checked={fields.axisSbbAnyConstructionObserved === opt && !fields.axisSbbAnyConstructionObservedIsNA}
                            onChange={e => {
                              handleChange('axisSbbAnyConstructionObserved', e.target.value);
                              if (e.target.value === 'NO') {
                                handleChange('axisSbbPercentOfConstruction', '0');
                              }
                            }}
                            disabled={isReadOnly || fields.axisSbbAnyConstructionObservedIsNA}
                            className="text-yellow-500 focus:ring-yellow-400"
                          />
                          <span className="text-sm font-semibold">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">% OF CONSTRUCTION, IN CASE OF UNDER CONSTRUCTION <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbPercentOfConstruction')}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className={`${inputCls} pr-8`}
                        value={fields.axisSbbPercentOfConstructionIsNA ? '' : (fields.axisSbbPercentOfConstruction || '')}
                        onChange={e => handleChange('axisSbbPercentOfConstruction', e.target.value)}
                        readOnly={fields.axisSbbPercentOfConstructionIsNA}
                        disabled={isReadOnly || fields.axisSbbPercentOfConstructionIsNA}
                        placeholder={fields.axisSbbPercentOfConstructionIsNA ? 'NA' : 'Enter %'}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">WEATHER VACANT LAND PROPERTY IS DEMARCATED</label>
                    {renderNaToggle('axisSbbVacantLandDemarcated')}
                  </div>
                  <div className={`flex space-x-2 ${fields.axisSbbVacantLandDemarcatedIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['YES', 'NO'].map(opt => {
                      const active = fields.axisSbbVacantLandDemarcated === opt && !fields.axisSbbVacantLandDemarcatedIsNA;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('axisSbbVacantLandDemarcated', opt)}
                          disabled={isReadOnly || fields.axisSbbVacantLandDemarcatedIsNA}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">(B) RESIDENTIAL PROPERTY:</label>
                    {renderNaToggle('axisSbbResidentialProperty')}
                  </div>
                  {renderMultiSelect('axisSbbResidentialProperty', ['INDEPENDENT HOUSE', 'BUNGALOW', 'ROW HOUSE/FLAT'], !!fields.axisSbbResidentialPropertyIsNA)}
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">CIVIC AMENITIES LIKE SCHOOL, HOSPITAL, MARKET, ETC. <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbCivicAmenities')}
                    </div>
                  </div>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 mt-1 ${fields.axisSbbCivicAmenitiesIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['AVAILABLE, WITHIN THE RADIUS OF 1-2 KMS', 'NOT AVAILABLE'].map(opt => {
                      const defaultVal = 'AVAILABLE, WITHIN THE RADIUS OF 1-2 KMS';
                      const currentVal = Array.isArray(fields.axisSbbCivicAmenities) && fields.axisSbbCivicAmenities.length > 0 
                        ? fields.axisSbbCivicAmenities[0] 
                        : (fields.axisSbbCivicAmenities || defaultVal);
                      
                      const isChecked = currentVal === opt;

                      return (
                        <label key={opt} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-yellow-50/50 border-yellow-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (!isChecked) handleChange('axisSbbCivicAmenities', opt);
                            }}
                            disabled={isReadOnly || fields.axisSbbCivicAmenitiesIsNA}
                            className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                          />
                          <span className={`text-xs ${isChecked ? 'font-bold text-black' : 'font-semibold text-gray-700'}`}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">(C) COMMERCIAL/INDUSTRIAL PROPERTY:</label>
                    {renderNaToggle('axisSbbCommercialIndustrialProperty')}
                  </div>
                  {renderMultiSelect('axisSbbCommercialIndustrialProperty', ['GODOWN', 'INDURSTRIAL', 'PETROL PUMP', 'OFFICE', 'VACANT LAND', 'UNIT IN A MALL'], !!fields.axisSbbCommercialIndustrialPropertyIsNA)}
                </div>

              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFEFF', borderColor: '#A5F3FC' }}>
              <h3 className="font-bold text-gray-700 mb-4">ACCESSIBILITY/ BOUNDARIES/OTHERS</h3>
              
              <div className="space-y-5">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">AVAILABILITY OF LOCAL TRANSPORT</label>
                    {renderNaToggle('axisSbbLocalTransport')}
                  </div>
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${fields.axisSbbLocalTransportIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['METRO', 'LOCAL TRAIN', 'BUS', 'PERSONAL TRANSPORT'].map(opt => {
                      const isChecked = Array.isArray(fields.axisSbbLocalTransport) && fields.axisSbbLocalTransport.includes(opt);
                      return (
                        <label key={opt} className={`flex justify-center items-center p-2 border rounded-full cursor-pointer transition-colors ${isChecked ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={() => handleMultiSelect('axisSbbLocalTransport', opt)}
                            disabled={isReadOnly || fields.axisSbbLocalTransportIsNA}
                          />
                          <span className="text-[11px] font-bold tracking-wide">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DISTANCE FROM RAILWAY STATION <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistRailwayStation')}
                      </div>
                      {renderEditSwitch('axisSbbDistRailwayStation', !!fields.axisSbbDistRailwayStationIsNA)}
                    </div>
                    {!fields.axisSbbDistRailwayStationEditOn && !fields.axisSbbDistRailwayStationIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-20`}
                          placeholder="KM"
                          value={fields.axisSbbDistRailwayStationKm || ''}
                          onChange={e => handleChange('axisSbbDistRailwayStationKm', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">KM from {parsedCity}</span>
                      </div>
                    )}
                    <input
                      className={`${inputCls} ${!fields.axisSbbDistRailwayStationEditOn && !fields.axisSbbDistRailwayStationIsNA ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : ''}`}
                      value={fields.axisSbbDistRailwayStationIsNA ? 'NA' : (fields.axisSbbDistRailwayStationEditOn ? (fields.axisSbbDistRailwayStation || '') : stationComputed)}
                      onChange={e => handleChange('axisSbbDistRailwayStation', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbDistRailwayStationEditOn || fields.axisSbbDistRailwayStationIsNA}
                      disabled={isReadOnly || (!fields.axisSbbDistRailwayStationEditOn && !fields.axisSbbDistRailwayStationIsNA)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">BUS STOP/TAXI/ AUTO STAND <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistBusStop')}
                      </div>
                      {renderEditSwitch('axisSbbDistBusStop', !!fields.axisSbbDistBusStopIsNA)}
                    </div>
                    {!fields.axisSbbDistBusStopEditOn && !fields.axisSbbDistBusStopIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-20`}
                          placeholder="KM"
                          value={fields.axisSbbDistBusStopKm || ''}
                          onChange={e => handleChange('axisSbbDistBusStopKm', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">KM from {parsedCity}</span>
                      </div>
                    )}
                    <input
                      className={`${inputCls} ${!fields.axisSbbDistBusStopEditOn && !fields.axisSbbDistBusStopIsNA ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : ''}`}
                      value={fields.axisSbbDistBusStopIsNA ? 'NA' : (fields.axisSbbDistBusStopEditOn ? (fields.axisSbbDistBusStop || '') : busStopComputed)}
                      onChange={e => handleChange('axisSbbDistBusStop', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbDistBusStopEditOn || fields.axisSbbDistBusStopIsNA}
                      disabled={isReadOnly || (!fields.axisSbbDistBusStopEditOn && !fields.axisSbbDistBusStopIsNA)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-6',
      title: 'Boundaries, Accessibility & Site Risk Checks',
      number: 6,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const renderRadioGroup = (field: string, options: string[]) => (
          <div className={`flex flex-wrap gap-3 ${fields[`${field}IsNA`] ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {options.map(opt => (
              <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields[field] === opt && !fields[`${field}IsNA`]) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name={field}
                  value={opt}
                  checked={fields[field] === opt && !fields[`${field}IsNA`]}
                  onChange={e => handleChange(field, e.target.value)}
                  disabled={isReadOnly || !!fields[`${field}IsNA`] || (!fields[`${field}EditOn`] && fields[`${field}EditOn`] !== undefined)}
                  className="text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

        const remarkComputed = (fields.axisSbbRoadWidthMaterial || '20 FEET WIDE ROAD').toUpperCase();
        const fireExtComputed = parseInt(fields.axisSbbRoadWidthMaterial || '0') >= 15 ? 'YES' : 'NO';
        
        const sqft = fields.axisSbbPlotAreaSqft || '0';
        const acres = fields.axisSbbPlotAreaAcres || '0.000';
        const areaComputed = `${sqft} SQFT (AC.${acres}DECS)`.toUpperCase();

        const renderBoundaryRow = (dir: string, deedField: string, actualField: string, editField: string) => (
          <tr className="border-b">
            <td className="p-3 font-bold text-xs text-gray-700 w-1/4 align-top">
              <div className="flex items-center justify-between">
                <span>{dir.toUpperCase()}:</span>
              </div>
            </td>
            <td className="p-2 border-l border-r w-3/8 align-top">
              <div className="flex items-center mb-1">
                {renderNaToggle(deedField)}
              </div>
              <textarea
                className={`${inputCls} resize-y`}
                rows={1}
                value={fields[`${deedField}IsNA`] ? 'NA' : (fields[deedField] || '')}
                onChange={e => handleChange(deedField, e.target.value.toUpperCase())}
                readOnly={!!fields[`${deedField}IsNA`]}
                disabled={isReadOnly || !!fields[`${deedField}IsNA`]}
                placeholder={`AS PER SALE DEED`}
              />
            </td>
            <td className="p-2 w-3/8 align-top">
              <div className="flex items-center mb-1">
                {renderNaToggle(actualField)}
              </div>
              <textarea
                className={`${inputCls} resize-y`}
                rows={1}
                value={fields[`${actualField}IsNA`] ? 'NA' : (fields[actualField] || '')}
                onChange={e => handleChange(actualField, e.target.value.toUpperCase())}
                readOnly={!!fields[`${actualField}IsNA`]}
                disabled={isReadOnly || !!fields[`${actualField}IsNA`]}
                placeholder={`AS PER ACTUAL SITE`}
              />
            </td>
          </tr>
        );

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}>
              <h3 className="font-bold text-gray-700 mb-4">ACCESSIBILITY/ BOUNDARIES/OTHERS (Physical Access & Site Risk Checks)</h3>
              
              <div className="space-y-5">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DOES THE APPROACH ROAD TO THE BUILDING IS SMALL AND <span className="text-red-500">*</span></label>
                    {renderNaToggle('axisSbbApproachRoadSmall')}
                  </div>
                  <div className={`flex space-x-4 ${fields.axisSbbApproachRoadSmallIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['YES', 'NO'].map(opt => (
                      <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="does_approach_road_small"
                          value={opt}
                          checked={fields.axisSbbApproachRoadSmall === opt && !fields.axisSbbApproachRoadSmallIsNA}
                          onChange={e => handleChange('axisSbbApproachRoadSmall', e.target.value)}
                          disabled={isReadOnly || fields.axisSbbApproachRoadSmallIsNA}
                          className="text-rose-500 focus:ring-rose-400"
                        />
                        <span className="text-sm font-semibold">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">REMARK</label>
                      {renderNaToggle('axisSbbApproachRoadRemark')}
                    </div>
                  </div>
                  <input
                    type="text"
                    className={`${inputCls} ${
                      fields.axisSbbApproachRoadSmall === 'YES' && !fields.axisSbbApproachRoadSmallIsNA
                        ? 'ring-2 ring-amber-400 border-amber-500 bg-amber-50/30'
                        : ''
                    }`}
                    value={fields.axisSbbApproachRoadRemarkIsNA ? 'NA' : (fields.axisSbbApproachRoadRemark || '20 FEET WIDE ROAD')}
                    onChange={e => handleChange('axisSbbApproachRoadRemark', e.target.value.toUpperCase())}
                    disabled={isReadOnly || fields.axisSbbApproachRoadRemarkIsNA}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">WILL IT BE ABLE TO ACCOMMODATE A FIRE EXTINGUISHER</label>
                        {renderNaToggle('axisSbbFireExtinguisher')}
                      </div>
                    </div>
                    <div className={`flex flex-wrap gap-3 ${fields.axisSbbFireExtinguisherIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {['YES', 'NO'].map(opt => (
                        <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields.axisSbbFireExtinguisher === opt && !fields.axisSbbFireExtinguisherIsNA) ? 'bg-rose-50 border-rose-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input
                            type="radio"
                            name="accommodate_fire_extinguisher"
                            value={opt}
                            checked={fields.axisSbbFireExtinguisher === opt && !fields.axisSbbFireExtinguisherIsNA}
                            onChange={e => handleChange('axisSbbFireExtinguisher', e.target.value)}
                            disabled={isReadOnly || !!fields.axisSbbFireExtinguisherIsNA}
                            className="text-rose-500 focus:ring-rose-400 border-gray-300"
                          />
                          <span className="text-xs font-semibold text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">DOES THE PROPERTY FALLS UNDER LAND LOCKED AREA</label>
                        {renderNaToggle('axisSbbLandLockedArea')}
                      </div>
                    </div>
                    {renderRadioGroup('axisSbbLandLockedArea', ['YES', 'NO'])}
                    {fields.axisSbbLandLockedArea === 'YES' && !fields.axisSbbLandLockedAreaIsNA && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[10px] font-bold flex items-center space-x-2 animate-pulse">
                        <span>⚠️</span>
                        <span>WARNING: LAND LOCKED PROPERTY POOSES SERIOUS COLLATERAL RISK.</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">DOES THE PROPERTY FALLS IN A COMMUNITY DOMINATED AREA</label>
                        {renderNaToggle('axisSbbCommunityDominatedArea')}
                      </div>
                    </div>
                    {renderRadioGroup('axisSbbCommunityDominatedArea', ['YES', 'NO'])}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">DOES THE BOUNDARIES AT SITE MATCH AS MENTIONED IN DOCUMENT</label>
                        {renderNaToggle('axisSbbBoundariesMatchDocument')}
                      </div>
                    </div>
                    {renderRadioGroup('axisSbbBoundariesMatchDocument', ['YES', 'NO'])}
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4 overflow-x-auto" style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}>
              <h3 className="font-bold text-gray-700 mb-4">BOUNDARIES/DIMENSIONS (Comparison Matrix)</h3>
              
              <table className="w-full border-collapse bg-white rounded shadow-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-t border-l border-r">
                    <th className="p-3 text-left text-xs font-bold text-slate-700 w-1/4">BOUNDARIES/DIMENSIONS</th>
                    <th className="p-3 text-left text-xs font-bold text-slate-700 w-3/8 border-l">(AS PER SALE DEED)</th>
                    <th className="p-3 text-left text-xs font-bold text-slate-700 w-3/8 border-l">(AS PER ACTUAL SITE)</th>
                  </tr>
                </thead>
                <tbody className="border-l border-r border-b">
                  {renderBoundaryRow('NORTH', 'axisSbbNorthAsPerDeed', 'axisSbbNorthAsPerActual', 'axisSbbNorth')}
                  {renderBoundaryRow('SOUTH', 'axisSbbSouthAsPerDeed', 'axisSbbSouthAsPerActual', 'axisSbbSouth')}
                  {renderBoundaryRow('EAST', 'axisSbbEastAsPerDeed', 'axisSbbEastAsPerActual', 'axisSbbEast')}
                  {renderBoundaryRow('WEST', 'axisSbbWestAsPerDeed', 'axisSbbWestAsPerActual', 'axisSbbWest')}
                </tbody>
              </table>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFCCB', borderColor: '#D9F99D' }}>
              <h3 className="font-bold text-gray-700 mb-4">PLOT AREA, LOCALITY, INFRASTRUCTURE & USAGE</h3>
              
              <div className="space-y-5">
                
                <div className="flex flex-col space-y-5">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PLOT AREA AS PER DOCUMENTS</label>
                        {renderNaToggle('axisSbbPlotAreaAsPerDocument')}
                      </div>
                    </div>
                    <textarea
                      className={`${inputCls} resize-y`}
                      rows={1}
                      value={fields.axisSbbPlotAreaAsPerDocumentIsNA ? 'NA' : (fields.axisSbbPlotAreaAsPerDocument || '')}
                      onChange={e => handleChange('axisSbbPlotAreaAsPerDocument', e.target.value.toUpperCase())}
                      readOnly={!!fields.axisSbbPlotAreaAsPerDocumentIsNA}
                      disabled={isReadOnly || !!fields.axisSbbPlotAreaAsPerDocumentIsNA}
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                          PLOT AREA AS PER SALE DEED <span className="text-red-500">*</span>
                        </label>
                        {renderNaToggle('axisSbbPlotAreaAsPerSaleDeed')}
                      </div>
                      {renderEditSwitch('axisSbbPlotAreaAsPerSaleDeed', !!fields.axisSbbPlotAreaAsPerSaleDeedIsNA)}
                    </div>
                    {!fields.axisSbbPlotAreaAsPerSaleDeedEditOn && !fields.axisSbbPlotAreaAsPerSaleDeedIsNA && (
                      <div className="flex items-center space-x-2 mb-2 mt-1">
                        <input
                          type="number"
                          className={`${inputCls} w-24 px-2`}
                          placeholder="SQFT"
                          value={fields.axisSbbPlotAreaSqft || ''}
                          onChange={e => handleChange('axisSbbPlotAreaSqft', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">SQFT (AC.</span>
                        <input
                          type="number"
                          className={`${inputCls} w-24 px-2`}
                          placeholder="0.000"
                          step="0.001"
                          value={fields.axisSbbPlotAreaAcres || ''}
                          onChange={e => handleChange('axisSbbPlotAreaAcres', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">DECS)</span>
                      </div>
                    )}
                    <textarea
                      className={`${inputCls} resize-y ${!fields.axisSbbPlotAreaAsPerSaleDeedEditOn && !fields.axisSbbPlotAreaAsPerSaleDeedIsNA ? 'bg-lime-50 text-lime-900 border-lime-300' : ''}`}
                      rows={1}
                      value={fields.axisSbbPlotAreaAsPerSaleDeedIsNA ? 'NA' : (fields.axisSbbPlotAreaAsPerSaleDeedEditOn ? (fields.axisSbbPlotAreaAsPerSaleDeed || '') : areaComputed)}
                      onChange={e => handleChange('axisSbbPlotAreaAsPerSaleDeed', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbPlotAreaAsPerSaleDeedEditOn || fields.axisSbbPlotAreaAsPerSaleDeedIsNA}
                      disabled={isReadOnly || (!fields.axisSbbPlotAreaAsPerSaleDeedEditOn && !fields.axisSbbPlotAreaAsPerSaleDeedIsNA)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">CLASS OF LOCALITY</label>
                        {renderNaToggle('axisSbbClassOfLocality')}
                      </div>

                    </div>
                    {renderRadioGroup('axisSbbClassOfLocality', ['POSH', 'HIGHER MIDDLE CLASS', 'MIDDLE CLASS', 'LOWER MIDDLE CLASS', 'POOR'])}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">QUALITY OF INFRASTRUCTURE</label>
                        {renderNaToggle('axisSbbQualityOfInfrastructure')}
                      </div>

                    </div>
                    {renderRadioGroup('axisSbbQualityOfInfrastructure', ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'])}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">OWNERSHIP STATUS OF THE PROPERTY</label>
                        {renderNaToggle('axisSbbOwnershipStatus')}
                      </div>

                    </div>
                    {renderRadioGroup('axisSbbOwnershipStatus', ['FREE HOLD', 'LEASE HOLD', 'REG. LEASE', 'GOVT. AUTHORITY, SPECIFY'])}
                    {fields.axisSbbOwnershipStatus === 'GOVT. AUTHORITY, SPECIFY' && !fields.axisSbbOwnershipStatusIsNA && (
                      <input
                        type="text"
                        className={`${inputCls} mt-2`}
                        placeholder="Specify Govt Authority"
                        value={fields.axisSbbOwnershipStatusSpecify || ''}
                        onChange={e => handleChange('axisSbbOwnershipStatusSpecify', e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">APPROVED USAGE OF PROPERTY</label>
                        {renderNaToggle('axisSbbApprovedUsage')}
                      </div>

                    </div>
                    {renderRadioGroup('axisSbbApprovedUsage', ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND', 'MIX/AGRI', 'OTHERS/AGRI'])}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ACTUAL USAGE OF PROPERTY</label>
                        {renderNaToggle('axisSbbActualUsage')}
                      </div>

                    </div>
                    {renderRadioGroup('axisSbbActualUsage', ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND', 'MIX/AGRI', 'OTHERS/AGRI'])}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">RESTRICTIVE COVENANTS IN REGARDS TO LAND USE</label>
                        {renderNaToggle('axisSbbRestrictiveCovenants')}
                      </div>

                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbRestrictiveCovenantsIsNA ? 'NA' : (fields.axisSbbRestrictiveCovenants || '')}
                      onChange={e => handleChange('axisSbbRestrictiveCovenants', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbRestrictiveCovenantsIsNA}
                      disabled={isReadOnly || fields.axisSbbRestrictiveCovenantsIsNA}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-7',
      title: 'Structure, Tenancy & Planning Approvals',
      number: 7,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const renderRadioGroup = (field: string, options: string[]) => (
          <div className={`flex flex-wrap gap-3 ${fields[`${field}IsNA`] ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {options.map(opt => (
              <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields[field] === opt && !fields[`${field}IsNA`]) ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name={field}
                  value={opt}
                  checked={fields[field] === opt && !fields[`${field}IsNA`]}
                  onChange={e => handleChange(field, e.target.value)}
                  disabled={isReadOnly || !!fields[`${field}IsNA`] || (!fields[`${field}EditOn`] && fields[`${field}EditOn`] !== undefined)}
                  className="text-amber-500 focus:ring-amber-400 border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

        const isRentYes = fields.axisSbbPropertyOnRent === 'YES' && !fields.axisSbbPropertyOnRentIsNA;

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
              <h3 className="font-bold text-gray-700 mb-4">OCCUPANCY DETAILS & STRUCTURE CLASSIFICATION</h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">TYPE OF STRUCTURE</label>
                        {renderNaToggle('axisSbbTypeOfStructure')}
                      </div>
                    </div>
                    <div className={`flex flex-wrap gap-3 ${fields.axisSbbTypeOfStructureIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {[
                        { id: 'axisSbbTypeOfStructureGCI', label: 'GCI' },
                        { id: 'axisSbbTypeOfStructureTinShed', label: 'TIN SHED' },
                        { id: 'axisSbbTypeOfStructureRCC', label: 'RCC' },
                        { id: 'axisSbbTypeOfStructureAluform', label: 'ALUFORM SHUTTERING' }
                      ].map(item => (
                        <label key={item.id} className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer bg-white border-gray-200 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={!!fields[item.id]}
                            onChange={e => handleChange(item.id, e.target.checked)}
                            disabled={isReadOnly || !!fields.axisSbbTypeOfStructureIsNA}
                            className="text-amber-500 focus:ring-amber-400 border-gray-300 rounded"
                          />
                          <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">NO. OF FLOORS</label>
                        {renderNaToggle('axisSbbNoOfFloors')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbNoOfFloorsIsNA ? 'NA' : (fields.axisSbbNoOfFloors || '')}
                      onChange={e => handleChange('axisSbbNoOfFloors', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbNoOfFloorsIsNA}
                      disabled={isReadOnly || fields.axisSbbNoOfFloorsIsNA}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">OCCUPANCY DETAILS</label>
                        {renderNaToggle('axisSbbOccupancyDetails')}
                      </div>
                    </div>
                    {renderRadioGroup('axisSbbOccupancyDetails', ['SELF-OCCUPIED', 'RENTED', 'VACANT'])}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">IF THE PROPERTY IS ON RENT</label>
                        {renderNaToggle('axisSbbPropertyOnRent')}
                      </div>
                    </div>
                    {renderRadioGroup('axisSbbPropertyOnRent', ['YES', 'NO'])}
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-white/50 ${!isRentYes ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">NUMBER OF TENANT</label>
                        {renderNaToggle('axisSbbNumberOfTenantsDetails')}
                      </div>
                    </div>
                    <textarea
                      className={`${inputCls} resize-y`}
                      rows={1}
                      value={fields.axisSbbNumberOfTenantsDetailsIsNA || !isRentYes ? 'NA' : (fields.axisSbbNumberOfTenantsDetails || '')}
                      onChange={e => handleChange('axisSbbNumberOfTenantsDetails', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbNumberOfTenantsDetailsIsNA || !isRentYes}
                      disabled={isReadOnly || fields.axisSbbNumberOfTenantsDetailsIsNA || !isRentYes}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">NAME OF TENANT/LEASE</label>
                        {renderNaToggle('axisSbbNameOfTenantLease')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbNameOfTenantLeaseIsNA || !isRentYes ? 'NA' : (fields.axisSbbNameOfTenantLease || '')}
                      onChange={e => handleChange('axisSbbNameOfTenantLease', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbNameOfTenantLeaseIsNA || !isRentYes}
                      disabled={isReadOnly || fields.axisSbbNameOfTenantLeaseIsNA || !isRentYes}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">YEARS IN TENANCY</label>
                        {renderNaToggle('axisSbbYearsInTenancy')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbYearsInTenancyIsNA || !isRentYes ? 'NA' : (fields.axisSbbYearsInTenancy || '')}
                      onChange={e => handleChange('axisSbbYearsInTenancy', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbYearsInTenancyIsNA || !isRentYes}
                      disabled={isReadOnly || fields.axisSbbYearsInTenancyIsNA || !isRentYes}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ANY RESISTANCE FOR VALUATION?</label>
                        {renderNaToggle('axisSbbResistanceForValuation')}
                      </div>
                    </div>
                    {renderRadioGroup('axisSbbResistanceForValuation', ['YES', 'NO'])}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">RESISTANCE FROM OCCUPANTS?</label>
                        {renderNaToggle('axisSbbResistanceFromOccupants')}
                      </div>
                    </div>
                    {/* If previous is NO, this is also implicitly disabled in UX usually, but we'll follow logic */}
                    <div className={`flex flex-wrap gap-3 ${(fields.axisSbbResistanceFromOccupantsIsNA || fields.axisSbbResistanceForValuation === 'NO') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {['YES', 'NO'].map(opt => (
                        <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields.axisSbbResistanceFromOccupants === opt && !fields.axisSbbResistanceFromOccupantsIsNA) ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input
                            type="radio"
                            name="axisSbbResistanceFromOccupants"
                            value={opt}
                            checked={fields.axisSbbResistanceFromOccupants === opt && !fields.axisSbbResistanceFromOccupantsIsNA}
                            onChange={e => handleChange('axisSbbResistanceFromOccupants', e.target.value)}
                            disabled={isReadOnly || !!fields.axisSbbResistanceFromOccupantsIsNA || fields.axisSbbResistanceForValuation === 'NO'}
                            className="text-amber-500 focus:ring-amber-400 border-gray-300"
                          />
                          <span className="text-xs font-semibold text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">BASIC AMENITIES</label>
                        {renderNaToggle('axisSbbBasicAmenities')}
                      </div>
                    </div>
                    <div className={`flex flex-wrap gap-3 ${fields.axisSbbBasicAmenitiesIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {[
                        { id: 'axisSbbBasicAmenitiesElectricity', label: 'ELECTRICITY' },
                        { id: 'axisSbbBasicAmenitiesWater', label: 'WATER' },
                        { id: 'axisSbbBasicAmenitiesDrainage', label: 'DRAINAGE CONNECTION' }
                      ].map(item => (
                        <label key={item.id} className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer bg-white border-gray-200 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={!!fields[item.id]}
                            onChange={e => handleChange(item.id, e.target.checked)}
                            disabled={isReadOnly || !!fields.axisSbbBasicAmenitiesIsNA}
                            className="text-amber-500 focus:ring-amber-400 border-gray-300 rounded"
                          />
                          <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">SURROUNDING AREA DEVELOPMENT</label>
                        {renderNaToggle('axisSbbDevelopmentSurroundingArea')}
                      </div>
                    </div>
                    <div className={`flex flex-wrap gap-3 ${fields.axisSbbDevelopmentSurroundingAreaIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {['UNDER DEVELOPED', 'DEVELOPING', 'DEVELOPED'].map(opt => (
                        <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields.axisSbbDevelopmentSurroundingArea === opt && !fields.axisSbbDevelopmentSurroundingAreaIsNA) ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input
                            type="radio"
                            name="axisSbbDevelopmentSurroundingArea"
                            value={opt}
                            checked={fields.axisSbbDevelopmentSurroundingArea === opt && !fields.axisSbbDevelopmentSurroundingAreaIsNA}
                            onChange={e => handleChange('axisSbbDevelopmentSurroundingArea', e.target.value)}
                            disabled={isReadOnly || !!fields.axisSbbDevelopmentSurroundingAreaIsNA}
                            className="text-amber-500 focus:ring-amber-400 border-gray-300"
                          />
                          <span className="text-xs font-semibold text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }}>
              <h3 className="font-bold text-gray-700 mb-4">APPROVAL DETAILS & CONSTRUCTION DETAILS</h3>
              
              <div className="space-y-5">
                
                {/* SUB-CONTAINER 7.2A: LAYOUT APPROVAL NUMBER */}
                <div className="border-b border-teal-200 pb-4 mb-4">
                  <h4 className="font-bold text-xs text-teal-800 mb-3">LAYOUT APPROVAL NUMBER</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DATE OF APPROVAL :-</label>
                        {renderNaToggle('axisSbbLayoutApprovalDate')}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls}`}
                        value={fields.axisSbbLayoutApprovalDateIsNA ? 'NOT PROVIDED' : (fields.axisSbbLayoutApprovalDate || '')}
                        onChange={e => handleChange('axisSbbLayoutApprovalDate', e.target.value.toUpperCase())}
                        disabled={isReadOnly || !!fields.axisSbbLayoutApprovalDateIsNA}
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">EXPIRY DATE :-</label>
                        {renderNaToggle('axisSbbLayoutExpiryDate')}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls}`}
                        value={fields.axisSbbLayoutExpiryDateIsNA ? 'NOT PROVIDED' : (fields.axisSbbLayoutExpiryDate || '')}
                        onChange={e => handleChange('axisSbbLayoutExpiryDate', e.target.value.toUpperCase())}
                        disabled={isReadOnly || !!fields.axisSbbLayoutExpiryDateIsNA}
                      />
                    </div>
                  </div>
                </div>

                {/* SUB-CONTAINER 7.2B: BUILDING PLAN APPROVAL NUMBER */}
                <div className="border-b border-teal-200 pb-4 mb-4">
                  <h4 className="font-bold text-xs text-teal-800 mb-3">BUILDING PLAN APPROVAL NUMBER</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DATE OF APPROVAL :-</label>
                        {renderNaToggle('axisSbbBuildingPlanApprovalDate')}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls}`}
                        value={fields.axisSbbBuildingPlanApprovalDateIsNA ? 'NOT PROVIDED' : (fields.axisSbbBuildingPlanApprovalDate || '')}
                        onChange={e => handleChange('axisSbbBuildingPlanApprovalDate', e.target.value.toUpperCase())}
                        disabled={isReadOnly || !!fields.axisSbbBuildingPlanApprovalDateIsNA}
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">EXPIRY DATE :-</label>
                        {renderNaToggle('axisSbbBuildingPlanExpiryDate')}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls}`}
                        value={fields.axisSbbBuildingPlanExpiryDateIsNA ? 'NOT PROVIDED' : (fields.axisSbbBuildingPlanExpiryDate || '')}
                        onChange={e => handleChange('axisSbbBuildingPlanExpiryDate', e.target.value.toUpperCase())}
                        disabled={isReadOnly || !!fields.axisSbbBuildingPlanExpiryDateIsNA}
                      />
                    </div>
                  </div>
                </div>

                {/* SUB-CONTAINER 7.2C: CONSTRUCTION DETAILS */}
                <div className="border-b border-teal-200 pb-4 mb-4">
                  <h4 className="font-bold text-xs text-teal-800 mb-3">CONSTRUCTION DETAILS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="flex flex-col space-y-5">
                      {/* AREA OF THE PLOT/FLAT */}
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1 justify-between">
                          <div className="flex items-center space-x-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">AREA OF THE PLOT/FLAT (IN SQ.FT.)</label>
                            {renderNaToggle('axisSbbAreaOfThePlot')}
                          </div>
                          {renderEditSwitch('axisSbbAreaOfThePlot', !!fields.axisSbbAreaOfThePlotIsNA)}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            className={`${inputCls} ${!fields.axisSbbAreaOfThePlotEditOn && !fields.axisSbbAreaOfThePlotIsNA ? 'bg-gray-100 pr-8' : ''}`}
                            value={fields.axisSbbAreaOfThePlotIsNA ? 'NA' : (fields.axisSbbAreaOfThePlotEditOn ? (fields.axisSbbAreaOfThePlot || '') : (fields.axisSbbPlotAreaAsPerDocument || ''))}
                            onChange={e => handleChange('axisSbbAreaOfThePlot', e.target.value.toUpperCase())}
                            disabled={isReadOnly || !!fields.axisSbbAreaOfThePlotIsNA || !fields.axisSbbAreaOfThePlotEditOn}
                          />
                          {!fields.axisSbbAreaOfThePlotEditOn && !fields.axisSbbAreaOfThePlotIsNA && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefilled from Section 6 "PLOT AREA AS PER DOCUMENTS"'>
                              <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* DEMARCATION AT SITE */}
                      <div className="flex flex-col">
                        <div className="flex items-center mb-1">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DEMARCATION AT SITE</label>
                          {renderNaToggle('axisSbbDemarcationAtSite')}
                        </div>
                        <div className="flex gap-4 mt-2">
                          {['YES', 'NO'].map(opt => (
                            <label key={opt} className="flex items-center text-xs font-medium text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name="axisSbbDemarcationAtSite"
                                value={opt}
                                checked={!fields.axisSbbDemarcationAtSiteIsNA && fields.axisSbbDemarcationAtSite === opt}
                                onChange={() => handleChange('axisSbbDemarcationAtSite', opt)}
                                disabled={isReadOnly || !!fields.axisSbbDemarcationAtSiteIsNA}
                                className="mr-1.5 text-teal-600 focus:ring-teal-500"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* APPROVED BUILT UP AREA */}
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1 justify-between">
                        <div className="flex items-center space-x-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">APPROVED BUILT UP AREA (IN SQ.FT.)</label>
                          {renderNaToggle('axisSbbApprovedBuiltUpArea')}
                        </div>
                        {renderEditSwitch('axisSbbApprovedBuiltUpArea', !!fields.axisSbbApprovedBuiltUpAreaIsNA)}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          className={`${inputCls} ${!fields.axisSbbApprovedBuiltUpAreaEditOn && !fields.axisSbbApprovedBuiltUpAreaIsNA ? 'bg-gray-100 pr-8' : ''}`}
                          value={fields.axisSbbApprovedBuiltUpAreaIsNA ? 'NA' : (fields.axisSbbApprovedBuiltUpAreaEditOn ? (fields.axisSbbApprovedBuiltUpArea || '') : (fields.axisSbbTotalConstructedArea || ''))}
                          onChange={e => handleChange('axisSbbApprovedBuiltUpArea', e.target.value.toUpperCase())}
                          disabled={isReadOnly || !!fields.axisSbbApprovedBuiltUpAreaIsNA || !fields.axisSbbApprovedBuiltUpAreaEditOn}
                        />
                        {!fields.axisSbbApprovedBuiltUpAreaEditOn && !fields.axisSbbApprovedBuiltUpAreaIsNA && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Prefilled from Section 8 "TOTAL BUILT UP AREA"'>
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-8',
      title: 'Construction Breakdown & Building Details',
      number: 8,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const floors = JSON.parse(fields.axisSbbFloorData || '[]');
        
        const updateFloor = (idx: number, key: string, value: any) => {
          const newFloors = [...floors];
          newFloors[idx][key] = value;
          handleChange('axisSbbFloorData', JSON.stringify(newFloors));
        };

        const addFloor = () => {
          const newFloors = [...floors];
          const num = newFloors.length + 1;
          const suffix = ['TH', 'ST', 'ND', 'RD'][(num % 100 > 10 && num % 100 < 20) ? 0 : (num % 10 < 4 ? num % 10 : 0)];
          newFloors.push({ 
            id: String(Date.now()), 
            floorName: `${num}${suffix} FLOOR* (ADD AS PER REQUIREMENT)`, 
            constructedArea: null, constructedAreaIsNA: true, 
            approvedArea: null, approvedAreaIsNA: true, 
            permissibleArea: null, permissibleAreaIsNA: true, 
            valuationArea: null, valuationAreaIsNA: true, 
            accommodation: "", accommodationIsNA: true, 
            usageStorage: false, usageParking: false, usageCommercial: false, usageResidential: false, usageIndustry: false 
          });
          handleChange('axisSbbFloorData', JSON.stringify(newFloors));
        };

        const removeFloor = (idx: number) => {
          const newFloors = [...floors];
          newFloors.splice(idx, 1);
          handleChange('axisSbbFloorData', JSON.stringify(newFloors));
        };

        // Computed sums
        let sumConstructed = 0;
        let sumValuation = 0;
        let sumApproved = 0;
        let sumPermissible = 0;
        
        let sumAccommodationNumeric = 0;
        let accommodationList: string[] = [];
        let isAccommodationNumeric = true;
        let hasAccommodation = false;

        floors.forEach((f: any) => {
          if (!f.constructedAreaIsNA && f.constructedArea) sumConstructed += Number(f.constructedArea) || 0;
          if (!f.valuationAreaIsNA && f.valuationArea) sumValuation += Number(f.valuationArea) || 0;
          if (!f.approvedAreaIsNA && f.approvedArea) sumApproved += Number(f.approvedArea) || 0;
          if (!f.permissibleAreaIsNA && f.permissibleArea) sumPermissible += Number(f.permissibleArea) || 0;
          
          if (!f.accommodationIsNA && f.accommodation) {
            hasAccommodation = true;
            const val = String(f.accommodation).trim();
            accommodationList.push(val);
            if (isNaN(Number(val))) {
              isAccommodationNumeric = false;
            } else {
              sumAccommodationNumeric += Number(val);
            }
          }
        });

        const computedConstructed = `${sumConstructed} SQFT`;
        const computedValuation = `${sumValuation} SQFT`;
        const computedApproved = `${sumApproved} SQFT`;
        const computedPermissible = `${sumPermissible} SQFT`;
        const computedAccommodation = !hasAccommodation ? '0' : (isAccommodationNumeric ? `${sumAccommodationNumeric}` : accommodationList.join(' + '));
        const computedCarpet = `${Math.round(sumConstructed * 0.85)} SQFT`;
        const computedSaleable = computedCarpet;

        const roofTypes = [];
        if (fields.axisSbbQualityOfConstructionRoofRCC) roofTypes.push('RCC');
        if (fields.axisSbbQualityOfConstructionRoofPatti) roofTypes.push('PATTI');
        if (fields.axisSbbQualityOfConstructionRoofTinShed) roofTypes.push('TIN SHED');
        if (fields.axisSbbQualityOfConstructionRoofClayTiles) roofTypes.push('CLAY TILES');
        const roofStr = roofTypes.length ? roofTypes.join('/') + ' ROOF' : 'ROOF';

        const floorTypes = [];
        if (fields.axisSbbQualityOfConstructionFloorTiles) floorTypes.push('TILES');
        if (fields.axisSbbQualityOfConstructionFloorMarble) floorTypes.push('MARBLE');
        if (fields.axisSbbQualityOfConstructionFloorKotaStone) floorTypes.push('KOTA STONE');
        if (fields.axisSbbQualityOfConstructionFloorLocalStone) floorTypes.push('LOCAL STONE');
        if (fields.axisSbbQualityOfConstructionFloorCC) floorTypes.push('C.C');
        const floorStr = floorTypes.length ? floorTypes.join('/') + ' FLOOR' : 'FLOOR';

        const computedQuality = `${roofStr} WITH MASONRY WALLS WITH ${floorStr}`;

        return (
          <div className="animate-fade-in space-y-6">
            
            {/* TABLE 8.1 */}
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }}>
              <h3 className="font-bold text-gray-700 mb-4 uppercase">FLOOR WISE BREAK UP AS FOLLOWS IN SQ.FT.</h3>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200/50 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 w-48 border-r border-slate-300">FLOOR</th>
                      <th className="p-2 w-28 border-r border-slate-300">CONSTRUCTED ACTUAL AREA AS PER SITE (SQ.FT)</th>
                      <th className="p-2 w-28 border-r border-slate-300">APPROVED AREA AS PER PLAN(SQ.FT)</th>
                      <th className="p-2 w-28 border-r border-slate-300">PERMISSIBLE AREA AS PER BYELAWS (SQ.FT)</th>
                      <th className="p-2 w-28 border-r border-slate-300">AREA CONSIDERED FOR VALUATION (SQ.FT) / FAR 2</th>
                      <th className="p-2 w-48 border-r border-slate-300">ACCOMMODATETION</th>
                      <th className="p-2 min-w-50 border-r border-slate-300">CURRENT USAGE</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {floors.map((f: any, i: number) => (
                      <tr key={f.id} className="hover:bg-slate-50/50">
                        <td className="p-2 align-top border-r border-slate-300">
                          <input 
                            type="text" 
                            className={`${inputCls} font-bold text-[11px]`} 
                            value={f.floorName} 
                            onChange={e => updateFloor(i, 'floorName', e.target.value.toUpperCase())}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 align-top border-r border-slate-300">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-400">NA?</span>
                            <input type="checkbox" checked={f.constructedAreaIsNA} onChange={e => updateFloor(i, 'constructedAreaIsNA', e.target.checked)} disabled={isReadOnly} className="w-3 h-3 text-red-500 rounded border-gray-300" />
                          </div>
                          <input 
                            type="number" 
                            step="0.01"
                            className={`${inputCls}`} 
                            value={f.constructedAreaIsNA ? '' : (f.constructedArea || '')} 
                            onChange={e => updateFloor(i, 'constructedArea', e.target.value)}
                            disabled={isReadOnly || f.constructedAreaIsNA}
                            placeholder="Sq.Ft."
                          />
                        </td>
                        <td className="p-2 align-top border-r border-slate-300">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-400">NA?</span>
                            <input type="checkbox" checked={f.approvedAreaIsNA} onChange={e => updateFloor(i, 'approvedAreaIsNA', e.target.checked)} disabled={isReadOnly} className="w-3 h-3 text-red-500 rounded border-gray-300" />
                          </div>
                          <input 
                            type="text" 
                            className={`${inputCls}`} 
                            value={f.approvedAreaIsNA ? 'NA' : (f.approvedArea || '')} 
                            onChange={e => updateFloor(i, 'approvedArea', e.target.value.toUpperCase())}
                            disabled={isReadOnly || f.approvedAreaIsNA}
                            placeholder="NA"
                          />
                        </td>
                        <td className="p-2 align-top border-r border-slate-300">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-400">NA?</span>
                            <input type="checkbox" checked={f.permissibleAreaIsNA} onChange={e => updateFloor(i, 'permissibleAreaIsNA', e.target.checked)} disabled={isReadOnly} className="w-3 h-3 text-red-500 rounded border-gray-300" />
                          </div>
                          <input 
                            type="text" 
                            className={`${inputCls}`} 
                            value={f.permissibleAreaIsNA ? 'NA' : (f.permissibleArea || '')} 
                            onChange={e => updateFloor(i, 'permissibleArea', e.target.value.toUpperCase())}
                            disabled={isReadOnly || f.permissibleAreaIsNA}
                            placeholder="NA"
                          />
                        </td>
                        <td className="p-2 align-top border-r border-slate-300">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-400">NA?</span>
                            <input type="checkbox" checked={f.valuationAreaIsNA} onChange={e => updateFloor(i, 'valuationAreaIsNA', e.target.checked)} disabled={isReadOnly} className="w-3 h-3 text-red-500 rounded border-gray-300" />
                          </div>
                          <input 
                            type="number" 
                            step="0.01"
                            className={`${inputCls}`} 
                            value={f.valuationAreaIsNA ? '' : (f.valuationArea || '')} 
                            onChange={e => updateFloor(i, 'valuationArea', e.target.value)}
                            disabled={isReadOnly || f.valuationAreaIsNA}
                            placeholder="Sq.Ft."
                          />
                        </td>
                        <td className="p-2 align-top border-r border-slate-300">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-gray-400">NA?</span>
                            <input type="checkbox" checked={f.accommodationIsNA} onChange={e => updateFloor(i, 'accommodationIsNA', e.target.checked)} disabled={isReadOnly} className="w-3 h-3 text-red-500 rounded border-gray-300" />
                          </div>
                          <input 
                            type="text" 
                            className={`${inputCls}`} 
                            value={f.accommodationIsNA ? 'NA' : (f.accommodation || '')} 
                            onChange={e => updateFloor(i, 'accommodation', e.target.value.toUpperCase())}
                            disabled={isReadOnly || f.accommodationIsNA}
                          />
                        </td>
                        <td className="p-2 align-top border-r border-slate-300">
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            {['Storage', 'Parking', 'Commercial', 'Residential', 'Industry'].map(u => (
                              <label key={u} className="flex items-center space-x-1 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="w-3 h-3 text-blue-500 rounded border-gray-300"
                                  checked={!!f[`usage${u}`]}
                                  onChange={e => updateFloor(i, `usage${u}`, e.target.checked)}
                                  disabled={isReadOnly}
                                />
                                <span>{u.toUpperCase()}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 align-middle text-center">
                          {i > 1 && (
                            <button type="button" onClick={() => removeFloor(i)} disabled={isReadOnly} className="text-red-500 hover:text-red-700 font-bold p-1">X</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Add Floor Button Row */}
                    <tr style={{ backgroundColor: '#F2F5F8' }}>
                      <td colSpan={8} className="p-2 border-b border-slate-300">
                        <button 
                          type="button" 
                          onClick={addFloor} 
                          disabled={isReadOnly}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded border border-slate-300 transition-colors flex items-center space-x-1"
                        >
                          <span>+ Add Floor Row</span>
                        </button>
                      </td>
                    </tr>
                    {/* Summary Row 1: Built Up Area & Carpet Area Totals */}
                    <tr className="bg-slate-100 border-t-2 border-slate-300">
                      <td className="p-2 font-bold text-xs text-slate-700 border-r border-slate-300">
                        <div>
                          TOTAL BUILT UP AREA (IN SQFT){' '}
                          <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: SUM(CONSTRUCTED ACTUAL AREA AS PER SITE of all floors) = TOTAL BUILT UP AREA]</span>
                        </div>
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-300">
                        <div className="relative">
                          <input 
                            type="text" 
                            className={`${inputCls} font-bold pr-8 disabled:bg-gray-100 disabled:opacity-100 cursor-not-allowed`} 
                            value={computedConstructed}
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="sum of all entries in the CONSTRUCTED ACTUAL AREA AS PER SITE (SQ.FT) column">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-300">
                        <div className="relative">
                          <input type="text" className={`${inputCls} font-bold pr-8 disabled:bg-gray-100 disabled:opacity-100 cursor-not-allowed`} disabled value={computedApproved} />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="sum of all entries in the APPROVED AREA AS PER PLAN(SQ.FT) column">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-300">
                        <div className="relative">
                          <input type="text" className={`${inputCls} font-bold pr-8 disabled:bg-gray-100 disabled:opacity-100 cursor-not-allowed`} disabled value={computedPermissible} />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="sum of all entries in the PERMISSIBLE AREA AS PER BYELAWS (SQ.FT) column">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-300">
                        <div className="relative">
                          <input type="text" className={`${inputCls} font-bold pr-8 disabled:bg-gray-100 disabled:opacity-100 cursor-not-allowed`} disabled value={computedValuation} />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="sum of all entries in the AREA CONSIDERED FOR VALUATION (SQ.FT) / FAR 2 column">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </td>
                      <td className="p-2 font-bold text-slate-800 border-r border-slate-300">
                        <div className="relative">
                          <input type="text" className={`${inputCls} font-bold pr-8 disabled:bg-gray-100 disabled:opacity-100 cursor-not-allowed text-center`} disabled value={computedAccommodation} />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="sum of all entries in the ACCOMMODATETION column">
                            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </td>
                      <td className="p-2" colSpan={2}>
                        <div className="flex flex-col gap-1 bg-amber-50 border border-amber-200 p-2 rounded">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-800">
                              TOTAL CARPET AREA(IN SQFT){' '}
                              <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: TOTAL BUILT UP AREA * 0.85 = TOTAL CARPET AREA]</span>
                            </span>
                            <div className="shrink-0">
                              {renderEditSwitch('axisSbbTotalCarpetArea', false)}
                            </div>
                          </div>
                          <div className="relative mt-1">
                            <input 
                              type="text" 
                              className="bg-white border border-gray-300 p-2 px-3 text-base py-1 w-full text-right font-bold focus:outline-none pr-8 rounded disabled:bg-gray-100 disabled:opacity-100" 
                              value={fields.axisSbbTotalCarpetAreaEditOn ? (fields.axisSbbTotalCarpetArea || '') : computedCarpet}
                              onChange={e => handleChange('axisSbbTotalCarpetArea', e.target.value.toUpperCase())}
                              disabled={isReadOnly || !fields.axisSbbTotalCarpetAreaEditOn}
                            />
                            {!fields.axisSbbTotalCarpetAreaEditOn && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="TOTAL BUILT UP AREA * 0.85">
                                <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Summary Row 2: Saleable Area */}
                    <tr className="bg-slate-200 border-t border-slate-300">
                      <td className="p-2 font-bold text-xs text-slate-800 text-right pr-4" colSpan={5}>
                        <div className="flex items-center justify-end gap-4">
                          <span>
                            TOTAL SALEABLE AREA (IN SQFT.){' '}
                            <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Prefilled from TOTAL CARPET AREA = TOTAL SALEABLE AREA]</span>
                          </span>
                          {renderEditSwitch('axisSbbTotalSaleableArea', false)}
                        </div>
                      </td>
                      <td className="p-2" colSpan={3}>
                        <div className="flex items-center bg-blue-50 border border-blue-200 p-2 px-3 rounded relative">
                          <input 
                            type="text" 
                            className="bg-transparent font-bold w-full focus:outline-none pr-8 disabled:opacity-100 text-base py-1" 
                            value={fields.axisSbbTotalSaleableAreaEditOn ? (fields.axisSbbTotalSaleableArea || '') : computedSaleable}
                            onChange={e => handleChange('axisSbbTotalSaleableArea', e.target.value.toUpperCase())}
                            disabled={isReadOnly || !fields.axisSbbTotalSaleableAreaEditOn}
                          />
                          {!fields.axisSbbTotalSaleableAreaEditOn && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title="directly from the calculated TOTAL CARPET AREA">
                              <Lock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CONTAINER 8.2 */}
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
              <h3 className="font-bold text-gray-700 mb-4 uppercase">BYE-LAWS COMPLIANCE, QUALITY & STRUCTURE LIFE</h3>
              
              <div className="space-y-5">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">WHETHER THE CONSTRUCTION IS AS PER APPROVED BUILDING PLAN AND / OR LOCAL BUILDING BYE LAWS:</label>
                      {renderNaToggle('axisSbbConstructionAsPerApprovedPlan')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['YES', 'NO', 'NOT APPLICABLE BYE LAWS'].map(opt => (
                      <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields.axisSbbConstructionAsPerApprovedPlan === opt) ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="axisSbbConstructionAsPerApprovedPlan"
                          value={opt}
                          checked={fields.axisSbbConstructionAsPerApprovedPlan === opt && !fields.axisSbbConstructionAsPerApprovedPlanIsNA}
                          onChange={e => handleChange('axisSbbConstructionAsPerApprovedPlan', e.target.value)}
                          disabled={isReadOnly || !!fields.axisSbbConstructionAsPerApprovedPlanIsNA}
                          className="text-amber-500 focus:ring-amber-400 border-gray-300"
                        />
                        <span className={`text-xs font-semibold ${fields.axisSbbConstructionAsPerApprovedPlanIsNA ? 'text-gray-400' : 'text-gray-700'}`}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">FSI AS PER PLAN APPROVAL/FSI AS PER GOVT.GUIDELINE & ACTUAL FSI</label>
                      {renderNaToggle('axisSbbFSIAsPerPlan')}
                    </div>
                  </div>
                  <textarea
                    className={`${inputCls} resize-y`}
                    rows={1}
                    value={fields.axisSbbFSIAsPerPlanIsNA ? 'NA' : (fields.axisSbbFSIAsPerPlan || '')}
                    onChange={e => handleChange('axisSbbFSIAsPerPlan', e.target.value.toUpperCase())}
                    disabled={isReadOnly || !!fields.axisSbbFSIAsPerPlanIsNA}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DETAILS OF EXTRA CONSTRUCTION</label>
                        {renderNaToggle('axisSbbExtraConstructionDetails')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbExtraConstructionDetailsIsNA ? 'NA' : (fields.axisSbbExtraConstructionDetails || '')}
                      onChange={e => handleChange('axisSbbExtraConstructionDetails', e.target.value.toUpperCase())}
                      disabled={isReadOnly || !!fields.axisSbbExtraConstructionDetailsIsNA}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PERCENTAGE OF EXTRA CONSTRUCTION</label>
                        {renderNaToggle('axisSbbExtraConstructionPercentage')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbExtraConstructionPercentageIsNA ? 'NA' : (fields.axisSbbExtraConstructionPercentage || '')}
                      onChange={e => handleChange('axisSbbExtraConstructionPercentage', e.target.value.toUpperCase())}
                      disabled={isReadOnly || !!fields.axisSbbExtraConstructionPercentageIsNA}
                    />
                  </div>
                </div>

                <div className="flex flex-col mb-5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">COMPOUNDABLE / NON-COMPOUNDABLE?</label>
                      {renderNaToggle('axisSbbCompoundable')}
                    </div>
                  </div>
                  <select
                    className={`${inputCls} appearance-none bg-white`}
                    value={fields.axisSbbCompoundableIsCustom ? 'Custom' : (fields.axisSbbCompoundable || 'NA')}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        handleChange('axisSbbCompoundableIsCustom', true);
                        handleChange('axisSbbCompoundable', '');
                      } else {
                        handleChange('axisSbbCompoundableIsCustom', false);
                        handleChange('axisSbbCompoundable', val);
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="NA">NA</option>
                    <option value="COMPOUNDABLE">COMPOUNDABLE</option>
                    <option value="NON-COMPOUNDABLE">NON-COMPOUNDABLE</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.axisSbbCompoundableIsCustom && (
                    <input
                      type="text"
                      className={`${inputCls} mt-2`}
                      placeholder="Specify Custom Value"
                      value={fields.axisSbbCompoundable || ''}
                      onChange={e => handleChange('axisSbbCompoundable', e.target.value.toUpperCase())}
                      disabled={isReadOnly}
                    />
                  )}
                </div>

                {(() => {
                  const roofTypes = [
                    { key: 'axisSbbQualityOfConstructionRoofRCC', label: 'RCC' },
                    { key: 'axisSbbQualityOfConstructionRoofPatti', label: 'PATTI' },
                    { key: 'axisSbbQualityOfConstructionRoofTinShed', label: 'TIN SHED' },
                    { key: 'axisSbbQualityOfConstructionRoofClayTiles', label: 'CLAY TILES' }
                  ].filter(opt => fields[opt.key]).map(opt => opt.label);
                  const roofStr = roofTypes.length ? roofTypes.join('/') + ' ROOF' : 'ROOF';

                  const floorTypes = [
                    { key: 'axisSbbQualityOfConstructionFloorTiles', label: 'TILES' },
                    { key: 'axisSbbQualityOfConstructionFloorMarble', label: 'MARBLE' },
                    { key: 'axisSbbQualityOfConstructionFloorKotaStone', label: 'KOTA STONE' },
                    { key: 'axisSbbQualityOfConstructionFloorLocalStone', label: 'LOCAL STONE' },
                    { key: 'axisSbbQualityOfConstructionFloorCC', label: 'C.C' }
                  ].filter(opt => fields[opt.key]).map(opt => opt.label);

                  return (
                    <div className="flex flex-col border border-amber-200 rounded-lg p-3 bg-white/50">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide">
                            <span className="bg-amber-200/60 px-1.5 py-0.5 rounded">QUALITY OF CONSTRUCTION</span> <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Selected_Roof_Option + " WITH MASONRY WALLS WITH " + Selected_Floor_Option + " FLOOR " = QUALITY OF CONSTRUCTION]</span>
                          </label>
                          {renderNaToggle('axisSbbQualityOfConstruction')}
                        </div>
                        {renderEditSwitch('axisSbbQualityOfConstruction', !!fields.axisSbbQualityOfConstructionIsNA)}
                      </div>
                      
                      <div className={`grid gap-4 mb-3 p-3 rounded-lg border border-amber-100 bg-amber-50/50 ${fields.axisSbbQualityOfConstructionEditOn || fields.axisSbbQualityOfConstructionIsNA ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>
                          <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase">Roof Structure</h4>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { key: 'axisSbbQualityOfConstructionRoofRCC', label: 'RCC' },
                              { key: 'axisSbbQualityOfConstructionRoofPatti', label: 'PATTI' },
                              { key: 'axisSbbQualityOfConstructionRoofTinShed', label: 'TIN SHED' },
                              { key: 'axisSbbQualityOfConstructionRoofClayTiles', label: 'CLAY TILES' }
                            ].map(opt => (
                              <label key={opt.key} className="flex items-center space-x-1.5 text-xs cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={!!fields[opt.key]}
                                  onChange={e => handleChange(opt.key, e.target.checked)}
                                  disabled={isReadOnly || !!fields.axisSbbQualityOfConstructionEditOn || !!fields.axisSbbQualityOfConstructionIsNA}
                                  className="w-4 h-4 text-amber-500 rounded border-gray-300"
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center py-1">
                          <span className="text-xs font-bold text-slate-500 border border-dashed border-slate-300 px-3 py-1 rounded-full">WITH MASONRY WALLS WITH</span>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase">Flooring Type</h4>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { key: 'axisSbbQualityOfConstructionFloorTiles', label: 'TILES' },
                              { key: 'axisSbbQualityOfConstructionFloorMarble', label: 'MARBLE' },
                              { key: 'axisSbbQualityOfConstructionFloorKotaStone', label: 'KOTA STONE' },
                              { key: 'axisSbbQualityOfConstructionFloorLocalStone', label: 'LOCAL STONE' },
                              { key: 'axisSbbQualityOfConstructionFloorCC', label: 'C.C' }
                            ].map(opt => (
                              <label key={opt.key} className="flex items-center space-x-1.5 text-xs cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={!!fields[opt.key]}
                                  onChange={e => handleChange(opt.key, e.target.checked)}
                                  disabled={isReadOnly || !!fields.axisSbbQualityOfConstructionEditOn || !!fields.axisSbbQualityOfConstructionIsNA}
                                  className="w-4 h-4 text-amber-500 rounded border-gray-300"
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <textarea
                        className={`${inputCls} resize-y font-medium text-slate-700 bg-amber-50/30 border-amber-200 focus:ring-amber-400 focus:border-amber-400`}
                        rows={2}
                        value={fields.axisSbbQualityOfConstructionIsNA ? 'NA' : (fields.axisSbbQualityOfConstructionEditOn ? (fields.axisSbbQualityOfConstruction || '') : `${roofStr} WITH MASONRY WALLS WITH ${floorTypes.length ? floorTypes.join('/') + ' FLOOR' : 'FLOOR'}`)}
                        onChange={e => handleChange('axisSbbQualityOfConstruction', e.target.value.toUpperCase())}
                        readOnly={!fields.axisSbbQualityOfConstructionEditOn || fields.axisSbbQualityOfConstructionIsNA}
                        disabled={isReadOnly || (!fields.axisSbbQualityOfConstructionEditOn && !fields.axisSbbQualityOfConstructionIsNA)}
                      />
                    </div>
                  );
                })()}

                <div className="flex flex-col mt-5 mb-5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">MAINTENANCE OF PROPERTY</label>
                    </div>
                  </div>
                  <select
                    className={`${inputCls} appearance-none bg-white`}
                    value={fields.axisSbbMaintenanceOfPropertyIsCustom ? 'Custom' : (fields.axisSbbMaintenanceOfProperty || 'GOOD')}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        handleChange('axisSbbMaintenanceOfPropertyIsCustom', true);
                        handleChange('axisSbbMaintenanceOfProperty', '');
                      } else {
                        handleChange('axisSbbMaintenanceOfPropertyIsCustom', false);
                        handleChange('axisSbbMaintenanceOfProperty', val);
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="NA">NA</option>
                    <option value="GOOD">GOOD</option>
                    <option value="AVERAGE">AVERAGE</option>
                    <option value="POOR">POOR</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.axisSbbMaintenanceOfPropertyIsCustom && (
                    <input
                      type="text"
                      className={`${inputCls} mt-2`}
                      placeholder="Specify Custom Value"
                      value={fields.axisSbbMaintenanceOfProperty || ''}
                      onChange={e => handleChange('axisSbbMaintenanceOfProperty', e.target.value.toUpperCase())}
                      disabled={isReadOnly}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">CURRENT LIFE OF STRUCTURE (YEARS)</label>
                        {renderNaToggle('axisSbbCurrentLifeOfStructure')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbCurrentLifeOfStructureIsNA ? 'NA' : (fields.axisSbbCurrentLifeOfStructure || '')}
                      onChange={e => handleChange('axisSbbCurrentLifeOfStructure', e.target.value.toUpperCase())}
                      disabled={isReadOnly || !!fields.axisSbbCurrentLifeOfStructureIsNA}
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PROJECTED LIFE OF STRUCTURE (YEARS)</label>
                        {renderNaToggle('axisSbbProjectedLifeOfStructure')}
                      </div>
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbProjectedLifeOfStructureIsNA ? 'NA' : (fields.axisSbbProjectedLifeOfStructure || '')}
                      onChange={e => handleChange('axisSbbProjectedLifeOfStructure', e.target.value.toUpperCase())}
                      disabled={isReadOnly || !!fields.axisSbbProjectedLifeOfStructureIsNA}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-9',
      title: 'VALUATION CALCULATIONS & SUMMARY',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const renderNaToggle = (field: string) => (
          <label className="flex items-center space-x-1 ml-2 text-xs">
            <input type="checkbox" checked={!!fields[`${field}IsNA`]} onChange={e => handleChange(`${field}IsNA`, e.target.checked)} disabled={isReadOnly} className="w-3 h-3 text-red-500 rounded border-gray-300 focus:ring-red-500" />
            <span className="text-gray-500">NA</span>
          </label>
        );

        const renderEditSwitch = (fieldKey: string, disabledCondition: boolean) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChange(`${fieldKey}EditOn`, !fields[`${fieldKey}EditOn`])}
              disabled={isReadOnly || disabledCondition}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields[`${fieldKey}EditOn`] ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly || disabledCondition ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields[`${fieldKey}EditOn`] ? 'translate-x-3' : 'translate-x-1'}`} />
            </button>
            <span className={`text-[9px] font-bold ${fields[`${fieldKey}EditOn`] ? 'text-emerald-700' : 'text-gray-500'}`}>EDIT</span>
          </div>
        );

        // Pre-fills
        const landAreaPrefill = fields.axisSbbPlotAreaAsPerDocument || '';
        const floors9 = JSON.parse(fields.axisSbbFloorData || '[]');
        let sumConstructed9 = 0;
        floors9.forEach((f: any) => {
          if (!f.constructedAreaIsNA && f.constructedArea) sumConstructed9 += Number(f.constructedArea) || 0;
        });
        const buildingAreaPrefillStr = `${sumConstructed9}`;
        const buildingAreaPrefill = buildingAreaPrefillStr.replace(/[^0-9.]/g, '') || '';

        // Computations Market Valuation
        const landAmount = Number(fields.axisSbbValuationLandAreaIsNA ? 0 : (fields.axisSbbValuationLandAreaEditOn ? fields.axisSbbValuationLandArea : landAreaPrefill)) * Number(fields.axisSbbValuationLandRate || 0);
        const buildingAmount = Number(fields.axisSbbValuationBuildingAreaIsNA ? 0 : (fields.axisSbbValuationBuildingAreaEditOn ? fields.axisSbbValuationBuildingArea : buildingAreaPrefill)) * Number(fields.axisSbbValuationBuildingRate || 0);
        const amenitiesAmount = Number(fields.axisSbbValuationAmenitiesArea || 0) * Number(fields.axisSbbValuationAmenitiesRate || 0);
        const totalAmountComp = landAmount + buildingAmount + amenitiesAmount;
        const totalSayComp = Math.floor(totalAmountComp / 1000) * 1000;

        // Computations Government Guideline
        const govtLandAmount = Number(fields.axisSbbGovtLandAreaIsNA ? 0 : (fields.axisSbbGovtLandAreaEditOn ? fields.axisSbbGovtLandArea : landAreaPrefill)) * Number(fields.axisSbbGovtLandRate || 0);
        const govtBuildingAmount = Number(fields.axisSbbGovtBuildingAreaIsNA ? 0 : (fields.axisSbbGovtBuildingAreaEditOn ? fields.axisSbbGovtBuildingArea : buildingAreaPrefill)) * Number(fields.axisSbbGovtBuildingRate || 0);

        // Summary calculations
        const marketValueComp = totalAmountComp;
        const distressValueComp = marketValueComp * 0.90;
        const realizableValueComp = marketValueComp * 0.95;
        const insurableValueComp = buildingAmount * 0.85;

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-emerald-200 bg-[#ECFDF5] rounded-xl p-4 relative shadow-sm">
              <h3 className="font-bold text-emerald-800 mb-4 uppercase">Market Valuation Calculation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse bg-white shadow-sm rounded-md overflow-hidden">
                  <thead className="bg-emerald-50 border-b border-emerald-200">
                    <tr className="text-left text-xs font-bold text-emerald-800">
                      <th className="p-3 w-48">ITEM DESCRIPTION</th>
                      <th className="p-3">AREA (SQ.FT)</th>
                      <th className="p-3">RATE PER SQ.FT (RS.)</th>
                      <th className="p-3">
                        AMOUNT (RS.){' '}
                        <span style={{ color: 'red', fontWeight: 'bold', display: 'block', fontSize: '10px', marginTop: '4px', textTransform: 'none' }}>
                          [Formula: AREA (SQ.FT) * RATE PER SQ.FT (RS.) = AMOUNT (RS.)]
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {/* Row 1: Land */}
                    <tr>
                      <td className="p-3 font-semibold text-gray-700 align-top">Land</td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] leading-tight mb-1">
                            <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Prefilled from Section 6 "PLOT AREA AS PER DOCUMENTS" = AREA (SQ.FT)]</span>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            {renderEditSwitch('axisSbbValuationLandArea', !!fields.axisSbbValuationLandAreaIsNA)}
                            {renderNaToggle('axisSbbValuationLandArea')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbValuationLandAreaIsNA ? '' : (fields.axisSbbValuationLandAreaEditOn ? (fields.axisSbbValuationLandArea || '') : landAreaPrefill)} onChange={e => handleChange('axisSbbValuationLandArea', e.target.value)} disabled={isReadOnly || !!fields.axisSbbValuationLandAreaIsNA || !fields.axisSbbValuationLandAreaEditOn} />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbValuationLandRate')}</div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbValuationLandRateIsNA ? '' : (fields.axisSbbValuationLandRate || '')} onChange={e => handleChange('axisSbbValuationLandRate', e.target.value)} disabled={isReadOnly || !!fields.axisSbbValuationLandRateIsNA} />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">
                            {renderNaToggle('axisSbbValuationLandAmount')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed font-bold disabled:text-gray-500" value={fields.axisSbbValuationLandAmountIsNA ? '' : landAmount.toFixed(2)} disabled />
                        </div>
                      </td>
                    </tr>
                    {/* Row 2: Building */}
                    <tr>
                      <td className="p-3 align-top">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700">Building G+1</span>
                          <span className="text-xs text-gray-500">FAR 2</span>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] leading-tight mb-1">
                            <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Prefilled from Section 8 "TOTAL BUILT UP AREA (IN SQFT)" = AREA (SQ.FT)]</span>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            {renderEditSwitch('axisSbbValuationBuildingArea', !!fields.axisSbbValuationBuildingAreaIsNA)}
                            {renderNaToggle('axisSbbValuationBuildingArea')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbValuationBuildingAreaIsNA ? '' : (fields.axisSbbValuationBuildingAreaEditOn ? (fields.axisSbbValuationBuildingArea || '') : buildingAreaPrefill)} onChange={e => handleChange('axisSbbValuationBuildingArea', e.target.value)} disabled={isReadOnly || !!fields.axisSbbValuationBuildingAreaIsNA || !fields.axisSbbValuationBuildingAreaEditOn} />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbValuationBuildingRate')}</div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbValuationBuildingRateIsNA ? '' : (fields.axisSbbValuationBuildingRate || '')} onChange={e => handleChange('axisSbbValuationBuildingRate', e.target.value)} disabled={isReadOnly || !!fields.axisSbbValuationBuildingRateIsNA} />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">
                            {renderNaToggle('axisSbbValuationBuildingAmount')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed font-bold disabled:text-gray-500" value={fields.axisSbbValuationBuildingAmountIsNA ? '' : buildingAmount.toFixed(2)} disabled />
                        </div>
                      </td>
                    </tr>
                    {/* Row 3: Amenities */}
                    <tr>
                      <td className="p-3 font-semibold text-gray-700 align-top">Amenities</td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbValuationAmenitiesArea')}</div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbValuationAmenitiesAreaIsNA ? '' : (fields.axisSbbValuationAmenitiesArea || '')} onChange={e => handleChange('axisSbbValuationAmenitiesArea', e.target.value)} disabled={isReadOnly || !!fields.axisSbbValuationAmenitiesAreaIsNA} />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbValuationAmenitiesRate')}</div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbValuationAmenitiesRateIsNA ? '' : (fields.axisSbbValuationAmenitiesRate || '')} onChange={e => handleChange('axisSbbValuationAmenitiesRate', e.target.value)} disabled={isReadOnly || !!fields.axisSbbValuationAmenitiesRateIsNA} />
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">
                            {renderNaToggle('axisSbbValuationAmenitiesAmount')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed font-bold disabled:text-gray-500" value={fields.axisSbbValuationAmenitiesAmountIsNA ? '' : amenitiesAmount.toFixed(2)} disabled />
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="p-3 font-bold text-emerald-900 align-top" colSpan={3}>
                        Total Valuation 100% Completion (I+II){' '}
                        <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: SUM(All values in AMOUNT (RS.) column) = Total Valuation 100% Completion]</span>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">
                            {renderNaToggle('axisSbbValuationTotalAmount')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 border-emerald-300 rounded-md shadow-sm bg-emerald-100 cursor-not-allowed font-bold disabled:text-emerald-700" value={fields.axisSbbValuationTotalAmountIsNA ? '' : totalAmountComp.toFixed(2)} disabled />
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-emerald-100">
                      <td className="p-3 font-bold text-emerald-900 align-top" colSpan={3}>
                        Total Valuation in Say{' '}
                        <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: ROUND(Total Valuation 100% Completion, -3) = Total Valuation in Say]</span>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">
                            {renderNaToggle('axisSbbValuationTotalSayAmount')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-base p-2 rounded-md shadow-sm bg-emerald-200 cursor-not-allowed font-bold disabled:text-emerald-800 border-emerald-300" value={fields.axisSbbValuationTotalSayAmountIsNA ? '' : totalSayComp.toFixed(2)} disabled />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-purple-200 bg-[#F5F3FF] rounded-xl p-4 relative shadow-sm">
              <h3 className="font-bold text-purple-800 mb-4 uppercase">Government Guideline / Benchmark Value</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse bg-white shadow-sm rounded-md overflow-hidden">
                  <thead className="bg-purple-50 border-b border-purple-200">
                    <tr className="text-left text-xs font-bold text-purple-800">
                      <th className="p-3 w-48">ITEM DESCRIPTION</th>
                      <th className="p-3">AREA (SQ.FT)</th>
                      <th className="p-3">GUIDELINE RATE PER SQ.FT (RS.)</th>
                      <th className="p-3">
                        GOVT. GUIDELINE VALUE (RS.){' '}
                        <span style={{ color: 'red', fontWeight: 'bold', display: 'block', fontSize: '10px', marginTop: '4px', textTransform: 'none' }}>
                          [Formula: AREA (SQ.FT) * GUIDELINE RATE PER SQ.FT (RS.) = GOVT. GUIDELINE VALUE (RS.)]
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    <tr>
                      <td className="p-3 font-semibold text-gray-700 align-top">Land</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-end gap-2">
                            {renderEditSwitch('axisSbbGovtLandArea', !!fields.axisSbbGovtLandAreaIsNA)}
                            {renderNaToggle('axisSbbGovtLandArea')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbGovtLandAreaIsNA ? '' : (fields.axisSbbGovtLandAreaEditOn ? (fields.axisSbbGovtLandArea || '') : landAreaPrefill)} onChange={e => handleChange('axisSbbGovtLandArea', e.target.value)} disabled={isReadOnly || !!fields.axisSbbGovtLandAreaIsNA || !fields.axisSbbGovtLandAreaEditOn} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbGovtLandRate')}</div>
                          <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbGovtLandRateIsNA ? '' : (fields.axisSbbGovtLandRate || '')} onChange={e => handleChange('axisSbbGovtLandRate', e.target.value)} disabled={isReadOnly || !!fields.axisSbbGovtLandRateIsNA} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbGovtLandAmount')}</div>
                          <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 cursor-not-allowed" value={fields.axisSbbGovtLandAmountIsNA ? '' : govtLandAmount.toFixed(2)} disabled={true} />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-gray-700 align-top">Building</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-end gap-2">
                            {renderEditSwitch('axisSbbGovtBuildingArea', !!fields.axisSbbGovtBuildingAreaIsNA)}
                            {renderNaToggle('axisSbbGovtBuildingArea')}
                          </div>
                          <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbGovtBuildingAreaIsNA ? '' : (fields.axisSbbGovtBuildingAreaEditOn ? (fields.axisSbbGovtBuildingArea || '') : buildingAreaPrefill)} onChange={e => handleChange('axisSbbGovtBuildingArea', e.target.value)} disabled={isReadOnly || !!fields.axisSbbGovtBuildingAreaIsNA || !fields.axisSbbGovtBuildingAreaEditOn} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbGovtBuildingRate')}</div>
                          <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" value={fields.axisSbbGovtBuildingRateIsNA ? '' : (fields.axisSbbGovtBuildingRate || '')} onChange={e => handleChange('axisSbbGovtBuildingRate', e.target.value)} disabled={isReadOnly || !!fields.axisSbbGovtBuildingRateIsNA} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-end">{renderNaToggle('axisSbbGovtBuildingAmount')}</div>
                          <input type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 cursor-not-allowed" value={fields.axisSbbGovtBuildingAmountIsNA ? '' : govtBuildingAmount.toFixed(2)} disabled={true} />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-yellow-200 bg-[#FEF9C3] rounded-xl p-5 relative shadow-sm">
              <h3 className="font-bold text-yellow-800 mb-4 uppercase">Final Valuation Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1 justify-between h-full bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Market Value <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Prefilled from "Total Valuation in Say" of Container "Market Valuation Calculation" = Market Value]</span></label>
                    <div className="flex gap-4">
                      {renderEditSwitch('axisSbbFinalMarketValue', !!fields.axisSbbFinalMarketValueIsNA)}
                      {renderNaToggle('axisSbbFinalMarketValue')}
                    </div>
                  </div>
                  <input type="number" step="0.01" className="w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg font-bold text-gray-800 bg-gray-50 border-gray-300" value={fields.axisSbbFinalMarketValueIsNA ? '' : (fields.axisSbbFinalMarketValueEditOn ? (fields.axisSbbFinalMarketValue || '') : marketValueComp.toFixed(2))} onChange={e => handleChange('axisSbbFinalMarketValue', e.target.value)} disabled={isReadOnly || !!fields.axisSbbFinalMarketValueIsNA || !fields.axisSbbFinalMarketValueEditOn} />
                </div>
                
                <div className="flex flex-col gap-1 justify-between h-full bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Distressed / Forced Sale Value (90%) <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Market Value * 0.90 = Distressed / Forced Sale Value]</span></label>
                    <div className="flex gap-4">
                      {renderEditSwitch('axisSbbFinalDistressValue', !!fields.axisSbbFinalDistressValueIsNA)}
                      {renderNaToggle('axisSbbFinalDistressValue')}
                    </div>
                  </div>
                  <input type="number" step="0.01" className="w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg font-bold text-red-700 bg-red-50 border-red-200" value={fields.axisSbbFinalDistressValueIsNA ? '' : (fields.axisSbbFinalDistressValueEditOn ? (fields.axisSbbFinalDistressValue || '') : distressValueComp.toFixed(2))} onChange={e => handleChange('axisSbbFinalDistressValue', e.target.value)} disabled={isReadOnly || !!fields.axisSbbFinalDistressValueIsNA || !fields.axisSbbFinalDistressValueEditOn} />
                </div>

                <div className="flex flex-col gap-1 justify-between h-full bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Realizable Value (95%) <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Market Value * 0.95 = Realizable Value]</span></label>
                    <div className="flex gap-4">
                      {renderEditSwitch('axisSbbFinalRealizableValue', !!fields.axisSbbFinalRealizableValueIsNA)}
                      {renderNaToggle('axisSbbFinalRealizableValue')}
                    </div>
                  </div>
                  <input type="number" step="0.01" className="w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg font-bold text-amber-700 bg-amber-50 border-amber-200" value={fields.axisSbbFinalRealizableValueIsNA ? '' : (fields.axisSbbFinalRealizableValueEditOn ? (fields.axisSbbFinalRealizableValue || '') : realizableValueComp.toFixed(2))} onChange={e => handleChange('axisSbbFinalRealizableValue', e.target.value)} disabled={isReadOnly || !!fields.axisSbbFinalRealizableValueIsNA || !fields.axisSbbFinalRealizableValueEditOn} />
                </div>

                <div className="flex flex-col gap-1 justify-between h-full bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Insurable Value (App.) (Construction Value) <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: Building_Valuation_Amount * 0.85 = Insurable Value]</span></label>
                    <div className="flex gap-4">
                      {renderEditSwitch('axisSbbFinalInsurableValue', !!fields.axisSbbFinalInsurableValueIsNA)}
                      {renderNaToggle('axisSbbFinalInsurableValue')}
                    </div>
                  </div>
                  <input type="number" step="0.01" className="w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg font-bold text-blue-700 bg-blue-50 border-blue-200" value={fields.axisSbbFinalInsurableValueIsNA ? '' : (fields.axisSbbFinalInsurableValueEditOn ? (fields.axisSbbFinalInsurableValue || '') : insurableValueComp.toFixed(2))} onChange={e => handleChange('axisSbbFinalInsurableValue', e.target.value)} disabled={isReadOnly || !!fields.axisSbbFinalInsurableValueIsNA || !fields.axisSbbFinalInsurableValueEditOn} />
                </div>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-10',
      title: '10. REMARKS & UNDERTAKING',
      number: 10,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const inputCls = "w-full text-sm border-gray-300 rounded-md shadow-sm bg-white focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";
        const renderNaToggle = (fieldKey: string) => (
          <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!fields[`${fieldKey}IsNA`]} onChange={e => handleChange(`${fieldKey}IsNA`, e.target.checked)} disabled={isReadOnly} className="rounded border-gray-300 text-red-500 focus:ring-red-500" />
            NA
          </label>
        );
        const renderEditSwitch = (fieldKey: string, isNA: boolean) => {
          const editOn = !!fields[`${fieldKey}EditOn`];
          return (
            <button type="button" onClick={() => handleChange(`${fieldKey}EditOn`, !editOn)} disabled={isReadOnly || isNA} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${editOn ? 'bg-green-500' : 'bg-gray-200'} ${(isReadOnly || isNA) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${editOn ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          );
        };

        // Synthesize Remarks
        let structTypes = [];
        if (fields.axisSbbTypeOfStructureGCI) structTypes.push('GCI');
        if (fields.axisSbbTypeOfStructureTinShed) structTypes.push('TIN SHED');
        if (fields.axisSbbTypeOfStructureRCC) structTypes.push('RCC');
        if (fields.axisSbbTypeOfStructureAluform) structTypes.push('ALUFORM SHUTTERING');
        const structVal = structTypes.length > 0 ? structTypes.join(', ') : 'RCC';

        const areaStr = fields.axisSbbLandAreaAcres || fields.axisSbbLandAreaDecimals ? `${fields.axisSbbLandAreaAcres || 0} AC. ${fields.axisSbbLandAreaDecimals || 0} DEC.` : (fields.axisSbbPlotAreaAsPerDocument || '');
        const buaStr = fields.axisSbbTotalConstructedArea || '';
        const floorBreakdown = fields.axisSbbNoOfFloors || '';
        const age = fields.axisSbbAgeOfProperty || '';
        const occupancy = fields.axisSbbOccupancyDetails || '';
        const location = [fields.axisSbbColonySector, fields.axisSbbLocalityLandmark, fields.axisSbbVillageCity].filter(Boolean).join(', ');
        const civicRadius = fields.axisSbbBasicAmenities || '';
        const corp = fields.axisSbbWardNoGramPanchayat || '';
        const cityDist = fields.axisSbbDistanceCityCentre || '';
        const approachRoad = fields.axisSbbRoadWidthMaterial || '';
        const farComp = fields.axisSbbStructureConfirmingByelaws || '';

        const synthesizedRemarks = `The subject property is a ${structVal} structured building (${floorBreakdown}) having total land area of ${areaStr} and total built-up area of ${buaStr} sq.ft. The property is approximately ${age} years old and currently ${occupancy}. It is located at ${location} under the jurisdiction of ${corp}. Basic civic amenities are ${civicRadius}. The property is situated at a distance of ${cityDist} from the city centre and is accessible via a ${approachRoad}. Structure compliance to byelaws: ${farComp}.`;

        return (
          <div className="space-y-4">
            {/* Container 10.1: TECHNICAL INSPECTION REMARKS & SPECIAL NOTES */}
            <div className="border border-zinc-300 rounded-lg overflow-hidden bg-zinc-50">
              <div className="bg-zinc-100 px-4 py-3 border-b border-zinc-300 font-bold text-sm text-zinc-800 flex justify-between items-center">
                <span>10.1 TECHNICAL INSPECTION REMARKS & SPECIAL NOTES</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">REMARKS: - <span style={{ color: 'red', fontWeight: 'bold' }}>[Formula: CONCAT(Property_Structure, Land_Area, Measured_BUA, Floor_Breakup, Age, Occupancy, Location, Amenities_Radius, Jurisdiction, Road_Width, FAR_Status) = REMARKS]</span></label>
                    <div className="flex gap-4 items-center">
                      {renderEditSwitch('axisSbbRemarks', !!fields.axisSbbRemarksIsNA)}
                      {renderNaToggle('axisSbbRemarks')}
                    </div>
                  </div>
                  <textarea rows={8} className={`${inputCls} resize-y ${fields.axisSbbRemarksEditOn ? 'bg-green-50 border-green-300' : 'bg-white'}`} value={fields.axisSbbRemarksIsNA ? '' : (fields.axisSbbRemarksEditOn ? (fields.axisSbbRemarks || '') : synthesizedRemarks)} onChange={e => handleChange('axisSbbRemarks', e.target.value)} disabled={isReadOnly || !!fields.axisSbbRemarksIsNA || !fields.axisSbbRemarksEditOn} />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">NOTE:-</label>
                    {renderNaToggle('axisSbbRemarksNote')}
                  </div>
                  <textarea rows={2} className={`${inputCls} resize-y bg-white`} value={fields.axisSbbRemarksNoteIsNA ? '' : (fields.axisSbbRemarksNote || '')} onChange={e => handleChange('axisSbbRemarksNote', e.target.value)} disabled={isReadOnly || !!fields.axisSbbRemarksNoteIsNA} />
                </div>
              </div>
            </div>

            {/* Container 10.2: UNDERTAKING:- */}
            <div className="border border-rose-200 rounded-lg overflow-hidden bg-rose-50">
              <div className="bg-rose-100 px-4 py-3 border-b border-rose-200 font-bold text-sm text-rose-800 flex justify-between items-center">
                <span>10.2 UNDERTAKING:-</span>
                {renderNaToggle('axisSbbUndertaking')}
              </div>
              <div className="p-4 space-y-3">
                {[
                  { key: 'axisSbbUndertakingClause1', label: 'I HAVE PERSONALLY VISITED THE PROPERTY & IDENTIFIED THE SAME BASED ON THE DOCUMENTS PROVIDED.' },
                  { key: 'axisSbbUndertakingClause2', label: 'I/WE HAVE NO DIRECT OR INDIRECT INTEREST IN THE PROPERTY BEING VALUED.' },
                  { key: 'axisSbbUndertakingClause3', label: 'THE INFORMATION FURNISHED ABOVE IS TRUE AND CORRECT TO MY/OUR KNOWLEDGE.' },
                  { key: 'axisSbbUndertakingClause4', label: 'I HAVE NOT BEEN PENALIZED OR CONVICTED BY ANY BANK/FINANCIAL INSTITUTION/GOVERNMENT DEPARTMENT/PSU/CORPORATE.' },
                  { key: 'axisSbbUndertakingClause5', label: 'THIS VALUATION IS PREPARED WITHOUT ANY PREJUDICE OR BIAS TO ANY PERSON OR INSTITUTION.' },
                  { key: 'axisSbbUndertakingClause6', label: 'THE VALUE OF LAND IS TAKEN INTO ACCOUNT BY MAKING DUE ENQUIRES IN THE LOCALITY AND ASCERTAINING THE SALES VALUE OF THE PROPERTIES IN THE LOCALITY.' },
                  { key: 'axisSbbUndertakingClause7', label: 'ANY ADDITIONS/ALTERATIONS MADE TO THE PROPERTY AFTER THE DATE OF VALUATIONS SHALL NOT FALL UNDER THE SCOPE OF THIS REPORT.' },
                ].map((clause) => (
                  <label key={clause.key} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" required className="mt-1 h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500" checked={!!fields[clause.key]} onChange={e => handleChange(clause.key, e.target.checked)} disabled={isReadOnly || !!fields.axisSbbUndertakingIsNA} />
                    <span className={fields.axisSbbUndertakingIsNA ? 'opacity-50' : ''}>{clause.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      }
    },
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFAxisSBBRenderer({ 
    ...fields, 
    axisSbbReportRefNo: fields.axisSbbReportRefNo || projectCode,
    axisSbbCivicAmenities: fields.axisSbbCivicAmenities || 'AVAILABLE, WITHIN THE RADIUS OF 1-2 KMS'
  }),
};

export default function AxisSBB(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_SBB_CONFIG} {...props} />;
}
