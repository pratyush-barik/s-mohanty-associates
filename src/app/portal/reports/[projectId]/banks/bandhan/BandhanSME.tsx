'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  ActiveConfigBanner,
  FloatingNavigator,
  Section,
  Field,
  BaseDateInput,
  BasePhotoBucketModal,
  ReportActionBar,
  inputCls,
  selectCls,
} from '../BaseBankReportComponents';
import {
  BandhanSMEReportFields,
  BandhanSMEPlotBoundary,
  BandhanSMEBuildingValuationRow,
  BandhanSMESubScheduleItem,
  BandhanSMEChecklistItem,
  BandhanSMEPhoto,
  generateBandhanSMEReport,
} from '@/lib/banks/pdf-bandhan-sme-renderer';
import { formatReportDate } from '@/lib/pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';

const formatCurrencyINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
};

interface Props {
  projectId: string;
  projectCode: string;
  initialData?: any;
  userRole?: string;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
  prefill?: any;
  bucketImages?: any[];
}

const NAV_SECTIONS = [
  { id: 'sec-basic', title: 'Basic Information' },
  { id: 'sec-prop-details', title: 'Land Details' },
  { id: 'sec-title-rent', title: 'Title & Rent' },
  { id: 'sec-desc-boundaries', title: 'Description & Boundaries' },
  { id: 'sec-site-char', title: 'Site Characteristics' },
  { id: 'sec-other-issues', title: 'Other Issues & Sales' },
  { id: 'sec-land-valuation', title: 'Land Valuation' },
  { id: 'sec-bldg-basic', title: 'Building Basic Info' },
  { id: 'sec-bldg-checklist', title: 'Building Checklist' },
  { id: 'sec-bldg-tech-spec', title: 'Tech & Specifications' },
  { id: 'sec-bldg-valuation-schedules', title: 'Building Valuation & Schedules' },
  { id: 'sec-abstract-opinion', title: 'Abstract & Opinion' },
  { id: 'sec-declaration-enclosures', title: 'Declaration & Enclosures' },
];

function parseNum(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = val.toString().replace(/,/g, '').replace(/Rs\.?/gi, '').replace(/\/-/g, '').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export default function BandhanSME({
  projectId,
  projectCode,
  initialData,
  userRole = 'field_engineer',
  isReadOnly = false,
  onResetWizard,
  prefill,
  bucketImages = [],
}: Props) {
  const router = useRouter();

  // State initialization with clean defaults and project prefill
  const [fields, setFields] = useState<BandhanSMEReportFields>(() => {
    const raw = initialData?.reportFields || initialData || {};
    const defaultRefNo = raw.refNo || projectCode || `BANDHAN/SME/${projectId.slice(0, 8).toUpperCase()}`;

    const defaultPlots: BandhanSMEPlotBoundary[] = Array.isArray(raw.documentPlotBoundaries) && raw.documentPlotBoundaries.length > 0
      ? raw.documentPlotBoundaries
      : [
          { plotNo: raw.plotNo ? `Plot No: ${raw.plotNo}` : '', east: '', west: '', north: '', south: '' },
        ];

    const defaultBldgRows: BandhanSMEBuildingValuationRow[] = Array.isArray(raw.buildingValuationRows) && raw.buildingValuationRows.length > 0
      ? raw.buildingValuationRows
      : [
          {
            description: 'RESIDENTIAL & COMMERCIAL BUILDING',
            plinthArea: '',
            height: "10'-6\"",
            age: '',
            replacementRate: '',
            replacementCost: '',
            depreciation: '',
            valueAfterDepreciation: '',
          },
        ];

    const defaultChecklist: BandhanSMEChecklistItem[] = Array.isArray(raw.checklist) && raw.checklist.length > 0
      ? raw.checklist
      : [
          { pointNo: 1, question: 'Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed', answer: 'Yes' },
          { pointNo: 2, question: 'Boundaries of the property are mentioned as per both, title deed and actual observations', answer: 'Yes' },
          { pointNo: 3, question: 'Clearly mentioned that property has been identified by the valuer on his own based on the address', answer: 'Yes' },
          { pointNo: 4, question: 'Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)', answer: 'Yes' },
          { pointNo: 5, question: 'If land, clearly mentioned whether the land is land locked plot or independent land', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 6, question: 'If vacant land, clearly mentioned that proper demarcation and fencing has been done', answer: 'Yes' },
          { pointNo: 7, question: 'If building, clearly mentioned that construction has been done according to the building plan approval', subText: '(If not, deviation should be clearly specified)', answer: 'No' },
          { pointNo: 8, question: 'If building, clearly mentioned that building use / completion certificate has been obtained from competent authority', answer: 'No' },
          { pointNo: 9, question: 'Clearly mentioned whether access to the property is available', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 10, question: 'Basis for arriving at government value has been mentioned and necessary documents have been enclosed', answer: 'Yes' },
        ];

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      organisationTemplate: raw.organisationTemplate || 'BANDHAN BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'SME',
      bankName: raw.bankName || 'BANDHAN BANK',

      // Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // Section I: Basic Information (A - M)
      branchName: raw.branchName || '',
      letterNoAndDate: raw.letterNoAndDate || '',
      valuationMadeAtBorrowerRequest: raw.valuationMadeAtBorrowerRequest || 'No',
      managerAccompanied: raw.managerAccompanied || 'No',
      valuationType: raw.valuationType || 'Fresh Valuation',
      dateOfEarlierValuation: raw.dateOfEarlierValuation || 'No',
      previousValuerName: raw.previousValuerName || 'Not Applicable',
      dateOfVisit: raw.dateOfVisit ? formatReportDate(raw.dateOfVisit) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())),
      dateOfValuation: raw.dateOfValuation ? formatReportDate(raw.dateOfValuation) : formatReportDate(new Date()),
      personsPresent: raw.personsPresent || (prefill?.contactName ? `${prefill.contactName}, Mob-${prefill?.serviceRequest?.guestPhone || ''}` : ''),
      documentsProduced: raw.documentsProduced || 'Xerox copy of Sale Deed, Patta, Sketch Map, Assessment of Holding',

      // Borrower Details (L)
      borrowerName: raw.borrowerName || prefill?.serviceRequest?.guestName || prefill?.contactName || '',
      borrowerAt: raw.borrowerAt || '',
      borrowerPo: raw.borrowerPo || '',
      borrowerPs: raw.borrowerPs || '',
      borrowerDist: raw.borrowerDist || prefill?.serviceRequest?.city || '',
      borrowerPhone: raw.borrowerPhone || prefill?.serviceRequest?.guestPhone || '',
      borrowerNatureOfBusiness: raw.borrowerNatureOfBusiness || '',

      // Owner Details (M)
      ownerName: raw.ownerName || prefill?.contactName || '',
      ownerAt: raw.ownerAt || '',
      ownerPo: raw.ownerPo || '',
      ownerPs: raw.ownerPs || '',
      ownerPin: raw.ownerPin || prefill?.serviceRequest?.pincode || '',
      ownerDist: raw.ownerDist || prefill?.serviceRequest?.city || '',
      ownerPhone: raw.ownerPhone || prefill?.serviceRequest?.guestPhone || '',
      ownerFatherName: raw.ownerFatherName || '',

      // Section II: Valuation of Land
      // 1. Details of Property (A - L, I)
      detailsPropertyOffered: raw.detailsPropertyOffered || 'Land & Building',
      dateAcquisitionLand: raw.dateAcquisitionLand ? formatReportDate(raw.dateAcquisitionLand) : '',
      valueAsPerSaleDeed: raw.valueAsPerSaleDeed || '',
      saleDeedDocNo: raw.saleDeedDocNo || '',
      areaLandDoc: raw.areaLandDoc || '',
      areaLandRor: raw.areaLandRor || '',
      areaLandPhysical: raw.areaLandPhysical || '',

      // Location of Property & Postal Address (H)
      plotNo: raw.plotNo || '',
      khataNo: raw.khataNo || '',
      propAt: raw.propAt || '',
      propPo: raw.propPo || '',
      propPs: raw.propPs || '',
      propPin: raw.propPin || prefill?.serviceRequest?.pincode || '',
      propDist: raw.propDist || prefill?.serviceRequest?.city || '',

      urbanSemiUrbanRural: raw.urbanSemiUrbanRural || 'Urban Area',
      situatedAreaType: raw.situatedAreaType || 'Residential cum Commercial Area',
      classificationOfLocality: raw.classificationOfLocality || 'Middle Class',
      typeOfProperty: raw.typeOfProperty || 'Land & building',
      isAgricultural: raw.isAgricultural || 'No',
      agriculturalConversionContemplated: raw.agriculturalConversionContemplated || 'Not Applicable',
      isIndustrial: raw.isIndustrial || 'No',
      industrialActivitySuited: raw.industrialActivitySuited || 'Not Applicable',
      isResidential: raw.isResidential || 'Yes',
      isCommercial: raw.isCommercial || 'Yes',
      isInstitutional: raw.isInstitutional || 'No',
      isOthersSpecify: raw.isOthersSpecify || 'No',

      // 2.1 Title of Property Freehold / Leasehold
      titleFreeholdLeasehold: raw.titleFreeholdLeasehold || 'It is a free hold land',
      ownershipOfProperty: raw.ownershipOfProperty || 'Single Ownership',
      jointOwnershipShare: raw.jointOwnershipShare || 'Not Applicable',
      taxesPaidUpTo: raw.taxesPaidUpTo || 'We have not verified any recent rent receipt',
      landRevenue: raw.landRevenue || 'We have not verified any recent rent receipt',
      landBuildingMunicipalTaxes: raw.landBuildingMunicipalTaxes || 'We have not verified any recent rent receipt',
      wealthTaxAssessedPaid: raw.wealthTaxAssessedPaid || 'Not Applicable',

      // 2.2 If Leasehold
      isLeaseholdApplicable: raw.isLeaseholdApplicable || 'No',
      lessorName: raw.lessorName || 'Not Applicable',
      lesseeName: raw.lesseeName || 'Not Applicable',
      natureOfLease: raw.natureOfLease || 'Not Applicable',
      dateCommencementLease: raw.dateCommencementLease || 'Not Applicable',
      periodOfLease: raw.periodOfLease || 'Not Applicable',
      termsOfRenewal: raw.termsOfRenewal || 'Not Applicable',
      leasePremiumRentPerAnnum: raw.leasePremiumRentPerAnnum || 'Not Applicable',
      unexpiredPeriodOfLease: raw.unexpiredPeriodOfLease || 'Not Applicable',
      initialPremium: raw.initialPremium || 'Not Applicable',
      groundRentPerAnnum: raw.groundRentPerAnnum || 'Not Applicable',
      unearnedIncreasePayable: raw.unearnedIncreasePayable || 'Not Applicable',
      leasePermitsMortgage: raw.leasePermitsMortgage || 'Not Applicable',

      // 2. Rent Details
      rentOccupationStatus: raw.rentOccupationStatus || 'The Plot is occupied by Owner',
      tenantNames: raw.tenantNames || 'Not Applicable',
      tenantPortionOccupied: raw.tenantPortionOccupied || 'Not Applicable',
      monthlyAnnualRentPaid: raw.monthlyAnnualRentPaid || 'Not Applicable',
      grossRentReceived: raw.grossRentReceived || 'Not Applicable',

      // 3. Brief Description of Property
      detailedAddressWithPin: raw.detailedAddressWithPin || prefill?.propertyAddress || '',
      municipalityWardNo: raw.municipalityWardNo || '',
      streetNo: raw.streetNo || '',
      surveyPlotNo: raw.surveyPlotNo || '',
      briefKhataNo: raw.briefKhataNo || '',
      mouza: raw.mouza || '',
      thanaNo: raw.thanaNo || '',
      tehasilNo: raw.tehasilNo || '',
      tehasil: raw.tehasil || '',
      sro: raw.sro || '',
      policeStation: raw.policeStation || '',
      villageTownCity: raw.villageTownCity || 'City',
      district: raw.district || prefill?.serviceRequest?.city || '',
      state: raw.state || 'Odisha',

      dimensionDocEastWest: raw.dimensionDocEastWest || 'As per Sketch Map',
      dimensionDocNorthSouth: raw.dimensionDocNorthSouth || 'As per Sketch Map',
      dimensionMeasEastWest: raw.dimensionMeasEastWest || 'As per Sketch Map',
      dimensionMeasNorthSouth: raw.dimensionMeasNorthSouth || 'As per Sketch Map',
      extentOfSite: raw.extentOfSite || '',
      extentConsideredValuation: raw.extentConsideredValuation || '',

      documentPlotBoundaries: defaultPlots,
      verifiedBoundaryEast: raw.verifiedBoundaryEast || '',
      verifiedBoundaryWest: raw.verifiedBoundaryWest || '',
      verifiedBoundaryNorth: raw.verifiedBoundaryNorth || '',
      verifiedBoundarySouth: raw.verifiedBoundarySouth || '',
      sketchEnclosed: raw.sketchEnclosed || 'Yes, Enclosed',

      // 4. Characteristics of the Site
      levelOfLand: raw.levelOfLand || 'Leveled and Plain',
      useToWhichCanBePut: raw.useToWhichCanBePut || 'Residential cum Commercial Purpose',
      easementAgreements: raw.easementAgreements || 'No such agreement verified',
      restrictiveCovenant: raw.restrictiveCovenant || 'No',
      approvalLetterNoDateDevelopment: raw.approvalLetterNoDateDevelopment || 'Not Applicable',
      buildingUseCertificateObtained: raw.buildingUseCertificateObtained || 'Not Applicable',
      townPlanningSchemeInclusion: raw.townPlanningSchemeInclusion || '',
      cornerOrIntermittentPlot: raw.cornerOrIntermittentPlot || 'Intermittent Plot',
      isLandLocked: raw.isLandLocked || 'No',
      freeAccessAndProximity: raw.freeAccessAndProximity || 'Yes (15 ft wide CC Road) / Bike, Car, Bus',
      roadFacilities: raw.roadFacilities || 'Yes, Available at site',
      roadKindAndWidth: raw.roadKindAndWidth || '15 ft wide BT Road',
      distMunicipalOffice: raw.distMunicipalOffice || '',
      distMunicipalLimits: raw.distMunicipalLimits || '',
      waterPotentialities: raw.waterPotentialities || 'Good',
      possibilityFlooding: raw.possibilityFlooding || 'No',
      undergroundSewerageAvailable: raw.undergroundSewerageAvailable || 'No',
      drainageSystemsAvailable: raw.drainageSystemsAvailable || 'Surface Drainage',
      powerSupplyAvailable: raw.powerSupplyAvailable || 'Yes',
      surroundingDevelopment: raw.surroundingDevelopment || 'Residential Buildings',

      proximitySchool: raw.proximitySchool || '',
      proximityCollege: raw.proximityCollege || '',
      proximityHospital: raw.proximityHospital || '',
      proximityMarket: raw.proximityMarket || '',
      proximityBusStand: raw.proximityBusStand || '',
      proximityRailwayStation: raw.proximityRailwayStation || '',
      proximityOtherPlace: raw.proximityOtherPlace || '',
      latitudeLongitude: raw.latitudeLongitude || '',
      locationAdvantages: raw.locationAdvantages || '',
      locationDisadvantages: raw.locationDisadvantages || 'Nothing Observed',

      // 5. Other Issues / Points
      landAcquisitionNotification: raw.landAcquisitionNotification || 'No such documents verified',
      developmentContributionDemanded: raw.developmentContributionDemanded || 'No such documents verified',
      landCeilingEnactments: raw.landCeilingEnactments || 'No such documents verified',
      salesInstancesInLocality: raw.salesInstancesInLocality || 'Transactions of the property are not available in the locality',
      salesBasisArrivingLandRate: raw.salesBasisArrivingLandRate || 'The present market rate of land confirmed through local enquiry and property dealers and found to be acceptable.',
      adoptedLandRateRationale: raw.adoptedLandRateRationale || '',

      // 6. Valuation of Land
      previousValuationDetails: raw.previousValuationDetails || 'Not Available / Not Applicable',
      presentValuationApproachDetails: raw.presentValuationApproachDetails || '',
      landAreaTotal: raw.landAreaTotal || '',
      landGovtBenchmarkRate: raw.landGovtBenchmarkRate || '',
      landGovtValueTotal: raw.landGovtValueTotal || '',
      landMarketRate: raw.landMarketRate || '',
      landMarketValueTotal: raw.landMarketValueTotal || '',
      landDistressValue: raw.landDistressValue || '',
      landRealisableValue: raw.landRealisableValue || '',

      // Valuation of Building
      // 1. Basic Info
      buildingType: raw.buildingType || 'Residential Cum Commercial',
      yearCommencementCompletion: raw.yearCommencementCompletion || '',
      typeOfConstruction: raw.typeOfConstruction || 'RCC Frames',
      estimatedFutureLife: raw.estimatedFutureLife || '60 Yrs',
      farFsiPermissibleUtilized: raw.farFsiPermissibleUtilized || 'FAR: 3.46',
      buildingApprovalAuthorityDetails: raw.buildingApprovalAuthorityDetails || '',
      constructionAsPerPlanDeviations: raw.constructionAsPerPlanDeviations || 'Yes',

      builtUpAreaAssessmentHolding: raw.builtUpAreaAssessmentHolding || '',
      builtUpAreaAsPerActual: raw.builtUpAreaAsPerActual || '',
      carpetAreaTotal: raw.carpetAreaTotal || '',
      saleableAreaTotal: raw.saleableAreaTotal || '',

      buildingOwnerOccupiedTenanted: raw.buildingOwnerOccupiedTenanted || 'Owner Occupied',
      ownerOccupiedPortion: raw.ownerOccupiedPortion || 'Not Applicable',
      isUnderRentControlAct: raw.isUnderRentControlAct || 'No',
      buildingTenantNames: raw.buildingTenantNames || 'Not Applicable',
      buildingTenantPortions: raw.buildingTenantPortions || 'Not Applicable',
      buildingMonthlyRent: raw.buildingMonthlyRent || 'Not Applicable',
      buildingGrossRent: raw.buildingGrossRent || 'Not Applicable',
      occupantsRelatedToOwner: raw.occupantsRelatedToOwner || 'Not Applicable',
      fixturesAmountRecovered: raw.fixturesAmountRecovered || 'Borne by Owner',
      waterElectricityChargesBorneBy: raw.waterElectricityChargesBorneBy || 'Borne by Owner',
      isRentDisputePendingCourt: raw.isRentDisputePendingCourt || 'No',
      hasStandardRentFixed: raw.hasStandardRentFixed || 'Not Applicable',
      tenantBearMaintenance: raw.tenantBearMaintenance || 'Not Applicable',
      liftMaintenanceBorneBy: raw.liftMaintenanceBorneBy || 'Not Applicable',
      pumpMaintenanceBorneBy: raw.pumpMaintenanceBorneBy || 'Borne by Owner',
      commonElectricityBorneBy: raw.commonElectricityBorneBy || 'Borne by Owner',
      propertyTaxAmountBorneBy: raw.propertyTaxAmountBorneBy || 'No such document is verified',
      isBuildingInsuredDetails: raw.isBuildingInsuredDetails || 'No such document is verified',
      statutoryDuesPaid: raw.statutoryDuesPaid || 'No such document is verified',
      buildingFreeAccess: raw.buildingFreeAccess || 'Yes',

      // 2. Technical Details
      numberOfFloorsAndHeight: raw.numberOfFloorsAndHeight || "G+3 Storied Building & Height: 10'-6\"",
      floorHeightGF: raw.floorHeightGF || "10'-6\"",
      floorHeightFF: raw.floorHeightFF || 'Do',
      floorHeightSF: raw.floorHeightSF || 'Do',
      floorHeightTF: raw.floorHeightTF || 'Do',
      plinthAreaGF: raw.plinthAreaGF || '',
      plinthAreaFF: raw.plinthAreaFF || '',
      plinthAreaSF: raw.plinthAreaSF || '',
      plinthAreaTF: raw.plinthAreaTF || '',
      buildingConditionExterior: raw.buildingConditionExterior || 'Good',
      buildingConditionInterior: raw.buildingConditionInterior || 'Good',
      foundationType: raw.foundationType || 'Column Foundation',
      doorsWindowsGF: raw.doorsWindowsGF || 'Iron Shutter',
      doorsWindowsFF: raw.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter',
      doorsWindowsSF: raw.doorsWindowsSF || 'Do',
      doorsWindowsTF: raw.doorsWindowsTF || 'Do',
      flooringGF: raw.flooringGF || 'VT Flooring',
      flooringFF: raw.flooringFF || 'Do',
      flooringSF: raw.flooringSF || 'Do',
      flooringTF: raw.flooringTF || 'Do',
      wallFinishingGF: raw.wallFinishingGF || 'Cement Plastering, Putty, Painting',
      wallFinishingFF: raw.wallFinishingFF || 'Do',
      wallFinishingSF: raw.wallFinishingSF || 'Do',
      wallFinishingTF: raw.wallFinishingTF || 'Do',

      // 3. Construction Specifications
      specFoundation: raw.specFoundation || 'Column Foundation',
      specBasement: raw.specBasement || 'No',
      specSuperstructure: raw.specSuperstructure || 'Brick Masonry Super Structure',
      specJoineryDoorsWindows: raw.specJoineryDoorsWindows || 'Sal wood choukath with non sal wood shutter',
      specRccWorks: raw.specRccWorks || 'Lintel, Chajja, Beam',
      specPlastering: raw.specPlastering || 'Cement Plastering',
      specFlooringSkirting: raw.specFlooringSkirting || 'VT Flooring',
      specSpecialFinishing: raw.specSpecialFinishing || 'Yes',
      specRoofing: raw.specRoofing || 'RCC Roof',
      specDrainage: raw.specDrainage || 'Surface Drainage',
      specDecorativeFeatures: raw.specDecorativeFeatures || 'Interior work is done on Second & Third Floor',
      specInternalWiring: raw.specInternalWiring || 'Concealed',
      specWiringFittingsClass: raw.specWiringFittingsClass || 'Superior',
      specSanitaryInstallation: raw.specSanitaryInstallation || 'Yes',
      specNoOfGeysers: raw.specNoOfGeysers || 'Not Verified',
      specSanitaryFittingsClass: raw.specSanitaryFittingsClass || 'Superior',
      specCompoundWall: raw.specCompoundWall || 'No',
      specLiftsCapacity: raw.specLiftsCapacity || 'No',
      specUndergroundSump: raw.specUndergroundSump || 'Not Available',
      specOverheadTank: raw.specOverheadTank || 'Yes, On the top of the roof, 2000 Liters',
      specPumpsHp: raw.specPumpsHp || '1 Nos & 1 HP Pump',
      specRoadsPavingCompound: raw.specRoadsPavingCompound || 'No',
      specSewageDisposal: raw.specSewageDisposal || 'Connected to Public Sewers',
      specQualityClassConstruction: raw.specQualityClassConstruction || 'Good',

      // 4. Details of Building Valuation Table
      buildingValuationRows: defaultBldgRows,

      // 5. Sub-Schedules
      isExtraItemsNA: raw.isExtraItemsNA !== undefined ? raw.isExtraItemsNA : true,
      extraItems: Array.isArray(raw.extraItems) ? raw.extraItems : [
        { name: 'Portico', cost: '' },
        { name: 'Ornamental Front Door', cost: '' },
        { name: 'Sit Out / Verandah with Steel Grills', cost: '' },
        { name: 'Overhead Water Tank', cost: '' },
        { name: 'Extra Steel / Collapsible Gates', cost: '' },
      ],
      extraItemsTotal: raw.extraItemsTotal || 'Rs. 0.00',

      isAmenitiesNA: raw.isAmenitiesNA !== undefined ? raw.isAmenitiesNA : true,
      amenities: Array.isArray(raw.amenities) ? raw.amenities : [
        { name: 'Wardrobes', cost: '' },
        { name: 'Glazed Tiles', cost: '' },
        { name: 'Extra Sinks and Bath Tub', cost: '' },
        { name: 'Marble / Ceramic Tiles Flooring', cost: '' },
        { name: 'Interior Decorations', cost: '' },
        { name: 'Architectural Elevation Works', cost: '' },
        { name: 'Paneling Works', cost: '' },
        { name: 'Aluminium Works', cost: '' },
        { name: 'Aluminium Hand Rails', cost: '' },
        { name: 'False Ceiling', cost: '' },
      ],
      amenitiesTotal: raw.amenitiesTotal || 'Rs. 0.00',

      isMiscNA: raw.isMiscNA !== undefined ? raw.isMiscNA : true,
      miscItems: Array.isArray(raw.miscItems) ? raw.miscItems : [
        { name: 'Separate Toilet Room', cost: '' },
        { name: 'Separate Lumber Room', cost: '' },
        { name: 'Separate Water Tank / Sump', cost: '' },
        { name: 'Trees, Gardening', cost: '' },
      ],
      miscItemsTotal: raw.miscItemsTotal || 'Rs. 0.00',

      isServicesNA: raw.isServicesNA !== undefined ? raw.isServicesNA : true,
      servicesItems: Array.isArray(raw.servicesItems) ? raw.servicesItems : [
        { name: 'Water Supply Arrangement', cost: '' },
        { name: 'Drainage Arrangement', cost: '' },
        { name: 'Compound Wall', cost: '' },
        { name: 'C.B Deposit, Fitting etc.', cost: '' },
        { name: 'Pavement', cost: '' },
      ],
      servicesItemsTotal: raw.servicesItemsTotal || 'Rs. 0.00',

      // 6.0 Total Abstract of Entire Property
      abstractGovtLand: raw.abstractGovtLand || '',
      abstractMarketLand: raw.abstractMarketLand || '',
      abstractRealLand: raw.abstractRealLand || '',
      abstractDistressLand: raw.abstractDistressLand || '',

      abstractGovtBuilding: raw.abstractGovtBuilding || 'Rs. 0.00',
      abstractMarketBuilding: raw.abstractMarketBuilding || '',
      abstractRealBuilding: raw.abstractRealBuilding || '',
      abstractDistressBuilding: raw.abstractDistressBuilding || '',

      abstractGovtExtra: raw.abstractGovtExtra || 'Rs. 0.00',
      abstractMarketExtra: raw.abstractMarketExtra || 'Rs. 0.00',
      abstractRealExtra: raw.abstractRealExtra || 'Rs. 0.00',
      abstractDistressExtra: raw.abstractDistressExtra || 'Rs. 0.00',

      abstractGovtAmenities: raw.abstractGovtAmenities || 'Rs. 0.00',
      abstractMarketAmenities: raw.abstractMarketAmenities || 'Rs. 0.00',
      abstractRealAmenities: raw.abstractRealAmenities || 'Rs. 0.00',
      abstractDistressAmenities: raw.abstractDistressAmenities || 'Rs. 0.00',

      abstractGovtMisc: raw.abstractGovtMisc || 'Rs. 0.00',
      abstractMarketMisc: raw.abstractMarketMisc || 'Rs. 0.00',
      abstractRealMisc: raw.abstractRealMisc || 'Rs. 0.00',
      abstractDistressMisc: raw.abstractDistressMisc || 'Rs. 0.00',

      abstractGovtServices: raw.abstractGovtServices || 'Rs. 0.00',
      abstractMarketServices: raw.abstractMarketServices || 'Rs. 0.00',
      abstractRealServices: raw.abstractRealServices || 'Rs. 0.00',
      abstractDistressServices: raw.abstractDistressServices || 'Rs. 0.00',

      abstractGovtTotal: raw.abstractGovtTotal || '',
      abstractMarketTotal: raw.abstractMarketTotal || '',
      abstractRealTotal: raw.abstractRealTotal || '',
      abstractDistressTotal: raw.abstractDistressTotal || '',

      abstractGovtSay: raw.abstractGovtSay || '',
      abstractMarketSay: raw.abstractMarketSay || '',
      abstractRealSay: raw.abstractRealSay || '',
      abstractDistressSay: raw.abstractDistressSay || '',

      // Remarks, Basis & Valuation Opinion
      valuationRemarksBox: raw.valuationRemarksBox || '',
      basisOfValuationStatement: raw.basisOfValuationStatement || '(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)',
      fairMarketValue: raw.fairMarketValue || '',
      fairMarketValueWords: raw.fairMarketValueWords || '',
      realisableValue: raw.realisableValue || '',
      realisableValueWords: raw.realisableValueWords || '',
      bookValueOfLand: raw.bookValueOfLand || '',
      bookValueOfLandWords: raw.bookValueOfLandWords || '',
      distressValue: raw.distressValue || '',
      distressValueWords: raw.distressValueWords || '',
      insurableValueOfProperty: raw.insurableValueOfProperty || '',
      insurableValueOfPropertyWords: raw.insurableValueOfPropertyWords || '',

      // Declaration & Sign-off
      declarationItems: raw.declarationItems || [],
      reportPagesCount: raw.reportPagesCount || '26',
      siteEngineerName: raw.siteEngineerName || 'MR. SIBA BEHERA',
      empanelledValuerName: raw.empanelledValuerName || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)',
      valuerQualifications: raw.valuerQualifications || 'B.Tech (Civil), M.Val (RE)',
      valuerIovRegNo: raw.valuerIovRegNo || 'No. F-26377',
      valuerWealthTaxRegNo: raw.valuerWealthTaxRegNo || 'Regd. No.-107/2016-17, Cat -I',
      declarationDate: raw.declarationDate || formatReportDate(new Date()),

      // Checklist
      checklist: defaultChecklist,

      // Enclosures
      rorImageUrl: raw.rorImageUrl || '',
      locationMapImageUrl: raw.locationMapImageUrl || '',
      bhuNakshaImageUrl: raw.bhuNakshaImageUrl || '',
      guidelineValueImageUrl: raw.guidelineValueImageUrl || '',
      propertyPhotos: Array.isArray(raw.propertyPhotos) ? raw.propertyPhotos : [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  // Field change handler
  const handleChange = useCallback((field: keyof BandhanSMEReportFields, value: any) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Multi-Plot Boundary Handlers
  const handleAddPlotBoundary = () => {
    const nextPlotNo = `Plot No: Schedule ${fields.documentPlotBoundaries?.length ? fields.documentPlotBoundaries.length + 1 : 1}`;
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: [
        ...(prev.documentPlotBoundaries || []),
        { plotNo: nextPlotNo, east: '', west: '', north: '', south: '' },
      ],
    }));
  };

  const handleRemovePlotBoundary = (index: number) => {
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: prev.documentPlotBoundaries?.filter((_, i) => i !== index),
    }));
  };

  const handlePlotBoundaryChange = (index: number, key: keyof BandhanSMEPlotBoundary, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.documentPlotBoundaries || [])];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, documentPlotBoundaries: updated };
    });
  };

  // Building Valuation Table Handlers
  const handleAddBuildingRow = () => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: [
        ...(prev.buildingValuationRows || []),
        {
          description: '',
          plinthArea: '',
          height: "10'-6\"",
          age: '',
          replacementRate: '',
          replacementCost: '',
          depreciation: '',
          valueAfterDepreciation: '',
        },
      ],
    }));
  };

  const handleRemoveBuildingRow = (index: number) => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: prev.buildingValuationRows?.filter((_, i) => i !== index),
    }));
  };

  const handleBuildingRowChange = (index: number, key: keyof BandhanSMEBuildingValuationRow, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.buildingValuationRows || [])];
      const row = { ...updated[index], [key]: val };

      // Auto calculate replacement cost & net value if plinth and rate exist
      const p = parseNum(key === 'plinthArea' ? val : row.plinthArea);
      const r = parseNum(key === 'replacementRate' ? val : row.replacementRate);
      if (p && r) {
        const cost = p * r;
        row.replacementCost = `Rs. ${formatCurrencyINR(cost)}`;
        const dep = parseNum(row.depreciation);
        const net = Math.max(0, cost - dep);
        row.valueAfterDepreciation = `Rs. ${formatCurrencyINR(net)}`;
      }
      updated[index] = row;
      return { ...prev, buildingValuationRows: updated };
    });
  };

  // Checklist handler
  const handleChecklistChange = (index: number, answer: 'Yes' | 'No' | 'NA') => {
    setFields((prev) => {
      const updated = [...(prev.checklist || [])];
      updated[index] = { ...updated[index], answer };
      return { ...prev, checklist: updated };
    });
  };

  // Sub-Schedule items handler
  const handleSubScheduleChange = (
    scheduleKey: 'extraItems' | 'amenities' | 'miscItems' | 'servicesItems',
    index: number,
    costVal: string
  ) => {
    setFields((prev) => {
      const updated = [...(prev[scheduleKey] || [])];
      updated[index] = { ...updated[index], cost: costVal };
      return { ...prev, [scheduleKey]: updated };
    });
  };

  // Auto Calculation Engine
  useEffect(() => {
    // 1. Land Calculations
    const lArea = parseNum(fields.extentOfSite || fields.areaLandDoc || fields.landAreaTotal);
    const lMktRate = parseNum(fields.landMarketRate);
    const lGovtRate = parseNum(fields.landGovtBenchmarkRate);

    const landMarketVal = lArea && lMktRate ? Math.round(lArea * lMktRate) : 0;
    const landGovtVal = lArea && lGovtRate ? Math.round(lArea * lGovtRate) : 0;
    const landDistVal = Math.round(landMarketVal * 0.85);
    const landRealVal = Math.round(landMarketVal * 0.95);

    // 2. Building Calculations
    let bldgNetVal = 0;
    (fields.buildingValuationRows || []).forEach((br) => {
      const v = parseNum(br.valueAfterDepreciation || br.replacementCost);
      bldgNetVal += v;
    });
    const bldgDistVal = Math.round(bldgNetVal * 0.85);
    const bldgRealVal = Math.round(bldgNetVal * 0.95);

    // 3. Sub-schedules summation
    const sumSched = (items?: BandhanSMESubScheduleItem[], isNA?: boolean) => {
      if (isNA || !items) return 0;
      return items.reduce((acc, it) => acc + parseNum(it.cost), 0);
    };

    const extraVal = sumSched(fields.extraItems, fields.isExtraItemsNA);
    const amenitiesVal = sumSched(fields.amenities, fields.isAmenitiesNA);
    const miscVal = sumSched(fields.miscItems, fields.isMiscNA);
    const servicesVal = sumSched(fields.servicesItems, fields.isServicesNA);

    // 4. Total Abstract Matrix
    const totalGovt = landGovtVal; // Building Govt usually 0 unless specified
    const totalMarket = landMarketVal + bldgNetVal + extraVal + amenitiesVal + miscVal + servicesVal;
    const totalReal = Math.round(totalMarket * 0.95);
    const totalDist = Math.round(totalMarket * 0.85);

    const roundSay = (n: number) => Math.round(n / 1000) * 1000;

    setFields((prev) => {
      let changed = false;
      const next = { ...prev };

      // Sync Land Valuation Totals
      if (landMarketVal > 0 && !prev.landMarketValueTotal) {
        next.landMarketValueTotal = `Rs.${formatCurrencyINR(landMarketVal)}/-`;
        next.landGovtValueTotal = `Rs.${formatCurrencyINR(landGovtVal)}/-`;
        next.landDistressValue = `Rs.${formatCurrencyINR(landDistVal)}/-`;
        next.landRealisableValue = `Rs.${formatCurrencyINR(landRealVal)}/-`;
        changed = true;
      }

      // Sync Abstract Matrix
      if (landMarketVal > 0) {
        next.abstractGovtLand = `Rs. ${formatCurrencyINR(landGovtVal)}`;
        next.abstractMarketLand = `Rs. ${formatCurrencyINR(landMarketVal)}`;
        next.abstractRealLand = `Rs. ${formatCurrencyINR(landRealVal)}`;
        next.abstractDistressLand = `Rs. ${formatCurrencyINR(landDistVal)}`;
        changed = true;
      }
      if (bldgNetVal > 0) {
        next.abstractMarketBuilding = `Rs. ${formatCurrencyINR(bldgNetVal)}`;
        next.abstractRealBuilding = `Rs. ${formatCurrencyINR(bldgRealVal)}`;
        next.abstractDistressBuilding = `Rs. ${formatCurrencyINR(bldgDistVal)}`;
        changed = true;
      }

      if (totalMarket > 0) {
        next.abstractGovtTotal = `Rs. ${formatCurrencyINR(totalGovt)}`;
        next.abstractMarketTotal = `Rs. ${formatCurrencyINR(totalMarket)}`;
        next.abstractRealTotal = `Rs. ${formatCurrencyINR(totalReal)}`;
        next.abstractDistressTotal = `Rs. ${formatCurrencyINR(totalDist)}`;

        next.abstractGovtSay = `Rs. ${formatCurrencyINR(roundSay(totalGovt))}`;
        next.abstractMarketSay = `Rs. ${formatCurrencyINR(roundSay(totalMarket))}`;
        next.abstractRealSay = `Rs. ${formatCurrencyINR(roundSay(totalReal))}`;
        next.abstractDistressSay = `Rs. ${formatCurrencyINR(roundSay(totalDist))}`;

        next.fairMarketValue = `Rs.${formatCurrencyINR(roundSay(totalMarket))}/-`;
        next.fairMarketValueWords = formatIndianCurrency(roundSay(totalMarket));
        next.realisableValue = `Rs.${formatCurrencyINR(roundSay(totalReal))}/-`;
        next.realisableValueWords = formatIndianCurrency(roundSay(totalReal));
        next.bookValueOfLand = `Rs.${formatCurrencyINR(roundSay(landGovtVal))}/-`;
        next.bookValueOfLandWords = formatIndianCurrency(roundSay(landGovtVal));
        next.distressValue = `Rs.${formatCurrencyINR(roundSay(totalDist))}/-`;
        next.distressValueWords = formatIndianCurrency(roundSay(totalDist));
        next.insurableValueOfProperty = `Rs.${formatCurrencyINR(bldgDistVal)}/-`;
        next.insurableValueOfPropertyWords = formatIndianCurrency(bldgDistVal);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    fields.extentOfSite,
    fields.areaLandDoc,
    fields.landAreaTotal,
    fields.landMarketRate,
    fields.landGovtBenchmarkRate,
    fields.buildingValuationRows,
    fields.isExtraItemsNA,
    fields.extraItems,
    fields.isAmenitiesNA,
    fields.amenities,
    fields.isMiscNA,
    fields.miscItems,
    fields.isServicesNA,
    fields.servicesItems,
  ]);

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, fields);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Failed to save draft: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Preview PDF
  const handlePreviewPDF = async () => {
    try {
      const pdfBytes = await generateBandhanSMEReport(fields);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      alert('Failed to generate PDF: ' + e.message);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const pdfBytes = await generateBandhanSMEReport(fields);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Bandhan_Bank_SME_${projectCode || projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for review?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      alert('Report submitted successfully!');
      router.refresh();
    } catch (e: any) {
      alert('Failed to submit report: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Local image uploader helper
  const handleLocalImageUpload = (fieldKey: keyof BandhanSMEReportFields, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          handleChange(fieldKey, ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* Top Banner */}
      <ActiveConfigBanner
        bankName="BANDHAN BANK"
        subclass="SME"
        clientType="organisation"
        onResetWizard={onResetWizard}
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Fields (9 Cols) */}
          <div className="lg:col-span-9 space-y-6">

            {/* Header Block */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Bandhan Bank — SME Valuation Report
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ref. No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.refNo || ''}
                    onChange={(e) => handleChange('refNo', e.target.value)}
                    placeholder="e.g. BANDHAN/SME/2026/01"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Report Date:">
                  <BaseDateInput
                    value={fields.reportDate || ''}
                    onChange={(val) => handleChange('reportDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 1. BASIC INFORMATION */}
            <Section id="sec-basic" title="1. Basic Information (Section I: Points A–M)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="A. Name of the Bank Branch / CBO / Asset Centre:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.branchName || ''}
                      onChange={(e) => handleChange('branchName', e.target.value)}
                      placeholder="e.g. Bandhan Bank, Asset Centre / Branch Name"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="B. Bank Letter No. & Date Requesting Valuation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.letterNoAndDate || ''}
                    onChange={(e) => handleChange('letterNoAndDate', e.target.value)}
                    placeholder="e.g. Letter Ref / Date (DD.MM.YYYY)"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Valuation Made at Request of Borrower?:">
                  <select
                    className={selectCls}
                    value={fields.valuationMadeAtBorrowerRequest || 'No'}
                    onChange={(e) => handleChange('valuationMadeAtBorrowerRequest', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
                <Field label="D. Name of Manager / Officer who Accompanied:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.managerAccompanied || 'No'}
                    onChange={(e) => handleChange('managerAccompanied', e.target.value)}
                    placeholder="No or Officer Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Valuation Type:">
                  <select
                    className={selectCls}
                    value={fields.valuationType || 'Fresh Valuation'}
                    onChange={(e) => handleChange('valuationType', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Fresh Valuation">Fresh Valuation</option>
                    <option value="Revaluation">Revaluation</option>
                    <option value="Periodic Valuation">Periodic Valuation</option>
                  </select>
                </Field>
                <Field label="F. Date of Earlier Valuation, if any:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dateOfEarlierValuation || 'No'}
                    onChange={(e) => handleChange('dateOfEarlierValuation', e.target.value)}
                    placeholder="No or Earlier Date"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="G. Name of Previous Valuer, if any:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.previousValuerName || 'Not Applicable'}
                    onChange={(e) => handleChange('previousValuerName', e.target.value)}
                    placeholder="Not Applicable or Valuer Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="H. Date of Visit to the Property:">
                  <BaseDateInput
                    value={fields.dateOfVisit || ''}
                    onChange={(val) => handleChange('dateOfVisit', val)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="I. Date on which Valuation is Made:">
                  <BaseDateInput
                    value={fields.dateOfValuation || ''}
                    onChange={(val) => handleChange('dateOfValuation', val)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="J. Person(s) in Presence of whom Valuation is Made:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.personsPresent || ''}
                      onChange={(e) => handleChange('personsPresent', e.target.value)}
                      placeholder="e.g. Person Name, Mob-98XXXXXXXX"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="K. List of Documents Produced for Verification:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.documentsProduced || ''}
                      onChange={(e) => handleChange('documentsProduced', e.target.value)}
                      placeholder="e.g. Xerox copy of Sale Deed, Patta, Sketch Map, Assessment of Holding"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                {/* Borrower Sub-Block */}
                <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    L. Borrower / Borrowal Account Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Borrower Name:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerName || ''}
                        onChange={(e) => handleChange('borrowerName', e.target.value)}
                        placeholder="e.g. M/S. Company / Borrower Name"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Nature of Business:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerNatureOfBusiness || ''}
                        onChange={(e) => handleChange('borrowerNatureOfBusiness', e.target.value)}
                        placeholder="e.g. Trading, Manufacturing, Retail"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="At (Location):">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerAt || ''}
                        onChange={(e) => handleChange('borrowerAt', e.target.value)}
                        placeholder="e.g. Area / Street"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="P.O:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerPo || ''}
                        onChange={(e) => handleChange('borrowerPo', e.target.value)}
                        placeholder="Post Office"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="P.S:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerPs || ''}
                        onChange={(e) => handleChange('borrowerPs', e.target.value)}
                        placeholder="Police Station"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Dist & State:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerDist || ''}
                        onChange={(e) => handleChange('borrowerDist', e.target.value)}
                        placeholder="e.g. Khordha, Odisha"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Phone / Mobile No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.borrowerPhone || ''}
                        onChange={(e) => handleChange('borrowerPhone', e.target.value)}
                        placeholder="Mob-XXXXXXXXXX"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                {/* Owner Sub-Block */}
                <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    M. Owner / Owner(s) of the Property
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Owner Name:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerName || ''}
                        onChange={(e) => handleChange('ownerName', e.target.value)}
                        placeholder="e.g. Owner Full Name"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Father's / Husband's Name:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerFatherName || ''}
                        onChange={(e) => handleChange('ownerFatherName', e.target.value)}
                        placeholder="e.g. S/o / W/o Full Name"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="At (Location):">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerAt || ''}
                        onChange={(e) => handleChange('ownerAt', e.target.value)}
                        placeholder="e.g. Plot No, Street"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="P.O:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerPo || ''}
                        onChange={(e) => handleChange('ownerPo', e.target.value)}
                        placeholder="Post Office"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="P.S:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerPs || ''}
                        onChange={(e) => handleChange('ownerPs', e.target.value)}
                        placeholder="Police Station"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="PIN Code:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerPin || ''}
                        onChange={(e) => handleChange('ownerPin', e.target.value)}
                        placeholder="e.g. 751010"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="District:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerDist || ''}
                        onChange={(e) => handleChange('ownerDist', e.target.value)}
                        placeholder="e.g. Khordha, Odisha"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Phone / Mobile No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.ownerPhone || ''}
                        onChange={(e) => handleChange('ownerPhone', e.target.value)}
                        placeholder="Mob-XXXXXXXXXX"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            {/* 2. LAND DETAILS */}
            <Section id="sec-prop-details" title="2. Land Details (Section II: Details of Property)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="A. Details of Property Offered as Secured:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.detailsPropertyOffered || 'Land & Building'}
                    onChange={(e) => handleChange('detailsPropertyOffered', e.target.value)}
                    placeholder="e.g. Land & Building"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Date of Acquisition / Purchase of Land:">
                  <BaseDateInput
                    value={fields.dateAcquisitionLand || ''}
                    onChange={(val) => handleChange('dateAcquisitionLand', val)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Value as per Registered Sale Deed:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valueAsPerSaleDeed || ''}
                    onChange={(e) => handleChange('valueAsPerSaleDeed', e.target.value)}
                    placeholder="e.g. Rs. 45,00,000/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Sale Deed / Title Deed Document No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.saleDeedDocNo || ''}
                    onChange={(e) => handleChange('saleDeedDocNo', e.target.value)}
                    placeholder="e.g. 1081609995"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Area of Land (As per Title Deed):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.areaLandDoc || ''}
                    onChange={(e) => handleChange('areaLandDoc', e.target.value)}
                    placeholder="e.g. Ac.0.069 Dec (3006.00 Sft)"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="F. Area of Land (As per ROR):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.areaLandRor || ''}
                    onChange={(e) => handleChange('areaLandRor', e.target.value)}
                    placeholder="e.g. Ac.0.069 Dec (3006.00 Sft)"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="G. Area of Land (As per Physical Measurement):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.areaLandPhysical || ''}
                    onChange={(e) => handleChange('areaLandPhysical', e.target.value)}
                    placeholder="e.g. Ac.0.069 Dec (3006.00 Sft)"
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Property Address & Postal Location */}
                <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    H. Location of Property & Postal Address
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Plot No(s):">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.plotNo || ''}
                        onChange={(e) => handleChange('plotNo', e.target.value)}
                        placeholder="e.g. Plot No: 443/11470"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Khata No / Dag No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.khataNo || ''}
                        onChange={(e) => handleChange('khataNo', e.target.value)}
                        placeholder="e.g. Khata No: 1330/8618"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="At:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.propAt || ''}
                        onChange={(e) => handleChange('propAt', e.target.value)}
                        placeholder="Locality"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="P.O:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.propPo || ''}
                        onChange={(e) => handleChange('propPo', e.target.value)}
                        placeholder="Post Office"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="P.S:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.propPs || ''}
                        onChange={(e) => handleChange('propPs', e.target.value)}
                        placeholder="Police Station"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="PIN Code:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.propPin || ''}
                        onChange={(e) => handleChange('propPin', e.target.value)}
                        placeholder="PIN"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="District:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.propDist || ''}
                        onChange={(e) => handleChange('propDist', e.target.value)}
                        placeholder="e.g. Khordha, Odisha"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="I. Urban / Semi Urban / Rural:">
                  <select
                    className={selectCls}
                    value={fields.urbanSemiUrbanRural || 'Urban Area'}
                    onChange={(e) => handleChange('urbanSemiUrbanRural', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Urban Area">Urban Area</option>
                    <option value="Semi Urban Area">Semi Urban Area</option>
                    <option value="Rural Area">Rural Area</option>
                  </select>
                </Field>
                <Field label="J. Locality Zone:">
                  <select
                    className={selectCls}
                    value={fields.situatedAreaType || 'Residential cum Commercial Area'}
                    onChange={(e) => handleChange('situatedAreaType', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Residential Area">Residential Area</option>
                    <option value="Commercial Area">Commercial Area</option>
                    <option value="Residential cum Commercial Area">Residential cum Commercial Area</option>
                    <option value="Industrial Area">Industrial Area</option>
                    <option value="Mixed Area">Mixed Area</option>
                  </select>
                </Field>
                <Field label="K. Locality Classification:">
                  <select
                    className={selectCls}
                    value={fields.classificationOfLocality || 'Middle Class'}
                    onChange={(e) => handleChange('classificationOfLocality', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="High Class">High Class</option>
                    <option value="Middle Class">Middle Class</option>
                    <option value="Poor Class">Poor Class</option>
                  </select>
                </Field>
                <Field label="L. Type of Property:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfProperty || 'Land & building'}
                    onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                    placeholder="e.g. Land & building"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 3. TITLE, OWNERSHIP & RENT */}
            <Section id="sec-title-rent" title="3. Title, Ownership & Rent (Points 2.1, 2.2 & 2)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="2.1 Title of Property:">
                  <select
                    className={selectCls}
                    value={fields.titleFreeholdLeasehold || 'It is a free hold land'}
                    onChange={(e) => handleChange('titleFreeholdLeasehold', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="It is a free hold land">Freehold</option>
                    <option value="It is a lease hold land">Leasehold</option>
                  </select>
                </Field>
                <Field label="A. Ownership of Property:">
                  <select
                    className={selectCls}
                    value={fields.ownershipOfProperty || 'Single Ownership'}
                    onChange={(e) => handleChange('ownershipOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Single Ownership">Single Ownership</option>
                    <option value="Joint Ownership">Joint Ownership</option>
                  </select>
                </Field>
                <Field label="B. Joint Ownership Share:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.jointOwnershipShare || 'Not Applicable'}
                    onChange={(e) => handleChange('jointOwnershipShare', e.target.value)}
                    placeholder="Not Applicable or Undivided Share"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Taxes Paid Up To:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.taxesPaidUpTo || 'We have not verified any recent rent receipt'}
                    onChange={(e) => handleChange('taxesPaidUpTo', e.target.value)}
                    placeholder="Receipt status"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Land Revenue:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landRevenue || 'We have not verified any recent rent receipt'}
                    onChange={(e) => handleChange('landRevenue', e.target.value)}
                    placeholder="Revenue status"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Municipal Taxes:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landBuildingMunicipalTaxes || 'We have not verified any recent rent receipt'}
                    onChange={(e) => handleChange('landBuildingMunicipalTaxes', e.target.value)}
                    placeholder="Municipal Tax status"
                    disabled={isReadOnly}
                  />
                </Field>

                {/* 2. Rent */}
                <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">2. Rent Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Occupation Status:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.rentOccupationStatus || 'The Plot is occupied by Owner'}
                        onChange={(e) => handleChange('rentOccupationStatus', e.target.value)}
                        placeholder="Occupied by Owner / Tenanted"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="A. Tenant Names:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.tenantNames || 'Not Applicable'}
                        onChange={(e) => handleChange('tenantNames', e.target.value)}
                        placeholder="Not Applicable or Tenant Name"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B. Portion in Occupation:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.tenantPortionOccupied || 'Not Applicable'}
                        onChange={(e) => handleChange('tenantPortionOccupied', e.target.value)}
                        placeholder="Not Applicable"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="C. Monthly / Annual Rent:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.monthlyAnnualRentPaid || 'Not Applicable'}
                        onChange={(e) => handleChange('monthlyAnnualRentPaid', e.target.value)}
                        placeholder="Not Applicable or Rent Amount"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            {/* 4. DESCRIPTION & BOUNDARIES */}
            <Section id="sec-desc-boundaries" title="4. Property Description & Multi-Plot Boundaries (Point 3)">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Field label="A. Detailed Postal Address (with PIN):">
                      <textarea
                        rows={2}
                        className={inputCls}
                        value={fields.detailedAddressWithPin || ''}
                        onChange={(e) => handleChange('detailedAddressWithPin', e.target.value)}
                        placeholder="Detailed address as per deeds"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                  <Field label="B. Ward No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.municipalityWardNo || ''}
                      onChange={(e) => handleChange('municipalityWardNo', e.target.value)}
                      placeholder="Ward No"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Mouza:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.mouza || ''}
                      onChange={(e) => handleChange('mouza', e.target.value)}
                      placeholder="Mouza Name"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Thana No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.thanaNo || ''}
                      onChange={(e) => handleChange('thanaNo', e.target.value)}
                      placeholder="Thana No"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Tehasil:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.tehasil || ''}
                      onChange={(e) => handleChange('tehasil', e.target.value)}
                      placeholder="Tehasil"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="SRO:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.sro || ''}
                      onChange={(e) => handleChange('sro', e.target.value)}
                      placeholder="SRO Office"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <Field label="Doc Dim E-W:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.dimensionDocEastWest || 'As per Sketch Map'}
                      onChange={(e) => handleChange('dimensionDocEastWest', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Doc Dim N-S:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.dimensionDocNorthSouth || 'As per Sketch Map'}
                      onChange={(e) => handleChange('dimensionDocNorthSouth', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Meas Dim E-W:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.dimensionMeasEastWest || 'As per Sketch Map'}
                      onChange={(e) => handleChange('dimensionMeasEastWest', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Meas Dim N-S:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.dimensionMeasNorthSouth || 'As per Sketch Map'}
                      onChange={(e) => handleChange('dimensionMeasNorthSouth', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                {/* Multi-Plot Boundaries (P.1 Document) */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-sm">
                      P.1 Boundaries as per Document / Deed (Dynamic Multi-Plot Support)
                    </h4>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleAddPlotBoundary}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded"
                      >
                        + Add Plot Boundary
                      </button>
                    )}
                  </div>

                  {(fields.documentPlotBoundaries || []).map((pb, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          className="font-medium text-xs text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 w-64 px-1 py-0.5"
                          value={pb.plotNo}
                          onChange={(e) => handlePlotBoundaryChange(idx, 'plotNo', e.target.value)}
                          placeholder="e.g. Plot No: 443/11470"
                          disabled={isReadOnly}
                        />
                        {!isReadOnly && (fields.documentPlotBoundaries || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePlotBoundary(idx)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Field label="East:">
                          <input
                            type="text"
                            className={inputCls}
                            value={pb.east}
                            onChange={(e) => handlePlotBoundaryChange(idx, 'east', e.target.value)}
                            placeholder="East Boundary"
                            disabled={isReadOnly}
                          />
                        </Field>
                        <Field label="West:">
                          <input
                            type="text"
                            className={inputCls}
                            value={pb.west}
                            onChange={(e) => handlePlotBoundaryChange(idx, 'west', e.target.value)}
                            placeholder="West Boundary"
                            disabled={isReadOnly}
                          />
                        </Field>
                        <Field label="North:">
                          <input
                            type="text"
                            className={inputCls}
                            value={pb.north}
                            onChange={(e) => handlePlotBoundaryChange(idx, 'north', e.target.value)}
                            placeholder="North Boundary"
                            disabled={isReadOnly}
                          />
                        </Field>
                        <Field label="South:">
                          <input
                            type="text"
                            className={inputCls}
                            value={pb.south}
                            onChange={(e) => handlePlotBoundaryChange(idx, 'south', e.target.value)}
                            placeholder="South Boundary"
                            disabled={isReadOnly}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verified Boundaries (P.2 Physical) */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    P.2 Boundaries as per Physical Verification on Site
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="East:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.verifiedBoundaryEast || ''}
                        onChange={(e) => handleChange('verifiedBoundaryEast', e.target.value)}
                        placeholder="East boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.verifiedBoundaryWest || ''}
                        onChange={(e) => handleChange('verifiedBoundaryWest', e.target.value)}
                        placeholder="West boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="North:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.verifiedBoundaryNorth || ''}
                        onChange={(e) => handleChange('verifiedBoundaryNorth', e.target.value)}
                        placeholder="North boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.verifiedBoundarySouth || ''}
                        onChange={(e) => handleChange('verifiedBoundarySouth', e.target.value)}
                        placeholder="South boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            {/* 5. SITE CHARACTERISTICS & PROXIMITIES */}
            <Section id="sec-site-char" title="5. Site Characteristics & Proximities (Point 4)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="A. Level of Land / Topography:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.levelOfLand || 'Leveled and Plain'}
                    onChange={(e) => handleChange('levelOfLand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Permitted Use:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.useToWhichCanBePut || 'Residential cum Commercial Purpose'}
                    onChange={(e) => handleChange('useToWhichCanBePut', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="H. Corner / Intermittent Plot:">
                  <select
                    className={selectCls}
                    value={fields.cornerOrIntermittentPlot || 'Intermittent Plot'}
                    onChange={(e) => handleChange('cornerOrIntermittentPlot', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Intermittent Plot">Intermittent Plot</option>
                    <option value="Corner Plot">Corner Plot</option>
                  </select>
                </Field>
                <Field label="I. Land Locked?:">
                  <select
                    className={selectCls}
                    value={fields.isLandLocked || 'No'}
                    onChange={(e) => handleChange('isLandLocked', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
                <Field label="L. Road Kind & Width:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.roadKindAndWidth || '15 ft wide BT Road'}
                    onChange={(e) => handleChange('roadKindAndWidth', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="U. Latitude / Longitude Coordinates:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.latitudeLongitude || ''}
                    onChange={(e) => handleChange('latitudeLongitude', e.target.value)}
                    placeholder="e.g. Latitude: 20.3128, Longitude: 85.8569"
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Civic Proximities */}
                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700 uppercase mb-2">T. Proximity to Civic Amenities</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <Field label="School:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.proximitySchool || ''}
                        onChange={(e) => handleChange('proximitySchool', e.target.value)}
                        placeholder="e.g. 2 Kms"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="College:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.proximityCollege || ''}
                        onChange={(e) => handleChange('proximityCollege', e.target.value)}
                        placeholder="e.g. 3 Kms"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Hospital:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.proximityHospital || ''}
                        onChange={(e) => handleChange('proximityHospital', e.target.value)}
                        placeholder="e.g. 1 Km"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Market:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.proximityMarket || ''}
                        onChange={(e) => handleChange('proximityMarket', e.target.value)}
                        placeholder="e.g. 500 Mtrs"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Bus Stand:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.proximityBusStand || ''}
                        onChange={(e) => handleChange('proximityBusStand', e.target.value)}
                        placeholder="e.g. 2 Kms"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Railway Station:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.proximityRailwayStation || ''}
                        onChange={(e) => handleChange('proximityRailwayStation', e.target.value)}
                        placeholder="e.g. 2 Kms"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Location Advantages:">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={fields.locationAdvantages || ''}
                      onChange={(e) => handleChange('locationAdvantages', e.target.value)}
                      placeholder="e.g. Situated in developed area close to civic amenities..."
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 6. OTHER ISSUES & SALES */}
            <Section id="sec-other-issues" title="6. Other Issues & Sales Instances (Point 5)">
              <div className="space-y-4">
                <Field label="D. c. Land Rate Adopted in this Valuation (Rationale):">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={fields.adoptedLandRateRationale || ''}
                    onChange={(e) => handleChange('adoptedLandRateRationale', e.target.value)}
                    placeholder="e.g. Prevailing market rate is Rs.5800/- to Rs.6100/-. Adopted market rate is Rs.6000/- Per Sft..."
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 7. VALUATION OF LAND */}
            <Section id="sec-land-valuation" title="7. Valuation of Land (Section II.6)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Method of Valuation Statement:">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={fields.presentValuationApproachDetails || ''}
                      onChange={(e) => handleChange('presentValuationApproachDetails', e.target.value)}
                      placeholder="e.g. Land & Building method of valuation has been adopted..."
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="Total Land Area (Sq.ft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landAreaTotal || fields.extentOfSite || ''}
                    onChange={(e) => handleChange('landAreaTotal', e.target.value)}
                    placeholder="e.g. 3006.00"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Adopted Market Land Rate (Rs./Sq.ft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landMarketRate || ''}
                    onChange={(e) => handleChange('landMarketRate', e.target.value)}
                    placeholder="e.g. 6000"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total Market Value of Land:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landMarketValueTotal || ''}
                    onChange={(e) => handleChange('landMarketValueTotal', e.target.value)}
                    placeholder="Auto-calculated"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Govt. Benchmark Land Rate (Rs./Sq.ft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landGovtBenchmarkRate || ''}
                    onChange={(e) => handleChange('landGovtBenchmarkRate', e.target.value)}
                    placeholder="e.g. 3970"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Govt. Benchmark Value of Land:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landGovtValueTotal || ''}
                    onChange={(e) => handleChange('landGovtValueTotal', e.target.value)}
                    placeholder="Auto-calculated"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Distress Value of Land (85%):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landDistressValue || ''}
                    onChange={(e) => handleChange('landDistressValue', e.target.value)}
                    placeholder="Auto-calculated"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 8. BUILDING BASIC INFO & PLINTH */}
            <Section id="sec-bldg-basic" title="8. Valuation of Building: Basic Info & Plinth (Part 1)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="A. Type of Building:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.buildingType || 'Residential Cum Commercial'}
                    onChange={(e) => handleChange('buildingType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Year of Commencement & Completion:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.yearCommencementCompletion || ''}
                    onChange={(e) => handleChange('yearCommencementCompletion', e.target.value)}
                    placeholder="e.g. Construction- 2019, Completion- 2021"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Construction Type:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfConstruction || 'RCC Frames'}
                    onChange={(e) => handleChange('typeOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Estimated Future Life (Years):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.estimatedFutureLife || '60 Yrs'}
                    onChange={(e) => handleChange('estimatedFutureLife', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="F. Approval Letter / Assessment of Holding:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.buildingApprovalAuthorityDetails || ''}
                      onChange={(e) => handleChange('buildingApprovalAuthorityDetails', e.target.value)}
                      placeholder="e.g. Assessment of Holding given by Bhubaneswar Municipal Corporation..."
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="1.H Built up Area (Assessment vs Actual):">
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={fields.builtUpAreaAsPerActual || ''}
                      onChange={(e) => handleChange('builtUpAreaAsPerActual', e.target.value)}
                      placeholder="GF: 2807 Sft, FF: 2807 Sft, SF: 2807 Sft, TF: 2807 Sft, Total: 10428 Sft"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 9. BUILDING CHECKLIST */}
            <Section id="sec-bldg-checklist" title="9. Building Statutory Checklist (Points I to AB)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="I. Occupancy:">
                  <select
                    className={selectCls}
                    value={fields.buildingOwnerOccupiedTenanted || 'Owner Occupied'}
                    onChange={(e) => handleChange('buildingOwnerOccupiedTenanted', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Owner Occupied">Owner Occupied</option>
                    <option value="Tenanted">Tenanted</option>
                    <option value="Both">Both</option>
                  </select>
                </Field>
                <Field label="K. Under Rent Control Act:">
                  <select
                    className={selectCls}
                    value={fields.isUnderRentControlAct || 'No'}
                    onChange={(e) => handleChange('isUnderRentControlAct', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
                <Field label="W. Pump Maintenance:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.pumpMaintenanceBorneBy || 'Borne by Owner'}
                    onChange={(e) => handleChange('pumpMaintenanceBorneBy', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="X. Common Electricity:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.commonElectricityBorneBy || 'Borne by Owner'}
                    onChange={(e) => handleChange('commonElectricityBorneBy', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 10. TECHNICAL DETAILS & SPECIFICATIONS */}
            <Section id="sec-bldg-tech-spec" title="10. Technical Details & Specifications (Parts 2 & 3)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <Field label="Floor Heights:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.numberOfFloorsAndHeight || "G+3 Storied Building & Height: 10'-6\""}
                    onChange={(e) => handleChange('numberOfFloorsAndHeight', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Foundation Type:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.foundationType || 'Column Foundation'}
                    onChange={(e) => handleChange('foundationType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Roofing:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.specRoofing || 'RCC Roof'}
                    onChange={(e) => handleChange('specRoofing', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Doors & Windows:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter'}
                    onChange={(e) => handleChange('doorsWindowsFF', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Flooring:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.flooringGF || 'VT Flooring'}
                    onChange={(e) => handleChange('flooringGF', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Wall Finishing:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.wallFinishingGF || 'Cement Plastering, Putty, Painting'}
                    onChange={(e) => handleChange('wallFinishingGF', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 11. BUILDING VALUATION & 4 SUB-SCHEDULES */}
            <Section id="sec-bldg-valuation-schedules" title="11. Building Valuation & Sub-Schedules (Part 4 & 5)">
              <div className="space-y-4">
                {/* 8-Col Valuation Table */}
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 text-sm">3. Details of Building Valuation</h4>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddBuildingRow}
                      className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded"
                    >
                      + Add Valuation Row
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-left">Plinth (sft)</th>
                        <th className="p-2 text-left">Height</th>
                        <th className="p-2 text-left">Age</th>
                        <th className="p-2 text-left">Repl. Rate</th>
                        <th className="p-2 text-left">Repl. Cost</th>
                        <th className="p-2 text-left">Depreciation</th>
                        <th className="p-2 text-left">Net Value</th>
                        {!isReadOnly && <th className="p-2 w-10 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(fields.buildingValuationRows || []).map((br, idx) => (
                        <tr key={idx}>
                          <td className="p-1">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.description}
                              onChange={(e) => handleBuildingRowChange(idx, 'description', e.target.value)}
                              placeholder="Description"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-20">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.plinthArea}
                              onChange={(e) => handleBuildingRowChange(idx, 'plinthArea', e.target.value)}
                              placeholder="Plinth"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-16">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.height}
                              onChange={(e) => handleBuildingRowChange(idx, 'height', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-16">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.age}
                              onChange={(e) => handleBuildingRowChange(idx, 'age', e.target.value)}
                              placeholder="Yrs"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-24">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.replacementRate}
                              onChange={(e) => handleBuildingRowChange(idx, 'replacementRate', e.target.value)}
                              placeholder="Rate"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-28">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.replacementCost}
                              onChange={(e) => handleBuildingRowChange(idx, 'replacementCost', e.target.value)}
                              placeholder="Cost"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-24">
                            <input
                              type="text"
                              className={inputCls}
                              value={br.depreciation}
                              onChange={(e) => handleBuildingRowChange(idx, 'depreciation', e.target.value)}
                              placeholder="Dep"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1 w-28">
                            <input
                              type="text"
                              className={`${inputCls} font-semibold`}
                              value={br.valueAfterDepreciation}
                              onChange={(e) => handleBuildingRowChange(idx, 'valueAfterDepreciation', e.target.value)}
                              placeholder="Net Value"
                              disabled={isReadOnly}
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveBuildingRow(idx)}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                ×
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4 Sub-schedules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  {/* Extra Items */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-xs text-slate-800">5.1 Extra Items</h5>
                      <label className="text-xs flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fields.isExtraItemsNA}
                          onChange={(e) => handleChange('isExtraItemsNA', e.target.checked)}
                          disabled={isReadOnly}
                        />
                        Not Applicable
                      </label>
                    </div>
                    {!fields.isExtraItemsNA && (
                      <div className="space-y-1">
                        {(fields.extraItems || []).map((it, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                            <input
                              type="text"
                              className={`${inputCls} text-xs py-0.5`}
                              value={it.cost}
                              onChange={(e) => handleSubScheduleChange('extraItems', idx, e.target.value)}
                              placeholder="Cost"
                              disabled={isReadOnly}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-xs text-slate-800">5.2 Amenities</h5>
                      <label className="text-xs flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fields.isAmenitiesNA}
                          onChange={(e) => handleChange('isAmenitiesNA', e.target.checked)}
                          disabled={isReadOnly}
                        />
                        Not Applicable
                      </label>
                    </div>
                    {!fields.isAmenitiesNA && (
                      <div className="space-y-1">
                        {(fields.amenities || []).map((it, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                            <input
                              type="text"
                              className={`${inputCls} text-xs py-0.5`}
                              value={it.cost}
                              onChange={(e) => handleSubScheduleChange('amenities', idx, e.target.value)}
                              placeholder="Cost"
                              disabled={isReadOnly}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* 12. TOTAL ABSTRACT & OPINION */}
            <Section id="sec-abstract-opinion" title="12. Total Abstract (Section 6.0), Remarks & Opinion">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">6.0. Total Abstract Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <Field label="Market Value Total:">
                      <input
                        type="text"
                        className={`${inputCls} font-bold text-slate-900`}
                        value={fields.abstractMarketSay || fields.abstractMarketTotal || ''}
                        disabled
                      />
                    </Field>
                    <Field label="Realisable Value (95%):">
                      <input
                        type="text"
                        className={`${inputCls} font-semibold`}
                        value={fields.abstractRealSay || fields.abstractRealTotal || ''}
                        disabled
                      />
                    </Field>
                    <Field label="Distress Value (85%):">
                      <input
                        type="text"
                        className={`${inputCls} font-semibold`}
                        value={fields.abstractDistressSay || fields.abstractDistressTotal || ''}
                        disabled
                      />
                    </Field>
                    <Field label="Govt. Benchmark Value:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.abstractGovtSay || fields.abstractGovtTotal || ''}
                        disabled
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Remarks Box:">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={fields.valuationRemarksBox || ''}
                    onChange={(e) => handleChange('valuationRemarksBox', e.target.value)}
                    placeholder="e.g. SUBJECT PROPERTY IS A G+3 STORIED BUILDING..."
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Fair Market Value (in words):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.fairMarketValueWords || ''}
                      onChange={(e) => handleChange('fairMarketValueWords', e.target.value)}
                      placeholder="Rupees..."
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Realisable Value (in words):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.realisableValueWords || ''}
                      onChange={(e) => handleChange('realisableValueWords', e.target.value)}
                      placeholder="Rupees..."
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 13. DECLARATION, CHECKLIST & ENCLOSURES */}
            <Section id="sec-declaration-enclosures" title="13. Declaration, 10-Pt Checklist & Enclosures">
              <div className="space-y-6">
                {/* 10-Point Checklist */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <h4 className="font-semibold text-slate-800 text-sm">Valuation Report Check-List (10 Points)</h4>
                  <div className="space-y-2">
                    {(fields.checklist || []).map((ci, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded">
                        <span className="text-xs text-slate-700 pr-4">{ci.pointNo}. {ci.question}</span>
                        <select
                          className="text-xs border border-slate-300 rounded px-2 py-1 font-semibold"
                          value={ci.answer}
                          onChange={(e) => handleChecklistChange(idx, e.target.value as any)}
                          disabled={isReadOnly}
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="NA">NA</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Valuer Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <Field label="Empanelled Valuer Name:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.empanelledValuerName || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)'}
                      onChange={(e) => handleChange('empanelledValuerName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Site Engineer Name:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.siteEngineerName || 'MR. SIBA BEHERA'}
                      onChange={(e) => handleChange('siteEngineerName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                {/* Enclosures (Maps & Legal Docs - Local Upload Only) */}
                <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    Supporting Documents & Maps (Local Device Upload)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Enclosure 1: ROR Document</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalImageUpload('rorImageUrl', e)}
                        disabled={isReadOnly}
                      />
                      {fields.rorImageUrl && <p className="text-emerald-600 text-xs mt-1">✓ ROR uploaded</p>}
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Enclosure 2: GPS Location Map</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalImageUpload('locationMapImageUrl', e)}
                        disabled={isReadOnly}
                      />
                      {fields.locationMapImageUrl && <p className="text-emerald-600 text-xs mt-1">✓ Location Map uploaded</p>}
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Enclosure 4: Bhu Naksha Map</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalImageUpload('bhuNakshaImageUrl', e)}
                        disabled={isReadOnly}
                      />
                      {fields.bhuNakshaImageUrl && <p className="text-emerald-600 text-xs mt-1">✓ Bhu Naksha uploaded</p>}
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Enclosure 5: Guideline Value Proof</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalImageUpload('guidelineValueImageUrl', e)}
                        disabled={isReadOnly}
                      />
                      {fields.guidelineValueImageUrl && <p className="text-emerald-600 text-xs mt-1">✓ Guideline Value proof uploaded</p>}
                    </div>
                  </div>
                </div>

                {/* Property Site Photographs (Cloud Bucket & Device Upload) */}
                <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        Enclosure 3: Property Site Photographs
                      </h4>
                      <p className="text-xs text-slate-500">
                        Select from Cloud Bucket or upload property photos.
                      </p>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setShowBucketModal(true)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm"
                      >
                        Select from Cloud Bucket
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {(fields.propertyPhotos || []).map((photo, idx) => (
                      <div key={idx} className="relative border border-slate-200 rounded-lg p-1 bg-white">
                        <img src={photo.url} alt={photo.caption} className="w-full h-24 object-cover rounded" />
                        <input
                          type="text"
                          className="mt-1 w-full text-[10px] border border-slate-200 rounded px-1 py-0.5"
                          value={photo.caption || ''}
                          onChange={(e) => {
                            const newPhotos = [...(fields.propertyPhotos || [])];
                            newPhotos[idx].caption = e.target.value;
                            handleChange('propertyPhotos', newPhotos);
                          }}
                          placeholder="Caption"
                          disabled={isReadOnly}
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPhotos = (fields.propertyPhotos || []).filter((_, i) => i !== idx);
                              handleChange('propertyPhotos', newPhotos);
                            }}
                            className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* ACTION BAR AT BOTTOM */}
            <ReportActionBar
              isReadOnly={isReadOnly}
              userRole={userRole}
              autoSaveStatus={autoSaveStatus}
              message={message}
              loading={saving || submitting}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              onPreviewPDF={handlePreviewPDF}
              onDownloadPDF={handleDownloadPDF}
            />

          </div>

          {/* Right Floating Navigator (3 Cols) */}
          <div className="hidden lg:block lg:col-span-3">
            <FloatingNavigator sections={NAV_SECTIONS} />
          </div>
        </div>
      </div>

      {/* Cloud Bucket Selection Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const newPhotos: BandhanSMEPhoto[] = selectedUrls.map((url, i) => ({
              url,
              caption: `Property Photograph ${(fields.propertyPhotos?.length || 0) + i + 1}`,
            }));
            setFields((prev) => ({
              ...prev,
              propertyPhotos: [...(prev.propertyPhotos || []), ...newPhotos],
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
