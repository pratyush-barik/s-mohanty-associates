'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  formatReportDate,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';
import {
  PDFAxisAgriRenderer,
  AxisAgriReportFields,
  AxisAgriFloorItem,
} from '@/lib/banks/pdf-axis-agri-renderer';

export const AXIS_AGRI_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'AGRI',
  displayName: 'Axis Bank — AGRI (Non-Agri Format)',
  defaultValues: {
    purpose: 'Valuation of Property for Credit Facilities',
  },
};

export interface AxisAgriProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

const parseNum = (v: any): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

// 8-Box Date Component matching statutory DDMMYYYY layout
function Date8BoxInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const digits = (value || '').replace(/[^0-9]/g, '').slice(0, 8);
  const chars = Array.from({ length: 8 }, (_, i) => digits[i] || '');
  const labels = ['D', 'D', 'M', 'M', 'Y', 'Y', 'Y', 'Y'];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-1 flex-wrap">
        {labels.map((lbl, idx) => (
          <React.Fragment key={idx}>
            {idx === 2 || idx === 4 ? <span className="text-slate-400 font-bold px-0.5">/</span> : null}
            <div className="flex flex-col items-center">
              <input
                type="text"
                maxLength={1}
                disabled={disabled}
                value={chars[idx]}
                onChange={e => {
                  const char = e.target.value.replace(/[^0-9]/g, '');
                  const arr = [...chars];
                  arr[idx] = char;
                  onChange(arr.join(''));
                }}
                className="w-7 h-8 text-center text-sm font-bold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder={lbl}
              />
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">{lbl}</span>
            </div>
          </React.Fragment>
        ))}
        {!disabled && (
          <div className="relative ml-1">
            <input
              type="date"
              className="opacity-0 absolute inset-0 w-8 h-8 cursor-pointer"
              title="Pick Date"
              onChange={e => {
                if (e.target.value) {
                  const [yyyy, mm, dd] = e.target.value.split('-');
                  onChange(`${dd}${mm}${yyyy}`);
                }
              }}
            />
            <button
              type="button"
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300"
            >
              📅
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AxisAGRI({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AxisAgriProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  // ── Auto-derive default REF NO: SMA/MM/YYYY/XX ──
  const defaultRefNo = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    const seq = (projectCode || '01').replace(/[^0-9]/g, '').slice(-2) || '07';
    return `SMA/${mm}/${yyyy}/${seq}`;
  }, [projectCode]);

  // ── Initial State Pre-fill ──
  const initialData: AxisAgriReportFields = useMemo(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : {};
    return {
      // Page 1: Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || raw.dateOfReportSubmission || new Date()),
      reportTitle: raw.reportTitle || 'VALUATION REPORT FORMAT (NON-AGRI)',
      dateOfVisit: formatReportDate(raw.dateOfVisit || raw.dateOfInspection || prefill?.inspectionDate || new Date()),
      reportInitiatedByArea: raw.reportInitiatedByArea || prefill?.serviceRequest?.branch || 'Purusottampur, Ganjam',
      nameOfArea: raw.nameOfArea || prefill?.serviceRequest?.branch || 'Purusottampur, Ganjam',
      ownerNameAndAddress: raw.ownerNameAndAddress || prefill?.contactName || '',
      borrowerNameAndAddress: raw.borrowerNameAndAddress || prefill?.contactName || '',
      proposalNo: raw.proposalNo || 'Not Available',
      representativeNameMobile: raw.representativeNameMobile || 'Local People',

      // Page 1: Details of Property Being Valued
      locationOfProperty: raw.locationOfProperty || 'Rural',
      documentsProvided: raw.documentsProvided || ['Bhu-Naksha', 'ROR'],
      plotKhataDetails: raw.plotKhataDetails || prefill?.propertyAddress || '',
      roadFacilityAtSite: raw.roadFacilityAtSite || '20-ft wide Road',
      colonyNagarSector: raw.colonyNagarSector || '',
      localityLandmark: raw.localityLandmark || '',
      villageTownCityMarket: raw.villageTownCityMarket || 'Village',
      district: raw.district || 'Ganjam',
      state: raw.state || 'Odisha',
      pincode: raw.pincode || '',
      distanceFromAreaOffice: raw.distanceFromAreaOffice || '',
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',
      coordinates: raw.coordinates || '',

      // Page 1 & 2: Classification & Site Topography
      typeOfPropertyPlot: raw.typeOfPropertyPlot || 'Residential',
      levelOfLand: raw.levelOfLand || 'Existing Road Level',
      situatedInMunicipalLimit: raw.situatedInMunicipalLimit || 'No',
      municipalLimitDetails: raw.municipalLimitDetails || '(Within Achhuli Gram Panchayat area limit)',
      constructionObservedOnPlot: raw.constructionObservedOnPlot || 'Yes',
      residentialPropertyType: raw.residentialPropertyType || 'Residential',
      residentialPropertySubtype: raw.residentialPropertySubtype || 'Independent house',
      civicAmenities: raw.civicAmenities || 'Available within the radius of 2-3 Kms',
      commercialPropertyType: raw.commercialPropertyType || 'Commercial',
      commercialPropertySubtype: raw.commercialPropertySubtype || 'Godown',
      availabilityLocalTransport: raw.availabilityLocalTransport || ['Personal Transport'],
      distanceFromRailwayStation: raw.distanceFromRailwayStation || '',
      busStopTaxiStand: raw.busStopTaxiStand || 'Within 2-3 Kms',
      independentApproachRoad: raw.independentApproachRoad || 'Yes',
      accommodateFireExtinguisher: raw.accommodateFireExtinguisher || 'Yes',
      landLockedArea: raw.landLockedArea || 'No',
      corneredOrIntermittent: raw.corneredOrIntermittent || 'Intermittent plot',
      corneredOrIntermittentVal: raw.corneredOrIntermittentVal || 'No',

      // Page 2: Boundaries
      boundaryEastVerification: raw.boundaryEastVerification || 'Road',
      boundaryEastDocument: raw.boundaryEastDocument || 'Road',
      boundaryWestVerification: raw.boundaryWestVerification || "Other's Vacant land",
      boundaryWestDocument: raw.boundaryWestDocument || '',
      boundaryNorthVerification: raw.boundaryNorthVerification || "Other's Vacant land",
      boundaryNorthDocument: raw.boundaryNorthDocument || '',
      boundarySouthVerification: raw.boundarySouthVerification || "Other's Vacant land",
      boundarySouthDocument: raw.boundarySouthDocument || '',

      // Page 2: Locality & Usage
      classOfLocality: raw.classOfLocality || 'Middle class',
      qualityOfInfrastructure: raw.qualityOfInfrastructure || 'Good',
      ownershipStatus: raw.ownershipStatus || 'Free Hold',
      approvedUsage: raw.approvedUsage || ['Commercial', 'Residential'],
      actualUsage: raw.actualUsage || ['Commercial', 'Residential'],
      restrictiveCovenants: raw.restrictiveCovenants || 'Not Applicable',
      typeOfStructure: raw.typeOfStructure || 'Load Bearing/RCC/GCI/Aluform shuttering',
      noOfFloors: raw.noOfFloors || 'G+2 Storied building',
      occupancyDetails: raw.occupancyDetails || 'Self-Occupied',
      tenantName: raw.tenantName || 'NA',
      yearsInTenancy: raw.yearsInTenancy || 'NA',
      resistanceForValuation: raw.resistanceForValuation || 'No',
      resistanceFromOccupants: raw.resistanceFromOccupants || 'No',
      basicAmenities: raw.basicAmenities || ['Electricity', 'Water'],
      developmentSurroundingArea: raw.developmentSurroundingArea || 'Developing',

      // Page 2: Leasehold
      isLeasehold: raw.isLeasehold || 'The Property is Free Hold Land',
      lessorName: raw.lessorName || 'NA',
      natureOfLease: raw.natureOfLease || 'NA',
      totalPeriodOfLease: raw.totalPeriodOfLease || 'NA',
      leaseholdOccupantsResistance: raw.leaseholdOccupantsResistance || 'No',
      leaseholdBasicAmenities: raw.leaseholdBasicAmenities || ['Electricity', 'Water'],
      leaseholdDevelopment: raw.leaseholdDevelopment || 'Developing',

      // Page 2 & 3: Approvals
      reraRegNo: raw.reraRegNo || 'Not Applicable.',
      occupancyCertificate: raw.occupancyCertificate || 'Not Available',
      layoutApprovalNo: raw.layoutApprovalNo || 'Not Mentioned',
      layoutApprovalDate: raw.layoutApprovalDate || '',
      layoutExpiryDate: raw.layoutExpiryDate || '',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || 'Not Available',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate || '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate || '',

      // Page 3: Construction & Floors
      areaOfPlotRor: raw.areaOfPlotRor || '',
      areaOfPlotDoc: raw.areaOfPlotDoc || '',
      approvedBUA: raw.approvedBUA || 'Not Available',
      actualBUA: raw.actualBUA || '',
      demarcationAtSite: raw.demarcationAtSite || 'Yes',
      floors: raw.floors || [
        { floorName: 'Ground Floor', plinthArea: '525.00', usage: 'Residential', roofHeight: "10'-6\"", ageYears: '8Yrs', replacementRate: '1500.00', estimatedCost: '787500.00', depreciationAmount: '63000.00', netValue: '724500.00' },
        { floorName: 'First Floor', plinthArea: '525.00', usage: 'Residential', roofHeight: "10'-6\"", ageYears: '8Yrs', replacementRate: '1300.00', estimatedCost: '682500.00', depreciationAmount: '54600.00', netValue: '627900.00' },
        { floorName: 'Second Floor', plinthArea: '204.00', usage: 'Residential', roofHeight: "10'-6\"", ageYears: '8Yrs', replacementRate: '1300.00', estimatedCost: '265200.00', depreciationAmount: '21216.00', netValue: '243984.00' },
      ],
      totalBUA: raw.totalBUA || '1254.00 Sft',
      totalCarpetArea: raw.totalCarpetArea || '1090.00 Sft (Approx.)',
      totalSaleableArea: raw.totalSaleableArea || '',
      amenitiesDetails: raw.amenitiesDetails || 'Nil',
      farPermissibleUtilized: raw.farPermissibleUtilized || 'FAR:2.21',
      constructionAsPerApprovedPlan: raw.constructionAsPerApprovedPlan || 'Plan is not Available',
      extraConstructionDetails: raw.extraConstructionDetails || 'Not Applicable',
      extraConstructionPercentage: raw.extraConstructionPercentage || 'Not Applicable',
      extraConstructionCompoundable: raw.extraConstructionCompoundable || 'Not Applicable',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      maintenanceOfProperty: raw.maintenanceOfProperty || 'Good',

      // Page 4: Building Condition, Life & Land Rate (Sec 8)
      conditionOfBuilding: raw.conditionOfBuilding || 'Good',
      currentLifeStructure: raw.currentLifeStructure || '8 Years',
      projectedLifeStructure: raw.projectedLifeStructure || '52 Years',
      landRevenueTaxesPaid: raw.landRevenueTaxesPaid || 'Recent rent receipt is not provided',
      municipalTaxesPaid: raw.municipalTaxesPaid || 'Not Applicable',
      govtBenchmarkRateAcre: raw.govtBenchmarkRateAcre || '86,55,000',
      govtBenchmarkRateSft: raw.govtBenchmarkRateSft || '199',
      totalLandAreaDec: raw.totalLandAreaDec || '0.013',
      totalLandAreaSft: raw.totalLandAreaSft || '566.00',
      totalGovtValueLand: raw.totalGovtValueLand || '1,12,634.00',
      prevailingMarketRateMin: raw.prevailingMarketRateMin || '500',
      prevailingMarketRateMax: raw.prevailingMarketRateMax || '600',
      adoptedMarketRateSft: raw.adoptedMarketRateSft || '550',
      totalMarketValueLand: raw.totalMarketValueLand || '5,98,950.00',

      // Page 4: Building Basic Valuation (Sec 9)
      totalBasicValueBuilding: raw.totalBasicValueBuilding || '21,96,285.00',
      totalBasicValueBuildingSay: raw.totalBasicValueBuildingSay || '21,96,000.00',
      totalBasicValueBuildingWords: raw.totalBasicValueBuildingWords || 'RUPEES TWENTY ONE LAKHS NINETY SIX THOUSANDS ONLY',

      // Page 5: Value of Property Summary Table (Sec 10)
      govtGuideLand: raw.govtGuideLand || '1,12,634.00',
      govtGuideBuilding: raw.govtGuideBuilding || '-',
      govtGuideAmenities: raw.govtGuideAmenities || '-',
      govtGuideTotal: raw.govtGuideTotal || '1,12,634.00',
      marketValueLand: raw.marketValueLand || '5,98,950.00',
      marketValueBuilding: raw.marketValueBuilding || '21,96,285.00',
      marketValueAmenities: raw.marketValueAmenities || '-',
      marketValueTotal: raw.marketValueTotal || '27,95,235.00',
      realisableValueLand: raw.realisableValueLand || '5,69,002.50',
      realisableValueBuilding: raw.realisableValueBuilding || '20,86,470.75',
      realisableValueAmenities: raw.realisableValueAmenities || '-',
      realisableValueTotal: raw.realisableValueTotal || '26,55,473.25',
      distressValueLand: raw.distressValueLand || '5,09,107.50',
      distressValueBuilding: raw.distressValueBuilding || '18,66,842.25',
      distressValueAmenities: raw.distressValueAmenities || '-',
      distressValueTotal: raw.distressValueTotal || '23,75,949.75',
      insurableValueLand: raw.insurableValueLand || '-',
      insurableValueBuilding: raw.insurableValueBuilding || '18,66,842.25',
      insurableValueAmenities: raw.insurableValueAmenities || '-',
      insurableValueTotal: raw.insurableValueTotal || '18,66,842.25',

      // Page 5 & 6: Narratives & Remarks (Sec 11)
      realizableEstimationText: raw.realizableEstimationText || 'REALIZABLE ESTIMATION OF THE PROPERTY IN CASE OF DISTRESS SALE, IN CASE, THE BANK WILL SELL THE PROPERTY THROUGH PROCEEDINGS.',
      marketValueSay: raw.marketValueSay || '27,95,000.00',
      marketValueWords: raw.marketValueWords || 'RUPEES TWENTY SEVEN LAKHS NINETY FIVE THOUSANDS ONLY',
      realizableValueSay: raw.realizableValueSay || '26,55,000.00',
      realizableValueWords: raw.realizableValueWords || 'RUPEES TWENTY SIX LAKHS FIFTY THOUSAND ONLY',
      distressValueSay: raw.distressValueSay || '23,76,000.00',
      distressValueWords: raw.distressValueWords || 'RUPEES TWENTY THREE LAKHS SEVENTY FIVE THOUSAND ONLY',
      basisOfValuation: raw.basisOfValuation || 'AS PER MARKET FEEDBACK, FREE HOLD SMALL SIZE RESIDENTIAL LANDS PATCH IN ACHHULI, PURUSOTTAMPUR & GANJAM. APPROACHING 20-FT WIDE ROAD ARE GETTING TRANSACTED IN A RANGE OF RS.500/- TO RS.600/- PER SFT. OUR LAND PATCH APPROACHES 20-FT WIDE ROAD, SHOULD BE GETTING TRANSACTED IN A RATE OF RS.550/- PER SFT INCLUDING ALL LAND DEVELOPMENT CHARGES.',
      opinionOfMarketValue: raw.opinionOfMarketValue || 'AS A RESULT OF MY / OUR APPRAISAL AND ANALYSIS IT IS MY/OUR CONSIDERED OPINION THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IN THE PREVAILING CONDITION WITH AFORESAID SPECIFICATIONS IS SAY : Rs.27,95,000/- (RUPEES TWENTY SEVEN LAKHS NINETY FIVE THOUSANDS ONLY).',
      remarksText: raw.remarksText || 'THE SUBJECT PROPERTY IS AN EXISTING CASE WITH AXIS BANK. SUBJECT PROPERTY IS A G+2 STORIED RESIDENTIAL CUM COMMERCIAL BUILDING, LAND EXTENT OF (AC.0.013 DEC I.E. 566.00 SFT). THE BUILDING IS APPROXIMATELY 8 YEARS OLD AND IS LOCATED IN A DEVELOPED RESIDENTIAL AREA AT ACHHULI, PURUSOTTAMPUR & GANJAM, WITHIN THE JURISDICTION OF ACHHULI GRAM PANCHAYAT AREA LIMIT. THE PROPERTY IS PRESENTLY OWNER-OCCUPIED. BASIC CIVIC AMENITIES SUCH AS SCHOOLS, HOSPITALS, MARKETS, BANKS, AND PUBLIC TRANSPORTATION ARE AVAILABLE WITHIN A RADIUS OF APPROXIMATELY 2–3 KM. VALUATION HAS BEEN DONE FOR LAND & BUA OF THE G+2 STORIED RESIDENTIAL CUM COMMERCIAL BUILDING\nNB: WE HAVE NOT VERIFIED ANY SALE DEED, ROR, SKETCH MAP, AND APPROVAL PLAN. ALL THE DATA LIKE KHATA NO, PLOT NO, PLOT AREA, BUILT UP AREA, BOUNDARIES DETAILS ARE SHARED BY AXIS BANK LIMITED. REPORT IS RELEASED BASING UPON THE DATA SHARED BY AXIS BANK LIMITED.',
      undertakingText: raw.undertakingText || '• I have personally visited the property & identified the same based on the documents provided.\n• I/We have no direct or indirect interest in the property being valued.\n• The information furnished above is true and correct to my/our knowledge.\n• I/ we have not been dismissed or removed from govt. Service or convicted of an offence connected with any proceedings of income tax act, wealth tax act or gift tax act or have been blacklisted by any bank/ financial institution/ govt. Department/ public sector enterprise/ body corporate etc.\n• This valuation is prepared without any prejudice or bias to any person or institution\n• The value of land is taken into account by making due enquires in the locality and ascertaining the sales value of the properties in the locality\n• Any additions/alterations made to the property after the date of valuations shall not fall under the scope of this report',
      annexureARegardingLand: raw.annexureARegardingLand || 'THERE IS A VERY HIGH DIFFERENCE BETWEEN GOVT. VALUE AND MARKET VALUE. GOVT. BENCHMARK VALUE NOT REVISED FOR THAT LOCALITY RECENTLY AND TO AVOID HIGH STAMP DUTY/REGISTRATION CHARGES SALE DEED EXECUTED IN UNDER-VALUED RATE.',
      annexureARegardingBuilding: raw.annexureARegardingBuilding || 'BUILDING VALUE IS ARRIVED BY ANALYSIS OF RATE OF MATERIAL, LABOUR ETC. THIS A RCC ROOFING BUILDING WITH GOOD MAINTENANCE LEVEL & QUALITY OF CONSTRUCTION.',
      annexureABasisLandRate: raw.annexureABasisLandRate || 'AS PER MARKET FEEDBACK, FREE HOLD SMALL SIZE RESIDENTIAL LANDS PATCH IN ACHHULI, PURUSOTTAMPUR & GANJAM. APPROACHING 20-FT WIDE ROAD ARE GETTING TRANSACTED IN A RANGE OF RS.500/- TO RS.600/- PER SFT. OUR LAND PATCH APPROACHES 20-FT WIDE ROAD, SHOULD BE GETTING TRANSACTED IN A RATE OF RS.550/- PER SFT INCLUDING ALL LAND DEVELOPMENT CHARGES.',

      // Page 10: Checklist (Sec 12)
      checklistResponses: raw.checklistResponses || {
        q1: 'YES',
        q2: 'YES',
        q3: 'YES',
        q4: 'YES',
        q5: 'YES',
        q6: 'YES',
        q7: 'NO',
        q8: 'NO',
        q9: 'YES',
        q10: 'YES',
        q11: 'NO',
        q12: 'NO',
      },

      // Photographs & Maps (Sec 13 & 14)
      propertyImages: raw.propertyImages || raw.propertyPhotos || [],
      propertyImageNames: raw.propertyImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      cadastralMapImages: raw.cadastralMapImages || [],
      benchmarkImages: raw.benchmarkImages || [],
      sketchMapImages: raw.sketchMapImages || [],
    };
  }, [initialFields, prefill, defaultRefNo]);

  const [fields, setFields] = useState<AxisAgriReportFields>(() => decodeHtmlEntitiesDeep(initialData));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Field change handler
  const handleChange = useCallback((key: keyof AxisAgriReportFields, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

  // Multi-select toggle handler
  const handleToggleMulti = useCallback((key: keyof AxisAgriReportFields, item: string) => {
    setFields(prev => {
      const current = (prev[key] as string[]) || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, [key]: updated };
    });
  }, []);

  // Floor manipulation
  const handleFloorChange = useCallback((index: number, field: keyof AxisAgriFloorItem, val: string) => {
    setFields(prev => {
      const updated = [...(prev.floors || [])];
      updated[index] = { ...updated[index], [field]: val };

      // Auto-calculate row estimatedCost, depreciation, netValue
      const plinth = parseNum(field === 'plinthArea' ? val : updated[index].plinthArea);
      const rate = parseNum(field === 'replacementRate' ? val : updated[index].replacementRate);
      const age = parseNum(field === 'ageYears' ? val : (updated[index].ageYears || '8'));
      if (plinth > 0 && rate > 0) {
        const estCost = plinth * rate;
        updated[index].estimatedCost = estCost.toFixed(2);
        // Default 1% per annum depreciation
        const depRate = (age * 0.01);
        const depAmt = estCost * depRate;
        updated[index].depreciationAmount = depAmt.toFixed(2);
        updated[index].netValue = (estCost - depAmt).toFixed(2);
      }
      return { ...prev, floors: updated };
    });
  }, []);

  const handleAddFloor = useCallback(() => {
    setFields(prev => ({
      ...prev,
      floors: [
        ...(prev.floors || []),
        { floorName: `Floor ${(prev.floors?.length || 0) + 1}`, plinthArea: '0.00', usage: 'Residential', roofHeight: "10'-6\"", ageYears: '8Yrs', replacementRate: '1300.00', estimatedCost: '0.00', depreciationAmount: '0.00', netValue: '0.00' },
      ],
    }));
  }, []);

  const handleRemoveFloor = useCallback((index: number) => {
    setFields(prev => ({
      ...prev,
      floors: (prev.floors || []).filter((_, i) => i !== index),
    }));
  }, []);

  // Auto-sum Plinth Area into Total BUA & Total Basic Value of Building
  useEffect(() => {
    const sumPlinth = (fields.floors || []).reduce((acc, f) => acc + parseNum(f.plinthArea), 0);
    if (sumPlinth > 0) {
      handleChange('totalBUA', `${sumPlinth.toFixed(2)} Sft`);
    }

    const sumNetValue = (fields.floors || []).reduce((acc, f) => acc + parseNum(f.netValue), 0);
    if (sumNetValue > 0) {
      const formattedSum = sumNetValue.toFixed(2);
      const roundedVal = Math.round(sumNetValue / 1000) * 1000;
      const formattedSay = roundedVal.toFixed(2);
      handleChange('totalBasicValueBuilding', formattedSum);
      handleChange('totalBasicValueBuildingSay', formattedSay);
      handleChange('totalBasicValueBuildingWords', rupeesInWords(roundedVal));

      // Propagate to summary table
      handleChange('marketValueBuilding', formattedSum);
      handleChange('realisableValueBuilding', (sumNetValue * 0.95).toFixed(2));
      handleChange('distressValueBuilding', (sumNetValue * 0.85).toFixed(2));
      handleChange('insurableValueBuilding', (sumNetValue * 0.85).toFixed(2));
    }
  }, [fields.floors, handleChange]);

  // Auto-calculate Land Values when benchmark or market rate changes
  useEffect(() => {
    const areaSft = parseNum(fields.totalLandAreaSft || '566');
    const benchRate = parseNum(fields.govtBenchmarkRateSft || '199');
    const adoptedRate = parseNum(fields.adoptedMarketRateSft || '550');

    if (areaSft > 0 && benchRate > 0) {
      const govtVal = (areaSft * benchRate).toFixed(2);
      handleChange('totalGovtValueLand', govtVal);
      handleChange('govtGuideLand', govtVal);
      handleChange('govtGuideTotal', govtVal);
    }

    if (areaSft > 0 && adoptedRate > 0) {
      const mktVal = (areaSft * adoptedRate).toFixed(2);
      handleChange('totalMarketValueLand', mktVal);
      handleChange('marketValueLand', mktVal);
      handleChange('realisableValueLand', (parseNum(mktVal) * 0.95).toFixed(2));
      handleChange('distressValueLand', (parseNum(mktVal) * 0.85).toFixed(2));
    }
  }, [fields.totalLandAreaSft, fields.govtBenchmarkRateSft, fields.adoptedMarketRateSft, handleChange]);

  // Auto-calculate Total Values across Land + Building
  useEffect(() => {
    const landMkt = parseNum(fields.marketValueLand);
    const bldgMkt = parseNum(fields.marketValueBuilding);
    const totalMkt = landMkt + bldgMkt;

    if (totalMkt > 0) {
      const roundedMkt = Math.round(totalMkt / 1000) * 1000;
      handleChange('marketValueTotal', totalMkt.toFixed(2));
      handleChange('marketValueSay', roundedMkt.toFixed(2));
      handleChange('marketValueWords', rupeesInWords(roundedMkt));

      const totalReal = totalMkt * 0.95;
      const roundedReal = Math.round(totalReal / 1000) * 1000;
      handleChange('realisableValueTotal', totalReal.toFixed(2));
      handleChange('realizableValueSay', roundedReal.toFixed(2));
      handleChange('realizableValueWords', rupeesInWords(roundedReal));

      const totalDist = totalMkt * 0.85;
      const roundedDist = Math.round(totalDist / 1000) * 1000;
      handleChange('distressValueTotal', totalDist.toFixed(2));
      handleChange('distressValueSay', roundedDist.toFixed(2));
      handleChange('distressValueWords', rupeesInWords(roundedDist));

      const bldgInsurable = parseNum(fields.insurableValueBuilding);
      handleChange('insurableValueTotal', bldgInsurable > 0 ? bldgInsurable.toFixed(2) : (bldgMkt * 0.85).toFixed(2));
    }
  }, [fields.marketValueLand, fields.marketValueBuilding, fields.insurableValueBuilding, handleChange]);

  // Photo upload & bucket handlers (Sec 13)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `temp-photos/${projectId}/property-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = fields.propertyImages || [];
      const newImages = [...existing, ...uploadedUrls];
      const existingNames = fields.propertyImageNames || [];
      const newNames = [...existingNames, ...uploadedUrls.map(() => 'Site Picture')];
      handleChange('propertyImages', newImages);
      handleChange('propertyImageNames', newNames);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = (idx: number) => {
    const updated = (fields.propertyImages || []).filter((_, i) => i !== idx);
    const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
    handleChange('propertyImages', updated);
    handleChange('propertyImageNames', updatedNames);
  };

  const handleReorderPhotos = (newImgs: string[], newNames: string[]) => {
    handleChange('propertyImages', newImgs);
    handleChange('propertyImageNames', newNames);
  };

  const handleBucketConfirm = (selectedUrls: string[]) => {
    const existing = fields.propertyImages || [];
    const newImages = [...existing, ...selectedUrls];
    const existingNames = fields.propertyImageNames || [];
    const newNames = [...existingNames, ...selectedUrls.map(() => 'Site Picture')];
    handleChange('propertyImages', newImages);
    handleChange('propertyImageNames', newNames);
    setBucketPickerOpen(false);
  };

  // Local map upload handlers (Sec 14 — device upload only)
  const handleMultiMapUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: 'locationMapImages' | 'cadastralMapImages' | 'sketchMapImages' | 'benchmarkImages') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `temp-photos/${projectId}/${key}-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = fields[key] || [];
      handleChange(key, [...existing, ...uploadedUrls]);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapRemove = (key: 'locationMapImages' | 'cadastralMapImages' | 'sketchMapImages' | 'benchmarkImages', idx?: number) => {
    if (idx === undefined) {
      handleChange(key, []);
      return;
    }
    const updated = (fields[key] || []).filter((_, i) => i !== idx);
    handleChange(key, updated);
  };

  // Auto-save debounced
  useEffect(() => {
    if (isReadOnly) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        await saveReportDraft(projectId, fields);
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('error');
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [fields, projectId, isReadOnly]);

  // Manual save
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const res = await saveReportDraft(projectId, fields);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
        setAutoSaveStatus('error');
      } else {
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
        setAutoSaveStatus('saved');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save draft.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // PDF Generation
  const generatePDFBytes = async (): Promise<Uint8Array> => {
    // Fetch property photos
    const propImages = fields.propertyImages || [];
    const photoBytesList = await Promise.all(propImages.map(fetchBytes));
    const photos = propImages.map((url, idx) => ({
      bytes: photoBytesList[idx] as Uint8Array,
      label: fields.propertyImageNames?.[idx] || `Photograph ${idx + 1}`,
    })).filter(p => p.bytes && p.bytes.length > 0);

    // Fetch location maps
    const locImages = fields.locationMapImages || [];
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // Fetch cadastral maps
    const cadImages = fields.cadastralMapImages || [];
    const cadBytes = (await Promise.all(cadImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // Fetch benchmark screenshots
    const benchImages = fields.benchmarkImages || [];
    const benchBytes = (await Promise.all(benchImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFAxisAgriRenderer();
    await renderer.init();

    return renderer.generateAxisAgriReport(fields, {
      photos,
      locationMaps: locBytes,
      cadastralMaps: cadBytes,
      benchmarkImages: benchBytes,
    });
  };

  const handlePreviewPDF = async () => {
    setLoading(true);
    try {
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (err: any) {
      alert(`PDF Preview Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Axis_Agri_Valuation_${projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF Download Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Date picker helper component
  const DateInput = ({ fieldKey, label }: { fieldKey: keyof AxisAgriReportFields; label: string }) => (
    <Field label={label}>
      <div className="relative flex items-center">
        <input
          type="text"
          className={inputCls}
          value={(fields[fieldKey] as string) || ''}
          onChange={e => handleChange(fieldKey, e.target.value)}
          disabled={isReadOnly}
          placeholder="DD/MM/YYYY"
        />
        {!isReadOnly && (
          <input
            type="date"
            className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer"
            title="Choose Date"
            onChange={e => {
              if (e.target.value) handleChange(fieldKey, formatReportDate(e.target.value));
            }}
          />
        )}
      </div>
    </Field>
  );

  // ── Navigation Sections (All 14 Sections) ──
  const navSections: NavItem[] = [
    { id: 'sec-1', title: '1. Header & Initiation' },
    { id: 'sec-2', title: '2. Property Location' },
    { id: 'sec-3', title: '3. Classification & Site' },
    { id: 'sec-4', title: '4. Boundaries' },
    { id: 'sec-5', title: '5. Locality & Infrastructure' },
    { id: 'sec-6', title: '6. Statutory Approvals' },
    { id: 'sec-7', title: '7. Construction & BUA' },
    { id: 'sec-8', title: '8. Condition, Life & Land Rate' },
    { id: 'sec-9', title: '9. Building Valuation Breakdown' },
    { id: 'sec-10', title: '10. Value of Property Summary' },
    { id: 'sec-11', title: '11. Remarks & Annexure A' },
    { id: 'sec-12', title: '12. Checklist & Undertaking' },
    { id: 'sec-13', title: '13. Property Photographs' },
    { id: 'sec-14', title: '14. Maps & Documents' },
  ];

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Floating Section Navigator */}
      <FloatingNavigator sections={navSections} />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Top Header & Bank Banner */}
        <ActiveConfigBanner
          bankName="AXIS BANK"
          formatName="AGRI (NON-AGRI FORMAT)"
          category="Bank & FIS"
          onResetWizard={onResetWizard}
        />

        {/* Global Action Bar */}
        <ReportActionBar
          loading={loading}
          autoSaveStatus={autoSaveStatus}
          isReadOnly={isReadOnly}
          userRole={userRole}
          message={message}
          onSaveDraft={handleSaveDraft}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />

        {message && (
          <div
            className={`p-4 rounded-lg text-sm font-medium border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: HEADER & TECHNICAL INITIATION
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-1" title="1. Header & Technical Initiation" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="REF NO (SMA/MM/YYYY/XX)">
              <input
                type="text"
                className={inputCls}
                value={fields.refNo || ''}
                onChange={e => handleChange('refNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="SMA/08/2026/07"
              />
            </Field>

            <DateInput fieldKey="reportDate" label="DATE OF REPORT (DD/MM/YYYY)" />
            <DateInput fieldKey="dateOfVisit" label="DATE OF VISIT (DD/MM/YYYY)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="REPORT INITIATED BY AREA">
              <input
                type="text"
                className={inputCls}
                value={fields.reportInitiatedByArea || ''}
                onChange={e => handleChange('reportInitiatedByArea', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Purusottampur, Ganjam"
              />
            </Field>

            <Field label="NAME OF AREA">
              <input
                type="text"
                className={inputCls}
                value={fields.nameOfArea || ''}
                onChange={e => handleChange('nameOfArea', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Purusottampur, Ganjam"
              />
            </Field>

            <Field label="NAME OF OWNER & ADDRESS">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.ownerNameAndAddress || ''}
                onChange={e => handleChange('ownerNameAndAddress', e.target.value)}
                disabled={isReadOnly}
                placeholder="Mr. Babula Behera S/O: Mr. Gopala Behera, At: Achhuli, Ps/Ts: Purusottampur, Dist: Ganjam, Odisha"
              />
            </Field>

            <Field label="NAME OF BORROWER & ADDRESS">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.borrowerNameAndAddress || ''}
                onChange={e => handleChange('borrowerNameAndAddress', e.target.value)}
                disabled={isReadOnly}
                placeholder="M/S. MAA TARINI ENTERPRISERS"
              />
            </Field>

            <Field label="PROPOSAL NO">
              <input
                type="text"
                className={inputCls}
                value={fields.proposalNo || ''}
                onChange={e => handleChange('proposalNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="Not Available"
              />
            </Field>

            <Field label="NAME OF THE REPRESENTATIVE & MOBILE NO.">
              <input
                type="text"
                className={inputCls}
                value={fields.representativeNameMobile || ''}
                onChange={e => handleChange('representativeNameMobile', e.target.value)}
                disabled={isReadOnly}
                placeholder="Local People"
              />
            </Field>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: DETAILS OF PROPERTY BEING VALUED
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-2" title="2. Details of the Property Being Valued" defaultOpen>
          <div className="space-y-4">
            {/* Location Type & Documents Provided */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="LOCATION OF PROPERTY">
                <div className="flex gap-4 items-center pt-2">
                  {['Rural', 'Semi Urban', 'Urban'].map(loc => (
                    <label key={loc} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="radio"
                        name="locationOfProperty"
                        value={loc}
                        checked={fields.locationOfProperty === loc}
                        onChange={e => handleChange('locationOfProperty', e.target.value)}
                        disabled={isReadOnly}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{loc}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="ROAD FACILITY AT THE SITE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.roadFacilityAtSite || ''}
                  onChange={e => handleChange('roadFacilityAtSite', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 20-ft wide Road"
                />
              </Field>
            </div>

            {/* Documents Provided Checkbox Group */}
            <Field label="DOCUMENTS PROVIDED">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {[
                  'Copy of Sale Deed',
                  'Bhu-Naksha',
                  'Approved Plan',
                  'Commencement Certificate',
                  'Occupancy Certificate',
                  'ROR',
                  'Previous Valuation Report',
                ].map(doc => {
                  const checked = (fields.documentsProvided || []).includes(doc);
                  return (
                    <label
                      key={doc}
                      className={`flex items-center gap-2 p-2 rounded border text-xs font-medium cursor-pointer transition-colors ${
                        checked
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-200'
                          : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleMulti('documentsProvided', doc)}
                        disabled={isReadOnly}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{doc}</span>
                    </label>
                  );
                })}
              </div>
            </Field>

            {/* Plot Khata Description */}
            <Field label="PLOT NO / S.NO / G. NO / KHASRA NO & PROPERTY SPECIFICS">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.plotKhataDetails || ''}
                onChange={e => handleChange('plotKhataDetails', e.target.value)}
                disabled={isReadOnly}
                placeholder="Khata No: 405/107, Plot No: 191/1095, Total Area Ac.0.013 Dec I.E. 566.00 Sft, Kissam: Gharabari, Mouza: Achhuli, Ps- Purusottampur, No-223, Ts: Purusottampur No-139, Dist- Ganjam, Odisha."
              />
            </Field>

            {/* Address & Admin Units */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="COLONY / NAGAR / SECTOR">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.colonyNagarSector || ''}
                  onChange={e => handleChange('colonyNagarSector', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Purusottampur, Ganjam"
                />
              </Field>

              <Field label="LOCALITY / LANDMARK">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localityLandmark || ''}
                  onChange={e => handleChange('localityLandmark', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Situated nearer to Purusottampur Achhuli chaka"
                />
              </Field>

              <Field label="VILLAGE / TOWN / CITY / MARKET">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.villageTownCityMarket || ''}
                  onChange={e => handleChange('villageTownCityMarket', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Village"
                />
              </Field>

              <Field label="DISTRICT">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.district || ''}
                  onChange={e => handleChange('district', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Ganjam"
                />
              </Field>

              <Field label="STATE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.state || ''}
                  onChange={e => handleChange('state', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Odisha"
                />
              </Field>

              <Field label="PINCODE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.pincode || ''}
                  onChange={e => handleChange('pincode', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="761018"
                />
              </Field>
            </div>

            {/* Distance & GPS Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="DISTANCE FROM AREA OFFICE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromAreaOffice || ''}
                  onChange={e => handleChange('distanceFromAreaOffice', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="2 Kms away from Purusottampur area office"
                />
              </Field>

              <Field label="LATITUDE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="19.511361"
                />
              </Field>

              <Field label="LONGITUDE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleChange('longitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="84.907833"
                />
              </Field>

              <Field label="COORDINATES (DEG MIN SEC)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.coordinates || ''}
                  onChange={e => handleChange('coordinates', e.target.value)}
                  disabled={isReadOnly}
                  placeholder={`19°30'40.9"N 84°54'28.2"E`}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: CLASSIFICATION & SITE TOPOGRAPHY
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-3" title="3. Property Classification & Site Topography" defaultOpen>
          <div className="space-y-4">
            {/* (A) Plot Classification */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                (A) Plot Characteristics
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="TYPE OF PROPERTY (PLOT)">
                  <select
                    className={selectCls}
                    value={fields.typeOfPropertyPlot || 'Residential'}
                    onChange={e => handleChange('typeOfPropertyPlot', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="NA">NA</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </Field>

                <Field label="LEVEL OF LAND WITH TOPOGRAPHICAL CONDITIONS">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.levelOfLand || ''}
                    onChange={e => handleChange('levelOfLand', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Existing Road Level"
                  />
                </Field>

                <Field label="ANY CONSTRUCTION OBSERVED ON PLOT">
                  <select
                    className={selectCls}
                    value={fields.constructionObservedOnPlot || 'Yes'}
                    onChange={e => handleChange('constructionObservedOnPlot', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SITUATED IN MUNICIPAL/CORPORATION LIMIT">
                  <select
                    className={selectCls}
                    value={fields.situatedInMunicipalLimit || 'No'}
                    onChange={e => handleChange('situatedInMunicipalLimit', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>

                <Field label="MUNICIPAL / GRAM PANCHAYAT DETAILS">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.municipalLimitDetails || ''}
                    onChange={e => handleChange('municipalLimitDetails', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="(Within Achhuli Gram Panchayat area limit)"
                  />
                </Field>
              </div>
            </div>

            {/* (B) Residential & (C) Commercial Subtypes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  (B) Residential Property Classification
                </span>
                <Field label="RESIDENTIAL PROPERTY SUBTYPE">
                  <select
                    className={selectCls}
                    value={fields.residentialPropertySubtype || 'Independent house'}
                    onChange={e => handleChange('residentialPropertySubtype', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Independent house">Independent house</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Row House">Row House</option>
                    <option value="Flat">Flat</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </Field>

                <Field label="CIVIC AMENITIES (SCHOOL, HOSPITAL, MARKET)">
                  <select
                    className={selectCls}
                    value={fields.civicAmenities || 'Available within the radius of 2-3 Kms'}
                    onChange={e => handleChange('civicAmenities', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Available within the radius of 2-3 Kms">Available within the radius of 2-3 Kms</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </Field>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  (C) Commercial / Industrial Classification
                </span>
                <Field label="COMMERCIAL PROPERTY SUBTYPE">
                  <select
                    className={selectCls}
                    value={fields.commercialPropertySubtype || 'Godown'}
                    onChange={e => handleChange('commercialPropertySubtype', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Independent house">Independent house</option>
                    <option value="Row House">Row House</option>
                    <option value="Unit in a mall">Unit in a mall</option>
                    <option value="Godown">Godown</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Shop">Shop</option>
                  </select>
                </Field>

                <Field label="LOCAL TRANSPORT AVAILABILITY">
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {['Metro', 'Local Train', 'Bus', 'Personal Transport'].map(item => {
                      const checked = (fields.availabilityLocalTransport || []).includes(item);
                      return (
                        <label key={item} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleMulti('availabilityLocalTransport', item)}
                            disabled={isReadOnly}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>

            {/* Accessibility & Physical Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="DISTANCE FROM RAILWAY STATION">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromRailwayStation || ''}
                  onChange={e => handleChange('distanceFromRailwayStation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="27 Km from Khallikote"
                />
              </Field>

              <Field label="BUS STOP / TAXI / AUTO STAND">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.busStopTaxiStand || ''}
                  onChange={e => handleChange('busStopTaxiStand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Within 2-3 Kms"
                />
              </Field>

              <Field label="INDEPENDENT & ACCESSIBLE APPROACH ROAD">
                <select
                  className={selectCls}
                  value={fields.independentApproachRoad || 'Yes'}
                  onChange={e => handleChange('independentApproachRoad', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="ABLE TO ACCOMMODATE FIRE EXTINGUISHER">
                <select
                  className={selectCls}
                  value={fields.accommodateFireExtinguisher || 'Yes'}
                  onChange={e => handleChange('accommodateFireExtinguisher', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="FALLS UNDER LAND LOCKED AREA">
                <select
                  className={selectCls}
                  value={fields.landLockedArea || 'No'}
                  onChange={e => handleChange('landLockedArea', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="CORNERED / INTERMITTENT PLOT">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`${inputCls} w-2/3`}
                    value={fields.corneredOrIntermittent || 'Intermittent plot'}
                    onChange={e => handleChange('corneredOrIntermittent', e.target.value)}
                    disabled={isReadOnly}
                  />
                  <select
                    className={`${selectCls} w-1/3`}
                    value={fields.corneredOrIntermittentVal || 'No'}
                    onChange={e => handleChange('corneredOrIntermittentVal', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: BOUNDARIES
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-4" title="4. Boundaries (Dual Matrix)" defaultOpen>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-left font-bold w-24">Direction</th>
                  <th className="p-3 text-left font-bold">As per Verification</th>
                  <th className="p-3 text-left font-bold">As per Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                <tr>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">East</td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundaryEastVerification || ''}
                      onChange={e => handleChange('boundaryEastVerification', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Road"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundaryEastDocument || ''}
                      onChange={e => handleChange('boundaryEastDocument', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Road"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">West</td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundaryWestVerification || ''}
                      onChange={e => handleChange('boundaryWestVerification', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Other's Vacant land"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundaryWestDocument || ''}
                      onChange={e => handleChange('boundaryWestDocument', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Hemanta Kumar Panda"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">North</td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundaryNorthVerification || ''}
                      onChange={e => handleChange('boundaryNorthVerification', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Other's Vacant land"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundaryNorthDocument || ''}
                      onChange={e => handleChange('boundaryNorthDocument', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Kirtan Behera"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">South</td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundarySouthVerification || ''}
                      onChange={e => handleChange('boundarySouthVerification', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Other's Vacant land"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.boundarySouthDocument || ''}
                      onChange={e => handleChange('boundarySouthDocument', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Gobinda Behera"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: LOCALITY, INFRASTRUCTURE & USAGE
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-5" title="5. Locality, Infrastructure & Usage Details" defaultOpen>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="CLASS OF LOCALITY">
                <select
                  className={selectCls}
                  value={fields.classOfLocality || 'Middle class'}
                  onChange={e => handleChange('classOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Posh">Posh</option>
                  <option value="Higher Middle Class">Higher Middle Class</option>
                  <option value="Middle class">Middle class</option>
                  <option value="Lower middle Class">Lower middle Class</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="QUALITY OF INFRASTRUCTURE IN VICINITY">
                <select
                  className={selectCls}
                  value={fields.qualityOfInfrastructure || 'Good'}
                  onChange={e => handleChange('qualityOfInfrastructure', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="OWNERSHIP STATUS OF THE PROPERTY">
                <select
                  className={selectCls}
                  value={fields.ownershipStatus || 'Free Hold'}
                  onChange={e => handleChange('ownershipStatus', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Free Hold">Free Hold</option>
                  <option value="Reg. Lease">Reg. Lease</option>
                  <option value="Govt. Authority">Govt. Authority</option>
                </select>
              </Field>
            </div>

            {/* Approved vs Actual Usage Multi-Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="APPROVED USAGE OF PROPERTY">
                <div className="flex gap-3 pt-2">
                  {['Industrial', 'commercial', 'Residential', 'Mix'].map(item => (
                    <label key={item} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(fields.approvedUsage || []).includes(item)}
                        onChange={() => handleToggleMulti('approvedUsage', item)}
                        disabled={isReadOnly}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="ACTUAL USAGE OF PROPERTY">
                <div className="flex gap-3 pt-2">
                  {['Industrial', 'Commercial', 'Residential', 'Mix'].map(item => (
                    <label key={item} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(fields.actualUsage || []).includes(item)}
                        onChange={() => handleToggleMulti('actualUsage', item)}
                        disabled={isReadOnly}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="RESTRICTIVE COVENANTS REGARDS LAND USE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.restrictiveCovenants || ''}
                  onChange={e => handleChange('restrictiveCovenants', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Applicable"
                />
              </Field>

              <Field label="TYPE OF STRUCTURE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfStructure || ''}
                  onChange={e => handleChange('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Load Bearing/RCC/GCI/Aluform shuttering"
                />
              </Field>

              <Field label="NO OF FLOORS">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleChange('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="G+2 Storied building"
                />
              </Field>

              <Field label="OCCUPANCY DETAILS">
                <select
                  className={selectCls}
                  value={fields.occupancyDetails || 'Self-Occupied'}
                  onChange={e => handleChange('occupancyDetails', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Self-Occupied">Self-Occupied</option>
                  <option value="Rented">Rented</option>
                  <option value="Vacant">Vacant</option>
                </select>
              </Field>

              <Field label="IF RENTED: TENANT NAME">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tenantName || ''}
                  onChange={e => handleChange('tenantName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>

              <Field label="YEARS IN TENANCY">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.yearsInTenancy || ''}
                  onChange={e => handleChange('yearsInTenancy', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="WAS RESISTANCE FOR VALUATION">
                <select
                  className={selectCls}
                  value={fields.resistanceForValuation || 'No'}
                  onChange={e => handleChange('resistanceForValuation', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="RESISTANCE FROM OCCUPANTS">
                <select
                  className={selectCls}
                  value={fields.resistanceFromOccupants || 'No'}
                  onChange={e => handleChange('resistanceFromOccupants', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="DEVELOPMENT OF SURROUNDING AREA">
                <select
                  className={selectCls}
                  value={fields.developmentSurroundingArea || 'Developing'}
                  onChange={e => handleChange('developmentSurroundingArea', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Underdeveloped">Underdeveloped</option>
                  <option value="Developing">Developing</option>
                  <option value="Developed">Developed</option>
                </select>
              </Field>

              <Field label="BASIC AMENITIES">
                <div className="flex gap-2 pt-2">
                  {['Electricity', 'Water', 'Drainage connection'].map(item => (
                    <label key={item} className="flex items-center gap-1 text-[11px] font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(fields.basicAmenities || []).includes(item)}
                        onChange={() => handleToggleMulti('basicAmenities', item)}
                        disabled={isReadOnly}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            {/* Leasehold Specifics */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Leasehold Details (If Applicable)
                </span>
                <span className="text-xs text-slate-500 italic">{fields.isLeasehold}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="NAME OF LESSOR">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.lessorName || ''}
                    onChange={e => handleChange('lessorName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>

                <Field label="NATURE OF LEASE">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.natureOfLease || ''}
                    onChange={e => handleChange('natureOfLease', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>

                <Field label="TOTAL PERIOD OF LEASE">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalPeriodOfLease || ''}
                    onChange={e => handleChange('totalPeriodOfLease', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: STATUTORY APPROVAL DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-6" title="6. Statutory Approval Details (DDMMYYYY Layout)" defaultOpen>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="RERA REGISTRATION NUMBER">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.reraRegNo || ''}
                  onChange={e => handleChange('reraRegNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Applicable."
                />
              </Field>

              <Field label="OCCUPANCY CERTIFICATE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupancyCertificate || ''}
                  onChange={e => handleChange('occupancyCertificate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Available"
                />
              </Field>
            </div>

            {/* Layout Approval */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="LAYOUT APPROVAL NUMBER">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.layoutApprovalNo || ''}
                    onChange={e => handleChange('layoutApprovalNo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Not Mentioned"
                  />
                </Field>

                <Date8BoxInput
                  label="DATE OF APPROVAL [DDMMYYYY]"
                  value={fields.layoutApprovalDate}
                  onChange={val => handleChange('layoutApprovalDate', val)}
                  disabled={isReadOnly}
                />

                <Date8BoxInput
                  label="EXPIRY DATE [DDMMYYYY]"
                  value={fields.layoutExpiryDate}
                  onChange={val => handleChange('layoutExpiryDate', val)}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Building Plan Approval */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="BUILDING PLAN APPROVAL NUMBER">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.buildingPlanApprovalNo || ''}
                    onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Not Available"
                  />
                </Field>

                <Date8BoxInput
                  label="DATE OF APPROVAL [DDMMYYYY]"
                  value={fields.buildingPlanApprovalDate}
                  onChange={val => handleChange('buildingPlanApprovalDate', val)}
                  disabled={isReadOnly}
                />

                <Date8BoxInput
                  label="EXPIRY DATE [DDMMYYYY]"
                  value={fields.buildingPlanExpiryDate}
                  onChange={val => handleChange('buildingPlanExpiryDate', val)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: CONSTRUCTION & FLOOR-WISE BREAKUP
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-7" title="7. Construction Details & Floor-Wise BUA" defaultOpen>
          <div className="space-y-4">
            {/* Plot Areas & Site Demarcation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="AREA OF PLOT AS PER ROR">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaOfPlotRor || ''}
                  onChange={e => handleChange('areaOfPlotRor', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Total Area = Ac.0.013 Dec i.e. 566.00 Sft"
                />
              </Field>

              <Field label="AREA OF PLOT AS PER DOCUMENT">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaOfPlotDoc || ''}
                  onChange={e => handleChange('areaOfPlotDoc', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Total Area = Ac.0.013 Dec i.e. 566.00 Sft"
                />
              </Field>

              <Field label="DEMARCATION AT SITE">
                <select
                  className={selectCls}
                  value={fields.demarcationAtSite || 'Yes'}
                  onChange={e => handleChange('demarcationAtSite', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="APPROVED BUILT UP AREA (IN SQ.FT.)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvedBUA || ''}
                  onChange={e => handleChange('approvedBUA', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Available"
                />
              </Field>

              <Field label="ACTUAL BUILT UP AREA SUMMARY (IN SQ.FT.)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.actualBUA || ''}
                  onChange={e => handleChange('actualBUA', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="RCC GF: 525.00 Sft RCC FF: 525.00 Sft RCC SF: 204.00 Sft Total BUA: 1254.00 Sft"
                />
              </Field>
            </div>

            {/* Dynamic Floor-Wise BUA Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Floor-Wise Break Up & Usage Details
                </label>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddFloor}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                  >
                    + Add Floor
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-3 text-left font-bold w-12">#</th>
                      <th className="p-3 text-left font-bold">Floor Name / Level</th>
                      <th className="p-3 text-right font-bold w-36">Plinth Area (Sq.Ft.)</th>
                      <th className="p-3 text-left font-bold w-48">Current Usage</th>
                      {!isReadOnly && <th className="p-3 text-center font-bold w-16">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                    {(fields.floors || []).map((floor, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-3 text-center text-xs text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={floor.floorName}
                            onChange={e => handleFloorChange(idx, 'floorName', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="e.g. Ground Floor"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={`${inputCls} text-right font-medium`}
                            value={floor.plinthArea}
                            onChange={e => handleFloorChange(idx, 'plinthArea', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="525.00"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            className={selectCls}
                            value={floor.usage}
                            onChange={e => handleFloorChange(idx, 'usage', e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Office">Office</option>
                            <option value="Storage">Storage</option>
                            <option value="Parking">Parking</option>
                            <option value="Industrial">Industrial</option>
                          </select>
                        </td>
                        {!isReadOnly && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFloor(idx)}
                              disabled={(fields.floors || []).length <= 1}
                              className="text-rose-500 hover:text-rose-700 disabled:opacity-30 text-base"
                              title="Delete Floor"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={2} className="p-3 text-right text-slate-700 dark:text-slate-300">
                        Total Built Up Area (Auto-summed):
                      </td>
                      <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 text-base">
                        {fields.totalBUA}
                      </td>
                      <td colSpan={!isReadOnly ? 2 : 1}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Total Carpet, Saleable, FAR, and Extras */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="TOTAL CARPET AREA (IN SQ.FT.)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalCarpetArea || ''}
                  onChange={e => handleChange('totalCarpetArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="1090.00 Sft (Approx.)"
                />
              </Field>

              <Field label="TOTAL SALEABLE AREA (IN SQ.FT.)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalSaleableArea || ''}
                  onChange={e => handleChange('totalSaleableArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="566.00 Sft (Land) & 1254.00 Sft (Building)"
                />
              </Field>

              <Field label="AMENITIES DETAILS (IF ANY)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.amenitiesDetails || ''}
                  onChange={e => handleChange('amenitiesDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Nil"
                />
              </Field>

              <Field label="FLOOR SPACE INDEX (FAR) PERMISSIBLE & UTILIZED">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.farPermissibleUtilized || ''}
                  onChange={e => handleChange('farPermissibleUtilized', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="FAR:2.21"
                />
              </Field>

              <Field label="CONSTRUCTION AS PER APPROVED PLAN / BYE LAWS">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionAsPerApprovedPlan || ''}
                  onChange={e => handleChange('constructionAsPerApprovedPlan', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Plan is not Available"
                />
              </Field>

              <Field label="DETAILS OF EXTRA CONSTRUCTION">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.extraConstructionDetails || ''}
                  onChange={e => handleChange('extraConstructionDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Applicable"
                />
              </Field>

              <Field label="PERCENTAGE OF EXTRA CONSTRUCTION">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.extraConstructionPercentage || ''}
                  onChange={e => handleChange('extraConstructionPercentage', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Applicable"
                />
              </Field>

              <Field label="COMPOUNDABLE OR NON-COMPOUNDABLE">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.extraConstructionCompoundable || ''}
                  onChange={e => handleChange('extraConstructionCompoundable', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Not Applicable"
                />
              </Field>

              <Field label="QUALITY OF CONSTRUCTION">
                <select
                  className={selectCls}
                  value={fields.qualityOfConstruction || 'Good'}
                  onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="MAINTENANCE OF THE PROPERTY">
                <select
                  className={selectCls}
                  value={fields.maintenanceOfProperty || 'Good'}
                  onChange={e => handleChange('maintenanceOfProperty', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: BUILDING CONDITION, LIFE & LAND RATE
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-8" title="8. Building Condition, Life & Land Rate" defaultOpen>
          <div className="space-y-6">
            {/* Condition & Life Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="bg-slate-50 dark:bg-slate-900">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 w-1/4 border-r border-slate-200 dark:border-slate-800">
                      Condition Of Building
                    </td>
                    <td colSpan={3} className="p-2">
                      <select
                        className={selectCls}
                        value={fields.conditionOfBuilding || 'Good'}
                        onChange={e => handleChange('conditionOfBuilding', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      Current Life of the structure
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.currentLifeStructure || ''}
                        onChange={e => handleChange('currentLifeStructure', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="8 Years"
                      />
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      Projected Life of the Structure
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.projectedLifeStructure || ''}
                        onChange={e => handleChange('projectedLifeStructure', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="52 Years"
                      />
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-900">
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      Land Revenue/Taxes Paid upto (for Land)
                    </td>
                    <td className="p-2 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.landRevenueTaxesPaid || ''}
                        onChange={e => handleChange('landRevenueTaxesPaid', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Recent rent receipt is not provided"
                      />
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      Municipal Taxes Paid upto (for Building)
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.municipalTaxesPaid || ''}
                        onChange={e => handleChange('municipalTaxesPaid', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Not Applicable"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Land Rate Calculations */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-2">
                The Land Rate Adopted in this Valuation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="GOVT. BENCHMARK RATE (PER ACRE)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.govtBenchmarkRateAcre || ''}
                    onChange={e => handleChange('govtBenchmarkRateAcre', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="86,55,000"
                  />
                </Field>

                <Field label="GOVT. BENCHMARK RATE (PER SFT)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.govtBenchmarkRateSft || ''}
                    onChange={e => handleChange('govtBenchmarkRateSft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="199"
                  />
                </Field>

                <Field label="TOTAL LAND AREA (DECIMAL)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalLandAreaDec || ''}
                    onChange={e => handleChange('totalLandAreaDec', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0.013"
                  />
                </Field>

                <Field label="TOTAL LAND AREA (IN SFT)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalLandAreaSft || ''}
                    onChange={e => handleChange('totalLandAreaSft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="566.00"
                  />
                </Field>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">Total Govt. Value of Land:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  ₹ {fields.totalGovtValueLand || '0.00'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Field label="PREVAILING MARKET RATE MIN (RS./SFT)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.prevailingMarketRateMin || ''}
                    onChange={e => handleChange('prevailingMarketRateMin', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="500"
                  />
                </Field>

                <Field label="PREVAILING MARKET RATE MAX (RS./SFT)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.prevailingMarketRateMax || ''}
                    onChange={e => handleChange('prevailingMarketRateMax', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="600"
                  />
                </Field>

                <Field label="ADOPTED MARKET RATE (RS./SFT)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-emerald-600`}
                    value={fields.adoptedMarketRateSft || ''}
                    onChange={e => handleChange('adoptedMarketRateSft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="550"
                  />
                </Field>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-800 dark:text-emerald-300">Total Market Value of Land:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                  ₹ {fields.totalMarketValueLand || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 9: BUILDING VALUATION BREAKDOWN
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-9" title="9. Building Valuation (Floor-Wise Breakdown & Cost Analysis)" defaultOpen>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2 text-left font-bold">Particulars of Items</th>
                    <th className="p-2 text-right font-bold w-24">Plinth (Sft)</th>
                    <th className="p-2 text-center font-bold w-20">Roof Ht</th>
                    <th className="p-2 text-center font-bold w-16">Age</th>
                    <th className="p-2 text-right font-bold w-28">Rate (Rs./Sft)</th>
                    <th className="p-2 text-right font-bold w-32">Est. Cost (Rs.)</th>
                    <th className="p-2 text-right font-bold w-32">Depreciation (Rs.)</th>
                    <th className="p-2 text-right font-bold w-32">Net Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {(fields.floors || []).map((floor, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={floor.floorName}
                          onChange={e => handleFloorChange(idx, 'floorName', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-right`}
                          value={floor.plinthArea}
                          onChange={e => handleFloorChange(idx, 'plinthArea', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-center`}
                          value={floor.roofHeight || "10'-6\""}
                          onChange={e => handleFloorChange(idx, 'roofHeight', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-center`}
                          value={floor.ageYears || '8Yrs'}
                          onChange={e => handleFloorChange(idx, 'ageYears', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-right`}
                          value={floor.replacementRate || '1300.00'}
                          onChange={e => handleFloorChange(idx, 'replacementRate', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-medium`}
                          value={floor.estimatedCost || '0.00'}
                          onChange={e => handleFloorChange(idx, 'estimatedCost', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-right text-rose-600 font-medium`}
                          value={floor.depreciationAmount || '0.00'}
                          onChange={e => handleFloorChange(idx, 'depreciationAmount', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-right text-emerald-600 font-bold`}
                          value={floor.netValue || '0.00'}
                          onChange={e => handleFloorChange(idx, 'netValue', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-300 dark:border-slate-700">
                  <tr>
                    <td colSpan={7} className="p-3 text-right text-slate-700 dark:text-slate-300">
                      Total Net Building Value:
                    </td>
                    <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 text-sm">
                      ₹ {fields.totalBasicValueBuilding || '0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Field label="TOTAL BASIC VALUE OF BUILDING (ROUNDED / SAY)">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-emerald-700`}
                  value={fields.totalBasicValueBuildingSay || ''}
                  onChange={e => handleChange('totalBasicValueBuildingSay', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="21,96,000.00"
                />
              </Field>

              <Field label="TOTAL BASIC VALUE IN WORDS">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalBasicValueBuildingWords || ''}
                  onChange={e => handleChange('totalBasicValueBuildingWords', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="RUPEES TWENTY ONE LAKHS NINETY SIX THOUSANDS ONLY"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 10: VALUE OF PROPERTY SUMMARY MATRIX
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-10" title="10. Value of the Property (Summary Matrix)" defaultOpen>
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3 text-left font-bold">Category</th>
                    <th className="p-3 text-right font-bold w-40">Land (₹)</th>
                    <th className="p-3 text-right font-bold w-40">Building (₹)</th>
                    <th className="p-3 text-right font-bold w-32">Amenities (₹)</th>
                    <th className="p-3 text-right font-bold w-44">Total in Rs (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  <tr>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Govt. Guide Line Value</td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.govtGuideLand || ''} onChange={e => handleChange('govtGuideLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.govtGuideBuilding || '-'} onChange={e => handleChange('govtGuideBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.govtGuideAmenities || '-'} onChange={e => handleChange('govtGuideAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-slate-800 dark:text-slate-100`} value={fields.govtGuideTotal || ''} onChange={e => handleChange('govtGuideTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                    <td className="p-3 font-bold text-emerald-800 dark:text-emerald-300">Market Value in Rs</td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.marketValueLand || ''} onChange={e => handleChange('marketValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.marketValueBuilding || ''} onChange={e => handleChange('marketValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.marketValueAmenities || '-'} onChange={e => handleChange('marketValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-emerald-700 dark:text-emerald-400`} value={fields.marketValueTotal || ''} onChange={e => handleChange('marketValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-blue-800 dark:text-blue-300">Realisable Value (95%)</td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.realisableValueLand || ''} onChange={e => handleChange('realisableValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.realisableValueBuilding || ''} onChange={e => handleChange('realisableValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.realisableValueAmenities || '-'} onChange={e => handleChange('realisableValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-blue-700 dark:text-blue-400`} value={fields.realisableValueTotal || ''} onChange={e => handleChange('realisableValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                    <td className="p-3 font-bold text-amber-800 dark:text-amber-300">Distress/Forced Sale Value (85%)</td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.distressValueLand || ''} onChange={e => handleChange('distressValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.distressValueBuilding || ''} onChange={e => handleChange('distressValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.distressValueAmenities || '-'} onChange={e => handleChange('distressValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-amber-700 dark:text-amber-400`} value={fields.distressValueTotal || ''} onChange={e => handleChange('distressValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-indigo-800 dark:text-indigo-300">Insurable Value</td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.insurableValueLand || '-'} onChange={e => handleChange('insurableValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.insurableValueBuilding || ''} onChange={e => handleChange('insurableValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={fields.insurableValueAmenities || '-'} onChange={e => handleChange('insurableValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-indigo-700 dark:text-indigo-400`} value={fields.insurableValueTotal || ''} onChange={e => handleChange('insurableValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rounded Figures & Words */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <Field label="MARKET VALUE (SAY)">
                  <input type="text" className={`${inputCls} font-bold text-emerald-800 dark:text-emerald-300`} value={fields.marketValueSay || ''} onChange={e => handleChange('marketValueSay', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="MARKET VALUE IN WORDS">
                  <input type="text" className={inputCls} value={fields.marketValueWords || ''} onChange={e => handleChange('marketValueWords', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <Field label="REALIZABLE VALUE (SAY)">
                  <input type="text" className={`${inputCls} font-bold text-blue-800 dark:text-blue-300`} value={fields.realizableValueSay || ''} onChange={e => handleChange('realizableValueSay', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="REALIZABLE VALUE IN WORDS">
                  <input type="text" className={inputCls} value={fields.realizableValueWords || ''} onChange={e => handleChange('realizableValueWords', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <Field label="DISTRESS VALUE (SAY)">
                  <input type="text" className={`${inputCls} font-bold text-amber-800 dark:text-amber-300`} value={fields.distressValueSay || ''} onChange={e => handleChange('distressValueSay', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="DISTRESS VALUE IN WORDS">
                  <input type="text" className={inputCls} value={fields.distressValueWords || ''} onChange={e => handleChange('distressValueWords', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 11: REMARKS & ANNEXURE A
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-11" title="11. Remarks, Opinions & Annexure 'A'" defaultOpen>
          <div className="space-y-4">
            <Field label="BASIS OF VALUATION">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.basisOfValuation || ''}
                onChange={e => handleChange('basisOfValuation', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="OPINION OF MARKET VALUE">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.opinionOfMarketValue || ''}
                onChange={e => handleChange('opinionOfMarketValue', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="REMARKS (INCLUDING NB: DISCLAIMER)">
              <textarea
                rows={6}
                className={inputCls}
                value={fields.remarksText || ''}
                onChange={e => handleChange('remarksText', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Annexure A */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-2">
                Annexure - &quot;A&quot; Details
              </h4>
              <Field label="REGARDING LAND">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.annexureARegardingLand || ''}
                  onChange={e => handleChange('annexureARegardingLand', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="REGARDING BUILDING">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.annexureARegardingBuilding || ''}
                  onChange={e => handleChange('annexureARegardingBuilding', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="BASIS OF ARRIVING AT THE LAND RATE">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.annexureABasisLandRate || ''}
                  onChange={e => handleChange('annexureABasisLandRate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 12: STATUTORY CHECKLIST & UNDERTAKING
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-12" title="12. Valuation Report Checklist & Undertaking" defaultOpen>
          <div className="space-y-6">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-2">
                Valuation Report Check List (12 Statutory Items)
              </h4>

              {[
                { id: 'q1', text: '1. FULL NAMES OF ALL PROPERTY OWNERS ARE MENTIONED. ADDRESS OF THE PROPERTY IS MENTIONED AND IS SAME AS LATEST TITLE DEED' },
                { id: 'q2', text: '2. BOUNDARIES OF THE PROPERTY ARE MENTIONED AS PER BOTH, TITLE DEED AND ACTUAL OBSERVATIONS' },
                { id: 'q3', text: '3. CLEARLY MENTIONED THAT PROPERTY HAS BEEN IDENTIFIED BY THE BORROWER ON HIS OWN BASED ON THE ADDRESS' },
                { id: 'q4', text: '4. TYPE OF PROPERTY IS CLEARLY MENTIONED (AMONGST AGRICULTURAL, RESIDENTIAL, COMMERCIAL, INDUSTRIAL ETC.)' },
                { id: 'q5', text: '5. IF LAND, CLEARLY MENTIONED WHETHER THE LAND IS LAND BLOCKED PLOT OR INDEPENDENT LAND (ONLY YES OR NO)' },
                { id: 'q6', text: '6. IF VACANT LAND, CLEARLY MENTIONED THAT PROPER DEMARCATION AND FENCING HAS BEEN DONE' },
                { id: 'q7', text: '7. IF BUILDING, CLEARLY MENTIONED THAT CONSTRUCTION HAS BEEN DONE ACCORDING TO THE BUILDING PLAN APPROVAL (IF NOT, DEVIATION SPECIFIED)' },
                { id: 'q8', text: '8. IF BUILDING, CLEARLY MENTIONED THAT BUILDING USE/COMPLETION CERTIFICATE HAS BEEN OBTAINED FROM COMPETENT AUTHORITY' },
                { id: 'q9', text: '9. CLEARLY MENTIONED WHETHER ACCESS TO THE PROPERTY IS AVAILABLE (ONLY YES OR NO)' },
                { id: 'q10', text: '10. BASIS FOR ARRIVING AT GOVERNMENT VALUE HAS BEEN MENTIONED AND NECESSARY DOCUMENTS HAVE BEEN ENCLOSED' },
                { id: 'q11', text: '11. WHETHER THE SITE IS SITUATED ABOVE THE WATER TANK LEVEL (IF BELOW, NEGATIVE EFFECT SPECIFIED)' },
                { id: 'q12', text: '12. ANY HIGH TENSION ELECTRICITY WIRES ARE PASSING ABOVE THE SITE (IF SO, NEGATIVE EFFECT SPECIFIED)' },
              ].map(item => {
                const currentVal = fields.checklistResponses?.[item.id] || 'YES';
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex-1">{item.text}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      {['YES', 'NO'].map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name={`check-${item.id}`}
                            value={opt}
                            checked={currentVal === opt}
                            onChange={() => {
                              const updated = { ...(fields.checklistResponses || {}), [item.id]: opt };
                              handleChange('checklistResponses', updated);
                            }}
                            disabled={isReadOnly}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Undertaking & Signatory */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-2">
                Undertaking & Authorized Signatory Block
              </h4>

              <Field label="UNDERTAKING TEXT">
                <textarea
                  rows={6}
                  className={inputCls}
                  value={fields.undertakingText || ''}
                  onChange={e => handleChange('undertakingText', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100">Prepared By: Er. Satyajit Mohanty (B.E,Civil) FIV</p>
                <p>Registered Valuer, Govt. of India (Regd. No.-107/2016-17, Cat -I)</p>
                <p>Chartered Engineer (Regd. No.-M-156096-9) • Empanelled Valuer of Axis Bank</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 13: PROPERTY PHOTOGRAPHS (DUAL MODALITY: DEVICE + BUCKET)
        ═══════════════════════════════════════════════════════════════ */}
        <BasePhotographsSection
          title="13. Property Photographs"
          sectionNumber={13}
          sectionId="sec-13"
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages?.length || 0}
          onImageNameChange={(idx, name) => {
            const next = [...(fields.propertyImageNames || [])];
            next[idx] = name;
            handleChange('propertyImageNames', next);
          }}
          onRemoveImage={handlePhotoRemove}
          onReorderImages={handleReorderPhotos}
          onUploadImages={handlePhotoUpload}
          onOpenBucketPicker={() => setBucketPickerOpen(true)}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 14: MAPS & SPATIAL DOCUMENTS (LOCAL DEVICE UPLOAD ONLY)
        ═══════════════════════════════════════════════════════════════ */}
        <BaseMapsSection
          title="14. Maps & Spatial Documents"
          sectionNumber={14}
          sectionId="sec-14"
          isReadOnly={isReadOnly}
          uploading={uploading}
          propertyAddress={fields.localityLandmark || fields.colonyNagarSector || ''}
          latitude={fields.latitude}
          longitude={fields.longitude}
          locationMapImages={fields.locationMapImages}
          cadastralMapImages={fields.cadastralMapImages}
          sketchMapImages={fields.sketchMapImages}
          mapOrder={['location', 'cadastral', 'sketch']}
          onLocationMapUpload={(e) => handleMultiMapUpload(e, 'locationMapImages')}
          onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
          onCadastralMapUpload={(e) => handleMultiMapUpload(e, 'cadastralMapImages')}
          onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
          onSketchMapUpload={(e) => handleMultiMapUpload(e, 'sketchMapImages')}
          onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
          onReorderLocationMap={(imgs) => handleChange('locationMapImages', imgs)}
          onReorderCadastralMap={(imgs) => handleChange('cadastralMapImages', imgs)}
          onReorderSketchMap={(imgs) => handleChange('sketchMapImages', imgs)}
        />

        {/* Benchmark Screenshot Upload inside Sec 14 */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              📊 Benchmark Valuation Screenshot (Page 8)
            </span>
            {!isReadOnly && (
              <label className="px-3 py-1.5 rounded-lg border border-[#b8860b] text-[#b8860b] text-xs font-semibold hover:bg-[#b8860b]/10 cursor-pointer transition-colors">
                {uploading ? 'Uploading...' : '+ Upload Benchmark Screenshot'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleMultiMapUpload(e, 'benchmarkImages')}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(fields.benchmarkImages || []).map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-100">
                <img src={img} alt={`Benchmark ${idx + 1}`} className="w-full h-full object-cover" />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleMapRemove('benchmarkImages', idx)}
                    className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Photo Bucket Picker Modal */}
        <BasePhotoBucketModal
          isOpen={bucketPickerOpen}
          bucketImages={bucketImages || []}
          onClose={() => setBucketPickerOpen(false)}
          onConfirm={handleBucketConfirm}
        />
      </div>
    </div>
  );
}
