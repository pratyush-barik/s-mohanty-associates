'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportHeader,
  Section,
  Field,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
  formatReportDate,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { Lock } from 'lucide-react';
import { PDFSBILandAndBuildingRenderer } from '@/lib/banks/pdf-sbi-land-and-building-renderer';

// ─── PrefillField component with Edit Toggle & Hover Tooltip ────────────────
const PrefillField = ({
  label,
  value,
  onChange,
  tooltip,
  isReadOnly,
  type = 'text',
  fallbackValue,
  options,
  customInputProps,
  hideEditToggle = false,
  rows = 3
}: any) => {
  const [isEdit, setIsEdit] = useState(false);

  React.useEffect(() => {
    if (!isEdit && fallbackValue !== undefined && value !== fallbackValue) {
      onChange(fallbackValue);
    }
  }, [isEdit, fallbackValue, value, onChange]);

  const handleToggle = () => setIsEdit(!isEdit);
  const displayValue = isEdit ? (value || '') : (fallbackValue !== undefined ? (fallbackValue || '') : (value || ''));

  const labelWithToggle = (
    <div className="flex justify-between items-center w-full">
      <div className="flex-1 flex items-center pr-4 font-semibold text-xs text-slate-700">{label}</div>
      {!hideEditToggle && (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase ${isEdit ? 'text-emerald-700' : 'text-gray-400'}`}>
            {isEdit ? 'Edit On' : 'Edit Off'}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isReadOnly}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${isEdit ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Field label={labelWithToggle}>
      <div className="relative mt-1">
        {type === 'textarea' ? (
          <textarea
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
            rows={rows}
          />
        ) : type === 'select' ? (
          <select
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          >
            {options?.map((opt: any, i: number) => <option key={i} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <input
            type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          />
        )}
        {!isEdit && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={tooltip}>
            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        )}
      </div>
    </Field>
  );
};

export const SBI_LAND_BUILDING_CONFIG: BankConfig = {
  bankId: 'STATE BANK OF INDIA-SBI',
  subTemplateId: 'Land & Building',
  displayName: 'State Bank of India (SBI) — Land & Building',
  defaultValues: {},
  getPDFRenderer: (data: any, projectCode?: string) => {
    return new PDFSBILandAndBuildingRenderer(data, projectCode);
  },
};

export interface SBILandBuildingProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function StateBankOfIndiaLandAndBuilding({
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
}: SBILandBuildingProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const earliestVisit = useMemo(() => getEarliestFieldVisit(bucketImages, prefill), [bucketImages, prefill]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill & Exact Statutory Points ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      clientType: saved.clientType || 'organisation',
      organisationTemplate: saved.organisationTemplate || 'STATE BANK OF INDIA-SBI',
      organisationSubTemplate: saved.organisationSubTemplate || 'Land & Building',
      institutionCategory: saved.institutionCategory || 'Bank & FIS',
      propertyValuationType: 'LAND_AND_BUILDING',
      serviceType: saved.serviceType || pf.serviceType || 'MORTGAGE_AND_LOAN_SECURITY_VALUATION',
      subjectType: saved.subjectType || pf.subjectType || 'HOME_LOAN_VALUATION',

      // Top Header / COVER PAGE & BANK DETAILS
      reportOnValuationOf: saved.reportOnValuationOf !== undefined ? saved.reportOnValuationOf : 'LAND & BUILDING',
      branchAddressDetails: saved.branchAddressDetails !== undefined ? saved.branchAddressDetails : (saved.branchAddress || ''),
      asOnDate: saved.asOnDate !== undefined ? saved.asOnDate : '',
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE CHIEF MANAGER / BRANCH HEAD,',
      bankName: saved.bankName !== undefined ? saved.bankName : (pf.bankName || 'STATE BANK OF INDIA,'),
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : '',
      refNo: saved.refNo !== undefined ? saved.refNo : (projectCode ? `SMA/${projectCode}` : ''),
      coverDate: saved.coverDate !== undefined ? saved.coverDate : (saved.reportDate || pf.reportDate || ''),
      reportDate: saved.reportDate !== undefined ? saved.reportDate : (pf.reportDate || (earliestVisit ? formatReportDate(earliestVisit.date) : '')),
      valuationPropertyDesc: saved.valuationPropertyDesc !== undefined ? saved.valuationPropertyDesc : (saved.propertyAddress || pf.propertyAddress || ''),
      nameOfTheOwner: saved.nameOfTheOwner !== undefined ? saved.nameOfTheOwner : (saved.borrowerName || pf.contactName || pf.applicantName || ''),
      borrowerName: saved.borrowerName !== undefined ? saved.borrowerName : (pf.contactName || pf.applicantName || ''),
      presentMarketValue: saved.presentMarketValue !== undefined ? saved.presentMarketValue : '',
      realizableValue: saved.realizableValue !== undefined ? saved.realizableValue : '',
      forcedSaleValue: saved.forcedSaleValue !== undefined ? saved.forcedSaleValue : '',
      govtValue: saved.govtValue !== undefined ? saved.govtValue : '',
      purposeOfValuation: saved.purposeOfValuation !== undefined ? saved.purposeOfValuation : 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY',

      // 1 Customer Details
      customerBorrowalUnit: saved.customerBorrowalUnit !== undefined ? saved.customerBorrowalUnit : (saved.nameOfTheOwner || saved.borrowerName || pf.contactName || pf.applicantName || ''),
      customerOwnerName: saved.customerOwnerName !== undefined ? saved.customerOwnerName : (saved.nameOfTheOwner || saved.borrowerName || pf.contactName || pf.applicantName || ''),
      applicationNo: saved.applicationNo !== undefined ? saved.applicationNo : '',
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.contactName ? `${pf.contactName}${pf.fatherName ? `, S/o: ${pf.fatherName}` : ''}${pf.propertyAddress ? `, At: ${pf.propertyAddress}` : ''}` : (pf.applicantName || '')),
      caseType: saved.caseType !== undefined ? saved.caseType : 'Fresh Valuation',
      identifiedByAndMobNo: saved.identifiedByAndMobNo !== undefined ? saved.identifiedByAndMobNo : '',

      // 2. Property Details
      propertyAddress: saved.propertyAddress !== undefined ? saved.propertyAddress : (pf.propertyAddress || ''),
      nearbyLandmark: saved.nearbyLandmark !== undefined ? saved.nearbyLandmark : '',
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : '',
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || ''),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || ''),

      // 3. Document Details
      layoutPlanAvailable: saved.layoutPlanAvailable !== undefined ? saved.layoutPlanAvailable : 'Yes/ No',
      layoutPlanAuthority: saved.layoutPlanAuthority !== undefined ? saved.layoutPlanAuthority : '',
      layoutPlanApprovalNo: saved.layoutPlanApprovalNo !== undefined ? saved.layoutPlanApprovalNo : '',
      buildingPlanAvailable: saved.buildingPlanAvailable !== undefined ? saved.buildingPlanAvailable : 'Yes/ No',
      buildingPlanAuthority: saved.buildingPlanAuthority !== undefined ? saved.buildingPlanAuthority : '',
      buildingPlanApprovalNo: saved.buildingPlanApprovalNo !== undefined ? saved.buildingPlanApprovalNo : '',
      constructionPermissionAvailable: saved.constructionPermissionAvailable !== undefined ? saved.constructionPermissionAvailable : 'Yes/ No',
      constructionPermissionAuthority: saved.constructionPermissionAuthority !== undefined ? saved.constructionPermissionAuthority : '',
      constructionPermissionApprovalNo: saved.constructionPermissionApprovalNo !== undefined ? saved.constructionPermissionApprovalNo : '',
      legalDocumentsAvailable: saved.legalDocumentsAvailable !== undefined ? saved.legalDocumentsAvailable : 'Yes/ No',
      legalDocumentsAuthority: saved.legalDocumentsAuthority !== undefined ? saved.legalDocumentsAuthority : '',
      legalDocumentsApprovalNo: saved.legalDocumentsApprovalNo !== undefined ? saved.legalDocumentsApprovalNo : '',
      listOfDocuments: saved.listOfDocuments !== undefined ? saved.listOfDocuments : '',

      // 4. Physical Details
      boundaryEastDoc: saved.boundaryEastDoc !== undefined ? saved.boundaryEastDoc : (pf.boundaryEast || ''),
      boundaryEastVerif: saved.boundaryEastVerif !== undefined ? saved.boundaryEastVerif : (pf.boundaryEast || ''),
      boundaryWestDoc: saved.boundaryWestDoc !== undefined ? saved.boundaryWestDoc : (pf.boundaryWest || ''),
      boundaryWestVerif: saved.boundaryWestVerif !== undefined ? saved.boundaryWestVerif : (pf.boundaryWest || ''),
      boundaryNorthDoc: saved.boundaryNorthDoc !== undefined ? saved.boundaryNorthDoc : (pf.boundaryNorth || ''),
      boundaryNorthVerif: saved.boundaryNorthVerif !== undefined ? saved.boundaryNorthVerif : (pf.boundaryNorth || ''),
      boundarySouthDoc: saved.boundarySouthDoc !== undefined ? saved.boundarySouthDoc : (pf.boundarySouth || ''),
      boundarySouthVerif: saved.boundarySouthVerif !== undefined ? saved.boundarySouthVerif : (pf.boundarySouth || ''),

      matchingBoundaries: saved.matchingBoundaries !== undefined ? saved.matchingBoundaries : 'Yes/ No',
      plotDemarcated: saved.plotDemarcated !== undefined ? saved.plotDemarcated : 'Yes/ No',
      approvedLandUse: saved.approvedLandUse !== undefined ? saved.approvedLandUse : 'Residential',
      typeOfProperty: saved.typeOfProperty !== undefined ? saved.typeOfProperty : 'Land & Building',
      numberOfRoomsLiving: saved.numberOfRoomsLiving !== undefined ? saved.numberOfRoomsLiving : '',
      numberOfRoomsBed: saved.numberOfRoomsBed !== undefined ? saved.numberOfRoomsBed : '',
      numberOfRoomsToilets: saved.numberOfRoomsToilets !== undefined ? saved.numberOfRoomsToilets : '',
      numberOfRoomsKitchens: saved.numberOfRoomsKitchens !== undefined ? saved.numberOfRoomsKitchens : '',
      totalNumberOfFloors: saved.totalNumberOfFloors !== undefined ? saved.totalNumberOfFloors : '',
      areaPropertyLocated: saved.areaPropertyLocated !== undefined ? saved.areaPropertyLocated : '',
      yearOfOccupancy: saved.yearOfOccupancy !== undefined ? saved.yearOfOccupancy : '',
      approxAgeProperty: saved.approxAgeProperty !== undefined ? saved.approxAgeProperty : '',
      residualLifeProperty: saved.residualLifeProperty !== undefined ? saved.residualLifeProperty : '',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame',

      // 5. Tenure / Occupancy
      statusOfTenure: saved.statusOfTenure !== undefined ? saved.statusOfTenure : 'Owned/ Rented (Under Construction)',
      numberOfYearsOccupancy: saved.numberOfYearsOccupancy !== undefined ? saved.numberOfYearsOccupancy : 'NA',
      relationshipTenantOwner: saved.relationshipTenantOwner !== undefined ? saved.relationshipTenantOwner : 'NA',

      // 6. Stage of construction
      stageOfConstruction: saved.stageOfConstruction !== undefined ? saved.stageOfConstruction : '',
      underConstructionExtent: saved.underConstructionExtent !== undefined ? saved.underConstructionExtent : 'Not Applicable',

      // 7. Violations
      natureExtentViolations: saved.natureExtentViolations !== undefined ? saved.natureExtentViolations : '',

      // 8. Area details
      siteAreaText: saved.siteAreaText !== undefined ? saved.siteAreaText : '',
      carpetAreaText: saved.carpetAreaText !== undefined ? saved.carpetAreaText : '',
      saleableAreaText: saved.saleableAreaText !== undefined ? saved.saleableAreaText : '',
      plinthAreaApprovalText: saved.plinthAreaApprovalText !== undefined ? saved.plinthAreaApprovalText : '',
      plinthAreaActualText: saved.plinthAreaActualText !== undefined ? saved.plinthAreaActualText : '',

      // 9. Valuation
      landRateAdoptedText: saved.landRateAdoptedText !== undefined ? saved.landRateAdoptedText : '',
      tirQualificationsMitigation: saved.tirQualificationsMitigation !== undefined ? saved.tirQualificationsMitigation : (saved.tirQualifications || 'NIL / Clear TIR obtained without any adverse observations'),
      sarfaesiCompliant: saved.sarfaesiCompliant !== undefined ? saved.sarfaesiCompliant : 'Yes',
      socialInfrastructure: saved.socialInfrastructure !== undefined ? saved.socialInfrastructure : 'No',
      entireLandMortgaged: saved.entireLandMortgaged !== undefined ? saved.entireLandMortgaged : 'Yes',
      lastTwoTransactionsDetails: saved.lastTwoTransactionsDetails !== undefined ? saved.lastTwoTransactionsDetails : '',
      variationJustification20Pct: saved.variationJustification20Pct !== undefined ? saved.variationJustification20Pct : '',
      otherRelevantAspects: saved.otherRelevantAspects !== undefined ? saved.otherRelevantAspects : '',

      // 10. Remarks
      generalRemarksText: saved.generalRemarksText !== undefined ? saved.generalRemarksText : '',

      // 10 & 11 Declaration & Valuer Details
      inspectionDate: saved.inspectionDate !== undefined ? saved.inspectionDate : (saved.dateOfInspection || (earliestVisit ? formatReportDate(earliestVisit.date) : '')),
      valuerDeclarations: saved.valuerDeclarations || {},
      declarationText: saved.declarationText !== undefined ? saved.declarationText : '',

      // 12. Valuer Details
      valuerNameAndAddress: saved.valuerNameAndAddress !== undefined ? saved.valuerNameAndAddress : 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018',
      valuerWealthTaxReg: saved.valuerWealthTaxReg !== undefined ? saved.valuerWealthTaxReg : '107/2016-17 of Category-I',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || (earliestVisit ? formatReportDate(earliestVisit.date) : '')),

      // 13 & 14 Enclosures
      listDocumentsEnclosed: saved.listDocumentsEnclosed || 'Valuation Report, Benchmark Valuation, GPS Map, Photographs',
      listPhotosEnclosed: saved.listPhotosEnclosed || 'Bed Room, Dinning, Drawing, Kitchen, Building with Road',

      // 15 Marketability
      marketabilityNarrative: saved.marketabilityNarrative || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & building method of valuation has been adopted for finding the fair market value of the property.',

      // Valuation Computation
      plinthAreaVal: saved.plinthAreaVal !== undefined ? saved.plinthAreaVal : '',
      roofHeightVal: saved.roofHeightVal !== undefined ? saved.roofHeightVal : '',
      ageVal: saved.ageVal !== undefined ? saved.ageVal : '',
      replacementRateVal: saved.replacementRateVal !== undefined ? saved.replacementRateVal : '',
      depreciationVal: saved.depreciationVal !== undefined ? saved.depreciationVal : '',

      // DETAILS OF VALUATION Grid
      valuationGridItems: saved.valuationGridItems || [],

      // Value of Property Abstract (4x4 Table with Ext Services)
      abstractGovtLand: saved.abstractGovtLand !== undefined ? saved.abstractGovtLand : '',
      abstractGovtBldg: saved.abstractGovtBldg !== undefined ? saved.abstractGovtBldg : '',
      abstractGovtExtra: saved.abstractGovtExtra !== undefined ? saved.abstractGovtExtra : '',
      abstractGovtTotal: saved.abstractGovtTotal !== undefined ? saved.abstractGovtTotal : '',
      abstractGovtOrSay: saved.abstractGovtOrSay !== undefined ? saved.abstractGovtOrSay : '',

      abstractMarketLand: saved.abstractMarketLand !== undefined ? saved.abstractMarketLand : '',
      abstractMarketBldg: saved.abstractMarketBldg !== undefined ? saved.abstractMarketBldg : '',
      abstractMarketExtra: saved.abstractMarketExtra !== undefined ? saved.abstractMarketExtra : '',
      abstractMarketTotal: saved.abstractMarketTotal !== undefined ? saved.abstractMarketTotal : '',
      abstractMarketOrSay: saved.abstractMarketOrSay !== undefined ? saved.abstractMarketOrSay : '',

      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractRealizableLand: saved.abstractRealizableLand !== undefined ? saved.abstractRealizableLand : '',
      abstractRealizableBldg: saved.abstractRealizableBldg !== undefined ? saved.abstractRealizableBldg : '',
      abstractRealizableExtra: saved.abstractRealizableExtra !== undefined ? saved.abstractRealizableExtra : '',
      abstractRealizableTotal: saved.abstractRealizableTotal !== undefined ? saved.abstractRealizableTotal : '',
      abstractRealizableOrSay: saved.abstractRealizableOrSay !== undefined ? saved.abstractRealizableOrSay : '',

      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',
      abstractDistressLand: saved.abstractDistressLand !== undefined ? saved.abstractDistressLand : '',
      abstractDistressBldg: saved.abstractDistressBldg !== undefined ? saved.abstractDistressBldg : '',
      abstractDistressExtra: saved.abstractDistressExtra !== undefined ? saved.abstractDistressExtra : '',
      abstractDistressTotal: saved.abstractDistressTotal !== undefined ? saved.abstractDistressTotal : '',
      abstractDistressOrSay: saved.abstractDistressOrSay !== undefined ? saved.abstractDistressOrSay : '',

      // ENCLOSURES & APPRAISAL STATEMENT
      encLayoutSketch: saved.encLayoutSketch !== undefined ? saved.encLayoutSketch : 'Enclosed',
      encBuildingPlan: saved.encBuildingPlan !== undefined ? saved.encBuildingPlan : 'Enclosed',
      encFloorPlan: saved.encFloorPlan !== undefined ? saved.encFloorPlan : 'Enclosed',
      encPhotographGeo: saved.encPhotographGeo !== undefined ? saved.encPhotographGeo : 'Enclosed',
      encCertifiedApprovedPlan: saved.encCertifiedApprovedPlan !== undefined ? saved.encCertifiedApprovedPlan : 'Enclosed',
      encGoogleMapCoords: saved.encGoogleMapCoords !== undefined ? saved.encGoogleMapCoords : 'Enclosed',
      encPriceTrendPortals: saved.encPriceTrendPortals !== undefined ? saved.encPriceTrendPortals : 'Enclosed',
      encGuidelineRateEvidence: saved.encGuidelineRateEvidence !== undefined ? saved.encGuidelineRateEvidence : 'Enclosed',
      encOtherDocuments: saved.encOtherDocuments !== undefined ? saved.encOtherDocuments : 'No',

      finalAppraisalText: saved.finalAppraisalText !== undefined ? saved.finalAppraisalText : '',

      // SECTION 12: DECLARATION CUM UNDERTAKING FROM VALUERS
      sbiValuerDeclarationsMap: saved.sbiValuerDeclarationsMap || saved.sbiValuerDeclarations || {},
      declarationSignDate: saved.declarationSignDate !== undefined ? saved.declarationSignDate : '',
      declarationSignPlace: saved.declarationSignPlace !== undefined ? saved.declarationSignPlace : '',

      // MODEL CODE OF CONDUCT FOR VALUERS
      sbiCodeOfConductChecks: saved.sbiCodeOfConductChecks || {},
      conductSignDate: saved.conductSignDate !== undefined ? saved.conductSignDate : '',
      conductSignPlace: saved.conductSignPlace !== undefined ? saved.conductSignPlace : '',

      // JUSTIFICATION OF VALUATION REPORT
      justificationBankAddress: saved.justificationBankAddress || saved.sbiJustificationBankAddress || '',
      justificationLetterSubject: saved.justificationLetterSubject || saved.sbiJustificationSubject || '',
      justificationPropertyDesc: saved.justificationPropertyDesc || saved.sbiJustificationPropertyDesc || '',
      justificationLetterBody: saved.justificationLetterBody !== undefined ? saved.justificationLetterBody : (saved.sbiJustificationStatement || undefined),
      justificationSignDate: saved.justificationSignDate !== undefined ? saved.justificationSignDate : '',
      justificationSignPlace: saved.justificationSignPlace !== undefined ? saved.justificationSignPlace : '',

      // Attachments
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

  // ── Auto-Calculate Valuation Computations & Totals ──
  useEffect(() => {
    const landMarket = parseNum(fields.abstractMarketLand);
    const bldgMarket = parseNum(fields.abstractMarketBldg);
    const extraMarket = parseNum(fields.abstractMarketExtra);
    const totalMarket = landMarket + bldgMarket + extraMarket;

    const landGovt = parseNum(fields.abstractGovtLand);
    const bldgGovt = parseNum(fields.abstractGovtBldg);
    const extraGovt = parseNum(fields.abstractGovtExtra);
    const totalGovt = landGovt + bldgGovt + extraGovt;

    const rPct = parsePct(fields.abstractRealizablePct, 100);
    const dPct = parsePct(fields.abstractDistressPct, 100);

    const realLand = Math.round((landMarket * rPct) / 100);
    const realBldg = Math.round((bldgMarket * rPct) / 100);
    const realExtra = Math.round((extraMarket * rPct) / 100);
    const totalReal = realLand + realBldg + realExtra;

    const distLand = Math.round((landMarket * dPct) / 100);
    const distBldg = Math.round((bldgMarket * dPct) / 100);
    const distExtra = Math.round((extraMarket * dPct) / 100);
    const totalDist = distLand + distBldg + distExtra;

    setFields((prev: any) => ({
      ...prev,
      abstractGovtTotal: totalGovt > 0 ? `Rs. ${formatIndianCurrency(totalGovt)}` : prev.abstractGovtTotal,
      abstractMarketTotal: totalMarket > 0 ? `Rs. ${formatIndianCurrency(totalMarket)}` : prev.abstractMarketTotal,
      abstractRealizableLand: realLand > 0 ? `Rs. ${formatIndianCurrency(realLand)}` : prev.abstractRealizableLand,
      abstractRealizableBldg: realBldg > 0 ? `Rs. ${formatIndianCurrency(realBldg)}` : prev.abstractRealizableBldg,
      abstractRealizableExtra: realExtra > 0 ? `Rs. ${formatIndianCurrency(realExtra)}` : prev.abstractRealizableExtra,
      abstractRealizableTotal: totalReal > 0 ? `Rs. ${formatIndianCurrency(totalReal)}` : prev.abstractRealizableTotal,
      abstractDistressLand: distLand > 0 ? `Rs. ${formatIndianCurrency(distLand)}` : prev.abstractDistressLand,
      abstractDistressBldg: distBldg > 0 ? `Rs. ${formatIndianCurrency(distBldg)}` : prev.abstractDistressBldg,
      abstractDistressExtra: distExtra > 0 ? `Rs. ${formatIndianCurrency(distExtra)}` : prev.abstractDistressExtra,
      abstractDistressTotal: totalDist > 0 ? `Rs. ${formatIndianCurrency(totalDist)}` : prev.abstractDistressTotal,
    }));
  }, [
    fields.abstractMarketLand,
    fields.abstractMarketBldg,
    fields.abstractMarketExtra,
    fields.abstractGovtLand,
    fields.abstractGovtBldg,
    fields.abstractGovtExtra,
    fields.abstractRealizablePct,
    fields.abstractDistressPct,
  ]);

  const handleSaveInternal = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        ...fields,
        clientType: 'organisation',
        organisationTemplate: 'STATE BANK OF INDIA-SBI',
        organisationSubTemplate: 'Land & Building',
        institutionCategory: 'Bank & FIS',
        propertyValuationType: 'LAND_AND_BUILDING',
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
      const mappedValItems = (fields.valuationGridItems && fields.valuationGridItems.length > 0)
        ? fields.valuationGridItems.map((it: any) => ({
            particulars: it.plotNo || '',
            plinthArea: it.area || '',
            roofHeight: "10'-6\"",
            age: 'New',
            rate: `Rs. ${it.rate || ''}`,
            cost: `Rs. ${formatIndianCurrency(parseFloat(it.totalValue) || 0)}`,
            depreciation: 'Rs. 0.00',
            netValue: `Rs. ${formatIndianCurrency(parseFloat(it.totalValue) || 0)}`
          }))
        : undefined;
      const renderFields = { ...fields, valItems: mappedValItems || fields.valItems };
      const renderer = new PDFSBILandAndBuildingRenderer(renderFields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SBI_Land_And_Building_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating SBI Land & Building PDF:', e);
    }
  };

  const handlePreviewPdfInternal = async () => {
    try {
      const mappedValItems = (fields.valuationGridItems && fields.valuationGridItems.length > 0)
        ? fields.valuationGridItems.map((it: any) => ({
            particulars: it.plotNo || '',
            plinthArea: it.area || '',
            roofHeight: "10'-6\"",
            age: 'New',
            rate: `Rs. ${it.rate || ''}`,
            cost: `Rs. ${formatIndianCurrency(parseFloat(it.totalValue) || 0)}`,
            depreciation: 'Rs. 0.00',
            netValue: `Rs. ${formatIndianCurrency(parseFloat(it.totalValue) || 0)}`
          }))
        : undefined;
      const renderFields = { ...fields, valItems: mappedValItems || fields.valItems };
      const renderer = new PDFSBILandAndBuildingRenderer(renderFields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Error generating SBI Land & Building PDF Preview:', e);
      alert('Error generating PDF preview.');
    }
  };

  const handleSubmitInternal = async () => {
    if (!projectId || isReadOnly) return;
    if (!confirm('Are you sure you want to submit this report for manager verification?')) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        ...fields,
        clientType: 'organisation',
        organisationTemplate: 'STATE BANK OF INDIA-SBI',
        organisationSubTemplate: 'Land & Building',
        institutionCategory: 'Bank & FIS',
        propertyValuationType: 'LAND_AND_BUILDING',
        reportData: fields,
      });
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        alert(`Failed to submit report: ${res.error}`);
      } else {
        alert('Report submitted successfully to Manager!');
        router.refresh();
      }
    } catch (e: any) {
      console.error('Failed to submit report', e);
      alert(`Error submitting report: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Auto-calculated values for COVER PAGE ──
  const systemCurrentDate = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }, []);

  const totalMarketVal = useMemo(() => {
    const landMarket = parseNum(fields.abstractMarketLand);
    const bldgMarket = parseNum(fields.abstractMarketBldg);
    return landMarket + bldgMarket;
  }, [fields.abstractMarketLand, fields.abstractMarketBldg]);

  const presentMarketValueStr = useMemo(() => {
    return `Rs. ${formatIndianCurrency(totalMarketVal)}/-`;
  }, [totalMarketVal]);

  const realizableValueStr = useMemo(() => {
    const rVal = Math.round(totalMarketVal * 0.95);
    return `Rs. ${formatIndianCurrency(rVal)}/-`;
  }, [totalMarketVal]);

  const forcedSaleValueStr = useMemo(() => {
    const fVal = Math.round(totalMarketVal * 0.85);
    return `Rs. ${formatIndianCurrency(fVal)}/-`;
  }, [totalMarketVal]);

  const approxAgeStr = useMemo(() => {
    const curYear = new Date().getFullYear();
    const occYear = parseInt(String(fields.yearOfOccupancy || '2024').replace(/[^0-9]/g, '')) || 2024;
    const diff = Math.max(0, curYear - occYear);
    return diff === 0 ? '0 Years (New)' : `${diff} Years`;
  }, [fields.yearOfOccupancy]);

  const systemValuerProfileDetails = useMemo(() => {
    return 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018';
  }, []);

  const DECLARATIONS_LIST = [
    { id: '1', text: `The property was inspected by the undersigned${(fields.inspectionDate || fields.signatureDate) ? ` on ${fields.inspectionDate || fields.signatureDate}` : ''}.` },
    { id: '2', text: 'The undersigned does not have any direct or indirect interest in the above property.' },
    { id: '3', text: 'The information furnished herein is true and correct to the best of our knowledge.' },
    { id: '4', text: 'I am a citizen of India and registered valuer with Insolvency & Bankruptcy Board of India (IBBI).' },
    { id: '5', text: 'Valuation report is submitted in the format as prescribed by the Bank.' },
    { id: '6', text: 'I have not concealed or suppressed any material information, facts and records and have made a complete and full disclosure.' },
    { id: '7', text: 'I abide by the Model Code of Conduct for empanelment of Valuer in the Bank.' },
    { id: '8', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest during the prescribed period.' },
  ];

  const valuerDeclarationsMap = fields.valuerDeclarations || {};
  const isDeclChecked = (id: string) => valuerDeclarationsMap[id] !== false;
  const allDeclsChecked = DECLARATIONS_LIST.every(d => isDeclChecked(d.id));

  const handleToggleAllDecls = () => {
    const nextVal = !allDeclsChecked;
    const nextMap: Record<string, boolean> = {};
    DECLARATIONS_LIST.forEach(d => {
      nextMap[d.id] = nextVal;
    });
    handleChange('valuerDeclarations', nextMap);
  };

  const handleToggleDecl = (id: string, checked: boolean) => {
    handleChange('valuerDeclarations', { ...valuerDeclarationsMap, [id]: checked });
  };

  const autoAppraisalText = useMemo(() => {
    const spec = fields.valuationPropertyDesc || fields.propertyAddress || 'the subject property';
    const mVal = fields.abstractMarketOrSay || fields.abstractMarketTotal || presentMarketValueStr;
    const rVal = fields.abstractRealizableOrSay || fields.abstractRealizableTotal || realizableValueStr;
    const fVal = fields.abstractDistressOrSay || fields.abstractDistressTotal || forcedSaleValueStr;
    return `As a result of physical inspection, appraisal and analysis of ${spec}, it is our considered opinion that the PRESENT MARKET VALUE of the property is ${mVal}. The REALIZABLE VALUE is ${rVal} and the FORCED SALE VALUE is ${fVal}.`;
  }, [
    fields.valuationPropertyDesc,
    fields.propertyAddress,
    fields.abstractMarketOrSay,
    fields.abstractMarketTotal,
    presentMarketValueStr,
    fields.abstractRealizableOrSay,
    fields.abstractRealizableTotal,
    realizableValueStr,
    fields.abstractDistressOrSay,
    fields.abstractDistressTotal,
    forcedSaleValueStr,
  ]);

  const ENCLOSURES_ITEMS = [
    { key: 'encLayoutSketch', id: 'a)', text: 'Layout plan sketch of the area in which the property is located with latitude and longitude' },
    { key: 'encBuildingPlan', id: 'b)', text: 'Building Plan' },
    { key: 'encFloorPlan', id: 'c)', text: 'Floor Plan' },
    { key: 'encPhotographGeo', id: 'd)', text: "Photograph of the property (including geo-stamping with date) and owner (in case of housing loans, if borrower is available) including a 'Selfie' of the Valuer at the site" },
    { key: 'encCertifiedApprovedPlan', id: 'e)', text: 'Certified copy of the approved / sanctioned plan wherever applicable from the concerned office' },
    { key: 'encGoogleMapCoords', id: 'f)', text: 'Google Map location of the property and Longitude/Latitude and co-ordinates of the property' },
    { key: 'encPriceTrendPortals', id: 'g)', text: 'Price trend of the Property in the locality/city from property search sites viz Magickbricks.com, 99Acres.com, Makan.com etc' },
    { key: 'encGuidelineRateEvidence', id: 'h)', text: 'Guideline rate mentioned in the valuation report must be supported by documentary evidence i.e. latest guideline rate published in district website, Registrar Office etc should be printed and signed by the concerned valuer as an evidence of authenticity' },
    { key: 'encOtherDocuments', id: 'i)', text: 'Any other relevant documents/ extracts' },
  ];

  const handleAddValuationItem = () => {
    const next = [...(fields.valuationGridItems || [])];
    next.push({
      plotNo: `Block-1: Item ${next.length + 1}`,
      area: '500.00',
      rate: '1500.00',
      totalValue: '750000',
    });
    handleChange('valuationGridItems', next);
  };

  const handleUpdateValuationItem = (index: number, key: string, value: string) => {
    const next = [...(fields.valuationGridItems || [])];
    const row = { ...next[index], [key]: value };
    if (key === 'area' || key === 'rate') {
      const a = parseFloat(String(key === 'area' ? value : row.area).replace(/[^0-9.]/g, '')) || 0;
      const r = parseFloat(String(key === 'rate' ? value : row.rate).replace(/[^0-9.]/g, '')) || 0;
      row.totalValue = String(Math.round(a * r));
    }
    next[index] = row;
    handleChange('valuationGridItems', next);
  };

  const handleDeleteValuationItem = (index: number) => {
    const next = (fields.valuationGridItems || []).filter((_: any, i: number) => i !== index);
    handleChange('valuationGridItems', next);
  };

  const totalValuationGridAmount = useMemo(() => {
    return (fields.valuationGridItems || []).reduce((acc: number, it: any) => {
      const val = parseFloat(String(it.totalValue || '0').replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
    }, 0);
  }, [fields.valuationGridItems]);

  const totalValuationGridArea = useMemo(() => {
    return (fields.valuationGridItems || []).reduce((acc: number, it: any) => {
      const a = parseFloat(String(it.area || '0').replace(/[^0-9.]/g, '')) || 0;
      return acc + a;
    }, 0);
  }, [fields.valuationGridItems]);

  // ── Section 12: DECLARATION CUM UNDERTAKING FROM VALUERS (Clauses a to z) ──
  const DECLARATION_STATEMENTS_A_TO_Z: { id: string; text: string }[] = useMemo(() => [
    { id: 'a', text: 'I am citizen of India.' },
    { id: 'b', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
    { id: 'c', text: `The information furnished in my valuation report${(fields.coverDate || fields.reportDate) ? ` dated ${fields.coverDate || fields.reportDate}` : ''} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
    { id: 'd', text: `I have personally inspected the property${(fields.inspectionDate || fields.signatureDate) ? ` on ${fields.inspectionDate || fields.signatureDate}` : ''} & I have valued the property which is identified by documents & help of customer. The work is not sub-contracted to any other valuer & carried out by myself.` },
    { id: 'e', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
    { id: 'f', text: 'I have not been depanelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
    { id: 'g', text: 'I have not been removed from service earlier.' },
    { id: 'h', text: 'I have not been convicted of any offence & sentenced to a term of imprisonment.' },
    { id: 'i', text: 'I have not been declared to be unsound mind.' },
    { id: 'j', text: 'I have not been found guilty of misconduct in my professional capacity.' },
    { id: 'k', text: 'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.' },
    { id: 'l', text: 'I have not undischarged insolvent.' },
    { id: 'm', text: 'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.' },
    { id: 'n', text: 'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.' },
    { id: 'o', text: `My PAN Card number as applicable is ${fields.valuerPan || 'AONPM6997B'}.` },
    { id: 'p', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
    { id: 'q', text: 'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure.' },
    { id: 'r', text: 'I have read the hand book on policy, standards & procedure for real Estate valuation, 2011 of the IBA & this report is in conformity to the "Standards" enshrined for valuation in the part -B of the above handbook to the best of my knowledge.' },
    { id: 's', text: 'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.' },
    { id: 't', text: 'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.' },
    { id: 'u', text: 'I am registered under Section 34 AB of the Wealth Tax Act, 1957.' },
    { id: 'v', text: 'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI)' },
    { id: 'w', text: "My CIBIL Score and credit worthiness is as per Bank's guidelines." },
    { id: 'x', text: 'I am the authorized official of the firm who is competent to sign this valuation report' },
    { id: 'y', text: 'I will undertake the valuation work on receipt of letter of Engagement generated from the System. (i.e. LLMS/LOS) only' },
    { id: 'z', text: 'Further, I hereby provide the following information.' },
  ], [fields.coverDate, fields.reportDate, fields.inspectionDate, fields.signatureDate, fields.valuerPan]);

  const declarationsAtoZMap = fields.sbiValuerDeclarationsMap || {};
  const isDeclarationChecked = (id: string) => declarationsAtoZMap[id] !== false;
  const allDeclarationsChecked = DECLARATION_STATEMENTS_A_TO_Z.every(s => isDeclarationChecked(s.id));

  const handleToggleAllDeclarations = () => {
    const nextVal = !allDeclarationsChecked;
    const nextMap: Record<string, boolean> = {};
    DECLARATION_STATEMENTS_A_TO_Z.forEach(s => {
      nextMap[s.id] = nextVal;
    });
    handleChange('sbiValuerDeclarationsMap', nextMap);
  };

  const handleToggleDeclarationStatement = (id: string, checked: boolean) => {
    handleChange('sbiValuerDeclarationsMap', { ...declarationsAtoZMap, [id]: checked });
  };

  // ── MODEL CODE OF CONDUCT FOR VALUERS (Points 1 to 30) ──
  const CODE_OF_CONDUCT_POINTS = [
    { num: 1, text: 'A Valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other Valuers.' },
    { num: 2, text: 'A Valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.' },
    { num: 3, text: 'A Valuer shall endeavor to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.' },
    { num: 4, text: 'A Valuer shall refrain from being involved in any action that would bring disrepute to the profession.' },
    { num: 5, text: 'A Valuer shall keep public interest foremost while delivering his services.' },
    { num: 6, text: 'A Valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.' },
    { num: 7, text: 'A Valuer shall carry out professional services in accordance with the relevant technical and professional standards that may be specified from time to time.' },
    { num: 8, text: 'A Valuer shall continuously maintain professional knowledge and skill to provide competent professional service based on up-to-date developments in practice, prevailing regulations/guidelines and techniques.' },
    { num: 9, text: 'In the preparation of a valuation report, the Valuer shall not disclaim liability for his/its expertise or deny his/its duty of care, except to the extent that the assumptions are based on statements of fact provided by the company or its auditors or consultants or information available in public domain and not generated by the Valuer.' },
    { num: 10, text: 'A Valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.' },
    { num: 11, text: 'A Valuer shall clearly state to his client the services that he would be competent to provide and the services for which he would be relying on other Valuers or professionals or for which the client can have a separate arrangement with other Valuers.' },
    { num: 12, text: 'A Valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.' },
    { num: 13, text: 'A Valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent in terms of association to the company.' },
    { num: 14, text: 'A Valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.' },
    { num: 15, text: 'A Valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.' },
    { num: 16, text: 'A Valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation, and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.' },
    { num: 17, text: 'A Valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client\'s needs.' },
    { num: 18, text: 'As an independent Valuer, the Valuer shall not charge success fee (Success fees may be defined as a compensation / incentive paid to any third party for successful closure of transaction. In this case, approval of credit proposals).' },
    { num: 19, text: 'In any fairness opinion or independent expert opinion submitted by a Valuer, if there has been a prior engagement in an unconnected transaction, the Valuer shall declare the association with the company during the last five years.' },
    { num: 20, text: 'A Valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.' },
    { num: 21, text: 'A Valuer shall ensure that he/it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.' },
    { num: 22, text: 'A Valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorized by the authority, the registered values\' organization with which he/it is registered or any other statutory regulatory body.' },
    { num: 23, text: 'A Valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organization with which he/it is registered, or any other statutory regulatory body.' },
    { num: 24, text: 'A Valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.' },
    { num: 25, text: 'A Valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a Valuer. Explanation — For the purposes of this code the term "relative" shall have the same meaning as Defined in clause (77) of Section 2 of the Companies Act, 2013 (18 of 2013).' },
    { num: 26, text: 'A Valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.' },
    { num: 27, text: 'A Valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.' },
    { num: 28, text: 'A Valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service.' },
    { num: 29, text: 'A Valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/its assignments.' },
    { num: 30, text: 'A Valuer shall not conduct business which in the opinion of the authority or the registered Valuer organization discredits the profession.' },
  ];

  const conductChecksMap = fields.sbiCodeOfConductChecks || {};
  const isConductChecked = (num: number) => conductChecksMap[num] !== false;
  const allConductChecked = CODE_OF_CONDUCT_POINTS.every(p => isConductChecked(p.num));

  const handleToggleAllConduct = () => {
    const nextVal = !allConductChecked;
    const nextMap: Record<number, boolean> = {};
    CODE_OF_CONDUCT_POINTS.forEach(p => {
      nextMap[p.num] = nextVal;
    });
    handleChange('sbiCodeOfConductChecks', nextMap);
  };

  const handleToggleConduct = (num: number, checked: boolean) => {
    handleChange('sbiCodeOfConductChecks', { ...conductChecksMap, [num]: checked });
  };

  // ── JUSTIFICATION OF VALUATION REPORT Memos ──
  const fallbackJustificationBankAddress = useMemo(() => {
    const branchInfo = fields.branchAddressDetails || fields.branchAddress || 'SAMBALPUR MAIN BRANCH, DIST: SAMBALPUR, ODISHA';
    return `TO,\nTHE CHIEF MANAGER / BRANCH HEAD,\n${fields.bankName || 'STATE BANK OF INDIA,'}\n${branchInfo}`;
  }, [fields.branchAddressDetails, fields.branchAddress, fields.bankName]);

  const autoJustificationSub = useMemo(() => {
    const ownerNameStr = fields.ownerName || fields.borrowerName || fields.saleDeedExecutedName || '';
    return ownerNameStr ? `Sub: - Justification of valuation Report of ${ownerNameStr}.` : 'Sub: - Justification of valuation Report.';
  }, [fields.ownerName, fields.borrowerName, fields.saleDeedExecutedName]);

  const autoPropertyDescBlock = useMemo(() => {
    const kNo = fields.khataNo || '';
    const pNo = fields.plotNo || '';
    const area = fields.extentOfLand || fields.siteArea || '';
    const m = fields.mouza || '';
    const ps = fields.policeStation || '';
    const tah = fields.tahasil || '';
    const dist = fields.district || '';
    return `The subject property bearing Khata No: ${kNo}, Plot No: ${pNo}, Area: ${area}, Mouza: ${m}, Ps: ${ps}, Tahasil: ${tah}, Dist: ${dist}, Odisha.`;
  }, [
    fields.khataNo,
    fields.plotNo,
    fields.extentOfLand,
    fields.siteArea,
    fields.mouza,
    fields.policeStation,
    fields.tahasil,
    fields.district,
  ]);

  const defaultJustificationTemplate = useMemo(() => {
    return 'The subject property is located in a well-developed residential area. There is a substantial difference between Govt. Benchmark Value and Market Value as Govt. Benchmark rates have not been revised recently for this locality. Furthermore, to avoid high stamp duty and registration charges, sale deeds in the area are commonly executed at under-valued rates.\n\nHence, the market value arrived at in this report is fully justified considering the prime location, infrastructure development, high commercial/residential demand, and prevailing realistic market transactions in the vicinity.';
  }, []);

  const NAV_SECTIONS: NavItem[] = [
    { id: 'sbi-lb-cover-and-customer', title: 'Cover Page & Bank Details' },
    { id: 'sbi-lb-sec-2', title: 'Property Details' },
    { id: 'sbi-lb-sec-3', title: 'Document Details' },
    { id: 'sbi-lb-sec-4', title: 'Physical Details' },
    { id: 'sbi-lb-sec-5', title: 'Tenure & Occupancy Details' },
    { id: 'sbi-lb-sec-6', title: 'Stage of Construction' },
    { id: 'sbi-lb-sec-7', title: 'Violations Observed' },
    { id: 'sbi-lb-sec-8', title: 'Area Details of Property' },
    { id: 'sbi-lb-sec-9', title: 'Valuation & Rates' },
    { id: 'sbi-lb-sec-10', title: 'Declaration & Valuer Details' },
    { id: 'sbi-lb-sec-11', title: 'DETAILS OF VALUATION & TOTAL ABSTRACT' },
    { id: 'sbi-lb-sec-12', title: 'DECLARATION CUM UNDERTAKING FROM VALUERS' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'section-photographs', title: 'Photographs' },
  ];

  return (
    <div className="space-y-6 pb-24 w-full">
      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Universal Bank Report Header */}
          <BankReportHeader
            bankName="State Bank of India (SBI)"
            subclass="Land & Building (Below 5CR)"
            formatName="SBI Valuation Format (Land & Building)"
            clientType="organisation"
            category={fields.institutionCategory || 'Bank & FIS'}
            serviceType={fields.serviceType || 'Mortgage & Loan Security Valuation'}
            subjectType={fields.subjectType || 'Land & Building'}
            onResetWizard={onResetWizard}
            earliestVisit={earliestVisit}
            projectCode={projectCode}
          />

{/* ── Section 1: COVER PAGE & BANK DETAILS ── */}
      <Section id="sbi-lb-cover-and-customer" title="Cover Page & Bank Details" number={1} defaultOpen={true}>
        <div className="space-y-6">
          {/* Container 1: COVER PAGE & BANK DETAILS (Color: Light Gray #f5f5f5) */}
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-gray-300">
            {/* Header Title inside light gray box */}
            <div className="border-b border-gray-300 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                COVER PAGE & BANK DETAILS
              </h3>
              <span className="text-[11px] font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-300">
                Bank Details & Valuation Summary
              </span>
            </div>

            {/* REPORT ON VALUATION OF & AS ON DATE: */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="REPORT ON VALUATION OF">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.reportOnValuationOf || ''}
                  onChange={e => handleChange('reportOnValuationOf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. LAND & BUILDING"
                />
              </Field>

              <PrefillField
                label="AS ON DATE:"
                value={fields.asOnDate}
                onChange={(val: string) => {
                  handleChange('asOnDate', val);
                  if (!fields.coverDate) {
                    handleChange('coverDate', val);
                  }
                }}
                isReadOnly={isReadOnly}
                tooltip=">>Auto calculating from [System Current Date]<<"
                fallbackValue={systemCurrentDate}
              />
            </div>

            {/* STATE BANK OF INDIA, [Branch Address Details] */}
            <Field label="STATE BANK OF INDIA, [Branch Address Details]">
              <textarea
                className={inputCls}
                rows={2}
                value={fields.branchAddressDetails || ''}
                onChange={e => {
                  handleChange('branchAddressDetails', e.target.value);
                  handleChange('branchAddress', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. BALUGAON BRANCH, DIST: KHURDA, ODISHA"
              />
            </Field>

            {/* TO, REF. NO: & DATE: */}
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="TO,">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.toAuthority || ''}
                  onChange={e => handleChange('toAuthority', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. THE CHIEF MANAGER / BRANCH HEAD,"
                />
              </Field>

              <Field label="REF. NO:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || ''}
                  onChange={e => handleChange('refNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. SMA/IDBI/07-2026/09"
                />
              </Field>

              <PrefillField
                label="DATE:"
                value={fields.coverDate}
                onChange={(val: string) => {
                  handleChange('coverDate', val);
                  handleChange('reportDate', val);
                }}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "AS ON DATE:"<<'
                fallbackValue={fields.asOnDate || systemCurrentDate}
              />
            </div>

            {/* VALUATION OF LAND & BUILDING BEARING KHATA NO: */}
            <Field label="VALUATION OF LAND & BUILDING BEARING KHATA NO:">
              <textarea
                className={inputCls}
                rows={3}
                value={fields.valuationPropertyDesc || ''}
                onChange={e => {
                  handleChange('valuationPropertyDesc', e.target.value);
                  handleChange('propertyAddress', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. Khata No: 311/2959, Plot No: 765/2546, Sub Plot No: 1151 & 1152, Total Area: Ac.0.055 Dec i.e. 2400.00 Sft..."
              />
            </Field>

            {/* NAME OF THE OWNER */}
            <Field label="NAME OF THE OWNER">
              <input
                type="text"
                className={inputCls}
                value={fields.nameOfTheOwner || ''}
                onChange={e => {
                  const val = e.target.value;
                  handleChange('nameOfTheOwner', val);
                  handleChange('borrowerName', val);
                  handleChange('ownerNameAndAddress', val);
                  if (!fields.customerBorrowalUnit || fields.customerBorrowalUnit === fields.nameOfTheOwner) {
                    handleChange('customerBorrowalUnit', val);
                  }
                  if (!fields.customerOwnerName || fields.customerOwnerName === fields.nameOfTheOwner) {
                    handleChange('customerOwnerName', val);
                  }
                }}
                disabled={isReadOnly}
                placeholder="e.g. Mr. Dipak Kumar Barik"
              />
            </Field>

            {/* PRESENT MARKET VALUE, REALIZABLE VALUE, FORCED SALE VALUE */}
            <div className="grid md:grid-cols-3 gap-4">
              <PrefillField
                label="PRESENT MARKET VALUE"
                value={fields.presentMarketValue}
                onChange={(val: string) => handleChange('presentMarketValue', val)}
                isReadOnly={isReadOnly}
                tooltip=">>Auto calculating from [Total Market Value of Land + Depreciated Value of Building]<<"
                fallbackValue={presentMarketValueStr}
              />

              <PrefillField
                label="REALIZABLE VALUE"
                value={fields.realizableValue}
                onChange={(val: string) => handleChange('realizableValue', val)}
                isReadOnly={isReadOnly}
                tooltip=">>Auto calculating from [PRESENT MARKET VALUE * 0.95]<<"
                fallbackValue={realizableValueStr}
              />

              <PrefillField
                label="FORCED SALE VALUE"
                value={fields.forcedSaleValue}
                onChange={(val: string) => handleChange('forcedSaleValue', val)}
                isReadOnly={isReadOnly}
                tooltip=">>Auto calculating from [PRESENT MARKET VALUE * 0.85]<<"
                fallbackValue={forcedSaleValueStr}
              />
            </div>

            {/* GOVT. VALUE & PURPOSE : */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="GOVT. VALUE">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.govtValue || ''}
                  onChange={e => handleChange('govtValue', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 2891850"
                />
              </Field>

              <PrefillField
                label="PURPOSE :"
                value={fields.purposeOfValuation}
                onChange={(val: string) => handleChange('purposeOfValuation', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Auto calculating from ["TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY"]<<'
                fallbackValue="TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY"
              />
            </div>
          </div>

          {/* Container 2: 1 Customer Details (Color: Light Blue #e3f2fd) */}
          <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-blue-200">
            {/* Header Title inside light blue box */}
            <div className="border-b border-blue-300 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wider">
                1 Customer Details
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                Borrowal Unit & Applicant Information
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Name of Customer(s)/Borrowal Unit: */}
              <PrefillField
                label="Name of Customer(s)/Borrowal Unit:"
                value={fields.customerBorrowalUnit}
                onChange={(val: string) => {
                  handleChange('customerBorrowalUnit', val);
                  handleChange('borrowerName', val);
                }}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "NAME OF THE OWNER"<<'
                fallbackValue={fields.nameOfTheOwner || fields.borrowerName || ''}
              />

              {/* Name of the Owner */}
              <PrefillField
                label="Name of the Owner"
                value={fields.customerOwnerName}
                onChange={(val: string) => {
                  handleChange('customerOwnerName', val);
                  handleChange('nameOfTheOwner', val);
                  handleChange('ownerNameAndAddress', val);
                }}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "NAME OF THE OWNER"<<'
                fallbackValue={fields.nameOfTheOwner || fields.borrowerName || ''}
              />
            </div>

            {/* Appl. No. */}
            <Field label="Appl. No.">
              <input
                type="text"
                className={inputCls}
                value={fields.applicationNo || ''}
                onChange={e => handleChange('applicationNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Not Available / Appl-123456"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Property Details ── */}
      <Section id="sbi-lb-sec-2" title="Property Details" number={2} defaultOpen={true}>
        <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-emerald-200">
          {/* Header Title inside light green box */}
          <div className="border-b border-emerald-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-emerald-900 text-sm uppercase tracking-wider">
              2 Property Details
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              Property Identification & Access
            </span>
          </div>

          {/* Address */}
          <Field label="Address">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.propertyAddress || ''}
              onChange={e => {
                handleChange('propertyAddress', e.target.value);
                handleChange('valuationPropertyDesc', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Khata No: 311/2959, Plot No: 765/2546, Sub Plot No: 1151 & 1152, Total Area: Ac.0.055 Dec i.e. 2400.00 Sft, Kissam: Gharabari in Mz: Kantilo, Ps: Airfield No-53, Ts: Jatani No-196, Dist: Khurda, Odisha. Pin-751002"
            />
          </Field>

          {/* Nearby Landmark/Google Map Independent access to the property */}
          <Field label="Nearby Landmark/Google Map Independent access to the property">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.nearbyLandmark || ''}
              onChange={e => handleChange('nearbyLandmark', e.target.value)}
              disabled={isReadOnly}
              placeholder="The subject property is situated back side of Subhasri Villa Apartment, Kantilo"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Document Details ── */}
      <Section id="sbi-lb-sec-3" title="Document Details" number={3} defaultOpen={true}>
        <div style={{ backgroundColor: '#fffde7', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-amber-200">
          {/* Header Title inside light yellow box */}
          <div className="border-b border-amber-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider">
              3 Document Details
            </h3>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              Statutory Approvals & Permissions
            </span>
          </div>

          {/* Layout plan (Yes/ No, Name of approving authority, Approval No.) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Layout plan (Yes/ No, Name of approving authority, Approval No.)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white/80 p-3 rounded-xl border border-amber-200">
              <div className="md:col-span-3">
                <label className="flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fields.layoutPlanAvailable === 'Yes' || fields.layoutPlanAvailable === true}
                    onChange={e => handleChange('layoutPlanAvailable', e.target.checked ? 'Yes' : 'No')}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Available: <strong className={fields.layoutPlanAvailable === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                      {fields.layoutPlanAvailable === 'Yes' ? 'Yes' : 'No'}
                    </strong>
                  </span>
                </label>
              </div>
              <div className="md:col-span-4">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.layoutPlanAuthority || ''}
                  onChange={e => handleChange('layoutPlanAuthority', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Name of approving authority"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.layoutPlanApprovalNo || ''}
                  onChange={e => handleChange('layoutPlanApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Approval No. & Date"
                />
              </div>
            </div>
          </div>

          {/* Building plan (Yes/ No) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Building plan (Yes/ No)
            </label>
            <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
              <label className="inline-flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                <input
                  type="checkbox"
                  checked={fields.buildingPlanAvailable === 'Yes' || fields.buildingPlanAvailable === true}
                  onChange={e => handleChange('buildingPlanAvailable', e.target.checked ? 'Yes' : 'No')}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                />
                <span className="text-xs font-medium text-slate-800">
                  Available: <strong className={fields.buildingPlanAvailable === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                    {fields.buildingPlanAvailable === 'Yes' ? 'Yes' : 'No'}
                  </strong>
                </span>
              </label>
            </div>
          </div>

          {/* Construction permission (Yes/ No, Name of approving authority, Approval No.) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Construction permission (Yes/ No, Name of approving authority, Approval No.)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white/80 p-3 rounded-xl border border-amber-200">
              <div className="md:col-span-3">
                <label className="flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fields.constructionPermissionAvailable === 'Yes' || fields.constructionPermissionAvailable === true}
                    onChange={e => handleChange('constructionPermissionAvailable', e.target.checked ? 'Yes' : 'No')}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Available: <strong className={fields.constructionPermissionAvailable === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                      {fields.constructionPermissionAvailable === 'Yes' ? 'Yes' : 'No'}
                    </strong>
                  </span>
                </label>
              </div>
              <div className="md:col-span-4">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionPermissionAuthority || ''}
                  onChange={e => handleChange('constructionPermissionAuthority', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Name of approving authority"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionPermissionApprovalNo || ''}
                  onChange={e => handleChange('constructionPermissionApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Approval No. & Date"
                />
              </div>
            </div>
          </div>

          {/* Legal documents (Yes/ No, Name of approving authority, Approval No.) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Legal documents (Yes/ No, Name of approving authority, Approval No.)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white/80 p-3 rounded-xl border border-amber-200">
              <div className="md:col-span-3">
                <label className="flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fields.legalDocumentsAvailable === 'Yes' || fields.legalDocumentsAvailable === true}
                    onChange={e => handleChange('legalDocumentsAvailable', e.target.checked ? 'Yes' : 'No')}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Available: <strong className={fields.legalDocumentsAvailable === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                      {fields.legalDocumentsAvailable === 'Yes' ? 'Yes' : 'No'}
                    </strong>
                  </span>
                </label>
              </div>
              <div className="md:col-span-4">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.legalDocumentsAuthority || ''}
                  onChange={e => handleChange('legalDocumentsAuthority', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Name of approving authority"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.legalDocumentsApprovalNo || ''}
                  onChange={e => handleChange('legalDocumentsApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Approval No. & Date"
                />
              </div>
            </div>
          </div>

          {/* List of documents */}
          <Field label="List of documents">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.listOfDocuments || ''}
              onChange={e => handleChange('listOfDocuments', e.target.value)}
              disabled={isReadOnly}
              placeholder="Xerox copy of Agreement for Sale, Sketch Map, Patta, Approval Letter"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Physical Details ── */}
      <Section id="sbi-lb-sec-4" title="Physical Details" number={4} defaultOpen={true}>
        <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-purple-200">
          {/* Header Title inside light purple box */}
          <div className="border-b border-purple-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wider">
              4 Physical Details
            </h3>
            <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-300">
              Physical Characteristics & Boundaries
            </span>
          </div>

          {/* Boundaries as per Document / Verification (East, West, North, South) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Boundaries as per Document / Verification (East, West, North, South)
            </label>
            <div className="bg-white/80 p-3 rounded-xl border border-purple-200 space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-purple-200">
                <span className="col-span-2">Direction</span>
                <span className="col-span-5">As per Document</span>
                <span className="col-span-5">As per Verification (Actual at Site)</span>
              </div>
              {[
                { dir: 'East', dKey: 'boundaryEastDoc', vKey: 'boundaryEastVerif' },
                { dir: 'West', dKey: 'boundaryWestDoc', vKey: 'boundaryWestVerif' },
                { dir: 'North', dKey: 'boundaryNorthDoc', vKey: 'boundaryNorthVerif' },
                { dir: 'South', dKey: 'boundarySouthDoc', vKey: 'boundarySouthVerif' },
              ].map(({ dir, dKey, vKey }) => (
                <div key={dir} className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-2 text-xs font-bold text-purple-950">{dir}</span>
                  <div className="col-span-5">
                    <textarea
                      rows={2}
                      className={inputCls + ' text-xs'}
                      value={fields[dKey] || ''}
                      onChange={e => handleChange(dKey, e.target.value)}
                      disabled={isReadOnly}
                      placeholder={`As per Document (${dir})`}
                    />
                  </div>
                  <div className="col-span-5">
                    <textarea
                      rows={2}
                      className={inputCls + ' text-xs'}
                      value={fields[vKey] || ''}
                      onChange={e => handleChange(vKey, e.target.value)}
                      disabled={isReadOnly}
                      placeholder={`Actual at site (${dir})`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matching of boundaries & Plot demarcated */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-3.5 rounded-xl border border-purple-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.matchingBoundaries === 'Yes' || fields.matchingBoundaries === true}
                  onChange={e => handleChange('matchingBoundaries', e.target.checked ? 'Yes' : 'No')}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Matching of boundaries: <strong className={fields.matchingBoundaries === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                    {fields.matchingBoundaries === 'Yes' ? 'Yes' : 'No'}
                  </strong>
                </span>
              </label>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-purple-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.plotDemarcated === 'Yes' || fields.plotDemarcated === true}
                  onChange={e => handleChange('plotDemarcated', e.target.checked ? 'Yes' : 'No')}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Plot demarcated: <strong className={fields.plotDemarcated === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                    {fields.plotDemarcated === 'Yes' ? 'Yes' : 'No'}
                  </strong>
                </span>
              </label>
            </div>
          </div>

          {/* Approved land use & Type of property (Plotted/ Flat) */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Approved land use">
              <input
                type="text"
                className={inputCls}
                value={fields.approvedLandUse || ''}
                onChange={e => handleChange('approvedLandUse', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Residential"
              />
            </Field>

            <Field label="Type of property (Plotted/ Flat)">
              <div className="flex gap-6 bg-white/80 p-2.5 rounded-xl border border-purple-200 h-10 items-center">
                {['Plotted', 'Flat'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="sbiLbTypeOfPropertyRadio"
                      value={type}
                      checked={(fields.typeOfProperty || 'Plotted').toLowerCase().includes(type.toLowerCase())}
                      onChange={e => handleChange('typeOfProperty', e.target.value)}
                      disabled={isReadOnly}
                      className="text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Number of rooms (Living/ Dining, Bed rooms, Toilets, Kitchens) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Number of rooms (Living/ Dining, Bed rooms, Toilets, Kitchens)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/80 p-3 rounded-xl border border-purple-200">
              <Field label="Living / Dining">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.numberOfRoomsLiving !== undefined ? String(fields.numberOfRoomsLiving).replace(/[^0-9]/g, '') : ''}
                  onChange={e => handleChange('numberOfRoomsLiving', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 2"
                />
              </Field>
              <Field label="Bed rooms">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.numberOfRoomsBed !== undefined ? String(fields.numberOfRoomsBed).replace(/[^0-9]/g, '') : ''}
                  onChange={e => handleChange('numberOfRoomsBed', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 5"
                />
              </Field>
              <Field label="Toilets">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.numberOfRoomsToilets !== undefined ? String(fields.numberOfRoomsToilets).replace(/[^0-9]/g, '') : ''}
                  onChange={e => handleChange('numberOfRoomsToilets', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 3"
                />
              </Field>
              <Field label="Kitchens">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.numberOfRoomsKitchens !== undefined ? String(fields.numberOfRoomsKitchens).replace(/[^0-9]/g, '') : ''}
                  onChange={e => handleChange('numberOfRoomsKitchens', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1"
                />
              </Field>
            </div>
          </div>

          {/* Total number of floors & Area on which the property is located */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Total number of floors">
              <input
                type="number"
                className={inputCls}
                value={fields.totalNumberOfFloors !== undefined ? String(fields.totalNumberOfFloors).replace(/[^0-9]/g, '') : ''}
                onChange={e => handleChange('totalNumberOfFloors', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 2"
              />
            </Field>

            <Field label="Area on which the property is located">
              <input
                type="text"
                className={inputCls}
                value={fields.areaPropertyLocated || ''}
                onChange={e => handleChange('areaPropertyLocated', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Kalyani Vihar Scheme"
              />
            </Field>
          </div>

          {/* Approx. age of the property, Residual life of the property, Type of structure */}
          <div className="grid md:grid-cols-3 gap-4">
            <PrefillField
              label="Approx. age of the property"
              value={fields.approxAgeProperty}
              onChange={(val: string) => handleChange('approxAgeProperty', val)}
              isReadOnly={isReadOnly}
              tooltip=">>Auto calculating from [Current Year - Year of Occupancy]<<"
              fallbackValue={approxAgeStr}
            />

            <Field label="Residual life of the property">
              <input
                type="number"
                className={inputCls}
                value={fields.residualLifeProperty !== undefined ? String(fields.residualLifeProperty).replace(/[^0-9]/g, '') : ''}
                onChange={e => handleChange('residualLifeProperty', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 65"
              />
            </Field>

            <Field label="Type of structure - RCC framed/ Stone">
              <select
                className={inputCls}
                value={fields.typeOfStructure || 'RCC framed'}
                onChange={e => handleChange('typeOfStructure', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="RCC framed">RCC framed</option>
                <option value="Stone">Stone</option>
                <option value="Load Bearing">Load Bearing</option>
                <option value="Steel Frame">Steel Frame</option>
                <option value="Composite Structure">Composite Structure</option>
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Tenure & Occupancy Details ── */}
      <Section id="sbi-lb-sec-5" title="Tenure & Occupancy Details" number={5} defaultOpen={true}>
        <div style={{ backgroundColor: '#e0f7fa', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-cyan-200">
          {/* Header Title inside light cyan box */}
          <div className="border-b border-cyan-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-cyan-900 text-sm uppercase tracking-wider">
              Tenure & Occupancy Details
            </h3>
            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-300">
              Occupancy & Tenancy Status
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Status of tenure (Owned/ Rented (Under Construction)) */}
            <Field label="Status of tenure (Owned/ Rented (Under Construction))">
              <select
                className={inputCls}
                value={fields.statusOfTenure || 'Owned/ Rented (Under Construction)'}
                onChange={e => handleChange('statusOfTenure', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Owned/ Rented (Under Construction)">Owned/ Rented (Under Construction)</option>
                <option value="Owned">Owned</option>
                <option value="Rented">Rented</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Self Occupied">Self Occupied</option>
                <option value="Vacant">Vacant</option>
              </select>
            </Field>

            {/* Number of years of occupancy */}
            <Field label="Number of years of occupancy">
              <input
                type="number"
                className={inputCls}
                value={fields.numberOfYearsOccupancy !== undefined && fields.numberOfYearsOccupancy !== 'NA' ? String(fields.numberOfYearsOccupancy).replace(/[^0-9]/g, '') : ''}
                onChange={e => handleChange('numberOfYearsOccupancy', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 5"
              />
            </Field>

            {/* Relationship of tenant to owner */}
            <Field label="Relationship of tenant to owner">
              <input
                type="text"
                className={inputCls}
                value={fields.relationshipTenantOwner || ''}
                onChange={e => handleChange('relationshipTenantOwner', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. NA / None"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 6: Stage of Construction ── */}
      <Section id="sbi-lb-sec-6" title="Stage of Construction" number={6} defaultOpen={true}>
        <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-orange-200">
          {/* Header Title inside light orange box */}
          <div className="border-b border-orange-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-orange-900 text-sm uppercase tracking-wider">
              Stage of Construction
            </h3>
            <span className="text-[11px] font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-300">
              Construction Progress
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Stage of construction */}
            <Field label="Stage of construction">
              <input
                type="text"
                className={inputCls}
                value={fields.stageOfConstruction || ''}
                onChange={e => handleChange('stageOfConstruction', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Ground Floor Completed (85%), First Floor Completed (80%)"
              />
            </Field>

            {/* If under construction, extent of completion */}
            <Field label="If under construction, extent of completion">
              <div className="relative">
                <input
                  type="text"
                  className={inputCls + ' pr-8'}
                  value={fields.underConstructionExtent || ''}
                  onChange={e => handleChange('underConstructionExtent', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 80% / Not Applicable"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-semibold text-orange-600/70">
                  %
                </span>
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 7: Violations Observed ── */}
      <Section id="sbi-lb-sec-7" title="Violations Observed" number={7} defaultOpen={true}>
        <div style={{ backgroundColor: '#fce4ec', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-pink-200">
          {/* Header Title inside light pink box */}
          <div className="border-b border-pink-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-pink-900 text-sm uppercase tracking-wider">
              7 Violations, if any, observed
            </h3>
            <span className="text-[11px] font-semibold text-pink-800 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-300">
              Deviations & Compliance
            </span>
          </div>

          {/* Nature and extent of violations */}
          <Field label="Nature and extent of violations">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.natureExtentViolations || ''}
              onChange={e => handleChange('natureExtentViolations', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Horizontal Deviation-93% / No major violations observed"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 8: Area details of the property ── */}
      <Section id="sbi-lb-sec-8" title="Area Details of Property" number={8} defaultOpen={true}>
        <div style={{ backgroundColor: '#e0f2f1', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-teal-200">
          {/* Header Title inside light teal box */}
          <div className="border-b border-teal-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-teal-900 text-sm uppercase tracking-wider">
              8 Area details of the property
            </h3>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-300">
              Site, Plinth, Carpet & Saleable Areas
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Site Area */}
            <Field label="Site Area">
              <input
                type="number"
                className={inputCls}
                value={fields.siteAreaText !== undefined ? String(fields.siteAreaText).replace(/[^0-9.]/g, '') : ''}
                onChange={e => handleChange('siteAreaText', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 2400 (in Sq.ft)"
              />
            </Field>

            {/* Carpet Area */}
            <Field label="Carpet Area">
              <input
                type="number"
                className={inputCls}
                value={fields.carpetAreaText !== undefined ? String(fields.carpetAreaText).replace(/[^0-9.]/g, '') : ''}
                onChange={e => handleChange('carpetAreaText', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 2440 (in Sq.ft)"
              />
            </Field>

            {/* Saleable Area */}
            <Field label="Saleable Area">
              <input
                type="text"
                className={inputCls}
                value={fields.saleableAreaText || ''}
                onChange={e => handleChange('saleableAreaText', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 2400.00 Sft (Land) & 2880.00 Sft (Building)"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Plinth Area (As per Approval) */}
            <Field label="Plinth Area (As per Approval)">
              <textarea
                className={inputCls}
                rows={3}
                value={fields.plinthAreaApprovalText || ''}
                onChange={e => handleChange('plinthAreaApprovalText', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Block-1: Ground: 746.00 Sft, First: 746.00 Sft, Second: 746.00 Sft"
              />
            </Field>

            {/* Plinth Area (As per Actual) */}
            <Field label="Plinth Area (As per Actual)">
              <textarea
                className={inputCls}
                rows={3}
                value={fields.plinthAreaActualText || ''}
                onChange={e => handleChange('plinthAreaActualText', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Block-1: Ground: 1440.00 Sft, First: 1440.00 Sft, Total: 2880.00 Sft"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 9: Valuation ── */}
      <Section id="sbi-lb-sec-9" title="Valuation & Rates" number={9} defaultOpen={true}>
        <div style={{ backgroundColor: '#e8eaf6', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-indigo-200">
          {/* Header Title inside light indigo box */}
          <div className="border-b border-indigo-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">
              9 Valuation
            </h3>
            <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-300">
              Land Rate, SARFAESI Compliance & Market Aspects
            </span>
          </div>

          {/* THE LAND RATE ADOPTED IN THIS VALUATION */}
          <Field label="THE LAND RATE ADOPTED IN THIS VALUATION">
            <textarea
              className={inputCls}
              rows={5}
              value={fields.landRateAdoptedText || ''}
              onChange={e => handleChange('landRateAdoptedText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter details of land rate adopted in this valuation..."
            />
          </Field>

          {/* i) Qualifications in TIR/Mitigation suggested, if any */}
          <Field label="i) Qualifications in TIR/Mitigation suggested, if any">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.tirQualificationsMitigation || ''}
              onChange={e => handleChange('tirQualificationsMitigation', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. NIL / Clear TIR obtained without any adverse observations"
            />
          </Field>

          {/* Checkboxes: ii, iii, iv */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* ii) Property is SARFAESI compliant */}
            <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.sarfaesiCompliant === 'Yes' || fields.sarfaesiCompliant === true}
                  onChange={e => handleChange('sarfaesiCompliant', e.target.checked ? 'Yes' : 'No')}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  ii) Property is SARFAESI compliant: <strong className={fields.sarfaesiCompliant === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                    {fields.sarfaesiCompliant === 'Yes' ? 'Yes' : 'No'}
                  </strong>
                </span>
              </label>
            </div>

            {/* iii) Whether property belongs to social infrastructure... */}
            <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.socialInfrastructure === 'Yes' || fields.socialInfrastructure === true}
                  onChange={e => handleChange('socialInfrastructure', e.target.checked ? 'Yes' : 'No')}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  iii) Whether property belongs to social infrastructure...: <strong className={fields.socialInfrastructure === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                    {fields.socialInfrastructure === 'Yes' ? 'Yes' : 'No'}
                  </strong>
                </span>
              </label>
            </div>

            {/* iv) Whether entire piece of land... has been mortgaged */}
            <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-200">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.entireLandMortgaged === 'Yes' || fields.entireLandMortgaged === true}
                  onChange={e => handleChange('entireLandMortgaged', e.target.checked ? 'Yes' : 'No')}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  iv) Whether entire piece of land... has been mortgaged: <strong className={fields.entireLandMortgaged === 'Yes' ? 'text-emerald-700' : 'text-slate-500'}>
                    {fields.entireLandMortgaged === 'Yes' ? 'Yes' : 'No'}
                  </strong>
                </span>
              </label>
            </div>
          </div>

          {/* v) Details of last two transactions in the locality/area... */}
          <Field label="v) Details of last two transactions in the locality/area...">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.lastTwoTransactionsDetails || ''}
              onChange={e => handleChange('lastTwoTransactionsDetails', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Details of last two transactions in the locality/area..."
            />
          </Field>

          {/* vi) In case of variation of 20% or more... justification... */}
          <Field label="vi) In case of variation of 20% or more... justification...">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.variationJustification20Pct || ''}
              onChange={e => handleChange('variationJustification20Pct', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Justification in case of variation of 20% or more..."
            />
          </Field>

          {/* vii) Any other aspect which has relevance... */}
          <Field label="vii) Any other aspect which has relevance...">
            <textarea
              className={inputCls}
              rows={3}
              value={fields.otherRelevantAspects || ''}
              onChange={e => handleChange('otherRelevantAspects', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Any other aspect which has relevance to the valuation..."
            />
          </Field>

          {/* REMARKS */}
          <Field label="REMARKS">
            <textarea
              className={inputCls}
              rows={4}
              value={fields.generalRemarksText || ''}
              onChange={e => handleChange('generalRemarksText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter remarks..."
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 10: Declaration & Valuer Details ── */}
      <Section id="sbi-lb-sec-10" title="Declaration & Valuer Details" number={10} defaultOpen={true}>
        <div style={{ backgroundColor: '#fff8e1', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-amber-200">
          {/* Header Title inside light amber box */}
          <div className="border-b border-amber-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider">
              10 & 11 Declaration & Valuer Details
            </h3>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              Inspection Date, Declarations & Sign-Off
            </span>
          </div>

          {/* Inspection Date & Declarations */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Inspection Date & Declarations
              </label>
              <button
                type="button"
                onClick={handleToggleAllDecls}
                disabled={isReadOnly}
                className="text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md border border-amber-300 transition-colors cursor-pointer"
              >
                {allDeclsChecked ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-amber-200 space-y-4">
              {/* Input Box (Date) */}
              <div className="grid md:grid-cols-2 gap-4 items-center pb-3 border-b border-amber-100">
                <Field label="Inspection Date">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.inspectionDate || ''}
                    onChange={e => handleChange('inspectionDate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                  Inspection recorded for: <strong>{fields.inspectionDate || fields.signatureDate || '24.07.2026'}</strong>
                </div>
              </div>

              {/* Declarations Checkboxes */}
              <div className="space-y-2">
                <div className="grid md:grid-cols-2 gap-2.5">
                  {DECLARATIONS_LIST.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-100 bg-white hover:bg-amber-50/60 cursor-pointer transition-colors shadow-2xs"
                    >
                      <input
                        type="checkbox"
                        checked={isDeclChecked(item.id)}
                        onChange={e => handleToggleDecl(item.id, e.target.checked)}
                        disabled={isReadOnly}
                        className="w-4 h-4 mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 shrink-0"
                      />
                      <div className="text-xs text-slate-800 leading-snug">
                        <span className="font-bold text-amber-950 mr-1">{item.id}.</span>
                        {item.text}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Name and Address & Date */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Name and Address */}
            <PrefillField
              label="Name and Address"
              type="textarea"
              rows={3}
              value={fields.valuerNameAndAddress}
              onChange={(val: string) => handleChange('valuerNameAndAddress', val)}
              isReadOnly={isReadOnly}
              tooltip=">>Auto calculating from [System Valuer Profile Settings]<<"
              fallbackValue={systemValuerProfileDetails}
            />

            {/* Date */}
            <PrefillField
              label="Date"
              value={fields.signatureDate}
              onChange={(val: string) => handleChange('signatureDate', val)}
              isReadOnly={isReadOnly}
              tooltip='>>Prefill from section COVER PAGE, "DATE:"<<'
              fallbackValue={fields.coverDate || fields.reportDate || '24.07.2026'}
            />
          </div>
        </div>
      </Section>

      {/* ── Section 11: DETAILS OF VALUATION & TOTAL ABSTRACT + ENCLOSURES & APPRAISAL STATEMENT ── */}
      <Section id="sbi-lb-sec-11" title="DETAILS OF VALUATION & TOTAL ABSTRACT" number={11} defaultOpen={true}>
        <div className="space-y-6">
          {/* Container 1: DETAILS OF VALUATION & TOTAL ABSTRACT (Color: Light Purple #f3e5f5) */}
          <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-purple-200">
            {/* Header Title inside light purple box */}
            <div className="border-b border-purple-300 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wider">
                DETAILS OF VALUATION & TOTAL ABSTRACT
              </h3>
              <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-300">
                Valuation Schedule & 4x4 Abstract Matrix
              </span>
            </div>

            {/* Field 1: DETAILS OF VALUATION Grid (Plot No, Area, Rate, Total Value) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                  DETAILS OF VALUATION Grid (Plot No, Area, Rate, Total Value)
                </label>
                <button
                  type="button"
                  onClick={handleAddValuationItem}
                  disabled={isReadOnly}
                  className="text-[11px] font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded-md border border-purple-300 transition-colors cursor-pointer"
                >
                  + Add Item / Row
                </button>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-purple-200 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-purple-200 text-purple-900 bg-purple-50/70">
                      <th className="p-2.5 font-bold">Sl.</th>
                      <th className="p-2.5 font-bold">Particulars / Plot No / Block</th>
                      <th className="p-2.5 font-bold text-right">Plinth Area (Sft)</th>
                      <th className="p-2.5 font-bold text-right">Rate (Rs./Sft)</th>
                      <th className="p-2.5 font-bold text-right">Total Value (Rs.)</th>
                      <th className="p-2.5 font-bold text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {(fields.valuationGridItems || []).map((it: any, idx: number) => (
                      <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                        <td className="p-2 font-bold text-purple-950">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls + ' text-xs'}
                            value={it.plotNo || ''}
                            onChange={e => handleUpdateValuationItem(idx, 'plotNo', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="e.g. RCC GROUND FLOOR (BLOCK-1)"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={inputCls + ' text-xs text-right'}
                            value={it.area || ''}
                            onChange={e => handleUpdateValuationItem(idx, 'area', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={inputCls + ' text-xs text-right'}
                            value={it.rate || ''}
                            onChange={e => handleUpdateValuationItem(idx, 'rate', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls + ' text-xs text-right font-bold text-purple-900 bg-purple-50/50'}
                            value={it.totalValue !== undefined ? `Rs. ${formatIndianCurrency(parseFloat(it.totalValue) || 0)}` : ''}
                            readOnly
                            disabled
                            placeholder="Rs. 0.00"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteValuationItem(idx)}
                            disabled={isReadOnly || (fields.valuationGridItems || []).length <= 1}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Total Summary Row */}
                    <tr className="bg-purple-100/70 font-bold border-t-2 border-purple-300">
                      <td colSpan={2} className="p-2.5 text-right uppercase text-purple-950">
                        Total Valuation:
                      </td>
                      <td className="p-2.5 text-right text-purple-950">
                        {totalValuationGridArea.toFixed(2)} Sft
                      </td>
                      <td className="p-2.5 text-right text-purple-800">
                        —
                      </td>
                      <td className="p-2.5 text-right text-emerald-800 font-extrabold text-sm">
                        Rs. {formatIndianCurrency(totalValuationGridAmount)}/-
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Field 2: TOTAL ABSTRACT FOR THE ENTIRE PROPERTY (Land, Building, Ext. Services, etc.) */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                <label className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                  TOTAL ABSTRACT FOR THE ENTIRE PROPERTY (Land, Building, Ext. Services, etc.)
                </label>
                <div className="flex items-center gap-3 text-xs bg-white/70 px-3 py-1 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-medium">Realizable %:</span>
                    <input
                      type="number"
                      className="w-14 px-1.5 py-0.5 text-xs border rounded text-right font-bold"
                      value={fields.abstractRealizablePct || '95'}
                      onChange={e => handleChange('abstractRealizablePct', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-medium">Distress %:</span>
                    <input
                      type="number"
                      className="w-14 px-1.5 py-0.5 text-xs border rounded text-right font-bold"
                      value={fields.abstractDistressPct || '85'}
                      onChange={e => handleChange('abstractDistressPct', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-purple-200 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-purple-200 text-purple-900 bg-purple-50/70">
                      <th className="p-2.5 font-bold">Item / Particulars</th>
                      <th className="p-2.5 font-bold text-right">Govt Value (Rs.)</th>
                      <th className="p-2.5 font-bold text-right">Market Value (Rs.)</th>
                      <th className="p-2.5 font-bold text-right">Realizable Value ({fields.abstractRealizablePct || 95}%)</th>
                      <th className="p-2.5 font-bold text-right">Distress Value ({fields.abstractDistressPct || 85}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {/* Land Row */}
                    <tr className="hover:bg-purple-50/40">
                      <td className="p-2 font-bold text-purple-950">1. Land Value</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractGovtLand || ''}
                          onChange={e => handleChange('abstractGovtLand', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="933600"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold'}
                          value={fields.abstractMarketLand || ''}
                          onChange={e => handleChange('abstractMarketLand', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="6000000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractRealizableLand || ''}
                          onChange={e => handleChange('abstractRealizableLand', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="5700000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractDistressLand || ''}
                          onChange={e => handleChange('abstractDistressLand', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="5100000"
                        />
                      </td>
                    </tr>

                    {/* Building Row */}
                    <tr className="hover:bg-purple-50/40">
                      <td className="p-2 font-bold text-purple-950">2. Building Value</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractGovtBldg || ''}
                          onChange={e => handleChange('abstractGovtBldg', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="1958250"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold'}
                          value={fields.abstractMarketBldg || ''}
                          onChange={e => handleChange('abstractMarketBldg', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="2611000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractRealizableBldg || ''}
                          onChange={e => handleChange('abstractRealizableBldg', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="2480450"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractDistressBldg || ''}
                          onChange={e => handleChange('abstractDistressBldg', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="2219350"
                        />
                      </td>
                    </tr>

                    {/* Ext. Services / Amenities / Other Row */}
                    <tr className="hover:bg-purple-50/40">
                      <td className="p-2 font-bold text-purple-950">3. Ext. Services & Amenities</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractGovtExtra || ''}
                          onChange={e => handleChange('abstractGovtExtra', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractMarketExtra || ''}
                          onChange={e => handleChange('abstractMarketExtra', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractRealizableExtra || ''}
                          onChange={e => handleChange('abstractRealizableExtra', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right'}
                          value={fields.abstractDistressExtra || ''}
                          onChange={e => handleChange('abstractDistressExtra', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="0"
                        />
                      </td>
                    </tr>

                    {/* Total Column Row */}
                    <tr className="bg-purple-100/80 font-bold border-t-2 border-purple-300">
                      <td className="p-2.5 uppercase text-purple-950 font-extrabold">TOTAL AMOUNT (Rs.)</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold bg-amber-50'}
                          value={fields.abstractGovtTotal || ''}
                          onChange={e => handleChange('abstractGovtTotal', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 2891850"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold text-emerald-800 bg-emerald-50'}
                          value={fields.abstractMarketTotal || ''}
                          onChange={e => handleChange('abstractMarketTotal', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 8611000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold text-blue-800 bg-blue-50'}
                          value={fields.abstractRealizableTotal || ''}
                          onChange={e => handleChange('abstractRealizableTotal', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 8180450"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold text-rose-800 bg-rose-50'}
                          value={fields.abstractDistressTotal || ''}
                          onChange={e => handleChange('abstractDistressTotal', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 7319350"
                        />
                      </td>
                    </tr>

                    {/* Or Say Row */}
                    <tr className="bg-purple-50/80 font-bold">
                      <td className="p-2.5 uppercase text-purple-950">OR SAY (ROUNDED RS.)</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold'}
                          value={fields.abstractGovtOrSay || ''}
                          onChange={e => handleChange('abstractGovtOrSay', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 2892000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold text-emerald-800'}
                          value={fields.abstractMarketOrSay || ''}
                          onChange={e => handleChange('abstractMarketOrSay', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 8611000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold text-blue-800'}
                          value={fields.abstractRealizableOrSay || ''}
                          onChange={e => handleChange('abstractRealizableOrSay', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 8180000"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls + ' text-xs text-right font-bold text-rose-800'}
                          value={fields.abstractDistressOrSay || ''}
                          onChange={e => handleChange('abstractDistressOrSay', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Rs. 7319000"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Container 2: ENCLOSURES & APPRAISAL STATEMENT (Color: Mint Green #f1f8e9) */}
          <div style={{ backgroundColor: '#f1f8e9', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-emerald-200">
            {/* Header Title inside mint green box */}
            <div className="border-b border-emerald-300 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-emerald-900 text-sm uppercase tracking-wider">
                ENCLOSURES & APPRAISAL STATEMENT
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                Enclosures Checklist & Valuer Sign-Off
              </span>
            </div>

            {/* Field 1: Enclosures (Items a through i) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Enclosures (Items a through i)
                </label>
                <span className="text-[11px] text-emerald-700 italic">
                  9 Standard Enclosure Checkpoints
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {ENCLOSURES_ITEMS.map(item => {
                  const currentVal = fields[item.key] || (item.key === 'encOtherDocuments' ? 'No' : 'Enclosed');
                  return (
                    <div key={item.key} className="bg-white/90 p-3 rounded-xl border border-emerald-200 flex flex-col justify-between space-y-2.5 shadow-2xs">
                      <div className="text-xs font-semibold text-slate-800 leading-snug">
                        <strong className="text-emerald-900 mr-1">{item.id}</strong>
                        {item.text}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-emerald-100">
                        {(['Enclosed', 'Yes', 'No'] as const).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleChange(item.key, opt)}
                            className={`flex-1 py-1 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                              currentVal === opt
                                ? opt === 'No'
                                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                                  : 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-slate-50 border-gray-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field 2: Final Appraisal Text / Fair Market Value Statement */}
            <PrefillField
              label="Final Appraisal Text / Fair Market Value Statement"
              type="textarea"
              rows={4}
              value={fields.finalAppraisalText}
              onChange={(val: string) => handleChange('finalAppraisalText', val)}
              isReadOnly={isReadOnly}
              tooltip=">>Auto calculating from [String concatenation of Property Spec variables, PRESENT MARKET VALUE, REALIZABLE VALUE, and FORCED SALE VALUE]<<"
              fallbackValue={autoAppraisalText}
            />

            {/* Field 3 & 4: Date (Valuer Sign-off) & Place (Valuer Sign-off) */}
            <div className="grid md:grid-cols-2 gap-4">
              <PrefillField
                label="Date (Valuer Sign-off)"
                value={fields.signatureDate}
                onChange={(val: string) => handleChange('signatureDate', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "DATE:"<<'
                fallbackValue={fields.coverDate || fields.reportDate || '24.07.2026'}
              />

              <PrefillField
                label="Place (Valuer Sign-off)"
                value={fields.signaturePlace}
                onChange={(val: string) => handleChange('signaturePlace', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "Branch Address Details"<<'
                fallbackValue={fields.branchAddressDetails || fields.branchAddress || 'Bhubaneswar'}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 12: DECLARATION CUM UNDERTAKING FROM VALUERS ── */}
      <Section id="sbi-lb-sec-12" title="DECLARATION CUM UNDERTAKING FROM VALUERS" number={12} defaultOpen={true}>
        <div className="space-y-6">
          {/* Container 1: DECLARATION CUM UNDERTAKING FROM VALUERS (Color: Light Red #ffebee) */}
          <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-rose-200">
            {/* Header Title inside light red box */}
            <div className="border-b border-rose-300 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-rose-950 text-sm uppercase tracking-wider">
                DECLARATION CUM UNDERTAKING FROM VALUERS
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAllDeclarations}
                  disabled={isReadOnly}
                  className="text-[11px] font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-md border border-rose-300 transition-colors cursor-pointer"
                >
                  {allDeclarationsChecked ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                  Statements a to z
                </span>
              </div>
            </div>

            {/* Declarations (Statements a to z) Grid of Checkboxes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Declarations (Statements a to z)
                </label>
                <span className="text-[11px] text-rose-700 italic">
                  26 Statutory Declarations & Undertakings
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-2 border border-rose-200/70 rounded-xl bg-white/70">
                {DECLARATION_STATEMENTS_A_TO_Z.map(item => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-rose-100 bg-white hover:bg-rose-50/50 cursor-pointer transition-colors shadow-2xs"
                  >
                    <input
                      type="checkbox"
                      checked={isDeclarationChecked(item.id)}
                      onChange={e => handleToggleDeclarationStatement(item.id, e.target.checked)}
                      disabled={isReadOnly}
                      className="w-4 h-4 mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 shrink-0"
                    />
                    <div className="text-xs text-slate-800 leading-snug">
                      <span className="font-bold text-rose-900 mr-1">{item.id}.</span>
                      {item.text}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date (Declaration Sign-off) & Place (Declaration Sign-off) */}
            <div className="grid md:grid-cols-2 gap-4">
              <PrefillField
                label="Date (Declaration Sign-off)"
                value={fields.declarationSignDate}
                onChange={(val: string) => handleChange('declarationSignDate', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "DATE:"<<'
                fallbackValue={fields.coverDate || fields.reportDate || '24.07.2026'}
              />

              <PrefillField
                label="Place (Declaration Sign-off)"
                value={fields.declarationSignPlace}
                onChange={(val: string) => handleChange('declarationSignPlace', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "Branch Address Details"<<'
                fallbackValue={fields.branchAddressDetails || fields.branchAddress || 'Bhubaneswar'}
              />
            </div>
          </div>

          {/* Container 2: MODEL CODE OF CONDUCT FOR VALUERS (Color: Light Indigo #e8eaf6) */}
          <div style={{ backgroundColor: '#e8eaf6', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-indigo-200">
            {/* Header Title inside light indigo box */}
            <div className="border-b border-indigo-300 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">
                MODEL CODE OF CONDUCT FOR VALUERS
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAllConduct}
                  disabled={isReadOnly}
                  className="text-[11px] font-semibold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-md border border-indigo-300 transition-colors cursor-pointer"
                >
                  {allConductChecked ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-300">
                  Points 1 to 30
                </span>
              </div>
            </div>

            {/* Code of Conduct Statements (Points 1 to 30) Grid of Checkboxes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Code of Conduct Statements (Points 1 to 30)
                </label>
                <span className="text-[11px] text-indigo-700 italic">
                  30 Statutory Standards & Ethics
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-2 border border-indigo-200/70 rounded-xl bg-white/70">
                {CODE_OF_CONDUCT_POINTS.map(item => (
                  <label
                    key={item.num}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-indigo-100 bg-white hover:bg-indigo-50/50 cursor-pointer transition-colors shadow-2xs"
                  >
                    <input
                      type="checkbox"
                      checked={isConductChecked(item.num)}
                      onChange={e => handleToggleConduct(item.num, e.target.checked)}
                      disabled={isReadOnly}
                      className="w-4 h-4 mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                    />
                    <div className="text-xs text-slate-800 leading-snug">
                      <span className="font-bold text-indigo-900 mr-1">{item.num}.</span>
                      {item.text}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date (Code of Conduct Sign-off) & Place (Code of Conduct Sign-off) */}
            <div className="grid md:grid-cols-2 gap-4">
              <PrefillField
                label="Date (Code of Conduct Sign-off)"
                value={fields.conductSignDate}
                onChange={(val: string) => handleChange('conductSignDate', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "DATE:"<<'
                fallbackValue={fields.coverDate || fields.reportDate || '24.07.2026'}
              />

              <PrefillField
                label="Place (Code of Conduct Sign-off)"
                value={fields.conductSignPlace}
                onChange={(val: string) => handleChange('conductSignPlace', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "Branch Address Details"<<'
                fallbackValue={fields.branchAddressDetails || fields.branchAddress || 'Bhubaneswar'}
              />
            </div>
          </div>

          {/* Container 3: JUSTIFICATION OF VALUATION REPORT (Color: Light Coral #ffe0b2) */}
          <div style={{ backgroundColor: '#ffe0b2', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-amber-300">
            {/* Header Title inside light coral box */}
            <div className="border-b border-amber-400/80 pb-2 flex justify-between items-center">
              <h3 className="font-bold text-amber-950 text-sm uppercase tracking-wider">
                JUSTIFICATION OF VALUATION REPORT
              </h3>
              <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Govt. Benchmark vs Market Value Justification
              </span>
            </div>

            {/* Bank Address Block (TO, THE CHIEF MANAGER...) */}
            <PrefillField
              label="Bank Address Block (TO, THE CHIEF MANAGER...)"
              value={fields.justificationBankAddress}
              onChange={(val: string) => handleChange('justificationBankAddress', val)}
              isReadOnly={isReadOnly}
              type="textarea"
              rows={4}
              tooltip='>>Prefill from section COVER PAGE, "STATE BANK OF INDIA, [Branch Address Details]"<<'
              fallbackValue={fallbackJustificationBankAddress}
            />

            {/* Sub: - Justification of valuation Report of */}
            <PrefillField
              label="Sub: - Justification of valuation Report of"
              value={fields.justificationLetterSubject}
              onChange={(val: string) => handleChange('justificationLetterSubject', val)}
              isReadOnly={isReadOnly}
              tooltip='>>Auto calculating from ["Justification of valuation Report of " + NAME OF THE OWNER]<<'
              fallbackValue={autoJustificationSub}
            />

            {/* Property Description Block (The subject property bearing...) */}
            <PrefillField
              label="Property Description Block (The subject property bearing...)"
              value={fields.justificationPropertyDesc}
              onChange={(val: string) => handleChange('justificationPropertyDesc', val)}
              isReadOnly={isReadOnly}
              type="textarea"
              rows={3}
              tooltip=">>Auto calculating from [VALUATION OF LAND & BUILDING BEARING KHATA NO:]<<"
              fallbackValue={autoPropertyDescBlock}
            />

            {/* Justification Statements (Govt. Value vs Market Value rationale & Locality features) */}
            <Field label="Justification Statements (Govt. Value vs Market Value rationale & Locality features)">
              <textarea
                className={inputCls + ' min-h-24 bg-white'}
                rows={4}
                value={fields.justificationLetterBody !== undefined ? fields.justificationLetterBody : defaultJustificationTemplate}
                onChange={e => handleChange('justificationLetterBody', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter justification statements..."
              />
            </Field>

            {/* Date (Justification Sign-off) & Place (Justification Sign-off) */}
            <div className="grid md:grid-cols-2 gap-4">
              <PrefillField
                label="Date (Justification Sign-off)"
                value={fields.justificationSignDate}
                onChange={(val: string) => handleChange('justificationSignDate', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "DATE:"<<'
                fallbackValue={fields.coverDate || fields.reportDate || '24.07.2026'}
              />

              <PrefillField
                label="Place (Justification Sign-off)"
                value={fields.justificationSignPlace}
                onChange={(val: string) => handleChange('justificationSignPlace', val)}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section COVER PAGE, "Branch Address Details"<<'
                fallbackValue={fields.branchAddressDetails || fields.branchAddress || 'Bhubaneswar'}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 13: Base Documents ── */}
      <BaseDocumentsSection
        title="Documents" sectionNumber={13}
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionId="section-documents"
      />

      {/* ── Section 14: Base Maps ── */}
      <BaseMapsSection
        title="Maps" sectionNumber={14}
        locationMapImages={fields.locationMapImages || []}
        mouzaMapImages={fields.mouzaMapImages || []}
        sketchMapImages={fields.sketchMapImages || []}
        cadastralMapImages={fields.cadastralMapImages || []}
        bdaMapImages={fields.bdaMapImages || []}
        latitude={fields.latitude}
        longitude={fields.longitude}
        technicalAddress={fields.propertyAddress || ''}
        propertyAddress={fields.propertyAddress || ''}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionId="section-maps"
      />

      {/* ── Section 15: Photographs ── */}
      <BasePhotographsSection
        title="Photographs" sectionNumber={15}
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionId="section-photographs"
      />
        </div>

        {/* ── Right Sections Nav Panel ── */}
        <FloatingNavigator sections={NAV_SECTIONS} />
      </div>

      {/* ── Standard Sticky Bottom Action Bar with 4 Buttons ── */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={saving ? 'saving' : saveSuccess ? 'saved' : 'idle'}
        loading={saving}
        onSaveDraft={handleSaveInternal}
        onSubmit={handleSubmitInternal}
        onPreviewPDF={handlePreviewPdfInternal}
        onDownloadPDF={handleDownloadPdfInternal}
      />
    </div>
  );
}
