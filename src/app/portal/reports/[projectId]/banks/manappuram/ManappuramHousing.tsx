'use client';

import { sanitizeFilenameCode } from '@/lib/utils';
import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  BankReportHeader,
  Section,
  Field,
  BaseDateInput,
  inputCls,
  selectCls,
  textareaCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
  formatReportDate,
  getEarliestFieldVisit,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import {
  PDFManappuramFinanceRenderer,
  ManappuramFinanceFields,
  ManappuramBuildingValRow,
  ManappuramWorkEstimateRow,
} from '@/lib/banks/pdf-manappuram-finance-renderer';
import { Plus, Trash2, Coins, Calculator } from 'lucide-react';

export const MANAPPURAM_HOUSING_CONFIG: BankConfig = {
  bankId: 'MANAPPURAM HOUSING FINANCE',
  subTemplateId: '',
  displayName: 'Manappuram Home Finance Ltd',
  defaultValues: {
    purpose: 'Affordable Housing Loan / LAP',
  },
  getPDFRenderer: (fields: any, projectCode?: string) =>
    new PDFManappuramFinanceRenderer({ ...fields, projectCode }),
};

export interface ManappuramHousingProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-customer', title: 'Customer & Loan Details' },
  { id: 'sec-property', title: 'Property Details & Distances' },
  { id: 'sec-approvals', title: 'Approvals & Boundaries' },
  { id: 'sec-dimensions', title: 'Dimensions & Extent' },
  { id: 'sec-land-val', title: 'Part A: Land Valuation' },
  { id: 'sec-bldg-val', title: 'Part B: Building Valuation & Specs' },
  { id: 'sec-amenities', title: 'Parts C to F: Extra Items & Services' },
  { id: 'sec-abstract', title: 'Total Abstract & Values Summary' },
  { id: 'sec-ndma', title: 'NDMA Parameters & Checklist' },
  { id: 'sec-acknowledgment', title: 'Acknowledgment & Remaining Works' },
  { id: 'sec-remarks', title: 'Remarks, Notes & Declaration' },
  { id: 'sec-documents', title: 'Property Documents' },
  { id: 'sec-maps', title: 'Location Maps' },
  { id: 'sec-photos', title: 'Site Photographs' },
];

const DEFAULT_BLDG_VAL_ROWS: ManappuramBuildingValRow[] = [
  {
    slNo: '1',
    item: 'GF',
    plinthArea: '',
    roofHeight: '10\'6"',
    age: '',
    rate: '',
    replacementCost: '',
    depreciation: '0',
    netValue: '',
  },
];

const DEFAULT_REMAINING_WORKS_ROWS: ManappuramWorkEstimateRow[] = [
  {
    slNo: '1',
    description: 'Estimated Cost After completion of the building',
    estimatedCost: 'Rs.0/-',
  },
];

export default function ManappuramHousing({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole = 'REPORT_EMPLOYEE',
  bucketImages = [],
  prefill,
  onResetWizard,
  isReadOnly = false,
}: ManappuramHousingProps) {
  const router = useRouter();

  const [fields, setFields] = useState<ManappuramFinanceFields>(() => {
    const raw = (initialFields || {}) as Partial<ManappuramFinanceFields>;
    const p = (prefill || {}) as any;

    const earliestVisit = getEarliestFieldVisit(bucketImages, prefill);
    const visitDate = earliestVisit?.date ? formatReportDate(earliestVisit.date) : '';
    const repDate = formatReportDate(new Date().toISOString());

    return {
      ...raw,
      refNo: raw.refNo || projectCode || '',

      // 1. Customer Details
      branchName: raw.branchName ?? '',
      applicationNo: raw.applicationNo ?? '',
      dateOfTechnicalRequest: raw.dateOfTechnicalRequest || repDate,
      dateOfReport: raw.dateOfReport || repDate,
      purposeOfLoan: raw.purposeOfLoan ?? 'LAP',
      purposeOfValuation:
        raw.purposeOfValuation ??
        'HL/Home construction/ Home improvement/Home extension/ Business/ commercial purchase/Mortgage Loan/NPA',
      nameOfCustomer: raw.nameOfCustomer || p.applicantName || p.contactName || '',
      contactNumberOfCustomer: raw.contactNumberOfCustomer || p.contactPhone || '',

      // 2. Property Details
      propertyAddressWithPin: raw.propertyAddressWithPin || p.propertyAddress || '',
      legalAddress: raw.legalAddress || p.propertyAddress || '',
      landMark: raw.landMark || p.nearestLandmark || '',
      propertyDetailsSummary: raw.propertyDetailsSummary || p.propertyAddress || '',
      ownerName: raw.ownerName || p.contactName || '',
      typeOfProperty: raw.typeOfProperty ?? 'Residential',
      approvedUsageOfProperty: raw.approvedUsageOfProperty ?? 'NA',
      actualUseOfProperty: raw.actualUseOfProperty ?? 'Residential',
      propertyOccupancyDetails: raw.propertyOccupancyDetails ?? 'Self Occupied',
      withinMunicipalGpLimit: raw.withinMunicipalGpLimit ?? 'Gram Panchayat',
      occupantName: raw.occupantName ?? 'Self',
      tenantNameAndRent: raw.tenantNameAndRent ?? 'NA',
      rentReceived: raw.rentReceived ?? 'NA',
      occupantRelationship: raw.occupantRelationship ?? 'Self',
      personMetSiteDetails: raw.personMetSiteDetails || p.applicantName || '',
      houseDoorSocietyBoard: raw.houseDoorSocietyBoard ?? 'NA',

      // Proximities
      proximitySchool: raw.proximitySchool ?? '1-Kms',
      proximityHospital: raw.proximityHospital ?? '2-Kms',
      proximityCollege: raw.proximityCollege ?? '2-Kms',

      // Distances
      distanceFromMahofinBranch: raw.distanceFromMahofinBranch ?? '',
      distanceFromPanchayatRoad: raw.distanceFromPanchayatRoad ?? '1-Kms',
      distanceFromNearestStateHighway: raw.distanceFromNearestStateHighway ?? '',
      distanceFromNearestNationalHighway: raw.distanceFromNearestNationalHighway ?? '',

      // Documents checklist
      documentsProvidedForValuation: raw.documentsProvidedForValuation ?? 'Copy of ROR, Sketch map & Sale deed',
      docTitleDeedWithSro: raw.docTitleDeedWithSro ?? 'NA',
      docLandTaxReceipt: raw.docLandTaxReceipt ?? 'NA',
      docPossessionCertificate: raw.docPossessionCertificate ?? 'NA',
      docEncumbranceCertificate: raw.docEncumbranceCertificate ?? 'NA',
      docBuildingTaxReceipt: raw.docBuildingTaxReceipt ?? 'NA',
      docLocationSketch: raw.docLocationSketch ?? 'NA',

      // 3. Others (How to reach)
      locationHowToReach: raw.locationHowToReach ?? '',
      plotSurveyNo: raw.plotSurveyNo ?? '',
      reSurveyNo: raw.reSurveyNo ?? 'NA',
      doorNo: raw.doorNo ?? 'NA',
      villageTsNo: raw.villageTsNo ?? '',
      wardTaluka: raw.wardTaluka ?? '',
      mandalDistrict: raw.mandalDistrict ?? '',

      // 4. Land and Building Approval Details
      approvedPlanProvided: raw.approvedPlanProvided ?? 'No',
      approvedPlanNoAndDate: raw.approvedPlanNoAndDate ?? 'NA',
      commencementCertProvided: raw.commencementCertProvided ?? 'No',
      commencementCertNoAndDate: raw.commencementCertNoAndDate ?? 'NA',
      occupancyCertAvailable: raw.occupancyCertAvailable ?? 'No',
      occupancyCertNoAndDate: raw.occupancyCertNoAndDate ?? 'NA',
      approvingAuthorityName: raw.approvingAuthorityName ?? 'NA',
      layoutPlanApproved: raw.layoutPlanApproved ?? 'No',
      authorityAuthorizedUnderTpAct: raw.authorityAuthorizedUnderTpAct ?? 'No',
      propertyNonAgricultural: raw.propertyNonAgricultural ?? 'Homestead',
      nonAgriPermissionGivenBy: raw.nonAgriPermissionGivenBy ?? 'NA',
      docsCollectedForNonAgriPermission: raw.docsCollectedForNonAgriPermission ?? 'NA',

      // Boundaries Sale Deed
      boundNorthSaleDeed: raw.boundNorthSaleDeed || p.boundaryNorth || '',
      boundSouthSaleDeed: raw.boundSouthSaleDeed || p.boundarySouth || '',
      boundEastSaleDeed: raw.boundEastSaleDeed || p.boundaryEast || '',
      boundWestSaleDeed: raw.boundWestSaleDeed || p.boundaryWest || '',

      // Boundaries Sketch Map
      boundNorthSketchMap: raw.boundNorthSketchMap || p.boundaryNorth || '',
      boundSouthSketchMap: raw.boundSouthSketchMap || p.boundarySouth || '',
      boundEastSketchMap: raw.boundEastSketchMap || p.boundaryEast || '',
      boundWestSketchMap: raw.boundWestSketchMap || p.boundaryWest || '',

      // Boundaries Site Visit
      boundNorthSiteVisit: raw.boundNorthSiteVisit || p.boundaryNorth || '',
      boundSouthSiteVisit: raw.boundSouthSiteVisit || p.boundarySouth || '',
      boundEastSiteVisit: raw.boundEastSiteVisit || p.boundaryEast || '',
      boundWestSiteVisit: raw.boundWestSiteVisit || p.boundaryWest || '',

      // Approval details continued
      dateAndValidityOfApprovedPlan: raw.dateAndValidityOfApprovedPlan ?? 'No',
      approvedPlanIssuingAuthority: raw.approvedPlanIssuingAuthority ?? 'NA',
      planGenuinenessVerified: raw.planGenuinenessVerified ?? 'NA',
      commentsOnAuthenticOfPlan: raw.commentsOnAuthenticOfPlan ?? 'NA',
      stageOfConstruction: raw.stageOfConstruction ?? '100%',
      stageOfConstructionRecommended: raw.stageOfConstructionRecommended ?? '100%',

      // 5. Dimensions & Extent
      dimNorthSite: raw.dimNorthSite ?? '',
      dimNorthDeed: raw.dimNorthDeed ?? '',
      dimSouthSite: raw.dimSouthSite ?? '',
      dimSouthDeed: raw.dimSouthDeed ?? '',
      dimEastSite: raw.dimEastSite ?? '',
      dimEastDeed: raw.dimEastDeed ?? '',
      dimWestSite: raw.dimWestSite ?? '',
      dimWestDeed: raw.dimWestDeed ?? '',
      extentOfPropertyConsidered: raw.extentOfPropertyConsidered ?? '',

      // 6. Part - A (Valuation of Land)
      sizeOfPlotShape: raw.sizeOfPlotShape ?? 'Rectangular',
      sizeOfPlotSqft: raw.sizeOfPlotSqft ?? '',
      sizeNorthSouth: raw.sizeNorthSouth ?? 'NA',
      sizeEastWest: raw.sizeEastWest ?? 'NA',
      totalExtentOfPlot: raw.totalExtentOfPlot ?? '',
      prevailingMarketRateDetails: raw.prevailingMarketRateDetails ?? 'NA',
      guidelineRateFromRegistrar: raw.guidelineRateFromRegistrar ?? 'NA',
      glrComparisonJustification: raw.glrComparisonJustification ?? 'NA',
      assessedAdoptedRateLand: raw.assessedAdoptedRateLand ?? '',
      estimatedValueOfLand: raw.estimatedValueOfLand ?? '',

      // 7. Part - B (Technical details of the building)
      bldgType: raw.bldgType ?? 'Residential',
      bldgConstructionType: raw.bldgConstructionType ?? 'Load bearing Structure',
      bldgYearOfConstruction: raw.bldgYearOfConstruction ?? '07 – Years',
      bldgResidualAge: raw.bldgResidualAge ?? '53– Years',
      bldgFloorsAndHeight: raw.bldgFloorsAndHeight ?? 'Single Storied 10\'6" Height',
      bldgPlinthAreaMeasured: raw.bldgPlinthAreaMeasured ?? '',
      bldgConditionExterior: raw.bldgConditionExterior ?? 'Good',
      bldgConditionInterior: raw.bldgConditionInterior ?? 'Good',

      // Specifications GF / FF
      specFoundationGF: raw.specFoundationGF ?? 'Column Structure',
      specFoundationFF: raw.specFoundationFF ?? '',
      specBasementGF: raw.specBasementGF ?? 'No',
      specBasementFF: raw.specBasementFF ?? '',
      specSuperstructureGF: raw.specSuperstructureGF ?? 'K.B Bricks',
      specSuperstructureFF: raw.specSuperstructureFF ?? '',
      specJoineryGF: raw.specJoineryGF ?? 'Country Wood',
      specJoineryFF: raw.specJoineryFF ?? '',
      specRccWorksGF: raw.specRccWorksGF ?? 'Column, Lintel, Slab',
      specRccWorksFF: raw.specRccWorksFF ?? '',
      specPlasteringGF: raw.specPlasteringGF ?? 'Cement Plastering',
      specPlasteringFF: raw.specPlasteringFF ?? '',
      specFlooringGF: raw.specFlooringGF ?? 'Tile Flooring',
      specFlooringFF: raw.specFlooringFF ?? '',
      specSpecialFinishGF: raw.specSpecialFinishGF ?? 'marble',
      specSpecialFinishFF: raw.specSpecialFinishFF ?? '',
      specRoofingGF: raw.specRoofingGF ?? 'RCC',
      specRoofingFF: raw.specRoofingFF ?? '',
      specDrainageGF: raw.specDrainageGF ?? 'No',
      specDrainageFF: raw.specDrainageFF ?? '',

      // Compound wall & Electrical
      specCompoundWallGF: raw.specCompoundWallGF ?? 'No',
      specCompoundWallOther: raw.specCompoundWallOther ?? '',
      specCompoundWallHeightGF: raw.specCompoundWallHeightGF ?? '10.6"',
      specCompoundWallHeightOther: raw.specCompoundWallHeightOther ?? '',
      specCompoundWallLengthGF: raw.specCompoundWallLengthGF ?? '',
      specCompoundWallLengthOther: raw.specCompoundWallLengthOther ?? '',
      specCompoundWallTypeGF: raw.specCompoundWallTypeGF ?? 'RCC',
      specCompoundWallTypeOther: raw.specCompoundWallTypeOther ?? '',
      specElectricalInstallationGF: raw.specElectricalInstallationGF ?? '',
      specElectricalInstallationOther: raw.specElectricalInstallationOther ?? '',
      specTypeOfWiringGF: raw.specTypeOfWiringGF ?? 'Yes',
      specTypeOfWiringOther: raw.specTypeOfWiringOther ?? '',

      // Class of fittings
      specClassOfFittingsGF: raw.specClassOfFittingsGF ?? 'Ordinary',
      specClassOfFittingsOther: raw.specClassOfFittingsOther ?? '',
      specLightPointsGF: raw.specLightPointsGF ?? 'NA',
      specLightPointsOther: raw.specLightPointsOther ?? '',
      specFanPointsGF: raw.specFanPointsGF ?? 'NA',
      specFanPointsOther: raw.specFanPointsOther ?? '',
      specSparePlugPointsGF: raw.specSparePlugPointsGF ?? '',
      specSparePlugPointsOther: raw.specSparePlugPointsOther ?? '',
      specAnyOtherElectricalGF: raw.specAnyOtherElectricalGF ?? 'NA',
      specAnyOtherElectricalOther: raw.specAnyOtherElectricalOther ?? '',

      // Plumbing installation
      specWaterClosetsGF: raw.specWaterClosetsGF ?? 'YES',
      specWaterClosetsOther: raw.specWaterClosetsOther ?? '',
      specWashBasinsGF: raw.specWashBasinsGF ?? '—',
      specWashBasinsOther: raw.specWashBasinsOther ?? '',
      specUrinalsGF: raw.specUrinalsGF ?? '—',
      specUrinalsOther: raw.specUrinalsOther ?? '',
      specBathTubsGF: raw.specBathTubsGF ?? '—',
      specBathTubsOther: raw.specBathTubsOther ?? '',
      specWaterMeterTapsGF: raw.specWaterMeterTapsGF ?? 'Yes',
      specWaterMeterTapsOther: raw.specWaterMeterTapsOther ?? '',
      specAnyOtherPlumbingGF: raw.specAnyOtherPlumbingGF ?? 'NA',
      specAnyOtherPlumbingOther: raw.specAnyOtherPlumbingOther ?? '',

      // Building Valuation Items
      buildingValuationRows: raw.buildingValuationRows || DEFAULT_BLDG_VAL_ROWS,
      totalBuildingValuationCost: raw.totalBuildingValuationCost ?? '',

      // Part C - Extra Items
      partCPortico: raw.partCPortico ?? 'NA',
      partCOrnamentalDoor: raw.partCOrnamentalDoor ?? 'NA',
      partCVerandah: raw.partCVerandah ?? 'NA',
      partCOverheadWaterTank: raw.partCOverheadWaterTank ?? 'NA',
      partCCollapsibleGates: raw.partCCollapsibleGates ?? 'NA',
      partCTotal: raw.partCTotal ?? 'Nil',

      // Part D - Amenities
      partDWardrobes: raw.partDWardrobes ?? 'NA',
      partDGlazedTiles: raw.partDGlazedTiles ?? 'NA',
      partDExtraSinksBathTub: raw.partDExtraSinksBathTub ?? 'NO',
      partDMarbleCeramicFlooring: raw.partDMarbleCeramicFlooring ?? 'NA',
      partDInteriorDecorations: raw.partDInteriorDecorations ?? 'NA',
      partDElevationWorks: raw.partDElevationWorks ?? 'NA',
      partDPanelingWorks: raw.partDPanelingWorks ?? 'NA',
      partDAluminumWorks: raw.partDAluminumWorks ?? 'NA',
      partDAluminumHandRails: raw.partDAluminumHandRails ?? 'NA',
      partDFalseCeiling: raw.partDFalseCeiling ?? 'NA',
      partDTotal: raw.partDTotal ?? 'Nil',

      // Part E - Miscellaneous
      partESeparateToilet: raw.partESeparateToilet ?? 'NA',
      partELumberRoom: raw.partELumberRoom ?? 'NA',
      partEWaterTankSump: raw.partEWaterTankSump ?? 'NA',
      partETreesGardening: raw.partETreesGardening ?? 'NA',
      partETotal: raw.partETotal ?? 'Nil',

      // Part F - Services
      partFWaterSupply: raw.partFWaterSupply ?? 'NA',
      partFDrainage: raw.partFDrainage ?? 'NA',
      partFCompoundWall: raw.partFCompoundWall ?? 'NA',
      partFCbDeposits: raw.partFCbDeposits ?? 'NA',
      partFPavement: raw.partFPavement ?? 'NA',
      partFTotal: raw.partFTotal ?? 'Nil',

      // Total Abstract & Summaries
      partATotal: raw.partATotal ?? '',
      partBTotal: raw.partBTotal ?? '',
      totalMarketValue: raw.totalMarketValue ?? '',
      realizableValue: raw.realizableValue ?? '',
      govtGuidelineValue: raw.govtGuidelineValue ?? 'Not Showing',
      distressValue: raw.distressValue ?? '',

      // NDMA Parameters
      ndmaSeismicZone: raw.ndmaSeismicZone ?? 'NA',
      ndmaStructureType: raw.ndmaStructureType ?? 'Load Bearing structure GF Building- Tile Flooring',
      ndmaFoundationType: raw.ndmaFoundationType ?? 'Concrete',
      ndmaRoofType: raw.ndmaRoofType ?? 'RCC',
      ndmaMasonryType: raw.ndmaMasonryType ?? 'K.B Bricks',
      ndmaSoilType: raw.ndmaSoilType ?? 'Red Soil',
      ndmaDemolitionRisk: raw.ndmaDemolitionRisk ?? 'NO',

      // Additional Details
      addlCourtOrderPublicNotices: raw.addlCourtOrderPublicNotices ?? 'No',
      addlSensitiveConcentratedArea: raw.addlSensitiveConcentratedArea ?? 'No',
      addlConstructionWorkStopped: raw.addlConstructionWorkStopped ?? 'No',
      addlLongitudeLatitude: raw.addlLongitudeLatitude ?? '',
      addlProperFencingDone: raw.addlProperFencingDone ?? 'No',
      addlSeparateEntranceAvailable: raw.addlSeparateEntranceAvailable ?? 'Yes',
      addlMinRoadWidthRequirement: raw.addlMinRoadWidthRequirement ?? '10 ft',
      addlTypeOfRoadAvailable: raw.addlTypeOfRoadAvailable ?? '10 ft wide CC Road',
      addlLandLocked: raw.addlLandLocked ?? 'No',
      addlSpecialRemarks: raw.addlSpecialRemarks ?? 'NA',

      // Acknowledgment
      ackStageOfConstruction: raw.ackStageOfConstruction ?? '100%',
      ackCompletedWorks: raw.ackCompletedWorks ?? 'RCC Roof, Brick Masonry, Plastering, Flooring',
      remainingWorksRows: raw.remainingWorksRows || DEFAULT_REMAINING_WORKS_ROWS,
      ackTotalRemainingCost: raw.ackTotalRemainingCost ?? 'Rs.0/-',

      // Remarks & Notes
      remarks:
        raw.remarks ??
        'Subject property is a single storied residential building, having land extend of 4356sqft, (As per ROR), having measured built up area 1276sqft. Approved plan is not provided. It is accessible with 10-feet wide passage road & surrounding areas are residential in nature. Property is near about 62-Kms Kendrapara market area & all civic amenities are present within 1-2 kms. Property is coming under Khamarsahi GP limit. Age of the building about 07-years. Entire building is occupied by customer for own residence. Valuation has been done for land & measured BUA of single storied residential building as per internal policy to Manappuram Finance to consider the BUA or not. As approved plan is not provided it is upto sole discretion of Manappuram Finance to consider the BUA value or not.',
      note1:
        raw.note1 ??
        'As per the sale deed, the total land area is AC 0.750 decimals (32,670 sq. ft.). However, as per the latest ROR, the land comprises three plots: Plot No. 442/935, measuring AC 0.100 decimals (Homestead); Plot No. 442, measuring AC 0.610 decimals (Sarad-1), recorded in the name of Mr. Jhadeswar Mandala, S/o Mr. Kangali Charana Mandala; and Plot No. 442/825, measuring AC 0.040 decimals (Sarad-1), recorded in the name of Shree Shree Sitala Devi Bije (Marfatdar: Mr. Jhadeswar Mandala, S/o Mr. Kangali Charana Mandala). Hence, a discrepancy is observed between the sale deed and ROR records, which requires clarification.',
      note2:
        raw.note2 ??
        'The sale deed does not specify any access road in the boundary details. As per the cadastral map, the building is constructed over both plots. The customer has submitted an Amin sketch map for property identification, and the report has been released based on the said Amin sketch map. The Bank/Credit/Tech team shall kindly verify the authenticity and accuracy of the Amin sketch map before proceeding further. The subject property is not demarcated at the site, in view of the above discrepancies and limitations, acceptance of the property for mortgage and consideration of the valuation report shall be at the sole discretion of Manappuram Finance, subject to its internal policies and verification requirements. Credit/Tech Team shall kindly note the above observations and take an appropriate decision before proceeding with the case.',

      // Sign-off
      declarationPlace: raw.declarationPlace ?? 'Bhubaneswar',
      declarationDate: raw.declarationDate || repDate,
      valuerName: raw.valuerName ?? 'M/s S. Mohanty & Associates',
      valuerSignatory: raw.valuerSignatory ?? 'Er. Satyajit Mohanty',

      // Attachments & Geo
      latitude: raw.latitude ?? p.propertyLatitude ?? '',
      longitude: raw.longitude ?? p.propertyLongitude ?? '',
      propertyDocuments: raw.propertyDocuments || [],
      locationMaps: raw.locationMaps || [],
      propertyPhotos: raw.propertyPhotos || [],
      annexures: raw.annexures || [],
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handleChange = useCallback((name: string, value: any) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  // ── Auto Calculations ─────────────────────────────────────────────
  const autoCalculations = useMemo(() => {
    const parseSafe = (v: any) => {
      if (!v) return 0;
      const n = parseFloat(String(v).replace(/[^0-9.]/g, '').trim());
      return isNaN(n) ? 0 : n;
    };

    // Land Valuation
    const lArea = parseSafe(fields.sizeOfPlotSqft);
    const lRate = parseSafe(fields.assessedAdoptedRateLand);
    const landVal = Math.round(lArea * lRate);

    // Building Valuation Rows sum
    let totalBldgNet = 0;
    const computedBldgRows = (fields.buildingValuationRows || []).map((row) => {
      const area = parseSafe(row.plinthArea);
      const rate = parseSafe(row.rate);
      const repCost = Math.round(area * rate);
      const dep = parseSafe(row.depreciation);
      const net = Math.max(0, repCost - dep);
      totalBldgNet += net;
      return {
        ...row,
        replacementCost: repCost > 0 ? `Rs.${formatIndianCurrency(repCost)}/-` : row.replacementCost,
        netValue: net > 0 ? `Rs.${formatIndianCurrency(net)}/-` : row.netValue,
      };
    });

    // Extra Parts
    const parseCurrencyString = (str?: string) => {
      if (!str || /nil|na|none/i.test(str)) return 0;
      return parseSafe(str);
    };

    const cVal = parseCurrencyString(fields.partCTotal);
    const dVal = parseCurrencyString(fields.partDTotal);
    const eVal = parseCurrencyString(fields.partETotal);
    const fVal = parseCurrencyString(fields.partFTotal);

    const totalFMV = landVal + totalBldgNet + cVal + dVal + eVal + fVal;
    const realizable = Math.round(totalFMV * 0.9);
    const distress = Math.round(totalFMV * 0.8);
    const words = totalFMV > 0 ? rupeesInWords(totalFMV) : 'Zero Rupees';

    return {
      landVal,
      totalBldgNet,
      computedBldgRows,
      totalFMV,
      realizable,
      distress,
      words,
    };
  }, [
    fields.sizeOfPlotSqft,
    fields.assessedAdoptedRateLand,
    fields.buildingValuationRows,
    fields.partCTotal,
    fields.partDTotal,
    fields.partETotal,
    fields.partFTotal,
  ]);

  // Sync inspection date from bucket
  const handleSyncInspectionDate = useCallback(() => {
    const earliest = getEarliestFieldVisit(bucketImages, prefill);
    if (earliest?.date) {
      handleChange('dateOfReport', earliest.date);
      handleChange('declarationDate', earliest.date);
    }
  }, [bucketImages, prefill, handleChange]);

  // Building Valuation Row Helpers
  const handleAddBldgRow = () => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: [
        ...(prev.buildingValuationRows || []),
        {
          slNo: String((prev.buildingValuationRows || []).length + 1),
          item: '',
          plinthArea: '',
          roofHeight: '10\'6"',
          age: '',
          rate: '',
          replacementCost: '',
          depreciation: '0',
          netValue: '',
        },
      ],
    }));
  };

  const handleUpdateBldgRow = (idx: number, key: keyof ManappuramBuildingValRow, val: string) => {
    setFields((prev) => {
      const rows = [...(prev.buildingValuationRows || [])];
      rows[idx] = { ...rows[idx], [key]: val };
      return { ...prev, buildingValuationRows: rows };
    });
  };

  const handleRemoveBldgRow = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: (prev.buildingValuationRows || []).filter((_, i) => i !== idx),
    }));
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: ManappuramFinanceFields = {
        ...fields,
        projectCode,
        estimatedValueOfLand:
          autoCalculations.landVal > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.landVal)}/-`
            : fields.estimatedValueOfLand,
        totalBuildingValuationCost:
          autoCalculations.totalBldgNet > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
            : fields.totalBuildingValuationCost,
        partATotal:
          autoCalculations.landVal > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.landVal)}/-`
            : fields.partATotal,
        partBTotal:
          autoCalculations.totalBldgNet > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
            : fields.partBTotal,
        totalMarketValue:
          autoCalculations.totalFMV > 0
            ? `Rs. ${formatIndianCurrency(autoCalculations.totalFMV)}/-`
            : fields.totalMarketValue,
        realizableValue:
          autoCalculations.realizable > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.realizable)}/-`
            : fields.realizableValue,
        distressValue:
          autoCalculations.distress > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.distress)}/-`
            : fields.distressValue,
      };

      const res = await saveReportDraft(projectId, payload);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(res.error || 'Failed to save draft');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred while saving draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview PDF in new tab
  const handlePreviewPDF = async () => {
    try {
      setPreviewing(true);
      const payload: ManappuramFinanceFields = {
        ...fields,
        projectCode,
        estimatedValueOfLand:
          autoCalculations.landVal > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.landVal)}/-`
            : fields.estimatedValueOfLand,
        totalBuildingValuationCost:
          autoCalculations.totalBldgNet > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
            : fields.totalBuildingValuationCost,
        partATotal:
          autoCalculations.landVal > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.landVal)}/-`
            : fields.partATotal,
        partBTotal:
          autoCalculations.totalBldgNet > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
            : fields.partBTotal,
        totalMarketValue:
          autoCalculations.totalFMV > 0
            ? `Rs. ${formatIndianCurrency(autoCalculations.totalFMV)}/-`
            : fields.totalMarketValue,
        realizableValue:
          autoCalculations.realizable > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.realizable)}/-`
            : fields.realizableValue,
        distressValue:
          autoCalculations.distress > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.distress)}/-`
            : fields.distressValue,
      };
      const renderer = new PDFManappuramFinanceRenderer(payload);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(`PDF Preview failed: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const payload: ManappuramFinanceFields = {
        ...fields,
        projectCode,
        estimatedValueOfLand:
          autoCalculations.landVal > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.landVal)}/-`
            : fields.estimatedValueOfLand,
        totalBuildingValuationCost:
          autoCalculations.totalBldgNet > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
            : fields.totalBuildingValuationCost,
        partATotal:
          autoCalculations.landVal > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.landVal)}/-`
            : fields.partATotal,
        partBTotal:
          autoCalculations.totalBldgNet > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
            : fields.partBTotal,
        totalMarketValue:
          autoCalculations.totalFMV > 0
            ? `Rs. ${formatIndianCurrency(autoCalculations.totalFMV)}/-`
            : fields.totalMarketValue,
        realizableValue:
          autoCalculations.realizable > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.realizable)}/-`
            : fields.realizableValue,
        distressValue:
          autoCalculations.distress > 0
            ? `Rs.${formatIndianCurrency(autoCalculations.distress)}/-`
            : fields.distressValue,
      };
      const renderer = new PDFManappuramFinanceRenderer(payload);
      const safeCode = sanitizeFilenameCode(projectCode || fields.applicationNo || 'Report');
      await renderer.generateAndDownload(`Valuation_Report_Manappuram_${safeCode}.pdf`);
    } catch (err: any) {
      alert(`PDF Generation failed: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* ── Main Top Header ─────────────────────────────────────────── */}
      <BankReportHeader
        bankName="MANAPPURAM HOME FINANCE LTD."
        formatName="Property Valuation Report Format"
        projectCode={projectCode}
        earliestVisit={getEarliestFieldVisit(bucketImages, prefill)}
        onSyncInspectionDate={handleSyncInspectionDate}
        onResetWizard={onResetWizard}
      />

      <div className="flex gap-6">
        {/* Floating Sidebar Navbar */}
        <FloatingNavigator sections={NAV_SECTIONS} />

        {/* Main Content Form */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Section 1: Customer Details */}
          <Section number={1} title="Customer & Loan Details" id="sec-customer">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Canonical Firm Reference No. (Locked)">
                <input
                  type="text"
                  value={fields.refNo || projectCode || ''}
                  disabled={true}
                  readOnly={true}
                  placeholder="SMA-YYYY/MM-NNNN"
                  className={inputCls}
                />
              </Field>
              <Field label="MAHOFIN Branch Name">
                <input
                  type="text"
                  value={fields.branchName || ''}
                  onChange={(e) => handleChange('branchName', e.target.value)}
                  placeholder="e.g. Bhadrak"
                  className={inputCls}
                />
              </Field>
              <Field label="Application Number">
                <input
                  type="text"
                  value={fields.applicationNo || ''}
                  onChange={(e) => handleChange('applicationNo', e.target.value)}
                  placeholder="e.g. APP007601526"
                  className={inputCls}
                />
              </Field>
              <Field label="Date of Technical Request Received">
                <BaseDateInput
                  value={fields.dateOfTechnicalRequest || ''}
                  onChange={(val) => handleChange('dateOfTechnicalRequest', val)}
                />
              </Field>
              <Field label="Date of Report">
                <BaseDateInput
                  value={fields.dateOfReport || ''}
                  onChange={(val) => handleChange('dateOfReport', val)}
                />
              </Field>
              <Field label="Purpose of Loan">
                <input
                  type="text"
                  value={fields.purposeOfLoan || ''}
                  onChange={(e) => handleChange('purposeOfLoan', e.target.value)}
                  placeholder="e.g. LAP / Housing Loan"
                  className={inputCls}
                />
              </Field>
              <Field label="Purpose of Valuation" span={2}>
                <input
                  type="text"
                  value={fields.purposeOfValuation || ''}
                  onChange={(e) => handleChange('purposeOfValuation', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Name of Customer">
                <input
                  type="text"
                  value={fields.nameOfCustomer || ''}
                  onChange={(e) => handleChange('nameOfCustomer', e.target.value)}
                  placeholder="Borrower name"
                  className={inputCls}
                />
              </Field>
              <Field label="Contact Number of Customer">
                <input
                  type="text"
                  value={fields.contactNumberOfCustomer || ''}
                  onChange={(e) => handleChange('contactNumberOfCustomer', e.target.value)}
                  placeholder="Mobile number"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 2: Property Details */}
          <Section number={2} title="Property Details & Distances" id="sec-property">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property Address with Pin code" span={2}>
                <textarea
                  rows={2}
                  value={fields.propertyAddressWithPin || ''}
                  onChange={(e) => handleChange('propertyAddressWithPin', e.target.value)}
                  className={textareaCls}
                />
              </Field>
              <Field label="Legal Address" span={2}>
                <textarea
                  rows={2}
                  value={fields.legalAddress || ''}
                  onChange={(e) => handleChange('legalAddress', e.target.value)}
                  className={textareaCls}
                />
              </Field>
              <Field label="Landmark">
                <input
                  type="text"
                  value={fields.landMark || ''}
                  onChange={(e) => handleChange('landMark', e.target.value)}
                  placeholder="Nearby landmark"
                  className={inputCls}
                />
              </Field>
              <Field label="Owner Name">
                <input
                  type="text"
                  value={fields.ownerName || ''}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Type of Property">
                <select
                  value={fields.typeOfProperty || 'Residential'}
                  onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                  className={selectCls}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </Field>
              <Field label="Approved Usage of Property">
                <input
                  type="text"
                  value={fields.approvedUsageOfProperty || ''}
                  onChange={(e) => handleChange('approvedUsageOfProperty', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Actual Use of the Property">
                <input
                  type="text"
                  value={fields.actualUseOfProperty || ''}
                  onChange={(e) => handleChange('actualUseOfProperty', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Property Occupancy Details">
                <select
                  value={fields.propertyOccupancyDetails || 'Self Occupied'}
                  onChange={(e) => handleChange('propertyOccupancyDetails', e.target.value)}
                  className={selectCls}
                >
                  <option value="Self Occupied">Self Occupied</option>
                  <option value="Rented">Rented</option>
                  <option value="Vacant">Vacant</option>
                </select>
              </Field>
              <Field label="Within Municipal / GP limit">
                <input
                  type="text"
                  value={fields.withinMunicipalGpLimit || ''}
                  onChange={(e) => handleChange('withinMunicipalGpLimit', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Name of Person Occupying">
                <input
                  type="text"
                  value={fields.occupantName || ''}
                  onChange={(e) => handleChange('occupantName', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="If Rented, Tenant Name & Rent">
                <input
                  type="text"
                  value={fields.tenantNameAndRent || ''}
                  onChange={(e) => handleChange('tenantNameAndRent', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Expected / Rent Received">
                <input
                  type="text"
                  value={fields.rentReceived || ''}
                  onChange={(e) => handleChange('rentReceived', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Relationship with Customer">
                <input
                  type="text"
                  value={fields.occupantRelationship || ''}
                  onChange={(e) => handleChange('occupantRelationship', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Name & Contact Details of Person Met at Site">
                <input
                  type="text"
                  value={fields.personMetSiteDetails || ''}
                  onChange={(e) => handleChange('personMetSiteDetails', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Proximities & Distances */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Civic Amenities & Proximities</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="a) School">
                  <input
                    type="text"
                    value={fields.proximitySchool || ''}
                    onChange={(e) => handleChange('proximitySchool', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="b) Hospital">
                  <input
                    type="text"
                    value={fields.proximityHospital || ''}
                    onChange={(e) => handleChange('proximityHospital', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="c) College">
                  <input
                    type="text"
                    value={fields.proximityCollege || ''}
                    onChange={(e) => handleChange('proximityCollege', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Distance from MAHOFIN Branch">
                  <input
                    type="text"
                    value={fields.distanceFromMahofinBranch || ''}
                    onChange={(e) => handleChange('distanceFromMahofinBranch', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Distance from Panchayat / PWD / Municipality Road">
                  <input
                    type="text"
                    value={fields.distanceFromPanchayatRoad || ''}
                    onChange={(e) => handleChange('distanceFromPanchayatRoad', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Distance from Nearest State Highway">
                  <input
                    type="text"
                    value={fields.distanceFromNearestStateHighway || ''}
                    onChange={(e) => handleChange('distanceFromNearestStateHighway', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Distance from Nearest National Highway">
                  <input
                    type="text"
                    value={fields.distanceFromNearestNationalHighway || ''}
                    onChange={(e) => handleChange('distanceFromNearestNationalHighway', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* Location of property (How to reach) */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3">19. Location of Property (How to reach)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Location (How to reach)" span={3}>
                  <input
                    type="text"
                    value={fields.locationHowToReach || ''}
                    onChange={(e) => handleChange('locationHowToReach', e.target.value)}
                    placeholder="e.g. Khamara Sahi Market (Kendrapara)"
                    className={inputCls}
                  />
                </Field>
                <Field label="a) Plot No. / Survey No.">
                  <input
                    type="text"
                    value={fields.plotSurveyNo || ''}
                    onChange={(e) => handleChange('plotSurveyNo', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="b) Re. Sy. No.">
                  <input
                    type="text"
                    value={fields.reSurveyNo || ''}
                    onChange={(e) => handleChange('reSurveyNo', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="c) Door No.">
                  <input
                    type="text"
                    value={fields.doorNo || ''}
                    onChange={(e) => handleChange('doorNo', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="d) T. S. No. / Village">
                  <input
                    type="text"
                    value={fields.villageTsNo || ''}
                    onChange={(e) => handleChange('villageTsNo', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="e) Ward / Taluka">
                  <input
                    type="text"
                    value={fields.wardTaluka || ''}
                    onChange={(e) => handleChange('wardTaluka', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="f) Mandal / District">
                  <input
                    type="text"
                    value={fields.mandalDistrict || ''}
                    onChange={(e) => handleChange('mandalDistrict', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Section 3: Approvals & Boundaries */}
          <Section number={3} title="Approvals & Boundaries" id="sec-approvals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="1. Approved Plan Provided Y/N">
                <select
                  value={fields.approvedPlanProvided || 'No'}
                  onChange={(e) => handleChange('approvedPlanProvided', e.target.value)}
                  className={selectCls}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="2. Approved Plan Number & Date">
                <input
                  type="text"
                  value={fields.approvedPlanNoAndDate || ''}
                  onChange={(e) => handleChange('approvedPlanNoAndDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="3. Commencement Certificate Provided Y/N">
                <select
                  value={fields.commencementCertProvided || 'No'}
                  onChange={(e) => handleChange('commencementCertProvided', e.target.value)}
                  className={selectCls}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="4. Commencement Certificate Number & Date">
                <input
                  type="text"
                  value={fields.commencementCertNoAndDate || ''}
                  onChange={(e) => handleChange('commencementCertNoAndDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="5. Occupancy Certificate Available Y/N">
                <select
                  value={fields.occupancyCertAvailable || 'No'}
                  onChange={(e) => handleChange('occupancyCertAvailable', e.target.value)}
                  className={selectCls}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="6. Occupancy Certificate Number & Date">
                <input
                  type="text"
                  value={fields.occupancyCertNoAndDate || ''}
                  onChange={(e) => handleChange('occupancyCertNoAndDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="7. Approving Authority Name">
                <input
                  type="text"
                  value={fields.approvingAuthorityName || ''}
                  onChange={(e) => handleChange('approvingAuthorityName', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="8. Whether Layout Plan Approved">
                <select
                  value={fields.layoutPlanApproved || 'No'}
                  onChange={(e) => handleChange('layoutPlanApproved', e.target.value)}
                  className={selectCls}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="9. Authority Authorized under TP Act">
                <select
                  value={fields.authorityAuthorizedUnderTpAct || 'No'}
                  onChange={(e) => handleChange('authorityAuthorizedUnderTpAct', e.target.value)}
                  className={selectCls}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="10. Non-Agricultural Land Status">
                <input
                  type="text"
                  value={fields.propertyNonAgricultural || ''}
                  onChange={(e) => handleChange('propertyNonAgricultural', e.target.value)}
                  placeholder="e.g. Homestead / Converted"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* 3-Tier Boundaries Comparison Table */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-3">13 & 14. Boundaries Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-700 border border-slate-200">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border">Direction</th>
                      <th className="p-2 border">As per Sale Deed</th>
                      <th className="p-2 border">As per Sketch Map</th>
                      <th className="p-2 border">As per Site Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border font-bold bg-slate-50">North</td>
                      <td className="p-1 border"><input type="text" value={fields.boundNorthSaleDeed || ''} onChange={(e) => handleChange('boundNorthSaleDeed', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundNorthSketchMap || ''} onChange={(e) => handleChange('boundNorthSketchMap', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundNorthSiteVisit || ''} onChange={(e) => handleChange('boundNorthSiteVisit', e.target.value)} className={inputCls} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold bg-slate-50">South</td>
                      <td className="p-1 border"><input type="text" value={fields.boundSouthSaleDeed || ''} onChange={(e) => handleChange('boundSouthSaleDeed', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundSouthSketchMap || ''} onChange={(e) => handleChange('boundSouthSketchMap', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundSouthSiteVisit || ''} onChange={(e) => handleChange('boundSouthSiteVisit', e.target.value)} className={inputCls} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold bg-slate-50">East</td>
                      <td className="p-1 border"><input type="text" value={fields.boundEastSaleDeed || ''} onChange={(e) => handleChange('boundEastSaleDeed', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundEastSketchMap || ''} onChange={(e) => handleChange('boundEastSketchMap', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundEastSiteVisit || ''} onChange={(e) => handleChange('boundEastSiteVisit', e.target.value)} className={inputCls} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold bg-slate-50">West</td>
                      <td className="p-1 border"><input type="text" value={fields.boundWestSaleDeed || ''} onChange={(e) => handleChange('boundWestSaleDeed', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundWestSketchMap || ''} onChange={(e) => handleChange('boundWestSketchMap', e.target.value)} className={inputCls} /></td>
                      <td className="p-1 border"><input type="text" value={fields.boundWestSiteVisit || ''} onChange={(e) => handleChange('boundWestSiteVisit', e.target.value)} className={inputCls} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval Details Continued */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Field label="k) Stage of Construction">
                <input
                  type="text"
                  value={fields.stageOfConstruction || '100%'}
                  onChange={(e) => handleChange('stageOfConstruction', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="l) Stage of Construction - Recommended">
                <input
                  type="text"
                  value={fields.stageOfConstructionRecommended || '100%'}
                  onChange={(e) => handleChange('stageOfConstructionRecommended', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 4: Dimensions & Extent */}
          <Section number={4} title="Dimensions & Extent" id="sec-dimensions">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-700 border border-slate-200">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="p-2 border">Direction</th>
                    <th className="p-2 border">At Site (A)</th>
                    <th className="p-2 border">As per the Deed (B)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-bold bg-slate-50">North</td>
                    <td className="p-1 border"><input type="text" value={fields.dimNorthSite || ''} onChange={(e) => handleChange('dimNorthSite', e.target.value)} className={inputCls} /></td>
                    <td className="p-1 border"><input type="text" value={fields.dimNorthDeed || ''} onChange={(e) => handleChange('dimNorthDeed', e.target.value)} className={inputCls} /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold bg-slate-50">South</td>
                    <td className="p-1 border"><input type="text" value={fields.dimSouthSite || ''} onChange={(e) => handleChange('dimSouthSite', e.target.value)} className={inputCls} /></td>
                    <td className="p-1 border"><input type="text" value={fields.dimSouthDeed || ''} onChange={(e) => handleChange('dimSouthDeed', e.target.value)} className={inputCls} /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold bg-slate-50">East</td>
                    <td className="p-1 border"><input type="text" value={fields.dimEastSite || ''} onChange={(e) => handleChange('dimEastSite', e.target.value)} className={inputCls} /></td>
                    <td className="p-1 border"><input type="text" value={fields.dimEastDeed || ''} onChange={(e) => handleChange('dimEastDeed', e.target.value)} className={inputCls} /></td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold bg-slate-50">West</td>
                    <td className="p-1 border"><input type="text" value={fields.dimWestSite || ''} onChange={(e) => handleChange('dimWestSite', e.target.value)} className={inputCls} /></td>
                    <td className="p-1 border"><input type="text" value={fields.dimWestDeed || ''} onChange={(e) => handleChange('dimWestDeed', e.target.value)} className={inputCls} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Field label="16. Extent of Property Considered for Valuation">
                <input
                  type="text"
                  value={fields.extentOfPropertyConsidered || ''}
                  onChange={(e) => handleChange('extentOfPropertyConsidered', e.target.value)}
                  placeholder="e.g. Total Plot Land area AC.0.100Decs i.e. 4356 Sqft"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 5: Part A - Land Valuation */}
          <Section number={5} title="Part A: Land Valuation" id="sec-land-val">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="1. Shape of Plot">
                <input
                  type="text"
                  value={fields.sizeOfPlotShape || 'Rectangular'}
                  onChange={(e) => handleChange('sizeOfPlotShape', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Plot Size (Sq. ft.)">
                <input
                  type="text"
                  value={fields.sizeOfPlotSqft || ''}
                  onChange={(e) => handleChange('sizeOfPlotSqft', e.target.value)}
                  placeholder="e.g. 4356"
                  className={inputCls}
                />
              </Field>
              <Field label="North & South Dimension">
                <input
                  type="text"
                  value={fields.sizeNorthSouth || 'NA'}
                  onChange={(e) => handleChange('sizeNorthSouth', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="East & West Dimension">
                <input
                  type="text"
                  value={fields.sizeEastWest || 'NA'}
                  onChange={(e) => handleChange('sizeEastWest', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="2. Total Extent of the Plot" span={2}>
                <input
                  type="text"
                  value={fields.totalExtentOfPlot || ''}
                  onChange={(e) => handleChange('totalExtentOfPlot', e.target.value)}
                  placeholder="e.g. 0.100Decs., (4356sqft)"
                  className={inputCls}
                />
              </Field>
              <Field label="3. Prevailing Market Rate (with 2 deals details)" span={2}>
                <input
                  type="text"
                  value={fields.prevailingMarketRateDetails || 'NA'}
                  onChange={(e) => handleChange('prevailingMarketRateDetails', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="4. Guideline Rate from Registrar's Office">
                <input
                  type="text"
                  value={fields.guidelineRateFromRegistrar || 'NA'}
                  onChange={(e) => handleChange('guidelineRateFromRegistrar', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="4 a. 20% GLR Variation Justification">
                <input
                  type="text"
                  value={fields.glrComparisonJustification || 'NA'}
                  onChange={(e) => handleChange('glrComparisonJustification', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="5. Assessed / Adopted Rate of Valuation (Rs./sqft)">
                <input
                  type="text"
                  value={fields.assessedAdoptedRateLand || ''}
                  onChange={(e) => handleChange('assessedAdoptedRateLand', e.target.value)}
                  placeholder="e.g. 180"
                  className={inputCls}
                />
              </Field>
              <Field label="6. Estimated Value of Land (Auto-Calculated)">
                <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm">
                  {autoCalculations.landVal > 0
                    ? `Rs. ${formatIndianCurrency(autoCalculations.landVal)}/-`
                    : fields.estimatedValueOfLand || 'Rs. 0/-'}
                </div>
              </Field>
            </div>
          </Section>

          {/* Section 6: Part B - Building Valuation & Specs */}
          <Section number={6} title="Part B: Building Valuation & Specs" id="sec-bldg-val">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="a) Type of Building">
                <input
                  type="text"
                  value={fields.bldgType || 'Residential'}
                  onChange={(e) => handleChange('bldgType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="b) Type of Construction">
                <input
                  type="text"
                  value={fields.bldgConstructionType || 'Load bearing Structure'}
                  onChange={(e) => handleChange('bldgConstructionType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="c) Year of Construction">
                <input
                  type="text"
                  value={fields.bldgYearOfConstruction || '07 – Years'}
                  onChange={(e) => handleChange('bldgYearOfConstruction', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Residual Age">
                <input
                  type="text"
                  value={fields.bldgResidualAge || '53– Years'}
                  onChange={(e) => handleChange('bldgResidualAge', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="d) Number of Floors & Height">
                <input
                  type="text"
                  value={fields.bldgFloorsAndHeight || 'Single Storied 10\'6" Height'}
                  onChange={(e) => handleChange('bldgFloorsAndHeight', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="e) Plinth Area Floor-wise (Measured BUA)">
                <input
                  type="text"
                  value={fields.bldgPlinthAreaMeasured || ''}
                  onChange={(e) => handleChange('bldgPlinthAreaMeasured', e.target.value)}
                  placeholder="e.g. (RCC Ground Floor building=1276sqft)"
                  className={inputCls}
                />
              </Field>
              <Field label="f) Condition Exterior">
                <select
                  value={fields.bldgConditionExterior || 'Good'}
                  onChange={(e) => handleChange('bldgConditionExterior', e.target.value)}
                  className={selectCls}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Normal">Normal</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
              <Field label="Condition Interior">
                <select
                  value={fields.bldgConditionInterior || 'Good'}
                  onChange={(e) => handleChange('bldgConditionInterior', e.target.value)}
                  className={selectCls}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Normal">Normal</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
            </div>

            {/* Building Valuation Table */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800">Building Valuation Table (After 100% Completion)</h4>
                <button
                  type="button"
                  onClick={handleAddBldgRow}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Floor
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-700 border border-slate-200">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border">Item</th>
                      <th className="p-2 border">Plinth Area (Sqft)</th>
                      <th className="p-2 border">Roof Ht</th>
                      <th className="p-2 border">Age</th>
                      <th className="p-2 border">Rate (Rs./sqft)</th>
                      <th className="p-2 border">Depreciation</th>
                      <th className="p-2 border">Net Value</th>
                      <th className="p-2 border w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fields.buildingValuationRows || []).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-1 border">
                          <input
                            type="text"
                            value={row.item}
                            onChange={(e) => handleUpdateBldgRow(idx, 'item', e.target.value)}
                            placeholder="GF / FF"
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1 border">
                          <input
                            type="text"
                            value={row.plinthArea}
                            onChange={(e) => handleUpdateBldgRow(idx, 'plinthArea', e.target.value)}
                            placeholder="1276"
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1 border">
                          <input
                            type="text"
                            value={row.roofHeight}
                            onChange={(e) => handleUpdateBldgRow(idx, 'roofHeight', e.target.value)}
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1 border">
                          <input
                            type="text"
                            value={row.age}
                            onChange={(e) => handleUpdateBldgRow(idx, 'age', e.target.value)}
                            placeholder="7-Year"
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1 border">
                          <input
                            type="text"
                            value={row.rate}
                            onChange={(e) => handleUpdateBldgRow(idx, 'rate', e.target.value)}
                            placeholder="1700"
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1 border">
                          <input
                            type="text"
                            value={row.depreciation}
                            onChange={(e) => handleUpdateBldgRow(idx, 'depreciation', e.target.value)}
                            placeholder="0"
                            className={inputCls}
                          />
                        </td>
                        <td className="p-1 border">
                          <div className="font-semibold text-slate-800 px-2 py-1 bg-slate-50 rounded">
                            {autoCalculations.computedBldgRows[idx]?.netValue || '-'}
                          </div>
                        </td>
                        <td className="p-1 border text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBldgRow(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end">
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Building Value</div>
                  <div className="text-base font-bold text-emerald-700">
                    {autoCalculations.totalBldgNet > 0
                      ? `Rs. ${formatIndianCurrency(autoCalculations.totalBldgNet)}/-`
                      : fields.totalBuildingValuationCost || 'Rs. 0/-'}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 7: Parts C to F - Extra Items & Services */}
          <Section number={7} title="Parts C to F: Extra Items & Services" id="sec-amenities">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Part C - Extra Items Total">
                <input
                  type="text"
                  value={fields.partCTotal || 'Nil'}
                  onChange={(e) => handleChange('partCTotal', e.target.value)}
                  placeholder="e.g. Nil or amount"
                  className={inputCls}
                />
              </Field>
              <Field label="Part D - Amenities Total">
                <input
                  type="text"
                  value={fields.partDTotal || 'Nil'}
                  onChange={(e) => handleChange('partDTotal', e.target.value)}
                  placeholder="e.g. Nil or amount"
                  className={inputCls}
                />
              </Field>
              <Field label="Part E - Miscellaneous Total">
                <input
                  type="text"
                  value={fields.partETotal || 'Nil'}
                  onChange={(e) => handleChange('partETotal', e.target.value)}
                  placeholder="e.g. Nil or amount"
                  className={inputCls}
                />
              </Field>
              <Field label="Part F - Services Total">
                <input
                  type="text"
                  value={fields.partFTotal || 'Nil'}
                  onChange={(e) => handleChange('partFTotal', e.target.value)}
                  placeholder="e.g. Nil or amount"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 8: Total Abstract & Values Summary */}
          <Section number={8} title="Total Abstract & Values Summary" id="sec-abstract">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Abstract Summary</div>
                <div className="flex justify-between text-sm py-1 border-b">
                  <span>Part A (Land Value):</span>
                  <span className="font-bold">Rs. {formatIndianCurrency(autoCalculations.landVal)}/-</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b">
                  <span>Part B (Building Value):</span>
                  <span className="font-bold">Rs. {formatIndianCurrency(autoCalculations.totalBldgNet)}/-</span>
                </div>
                <div className="flex justify-between text-base font-bold text-emerald-800 pt-1">
                  <span>Total Market Value:</span>
                  <span>Rs. {formatIndianCurrency(autoCalculations.totalFMV)}/-</span>
                </div>
                <div className="text-xs text-slate-500 italic mt-1">{autoCalculations.words}</div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-800 uppercase">Valuation Callouts</div>
                <div className="flex justify-between text-sm py-1 border-b border-emerald-200">
                  <span className="text-emerald-900">Realizable Value (90%):</span>
                  <span className="font-bold text-emerald-900">Rs. {formatIndianCurrency(autoCalculations.realizable)}/-</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-emerald-200">
                  <span className="text-emerald-900">Distress Value (80%):</span>
                  <span className="font-bold text-emerald-900">Rs. {formatIndianCurrency(autoCalculations.distress)}/-</span>
                </div>
                <div className="flex justify-between text-sm py-1 pt-1">
                  <span className="text-emerald-900">Govt Guideline Value:</span>
                  <span className="font-semibold">{fields.govtGuidelineValue || 'Not Showing'}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 9: NDMA Parameters & Checklist */}
          <Section number={9} title="NDMA Parameters & Checklist" id="sec-ndma">
            <h4 className="text-sm font-bold text-slate-800 mb-3">NDMA Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="1. Seismic Zone Details">
                <input
                  type="text"
                  value={fields.ndmaSeismicZone || 'NA'}
                  onChange={(e) => handleChange('ndmaSeismicZone', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="2. Structure Type with Flooring">
                <input
                  type="text"
                  value={fields.ndmaStructureType || 'Load Bearing structure GF Building- Tile Flooring'}
                  onChange={(e) => handleChange('ndmaStructureType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="3. Foundation Type">
                <input
                  type="text"
                  value={fields.ndmaFoundationType || 'Concrete'}
                  onChange={(e) => handleChange('ndmaFoundationType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="4. Roof Type">
                <input
                  type="text"
                  value={fields.ndmaRoofType || 'RCC'}
                  onChange={(e) => handleChange('ndmaRoofType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="5. Type of Masonry">
                <input
                  type="text"
                  value={fields.ndmaMasonryType || 'K.B Bricks'}
                  onChange={(e) => handleChange('ndmaMasonryType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="6. Soil Type">
                <input
                  type="text"
                  value={fields.ndmaSoilType || 'Red Soil'}
                  onChange={(e) => handleChange('ndmaSoilType', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="7. Demolition Risk if Any" span={2}>
                <input
                  type="text"
                  value={fields.ndmaDemolitionRisk || 'NO'}
                  onChange={(e) => handleChange('ndmaDemolitionRisk', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <h4 className="text-sm font-bold text-slate-800 mt-6 mb-3">Additional Details Checklist</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="1. Court Order / Public Notices">
                <input
                  type="text"
                  value={fields.addlCourtOrderPublicNotices || 'No'}
                  onChange={(e) => handleChange('addlCourtOrderPublicNotices', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="2. Sensitive / Concentrated Area">
                <input
                  type="text"
                  value={fields.addlSensitiveConcentratedArea || 'No'}
                  onChange={(e) => handleChange('addlSensitiveConcentratedArea', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="3. Construction Work Stopped">
                <input
                  type="text"
                  value={fields.addlConstructionWorkStopped || 'No'}
                  onChange={(e) => handleChange('addlConstructionWorkStopped', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="5. Proper Fencing of Plot Done">
                <input
                  type="text"
                  value={fields.addlProperFencingDone || 'No'}
                  onChange={(e) => handleChange('addlProperFencingDone', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="6. Separate Entrance Available">
                <input
                  type="text"
                  value={fields.addlSeparateEntranceAvailable || 'Yes'}
                  onChange={(e) => handleChange('addlSeparateEntranceAvailable', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="7. Minimum Road Width (10 ft)">
                <input
                  type="text"
                  value={fields.addlMinRoadWidthRequirement || '10 ft'}
                  onChange={(e) => handleChange('addlMinRoadWidthRequirement', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="8. Type of Road at Present">
                <input
                  type="text"
                  value={fields.addlTypeOfRoadAvailable || '10 ft wide CC Road'}
                  onChange={(e) => handleChange('addlTypeOfRoadAvailable', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="9. Is it a Land-Locked Land?">
                <input
                  type="text"
                  value={fields.addlLandLocked || 'No'}
                  onChange={(e) => handleChange('addlLandLocked', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="10. Special Remarks (threat of acquisition, CRZ, HT lines)" span={2}>
                <input
                  type="text"
                  value={fields.addlSpecialRemarks || 'NA'}
                  onChange={(e) => handleChange('addlSpecialRemarks', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 10: Acknowledgment & Remaining Works */}
          <Section number={10} title="Acknowledgment & Remaining Works" id="sec-acknowledgment">
            <div className="space-y-4">
              <Field label="Stage of Construction Percentage">
                <input
                  type="text"
                  value={fields.ackStageOfConstruction || '100%'}
                  onChange={(e) => handleChange('ackStageOfConstruction', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Completed Works Description">
                <input
                  type="text"
                  value={fields.ackCompletedWorks || 'RCC Roof, Brick Masonry, Plastering, Flooring'}
                  onChange={(e) => handleChange('ackCompletedWorks', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Remaining Works Estimated Cost">
                <input
                  type="text"
                  value={fields.ackTotalRemainingCost || 'Rs.0/-'}
                  onChange={(e) => handleChange('ackTotalRemainingCost', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* Section 11: Remarks, Notes & Declaration */}
          <Section number={11} title="Remarks, Notes & Declaration" id="sec-remarks">
            <div className="space-y-4">
              <Field label="Comprehensive Remarks">
                <textarea
                  rows={4}
                  value={fields.remarks || ''}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  className={textareaCls}
                />
              </Field>
              <Field label="Note 1 (Deed vs ROR Discrepancies)">
                <textarea
                  rows={3}
                  value={fields.note1 || ''}
                  onChange={(e) => handleChange('note1', e.target.value)}
                  className={textareaCls}
                />
              </Field>
              <Field label="Note 2 (Access Road / Demarcation / Policy Remarks)">
                <textarea
                  rows={3}
                  value={fields.note2 || ''}
                  onChange={(e) => handleChange('note2', e.target.value)}
                  className={textareaCls}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <Field label="Place">
                  <input
                    type="text"
                    value={fields.declarationPlace || 'Bhubaneswar'}
                    onChange={(e) => handleChange('declarationPlace', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Date">
                  <BaseDateInput
                    value={fields.declarationDate || ''}
                    onChange={(val) => handleChange('declarationDate', val)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Universal Enclosure Sections ────────────────────────── */}
          {/* Section 12: Documents */}
          <BaseDocumentsSection
            title="Property Documents"
            sectionId="sec-documents"
            sectionNumber={12}
            documentImages={fields.propertyDocuments || []}
            documentImageNames={fields.propertyDocumentNames || []}
            isReadOnly={isReadOnly}
            onRemoveDocument={(idx: number) => {
              handleChange('propertyDocuments', (fields.propertyDocuments || []).filter((_: any, i: number) => i !== idx));
              handleChange('propertyDocumentNames', (fields.propertyDocumentNames || []).filter((_: any, i: number) => i !== idx));
            }}
            onDocumentNameChange={(idx: number, name: string) => {
              const arr = [...(fields.propertyDocumentNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              handleChange('propertyDocumentNames', arr);
            }}
            onReorderDocuments={(newDocs: string[], newNames: string[]) => {
              handleChange('propertyDocuments', newDocs);
              handleChange('propertyDocumentNames', newNames);
            }}
          />

          {/* Section 13: Maps */}
          <BaseMapsSection
            title="Location Maps"
            sectionId="sec-maps"
            sectionNumber={13}
            locationMapImages={fields.locationMaps || []}
            latitude={fields.latitude || ''}
            longitude={fields.longitude || ''}
            onLatitudeChange={(val) => handleChange('latitude', val)}
            onLongitudeChange={(val) => handleChange('longitude', val)}
            propertyAddress={fields.propertyAddressWithPin || ''}
            fields={fields}
            isReadOnly={isReadOnly}
            onLocationMapRemove={(idx?: number) => {
              if (idx !== undefined) {
                handleChange('locationMaps', (fields.locationMaps || []).filter((_: any, i: number) => i !== idx));
              }
            }}
          />

          {/* Section 14: Photographs */}
          <BasePhotographsSection
            title="Property Site Photographs"
            sectionId="sec-photos"
            sectionNumber={14}
            propertyImages={fields.propertyPhotos || []}
            propertyImageNames={fields.propertyPhotoNames || []}
            isReadOnly={isReadOnly}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setIsPhotoModalOpen(true)}
            onRemoveImage={(idx: number) => {
              handleChange('propertyPhotos', (fields.propertyPhotos || []).filter((_: any, i: number) => i !== idx));
              handleChange('propertyPhotoNames', (fields.propertyPhotoNames || []).filter((_: any, i: number) => i !== idx));
            }}
            onImageNameChange={(idx: number, name: string) => {
              const arr = [...(fields.propertyPhotoNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              handleChange('propertyPhotoNames', arr);
            }}
            onReorderImages={(newImgs: string[], newNames: string[]) => {
              handleChange('propertyPhotos', newImgs);
              handleChange('propertyPhotoNames', newNames);
            }}
          />
        </div>
      </div>

      {/* Floating Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={isSaving ? 'saving' : saveSuccess ? 'saved' : saveError ? 'error' : 'idle'}
        message={
          saveSuccess
            ? { text: 'Report draft saved successfully', type: 'success' }
            : saveError
            ? { text: saveError, type: 'error' }
            : null
        }
        loading={isSaving || previewing}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Photo Bucket Selection Modal (Site Photos) */}
      {isPhotoModalOpen && (
        <BasePhotoBucketModal
          isOpen={isPhotoModalOpen}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setIsPhotoModalOpen(false)}
          onConfirm={(selectedUrls: string[]) => {
            handleChange('propertyPhotos', [...(fields.propertyPhotos || []), ...selectedUrls]);
            handleChange('propertyPhotoNames', [
              ...(fields.propertyPhotoNames || []),
              ...selectedUrls.map((_, i) => `Photograph ${(fields.propertyPhotos?.length || 0) + i + 1}`),
            ]);
            setIsPhotoModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
