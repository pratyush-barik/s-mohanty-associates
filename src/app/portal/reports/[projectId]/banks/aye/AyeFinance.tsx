'use client';

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
  PDFAyeFinanceRenderer,
  AyeFinanceFields,
  AyeBoundaryRow,
  AyeAreaRow,
} from '@/lib/banks/pdf-aye-finance-renderer';
import {
  Plus,
  Trash2,
  Coins,
  FileCheck,
  Calculator,
  RotateCcw,
} from 'lucide-react';

export const AYE_FINANCE_CONFIG: BankConfig = {
  bankId: 'AYE FINANCE LTD',
  subTemplateId: '',
  displayName: 'Aye Finance Ltd',
  defaultValues: {
    purpose: 'Mortgage / Fair Market Value for collateral security',
  },
  getPDFRenderer: (fields: any, projectCode?: string) =>
    new PDFAyeFinanceRenderer({ ...fields, projectCode }),
};

export interface AyeFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

const NAV_SECTIONS: NavItem[] = [
  { id: 'section-header', title: 'Header & Reference' },
  { id: 'section-1', title: 'General Details' },
  { id: 'section-1-b', title: 'Amenities & Boundaries' },
  { id: 'section-2', title: 'Structure & Specifications' },
  { id: 'section-3', title: 'Property Under Reference' },
  { id: 'section-4', title: 'Valuation Analysis' },
  { id: 'section-5', title: 'Marketability' },
  { id: 'section-6', title: 'Documents Submitted' },
  { id: 'section-7', title: 'Remarks & Observations' },
  { id: 'section-8', title: 'Declaration' },
  { id: 'sec-maps', title: 'Location Maps' },
  { id: 'sec-documents', title: 'Property Documents' },
  { id: 'sec-photos', title: 'Site Photographs' },
];

const EMPTY_BOUNDARIES: AyeBoundaryRow[] = [
  { direction: 'East', asPerSaleDeed: '', asPerSketchMap: '', asPerActualSite: '' },
  { direction: 'West', asPerSaleDeed: '', asPerSketchMap: '', asPerActualSite: '' },
  { direction: 'North', asPerSaleDeed: '', asPerSketchMap: '', asPerActualSite: '' },
  { direction: 'South', asPerSaleDeed: '', asPerSketchMap: '', asPerActualSite: '' },
];

const SAMPLE_BOUNDARIES: AyeBoundaryRow[] = [
  { direction: 'East', asPerSaleDeed: 'Plot No- 1892', asPerSketchMap: 'Plot no- 1796 Road', asPerActualSite: '20-ft wide Road' },
  { direction: 'West', asPerSaleDeed: 'Plot No- 1882', asPerSketchMap: 'Plot No- 1892/4552', asPerActualSite: 'Vacant Land' },
  { direction: 'North', asPerSaleDeed: 'Plot No- 1895', asPerSketchMap: 'Plot No- 1893 & 1894', asPerActualSite: 'Land of Binod Suhula' },
  { direction: 'South', asPerSaleDeed: 'Plot No- 1891', asPerSketchMap: 'Plot No- 1891', asPerActualSite: 'Building of Sachin Bag' },
];

const EMPTY_AREA_ROWS: AyeAreaRow[] = [
  { floor: 'Ground', measuredCarpetArea: '', buaAsPerDocuments: '', carpetAreaAsPerPlan: '' },
  { floor: 'First', measuredCarpetArea: '', buaAsPerDocuments: '', carpetAreaAsPerPlan: '' },
  { floor: 'Second', measuredCarpetArea: '', buaAsPerDocuments: '', carpetAreaAsPerPlan: '' },
  { floor: 'Total', measuredCarpetArea: '', buaAsPerDocuments: '', carpetAreaAsPerPlan: '' },
];

const SAMPLE_AREA_ROWS: AyeAreaRow[] = [
  { floor: 'Ground', measuredCarpetArea: '357 sqft', buaAsPerDocuments: '420 sqft', carpetAreaAsPerPlan: 'NA' },
  { floor: 'First', measuredCarpetArea: 'NA', buaAsPerDocuments: 'NA', carpetAreaAsPerPlan: 'NA' },
  { floor: 'Second', measuredCarpetArea: 'NA', buaAsPerDocuments: 'NA', carpetAreaAsPerPlan: 'NA' },
  { floor: 'Total', measuredCarpetArea: '357 sqft', buaAsPerDocuments: '420 sqft', carpetAreaAsPerPlan: 'NA' },
];

export default function AyeFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: AyeFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || userRole === 'viewer' || status === 'completed';

  // ── State Initialization ──────────────────────────────────────────
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const raw = rawInitialFields || {};
    const earliestVisit = getEarliestFieldVisit(bucketImages, prefill);
    const visitDate = raw.dateOfSiteVisit || raw.inspectionDate || earliestVisit?.date || '';
    const repDate = raw.dateOfReport || formatReportDate(new Date());

    return {
      // Top Reference & Header
      refNo: raw.refNo || (projectCode ? `SMA/AYE/${projectCode}` : ''),
      dateOfSiteVisit: visitDate,
      dateOfReport: repDate,
      purposeOfValuation: raw.purposeOfValuation || 'To Assess Fair Market Value for collateral security',
      ascCode: raw.ascCode || 'ASC -',
      valuerName: raw.valuerName || 'M/S. S MOHANTY ASSOCIATES',

      // I. General Details
      applicationNo: raw.applicationNo ?? projectCode ?? '',
      valuationRequestedByBranch: raw.valuationRequestedByBranch ?? '',
      typeOfLoan: raw.typeOfLoan ?? '',
      nameOfCustomer: raw.nameOfCustomer ?? prefill?.contactName ?? '',
      propertyAddressFiring: raw.propertyAddressFiring ?? prefill?.propertyAddress ?? '',
      propertyAddressLegal: raw.propertyAddressLegal ?? prefill?.propertyAddress ?? '',
      propertyAddressSite: raw.propertyAddressSite ?? prefill?.propertyAddress ?? '',
      nameAsPerBoardPlate: raw.nameAsPerBoardPlate ?? 'NA',
      nameOfPropertyOwner: raw.nameOfPropertyOwner ?? prefill?.ownerName ?? '',
      approvalAuthorityDetails: raw.approvalAuthorityDetails ?? '',
      contactPersonDetails: raw.contactPersonDetails ?? '',
      briefDescriptionOfProperty: raw.briefDescriptionOfProperty ?? 'NA',
      nearbyLandmark: raw.nearbyLandmark ?? (prefill as any)?.landmark ?? '',
      classificationOfLocality: raw.classificationOfLocality ?? 'Middle Class',
      natureOfLocality: raw.natureOfLocality ?? '',
      anyNegativeToLocality: raw.anyNegativeToLocality ?? 'NA',

      proximityCivicAmenities: raw.proximityCivicAmenities ?? 'Yes',
      nearestRailwayStation: raw.nearestRailwayStation ?? '',
      nearestBusStop: raw.nearestBusStop ?? '',
      nearestHospital: raw.nearestHospital ?? '',
      distanceFromCityCenter: raw.distanceFromCityCenter ?? '',
      modeOfTransportAccessibility: raw.modeOfTransportAccessibility ?? '',
      landTenure: raw.landTenure ?? 'Freehold',
      approvedPlanDetails: raw.approvedPlanDetails ?? 'Plan not provided',

      // Boundaries
      boundaries: raw.boundaries || EMPTY_BOUNDARIES,
      boundariesMatching: raw.boundariesMatching ?? 'Yes',
      propertyFallsInMcdList: raw.propertyFallsInMcdList ?? 'NA',
      propertyEasilyIdentifiable: raw.propertyEasilyIdentifiable ?? 'Yes',
      identifiedOnOurOwn: raw.identifiedOnOurOwn ?? 'Identified by the customer',
      propertyDemarcated: raw.propertyDemarcated ?? 'No',
      hasElectricWaterDrainage: raw.hasElectricWaterDrainage ?? 'Yes',
      accessRoadWidth: raw.accessRoadWidth ?? '',

      // II. Structure & Specifications
      typeOfConstruction: raw.typeOfConstruction ?? 'RCC Frame',
      yearOfConstruction: raw.yearOfConstruction ?? '',
      ageOfProperty: raw.ageOfProperty ?? '',
      estimatedFutureLife: raw.estimatedFutureLife ?? '',
      presentConditionOfBuilding: raw.presentConditionOfBuilding ?? 'Good',
      noOfFloors: raw.noOfFloors ?? '',
      permittedUseOfProperty: raw.permittedUseOfProperty ?? 'Plan not provided',
      onSiteActualUse: raw.onSiteActualUse ?? 'Residential',
      stageOfConstruction: raw.stageOfConstruction ?? '100%',
      noOfUnitsPerFloor: raw.noOfUnitsPerFloor ?? 'NA',
      accommodationDetails: raw.accommodationDetails ?? 'NA',

      // Setbacks
      setbackFrontByeLaws: raw.setbackFrontByeLaws ?? 'NA',
      setbackLhsByeLaws: raw.setbackLhsByeLaws ?? 'NA',
      setbackRhsByeLaws: raw.setbackRhsByeLaws ?? 'NA',
      setbackRearByeLaws: raw.setbackRearByeLaws ?? 'NA',
      setbackFrontActual: raw.setbackFrontActual ?? 'NA',
      setbackLhsActual: raw.setbackLhsActual ?? 'NA',
      setbackRhsActual: raw.setbackRhsActual ?? 'NA',
      setbackRearActual: raw.setbackRearActual ?? 'NA',

      // III. Property Under Reference
      unitConfiguration: raw.unitConfiguration ?? 'NA',
      typeOfRoofing: raw.typeOfRoofing ?? 'RCC',
      typeOfFlooring: raw.typeOfFlooring ?? '',
      doorsWindows: raw.doorsWindows ?? '',
      kitchenPlatformSink: raw.kitchenPlatformSink ?? '',
      plumbingType: raw.plumbingType ?? 'Concealed',
      electricalInstallation: raw.electricalInstallation ?? 'Concealed',
      anyOtherAmenities: raw.anyOtherAmenities ?? 'NA',

      areaRows: raw.areaRows || EMPTY_AREA_ROWS,
      finalCarpetAreaConsidered: raw.finalCarpetAreaConsidered ?? '',
      consideredBuaSbua: raw.consideredBuaSbua ?? '',
      structureConfirmingToByeLaws: raw.structureConfirmingToByeLaws ?? 'local bye laws',

      deviationFromByeLaws: raw.deviationFromByeLaws ?? 'NA',
      deviationCriticalNonCritical: raw.deviationCriticalNonCritical ?? 'NA',
      riskOfDemolition: raw.riskOfDemolition ?? 'Low',
      mixedUseDetails: raw.mixedUseDetails ?? 'Residential',
      propertyCurrentlyOccupiedBy: raw.propertyCurrentlyOccupiedBy ?? 'Self',
      occupiedSinceWhen: raw.occupiedSinceWhen ?? '',
      structureConcernsEarthquake: raw.structureConcernsEarthquake ?? 'NA',
      estimateGivenByCustomer: raw.estimateGivenByCustomer ?? 'NA',
      estimateValidOrNot: raw.estimateValidOrNot ?? 'NA',

      // IV. Valuation
      landAreaSqft: raw.landAreaSqft ?? '',
      landRatePerSqft: raw.landRatePerSqft ?? '',
      landValueTotal: raw.landValueTotal ?? '',
      consideredBuaGf: raw.consideredBuaGf ?? '',
      rateConstructionBuilding: raw.rateConstructionBuilding ?? '',
      depreciationRatePastAge: raw.depreciationRatePastAge ?? '',
      lessImmediateRepairs: raw.lessImmediateRepairs ?? 'NA',
      constructionValueBuilding: raw.constructionValueBuilding ?? '',
      presentMarketValueCombined: raw.presentMarketValueCombined ?? '',
      marketValue100Percent: raw.marketValue100Percent ?? '',

      apartmentConsideredArea: raw.apartmentConsideredArea ?? 'NA',
      apartmentMarketRate: raw.apartmentMarketRate ?? 'NA',
      apartmentFairMarketValue: raw.apartmentFairMarketValue ?? 'NA',
      apartmentPresentWorkStageValue: raw.apartmentPresentWorkStageValue ?? 'NA',

      governmentCircleValue: raw.governmentCircleValue ?? '',
      insuranceValue: raw.insuranceValue ?? 'NA',
      forcedSaleValue: raw.forcedSaleValue ?? '',
      conservativeValue: raw.conservativeValue ?? '',

      // V. Marketability
      marketabilitySale: raw.marketabilitySale ?? 'Average',
      marketabilityLease: raw.marketabilityLease ?? 'Average',
      marketabilityVolatility: raw.marketabilityVolatility ?? 'Medium',

      // VI. Documents Submitted
      documentsSubmitted: raw.documentsSubmitted || ['1. Sale deed', '2. ROR', '3. Sketch map'],

      // VII. Remarks
      remarks: raw.remarks ?? '',
      valuationNote: raw.valuationNote ?? '',

      // VIII. Declaration
      inspectingEngineerName: raw.inspectingEngineerName ?? '',
      inspectionDateDeclaration: raw.inspectionDateDeclaration || visitDate,
      declarationDate: raw.declarationDate || repDate,
      declarationPlace: raw.declarationPlace ?? 'Bhubaneswar',

      // Attachments & Geo
      latitude: raw.latitude ?? (prefill as any)?.propertyLatitude ?? '',
      longitude: raw.longitude ?? (prefill as any)?.propertyLongitude ?? '',
      locationMaps: raw.locationMaps || [],
      propertyDocuments: raw.propertyDocuments || [],
      propertyDocumentNames: raw.propertyDocumentNames || [],
      propertyPhotos: raw.propertyPhotos || [],
      propertyPhotoNames: raw.propertyPhotoNames || [],
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
      const n = parseFloat(String(v).replace(/,/g, '').trim());
      return isNaN(n) ? 0 : n;
    };

    const lArea = parseSafe(fields.landAreaSqft);
    const lRate = parseSafe(fields.landRatePerSqft);
    const lVal = Math.round(lArea * lRate);

    const bArea = parseSafe(fields.consideredBuaGf);
    const bRate = parseSafe(fields.rateConstructionBuilding);
    const age = parseFloat(String(fields.ageOfProperty || '').replace(/[^0-9.]/g, '')) || 0;
    const depPct = Math.min(Math.round(age * 1.0), 80); // 1% per annum
    const depAmountPerSqft = Math.round(bRate * (depPct / 100));
    const netRate = bRate - depAmountPerSqft;
    const bVal = Math.round(bArea * netRate);

    const totalFMV = lVal + bVal;
    const fsv = Math.round(totalFMV * 0.8);
    const consv = Math.round(totalFMV * 0.9);
    const words = totalFMV > 0 ? rupeesInWords(totalFMV) : 'Zero Rupees';

    return {
      lArea,
      lRate,
      lVal,
      bArea,
      bRate,
      age,
      depPct,
      netRate,
      bVal,
      totalFMV,
      fsv,
      consv,
      words,
    };
  }, [
    fields.landAreaSqft,
    fields.landRatePerSqft,
    fields.consideredBuaGf,
    fields.rateConstructionBuilding,
    fields.ageOfProperty,
  ]);

  const applyAutoCalculations = useCallback(() => {
    const calc = autoCalculations;
    setFields((prev) => ({
      ...prev,
      landValueTotal: `Rs. ${formatIndianCurrency(calc.lVal)}/-`,
      depreciationRatePastAge: `Rs. ${calc.netRate}/- (Depreciated Rate @ ${calc.depPct}%)`,
      constructionValueBuilding: `Rs. ${formatIndianCurrency(calc.bVal)}/-`,
      presentMarketValueCombined: `Rs. ${formatIndianCurrency(calc.lVal)}/- + Rs. ${formatIndianCurrency(
        calc.bVal
      )}/- = Rs. ${formatIndianCurrency(calc.totalFMV)}/-`,
      marketValue100Percent: `Rs. ${formatIndianCurrency(calc.totalFMV)}/-`,
      forcedSaleValue: `Rs. ${formatIndianCurrency(calc.fsv)}/-`,
      conservativeValue: `Rs. ${formatIndianCurrency(calc.consv)}/-`,
    }));
  }, [autoCalculations]);

  // Boundaries Table Handlers
  const handleUpdateBoundary = (idx: number, key: keyof AyeBoundaryRow, val: string) => {
    setFields((prev) => {
      const arr = [...(prev.boundaries || [])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, boundaries: arr };
    });
  };

  // Area Table Handlers
  const handleUpdateAreaRow = (idx: number, key: keyof AyeAreaRow, val: string) => {
    setFields((prev) => {
      const arr = [...(prev.areaRows || [])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, areaRows: arr };
    });
  };

  const handleAddAreaRow = () => {
    setFields((prev) => ({
      ...prev,
      areaRows: [
        ...(prev.areaRows || []),
        { floor: 'Additional Floor', measuredCarpetArea: 'NA', buaAsPerDocuments: 'NA', carpetAreaAsPerPlan: 'NA' },
      ],
    }));
  };

  const handleRemoveAreaRow = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      areaRows: (prev.areaRows || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  // Sync inspection date from bucket
  const handleSyncInspectionDate = useCallback(() => {
    const earliest = getEarliestFieldVisit(bucketImages, prefill);
    if (earliest?.date) {
      handleChange('dateOfSiteVisit', earliest.date);
      handleChange('inspectionDateDeclaration', earliest.date);
    }
  }, [bucketImages, prefill, handleChange]);

  // Load sample template data
  const handleLoadSampleData = () => {
    if (confirm('Load sample Bhubaneswar Kanta report data for Aye Finance?')) {
      setFields((prev) => ({
        ...prev,
        refNo: 'AYE/03-26/05',
        dateOfSiteVisit: '24/03/2026',
        dateOfReport: '24/03/2026',
        applicationNo: 'AYE-000003491226-LOS',
        valuationRequestedByBranch: 'SAMBALPUR 6021',
        typeOfLoan: 'ML GOLD PLUS FRESH',
        nameOfCustomer: 'BHUBANESWAR KANTA',
        propertyAddressFiring:
          'Khata No-370/1780, Plot No- 1892 (AC.0.070Decs,Agri), Mouza- Naksapali, Tahasil-Maneswar, PS-Sambalpur Sadar, Dist-Sambalpur, Pin-768005',
        propertyAddressLegal:
          'Khata No-370/1780, Plot No- 1892 (AC.0.070Decs,Agri), Mouza- Naksapali, Tahasil-Maneswar, PS-Sambalpur Sadar, Dist-Sambalpur, Pin-768005',
        propertyAddressSite:
          'Khata No-370/1780, Plot No- 1892 (AC.0.070Decs,Agri), Mouza- Naksapali, Tahasil-Maneswar, PS-Sambalpur Sadar, Dist-Sambalpur, Pin-768005',
        nameAsPerBoardPlate: 'NA',
        nameOfPropertyOwner: 'Bhubaneswar Kanta, S/O- Rama Chandra Kanta',
        approvalAuthorityDetails: 'Within Sambalpur Municipality Limit',
        contactPersonDetails: 'BHUBANESWAR KANTA, Mob No- 9337838276',
        briefDescriptionOfProperty: 'NA',
        nearbyLandmark: 'Near Gopalji Temple, Naksapali',
        classificationOfLocality: 'Middle Class',
        natureOfLocality: '...50% Developing Locality',
        anyNegativeToLocality: 'NA',
        proximityCivicAmenities: 'Yes',
        nearestRailwayStation: '4-Kms from Maneswar Railway Station',
        nearestBusStop: '500-Mtrs from Naksapali Bus Stop',
        nearestHospital: '3-Kms from Dhanupali Govt. Hospital',
        distanceFromCityCenter: '8-Kms from Sambalpur city centre',
        modeOfTransportAccessibility: '1-2 Kms',
        landTenure: 'Freehold',
        approvedPlanDetails: 'Plan not provided',
        boundaries: SAMPLE_BOUNDARIES,
        boundariesMatching: 'Yes (Boundary is matching as per sketch map)',
        propertyFallsInMcdList: 'NA',
        propertyEasilyIdentifiable: 'Yes (Identify by sketch map)',
        identifiedOnOurOwn: 'Identified by the customer',
        propertyDemarcated: 'No',
        hasElectricWaterDrainage: 'Yes',
        accessRoadWidth: '20-feet wide Road',
        typeOfConstruction: 'RCC Frame',
        yearOfConstruction: '2017',
        ageOfProperty: '9-Years',
        estimatedFutureLife: '51-Years',
        presentConditionOfBuilding: 'Good',
        noOfFloors: '1 (GF)',
        permittedUseOfProperty: 'Plan not provided',
        onSiteActualUse: 'Residential',
        stageOfConstruction: '100%',
        noOfUnitsPerFloor: 'NA',
        accommodationDetails: 'NA',
        setbackFrontByeLaws: 'NA',
        setbackLhsByeLaws: 'NA',
        setbackRhsByeLaws: 'NA',
        setbackRearByeLaws: 'NA',
        setbackFrontActual: 'NA',
        setbackLhsActual: 'NA',
        setbackRhsActual: 'NA',
        setbackRearActual: 'NA',
        unitConfiguration: 'NA',
        typeOfRoofing: 'RCC',
        typeOfFlooring: 'As Flooring',
        doorsWindows: 'Hard wood door',
        kitchenPlatformSink: 'AS Platform & Stile sink',
        plumbingType: 'Concealed',
        electricalInstallation: 'Concealed',
        anyOtherAmenities: 'NA',
        areaRows: SAMPLE_AREA_ROWS,
        finalCarpetAreaConsidered: '357 sqft',
        consideredBuaSbua: '420 sqft',
        structureConfirmingToByeLaws: 'local bye laws',
        deviationFromByeLaws: 'NA',
        deviationCriticalNonCritical: 'NA',
        riskOfDemolition: 'Low',
        mixedUseDetails: 'Residential',
        propertyCurrentlyOccupiedBy: 'Self',
        occupiedSinceWhen: 'Yes',
        structureConcernsEarthquake: 'NA',
        estimateGivenByCustomer: 'NA',
        estimateValidOrNot: 'NA',
        landAreaSqft: '3049',
        landRatePerSqft: '600',
        landValueTotal: 'Rs. 18,29,400/-',
        consideredBuaGf: '420',
        rateConstructionBuilding: '1600',
        depreciationRatePastAge: 'Rs. 1440/-',
        lessImmediateRepairs: 'NA',
        constructionValueBuilding: 'Rs. 6,04,800/-',
        presentMarketValueCombined: 'Rs. 18,29,400/- + Rs. 6,04,800/- = Rs. 24,34,200/-',
        marketValue100Percent: 'Rs. 24,34,200/-',
        governmentCircleValue: 'Rs. 528/- per sqft',
        insuranceValue: 'NA',
        forcedSaleValue: 'Rs. 19,47,360/-',
        conservativeValue: 'Rs. 21,90,780/-',
        marketabilitySale: 'Average',
        marketabilityLease: 'Average',
        marketabilityVolatility: 'Medium',
        documentsSubmitted: ['1. Sale deed', '2. ROR', '3. Sketch map'],
        remarks:
          'Subject property is a single storied residential building, having land extent of 3049sqft, having measured BUA 420sqft. Approved plan is not provided. Property is located in developing area of Naksapali mouza & approaches 20-feet wide road. It is coming under Sambalpur municipality limit & surrounding areas are residential in nature. This building is occupied by the customer for residential purpose. Valuation has been done for land & measured BUA of GF only.',
        valuationNote:
          'Note:- There is no provision for road in sale deed boundary & sketch map. The land is not converted to homestead & the present nature is Agri. Customer has submitted property sketch map for the identification & access road. Report is released basing upon the sketch map & the internal policy of Aye Finance.',
        inspectingEngineerName: 'Mr. Subhransu Sekhar Sa',
        inspectionDateDeclaration: '24/03/2026',
        declarationDate: '24/03/2026',
        declarationPlace: 'Bhubaneswar',
      }));
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: AyeFinanceFields = {
        ...fields,
        projectCode,
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
      const payload: AyeFinanceFields = {
        ...fields,
        projectCode,
      };
      const renderer = new PDFAyeFinanceRenderer(payload);
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
      const payload: AyeFinanceFields = {
        ...fields,
        projectCode,
      };
      const renderer = new PDFAyeFinanceRenderer(payload);
      await renderer.generateAndDownload(
        `Valuation_Report_Aye_${projectCode || fields.applicationNo || 'Report'}.pdf`
      );
    } catch (err: any) {
      alert(`PDF Generation failed: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Main Top Header */}
      <BankReportHeader
        bankName="AYE FINANCE PVT. LTD."
        formatName="Technical Valuation Report Format"
        projectCode={projectCode}
        status={status}
      />

      {/* Banner with Template Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-lg">
            AYE
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Aye Finance Pvt. Ltd. (Technical Valuation Format)
            </h2>
            <p className="text-xs text-slate-500">
              Annexure 1.1 Technical Report &bull; Comprehensive 5-Page Standard Layout
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncInspectionDate}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Sync Visit Date
          </button>
          <button
            type="button"
            onClick={handleLoadSampleData}
            className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-teal-600" />
            Load Sample Template Data
          </button>
          {onResetWizard && (
            <button
              type="button"
              onClick={onResetWizard}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
            >
              Reset Wizard
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Form (Left) & Floating Navigator (Right) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* SECTION HEADER & REFERENCE */}
          <Section id="section-header" title="Header & Reference Information" number="H">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Ref. No.">
              <input
                type="text"
                className={inputCls}
                value={fields.refNo || ''}
                onChange={(e) => handleChange('refNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. AYE/03-26/05"
              />
            </Field>
            <Field label="Date of Site Visit">
              <BaseDateInput
                value={fields.dateOfSiteVisit || ''}
                onChange={(val) => handleChange('dateOfSiteVisit', val)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="Date of Report">
              <BaseDateInput
                value={fields.dateOfReport || ''}
                onChange={(val) => handleChange('dateOfReport', val)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="ASC Code">
              <input
                type="text"
                className={inputCls}
                value={fields.ascCode || ''}
                onChange={(e) => handleChange('ascCode', e.target.value)}
                disabled={isReadOnly}
                placeholder="ASC -"
              />
            </Field>
            <Field label="Valuer Name">
              <input
                type="text"
                className={inputCls}
                value={fields.valuerName || ''}
                onChange={(e) => handleChange('valuerName', e.target.value)}
                disabled={isReadOnly}
                placeholder="M/S. S MOHANTY ASSOCIATES"
              />
            </Field>
            <Field label="Purpose of Valuation">
              <input
                type="text"
                className={inputCls}
                value={fields.purposeOfValuation || ''}
                onChange={(e) => handleChange('purposeOfValuation', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION I: GENERAL DETAILS */}
        <Section id="section-1" title="General Details (Applicant & Property Identification)" number="I">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="1. Application No.">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.applicationNo || ''}
                  onChange={(e) => handleChange('applicationNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. AYE-000003491226-LOS"
                />
              </Field>
              <Field label="2. Valuation Requested by Branch">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuationRequestedByBranch || ''}
                  onChange={(e) => handleChange('valuationRequestedByBranch', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. SAMBALPUR 6021"
                />
              </Field>
              <Field label="3. Type of Loan">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfLoan || ''}
                  onChange={(e) => handleChange('typeOfLoan', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. ML GOLD PLUS FRESH"
                />
              </Field>
              <Field label="4. Name of Customer / Applicant">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nameOfCustomer || ''}
                  onChange={(e) => handleChange('nameOfCustomer', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. BHUBANESWAR KANTA"
                />
              </Field>
            </div>

            {/* Address Variants */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Field label="5.A. Property Address as per Initiation / Firing">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={fields.propertyAddressFiring || ''}
                  onChange={(e) => handleChange('propertyAddressFiring', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="5.B. Property Address as per Legal Documents">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={fields.propertyAddressLegal || ''}
                  onChange={(e) => handleChange('propertyAddressLegal', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="5.C. Property Address as per Site Visit">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={fields.propertyAddressSite || ''}
                  onChange={(e) => handleChange('propertyAddressSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="6. Name as per Society Board & Name Plate">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nameAsPerBoardPlate || ''}
                  onChange={(e) => handleChange('nameAsPerBoardPlate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="7. Name of Property Owner / Holder (as per Title)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nameOfPropertyOwner || ''}
                  onChange={(e) => handleChange('nameOfPropertyOwner', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Bhubaneswar Kanta, S/O- Rama Chandra Kanta"
                />
              </Field>
              <Field label="8. Approval Authority Details (GP/ZP/Municipal)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvalAuthorityDetails || ''}
                  onChange={(e) => handleChange('approvalAuthorityDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Within Sambalpur Municipality Limit"
                />
              </Field>
              <Field label="9. Contact Person Details">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.contactPersonDetails || ''}
                  onChange={(e) => handleChange('contactPersonDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. BHUBANESWAR KANTA, Mob No- 9337838276"
                />
              </Field>
              <Field label="10. Brief Description of the Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.briefDescriptionOfProperty || ''}
                  onChange={(e) => handleChange('briefDescriptionOfProperty', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="11. Nearby Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearbyLandmark || ''}
                  onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Near Gopalji Temple, Naksapali"
                />
              </Field>
              <Field label="12. Classification of Locality">
                <select
                  className={selectCls}
                  value={fields.classificationOfLocality || 'Middle Class'}
                  onChange={(e) => handleChange('classificationOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Lower Class">Lower Class</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle">Upper Middle</option>
                  <option value="High Class">High Class</option>
                </select>
              </Field>
              <Field label="13. Nature of Locality / Development (%)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.natureOfLocality || ''}
                  onChange={(e) => handleChange('natureOfLocality', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. ...50% Developing Locality"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="14. Any Negative to the Locality (Slums, Hazards, HT Line, etc.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.anyNegativeToLocality || ''}
                    onChange={(e) => handleChange('anyNegativeToLocality', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION I-B: AMENITIES, DISTANCES & BOUNDARIES */}
        <Section id="section-1-b" title="Amenities, Distances & Boundaries" number="I-B">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Field label="15. Proximity to Amenities">
                <select
                  className={selectCls}
                  value={fields.proximityCivicAmenities || 'Yes'}
                  onChange={(e) => handleChange('proximityCivicAmenities', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="15.A. Nearest Railway Station">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearestRailwayStation || ''}
                  onChange={(e) => handleChange('nearestRailwayStation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 4-Kms from Maneswar"
                />
              </Field>
              <Field label="15.B. Nearest Bus Stop">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearestBusStop || ''}
                  onChange={(e) => handleChange('nearestBusStop', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 500-Mtrs from Naksapali"
                />
              </Field>
              <Field label="15.C. Nearest Hospital">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearestHospital || ''}
                  onChange={(e) => handleChange('nearestHospital', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 3-Kms from Dhanupali"
                />
              </Field>
              <Field label="16. Distance from City Center">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromCityCenter || ''}
                  onChange={(e) => handleChange('distanceFromCityCenter', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 8-Kms from Sambalpur"
                />
              </Field>
              <Field label="17. Transport Accessibility">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.modeOfTransportAccessibility || ''}
                  onChange={(e) => handleChange('modeOfTransportAccessibility', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1-2 Kms"
                />
              </Field>
              <Field label="18. Land Tenure">
                <select
                  className={selectCls}
                  value={fields.landTenure || 'Freehold'}
                  onChange={(e) => handleChange('landTenure', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Freehold">Freehold</option>
                  <option value="Leasehold">Leasehold</option>
                </select>
              </Field>
              <Field label="19. Approved Plan & OC Details">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvedPlanDetails || ''}
                  onChange={(e) => handleChange('approvedPlanDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Plan not provided"
                />
              </Field>
            </div>

            {/* 20. Boundaries Details Table */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                20. Boundaries Details (Direction-wise Cross Verification)
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="p-3 w-28">DIRECTION</th>
                      <th className="p-3">AS PER SALE DEED</th>
                      <th className="p-3">AS PER SKETCH MAP</th>
                      <th className="p-3">AS PER ACTUAL SITE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(fields.boundaries || []).map((b: AyeBoundaryRow, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700 bg-slate-50">{b.direction}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={b.asPerSaleDeed || ''}
                            onChange={(e) => handleUpdateBoundary(idx, 'asPerSaleDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={b.asPerSketchMap || ''}
                            onChange={(e) => handleUpdateBoundary(idx, 'asPerSketchMap', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={b.asPerActualSite || ''}
                            onChange={(e) => handleUpdateBoundary(idx, 'asPerActualSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Field label="Are Boundaries Matching (Yes / No)">
              <input
                type="text"
                className={inputCls}
                value={fields.boundariesMatching || ''}
                onChange={(e) => handleChange('boundariesMatching', e.target.value)}
                disabled={isReadOnly}
                placeholder="Yes (Boundary is matching as per sketch map)"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Field label="21. MCD Unauthorized List">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyFallsInMcdList || ''}
                  onChange={(e) => handleChange('propertyFallsInMcdList', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="22. Easily Identifiable">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyEasilyIdentifiable || ''}
                  onChange={(e) => handleChange('propertyEasilyIdentifiable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="23. Identified On Our Own">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.identifiedOnOurOwn || ''}
                  onChange={(e) => handleChange('identifiedOnOurOwn', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="24. Property Demarcated (Yes/No)">
                <select
                  className={selectCls}
                  value={fields.propertyDemarcated || 'No'}
                  onChange={(e) => handleChange('propertyDemarcated', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="25. Electric / Water / Drainage">
                <select
                  className={selectCls}
                  value={fields.hasElectricWaterDrainage || 'Yes'}
                  onChange={(e) => handleChange('hasElectricWaterDrainage', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="26. Access Road Width">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.accessRoadWidth || ''}
                  onChange={(e) => handleChange('accessRoadWidth', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 20-feet wide Road"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION II: DETAILS OF STRUCTURE AND SPECIFICATIONS */}
        <Section id="section-2" title="Details of Structure and Specifications" number="II">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="1. Type of Construction">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfConstruction || ''}
                  onChange={(e) => handleChange('typeOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. RCC Frame"
                />
              </Field>
              <Field label="2. Year of Construction">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.yearOfConstruction || ''}
                  onChange={(e) => handleChange('yearOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 2017"
                />
              </Field>
              <Field label="3. Age of the Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={(e) => handleChange('ageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 9-Years"
                />
              </Field>
              <Field label="4. Estimated Future Life">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.estimatedFutureLife || ''}
                  onChange={(e) => handleChange('estimatedFutureLife', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 51-Years"
                />
              </Field>
              <Field label="5. Present Condition">
                <select
                  className={selectCls}
                  value={fields.presentConditionOfBuilding || 'Good'}
                  onChange={(e) => handleChange('presentConditionOfBuilding', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
              <Field label="6. No. of Floors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={(e) => handleChange('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1(GF)"
                />
              </Field>
              <Field label="7. Permitted Use as per Plan">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.permittedUseOfProperty || ''}
                  onChange={(e) => handleChange('permittedUseOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Plan not provided"
                />
              </Field>
              <Field label="8. On Site Actual Use">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.onSiteActualUse || ''}
                  onChange={(e) => handleChange('onSiteActualUse', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Residential"
                />
              </Field>
              <Field label="9. Stage of Construction (%)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.stageOfConstruction || ''}
                  onChange={(e) => handleChange('stageOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="100%"
                />
              </Field>
              <Field label="10. No. of Units per Floor">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfUnitsPerFloor || ''}
                  onChange={(e) => handleChange('noOfUnitsPerFloor', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="11. Accommodation Details (Floor-wise)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.accommodationDetails || ''}
                    onChange={(e) => handleChange('accommodationDetails', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
              </div>
            </div>

            {/* 12. Setback Details Table */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                12. Setback Details (in Ft.)
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="p-3 w-40">SETBACK PARTICULARS</th>
                      <th className="p-3">FRONT</th>
                      <th className="p-3">LHS</th>
                      <th className="p-3">RHS</th>
                      <th className="p-3">REAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 bg-slate-50">AS PER BYE LAWS</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackFrontByeLaws || ''}
                          onChange={(e) => handleChange('setbackFrontByeLaws', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackLhsByeLaws || ''}
                          onChange={(e) => handleChange('setbackLhsByeLaws', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackRhsByeLaws || ''}
                          onChange={(e) => handleChange('setbackRhsByeLaws', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackRearByeLaws || ''}
                          onChange={(e) => handleChange('setbackRearByeLaws', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 bg-slate-50">ON SITE / ACTUAL</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackFrontActual || ''}
                          onChange={(e) => handleChange('setbackFrontActual', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackLhsActual || ''}
                          onChange={(e) => handleChange('setbackLhsActual', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackRhsActual || ''}
                          onChange={(e) => handleChange('setbackRhsActual', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.setbackRearActual || ''}
                          onChange={(e) => handleChange('setbackRearActual', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION III: DETAILS OF PROPERTY UNDER REFERENCE */}
        <Section id="section-3" title="Details of the Property Under Reference" number="III">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="1. Unit Configuration">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.unitConfiguration || ''}
                  onChange={(e) => handleChange('unitConfiguration', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1RK, 1BHK, 2BHK"
                />
              </Field>
              <Field label="2. Type of Roofing">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfRoofing || ''}
                  onChange={(e) => handleChange('typeOfRoofing', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. RCC"
                />
              </Field>
              <Field label="3. Type of Flooring">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfFlooring || ''}
                  onChange={(e) => handleChange('typeOfFlooring', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. As Flooring / Tiles"
                />
              </Field>
              <Field label="4. Doors & Windows">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.doorsWindows || ''}
                  onChange={(e) => handleChange('doorsWindows', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Hard wood door"
                />
              </Field>
              <Field label="5. Kitchen Platform & Sink">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.kitchenPlatformSink || ''}
                  onChange={(e) => handleChange('kitchenPlatformSink', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. AS Platform & Stile sink"
                />
              </Field>
              <Field label="6. Plumbing (Open / Concealed)">
                <select
                  className={selectCls}
                  value={fields.plumbingType || 'Concealed'}
                  onChange={(e) => handleChange('plumbingType', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Concealed">Concealed</option>
                  <option value="Open">Open</option>
                </select>
              </Field>
              <Field label="7. Electrical Installation">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.electricalInstallation || ''}
                  onChange={(e) => handleChange('electricalInstallation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Concealed"
                />
              </Field>
              <Field label="8. Any Other Amenities">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.anyOtherAmenities || ''}
                  onChange={(e) => handleChange('anyOtherAmenities', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
            </div>

            {/* 9. Area of Property Table */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                9. Area of Property (Permitted as per approved plan / building byelaws)
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="p-3 w-28">FLOOR</th>
                      <th className="p-3">MEASURED CARPET AREA (SQFT)</th>
                      <th className="p-3">BUA AS PER DOCUMENTS (SQFT)</th>
                      <th className="p-3">CARPET AREA AS PER BYELAWS</th>
                      {!isReadOnly && <th className="p-3 w-14 text-center">ACTION</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(fields.areaRows || []).map((row: AyeAreaRow, idx: number) => {
                      const isTotal = row.floor.toLowerCase().includes('total');
                      return (
                        <tr key={idx} className={isTotal ? 'bg-amber-50 font-bold' : 'hover:bg-slate-50/50'}>
                          <td className="p-2">
                            <input
                              type="text"
                              className={`${inputCls} ${isTotal ? 'font-bold' : ''}`}
                              value={row.floor || ''}
                              onChange={(e) => handleUpdateAreaRow(idx, 'floor', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={row.measuredCarpetArea || ''}
                              onChange={(e) => handleUpdateAreaRow(idx, 'measuredCarpetArea', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={row.buaAsPerDocuments || ''}
                              onChange={(e) => handleUpdateAreaRow(idx, 'buaAsPerDocuments', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={row.carpetAreaAsPerPlan || ''}
                              onChange={(e) => handleUpdateAreaRow(idx, 'carpetAreaAsPerPlan', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveAreaRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddAreaRow}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Floor Row
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Field label="10. Final Carpet Area Considered">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.finalCarpetAreaConsidered || ''}
                  onChange={(e) => handleChange('finalCarpetAreaConsidered', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="357 sqft"
                />
              </Field>
              <Field label="10.A. Considered BUA / SBUA">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.consideredBuaSbua || ''}
                  onChange={(e) => handleChange('consideredBuaSbua', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="420 sqft"
                />
              </Field>
              <Field label="11. Confirming to Local Byelaws">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.structureConfirmingToByeLaws || ''}
                  onChange={(e) => handleChange('structureConfirmingToByeLaws', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="local bye laws"
                />
              </Field>
              <Field label="12. Deviation from Byelaws (If Any)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.deviationFromByeLaws || ''}
                  onChange={(e) => handleChange('deviationFromByeLaws', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
              <Field label="13. Deviation are Critical / Non-Critical">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.deviationCriticalNonCritical || ''}
                  onChange={(e) => handleChange('deviationCriticalNonCritical', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
              <Field label="14. Risk of Demolition">
                <select
                  className={selectCls}
                  value={fields.riskOfDemolition || 'Low'}
                  onChange={(e) => handleChange('riskOfDemolition', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </Field>
              <Field label="15. Mixed Use Details">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.mixedUseDetails || ''}
                  onChange={(e) => handleChange('mixedUseDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Residential"
                />
              </Field>
              <Field label="16. Currently Occupied By">
                <select
                  className={selectCls}
                  value={fields.propertyCurrentlyOccupiedBy || 'Self'}
                  onChange={(e) => handleChange('propertyCurrentlyOccupiedBy', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Self">Self</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Under Construction">Under Construction</option>
                </select>
              </Field>
              <Field label="17. If Self Occupied, Since When">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupiedSinceWhen || ''}
                  onChange={(e) => handleChange('occupiedSinceWhen', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Yes / Years"
                />
              </Field>
              <Field label="18. Earthquake / Cyclone Concerns">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.structureConcernsEarthquake || ''}
                  onChange={(e) => handleChange('structureConcernsEarthquake', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
              <Field label="19. Estimate Given by Customer">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.estimateGivenByCustomer || ''}
                  onChange={(e) => handleChange('estimateGivenByCustomer', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
              <Field label="20. Customer Estimate Valid or Not">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.estimateValidOrNot || ''}
                  onChange={(e) => handleChange('estimateValidOrNot', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION IV: VALUATION OF THE PROPERTY */}
        <Section id="section-4" title="Valuation Analysis & Pricing Breakdown" number="IV">
          <div className="space-y-6">
            {/* Auto-calculation helper card */}
            <div className="bg-teal-500/10 border border-teal-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 font-semibold text-sm">
                  <Coins className="w-4 h-4 text-teal-600" />
                  Valuation Rate Engine (Land + Building Methodology)
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={applyAutoCalculations}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Auto-Compute All Values
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Land Area (Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={(e) => handleChange('landAreaSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="3049"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Land Rate (Rs/Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.landRatePerSqft || ''}
                    onChange={(e) => handleChange('landRatePerSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Considered BUA GF (Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.consideredBuaGf || ''}
                    onChange={(e) => handleChange('consideredBuaGf', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="420"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Base Const. Rate (Rs/Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.rateConstructionBuilding || ''}
                    onChange={(e) => handleChange('rateConstructionBuilding', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="1600"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-teal-200/60 text-xs text-slate-700">
                <span>Land Value: <strong>Rs. {formatIndianCurrency(autoCalculations.lVal)}</strong></span>
                <span>&bull;</span>
                <span>Building Value: <strong>Rs. {formatIndianCurrency(autoCalculations.bVal)}</strong></span>
                <span>&bull;</span>
                <span>Total FMV: <strong className="text-teal-700 font-bold">Rs. {formatIndianCurrency(autoCalculations.totalFMV)}</strong></span>
                <span>&bull;</span>
                <span>FSV (80%): <strong>Rs. {formatIndianCurrency(autoCalculations.fsv)}</strong></span>
              </div>
            </div>

            {/* A. For Land + Building */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                A. For Land + Building (Row Houses / Bungalow / Villa)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="1. Land Area (Sq.ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={(e) => handleChange('landAreaSqft', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="2. Land Rate Adopted (Per Sq.ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landRatePerSqft || ''}
                    onChange={(e) => handleChange('landRatePerSqft', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Land Value (1 * 2)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-slate-900`}
                    value={fields.landValueTotal || ''}
                    onChange={(e) => handleChange('landValueTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="4. Considered BUA GF (Sq.ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.consideredBuaGf || ''}
                    onChange={(e) => handleChange('consideredBuaGf', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="5. Construction Rate (Per Sq.ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.rateConstructionBuilding || ''}
                    onChange={(e) => handleChange('rateConstructionBuilding', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="6. Less: Depreciation Past Age">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.depreciationRatePastAge || ''}
                    onChange={(e) => handleChange('depreciationRatePastAge', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="R. Less: Immediate Repairs">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.lessImmediateRepairs || ''}
                    onChange={(e) => handleChange('lessImmediateRepairs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="8. Construction Value of Building">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-slate-900`}
                    value={fields.constructionValueBuilding || ''}
                    onChange={(e) => handleChange('constructionValueBuilding', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="9. Present Market Value (3 + 8)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-teal-800`}
                    value={fields.presentMarketValueCombined || ''}
                    onChange={(e) => handleChange('presentMarketValueCombined', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="sm:col-span-3">
                  <Field label="10. Market Value of Property after 100% Completion">
                    <input
                      type="text"
                      className={`${inputCls} font-bold text-teal-900 text-sm`}
                      value={fields.marketValue100Percent || ''}
                      onChange={(e) => handleChange('marketValue100Percent', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* B. For Apartment / Flat */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                B. For Apartment / Flat / Ready Properties
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="1. Considered Area">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.apartmentConsideredArea || ''}
                    onChange={(e) => handleChange('apartmentConsideredArea', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
                <Field label="2. Market Rate">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.apartmentMarketRate || ''}
                    onChange={(e) => handleChange('apartmentMarketRate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
                <Field label="3. Fair Market Value">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.apartmentFairMarketValue || ''}
                    onChange={(e) => handleChange('apartmentFairMarketValue', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
                <Field label="4. Present Stage Value">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.apartmentPresentWorkStageValue || ''}
                    onChange={(e) => handleChange('apartmentPresentWorkStageValue', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
              </div>
            </div>

            {/* C. Related Values */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                C. Related Benchmark & Statutory Values
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="1. Government / Circle Value">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.governmentCircleValue || ''}
                    onChange={(e) => handleChange('governmentCircleValue', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Rs. 528/-"
                  />
                </Field>
                <Field label="2. Insurance Value">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.insuranceValue || ''}
                    onChange={(e) => handleChange('insuranceValue', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NA"
                  />
                </Field>
                <Field label="3. Forced Sale Value (80% of FMV)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-rose-800`}
                    value={fields.forcedSaleValue || ''}
                    onChange={(e) => handleChange('forcedSaleValue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="4. Conservative Value (90% of FMV)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-amber-800`}
                    value={fields.conservativeValue || ''}
                    onChange={(e) => handleChange('conservativeValue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION V: MARKETABILITY */}
        <Section id="section-5" title="Marketability Analysis" number="V">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="1. For Sale">
              <select
                className={selectCls}
                value={fields.marketabilitySale || 'Average'}
                onChange={(e) => handleChange('marketabilitySale', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>
            <Field label="2. For Lease – Rental Income">
              <select
                className={selectCls}
                value={fields.marketabilityLease || 'Average'}
                onChange={(e) => handleChange('marketabilityLease', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>
            <Field label="3. Volatility of Property Prices">
              <select
                className={selectCls}
                value={fields.marketabilityVolatility || 'Medium'}
                onChange={(e) => handleChange('marketabilityVolatility', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* SECTION VI: PROPERTY DOCUMENTS SUBMITTED */}
        <Section id="section-6" title="Property Documents Submitted in Detail" number="VI">
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              List the title documents, ROR, and sketch maps submitted by the customer.
            </p>
            <div className="space-y-2">
              {(fields.documentsSubmitted || []).map((doc: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={doc}
                    onChange={(e) => {
                      const arr = [...(fields.documentsSubmitted || [])];
                      arr[idx] = e.target.value;
                      handleChange('documentsSubmitted', arr);
                    }}
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const arr = (fields.documentsSubmitted || []).filter((_: any, i: number) => i !== idx);
                        handleChange('documentsSubmitted', arr);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  const arr = [...(fields.documentsSubmitted || [])];
                  arr.push(`${arr.length + 1}. Document Description`);
                  handleChange('documentsSubmitted', arr);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Document Entry
              </button>
            )}
          </div>
        </Section>

        {/* SECTION VII: REMARKS & OBSERVATIONS */}
        <Section id="section-7" title="Remarks & Specific Valuation Notes" number="VII">
          <div className="space-y-4">
            <Field label="Technical Remarks">
              <textarea
                rows={4}
                className={textareaCls}
                value={fields.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="Specific Policy Note (Road / Agri Land / Internal Policy)">
              <textarea
                rows={3}
                className={`${textareaCls} font-medium`}
                value={fields.valuationNote || ''}
                onChange={(e) => handleChange('valuationNote', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION VIII: DECLARATION */}
        <Section id="section-8" title="Declaration & Valuer Undertaking" number="VIII">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Inspecting Engineer Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.inspectingEngineerName || ''}
                  onChange={(e) => handleChange('inspectingEngineerName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Mr. Subhransu Sekhar Sa"
                />
              </Field>
              <Field label="Inspection Date (Declaration)">
                <BaseDateInput
                  value={fields.inspectionDateDeclaration || ''}
                  onChange={(val) => handleChange('inspectionDateDeclaration', val)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Declaration Date">
                <BaseDateInput
                  value={fields.declarationDate || ''}
                  onChange={(val) => handleChange('declarationDate', val)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Declaration Place">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.declarationPlace || ''}
                  onChange={(e) => handleChange('declarationPlace', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Bhubaneswar"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION IX: LOCATION MAPS */}
        <BaseMapsSection
          title="Location Maps"
          sectionId="sec-maps"
          sectionNumber={9}
          locationMapImages={fields.locationMaps || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          onLatitudeChange={(val) => handleChange('latitude', val)}
          onLongitudeChange={(val) => handleChange('longitude', val)}
          propertyAddress={fields.propertyAddressSite || fields.propertyAddressLegal || fields.propertyAddressFiring || ''}
          fields={fields}
          isReadOnly={isReadOnly}
          onLocationMapRemove={(idx?: number) => {
            if (idx !== undefined) {
              handleChange('locationMaps', (fields.locationMaps || []).filter((_: any, i: number) => i !== idx));
            }
          }}
        />

        {/* SECTION X: PROPERTY DOCUMENTS GALLERY */}
        <BaseDocumentsSection
          title="Property Documents"
          sectionId="sec-documents"
          sectionNumber={10}
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

        {/* SECTION XI: PHOTOGRAPHS GALLERY */}
        <BasePhotographsSection
          title="Property Site Photographs"
          sectionId="sec-photos"
          sectionNumber={11}
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

        {/* Floating Navigator (Right Sidebar) */}
        <FloatingNavigator sections={NAV_SECTIONS} />
      </div>

      {/* Action Bar (Save Draft, Print/Download PDF) */}
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

      {/* Photo Bucket Selection Modal (Strictly Site Photos) */}
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
