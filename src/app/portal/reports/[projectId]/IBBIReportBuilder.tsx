'use client';

/**
 * IBBIReportBuilder — Report Builder for IBBI-IVS Valuation Reports
 * (Organisation Client: IBBI)
 *
 * Mirrors the architecture of GeneralReportBuilder.tsx but with IBBI-specific
 * sections (14 statutory sections), fields, and PDF layout.
 *
 * Key differences from GeneralReportBuilder:
 *   - Sections 1–3 are auto-generated (IBBI statutory text)
 *   - Valuation Certificate appears BEFORE Section 1 in the PDF
 *   - Section 13 uses Annexure Excel uploads for plot-by-plot tables
 *   - No wizard flow — this builder is directly for IBBI organisation clients
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification, getBucketImages, deleteBucketImage } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { PDFIBBIRenderer } from '@/lib/pdf-ibbi-renderer';
import AiAssistPanel from '@/components/AiAssistPanel';
import type { Suggestion } from '@/lib/ai/predictor';
// @ts-ignore
import * as XLSX from 'xlsx';

const SERVICES_LIST = [
  { id: 'mortgage_loan', title: 'Mortgage & Loan Security Valuation' },
  { id: 'land_valuation', title: 'Land Valuation' },
  { id: 'apartment_valuation', title: 'Apartment Valuation' },
];

// ─── Types ─────────────────────────────────────────────────────────
export interface PlinthAreaRow {
  floorDetails: string;
  actualArea: string;
  consideredArea: string;
}

interface AnnexureItem {
  id: string;
  label: string;          // 'A', 'B', 'C', ...
  title?: string;         // Custom title for the annexure
  excelFileUrl: string;   // Uploaded Excel URL from Supabase
  excelFileName: string;  // Original filename
  parsedData?: {          // Parsed Excel table data
    headers: string[];
    rows: string[][];
  };
}

export interface ValuationRow {
  id: string;
  plotNo: string;
  khataNo: string;
  area: string;
  rate: string;
  guidelineValue: string;
  fairMarketValue: string;
}

export interface GuidelinePlotRow {
  id: string;
  mouza: string;
  nature: string;
  owner: string;
  plotNo: string;
  khataNo: string;
  area: string;
  ratePerDec: string;
  amount: string;
}

export interface PresentPlotRow {
  id: string;
  mouza: string;
  nature: string;
  owner: string;
  plotNo: string;
  khataNo: string;
  area: string;
  ratePerDec: string;
  amount: string;
}

export interface BuildingCostRow {
  id: string;
  sl: string;
  areaParticular: string;
  plinthArea: string;
  age: string;
  rateSft: string;
  replacementCost: string;
  depreciation: string;
  netValue: string;
}

interface IBBIFields {
  // ── Common / Cover Page ──
  ownerName: string;
  ownerAddress: string;
  propertyAddress: string;
  addressPrefixType?: string;
  customAddressPrefix?: string;
  legalAddress: string;
  dateOfInspection: string;
  dateOfValuation: string;
  refNo: string;

  // ── Section 4: Brief Description ──
  applicantName: string;
  hasManagingDirector?: string;
  managingDirectorName?: string;
  coverPageImage?: string;
  propertyType: string;
  currentUsage: string;
  revenuePlotNo: string;
  revenueKhataNo: string;
  revenueVillage: string;
  revenueTahasil: string;
  revenuePS: string;
  revenueGP: string;
  revenueDistrict: string;
  revenueState: string;
  classificationArea: string;
  conversionStatus: string;
  boundEast: string;
  boundWest: string;
  boundNorth: string;
  boundSouth: string;
  extentOfSite: string;
  occupancyStatus: string;
  crzArea: string;
  floodProneArea: string;
  extentConsidered: string;

  // ── Section 5: Town Planning ──
  masterPlanProvision: string;
  approvedPlanDate: string;
  approvedPlanAuthority: string;
  developmentControls: string;
  groundCoverage: string;
  surroundingLandUse: string;
  planGenuineness: string;
  planAuthenticityComments: string;
  otherAspect5: string;

  // ── Section 6: Legal Aspects ──
  ownershipDocuments: string;
  ownerAsPerROR: string;
  easementAgreement: string;
  acquisitionNotification: string;
  roadWideningNotification: string;
  heritageRestriction: string;
  transferability: string;
  existingMortgages: string;
  guaranteeIssued: string;
  sarfaesiCompliant: string;
  disputesDues: string;

  // ── Section 7: Infrastructure ──
  waterSupply: string;
  sewerage: string;
  stormWater: string;
  solidWaste: string;
  electricity: string;
  roadConnectivity: string;
  policeStationDist: string;
  busStopDist: string;
  schoolDist: string;
  collegeDist: string;
  spaceAllocation: string;
  storageSpaces: string;
  utilitySpaces: string;
  carParking: string;
  balconies: string;

  // ── Section 8 & 9: Socio-Cultural / Environment ──
  socialStructure: string;
  socialInfrastructure: string;
  ecoMaterials: string;
  rainWaterHarvesting: string;
  solarSystem: string;
  environmentalPollution: string;

  // ── Section 10 & 11: Marketability / Architecture ──
  locationalAttributes: string;
  scarcity: string;
  demandSupply: string;
  comparableSalePrices: string;
  otherMarketability: string;
  architecturalAspects: string;

  // ── Section 12: Engineering ──
  constructionType: string;
  materialsUsed: string;
  specifications: string;
  maintenanceIssues: string;
  ageOfBuilding: string;
  residualLife: string;
  totalLife: string;
  extentDeterioration: string;
  structuralSafety: string;
  naturalDisasterProtection: string;
  visibleDamage: string;
  airConditioning: string;
  fireFighting: string;
  yearOfConstruction: string;
  foundationType: string;
  superstructure: string;
  buildingType: string;
  numberOfFloors: string;
  roofType: string;
  roofHeight: string;
  flooringType: string;
  joineriesType: string;
  amenitiesFitting: string;
  buildingCondition: string;
  constructionQuality: string;
  assumedSalvageValue: string;
  plinthArea12: string;
  plinthAreaOption: string;
  plinthAreaCustom: string;
  plinthAreaTable: PlinthAreaRow[];

  // ── Section 13: Valuation ──
  valuationVariant: string;
  methodology13_1?: string;
  considerations13_3?: string;
  assumptions13_4?: string;
  analysis13_5?: string;

  // ── Section 13.6: Details of Valuation ──
  // Guideline Value Plot Table
  guidelinePlotRows: GuidelinePlotRow[];
  guidelinePlotTotal: string;
  guidelineDiscountPercent: string;
  guidelineDiscountedTotal: string;
  // Present Market Value Plot Table
  presentMarketDescription: string;
  presentPlotRows: PresentPlotRow[];
  presentPlotTotal: string;
  presentDiscountPercent: string;
  presentDiscountedTotal: string;
  // Building/Shed Cost (Fair Market Value)
  hasBuildingCost: boolean;
  rccRowsFMV: BuildingCostRow[];
  shedRowsFMV: BuildingCostRow[];
  rccDepreciationPercentFMV: string;
  shedDepreciationPercentFMV: string;
  totalRccFMV: string;
  totalShedFMV: string;
  totalBuildingValueFMV: string;
  depreciationDescFMV: string;
  compoundWallValueFMV: string;
  compoundWallLengthFMV: string;
  compoundWallRateFMV: string;
  totalBuildingShedComponentsFMV: string;
  // Building/Shed Cost (Guideline Value)
  rccRowsGuideline: BuildingCostRow[];
  shedRowsGuideline: BuildingCostRow[];
  rccDepreciationPercentGuideline: string;
  shedDepreciationPercentGuideline: string;
  totalRccGuideline: string;
  totalShedGuideline: string;
  totalBuildingValueGuideline: string;
  depreciationDescGuideline: string;
  compoundWallValueGuideline: string;
  compoundWallLengthGuideline: string;
  compoundWallRateGuideline: string;
  totalBuildingShedComponentsGuideline: string;
  // Abstract of Valuation
  presentValueOfPlot: string;
  presentValueOfBuildings: string;
  totalPresentValue: string;
  totalPresentValueOrSay: string;
  totalPresentValueInWords: string;
  bookValueOfPlot: string;
  bookValueOfBuildings: string;
  totalBookValue: string;
  totalBookValueOrSay: string;
  totalBookValueInWords: string;
  // Realisable / Liquidation
  realisableValueAmount: string;
  realisableValueOrSay: string;
  realisableValueInWords: string;
  // Cuttack variant extras
  cuttackLandComponentDescGuideline: string;
  cuttackCompoundWallGuideline: string;
  cuttackCompoundWallLengthGuideline: string;
  cuttackCompoundWallRateGuideline: string;
  cuttackShedsDepreciationGuideline: string;
  cuttackShedsDepPctGuideline: string;
  cuttackShedsDepAmtGuideline: string;
  cuttackTotalGuidelineLandBuilding: string;
  cuttackGuidelineOrSay: string;
  cuttackGuidelineInWords: string;
  cuttackLandComponentDescPresent: string;
  cuttackCompoundWallPresent: string;
  cuttackCompoundWallLengthPresent: string;
  cuttackCompoundWallRatePresent: string;
  cuttackShedsDepreciationPresent: string;
  cuttackShedsDepPctPresent: string;
  cuttackShedsDepAmtPresent: string;
  cuttackTotalPresentLandBuilding: string;
  cuttackPresentOrSay: string;
  cuttackPresentInWords: string;
  cuttackBuildingRows: BuildingCostRow[];
  cuttackBuildingDepreciationPercent: string;
  cuttackBuildingTotal: string;
  cuttackBuildingComponentsTotal: string;
  cuttackBuildingOrSay: string;
  cuttackBuildingInWords: string;

  // ── Section 14: Site Location ──
  latitude: string;
  longitude: string;
  locationSearchQuery: string;

  // ── Photos & Maps ──
  propertyImages: string[];
  propertyImageNames: string[];
  sketchMapImages: string[];
  locationMapImage: string;

  // ── Section 14 Map Sub-headings ──
  mouzaMapImage: string;
  mouzaMapTitle: string;
  revenueMapImage: string;
  revenueMapTitle: string;
  cdpMapImage: string;
  cdpMapTitle: string;
  guidelineValueImage: string;
  guidelineValueTitle: string;
  rorPattaImage: string;
  rorPattaTitle: string;

  // ── Remarks ──
  representativeName: string;
  representativeFatherName: string;
  valuerQualifications: string;
  valuerAdditionalDetails: string;
  registeredOfficeAddress: string;
  registeredOfficeTel: string;

  // ── Annexure ──
  annexureEnabled: boolean;
  annexures: AnnexureItem[];

  // ── Valuation Certificate (dedicated) ──
  certificateDescription?: string;
  ownerContactDetails?: string;
  caseParties?: string;
  caseReferenceNo2?: string;
  appointedByDesignation?: string;

  // ── Section 1 Sub-section Overrides ──
  basis3?: string;
  scope2_1?: string;
  scope2_2?: string;
  scope2_3?: string;
  scope2_4?: string;
  scope2_5?: string;
  objective1_1?: string;
  objective1_2?: string;
  objective1_3?: string;
  objective1_4?: string;
  objective1_5?: string;
  objective1_6?: string;
  objective1_7?: string;

  // ── Meta ──
  clientType?: string;
  organisationTemplate?: string;
  [key: string]: any;
}

const DEFAULT_FIELDS: IBBIFields = {
  ownerName: '',
  ownerAddress: '',
  propertyAddress: '',
  addressPrefixType: 'none',
  customAddressPrefix: '',
  legalAddress: '',
  dateOfInspection: new Date().toISOString().split('T')[0],
  dateOfValuation: new Date().toISOString().split('T')[0],
  refNo: '',
  purposeOfValuation: 'To assess the Fair Market Value for Auction / Liquidation purpose',
  valuationMethod: 'Sale Comparison Method coupled with Replacement Cost Approach',
  propertyDescription: '',
  caseReferenceNo: '',
  caseReferenceNo2: '',
  appointedBy: '',
  appointedByDesignation: '',
  appointmentDate: '',
  caseParties: '',
  certificateDescription: '',
  ownerContactDetails: '',

  applicantName: '',
  hasManagingDirector: 'no',
  managingDirectorName: '',
  coverPageImage: '',
  propertyType: 'Defunct Industrial Unit',
  currentUsage: 'Vacant',
  revenuePlotNo: '',
  revenueKhataNo: '',
  revenueVillage: '',
  revenueTahasil: '',
  revenuePS: '',
  revenueGP: '',
  revenueDistrict: '',
  revenueState: 'Odisha',
  classificationArea: 'Rural Area',
  conversionStatus: 'Agricultural',
  boundEast: '',
  boundWest: '',
  boundNorth: '',
  boundSouth: '',
  extentOfSite: '',
  occupancyStatus: 'Vacant',
  crzArea: 'NO',
  floodProneArea: 'NO',
  extentConsidered: '',

  masterPlanProvision: '',
  approvedPlanDate: '',
  approvedPlanAuthority: '',
  developmentControls: '',
  groundCoverage: '',
  surroundingLandUse: '',
  planGenuineness: '',
  planAuthenticityComments: '',
  otherAspect5: '',

  ownershipDocuments: 'ROR',
  ownerAsPerROR: '',
  easementAgreement: 'None',
  acquisitionNotification: 'None',
  roadWideningNotification: 'None',
  heritageRestriction: 'None',
  transferability: 'No restriction',
  existingMortgages: 'None',
  guaranteeIssued: 'No information',
  sarfaesiCompliant: 'Pending Legal Opinion',
  disputesDues: 'None observed',

  waterSupply: 'Not Available',
  sewerage: 'Not Available',
  stormWater: 'No',
  solidWaste: 'No',
  electricity: 'Not Available',
  roadConnectivity: '',
  policeStationDist: '',
  busStopDist: '',
  schoolDist: '',
  collegeDist: '',
  spaceAllocation: 'NO',
  storageSpaces: 'NO',
  utilitySpaces: 'NO',
  carParking: 'NO',
  balconies: 'NO',

  socialStructure: 'Average',
  socialInfrastructure: 'No',
  ecoMaterials: 'No',
  rainWaterHarvesting: 'No',
  solarSystem: 'No',
  environmentalPollution: 'None observed',

  locationalAttributes: 'Average',
  scarcity: 'No',
  demandSupply: 'Restricted',
  comparableSalePrices: '',
  otherMarketability: '',
  architecturalAspects: 'None',

  constructionType: 'None at site',
  materialsUsed: 'None at site',
  specifications: 'None at site',
  maintenanceIssues: 'None at site',
  ageOfBuilding: '0',
  residualLife: '0',
  totalLife: '',
  extentDeterioration: 'None',
  structuralSafety: 'None',
  naturalDisasterProtection: 'None',
  visibleDamage: 'None',
  airConditioning: 'None at site',
  fireFighting: 'None at site',
  yearOfConstruction: '',
  foundationType: 'None at site',
  superstructure: 'None at site',
  buildingType: 'None at site',
  numberOfFloors: '',
  roofType: 'None at site',
  roofHeight: '',
  flooringType: 'None at site',
  joineriesType: 'None at site',
  amenitiesFitting: 'None at site',
  buildingCondition: 'None at site',
  constructionQuality: 'Not Applicable',
  assumedSalvageValue: 'Not Applicable',
  plinthArea12: 'Not Applicable',
  plinthAreaOption: 'NOT APPLICABLE',
  plinthAreaCustom: '',
  plinthAreaTable: [{ floorDetails: '1. GROUND FLOOR RCC', actualArea: '5240 sqft', consideredArea: '5240 sqft' }],

  valuationVariant: 'standard',
  methodology13_1: '',
  considerations13_3: '',
  assumptions13_4: '',
  analysis13_5: '',
  // Guideline Value Plot Table
  guidelinePlotRows: [],
  guidelinePlotTotal: '',
  guidelineDiscountPercent: '40',
  guidelineDiscountedTotal: '',
  // Present Market Value Plot Table
  presentMarketDescription: 'The present market value is the price a willing buyer is paying a seller considering all the encumbrances, risks involved, cost of funds and road accessibility keeping in view the current market trends, and, estimation of benefit in the locality as a going concern matter',
  presentPlotRows: [],
  presentPlotTotal: '',
  presentDiscountPercent: '40',
  presentDiscountedTotal: '',
  // Building/Shed Cost (Fair Market Value)
  hasBuildingCost: false,
  rccRowsFMV: [],
  shedRowsFMV: [],
  rccDepreciationPercentFMV: '70',
  shedDepreciationPercentFMV: '90',
  totalRccFMV: '',
  totalShedFMV: '',
  totalBuildingValueFMV: '',
  depreciationDescFMV: 'Present depreciated market value of the available RCC buildings, at its present status, assessed @ 30% of the present value And @10% For Acc Roof Sheds',
  compoundWallValueFMV: '',
  compoundWallLengthFMV: '',
  compoundWallRateFMV: '',
  totalBuildingShedComponentsFMV: '',
  // Building/Shed Cost (Guideline Value)
  rccRowsGuideline: [],
  shedRowsGuideline: [],
  rccDepreciationPercentGuideline: '70',
  shedDepreciationPercentGuideline: '90',
  totalRccGuideline: '',
  totalShedGuideline: '',
  totalBuildingValueGuideline: '',
  depreciationDescGuideline: 'Present depreciated market value of the available RCC buildings, at its present status, assessed @ 30% of the present value And @10% For Acc Roof Sheds',
  compoundWallValueGuideline: '',
  compoundWallLengthGuideline: '',
  compoundWallRateGuideline: '',
  totalBuildingShedComponentsGuideline: '',
  // Abstract of Valuation
  presentValueOfPlot: '',
  presentValueOfBuildings: '',
  totalPresentValue: '',
  totalPresentValueOrSay: '',
  totalPresentValueInWords: '',
  bookValueOfPlot: '',
  bookValueOfBuildings: '',
  totalBookValue: '',
  totalBookValueOrSay: '',
  totalBookValueInWords: '',
  // Realisable / Liquidation
  realisableValueAmount: '',
  realisableValueOrSay: '',
  realisableValueInWords: '',
  // Cuttack variant extras
  cuttackLandComponentDescGuideline: 'As per the Benchmark Rates furnished by SRO- Jagatpur, Dist- Cuttack, the bench mark value of plot stands as under, which is treated as the latest govt. circle value.',
  cuttackCompoundWallGuideline: '',
  cuttackCompoundWallLengthGuideline: '',
  cuttackCompoundWallRateGuideline: '',
  cuttackShedsDepreciationGuideline: '',
  cuttackShedsDepPctGuideline: '50',
  cuttackShedsDepAmtGuideline: '',
  cuttackTotalGuidelineLandBuilding: '',
  cuttackGuidelineOrSay: '',
  cuttackGuidelineInWords: '',
  cuttackLandComponentDescPresent: 'As per the Benchmark Rates furnished by SRO- Jagatpur, Dist- Cuttack, the bench mark value of plot stands as under, which is treated as the latest govt. circle value along with land development charges inclusive of backfilling, levelling,electric conduiting and Transformers.',
  cuttackCompoundWallPresent: '',
  cuttackCompoundWallLengthPresent: '',
  cuttackCompoundWallRatePresent: '',
  cuttackShedsDepreciationPresent: '',
  cuttackShedsDepPctPresent: '50',
  cuttackShedsDepAmtPresent: '',
  cuttackTotalPresentLandBuilding: '',
  cuttackPresentOrSay: '',
  cuttackPresentInWords: '',
  cuttackBuildingRows: [],
  cuttackBuildingDepreciationPercent: '50',
  cuttackBuildingTotal: '',
  cuttackBuildingComponentsTotal: '',
  cuttackBuildingOrSay: '',
  cuttackBuildingInWords: '',

  latitude: '',
  longitude: '',
  locationSearchQuery: '',

  propertyImages: [],
  propertyImageNames: [],
  sketchMapImages: [],
  locationMapImage: '',

  mouzaMapImage: '',
  mouzaMapTitle: 'MOUZA MAP SUPERIMPOSED OVER SATELLITE MAP',
  revenueMapImage: '',
  revenueMapTitle: 'REVENUE MAP',
  cdpMapImage: '',
  cdpMapTitle: 'CDP MAP',
  guidelineValueImage: '',
  guidelineValueTitle: 'GOVT GUIDELINE VALUE',
  rorPattaImage: '',
  rorPattaTitle: 'ROR/PATTA',

  representativeName: '',
  representativeFatherName: '',
  valuerQualifications: '',
  valuerAdditionalDetails: '',
  registeredOfficeAddress: '',
  registeredOfficeTel: '',

  annexureEnabled: false,
  annexures: [],

  basis3: '',
  scope2_1: '',
  scope2_2: '',
  scope2_3: '',
  scope2_4: '',
  scope2_5: '',
  objective1_1: '',
  objective1_2: '',
  objective1_3: '',
  objective1_4: '',
  objective1_5: '',
  objective1_6: '',
  objective1_7: '',

  clientType: 'organisation',
  organisationTemplate: 'IBBI_IVS',
};

// ─── UI Sub-Components ─────────────────────────────────────────────
function Section({ title, number, children, defaultOpen = true }: { title: string; number: number | string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={`section-${number}`} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1628] to-[#162d4a] text-white hover:from-[#0f1e35] hover:to-[#1e3a5f] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#b8860b] flex items-center justify-center text-sm font-bold">{number}</span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] disabled:bg-[#f1f3f5] disabled:text-[#6c757d]";
const selectCls = inputCls;

const FloatingNavigator = ({ annexureEnabled }: { annexureEnabled: boolean }) => {
  const [activeId, setActiveId] = useState<string>('');

  const NAV_SECTIONS = [
    { id: 'section-1', title: '1. Objective' },
    { id: 'section-4', title: '4. Description' },
    { id: 'section-5', title: '5. Town Planning' },
    { id: 'section-6', title: '6. Legal Aspects' },
    { id: 'section-7', title: '7. Infrastructure' },
    { id: 'section-8', title: '8. Socio-Cultural' },
    { id: 'section-9', title: '9. Environmental' },
    { id: 'section-10', title: '10. Marketability' },
    { id: 'section-11', title: '11. Architectural' },
    { id: 'section-12', title: '12. Engineering' },
    { id: 'section-13', title: '13. Valuation' },
    { id: 'section-14', title: '14. Photos/Maps' },
    ...(annexureEnabled ? [{ id: 'section-annexure', title: 'Annexures' }] : []),
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    NAV_SECTIONS.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [annexureEnabled]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hidden xl:flex flex-col gap-0 bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-[160px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-neutral-400 mb-1 px-2 uppercase tracking-widest">IBBI Sections</div>
      {NAV_SECTIONS.map((sec: any) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`text-left py-1 px-2.5 rounded-lg transition-all flex flex-col justify-center ${
              !sec.indent 
                ? 'my-1 font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-100 shadow-sm' 
                : 'pl-3.5 text-slate-600 hover:bg-[#b8860b]/10 hover:text-[#b8860b]'
            } ${
              isActive
                ? '!bg-[#b8860b] !text-white !border-[#b8860b] shadow-md'
                : ''
            }`}
          >
            <span className={`leading-tight truncate w-full ${sec.indent ? 'text-[11px] font-bold' : 'text-[11.5px]'}`}>
              {sec.title}
            </span>
            {sec.sub && (
              <span className={`text-[9px] font-semibold tracking-wider mt-0.5 ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>
                {sec.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
interface BucketImageItem {
  id: string;
  url: string;
  fileName: string;
  size: number;
  createdAt: string;
  employee: { name: string; employeeId: string };
}

interface IBBIReportBuilderProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole?: string;
  bucketImages?: BucketImageItem[];
  prefill?: {
    ownerName?: string;
    ownerAddress?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  onReset?: () => void;
}

const cleanAddressForMap = (rawAddr: string): string => {
  if (!rawAddr || !rawAddr.trim()) return '';
  let str = rawAddr.trim();
  str = str.replace(/\([^)]*\)/gi, '');
  str = str.replace(/\bAREA-?[^,]+/gi, '');
  str = str.replace(/\bKISSAM:?[^,]+/gi, '');
  str = str.replace(/\b(KHATA|PLOT|SURVEY|STREET|WARD)\s*NO:?[^,]+/gi, '');
  str = str.replace(/^(MR|MRS|DR|MS|M\/S)\.?[^,]+,?\s*/gi, '');
  str = str.replace(/^[A-Z\s.&]+\s*&\s*OTHERS,?\s*/gi, '');
  str = str.replace(/\b(AT\/PO|PS|DIST|THANA|TAHASIL|MOUZA):?\s*/gi, '');
  str = str.replace(/\b\d+([\/\-]\d+)*\b/g, '');
  str = str
    .replace(/["';]/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
  return str;
};

const getIBBILocationAddress = (fields: IBBIFields): string => {
  if (fields.propertyAddress && fields.propertyAddress.trim()) {
    const cleaned = cleanAddressForMap(fields.propertyAddress);
    if (cleaned) return cleaned;
  }
  if (fields.ownerAddress && fields.ownerAddress.trim()) {
    const cleaned = cleanAddressForMap(fields.ownerAddress);
    if (cleaned) return cleaned;
  }
  return '';
};

export default function IBBIReportBuilder({ projectId, projectCode, initialFields, status, userRole = 'REPORT_EMPLOYEE', bucketImages = [], prefill, onReset }: IBBIReportBuilderProps) {
  const router = useRouter();


  const merged: IBBIFields = {
    ...DEFAULT_FIELDS,
    ...(typeof initialFields === 'object' && initialFields !== null ? initialFields : {}),
    refNo: initialFields?.refNo || projectCode || DEFAULT_FIELDS.refNo,
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
    propertyImages: Array.isArray(initialFields?.propertyImages) ? initialFields.propertyImages : DEFAULT_FIELDS.propertyImages,
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : DEFAULT_FIELDS.propertyImageNames,
    sketchMapImages: Array.isArray(initialFields?.sketchMapImages) 
      ? initialFields.sketchMapImages 
      : (typeof initialFields?.sketchMapImage === 'string' && initialFields.sketchMapImage ? [initialFields.sketchMapImage] : DEFAULT_FIELDS.sketchMapImages),
    valuationRows: Array.isArray(initialFields?.valuationRows) ? initialFields.valuationRows : DEFAULT_FIELDS.valuationRows,
    annexures: Array.isArray(initialFields?.annexures) ? initialFields.annexures : DEFAULT_FIELDS.annexures,
    clientType: 'organisation',
    organisationTemplate: 'IBBI_IVS',
    cuttackLandComponentDescGuideline: initialFields?.cuttackLandComponentDescGuideline || DEFAULT_FIELDS.cuttackLandComponentDescGuideline,
    cuttackLandComponentDescPresent: initialFields?.cuttackLandComponentDescPresent || DEFAULT_FIELDS.cuttackLandComponentDescPresent,
  };

  const [fields, setFields] = useState<IBBIFields>(merged);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bucket Picker State
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerMode, setBucketPickerMode] = useState<'propertyImages' | 'sketchMapImages' | 'locationMapImage' | 'coverPageImage'>('propertyImages');
  const [bucketSelected, setBucketSelected] = useState<Set<string>>(new Set());
  const [bucketPickerAgent, setBucketPickerAgent] = useState<string | null>(null);

  const [localBucketImages, setLocalBucketImages] = useState<any[]>(bucketImages);

  const handleDeleteBucketImage = async (img: any) => {
    if (!confirm('Delete this photo from the bucket?')) return;
    try {
      await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .remove([img.storagePath]);

      const res = await deleteBucketImage(img.id);
      if (res.error) {
        alert(res.error);
      } else {
        setLocalBucketImages(prev => prev.filter(i => i.id !== img.id));
        setBucketSelected(prev => {
          const next = new Set(prev);
          next.delete(img.id);
          return next;
        });
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete photo.');
    }
  };

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const bypassUnloadRef = useRef(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isInitialMount = useRef(true);
  const debouncedSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
    }

    debouncedSaveTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res?.error) {
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => {
      if (debouncedSaveTimer.current) {
        clearTimeout(debouncedSaveTimer.current);
      }
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassUnloadRef.current || isReadOnly) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

    useEffect(() => {
    const calcTotalByField = (rows: any[], field: string) => {
      return rows.reduce((acc, row) => {
        const cleanAmount = String(row[field] || '').replace(/[^0-9.]/g, '');
        const val = parseFloat(cleanAmount);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    };

    const calcTotal = (rows: any[]) => calcTotalByField(rows, 'amount');

    const guidelineSum = calcTotal(fields.guidelinePlotRows || []);
    const presentSum = calcTotal(fields.presentPlotRows || []);

    const newGuidelineTotal = guidelineSum > 0 ? `Rs. ${formatIndianCurrency(guidelineSum.toString())}` : '';
    const newPresentTotal = presentSum > 0 ? `Rs. ${formatIndianCurrency(presentSum.toString())}` : '';

    const guidelineDiscPct = parseFloat(fields.guidelineDiscountPercent) || 0;
    const presentDiscPct = parseFloat(fields.presentDiscountPercent) || 0;

    const guidelineDiscounted = guidelineSum * (1 - (guidelineDiscPct / 100));
    const presentDiscounted = presentSum * (1 - (presentDiscPct / 100));

    const newGuidelineDiscountedTotal = guidelineDiscounted > 0 ? `Rs. ${formatIndianCurrency(Math.round(guidelineDiscounted).toString())}` : '';
    const newPresentDiscountedTotal = presentDiscounted > 0 ? `Rs. ${formatIndianCurrency(Math.round(presentDiscounted).toString())}` : '';

    
    const rccFMVSum = calcTotalByField(fields.rccRowsFMV || [], 'netValue');
    const shedFMVSum = calcTotalByField(fields.shedRowsFMV || [], 'netValue');
    const totalBldgFMV = rccFMVSum + shedFMVSum;
    
    const rccGuidelineSum = calcTotalByField(fields.rccRowsGuideline || [], 'netValue');
    const shedGuidelineSum = calcTotalByField(fields.shedRowsGuideline || [], 'netValue');
    const totalBldgGuideline = rccGuidelineSum + shedGuidelineSum;

    const cuttackBldgSum = calcTotalByField(fields.cuttackBuildingRows || [], 'netValue');

    const fmt = (val: number) => `Rs. ${formatIndianCurrency(Math.round(val || 0).toString())}`;

    const newRccFMV = fmt(rccFMVSum);
    const newShedFMV = fmt(shedFMVSum);
    const newTotalBldgFMV = fmt(totalBldgFMV);
    
    const newRccGuideline = fmt(rccGuidelineSum);
    const newShedGuideline = fmt(shedGuidelineSum);
    const newTotalBldgGuideline = fmt(totalBldgGuideline);
    
    const newCuttackBldgTotal = fmt(cuttackBldgSum);

    const calcCW = (lenStr: any, rateStr: any) => {
      const l = parseFloat(String(lenStr || '').replace(/[^\d.]/g, '')) || 0;
      const r = parseFloat(String(rateStr || '').replace(/[^\d.]/g, '')) || 0;
      return l * r;
    };
    
    const cwFmv = calcCW(fields.compoundWallLengthFMV, fields.compoundWallRateFMV);
    const newCwFmvFormatted = formatIndianCurrency(Math.round(cwFmv || 0).toString());
    const newCwFmvStr = `Present depreciated market value of the Compound wall,over the plot, ${fields.compoundWallLengthFMV || 0} @ ${fields.compoundWallRateFMV || 0}    |	 Rs. ${newCwFmvFormatted}`;
    
    const cwGuideline = calcCW(fields.compoundWallLengthGuideline, fields.compoundWallRateGuideline);
    const newCwGuidelineFormatted = formatIndianCurrency(Math.round(cwGuideline || 0).toString());
    const newCwGuidelineStr = `Present depreciated market value of the Compound wall,over the plot, ${fields.compoundWallLengthGuideline || 0} @ ${fields.compoundWallRateGuideline || 0}    |	 Rs. ${newCwGuidelineFormatted}`;

    const cwCuttackGuideline = calcCW(fields.cuttackCompoundWallLengthGuideline, fields.cuttackCompoundWallRateGuideline);
    const newCwCuttackGuidelineFormatted = formatIndianCurrency(Math.round(cwCuttackGuideline || 0).toString());
    const newCwCuttackGuidelineStr = `Present depreciated market value of the Compound wall,over the plot, ${fields.cuttackCompoundWallLengthGuideline || 0} @ ${fields.cuttackCompoundWallRateGuideline || 0}    |	 Rs. ${newCwCuttackGuidelineFormatted}`;
    
    const cwCuttackPresent = calcCW(fields.cuttackCompoundWallLengthPresent, fields.cuttackCompoundWallRatePresent);
    const newCwCuttackPresentFormatted = formatIndianCurrency(Math.round(cwCuttackPresent || 0).toString());
    const newCwCuttackPresentStr = `Present depreciated market value of the Compound wall,over the plot, ${fields.cuttackCompoundWallLengthPresent || 0} @ ${fields.cuttackCompoundWallRatePresent || 0}    |	 Rs. ${newCwCuttackPresentFormatted}`;

    const presentPlotVal = parseFloat(String(fields.presentValueOfPlot || '').replace(/[^\d.]/g, '')) || 0;
    const presentBldgVal = parseFloat(String(fields.presentValueOfBuildings || '').replace(/[^\d.]/g, '')) || 0;
    const totalPresentValNum = presentPlotVal + presentBldgVal;
    const newTotalPresentVal = fmt(totalPresentValNum);
    const orSayPresentNum = totalPresentValNum < 100000 ? totalPresentValNum : Math.floor(totalPresentValNum / 100000) * 100000;
    const newTotalPresentOrSay = fmt(orSayPresentNum);
    const newTotalPresentInWords = `TOTAL PRESENT VALUE IN WORDS - ${rupeesInWords(orSayPresentNum).toUpperCase()}`;

    const bookPlotVal = parseFloat(String(fields.bookValueOfPlot || '').replace(/[^\d.]/g, '')) || 0;
    const bookBldgVal = parseFloat(String(fields.bookValueOfBuildings || '').replace(/[^\d.]/g, '')) || 0;
    const totalBookValNum = bookPlotVal + bookBldgVal;
    const newTotalBookVal = fmt(totalBookValNum);
    const orSayBookNum = totalBookValNum < 100000 ? totalBookValNum : Math.floor(totalBookValNum / 100000) * 100000;
    const newTotalBookOrSay = fmt(orSayBookNum);
    const newTotalBookInWords = `TOTAL BOOK VALUE IN WORDS - ${rupeesInWords(orSayBookNum).toUpperCase()}`;

    const realisableNum = parseFloat(String(fields.realisableValueAmount || '').replace(/[^\d.]/g, '')) || 0;
    const orSayRealisableNum = realisableNum < 100000 ? realisableNum : Math.floor(realisableNum / 100000) * 100000;
    const newRealisableOrSay = fmt(orSayRealisableNum);
    const newRealisableInWords = `TOTAL LIQUIDATION VALUE IN WORDS - ${rupeesInWords(orSayRealisableNum).toUpperCase()}`;

    const componentsFMV = totalBldgFMV + cwFmv;
    const newComponentsFMV = fmt(componentsFMV);
    
    const componentsGuideline = totalBldgGuideline + cwGuideline;
    const newComponentsGuideline = fmt(componentsGuideline);


    const calcDesc = (rccStr: any, shedStr: any) => {
      const rccVal = parseFloat(String(rccStr || '').replace(/[^\d.]/g, '')) || 0;
      const shedVal = parseFloat(String(shedStr || '').replace(/[^\d.]/g, '')) || 0;
      return `Present depreciated market value of the available RCC buildings, at its present status, assessed @ ${100 - rccVal}% of the present value And @${100 - shedVal}% For Acc Roof Sheds`;
    };

    const newDepDescFMV = calcDesc(fields.rccDepreciationPercentFMV, fields.shedDepreciationPercentFMV);
    const newDepDescGuideline = calcDesc(fields.rccDepreciationPercentGuideline, fields.shedDepreciationPercentGuideline);


    // ─── CUTTACK AUTO-CALCULATIONS ───
    // Area sums for label renaming
    const guidelineAreaSum = (fields.guidelinePlotRows || []).reduce((sum: number, row: any) => {
      const m = String(row.area || '').match(/(\d+\.?\d*)/);
      return sum + (m ? parseFloat(m[1]) || 0 : 0);
    }, 0);
    const presentAreaSum = (fields.presentPlotRows || []).reduce((sum: number, row: any) => {
      const m = String(row.area || '').match(/(\d+\.?\d*)/);
      return sum + (m ? parseFloat(m[1]) || 0 : 0);
    }, 0);

    // Cuttack: auto-calc Total Guideline Value for Land and Building
    const cuttackGuidelinePlotNum = parseFloat(String(fields.guidelinePlotTotal || '').replace(/[^\d.]/g, '')) || 0;
    const cuttackShedsDepAmtGuidelineNum = parseFloat(String(fields.cuttackShedsDepAmtGuideline || '').replace(/[^\d.]/g, '')) || 0;
    const cwCuttackGuidelineNum = cwCuttackGuideline; // already computed above
    const newCuttackTotalGuidelineLB = fmt(cuttackGuidelinePlotNum + cuttackShedsDepAmtGuidelineNum + cwCuttackGuidelineNum);

    // Cuttack: auto-calc Total Present Value for Land and Building
    const cuttackPresentPlotNum = parseFloat(String(fields.presentDiscountedTotal || fields.presentPlotTotal || '').replace(/[^\d.]/g, '')) || 0;
    const cuttackShedsDepAmtPresentNum = parseFloat(String(fields.cuttackShedsDepAmtPresent || '').replace(/[^\d.]/g, '')) || 0;
    const cwCuttackPresentNum = cwCuttackPresent; // already computed above
    const newCuttackTotalPresentLB = fmt(cuttackPresentPlotNum + cuttackShedsDepAmtPresentNum + cwCuttackPresentNum);

    // Cuttack: auto-calc Or Say with rounding
    const cuttackGuidelineLBNum = cuttackGuidelinePlotNum + cuttackShedsDepAmtGuidelineNum + cwCuttackGuidelineNum;
    const cuttackGuidelineOrSayNum = cuttackGuidelineLBNum < 100000 ? cuttackGuidelineLBNum : Math.floor(cuttackGuidelineLBNum / 100000) * 100000;
    const newCuttackGuidelineOrSay = fmt(cuttackGuidelineOrSayNum);

    const cuttackPresentLBNum = cuttackPresentPlotNum + cuttackShedsDepAmtPresentNum + cwCuttackPresentNum;
    const cuttackPresentOrSayNum = cuttackPresentLBNum < 100000 ? cuttackPresentLBNum : Math.floor(cuttackPresentLBNum / 100000) * 100000;
    const newCuttackPresentOrSay = fmt(cuttackPresentOrSayNum);

    let updated = false;
    const nextFields = { ...fields };
    if (fields.guidelinePlotTotal !== newGuidelineTotal) {
      nextFields.guidelinePlotTotal = newGuidelineTotal;
      updated = true;
    }
    if (fields.presentPlotTotal !== newPresentTotal) {
      nextFields.presentPlotTotal = newPresentTotal;
      updated = true;
    }
    if (fields.guidelineDiscountedTotal !== newGuidelineDiscountedTotal) {
      nextFields.guidelineDiscountedTotal = newGuidelineDiscountedTotal;
      updated = true;
    }
    if (fields.presentDiscountedTotal !== newPresentDiscountedTotal) {
      nextFields.presentDiscountedTotal = newPresentDiscountedTotal;
      updated = true;
    }
    

    if (fields.totalRccFMV !== newRccFMV) { nextFields.totalRccFMV = newRccFMV; updated = true; }
    if (fields.totalShedFMV !== newShedFMV) { nextFields.totalShedFMV = newShedFMV; updated = true; }
    if (fields.totalBuildingValueFMV !== newTotalBldgFMV) { nextFields.totalBuildingValueFMV = newTotalBldgFMV; updated = true; }
    
    if (fields.totalRccGuideline !== newRccGuideline) { nextFields.totalRccGuideline = newRccGuideline; updated = true; }
    if (fields.totalShedGuideline !== newShedGuideline) { nextFields.totalShedGuideline = newShedGuideline; updated = true; }
    if (fields.totalBuildingValueGuideline !== newTotalBldgGuideline) { nextFields.totalBuildingValueGuideline = newTotalBldgGuideline; updated = true; }
    
    if (fields.cuttackBuildingTotal !== newCuttackBldgTotal) { nextFields.cuttackBuildingTotal = newCuttackBldgTotal; updated = true; }

    // Cuttack Building/Shed: auto-calc Or Say from Total Components
    const cuttackBldgComponentsNum = parseFloat(String(fields.cuttackBuildingComponentsTotal || '').replace(/[^\d.]/g, '')) || 0;
    const cuttackBldgOrSayNum = cuttackBldgComponentsNum < 100000 ? cuttackBldgComponentsNum : Math.floor(cuttackBldgComponentsNum / 100000) * 100000;
    const newCuttackBldgOrSay = fmt(cuttackBldgOrSayNum);
    if (fields.cuttackBuildingOrSay !== newCuttackBldgOrSay) { nextFields.cuttackBuildingOrSay = newCuttackBldgOrSay; updated = true; }
    
    if (fields.totalBuildingShedComponentsFMV !== newComponentsFMV) { nextFields.totalBuildingShedComponentsFMV = newComponentsFMV; updated = true; }
    if (fields.totalBuildingShedComponentsGuideline !== newComponentsGuideline) { nextFields.totalBuildingShedComponentsGuideline = newComponentsGuideline; updated = true; }
    if (fields.compoundWallValueFMV !== newCwFmvStr) { nextFields.compoundWallValueFMV = newCwFmvStr; updated = true; }
    if (fields.compoundWallValueGuideline !== newCwGuidelineStr) { nextFields.compoundWallValueGuideline = newCwGuidelineStr; updated = true; }
    if (fields.cuttackCompoundWallGuideline !== newCwCuttackGuidelineStr) { nextFields.cuttackCompoundWallGuideline = newCwCuttackGuidelineStr; updated = true; }
    if (fields.cuttackCompoundWallPresent !== newCwCuttackPresentStr) { nextFields.cuttackCompoundWallPresent = newCwCuttackPresentStr; updated = true; }
    
    if (fields.totalPresentValue !== newTotalPresentVal) { nextFields.totalPresentValue = newTotalPresentVal; updated = true; }
    if (fields.totalPresentValueOrSay !== newTotalPresentOrSay) { nextFields.totalPresentValueOrSay = newTotalPresentOrSay; updated = true; }
    if (fields.totalPresentValueInWords !== newTotalPresentInWords) { nextFields.totalPresentValueInWords = newTotalPresentInWords; updated = true; }

    if (fields.totalBookValue !== newTotalBookVal) { nextFields.totalBookValue = newTotalBookVal; updated = true; }
    if (fields.totalBookValueOrSay !== newTotalBookOrSay) { nextFields.totalBookValueOrSay = newTotalBookOrSay; updated = true; }
    if (fields.totalBookValueInWords !== newTotalBookInWords) { nextFields.totalBookValueInWords = newTotalBookInWords; updated = true; }

    if (fields.realisableValueOrSay !== newRealisableOrSay) { nextFields.realisableValueOrSay = newRealisableOrSay; updated = true; }
    if (fields.realisableValueInWords !== newRealisableInWords) { nextFields.realisableValueInWords = newRealisableInWords; updated = true; }
    
    if (fields.depreciationDescFMV !== newDepDescFMV) { nextFields.depreciationDescFMV = newDepDescFMV; updated = true; }
    if (fields.depreciationDescGuideline !== newDepDescGuideline) { nextFields.depreciationDescGuideline = newDepDescGuideline; updated = true; }
    // Cuttack auto-calc updates
    if (fields.cuttackTotalGuidelineLandBuilding !== newCuttackTotalGuidelineLB) { nextFields.cuttackTotalGuidelineLandBuilding = newCuttackTotalGuidelineLB; updated = true; }
    if (fields.cuttackGuidelineOrSay !== newCuttackGuidelineOrSay) { nextFields.cuttackGuidelineOrSay = newCuttackGuidelineOrSay; updated = true; }
    if (fields.cuttackTotalPresentLandBuilding !== newCuttackTotalPresentLB) { nextFields.cuttackTotalPresentLandBuilding = newCuttackTotalPresentLB; updated = true; }
    if (fields.cuttackPresentOrSay !== newCuttackPresentOrSay) { nextFields.cuttackPresentOrSay = newCuttackPresentOrSay; updated = true; }


    if (updated) {
      setFields(nextFields);
    }
  }, [
    fields.guidelinePlotRows, fields.presentPlotRows, 
    fields.guidelinePlotTotal, fields.presentPlotTotal,
    fields.guidelineDiscountPercent, fields.presentDiscountPercent,
    fields.guidelineDiscountedTotal, fields.presentDiscountedTotal,
    fields.rccRowsFMV, fields.shedRowsFMV, fields.rccRowsGuideline, fields.shedRowsGuideline, fields.cuttackBuildingRows,
    fields.totalRccFMV, fields.totalShedFMV, fields.totalBuildingValueFMV,
    fields.totalRccGuideline, fields.totalShedGuideline, fields.totalBuildingValueGuideline,
    fields.cuttackBuildingTotal, fields.cuttackBuildingComponentsTotal, fields.cuttackBuildingOrSay,
    fields.rccDepreciationPercentFMV, fields.shedDepreciationPercentFMV,
    fields.rccDepreciationPercentGuideline, fields.shedDepreciationPercentGuideline,
    fields.depreciationDescFMV, fields.depreciationDescGuideline,
    fields.compoundWallLengthFMV, fields.compoundWallRateFMV,
    fields.presentValueOfPlot, fields.presentValueOfBuildings,
    fields.bookValueOfPlot, fields.bookValueOfBuildings,
    fields.realisableValueAmount,
    fields.compoundWallLengthGuideline, fields.compoundWallRateGuideline,
    fields.cuttackCompoundWallLengthGuideline, fields.cuttackCompoundWallRateGuideline,
    fields.cuttackCompoundWallLengthPresent, fields.cuttackCompoundWallRatePresent,
    fields.compoundWallValueFMV, fields.compoundWallValueGuideline,
    fields.totalBuildingShedComponentsFMV, fields.totalBuildingShedComponentsGuideline,
    fields.cuttackCompoundWallGuideline, fields.cuttackCompoundWallPresent,
    fields.cuttackShedsDepAmtGuideline, fields.cuttackShedsDepAmtPresent,
    fields.cuttackTotalGuidelineLandBuilding, fields.cuttackTotalPresentLandBuilding,
    fields.cuttackGuidelineOrSay, fields.cuttackPresentOrSay
  ]);

  const handleChange = useCallback((field: string, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const openBucketPicker = async (mode: 'propertyImages' | 'sketchMapImages' | 'locationMapImage' | 'coverPageImage') => {
    setBucketPickerMode(mode);
    setBucketSelected(new Set());
    setBucketPickerAgent(null);
    setBucketPickerOpen(true);
    // Auto-fetch latest DB records each time the picker opens
    try {
      const res = await getBucketImages(projectId);
      if (res.images) {
        setLocalBucketImages(res.images.map((img: any) => ({
          ...img,
          createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt)
        })));
      }
    } catch (e) {
      console.error('Bucket fetch error:', e);
    }
  };

  const handleBucketConfirm = () => {
    const selectedImages = localBucketImages.filter(img => bucketSelected.has(img.id));
    if (selectedImages.length === 0) { setBucketPickerOpen(false); return; }

    if (bucketPickerMode === 'propertyImages') {
      const newUrls = [...(fields.propertyImages || []), ...selectedImages.map(img => img.url)];
      handleChange('propertyImages', newUrls);
    } else if (bucketPickerMode === 'sketchMapImages') {
      const newUrls = [...(fields.sketchMapImages || []), ...selectedImages.map(img => img.url)];
      handleChange('sketchMapImages', newUrls);
    } else if (bucketPickerMode === 'locationMapImage') {
      handleChange('locationMapImage', selectedImages[0].url);
    } else if (bucketPickerMode === 'coverPageImage') {
      handleChange('coverPageImage', selectedImages[0].url);
    }

    setBucketPickerOpen(false);
    setBucketSelected(new Set());
    setMessage({ type: 'success', text: `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} added from bucket!` });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleBucketImage = (id: string) => {
    setBucketSelected(prev => {
      const next = new Set(prev);
      if (bucketPickerMode !== 'propertyImages' && bucketPickerMode !== 'sketchMapImages') {
        next.clear();
        next.add(id);
      } else {
        if (next.has(id)) next.delete(id); else next.add(id);
      }
      return next;
    });
  };

  const reportRef = useRef<HTMLDivElement>(null);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkComment, setReworkComment] = useState('');

  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  const handleResetWizard = async () => {
    if (confirm("Are you sure you want to change report parameters? This will permanently clear all your typed data and reset the report.")) {
      if (onReset) {
        onReset();
      }
    }
  };
  const handleCancelSubmission = async () => {
    if (!confirm('Cancel this submission and return to drafting?')) return;
    setLoading(true);
    const { cancelReportSubmission } = await import('@/app/actions/project');
    const res = await cancelReportSubmission(projectId);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else {
      setMessage({ type: 'success', text: 'Submission cancelled. You can now edit the report.' });
      router.refresh();
    }
    setLoading(false);
  };

  const handleReworkClick = () => {
    setShowReworkModal(true);
  };

  const submitRework = async () => {
    if (!reworkComment.trim()) {
      setMessage({ type: 'error', text: 'Please provide a comment for rework.' });
      return;
    }
    setLoading(true);
    const { sendReportForRework } = await import('@/app/actions/project');
    const res = await sendReportForRework(projectId, reworkComment);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else {
      setMessage({ type: 'success', text: 'Report sent for rework.' });
      setShowReworkModal(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!confirm('Finalize this report and share it with the client? This will generate the official PDF and delete temporary draft images.')) return;
    setLoading(true);
    setMessage({ type: 'success', text: 'Generating final PDF...' });
    try {
      await saveReportDraft(projectId, fields);
      const pdfBlob = await handleGeneratePDF();
      if (pdfBlob) {
        const pdfFileName = `${projectId}-report-${Date.now()}.pdf`;
        const pdfPath = `reports/pdfs/${pdfFileName}`;
        const { error: uploadErr } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
        if (!uploadErr) {
          const { data: urlData } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(pdfPath);
          try {
            const { data: files } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).list(`temp-photos/${projectId}`);
            if (files && files.length > 0) {
              const paths = files.map(f => `temp-photos/${projectId}/${f.name}`);
              await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).remove(paths);
            }
          } catch (err) { console.error('Failed to cleanup temp photos:', err); }
          const finalFields = { ...fields, propertyImages: [] };
          await saveReportDraft(projectId, finalFields);
          const { finalizeReport } = await import('@/app/actions/project');
          const res = await finalizeReport(projectId, urlData.publicUrl);
          if (res.error) setMessage({ type: 'error', text: res.error });
          else { setFields(finalFields); setMessage({ type: 'success', text: 'Project Finalized Successfully! PDF is now available to the client.' }); }
        } else {
          setMessage({ type: 'error', text: 'Failed to upload PDF.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  };

  const handleAiAcceptSuggestion = useCallback((fieldKey: string, value: string) => {
    handleChange(fieldKey, value);
  }, [handleChange]);

  const handleAiAcceptFloorSuggestion = useCallback((floorId: string, fieldName: string, value: string) => {
    // No-op for IBBI signature compatibility
  }, []);

  const handleAiAcceptAll = useCallback((suggestions: Record<string, Suggestion>) => {
    setFields(prev => {
      const updated = { ...prev };
      for (const [key, suggestion] of Object.entries(suggestions)) {
        (updated as any)[key] = suggestion.value;
      }
      return updated;
    });
  }, []);

  // ── Annexure helpers ──
  const addAnnexure = () => {
    const nextIndex = fields.annexures.length;
    const label = String.fromCharCode(65 + nextIndex); // A, B, C, ...
    handleChange('annexures', [...fields.annexures, {
      id: String(Date.now()),
      label,
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    }]);
  };
  const removeAnnexure = (id: string) => {
    handleChange('annexures', fields.annexures.filter((a: AnnexureItem) => a.id !== id));
  };
  const updateAnnexureTitle = (id: string, title: string) => {
    handleChange('annexures', fields.annexures.map((a: AnnexureItem) => a.id === id ? { ...a, title } : a));
  };
  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10MB limit.'); return; }

    setUploading(true);
    setUploadError(null);

    let parsedData: { headers: string[]; rows: string[][] } | undefined;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: string[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
      if (jsonData.length > 0) {
        parsedData = {
          headers: jsonData[0].map(h => String(h)),
          rows: jsonData.slice(1).map(row => row.map(cell => String(cell))),
        };
      }
    } catch (parseErr) {
      console.warn('Could not parse Excel file:', parseErr);
    }

    const ext = file.name.split('.').pop();
    const fileName = `annexure-${annexureId}-${Date.now()}.${ext}`;
    const filePath = `annexures/${projectId}/${fileName}`;

    const { error } = await supabaseBrowser.storage
      .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
      .upload(filePath, file);

    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
    } else {
      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);
      handleChange('annexures', fields.annexures.map((a: AnnexureItem) =>
        a.id === annexureId ? { ...a, excelFileUrl: data.publicUrl, excelFileName: file.name, parsedData } : a
      ));
    }
    setUploading(false);
  };
  const removeAnnexureFile = (annexureId: string) => {
    handleChange('annexures', fields.annexures.map((a: AnnexureItem) =>
      a.id === annexureId ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    ));
  };

  // ── File upload (photos + maps) ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'propertyImages' | 'sketchMapImages' | 'locationMapImage' | 'coverPageImage' | 'mouzaMapImage' | 'revenueMapImage' | 'cdpMapImage' | 'guidelineValueImage' | 'rorPattaImage') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);

    if (fieldName === 'propertyImages' || fieldName === 'sketchMapImages') {
      const newUrls = [...(fields[fieldName] || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); continue; }
        const ext = file.name.split('.').pop();
        const fileName = `${projectId}-${Math.random().toString(36).substring(2)}.${ext}`;
        const filePath = `temp-photos/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) { setUploadError(`Failed: ${error.message}`); continue; }
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }
      handleChange(fieldName, newUrls);
    } else {
      const file = fileList[0];
      if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); setUploading(false); return; }
      const ext = file.name.split('.').pop();
      const fileName = `${projectId}-${fieldName}-${Date.now()}.${ext}`;
      const filePath = `temp-photos/${projectId}/${fileName}`;
      const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
      if (error) { setUploadError(`Failed: ${error.message}`); }
      else {
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        handleChange(fieldName, data.publicUrl);
      }
    }
    setUploading(false);
  };

  const removeSketchMap = (index: number) => {
    handleChange('sketchMapImages', (fields.sketchMapImages || []).filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    handleChange('propertyImages', fields.propertyImages.filter((_: any, i: number) => i !== index));
    if (fields.propertyImageNames) {
      handleChange('propertyImageNames', fields.propertyImageNames.filter((_: any, i: number) => i !== index));
    }
  };

  // ── Save / Submit ──
  const handleSaveDraft = async () => {
    setLoading(true); setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Draft saved successfully!' });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this report for manager verification?')) return;
    setLoading(true); setMessage(null);
    await saveReportDraft(projectId, fields);
    const result = await submitReportForVerification(projectId);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setMessage({ type: 'success', text: 'Report submitted for verification!' });
      router.refresh();
    }
    setLoading(false);
  };

  // ── PDF Generation (IBBI Layout — matches real IBBI sample reports) ──
  const handleGeneratePDF = async () => {
    try {
      const fetchBytes = async (url: string | undefined): Promise<Uint8Array | null> => {
        if (!url) return null;
        try {
          const resp = await fetch(url);
          const buf = await resp.arrayBuffer();
          return new Uint8Array(buf);
        } catch { return null; }
      };

      const propertyImgs = Array.isArray(fields.propertyImages) ? fields.propertyImages.filter((img: string) => typeof img === 'string' && img.length > 0) : [];

      const [letterheadBytes, ...imageResults] = await Promise.all([
        fetchBytes('/templates/letterhead.png'),
        ...propertyImgs.map((url: string) => fetchBytes(url)),
        ...(fields.sketchMapImages && fields.sketchMapImages.length > 0 ? fields.sketchMapImages.map((u: string) => fetchBytes(u)) : []),
        ...(fields.locationMapImage ? [fetchBytes(fields.locationMapImage)] : []),
        ...(fields.coverPageImage ? [fetchBytes(fields.coverPageImage)] : []),
        ...(fields.mouzaMapImage ? [fetchBytes(fields.mouzaMapImage)] : []),
        ...(fields.revenueMapImage ? [fetchBytes(fields.revenueMapImage)] : []),
        ...(fields.cdpMapImage ? [fetchBytes(fields.cdpMapImage)] : []),
        ...(fields.guidelineValueImage ? [fetchBytes(fields.guidelineValueImage)] : []),
        ...(fields.rorPattaImage ? [fetchBytes(fields.rorPattaImage)] : []),
      ]);

      const propImageBytes: Uint8Array[] = imageResults.slice(0, propertyImgs.length) as Uint8Array[];
      let imgIdx = propertyImgs.length;
      const sketchBytesList = fields.sketchMapImages?.length ? imageResults.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
      if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;
      const locationBytes = fields.locationMapImage ? imageResults[imgIdx++] : null;
      const coverPageImageBytes = fields.coverPageImage ? imageResults[imgIdx++] : null;
      const mouzaMapBytes = fields.mouzaMapImage ? imageResults[imgIdx++] : null;
      const revenueMapBytes = fields.revenueMapImage ? imageResults[imgIdx++] : null;
      const cdpMapBytes = fields.cdpMapImage ? imageResults[imgIdx++] : null;
      const guidelineValueBytes = fields.guidelineValueImage ? imageResults[imgIdx++] : null;
      const rorPattaBytes = fields.rorPattaImage ? imageResults[imgIdx++] : null;

      const r = new PDFIBBIRenderer();
      await r.init(letterheadBytes || undefined);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  COVER PAGE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.advanceCursor(60);
      r.drawCenteredTitle('VALUATION REPORT', 20);
      r.advanceCursor(6);
      let prefix = '';
      if (fields.addressPrefixType === 'multiple_plots') prefix = 'OVER MULTIPLE PLOTS IN ';
      else if (fields.addressPrefixType === 'idco_plot') prefix = 'OVER IDCO PLOT, ';
      else if (fields.addressPrefixType === 'other') prefix = fields.customAddressPrefix ? fields.customAddressPrefix.trim() + ', ' : '';
      
      r.drawTextBlock(`OF ${fields.propertyType || 'Property'} BELONGING TO`.toUpperCase(), { bold: true, align: 'center', fontSize: 13 });
      r.drawTextBlock(`${fields.applicantName || fields.ownerName || '________'}`.toUpperCase(), { bold: true, align: 'center', fontSize: 13, underline: true });
      r.drawTextBlock(`${prefix}${fields.propertyAddress || '________'}`.toUpperCase(), { bold: true, align: 'center', fontSize: 13 });
      r.advanceCursor(12);
      
      if (coverPageImageBytes) {
        await r.drawImageBlock(coverPageImageBytes as Uint8Array, { maxWidth: 380, maxHeight: 180, centered: true, borderColor: '#195B8E', borderWidth: 2 });
        r.advanceCursor(8);
      }
      
      r.drawCenteredTitle('OWNER OF THE PROPERTY', 13);
      r.advanceCursor(4);
      r.drawTextBlock((fields.applicantName || fields.ownerName || '________').toUpperCase(), { bold: true, align: 'center', fontSize: 11, underline: true });
      if (fields.hasManagingDirector === 'yes' && fields.managingDirectorName) {
        r.drawTextBlock('REPRESENTED THROUGH ITS MANAGING DIRECTOR', { align: 'center', fontSize: 11 });
        r.drawTextBlock(fields.managingDirectorName.toUpperCase(), { align: 'center', fontSize: 11 });
      }
      r.advanceCursor(24);

      // Value summary table on cover
      r.drawSimpleRow('FAIR MARKET VALUE', `Rs.${formatIndianCurrency(fields.fairMarketValueTotal || '0')}/-`);
      r.drawSimpleRow('LIQUIDATION VALUE', `Rs.${formatIndianCurrency(fields.realisableValueTotal || '0')}/-`);
      r.drawSimpleRow('GOVT. GUIDELINE VALUE', `Rs.${formatIndianCurrency(fields.bookValueTotal || '0')}/-`);
      r.advanceCursor(24);

      // Prepared By block
      r.drawCenteredTitle('PREPARED BY', 12);
      r.advanceCursor(4);
      r.drawTextBlock(`${fields.representativeName || ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications : ''}`, { bold: true, align: 'center', underline: true });
      if (fields.valuerAdditionalDetails) {
        fields.valuerAdditionalDetails.split('\n').forEach((line: string) => {
          if (line.trim()) r.drawTextBlock(line.trim(), { align: 'center' });
        });
      }
      r.advanceCursor(6);
      r.drawTextBlock(`REGISTERED OFFICE ADDRESS ${fields.registeredOfficeAddress || ''} ${fields.registeredOfficeTel ? 'Tel-' + fields.registeredOfficeTel : ''}`.trim(), { align: 'center' });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  TABLE OF CONTENTS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('CONTENTS', 16);
      r.advanceCursor(12);
      const tocPageMap: Record<string, number> = {};
      const tocItems = [
        'VALUATION CERTIFICATE',
        '1.  OBJECTIVE',
        '    1.1  Valuation Standard',
        '    1.2  Purpose of Valuation',
        '    1.3  Conflict of Interest',
        '    1.4  Currency and Measurement',
        '    1.5  Responsibility to Third Parties',
        '    1.6  Disclosure and Publication',
        '    1.7  Limitations on Liability',
        '2.  SCOPE OF ENQUIRIES AND INVESTIGATION',
        '3.  BASIS OF VALUATION',
        '4.  BRIEF DESCRIPTION OF THE PROPERTY',
        '5.  TOWN PLANNING PARAMETERS',
        '6.  DOCUMENT DETAILS AND LEGAL ASPECTS',
        '7.  FUNCTIONAL AND INFRASTRUCTURE ASPECTS',
        '8.  SOCIO-CULTURAL ASPECTS',
        '9.  ENVIRONMENTAL FACTORS',
        '10. MARKETABILITY OF THE PROPERTY',
        '11. ARCHITECTURAL ASPECTS OF THE PROPERTY',
        '12. ENGINEERING ASPECTS OF THE PROPERTY',
        '13. VALUATION APPROACHES & METHODOLOGY',
        '    13.1  Methodology',
        '    13.2  Valuation Bases',
        '    13.3  Valuation Considerations',
        '    13.4  Valuation Assumptions',
        '    13.5  Valuation Analysis',
        '    13.6  Details of Valuation',
        '14. SITE LOCATION',
        '15. ASSUMPTIONS & LIMITATIONS',
        'CONCLUSION',
        'DECLARATION AND UNDERTAKING',
        'PROPERTY PHOTOGRAPHS',
      ];
      if (fields.annexureEnabled && fields.annexures.length > 0) {
        fields.annexures.forEach((ann: AnnexureItem) => {
          tocItems.push(`ANNEXURE ${ann.label}${ann.title ? ': ' + ann.title.toUpperCase() : ''}`);
        });
      }
      for (const item of tocItems) {
        r.drawTOCRow(item, item);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  VALUATION CERTIFICATE (enhanced with label-value table)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawSplitLine(
        `Ref: ${fields.refNo || '________'}`,
        `Date: ${fields.dateOfValuation || '________'}`
      );
      r.advanceCursor(4);
      r.checkPageBreak(200);
      r.drawCenteredTitle('VALUATION CERTIFICATE');
      tocPageMap['VALUATION CERTIFICATE'] = r.getPageCount();
      r.advanceCursor(4);

      // Certificate introductory paragraph
      const certOwner = fields.applicantName || fields.ownerName || '________';
      const certAddress = fields.propertyAddress || fields.ownerAddress || '________';
      const certDate = fields.dateOfInspection || '________';
      const coverDesc = fields.propertyType || 'Property';
      const appointedByName = fields.appointedBy || '';
      const appointedByDesg = fields.appointedByDesignation ? ` (${fields.appointedByDesignation})` : '';
      const appointedByText = appointedByName ? `Pursuant to Letter of Appointment from ${appointedByName}${appointedByDesg}` : 'Pursuant to Letter of Appointment';
      const appointmentDateText = fields.appointmentDate ? ` on ${fields.appointmentDate}` : '';
      const casePartiesText = fields.caseParties ? ` in the matter of ${fields.caseParties}` : '';
      const caseRef1 = fields.caseReferenceNo || '';
      const caseRef2 = fields.caseReferenceNo2 || '';
      const caseRefText = caseRef1 ? `, vide Reference ${caseRef1}${caseRef2 ? ' ' + caseRef2 : ''}` : '';

      r.drawTextBlock(
        `${appointedByText}${appointmentDateText} for carrying out Valuation of Immovable assets${casePartiesText}${caseRefText}, to assess the fair market and thereby deriving liquidation value of ${coverDesc} at ${certAddress}, currently owned by ${certOwner}, inspected on ${certDate}.`
,
        { fontSize: 10 }
      );
      r.advanceCursor(3);
      r.drawTextBlock('The Valuation Certificate is to be used in conjunction with the Detailed Valuation Report Enclosed herewith based on the information and particulars furnished and actual observation, Valuation methodology, assumption, limitations, Disclaimer and bases of valuation stated herein and should not be referred in Isolation.', { fontSize: 10 });
      r.advanceCursor(4);

      // Certificate table (label-value pairs matching IBBI sample)
      r.drawSimpleRow('CLIENT NAME', certOwner.toUpperCase());
      r.drawSimpleRow('PROPERTY ADDRESS', certAddress.toUpperCase());
      r.drawSimpleRow('PURPOSE OF VALUATION', (fields.purposeOfValuation || 'ACCESS OF FAIR MARKET VALUE').toUpperCase());
      r.drawSimpleRow('CURRENT OWNER, CONTACT DETAILS', `${certOwner.toUpperCase()}${fields.ownerContactDetails ? '\n' + fields.ownerContactDetails : ''}`);
      r.drawSimpleRow('DESCRIPTION', (fields.certificateDescription || coverDesc).toUpperCase());
      r.drawSimpleRow('AREA', fields.extentOfSite || 'N/A');
      r.drawSimpleRow('STATUS OF PLOT', `${fields.conversionStatus || fields.currentUsage || 'N/A'} (${fields.occupancyStatus || 'N/A'})`);
      r.drawSimpleRow('VALUATION METHOD', (fields.valuationMethod || 'Sale Comparison Method').toUpperCase());
      r.drawSimpleRow('VALUATION DATE', fields.dateOfValuation || 'N/A');
      r.drawSimpleRow('PRESENT VALUE (in Rs)', `Rs.${formatIndianCurrency(fields.fairMarketValueTotal || fields.presentMarketValueTotal || '0')}/-`);
      r.drawSimpleRow('VALUERS DETAILS', [
          fields.representativeName ? `${fields.representativeName.toUpperCase()}${fields.valuerQualifications ? ' ' + fields.valuerQualifications : ''}` : '',
          fields.valuerAdditionalDetails || '',
          fields.registeredOfficeAddress || '',
        ].filter(Boolean).join('\n'));
      r.advanceCursor(8);

      // Certificate closing + realisable value
      const certValue = fields.fairMarketValueTotal || fields.presentMarketValueTotal || '0';
      const realValue = fields.realisableValueTotal || '0';
      r.drawTextBlock(`After considering various important factors discussed above, we are of the opinion that the Realisable value of the property is INR. ${formatIndianCurrency(realValue)} (${rupeesInWords(parseFloat(realValue) || 0)}).`, { fontSize: 10 });
      r.advanceCursor(6);

      // Signature (Place on left, Signature + Name on right)
      r.drawSplitSignatureBlock(
        [
          { text: `Place - Bhubaneswar`, bold: true },
        ],
        [
          { text: 'Signature & Seal of Valuer', italic: true },
          { text: `Name of the Valuer - ${fields.representativeName || ''}`, bold: true },
        ]
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  VALUATION REPORT — SECTIONS 1-3 (statutory auto-text)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('VALUATION REPORT');
      r.advanceCursor(8);

      // ── 1. OBJECTIVE ──
      r.drawSectionHeader('1. OBJECTIVE:');
      tocPageMap['1.  OBJECTIVE'] = r.getPageCount();

      // Introductory paragraph for Section 1 (from sample)
      const objParagraph = fields.appointedBy
        ? `Pursuant to request from ${certOwner}, represented through ${fields.representativeName ? 'Mr. ' + fields.representativeName : 'its authorized representative'}${caseRefText}, to assess the fair market value of ${coverDesc} at ${certAddress}, currently owned by ${certOwner}, inspected on ${certDate}.`
        : `To assess the fair market value of ${coverDesc} at ${certAddress}, currently owned by ${certOwner}, inspected on ${certDate}.`;
      r.drawTextBlock(objParagraph);
      r.advanceCursor(6);

      r.drawTextBlock('1.1 VALUATION STANDARD', { bold: true });
      tocPageMap['    1.1  Valuation Standard'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_1 || 'The entire valuation exercise has been carried out in accordance of Standard procedures laid down as per the International Valuation Standards.');
      r.advanceCursor(4);
      r.drawTextBlock('1.2 PURPOSE OF VALUATION', { bold: true });
      tocPageMap['    1.2  Purpose of Valuation'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_2 || `The Valuation is required for the purpose of ${fields.purposeOfValuation || 'accessing the impartial and true Liquidation / Realisable Market value'} of the aforesaid property on the basis of market survey method as on the date of valuation.`);
      r.advanceCursor(4);
      r.drawTextBlock('1.3 CONFLICT OF INTEREST', { bold: true });
      tocPageMap['    1.3  Conflict of Interest'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_3 || 'The valuer has no direct or indirect interest in the property valued, nor any personal interest or bias with respect to the parties involved.');
      r.advanceCursor(4);
      r.drawTextBlock('1.4 CURRENCY AND MEASUREMENT', { bold: true });
      tocPageMap['    1.4  Currency and Measurement'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_4 || 'All amounts are in Indian Rupees (INR). Land is measured in Acres/Decimals/Sq. ft. as applicable.');
      r.advanceCursor(4);
      r.drawTextBlock('1.5 RESPONSIBILITY TO THIRD PARTIES', { bold: true });
      tocPageMap['    1.5  Responsibility to Third Parties'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_5 || 'This report is prepared only for the stated purpose and the parties named herein.');
      r.advanceCursor(4);
      r.drawTextBlock('1.6 DISCLOSURE AND PUBLICATION', { bold: true });
      tocPageMap['    1.6  Disclosure and Publication'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_6 || 'This valuation report or any reference thereof should not be used in any published document without the consent of the valuer.');
      r.advanceCursor(4);
      r.drawTextBlock('1.7 LIMITATIONS ON LIABILITY', { bold: true });
      tocPageMap['    1.7  Limitations on Liability'] = r.getPageCount();
      r.drawTextBlock(fields.objective1_7 || 'The valuer shall not be liable for any loss or damage arising from this report except to the extent that such loss or damage is caused by the valuer\'s negligence.');
      r.advanceCursor(8);

      // ── 2. SCOPE OF ENQUIRIES ──
      r.drawSectionHeader('2. SCOPE OF ENQUIRIES AND INVESTIGATION:');
      tocPageMap['2.  SCOPE OF ENQUIRIES AND INVESTIGATION'] = r.getPageCount();
      r.drawTextBlock('2.1 SITE INSPECTION', { bold: true });
      r.drawTextBlock(fields.scope2_1 || `Site inspection was carried out on ${fields.dateOfInspection || '________'}.`);
      r.advanceCursor(4);
      r.drawTextBlock('2.2 ENQUIRIES', { bold: true });
      r.drawTextBlock(fields.scope2_2 || 'Enquiries were made with local people, real estate agents, and brokers to assess the prevailing market conditions.');
      r.advanceCursor(4);
      r.drawTextBlock('2.3 LEGAL PARAMETERS OF PROPERTY', { bold: true });
      r.drawTextBlock(fields.scope2_3 || 'Documents and records relating to title, extent, and encumbrances were examined.');
      r.advanceCursor(4);
      r.drawTextBlock('2.4 ENVIRONMENTAL ASPECTS', { bold: true });
      r.drawTextBlock(fields.scope2_4 || 'The property was assessed for environmental conditions as observed during inspection.');
      r.advanceCursor(4);
      r.drawTextBlock('2.5 INFORMATION PROVIDED', { bold: true });
      r.drawTextBlock(fields.scope2_5 || 'Information was provided by the property owners, authorized representatives, and from public records.');
      r.advanceCursor(8);

      // ── 3. BASIS OF VALUATION ──
      r.drawSectionHeader('3. BASIS OF VALUATION:');
      tocPageMap['3.  BASIS OF VALUATION'] = r.getPageCount();
      const basis3Default = `The basis of valuation of industries depends on various factors such as the purpose of valuation, statutory requirements, business drivers, macro and micro economic environment, government policies as applicable to the asset being valued. The purpose of the valuation is a critical first step in the process as it dictates the "basis of value" or "standard of value" to be applied, which, in turn, impacts the selection of approaches, inputs and assumptions considered in the valuation.

The fair value and liquidation value of all the tangible assets of the company are determined in accordance with the internationally accepted valuation standards after physical verification of the inventory and fixed assets of the company included in the scope of work. The fair value and liquidation value shall have the meaning assigned to it in Regulation 2 (1) (hb) and Regulation 2 (1) (k) respectively of the Insolvency and Bankruptcy Board of India (Insolvency Resolution Process for Corporate Persons) Regulations, 2016.

Our valuation is based on information obtained from the client and on data gathered out of our reasonable local enquiry. We have relied on this being correct & complete and there is no undisclosed matters which would affect the cause, from client's side.`;
      const basis3Text = fields.basis3 || basis3Default;
      // Split by double newlines to render as separate paragraphs
      basis3Text.split('\n\n').filter(Boolean).forEach((para: string) => {
        r.drawTextBlock(para.trim());
        r.advanceCursor(3);
      });
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTIONS 4-12 (dynamic data from form)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // ── 4. BRIEF DESCRIPTION ──
      r.drawSectionHeader('4. BRIEF DESCRIPTION OF THE PROPERTY');
      tocPageMap['4.  BRIEF DESCRIPTION OF THE PROPERTY'] = r.getPageCount();
      // Introductory prose paragraph (matches sample format)
      if (fields.propertyDescription) {
        r.drawTextBlock(`The Property in consideration is ${fields.propertyDescription} conveniently located at ${fields.propertyAddress || '________'}.`);
        r.advanceCursor(6);
      }
      r.drawTextBlock('BASIC DETAILS OF THE PROPERTY', { bold: true });
      r.advanceCursor(4);
      r.drawSimpleRow('4.1  Applicant Name / Owners', fields.applicantName || fields.ownerName);
      r.drawSimpleRow('4.2  Type of Property', fields.propertyType);
      r.drawSimpleRow('     Current Usage', fields.currentUsage);
      r.drawSimpleRow('4.3  Site Address', fields.propertyAddress);
      r.drawSimpleRow('     Address as per Documents', fields.legalAddress);
      r.drawSimpleRow('4.8  Revenue Plot No', fields.revenuePlotNo);
      r.drawSimpleRow('     Khata No', fields.revenueKhataNo);
      r.drawSimpleRow('     Village (Mouza)', fields.revenueVillage);
      r.drawSimpleRow('     Tahasil', fields.revenueTahasil);
      r.drawSimpleRow('     Police Station', fields.revenuePS);
      r.drawSimpleRow('     District', fields.revenueDistrict);
      r.drawSimpleRow('     State', fields.revenueState);
      r.drawSimpleRow('4.10 Classification of Area', fields.classificationArea);
      r.drawSimpleRow('4.13 Conversion Status', fields.conversionStatus);
      r.drawSimpleRow('4.14 Boundaries (North)', fields.boundNorth);
      r.drawSimpleRow('     Boundaries (South)', fields.boundSouth);
      r.drawSimpleRow('     Boundaries (East)', fields.boundEast);
      r.drawSimpleRow('     Boundaries (West)', fields.boundWest);
      r.drawSimpleRow('4.15 Extent of Site', fields.extentOfSite);
      r.drawSimpleRow('4.16 Occupancy Status', fields.occupancyStatus);
      r.advanceCursor(8);

      // ── 5. TOWN PLANNING ──
      r.drawSectionHeader('5. TOWN PLANNING PARAMETERS:');
      tocPageMap['5.  TOWN PLANNING PARAMETERS'] = r.getPageCount();
      r.drawSimpleRow('5.1   Master plan provision, related to property in terms of land use.', fields.masterPlanProvision);
      r.drawSimpleRow('5.2   Date of issue of approved building plan', fields.approvedPlanDate || 'NOT PROVIDED');
      r.drawSimpleRow('5.3   Approved map/plan issuing authority', fields.approvedPlanAuthority || 'NOT PROVIDED');
      r.drawSimpleRow('5.4   Whether genuineness or authenticity of the approved map/plan.', fields.planGenuineness || 'APPROVED PLAN NOT PRODUCED');
      r.drawSimpleRow('5.5   Any comments over the authenticity of the building plan approval.', fields.planAuthenticityComments || 'APPROVED PLAN NOT PRODUCED');
      r.drawSimpleRow('5.6   Development controls', fields.developmentControls);
      r.drawSimpleRow('5.7   Ground coverage', fields.groundCoverage);
      r.drawSimpleRow('5.8   Comment on the surrounding land use, adjoining properties in terms of use.', fields.surroundingLandUse);
      r.drawSimpleRow('5.9   Any other aspect.', fields.otherAspect5 || 'NONE');
      r.advanceCursor(8);

      // ── 6. LEGAL ASPECTS ──
      r.drawSectionHeader('6. DOCUMENT DETAILS AND LEGAL ASPECTS OF THE PROPERTY:');
      tocPageMap['6.  DOCUMENT DETAILS AND LEGAL ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('6.1   Ownership documents', fields.ownershipDocuments);
      r.drawSimpleRow('6.2   Owner of the property as per ROR', fields.ownerAsPerROR);
      r.drawSimpleRow('6.3   Agreement of easement if any', fields.easementAgreement);
      r.drawSimpleRow('6.4   Notification of acquisition if any', fields.acquisitionNotification);
      r.drawSimpleRow('6.5   Notification of road widening if any', fields.roadWideningNotification);
      r.drawSimpleRow('6.6   Heritage restriction, if any', fields.heritageRestriction);
      r.drawSimpleRow('6.7   Comment on transferability of ownership', fields.transferability);
      r.drawSimpleRow('6.8   Comment on existing mortgages/charge/encumbrances on the property, if any', fields.existingMortgages);
      r.drawSimpleRow('6.9   Comment on, whether owner of property have issued any guarantee (personal/corporate) as the case may be.', fields.guaranteeIssued);
      r.drawSimpleRow('6.10  Whether property is SARFAESI compliant', fields.sarfaesiCompliant);
      r.drawSimpleRow('6.11  Observation on dispute or dues if any, in payment of bills/taxes to be reported.', fields.disputesDues);
      r.advanceCursor(8);

      // ── 7. INFRASTRUCTURE ──
      r.drawSectionHeader('7. FUNCTIONAL AND INFRASTRUCTURE ASPECTS OF THE PROPERTY:');
      tocPageMap['7.  FUNCTIONAL AND INFRASTRUCTURE ASPECTS'] = r.getPageCount();
      r.drawTextBlock('Description of aqua infrastructure availability in terms of', { bold: true, fontSize: 10 });
      r.drawSimpleRow('7.1   Water supply', fields.waterSupply);
      r.drawSimpleRow('7.2   Sewerage/sanitation system, u/g or open.', fields.sewerage);
      r.drawSimpleRow('7.3   Storm water drainage', fields.stormWater);
      r.drawTextBlock('Description of the other physical infrastructure facilities viz', { bold: true, fontSize: 10 });
      r.drawSimpleRow('7.4   Solid waste management', fields.solidWaste);
      r.drawSimpleRow('7.5   Electricity', fields.electricity);
      r.drawSimpleRow('7.6   Road and public transport connectivity', fields.roadConnectivity);
      r.drawSimpleRow('7.7   Availability of other public utilities nearby', [fields.policeStationDist ? 'Police Station: ' + fields.policeStationDist : '', fields.busStopDist ? 'Bus Stop: ' + fields.busStopDist : '', fields.schoolDist ? 'School: ' + fields.schoolDist : '', fields.collegeDist ? 'College: ' + fields.collegeDist : ''].filter(Boolean).join(', ') || 'N/A');
      r.drawTextBlock('Description of the functionality and utility of the property in terms of', { bold: true, fontSize: 10 });
      r.drawSimpleRow('7.8   Space allocation', fields.spaceAllocation || 'NO');
      r.drawSimpleRow('7.9   Storage spaces', fields.storageSpaces || 'NO');
      r.drawSimpleRow('7.10  Utility spaces provided within the unit', fields.utilitySpaces || 'NO');
      r.drawSimpleRow('7.11  Car parking facility', fields.carParking || 'NO');
      r.drawSimpleRow('7.12  Balconies etc.', fields.balconies || 'NO');
      r.advanceCursor(8);

      // ── 8. SOCIO-CULTURAL ──
      r.drawSectionHeader('8. SOCIO-CULTURAL ASPECTS OF THE PROPERTY:');
      tocPageMap['8.  SOCIO-CULTURAL ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('8.1   Descriptive account of location of property, in terms of social structure of area, population, social satisfaction, regional origin, economic level, location of slum, squatter settlements nearby, etc.', fields.socialStructure);
      r.drawSimpleRow('8.2   Whether property belongs to social infrastructure like hospital, school, old age home', fields.socialInfrastructure);
      r.advanceCursor(8);

      // ── 9. ENVIRONMENTAL ──
      r.drawSectionHeader('9. ENVIRONMENTAL FACTORS AFFECTING THE PROPERTY:');
      tocPageMap['9.  ENVIRONMENTAL FACTORS'] = r.getPageCount();
      r.drawSimpleRow('9.1   Use of environmental friendly building material green building techniques if any', fields.ecoMaterials);
      r.drawSimpleRow('9.2   Provision of rain water harvesting', fields.rainWaterHarvesting);
      r.drawSimpleRow('9.3   Use of solar heating, lightening system, etc', fields.solarSystem);
      r.drawSimpleRow('9.4   Presence of environmental pollution in vicinity in terms of industry, heavy traffic.', fields.environmentalPollution);
      r.advanceCursor(8);

      // ── 10. MARKETABILITY ──
      r.drawSectionHeader('10. MARKETABILITY OF THE PROPERTY:');
      r.drawTextBlock('Marketability of the property in terms of', { bold: true, fontSize: 10 });
      tocPageMap['10. MARKETABILITY OF THE PROPERTY'] = r.getPageCount();
      r.drawSimpleRow('10.1  Locational attributes', fields.locationalAttributes);
      r.drawSimpleRow('10.2  Scarcity', fields.scarcity);
      r.drawSimpleRow('10.3  Demand & supply of the subject property.', fields.demandSupply);
      r.drawSimpleRow('10.4  Comparable sale prices in the locality', fields.comparableSalePrices || 'N/A');
      r.drawSimpleRow('10.5  Any other aspect which has relevance on the value or marketability of the property', fields.otherMarketability || 'N/A');
      r.advanceCursor(8);

      // ── 11. ARCHITECTURAL ──
      r.drawSectionHeader('11. ARCHITECTURAL ASPECTS OF THE PROPERTY:');
      tocPageMap['11. ARCHITECTURAL ASPECTS OF THE PROPERTY'] = r.getPageCount();
      r.drawSimpleRow('11.1  Descriptive account on whether, building is modern, old fashioned, plain looking or decorative, heritage, landscape element, etc', fields.architecturalAspects);
      r.advanceCursor(8);

      // ── 12. ENGINEERING ──
      r.drawSectionHeader('12. ENGINEERING ASPECTS OF THE PROPERTY:');
      tocPageMap['12. ENGINEERING ASPECTS OF THE PROPERTY'] = r.getPageCount();
      r.drawSimpleRow('01  Type of construction', fields.constructionType);
      r.drawSimpleRow('02  Material and technology used', fields.materialsUsed);
      r.drawSimpleRow('03  Specifications', fields.specifications);
      r.drawSimpleRow('04  Maintenance issues', fields.maintenanceIssues);
      r.drawSimpleRow('05  Age of the building/sheds', fields.ageOfBuilding ? `${fields.ageOfBuilding} YEARS` : 'N/A');
      r.drawSimpleRow('06  Residual life of the building', fields.residualLife ? `${fields.residualLife} YEARS` : 'N/A');
      r.drawSimpleRow('07  Total life of the building (if applicable)', fields.totalLife || 'N/A');
      r.drawSimpleRow('08  Extent of deterioration', fields.extentDeterioration);
      r.drawSimpleRow('09  Structural safety', fields.structuralSafety);
      r.drawSimpleRow('10  Protection against natural disaster/earthquake', fields.naturalDisasterProtection);
      r.drawSimpleRow('11  Visible damage in the building', fields.visibleDamage);
      r.drawSimpleRow('12  System of air-conditioning', fields.airConditioning || 'N/A');
      r.drawSimpleRow('13  Provision of fire-fighting', fields.fireFighting || 'N/A');
      r.drawSimpleRow('14  Year of construction', fields.yearOfConstruction || 'N/A');
      r.drawSimpleRow('15  Type of foundation', fields.foundationType || 'N/A');
      r.drawSimpleRow('16  Superstructure', fields.superstructure || 'N/A');
      r.drawSimpleRow('17  Type of building', fields.buildingType || 'N/A');
      r.drawSimpleRow('18  No.of floors', fields.numberOfFloors || 'N/A');
      r.drawSimpleRow('19  Type of roof', fields.roofType || 'N/A');
      r.drawSimpleRow('20  Roof height', fields.roofHeight || 'N/A');
      r.drawSimpleRow('21  Type of flooring', fields.flooringType || 'N/A');
      r.drawSimpleRow('22  Type of joineries (Door/Windows)', fields.joineriesType || 'N/A');
      r.drawSimpleRow('23  Amenities/extra fitting', fields.amenitiesFitting || 'N/A');
      r.drawSimpleRow('24  Condition of the building', fields.buildingCondition || 'N/A');
      r.drawSimpleRow('25  Quality of construction', fields.constructionQuality || 'N/A');
      r.drawSimpleRow('26  Assumed salvage value of the building', fields.assumedSalvageValue || 'N/A');
      const plinthText = fields.plinthAreaOption === 'Other' ? fields.plinthAreaCustom : fields.plinthAreaOption || 'NOT APPLICABLE';
      r.drawSimpleRow('27  Plinth area', plinthText);
      
      if (fields.plinthAreaOption === 'AS BELOW' && fields.plinthAreaTable && fields.plinthAreaTable.length > 0) {
        r.drawTextBlock('(if applicable)', { align: 'left', fontSize: 10, italic: true });
        const tableRows = fields.plinthAreaTable.map((row: PlinthAreaRow, i: number) => [
          '',
          row.floorDetails,
          row.actualArea,
          row.consideredArea
        ]);
        r.drawDataTable(
          ['', 'Floor details', 'Actual construction area', 'Area considered'],
          tableRows
        );
      }
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTION 13: VALUATION (with sub-sections 13.1-13.6)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('13. VALUATION APPROACHES & METHODOLOGY ADOPTED');
      tocPageMap['13. VALUATION APPROACHES & METHODOLOGY'] = r.getPageCount();
      r.advanceCursor(4);

      r.drawTextBlock('13.1 METHODOLOGY', { bold: true });
      tocPageMap['    13.1  Methodology'] = r.getPageCount();
      r.drawTextBlock(fields.methodology13_1 || `${fields.valuationMethod || 'Sale Comparison Method coupled with Replacement Cost Approach'} has been adopted for the valuation of the subject property. The market approach is based on actual market transactions of comparable properties in the vicinity. The cost approach estimates the replacement cost of the improvements less depreciation.`);
      r.advanceCursor(4);

      r.drawTextBlock('13.2 VALUATION BASES', { bold: true });
      tocPageMap['    13.2  Valuation Bases'] = r.getPageCount();
      r.drawTextBlock('The valuation has been carried out on the basis of Fair Market Value which is defined as the price that a property would bring in a competitive and open market under all conditions requisite to a fair sale -- the buyer and seller each acting prudently and knowledgeably, and assuming the price is not affected by undue stimulus.');
      r.advanceCursor(4);

      r.drawTextBlock('13.3 VALUATION CONSIDERATIONS', { bold: true });
      tocPageMap['    13.3  Valuation Considerations'] = r.getPageCount();
      r.drawTextBlock(fields.considerations13_3 || 'In arriving at the valuation, the following factors have been considered: location and accessibility, size and shape of the plot, nature of surrounding development, availability of civic amenities, demand and supply position, comparable sale instances, and applicable government rates.');
      r.advanceCursor(4);

      r.drawTextBlock('13.4 VALUATION ASSUMPTIONS', { bold: true });
      tocPageMap['    13.4  Valuation Assumptions'] = r.getPageCount();
      r.drawTextBlock(fields.assumptions13_4 || 'The valuation assumes that the property has a clear and marketable title, that there are no hidden or unapparent conditions of the property that would affect value, that the information provided by the client is true and correct, and that the property conforms to applicable government regulations.');
      r.advanceCursor(4);

      r.drawTextBlock('13.5 VALUATION ANALYSIS', { bold: true });
      tocPageMap['    13.5  Valuation Analysis'] = r.getPageCount();
      r.drawTextBlock(fields.analysis13_5 || 'Based on the market survey conducted in the area and analysis of comparable sale transactions, the prevailing market rates have been assessed. The government guideline rates as published by the Registration Department have also been considered. After due consideration of all relevant factors including location, accessibility, amenities, and market conditions, the values have been arrived at as detailed below.');
      r.advanceCursor(6);

      r.drawTextBlock('13.6 DETAILS OF VALUATION', { bold: true });
      tocPageMap['    13.6  Details of Valuation'] = r.getPageCount();
      r.advanceCursor(4);
      
      r.drawTextBlock('The detailed workings are shown in the following tables:');
      r.advanceCursor(8);

      // ════════════════════════════════════════════════
      // VARIANT A: STANDARD (Bajrangbali, Angul, Satyabadi)
      // ════════════════════════════════════════════════
      if (fields.valuationVariant !== 'cuttack') {
        
        // ─── BOOK VALUE (GUIDELINE VALUE) ───
        r.drawTextBlock('BOOK VALUE (GUIDELINE VALUE)', { bold: true, fontSize: 11, underline: true });
        r.advanceCursor(4);
        if (fields.guidelinePlotRows && fields.guidelinePlotRows.length > 0) {
          const headers = ['Mouza', 'Nature', 'Owner', 'Plot no', 'Khata no', 'Area', 'Rate per dec', 'Amount'];
          const rows: string[][] = fields.guidelinePlotRows.map((row: GuidelinePlotRow) => [row.mouza, row.nature, row.owner, row.plotNo, row.khataNo, row.area, row.ratePerDec, row.amount]);
          if (fields.guidelinePlotTotal) {
            rows.push([
              '!!SPAN:7!!!!CENTER!!!!BOLD!!TOTAL GUIDELINE PLOT VALUE', '', '', '', '', '', '',
              '!!BOLD!!' + fields.guidelinePlotTotal
            ]);
          }
          if (fields.guidelineDiscountedTotal) {
            rows.push([
              `!!SPAN:7!!!!CENTER!!!!BOLD!!Total Accessed Value Post Discounted reduction of ${String(fields.guidelineDiscountPercent || 0).replace(/%/g, '')}% on Total Guideline Value`, '', '', '', '', '', '',
              '!!BOLD!!' + fields.guidelineDiscountedTotal
            ]);
          }
          r.drawDataTable(headers, rows);
          r.advanceCursor(6);
        } else {
          if (fields.guidelinePlotTotal) r.drawTextBlock(`Total Guideline Plot Value FOR AC.${(fields.guidelinePlotRows || []).reduce((s: number, r: any) => { const m = String(r.area || '').match(/([\\d.]+)/); return s + (m ? parseFloat(m[1]) || 0 : 0); }, 0).toFixed(3)} dec: ${fields.guidelinePlotTotal}`, { bold: true, align: 'right' });
          if (fields.guidelineDiscountedTotal) r.drawTextBlock(`Total Accessed Value Post Discounted reduction of ${String(fields.guidelineDiscountPercent || 0).replace(/%/g, '')}% on Total Guideline Value = ${fields.guidelineDiscountedTotal}`, { bold: true, align: 'right' });
          r.advanceCursor(6);
        }

        // ─── PRESENT MARKET VALUE ───
        r.drawTextBlock('PRESENT MARKET VALUE (POST DISCOUNTING ON FAIR MARKET VALUE)', { bold: true, fontSize: 11, underline: true });
        r.advanceCursor(4);
        if (fields.presentMarketDescription) {
          r.drawTextBlock(fields.presentMarketDescription);
          r.advanceCursor(4);
        }
        if (fields.presentPlotRows && fields.presentPlotRows.length > 0) {
          const headers = ['Mouza', 'Nature', 'Owner', 'Plot no', 'Khata no', 'Area', 'Rate per dec', 'Amount'];
          const rows: string[][] = fields.presentPlotRows.map((row: PresentPlotRow) => [row.mouza, row.nature, row.owner, row.plotNo, row.khataNo, row.area, row.ratePerDec, row.amount]);
          if (fields.presentPlotTotal) {
            rows.push([
              '!!SPAN:7!!!!CENTER!!!!BOLD!!TOTAL FAIR PLOT VALUE', '', '', '', '', '', '',
              '!!BOLD!!' + fields.presentPlotTotal
            ]);
          }
          if (fields.presentDiscountedTotal) {
            rows.push([
              `!!SPAN:7!!!!CENTER!!!!BOLD!!Total Present Plot Value Post Discounted reduction of ${String(fields.presentDiscountPercent || 0).replace(/%/g, '')}% on Total FAIR Value`, '', '', '', '', '', '',
              '!!BOLD!!' + fields.presentDiscountedTotal
            ]);
          }
          r.drawDataTable(headers, rows);
          r.advanceCursor(6);
        } else {
          if (fields.presentPlotTotal) r.drawTextBlock(`TOTAL FAIR PLOT VALUE: ${fields.presentPlotTotal}`, { bold: true, align: 'right' });
          if (fields.presentDiscountedTotal) r.drawTextBlock(`Total Present Plot Value Post Discounted reduction of ${String(fields.presentDiscountPercent || 0).replace(/%/g, '')}% on Total FAIR Value = ${fields.presentDiscountedTotal}`, { bold: true, align: 'right' });
          r.advanceCursor(6);
        }

        // ─── BUILDING/SHED COST (FAIR MARKET VALUE) ───
        if (fields.hasBuildingCost) {
          r.drawTextBlock('BUILDING/SHED COST (FAIR MARKET VALUE)', { bold: true, fontSize: 11, underline: true });
          r.advanceCursor(4);
          
          r.drawTextBlock('RCC Roof Structure:', { bold: true });
          if (fields.rccRowsFMV && fields.rccRowsFMV.length > 0) {
            const headers = ['Sl', 'Area particular', 'Plinth area', 'Age', 'Rate/sft.', 'Replacement cost', `Depreciation (${String(fields.rccDepreciationPercentFMV || 0).replace(/%/g, '')}%)`, 'Net value'];
            const rows: string[][] = fields.rccRowsFMV.map((row: BuildingCostRow) => [row.sl, row.areaParticular, row.plinthArea, row.age, row.rateSft, row.replacementCost, row.depreciation, row.netValue]);
            if (fields.totalRccFMV) {
              rows.push([
                '!!SPAN:7!!!!CENTER!!!!BOLD!!TOTAL OF RCC ROOF STRUCTURE', '', '', '', '', '', '',
                '!!BOLD!!' + fields.totalRccFMV
              ]);
            }
            r.drawDataTable(headers, rows);
          }
          r.advanceCursor(4);
          
          r.drawTextBlock('Shed Structure:', { bold: true });
          if (fields.shedRowsFMV && fields.shedRowsFMV.length > 0) {
            const headers = ['Sl', 'Area particular', 'Plinth area', 'Age', 'Rate/sft.', 'Replacement cost', `Depreciation (${String(fields.shedDepreciationPercentFMV || 0).replace(/%/g, '')}%)`, 'Net value'];
            const rows: string[][] = fields.shedRowsFMV.map((row: BuildingCostRow) => [row.sl, row.areaParticular, row.plinthArea, row.age, row.rateSft, row.replacementCost, row.depreciation, row.netValue]);
            if (fields.totalShedFMV) {
              rows.push([
                '!!SPAN:7!!!!CENTER!!!!BOLD!!TOTAL OF SHED STRUCTURE', '', '', '', '', '', '',
                '!!BOLD!!' + fields.totalShedFMV
              ]);
            }
            if (fields.totalBuildingValueFMV) {
              rows.push([
                '!!SPAN:7!!!!BOLD!!TOTAL BUILDING VALUE', '', '', '', '', '', '',
                '!!BOLD!!!!FONTSIZE:10!!' + fields.totalBuildingValueFMV
              ]);
            }
            if (fields.depreciationDescFMV) {
              rows.push([
                '!!FONTSIZE:7!!(' + fields.depreciationDescFMV + ')', '', '', '', '', '', '', ''
              ]);
            }
            if (fields.compoundWallValueFMV) {
              rows.push([
                '!!SPAN:7!!' + fields.compoundWallValueFMV, '', '', '', '', '', '',
                '!!BOLD!!!!FONTSIZE:10!!' + (fields.compoundWallValueFMV.match(/Rs\.?\s*[\d,]+/i)?.[0] || '')
              ]);
            }
            if (fields.totalBuildingShedComponentsFMV) {
              rows.push([
                '!!SPAN:7!!!!BOLD!!!!FONTSIZE:10!!Total BUILDING/SHED COMPONENTS', '', '', '', '', '', '',
                '!!BOLD!!!!FONTSIZE:12!!' + fields.totalBuildingShedComponentsFMV
              ]);
            }
            r.drawDataTable(headers, rows);
          }
          r.advanceCursor(6);

          // ─── BUILDING/SHED COST (GUIDELINE VALUE) ───
          r.drawTextBlock('BUILDING/SHED COST (GUIDELINE VALUE)', { bold: true, fontSize: 11, underline: true });
          r.advanceCursor(4);
          
          r.drawTextBlock('RCC Roof Structure:', { bold: true });
          if (fields.rccRowsGuideline && fields.rccRowsGuideline.length > 0) {
            const headers = ['Sl', 'Area particular', 'Plinth area', 'Age', 'Rate/sft.', 'Replacement cost', `Depreciation (${String(fields.rccDepreciationPercentGuideline || 0).replace(/%/g, '')}%)`, 'Net value'];
            const rows: string[][] = fields.rccRowsGuideline.map((row: BuildingCostRow) => [row.sl, row.areaParticular, row.plinthArea, row.age, row.rateSft, row.replacementCost, row.depreciation, row.netValue]);
            if (fields.totalRccGuideline) {
              rows.push([
                '!!SPAN:7!!!!CENTER!!!!BOLD!!TOTAL OF RCC ROOF STRUCTURE', '', '', '', '', '', '',
                '!!BOLD!!' + fields.totalRccGuideline
              ]);
            }
            r.drawDataTable(headers, rows);
          }
          r.advanceCursor(4);
          
          r.drawTextBlock('Shed Structure:', { bold: true });
          if (fields.shedRowsGuideline && fields.shedRowsGuideline.length > 0) {
            const headers = ['Sl', 'Area particular', 'Plinth area', 'Age', 'Rate/sft.', 'Replacement cost', `Depreciation (${String(fields.shedDepreciationPercentGuideline || 0).replace(/%/g, '')}%)`, 'Net value'];
            const rows: string[][] = fields.shedRowsGuideline.map((row: BuildingCostRow) => [row.sl, row.areaParticular, row.plinthArea, row.age, row.rateSft, row.replacementCost, row.depreciation, row.netValue]);
            if (fields.totalShedGuideline) {
              rows.push([
                '!!SPAN:7!!!!CENTER!!!!BOLD!!TOTAL OF SHED STRUCTURE', '', '', '', '', '', '',
                '!!BOLD!!' + fields.totalShedGuideline
              ]);
            }
            if (fields.totalBuildingValueGuideline) {
              rows.push([
                '!!SPAN:7!!!!BOLD!!Total Guideline Building Value', '', '', '', '', '', '',
                '!!BOLD!!!!FONTSIZE:10!!' + fields.totalBuildingValueGuideline
              ]);
            }
            if (fields.depreciationDescGuideline) {
              rows.push([
                '!!FONTSIZE:7!!(' + fields.depreciationDescGuideline + ')', '', '', '', '', '', '', ''
              ]);
            }
            if (fields.compoundWallValueGuideline) {
              rows.push([
                '!!SPAN:7!!' + fields.compoundWallValueGuideline, '', '', '', '', '', '',
                '!!BOLD!!!!FONTSIZE:10!!' + (fields.compoundWallValueGuideline.match(/Rs\.?\s*[\d,]+/i)?.[0] || '')
              ]);
            }
            if (fields.totalBuildingShedComponentsGuideline) {
              rows.push([
                '!!SPAN:7!!!!BOLD!!!!FONTSIZE:10!!Total BUILDING/SHED COMPONENTS', '', '', '', '', '', '',
                '!!BOLD!!!!FONTSIZE:12!!' + fields.totalBuildingShedComponentsGuideline
              ]);
            }
            r.drawDataTable(headers, rows);
          }
          r.advanceCursor(6);
        }

        // ─── ABSTRACT OF VALUATION ───
        r.drawTextBlock('ABSTRACT OF VALUATION', { bold: true, fontSize: 11, underline: true });
        r.advanceCursor(4);
        
        r.drawTextBlock('FAIR MARKET PRESENT VALUE', { bold: true });
        r.drawSimpleRow('Present Value of Plot', 'Rs. ' + formatIndianCurrency(Math.round(parseFloat(String(fields.presentValueOfPlot || '').replace(/[^\d.]/g, '')) || 0).toString()));
        r.drawSimpleRow('Present Value of Buildings and Sheds', 'Rs. ' + formatIndianCurrency(Math.round(parseFloat(String(fields.presentValueOfBuildings || '').replace(/[^\d.]/g, '')) || 0).toString()));
        r.drawSimpleRow('Total Present Value', fields.totalPresentValue);
        if (fields.totalPresentValueOrSay) {
          r.drawSimpleRow('Or Say', fields.totalPresentValueOrSay);
        }
        if (fields.totalPresentValueInWords) {
          r.drawFullWidthRow(fields.totalPresentValueInWords, { bold: true });
        }
        r.advanceCursor(6);

        r.drawTextBlock('BOOK VALUE / GUIDELINE VALUE', { bold: true });
        r.drawSimpleRow('Book Value of Plot', 'Rs. ' + formatIndianCurrency(Math.round(parseFloat(String(fields.bookValueOfPlot || '').replace(/[^\d.]/g, '')) || 0).toString()));
        r.drawSimpleRow('Book Value of Buildings and Sheds', 'Rs. ' + formatIndianCurrency(Math.round(parseFloat(String(fields.bookValueOfBuildings || '').replace(/[^\d.]/g, '')) || 0).toString()));
        r.drawSimpleRow('Total Book Value', fields.totalBookValue);
        if (fields.totalBookValueOrSay) {
          r.drawSimpleRow('Or Say', fields.totalBookValueOrSay);
        }
        if (fields.totalBookValueInWords) {
          r.drawFullWidthRow(fields.totalBookValueInWords, { bold: true });
        }
        r.advanceCursor(6);

        // ─── REALISABLE / LIQUIDATION VALUE ───
        if (fields.realisableValueAmount) {
          const defaultDesc = "FAIR MARKET VALUE REPRESENTS THE PRICE A PROPERTY WOULD BE SOLD IN AN OPEN MARKET BETWEEN KNOWLEDGEABLE, WILLING PARTIES, WHEREAS REALISABLE VALUE DEDUCTS THE ESTIMATED COSTS THAT WOULD BE INCURRED TO COMPLETE THE SALE FROM THAT MARKET VALUE, REFLECTING THE ACTUAL AMOUNT LIKELY OBTAINED AFTER SELLING EXPENSES ARE PAID IN NORMAL CIRCUMSTANCES. AS PER RBI GUIDELINES THE COSTS MAY INCLUE BUT NOT LIMITED TO TAXES, LEGAL CHARGES, MARKETING EXPENSES, TRANSACTIONS CHARGES AND COMMISSIONS. IF TRANSACTION IS TO BE CARRIED OUT UNDER FORCED OR DISTRESSED CONDITIONS THEN THE COMMERCIAL VIABILITY IS DRASTICALLTY AFFECTED OWING TO DISTRESS TRANCTION WITHIN STIPULATED TIME FRAME SET BY HONOUABLE COURTS AND EXISTING LEGAL AND BREACH OF CONTRACT RISK. SUCH A TRANSACTION WILL RESULT IN LACK OF DEMAND AND STRONG NEGOTIATION ON BUYERS FRONT HENCE WE ARRIVE AT REDUCTION OF 20% FURTHER TO THE PRESENT VALUE OF THE PROPERTY INORDER TO FACILIATE SALE  AND COMPLY WITH ALL THE LIQUIADATION CONDITIONS AND WITHIN FIXED TIMELINES SET FOR PROCESS COMPLETION";
          const desc = fields.realisableValueDesc || defaultDesc;
          
          r.drawSectionHeader('REALISABLE VALUE / LIQUIDATION VALUE');
          r.drawCustomSplitRow(desc, 'Rs. ' + formatIndianCurrency(Math.round(parseFloat(String(fields.realisableValueAmount || '').replace(/[^\d.]/g, '')) || 0).toString()), 0.77, { col1Bold: true, col2Bold: true, col1Align: 'justify', col2Align: 'left' });
          if (fields.realisableValueOrSay) {
            r.drawCustomSplitRow('OR SAY', fields.realisableValueOrSay, 0.77, { col1Bold: true, col2Bold: true, col1Align: 'center', col2Align: 'left' });
          }
          if (fields.realisableValueInWords) {
            r.drawFullWidthRow(fields.realisableValueInWords, { bold: true });
          }
          r.advanceCursor(6);
        }
      } 
      
      // ════════════════════════════════════════════════
      // VARIANT B: CUTTACK
      // ════════════════════════════════════════════════
      else {
        
        // ─── GOVERNMENT GUIDELINE VALUE (unified table) ───
        {
          const guidelineTableHeaders = ['GOVERNMENT GUIDELINE VALUE', '', '', '', '', '', ''];
          const guidelineTableRows: string[][] = [];

          // Row 1: Land Component Description (full-width)
          if (fields.cuttackLandComponentDescGuideline) {
            guidelineTableRows.push(['Land Component - ' + fields.cuttackLandComponentDescGuideline, '', '', '', '', '', '']);
          }

          // Row 2: Column sub-headers
          guidelineTableRows.push(['!!BOLD!!Mouza', '!!BOLD!!Nature', '!!BOLD!!Plot no', '!!BOLD!!Khata no', '!!BOLD!!Area', '!!BOLD!!Rate per dec', '!!BOLD!!Amount']);

          // Data rows
          if (fields.guidelinePlotRows && fields.guidelinePlotRows.length > 0) {
            for (const row of fields.guidelinePlotRows as GuidelinePlotRow[]) {
              guidelineTableRows.push([row.mouza, row.nature, row.plotNo, row.khataNo, row.area, row.ratePerDec, row.amount]);
            }
          }

          // Total Guideline Plot Value
          const guidelineAreaSum = (fields.guidelinePlotRows || []).reduce((s: number, rw: any) => { const m = String(rw.area || '').match(/(\d+\.?\d*)/); return s + (m ? parseFloat(m[1]) || 0 : 0); }, 0);
          guidelineTableRows.push([
            `!!SPAN:6!!!!BOLD!!TOTAL GUIDELINE PLOT VALUE FOR AC.${guidelineAreaSum.toFixed(3)} dec`, '', '', '', '', '',
            '!!BOLD!!' + (fields.guidelinePlotTotal || '')
          ]);

          // Compound Wall row (text | Rs. amount) — split at pipe
          if (fields.cuttackCompoundWallGuideline) {
            const cwParts = String(fields.cuttackCompoundWallGuideline).split(/\|\s*/);
            const cwText = (cwParts[0] || '').trim();
            const cwAmt = (cwParts[1] || '').trim();
            guidelineTableRows.push([
              '!!SPAN:6!!' + cwText, '', '', '', '', '',
              cwAmt
            ]);
          }

          // Sheds/Buildings Depreciation row (text | Rs. amount)
          if (fields.cuttackShedsDepPctGuideline || fields.cuttackShedsDepAmtGuideline) {
            guidelineTableRows.push([
              `!!SPAN:6!!Present depreciated market value of the available sheds and buildings, at its present status, assessed @ ${fields.cuttackShedsDepPctGuideline || 0}% of the present value`, '', '', '', '', '',
              'Rs. ' + formatIndianCurrency(String(fields.cuttackShedsDepAmtGuideline || '0').replace(/[^\d.]/g, ''))
            ]);
          }

          // TOTAL GUIDELINE VALUE FOR LAND AND BUILDING (same font size as data = 8pt default, bold)
          guidelineTableRows.push([
            '!!SPAN:6!!!!BOLD!!TOTAL GUIDELINE VALUE FOR LAND AND BUILDING', '', '', '', '', '',
            '!!BOLD!!' + (fields.cuttackTotalGuidelineLandBuilding || '')
          ]);

          // Or Say (font size = 10pt)
          guidelineTableRows.push([
            '!!SPAN:6!!!!BOLD!!!!FONTSIZE:10!!Or Say', '', '', '', '', '',
            '!!BOLD!!!!FONTSIZE:10!!' + (fields.cuttackGuidelineOrSay || '')
          ]);

          // GUIDELINE LAND & BUILDING VALUE in words (full-width, font size = 10pt, bold+italic)
          const orSayGuidelineNum = parseFloat(String(fields.cuttackGuidelineOrSay || '').replace(/[^\d.]/g, '')) || 0;
          if (orSayGuidelineNum > 0) {
            guidelineTableRows.push([
              `!!BOLD!!!!FONTSIZE:10!!GUIDELINE LAND & BUILDING VALUE - ${rupeesInWords(orSayGuidelineNum).toUpperCase()}`, '', '', '', '', '', ''
            ]);
          }

          r.drawDataTable(guidelineTableHeaders, guidelineTableRows);
        }
        r.advanceCursor(6);

        // ─── PRESENT MARKET VALUE (unified table) ───
        {
          const presentTableHeaders = ['PRESENT MARKET VALUE', '', '', '', '', '', ''];
          const presentTableRows: string[][] = [];

          // Row 1: Land Component Description (full-width)
          if (fields.cuttackLandComponentDescPresent) {
            presentTableRows.push(['Land Component - ' + fields.cuttackLandComponentDescPresent, '', '', '', '', '', '']);
          }

          // Row 2: Column sub-headers
          presentTableRows.push(['!!BOLD!!Mouza', '!!BOLD!!Nature', '!!BOLD!!Plot no', '!!BOLD!!Khata no', '!!BOLD!!Area', '!!BOLD!!Rate per dec', '!!BOLD!!Amount']);

          // Data rows
          if (fields.presentPlotRows && fields.presentPlotRows.length > 0) {
            for (const row of fields.presentPlotRows as PresentPlotRow[]) {
              presentTableRows.push([row.mouza, row.nature, row.plotNo, row.khataNo, row.area, row.ratePerDec, row.amount]);
            }
          }

          // Total Present Market Value Plot
          const presentAreaSum = (fields.presentPlotRows || []).reduce((s: number, rw: any) => { const m = String(rw.area || '').match(/(\d+\.?\d*)/); return s + (m ? parseFloat(m[1]) || 0 : 0); }, 0);
          presentTableRows.push([
            `!!SPAN:6!!!!BOLD!!TOTAL PRESENT MARKET VALUE PLOT FOR AC.${presentAreaSum.toFixed(3)} dec`, '', '', '', '', '',
            '!!BOLD!!' + (fields.presentPlotTotal || '')
          ]);

          // Compound Wall row (text | Rs. amount)
          if (fields.cuttackCompoundWallPresent) {
            const cwParts = String(fields.cuttackCompoundWallPresent).split(/\|\s*/);
            const cwText = (cwParts[0] || '').trim();
            const cwAmt = (cwParts[1] || '').trim();
            presentTableRows.push([
              '!!SPAN:6!!' + cwText, '', '', '', '', '',
              cwAmt
            ]);
          }

          // Sheds/Buildings Depreciation row (text | Rs. amount)
          if (fields.cuttackShedsDepPctPresent || fields.cuttackShedsDepAmtPresent) {
            presentTableRows.push([
              `!!SPAN:6!!Present depreciated market value of the available sheds and buildings, at its present status, assessed @ ${fields.cuttackShedsDepPctPresent || 0}% of the present value`, '', '', '', '', '',
              'Rs. ' + formatIndianCurrency(String(fields.cuttackShedsDepAmtPresent || '0').replace(/[^\d.]/g, ''))
            ]);
          }

          // TOTAL PRESENT VALUE FOR LAND AND BUILDING (bold, default font size)
          presentTableRows.push([
            '!!SPAN:6!!!!BOLD!!TOTAL PRESENT VALUE FOR LAND AND BUILDING', '', '', '', '', '',
            '!!BOLD!!' + (fields.cuttackTotalPresentLandBuilding || '')
          ]);

          // Or Say (font size = 10pt)
          presentTableRows.push([
            '!!SPAN:6!!!!BOLD!!!!FONTSIZE:10!!Or Say', '', '', '', '', '',
            '!!BOLD!!!!FONTSIZE:10!!' + (fields.cuttackPresentOrSay || '')
          ]);

          // PRESENT LAND & BUILDING VALUE in words (full-width, font size = 10pt, bold)
          const orSayPresentNum = parseFloat(String(fields.cuttackPresentOrSay || '').replace(/[^\d.]/g, '')) || 0;
          if (orSayPresentNum > 0) {
            presentTableRows.push([
              `!!BOLD!!!!FONTSIZE:10!!PRESENT LAND & BUILDING VALUE - ${rupeesInWords(orSayPresentNum).toUpperCase()}`, '', '', '', '', '', ''
            ]);
          }

          r.drawDataTable(presentTableHeaders, presentTableRows);
        }
        r.advanceCursor(6);

        // ─── BUILDING/SHED COST (unified table) ───
        {
          const bldgHeaders = ['BUILDING/SHED COST', '', '', '', '', '', '', ''];
          const bldgRows: string[][] = [];

          // Column sub-headers
          bldgRows.push(['!!BOLD!!Sl', '!!BOLD!!Area particular', '!!BOLD!!Plinth area', '!!BOLD!!Age', '!!BOLD!!Rate/sft.', '!!BOLD!!Replacement cost', `!!BOLD!!Depreciation (${String(fields.cuttackBuildingDepreciationPercent || 0).replace(/%/g, '')}%)`, '!!BOLD!!Net value']);

          // Data rows
          if (fields.cuttackBuildingRows && fields.cuttackBuildingRows.length > 0) {
            for (const row of fields.cuttackBuildingRows as BuildingCostRow[]) {
              bldgRows.push([row.sl, row.areaParticular, row.plinthArea, row.age, row.rateSft, row.replacementCost, row.depreciation, row.netValue]);
            }
          }

          // Total row
          if (fields.cuttackBuildingTotal) {
            bldgRows.push([
              '!!SPAN:7!!!!BOLD!!Total', '', '', '', '', '', '',
              '!!BOLD!!' + fields.cuttackBuildingTotal
            ]);
          }

          // Total Land and Building/Shed Components row
          if (fields.cuttackBuildingComponentsTotal) {
            bldgRows.push([
              '!!SPAN:7!!!!BOLD!!Total LAND AND BUILDING/SHED COMPONENTS', '', '', '', '', '', '',
              '!!BOLD!!Rs. ' + formatIndianCurrency(String(fields.cuttackBuildingComponentsTotal || '0').replace(/[^\d.]/g, ''))
            ]);
          }

          // Or Say row
          if (fields.cuttackBuildingOrSay) {
            bldgRows.push([
              '!!SPAN:7!!!!CENTER!!!!BOLD!!OR SAY', '', '', '', '', '', '',
              '!!BOLD!!' + fields.cuttackBuildingOrSay
            ]);
          }

          // PRESENT BUILDING VALUE in words (full-width, bold)
          const bldgOrSayNum = parseFloat(String(fields.cuttackBuildingOrSay || '').replace(/[^\d.]/g, '')) || 0;
          if (bldgOrSayNum > 0) {
            bldgRows.push([
              `!!BOLD!!PRESENT BUILDING VALUE - ${rupeesInWords(bldgOrSayNum).toUpperCase()}`, '', '', '', '', '', '', ''
            ]);
          }

          r.drawDataTable(bldgHeaders, bldgRows);
        }
        r.advanceCursor(6);

        // ─── REALISABLE / LIQUIDATION VALUE ───
        if (fields.realisableValueAmount) {
          const defaultDesc = "FAIR MARKET VALUE REPRESENTS THE PRICE A PROPERTY WOULD BE SOLD IN AN OPEN MARKET BETWEEN KNOWLEDGEABLE, WILLING PARTIES, WHEREAS REALISABLE VALUE DEDUCTS THE ESTIMATED COSTS THAT WOULD BE INCURRED TO COMPLETE THE SALE FROM THAT MARKET VALUE, REFLECTING THE ACTUAL AMOUNT LIKELY OBTAINED AFTER SELLING EXPENSES ARE PAID IN NORMAL CIRCUMSTANCES. AS PER RBI GUIDELINES THE COSTS MAY INCLUE BUT NOT LIMITED TO TAXES, LEGAL CHARGES, MARKETING EXPENSES, TRANSACTIONS CHARGES AND COMMISSIONS. IF TRANSACTION IS TO BE CARRIED OUT UNDER FORCED OR DISTRESSED CONDITIONS THEN THE COMMERCIAL VIABILITY IS DRASTICALLTY AFFECTED OWING TO DISTRESS TRANCTION WITHIN STIPULATED TIME FRAME SET BY HONOUABLE COURTS AND EXISTING LEGAL AND BREACH OF CONTRACT RISK. SUCH A TRANSACTION WILL RESULT IN LACK OF DEMAND AND STRONG NEGOTIATION ON BUYERS FRONT HENCE WE ARRIVE AT REDUCTION OF 20% FURTHER TO THE PRESENT VALUE OF THE PROPERTY INORDER TO FACILIATE SALE  AND COMPLY WITH ALL THE LIQUIADATION CONDITIONS AND WITHIN FIXED TIMELINES SET FOR PROCESS COMPLETION";
          const desc = fields.realisableValueDesc || defaultDesc;
          
          r.drawSectionHeader('REALISABLE VALUE / LIQUIDATION VALUE');
          r.drawCustomSplitRow(desc, 'Rs. ' + formatIndianCurrency(Math.round(parseFloat(String(fields.realisableValueAmount || '').replace(/[^\d.]/g, '')) || 0).toString()), 0.77, { col1Bold: true, col2Bold: true, col1Align: 'justify', col2Align: 'left' });
          if (fields.realisableValueOrSay) {
            r.drawCustomSplitRow('OR SAY', fields.realisableValueOrSay, 0.77, { col1Bold: true, col2Bold: true, col1Align: 'center', col2Align: 'left' });
          }
          {
            const orSayLiqNum = parseFloat(String(fields.realisableValueOrSay || '').replace(/[^\d.]/g, '')) || 0;
            if (orSayLiqNum > 0) {
              r.drawFullWidthRow(`LIQUIDATION VALUE - ${rupeesInWords(orSayLiqNum).toUpperCase()}`, { bold: true });
            }
          }
          r.advanceCursor(6);
        }
      }

      // Annexure reference (Applies to both)
      if (fields.annexureEnabled && fields.annexures.length > 0) {
        const firstAnnexure = fields.annexures.find((a: AnnexureItem) => a.parsedData);
        const annexureLabel = firstAnnexure ? firstAnnexure.label : fields.annexures[0].label;
        r.drawTextBlock(`The detailed plot-by-plot calculations and area abstracts are provided in Annexure ${annexureLabel}.`);
        r.advanceCursor(8);
      }


      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTION 14: SITE LOCATION (reference)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('14. SITE LOCATION:');
      tocPageMap['14. SITE LOCATION'] = r.getPageCount();
      if (fields.latitude || fields.longitude) {
        r.drawSimpleRow('Latitude', fields.latitude || 'N/A');
        r.drawSimpleRow('Longitude', fields.longitude || 'N/A');
      }
      r.advanceCursor(4);

      // ── Location Map (inside Section 14) ──
      if (locationBytes && locationBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle('LOCATION MAP');
        r.advanceCursor(4);
        await r.drawImageBlock(locationBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        if (fields.latitude || fields.longitude) {
          r.drawTextBlock(`Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}`, { bold: true, align: 'center' });
        }
        r.advanceCursor(4);
      }

      // ── Mouza Map (inside Section 14) ──
      if (mouzaMapBytes && mouzaMapBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle(fields.mouzaMapTitle || 'MOUZA MAP SUPERIMPOSED OVER SATELLITE MAP');
        r.advanceCursor(4);
        await r.drawImageBlock(mouzaMapBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        r.advanceCursor(4);
      }

      // ── Revenue Map (inside Section 14) ──
      if (revenueMapBytes && revenueMapBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle(fields.revenueMapTitle || 'REVENUE MAP');
        r.advanceCursor(4);
        await r.drawImageBlock(revenueMapBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        r.advanceCursor(4);
      }

      // ── CDP Map (inside Section 14) ──
      if (cdpMapBytes && cdpMapBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle(fields.cdpMapTitle || 'CDP MAP');
        r.advanceCursor(4);
        await r.drawImageBlock(cdpMapBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        r.advanceCursor(4);
      }

      // ── Govt Guideline Value (inside Section 14) ──
      if (guidelineValueBytes && guidelineValueBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle(fields.guidelineValueTitle || 'GOVT GUIDELINE VALUE');
        r.advanceCursor(4);
        await r.drawImageBlock(guidelineValueBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        r.advanceCursor(4);
      }

      // ── ROR/PATTA (inside Section 14) ──
      if (rorPattaBytes && rorPattaBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle(fields.rorPattaTitle || 'ROR/PATTA');
        r.advanceCursor(4);
        await r.drawImageBlock(rorPattaBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        r.advanceCursor(4);
      }
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTION 15: ASSUMPTION & LIMITATION (matches sample)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('15. ASSUMPTION & LIMITATION.');
      tocPageMap['15. ASSUMPTIONS & LIMITATIONS'] = r.getPageCount();
      r.advanceCursor(4);
      r.drawTextBlock('For this report we have carried out analysis and assessments of the market(s) under consideration and the demand-supply for the residential and commercial sectors in general.');
      r.advanceCursor(4);
      r.drawTextBlock('This report is not based on comprehensive market research of the overall market for all possible situations. We have covered specific market and situations, which are highlighted in the report. The opinions expressed in the report are subject to the limitations mentioned in this para.');
      r.advanceCursor(4);
      r.drawTextBlock('It should be noted that value assessments are based upon the facts and evidence available at the date of assessment. Changes in socio-economic and political conditions could result in a substantially different situation that the value assessments be periodically reviewed.');
      r.advanceCursor(4);
      r.drawTextBlock(`The report is only for the purpose of assessing fair market value of the property as per detail provided by the client and for the exclusive use of ${certOwner}, and should not be used by any other person or for any other purpose. Report provided is limited to opinion of value and do not constitute an audit, a due diligence and tax related services. Through this report we do not express an opinion on the financial information of the business of any party, including the owners and its affiliates and subsidiaries. The report is prepared solely for the purpose stated, and should not be used for any other purpose.`);
      r.advanceCursor(4);
      r.drawTextBlock('No investigation of the title of the assets has been made and owners claims to the assets are assumed to be valid. It is assumed that the property is free from all encumbrance.');
      r.advanceCursor(4);
      r.drawTextBlock('It is also assumed, that there is no liability of outstanding on the owners taxation or any other expense towards statutory compliance for realization.');
      r.advanceCursor(4);
      r.drawTextBlock('In the preparations of the report, we have relied on the following information:');
      r.drawTextBlock('\u2022 The information provided by the owner\'s or their representative appointed / its affiliates subsidiaries during the visits.');
      r.drawTextBlock('\u2022 Recent data on the industry segments and market projections.');
      r.advanceCursor(4);
      r.drawTextBlock('The value assessed is my best opinion under the current circumstances and market scenario and is not a guarantee. Real estate prices are subject to wide fluctuations and the valuation need to be reviewed at suitable regular intervals.');
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  CONCLUSION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('CONCLUSION');
      tocPageMap['CONCLUSION'] = r.getPageCount();
      r.advanceCursor(4);
      const fmvVal = parseFloat(fields.fairMarketValueTotal) || 0;
      const realVal = parseFloat(fields.realisableValueTotal) || 0;
      const guideVal = parseFloat(fields.bookValueTotal) || 0;
      r.drawTextBlock('The present market value of a property is the price which a willing buyer will pay to a willing seller considering the risks involved at the reality and authenticity of the property, including thorough investigation about its genuineness of existence and all that required. Liquidation value of the assets in present consideration, is estimated in a reasonable manner and judiciously on the basis of facts and circumstances observed by us & estimation of benefits, subject to its propriety, on above consideration. It will of course vary from professionals opinion and case to case, place to place, location to location and for different characteristics too. We assess it accordingly, based on the above considerations.');
      r.advanceCursor(6);
      r.drawTextBlock(`After considering various important factor discussed above, we are of the opinion that the fair market Value of ${coverDesc} as per the current date at ${certAddress}, currently owned by ${certOwner}`);
      r.advanceCursor(4);
      r.drawTextBlock(`Present Market Value is INR. ${formatIndianCurrency(fields.fairMarketValueTotal || '0')}. (${rupeesInWords(fmvVal).toUpperCase()}).`, { bold: true });
      r.advanceCursor(2);
      if (fields.realisableValueTotal) {
        r.drawTextBlock(`Realisable value is INR. ${formatIndianCurrency(fields.realisableValueTotal || '0')}. (${rupeesInWords(realVal).toUpperCase()}).`, { bold: true });
        r.advanceCursor(2);
      }
      if (fields.bookValueTotal) {
        r.drawTextBlock(`Govt Guideline Value is INR. ${formatIndianCurrency(fields.bookValueTotal || '0')}. (${rupeesInWords(guideVal).toUpperCase()}).`, { bold: true });
        r.advanceCursor(2);
      }
      r.advanceCursor(8);

      // Conclusion signature (Place on left, Signature + Name on right)
      r.drawSplitSignatureBlock(
        [
          { text: `Date: ${fields.dateOfValuation || '________'}` },
          { text: `Place - Bhubaneswar`, bold: true },
        ],
        [
          { text: 'Signature & Seal of Valuer', italic: true },
          { text: `Name of the Valuer - ${fields.representativeName ? fields.representativeName.toUpperCase() : ''}`, bold: true },
        ]
      );

      // ── Remarks ──
      if (fields.remarks) {
        r.drawSectionHeader('REMARKS');
        r.drawTextBlock(fields.remarks);
        r.advanceCursor(8);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  DECLARATION AND UNDERTAKING (exact 16 clauses from sample)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawSectionHeader('DECLARATION AND UNDERTAKING');
      tocPageMap['DECLARATION AND UNDERTAKING'] = r.getPageCount();
      r.advanceCursor(6);
      r.drawTextBlock(`I ${fields.representativeName ? 'Mr. ' + fields.representativeName : 'Mr. ________'}${fields.representativeFatherName ? ', S/o: ' + fields.representativeFatherName : ''} do hereby solemnly affirm and state that:`, { bold: true });
      r.advanceCursor(4);
      const declarations = [
        'I am citizen of India.',
        'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.',
        `The information furnished in my valuation report dated ${fields.dateOfValuation || '________'} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.`,
        `I have personally inspected the property on ${fields.dateOfInspection || '________'}. The work is not sub-contracted to any other valuer & carried out by myself.`,
        'I have not been removed from service/employment earlier.',
        'I have not been convicted of any offence & sentenced to a term of imprisonment.',
        'I have not been declared to be unsound mind.',
        'I have not been found guilty of misconduct in my professional capacity.',
        'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.',
        'I have not undischarged insolvent.',
        'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.',
        'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.',
        'My PAN Card number as applicable is AOVPP5837R.',
        'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure.',
        'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.',
        'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.',
        'I am not registered under Section 34 AB of the Wealth Tax Act, 1957.',
        'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI).',
        'I am the authorized official of the firm who is competent to sign this valuation report.',
        'Further, I hereby provide the following information.',
      ];
      for (let i = 0; i < declarations.length; i++) {
        r.drawTextBlock(declarations[i]);
        r.advanceCursor(3);
      }
      r.advanceCursor(8);

      // Declaration signature
      r.drawSignatureBlock([
        { text: `Date: ${fields.dateOfValuation || '________'}` },
        { text: 'Signature & Seal of Valuer' },
        { text: 'Place: Bhubaneswar' },
        { text: `Name of the Valuer - ${fields.representativeName ? fields.representativeName.toUpperCase() : ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications.toUpperCase() : ''}`, bold: true },
      ]);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  PROPERTY PHOTOGRAPHS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (propImageBytes.length > 0) {
        r.newPage();
        r.drawCenteredTitle('PROPERTY PHOTOGRAPHS');
      tocPageMap['PROPERTY PHOTOGRAPHS'] = r.getPageCount();
        r.advanceCursor(6);

        for (let i = 0; i < propImageBytes.length; i += 2) {
          const name1 = fields.propertyImageNames?.[i] || '';
          const caption1 = name1 ? `Figure ${i + 1} - ${name1.toUpperCase()}` : `Figure ${i + 1}`;
          const img2 = i + 1 < propImageBytes.length ? propImageBytes[i + 1] : null;
          const name2 = fields.propertyImageNames?.[i + 1] || '';
          const caption2 = name2 ? `Figure ${i + 2} - ${name2.toUpperCase()}` : `Figure ${i + 2}`;

          await r.drawImagePair(propImageBytes[i], caption1, img2, caption2);
          r.advanceCursor(2);
        }
      }



      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  ANNEXURES
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (fields.annexureEnabled && fields.annexures.length > 0) {
        for (const annexure of fields.annexures) {
          if (annexure.parsedData && annexure.parsedData.headers.length > 0) {
            r.newPage();
            r.drawCenteredTitle(annexure.title ? `ANNEXURE ${annexure.label} - ${annexure.title.toUpperCase()}` : `ANNEXURE ${annexure.label}`);
            tocPageMap[`ANNEXURE ${annexure.label}${annexure.title ? ': ' + annexure.title.toUpperCase() : ''}`] = r.getPageCount();
            r.advanceCursor(8);
            r.drawDataTable(annexure.parsedData.headers, annexure.parsedData.rows);
          }
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  ANNEXURE I: GENERAL PRINCIPLES AND LIMITING CONDITIONS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('ANNEXURE I: GENERAL PRINCIPLES AND LIMITING CONDITIONS');
      r.advanceCursor(8);
      r.drawTextBlock('General Principles Adopted and Limiting Conditions in the Preparation of Valuations and Reports. These are the general principles and limiting conditions upon which our valuation and reports are normally prepared; they apply unless we have specifically mentioned otherwise in the body of the report.');
      r.advanceCursor(6);
      r.drawTextBlock('CONFIDENTIALITY', { bold: true });
      r.drawTextBlock('Our valuation and reports are confidential to the client or to whom they are addressed for the specific purpose to which they refer. They may be disclosed to other professional advisors assisting the client in respect of that purpose, but the client shall not disclose the report to any other party. No responsibility is accepted to any other party and neither the whole, nor any part, nor reference thereto may be included in any published document, statement or circular, or published in any way, nor in any communication with third parties, without our prior written approval of the form and context in which it will appear.');
      r.advanceCursor(4);
      r.drawTextBlock('USE OF REPORT', { bold: true });
      r.drawTextBlock('The opinion of value expressed in this Report shall be used for the purpose stated in this Report only. We are not responsible for any consequences arising from the Valuation being quoted out of context.');
      r.advanceCursor(4);
      r.drawTextBlock('SOURCE OF INFORMATION', { bold: true });
      r.drawTextBlock('Where it is stated in the Report that information has been supplied by the sources listed, this information is believed to be reliable and no responsibility is accepted should it prove incorrect. All other information stated without being attributed directly to another party is obtained from our searches of documents or enquiries with the relevant authorities. This Report has been prepared on the basis that full disclosure of all information and facts which may affect the Valuation have been made known to ourselves and we cannot accept any liability or responsibility in any event, unless such full disclosure has been made.');
      r.advanceCursor(4);
      r.drawTextBlock('LEGAL TITLE', { bold: true });
      r.drawTextBlock('Whilst we may have inspected the title of the property as recorded in the Register Document of Title, we cannot accept any responsibility for its legal validity.');
      r.advanceCursor(4);
      r.drawTextBlock('TOWN PLANNING AND OTHER STATUTORY REGULATIONS', { bold: true });
      r.drawTextBlock('Whilst we may make verbal enquiries or gather information on Town Planning, we do not normally carry out requisitions with the various public authorities to confirm that the property is not adversely affected by any public schemes such as road and drainage improvements. If reassurance is required, we recommend that verification be obtained from your lawyers or other professional advisors.');
      r.drawTextBlock('Our valuation has been prepared on the basis and any improvements thereon comply with all relevant statutory regulations. It is assumed that they have been, or will be issued with a Certificate of Fitness for Occupation by the competent authority.');
      r.advanceCursor(4);
      r.drawTextBlock('LEASES AND TENANCIES', { bold: true });
      r.drawTextBlock('Enquiries as to the financial standing of actual or prospective lessees or tenants are not normally made unless specifically requested. Where properties are valued with the benefit of lettings, it is therefore assumed that the lessees or tenants are capable of meeting their obligations under the lease or tenancy and that there are no arrears of rent or undisclosed breaches of covenant.');
      r.advanceCursor(4);
      r.drawTextBlock('DEVELOPMENT AGREEMENTS', { bold: true });
      r.drawTextBlock('Unless otherwise stated, no allowances are made in our valuation for any joint venture agreement, development right agreement or other similar contracts.');
      r.advanceCursor(4);
      r.drawTextBlock('SITE SURVEYS', { bold: true });
      r.drawTextBlock('We have conducted boundary checks, and, we assume that the dimensions correspond with those shown in the title document, certified plan or any relevant agreement.');
      r.advanceCursor(4);
      r.drawTextBlock('STRUCTURAL SURVEYS', { bold: true });
      r.drawTextBlock('We have neither carried out a building survey nor any testing of services, nor have we inspected those parts of the property which are inaccessible. We cannot express an opinion about or advice upon the condition of uninspected parts and this Report should not be taken as making any implied representation or statement about such parts.');
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  ANNEXURE II: GENERAL ASSUMPTIONS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('ANNEXURE II: GENERAL ASSUMPTIONS');
      r.advanceCursor(8);
      r.drawTextBlock('We assume that information provided by client or its representative for this Valuation for all relevant projects is true and accurate. It includes details of measurements of land and built up area, etc.');
      r.advanceCursor(4);
      r.drawTextBlock('We have not gone through the legal aspects like documents of title deed, lease deed, revenue records, court matters (if any), and documentation like joint development with other companies. We also assume for this valuation assignment that the title and development rights of all the properties lies with the Company and is clear, marketable and free of all encumbrances, restrictions, easements or charges which may have detrimental effect upon the value of the property. It is also assumed that company has paid all property related taxes.');
      r.advanceCursor(4);
      r.drawTextBlock('We have neither carried out any soil testing nor structural surveys nor are we experts in the field of structural survey. Therefore, we do not give any assurance that properties are free from structural defect. If any investigation identifies any structural defect in the property our report may require revision. Neither are we the experts in the town planning to factor the town planning aspects in the project. Sewers, main services and the roads giving access to the property have been provided.');
      r.advanceCursor(4);
      r.drawTextBlock('We assumed that all the constructed structures and proposed construction is/will be free from harmful materials and/or techniques. Our valuation is on the basis that no such materials or techniques have been used.');
      r.advanceCursor(4);
      r.drawTextBlock('Unless advised by the company or representative of the company, we do not normally make allowance for any liability already incurred, but not yet discharged, in respect of balance land cost, completed works, or obligations in favour of contractors, subcontractors or any other professional.');
      r.advanceCursor(4);
      r.drawTextBlock('Unless advised by the company or representative of the company, no allowance is made for any expense of realization or for taxation, which may arise in the event of a disposal. The property is considered as if free and clears of all mortgages or other charges that may be secured thereon.');
      r.advanceCursor(8);

      // Annexure II signature
      r.drawSignatureBlock([
        { text: `Date: ${fields.dateOfValuation || '________'}` },
        { text: 'Signature & Seal of Valuer' },
        { text: 'Place: Bhubaneswar' },
        { text: `Name of the Valuer - ${fields.representativeName ? fields.representativeName.toUpperCase() : ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications.toUpperCase() : ''}`, bold: true },
      ]);

      return await r.toBlob();
    } catch (err) {
      console.error('PDF generation failed:', err);
      throw err;
    }
  };

  const handlePreviewPDF = async () => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating IBBI PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #b8860b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating IBBI-IVS PDF Preview...</p>
              <p style="font-size: 12px; color: #6c757d; margin: 8px 0 0;">Please wait while the document compiles.</p>
            </div>
            <style>
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }

    try {
      const blob = await handleGeneratePDF();
      if (blob && previewWindow) {
        const url = URL.createObjectURL(blob);
        previewWindow.location.href = url;
      } else if (previewWindow) {
        previewWindow.close();
        setMessage({ type: 'error', text: 'Failed to generate PDF preview.' });
      }
    } catch (err: any) {
      if (previewWindow) previewWindow.close();
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    }
  };

  const handleDownloadPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF for download...' });
    try {
      const blob = await handleGeneratePDF();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fields.applicantName ? fields.applicantName.replace(/\s+/g, '_') : 'IBBI'}_Valuation_Report_${projectId}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      }
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    }
  };

  // Feature flag: AI Assist panel visibility
  const aiAssistEnabled = process.env.NEXT_PUBLIC_AI_ASSIST_ENABLED === 'true';

  // ── Main Return ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-2xl border border-neutral-200 shadow-md w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#b8860b] border-t-transparent"></div>
        <p className="mt-4 text-sm font-bold text-[#0f2038]">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className={`flex ${aiAssistEnabled ? 'gap-4' : 'gap-6'} items-start w-full`} ref={reportRef}>
      {message && (
        <div className={`fixed top-0 left-0 right-0 z-[100] px-6 py-3 text-sm font-semibold text-center shadow-lg ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Template Info Banner */}
        <div className="p-4 bg-white border border-[#dee2e6] flex flex-row items-center justify-between gap-4 shadow-md rounded-2xl sticky top-2 z-50">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight min-w-[90px] select-none">
              Active<br />Configuration
            </div>
             <div className="flex flex-wrap gap-2">
               <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                 {fields.clientType === 'organisation' ? 'Organisation / Bank' : 'Individual'}
               </span>
               {fields.institutionCategory && fields.institutionCategory !== 'IBBI' && fields.institutionCategory !== 'IBBI_IVS' && (
                 <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                   {fields.institutionCategory}
                 </span>
               )}
               <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                 Service: {(SERVICES_LIST.find(s => s.id === fields.serviceType)?.title || fields.serviceType || 'Land Valuation').replace(/_/g, ' ')}
               </span>
               <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                 Subject: {(fields.subjectType || 'Residential Land').replace(/_/g, ' ')}
               </span>
             </div>
          </div>
          <button
            type="button"
            onClick={handleResetWizard}
            className="text-xs text-[#b8860b] hover:text-[#8a6507] hover:underline font-bold transition-colors shrink-0 pr-2 uppercase"
          >
            Change Parameters
          </button>
        </div>

        {/* Rework Banner */}
        {fields.reworkNotes && status === 'REPORT_DRAFTING' && (
          <div className="card p-5 border-2 border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Manager Rework Requested</h2>
            </div>
            <p className="text-sm text-red-700 bg-white/60 p-4 rounded-lg border border-red-100 whitespace-pre-wrap">
              {fields.reworkNotes}
            </p>
          </div>
        )}

          {/* ── Section 1: Objective & Dates ── */}
          <Section title="Objective & Declarations" number={1}>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-blue-800">Fill the dates, representative details, and certificate fields below. Section 1 (Objective), Section 2 (Scope), and Section 3 (Basis) use <strong>standard IBBI-IVS text by default</strong>. You can override any sub-section text below.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date of Inspection">
                <input type="date" value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Valuation Report">
                <input type="date" value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Reference No">
                <input type="text" value={fields.refNo} onChange={e => handleChange('refNo', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Representative Name (for Declaration)">
                <input type="text" value={fields.representativeName} onChange={e => handleChange('representativeName', e.target.value)} className={inputCls} placeholder="Name of inspecting representative" disabled={isReadOnly} />
              </Field>
              <Field label="Representative's Father's Name">
                <input type="text" value={fields.representativeFatherName} onChange={e => handleChange('representativeFatherName', e.target.value)} className={inputCls} placeholder="Father's name of representative" disabled={isReadOnly} />
              </Field>
              <Field label="Valuer Qualifications (Appears next to name)">
                <input type="text" value={fields.valuerQualifications} onChange={e => handleChange('valuerQualifications', e.target.value)} className={inputCls} placeholder="e.g. , (B.TECH, Civil) FIIV, AIV" disabled={isReadOnly} />
              </Field>
              <Field label="Additional Valuer Details (Each line will appear centered below)" span={2}>
                <textarea rows={3} value={fields.valuerAdditionalDetails} onChange={e => handleChange('valuerAdditionalDetails', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g.\nRegistered Valuer, IBBI Govt. of India (Regd. No.-...)\nM.SC(Real Estate Valuation)..." disabled={isReadOnly} />
              </Field>
              <Field label="Registered Office Address">
                <input type="text" value={fields.registeredOfficeAddress} onChange={e => handleChange('registeredOfficeAddress', e.target.value)} className={inputCls} placeholder="e.g. AL 71 OSHB COLONY VSS NAGAR BHUBANESWAR 751007" disabled={isReadOnly} />
              </Field>
              <Field label="Registered Office Telephone">
                <input type="text" value={fields.registeredOfficeTel} onChange={e => handleChange('registeredOfficeTel', e.target.value)} className={inputCls} placeholder="e.g. (0674)3594365" disabled={isReadOnly} />
              </Field>

            </div>

            {/* Sub-section text overrides */}
            <div className="mt-6">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Section 1 Sub-section Text Overrides <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold ml-1">OPTIONAL</span></p>
              <p className="text-xs text-gray-500 mb-3">Leave blank to use standard IBBI-IVS default text. Fill to override with your own custom text.</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="1.1 Valuation Standard" span={2}>
                  <textarea rows={2} value={fields.objective1_1 || ''} onChange={e => handleChange('objective1_1', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: The entire valuation exercise has been carried out in accordance of Standard procedures laid down as per the International Valuation Standards." disabled={isReadOnly} />
                </Field>
                <Field label="1.2 Purpose of Valuation (full paragraph)" span={2}>
                  <textarea rows={2} value={fields.objective1_2 || ''} onChange={e => handleChange('objective1_2', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: The Valuation is required for the purpose of [purposeOfValuation] of the aforesaid property on the basis of market survey method as on the date of valuation." disabled={isReadOnly} />
                </Field>
                <Field label="1.3 Conflict of Interest" span={2}>
                  <textarea rows={2} value={fields.objective1_3 || ''} onChange={e => handleChange('objective1_3', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: The valuer has no direct or indirect interest in the property valued, nor any personal interest or bias with respect to the parties involved." disabled={isReadOnly} />
                </Field>
                <Field label="1.4 Currency and Measurement" span={2}>
                  <textarea rows={2} value={fields.objective1_4 || ''} onChange={e => handleChange('objective1_4', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: All amounts are in Indian Rupees (INR). Land is measured in Acres/Decimals/Sq. ft. as applicable." disabled={isReadOnly} />
                </Field>
                <Field label="1.5 Responsibility to Third Parties" span={2}>
                  <textarea rows={2} value={fields.objective1_5 || ''} onChange={e => handleChange('objective1_5', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: This report is prepared only for the stated purpose and the parties named herein." disabled={isReadOnly} />
                </Field>
                <Field label="1.6 Disclosure and Publication" span={2}>
                  <textarea rows={2} value={fields.objective1_6 || ''} onChange={e => handleChange('objective1_6', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: This valuation report or any reference thereof should not be used in any published document without the consent of the valuer." disabled={isReadOnly} />
                </Field>
                <Field label="1.7 Limitations on Liability" span={2}>
                  <textarea rows={2} value={fields.objective1_7 || ''} onChange={e => handleChange('objective1_7', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: The valuer shall not be liable for any loss or damage arising from this report except to the extent that such loss or damage is caused by the valuer's negligence." disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            {/* Section 2 sub-section text overrides */}
            <div className="mt-6">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Section 2: Scope of Enquiries <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold ml-1">OPTIONAL</span></p>
              <p className="text-xs text-gray-500 mb-3">Leave blank to use standard IBBI-IVS default text. Fill to override.</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="2.1 Site Inspection" span={2}>
                  <textarea rows={2} value={fields.scope2_1 || ''} onChange={e => handleChange('scope2_1', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: Site inspection was carried out on [Date of Inspection]." disabled={isReadOnly} />
                </Field>
                <Field label="2.2 Enquiries" span={2}>
                  <textarea rows={2} value={fields.scope2_2 || ''} onChange={e => handleChange('scope2_2', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: Enquiries were made with local people, real estate agents, and brokers to assess the prevailing market conditions." disabled={isReadOnly} />
                </Field>
                <Field label="2.3 Legal Parameters of Property" span={2}>
                  <textarea rows={2} value={fields.scope2_3 || ''} onChange={e => handleChange('scope2_3', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: Documents and records relating to title, extent, and encumbrances were examined." disabled={isReadOnly} />
                </Field>
                <Field label="2.4 Environmental Aspects" span={2}>
                  <textarea rows={2} value={fields.scope2_4 || ''} onChange={e => handleChange('scope2_4', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: The property was assessed for environmental conditions as observed during inspection." disabled={isReadOnly} />
                </Field>
                <Field label="2.5 Information Provided" span={2}>
                  <textarea rows={2} value={fields.scope2_5 || ''} onChange={e => handleChange('scope2_5', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: Information was provided by the property owners, authorized representatives, and from public records." disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            {/* Section 3 text override */}
            <div className="mt-6">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Section 3: Basis of Valuation <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold ml-1">OPTIONAL</span></p>
              <p className="text-xs text-gray-500 mb-3">Leave blank to use standard IBBI-IVS default text. Fill to override.</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="3. Basis of Valuation (use double line-breaks to separate paragraphs)" span={2}>
                  <textarea rows={5} value={fields.basis3 || ''} onChange={e => handleChange('basis3', e.target.value)} className={inputCls + ' resize-none'} placeholder="Default: The basis of valuation of industries depends on various factors such as the purpose of valuation, statutory requirements, business drivers... (3 paragraphs covering: basis of value, fair value & liquidation value per IBBI Regulations 2016, and reliance on client information). Leave blank to use full default text." disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── Valuation Certificate ── */}
          <Section title="📜 Valuation Certificate Details" number={0}>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-amber-800">These fields populate the <strong>Valuation Certificate</strong> page in the PDF. Fields marked <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">AUTO</span> are auto-filled from other sections but can be overridden.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Case Parties (in the matter of...)" span={2}>
                <input type="text" value={fields.caseParties || ''} onChange={e => handleChange('caseParties', e.target.value)} className={inputCls} placeholder="e.g. Noida Infratech Two Pvt Ltd vs Falcony Consultancy Pvt Ltd" disabled={isReadOnly} />
              </Field>
              <Field label="Case Reference No (Primary)">
                <input type="text" value={fields.caseReferenceNo || ''} onChange={e => handleChange('caseReferenceNo', e.target.value)} className={inputCls} placeholder="e.g. C.P.(IB) No. 300/KB/2017" disabled={isReadOnly} />
              </Field>
              <Field label="Case Reference No (Secondary)">
                <input type="text" value={fields.caseReferenceNo2 || ''} onChange={e => handleChange('caseReferenceNo2', e.target.value)} className={inputCls} placeholder="e.g. T.P. (IB) No 112/CTB/2019" disabled={isReadOnly} />
              </Field>
              <Field label="Appointed By">
                <input type="text" value={fields.appointedBy || ''} onChange={e => handleChange('appointedBy', e.target.value)} className={inputCls} placeholder="e.g. CA Sonu Jain" disabled={isReadOnly} />
              </Field>
              <Field label="Appointee Designation">
                <input type="text" value={fields.appointedByDesignation || ''} onChange={e => handleChange('appointedByDesignation', e.target.value)} className={inputCls} placeholder="e.g. an Insolvency Professional" disabled={isReadOnly} />
              </Field>
              <Field label="Appointment Date">
                <input type="date" value={fields.appointmentDate || ''} onChange={e => handleChange('appointmentDate', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Purpose of Valuation">
                <input type="text" value={fields.purposeOfValuation || ''} onChange={e => handleChange('purposeOfValuation', e.target.value)} className={inputCls} placeholder="Access of Fair Market Value for Auction purpose" disabled={isReadOnly} />
              </Field>

              {/* Auto-filled fields with override */}
              <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Certificate Table Fields <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold ml-1">AUTO-FILLED</span></p>
              </div>

              <Field label="Client Name" span={2}>
                <div className="flex items-center gap-2">
                  <input type="text" value={fields.applicantName || fields.ownerName || ''} className={inputCls + ' bg-blue-50 opacity-70'} disabled={true} />
                  <span className="text-[10px] text-blue-600 whitespace-nowrap">← from Owner Name</span>
                </div>
              </Field>
              <Field label="Owner Contact Details">
                <input type="text" value={fields.ownerContactDetails || ''} onChange={e => handleChange('ownerContactDetails', e.target.value)} className={inputCls} placeholder="e.g. 9876543210, owner@email.com" disabled={isReadOnly} />
              </Field>
              <Field label="Valuation Method">
                <input type="text" value={fields.valuationMethod || ''} onChange={e => handleChange('valuationMethod', e.target.value)} className={inputCls} placeholder="Sale Comparison Method coupled with..." disabled={isReadOnly} />
              </Field>
              <Field label="Certificate Description (detailed property description)" span={2}>
                <textarea rows={3} value={fields.certificateDescription || ''} onChange={e => handleChange('certificateDescription', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. This IDCO Plot close to NH-16, Cuttack-Chandabali Road, approx 1 KM" disabled={isReadOnly} />
              </Field>
            </div>
          </Section>

          {/* ── Section 4: Brief Description ── */}
          <Section title="Brief Description of the Property" number={4}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property Description (Introductory paragraph in PDF)" span={2}>
                <textarea value={fields.propertyDescription || ''} onChange={e => handleChange('propertyDescription', e.target.value)} className={inputCls + ' resize-none'} rows={3} placeholder="e.g. an inoperative water bottling unit over IDCO plot no 11,11/A at Jagatpur Industrial Estate" disabled={isReadOnly} />
              </Field>
              <Field label="Applicant / Owner Name(s)" span={2}>
                <textarea value={fields.applicantName} onChange={e => handleChange('applicantName', e.target.value)} className={inputCls} rows={2} placeholder="Full list of owners" disabled={isReadOnly} />
              </Field>
              <Field label="Managing Director">
                <select value={fields.hasManagingDirector || 'no'} onChange={e => handleChange('hasManagingDirector', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              {fields.hasManagingDirector === 'yes' && (
                <Field label="Managing Director's Name">
                  <input type="text" value={fields.managingDirectorName || ''} onChange={e => handleChange('managingDirectorName', e.target.value)} className={inputCls} placeholder="e.g. MR. RAJENDRA PRASAD AGARWAL" disabled={isReadOnly} />
                </Field>
              )}
              <div className="col-span-1 md:col-span-2 mt-4 p-4 border border-[#e0e0e0] rounded-xl bg-gray-50">
                <p className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wider mb-2">Cover Page Photograph (Max 1)</p>
                {!isReadOnly && !fields.coverPageImage && (
                  <div className="flex items-center gap-3 mb-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? 'Uploading...' : '📷 Add Property Images'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'coverPageImage')} disabled={uploading} />
                    </label>
                  </div>
                )}
                {fields.coverPageImage && (
                  <div className="relative inline-block border-2 border-[#1e3a5f] rounded-lg overflow-hidden">
                    <img src={fields.coverPageImage} alt="Cover Page" className="h-40 w-auto object-contain" />
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleChange('coverPageImage', '')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md">✕</button>
                    )}
                  </div>
                )}
              </div>
              <Field label="Type of Property">
                <select value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Defunct Industrial Unit">Defunct Industrial Unit</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural Land">Agricultural Land</option>
                  <option value="Residential cum Commercial">Residential cum Commercial</option>
                  <option value="Vacant Plot">Vacant Plot</option>
                </select>
              </Field>
              <Field label="Current Usage">
                <select value={fields.currentUsage} onChange={e => handleChange('currentUsage', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Vacant">Vacant</option>
                  <option value="Self Occupied">Self Occupied</option>
                  <option value="Rented">Rented</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Industrial Use">Industrial Use</option>
                  <option value="Agricultural">Agricultural</option>
                </select>
              </Field>
              <Field label="Address Prefix (Cover Page)">
                <div className="flex flex-col gap-2">
                  <select value={fields.addressPrefixType || 'none'} onChange={e => handleChange('addressPrefixType', e.target.value)} className={selectCls} disabled={isReadOnly}>
                    <option value="none">None</option>
                    <option value="multiple_plots">OVER MULTIPLE PLOTS</option>
                    <option value="idco_plot">OVER IDCO PLOT</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                  {fields.addressPrefixType === 'other' && (
                    <input type="text" value={fields.customAddressPrefix || ''} onChange={e => handleChange('customAddressPrefix', e.target.value)} className={inputCls} placeholder="Custom prefix..." disabled={isReadOnly} />
                  )}
                </div>
              </Field>
              <Field label="Site Address">
                <textarea value={fields.propertyAddress} onChange={e => handleChange('propertyAddress', e.target.value)} className={inputCls} rows={2} placeholder="Full site address" disabled={isReadOnly} />
              </Field>
              <Field label="Postal Address" span={2}>
                <textarea value={fields.legalAddress} onChange={e => handleChange('legalAddress', e.target.value)} className={inputCls} rows={2} disabled={isReadOnly} />
              </Field>
              <Field label="Revenue Plot No">
                <input type="text" value={fields.revenuePlotNo} onChange={e => handleChange('revenuePlotNo', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Revenue Khata No">
                <input type="text" value={fields.revenueKhataNo} onChange={e => handleChange('revenueKhataNo', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Village (Mouza)">
                <input type="text" value={fields.revenueVillage} onChange={e => handleChange('revenueVillage', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Tahasil">
                <input type="text" value={fields.revenueTahasil} onChange={e => handleChange('revenueTahasil', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Police Station (PS)">
                <input type="text" value={fields.revenuePS} onChange={e => handleChange('revenuePS', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Gram Panchayat (GP)">
                <input type="text" value={fields.revenueGP} onChange={e => handleChange('revenueGP', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="District">
                <input type="text" value={fields.revenueDistrict} onChange={e => handleChange('revenueDistrict', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="State">
                <input type="text" value={fields.revenueState} onChange={e => handleChange('revenueState', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Classification of Area">
                <select value={fields.classificationArea} onChange={e => handleChange('classificationArea', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Rural Area">Rural Area</option>
                  <option value="Semi-Urban">Semi-Urban</option>
                  <option value="Urban">Urban</option>
                  <option value="Industrial Zone">Industrial Zone</option>
                </select>
              </Field>
              <Field label="Conversion Status">
                <select value={fields.conversionStatus || 'Agricultural'} onChange={e => handleChange('conversionStatus', e.target.value)} className={inputCls} disabled={isReadOnly}>
                  <option value="Agricultural">Agricultural</option>
                  <option value="IDCO Industrial Plot">IDCO Industrial Plot</option>
                  <option value="Residential Converted">Residential Converted</option>
                  <option value="Commercial Converted">Commercial Converted</option>
                  <option value="Non-Agricultural">Non-Agricultural</option>
                  <option value="Government Allotted">Government Allotted</option>
                </select>
              </Field>
              <Field label="Extent of Site (Acres/Dec/Sqft)">
                <input type="text" value={fields.extentOfSite} onChange={e => handleChange('extentOfSite', e.target.value)} className={inputCls} placeholder="e.g. 0.45 Acres" disabled={isReadOnly} />
              </Field>
              <Field label="Occupancy Status">
                <select value={fields.occupancyStatus} onChange={e => handleChange('occupancyStatus', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Partially Occupied">Partially Occupied</option>
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">Boundaries</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="North"><input type="text" value={fields.boundNorth} onChange={e => handleChange('boundNorth', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                <Field label="South"><input type="text" value={fields.boundSouth} onChange={e => handleChange('boundSouth', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                <Field label="East"><input type="text" value={fields.boundEast} onChange={e => handleChange('boundEast', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                <Field label="West"><input type="text" value={fields.boundWest} onChange={e => handleChange('boundWest', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              </div>
            </div>
          </Section>

          {/* ── Section 5: Town Planning ── */}
          <Section title="Town Planning Parameters" number={5}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="5.1 Master plan provision, related to property in terms of land use" span={2}><textarea rows={2} value={fields.masterPlanProvision} onChange={e => handleChange('masterPlanProvision', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. WHOLESALE COMMERCIAL ZONE AS PER CDP" disabled={isReadOnly} /></Field>
              <Field label="5.2 Date of issue of approved building plan"><input type="text" value={fields.approvedPlanDate || ''} onChange={e => handleChange('approvedPlanDate', e.target.value)} className={inputCls} placeholder="e.g. NOT PROVIDED" disabled={isReadOnly} /></Field>
              <Field label="5.3 Approved map/plan issuing authority"><input type="text" value={fields.approvedPlanAuthority} onChange={e => handleChange('approvedPlanAuthority', e.target.value)} className={inputCls} placeholder="e.g. NOT PROVIDED" disabled={isReadOnly} /></Field>
              <Field label="5.4 Whether genuineness or authenticity of the approved map/plan"><input type="text" value={fields.planGenuineness || ''} onChange={e => handleChange('planGenuineness', e.target.value)} className={inputCls} placeholder="e.g. APPROVED PLAN NOT PRODUCED" disabled={isReadOnly} /></Field>
              <Field label="5.5 Any comments over the authenticity of the building plan approval"><input type="text" value={fields.planAuthenticityComments || ''} onChange={e => handleChange('planAuthenticityComments', e.target.value)} className={inputCls} placeholder="e.g. APPROVED PLAN NOT PRODUCED" disabled={isReadOnly} /></Field>
              <Field label="5.6 Development controls" span={2}><textarea rows={2} value={fields.developmentControls} onChange={e => handleChange('developmentControls', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. TANGI CHOUDWAR (NAC) & SARPANCH OF NAPANGA G.P" disabled={isReadOnly} /></Field>
              <Field label="5.7 Ground coverage"><input type="text" value={fields.groundCoverage} onChange={e => handleChange('groundCoverage', e.target.value)} className={inputCls} placeholder="e.g. 5.65 %" disabled={isReadOnly} /></Field>
              <Field label="5.8 Comment on the surrounding land use, adjoining properties"><textarea rows={2} value={fields.surroundingLandUse} onChange={e => handleChange('surroundingLandUse', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. SIMILAR INDUSTRIAL PROPERTIES" disabled={isReadOnly} /></Field>
              <Field label="5.9 Any other aspect" span={2}><textarea rows={2} value={fields.otherAspect5 || ''} onChange={e => handleChange('otherAspect5', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. SHAPE OF THE PROPERTY IS IRREGULAR WITH MULTIPLE ENCUMBRANCES..." disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 6: Document Details & Legal Aspects ── */}
          <Section title="Document Details & Legal Aspects of the Property" number={6}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="6.1 Ownership documents"><input type="text" value={fields.ownershipDocuments} onChange={e => handleChange('ownershipDocuments', e.target.value)} className={inputCls} placeholder="e.g. AREA MAP, ROR" disabled={isReadOnly} /></Field>
              <Field label="6.2 Owner of the property as per ROR" span={2}><textarea rows={3} value={fields.ownerAsPerROR} onChange={e => handleChange('ownerAsPerROR', e.target.value)} className={inputCls + ' resize-none'} placeholder={"e.g. JOINT OWNERS OF THE PROPERTY AS PER ROR FROM GOVT REVENUE DEPT. WEBSITE\n1. NAME ONE\n2. NAME TWO"} disabled={isReadOnly} /></Field>
              <Field label="6.3 Agreement of easement if any" span={2}><textarea rows={2} value={fields.easementAgreement} onChange={e => handleChange('easementAgreement', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. NO SUCH AGREEMENTS AS REPORTED BUT OBSERVED AT SITE AND CONFIRMED THROUGH LOCAL ENQUIRY" disabled={isReadOnly} /></Field>
              <Field label="6.4 Notification of acquisition if any"><input type="text" value={fields.acquisitionNotification} onChange={e => handleChange('acquisitionNotification', e.target.value)} className={inputCls} placeholder="e.g. LIQUIDATORS NOTIFICATION SEEN AT SITE." disabled={isReadOnly} /></Field>
              <Field label="6.5 Notification of road widening if any"><input type="text" value={fields.roadWideningNotification || ''} onChange={e => handleChange('roadWideningNotification', e.target.value)} className={inputCls} placeholder="e.g. NO NOTIFICATION ARE THERE AS REPORTED." disabled={isReadOnly} /></Field>
              <Field label="6.6 Heritage restriction, if any"><input type="text" value={fields.heritageRestriction || ''} onChange={e => handleChange('heritageRestriction', e.target.value)} className={inputCls} placeholder="e.g. NOTHING OBSERVED." disabled={isReadOnly} /></Field>
              <Field label="6.7 Comment on transferability of ownership"><input type="text" value={fields.transferability} onChange={e => handleChange('transferability', e.target.value)} className={inputCls} placeholder="e.g. THERE IS NO RESTRICTION AS OBSERVED." disabled={isReadOnly} /></Field>
              <Field label="6.8 Comment on existing mortgages/charge/encumbrances on the property, if any" span={2}><textarea rows={2} value={fields.existingMortgages} onChange={e => handleChange('existingMortgages', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. NO SUCH DOCUMENTS OR INFORMATION RECEIVED." disabled={isReadOnly} /></Field>
              <Field label="6.9 Comment on, whether owner of property have issued any guarantee (personal/corporate)" span={2}><textarea rows={2} value={fields.guaranteeIssued || ''} onChange={e => handleChange('guaranteeIssued', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. NO INFORMATION" disabled={isReadOnly} /></Field>
              <Field label="6.10 Whether property is SARFAESI compliant" span={2}><textarea rows={3} value={fields.sarfaesiCompliant} onChange={e => handleChange('sarfaesiCompliant', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. YES AS PLOT HAVE STATUS AS HOMESTEAD EXCEPT PLOT NO 976..." disabled={isReadOnly} /></Field>
              <Field label="6.11 Observation on dispute or dues if any, in payment of bills/taxes to be reported" span={2}><textarea rows={3} value={fields.disputesDues} onChange={e => handleChange('disputesDues', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. NO INFORMATION PROVIDED THOUGH LOCAL ENQUIRY SUGGESTED LEGAL LITIGATIONS AND ENCUMBRANCES..." disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 7: Functional and Infrastructure Aspects ── */}
          <Section title="Functional and Infrastructure Aspects of the Property" number={7}>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Description of aqua infrastructure availability in terms of</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="7.1 Water supply"><input type="text" value={fields.waterSupply} onChange={e => handleChange('waterSupply', e.target.value)} className={inputCls} placeholder="e.g. NOT AVAILABLE" disabled={isReadOnly} /></Field>
              <Field label="7.2 Sewerage/sanitation system, u/g or open."><input type="text" value={fields.sewerage} onChange={e => handleChange('sewerage', e.target.value)} className={inputCls} placeholder="e.g. NOT AVAILABLE" disabled={isReadOnly} /></Field>
              <Field label="7.3 Storm water drainage"><input type="text" value={fields.stormWater || ''} onChange={e => handleChange('stormWater', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-4 mb-2">Description of the other physical infrastructure facilities viz</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="7.4 Solid waste management"><input type="text" value={fields.solidWaste || ''} onChange={e => handleChange('solidWaste', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="7.5 Electricity"><input type="text" value={fields.electricity} onChange={e => handleChange('electricity', e.target.value)} className={inputCls} placeholder="e.g. YES" disabled={isReadOnly} /></Field>
              <Field label="7.6 Road and public transport connectivity" span={2}><textarea rows={2} value={fields.roadConnectivity} onChange={e => handleChange('roadConnectivity', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. EXISTING 3 MTS WIDE MURROM ROAD OF LENGTH APPROX 50 MTS CONNECTING TO NH 16" disabled={isReadOnly} /></Field>
              <Field label="7.7 Availability of other public utilities nearby — Police Station"><input type="text" value={fields.policeStationDist} onChange={e => handleChange('policeStationDist', e.target.value)} className={inputCls} placeholder="e.g. TANGI POLICE STATION - 8.00 KMS" disabled={isReadOnly} /></Field>
              <Field label="7.7 Bus Stop"><input type="text" value={fields.busStopDist} onChange={e => handleChange('busStopDist', e.target.value)} className={inputCls} placeholder="e.g. MANGULI NH 16 BUS STOP - 500 MTRS" disabled={isReadOnly} /></Field>
              <Field label="7.7 School"><input type="text" value={fields.schoolDist || ''} onChange={e => handleChange('schoolDist', e.target.value)} className={inputCls} placeholder="e.g. CHOUDWAR HIGH SCHOOL - 2.50 KMS" disabled={isReadOnly} /></Field>
              <Field label="7.7 College"><input type="text" value={fields.collegeDist || ''} onChange={e => handleChange('collegeDist', e.target.value)} className={inputCls} placeholder="e.g. CHOUDWAR COLLEGE - 4.00 KMS" disabled={isReadOnly} /></Field>
            </div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-4 mb-2">Description of the functionality and utility of the property in terms of</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="7.8 Space allocation"><input type="text" value={fields.spaceAllocation || ''} onChange={e => handleChange('spaceAllocation', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="7.9 Storage spaces"><input type="text" value={fields.storageSpaces || ''} onChange={e => handleChange('storageSpaces', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="7.10 Utility spaces provided within the unit"><input type="text" value={fields.utilitySpaces || ''} onChange={e => handleChange('utilitySpaces', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="7.11 Car parking facility"><input type="text" value={fields.carParking || ''} onChange={e => handleChange('carParking', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="7.12 Balconies etc."><input type="text" value={fields.balconies || ''} onChange={e => handleChange('balconies', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 8: Socio-Cultural Aspects ── */}
          <Section title="Socio-Cultural Aspects of the Property" number={8}>
            <div className="grid grid-cols-1 gap-4">
              <Field label="8.1 Descriptive account of location of property, in terms of social structure of area, population, social satisfaction, regional origin, economic level, location of slum, squatter settlements nearby, etc." span={2}><textarea rows={4} value={fields.socialStructure} onChange={e => handleChange('socialStructure', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. AQUA GOLD FIN TOWER PRIVATE LIMITED HAS VACANT PLOTS SITUATED AT BARALA VILLAGE.&#10;&#10;SOCIAL AND ECONOMICAL STATUS OF THE AREA MAY BE TREATED AS LOWER RURAL CLASS & PEOPLE OF ALL AGE GROUP ARE PUTTING UP IN THE AREA. SOCIAL RATING IS CONSIDERED AS AVERAGE." disabled={isReadOnly} /></Field>
              <Field label="8.2 Whether property belongs to social infrastructure like hospital, school, old age home"><input type="text" value={fields.socialInfrastructure} onChange={e => handleChange('socialInfrastructure', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 9: Environmental Factors ── */}
          <Section title="Environmental Factors Affecting the Property" number={9}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="9.1 Use of environmental friendly building material green building techniques if any"><input type="text" value={fields.ecoMaterials} onChange={e => handleChange('ecoMaterials', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="9.2 Provision of rain water harvesting"><input type="text" value={fields.rainWaterHarvesting} onChange={e => handleChange('rainWaterHarvesting', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="9.3 Use of solar heating, lightening system, etc"><input type="text" value={fields.solarSystem} onChange={e => handleChange('solarSystem', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="9.4 Presence of environmental pollution in vicinity in terms of industry, heavy traffic."><input type="text" value={fields.environmentalPollution} onChange={e => handleChange('environmentalPollution', e.target.value)} className={inputCls} placeholder="e.g. NOTHING COULD BE VISUALIZED RELATING TO THE ENVIRONMENTAL POLLUTION HOWEVER THERE ARE MULTIPLE FACTORIES & PLANTS IN THE VICINITY..." disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 10: Marketability ── */}
          <Section title="Marketability of the Property" number={10}>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Marketability of the property in terms of</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="10.1 Locational attributes"><input type="text" value={fields.locationalAttributes} onChange={e => handleChange('locationalAttributes', e.target.value)} className={inputCls} placeholder="e.g. AVERAGE" disabled={isReadOnly} /></Field>
              <Field label="10.2 Scarcity"><input type="text" value={fields.scarcity} onChange={e => handleChange('scarcity', e.target.value)} className={inputCls} placeholder="e.g. NO" disabled={isReadOnly} /></Field>
              <Field label="10.3 Demand & supply of the subject property."><input type="text" value={fields.demandSupply} onChange={e => handleChange('demandSupply', e.target.value)} className={inputCls} placeholder="e.g. RESTRICTED" disabled={isReadOnly} /></Field>
              <Field label="10.4 Comparable sale prices in the locality"><input type="text" value={fields.comparableSalePrices || ''} onChange={e => handleChange('comparableSalePrices', e.target.value)} className={inputCls} placeholder="e.g. DISCUSSED IN RESPECTIVE CHAPTER" disabled={isReadOnly} /></Field>
              <Field label="10.5 Any other aspect which has relevance on the value or marketability of the property" span={2}><textarea rows={2} value={fields.otherMarketability || ''} onChange={e => handleChange('otherMarketability', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. SUITABLE FOR INDUSTRIAL UNIT. THE MARKETABILITY IS LIMITED..." disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 11: Architectural Aspects ── */}
          <Section title="Architectural Aspects of the Property" number={11}>
            <div className="grid grid-cols-1 gap-4">
              <Field label="11.1 Descriptive account on whether, building is modern, old fashioned, plain looking or decorative, heritage, landscape element, etc" span={2}><textarea rows={6} value={fields.architecturalAspects} onChange={e => handleChange('architecturalAspects', e.target.value)} className={inputCls + ' resize-none'} placeholder={"e.g. DEFUNCT WATER BOTTLING UNIT SINCE 2018 USED ON LEASE SEASHORE TOURISM AND DEVELOPMENT COMPANY.\n\nDILAPIDATED BUILDING OBSERVED AT SITE WITH ZERO MAINTAINANCE\n\nINTERNAL ROADS AND PASSAGES ARE COVERED WITH VEGETATION AND NON OF THE BASIC CIVIC AMENITIES LIKE ELECTRICITY, WATER, SEWERAGE AND EQUIPMENTS ARE IN FUNCTIONAL STATE"} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 12: Engineering ── */}
          <Section title="Engineering Aspects of the Property" number={12}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="01 Type of construction"><input type="text" value={fields.constructionType} onChange={e => handleChange('constructionType', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="02 Material and technology used"><input type="text" value={fields.materialsUsed} onChange={e => handleChange('materialsUsed', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE.." disabled={isReadOnly} /></Field>
              <Field label="03 Specifications"><input type="text" value={fields.specifications} onChange={e => handleChange('specifications', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="04 Maintenance issues"><input type="text" value={fields.maintenanceIssues} onChange={e => handleChange('maintenanceIssues', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="05 Age of the building/sheds"><input type="number" value={fields.ageOfBuilding} onChange={e => handleChange('ageOfBuilding', e.target.value)} className={inputCls} placeholder="e.g. 0 YEARS" disabled={isReadOnly} /></Field>
              <Field label="06 Residual life of the building"><input type="number" value={fields.residualLife} onChange={e => handleChange('residualLife', e.target.value)} className={inputCls} placeholder="e.g. 0 YEARS" disabled={isReadOnly} /></Field>
              <Field label="07 Total life of the building (if applicable)"><input type="text" value={fields.totalLife || ''} onChange={e => handleChange('totalLife', e.target.value)} className={inputCls} placeholder="e.g. 60 YEARS" disabled={isReadOnly} /></Field>
              <Field label="08 Extent of deterioration"><input type="text" value={fields.extentDeterioration} onChange={e => handleChange('extentDeterioration', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="09 Structural safety"><input type="text" value={fields.structuralSafety} onChange={e => handleChange('structuralSafety', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="10 Protection against natural disaster/earthquake"><input type="text" value={fields.naturalDisasterProtection} onChange={e => handleChange('naturalDisasterProtection', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="11 Visible damage in the building"><input type="text" value={fields.visibleDamage} onChange={e => handleChange('visibleDamage', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="12 System of air-conditioning"><input type="text" value={fields.airConditioning || ''} onChange={e => handleChange('airConditioning', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="13 Provision of fire-fighting"><input type="text" value={fields.fireFighting || ''} onChange={e => handleChange('fireFighting', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="14 Year of construction"><input type="text" value={fields.yearOfConstruction || ''} onChange={e => handleChange('yearOfConstruction', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="15 Type of foundation"><input type="text" value={fields.foundationType || ''} onChange={e => handleChange('foundationType', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="16 Superstructure"><input type="text" value={fields.superstructure || ''} onChange={e => handleChange('superstructure', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="17 Type of building"><input type="text" value={fields.buildingType || ''} onChange={e => handleChange('buildingType', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="18 No.of floors"><input type="text" value={fields.numberOfFloors || ''} onChange={e => handleChange('numberOfFloors', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE." disabled={isReadOnly} /></Field>
              <Field label="19 Type of roof"><input type="text" value={fields.roofType || ''} onChange={e => handleChange('roofType', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="20 Roof height"><input type="text" value={fields.roofHeight || ''} onChange={e => handleChange('roofHeight', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="21 Type of flooring"><input type="text" value={fields.flooringType || ''} onChange={e => handleChange('flooringType', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="22 Type of joineries (Door/Windows)"><input type="text" value={fields.joineriesType || ''} onChange={e => handleChange('joineriesType', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="23 Amenities/extra fitting"><input type="text" value={fields.amenitiesFitting || ''} onChange={e => handleChange('amenitiesFitting', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="24 Condition of the building"><input type="text" value={fields.buildingCondition || ''} onChange={e => handleChange('buildingCondition', e.target.value)} className={inputCls} placeholder="e.g. NONE AT SITE" disabled={isReadOnly} /></Field>
              <Field label="25 Quality of construction"><input type="text" value={fields.constructionQuality || ''} onChange={e => handleChange('constructionQuality', e.target.value)} className={inputCls} placeholder="e.g. NOT APPLICABLE" disabled={isReadOnly} /></Field>
              <Field label="26 Assumed salvage value of the building"><input type="text" value={fields.assumedSalvageValue || ''} onChange={e => handleChange('assumedSalvageValue', e.target.value)} className={inputCls} placeholder="e.g. NOT APPLICABLE" disabled={isReadOnly} /></Field>
                            <div className="col-span-1 md:col-span-2 border rounded-md p-4 bg-gray-50">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mb-4">
                  <Field label="27 Plinth area">
                    <select value={fields.plinthAreaOption || 'NOT APPLICABLE'} onChange={e => handleChange('plinthAreaOption', e.target.value)} className={inputCls} disabled={isReadOnly}>
                      <option value="PLEASE REFER BUILDING VALUATION">PLEASE REFER BUILDING VALUATION</option>
                      <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                      <option value="AS BELOW">AS BELOW</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                  {fields.plinthAreaOption === 'Other' && (
                    <Field label="Custom Plinth Area Text">
                      <input type="text" value={fields.plinthAreaCustom || ''} onChange={e => handleChange('plinthAreaCustom', e.target.value)} className={inputCls} placeholder="Type custom text..." disabled={isReadOnly} />
                    </Field>
                  )}
                </div>
                {fields.plinthAreaOption === 'AS BELOW' && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">Floor Details (if applicable)</h4>
                    <div className="hidden md:grid grid-cols-[3fr_2fr_2fr_auto] gap-2 mb-1 px-1">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Floor details</span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actual construction area</span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Area considered</span>
                      <span></span>
                    </div>
                    {fields.plinthAreaTable?.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_auto] gap-2 items-center mb-2">
                        <input type="text" value={row.floorDetails} onChange={e => { const newTable = [...(fields.plinthAreaTable || [])]; newTable[idx].floorDetails = e.target.value; handleChange('plinthAreaTable', newTable); }} className={inputCls} placeholder="1. GROUND FLOOR RCC" disabled={isReadOnly} />
                        <input type="text" value={row.actualArea} onChange={e => { const newTable = [...(fields.plinthAreaTable || [])]; newTable[idx].actualArea = e.target.value; handleChange('plinthAreaTable', newTable); }} className={inputCls} placeholder="5240 sqft" disabled={isReadOnly} />
                        <input type="text" value={row.consideredArea} onChange={e => { const newTable = [...(fields.plinthAreaTable || [])]; newTable[idx].consideredArea = e.target.value; handleChange('plinthAreaTable', newTable); }} className={inputCls} placeholder="5240 sqft" disabled={isReadOnly} />
                        <button type="button" onClick={() => { const newTable = fields.plinthAreaTable.filter((_, i) => i !== idx); handleChange('plinthAreaTable', newTable); }} className="p-2 text-red-500 hover:bg-red-50 rounded hidden md:block" disabled={isReadOnly}>
                          ✕
                        </button>
                        <button type="button" onClick={() => { const newTable = fields.plinthAreaTable.filter((_, i) => i !== idx); handleChange('plinthAreaTable', newTable); }} className="p-2 text-red-500 text-xs text-left hover:bg-red-50 rounded md:hidden" disabled={isReadOnly}>
                          Remove Row
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => handleChange('plinthAreaTable', [...(fields.plinthAreaTable || []), { floorDetails: '', actualArea: '', consideredArea: '' }])} className="text-xs font-semibold text-blue-600 hover:underline mt-2 inline-block" disabled={isReadOnly}>
                      + Add Row
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* ── Section 13: Valuation ── */}
          <Section title="Valuation Approaches & Methodology" number={13}>
            {/* Sub-section text overrides (kept) */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Sub-section Text Overrides <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold ml-1">OPTIONAL</span></p>
              <p className="text-xs text-gray-500 mb-3">Leave blank to use standard IBBI-IVS default text. Fill to override with your own custom text.</p>
              <div className="grid grid-cols-1 gap-4">
                <Field label="13.1 Methodology (custom text)" span={2}><textarea rows={3} value={fields.methodology13_1 || ''} onChange={e => handleChange('methodology13_1', e.target.value)} className={inputCls + ' resize-none'} placeholder="Leave blank for default: 'Sale Comparison Method coupled with Replacement Cost Approach has been adopted...'" disabled={isReadOnly} /></Field>
                <Field label="13.3 Valuation Considerations (custom text)" span={2}><textarea rows={3} value={fields.considerations13_3 || ''} onChange={e => handleChange('considerations13_3', e.target.value)} className={inputCls + ' resize-none'} placeholder="Leave blank for default: 'In arriving at the valuation, the following factors have been considered...'" disabled={isReadOnly} /></Field>
                <Field label="13.4 Valuation Assumptions (custom text)" span={2}><textarea rows={3} value={fields.assumptions13_4 || ''} onChange={e => handleChange('assumptions13_4', e.target.value)} className={inputCls + ' resize-none'} placeholder="Leave blank for default: 'The valuation assumes that the property has a clear and marketable title...'" disabled={isReadOnly} /></Field>
                <Field label="13.5 Valuation Analysis (custom text)" span={2}><textarea rows={3} value={fields.analysis13_5 || ''} onChange={e => handleChange('analysis13_5', e.target.value)} className={inputCls + ' resize-none'} placeholder="Leave blank for default: 'Based on the market survey conducted in the area...'" disabled={isReadOnly} /></Field>
              </div>
            </div>

            {/* ── 13.6 DETAILS OF VALUATION ── */}
            <div className="mt-6">
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">13.6 Details of Valuation</p>
              <p className="text-xs text-gray-500 mb-4">The detailed workings are shown in the following tables:</p>

              {/* Variant Selector */}
              <div className="mb-6">
                <Field label="Valuation Table Format">
                  <select value={fields.valuationVariant || 'standard'} onChange={e => handleChange('valuationVariant', e.target.value)} className={inputCls} disabled={isReadOnly}>
                    <option value="standard">Standard (Bajrangbali / Angul / Satyabadi)</option>
                    <option value="cuttack">Cuttack</option>
                  </select>
                </Field>
              </div>

              {/* ══════════════════════════════════════════ */}
              {/* VARIANT A: STANDARD                       */}
              {/* ══════════════════════════════════════════ */}
              {fields.valuationVariant !== 'cuttack' && (
                <div className="space-y-8">

                  {/* ─── BOOK VALUE (GUIDELINE VALUE) ─── */}
                  <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30">
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-3">Book Value (Guideline Value)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-amber-100/50 border-b border-amber-200 text-amber-900 text-[10px] uppercase font-semibold">
                          <tr>
                            <th className="px-2 py-2">Mouza</th><th className="px-2 py-2">Nature</th><th className="px-2 py-2">Owner</th>
                            <th className="px-2 py-2">Plot no</th><th className="px-2 py-2">Khata no</th><th className="px-2 py-2">Area</th>
                            <th className="px-2 py-2">Rate per dec</th><th className="px-2 py-2">Amount</th>
                            {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {fields.guidelinePlotRows.length === 0 && (
                            <tr><td colSpan={9} className="px-4 py-4 text-center text-slate-400 italic text-xs">No rows added yet.</td></tr>
                          )}
                          {fields.guidelinePlotRows.map((row: GuidelinePlotRow, idx: number) => (
                            <tr key={row.id} className="hover:bg-amber-50">
                              {(['mouza','nature','owner','plotNo','khataNo','area','ratePerDec','amount'] as const).map(field => (
                                <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                  let val = e.target.value;
                                  if (field === 'amount') val = val.replace(/[^\d.,]/g, '');
                                  const r = [...fields.guidelinePlotRows];
                                  r[idx] = {...r[idx], [field]: val};
                                  handleChange('guidelinePlotRows', r);
                                } } className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-guidelinePlotRows" disabled={isReadOnly} /></td>
                              ))}
                              {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('guidelinePlotRows', fields.guidelinePlotRows.filter((_: GuidelinePlotRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleChange('guidelinePlotRows', [...fields.guidelinePlotRows, { id: String(Date.now()), mouza: '', nature: '', owner: '', plotNo: '', khataNo: '', area: '', ratePerDec: '', amount: '' }])} className="text-xs font-bold text-amber-700 hover:underline mt-2">+ Add Row</button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Field label="Total Guideline Plot Value"><input type="text" value={fields.guidelinePlotTotal} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                      <Field label="Discount %"><input type="text" value={fields.guidelineDiscountPercent} onChange={e => handleChange('guidelineDiscountPercent', e.target.value)} className={inputCls} placeholder="e.g. 40" disabled={isReadOnly} /></Field>
                      <Field label={`Total Accessed Value Post Discounted reduction of ${String(fields.guidelineDiscountPercent || 0).replace(/%/g, '')}% on Total Guideline Value`} span={2}><input type="text" value={fields.guidelineDiscountedTotal} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                    </div>
                  </div>

                  {/* ─── PRESENT MARKET VALUE ─── */}
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Present Market Value (Post Discounting on Fair Market Value)</h4>
                    <Field label="Description Text" span={2}><textarea rows={3} value={fields.presentMarketDescription || ''} onChange={e => handleChange('presentMarketDescription', e.target.value)} className={inputCls + ' resize-none'} disabled={isReadOnly} /></Field>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-blue-100/50 border-b border-blue-200 text-blue-900 text-[10px] uppercase font-semibold">
                          <tr>
                            <th className="px-2 py-2">Mouza</th><th className="px-2 py-2">Nature</th><th className="px-2 py-2">Owner</th>
                            <th className="px-2 py-2">Plot no</th><th className="px-2 py-2">Khata no</th><th className="px-2 py-2">Area</th>
                            <th className="px-2 py-2">Rate per dec</th><th className="px-2 py-2">Amount</th>
                            {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100">
                          {fields.presentPlotRows.length === 0 && (
                            <tr><td colSpan={9} className="px-4 py-4 text-center text-slate-400 italic text-xs">No rows added yet.</td></tr>
                          )}
                          {fields.presentPlotRows.map((row: PresentPlotRow, idx: number) => (
                            <tr key={row.id} className="hover:bg-blue-50">
                              {(['mouza','nature','owner','plotNo','khataNo','area','ratePerDec','amount'] as const).map(field => (
                                <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                  let val = e.target.value;
                                  if (field === 'amount') val = val.replace(/[^\d.,]/g, '');
                                  const r = [...fields.presentPlotRows];
                                  r[idx] = {...r[idx], [field]: val};
                                  handleChange('presentPlotRows', r);
                                } } className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-presentPlotRows" disabled={isReadOnly} /></td>
                              ))}
                              {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('presentPlotRows', fields.presentPlotRows.filter((_: PresentPlotRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleChange('presentPlotRows', [...fields.presentPlotRows, { id: String(Date.now()), mouza: '', nature: '', owner: '', plotNo: '', khataNo: '', area: '', ratePerDec: '', amount: '' }])} className="text-xs font-bold text-blue-700 hover:underline mt-2">+ Add Row</button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Field label="Total Fair Plot Value"><input type="text" value={fields.presentPlotTotal} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                      <Field label="Discount %"><input type="text" value={fields.presentDiscountPercent} onChange={e => handleChange('presentDiscountPercent', e.target.value)} className={inputCls} placeholder="e.g. 40" disabled={isReadOnly} /></Field>
                      <Field label={`Total Present Plot Value Post Discounted reduction of ${String(fields.presentDiscountPercent || 0).replace(/%/g, '')}% on Total FAIR Value`} span={2}><input type="text" value={fields.presentDiscountedTotal} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                    </div>
                  </div>

                  {/* ─── BUILDING/SHED COST TOGGLE ─── */}
                  <div className="flex items-center gap-3 mb-2">
                    <label className="text-xs font-bold text-[#495057] uppercase tracking-wider">Include Building/Shed Cost Tables?</label>
                    <input type="checkbox" checked={fields.hasBuildingCost} onChange={e => handleChange('hasBuildingCost', e.target.checked)} disabled={isReadOnly} className="w-4 h-4 text-amber-600 rounded" />
                  </div>

                  {fields.hasBuildingCost && (
                    <>
                      {/* ─── BUILDING/SHED COST (FAIR MARKET VALUE) ─── */}
                      <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3">Building/Shed Cost (Fair Market Value)</h4>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">RCC Roof Structure</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-emerald-100/50 border-b border-emerald-200 text-emerald-900 text-[10px] uppercase font-semibold">
                              <tr>
                                <th className="px-2 py-2">Sl</th><th className="px-2 py-2">Area particular</th><th className="px-2 py-2">Plinth area</th>
                                <th className="px-2 py-2">Age</th><th className="px-2 py-2">Rate/sft.</th><th className="px-2 py-2">Replacement cost</th>
                                <th className="px-2 py-2">Depreciation ({String(fields.rccDepreciationPercentFMV || 0).replace(/%/g, '')}%)</th><th className="px-2 py-2">Net value</th>
                                {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100">
                              {fields.rccRowsFMV.map((row: BuildingCostRow, idx: number) => (
                                <tr key={row.id}>
                                  {(['sl','areaParticular','plinthArea','age','rateSft','replacementCost','depreciation','netValue'] as const).map(field => {
                                    if (field === 'depreciation') return <td key={field} className="px-1 py-1"><input type="text" value={row[field]} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></td>;
                                    return (
                                      <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                        let val = e.target.value;
                                        if (field === 'age') {
                                          val = val.replace(/[^\d]/g, '');
                                        } else if (['rateSft', 'replacementCost', 'netValue'].includes(field)) {
                                          val = val.replace(/[^\d.,]/g, '');
                                        }
                                        const r = [...fields.rccRowsFMV];
                                        const newRow = { ...r[idx], [field]: val };
                                        if (field === 'replacementCost') {
                                          const repCost = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
                                          const pct = parseFloat(fields.rccDepreciationPercentFMV) || 0;
                                          const dep = repCost * (pct / 100);
                                          newRow.depreciation = isNaN(dep) || !val ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN');
                                        }
                                        r[idx] = newRow;
                                        handleChange('rccRowsFMV', r);
                                      }} className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-400" disabled={isReadOnly} /></td>
                                    );
                                  })}
                                  {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('rccRowsFMV', fields.rccRowsFMV.filter((_: BuildingCostRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {!isReadOnly && <button type="button" onClick={() => handleChange('rccRowsFMV', [...fields.rccRowsFMV, { id: String(Date.now()), sl: '', areaParticular: '', plinthArea: '', age: '', rateSft: '', replacementCost: '', depreciation: '', netValue: '' }])} className="text-xs font-bold text-emerald-700 hover:underline mt-2">+ Add RCC Row</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <Field label="RCC Depreciation %"><input type="text" value={fields.rccDepreciationPercentFMV} onChange={e => {
                            const val = e.target.value;
                            handleChange('rccDepreciationPercentFMV', val);
                            const pct = parseFloat(val) || 0;
                            const newRows = fields.rccRowsFMV.map(row => {
                              const repCost = parseFloat((row.replacementCost || '').replace(/[^\d.-]/g, '')) || 0;
                              const dep = repCost * (pct / 100);
                              return { ...row, depreciation: isNaN(dep) || !row.replacementCost ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN') };
                            });
                            handleChange('rccRowsFMV', newRows);
                          }} className={inputCls} disabled={isReadOnly} /></Field>
                          <Field label="Total of RCC Roof Structure"><input type="text" value={fields.totalRccFMV} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                        </div>

                        <p className="text-[10px] font-bold text-neutral-400 uppercase mt-4 mb-2">Shed Structure</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-emerald-100/50 border-b border-emerald-200 text-emerald-900 text-[10px] uppercase font-semibold">
                              <tr>
                                <th className="px-2 py-2">Sl</th><th className="px-2 py-2">Area particular</th><th className="px-2 py-2">Plinth area</th>
                                <th className="px-2 py-2">Age</th><th className="px-2 py-2">Rate/sft.</th><th className="px-2 py-2">Replacement cost</th>
                                <th className="px-2 py-2">Depreciation ({String(fields.shedDepreciationPercentFMV || 0).replace(/%/g, '')}%)</th><th className="px-2 py-2">Net value</th>
                                {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100">
                              {fields.shedRowsFMV.map((row: BuildingCostRow, idx: number) => (
                                <tr key={row.id}>
                                  {(['sl','areaParticular','plinthArea','age','rateSft','replacementCost','depreciation','netValue'] as const).map(field => {
                                    if (field === 'depreciation') return <td key={field} className="px-1 py-1"><input type="text" value={row[field]} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></td>;
                                    return (
                                      <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                        let val = e.target.value;
                                        if (field === 'age') {
                                          val = val.replace(/[^\d]/g, '');
                                        } else if (['rateSft', 'replacementCost', 'netValue'].includes(field)) {
                                          val = val.replace(/[^\d.,]/g, '');
                                        }
                                        const r = [...fields.shedRowsFMV];
                                        const newRow = { ...r[idx], [field]: val };
                                        if (field === 'replacementCost') {
                                          const repCost = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
                                          const pct = parseFloat(fields.shedDepreciationPercentFMV) || 0;
                                          const dep = repCost * (pct / 100);
                                          newRow.depreciation = isNaN(dep) || !val ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN');
                                        }
                                        r[idx] = newRow;
                                        handleChange('shedRowsFMV', r);
                                      }} className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-400" disabled={isReadOnly} /></td>
                                    );
                                  })}
                                  {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('shedRowsFMV', fields.shedRowsFMV.filter((_: BuildingCostRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {!isReadOnly && <button type="button" onClick={() => handleChange('shedRowsFMV', [...fields.shedRowsFMV, { id: String(Date.now()), sl: '', areaParticular: '', plinthArea: '', age: '', rateSft: '', replacementCost: '', depreciation: '', netValue: '' }])} className="text-xs font-bold text-emerald-700 hover:underline mt-2">+ Add Shed Row</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <Field label="Shed Depreciation %"><input type="text" value={fields.shedDepreciationPercentFMV} onChange={e => {
                            const val = e.target.value;
                            handleChange('shedDepreciationPercentFMV', val);
                            const pct = parseFloat(val) || 0;
                            const newRows = fields.shedRowsFMV.map(row => {
                              const repCost = parseFloat((row.replacementCost || '').replace(/[^\d.-]/g, '')) || 0;
                              const dep = repCost * (pct / 100);
                              return { ...row, depreciation: isNaN(dep) || !row.replacementCost ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN') };
                            });
                            handleChange('shedRowsFMV', newRows);
                          }} className={inputCls} disabled={isReadOnly} /></Field>
                          <Field label="Total of Shed Structure"><input type="text" value={fields.totalShedFMV} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Total Building Value"><input type="text" value={fields.totalBuildingValueFMV} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Compound Wall Length (rft)"><input type="text" value={fields.compoundWallLengthFMV} onChange={e => handleChange('compoundWallLengthFMV', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 3320" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Rate (per rft)"><input type="text" value={fields.compoundWallRateFMV} onChange={e => handleChange('compoundWallRateFMV', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 600" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Value (Fair Market Value)" span={2}><textarea rows={2} value={fields.compoundWallValueFMV} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Depreciation Description" span={2}><textarea rows={2} value={fields.depreciationDescFMV} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Total Building/Shed Components" span={2}><input type="text" value={fields.totalBuildingShedComponentsFMV} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                        </div>
                      </div>

                      {/* ─── BUILDING/SHED COST (GUIDELINE VALUE) ─── */}
                      <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/30">
                        <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider mb-3">Building/Shed Cost (Guideline Value)</h4>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">RCC Roof Structure</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-purple-100/50 border-b border-purple-200 text-purple-900 text-[10px] uppercase font-semibold">
                              <tr>
                                <th className="px-2 py-2">Sl</th><th className="px-2 py-2">Area particular</th><th className="px-2 py-2">Plinth area</th>
                                <th className="px-2 py-2">Age</th><th className="px-2 py-2">Rate/sft.</th><th className="px-2 py-2">Replacement cost</th>
                                <th className="px-2 py-2">Depreciation ({String(fields.rccDepreciationPercentGuideline || 0).replace(/%/g, '')}%)</th><th className="px-2 py-2">Net value</th>
                                {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100">
                              {fields.rccRowsGuideline.map((row: BuildingCostRow, idx: number) => (
                                <tr key={row.id}>
                                  {(['sl','areaParticular','plinthArea','age','rateSft','replacementCost','depreciation','netValue'] as const).map(field => {
                                    if (field === 'depreciation') return <td key={field} className="px-1 py-1"><input type="text" value={row[field]} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></td>;
                                    return (
                                      <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                        let val = e.target.value;
                                        if (field === 'age') {
                                          val = val.replace(/[^\d]/g, '');
                                        } else if (['rateSft', 'replacementCost', 'netValue'].includes(field)) {
                                          val = val.replace(/[^\d.,]/g, '');
                                        }
                                        const r = [...fields.rccRowsGuideline];
                                        const newRow = { ...r[idx], [field]: val };
                                        if (field === 'replacementCost') {
                                          const repCost = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
                                          const pct = parseFloat(fields.rccDepreciationPercentGuideline) || 0;
                                          const dep = repCost * (pct / 100);
                                          newRow.depreciation = isNaN(dep) || !val ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN');
                                        }
                                        r[idx] = newRow;
                                        handleChange('rccRowsGuideline', r);
                                      }} className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-purple-400" disabled={isReadOnly} /></td>
                                    );
                                  })}
                                  {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('rccRowsGuideline', fields.rccRowsGuideline.filter((_: BuildingCostRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {!isReadOnly && <button type="button" onClick={() => handleChange('rccRowsGuideline', [...fields.rccRowsGuideline, { id: String(Date.now()), sl: '', areaParticular: '', plinthArea: '', age: '', rateSft: '', replacementCost: '', depreciation: '', netValue: '' }])} className="text-xs font-bold text-purple-700 hover:underline mt-2">+ Add RCC Row</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <Field label="RCC Depreciation %"><input type="text" value={fields.rccDepreciationPercentGuideline} onChange={e => {
                            const val = e.target.value;
                            handleChange('rccDepreciationPercentGuideline', val);
                            const pct = parseFloat(val) || 0;
                            const newRows = fields.rccRowsGuideline.map(row => {
                              const repCost = parseFloat((row.replacementCost || '').replace(/[^\d.-]/g, '')) || 0;
                              const dep = repCost * (pct / 100);
                              return { ...row, depreciation: isNaN(dep) || !row.replacementCost ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN') };
                            });
                            handleChange('rccRowsGuideline', newRows);
                          }} className={inputCls} disabled={isReadOnly} /></Field>
                          <Field label="Total of RCC Roof Structure"><input type="text" value={fields.totalRccGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                        </div>

                        <p className="text-[10px] font-bold text-neutral-400 uppercase mt-4 mb-2">Shed Structure</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-purple-100/50 border-b border-purple-200 text-purple-900 text-[10px] uppercase font-semibold">
                              <tr>
                                <th className="px-2 py-2">Sl</th><th className="px-2 py-2">Area particular</th><th className="px-2 py-2">Plinth area</th>
                                <th className="px-2 py-2">Age</th><th className="px-2 py-2">Rate/sft.</th><th className="px-2 py-2">Replacement cost</th>
                                <th className="px-2 py-2">Depreciation ({String(fields.shedDepreciationPercentGuideline || 0).replace(/%/g, '')}%)</th><th className="px-2 py-2">Net value</th>
                                {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-100">
                              {fields.shedRowsGuideline.map((row: BuildingCostRow, idx: number) => (
                                <tr key={row.id}>
                                  {(['sl','areaParticular','plinthArea','age','rateSft','replacementCost','depreciation','netValue'] as const).map(field => {
                                    if (field === 'depreciation') return <td key={field} className="px-1 py-1"><input type="text" value={row[field]} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></td>;
                                    return (
                                      <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                        let val = e.target.value;
                                        if (field === 'age') {
                                          val = val.replace(/[^\d]/g, '');
                                        } else if (['rateSft', 'replacementCost', 'netValue'].includes(field)) {
                                          val = val.replace(/[^\d.,]/g, '');
                                        }
                                        const r = [...fields.shedRowsGuideline];
                                        const newRow = { ...r[idx], [field]: val };
                                        if (field === 'replacementCost') {
                                          const repCost = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
                                          const pct = parseFloat(fields.shedDepreciationPercentGuideline) || 0;
                                          const dep = repCost * (pct / 100);
                                          newRow.depreciation = isNaN(dep) || !val ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN');
                                        }
                                        r[idx] = newRow;
                                        handleChange('shedRowsGuideline', r);
                                      }} className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-purple-400" disabled={isReadOnly} /></td>
                                    );
                                  })}
                                  {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('shedRowsGuideline', fields.shedRowsGuideline.filter((_: BuildingCostRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {!isReadOnly && <button type="button" onClick={() => handleChange('shedRowsGuideline', [...fields.shedRowsGuideline, { id: String(Date.now()), sl: '', areaParticular: '', plinthArea: '', age: '', rateSft: '', replacementCost: '', depreciation: '', netValue: '' }])} className="text-xs font-bold text-purple-700 hover:underline mt-2">+ Add Shed Row</button>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          <Field label="Shed Depreciation %"><input type="text" value={fields.shedDepreciationPercentGuideline} onChange={e => {
                            const val = e.target.value;
                            handleChange('shedDepreciationPercentGuideline', val);
                            const pct = parseFloat(val) || 0;
                            const newRows = fields.shedRowsGuideline.map(row => {
                              const repCost = parseFloat((row.replacementCost || '').replace(/[^\d.-]/g, '')) || 0;
                              const dep = repCost * (pct / 100);
                              return { ...row, depreciation: isNaN(dep) || !row.replacementCost ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN') };
                            });
                            handleChange('shedRowsGuideline', newRows);
                          }} className={inputCls} disabled={isReadOnly} /></Field>
                          <Field label="Total of Shed Structure"><input type="text" value={fields.totalShedGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Total Guideline Building Value"><input type="text" value={fields.totalBuildingValueGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Compound Wall Length (rft)"><input type="text" value={fields.compoundWallLengthGuideline} onChange={e => handleChange('compoundWallLengthGuideline', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 3320" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Rate (per rft)"><input type="text" value={fields.compoundWallRateGuideline} onChange={e => handleChange('compoundWallRateGuideline', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 600" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Value (Guideline Value)" span={2}><textarea rows={2} value={fields.compoundWallValueGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Depreciation Description" span={2}><textarea rows={2} value={fields.depreciationDescGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                          <Field label="Total Guideline Building/Shed Components" span={2}><input type="text" value={fields.totalBuildingShedComponentsGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── ABSTRACT OF VALUATION ─── */}
                  <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/30">
                    <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-3">Abstract of Valuation</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Fair Market Present Value</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Present Value of Plot"><input type="text" value={fields.presentValueOfPlot} onChange={e => handleChange('presentValueOfPlot', e.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Present Value of Buildings and Sheds"><input type="text" value={fields.presentValueOfBuildings} onChange={e => handleChange('presentValueOfBuildings', e.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Total Present Value"><input type="text" value={fields.totalPresentValue || ''} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Or Say"><input type="text" value={fields.totalPresentValueOrSay || ''} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase mt-4 mb-2">Book Value / Guideline Value</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Book Value of Plot"><input type="text" value={fields.bookValueOfPlot} onChange={e => handleChange('bookValueOfPlot', e.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Book Value of Buildings and Sheds"><input type="text" value={fields.bookValueOfBuildings} onChange={e => handleChange('bookValueOfBuildings', e.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Total Book Value"><input type="text" value={fields.totalBookValue || ''} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Or Say"><input type="text" value={fields.totalBookValueOrSay || ''} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                    </div>
                  </div>

                  {/* ─── REALISABLE / LIQUIDATION VALUE ─── */}
                  <div className="border border-red-200 rounded-xl p-4 bg-red-50/30">
                    <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3">Realisable Value / Liquidation Value</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <Field label="Description of Realisable Value / Liquidation Value (Optional)" span={2}>
                        <textarea rows={4} value={fields.realisableValueDesc || ''} onChange={e => handleChange('realisableValueDesc', e.target.value)} className={inputCls + ' resize-none'} placeholder="Leave blank to use the default description..." disabled={isReadOnly} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Realisable/Liquidation Value (Rs)"><input type="text" value={fields.realisableValueAmount} onChange={e => handleChange('realisableValueAmount', e.target.value.replace(/[^\d.,]/g, ''))} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Or Say"><input type="text" value={fields.realisableValueOrSay || ''} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════ */}
              {/* VARIANT B: CUTTACK                        */}
              {/* ══════════════════════════════════════════ */}
              {fields.valuationVariant === 'cuttack' && (
                <div className="space-y-8">

                  {/* ─── GOVERNMENT GUIDELINE VALUE ─── */}
                  <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30">
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-3">Government Guideline Value</h4>
                    <Field label="Land Component Description" span={2}><textarea rows={3} value={fields.cuttackLandComponentDescGuideline || ''} onChange={e => handleChange('cuttackLandComponentDescGuideline', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. Land Component - As per the Benchmark Rates furnished by SRO- Jagatpur, Dist- Cuttack..." disabled={isReadOnly} /></Field>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-amber-100/50 border-b border-amber-200 text-amber-900 text-[10px] uppercase font-semibold">
                          <tr>
                            <th className="px-2 py-2">Mouza</th><th className="px-2 py-2">Nature</th>
                            <th className="px-2 py-2">Plot no</th><th className="px-2 py-2">Khata no</th><th className="px-2 py-2">Area</th>
                            <th className="px-2 py-2">Rate per dec</th><th className="px-2 py-2">Amount</th>
                            {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {fields.guidelinePlotRows.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-4 text-center text-slate-400 italic text-xs">No rows added yet.</td></tr>
                          )}
                          {fields.guidelinePlotRows.map((row: GuidelinePlotRow, idx: number) => (
                            <tr key={row.id} className="hover:bg-amber-50">
                              {(['mouza','nature','plotNo','khataNo','area','ratePerDec','amount'] as const).map(field => (
                                <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                  let val = e.target.value;
                                  if (field === 'amount') val = val.replace(/[^\d.,]/g, '');
                                  const r = [...fields.guidelinePlotRows];
                                  r[idx] = {...r[idx], [field]: val};
                                  handleChange('guidelinePlotRows', r);
                                } } className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-guidelinePlotRows" disabled={isReadOnly} /></td>
                              ))}
                              {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('guidelinePlotRows', fields.guidelinePlotRows.filter((_: GuidelinePlotRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && <button type="button" onClick={() => handleChange('guidelinePlotRows', [...fields.guidelinePlotRows, { id: String(Date.now()), mouza: '', nature: '', owner: '', plotNo: '', khataNo: '', area: '', ratePerDec: '', amount: '' }])} className="text-xs font-bold text-amber-700 hover:underline mt-2">+ Add Row</button>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Field label={`Total Guideline Plot Value FOR AC.${(fields.guidelinePlotRows || []).reduce((s: number, r: any) => { const m = String(r.area || '').match(/(\d+\.?\d*)/); return s + (m ? parseFloat(m[1]) || 0 : 0); }, 0).toFixed(3)} dec`}><input type="text" value={fields.guidelinePlotTotal} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                      <Field label="Compound Wall Length (rft)"><input type="text" value={fields.cuttackCompoundWallLengthGuideline} onChange={e => handleChange('cuttackCompoundWallLengthGuideline', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 3320" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Rate (per rft)"><input type="text" value={fields.cuttackCompoundWallRateGuideline} onChange={e => handleChange('cuttackCompoundWallRateGuideline', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 600" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Value (Guideline Value)" span={2}><textarea rows={2} value={fields.cuttackCompoundWallGuideline} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Sheds/Buildings Depreciation %" ><input type="text" value={fields.cuttackShedsDepPctGuideline} onChange={e => handleChange('cuttackShedsDepPctGuideline', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 50" disabled={isReadOnly} /></Field>
                      <Field label="Sheds/Buildings Depreciation Amount (Rs.)"><input type="text" value={fields.cuttackShedsDepAmtGuideline} onChange={e => handleChange('cuttackShedsDepAmtGuideline', formatIndianCurrency(e.target.value.replace(/[^\d.]/g, '')))} className={inputCls} placeholder="e.g. 16,63,000" disabled={isReadOnly} /></Field>
                      <Field label="Sheds/Buildings Depreciation Text" span={2}><textarea rows={2} value={`Present depreciated market value of the available sheds and buildings, at its present status, assessed @ ${fields.cuttackShedsDepPctGuideline || 0}% of the present value | Rs. ${formatIndianCurrency(String(fields.cuttackShedsDepAmtGuideline || '0').replace(/[^\d.]/g, ''))}`} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Total Guideline Value for Land and Building"><input type="text" value={fields.cuttackTotalGuidelineLandBuilding} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                      <Field label="Or Say"><input type="text" value={fields.cuttackGuidelineOrSay} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                    </div>
                  </div>

                  {/* ─── PRESENT MARKET VALUE ─── */}
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Present Market Value</h4>
                    <Field label="Land Component Description" span={2}><textarea rows={3} value={fields.cuttackLandComponentDescPresent || ''} onChange={e => handleChange('cuttackLandComponentDescPresent', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g. LAND COMPONENT - As per the Benchmark Rates furnished by SRO- Jagatpur, Dist- Cuttack..." disabled={isReadOnly} /></Field>
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-blue-100/50 border-b border-blue-200 text-blue-900 text-[10px] uppercase font-semibold">
                          <tr>
                            <th className="px-2 py-2">Mouza</th><th className="px-2 py-2">Nature</th>
                            <th className="px-2 py-2">Plot no</th><th className="px-2 py-2">Khata no</th><th className="px-2 py-2">Area</th>
                            <th className="px-2 py-2">Rate per dec</th><th className="px-2 py-2">Amount</th>
                            {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100">
                          {fields.presentPlotRows.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-4 text-center text-slate-400 italic text-xs">No rows added yet.</td></tr>
                          )}
                          {fields.presentPlotRows.map((row: PresentPlotRow, idx: number) => (
                            <tr key={row.id} className="hover:bg-blue-50">
                              {(['mouza','nature','plotNo','khataNo','area','ratePerDec','amount'] as const).map(field => (
                                <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                  let val = e.target.value;
                                  if (field === 'amount') val = val.replace(/[^\d.,]/g, '');
                                  const r = [...fields.presentPlotRows];
                                  r[idx] = {...r[idx], [field]: val};
                                  handleChange('presentPlotRows', r);
                                } } className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-presentPlotRows" disabled={isReadOnly} /></td>
                              ))}
                              {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('presentPlotRows', fields.presentPlotRows.filter((_: PresentPlotRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && <button type="button" onClick={() => handleChange('presentPlotRows', [...fields.presentPlotRows, { id: String(Date.now()), mouza: '', nature: '', owner: '', plotNo: '', khataNo: '', area: '', ratePerDec: '', amount: '' }])} className="text-xs font-bold text-blue-700 hover:underline mt-2">+ Add Row</button>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <Field label={`TOTAL PRESENT MARKET VALUE PLOT FOR AC.${(fields.presentPlotRows || []).reduce((s: number, r: any) => { const m = String(r.area || '').match(/(\d+\.?\d*)/); return s + (m ? parseFloat(m[1]) || 0 : 0); }, 0).toFixed(3)} dec`}><input type="text" value={fields.presentPlotTotal} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                      <Field label="Compound Wall Length (rft)"><input type="text" value={fields.cuttackCompoundWallLengthPresent} onChange={e => handleChange('cuttackCompoundWallLengthPresent', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 3320" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Rate (per rft)"><input type="text" value={fields.cuttackCompoundWallRatePresent} onChange={e => handleChange('cuttackCompoundWallRatePresent', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 600" disabled={isReadOnly} /></Field>
                          <Field label="Compound Wall Value (Fair Market Value)" span={2}><textarea rows={2} value={fields.cuttackCompoundWallPresent} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Sheds/Buildings Depreciation %" ><input type="text" value={fields.cuttackShedsDepPctPresent} onChange={e => handleChange('cuttackShedsDepPctPresent', e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} placeholder="e.g. 50" disabled={isReadOnly} /></Field>
                      <Field label="Sheds/Buildings Depreciation Amount (Rs.)"><input type="text" value={fields.cuttackShedsDepAmtPresent} onChange={e => handleChange('cuttackShedsDepAmtPresent', formatIndianCurrency(e.target.value.replace(/[^\d.]/g, '')))} className={inputCls} placeholder="e.g. 16,63,000" disabled={isReadOnly} /></Field>
                      <Field label="Sheds/Buildings Depreciation Text" span={2}><textarea rows={2} value={`Present depreciated market value of the available sheds and buildings, at its present status, assessed @ ${fields.cuttackShedsDepPctPresent || 0}% of the present value | Rs. ${formatIndianCurrency(String(fields.cuttackShedsDepAmtPresent || '0').replace(/[^\d.]/g, ''))}`} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs resize-none cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Total Present Value for Land and Building"><input type="text" value={fields.cuttackTotalPresentLandBuilding} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                      <Field label="Or Say"><input type="text" value={fields.cuttackPresentOrSay} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                    </div>
                  </div>

                  {/* ─── BUILDING/SHED COST ─── */}
                  <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3">Building/Shed Cost</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-emerald-100/50 border-b border-emerald-200 text-emerald-900 text-[10px] uppercase font-semibold">
                          <tr>
                            <th className="px-2 py-2">Sl</th><th className="px-2 py-2">Area particular</th><th className="px-2 py-2">Plinth area</th>
                            <th className="px-2 py-2">Age</th><th className="px-2 py-2">Rate/sft.</th><th className="px-2 py-2">Replacement cost</th>
                            <th className="px-2 py-2">Depreciation ({String(fields.cuttackBuildingDepreciationPercent || 0).replace(/%/g, '')}%)</th><th className="px-2 py-2">Net value</th>
                            {!isReadOnly && <th className="px-2 py-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {fields.cuttackBuildingRows.map((row: BuildingCostRow, idx: number) => (
                            <tr key={row.id}>
                              {(['sl','areaParticular','plinthArea','age','rateSft','replacementCost','depreciation','netValue'] as const).map(field => {
                                if (field === 'depreciation') return <td key={field} className="px-1 py-1"><input type="text" value={row[field]} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></td>;
                                return (
                                  <td key={field} className="px-1 py-1"><input type="text" value={row[field]} onChange={e => {
                                    let val = e.target.value;
                                        if (field === 'age') {
                                          val = val.replace(/[^\d]/g, '');
                                        } else if (['rateSft', 'replacementCost', 'netValue'].includes(field)) {
                                          val = val.replace(/[^\d.,]/g, '');
                                        }
                                        const r = [...fields.cuttackBuildingRows];
                                    const newRow = { ...r[idx], [field]: val };
                                    if (field === 'replacementCost') {
                                      const repCost = parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
                                      const pct = parseFloat(fields.cuttackBuildingDepreciationPercent) || 0;
                                      const dep = repCost * (pct / 100);
                                      newRow.depreciation = isNaN(dep) || !val ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN');
                                    }
                                    r[idx] = newRow;
                                    handleChange('cuttackBuildingRows', r);
                                  }} className="w-full bg-transparent border border-slate-200 rounded p-1 text-xs focus:ring-1 focus:ring-emerald-400" disabled={isReadOnly} /></td>
                                );
                              })}
                              {!isReadOnly && <td className="px-1 py-1 text-center"><button onClick={() => handleChange('cuttackBuildingRows', fields.cuttackBuildingRows.filter((_: BuildingCostRow, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs">&times;</button></td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && <button type="button" onClick={() => handleChange('cuttackBuildingRows', [...fields.cuttackBuildingRows, { id: String(Date.now()), sl: '', areaParticular: '', plinthArea: '', age: '', rateSft: '', replacementCost: '', depreciation: '', netValue: '' }])} className="text-xs font-bold text-emerald-700 hover:underline mt-2">+ Add Row</button>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <Field label="Depreciation %"><input type="text" value={fields.cuttackBuildingDepreciationPercent} onChange={e => {
                            const val = e.target.value;
                            handleChange('cuttackBuildingDepreciationPercent', val);
                            const pct = parseFloat(val) || 0;
                            const newRows = fields.cuttackBuildingRows.map(row => {
                              const repCost = parseFloat((row.replacementCost || '').replace(/[^\d.-]/g, '')) || 0;
                              const dep = repCost * (pct / 100);
                              return { ...row, depreciation: isNaN(dep) || !row.replacementCost ? '' : 'RS. ' + Math.round(dep).toLocaleString('en-IN') };
                            });
                            handleChange('cuttackBuildingRows', newRows);
                          }} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Total"><input type="text" value={fields.cuttackBuildingTotal} className="w-full bg-gray-50 text-gray-500 border border-slate-200 rounded p-1 text-xs cursor-not-allowed" readOnly disabled /></Field>
                      <Field label="Total Land and Building/Shed Components (Rs)"><input type="text" value={fields.cuttackBuildingComponentsTotal} onChange={e => handleChange('cuttackBuildingComponentsTotal', formatIndianCurrency(e.target.value.replace(/[^\d.]/g, '')))} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Or Say"><input type="text" value={fields.cuttackBuildingOrSay} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                    </div>
                  </div>

                  {/* ─── REALISABLE / LIQUIDATION VALUE ─── */}
                  <div className="border border-red-200 rounded-xl p-4 bg-red-50/30">
                    <h4 className="text-xs font-black text-red-800 uppercase tracking-wider mb-3">Realisable Value / Liquidation Value</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <Field label="Description of Realisable Value / Liquidation Value (Optional)" span={2}>
                        <textarea rows={4} value={fields.realisableValueDesc || ''} onChange={e => handleChange('realisableValueDesc', e.target.value)} className={inputCls + ' resize-none'} placeholder="Leave blank to use the default description..." disabled={isReadOnly} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Realisable/Liquidation Value (Rs)"><input type="text" value={fields.realisableValueAmount} onChange={e => handleChange('realisableValueAmount', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                      <Field label="Or Say"><input type="text" value={fields.realisableValueOrSay} className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} placeholder="Auto-calculated" readOnly disabled /></Field>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>
          {/* ── Section 14: Photos & Maps ── */}
          <Section title="Photos & Maps" number={14}>
            {/* Location Map with GPS Co-ordinate */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">Location Map with GPS Co-ordinate</p>
              </div>
              {/* Live Google Maps Embed */}
              {(() => {
                const defaultAddr = getIBBILocationAddress(fields);
                const activeAddr = fields.locationSearchQuery !== undefined && fields.locationSearchQuery !== '' ? fields.locationSearchQuery : defaultAddr;
                const mapQuery = fields.latitude && fields.longitude
                  ? `${fields.latitude.trim()},${fields.longitude.trim()}`
                  : activeAddr;
                const encodedQuery = encodeURIComponent(mapQuery);
                const hasQuery = mapQuery.trim().length > 0;
                const googleMapsUrl = fields.latitude && fields.longitude
                  ? `https://www.google.com/maps?q=${fields.latitude.trim()},${fields.longitude.trim()}&z=15&t=k`
                  : `https://www.google.com/maps/search/${encodedQuery}`;
                return (
                  <div className="space-y-3">
                    <Field label="Google Maps Location Address / Search Query (Auto-derived from Property Address)">
                      <input
                        className={inputCls}
                        value={activeAddr}
                        onChange={e => handleChange('locationSearchQuery', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. BANIKIA, CUTTACK, ODISHA"
                      />
                    </Field>
                    {hasQuery ? (
                      <div className="rounded-xl overflow-hidden border border-[#c8d6e5] shadow-sm">
                        <div className="bg-[#d5e8f5] px-4 py-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider">
                            Live Map Preview (Property Legal Location)
                          </span>
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#b8860b] hover:underline"
                          >
                            Open in Google Maps ↗
                          </a>
                        </div>
                        <iframe
                          src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=16&output=embed`}
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Property Location Map"
                        />
                        {fields.latitude && fields.longitude && (
                          <div className="bg-[#0a1628] text-[#f0c040] px-4 py-2 text-xs font-bold text-center">
                            Latitude: {fields.latitude}, Longitude: {fields.longitude}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-center text-sm text-[#6c757d]">
                        <p className="font-semibold mb-1">No address found.</p>
                        <p>Type the location address above or enter Lat/Long to load the live map.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Screenshot upload for PDF */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider">
                  Screenshot for PDF Report
                </p>
                <p className="text-xs text-[#6c757d]">
                  To include a map in the PDF, open Google Maps via the link above, take a satellite screenshot with the pin visible, and upload it below.
                </p>
                {fields.locationMapImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-lg">
                    <img src={fields.locationMapImage ? encodeURI(fields.locationMapImage) : ''} alt="Location Map Screenshot" className="w-full object-contain" />
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleChange('locationMapImage', '')} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-center text-xs py-1 font-semibold">
                      ✅ Screenshot uploaded — will appear in PDF
                    </div>
                  </div>
                ) : (
                  !isReadOnly && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                        {uploading ? 'Uploading...' : 'Upload Map Screenshot for PDF'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'locationMapImage')} disabled={uploading} />
                      </label>
                    </div>
                  )
                )}
              </div>

              {/* Lat/Long inputs */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input className={inputCls} value={fields.latitude} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 19.976652" />
                </Field>
                <Field label="Longitude">
                  <input className={inputCls} value={fields.longitude} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 86.240795" />
                </Field>
              </div>
            </div>

            {/* ── Map Sub-headings with Editable Titles ── */}
            {([
              { key: 'mouzaMap', imageField: 'mouzaMapImage' as const, titleField: 'mouzaMapTitle' as const, defaultTitle: 'MOUZA MAP SUPERIMPOSED OVER SATELLITE MAP', hint: 'Upload a mouza/cadastral map overlaid on satellite imagery showing plot boundaries, surrounding plots, roads, and landmarks.' },
              { key: 'revenueMap', imageField: 'revenueMapImage' as const, titleField: 'revenueMapTitle' as const, defaultTitle: 'REVENUE MAP', hint: 'Upload the revenue/cadastral map from the tehsil/revenue office showing the plot demarcation.' },
              { key: 'cdpMap', imageField: 'cdpMapImage' as const, titleField: 'cdpMapTitle' as const, defaultTitle: 'CDP MAP', hint: 'Upload the Comprehensive Development Plan (CDP) map showing zoning and land use classification.' },
              { key: 'guidelineValue', imageField: 'guidelineValueImage' as const, titleField: 'guidelineValueTitle' as const, defaultTitle: 'GOVT GUIDELINE VALUE', hint: 'Upload the government guideline/benchmark value document or screenshot from the SRO.' },
              { key: 'rorPatta', imageField: 'rorPattaImage' as const, titleField: 'rorPattaTitle' as const, defaultTitle: 'ROR/PATTA', hint: 'Upload the Record of Rights (ROR) / Patta document image.' },
            ] as const).map(({ key, imageField, titleField, defaultTitle, hint }) => (
              <div key={key} className="mt-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">
                    {(fields as any)[titleField] || defaultTitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`edit-title-${key}`);
                      if (el) el.classList.toggle('hidden');
                    }}
                    className="text-[#b8860b]/60 hover:text-[#b8860b] transition-colors"
                    title="Edit heading"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div id={`edit-title-${key}`} className="hidden mb-2">
                  <input
                    type="text"
                    value={(fields as any)[titleField] || defaultTitle}
                    onChange={e => handleChange(titleField, e.target.value)}
                    className={inputCls + ' text-xs font-bold uppercase'}
                    disabled={isReadOnly}
                  />
                </div>
                <p className="text-xs text-[#6c757d] italic">{hint}</p>
                {(fields as any)[imageField] ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-lg">
                    <img src={encodeURI((fields as any)[imageField])} alt={defaultTitle} className="w-full max-h-48 object-contain bg-[#f8f9fa]" />
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleChange(imageField, '')} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-center text-xs py-1 font-semibold">
                      ✅ Uploaded — will appear in PDF
                    </div>
                  </div>
                ) : (
                  !isReadOnly && (
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? 'Uploading...' : `Upload ${defaultTitle.charAt(0) + defaultTitle.slice(1).toLowerCase()}`}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, imageField)} disabled={uploading} />
                    </label>
                  )
                )}
              </div>
            ))}

            {/* Property Photos */}
            <div>
              <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest mb-2">Property Photographs</p>
              {!isReadOnly && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? 'Uploading...' : 'Add Property Images'}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'propertyImages')} disabled={uploading} />
                    </label>
                    {bucketImages && bucketImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openBucketPicker('propertyImages')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] text-sm font-medium hover:bg-[#1e3a5f]/5 transition-colors"
                      >
                        Pick from Bucket ({bucketImages.length})
                      </button>
                    )}
                    <span className="text-xs text-[#6c757d]">Max size: 5MB per photograph</span>
                  </div>
                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      ⚠️ {uploadError}
                    </div>
                  )}
                </div>
              )}
              {fields.propertyImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {fields.propertyImages.map((url: string, i: number) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt={`Property ${i + 1}`} className="w-full h-24 object-cover" />
                      {!isReadOnly && (
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                      )}
                      <input
                        type="text"
                        placeholder={`Caption for Figure ${i + 1}`}
                        value={fields.propertyImageNames?.[i] || ''}
                        onChange={e => {
                          const names = [...(fields.propertyImageNames || [])];
                          while (names.length <= i) names.push('');
                          names[i] = e.target.value;
                          handleChange('propertyImageNames', names);
                        }}
                        disabled={isReadOnly}
                        className="w-full text-xs px-2 py-1 border-t border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#b8860b]/40"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>


          </Section>

          {/* ── Annexure Section ── */}
          <Section title="Annexures (Excel Uploads)" number={'A'} defaultOpen={fields.annexureEnabled}>
            <div id="section-annexure">
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-bold text-slate-700">Enable Annexures</label>
                <button
                  type="button"
                  onClick={() => handleChange('annexureEnabled', !fields.annexureEnabled)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fields.annexureEnabled ? 'bg-amber-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fields.annexureEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {fields.annexureEnabled && (
                <div className="space-y-4">
                  {fields.annexures.map((ann: AnnexureItem, index: number) => (
                    <div key={ann.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-amber-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">{ann.label}</span>
                        <input
                          type="text"
                          value={ann.title || ''}
                          onChange={e => updateAnnexureTitle(ann.id, e.target.value)}
                          placeholder="Annexure title (optional)"
                          className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm"
                          disabled={isReadOnly}
                        />
                        {!isReadOnly && (
                          <button onClick={() => removeAnnexure(ann.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Remove</button>
                        )}
                      </div>
                      {ann.excelFileUrl ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-emerald-700 font-semibold">📎 {ann.excelFileName}</span>
                          {ann.parsedData && <span className="text-xs text-slate-500">({ann.parsedData.rows.length} rows)</span>}
                          {!isReadOnly && <button onClick={() => removeAnnexureFile(ann.id)} className="text-xs text-red-500 hover:underline ml-2">Remove</button>}
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={e => handleAnnexureUpload(ann.id, e)}
                          className="text-sm"
                          disabled={isReadOnly || uploading}
                        />
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={addAnnexure}
                      className="w-full py-3 border-2 border-dashed border-amber-400 rounded-xl text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
                    >
                      + Add Annexure {String.fromCharCode(65 + fields.annexures.length)}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Section>

      <div className="flex flex-wrap gap-4 pt-4 items-center w-full">
        {status === 'COMPLETED' && (
          <div className="w-full p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 font-bold flex items-center gap-2">
            <span>✅</span> Verified and Completed (Pushed to storage for client download)
          </div>
        )}

        {status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE' && (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold mb-2">
            <span>⏳ Currently Under Manager Review.</span>
            <button
              onClick={handleCancelSubmission}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              ↩️ Cancel Submission (Pull back to Draft)
            </button>
          </div>
        )}

        {!isReadOnly && (
          <>
            {autoSaveStatus === 'saving' && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Auto-saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ✓ Auto-saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                ⚠️ Auto-save failed
              </span>
            )}
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-[#b8860b] text-[#b8860b] font-semibold text-sm hover:bg-[#b8860b]/5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '⏳ Saving...' : '💾 Save Draft'}
            </button>
            {userRole === 'REPORT_EMPLOYEE' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? '⏳ Submitting...' : '📤 Submit to Manager'}
              </button>
            )}
          </>
        )}

        <button
          onClick={handlePreviewPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          👁️ Preview PDF
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          📥 Download PDF
        </button>

        {status === 'MANAGER_REVIEW' && isManagerOrOwner && (
          <>
            <button
              onClick={handleReworkClick}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-red-500 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              ❌ Send for Rework
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              ✅ Finalize & Share to Client
            </button>
          </>
        )}
      </div>

      </div>

      {/* Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e9ecef] bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]">
                Send for Rework
              </h2>
              <p className="text-xs text-[#6c757d] mt-1">Please provide specific feedback for the report agent.</p>
            </div>
            <div className="p-6">
              <textarea
                value={reworkComment}
                onChange={(e) => setReworkComment(e.target.value)}
                placeholder="List the changes required..."
                className="w-full min-h-[150px] p-4 text-sm rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-y"
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-[#e9ecef] bg-[#f8f9fa] flex justify-end gap-3">
              <button
                onClick={() => { setShowReworkModal(false); setReworkComment(''); }}
                className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitRework}
                disabled={loading || !reworkComment.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Confirm Rework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bucket Picker Modal */}
      {bucketPickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
            <div className="p-5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f2038] flex items-center gap-2">
                  📸 Pick from Photo Bucket
                </h2>
                <p className="text-xs text-[#6c757d] mt-1">
                  {bucketPickerMode === 'propertyImages'
                    ? 'Select one or more photos to add to the report'
                    : bucketPickerMode === 'sketchMapImages'
                    ? 'Select one or more photos to use as Sketch Maps'
                    : 'Select a single photo for the map'}
                </p>
              </div>
              <button
                onClick={() => setBucketPickerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {localBucketImages && localBucketImages.length > 0 ? (
                bucketPickerAgent === null ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-[#495057] mb-2">Select a Field Agent to view their uploaded photos:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(new Set(localBucketImages.map(img => img.employee.employeeId))).map(empId => {
                        const agentImages = localBucketImages.filter(img => img.employee.employeeId === empId);
                        const agentName = agentImages[0].employee.name;
                        const selectedCount = agentImages.filter(img => bucketSelected.has(img.id)).length;
                        return (
                          <div
                            key={empId}
                            onClick={() => setBucketPickerAgent(empId)}
                            className="bg-white rounded-xl border border-[#e9ecef] p-4 flex items-center justify-between cursor-pointer hover:border-[#1e3a5f] hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#f8f9fa] flex items-center justify-center text-xl">
                                👤
                              </div>
                              <div>
                                <p className="font-bold text-[#0f2038]">{agentName}</p>
                                <p className="text-xs text-[#6c757d]">{agentImages.length} photos uploaded</p>
                              </div>
                            </div>
                            {selectedCount > 0 && (
                              <span className="bg-[#1e3a5f] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                {selectedCount} selected
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setBucketPickerAgent(null)}
                      className="text-sm font-bold text-[#1e3a5f] hover:underline flex items-center gap-1 mb-2"
                    >
                      ← Back to Agents
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {localBucketImages.filter(img => img.employee.employeeId === bucketPickerAgent).map((img) => {
                        const isSelected = bucketSelected.has(img.id);
                        return (
                          <div
                            key={img.id}
                            data-bucket-card
                            onClick={() => toggleBucketImage(img.id)}
                            className={`relative group bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                              isSelected ? 'border-[#1e3a5f] shadow-md scale-[0.98]' : 'border-transparent shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="aspect-square bg-gray-100">
                              <img
                                src={img.url ? encodeURI(img.url) : ''}
                                alt={img.fileName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const card = (e.target as HTMLImageElement).closest('[data-bucket-card]') as HTMLElement | null;
                                  if (card) card.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="p-2 border-t border-gray-100">
                              <p className="text-[10px] font-bold text-[#0f2038] truncate">{img.employee.name}</p>
                              <p className="text-[9px] text-[#6c757d]">
                                {new Date(img.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center shadow-sm">
                                ✓
                              </div>
                            )}
                            {!isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-black/20 border-2 border-white/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBucketImage(img);
                              }}
                              className="absolute top-2 left-2 w-6 h-6 bg-red-600/90 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                              title="Delete from bucket"
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm font-medium text-[#6c757d]">No photos in the bucket yet.</p>
                  <p className="text-xs text-[#adb5bd] mt-1">Field agents or editors can upload photos to this project bucket.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e9ecef] bg-white flex justify-end gap-3">
              <button
                onClick={() => setBucketPickerOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBucketConfirm}
                disabled={!bucketSelected || bucketSelected.size === 0}
                className="px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-bold hover:bg-[#0f2038] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Add Selected ({bucketSelected ? bucketSelected.size : 0})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Navigator */}
      {!aiAssistEnabled && <FloatingNavigator annexureEnabled={fields.annexureEnabled} />}

      {/* AI Assist Sidebar */}
      {aiAssistEnabled && (
        <>
          <div className="hidden lg:block w-[340px] shrink-0">
            <AiAssistPanel
              fields={fields}
              onAcceptSuggestion={handleAiAcceptSuggestion}
              onAcceptFloorSuggestion={handleAiAcceptFloorSuggestion}
              onAcceptAll={handleAiAcceptAll}
              isReadOnly={isReadOnly}
            />
          </div>
          <div className="lg:hidden">
            <AiAssistPanel
              fields={fields}
              onAcceptSuggestion={handleAiAcceptSuggestion}
              onAcceptFloorSuggestion={handleAiAcceptFloorSuggestion}
              onAcceptAll={handleAiAcceptAll}
              isReadOnly={isReadOnly}
            />
          </div>
        </>
      )}
    </div>
  );
}
