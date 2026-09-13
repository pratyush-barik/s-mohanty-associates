'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import {
  PDFArthanFinanceRenderer,
  ArthanFinanceReportFields,
  ArthanFinanceBUAFloor,
  sanitizePositiveFloat,
  sanitizePositiveFloatWithNA,
  sanitizePositiveInt,
  sanitizePositiveIntWithNA,
  sanitizePercentage,
  sanitizePositiveRange,
  sanitizeYearsWithNA,
  sanitizePositiveHeight,
  sumDecimals,
  formatExactDecimal,
  multiplyExactDecimals,
  calculatePercentageValue,
} from '@/lib/banks/pdf-arthan-finance-renderer';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  getFloorName,
  formatAssignedEngineers,
  formatReportDate,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
} from '../BaseBankReportComponents';
import { normalizeMapImages, BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';

export const ARTHAN_FINANCE_CONFIG: BankConfig = {
  bankId: 'ARTHAN FINANCE',
  subTemplateId: '',
  displayName: 'Arthan Finance',
};

export interface ArthanFinanceProps {
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
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

export default function ArthanFinance({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: ArthanFinanceProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  // ── Initial State ──
  const initialData: ArthanFinanceReportFields = useMemo(() => {
    const raw = (typeof initialFields === 'object' && initialFields !== null) ? initialFields : {};
    return {
      // Header
      dateOfValuation: formatReportDate(raw.dateOfValuation || raw.dateOfReportSubmission || new Date()),

      // Section 1 — Technical Initiation Request Form Data
      proposalNo: raw.proposalNo || (projectCode ? `AFPL/${projectCode}` : ''),
      caseType: raw.caseType || 'SBL',
      dateOfInspection: formatReportDate(raw.dateOfInspection || prefill?.inspectionDate || ''),
      nearestLandmark: raw.nearestLandmark || '',
      customerName: raw.customerName || prefill?.contactName || '',
      ownerName: raw.ownerName || prefill?.contactName || '',
      ownerOrSeller: raw.ownerOrSeller || 'Owner',
      personMetOnSite: raw.personMetOnSite || prefill?.contactName || '',
      addressAsPerTRF: raw.addressAsPerTRF || raw.propertyAddress || prefill?.propertyAddress || '',
      addressAsPerDocument: raw.addressAsPerDocument || raw.propertyAddress || prefill?.propertyAddress || '',
      addressAsPerActualSite: raw.addressAsPerActualSite || raw.propertyAddress || prefill?.propertyAddress || '',
      documentsProvided: raw.documentsProvided || 'Copy of ROR & Sketch map',

      // Section 2 — Locational & Property Specific Details
      statusOfLandHolding: raw.statusOfLandHolding === 'Freehold(Homestead)' ? '' : (raw.statusOfLandHolding || ''),
      developedBy: raw.developedBy || 'NA',
      typeOfProperty: raw.typeOfProperty === 'SORP' ? '' : (raw.typeOfProperty || ''),
      typeOfLocality: raw.typeOfLocality || '',
      dateOfInspectionSite: formatReportDate(raw.dateOfInspectionSite || raw.dateOfInspection || prefill?.inspectionDate || ''),
      occupationStatus: raw.occupationStatus || '',
      locationZoningMasterPlan: raw.locationZoningMasterPlan || 'NA',
      propertyUsage: raw.propertyUsage || '',
      plotDemarcation: raw.plotDemarcation || '',
      propertyIdentifiable: raw.propertyIdentifiable || '',
      identifiedThrough: raw.identifiedThrough || '',
      withinMCLimit: raw.withinMCLimit || '',
      internalFinishing: raw.internalFinishing || '',
      typeOfStructure: raw.typeOfStructure || '',
      noOfFloors: raw.noOfFloors === 'GF' && !raw.ageOfProperty ? '' : (raw.noOfFloors || ''),
      locatedOnFloorNo: raw.locatedOnFloorNo === 'GF' && !raw.ageOfProperty ? '' : (raw.locatedOnFloorNo || ''),
      totalFlatsUnits: raw.totalFlatsUnits === '1' && !raw.ageOfProperty ? '' : (raw.totalFlatsUnits || ''),
      externalFinishing: raw.externalFinishing || '',
      externalFinishingDetail: raw.externalFinishingDetail === 'Average' && !raw.internalFinishing ? '' : (raw.externalFinishingDetail || ''),
      yearOfCompletion: raw.yearOfCompletion || '',
      constructionStage: raw.constructionStage === '100%' && !raw.ageOfProperty ? '' : (raw.constructionStage || ''),
      disbursementRecommended: raw.disbursementRecommended === '100%' && !raw.ageOfProperty ? '' : (raw.disbursementRecommended || ''),
      ageOfProperty: raw.ageOfProperty || '',
      futurePhysicalLife: raw.futurePhysicalLife || '',

      // Section 3 — Boundaries
      boundaryNorthDocs: raw.boundaryNorthDocs || 'Not provided',
      boundarySouthDocs: raw.boundarySouthDocs || 'Not provided',
      boundaryEastDocs: raw.boundaryEastDocs || 'Not provided',
      boundaryWestDocs: raw.boundaryWestDocs || 'Not provided',
      boundaryNorthSketch: raw.boundaryNorthSketch || '',
      boundarySouthSketch: raw.boundarySouthSketch || '',
      boundaryEastSketch: raw.boundaryEastSketch || '',
      boundaryWestSketch: raw.boundaryWestSketch || '',
      boundaryNorthSite: raw.boundaryNorthSite || '',
      boundarySouthSite: raw.boundarySouthSite || '',
      boundaryEastSite: raw.boundaryEastSite || '',
      boundaryWestSite: raw.boundaryWestSite || '',
      boundariesMatching: raw.boundariesMatching || 'Yes',
      boundariesNotMatchingReason: raw.boundariesNotMatchingReason || '',

      // Section 4 — Setbacks
      setbackFrontSanctioned: raw.setbackFrontSanctioned || 'NA',
      setbackRearSanctioned: raw.setbackRearSanctioned || 'NA',
      setbackLeftSanctioned: raw.setbackLeftSanctioned || 'NA',
      setbackRightSanctioned: raw.setbackRightSanctioned || 'NA',
      setbackFrontSite: raw.setbackFrontSite || '',
      setbackRearSite: raw.setbackRearSite || '',
      setbackLeftSite: raw.setbackLeftSite || '',
      setbackRightSite: raw.setbackRightSite || '',

      // Section 5 — Height
      heightSanctioned: raw.heightSanctioned || 'NA',
      heightSite: raw.heightSite || '',

      // Section 6 — BUA (default adoptedBUA is empty string; renders as NA when empty)
      buaFloors: Array.isArray(raw.buaFloors)
        ? raw.buaFloors.map((fl: any) => ({
            ...fl,
            adoptedBUA: fl.adoptedBUA === 'NA' ? '' : (fl.adoptedBUA || ''),
            carpetArea: fl.carpetArea === 'NA' ? '' : (fl.carpetArea || ''),
            actualBUA: fl.actualBUA === 'NA' ? '' : (fl.actualBUA || ''),
            permissibleBUA: fl.permissibleBUA === 'NA' ? '' : (fl.permissibleBUA || ''),
          }))
        : [
            { floor: 'Basement / Stilt', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
            { floor: 'Ground Floor', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
            { floor: 'First Floor', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
          ],
      violationObserved: raw.violationObserved || 'NA',

      // Section 7 — Plan Approvals
      constructionAsPerPlan: raw.constructionAsPerPlan || 'NA',
      approvedPlanDetails: (raw.approvedPlanDetails && raw.approvedPlanDetails !== 'Details of approved plan with approval no and date')
        ? raw.approvedPlanDetails
        : 'NA',
      constructionPermissionNumberDate: raw.constructionPermissionNumberDate || 'NA',
      violationsObserved: raw.violationsObserved || 'NA',
      structureConfirmingByelaws: raw.structureConfirmingByelaws || 'NA',

      // Section 8 — Estimate Analysis
      estimatedCostTotal: raw.estimatedCostTotal || 'NA',
      estimatedCostPerSqft: raw.estimatedCostPerSqft || 'NA',
      justifiedEstimatedCostPerSqft: raw.justifiedEstimatedCostPerSqft || 'NA',
      adoptableJustifiedEstimatedCost: raw.adoptableJustifiedEstimatedCost || 'NA',

      // Section 9 — Valuation
      landAreaSqft: raw.landAreaSqft || '',
      adoptableBuiltUpArea: raw.adoptableBuiltUpArea || '',
      adoptableBUASpec: raw.adoptableBUASpec !== undefined ? raw.adoptableBUASpec : 'GF RCC',
      currentMarketRateRange: raw.currentMarketRateRange || '',
      constructionCostPerSqft: raw.constructionCostPerSqft || '',
      recommendedRateOfLand: raw.recommendedRateOfLand || '',
      totalConstructionValue100: raw.totalConstructionValue100 || (
        raw.adoptableBuiltUpArea && raw.constructionCostPerSqft
          ? multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft)
          : ''
      ),
      totalLandValue: raw.totalLandValue || (
        raw.landAreaSqft && raw.recommendedRateOfLand
          ? multiplyExactDecimals(raw.landAreaSqft, raw.recommendedRateOfLand)
          : ''
      ),
      totalConstructionValuePresent: raw.totalConstructionValuePresent || (
        (raw.totalConstructionValue100 || (raw.adoptableBuiltUpArea && raw.constructionCostPerSqft ? multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft) : ''))
          ? calculatePercentageValue(
              raw.totalConstructionValue100 || multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft),
              raw.constructionStage || '100%'
            )
          : ''
      ),
      marketValueLandBuilding: raw.marketValueLandBuilding || (
        sumDecimals([
          raw.totalLandValue || (raw.landAreaSqft && raw.recommendedRateOfLand ? multiplyExactDecimals(raw.landAreaSqft, raw.recommendedRateOfLand) : ''),
          raw.totalConstructionValue100 || (raw.adoptableBuiltUpArea && raw.constructionCostPerSqft ? multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft) : '')
        ]) > 0
          ? formatExactDecimal(sumDecimals([
              raw.totalLandValue || (raw.landAreaSqft && raw.recommendedRateOfLand ? multiplyExactDecimals(raw.landAreaSqft, raw.recommendedRateOfLand) : ''),
              raw.totalConstructionValue100 || (raw.adoptableBuiltUpArea && raw.constructionCostPerSqft ? multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft) : '')
            ]))
          : ''
      ),
      marketValueLandBuildingRight: raw.marketValueLandBuildingRight || (
        sumDecimals([
          raw.totalLandValue || (raw.landAreaSqft && raw.recommendedRateOfLand ? multiplyExactDecimals(raw.landAreaSqft, raw.recommendedRateOfLand) : ''),
          raw.totalConstructionValuePresent || (
            (raw.totalConstructionValue100 || (raw.adoptableBuiltUpArea && raw.constructionCostPerSqft ? multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft) : ''))
              ? calculatePercentageValue(
                  raw.totalConstructionValue100 || multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft),
                  raw.constructionStage || '100%'
                )
              : ''
          )
        ]) > 0
          ? formatExactDecimal(sumDecimals([
              raw.totalLandValue || (raw.landAreaSqft && raw.recommendedRateOfLand ? multiplyExactDecimals(raw.landAreaSqft, raw.recommendedRateOfLand) : ''),
              raw.totalConstructionValuePresent || (
                (raw.totalConstructionValue100 || (raw.adoptableBuiltUpArea && raw.constructionCostPerSqft ? multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft) : ''))
                  ? calculatePercentageValue(
                      raw.totalConstructionValue100 || multiplyExactDecimals(raw.adoptableBuiltUpArea, raw.constructionCostPerSqft),
                      raw.constructionStage || '100%'
                    )
                  : ''
              )
            ]))
          : ''
      ),
      distressPct100: (raw.distressPct100 !== undefined && raw.distressPct100 !== null && raw.distressPct100 !== '')
        ? raw.distressPct100
        : '0',
      distressPctPresent: (raw.distressPctPresent !== undefined && raw.distressPctPresent !== null && raw.distressPctPresent !== '')
        ? raw.distressPctPresent
        : '0',
      distressValue100: raw.distressValue100 !== undefined && raw.distressValue100 !== null && raw.distressValue100 !== ''
        ? raw.distressValue100
        : '',
      distressValuePresent: raw.distressValuePresent !== undefined && raw.distressValuePresent !== null && raw.distressValuePresent !== ''
        ? raw.distressValuePresent
        : '',
      flatPropertyType: raw.flatPropertyType || (raw.flatSBUA && raw.flatSBUA !== 'NA' ? 'Flat' : 'NA'),
      flatSBUA: raw.flatSBUA || 'NA',
      compositeSaleRate: raw.compositeSaleRate || 'NA',
      totalMarketValueApartment: raw.totalMarketValueApartment || (
        raw.flatSBUA && raw.compositeSaleRate && raw.flatSBUA !== 'NA' && raw.compositeSaleRate !== 'NA'
          ? multiplyExactDecimals(raw.flatSBUA, raw.compositeSaleRate)
          : 'NA'
      ),
      govtGuidelineRateLand: raw.govtGuidelineRateLand || '',
      landValueGovtRate: raw.landValueGovtRate || (
        raw.landAreaSqft && raw.govtGuidelineRateLand && raw.govtGuidelineRateLand !== 'NA'
          ? multiplyExactDecimals(raw.landAreaSqft, raw.govtGuidelineRateLand)
          : ''
      ),
      govtGuidelineRateFlats: raw.govtGuidelineRateFlats !== undefined ? raw.govtGuidelineRateFlats : 'NA',
      flatValueGovtRate: raw.flatValueGovtRate !== undefined && raw.flatValueGovtRate !== ''
        ? raw.flatValueGovtRate
        : (
          raw.govtGuidelineRateFlats === 'NA' || !raw.govtGuidelineRateFlats
            ? 'NA'
            : (
              (raw.adoptableBuiltUpArea || raw.flatSBUA)
                ? multiplyExactDecimals(raw.adoptableBuiltUpArea || raw.flatSBUA, raw.govtGuidelineRateFlats)
                : 'NA'
            )
        ),
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',

      // Section 10 — Remarks
      remarks: raw.remarks || '',

      // Section 11 — Valuer Certification
      dateOfVisit: formatReportDate(raw.dateOfInspection || raw.dateOfVisit || prefill?.inspectionDate || ''),
      dateOfReportSubmission: formatReportDate(raw.dateOfReportSubmission || raw.dateOfValuation || new Date()),
      visitingEngineer: (raw.visitingEngineer && raw.visitingEngineer !== 'Visiting Engineer')
        ? raw.visitingEngineer
        : (formatAssignedEngineers(prefill?.fieldEmployees || prefill?.assignedFieldEmployees || prefill?.assignedEngineers) || raw.visitingEngineer || ''),
      authorizedSignatory: 'Er. Satyajit Mohanty',

      // Photos & Maps
      propertyImages: Array.isArray(raw.propertyImages) ? raw.propertyImages : [],
      propertyImageNames: Array.isArray(raw.propertyImageNames) ? raw.propertyImageNames : [],
      locationMapImages: normalizeMapImages(raw.locationMapImages),
      cadastralMapImages: normalizeMapImages(raw.cadastralMapImages),
    };
  }, [initialFields, projectCode, prefill]);

  const [fields, setFields] = useState<ArthanFinanceReportFields>(() => decodeHtmlEntitiesDeep(initialData));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft
  useEffect(() => {
    if (isReadOnly) return;
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setAutoSaveStatus('saving');
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        setAutoSaveStatus(res && 'error' in res && res.error ? 'error' : 'saved');
      } catch { setAutoSaveStatus('error'); }
    }, 1200);
    return () => { if (debouncedTimer.current) clearTimeout(debouncedTimer.current); };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isReadOnly) saveReportDraft(projectId, fields).catch(console.error);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Auto-fill visitingEngineer
  useEffect(() => {
    if (!fields.visitingEngineer || fields.visitingEngineer === 'Visiting Engineer') {
      const assigned = formatAssignedEngineers(
        prefill?.fieldEmployees || prefill?.assignedFieldEmployees || prefill?.assignedEngineers
      );
      if (assigned) setFields(prev => ({ ...prev, visitingEngineer: assigned }));
    }
  }, [prefill?.fieldEmployees, prefill?.assignedFieldEmployees, prefill?.assignedEngineers]);

  // Field change handler with sanitization and auto-calculations
  const handleChange = useCallback((key: keyof ArthanFinanceReportFields, rawValue: any) => {
    let value = rawValue;
    if (typeof value === 'string') {
      if (key === 'totalFlatsUnits') {
        value = sanitizePositiveIntWithNA(value);
      } else if (key === 'yearOfCompletion') {
        value = sanitizePositiveIntWithNA(value, 4);
      } else if (key === 'constructionStage' || key === 'disbursementRecommended') {
        value = sanitizePercentage(value);
      } else if (key === 'ageOfProperty' || key === 'futurePhysicalLife') {
        value = sanitizeYearsWithNA(value);
      } else if (
        key === 'setbackFrontSanctioned' || key === 'setbackRearSanctioned' ||
        key === 'setbackLeftSanctioned' || key === 'setbackRightSanctioned' ||
        key === 'setbackFrontSite' || key === 'setbackRearSite' ||
        key === 'setbackLeftSite' || key === 'setbackRightSite' ||
        key === 'estimatedCostTotal' || key === 'estimatedCostPerSqft' ||
        key === 'justifiedEstimatedCostPerSqft' || key === 'adoptableJustifiedEstimatedCost' ||
        key === 'flatSBUA' || key === 'compositeSaleRate' ||
        key === 'totalMarketValueApartment' || key === 'govtGuidelineRateFlats' ||
        key === 'flatValueGovtRate'
      ) {
        value = sanitizePositiveFloatWithNA(value);
      } else if (key === 'heightSanctioned' || key === 'heightSite') {
        value = sanitizePositiveHeight(value);
      } else if (
        key === 'landAreaSqft' || key === 'adoptableBuiltUpArea' ||
        key === 'constructionCostPerSqft' || key === 'recommendedRateOfLand' ||
        key === 'totalConstructionValue100' || key === 'govtGuidelineRateLand' ||
        key === 'distressPct100' || key === 'distressPctPresent' ||
        key === 'latitude' || key === 'longitude'
      ) {
        value = sanitizePositiveFloat(value);
      } else if (key === 'currentMarketRateRange') {
        value = sanitizePositiveRange(value);
      }
    }

    setFields(prev => {
      const next = { ...prev, [key]: value };

      // Sync dateOfInspection to dateOfVisit and dateOfInspectionSite
      if (key === 'dateOfInspection') {
        next.dateOfVisit = value;
        next.dateOfInspectionSite = value;
      }

      // Auto-calculate Total Land Value (exact decimals, no roundoff)
      if (key === 'landAreaSqft' || key === 'recommendedRateOfLand') {
        const area = key === 'landAreaSqft' ? value : next.landAreaSqft;
        const rate = key === 'recommendedRateOfLand' ? value : next.recommendedRateOfLand;
        next.totalLandValue = multiplyExactDecimals(area, rate);
      }

      // Auto-calculate Total Construction Value (100% complete) & Present Value (exact decimals, no roundoff)
      if (key === 'adoptableBuiltUpArea' || key === 'constructionCostPerSqft') {
        const bua = key === 'adoptableBuiltUpArea' ? value : next.adoptableBuiltUpArea;
        const cost = key === 'constructionCostPerSqft' ? value : next.constructionCostPerSqft;
        const cv100 = multiplyExactDecimals(bua, cost);
        next.totalConstructionValue100 = cv100;
        if (cv100) {
          const stage = next.constructionStage || '100%';
          next.totalConstructionValuePresent = calculatePercentageValue(cv100, stage);
        } else {
          next.totalConstructionValuePresent = '';
        }
      }

      // Auto-calculate construction value when stage percentage changes (exact decimals, no roundoff)
      if (key === 'constructionStage') {
        if (next.totalConstructionValue100 && value) {
          next.totalConstructionValuePresent = calculatePercentageValue(next.totalConstructionValue100, value);
        } else if (!value) {
          next.totalConstructionValuePresent = '';
        }
      }

      // Auto-calculate distress values when distress percentages change
      if (key === 'distressPct100') {
        const pct = (value !== '' && value !== undefined && value !== null) ? value : '0';
        next.distressValue100 = next.marketValueLandBuilding
          ? calculatePercentageValue(next.marketValueLandBuilding, pct)
          : '';
      }
      if (key === 'distressPctPresent') {
        const pct = (value !== '' && value !== undefined && value !== null) ? value : '0';
        next.distressValuePresent = next.marketValueLandBuildingRight
          ? calculatePercentageValue(next.marketValueLandBuildingRight, pct)
          : '';
      }

      // Auto-calculate Market Value & Distress Value (exact decimals, no roundoff):
      // Left: 100% Complete = Total Land Value + 100% Complete Construction Value
      // Right: Present Construction Stage = Total Land Value + Present Stage Construction Value
      const lvStr = next.totalLandValue || '0';
      const cv100Str = next.totalConstructionValue100 || '0';
      const cvPresentStr = next.totalConstructionValuePresent || next.totalConstructionValue100 || '0';
      const pct100 = (next.distressPct100 !== undefined && next.distressPct100 !== null && next.distressPct100 !== '')
        ? next.distressPct100
        : '0';
      const pctPresent = (next.distressPctPresent !== undefined && next.distressPctPresent !== null && next.distressPctPresent !== '')
        ? next.distressPctPresent
        : '0';

      const mv100Num = sumDecimals([lvStr, cv100Str]);
      if (mv100Num > 0) {
        const mv100Str = formatExactDecimal(mv100Num);
        next.marketValueLandBuilding = mv100Str;
        next.distressValue100 = calculatePercentageValue(mv100Str, pct100);
      } else {
        next.marketValueLandBuilding = '';
        next.distressValue100 = '';
      }

      const mvPresentNum = sumDecimals([lvStr, cvPresentStr]);
      if (mvPresentNum > 0) {
        const mvPresentStr = formatExactDecimal(mvPresentNum);
        next.marketValueLandBuildingRight = mvPresentStr;
        next.distressValuePresent = calculatePercentageValue(mvPresentStr, pctPresent);
      } else {
        next.marketValueLandBuildingRight = '';
        next.distressValuePresent = '';
      }

      // Auto-calculate Land Value as per Govt Rate (exact decimals, no roundoff)
      if (key === 'govtGuidelineRateLand' || key === 'landAreaSqft') {
        const area = key === 'landAreaSqft' ? value : next.landAreaSqft;
        const gRate = key === 'govtGuidelineRateLand' ? value : next.govtGuidelineRateLand;
        if (gRate === 'NA' || area === 'NA') {
          next.landValueGovtRate = 'NA';
        } else if (area && gRate) {
          next.landValueGovtRate = multiplyExactDecimals(area, gRate);
        } else {
          next.landValueGovtRate = '';
        }
      }

      // Auto-calculate Flat / Apartment Value as per Govt Rate (exact decimals, no roundoff)
      if (key === 'govtGuidelineRateFlats' || key === 'adoptableBuiltUpArea' || key === 'flatSBUA') {
        const rate = key === 'govtGuidelineRateFlats' ? value : next.govtGuidelineRateFlats;
        const bua = key === 'adoptableBuiltUpArea' ? value : (next.adoptableBuiltUpArea || next.flatSBUA);
        if (rate === 'NA') {
          next.flatValueGovtRate = 'NA';
        } else if (rate && bua && bua !== 'NA') {
          next.flatValueGovtRate = multiplyExactDecimals(bua, rate);
        } else if (!rate) {
          next.flatValueGovtRate = '';
        }
      }

      // Auto-calculate Total Market Value of Flat / Apartment / Shop / Office
      if (key === 'flatPropertyType') {
        if (value === 'NA') {
          next.flatPropertyType = 'NA';
          next.flatSBUA = 'NA';
          next.compositeSaleRate = 'NA';
          next.totalMarketValueApartment = 'NA';
        } else {
          next.flatPropertyType = value;
          if (next.flatSBUA === 'NA') next.flatSBUA = '';
          if (next.compositeSaleRate === 'NA') next.compositeSaleRate = '';
          if (next.flatSBUA && next.compositeSaleRate && next.flatSBUA !== 'NA' && next.compositeSaleRate !== 'NA') {
            next.totalMarketValueApartment = multiplyExactDecimals(next.flatSBUA, next.compositeSaleRate);
          } else {
            next.totalMarketValueApartment = '';
          }
        }
      }

      if (key === 'flatSBUA' || key === 'compositeSaleRate') {
        const sbua = key === 'flatSBUA' ? value : next.flatSBUA;
        const rate = key === 'compositeSaleRate' ? value : next.compositeSaleRate;
        if (sbua === 'NA' || rate === 'NA') {
          next.totalMarketValueApartment = 'NA';
        } else if (sbua && rate) {
          next.totalMarketValueApartment = multiplyExactDecimals(sbua, rate);
        } else {
          next.totalMarketValueApartment = '';
        }
      }

      return next;
    });
  }, []);

  // BUA Floor Handlers
  const handleAddBUAFloor = () => {
    const current = fields.buaFloors || [];
    const nextFloor = getFloorName(current.length);
    const updated: ArthanFinanceBUAFloor[] = [
      ...current,
      { floor: nextFloor, accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
    ];
    handleChange('buaFloors', updated);
  };

  const handleBUAFloorChange = (idx: number, field: keyof ArthanFinanceBUAFloor, value: string) => {
    let finalVal = value;
    if (field === 'carpetArea' || field === 'actualBUA' || field === 'permissibleBUA' || field === 'adoptedBUA') {
      finalVal = sanitizePositiveFloat(value);
    }
    const updated = (fields.buaFloors || []).map((f, i) => i === idx ? { ...f, [field]: finalVal } : f);
    handleChange('buaFloors', updated);
    if (field === 'adoptedBUA') {
      const sumAdopted = sumDecimals(updated.map(f => f.adoptedBUA));
      handleChange('adoptableBuiltUpArea', sumAdopted > 0 ? formatExactDecimal(sumAdopted) : '');
    }
  };

  const handleRemoveBUAFloor = (idx: number) => {
    const updated = (fields.buaFloors || []).filter((_, i) => i !== idx);
    handleChange('buaFloors', updated);
    const sumAdopted = sumDecimals(updated.map(f => f.adoptedBUA));
    handleChange('adoptableBuiltUpArea', sumAdopted > 0 ? formatExactDecimal(sumAdopted) : '');
  };

  // Map Upload Handlers (device upload only)
  const handleMapUpload = async (
    key: 'locationMapImages' | 'cadastralMapImages',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleMapRemove = (key: 'locationMapImages' | 'cadastralMapImages', index?: number) => {
    if (index === undefined) {
      setFields(prev => ({ ...prev, [key]: [] }));
      return;
    }
    const updated = (fields[key] || []).filter((_, i) => i !== index);
    setFields(prev => ({ ...prev, [key]: updated }));
  };

  const handleReorderMap = (key: 'locationMapImages' | 'cadastralMapImages', newImgs: string[]) => {
    setFields(prev => ({
      ...prev,
      [key]: newImgs,
    }));
  };

  // Photo Handlers
  const handleBucketConfirm = (selectedUrls: string[]) => {
    const existing = fields.propertyImages || [];
    setFields(prev => ({
      ...prev,
      propertyImages: [...existing, ...selectedUrls],
    }));
  };

  const handlePhotoRemove = (idx: number) => {
    const updated = (fields.propertyImages || []).filter((_, i) => i !== idx);
    const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
    setFields(prev => ({
      ...prev,
      propertyImages: updated,
      propertyImageNames: updatedNames,
    }));
  };

  const handleReorderPhotos = (newImgs: string[], newNames: string[]) => {
    setFields(prev => ({
      ...prev,
      propertyImages: newImgs,
      propertyImageNames: newNames,
    }));
  };

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
        const path = `temp-photos/${projectId}/photo-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = fields.propertyImages || [];
      handleChange('propertyImages', [...existing, ...uploadedUrls]);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const res = await saveReportDraft(projectId, fields);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
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
      label: fields.propertyImageNames?.[idx] || 'Site Picture',
    })).filter(p => p.bytes && p.bytes.length > 0);

    // Fetch location maps
    const locImages = fields.locationMapImages || [];
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // Fetch cadastral maps
    const cadImages = fields.cadastralMapImages || [];
    const cadBytes = (await Promise.all(cadImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFArthanFinanceRenderer();
    await renderer.init();

    return renderer.generateArthanReport(fields, {
      photos,
      locationMaps: locBytes,
      cadastralMaps: cadBytes,
    });
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating Arthan Finance PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #1e3a5f; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating Arthan Finance PDF Preview...</p>
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

    setLoading(true);
    try {
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error('PDF Preview failed:', err);
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      setMessage({ text: `PDF Preview Failed: ${err?.message || String(err)}`, type: 'error' });
      alert(`PDF Preview Failed: ${err?.message || String(err)}`);
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
      a.download = `Arthan_Valuation_${projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      console.error('PDF Download failed:', err);
      setMessage({ text: `PDF Download Failed: ${err?.message || String(err)}`, type: 'error' });
      alert(`PDF Download Failed: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if ((fields.propertyImages || []).length < 2) {
      alert('Please upload at least 2 photographs of the property before submitting.');
      return;
    }
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Date field helper
  const DateInput = ({ fieldKey, label }: { fieldKey: keyof ArthanFinanceReportFields; label: string }) => (
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
            onChange={e => { if (e.target.value) handleChange(fieldKey, formatReportDate(e.target.value)); }}
          />
        )}
      </div>
    </Field>
  );

  // BUA Totals calculation (exact decimal calculation, no roundoff)
  const totalCarpet = useMemo(() => {
    return sumDecimals((fields.buaFloors || []).map(r => r.carpetArea));
  }, [fields.buaFloors]);

  const totalActualBUA = useMemo(() => {
    return sumDecimals((fields.buaFloors || []).map(r => r.actualBUA));
  }, [fields.buaFloors]);

  const totalPermissibleBUA = useMemo(() => {
    return sumDecimals((fields.buaFloors || []).map(r => r.permissibleBUA));
  }, [fields.buaFloors]);

  const totalAdoptedBUA = useMemo(() => {
    return sumDecimals((fields.buaFloors || []).map(r => r.adoptedBUA));
  }, [fields.buaFloors]);

  // Nav sections
  const navSections: NavItem[] = [
    { id: 'sec-1', title: 'Technical Initiation' },
    { id: 'sec-2', title: 'Locational & Property' },
    { id: 'sec-3', title: 'Boundaries' },
    { id: 'sec-4', title: 'Setbacks / Margin' },
    { id: 'sec-5', title: 'Height / Storieys' },
    { id: 'sec-6', title: 'BUA & Accommodation' },
    { id: 'sec-7', title: 'Plan Approvals' },
    { id: 'sec-8', title: 'Estimate Analysis' },
    { id: 'sec-9', title: 'Valuation' },
    { id: 'sec-10', title: 'Remarks' },
    { id: 'sec-11', title: 'Valuer Certification' },
    { id: 'sec-12', title: 'Photographs' },
    { id: 'sec-13', title: 'Maps' },
  ];

  return (
    <div className="flex gap-6 items-start w-full">
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-6">
        <ActiveConfigBanner
          bankName="ARTHAN FINANCE"
          formatName="Valuation Report"
          category="Bank & FIS"
          onResetWizard={onResetWizard}
        />

        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {message.text}
          </div>
        )}

        {/* ════ SECTION 1: TECHNICAL INITIATION REQUEST FORM DATA ════ */}
        <Section title="TECHNICAL INITIATION REQUEST FORM DATA" number={1} id="sec-1" defaultOpen={true}>
          {/* Date of Valuation (header field) */}
          <div className="mb-4 flex justify-end items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-black">
            <span className="text-sm font-semibold text-black">Date of Valuation:</span>
            <div className="relative flex items-center">
              <input
                type="text"
                className={`${inputCls} w-40 font-semibold text-black`}
                value={fields.dateOfValuation || ''}
                onChange={e => handleChange('dateOfValuation', e.target.value)}
                disabled={isReadOnly}
                placeholder="DD/MM/YYYY"
              />
              {!isReadOnly && (
                <input
                  type="date"
                  className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer"
                  onChange={e => { if (e.target.value) handleChange('dateOfValuation', formatReportDate(e.target.value)); }}
                />
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Proposal No.">
              <input className={inputCls} value={fields.proposalNo || ''} onChange={e => handleChange('proposalNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. AFPL/SMA-001" />
            </Field>
            <Field label="Case Type">
              <input className={inputCls} value={fields.caseType || ''} onChange={e => handleChange('caseType', e.target.value)} disabled={isReadOnly} placeholder="e.g. SBL" />
            </Field>
            <DateInput fieldKey="dateOfInspection" label="Date of Inspection / Site visit (DD/MM/YYYY)" />
            <Field label="Nearest Landmark">
              <input className={inputCls} value={fields.nearestLandmark || ''} onChange={e => handleChange('nearestLandmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near Ishkon Temple, Antara" />
            </Field>

            {/* Customer, Owner / Seller & Person Met at Site — Soft Container */}
            <div className="md:col-span-2 bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3 text-black [&_label]:!text-black">
              <div className="border-b border-amber-200/80 pb-2">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                  Customer & Ownership Details
                </h3>
              </div>

              <div className="space-y-3">
                <Field label="Name of Customer/Applicant & Contact Details">
                  <input
                    className={inputCls}
                    value={fields.customerName || ''}
                    onChange={e => handleChange('customerName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Applicant name & mobile number"
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-black uppercase tracking-wider">
                      Name of Current{' '}
                      <span className={(fields.ownerOrSeller || 'Owner') === 'Owner' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>
                        Owner
                      </span>
                      {' / '}
                      <span className={fields.ownerOrSeller === 'Seller' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>
                        Seller
                      </span>
                    </label>

                    {!isReadOnly && (
                      <div className="flex items-center bg-white border border-amber-300 rounded-lg p-0.5 shadow-2xs text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => handleChange('ownerOrSeller', 'Owner')}
                          className={`px-2.5 py-0.5 rounded-md transition-all ${
                            (fields.ownerOrSeller || 'Owner') === 'Owner'
                              ? 'bg-amber-600 text-white font-bold shadow-xs'
                              : 'text-black hover:bg-amber-100/60'
                          }`}
                        >
                          Owner
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('ownerOrSeller', 'Seller')}
                          className={`px-2.5 py-0.5 rounded-md transition-all ${
                            fields.ownerOrSeller === 'Seller'
                              ? 'bg-amber-600 text-white font-bold shadow-xs'
                              : 'text-black hover:bg-amber-100/60'
                          }`}
                        >
                          Seller
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={e => handleChange('ownerName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Owner / Seller name as per document"
                  />
                </div>

                <Field label="Name of the Person met at site & Contact No.">
                  <input
                    className={inputCls}
                    value={fields.personMetOnSite || ''}
                    onChange={e => handleChange('personMetOnSite', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Person met & contact number"
                  />
                </Field>
              </div>
            </div>

            {/* Address of property being appraised — Soft Container (Aditya Birla STSL Pattern) */}
            <div className="md:col-span-2 bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3 text-black [&_label]:!text-black">
              <div className="border-b border-amber-200/80 pb-2">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                  Address of Property Being Appraised
                </h3>
              </div>

              <div className="space-y-3">
                <Field label="As per TRF">
                  <textarea
                    rows={3}
                    className={`${inputCls} min-h-[72px] resize-y leading-relaxed`}
                    value={fields.addressAsPerTRF || ''}
                    onChange={e => handleChange('addressAsPerTRF', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Address as per Technical Review Form"
                  />
                </Field>
                <Field label="As per Document">
                  <textarea
                    rows={3}
                    className={`${inputCls} min-h-[72px] resize-y leading-relaxed`}
                    value={fields.addressAsPerDocument || ''}
                    onChange={e => handleChange('addressAsPerDocument', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Address as per sale deed / ROR"
                  />
                </Field>
                <Field label="As per Actual at site">
                  <textarea
                    rows={3}
                    className={`${inputCls} min-h-[72px] resize-y leading-relaxed`}
                    value={fields.addressAsPerActualSite || ''}
                    onChange={e => handleChange('addressAsPerActualSite', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Address as observed on site"
                  />
                </Field>
              </div>
            </div>
            <div className="md:col-span-2">
              <Field label="Documents Provided">
                <input className={inputCls} value={fields.documentsProvided || ''} onChange={e => handleChange('documentsProvided', e.target.value)} disabled={isReadOnly} placeholder="e.g. Copy of ROR & Sketch map" />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 2: LOCATIONAL & PROPERTY SPECIFIC DETAILS ════ */}
        <Section title="LOCATIONAL & PROPERTY SPECIFIC DETAILS (BASED ON SITE VISIT)" number={2} id="sec-2">
          <div className="space-y-4">
            {/* Category 1: Land Holding & Property Details */}
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Status of Land Holding">
                  <input className={`${inputCls} font-bold`} value={fields.statusOfLandHolding || ''} onChange={e => handleChange('statusOfLandHolding', e.target.value)} disabled={isReadOnly} placeholder="e.g. Freehold(Homestead)" />
                </Field>
                <Field label="Developed By">
                  <input className={inputCls} value={fields.developedBy || ''} onChange={e => handleChange('developedBy', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
                </Field>
                <Field label="Type of Property">
                  <input className={inputCls} value={fields.typeOfProperty || ''} onChange={e => handleChange('typeOfProperty', e.target.value)} disabled={isReadOnly} placeholder="e.g. SORP / NA" />
                </Field>
                <Field label="Type of Locality">
                  <select className={selectCls} value={fields.typeOfLocality || ''} onChange={e => handleChange('typeOfLocality', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Developing">Developing</option>
                    <option value="Developed">Developed</option>
                    <option value="Semi-Developed">Semi-Developed</option>
                    <option value="Rural">Rural</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Solo fields: Inspection Date & Master Plan Zoning */}
            <div className="grid md:grid-cols-2 gap-4 text-black [&_label]:!text-black">
              <Field label="Date of Inspection / Site visit (DD/MM/YYYY)">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    className={`${inputCls} bg-slate-100 text-black cursor-not-allowed font-semibold pr-8`}
                    value={fields.dateOfInspection || fields.dateOfInspectionSite || ''}
                    disabled
                    readOnly
                    placeholder="DD/MM/YYYY"
                  />
                  <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1 Date of Inspection / Site visit">
                    🔒
                  </span>
                </div>
                <span className="text-[11px] text-black font-medium mt-1 block">
                  Referenced from Sec 1 (Date of Inspection / Site visit)
                </span>
              </Field>
              <Field label="Location/Zoning as per Master Plan">
                <input className={inputCls} value={fields.locationZoningMasterPlan || ''} onChange={e => handleChange('locationZoningMasterPlan', e.target.value)} disabled={isReadOnly} placeholder="NA" />
              </Field>
            </div>

            {/* Category 2: Occupancy & Usage */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Occupation Status">
                  <select className={selectCls} value={fields.occupationStatus || ''} onChange={e => handleChange('occupationStatus', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Self Occupied">Self Occupied</option>
                    <option value="Tenant Occupied">Tenant Occupied</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="Property Usage">
                  <select className={selectCls} value={fields.propertyUsage || ''} onChange={e => handleChange('propertyUsage', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Industrial">Industrial</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Category 3: Demarcation & Site Identification */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Plot Demarcation">
                  <select className={selectCls} value={fields.plotDemarcation || ''} onChange={e => handleChange('plotDemarcation', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="Property Identifiable">
                  <select className={selectCls} value={fields.propertyIdentifiable || ''} onChange={e => handleChange('propertyIdentifiable', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="Identified Through">
                  <select className={selectCls} value={fields.identifiedThrough || ''} onChange={e => handleChange('identifiedThrough', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Customer">Customer</option>
                    <option value="Document">Document</option>
                    <option value="Map">Map</option>
                    <option value="GPS Coordinates">GPS Coordinates</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="Within MC / GP Limit & Distance From Nearest M.C">
                  <input className={inputCls} value={fields.withinMCLimit || ''} onChange={e => handleChange('withinMCLimit', e.target.value)} disabled={isReadOnly} placeholder="e.g. Within GP Limit / NA" />
                </Field>
              </div>
            </div>

            {/* Category 4: Structure, Floors & Finishing Specifications */}
            <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Internal Finishing">
                  <select className={selectCls} value={fields.internalFinishing || ''} onChange={e => handleChange('internalFinishing', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Average">Average</option>
                    <option value="Good">Good</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="Type of Structure">
                  <select className={selectCls} value={fields.typeOfStructure || ''} onChange={e => handleChange('typeOfStructure', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="RCC">RCC</option>
                    <option value="Load Bearing">Load Bearing</option>
                    <option value="Pre-Engineered">Pre-Engineered</option>
                    <option value="Steel">Steel</option>
                    <option value="Timber">Timber</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="No. of Floors in the building">
                  <input className={inputCls} value={fields.noOfFloors || ''} onChange={e => handleChange('noOfFloors', e.target.value)} disabled={isReadOnly} placeholder="e.g. GF, G+1 / NA" />
                </Field>
                <Field label="Located on Floor No.">
                  <input className={inputCls} value={fields.locatedOnFloorNo || ''} onChange={e => handleChange('locatedOnFloorNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. GF / NA" />
                </Field>
                <Field label="Total No. of Flats / Unit in building">
                  <input type="text" inputMode="numeric" className={inputCls} value={fields.totalFlatsUnits || ''} onChange={e => handleChange('totalFlatsUnits', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1 / NA" />
                </Field>
                <Field label="External Finishing">
                  <select className={selectCls} value={fields.externalFinishing || ''} onChange={e => handleChange('externalFinishing', e.target.value)} disabled={isReadOnly}>
                    <option value="">Select...</option>
                    <option value="Average">Average</option>
                    <option value="Good">Good</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="External Finishing Detail">
                    <input className={inputCls} value={fields.externalFinishingDetail || ''} onChange={e => handleChange('externalFinishingDetail', e.target.value)} disabled={isReadOnly} placeholder="e.g. Average / NA" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Category 5: Completion & Construction Progress */}
            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Year of Completion of Property">
                  <input type="text" inputMode="numeric" className={inputCls} value={fields.yearOfCompletion || ''} onChange={e => handleChange('yearOfCompletion', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2018 / NA" />
                </Field>
                <Field label="Construction Stage of the Property (in 100%)">
                  <input type="text" inputMode="decimal" className={inputCls} value={fields.constructionStage || ''} onChange={e => handleChange('constructionStage', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100%" />
                </Field>
                <Field label="Disbursement Recommended (in %)">
                  <input type="text" inputMode="decimal" className={inputCls} value={fields.disbursementRecommended || ''} onChange={e => handleChange('disbursementRecommended', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100%" />
                </Field>
              </div>
            </div>

            {/* Category 6: Property Age & Physical Life */}
            <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Age of the Property">
                  <input type="text" className={inputCls} value={fields.ageOfProperty || ''} onChange={e => handleChange('ageOfProperty', e.target.value)} disabled={isReadOnly} placeholder="e.g. 7 Years" />
                </Field>
                <Field label="Future Physical Life of Property">
                  <input type="text" className={inputCls} value={fields.futurePhysicalLife || ''} onChange={e => handleChange('futurePhysicalLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 53 Years" />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 3: BOUNDARIES ════ */}
        <Section title="BOUNDARIES" number={3} id="sec-3">
          <div className="space-y-4">
            {/* Column headers */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="font-semibold text-sm text-black">Source</div>
              <div className="font-semibold text-sm text-black">North</div>
              <div className="font-semibold text-sm text-black">South</div>
              <div className="font-semibold text-sm text-black">East</div>
              <div className="font-semibold text-sm text-black">West</div>
            </div>
            {/* As per Documents */}
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-semibold text-black bg-slate-100 rounded px-2 py-1">As per Documents (Sale Deed)</div>
              {(['boundaryNorthDocs', 'boundarySouthDocs', 'boundaryEastDocs', 'boundaryWestDocs'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="Not provided" />
              ))}
            </div>
            {/* As per Sketch Map */}
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-semibold text-black bg-slate-100 rounded px-2 py-1">As per Sketch Map</div>
              {(['boundaryNorthSketch', 'boundarySouthSketch', 'boundaryEastSketch', 'boundaryWestSketch'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="" />
              ))}
            </div>
            {/* As per Site / Actual */}
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-semibold text-black bg-slate-100 rounded px-2 py-1">As per Site / Actual</div>
              {(['boundaryNorthSite', 'boundarySouthSite', 'boundaryEastSite', 'boundaryWestSite'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="" />
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Boundaries Matching">
                <select className={selectCls} value={fields.boundariesMatching || 'Yes'} onChange={e => handleChange('boundariesMatching', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {fields.boundariesMatching !== 'No' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                    PDF remark: &quot;Boundary is matching as per sketch map&quot;
                  </p>
                )}
              </Field>
              {fields.boundariesMatching === 'No' && (
                <Field label="If No, reason thereon">
                  <input className={inputCls} value={fields.boundariesNotMatchingReason || ''} onChange={e => handleChange('boundariesNotMatchingReason', e.target.value)} disabled={isReadOnly} placeholder="Reason for mismatch" />
                </Field>
              )}
            </div>
          </div>
        </Section>

        {/* ════ SECTION 4: SETBACKS / MARGIN ════ */}
        <Section title="SETBACKS / MARGIN" number={4} id="sec-4">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider w-2/5">
                      Setbacks / Margin in the Building (in Ft)
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Front</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Rear</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Left Side</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Right Side</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50/60 border-b border-[#e9ecef]">
                      As per sanctioned / permissible byelaws
                    </td>
                    {(['setbackFrontSanctioned', 'setbackRearSanctioned', 'setbackLeftSanctioned', 'setbackRightSanctioned'] as const).map(k => (
                      <td key={k} className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input type="text" inputMode="decimal" className={inputCls + ' !py-1.5 text-xs text-center font-medium'} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="NA" />
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50/60 border-b border-[#e9ecef]">
                      As per Site / Actual
                    </td>
                    {(['setbackFrontSite', 'setbackRearSite', 'setbackLeftSite', 'setbackRightSite'] as const).map(k => (
                      <td key={k} className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input type="text" inputMode="decimal" className={inputCls + ' !py-1.5 text-xs text-center font-medium'} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="" />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 5: HEIGHT / STOREYS ════ */}
        <Section title="HEIGHT / STOREYS" number={5} id="sec-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="As per sanctioned / permissible byelaws">
              <input className={inputCls} value={fields.heightSanctioned || ''} onChange={e => handleChange('heightSanctioned', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <Field label="As per Site / Actual">
              <input className={inputCls} value={fields.heightSite || ''} onChange={e => handleChange('heightSite', e.target.value)} disabled={isReadOnly} placeholder="e.g. GF" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 6: BUA & ACCOMMODATION DETAILS ════ */}
        <Section title="BUILT-UP AREA & ACCOMMODATION DETAILS" number={6} id="sec-6">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Floor</th>
                    <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Accommodation</th>
                    <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider">Carpet Area (Sft)</th>
                    <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider">Actual BUA / SBUA (Sft)</th>
                    <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider">Permissible BUA (Sft)</th>
                    <th className="px-3 py-2.5 text-right font-bold text-xs uppercase tracking-wider text-emerald-400">Adopted BUA (Sft)</th>
                    {!isReadOnly && <th className="px-2 py-2.5 w-10 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.buaFloors || []).map((fl, idx) => (
                    <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          className={inputCls + ' !py-1.5 text-xs font-normal text-[#0f2038]'}
                          value={fl.floor || ''}
                          onChange={e => handleBUAFloorChange(idx, 'floor', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. Ground Floor"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          className={inputCls + ' !py-1.5 text-xs'}
                          value={fl.accommodation || ''}
                          onChange={e => handleBUAFloorChange(idx, 'accommodation', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. Residential / 1 Hall, 2 BHK"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls + ' !py-1.5 text-xs text-right font-medium'}
                          value={isReadOnly && !fl.carpetArea ? 'NA' : (fl.carpetArea || '')}
                          onChange={e => handleBUAFloorChange(idx, 'carpetArea', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls + ' !py-1.5 text-xs text-right font-medium'}
                          value={isReadOnly && !fl.actualBUA ? 'NA' : (fl.actualBUA || '')}
                          onChange={e => handleBUAFloorChange(idx, 'actualBUA', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls + ' !py-1.5 text-xs text-right font-medium'}
                          value={isReadOnly && !fl.permissibleBUA ? 'NA' : (fl.permissibleBUA || '')}
                          onChange={e => handleBUAFloorChange(idx, 'permissibleBUA', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls + ' !py-1.5 text-xs text-right font-bold text-emerald-700 bg-emerald-50/50'}
                          value={isReadOnly && !fl.adoptedBUA ? 'NA' : (fl.adoptedBUA || '')}
                          onChange={e => handleBUAFloorChange(idx, 'adoptedBUA', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBUAFloor(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer p-1"
                            title="Remove Floor"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {(fields.buaFloors || []).length > 0 && (
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td className="px-3 py-2.5 text-slate-800 font-bold uppercase tracking-wider">
                        Total
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-normal text-center">
                        NA
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-800 font-bold">
                        {totalCarpet > 0 ? formatExactDecimal(totalCarpet) : 'NA'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-800 font-bold">
                        {totalActualBUA > 0 ? formatExactDecimal(totalActualBUA) : 'NA'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-800 font-bold">
                        {totalPermissibleBUA > 0 ? formatExactDecimal(totalPermissibleBUA) : 'NA'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-700 font-bold text-sm bg-emerald-50/70">
                        {totalAdoptedBUA > 0 ? `${formatExactDecimal(totalAdoptedBUA)} Sft` : 'NA'}
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddBUAFloor}
                className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1 cursor-pointer transition-colors"
              >
                <span className="text-lg leading-none font-bold">+</span> Add Floor Details
              </button>
            )}

            <Field label="Violation observed if any">
              <input
                className={inputCls}
                value={fields.violationObserved || ''}
                onChange={e => handleChange('violationObserved', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. No violation observed / As per local bye-laws"
              />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 7: PLAN APPROVALS ════ */}
        <Section title="PLAN APPROVALS BP NOT PROVIDED" number={7} id="sec-7">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Construction as per approved / sanctioned plans">
              <select className={selectCls} value={fields.constructionAsPerPlan || 'NA'} onChange={e => handleChange('constructionAsPerPlan', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Details of approved plan with approval no. and date">
              <input className={inputCls} value={fields.approvedPlanDetails || ''} onChange={e => handleChange('approvedPlanDetails', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Construction permission Number and date">
              <input className={inputCls} value={fields.constructionPermissionNumberDate || ''} onChange={e => handleChange('constructionPermissionNumberDate', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <Field label="Violations Observed if Any">
              <input className={inputCls} value={fields.violationsObserved || ''} onChange={e => handleChange('violationsObserved', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <div className="md:col-span-2">
              <Field label="If plans not available, is the structure confirming to local byelaws?">
                <select className={selectCls} value={fields.structureConfirmingByelaws || 'NA'} onChange={e => handleChange('structureConfirmingByelaws', e.target.value)} disabled={isReadOnly}>
                  <option value="NA">NA</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 8: ESTIMATE ANALYSIS ════ */}
        <Section title="ESTIMATE ANALYSIS (APPLICABLE ONLY IN SELF CONSTRUCTION CASES)" number={8} id="sec-8">
          <div className="space-y-4">
            {/* Soft Container 1: Estimated Cost */}
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Estimated Cost (In Rs)">
                  <input type="text" inputMode="decimal" className={inputCls} value={fields.estimatedCostTotal || ''} onChange={e => handleChange('estimatedCostTotal', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                </Field>
                <Field label="Estimated Cost (in Rs per Sqft)">
                  <input type="text" inputMode="decimal" className={inputCls} value={fields.estimatedCostPerSqft || ''} onChange={e => handleChange('estimatedCostPerSqft', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                </Field>
              </div>
            </div>

            {/* Soft Container 2: Justified & Adoptable Cost */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 shadow-xs text-black [&_label]:!text-black">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Justified Estimated Cost (in Rs per Sqft)">
                  <input type="text" inputMode="decimal" className={inputCls} value={fields.justifiedEstimatedCostPerSqft || ''} onChange={e => handleChange('justifiedEstimatedCostPerSqft', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                </Field>
                <Field label="Adoptable / Justified Estimated Cost (In Rs)">
                  <input type="text" inputMode="decimal" className={inputCls} value={fields.adoptableJustifiedEstimatedCost || ''} onChange={e => handleChange('adoptableJustifiedEstimatedCost', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 9: VALUATION OF PROPERTY ════ */}
        <Section title={"VALUATION OF PROPERTY\n(FAIR MARKET VALUATION / DISTRESS VALUATION)"} number={9} id="sec-9">
          <div className="space-y-4">
            {/* Top Row: Land Valuation & Building Valuation side-by-side soft containers */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left Soft Container: Land Valuation */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 shadow-xs space-y-4 text-black [&_label]:!text-black">
                <div className="border-b border-amber-200/80 pb-2">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                    Land Valuation
                  </h3>
                </div>
                <div className="space-y-4">
                  <Field label="Land Area (In Sqft)">
                    <input type="text" inputMode="decimal" className={inputCls} value={fields.landAreaSqft || ''} onChange={e => handleChange('landAreaSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 8276" />
                  </Field>
                  <Field label="Current Market Rate of land (Range) in Rs per Sqft">
                    <input type="text" className={inputCls} value={fields.currentMarketRateRange || ''} onChange={e => handleChange('currentMarketRateRange', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100-200" />
                  </Field>
                  <Field label="Recommended Rate of Land (Rs per sqft)">
                    <input type="text" inputMode="decimal" className={inputCls} value={fields.recommendedRateOfLand || ''} onChange={e => handleChange('recommendedRateOfLand', e.target.value)} disabled={isReadOnly} placeholder="e.g. 150" />
                  </Field>
                  <Field label="Total Land Value (in Rs)">
                    <input className={`${inputCls} bg-yellow-50 font-bold text-black`} value={fields.totalLandValue || ''} onChange={e => handleChange('totalLandValue', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
                  </Field>
                </div>
              </div>

              {/* Right Soft Container: Building Valuation */}
              <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/80 shadow-xs space-y-4 text-black [&_label]:!text-black">
                <div className="border-b border-sky-200/80 pb-2">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                    Building Valuation
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-black">
                      <span>Adoptable Built-up Area (in Sqft)</span>
                      <span className="text-[11px] font-medium text-black">Floor / Structure Spec</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls}
                          value={fields.adoptableBuiltUpArea || ''}
                          onChange={e => handleChange('adoptableBuiltUpArea', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Area e.g. 1128"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          className={inputCls + ' font-medium text-center text-black'}
                          value={fields.adoptableBUASpec !== undefined ? fields.adoptableBUASpec : 'GF RCC'}
                          onChange={e => handleChange('adoptableBUASpec', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. GF RCC"
                          title="Floor / Structure specification (will appear in report label)"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-black font-medium italic">
                      Renders as: &quot;Adoptable Built-up Area (in Sqft){(fields.adoptableBUASpec !== undefined ? fields.adoptableBUASpec : 'GF RCC').trim() ? ` ${(fields.adoptableBUASpec !== undefined ? fields.adoptableBUASpec : 'GF RCC').trim()}` : ''}&quot;
                    </p>
                  </div>
                  <Field label="Construction Cost (Rs per sft)">
                    <input type="text" inputMode="decimal" className={inputCls} value={fields.constructionCostPerSqft || ''} onChange={e => handleChange('constructionCostPerSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1300" />
                  </Field>
                  <Field label="Total Construction Value for 100% complete building (in Rs)">
                    <input
                      className={`${inputCls} bg-yellow-50 font-bold text-black`}
                      value={fields.totalConstructionValue100 || ''}
                      onChange={e => handleChange('totalConstructionValue100', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </Field>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-black">
                      Total Construction Value for Present Construction Stage (in Rs)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-2 space-y-1">
                        <span className="text-[11px] font-semibold text-black block">
                          Work Done (%)
                        </span>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${inputCls} pr-7 font-bold text-black text-center`}
                            value={(fields.constructionStage || '').replace('%', '')}
                            onChange={e => handleChange('constructionStage', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="e.g. 100"
                            title="Enter percentage of work completed (positive float, no negative values)"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-black pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <span className="text-[11px] font-semibold text-black block">
                          Present Value (in Rs)
                        </span>
                        <input
                          className={`${inputCls} bg-yellow-50 font-bold text-black`}
                          value={fields.totalConstructionValuePresent || ''}
                          placeholder="Auto-calculated"
                          readOnly
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-black font-medium italic">
                      Auto-calculated from {fields.constructionStage ? `${(fields.constructionStage || '').replace(/[^0-9.]/g, '')}%` : '100%'} of 100% complete building value ({fields.totalConstructionValue100 || '0'} Rs)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Soft Container: Market Value of Land & Building Only */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 shadow-xs space-y-4 text-black [&_label]:!text-black">
              <div className="border-b border-emerald-200/80 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                  Market Value of Land & Building Only
                </h3>
                <span className="text-[11px] font-bold text-black bg-emerald-200/90 px-2 py-0.5 rounded-full">
                  Auto-Calculated
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Field label="Market Value for 100% Complete Property (in Rs)">
                    <input
                      className={`${inputCls} bg-green-50 font-bold text-black`}
                      value={fields.marketValueLandBuilding || ''}
                      disabled={isReadOnly}
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    Referenced from: Land Value ({fields.totalLandValue || '0'} Rs) + 100% Construction Value ({fields.totalConstructionValue100 || '0'} Rs)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Field label="Market Value for Present Stage Completed Property (in Rs)">
                    <input
                      className={`${inputCls} bg-green-50 font-bold text-black`}
                      value={fields.marketValueLandBuildingRight || ''}
                      disabled={isReadOnly}
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    Referenced from: Land Value ({fields.totalLandValue || '0'} Rs) + Present Stage Construction Value ({fields.totalConstructionValuePresent || '0'} Rs) based on {(fields.constructionStage || '100%').replace(/[^0-9.]/g, '') || '100'}% work completed
                  </p>
                </div>
              </div>
            </div>

            {/* Soft Container: Distress Value of Property */}
            <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200/80 shadow-xs space-y-4 text-black [&_label]:!text-black">
              <div className="border-b border-orange-200/80 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                  Distress Value of Property
                </h3>
                <span className="text-[11px] font-bold text-black bg-orange-200/90 px-2 py-0.5 rounded-full">
                  Auto-Calculated
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-black">
                    <span>Distress Value of 100% complete property @</span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-16 text-center py-0.5 px-1 pr-5 text-xs font-bold text-black bg-white border border-orange-300 rounded shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                        value={fields.distressPct100 !== undefined && fields.distressPct100 !== null && fields.distressPct100 !== '' ? fields.distressPct100 : '0'}
                        onChange={e => handleChange('distressPct100', e.target.value)}
                        onBlur={() => { if (!fields.distressPct100) handleChange('distressPct100', '0'); }}
                        disabled={isReadOnly}
                        placeholder="0"
                        title="Enter percentage of MV for 100% complete property"
                      />
                      <span className="absolute right-1 text-[11px] font-bold text-black pointer-events-none">%</span>
                    </div>
                    <span>of MV</span>
                  </div>
                  <input
                    className={`${inputCls} bg-orange-50 font-bold text-black`}
                    value={fields.distressValue100 || ''}
                    disabled={isReadOnly}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                  <p className="text-[11px] text-black font-medium italic">
                    Auto-calculated as {(fields.distressPct100 !== undefined && fields.distressPct100 !== null && fields.distressPct100 !== '') ? fields.distressPct100 : '0'}% of 100% complete MV ({fields.marketValueLandBuilding || '0'} Rs)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-black">
                    <span>Distress Value of present completed property @</span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-16 text-center py-0.5 px-1 pr-5 text-xs font-bold text-black bg-white border border-orange-300 rounded shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-orange-400"
                        value={fields.distressPctPresent !== undefined && fields.distressPctPresent !== null && fields.distressPctPresent !== '' ? fields.distressPctPresent : '0'}
                        onChange={e => handleChange('distressPctPresent', e.target.value)}
                        onBlur={() => { if (!fields.distressPctPresent) handleChange('distressPctPresent', '0'); }}
                        disabled={isReadOnly}
                        placeholder="0"
                        title="Enter percentage of MV for present completed property"
                      />
                      <span className="absolute right-1 text-[11px] font-bold text-black pointer-events-none">%</span>
                    </div>
                    <span>of MV</span>
                  </div>
                  <input
                    className={`${inputCls} bg-orange-50 font-bold text-black`}
                    value={fields.distressValuePresent || ''}
                    disabled={isReadOnly}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                  <p className="text-[11px] text-black font-medium italic">
                    Auto-calculated as {(fields.distressPctPresent !== undefined && fields.distressPctPresent !== null && fields.distressPctPresent !== '') ? fields.distressPctPresent : '0'}% of present stage MV ({fields.marketValueLandBuildingRight || '0'} Rs)
                  </p>
                </div>
              </div>
            </div>

            {/* Soft Container: Flat / Apartment / Shop / Office Valuation */}
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80 shadow-xs space-y-4 text-black [&_label]:!text-black">
              <div className="border-b border-indigo-200/80 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                  Flat / Apartment / Shop / Office Valuation
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-black">Status:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyNA = (fields.flatPropertyType === 'NA' || fields.flatSBUA === 'NA');
                      handleChange('flatPropertyType', isCurrentlyNA ? 'Flat' : 'NA');
                    }}
                    disabled={isReadOnly}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-all ${
                      (fields.flatPropertyType === 'NA' || fields.flatSBUA === 'NA')
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {(fields.flatPropertyType === 'NA' || fields.flatSBUA === 'NA') ? 'NA Active (Click to Enable)' : '✓ Applicable (Click for NA)'}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Dropdown to select option + input for Sqft */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-black">
                    <span className={(fields.flatPropertyType || (fields.flatSBUA === 'NA' ? 'NA' : 'Flat')) === 'Flat' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Flat</span>
                    {' / '}
                    <span className={fields.flatPropertyType === 'Apartment' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Apartment</span>
                    {' / '}
                    <span className={fields.flatPropertyType === 'Shop' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Shop</span>
                    {' / '}
                    <span className={fields.flatPropertyType === 'Office' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Office</span>
                    {' SBUA (in Sqft)'}
                  </label>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <select
                        className={selectCls}
                        value={fields.flatPropertyType || (fields.flatSBUA === 'NA' ? 'NA' : 'Flat')}
                        onChange={e => handleChange('flatPropertyType', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="NA">NA</option>
                        <option value="Flat">Flat</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Shop">Shop</option>
                        <option value="Office">Office</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputCls}
                        value={fields.flatSBUA || ''}
                        onChange={e => handleChange('flatSBUA', e.target.value)}
                        disabled={isReadOnly || fields.flatPropertyType === 'NA'}
                        placeholder={fields.flatPropertyType === 'NA' ? 'NA' : 'Area in Sqft e.g. 1050'}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-black font-medium italic">
                    {(fields.flatPropertyType === 'NA' || fields.flatSBUA === 'NA')
                      ? 'Status: NA'
                      : <><strong className="font-black not-italic">{fields.flatPropertyType || 'Flat'}</strong>{' selected — bolded in rendered report'}</>}
                  </p>
                </div>

                {/* Composite sale rate */}
                <div className="space-y-1.5">
                  <Field label="Composite sale rate (Rs per sqft)">
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputCls}
                      value={fields.compositeSaleRate || ''}
                      onChange={e => handleChange('compositeSaleRate', e.target.value)}
                      disabled={isReadOnly || fields.flatPropertyType === 'NA'}
                      placeholder={fields.flatPropertyType === 'NA' ? 'NA' : 'e.g. 3500'}
                    />
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    {(fields.flatPropertyType === 'NA' || fields.compositeSaleRate === 'NA') ? 'Status: NA' : 'Rate per sqft for composite valuation'}
                  </p>
                </div>

                {/* Total Market Value of Apartment / Shop / Flat / Office (Rs per sqft) */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-black">
                    {'Total Market Value of '}
                    <span className={fields.flatPropertyType === 'Apartment' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Apartment</span>
                    {' / '}
                    <span className={fields.flatPropertyType === 'Shop' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Shop</span>
                    {' / '}
                    <span className={(fields.flatPropertyType || (fields.flatSBUA === 'NA' ? 'NA' : 'Flat')) === 'Flat' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Flat</span>
                    {' / '}
                    <span className={fields.flatPropertyType === 'Office' ? 'font-black text-black underline decoration-black underline-offset-2' : 'font-medium text-black'}>Office</span>
                    {' (Rs per sqft)'}
                  </label>
                  <input
                    className={`${inputCls} bg-white font-bold text-black border border-indigo-300`}
                    value={fields.totalMarketValueApartment || 'NA'}
                    disabled={isReadOnly}
                    placeholder="Auto-calculated"
                    readOnly
                  />
                  <p className="text-[11px] text-black font-medium italic">
                    {(fields.flatPropertyType === 'NA' || fields.flatSBUA === 'NA' || fields.totalMarketValueApartment === 'NA')
                      ? 'Referenced from above: Property is NA (Not Applicable)'
                      : <><strong className="font-black not-italic">{fields.flatPropertyType || 'Flat'}</strong>{` SBUA (${fields.flatSBUA || '0'} sqft) × Composite sale rate (${fields.compositeSaleRate || '0'} Rs/sqft)`}</>}
                  </p>
                </div>
              </div>
            </div>

            {/* Soft Container: Government Guideline / Circle Rate Valuation */}
            <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200/80 shadow-xs space-y-4 text-black [&_label]:!text-black">
              <div className="border-b border-teal-200/80 pb-2">
                <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                  Government Guideline / Circle Rate Valuation
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Government Guideline / Circle rate for Land */}
                <div className="space-y-1.5">
                  <Field label="Government Guideline / Circle rate for Land (Rs per sqft)">
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputCls}
                      value={fields.govtGuidelineRateLand || ''}
                      onChange={e => handleChange('govtGuidelineRateLand', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 28.00"
                    />
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    Guideline / circle rate per sqft for land valuation
                  </p>
                </div>

                {/* Land Value as per Government Rate (Auto-calculated) */}
                <div className="space-y-1.5">
                  <Field label="Land Value as per Government Rate (Rs)">
                    <input
                      className={`${inputCls} bg-white font-bold text-black border border-teal-300`}
                      value={fields.landValueGovtRate || ''}
                      disabled={isReadOnly}
                      placeholder="Auto-calculated"
                      readOnly
                    />
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    {fields.govtGuidelineRateLand && fields.landAreaSqft
                      ? `Auto-calculated & referenced from: Land Area (${fields.landAreaSqft} sqft) × Govt Guideline Rate for Land (${fields.govtGuidelineRateLand} Rs/sqft)`
                      : 'Auto-calculated: uses Land Area (In Sqft) × Govt Guideline rate for Land'}
                  </p>
                </div>

                {/* Government Guideline / Circle rate for Flats */}
                <div className="space-y-1.5">
                  <Field label="Government Guideline / Circle rate for Flats (Rs per sqft)">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputCls}
                        value={fields.govtGuidelineRateFlats || ''}
                        onChange={e => handleChange('govtGuidelineRateFlats', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="NA"
                      />
                      <button
                        type="button"
                        onClick={() => handleChange('govtGuidelineRateFlats', fields.govtGuidelineRateFlats === 'NA' ? '' : 'NA')}
                        disabled={isReadOnly}
                        className="absolute right-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 hover:bg-slate-300 text-black transition-colors"
                        title="Toggle NA"
                      >
                        {fields.govtGuidelineRateFlats === 'NA' ? 'Clear NA' : 'Set NA'}
                      </button>
                    </div>
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    {fields.govtGuidelineRateFlats === 'NA' ? 'Status: NA (Not applicable)' : 'Rate per sqft for flats/apartments'}
                  </p>
                </div>

                {/* Flat / Apartment Value as per Government Rate (Auto-calculated) */}
                <div className="space-y-1.5">
                  <Field label="Flat / Apartment Value as per Government Rate (Rs)">
                    <input
                      className={`${inputCls} bg-white font-bold text-black border border-teal-300`}
                      value={fields.flatValueGovtRate || 'NA'}
                      disabled={isReadOnly}
                      placeholder="NA"
                      readOnly
                    />
                  </Field>
                  <p className="text-[11px] text-black font-medium italic">
                    {fields.govtGuidelineRateFlats === 'NA' || fields.flatValueGovtRate === 'NA'
                      ? 'Referenced from above: Govt Guideline Rate for Flats is NA'
                      : (fields.govtGuidelineRateFlats && (fields.adoptableBuiltUpArea || fields.flatSBUA)
                          ? `Auto-calculated & referenced from: Adoptable Built-up Area (${fields.adoptableBuiltUpArea || fields.flatSBUA} sqft) × Govt Guideline Rate for Flats (${fields.govtGuidelineRateFlats} Rs/sqft)`
                          : 'Auto-calculated: uses Adoptable Built-up Area (in Sqft) × Govt Guideline rate for Flats')}
                  </p>
                </div>
              </div>
            </div>
              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3 text-black [&_label]:!text-black">
                <div className="border-b border-amber-200/80 pb-2">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                    Geo Coordinates (GPS Location)
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Latitude (N)">
                    <input type="text" inputMode="decimal" className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 21.1705" />
                  </Field>
                  <Field label="Longitude (E)">
                    <input type="text" inputMode="decimal" className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 86.492417" />
                  </Field>
                </div>
              </div>
            </div>
        </Section>

        {/* ════ SECTION 10: REMARKS ════ */}
        <Section title="PROPERTY SPECIFIC REMARKS & OBSERVATION" number={10} id="sec-10">
          <Field label="Remarks / Observation">
            <textarea
              rows={5}
              className={inputCls}
              value={fields.remarks || ''}
              onChange={e => handleChange('remarks', e.target.value)}
              disabled={isReadOnly}
              placeholder="Describe the property observations, access, amenities, and basis of valuation..."
            />
          </Field>
        </Section>

        {/* ════ SECTION 11: VALUER CERTIFICATION ════ */}
        <Section title="VALUER CERTIFICATION" number={11} id="sec-11">
          <div className="grid md:grid-cols-2 gap-4 text-black [&_label]:!text-black">
            <Field label="Date of Visit (DD/MM/YYYY)">
              <div className="relative flex items-center">
                <input
                  type="text"
                  className={`${inputCls} bg-slate-100 text-black cursor-not-allowed font-semibold pr-8`}
                  value={fields.dateOfInspection || fields.dateOfVisit || ''}
                  disabled
                  readOnly
                  placeholder="DD/MM/YYYY"
                />
                <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1 Date of Inspection / Site visit">
                  🔒
                </span>
              </div>
              <span className="text-[11px] text-black font-medium mt-1 block">
                Referenced from Sec 1 (Date of Inspection / Site visit)
              </span>
            </Field>

            <DateInput fieldKey="dateOfReportSubmission" label="Date of Report Submission (DD/MM/YYYY)" />

            <Field label="Name of Engineer Visited the property">
              <input className={inputCls} value={fields.visitingEngineer || ''} onChange={e => handleChange('visitingEngineer', e.target.value)} disabled={isReadOnly} placeholder="Auto-filled from field inspector" />
            </Field>

            <Field label="Authorized Signatory Name & Signature">
              <div className="relative flex items-center">
                <input
                  type="text"
                  className={`${inputCls} bg-slate-100 text-black cursor-not-allowed font-semibold pr-8`}
                  value={fields.authorizedSignatory || 'Er. Satyajit Mohanty'}
                  disabled
                  readOnly
                  placeholder="Er. Satyajit Mohanty"
                />
                <span className="absolute right-2.5 text-xs text-black" title="Locked: Authorized Signatory">
                  🔒
                </span>
              </div>
              <span className="text-[11px] text-black font-medium mt-1 block">
                Statutory signatory locked
              </span>
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 12: PROPERTY PHOTOGRAPHS ════ */}
        <Section title="PROPERTY PHOTOGRAPHS" number={12} id="sec-12">
          {/* Header Reference Card (Printed Above Photos in Bank Report) */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3 mb-4 text-black [&_label]:!text-black">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
                <span>📋</span> Header Reference Details (Printed Above Images in Bank Report)
              </h4>
              <span className="text-[10px] font-bold text-black bg-slate-200 px-2 py-0.5 rounded-full">
                Referenced from Sec 1
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Field label="Name of the Customer/ Applicant">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.customerName || ''}
                      disabled
                      readOnly
                      placeholder="Referenced from Sec 1"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 1: Name of Customer/Applicant & Contact Details
                </p>
              </div>

              <div className="space-y-1">
                <Field label="Proposal No.">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.proposalNo || 'NA'}
                      disabled
                      readOnly
                      placeholder="NA"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 1: Proposal No.
                </p>
              </div>

              <div className="md:col-span-2 space-y-1">
                <Field label="Address of the property being appraised">
                  <div className="relative flex items-center">
                    <textarea
                      rows={2}
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed resize-none`}
                      value={fields.addressAsPerActualSite || fields.addressAsPerDocument || fields.addressAsPerTRF || ''}
                      disabled
                      readOnly
                      placeholder="Referenced from Sec 1"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-black" title="Locked: Referenced from Section 1">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 1: Address of the property being appraised
                </p>
              </div>
            </div>
          </div>

          {/* Photographs Gallery & Upload */}
          <BasePhotographsSection
            title="Property Photographs"
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages.length}
            onImageNameChange={(idx, name) => {
              const updated = [...(fields.propertyImageNames || [])];
              while (updated.length <= idx) updated.push('');
              updated[idx] = name;
              handleChange('propertyImageNames', updated);
            }}
            onRemoveImage={handlePhotoRemove}
            onReorderImages={handleReorderPhotos}
            onUploadImages={handlePhotoUpload}
            onOpenBucketPicker={() => setBucketPickerOpen(true)}
            sectionNumber={12}
            sectionId="sec-12"
            withoutSectionWrapper={true}
          />

          {/* Footer Reference Card (Printed Below Images in Bank Report) */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3 mt-4 text-black [&_label]:!text-black">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
                <span>✍️</span> Signatory & Inspection Details (Printed Below Images in Bank Report)
              </h4>
              <span className="text-[10px] font-bold text-black bg-slate-200 px-2 py-0.5 rounded-full">
                Referenced from Sec 11 (Valuer Certification)
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Field label="Name of Engineer Visted the property">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.visitingEngineer || ''}
                      disabled
                      readOnly
                      placeholder="Referenced from Sec 11"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 11">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 11 (Valuer Certification): Name of Engineer Visited the property
                </p>
              </div>

              <div className="space-y-1">
                <Field label="Authorized Signatory Name & Signature">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.authorizedSignatory || 'Er. Satyajit Mohanty'}
                      disabled
                      readOnly
                      placeholder="Er. Satyajit Mohanty"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 11">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 11 (Valuer Certification): Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </Section>
        {bucketPickerOpen && (
          <BasePhotoBucketModal
            isOpen={bucketPickerOpen}
            bucketImages={bucketImages}
            onConfirm={handleBucketConfirm}
            onClose={() => setBucketPickerOpen(false)}
          />
        )}

        {/* ════ SECTION 13: MAPS ════ */}
        <Section title="LOCATION CUM ROUTE MAP SHOWING PROPERTY BOUNDARIES" number={13} id="sec-13">
          {/* Header Reference Card (Printed Above Maps in Bank Report) */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3 mb-4 text-black [&_label]:!text-black">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
                <span>📋</span> Header Reference Details (Printed Above Maps in Bank Report)
              </h4>
              <span className="text-[10px] font-bold text-black bg-slate-200 px-2 py-0.5 rounded-full">
                Referenced from Sec 1
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Field label="Name of the Customer/ Applicant">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.customerName || ''}
                      disabled
                      readOnly
                      placeholder="Referenced from Sec 1"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 1: Name of Customer/Applicant & Contact Details
                </p>
              </div>

              <div className="space-y-1">
                <Field label="Proposal No.">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.proposalNo || 'NA'}
                      disabled
                      readOnly
                      placeholder="NA"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 1: Proposal No.
                </p>
              </div>

              <div className="md:col-span-2 space-y-1">
                <Field label="Address of the property being appraised">
                  <div className="relative flex items-center">
                    <textarea
                      rows={2}
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed resize-none`}
                      value={fields.addressAsPerActualSite || fields.addressAsPerDocument || fields.addressAsPerTRF || ''}
                      disabled
                      readOnly
                      placeholder="Referenced from Sec 1"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-black" title="Locked: Referenced from Section 1">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 1: Address of the property being appraised
                </p>
              </div>
            </div>
          </div>

          {/* Maps Gallery & Upload */}
          <BaseMapsSection
            locationMapImages={fields.locationMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            latitude={fields.latitude}
            longitude={fields.longitude}
            propertyAddress={fields.addressAsPerActualSite || fields.addressAsPerDocument || fields.addressAsPerTRF || ''}
            hasExternalCoordinatesField={true}
            coordinatesSectionName="Section 9: Valuation of Property"
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={idx => handleMapRemove('locationMapImages', idx)}
            onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={idx => handleMapRemove('cadastralMapImages', idx)}
            onReorderLocationMap={newImgs => handleReorderMap('locationMapImages', newImgs)}
            onReorderCadastralMap={newImgs => handleReorderMap('cadastralMapImages', newImgs)}
            mapOrder={['location', 'cadastral']}
            sectionNumber={13}
            sectionId="sec-13"
            title="LOCATION CUM ROUTE MAP SHOWING PROPERTY BOUNDARIES"
            withoutSectionWrapper={true}
          />

          {/* Footer Reference Card (Printed Below Maps in Bank Report) */}
          <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3 mt-4 text-black [&_label]:!text-black">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <h4 className="text-xs font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
                <span>✍️</span> Signatory & Inspection Details (Printed Below Maps in Bank Report)
              </h4>
              <span className="text-[10px] font-bold text-black bg-slate-200 px-2 py-0.5 rounded-full">
                Referenced from Sec 11 (Valuer Certification)
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Field label="Name of Engineer Visted the property">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.visitingEngineer || ''}
                      disabled
                      readOnly
                      placeholder="Referenced from Sec 11"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 11">🔒</span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 11 (Valuer Certification): Name of Engineer Visited the property
                </p>
              </div>

              <div className="space-y-1">
                <Field label="Authorized Signatory Name & Signature">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black font-semibold pr-8 cursor-not-allowed`}
                      value={fields.authorizedSignatory || 'Er. Satyajit Mohanty'}
                      disabled
                      readOnly
                      placeholder="Er. Satyajit Mohanty"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Authorized Signatory">
                  🔒
                    </span>
                  </div>
                </Field>
                <p className="text-[11px] text-black font-medium italic">
                  Referenced from Sec 11 (Valuer Certification): Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Action Bar ── */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          message={message}
          loading={loading}
          autoSaveStatus={autoSaveStatus}
          onSaveDraft={handleSaveDraft}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
          onSubmit={handleSubmitForVerification}
        />
      </div>

      {/* ── Floating Navigator ── */}
      <FloatingNavigator sections={navSections} />
    </div>
  );
}
