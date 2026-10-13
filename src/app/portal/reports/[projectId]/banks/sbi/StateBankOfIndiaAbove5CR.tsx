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

export const SBI_CONFIG: BankConfig = {
  bankId: 'STATE BANK OF INDIA-SBI',
  subTemplateId: 'ABOVE 5CR',
  displayName: 'State Bank of India (SBI) — ABOVE 5CR',
  defaultValues: {},
  getPDFRenderer: (data, projectCode) => {
    const { PDFSBIRenderer } = require('@/lib/banks/pdf-sbi-above-5cr-renderer');
    return new PDFSBIRenderer(data, projectCode);
  },
};

export interface SBIProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function StateBankOfIndia({
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
}: SBIProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Header Address
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE ASST. GENERAL MANAGER,',
      bankName: saved.bankName !== undefined ? saved.bankName : 'STATE BANK OF INDIA,',
      rboOffice: saved.rboOffice !== undefined ? saved.rboOffice : 'RBO, PURI, DIST: PURI, ODISHA',
      refNo: saved.refNo !== undefined ? saved.refNo : (projectCode || projectId || ''),
      reportDate: saved.reportDate !== undefined ? saved.reportDate : (pf.reportDate || ''),

      // I. GENERAL
      purposeOfValuation: saved.purposeOfValuation !== undefined ? saved.purposeOfValuation : (pf.purpose || 'To assess the present Market Value of the Property for Loan purpose'),
      inspectionDate: saved.inspectionDate !== undefined ? saved.inspectionDate : (pf.fieldVisitDate || pf.dateOfInspection || ''),
      valuationDate: saved.valuationDate !== undefined ? saved.valuationDate : (pf.reportDate || ''),
      doc1: saved.doc1 !== undefined ? saved.doc1 : 'Sale Deed',
      doc2: saved.doc2 !== undefined ? saved.doc2 : '',
      doc3: saved.doc3 !== undefined ? saved.doc3 : '',
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.contactName ? `${pf.contactName}, At: ${pf.propertyAddress || ''}` : ''),
      propertyDescription: saved.propertyDescription !== undefined ? saved.propertyDescription : (pf.propertyAddress || ''),

      // Location of property
      plotNo: saved.plotNo !== undefined ? saved.plotNo : '',
      doorNo: saved.doorNo !== undefined ? saved.doorNo : '',
      tsNoVillage: saved.tsNoVillage !== undefined ? saved.tsNoVillage : (pf.serviceRequest?.city || ''),
      wardTaluka: saved.wardTaluka !== undefined ? saved.wardTaluka : (pf.serviceRequest?.city || ''),
      mandalDistrict: saved.mandalDistrict !== undefined ? saved.mandalDistrict : 'Khurda, Odisha',
      postalAddress: saved.postalAddress !== undefined ? saved.postalAddress : (pf.propertyAddress || ''),

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
      boundaryEastVerification: saved.boundaryEastVerification !== undefined ? saved.boundaryEastVerification : '',
      boundaryEastDocument: saved.boundaryEastDocument !== undefined ? saved.boundaryEastDocument : '',
      boundaryWestVerification: saved.boundaryWestVerification !== undefined ? saved.boundaryWestVerification : '',
      boundaryWestDocument: saved.boundaryWestDocument !== undefined ? saved.boundaryWestDocument : '',
      boundaryNorthVerification: saved.boundaryNorthVerification !== undefined ? saved.boundaryNorthVerification : '',
      boundaryNorthDocument: saved.boundaryNorthDocument !== undefined ? saved.boundaryNorthDocument : '',
      boundarySouthVerification: saved.boundarySouthVerification !== undefined ? saved.boundarySouthVerification : '',
      boundarySouthDocument: saved.boundarySouthDocument !== undefined ? saved.boundarySouthDocument : '',

      // Dimensions (Point 14.1)
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
      approvedPlanAuthority: saved.approvedPlanAuthority !== undefined ? saved.approvedPlanAuthority : 'BDA Vide Letter No: ...',
      approvedPlanAuthenticity: saved.approvedPlanAuthenticity !== undefined ? saved.approvedPlanAuthenticity : 'Yes, Verified from the authenticated authority',
      valuerCommentsOnPlan: saved.valuerCommentsOnPlan !== undefined ? saved.valuerCommentsOnPlan : 'Yes, The approval plan is authenticated',

      // II. APARTMENT BUILDING
      natureOfApartment: saved.natureOfApartment !== undefined ? saved.natureOfApartment : 'Residential Apartment',
      aptLocationTsNo: saved.aptLocationTsNo !== undefined ? saved.aptLocationTsNo : '',
      aptLocationBlockNo: saved.aptLocationBlockNo !== undefined ? saved.aptLocationBlockNo : '',
      aptLocationWardNo: saved.aptLocationWardNo !== undefined ? saved.aptLocationWardNo : 'Not Applicable',
      aptLocationVillageCorp: saved.aptLocationVillageCorp !== undefined ? saved.aptLocationVillageCorp : 'Within Municipal Corporation area limit',
      aptLocationDoorRoadPin: saved.aptLocationDoorRoadPin !== undefined ? saved.aptLocationDoorRoadPin : '',
      localityDescription: saved.localityDescription !== undefined ? saved.localityDescription : 'Residential',
      yearOfConstruction: saved.yearOfConstruction !== undefined ? saved.yearOfConstruction : '',
      numberOfFloors: saved.numberOfFloors !== undefined ? saved.numberOfFloors : 'B+G+16 Storied',
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

      // III. FLAT
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
      saleDeedExecutedName: saved.saleDeedExecutedName !== undefined ? saved.saleDeedExecutedName : (pf.contactName || ''),
      undividedLandArea: saved.undividedLandArea !== undefined ? saved.undividedLandArea : '',
      superBuiltUpArea: saved.superBuiltUpArea !== undefined ? saved.superBuiltUpArea : '',
      floorSpaceIndex: saved.floorSpaceIndex !== undefined ? saved.floorSpaceIndex : 'As per approval plan',
      carpetArea: saved.carpetArea !== undefined ? saved.carpetArea : '',
      poshClassMediumOrdinary: saved.poshClassMediumOrdinary !== undefined ? saved.poshClassMediumOrdinary : 'I Class',
      usageResidentialCommercial: saved.usageResidentialCommercial !== undefined ? saved.usageResidentialCommercial : 'Residential Purpose',
      flatOccupancyOwnerTenant: saved.flatOccupancyOwnerTenant !== undefined ? saved.flatOccupancyOwnerTenant : 'The Flat is occupied by Owner',
      monthlyRentIfRented: saved.monthlyRentIfRented !== undefined ? saved.monthlyRentIfRented : 'Not Applicable',

      // IV. MARKETABILITY
      marketabilityRating: saved.marketabilityRating !== undefined ? saved.marketabilityRating : 'Good',
      factorsFavoringPotentialValue: saved.factorsFavoringPotentialValue !== undefined ? saved.factorsFavoringPotentialValue : 'The subject property located in a developed Residential area. All the civic amenities like Bus Stop, Hotel, School, College, Market Place and Hospital are located within 2-3 Km radious from the property. So, it has a good potential value.',
      negativeFactorsObserved: saved.negativeFactorsObserved !== undefined ? saved.negativeFactorsObserved : 'Nothing Observed',

      // V. RATE
      comparableSaleInstancesRate: saved.comparableSaleInstancesRate !== undefined ? saved.comparableSaleInstancesRate : '',
      adoptedBasicCompositeRate: saved.adoptedBasicCompositeRate !== undefined ? saved.adoptedBasicCompositeRate : '',
      rateBreakupBuildingServices: saved.rateBreakupBuildingServices !== undefined ? saved.rateBreakupBuildingServices : '',
      rateBreakupLandOthers: saved.rateBreakupLandOthers !== undefined ? saved.rateBreakupLandOthers : '',
      guidelineRateLandText: saved.guidelineRateLandText !== undefined ? saved.guidelineRateLandText : '',
      guidelineTotalUdsLandValue: saved.guidelineTotalUdsLandValue !== undefined ? saved.guidelineTotalUdsLandValue : '',

      // VI. COMPOSITE RATE ADOPTED AFTER DEPRECIATION
      depreciatedBuildingRateAnnualFormula: saved.depreciatedBuildingRateAnnualFormula !== undefined ? saved.depreciatedBuildingRateAnnualFormula : '1.5% Per Annum (1.5% X 10 Yrs = 15%)',
      replacementCostOfFlat: saved.replacementCostOfFlat !== undefined ? saved.replacementCostOfFlat : '',
      buildingAge: saved.buildingAge !== undefined ? saved.buildingAge : '10',
      buildingLife: saved.buildingLife !== undefined ? saved.buildingLife : '50',
      depreciationSalvagePercentage: saved.depreciationSalvagePercentage !== undefined ? saved.depreciationSalvagePercentage : 'Age: 10 Yrs, Useful Life: 60 Yrs. Salvage Value: 10%. Considering straight-line method of depreciation.',
      depreciationRatio: saved.depreciationRatio !== undefined ? saved.depreciationRatio : '1.5% Per Annum',

      finalDepreciatedBuildingRate: saved.finalDepreciatedBuildingRate !== undefined ? saved.finalDepreciatedBuildingRate : '',
      finalRateLandOther: saved.finalRateLandOther !== undefined ? saved.finalRateLandOther : '',
      finalTotalCompositeRate: saved.finalTotalCompositeRate !== undefined ? saved.finalTotalCompositeRate : '',

      // DETAILS OF VALUATION
      valFlatPresentValue: saved.valFlatPresentValue !== undefined ? saved.valFlatPresentValue : '',
      valCarParking: saved.valCarParking !== undefined ? saved.valCarParking : '0',
      valWardrobes: saved.valWardrobes !== undefined ? saved.valWardrobes : '0',
      valModularKitchen: saved.valModularKitchen !== undefined ? saved.valModularKitchen : '0',
      valCupboard: saved.valCupboard !== undefined ? saved.valCupboard : '0',
      valInteriorDecorations: saved.valInteriorDecorations !== undefined ? saved.valInteriorDecorations : '0',
      valElectricityDeposits: saved.valElectricityDeposits !== undefined ? saved.valElectricityDeposits : '0',
      valExtraGrillCollapsible: saved.valExtraGrillCollapsible !== undefined ? saved.valExtraGrillCollapsible : '0',
      valPotentialValue: saved.valPotentialValue !== undefined ? saved.valPotentialValue : '0',
      valOthers: saved.valOthers !== undefined ? saved.valOthers : '0',
      valTotalEstimated: saved.valTotalEstimated !== undefined ? saved.valTotalEstimated : '',

      // TOTAL ABSTRACT (Nullable defaults allowed)
      abstractGovtValueLand: saved.abstractGovtValueLand !== undefined ? saved.abstractGovtValueLand : '',
      abstractMarketValue: saved.abstractMarketValue !== undefined ? saved.abstractMarketValue : '',
      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractRealizableValue: saved.abstractRealizableValue !== undefined ? saved.abstractRealizableValue : '',
      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',
      abstractDistressValue: saved.abstractDistressValue !== undefined ? saved.abstractDistressValue : '',
      abstractOrSayGovtLand: saved.abstractOrSayGovtLand !== undefined ? saved.abstractOrSayGovtLand : '',
      abstractOrSayMarket: saved.abstractOrSayMarket !== undefined ? saved.abstractOrSayMarket : '',
      abstractOrSayRealizable: saved.abstractOrSayRealizable !== undefined ? saved.abstractOrSayRealizable : '',
      abstractOrSayDistress: saved.abstractOrSayDistress !== undefined ? saved.abstractOrSayDistress : '',

      // REMARKS & OPINIONS
      remarksText: saved.remarksText !== undefined ? saved.remarksText : '',
      opinionMarketValueWords: saved.opinionMarketValueWords !== undefined ? saved.opinionMarketValueWords : '',
      opinionRealizableValueWords: saved.opinionRealizableValueWords !== undefined ? saved.opinionRealizableValueWords : '',
      opinionGovtLandValueWords: saved.opinionGovtLandValueWords !== undefined ? saved.opinionGovtLandValueWords : '',
      opinionDistressValueWords: saved.opinionDistressValueWords !== undefined ? saved.opinionDistressValueWords : '',

      valuerName: saved.valuerName !== undefined ? saved.valuerName : 'Mr. Satyajit Mohanty',
      valuerFatherName: saved.valuerFatherName !== undefined ? saved.valuerFatherName : 'Mr. Nityananda Mohanty',
      valuerPan: saved.valuerPan !== undefined ? saved.valuerPan : 'AONPM6997B',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || ''),

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

  // Helper to parse numeric inputs supporting decimals and currency signs safely
  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  // Helper to parse percentage where empty/null defaults to 100%, and '0' is 0%
  const parsePct = (val: any, fallback = 100): number => {
    if (val === undefined || val === null || String(val).trim() === '') return fallback;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? fallback : Math.min(100, Math.max(0, n));
  };

  // ── Auto-Calculate Composite Rates & Valuation Totals ──
  useEffect(() => {
    const sba = parseNum(fields.superBuiltUpArea);
    const bldgRate = parseNum(fields.finalDepreciatedBuildingRate);
    const landRate = parseNum(fields.finalRateLandOther);

    const compRate = Math.round((bldgRate + landRate) * 100) / 100;
    const flatVal = Math.round(sba * (compRate > 0 ? compRate : parseNum(fields.finalTotalCompositeRate)));

    const extraTotal =
      parseNum(fields.valCarParking) +
      parseNum(fields.valWardrobes) +
      parseNum(fields.valModularKitchen) +
      parseNum(fields.valCupboard) +
      parseNum(fields.valInteriorDecorations) +
      parseNum(fields.valElectricityDeposits) +
      parseNum(fields.valExtraGrillCollapsible) +
      parseNum(fields.valPotentialValue) +
      parseNum(fields.valOthers);

    const totalEst = flatVal + extraTotal;

    // Realizable & Distress percentages (Nullable fallback to 100% if empty, or 0% if '0')
    const rPct = parsePct(fields.abstractRealizablePct, 100);
    const dPct = parsePct(fields.abstractDistressPct, 100);

    const realVal = Math.round((totalEst * rPct) / 100);
    const distVal = Math.round((totalEst * dPct) / 100);

    setFields((prev: any) => ({
      ...prev,
      finalTotalCompositeRate: prev.finalTotalCompositeRate || (compRate > 0 ? `Rs. ${compRate}` : ''),
      valFlatPresentValue: prev.valFlatPresentValue || (flatVal > 0 ? `Rs. ${formatIndianCurrency(flatVal)}` : ''),
      valTotalEstimated: prev.valTotalEstimated || (totalEst > 0 ? `Rs. ${formatIndianCurrency(totalEst)}` : ''),
      abstractMarketValue: prev.abstractMarketValue || (totalEst > 0 ? `Rs. ${formatIndianCurrency(totalEst)}` : ''),
      abstractRealizableValue: prev.abstractRealizableValue || (realVal > 0 ? `Rs. ${formatIndianCurrency(realVal)}` : ''),
      abstractDistressValue: prev.abstractDistressValue || (distVal > 0 ? `Rs. ${formatIndianCurrency(distVal)}` : ''),
      opinionMarketValueWords: prev.opinionMarketValueWords || (totalEst > 0 ? rupeesInWords(totalEst) : ''),
      opinionRealizableValueWords: prev.opinionRealizableValueWords || (realVal > 0 ? rupeesInWords(realVal) : ''),
      opinionDistressValueWords: prev.opinionDistressValueWords || (distVal > 0 ? rupeesInWords(distVal) : ''),
    }));
  }, [
    fields.superBuiltUpArea,
    fields.finalDepreciatedBuildingRate,
    fields.finalRateLandOther,
    fields.abstractRealizablePct,
    fields.abstractDistressPct,
  ]);

  const handleSaveInternal = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        reportData: fields,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save report draft', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdfInternal = async () => {
    try {
      const { PDFSBIRenderer } = require('@/lib/banks/pdf-sbi-above-5cr-renderer');
      const renderer = new PDFSBIRenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SBI_Valuation_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating SBI PDF:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Card & Actions ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            STATE BANK OF INDIA (SBI) — ABOVE 5CR
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Valuation Report Questionnaire</h2>
          <p className="text-xs text-slate-500">
            Standard Statutory Bank Format addressing Asst. General Manager with full composite rate schedules.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSaveInternal}
            disabled={saving || isReadOnly}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdfInternal}
            className="px-5 py-2.5 rounded-xl bg-accent-600 text-white font-medium text-sm hover:bg-accent-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Section 1: Bank Authority & General Details ── */}
      <Section title="I. General Details (Points 1 - 21)" number={1} defaultOpen={true}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="To Authority">
            <input
              className={inputCls}
              value={fields.toAuthority}
              onChange={(e) => handleChange('toAuthority', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. THE ASST. GENERAL MANAGER,"
            />
          </Field>
          <Field label="Bank Name">
            <input
              className={inputCls}
              value={fields.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. STATE BANK OF INDIA,"
            />
          </Field>
          <Field label="RBO / Branch Office">
            <input
              className={inputCls}
              value={fields.rboOffice}
              onChange={(e) => handleChange('rboOffice', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. RBO, PURI, DIST: PURI, ODISHA"
            />
          </Field>
          <Field label="Ref. No.">
            <input
              className={inputCls}
              value={fields.refNo}
              onChange={(e) => handleChange('refNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. SMA/08/2026/01"
            />
          </Field>
          <Field label="Valuation Date">
            <input
              type="date"
              className={inputCls}
              value={fields.reportDate}
              onChange={(e) => handleChange('reportDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Date of Inspection">
            <input
              type="date"
              className={inputCls}
              value={fields.inspectionDate}
              onChange={(e) => handleChange('inspectionDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <Field label="1. Purpose of Valuation" span={2}>
            <input
              className={inputCls}
              value={fields.purposeOfValuation}
              onChange={(e) => handleChange('purposeOfValuation', e.target.value)}
              disabled={isReadOnly}
              placeholder="To assess the present Market Value of the Property for Loan purpose"
            />
          </Field>
          <Field label="3. Documents Produced for Perusal (i, ii, iii)" span={2}>
            <div className="grid grid-cols-3 gap-2">
              <input
                className={inputCls}
                value={fields.doc1}
                onChange={(e) => handleChange('doc1', e.target.value)}
                disabled={isReadOnly}
                placeholder="Doc 1 (e.g. Sale Deed)"
              />
              <input
                className={inputCls}
                value={fields.doc2}
                onChange={(e) => handleChange('doc2', e.target.value)}
                disabled={isReadOnly}
                placeholder="Doc 2"
              />
              <input
                className={inputCls}
                value={fields.doc3}
                onChange={(e) => handleChange('doc3', e.target.value)}
                disabled={isReadOnly}
                placeholder="Doc 3"
              />
            </div>
          </Field>
          <Field label="4. Owner Name & Address" span={2}>
            <textarea
              className={inputCls + ' min-h-[64px]'}
              value={fields.ownerNameAndAddress}
              onChange={(e) => handleChange('ownerNameAndAddress', e.target.value)}
              disabled={isReadOnly}
              placeholder="Mr. ... S/o: ... At: Flat No ..., Bhubaneswar"
            />
          </Field>
          <Field label="5. Brief Description of Property" span={2}>
            <textarea
              className={inputCls + ' min-h-[64px]'}
              value={fields.propertyDescription}
              onChange={(e) => handleChange('propertyDescription', e.target.value)}
              disabled={isReadOnly}
              placeholder="Khata No: ... Plot No: ... having Super Built up Area: ..."
            />
          </Field>
        </div>

        {/* Location & Boundaries */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">Location & Boundaries</h4>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="6a. Plot / Survey No.">
            <input
              className={inputCls}
              value={fields.plotNo}
              onChange={(e) => handleChange('plotNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 527, 524, 513"
            />
          </Field>
          <Field label="6b. Door No.">
            <input
              className={inputCls}
              value={fields.doorNo}
              onChange={(e) => handleChange('doorNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Flat No: A-041, Tower-A"
            />
          </Field>
          <Field label="6c. T.S. No. / Village">
            <input
              className={inputCls}
              value={fields.tsNoVillage}
              onChange={(e) => handleChange('tsNoVillage', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Mouza: Dumuduma"
            />
          </Field>
          <Field label="6d. Ward / Taluka">
            <input
              className={inputCls}
              value={fields.wardTaluka}
              onChange={(e) => handleChange('wardTaluka', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Bhubaneswar"
            />
          </Field>
          <Field label="6e. Mandal / District">
            <input
              className={inputCls}
              value={fields.mandalDistrict}
              onChange={(e) => handleChange('mandalDistrict', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Khurda, Odisha"
            />
          </Field>
          <Field label="7. Postal Address">
            <input
              className={inputCls}
              value={fields.postalAddress}
              onChange={(e) => handleChange('postalAddress', e.target.value)}
              disabled={isReadOnly}
              placeholder="Full address with pin code"
            />
          </Field>
        </div>

        {/* Boundaries Sub-Table (Pt 13) */}
        <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <p className="text-xs font-bold text-slate-800">13. Boundaries of the Property</p>
          <div className="grid grid-cols-3 gap-2 font-semibold text-xs text-slate-500">
            <div>Direction</div>
            <div>As per Verification</div>
            <div>As per Document</div>
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">East</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryEastVerification}
              onChange={(e) => handleChange('boundaryEastVerification', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Verification"
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryEastDocument}
              onChange={(e) => handleChange('boundaryEastDocument', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Document"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">West</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryWestVerification}
              onChange={(e) => handleChange('boundaryWestVerification', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Verification"
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryWestDocument}
              onChange={(e) => handleChange('boundaryWestDocument', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Document"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">North</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryNorthVerification}
              onChange={(e) => handleChange('boundaryNorthVerification', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Verification"
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryNorthDocument}
              onChange={(e) => handleChange('boundaryNorthDocument', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Document"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">South</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundarySouthVerification}
              onChange={(e) => handleChange('boundarySouthVerification', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Verification"
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundarySouthDocument}
              onChange={(e) => handleChange('boundarySouthDocument', e.target.value)}
              disabled={isReadOnly}
              placeholder="As per Document"
            />
          </div>
        </div>

        {/* Plan Approval & Authorities (Points 18-21) */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Field label="18. Validity of Layout / Map">
            <input
              className={inputCls}
              value={fields.approvedPlanValidity}
              onChange={(e) => handleChange('approvedPlanValidity', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Validity: 3 Yrs from the approval"
            />
          </Field>
          <Field label="19. Approved Plan Authority">
            <input
              className={inputCls}
              value={fields.approvedPlanAuthority}
              onChange={(e) => handleChange('approvedPlanAuthority', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. BDA Vide Letter No: ..."
            />
          </Field>
          <Field label="20. Genuineness / Authenticity Verified">
            <input
              className={inputCls}
              value={fields.approvedPlanAuthenticity}
              onChange={(e) => handleChange('approvedPlanAuthenticity', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes, Verified from the authenticated authority"
            />
          </Field>
          <Field label="21. Valuer Comments on Authentic Plan">
            <input
              className={inputCls}
              value={fields.valuerCommentsOnPlan}
              onChange={(e) => handleChange('valuerCommentsOnPlan', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes, The approval plan is authenticated"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Apartment Building Details ── */}
      <Section title="II. Apartment Building (Points 1 - 11)" number={2} defaultOpen={false}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="1. Nature of the Apartment">
            <input
              className={inputCls}
              value={fields.natureOfApartment}
              onChange={(e) => handleChange('natureOfApartment', e.target.value)}
              disabled={isReadOnly}
              placeholder="Residential Apartment"
            />
          </Field>
          <Field label="4. Year of Construction">
            <input
              className={inputCls}
              value={fields.yearOfConstruction}
              onChange={(e) => handleChange('yearOfConstruction', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 2010"
            />
          </Field>
          <Field label="5. Number of Floors">
            <input
              className={inputCls}
              value={fields.numberOfFloors}
              onChange={(e) => handleChange('numberOfFloors', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. B+G+16 Storied"
            />
          </Field>
          <Field label="6. Type of Structure">
            <input
              className={inputCls}
              value={fields.typeOfStructure}
              onChange={(e) => handleChange('typeOfStructure', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. RCC Frame Structure"
            />
          </Field>
          <Field label="8. Quality of Construction">
            <select
              className={selectCls}
              value={fields.qualityOfConstruction}
              onChange={(e) => handleChange('qualityOfConstruction', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>
          <Field label="10. Maintenance of Building">
            <select
              className={selectCls}
              value={fields.maintenanceOfBuilding}
              onChange={(e) => handleChange('maintenanceOfBuilding', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>
        </div>

        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">11. Facilities Available</h4>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Lift">
            <input
              className={inputCls}
              value={fields.facilityLift}
              onChange={(e) => handleChange('facilityLift', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes"
            />
          </Field>
          <Field label="Water Supply">
            <input
              className={inputCls}
              value={fields.facilityWaterSupply}
              onChange={(e) => handleChange('facilityWaterSupply', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes"
            />
          </Field>
          <Field label="Under Ground Sewerage">
            <input
              className={inputCls}
              value={fields.facilitySewerage}
              onChange={(e) => handleChange('facilitySewerage', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes"
            />
          </Field>
          <Field label="Car Parking">
            <input
              className={inputCls}
              value={fields.facilityCarParking}
              onChange={(e) => handleChange('facilityCarParking', e.target.value)}
              disabled={isReadOnly}
              placeholder="Covered parking"
            />
          </Field>
          <Field label="Does Compound Wall Exist?">
            <input
              className={inputCls}
              value={fields.facilityCompoundWall}
              onChange={(e) => handleChange('facilityCompoundWall', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes"
            />
          </Field>
          <Field label="Pavement around Building?">
            <input
              className={inputCls}
              value={fields.facilityPavement}
              onChange={(e) => handleChange('facilityPavement', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Flat Specifications & Areas ── */}
      <Section title="III. Flat Specifications & Areas (Points 1 - 15)" number={3} defaultOpen={false}>
        <div className="grid md:grid-cols-4 gap-4">
          <Field label="1. Situated Floor">
            <input
              className={inputCls}
              value={fields.flatFloorNumber}
              onChange={(e) => handleChange('flatFloorNumber', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 4th Floor"
            />
          </Field>
          <Field label="2. Door No.">
            <input
              className={inputCls}
              value={fields.flatDoorNumber}
              onChange={(e) => handleChange('flatDoorNumber', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Flat No: A-041"
            />
          </Field>
          <Field label="8. Undivided Land Share (UDS)">
            <input
              className={inputCls}
              value={fields.undividedLandArea}
              onChange={(e) => handleChange('undividedLandArea', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Ac.0.012 Dec i.e. 523.00 Sft"
            />
          </Field>
          <Field label="9. Super Built-up Area (SBA)">
            <input
              className={inputCls}
              value={fields.superBuiltUpArea}
              onChange={(e) => handleChange('superBuiltUpArea', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1375.00 Sft"
            />
          </Field>
          <Field label="11. Carpet Area">
            <input
              className={inputCls}
              value={fields.carpetArea}
              onChange={(e) => handleChange('carpetArea', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 948.00 Sft (Approx.)"
            />
          </Field>
          <Field label="12. Classification">
            <input
              className={inputCls}
              value={fields.poshClassMediumOrdinary}
              onChange={(e) => handleChange('poshClassMediumOrdinary', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. I Class"
            />
          </Field>
          <Field label="13. Function / Usage">
            <input
              className={inputCls}
              value={fields.usageResidentialCommercial}
              onChange={(e) => handleChange('usageResidentialCommercial', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Residential Purpose"
            />
          </Field>
          <Field label="14. Occupancy Status">
            <input
              className={inputCls}
              value={fields.flatOccupancyOwnerTenant}
              onChange={(e) => handleChange('flatOccupancyOwnerTenant', e.target.value)}
              disabled={isReadOnly}
              placeholder="The Flat is occupied by Owner"
            />
          </Field>
        </div>

        {/* Specifications */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">3. Flat Internal Specifications</h4>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Roof">
            <input
              className={inputCls}
              value={fields.specRoof}
              onChange={(e) => handleChange('specRoof', e.target.value)}
              disabled={isReadOnly}
              placeholder="RCC Roof"
            />
          </Field>
          <Field label="Flooring">
            <input
              className={inputCls}
              value={fields.specFlooring}
              onChange={(e) => handleChange('specFlooring', e.target.value)}
              disabled={isReadOnly}
              placeholder="VT Flooring"
            />
          </Field>
          <Field label="Doors">
            <input
              className={inputCls}
              value={fields.specDoors}
              onChange={(e) => handleChange('specDoors', e.target.value)}
              disabled={isReadOnly}
              placeholder="Hard Ply wood doors"
            />
          </Field>
          <Field label="Windows">
            <input
              className={inputCls}
              value={fields.specWindows}
              onChange={(e) => handleChange('specWindows', e.target.value)}
              disabled={isReadOnly}
              placeholder="Aluminum frame with glass windows"
            />
          </Field>
          <Field label="Fittings">
            <input
              className={inputCls}
              value={fields.specFittings}
              onChange={(e) => handleChange('specFittings', e.target.value)}
              disabled={isReadOnly}
              placeholder="Superior"
            />
          </Field>
          <Field label="Finishing">
            <input
              className={inputCls}
              value={fields.specFinishing}
              onChange={(e) => handleChange('specFinishing', e.target.value)}
              disabled={isReadOnly}
              placeholder="Putty, Plastering, Modular Kitchen..."
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Composite Rate & Valuation Breakdown ── */}
      <Section title="IV - VI. Composite Rate Analysis & Depreciation" number={4} defaultOpen={false}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Age of Building (Yrs)">
            <input
              type="number"
              className={inputCls}
              value={fields.buildingAge}
              onChange={(e) => handleChange('buildingAge', e.target.value)}
              disabled={isReadOnly}
              placeholder="10"
            />
          </Field>
          <Field label="Estimated Life (Yrs)">
            <input
              type="number"
              className={inputCls}
              value={fields.buildingLife}
              onChange={(e) => handleChange('buildingLife', e.target.value)}
              disabled={isReadOnly}
              placeholder="50"
            />
          </Field>
          <Field label="Depreciated Building Rate (Rs./Sft)">
            <input
              className={inputCls}
              value={fields.finalDepreciatedBuildingRate}
              onChange={(e) => handleChange('finalDepreciatedBuildingRate', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 2125"
            />
          </Field>
          <Field label="Rate for Land & Other (Rs./Sft)">
            <input
              className={inputCls}
              value={fields.finalRateLandOther}
              onChange={(e) => handleChange('finalRateLandOther', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 7500"
            />
          </Field>
          <Field label="Total Composite Rate (Rs./Sft)">
            <input
              className={inputCls}
              value={fields.finalTotalCompositeRate}
              onChange={(e) => handleChange('finalTotalCompositeRate', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 9625"
            />
          </Field>
          <Field label="Govt. Guideline Rate & UDS Value">
            <input
              className={inputCls}
              value={fields.guidelineRateLandText}
              onChange={(e) => handleChange('guidelineRateLandText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Rs. 13,88,565/-"
            />
          </Field>
        </div>

        {/* 10 Details of Valuation Table */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">Details of Valuation (10 Items)</h4>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="1. Flat Present Value">
            <input
              className={inputCls}
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
          <Field label="3. Wardrobes in LS">
            <input
              className={inputCls}
              value={fields.valWardrobes}
              onChange={(e) => handleChange('valWardrobes', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="4. Modular Kitchen in LS">
            <input
              className={inputCls}
              value={fields.valModularKitchen}
              onChange={(e) => handleChange('valModularKitchen', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="5. Cupboard in LS">
            <input
              className={inputCls}
              value={fields.valCupboard}
              onChange={(e) => handleChange('valCupboard', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="6. Interior Decorations in LS">
            <input
              className={inputCls}
              value={fields.valInteriorDecorations}
              onChange={(e) => handleChange('valInteriorDecorations', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="7. Electricity Deposits / Fittings">
            <input
              className={inputCls}
              value={fields.valElectricityDeposits}
              onChange={(e) => handleChange('valElectricityDeposits', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="8. Extra Grill / Collapsible Gates">
            <input
              className={inputCls}
              value={fields.valExtraGrillCollapsible}
              onChange={(e) => handleChange('valExtraGrillCollapsible', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Total Estimated Value">
            <input
              className={inputCls + ' font-bold bg-slate-50'}
              value={fields.valTotalEstimated}
              onChange={(e) => handleChange('valTotalEstimated', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Total Abstract Matrix ── */}
      <Section title="Total Abstract for the Entire Property" number={5} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <Field label="Govt. Value of Land (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtValueLand}
              onChange={(e) => handleChange('abstractGovtValueLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1388565"
            />
          </Field>
          <Field label="Market Value (Rs.)">
            <input
              className={inputCls + ' font-bold text-slate-900'}
              value={fields.abstractMarketValue}
              onChange={(e) => handleChange('abstractMarketValue', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 13234000"
            />
          </Field>
          <Field label="Realizable Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractRealizablePct}
                onChange={(e) => handleChange('abstractRealizablePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Leave empty for 100%)"
              />
              <input
                className={inputCls}
                value={fields.abstractRealizableValue}
                onChange={(e) => handleChange('abstractRealizableValue', e.target.value)}
                disabled={isReadOnly}
                placeholder="Realizable Amount"
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
                placeholder="100 (Leave empty for 100%)"
              />
              <input
                className={inputCls}
                value={fields.abstractDistressValue}
                onChange={(e) => handleChange('abstractDistressValue', e.target.value)}
                disabled={isReadOnly}
                placeholder="Distress Amount"
              />
            </div>
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-3">
          <Field label="Or Say (Govt Land)">
            <input
              className={inputCls}
              value={fields.abstractOrSayGovtLand}
              onChange={(e) => handleChange('abstractOrSayGovtLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="Rounded Thousand"
            />
          </Field>
          <Field label="Or Say (Market Value)">
            <input
              className={inputCls}
              value={fields.abstractOrSayMarket}
              onChange={(e) => handleChange('abstractOrSayMarket', e.target.value)}
              disabled={isReadOnly}
              placeholder="Rounded Thousand"
            />
          </Field>
          <Field label="Or Say (Realizable)">
            <input
              className={inputCls}
              value={fields.abstractOrSayRealizable}
              onChange={(e) => handleChange('abstractOrSayRealizable', e.target.value)}
              disabled={isReadOnly}
              placeholder="Rounded Thousand"
            />
          </Field>
          <Field label="Or Say (Distress)">
            <input
              className={inputCls}
              value={fields.abstractOrSayDistress}
              onChange={(e) => handleChange('abstractOrSayDistress', e.target.value)}
              disabled={isReadOnly}
              placeholder="Rounded Thousand"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Remarks & Observations">
            <textarea
              className={inputCls + ' min-h-[80px]'}
              value={fields.remarksText}
              onChange={(e) => handleChange('remarksText', e.target.value)}
              disabled={isReadOnly}
              placeholder="SUBJECT PROPERTY IS A 2 BHK FLAT, HAVING SUPER BUILT UP AREA: ..."
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 6: Base Documents (Inherited Directly) ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={6}
        sectionId="section-documents"
      />

      {/* ── Section 7: Base Maps (Inherited Directly) ── */}
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
        sectionNumber={7}
        sectionId="section-maps"
      />

      {/* ── Section 8: Photographs (Inherited Directly) ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={8}
        sectionId="section-photographs"
      />
    </div>
  );
}
