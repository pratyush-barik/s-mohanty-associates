'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { formatReportDate } from '@/lib/pdf-bank-renderer';

export const IDBI_ABOVE_5CR_CONFIG: BankConfig = {
  bankId: 'IDBI BANK',
  subTemplateId: 'ABOVE 5CR',
  displayName: 'IDBI Bank — ABOVE 5CR',
  defaultValues: {},
  getPDFRenderer: (data, projectCode) => {
    const { PDFSBIFlatAndApartmentRenderer } = require('@/lib/banks/pdf-sbi-flat-and-apartment-renderer');
    return new PDFSBIFlatAndApartmentRenderer({
      bankName: 'IDBI BANK',
      ...data,
    }, projectCode);
  },
};

export interface IDBIAbove5CRProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function IDBIBankAbove5CR({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  config,
  onResetWizard,
}: IDBIAbove5CRProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill & Dual Mode Support ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Mode Toggle: 'FLAT' | 'LAND_AND_BUILDING'
      propertyValuationType: saved.propertyValuationType || 'FLAT',

      // Header Address
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE ASST. GENERAL MANAGER,',
      bankName: saved.bankName !== undefined ? saved.bankName : (pf.bankName || 'IDBI BANK,'),
      rboOffice: saved.rboOffice !== undefined ? saved.rboOffice : '',
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : '',
      districtState: saved.districtState !== undefined ? saved.districtState : '',

      // Metadata
      refNo: saved.refNo || saved.reportRefNo || projectCode || '',
      reportDate: saved.reportDate || pf.reportDate || formatReportDate(new Date().toISOString()),
      borrowerName: saved.borrowerName || pf.customerName || pf.applicantName || '',

      // I. GENERAL
      purposeOfValuation: saved.purposeOfValuation !== undefined ? saved.purposeOfValuation : 'To assess the present Market Value of the Property for Loan purpose',
      inspectionDate: saved.inspectionDate || pf.inspectionDate || '',
      valuationDate: saved.valuationDate || pf.reportDate || formatReportDate(new Date().toISOString()),
      documentsProduced: saved.documentsProduced || ['Sale Deed', '', ''],
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.propertyOwner || pf.applicantName || ''),
      propertyDescription: saved.propertyDescription !== undefined ? saved.propertyDescription : (pf.propertyAddress || ''),

      // Location
      plotNo: saved.plotNo !== undefined ? saved.plotNo : (pf.plotNo || ''),
      doorNo: saved.doorNo !== undefined ? saved.doorNo : '',
      tsNoVillage: saved.tsNoVillage !== undefined ? saved.tsNoVillage : (pf.mouza || ''),
      wardTaluka: saved.wardTaluka !== undefined ? saved.wardTaluka : '',
      mandalDistrict: saved.mandalDistrict !== undefined ? saved.mandalDistrict : (pf.district ? `${pf.district}, Odisha` : 'Khurda, Odisha'),
      postalAddress: saved.postalAddress !== undefined ? saved.postalAddress : (pf.propertyAddress || ''),

      // Classification
      cityTown: saved.cityTown !== undefined ? saved.cityTown : 'City',
      residentialArea: saved.residentialArea !== undefined ? saved.residentialArea : 'Residential Area',
      commercialArea: saved.commercialArea !== undefined ? saved.commercialArea : 'Not Applicable',
      industrialArea: saved.industrialArea !== undefined ? saved.industrialArea : 'Not Applicable',
      classificationHighMiddlePoor: saved.classificationHighMiddlePoor !== undefined ? saved.classificationHighMiddlePoor : 'Middle Class',
      classificationUrbanRural: saved.classificationUrbanRural !== undefined ? saved.classificationUrbanRural : 'Urban Area',
      localBodyLimit: saved.localBodyLimit !== undefined ? saved.localBodyLimit : 'Bhubaneswar Municipal Corporation area limit',
      govtEnactmentsCovered: saved.govtEnactmentsCovered !== undefined ? saved.govtEnactmentsCovered : 'No',
      agriculturalConversion: saved.agriculturalConversion !== undefined ? saved.agriculturalConversion : 'The Plot is already converted to Homestead',

      // Boundaries (Point 13)
      boundaryEastVerification: saved.boundaryEastVerification !== undefined ? saved.boundaryEastVerification : 'Vacant Land',
      boundaryEastDocument: saved.boundaryEastDocument !== undefined ? saved.boundaryEastDocument : (pf.boundaryEast || ''),
      boundaryWestVerification: saved.boundaryWestVerification !== undefined ? saved.boundaryWestVerification : 'Vacant Land',
      boundaryWestDocument: saved.boundaryWestDocument !== undefined ? saved.boundaryWestDocument : (pf.boundaryWest || ''),
      boundaryNorthVerification: saved.boundaryNorthVerification !== undefined ? saved.boundaryNorthVerification : 'Others Building',
      boundaryNorthDocument: saved.boundaryNorthDocument !== undefined ? saved.boundaryNorthDocument : (pf.boundaryNorth || ''),
      boundarySouthVerification: saved.boundarySouthVerification !== undefined ? saved.boundarySouthVerification : 'Road',
      boundarySouthDocument: saved.boundarySouthDocument !== undefined ? saved.boundarySouthDocument : (pf.boundarySouth || ''),

      // Dimensions (Point 14.1 & 14.2)
      dimensionEastDeed: saved.dimensionEastDeed !== undefined ? saved.dimensionEastDeed : 'Not Applicable (Flat)',
      dimensionEastActual: saved.dimensionEastActual !== undefined ? saved.dimensionEastActual : '',
      dimensionWestDeed: saved.dimensionWestDeed !== undefined ? saved.dimensionWestDeed : 'Not Applicable (Flat)',
      dimensionWestActual: saved.dimensionWestActual !== undefined ? saved.dimensionWestActual : '',
      dimensionNorthDeed: saved.dimensionNorthDeed !== undefined ? saved.dimensionNorthDeed : 'Not Applicable (Flat)',
      dimensionNorthActual: saved.dimensionNorthActual !== undefined ? saved.dimensionNorthActual : '',
      dimensionSouthDeed: saved.dimensionSouthDeed !== undefined ? saved.dimensionSouthDeed : 'Not Applicable (Flat)',
      dimensionSouthActual: saved.dimensionSouthActual !== undefined ? saved.dimensionSouthActual : '',

      // Coordinates
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || ''),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || ''),
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : '',

      extentOfProjectSite: saved.extentOfProjectSite !== undefined ? saved.extentOfProjectSite : '',
      extentConsideredValuation: saved.extentConsideredValuation !== undefined ? saved.extentConsideredValuation : 'Not Applicable',
      occupancyStatusOwnerTenant: saved.occupancyStatusOwnerTenant !== undefined ? saved.occupancyStatusOwnerTenant : 'The Flat is occupied by Owner',
      approvedPlanValidity: saved.approvedPlanValidity !== undefined ? saved.approvedPlanValidity : 'Validity: 3 Yrs from the approval',
      approvedPlanAuthority: saved.approvedPlanAuthority !== undefined ? saved.approvedPlanAuthority : 'BDA',
      approvedPlanAuthenticity: saved.approvedPlanAuthenticity !== undefined ? saved.approvedPlanAuthenticity : 'Yes, Verified from the authenticated authority',
      valuerCommentsOnPlan: saved.valuerCommentsOnPlan !== undefined ? saved.valuerCommentsOnPlan : 'Yes, The approval plan is authenticated',

      // ── FLAT SPECIFIC DEFAULTS ──
      natureOfApartment: saved.natureOfApartment !== undefined ? saved.natureOfApartment : 'Residential Apartment',
      aptLocationTsNo: saved.aptLocationTsNo !== undefined ? saved.aptLocationTsNo : '',
      aptLocationBlockNo: saved.aptLocationBlockNo !== undefined ? saved.aptLocationBlockNo : '',
      aptLocationWardNo: saved.aptLocationWardNo !== undefined ? saved.aptLocationWardNo : 'Not Applicable',
      aptLocationVillageCorp: saved.aptLocationVillageCorp !== undefined ? saved.aptLocationVillageCorp : 'Within Municipal Corporation area limit',
      aptLocationDoorRoadPin: saved.aptLocationDoorRoadPin !== undefined ? saved.aptLocationDoorRoadPin : '',
      localityDescription: saved.localityDescription !== undefined ? saved.localityDescription : 'Residential',
      yearOfConstruction: saved.yearOfConstruction !== undefined ? saved.yearOfConstruction : '',
      numberOfFloors: saved.numberOfFloors !== undefined ? saved.numberOfFloors : '',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame Structure',
      dwellingUnitsCount: saved.dwellingUnitsCount !== undefined ? saved.dwellingUnitsCount : 'Not Verified',
      qualityOfConstruction: saved.qualityOfConstruction !== undefined ? saved.qualityOfConstruction : 'Good',
      appearanceOfBuilding: saved.appearanceOfBuilding !== undefined ? saved.appearanceOfBuilding : 'Good',
      maintenanceOfBuilding: saved.maintenanceOfBuilding !== undefined ? saved.maintenanceOfBuilding : 'Good',
      facilityLift: saved.facilityLift !== undefined ? saved.facilityLift : 'Yes',
      facilityWaterSupply: saved.facilityWaterSupply !== undefined ? saved.facilityWaterSupply : 'Yes',
      facilitySewerage: saved.facilitySewerage !== undefined ? saved.facilitySewerage : 'Yes',
      facilityCarParking: saved.facilityCarParking !== undefined ? saved.facilityCarParking : 'Covered parking',
      facilityCompoundWall: saved.facilityCompoundWall !== undefined ? saved.facilityCompoundWall : 'Yes',
      facilityPavement: saved.facilityPavement !== undefined ? saved.facilityPavement : 'Yes',

      flatFloorNumber: saved.flatFloorNumber !== undefined ? saved.flatFloorNumber : '',
      flatDoorNumber: saved.flatDoorNumber !== undefined ? saved.flatDoorNumber : '',
      specRoof: saved.specRoof !== undefined ? saved.specRoof : 'RCC Roof',
      specFlooring: saved.specFlooring !== undefined ? saved.specFlooring : 'VT Flooring',
      specDoors: saved.specDoors !== undefined ? saved.specDoors : 'Hard Ply wood doors',
      specWindows: saved.specWindows !== undefined ? saved.specWindows : 'Aluminum frame with glass fitting windows',
      specFittings: saved.specFittings !== undefined ? saved.specFittings : 'Superior',
      specFinishing: saved.specFinishing !== undefined ? saved.specFinishing : 'Cement Plastering, Putty, Modular Kitchen, Roof Ceiling with Decorative Light, Cupboard, Wardrobes',

      assessmentNumber: saved.assessmentNumber !== undefined ? saved.assessmentNumber : 'Not Verified',
      taxPaidName: saved.taxPaidName !== undefined ? saved.taxPaidName : 'Not Verified',
      taxAmount: saved.taxAmount !== undefined ? saved.taxAmount : 'Not Verified',
      electricityConnectionNo: saved.electricityConnectionNo !== undefined ? saved.electricityConnectionNo : 'Not Verified',
      meterCardName: saved.meterCardName !== undefined ? saved.meterCardName : 'Not Verified',
      flatMaintenanceCondition: saved.flatMaintenanceCondition !== undefined ? saved.flatMaintenanceCondition : 'Good',
      saleDeedExecutedName: saved.saleDeedExecutedName !== undefined ? saved.saleDeedExecutedName : (pf.propertyOwner || pf.applicantName || ''),
      undividedLandArea: saved.undividedLandArea !== undefined ? saved.undividedLandArea : '',
      superBuiltUpArea: saved.superBuiltUpArea !== undefined ? saved.superBuiltUpArea : '',
      floorSpaceIndex: saved.floorSpaceIndex !== undefined ? saved.floorSpaceIndex : 'As per approval plan',
      carpetArea: saved.carpetArea !== undefined ? saved.carpetArea : '',
      poshClassMediumOrdinary: saved.poshClassMediumOrdinary !== undefined ? saved.poshClassMediumOrdinary : 'I Class',
      usageResidentialCommercial: saved.usageResidentialCommercial !== undefined ? saved.usageResidentialCommercial : 'Residential Purpose',
      flatOccupancyOwnerTenant: saved.flatOccupancyOwnerTenant !== undefined ? saved.flatOccupancyOwnerTenant : 'The Flat is occupied by Owner',
      monthlyRentIfRented: saved.monthlyRentIfRented !== undefined ? saved.monthlyRentIfRented : 'Not Applicable',

      marketabilityRating: saved.marketabilityRating !== undefined ? saved.marketabilityRating : 'Good',
      factorsFavoringPotentialValue: saved.factorsFavoringPotentialValue !== undefined ? saved.factorsFavoringPotentialValue : 'The subject property located in a developed Residential area. All civic amenities are located within 2-3 Km radius.',
      negativeFactorsObserved: saved.negativeFactorsObserved !== undefined ? saved.negativeFactorsObserved : 'Nothing Observed',

      comparableSaleInstancesRate: saved.comparableSaleInstancesRate !== undefined ? saved.comparableSaleInstancesRate : '',
      adoptedBasicCompositeRate: saved.adoptedBasicCompositeRate !== undefined ? saved.adoptedBasicCompositeRate : '',
      rateBreakupBuildingServices: saved.rateBreakupBuildingServices !== undefined ? saved.rateBreakupBuildingServices : '',
      rateBreakupLandOthers: saved.rateBreakupLandOthers !== undefined ? saved.rateBreakupLandOthers : '',
      guidelineRateLandText: saved.guidelineRateLandText !== undefined ? saved.guidelineRateLandText : '',

      depreciatedBuildingRateAnnualFormula: saved.depreciatedBuildingRateAnnualFormula !== undefined ? saved.depreciatedBuildingRateAnnualFormula : '',
      replacementCostOfFlat: saved.replacementCostOfFlat !== undefined ? saved.replacementCostOfFlat : '',
      buildingAge: saved.buildingAge !== undefined ? saved.buildingAge : '',
      buildingLife: saved.buildingLife !== undefined ? saved.buildingLife : '',
      depreciationSalvagePercentage: saved.depreciationSalvagePercentage !== undefined ? saved.depreciationSalvagePercentage : 'Considering straight-line method of depreciation.',
      depreciationRatio: saved.depreciationRatio !== undefined ? saved.depreciationRatio : '',

      finalDepreciatedBuildingRate: saved.finalDepreciatedBuildingRate !== undefined ? saved.finalDepreciatedBuildingRate : '0',
      finalRateLandOther: saved.finalRateLandOther !== undefined ? saved.finalRateLandOther : '0',
      finalTotalCompositeRate: saved.finalTotalCompositeRate !== undefined ? saved.finalTotalCompositeRate : '0',

      // Flat 10-item breakdown
      valFlatPresentValue: saved.valFlatPresentValue !== undefined ? saved.valFlatPresentValue : '0',
      valCarParking: saved.valCarParking !== undefined ? saved.valCarParking : '0',
      valWardrobes: saved.valWardrobes !== undefined ? saved.valWardrobes : '0',
      valModularKitchen: saved.valModularKitchen !== undefined ? saved.valModularKitchen : '0',
      valCupboard: saved.valCupboard !== undefined ? saved.valCupboard : '0',
      valInteriorDecorations: saved.valInteriorDecorations !== undefined ? saved.valInteriorDecorations : '0',
      valElectricityDeposits: saved.valElectricityDeposits !== undefined ? saved.valElectricityDeposits : '0',
      valExtraGrillCollapsible: saved.valExtraGrillCollapsible !== undefined ? saved.valExtraGrillCollapsible : '0',
      valPotentialValue: saved.valPotentialValue !== undefined ? saved.valPotentialValue : '0',
      valOthers: saved.valOthers !== undefined ? saved.valOthers : '0',
      valTotalEstimated: saved.valTotalEstimated !== undefined ? saved.valTotalEstimated : '0',

      // ── LAND & BUILDING SPECIFIC DEFAULTS ──
      siteClassificationLocality: saved.siteClassificationLocality || 'Developed',
      siteDevelopmentSurrounding: saved.siteDevelopmentSurrounding || 'The surrounding area has been developed with Residential cum Commercial buildings.',
      siteFloodingPossibility: saved.siteFloodingPossibility || 'No',
      siteCivicAmenities: saved.siteCivicAmenities || 'All civic amenities are within 2-3 km radius from the site.',
      siteTopographicalLevel: saved.siteTopographicalLevel || 'Leveled and Plain',
      siteShapeOfLand: saved.siteShapeOfLand || 'Regular in Size.',
      siteTypePutUse: saved.siteTypePutUse || 'Residential Purpose',
      siteUsageRestriction: saved.siteUsageRestriction || 'None',
      siteTownPlanningApproved: saved.siteTownPlanningApproved || 'No',
      siteCornerOrIntermittent: saved.siteCornerOrIntermittent || 'Intermittent Plot',
      siteRoadFacilities: saved.siteRoadFacilities || 'Yes, Available at the site',
      siteRoadTypeAvailable: saved.siteRoadTypeAvailable || 'CC Road',
      siteRoadWidth: saved.siteRoadWidth || '15 ft Wide Road',
      siteLandLocked: saved.siteLandLocked || 'No, It is free land',
      siteWaterPotentiality: saved.siteWaterPotentiality || 'Good',
      siteUndergroundSewerage: saved.siteUndergroundSewerage || 'Yes, Available at the site',
      sitePowerSupply: saved.sitePowerSupply || 'Yes, Available at the site',
      siteAdvantage: saved.siteAdvantage || 'The subject property is situated within a developed Residential cum Commercial Area.',
      siteSpecialRemarksCRZ: saved.siteSpecialRemarksCRZ || 'On enquiry at site, we have not observed or inspected any public acquisition or road widening.',

      landSizeNorthSouth: saved.landSizeNorthSouth || '',
      landSizeEastWest: saved.landSizeEastWest || '',
      landTotalExtent: saved.landTotalExtent || ((pf.plotArea) ? `${pf.plotArea} Sft` : ''),
      landPrevailingMarketRate: saved.landPrevailingMarketRate || '',
      landGuidelineRate: saved.landGuidelineRate || '',
      landAdoptedRate: saved.landAdoptedRate || '',
      landEstimatedMarketValue: saved.landEstimatedMarketValue || '',

      bldgType: saved.bldgType || 'Residential Building',
      bldgTypeConstruction: saved.bldgTypeConstruction || 'RCC Frame',
      bldgYearConstruction: saved.bldgYearConstruction || '',
      bldgNumberFloorsHeight: saved.bldgNumberFloorsHeight || "Height: 10'-0\"",
      bldgPlinthActualText: saved.bldgPlinthActualText || '',
      bldgConditionExterior: saved.bldgConditionExterior || 'Good',
      bldgConditionInterior: saved.bldgConditionInterior || 'Good',
      bldgApprovedPlanDateValidity: saved.bldgApprovedPlanDateValidity || '',
      bldgApprovedPlanAuthority: saved.bldgApprovedPlanAuthority || '',
      bldgApprovedPlanGenuineness: saved.bldgApprovedPlanGenuineness || 'Verified as per submitted document',
      bldgValuerCommentsPlan: saved.bldgValuerCommentsPlan || 'Not Applicable',
      bldgAge: saved.bldgAge || '',
      bldgResidualLife: saved.bldgResidualLife || '',

      // Land & Bldg Abstract Matrix
      abstractGovtLand: saved.abstractGovtLand || '0',
      abstractMarketLand: saved.abstractMarketLand || '0',
      abstractRealizableLand: saved.abstractRealizableLand || '0',
      abstractDistressLand: saved.abstractDistressLand || '0',
      abstractGovtBldg: saved.abstractGovtBldg || '0',
      abstractMarketBldg: saved.abstractMarketBldg || '0',
      abstractRealizableBldg: saved.abstractRealizableBldg || '0',
      abstractDistressBldg: saved.abstractDistressBldg || '0',
      abstractGovtTotal: saved.abstractGovtTotal || '0',
      abstractMarketTotal: saved.abstractMarketTotal || '0',
      abstractRealizableTotal: saved.abstractRealizableTotal || '0',
      abstractDistressTotal: saved.abstractDistressTotal || '0',

      // Shared Total Abstract
      abstractGovtValueLand: saved.abstractGovtValueLand !== undefined ? saved.abstractGovtValueLand : '0',
      abstractMarketValue: saved.abstractMarketValue !== undefined ? saved.abstractMarketValue : '0',
      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractRealizableValue: saved.abstractRealizableValue !== undefined ? saved.abstractRealizableValue : '0',
      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',
      abstractDistressValue: saved.abstractDistressValue !== undefined ? saved.abstractDistressValue : '0',
      abstractOrSayGovtLand: saved.abstractOrSayGovtLand !== undefined ? saved.abstractOrSayGovtLand : '0',
      abstractOrSayMarket: saved.abstractOrSayMarket !== undefined ? saved.abstractOrSayMarket : '0',
      abstractOrSayRealizable: saved.abstractOrSayRealizable !== undefined ? saved.abstractOrSayRealizable : '0',
      abstractOrSayDistress: saved.abstractOrSayDistress !== undefined ? saved.abstractOrSayDistress : '0',

      // Method of Valuation (Dual container)
      methodOfValuationProcedure: saved.methodOfValuationProcedure || 'Here, the procedure adopted for arriving at the valuation has to be highlighted. The valuer may consider various approaches of property valuation and state explicitly the reasons for adoption of a particular approach and the basis on which the final valuation judgment is arrived at. A detailed analysis and descriptive account of the approaches, assumptions made, basis adopted, supporting data (in terms of comparable sales), reconciliation of various factors, departures, final valuation arrived at has to be presented here',
      methodOfValuationText: saved.methodOfValuationText || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & Building method of valuation has been adopted for finding the fair market value of the Property',

      // Remarks & Opinions
      remarksText: saved.remarksText !== undefined ? saved.remarksText : '',
      opinionMarketValueWords: saved.opinionMarketValueWords !== undefined ? saved.opinionMarketValueWords : '',
      opinionRealizableValueWords: saved.opinionRealizableValueWords !== undefined ? saved.opinionRealizableValueWords : '',
      opinionGovtLandValueWords: saved.opinionGovtLandValueWords !== undefined ? saved.opinionGovtLandValueWords : '',
      opinionDistressValueWords: saved.opinionDistressValueWords !== undefined ? saved.opinionDistressValueWords : '',

      valuerName: saved.valuerName !== undefined ? saved.valuerName : 'Mr. Satyajit Mohanty',
      valuerFatherName: saved.valuerFatherName !== undefined ? saved.valuerFatherName : 'Mr. Nityananda Mohanty',
      valuerPan: saved.valuerPan !== undefined ? saved.valuerPan : 'AONPM6997B',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || '06.08.2026'),

      // Enclosures
      documentImages: saved.documentImages || [],
      documentImageNames: saved.documentImageNames || [],
      locationMapImages: saved.locationMapImages || [],
      mouzaMapImages: saved.mouzaMapImages || [],
      sketchMapImages: saved.sketchMapImages || [],
      cadastralMapImages: saved.cadastralMapImages || [],
      bdaMapImages: saved.bdaMapImages || [],
      propertyImages: saved.propertyImages || [],
      propertyImageNames: saved.propertyImageNames || [],
    };
  }, [rawInitialFields, initialData, projectCode, projectId, prefill]);

  const [fields, setFields] = useState<any>(initialFields);

  const handleChange = (key: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [key]: value }));
  };

  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  const parsePct = (val: any, fallback = 100): number => {
    if (val === undefined || val === null || String(val).trim() === '') return fallback;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? fallback : Math.min(100, Math.max(0, n));
  };

  // ── Auto-Calculate Rates & Valuation Totals ──
  useEffect(() => {
    if (fields.propertyValuationType === 'LAND_AND_BUILDING') {
      const landMkt = parseNum(fields.abstractMarketLand);
      const bldgMkt = parseNum(fields.abstractMarketBldg);
      const totalMkt = landMkt + bldgMkt;

      const rPct = parsePct(fields.abstractRealizablePct, 100);
      const dPct = parsePct(fields.abstractDistressPct, 100);

      const realTotal = Math.round((totalMkt * rPct) / 100);
      const distTotal = Math.round((totalMkt * dPct) / 100);

      setFields((prev: any) => ({
        ...prev,
        abstractMarketTotal: totalMkt > 0 ? `Rs. ${formatIndianCurrency(totalMkt)}` : prev.abstractMarketTotal,
        abstractRealizableTotal: realTotal > 0 ? `Rs. ${formatIndianCurrency(realTotal)}` : prev.abstractRealizableTotal,
        abstractDistressTotal: distTotal > 0 ? `Rs. ${formatIndianCurrency(distTotal)}` : prev.abstractDistressTotal,
        opinionMarketValueWords: totalMkt > 0 ? rupeesInWords(totalMkt) : prev.opinionMarketValueWords,
        opinionRealizableValueWords: realTotal > 0 ? rupeesInWords(realTotal) : prev.opinionRealizableValueWords,
        opinionDistressValueWords: distTotal > 0 ? rupeesInWords(distTotal) : prev.opinionDistressValueWords,
      }));
    } else {
      const sba = parseNum(fields.superBuiltUpArea);
      const bldgRate = parseNum(fields.finalDepreciatedBuildingRate);
      const landRate = parseNum(fields.finalRateLandOther);
      const compRate = Math.round((bldgRate + landRate) * 100) / 100;

      const flatVal = Math.round(sba * compRate);
      const carPark = parseNum(fields.valCarParking);
      const totalEst = flatVal + carPark;

      const rPct = parsePct(fields.abstractRealizablePct, 100);
      const dPct = parsePct(fields.abstractDistressPct, 100);

      const realVal = Math.round((totalEst * rPct) / 100);
      const distVal = Math.round((totalEst * dPct) / 100);

      setFields((prev: any) => ({
        ...prev,
        finalTotalCompositeRate: compRate > 0 ? String(compRate) : prev.finalTotalCompositeRate,
        valFlatPresentValue: flatVal > 0 ? String(flatVal) : prev.valFlatPresentValue,
        valTotalEstimated: totalEst > 0 ? String(totalEst) : prev.valTotalEstimated,
        abstractMarketValue: totalEst > 0 ? String(totalEst) : prev.abstractMarketValue,
        abstractRealizableValue: realVal > 0 ? String(realVal) : prev.abstractRealizableValue,
        abstractDistressValue: distVal > 0 ? String(distVal) : prev.abstractDistressValue,
        abstractOrSayMarket: totalEst > 0 ? String(totalEst) : prev.abstractOrSayMarket,
        abstractOrSayRealizable: realVal > 0 ? String(realVal) : prev.abstractOrSayRealizable,
        abstractOrSayDistress: distVal > 0 ? String(distVal) : prev.abstractOrSayDistress,
        opinionMarketValueWords: prev.opinionMarketValueWords || (totalEst > 0 ? rupeesInWords(totalEst) : ''),
        opinionRealizableValueWords: prev.opinionRealizableValueWords || (realVal > 0 ? rupeesInWords(realVal) : ''),
        opinionDistressValueWords: prev.opinionDistressValueWords || (distVal > 0 ? rupeesInWords(distVal) : ''),
      }));
    }
  }, [
    fields.propertyValuationType,
    fields.superBuiltUpArea,
    fields.finalDepreciatedBuildingRate,
    fields.finalRateLandOther,
    fields.abstractMarketLand,
    fields.abstractMarketBldg,
    fields.abstractRealizablePct,
    fields.abstractDistressPct,
  ]);

  const handleSaveInternal = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        reportData: fields,
        bankTemplate: 'IDBI BANK',
        subTemplate: 'ABOVE 5CR',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save IDBI report draft', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdfInternal = async () => {
    try {
      const { PDFSBIFlatAndApartmentRenderer } = require('@/lib/banks/pdf-sbi-flat-and-apartment-renderer');
      const renderer = new PDFSBIFlatAndApartmentRenderer({
        bankName: 'IDBI BANK',
        ...fields,
      }, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IDBI_Above_5CR_${fields.propertyValuationType}_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating IDBI PDF:', e);
    }
  };

  const isFlat = fields.propertyValuationType !== 'LAND_AND_BUILDING';

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Card with Dynamic Mode Toggle ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              IDBI BANK — ABOVE 5CR
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {isFlat ? '🏢 Flat / Apartment Format' : '🏡 Land & Building Format'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Valuation Report Questionnaire</h2>
          <p className="text-xs text-slate-500">
            Standard Statutory Bank Format addressing Asst. General Manager with full schedules.
          </p>
        </div>

        {/* Property Type Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleChange('propertyValuationType', 'FLAT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isFlat
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Flat / Apartment
            </button>
            <button
              type="button"
              onClick={() => handleChange('propertyValuationType', 'LAND_AND_BUILDING')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !isFlat
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏡 Land & Building
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveInternal}
            disabled={saving || isReadOnly}
            className="btn btn-secondary text-xs px-4 py-2"
          >
            {saving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdfInternal}
            className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: Bank Authority & Customer Information ── */}
      <Section title="Bank Header, Reference & Ownership Details" number={1} defaultOpen={true}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Addressed To (Authority)">
            <input
              className={inputCls}
              value={fields.toAuthority}
              onChange={(e) => handleChange('toAuthority', e.target.value)}
              disabled={isReadOnly}
              placeholder="THE ASST. GENERAL MANAGER,"
            />
          </Field>
          <Field label="Bank Name">
            <input
              className={inputCls}
              value={fields.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              disabled={isReadOnly}
              placeholder="IDBI BANK,"
            />
          </Field>
          <Field label="RBO / Branch Office">
            <input
              className={inputCls}
              value={fields.rboOffice}
              onChange={(e) => handleChange('rboOffice', e.target.value)}
              disabled={isReadOnly}
              placeholder="JHARSUGUDA BRANCH, DIST: JHARSUGUDA, ODISHA"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <Field label="Reference Number">
            <input
              className={inputCls}
              value={fields.refNo}
              onChange={(e) => handleChange('refNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Valuation Report Date">
            <input
              type="date"
              className={inputCls}
              value={fields.reportDate}
              onChange={(e) => handleChange('reportDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Borrower / Owner Name">
            <input
              className={inputCls}
              value={fields.borrowerName}
              onChange={(e) => handleChange('borrowerName', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Field label="Owner Details & Address (Point 4)">
            <textarea
              className={inputCls + ' min-h-[70px]'}
              value={fields.ownerNameAndAddress}
              onChange={(e) => handleChange('ownerNameAndAddress', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Brief Description of Property (Point 5)">
            <textarea
              className={inputCls + ' min-h-[70px]'}
              value={fields.propertyDescription}
              onChange={(e) => handleChange('propertyDescription', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: General & Location Details (Points 6-21) ── */}
      <Section title="General, Location & Boundaries" number={2} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Plot / Survey No.">
            <input
              className={inputCls}
              value={fields.plotNo}
              onChange={(e) => handleChange('plotNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Door No.">
            <input
              className={inputCls}
              value={fields.doorNo}
              onChange={(e) => handleChange('doorNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Mouza / Village / T.S. No">
            <input
              className={inputCls}
              value={fields.tsNoVillage}
              onChange={(e) => handleChange('tsNoVillage', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="District">
            <input
              className={inputCls}
              value={fields.mandalDistrict}
              onChange={(e) => handleChange('mandalDistrict', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        {/* Boundaries Dual Columns */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">3 / 13. Boundaries of the Property</h4>
        <div className="space-y-2 mt-2">
          {['East', 'West', 'North', 'South'].map((dir) => {
            const vKey = `boundary${dir}Verification`;
            const dKey = `boundary${dir}Document`;
            return (
              <div key={dir} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-medium text-slate-700">{dir}</span>
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[dKey] || ''}
                  onChange={(e) => handleChange(dKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="As per Document"
                />
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[vKey] || ''}
                  onChange={(e) => handleChange(vKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="As per Verification"
                />
              </div>
            );
          })}
        </div>

        {/* Dimensions Dual Columns */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">14.1 Dimensions of the Site</h4>
        <div className="space-y-2 mt-2">
          {['East', 'West', 'North', 'South'].map((dir) => {
            const deedKey = `dimension${dir}Deed`;
            const actKey = `dimension${dir}Actual`;
            return (
              <div key={dir} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-medium text-slate-700">{dir}</span>
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[deedKey] || ''}
                  onChange={(e) => handleChange(deedKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="A - As per Deed"
                />
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[actKey] || ''}
                  onChange={(e) => handleChange(actKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="B - Actual"
                />
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <Field label="14.2 Coordinates Text">
            <input
              className={inputCls}
              value={fields.coordinatesText}
              onChange={(e) => handleChange('coordinatesText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Latitude: 20.251088, Longitude: 85.787390"
            />
          </Field>
          <Field label="15. Extent of Site / Project">
            <input
              className={inputCls}
              value={fields.extentOfProjectSite}
              onChange={(e) => handleChange('extentOfProjectSite', e.target.value)}
              disabled={isReadOnly}
              placeholder="Total Area: Ac.0.115 Dec i.e. 5009.00 Sft"
            />
          </Field>
          <Field label="16. Extent Considered for Valuation (least of 14 A & 14 B)">
            <input
              className={inputCls}
              value={fields.extentConsideredValuation}
              onChange={(e) => handleChange('extentConsideredValuation', e.target.value)}
              disabled={isReadOnly}
              placeholder="Not Applicable / Extent Sft"
            />
          </Field>
        </div>
      </Section>

      {/* ── Mode A: Flat / Apartment Specific Sections ── */}
      {isFlat ? (
        <>
          <Section title="II. Apartment Building & Facilities" number={3} defaultOpen={false}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Nature of Apartment">
                <input
                  className={inputCls}
                  value={fields.natureOfApartment}
                  onChange={(e) => handleChange('natureOfApartment', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Year of Construction">
                <input
                  className={inputCls}
                  value={fields.yearOfConstruction}
                  onChange={(e) => handleChange('yearOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Number of Floors">
                <input
                  className={inputCls}
                  value={fields.numberOfFloors}
                  onChange={(e) => handleChange('numberOfFloors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Type of Structure">
                <input
                  className={inputCls}
                  value={fields.typeOfStructure}
                  onChange={(e) => handleChange('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          <Section title="III. Flat Specifications & Area" number={4} defaultOpen={true}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Floor Number">
                <input
                  className={inputCls}
                  value={fields.flatFloorNumber}
                  onChange={(e) => handleChange('flatFloorNumber', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Door / Flat No.">
                <input
                  className={inputCls}
                  value={fields.flatDoorNumber}
                  onChange={(e) => handleChange('flatDoorNumber', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Super Built-up Area (Sft)">
                <input
                  className={inputCls + ' font-bold text-blue-700'}
                  value={fields.superBuiltUpArea}
                  onChange={(e) => handleChange('superBuiltUpArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="1375.00"
                />
              </Field>
              <Field label="Carpet Area">
                <input
                  className={inputCls}
                  value={fields.carpetArea}
                  onChange={(e) => handleChange('carpetArea', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          <Section title="VI. Rate, Composite Depreciation & Flat Valuation" number={5} defaultOpen={true}>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Rate: Building + Services (Rs./Sft)">
                <input
                  className={inputCls}
                  value={fields.finalDepreciatedBuildingRate}
                  onChange={(e) => handleChange('finalDepreciatedBuildingRate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="2125"
                />
              </Field>
              <Field label="Rate: Land & Others (Rs./Sft)">
                <input
                  className={inputCls}
                  value={fields.finalRateLandOther}
                  onChange={(e) => handleChange('finalRateLandOther', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="7500"
                />
              </Field>
              <Field label="Total Composite Rate (Rs./Sft)">
                <input
                  className={inputCls + ' font-bold text-emerald-700'}
                  value={fields.finalTotalCompositeRate}
                  onChange={(e) => handleChange('finalTotalCompositeRate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="9625"
                />
              </Field>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">Details of Valuation (10 Items)</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="1. Flat Present Value">
                <input
                  className={inputCls + ' font-bold'}
                  value={fields.valFlatPresentValue}
                  onChange={(e) => handleChange('valFlatPresentValue', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="2. Car Parking Space in LS">
                <input
                  className={inputCls}
                  value={fields.valCarParking}
                  onChange={(e) => handleChange('valCarParking', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Estimated Flat Value">
                <input
                  className={inputCls + ' font-bold bg-slate-50 text-blue-700'}
                  value={fields.valTotalEstimated}
                  onChange={(e) => handleChange('valTotalEstimated', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </>
      ) : (
        /* ── Mode B: Land & Building Specific Sections ── */
        <>
          <Section title="II. Characteristics of the Site (19 Parameters)" number={3} defaultOpen={false}>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Classification of Locality">
                <input
                  className={inputCls}
                  value={fields.siteClassificationLocality}
                  onChange={(e) => handleChange('siteClassificationLocality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Road Facilities Available">
                <input
                  className={inputCls}
                  value={fields.siteRoadFacilities}
                  onChange={(e) => handleChange('siteRoadFacilities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Width of Road">
                <input
                  className={inputCls}
                  value={fields.siteRoadWidth}
                  onChange={(e) => handleChange('siteRoadWidth', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          <Section title="Part A & B: Land and Building Valuation" number={4} defaultOpen={true}>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Land Market Value (Rs.)">
                <input
                  className={inputCls + ' font-bold text-slate-900'}
                  value={fields.abstractMarketLand}
                  onChange={(e) => handleChange('abstractMarketLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 1,75,31,500.00"
                />
              </Field>
              <Field label="Building Net Value (Rs.)">
                <input
                  className={inputCls + ' font-bold text-slate-900'}
                  value={fields.abstractMarketBldg}
                  onChange={(e) => handleChange('abstractMarketBldg', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 1,27,02,792.00"
                />
              </Field>
              <Field label="Total Market Value (Rs.)">
                <input
                  className={inputCls + ' font-bold text-emerald-700 bg-emerald-50'}
                  value={fields.abstractMarketTotal}
                  onChange={(e) => handleChange('abstractMarketTotal', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 3,02,34,292.00"
                />
              </Field>
            </div>
          </Section>
        </>
      )}

      {/* ── Section: Method of Valuation Box ── */}
      <Section title="Method of Valuation Procedure" number={6} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Procedure Adopted Guidance (Left Box)">
            <textarea
              className={inputCls + ' min-h-[90px] text-xs bg-slate-50'}
              value={fields.methodOfValuationProcedure}
              onChange={(e) => handleChange('methodOfValuationProcedure', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Adopted Valuation Methodology (Right Box)">
            <textarea
              className={inputCls + ' min-h-[90px] text-xs'}
              value={fields.methodOfValuationText}
              onChange={(e) => handleChange('methodOfValuationText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Total Abstract Matrix ── */}
      <Section title="Total Abstract for the Entire Property" number={7} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <Field label="Govt. Value of Land (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtValueLand}
              onChange={(e) => handleChange('abstractGovtValueLand', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Market Value (Rs.)">
            <input
              className={inputCls + ' font-bold text-slate-900'}
              value={fields.abstractMarketValue}
              onChange={(e) => handleChange('abstractMarketValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Realizable Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractRealizablePct}
                onChange={(e) => handleChange('abstractRealizablePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Default)"
              />
              <input
                className={inputCls}
                value={fields.abstractRealizableValue}
                onChange={(e) => handleChange('abstractRealizableValue', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </Field>
          <Field label="Distress Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractDistressPct}
                onChange={(e) => handleChange('abstractDistressPct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Default)"
              />
              <input
                className={inputCls}
                value={fields.abstractDistressValue}
                onChange={(e) => handleChange('abstractDistressValue', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Remarks & Observations">
            <textarea
              className={inputCls + ' min-h-[80px]'}
              value={fields.remarksText}
              onChange={(e) => handleChange('remarksText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Base Documents ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={8}
        sectionId="section-documents"
      />

      {/* ── Section: Base Maps ── */}
      <BaseMapsSection
        title="Maps"
        locationMapImages={fields.locationMapImages || []}
        mouzaMapImages={fields.mouzaMapImages || []}
        sketchMapImages={fields.sketchMapImages || []}
        cadastralMapImages={fields.cadastralMapImages || []}
        bdaMapImages={fields.bdaMapImages || []}
        latitude={fields.latitude}
        longitude={fields.longitude}
        technicalAddress={fields.postalAddress || ''}
        propertyAddress={fields.propertyDescription || ''}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={9}
        sectionId="section-maps"
      />

      {/* ── Section: Photographs ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={10}
        sectionId="section-photographs"
      />
    </div>
  );
}
