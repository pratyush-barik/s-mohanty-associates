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
  PDFCholaInvestmentRenderer,
  CholaInvestmentFields,
  CholaCostingRow,
  CholaUnitLevel,
  CholaDocSubmitted,
  CholaChecklistItem,
} from '@/lib/banks/pdf-chola-investment-renderer';
import {
  Plus,
  Trash2,
  Coins,
  FileCheck,
  Calculator,
  RotateCcw,
} from 'lucide-react';

export const CHOLA_INVESTMENT_CONFIG: BankConfig = {
  bankId: 'CHOLAMANDALAM INVESTMENT COMPANY LTD',
  subTemplateId: '',
  displayName: 'Cholamandalam Investment and Finance Company Ltd',
  defaultValues: {
    purpose: 'Home Equity / LAP / Mortgage Valuation',
  },
  getPDFRenderer: (fields: any, projectCode?: string) =>
    new PDFCholaInvestmentRenderer({ ...fields, projectCode }),
};

export interface CholaInvestmentProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

const NAV_SECTIONS: NavItem[] = [
  { id: 'section-header', title: 'Header & Reference' },
  { id: 'section-1', title: 'Customer Details' },
  { id: 'section-2', title: 'Property Details' },
  { id: 'section-3', title: 'Boundaries & Occupancy' },
  { id: 'section-4', title: 'Unit Details' },
  { id: 'section-5', title: 'Structure & Interiors' },
  { id: 'section-6', title: 'Land & Construction Valuation' },
  { id: 'section-7', title: 'Documents Submitted' },
  { id: 'section-8', title: 'Visit Details' },
  { id: 'section-9', title: 'Electricity Connection' },
  { id: 'section-10', title: 'Risk & Benchmark Value' },
  { id: 'section-11', title: 'Compliance Checklist' },
  { id: 'section-12', title: 'Remarks & Observations' },
  { id: 'section-13', title: 'Declaration & Valuer' },
  { id: 'sec-maps', title: 'Location Maps' },
  { id: 'sec-documents', title: 'Property Documents' },
  { id: 'sec-photos', title: 'Site Photographs' },
];

const EMPTY_COSTING_ROWS: CholaCostingRow[] = [
  {
    description: 'LAND EXTENT',
    areaPlan: '',
    areaActual: '',
    rate: '',
    amountPlan: '---',
    amountActual: '',
  },
  {
    description: 'CARPET AREA',
    areaPlan: '--',
    areaActual: '--',
    rate: '--',
    amountPlan: '--',
    amountActual: '--',
  },
  {
    description: 'BUILT UP AREA',
    areaPlan: 'MENTIONED BELOW',
    areaActual: '--',
    rate: '--',
    amountPlan: '--',
    amountActual: '--',
  },
  {
    description: 'GROUND FLOOR (BUA) ON 100% COMPLETION',
    areaPlan: '',
    areaActual: '',
    rate: '',
    amountPlan: '------',
    amountActual: '',
  },
  {
    description: 'GROUND FLOOR (BUA) AS ON DATE',
    areaPlan: '',
    areaActual: '',
    rate: '',
    amountPlan: '------',
    amountActual: '',
  },
  {
    description: 'TOTAL:',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: '',
  },
  {
    description: 'LESS: DEPRECIATION',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: '',
  },
  {
    description: 'TOTAL AFTER DEPRECIATION:',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: '',
  },
  {
    description: 'TOTAL VALUE OF PROPERTY:',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: '',
  },
];

const SAMPLE_COSTING_ROWS: CholaCostingRow[] = [
  {
    description: 'LAND EXTENT',
    areaPlan: '3484 SQFT',
    areaActual: '3484 SQFT',
    rate: '300/-',
    amountPlan: '---',
    amountActual: 'Rs. 10,45,200/-',
  },
  {
    description: 'CARPET AREA',
    areaPlan: '--',
    areaActual: '--',
    rate: '--',
    amountPlan: '--',
    amountActual: '--',
  },
  {
    description: 'BUILT UP AREA',
    areaPlan: 'MENTIONED BELOW',
    areaActual: '--',
    rate: '--',
    amountPlan: '--',
    amountActual: '--',
  },
  {
    description: 'GROUND FLOOR (BUA) ON 100% COMPLETION',
    areaPlan: '900 SQFT',
    areaActual: '900 SQFT',
    rate: '1500/-',
    amountPlan: '------',
    amountActual: 'Rs. 13,50,000/-',
  },
  {
    description: 'GROUND FLOOR (BUA) AS ON DATE 10%',
    areaPlan: '900 SQFT',
    areaActual: '900 SQFT',
    rate: '150/-',
    amountPlan: '------',
    amountActual: 'Rs. 1,35,000/-',
  },
  {
    description: 'TOTAL:',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: 'Rs. 11,80,200/-',
  },
  {
    description: 'LESS: DEPRECIATION (0% PER YEAR)',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: 'Rs. 0/-',
  },
  {
    description: 'TOTAL AFTER DEPRECIATION:',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: 'Rs. 11,80,200/-',
  },
  {
    description: 'TOTAL VALUE OF PROPERTY:',
    areaPlan: '---',
    areaActual: '---',
    rate: '---',
    amountPlan: '---',
    amountActual: 'Rs. 11,80,200/-',
  },
];

const EMPTY_UNIT_LEVELS: CholaUnitLevel[] = [
  { level: 'GROUND FLOOR', rooms: '', kitchenToilet: '', others: '' },
  { level: 'FIRST FLOOR', rooms: '', kitchenToilet: '', others: '' },
];

const SAMPLE_UNIT_LEVELS: CholaUnitLevel[] = [
  { level: 'GROUND FLOOR', rooms: 'NA', kitchenToilet: '1-KITCHEN', others: 'NA' },
  { level: 'FIRST FLOOR', rooms: 'NA', kitchenToilet: 'NA', others: 'NA' },
];

const EMPTY_DOCUMENTS_SUBMITTED: CholaDocSubmitted[] = [
  { slNo: 1, description: 'SANCTION PLAN DETAILS', refNoDate: '' },
  { slNo: 2, description: 'SALE DEED PROVIDED', refNoDate: '' },
  { slNo: 3, description: 'ROR', refNoDate: '' },
  { slNo: 4, description: 'ARC COPY', refNoDate: '' },
];

const SAMPLE_DOCUMENTS_SUBMITTED: CholaDocSubmitted[] = [
  { slNo: 1, description: 'SANCTION PLAN DETAILS', refNoDate: 'APPROVED PLAN IS NOT PROVIDED.' },
  { slNo: 2, description: 'SALE DEED PROVIDED', refNoDate: 'YES' },
  { slNo: 3, description: 'ROR', refNoDate: 'YES' },
  { slNo: 4, description: 'ARC COPY', refNoDate: 'NO' },
];

const DEFAULT_CHECKLIST: CholaChecklistItem[] = [
  { slNo: 1, item: 'DOCUMENTS DETAILS MATCH WITH ACTUAL PROPERTY AT SITE', status: 'YES', remarks: 'MATCHING' },
  { slNo: 2, item: 'DOCUMENTS SUBMITTED IS CLEAR AND LEGIBLE', status: 'YES', remarks: 'CLEAR' },
  { slNo: 3, item: 'STAMP AND SEAL BY PROPER APPROVING AUTHORITY IS AVAILABLE', status: 'NA', remarks: 'NOT PROVIDED' },
  { slNo: 4, item: 'ORIGINALS OF DOCUMENTS SUBMITTED IS VERIFIED', status: 'NO', remarks: 'COPY VERIFIED' },
  { slNo: 5, item: 'OWNERSHIP CONFIRMED BY ANY OTHER DOCUMENTS', status: 'YES', remarks: 'AS PER ROR' },
  { slNo: 6, item: 'CUSTOMER IS COOPERATIVE IN VALUATION', status: 'YES', remarks: 'COOPERATIVE' },
  { slNo: 7, item: 'PROPER ACCESSIBILITY IS AVAILABLE TO REACH THE PROPERTY', status: 'YES', remarks: 'ACCESSIBLE' },
];

export default function CholaInvestment({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: CholaInvestmentProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || userRole === 'viewer' || status === 'completed';

  // ── State Initialization ──────────────────────────────────────────
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const raw = rawInitialFields || {};
    const earliestVisit = getEarliestFieldVisit(bucketImages, prefill);
    const visitDate = raw.dateOfVisit || raw.inspectionDate || earliestVisit?.date || '';
    const repDate = raw.reportDate || formatReportDate(new Date());

    return {
      // Top Reference & Header
      refNo: raw.refNo || projectCode || '',
      reportDate: repDate,
      reportTitle:
        raw.reportTitle ||
        'PROPERTY VALUATION REPORT FOR HOME EQUITY - CHOLAMANDALAM INVESTMENT FINANCE CO PVT LTD.',

      // 1. Customer Details
      customerName: raw.customerName ?? prefill?.contactName ?? '',
      applicationNo: raw.applicationNo ?? projectCode ?? '',
      dateOfVisit: visitDate,
      nameOfOwner: raw.nameOfOwner ?? prefill?.ownerName ?? '',
      contactNo: raw.contactNo ?? prefill?.contactPhone ?? '',
      personContacted: raw.personContacted ?? '',

      // 2. Property Details
      postalAddress: raw.postalAddress ?? prefill?.propertyAddress ?? '',
      addressAsPerDocument: raw.addressAsPerDocument ?? prefill?.propertyAddress ?? '',
      nearbyLandmark: raw.nearbyLandmark ?? (prefill as any)?.landmark ?? '',
      situatedIn: raw.situatedIn ?? 'RESIDENTIAL AREA.',
      distanceRailway: raw.distanceRailway ?? '',
      distanceBusStand: raw.distanceBusStand ?? '',
      distanceAirport: raw.distanceAirport ?? '',
      structure: raw.structure ?? 'R.C.C. FRAMED STRUCTURE',
      usageOfProperty: raw.usageOfProperty ?? 'RESIDENTIAL',
      shareOfUsage: raw.shareOfUsage ?? '',

      // 3. Boundaries
      boundNorthSaleDeed: raw.boundNorthSaleDeed ?? '',
      boundSouthSaleDeed: raw.boundSouthSaleDeed ?? '',
      boundEastSaleDeed: raw.boundEastSaleDeed ?? '',
      boundWestSaleDeed: raw.boundWestSaleDeed ?? '',

      boundNorthActual: raw.boundNorthActual ?? '',
      boundSouthActual: raw.boundSouthActual ?? '',
      boundEastActual: raw.boundEastActual ?? '',
      boundWestActual: raw.boundWestActual ?? '',

      boundNorthSketch: raw.boundNorthSketch ?? '',
      boundSouthSketch: raw.boundSouthSketch ?? '',
      boundEastSketch: raw.boundEastSketch ?? '',
      boundWestSketch: raw.boundWestSketch ?? '',

      ageOfProperty: raw.ageOfProperty ?? '',
      residualAgeOfProperty: raw.residualAgeOfProperty ?? '',
      occupiedBy: raw.occupiedBy ?? 'VACANT',

      // 4. Unit Details
      unitLevels: raw.unitLevels || EMPTY_UNIT_LEVELS,

      // 5. Structure & Interiors
      structureFoundation: raw.structureFoundation ?? '',
      gfFlooring: raw.gfFlooring ?? '',
      ffFlooring: raw.ffFlooring ?? '',
      sfFlooring: raw.sfFlooring ?? '',
      tfFlooring: raw.tfFlooring ?? '',
      maintenanceLevel: raw.maintenanceLevel ?? 'GOOD',

      // 6. Costing / Land & Construction
      costingRows: raw.costingRows || EMPTY_COSTING_ROWS,
      landAreaSqft: raw.landAreaSqft ?? '',
      landRateSqft: raw.landRateSqft ?? '',
      buaFullCompletionSqft: raw.buaFullCompletionSqft ?? '',
      buaFullCompletionRate: raw.buaFullCompletionRate ?? '',
      buaCurrentStagePct: raw.buaCurrentStagePct ?? '',
      depreciationRatePct: raw.depreciationRatePct ?? '0',

      totalValueApprovedArea: raw.totalValueApprovedArea ?? 'NA',
      totalValueActualConstruction: raw.totalValueActualConstruction ?? '',
      marketableConfirmation:
        raw.marketableConfirmation ??
        'WE HEREBY CONFIRM THAT THE ABOVE MENTIONED PROPERTY HAS MARKETABLE AND RECOMMENDED TO ACCEPT AFTER VERIFICATION.',
      valuationNote: raw.valuationNote ?? '',

      // 7. Documents Submitted
      documentsSubmitted: raw.documentsSubmitted || EMPTY_DOCUMENTS_SUBMITTED,

      // 8. Visit Details
      visitPersonName: raw.visitPersonName ?? '',
      visitContactDetails: raw.visitContactDetails ?? '',
      visitDateTime: raw.visitDateTime ?? '',
      visitDiscrepancies: raw.visitDiscrepancies ?? 'NA',

      // 9. Electricity Connection
      electricityConnectionName: raw.electricityConnectionName ?? '',
      electricityReferenceNo: raw.electricityReferenceNo ?? 'NA',
      electricityLatestBillDate: raw.electricityLatestBillDate ?? 'NA',

      // 10. Risk & Benchmark
      demolitionRisk: raw.demolitionRisk ?? 'LOW',
      demolitionRemark: raw.demolitionRemark ?? 'AS PER LOCAL BY-LAWS',
      govtBenchmarkValue: raw.govtBenchmarkValue ?? '',

      // 11. Checklist
      checklist: raw.checklist || DEFAULT_CHECKLIST,

      // 12. Remarks
      remarks: raw.remarks ?? '',

      // 13. Declaration
      declarationDate: raw.declarationDate || repDate,
      declarationPlace: raw.declarationPlace ?? 'BHUBANESWAR',
      valuerName: raw.valuerName ?? 'M/S. S MOHANTY ASSOCIATES',

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

  // ── Auto Calculations for Land & Construction ─────────────────────
  const autoCalculations = useMemo(() => {
    const parseSafe = (v: any) => {
      if (!v) return 0;
      const n = parseFloat(String(v).replace(/,/g, '').trim());
      return isNaN(n) ? 0 : n;
    };

    const landArea = parseSafe(fields.landAreaSqft);
    const landRate = parseSafe(fields.landRateSqft);
    const landAmount = Math.round(landArea * landRate);

    const buaArea = parseSafe(fields.buaFullCompletionSqft);
    const buaRate100 = parseSafe(fields.buaFullCompletionRate);
    const buaAmount100 = Math.round(buaArea * buaRate100);

    const stagePct = parseSafe(fields.buaCurrentStagePct);
    const buaRateCurrent = Math.round(buaRate100 * (stagePct / 100));
    const buaAmountCurrent = Math.round(buaArea * buaRateCurrent);

    const subtotal = landAmount + buaAmountCurrent;

    const depPct = parseSafe(fields.depreciationRatePct);
    // Depreciation applies strictly to the building construction, never land
    const depAmount = Math.round(buaAmountCurrent * (depPct / 100));
    const buaAfterDep = buaAmountCurrent - depAmount;
    const totalAfterDep = landAmount + buaAfterDep;

    // Rounding off to nearest thousand for verbal report representation
    const roundedValue = Math.round(totalAfterDep / 1000) * 1000;
    const words = totalAfterDep > 0 ? rupeesInWords(roundedValue) : 'Zero Rupees';

    return {
      landArea,
      landRate,
      landAmount,
      buaArea,
      buaRate100,
      buaAmount100,
      stagePct,
      buaRateCurrent,
      buaAmountCurrent,
      subtotal,
      depPct,
      depAmount,
      totalAfterDep,
      roundedValue,
      words,
    };
  }, [
    fields.landAreaSqft,
    fields.landRateSqft,
    fields.buaFullCompletionSqft,
    fields.buaFullCompletionRate,
    fields.buaCurrentStagePct,
    fields.depreciationRatePct,
  ]);

  // Sync auto calculations into fields and costingRows
  const applyAutoCalculationsToCosting = useCallback(() => {
    const calc = autoCalculations;
    const updatedCosting: CholaCostingRow[] = [
      {
        description: 'LAND EXTENT',
        areaPlan: `${calc.landArea} SQFT`,
        areaActual: `${calc.landArea} SQFT`,
        rate: `${calc.landRate}/-`,
        amountPlan: '---',
        amountActual: `Rs. ${formatIndianCurrency(calc.landAmount)}/-`,
      },
      {
        description: 'CARPET AREA',
        areaPlan: '--',
        areaActual: '--',
        rate: '--',
        amountPlan: '--',
        amountActual: '--',
      },
      {
        description: 'BUILT UP AREA',
        areaPlan: 'MENTIONED BELOW',
        areaActual: '--',
        rate: '--',
        amountPlan: '--',
        amountActual: '--',
      },
      {
        description: 'GROUND FLOOR (BUA) ON 100% COMPLETION',
        areaPlan: `${calc.buaArea} SQFT`,
        areaActual: `${calc.buaArea} SQFT`,
        rate: `${calc.buaRate100}/-`,
        amountPlan: '------',
        amountActual: `Rs. ${formatIndianCurrency(calc.buaAmount100)}/-`,
      },
      {
        description: `GROUND FLOOR (BUA) AS ON DATE ${calc.stagePct}%`,
        areaPlan: `${calc.buaArea} SQFT`,
        areaActual: `${calc.buaArea} SQFT`,
        rate: `${calc.buaRateCurrent}/-`,
        amountPlan: '------',
        amountActual: `Rs. ${formatIndianCurrency(calc.buaAmountCurrent)}/-`,
      },
      {
        description: 'TOTAL:',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: `Rs. ${formatIndianCurrency(calc.subtotal)}/-`,
      },
      {
        description: `LESS: DEPRECIATION (${calc.depPct}% PER YEAR)`,
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: `Rs. ${formatIndianCurrency(calc.depAmount)}/-`,
      },
      {
        description: 'TOTAL AFTER DEPRECIATION:',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: `Rs. ${formatIndianCurrency(calc.totalAfterDep)}/-`,
      },
      {
        description: 'TOTAL VALUE OF PROPERTY:',
        areaPlan: '---',
        areaActual: '---',
        rate: '---',
        amountPlan: '---',
        amountActual: `Rs. ${formatIndianCurrency(calc.totalAfterDep)}/-`,
      },
    ];

    const actualConstructionFormatted = `Rs. ${formatIndianCurrency(calc.totalAfterDep)}/- OR SAY-Rs. ${formatIndianCurrency(calc.roundedValue)}/- (${calc.words.toUpperCase()})`;

    setFields((prev) => ({
      ...prev,
      costingRows: updatedCosting,
      totalValueActualConstruction: actualConstructionFormatted,
    }));
  }, [autoCalculations]);

  // Unit details table handlers
  const handleAddUnitLevel = () => {
    setFields((prev) => ({
      ...prev,
      unitLevels: [
        ...(prev.unitLevels || []),
        { level: `FLOOR ${((prev.unitLevels || []).length + 1)}`, rooms: 'NA', kitchenToilet: 'NA', others: 'NA' },
      ],
    }));
  };

  const handleRemoveUnitLevel = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      unitLevels: (prev.unitLevels || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleUpdateUnitLevel = (idx: number, key: keyof CholaUnitLevel, val: string) => {
    setFields((prev) => {
      const arr = [...(prev.unitLevels || [])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, unitLevels: arr };
    });
  };

  // Costing row handlers
  const handleUpdateCostingRow = (idx: number, key: keyof CholaCostingRow, val: string) => {
    setFields((prev) => {
      const arr = [...(prev.costingRows || [])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, costingRows: arr };
    });
  };

  const handleAddCostingRow = () => {
    setFields((prev) => ({
      ...prev,
      costingRows: [
        ...(prev.costingRows || []),
        {
          description: 'EXTRA WORK / AMENITIES',
          areaPlan: '--',
          areaActual: '--',
          rate: '--',
          amountPlan: '--',
          amountActual: 'Rs. 0/-',
        },
      ],
    }));
  };

  const handleRemoveCostingRow = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      costingRows: (prev.costingRows || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  // Documents submitted table handlers
  const handleAddDoc = () => {
    setFields((prev) => {
      const arr = prev.documentsSubmitted || [];
      return {
        ...prev,
        documentsSubmitted: [
          ...arr,
          { slNo: arr.length + 1, description: 'NEW DOCUMENT', refNoDate: 'YES' },
        ],
      };
    });
  };

  const handleRemoveDoc = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      documentsSubmitted: (prev.documentsSubmitted || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleUpdateDoc = (idx: number, key: keyof CholaDocSubmitted, val: string) => {
    setFields((prev) => {
      const arr = [...(prev.documentsSubmitted || [])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, documentsSubmitted: arr };
    });
  };

  // Checklist handlers
  const handleUpdateChecklist = (idx: number, key: keyof CholaChecklistItem, val: string) => {
    setFields((prev) => {
      const arr = [...(prev.checklist || [])];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, checklist: arr };
    });
  };

  // Sync inspection date from bucket
  const handleSyncInspectionDate = useCallback(() => {
    const earliest = getEarliestFieldVisit(bucketImages, prefill);
    if (earliest?.date) {
      handleChange('dateOfVisit', earliest.date);
    }
  }, [bucketImages, prefill, handleChange]);

  // Load sample template data
  const handleLoadSampleData = () => {
    if (confirm('Load sample Bajendra Sahu report data for Cholamandalam Investment?')) {
      setFields((prev) => ({
        ...prev,
        refNo: '',
        reportDate: '12/05/2026',
        customerName: 'BAJENDRA SAHU',
        applicationNo: '61931532',
        dateOfVisit: '10/05/2026',
        nameOfOwner: 'SANJUKTA SAHU, W/O- BAJENDRA SAHU',
        contactNo: 'MOB: 7008119899',
        personContacted: 'BAJENDRA SAHU, MOB- 7008119899',
        postalAddress:
          'PLOT NO- 139/1061, MOUZA- DUARASANI, TAHASIL- KAKALAHANDI, PS- BHABANIPATNA, DIST- KALAHANDI, PIN- 766002',
        addressAsPerDocument:
          'KHATA NO- 134/689, PLOT NO- 139/1061 (AC.0.080DECS, HOMESTEAD), SUB PLOT NO-12, MOUZA-Duarasani, TAHASIL-Kakalahandi, PS-BHABANIPATNA, DIST- KALAHANDI, PIN- 766002',
        nearbyLandmark: 'Near Shridi Sai Baba Temple',
        situatedIn: 'RESIDENTIAL AREA.',
        distanceRailway: '7-KM',
        distanceBusStand: '1-KMS',
        distanceAirport: '30-KMS',
        structure: 'R.C.C. FRAMED STRUCTURE',
        usageOfProperty: 'RESIDENTIAL',
        shareOfUsage: 'UNDER CONSTRUCTION',
        boundNorthSaleDeed: 'Road',
        boundSouthSaleDeed: 'Drain',
        boundEastSaleDeed: 'Sub Plot No-13',
        boundWestSaleDeed: 'Sub Plot No-11',
        boundNorthActual: 'Road',
        boundSouthActual: 'Vacant Land',
        boundEastActual: 'Vacant Land',
        boundWestActual: 'Vacant Land',
        boundNorthSketch: 'NA',
        boundSouthSketch: 'NA',
        boundEastSketch: 'NA',
        boundWestSketch: 'NA',
        ageOfProperty: '0-YEARS',
        residualAgeOfProperty: '60-YEARS',
        occupiedBy: 'VACANT',
        unitLevels: SAMPLE_UNIT_LEVELS,
        structureFoundation: 'R.C.C. COLUMN FOUNDATION WITH BRICK MASONRY PARTITION WALLS',
        gfFlooring: 'FLOORING:- GROUND FLOOR– NOT DONE',
        ffFlooring: 'FLOORING:- FIRST FLOOR- NOT DONE',
        sfFlooring: 'FLOORING:- SECOND FLOOR- NA',
        tfFlooring: 'FLOORING:- THIRD FLOOR- NA',
        maintenanceLevel: 'GOOD',
        costingRows: SAMPLE_COSTING_ROWS,
        landAreaSqft: '3484',
        landRateSqft: '300',
        buaFullCompletionSqft: '900',
        buaFullCompletionRate: '1500',
        buaCurrentStagePct: '10',
        depreciationRatePct: '0',
        totalValueApprovedArea: 'NA',
        totalValueActualConstruction:
          'Rs. 11,80,200/- OR SAY-Rs. 11,80,000/- (ELEVEN LAKHS EIGHTY THOUSAND ONLY)',
        marketableConfirmation:
          'WE HEREBY CONFIRM THAT THE ABOVE MENTIONED PROPERTY HAS MARKETABLE AND RECOMMENDED TO ACCEPT AFTER VERIFICATION.',
        valuationNote: 'NOTE:- MEASURED BUA AREA CONSIDER FOR VALUATION',
        documentsSubmitted: SAMPLE_DOCUMENTS_SUBMITTED,
        visitPersonName: 'MR. DIBYA',
        visitContactDetails: 'MOB: NA',
        visitDateTime: '04.23 PM, 10/05/2026',
        visitDiscrepancies: 'NA',
        electricityConnectionName: 'ELECTRIC CONNECTION AVAILABLE. BILL NOT PROVIDED',
        electricityReferenceNo: 'NA',
        electricityLatestBillDate: 'NA',
        demolitionRisk: 'LOW',
        demolitionRemark: 'AS PER LOCAL BY-LAWS',
        govtBenchmarkValue: 'RS. 189/- PER SQFT OF LAND.',
        checklist: DEFAULT_CHECKLIST,
        remarks:
          'Subject property is a single storied under construction building having land extent of 3484sqft. having measured BUA 900sqft. Approved plan is not provided. It is accessible with 20-feet wide road. The property is coming under Duarasuni GP limit. All civic amenities are present within 1-2 kms from the property. At present, GF piling work completed & present stage of construction is about 10%. Valuation has been done for land component only. BUA value is not considered as the approved plan & estimate is not provided.',
        declarationDate: '12/05/2026',
        declarationPlace: 'BHUBANESWAR',
        valuerName: 'M/S. S MOHANTY ASSOCIATES',
      }));
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: CholaInvestmentFields = {
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
      const payload: CholaInvestmentFields = {
        ...fields,
        projectCode,
      };
      const renderer = new PDFCholaInvestmentRenderer(payload);
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
      const payload: CholaInvestmentFields = {
        ...fields,
        projectCode,
      };
      const renderer = new PDFCholaInvestmentRenderer(payload);
      await renderer.generateAndDownload(
        `Valuation_Report_Chola_${projectCode || fields.applicationNo || 'Report'}.pdf`
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
        bankName="CHOLAMANDALAM INVESTMENT FINANCE CO PVT LTD"
        formatName="Home Equity & LAP Valuation Format"
        projectCode={projectCode}
        status={status}
      />

      {/* Banner with Template Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
            CI
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Cholamandalam Investment and Finance Company Ltd
            </h2>
            <p className="text-xs text-slate-500">
              Interactive Valuation Report Builder &bull; Dedicated 3-Page Letterhead PDF Engine
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
            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-amber-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Reference No.">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
                />
              </Field>
              <Field label="Report Date">
                <BaseDateInput
                  value={fields.reportDate || ''}
                  onChange={(val) => handleChange('reportDate', val)}
                  disabled={isReadOnly}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Valuation Report Title">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.reportTitle || ''}
                    onChange={(e) => handleChange('reportTitle', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* SECTION 1: CUSTOMER DETAILS */}
          <Section id="section-1" title="Customer Details" number={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Customer Name">
              <input
                type="text"
                className={inputCls}
                value={fields.customerName || ''}
                onChange={(e) => handleChange('customerName', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. BAJENDRA SAHU"
              />
            </Field>
            <Field label="Application No.">
              <input
                type="text"
                className={inputCls}
                value={fields.applicationNo || ''}
                onChange={(e) => handleChange('applicationNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 61931532"
              />
            </Field>
            <Field label="Name of Owner">
              <input
                type="text"
                className={inputCls}
                value={fields.nameOfOwner || ''}
                onChange={(e) => handleChange('nameOfOwner', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. SANJUKTA SAHU, W/O- BAJENDRA SAHU"
              />
            </Field>
            <Field label="Date of Visit">
              <BaseDateInput
                value={fields.dateOfVisit || ''}
                onChange={(val) => handleChange('dateOfVisit', val)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="Contact No.">
              <input
                type="text"
                className={inputCls}
                value={fields.contactNo || ''}
                onChange={(e) => handleChange('contactNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. MOB: 7008119899"
              />
            </Field>
            <Field label="Person Contacted">
              <input
                type="text"
                className={inputCls}
                value={fields.personContacted || ''}
                onChange={(e) => handleChange('personContacted', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. BAJENDRA SAHU, MOB- 7008119899"
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 2: PROPERTY DETAILS */}
        <Section id="section-2" title="Property Details & Locality" number={2}>
          <div className="space-y-4">
            <Field label="Postal Address">
              <textarea
                rows={2}
                className={textareaCls}
                value={fields.postalAddress || ''}
                onChange={(e) => handleChange('postalAddress', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter complete postal address of the property..."
              />
            </Field>
            <Field label="Address as per Document (as per Sale Deed)">
              <textarea
                rows={2}
                className={textareaCls}
                value={fields.addressAsPerDocument || ''}
                onChange={(e) => handleChange('addressAsPerDocument', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter legal address matching sale deed / title deed..."
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nearby Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearbyLandmark || ''}
                  onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Near Shridi Sai Baba Temple"
                />
              </Field>
              <Field label="Property Situated In">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.situatedIn || ''}
                  onChange={(e) => handleChange('situatedIn', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. RESIDENTIAL AREA."
                />
              </Field>
            </div>

            {/* Distances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Field label="Railway Station Distance">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceRailway || ''}
                  onChange={(e) => handleChange('distanceRailway', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 7-KM"
                />
              </Field>
              <Field label="Bus Stand Distance">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceBusStand || ''}
                  onChange={(e) => handleChange('distanceBusStand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1-KMS"
                />
              </Field>
              <Field label="Airport Distance">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceAirport || ''}
                  onChange={(e) => handleChange('distanceAirport', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 30-KMS"
                />
              </Field>
            </div>

            {/* Structure & Usage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Structure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.structure || ''}
                  onChange={(e) => handleChange('structure', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. R.C.C. FRAMED STRUCTURE"
                />
              </Field>
              <Field label="Usage of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.usageOfProperty || ''}
                  onChange={(e) => handleChange('usageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. RESIDENTIAL"
                />
              </Field>
              <Field label="Share of Usage">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.shareOfUsage || ''}
                  onChange={(e) => handleChange('shareOfUsage', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. UNDER CONSTRUCTION"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 3: BOUNDARIES & OCCUPANCY */}
        <Section id="section-3" title="Boundaries & Occupancy Details" number={3}>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Provide direction boundaries as per Sale Deed, Actual at Site, and Sketch Map.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3 w-40">BOUNDARIES</th>
                    <th className="p-3">NORTH</th>
                    <th className="p-3">SOUTH</th>
                    <th className="p-3">EAST</th>
                    <th className="p-3">WEST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-medium bg-slate-50">AS PER SALE DEED</td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundNorthSaleDeed || ''}
                        onChange={(e) => handleChange('boundNorthSaleDeed', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Road"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundSouthSaleDeed || ''}
                        onChange={(e) => handleChange('boundSouthSaleDeed', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Drain"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundEastSaleDeed || ''}
                        onChange={(e) => handleChange('boundEastSaleDeed', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Sub Plot No-13"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundWestSaleDeed || ''}
                        onChange={(e) => handleChange('boundWestSaleDeed', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Sub Plot No-11"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium bg-slate-50">AS PER ACTUAL</td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundNorthActual || ''}
                        onChange={(e) => handleChange('boundNorthActual', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Road"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundSouthActual || ''}
                        onChange={(e) => handleChange('boundSouthActual', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Vacant Land"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundEastActual || ''}
                        onChange={(e) => handleChange('boundEastActual', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Vacant Land"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundWestActual || ''}
                        onChange={(e) => handleChange('boundWestActual', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Vacant Land"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium bg-slate-50">AS PER SKETCH MAP</td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundNorthSketch || ''}
                        onChange={(e) => handleChange('boundNorthSketch', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="NA"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundSouthSketch || ''}
                        onChange={(e) => handleChange('boundSouthSketch', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="NA"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundEastSketch || ''}
                        onChange={(e) => handleChange('boundEastSketch', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="NA"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundWestSketch || ''}
                        onChange={(e) => handleChange('boundWestSketch', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="NA"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Field label="Age of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={(e) => handleChange('ageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 0-YEARS"
                />
              </Field>
              <Field label="Residual Age of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.residualAgeOfProperty || ''}
                  onChange={(e) => handleChange('residualAgeOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 60-YEARS"
                />
              </Field>
              <Field label="Occupied By">
                <select
                  className={selectCls}
                  value={fields.occupiedBy || 'VACANT'}
                  onChange={(e) => handleChange('occupiedBy', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="VACANT">VACANT</option>
                  <option value="APPLICANT">APPLICANT</option>
                  <option value="OWNER">OWNER</option>
                  <option value="RELATIVE">RELATIVE</option>
                  <option value="TENANT">TENANT</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 4: UNIT DETAILS */}
        <Section id="section-4" title="Unit Details (Floor-wise Accommodation)" number={4}>
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3 w-44">DETAILS OF LEVELS</th>
                    <th className="p-3">NO OF ROOMS</th>
                    <th className="p-3">NO OF KITCHEN & TOILET</th>
                    <th className="p-3">OTHERS</th>
                    {!isReadOnly && <th className="p-3 w-16 text-center">ACTION</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.unitLevels || []).map((row: CholaUnitLevel, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.level || ''}
                          onChange={(e) => handleUpdateUnitLevel(idx, 'level', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. GROUND FLOOR"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.rooms || ''}
                          onChange={(e) => handleUpdateUnitLevel(idx, 'rooms', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.kitchenToilet || ''}
                          onChange={(e) => handleUpdateUnitLevel(idx, 'kitchenToilet', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="1-KITCHEN"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.others || ''}
                          onChange={(e) => handleUpdateUnitLevel(idx, 'others', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitLevel(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove level"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddUnitLevel}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Level Row
              </button>
            )}
          </div>
        </Section>

        {/* SECTION 5: STRUCTURE & INTERIORS */}
        <Section id="section-5" title="Structure & Interior Finishes" number={5}>
          <div className="space-y-4">
            <Field label="Structure Foundation & Wall Description">
              <input
                type="text"
                className={inputCls}
                value={fields.structureFoundation || ''}
                onChange={(e) => handleChange('structureFoundation', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. R.C.C. COLUMN FOUNDATION WITH BRICK MASONRY PARTITION WALLS"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Field label="G.F. - R.C.C (Ground Floor)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.gfFlooring || ''}
                  onChange={(e) => handleChange('gfFlooring', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="FLOORING:- GROUND FLOOR– NOT DONE"
                />
              </Field>
              <Field label="F.F. - R.C.C (First Floor)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ffFlooring || ''}
                  onChange={(e) => handleChange('ffFlooring', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="FLOORING:- FIRST FLOOR- NOT DONE"
                />
              </Field>
              <Field label="S.F. - R.C.C (Second Floor)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sfFlooring || ''}
                  onChange={(e) => handleChange('sfFlooring', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="FLOORING:- SECOND FLOOR- NA"
                />
              </Field>
              <Field label="T.F. - R.C.C (Third Floor)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tfFlooring || ''}
                  onChange={(e) => handleChange('tfFlooring', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="FLOORING:- THIRD FLOOR- NA"
                />
              </Field>
            </div>

            <Field label="Maintenance Level">
              <select
                className={selectCls}
                value={fields.maintenanceLevel || 'GOOD'}
                onChange={(e) => handleChange('maintenanceLevel', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="EXCELLENT">EXCELLENT</option>
                <option value="GOOD">GOOD</option>
                <option value="AVERAGE">AVERAGE</option>
                <option value="POOR">POOR</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* SECTION 6: LAND AND CONSTRUCTION DETAILS */}
        <Section id="section-6" title="Land & Construction Details (Valuation Table)" number={6}>
          <div className="space-y-6">
            {/* Auto-Calculation helper card */}
            <div className="bg-amber-500/10 border border-amber-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <Coins className="w-4 h-4 text-amber-600" />
                  Valuation Rate & Stage Parameter Controls
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={applyAutoCalculationsToCosting}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Auto-Fill Costing Rows Below
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Land Area (Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={(e) => handleChange('landAreaSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="3484"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Land Rate (Rs/Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.landRateSqft || ''}
                    onChange={(e) => handleChange('landRateSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="300"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">BUA Area (Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.buaFullCompletionSqft || ''}
                    onChange={(e) => handleChange('buaFullCompletionSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="900"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">100% Rate (Rs/Sqft)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.buaFullCompletionRate || ''}
                    onChange={(e) => handleChange('buaFullCompletionRate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Stage of Const. (%)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.buaCurrentStagePct || ''}
                    onChange={(e) => handleChange('buaCurrentStagePct', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Depreciation (%)</label>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={fields.depreciationRatePct || ''}
                    onChange={(e) => handleChange('depreciationRatePct', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Calculated Summary Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-amber-200/60 text-xs">
                <span className="text-slate-700">
                  Land Value: <strong>Rs. {formatIndianCurrency(autoCalculations.landAmount)}</strong>
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-700">
                  Stage Value ({autoCalculations.stagePct}%):{' '}
                  <strong>Rs. {formatIndianCurrency(autoCalculations.buaAmountCurrent)}</strong>
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-700">
                  Net Property Value:{' '}
                  <strong className="text-emerald-700 font-bold">
                    Rs. {formatIndianCurrency(autoCalculations.totalAfterDep)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Costing Table Grid */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3 w-72">DESCRIPTION</th>
                    <th className="p-3">AREA PER PLAN (SQFT)</th>
                    <th className="p-3">AREA ACTUAL (SQFT)</th>
                    <th className="p-3">RATE PER SQFT</th>
                    <th className="p-3">AMOUNT PER PLAN</th>
                    <th className="p-3">AMOUNT PER ACTUAL</th>
                    {!isReadOnly && <th className="p-3 w-14 text-center">ACTION</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.costingRows || []).map((row: CholaCostingRow, idx: number) => {
                    const isTotal =
                      row.description.includes('TOTAL') ||
                      row.description.includes('TOTAL VALUE');
                    return (
                      <tr
                        key={idx}
                        className={`${
                          isTotal ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="text"
                            className={`${inputCls} ${isTotal ? 'font-bold' : ''}`}
                            value={row.description || ''}
                            onChange={(e) => handleUpdateCostingRow(idx, 'description', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.areaPlan || ''}
                            onChange={(e) => handleUpdateCostingRow(idx, 'areaPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.areaActual || ''}
                            onChange={(e) => handleUpdateCostingRow(idx, 'areaActual', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.rate || ''}
                            onChange={(e) => handleUpdateCostingRow(idx, 'rate', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.amountPlan || ''}
                            onChange={(e) => handleUpdateCostingRow(idx, 'amountPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={`${inputCls} ${isTotal ? 'text-emerald-700 font-bold' : ''}`}
                            value={row.amountActual || ''}
                            onChange={(e) => handleUpdateCostingRow(idx, 'amountActual', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        {!isReadOnly && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCostingRow(idx)}
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
                onClick={handleAddCostingRow}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Extra Costing Row
              </button>
            )}

            {/* Valuation Summary Outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Field label="Total Value of Property as per Approved Area">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalValueApprovedArea || ''}
                  onChange={(e) => handleChange('totalValueApprovedArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
              <Field label="Total Value of Property as per Actual Construction">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-emerald-800`}
                  value={fields.totalValueActualConstruction || ''}
                  onChange={(e) => handleChange('totalValueActualConstruction', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 11,80,200/- OR SAY-Rs. 11,80,000/- (...)"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Marketable Confirmation Statement">
                  <textarea
                    rows={2}
                    className={textareaCls}
                    value={fields.marketableConfirmation || ''}
                    onChange={(e) => handleChange('marketableConfirmation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Valuation Specific Note">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationNote || ''}
                    onChange={(e) => handleChange('valuationNote', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="NOTE:- MEASURED BUA AREA CONSIDER FOR VALUATION"
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 7: DOCUMENTS SUBMITTED */}
        <Section id="section-7" title="Documents Submitted" number={7}>
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3 w-16 text-center">SL NO.</th>
                    <th className="p-3">DESCRIPTION</th>
                    <th className="p-3">REFERENCE NO. & DATE</th>
                    {!isReadOnly && <th className="p-3 w-16 text-center">ACTION</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.documentsSubmitted || []).map((doc: CholaDocSubmitted, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          className={`${inputCls} text-center`}
                          value={doc.slNo || ''}
                          onChange={(e) => handleUpdateDoc(idx, 'slNo', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={doc.description || ''}
                          onChange={(e) => handleUpdateDoc(idx, 'description', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. SALE DEED PROVIDED"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={doc.refNoDate || ''}
                          onChange={(e) => handleUpdateDoc(idx, 'refNoDate', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="YES / NO / Ref details"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddDoc}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Document Row
              </button>
            )}
          </div>
        </Section>

        {/* SECTION 8: VISIT DETAILS */}
        <Section id="section-8" title="Visit & Inspection Details" number={8}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name of the Person Met at Site">
              <input
                type="text"
                className={inputCls}
                value={fields.visitPersonName || ''}
                onChange={(e) => handleChange('visitPersonName', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. MR. DIBYA"
              />
            </Field>
            <Field label="Contact Details">
              <input
                type="text"
                className={inputCls}
                value={fields.visitContactDetails || ''}
                onChange={(e) => handleChange('visitContactDetails', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. MOB: NA"
              />
            </Field>
            <Field label="Visited Time & Date">
              <input
                type="text"
                className={inputCls}
                value={fields.visitDateTime || ''}
                onChange={(e) => handleChange('visitDateTime', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 04.23 PM, 10/05/2026"
              />
            </Field>
            <Field label="Discrepancies / Mismatch in Details (If Any)">
              <input
                type="text"
                className={inputCls}
                value={fields.visitDiscrepancies || ''}
                onChange={(e) => handleChange('visitDiscrepancies', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. NA"
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 9: ELECTRICITY CONNECTION */}
        <Section id="section-9" title="Electricity Connection Details" number={9}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Field label="Connection in the Name of">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.electricityConnectionName || ''}
                  onChange={(e) => handleChange('electricityConnectionName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. ELECTRIC CONNECTION AVAILABLE. BILL NOT PROVIDED"
                />
              </Field>
            </div>
            <Field label="Reference Number (Consumer No)">
              <input
                type="text"
                className={inputCls}
                value={fields.electricityReferenceNo || ''}
                onChange={(e) => handleChange('electricityReferenceNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>
            <Field label="Latest Bill Date Available">
              <input
                type="text"
                className={inputCls}
                value={fields.electricityLatestBillDate || ''}
                onChange={(e) => handleChange('electricityLatestBillDate', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 10: DEMOLITION RISK & BENCHMARK VALUE */}
        <Section id="section-10" title="Risk of Demolition & Benchmark Value" number={10}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Risk of Demolition">
              <select
                className={selectCls}
                value={fields.demolitionRisk || 'LOW'}
                onChange={(e) => handleChange('demolitionRisk', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </Field>
            <Field label="Demolition Remark">
              <input
                type="text"
                className={inputCls}
                value={fields.demolitionRemark || ''}
                onChange={(e) => handleChange('demolitionRemark', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. AS PER LOCAL BY-LAWS"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Govt. Benchmark / Guideline Value of Land per Sqft">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.govtBenchmarkValue || ''}
                  onChange={(e) => handleChange('govtBenchmarkValue', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. RS. 189/- PER SQFT OF LAND."
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 11: COMPLIANCE CHECKLIST */}
        <Section id="section-11" title="Technical Compliance Checklist" number={11}>
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">CHECKLIST ITEM</th>
                    <th className="p-3 w-48 text-center">STATUS</th>
                    <th className="p-3 w-48">REMARKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.checklist || []).map((chk: CholaChecklistItem, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-bold text-slate-500">{chk.slNo}</td>
                      <td className="p-3 font-medium text-slate-800">{chk.item}</td>
                      <td className="p-2 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                          {['YES', 'NO', 'NA'].map((st) => {
                            const isSelected = chk.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateChecklist(idx, 'status', st)}
                                disabled={isReadOnly}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                                  isSelected
                                    ? st === 'YES'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : st === 'NO'
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={chk.remarks || ''}
                          onChange={(e) => handleUpdateChecklist(idx, 'remarks', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Remark..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* SECTION 12: REMARKS */}
        <Section id="section-12" title="Technical Remarks & Observations" number={12}>
          <div className="space-y-4">
            <Field label="Detailed Narrative Remarks">
              <textarea
                rows={6}
                className={textareaCls}
                value={fields.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter complete technical remarks regarding property accessibility, construction stage, approval status, amenities..."
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 13: DECLARATION & VALUER */}
        <Section id="section-13" title="Declaration & Valuer Signatures" number={13}>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-700">Standard Valuation Undertaking:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>I have no direct or indirect interest in the property valued.</li>
                <li>Information furnished in the report is true and correct to the best of my knowledge and belief.</li>
                <li>
                  Fair market value indicated in the report is an opinion of the value prevailing on the date of the
                  said report and is based on market feedback on values of similar properties.
                </li>
                <li>Report does not certify or confirm any ownership or title of the property that has been valued.</li>
                <li>No structural survey was conducted by us.</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                  placeholder="e.g. BHUBANESWAR"
                />
              </Field>
              <Field label="Authorized Signatory / Valuer Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuerName || ''}
                  onChange={(e) => handleChange('valuerName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. M/S. S MOHANTY ASSOCIATES"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 14: LOCATION MAPS */}
        <BaseMapsSection
          title="Location Maps"
          sectionId="sec-maps"
          sectionNumber={14}
          locationMapImages={fields.locationMaps || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          onLatitudeChange={(val) => handleChange('latitude', val)}
          onLongitudeChange={(val) => handleChange('longitude', val)}
          propertyAddress={fields.postalAddress || fields.addressAsPerDocument || ''}
          fields={fields}
          isReadOnly={isReadOnly}
          onLocationMapRemove={(idx?: number) => {
            if (idx !== undefined) {
              handleChange('locationMaps', (fields.locationMaps || []).filter((_: any, i: number) => i !== idx));
            }
          }}
        />

        {/* SECTION 15: DOCUMENTS GALLERY */}
        <BaseDocumentsSection
          title="Property Documents"
          sectionId="sec-documents"
          sectionNumber={15}
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

        {/* SECTION 16: PHOTOGRAPHS GALLERY */}
        <BasePhotographsSection
          title="Property Site Photographs"
          sectionId="sec-photos"
          sectionNumber={16}
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
