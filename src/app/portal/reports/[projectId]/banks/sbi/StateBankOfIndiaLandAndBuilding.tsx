'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
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
  ActiveConfigBanner,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
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
      branchAddressDetails: saved.branchAddressDetails !== undefined ? saved.branchAddressDetails : (saved.branchAddress || 'STATE BANK OF INDIA, BALUGAON BRANCH, DIST: KHURDA, ODISHA'),
      asOnDate: saved.asOnDate !== undefined ? saved.asOnDate : '',
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE CHIEF MANAGER / BRANCH HEAD,',
      bankName: saved.bankName !== undefined ? saved.bankName : (pf.bankName || 'STATE BANK OF INDIA,'),
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : 'BALUGAON BRANCH, DIST: KHURDA, ODISHA',
      refNo: saved.refNo !== undefined ? saved.refNo : (projectCode || projectId || 'SMA/IDBI/07-2026/09'),
      coverDate: saved.coverDate !== undefined ? saved.coverDate : (saved.reportDate || pf.reportDate || ''),
      reportDate: saved.reportDate !== undefined ? saved.reportDate : (pf.reportDate || '24.07.2026'),
      valuationPropertyDesc: saved.valuationPropertyDesc !== undefined ? saved.valuationPropertyDesc : (saved.propertyAddress || pf.propertyAddress || 'Khata No: 311/2959, Plot No: 765/2546, Sub Plot No: 1151 & 1152, Total Area: Ac.0.055 Dec i.e. 2400.00 Sft, Kissam: Gharabari in Mz: Kantilo, Ps: Airfield No-53, Ts: Jatani No-196, Dist: Khurda, Odisha. Pin-751002'),
      nameOfTheOwner: saved.nameOfTheOwner !== undefined ? saved.nameOfTheOwner : (saved.borrowerName || pf.contactName || 'Mr. Dipak Kumar Barik'),
      borrowerName: saved.borrowerName !== undefined ? saved.borrowerName : (pf.contactName || 'Mr. Dipak Kumar Barik'),
      presentMarketValue: saved.presentMarketValue !== undefined ? saved.presentMarketValue : '',
      realizableValue: saved.realizableValue !== undefined ? saved.realizableValue : '',
      forcedSaleValue: saved.forcedSaleValue !== undefined ? saved.forcedSaleValue : '',
      govtValue: saved.govtValue !== undefined ? saved.govtValue : '2891850',
      purposeOfValuation: saved.purposeOfValuation !== undefined ? saved.purposeOfValuation : 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY',

      // 1 Customer Details
      customerBorrowalUnit: saved.customerBorrowalUnit !== undefined ? saved.customerBorrowalUnit : (saved.nameOfTheOwner || saved.borrowerName || pf.contactName || 'Mr. Dipak Kumar Barik'),
      customerOwnerName: saved.customerOwnerName !== undefined ? saved.customerOwnerName : (saved.nameOfTheOwner || saved.borrowerName || pf.contactName || 'Mr. Dipak Kumar Barik'),
      applicationNo: saved.applicationNo !== undefined ? saved.applicationNo : 'Not Available',
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.contactName ? `${pf.contactName}, S/o: ${pf.fatherName || 'Ashok Kumar Barik'}, At: ${pf.propertyAddress || 'Khandagiri, Bhubaneswar, Dist: Khurda, Odisha'}` : 'Mr. Dipak Kumar Barik, S/o: Ashok Kumar Barik, At: Khandagiri, Bhubaneswar, Dist: Khurda, Odisha.'),
      caseType: saved.caseType !== undefined ? saved.caseType : 'Fresh Valuation',
      identifiedByAndMobNo: saved.identifiedByAndMobNo !== undefined ? saved.identifiedByAndMobNo : "Mr. Dalai (Owner's Representative), Mob-9178156885",

      // 2. Property Details
      propertyAddress: saved.propertyAddress !== undefined ? saved.propertyAddress : (pf.propertyAddress || 'Khata No: 311/2959, Plot No: 765/2546, Sub Plot No: 1151 & 1152, Total Area: Ac.0.055 Dec i.e. 2400.00 Sft, Kissam: Gharabari in Mz: Kantilo, Ps: Airfield No-53, Ts: Jatani No-196, Dist: Khurda, Odisha. Pin-751002'),
      nearbyLandmark: saved.nearbyLandmark !== undefined ? saved.nearbyLandmark : 'The subject property is situated back side of Subhasri Villa Apartment, Kantilo',
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : '',
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || ''),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || ''),

      // 3. Document Details
      layoutPlanAvailable: saved.layoutPlanAvailable !== undefined ? saved.layoutPlanAvailable : 'Yes/ No',
      layoutPlanAuthority: saved.layoutPlanAuthority !== undefined ? saved.layoutPlanAuthority : 'Bhubaneswar Development Authority',
      layoutPlanApprovalNo: saved.layoutPlanApprovalNo !== undefined ? saved.layoutPlanApprovalNo : 'Vide Letter No: BP/BDA/009678 on dated 07.05.2024 for construction of a G+2 storied (Block-1 & 2) Residential Building',
      buildingPlanAvailable: saved.buildingPlanAvailable !== undefined ? saved.buildingPlanAvailable : 'Yes/ No',
      buildingPlanAuthority: saved.buildingPlanAuthority !== undefined ? saved.buildingPlanAuthority : 'Bhubaneswar Development Authority',
      buildingPlanApprovalNo: saved.buildingPlanApprovalNo !== undefined ? saved.buildingPlanApprovalNo : 'BP/BDA/009678',
      constructionPermissionAvailable: saved.constructionPermissionAvailable !== undefined ? saved.constructionPermissionAvailable : 'Yes/ No',
      constructionPermissionAuthority: saved.constructionPermissionAuthority !== undefined ? saved.constructionPermissionAuthority : 'Bhubaneswar Development Authority',
      constructionPermissionApprovalNo: saved.constructionPermissionApprovalNo !== undefined ? saved.constructionPermissionApprovalNo : 'BP/BDA/009678',
      legalDocumentsAvailable: saved.legalDocumentsAvailable !== undefined ? saved.legalDocumentsAvailable : 'Yes/ No',
      legalDocumentsAuthority: saved.legalDocumentsAuthority !== undefined ? saved.legalDocumentsAuthority : '',
      legalDocumentsApprovalNo: saved.legalDocumentsApprovalNo !== undefined ? saved.legalDocumentsApprovalNo : '',
      listOfDocuments: saved.listOfDocuments !== undefined ? saved.listOfDocuments : 'Xerox copy of Agreement for Sale, Sketch Map, Patta, Approval Letter',

      // 4. Physical Details
      boundaryEastDoc: saved.boundaryEastDoc !== undefined ? saved.boundaryEastDoc : 'Sub Plot No-1153',
      boundaryEastVerif: saved.boundaryEastVerif !== undefined ? saved.boundaryEastVerif : 'Sub Plot No-1153',
      boundaryWestDoc: saved.boundaryWestDoc !== undefined ? saved.boundaryWestDoc : 'Road',
      boundaryWestVerif: saved.boundaryWestVerif !== undefined ? saved.boundaryWestVerif : 'Road',
      boundaryNorthDoc: saved.boundaryNorthDoc !== undefined ? saved.boundaryNorthDoc : 'Revenue Plot No-767',
      boundaryNorthVerif: saved.boundaryNorthVerif !== undefined ? saved.boundaryNorthVerif : 'Revenue Plot No-767',
      boundarySouthDoc: saved.boundarySouthDoc !== undefined ? saved.boundarySouthDoc : 'Road',
      boundarySouthVerif: saved.boundarySouthVerif !== undefined ? saved.boundarySouthVerif : 'Road',

      matchingBoundaries: saved.matchingBoundaries !== undefined ? saved.matchingBoundaries : 'Yes/ No',
      plotDemarcated: saved.plotDemarcated !== undefined ? saved.plotDemarcated : 'Yes/ No',
      approvedLandUse: saved.approvedLandUse !== undefined ? saved.approvedLandUse : 'Residential',
      typeOfProperty: saved.typeOfProperty !== undefined ? saved.typeOfProperty : 'Land & Building',
      numberOfRoomsLiving: saved.numberOfRoomsLiving !== undefined ? saved.numberOfRoomsLiving : '2 Nos',
      numberOfRoomsBed: saved.numberOfRoomsBed !== undefined ? saved.numberOfRoomsBed : '5 Nos',
      numberOfRoomsToilets: saved.numberOfRoomsToilets !== undefined ? saved.numberOfRoomsToilets : '3 Nos',
      numberOfRoomsKitchens: saved.numberOfRoomsKitchens !== undefined ? saved.numberOfRoomsKitchens : '1 Nos',
      totalNumberOfFloors: saved.totalNumberOfFloors !== undefined ? saved.totalNumberOfFloors : 'G+1 Storied',
      areaPropertyLocated: saved.areaPropertyLocated !== undefined ? saved.areaPropertyLocated : 'Kalyani Vihar Scheme',
      yearOfOccupancy: saved.yearOfOccupancy !== undefined ? saved.yearOfOccupancy : '2024',
      approxAgeProperty: saved.approxAgeProperty !== undefined ? saved.approxAgeProperty : 'New',
      residualLifeProperty: saved.residualLifeProperty !== undefined ? saved.residualLifeProperty : '65 Yrs',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame',

      // 5. Tenure / Occupancy
      statusOfTenure: saved.statusOfTenure !== undefined ? saved.statusOfTenure : 'Owned/ Rented (Under Construction)',
      numberOfYearsOccupancy: saved.numberOfYearsOccupancy !== undefined ? saved.numberOfYearsOccupancy : 'NA',
      relationshipTenantOwner: saved.relationshipTenantOwner !== undefined ? saved.relationshipTenantOwner : 'NA',

      // 6. Stage of construction
      stageOfConstruction: saved.stageOfConstruction !== undefined ? saved.stageOfConstruction : 'Ground Floor Completed (85%), First Floor Completed (80%)',
      underConstructionExtent: saved.underConstructionExtent !== undefined ? saved.underConstructionExtent : 'Not Applicable',

      // 7. Violations
      natureExtentViolations: saved.natureExtentViolations !== undefined ? saved.natureExtentViolations : 'Horizontal Deviation-93%',

      // 8. Area details
      siteAreaText: saved.siteAreaText !== undefined ? saved.siteAreaText : 'Ac.0.055 Dec i.e. 2400.00 Sft',
      carpetAreaText: saved.carpetAreaText !== undefined ? saved.carpetAreaText : '2440.00 Sft (Approx.)',
      saleableAreaText: saved.saleableAreaText !== undefined ? saved.saleableAreaText : '2400.00 Sft (Land) & 2880.00 Sft (Building)',
      plinthAreaApprovalText: saved.plinthAreaApprovalText !== undefined ? saved.plinthAreaApprovalText : 'Block-1: Ground: 746.00 Sft, First: 746.00 Sft, Second: 746.00 Sft\nBlock-2: Ground: 746.00 Sft, First: 746.00 Sft, Second: 746.00 Sft',
      plinthAreaActualText: saved.plinthAreaActualText !== undefined ? saved.plinthAreaActualText : 'Block-1: Ground: 1440.00 Sft, First: 1440.00 Sft\nTotal: 2880.00 Sft',

      // 9. Valuation
      landRateAdoptedText: saved.landRateAdoptedText !== undefined ? saved.landRateAdoptedText : `THE LAND RATE ADOPTED IN THIS VALUATION:\n• GOVT. BENCHMARK VALUE: RS.1,69,65,000/- PER ACRE I.E. RS.389/- PER SFT\n• TOTAL LAND AREA: AC.0.055 DEC I.E. 2400.00 SFT\n• GUIDELINE VALUE OF LAND= 2400.00 SFT X RS.389/- PER SFT =RS.9,33,600/-\n• THE PREVAILING MARKET RATE OF THE LAND IS RS.2400/- TO RS.2600/- PER SFT.\n• THE ADOPTED MARKET RATE OF THE LAND IS RS.2500/- PER SFT FOR VALUATION PURPOSE.\n• TOTAL MARKET VALUE: 2400.00 SFT X RS.2500/- PER SFT = RS.60,00,000/-`,
      tirQualificationsMitigation: saved.tirQualificationsMitigation !== undefined ? saved.tirQualificationsMitigation : (saved.tirQualifications || 'NIL / Clear TIR obtained without any adverse observations'),
      sarfaesiCompliant: saved.sarfaesiCompliant !== undefined ? saved.sarfaesiCompliant : 'Yes',
      socialInfrastructure: saved.socialInfrastructure !== undefined ? saved.socialInfrastructure : 'No',
      entireLandMortgaged: saved.entireLandMortgaged !== undefined ? saved.entireLandMortgaged : 'Yes',
      lastTwoTransactionsDetails: saved.lastTwoTransactionsDetails !== undefined ? saved.lastTwoTransactionsDetails : 'As per local enquiry, recent transactions in the locality range between Rs. 2,400/- to Rs. 2,600/- per Sq.ft.',
      variationJustification20Pct: saved.variationJustification20Pct !== undefined ? saved.variationJustification20Pct : 'No significant variation observed; adopted rate is aligned with prevailing market trends.',
      otherRelevantAspects: saved.otherRelevantAspects !== undefined ? saved.otherRelevantAspects : 'The property has good road connectivity and civic amenities available within 1-2 kms.',

      // 10. Remarks
      generalRemarksText: saved.generalRemarksText !== undefined ? saved.generalRemarksText : `REMARKS:\nSUBJECT PROPERTY IS AN UNDER CONSTRUCTED G+1 STORIED BUILDING, LAND EXTENT OF AC.0.055 DEC I.E. 2400.00 SFT. PROPERTY LOCATED IN A GOOD DEVELOPED RESIDENTIAL AREA OF KALYANI VIHAR, KANTILO, BHUBANESWAR. THIS PROPERTY IS COMING UNDER BHUBANESWAR DEVELOPMENT AUTHORITY AREA LIMIT. ALL CIVIC AMENITIES ARE PRESENT 2-3 KM FROM THE PROPERTY. VALUATION HAS BEEN DONE FOR LAND & APPROVED BUA OF THE G+1 STORIED BUILDING (BLOCK-1).`,

      // 10 & 11 Declaration & Valuer Details
      inspectionDate: saved.inspectionDate !== undefined ? saved.inspectionDate : (saved.dateOfInspection || '2026-07-24'),
      valuerDeclarations: saved.valuerDeclarations || {},
      declarationText: saved.declarationText !== undefined ? saved.declarationText : `1) The property was inspected by the undersigned on 24.07.2026\n2) The undersigned does not have any direct/indirect interest in the above property.\n3) The information furnished herein is true and correct to the best of our knowledge.`,

      // 12. Valuer Details
      valuerNameAndAddress: saved.valuerNameAndAddress !== undefined ? saved.valuerNameAndAddress : 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018',
      valuerWealthTaxReg: saved.valuerWealthTaxReg !== undefined ? saved.valuerWealthTaxReg : '107/2016-17 of Category-I',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || '24.07.2026'),

      // 13 & 14 Enclosures
      listDocumentsEnclosed: saved.listDocumentsEnclosed || 'Valuation Report, Benchmark Valuation, GPS Map, Photographs',
      listPhotosEnclosed: saved.listPhotosEnclosed || 'Bed Room, Dinning, Drawing, Kitchen, Building with Road',

      // 15 Marketability
      marketabilityNarrative: saved.marketabilityNarrative || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & building method of valuation has been adopted for finding the fair market value of the property.',

      // Valuation Computation
      plinthAreaVal: saved.plinthAreaVal !== undefined ? saved.plinthAreaVal : '746',
      roofHeightVal: saved.roofHeightVal !== undefined ? saved.roofHeightVal : "10'-6\"",
      ageVal: saved.ageVal !== undefined ? saved.ageVal : 'New',
      replacementRateVal: saved.replacementRateVal !== undefined ? saved.replacementRateVal : '2000',
      depreciationVal: saved.depreciationVal !== undefined ? saved.depreciationVal : '0',

      // Value of Property Abstract (4x4 Table)
      abstractGovtLand: saved.abstractGovtLand !== undefined ? saved.abstractGovtLand : '933600',
      abstractGovtBldg: saved.abstractGovtBldg !== undefined ? saved.abstractGovtBldg : '1958250',
      abstractGovtTotal: saved.abstractGovtTotal !== undefined ? saved.abstractGovtTotal : '2891850',
      abstractGovtOrSay: saved.abstractGovtOrSay !== undefined ? saved.abstractGovtOrSay : '2892000',

      abstractMarketLand: saved.abstractMarketLand !== undefined ? saved.abstractMarketLand : '6000000',
      abstractMarketBldg: saved.abstractMarketBldg !== undefined ? saved.abstractMarketBldg : '2611000',
      abstractMarketTotal: saved.abstractMarketTotal !== undefined ? saved.abstractMarketTotal : '8611000',
      abstractMarketOrSay: saved.abstractMarketOrSay !== undefined ? saved.abstractMarketOrSay : '8611000',

      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractRealizableLand: saved.abstractRealizableLand !== undefined ? saved.abstractRealizableLand : '5700000',
      abstractRealizableBldg: saved.abstractRealizableBldg !== undefined ? saved.abstractRealizableBldg : '2480450',
      abstractRealizableTotal: saved.abstractRealizableTotal !== undefined ? saved.abstractRealizableTotal : '8180450',
      abstractRealizableOrSay: saved.abstractRealizableOrSay !== undefined ? saved.abstractRealizableOrSay : '8180000',

      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',
      abstractDistressLand: saved.abstractDistressLand !== undefined ? saved.abstractDistressLand : '5100000',
      abstractDistressBldg: saved.abstractDistressBldg !== undefined ? saved.abstractDistressBldg : '2219350',
      abstractDistressTotal: saved.abstractDistressTotal !== undefined ? saved.abstractDistressTotal : '7319350',
      abstractDistressOrSay: saved.abstractDistressOrSay !== undefined ? saved.abstractDistressOrSay : '7319000',

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
    const totalMarket = landMarket + bldgMarket;

    const landGovt = parseNum(fields.abstractGovtLand);
    const bldgGovt = parseNum(fields.abstractGovtBldg);
    const totalGovt = landGovt + bldgGovt;

    const rPct = parsePct(fields.abstractRealizablePct, 100);
    const dPct = parsePct(fields.abstractDistressPct, 100);

    const realLand = Math.round((landMarket * rPct) / 100);
    const realBldg = Math.round((bldgMarket * rPct) / 100);
    const totalReal = realLand + realBldg;

    const distLand = Math.round((landMarket * dPct) / 100);
    const distBldg = Math.round((bldgMarket * dPct) / 100);
    const totalDist = distLand + distBldg;

    setFields((prev: any) => ({
      ...prev,
      abstractGovtTotal: totalGovt > 0 ? `Rs. ${formatIndianCurrency(totalGovt)}` : prev.abstractGovtTotal,
      abstractMarketTotal: totalMarket > 0 ? `Rs. ${formatIndianCurrency(totalMarket)}` : prev.abstractMarketTotal,
      abstractRealizableLand: realLand > 0 ? `Rs. ${formatIndianCurrency(realLand)}` : prev.abstractRealizableLand,
      abstractRealizableBldg: realBldg > 0 ? `Rs. ${formatIndianCurrency(realBldg)}` : prev.abstractRealizableBldg,
      abstractRealizableTotal: totalReal > 0 ? `Rs. ${formatIndianCurrency(totalReal)}` : prev.abstractRealizableTotal,
      abstractDistressLand: distLand > 0 ? `Rs. ${formatIndianCurrency(distLand)}` : prev.abstractDistressLand,
      abstractDistressBldg: distBldg > 0 ? `Rs. ${formatIndianCurrency(distBldg)}` : prev.abstractDistressBldg,
      abstractDistressTotal: totalDist > 0 ? `Rs. ${formatIndianCurrency(totalDist)}` : prev.abstractDistressTotal,
    }));
  }, [
    fields.abstractMarketLand,
    fields.abstractMarketBldg,
    fields.abstractGovtLand,
    fields.abstractGovtBldg,
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
      const renderer = new PDFSBILandAndBuildingRenderer(fields, projectCode);
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
      const renderer = new PDFSBILandAndBuildingRenderer(fields, projectCode);
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
    return (landMarket + bldgMarket) > 0 ? (landMarket + bldgMarket) : 8611000;
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
    { id: '1', text: `The property was inspected by the undersigned on ${fields.inspectionDate || fields.signatureDate || '24.07.2026'}.` },
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

  const NAV_SECTIONS: NavItem[] = [
    { id: 'sbi-lb-cover-and-customer', title: 'COVER PAGE & BANK DETAILS' },
    { id: 'sbi-lb-sec-2', title: '2 Property Details' },
    { id: 'sbi-lb-sec-3', title: '3 Document Details' },
    { id: 'sbi-lb-sec-4', title: '4 Physical Details' },
    { id: 'sbi-lb-sec-5', title: '5 Tenure/ Occupancy Details' },
    { id: 'sbi-lb-sec-6', title: '6 Stage of construction' },
    { id: 'sbi-lb-sec-7', title: '7 Violations, if any, observed' },
    { id: 'sbi-lb-sec-8', title: '8 Area details of the property' },
    { id: 'sbi-lb-sec-9', title: '9 Valuation' },
    { id: 'sbi-lb-sec-10', title: '10 & 11 Declaration & Valuer Details' },
    { id: 'section-documents', title: 'DOCUMENTS' },
    { id: 'section-maps', title: 'MAPS' },
    { id: 'section-photographs', title: 'PHOTOGRAPHS' },
  ];

  return (
    <div className="space-y-6 pb-24 w-full">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
        category={fields.institutionCategory || 'Bank & FIS'}
        bankName={fields.bankName || fields.organisationTemplate || 'STATE BANK OF INDIA (SBI)'}
        subclass={fields.organisationSubTemplate || 'Land & Building'}
        serviceType={fields.serviceType}
        subjectType={fields.subjectType}
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">


      {/* ── Section 1: COVER PAGE & BANK DETAILS ── */}
      <Section id="sbi-lb-cover-and-customer" title="COVER PAGE & BANK DETAILS" number="1" defaultOpen={true}>
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

      {/* ── Section 2: 2 Property Details (Color: Light Green #e8f5e9) ── */}
      <Section id="sbi-lb-sec-2" title="2 Property Details" number={2} defaultOpen={true}>
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

      {/* ── Section 3: 3 Document Details (Color: Light Yellow #fffde7) ── */}
      <Section id="sbi-lb-sec-3" title="3 Document Details" number={3} defaultOpen={true}>
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

      {/* ── Section 4: 4 Physical Details (Color: Light Purple #f3e5f5) ── */}
      <Section id="sbi-lb-sec-4" title="4 Physical Details" number={4} defaultOpen={true}>
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

      {/* ── Section 5: 5 Tenure/ Occupancy Details (Color: Light Cyan #e0f7fa) ── */}
      <Section id="sbi-lb-sec-5" title="5 Tenure/ Occupancy Details" number={5} defaultOpen={true}>
        <div style={{ backgroundColor: '#e0f7fa', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-cyan-200">
          {/* Header Title inside light cyan box */}
          <div className="border-b border-cyan-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-cyan-900 text-sm uppercase tracking-wider">
              5 Tenure/ Occupancy Details
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

      {/* ── Section 6: 6 Stage of construction (Color: Light Orange #fff3e0) ── */}
      <Section id="sbi-lb-sec-6" title="6 Stage of construction" number={6} defaultOpen={true}>
        <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-orange-200">
          {/* Header Title inside light orange box */}
          <div className="border-b border-orange-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-orange-900 text-sm uppercase tracking-wider">
              6 Stage of construction
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

      {/* ── Section 7: 7 Violations, if any, observed (Color: Light Pink #fce4ec) ── */}
      <Section id="sbi-lb-sec-7" title="7 Violations, if any, observed" number={7} defaultOpen={true}>
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

      {/* ── Section 8: 8 Area details of the property (Color: Light Teal #e0f2f1) ── */}
      <Section id="sbi-lb-sec-8" title="8 Area details of the property" number={8} defaultOpen={true}>
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

      {/* ── Section 9: 9 Valuation (Color: Light Indigo #e8eaf6) ── */}
      <Section id="sbi-lb-sec-9" title="9 Valuation" number={9} defaultOpen={true}>
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

      {/* ── Section 10: 10 & 11 Declaration & Valuer Details (Color: Light Amber #fff8e1) ── */}
      <Section id="sbi-lb-sec-10" title="10 & 11 Declaration & Valuer Details" number={10} defaultOpen={true}>
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

      {/* ── Section: Base Documents ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={12}
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
        technicalAddress={fields.propertyAddress || ''}
        propertyAddress={fields.propertyAddress || ''}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={13}
        sectionId="section-maps"
      />

      {/* ── Section: Photographs ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={14}
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
