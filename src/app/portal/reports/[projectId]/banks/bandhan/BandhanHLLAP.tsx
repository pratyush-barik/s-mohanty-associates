'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  BaseDateInput,
  BasePhotoBucketModal,
  DEFAULT_PHOTO_LABEL,
} from '../BaseBankReportComponents';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import {
  PDFBandhanHLLAPRenderer,
  BandhanHLLAPReportFields,
  BandhanHLLAPFloor,
  BandhanHLLAPDRCFloor,
  BandhanHLLAPPhoto,
} from '@/lib/banks/pdf-bandhan-hllap-renderer';

export const BANDHAN_HLLAP_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Bandhan Bank — HL-LAP',
  defaultValues: {
    purpose: 'Home Loan / LAP Valuation',
  },
};

export interface BandhanHLLAPProps {
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

const formatCurrencyINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
};

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-basic', title: '1. Basic & Loan Details' },
  { id: 'sec-address', title: '2. Location & Address' },
  { id: 'sec-boundaries', title: '3. Boundaries Verification' },
  { id: 'sec-class', title: '4. Property Classification' },
  { id: 'sec-approvals', title: '5. Approval & Plan Details' },
  { id: 'sec-floors', title: '6. Floor Areas & Setbacks' },
  { id: 'sec-valuation', title: '7. Valuation & Computations' },
  { id: 'sec-progress', title: '8. Progress of Work' },
  { id: 'sec-ndma', title: '9. NDMA Parameters' },
  { id: 'sec-annexure-a', title: '10. Annexure-A & Declaration' },
  { id: 'sec-docs', title: '11. Document Enclosures' },
  { id: 'sec-photos', title: '12. Property Photographs' },
];

export default function BandhanHLLAP({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: BandhanHLLAPProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // Default Ref No
  const defaultRefNo = useMemo(() => {
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('bandhan/') ? id : `Bandhan/${id}`) : '';
  }, [projectCode, projectId]);

  // Initial State Setup
  const [fields, setFields] = useState<BandhanHLLAPReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : {};

    const defaultFloors: BandhanHLLAPFloor[] = Array.isArray(raw.floors) && raw.floors.length > 0
      ? raw.floors
      : [
          { floor: 'Basement Floor', measuredArea: 'NA', sanctionedArea: 'NA', deedArea: 'NA', currentUsage: 'NA', approvedUsage: 'NA' },
          { floor: 'Ground Floor', measuredArea: '', sanctionedArea: '', deedArea: 'NA', currentUsage: 'Residential', approvedUsage: 'Residential' },
          { floor: 'First Floor', measuredArea: '', sanctionedArea: '', deedArea: 'NA', currentUsage: 'Residential', approvedUsage: 'Residential' },
        ];

    const defaultDRCFloors: BandhanHLLAPDRCFloor[] = Array.isArray(raw.drcFloors) && raw.drcFloors.length > 0
      ? raw.drcFloors
      : [
          { particulars: 'GF', area: '', yearOfConst: '', lifeInYrs: '10', costOfConst: '', gcrc: 'No', depreciation: '50', value: '' },
          { particulars: 'FF', area: '', yearOfConst: '', lifeInYrs: '10', costOfConst: '', gcrc: 'No', depreciation: '50', value: '' },
        ];

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      organisationTemplate: raw.organisationTemplate || 'BANDHAN BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'HL_LAP',
      bankName: raw.bankName || 'BANDHAN BANK',

      // Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // 1. Basic & Loan Details (1 - 5)
      branchName: raw.branchName || 'Bandhan Bank, Bhubaneswar Branch',
      letterNoAndDate: raw.letterNoAndDate || formatReportDate(prefill?.initiationDate || new Date()),
      customerName: raw.customerName || prefill?.contactName || prefill?.serviceRequest?.guestName || '',
      mortgagorName: raw.mortgagorName || prefill?.contactName || prefill?.serviceRequest?.guestName || '',
      ownerName: raw.ownerName || '',

      // 2. Location & Address (6 - 14)
      propertyAddress: raw.propertyAddress || prefill?.propertyAddress || '',
      pinCode: raw.pinCode || prefill?.serviceRequest?.pincode || '',
      legalAddress: raw.legalAddress || prefill?.propertyAddress || '',
      landmark: raw.landmark || '',
      distanceStation: raw.distanceStation || '',
      classOfLocality: raw.classOfLocality || 'Residential',
      valuationType: raw.valuationType || 'Fresh Valuation',
      dateOfVisit: raw.dateOfVisit ? formatReportDate(raw.dateOfVisit) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())),
      qualityOfInfrastructure: raw.qualityOfInfrastructure || 'Good',

      // 3. Boundaries (15 - 16)
      boundaryNorthActual: raw.boundaryNorthActual || '',
      boundaryNorthDeed: raw.boundaryNorthDeed || '',
      boundarySouthActual: raw.boundarySouthActual || '',
      boundarySouthDeed: raw.boundarySouthDeed || '',
      boundaryEastActual: raw.boundaryEastActual || '',
      boundaryEastDeed: raw.boundaryEastDeed || '',
      boundaryWestActual: raw.boundaryWestActual || '',
      boundaryWestDeed: raw.boundaryWestDeed || '',
      boundariesMatch: raw.boundariesMatch || 'Yes',

      // 4. Classification & Structure (17 - 23)
      statusOfLand: raw.statusOfLand || 'freehold',
      typeOfProperty: raw.typeOfProperty || 'Row house',
      approvedUsage: raw.approvedUsage || 'Residential',
      actualUsage: raw.actualUsage || 'Residential',
      typeOfStructure: raw.typeOfStructure || 'RCC',
      occupancyDetails: raw.occupancyDetails || 'Self-occupied',
      unitDetails: raw.unitDetails || '',

      // 5. Approval Details (24 - 25)
      approvalAuthority: raw.approvalAuthority || '',
      layoutApprovalNo: raw.layoutApprovalNo || 'NA',
      layoutApprovalDate: raw.layoutApprovalDate ? formatReportDate(raw.layoutApprovalDate) : 'NA',
      layoutExpiryDate: raw.layoutExpiryDate ? formatReportDate(raw.layoutExpiryDate) : 'NA',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || '',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate ? formatReportDate(raw.buildingPlanApprovalDate) : '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate ? formatReportDate(raw.buildingPlanExpiryDate) : '',
      sanctionedPlanProvided: raw.sanctionedPlanProvided || '',
      planApprovedBy: raw.planApprovedBy || '',
      deedProvided: raw.deedProvided || 'NA',
      comments: raw.comments || '',
      constructionDetails: raw.constructionDetails || 'RCC Framed structure',

      // 6. Area & Floor Details (26 - 29)
      propertyArea: raw.propertyArea || '',
      floors: defaultFloors,
      carpetAreaTotal: raw.carpetAreaTotal || '',
      builtUpAreaTotal: raw.builtUpAreaTotal || '',
      remarksOnConstruction: raw.remarksOnConstruction || 'Good',
      complianceWithPlan: raw.complianceWithPlan || 'Not Applicable',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      constructionAsPerPlan: raw.constructionAsPerPlan || 'NA',
      setbackFront: raw.setbackFront || '',
      setbackBack: raw.setbackBack || '',
      setbackSide1: raw.setbackSide1 || '',
      setbackSide2: raw.setbackSide2 || '',
      noOfFlatsPerFloor: raw.noOfFlatsPerFloor || 'NA',
      maintenanceOfProperty: raw.maintenanceOfProperty || 'Good',
      presentLife: raw.presentLife || '10',
      residualLife: raw.residualLife || '50',

      // 7. Valuation Details (30 - 33, 35 - 40)
      recommendedValuationFormula: raw.recommendedValuationFormula || '',
      plotRate: raw.plotRate || '',
      plotValueBreakdown: raw.plotValueBreakdown || '',
      rateOfCostOfConstruction: raw.rateOfCostOfConstruction || '',
      depreciationOfConstruction: raw.depreciationOfConstruction || 'Nil',
      netValueOfProperty: raw.netValueOfProperty || '',
      rateOfFlat: raw.rateOfFlat || 'Not Applicable',
      areaOfFlat: raw.areaOfFlat || 'Not Applicable',
      recommendedValueOfProperty: raw.recommendedValueOfProperty || '',
      totalMarketValue: raw.totalMarketValue || '',
      valuationAsOnDate: raw.valuationAsOnDate || '',
      valuationGovtRate: raw.valuationGovtRate || '',
      distressSaleValue: raw.distressSaleValue || '',
      realisableValue: raw.realisableValue || '',
      dateCommencementCompletion: raw.dateCommencementCompletion || 'NA',
      areaOfLand: raw.areaOfLand || '',
      expectedCostOfProject: raw.expectedCostOfProject || 'NA',

      // 8. Progress of Work (34)
      progressStructureHeader: raw.progressStructureHeader || 'G+2',
      progressFoundation: raw.progressFoundation || 'Completed',
      progressRCC: raw.progressRCC || 'Completed',
      progressBR: raw.progressBR || 'Completed',
      progressPlastering: raw.progressPlastering || 'Completed',
      progressFlooring: raw.progressFlooring || 'Completed',
      progressDoorsWindows: raw.progressDoorsWindows || 'Completed',
      progressElectricalSanitary: raw.progressElectricalSanitary || 'Completed',
      progressPainting: raw.progressPainting || 'Completed',
      progressTotalPct: raw.progressTotalPct || '100%',
      progressRecommendationPct: raw.progressRecommendationPct || '100%',

      // 9. NDMA Parameters (41)
      ndmaConcreteGrade: raw.ndmaConcreteGrade || 'M25',
      ndmaHorizontalFloorType: raw.ndmaHorizontalFloorType || 'Beams and Slabs',
      ndmaSeismicZone: raw.ndmaSeismicZone || 'Zone-III',
      ndmaSteelGrade: raw.ndmaSteelGrade || 'FE - 450',
      ndmaFloodProne: raw.ndmaFloodProne || 'NO',
      ndmaUrbanFloods: raw.ndmaUrbanFloods || 'NO',
      ndmaEnvironmentExposure: raw.ndmaEnvironmentExposure || 'Mild',
      ndmaSoilSlopeLandslide: raw.ndmaSoilSlopeLandslide || 'Low Hazard Zone',
      ndmaWindCyclones: raw.ndmaWindCyclones || 'Low Damage Risk Zone',
      ndmaTsunami: raw.ndmaTsunami || 'NO',
      ndmaHeightAboveGround: raw.ndmaHeightAboveGround || 'Less Than 15m Tall',
      ndmaCRZ: raw.ndmaCRZ || 'NA',
      ndmaNatureOfBuilding: raw.ndmaNatureOfBuilding || 'Standalone Structure',
      ndmaFunctionOfUse: raw.ndmaFunctionOfUse || 'Residential',
      ndmaFoundationType: raw.ndmaFoundationType || 'Open Footing column',
      ndmaStructureType: raw.ndmaStructureType || 'RCC Framed Structure',

      // 10. Annexure-A
      annexureIntro: raw.annexureIntro || '',
      annexurePropertyDesc: raw.annexurePropertyDesc || '',
      annexureDocsVerified: raw.annexureDocsVerified || 'ROR, Copy of Sale deed & approved Plan',
      annexurePurpose: raw.annexurePurpose || 'Mortgage and Bank finance.',
      annexureGovtGuideline: raw.annexureGovtGuideline || '',
      annexureMarketEnquiry: raw.annexureMarketEnquiry || '',
      annexureCpwdBaseRate: raw.annexureCpwdBaseRate || '',
      annexureAdoptedStructures: Array.isArray(raw.annexureAdoptedStructures) ? raw.annexureAdoptedStructures : [
        { structure: 'RCC Roofing Ground Floor', cost: 'GF- Rs.1,600/- & FF- Rs.1,800/-' },
      ],
      annexureBasisOfValuation: raw.annexureBasisOfValuation || '',
      annexureMethodClassification: Array.isArray(raw.annexureMethodClassification) ? raw.annexureMethodClassification : [
        { description: 'Residential building', classification: 'Residential', ingredients: '', elements: '', approach: 'Market Approach', method: '' },
      ],
      annexureAdoptedLandRate: raw.annexureAdoptedLandRate || '',
      annexureLandArea: raw.annexureLandArea || '',
      annexureLandValue: raw.annexureLandValue || '',
      drcFloors: defaultDRCFloors,
      drcServicesCost: raw.drcServicesCost || 'Rs.0/-',
      drcServicesValue: raw.drcServicesValue || 'Rs.0/-',
      drcTotalBuildingValue: raw.drcTotalBuildingValue || '',
      summaryLandValue: raw.summaryLandValue || '',
      summaryBuildingValue: raw.summaryBuildingValue || '',
      summaryMarketValue: raw.summaryMarketValue || '',
      summaryMarketValueWords: raw.summaryMarketValueWords || '',
      opinionStatement: raw.opinionStatement || '',
      declarationItems: raw.declarationItems || [],

      // Valuer Sign-off
      valuerSignatureName: raw.valuerSignatureName || 'S. MOHANTY & ASSOCIATES',
      valuerQualification: raw.valuerQualification || 'B.Tech (Civil), M.Val (RE)',
      valuerIovRegNo: raw.valuerIovRegNo || '107/2016-17, CAT-1',
      valuerWealthTaxRegNo: raw.valuerWealthTaxRegNo || 'CCIT/BBSR/Tech-10/2017-18',
      valuerReportPagesCount: raw.valuerReportPagesCount || '12',
      declarationDate: raw.declarationDate || formatReportDate(new Date()),

      // Images / Enclosures
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

  // Auto Calculations
  useEffect(() => {
    // 1. Calculate Land Value: area in sqft * land rate
    const pArea = parseNum(fields.propertyArea || fields.areaOfLand);
    const pRate = parseNum(fields.plotRate || fields.annexureAdoptedLandRate);
    const calculatedLandVal = pArea * pRate;

    // 2. Calculate DRC Building Total
    let totalBldgVal = 0;
    (fields.drcFloors || []).forEach(df => {
      const a = parseNum(df.area);
      const c = parseNum(df.costOfConst);
      let v = 0;
      if (a && c) {
        v = a * c;
      }
      totalBldgVal += (parseNum(df.value) || v);
    });

    const netVal = calculatedLandVal + totalBldgVal;
    const realisable = Math.round(netVal * 0.95);
    const distress = Math.round(netVal * 0.90);

    // Sync values
    setFields(prev => {
      let changed = false;
      const next = { ...prev };

      if (calculatedLandVal > 0 && !prev.annexureLandValue) {
        next.annexureLandValue = formatCurrencyINR(calculatedLandVal);
        next.summaryLandValue = formatCurrencyINR(calculatedLandVal);
        changed = true;
      }
      if (totalBldgVal > 0 && !prev.drcTotalBuildingValue) {
        next.drcTotalBuildingValue = formatCurrencyINR(totalBldgVal);
        next.summaryBuildingValue = formatCurrencyINR(totalBldgVal);
        changed = true;
      }
      if (netVal > 0 && !prev.totalMarketValue) {
        const netStr = `Rs.${formatCurrencyINR(netVal)}/-`;
        next.totalMarketValue = netStr;
        next.valuationAsOnDate = netStr;
        next.recommendedValueOfProperty = netStr;
        next.summaryMarketValue = formatCurrencyINR(netVal);
        next.summaryMarketValueWords = formatIndianCurrency(netVal);
        next.distressSaleValue = `Rs.${formatCurrencyINR(distress)}/-`;
        next.realisableValue = `Rs.${formatCurrencyINR(realisable)}/-`;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [fields.propertyArea, fields.areaOfLand, fields.plotRate, fields.annexureAdoptedLandRate]);

  // Handler for standard input changes
  const handleChange = (name: keyof BandhanHLLAPReportFields, val: any) => {
    setFields(prev => ({ ...prev, [name]: val }));
  };

  // Handler for dynamic floor rows (Section 6)
  const handleFloorChange = (index: number, key: keyof BandhanHLLAPFloor, val: string) => {
    const nextFloors = [...(fields.floors || [])];
    nextFloors[index] = { ...nextFloors[index], [key]: val };
    setFields(prev => ({ ...prev, floors: nextFloors }));
  };

  const addFloorRow = () => {
    setFields(prev => ({
      ...prev,
      floors: [
        ...(prev.floors || []),
        { floor: `Floor ${(prev.floors || []).length}`, measuredArea: '', sanctionedArea: '', deedArea: 'NA', currentUsage: 'Residential', approvedUsage: 'Residential' },
      ],
    }));
  };

  const removeFloorRow = (index: number) => {
    setFields(prev => ({
      ...prev,
      floors: (prev.floors || []).filter((_, i) => i !== index),
    }));
  };

  // Handler for DRC floor rows (Section 10)
  const handleDRCFloorChange = (index: number, key: keyof BandhanHLLAPDRCFloor, val: string) => {
    const nextDRC = [...(fields.drcFloors || [])];
    nextDRC[index] = { ...nextDRC[index], [key]: val };
    setFields(prev => ({ ...prev, drcFloors: nextDRC }));
  };

  const addDRCRow = () => {
    setFields(prev => ({
      ...prev,
      drcFloors: [
        ...(prev.drcFloors || []),
        { particulars: '', area: '', yearOfConst: '', lifeInYrs: '10', costOfConst: '', gcrc: 'No', depreciation: '50', value: '' },
      ],
    }));
  };

  const removeDRCRow = (index: number) => {
    setFields(prev => ({
      ...prev,
      drcFloors: (prev.drcFloors || []).filter((_, i) => i !== index),
    }));
  };

  // Handle Photo updates
  const handlePhotoUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const currentPhotos = [...(fields.propertyPhotos || [])];
      currentPhotos[index] = {
        ...(currentPhotos[index] || {}),
        url,
        caption: currentPhotos[index]?.caption || DEFAULT_PHOTO_LABEL,
      };
      setFields(prev => ({ ...prev, propertyPhotos: currentPhotos }));
    };
    reader.readAsDataURL(file);
  };

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

  // PDF Preview
  const handlePreviewPDF = async () => {
    try {
      const renderer = new PDFBandhanHLLAPRenderer();
      const pdfBytes = await renderer.generateBandhanHLLAPReport(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      alert('Failed to generate PDF preview: ' + e.message);
    }
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    try {
      const renderer = new PDFBandhanHLLAPRenderer();
      const pdfBytes = await renderer.generateBandhanHLLAPReport(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Bandhan_Bank_HLLAP_${projectCode || projectId}.pdf`;
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

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* Top Banner */}
      <ActiveConfigBanner
        bankName="BANDHAN BANK"
        subclass="HL-LAP"
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
                Bandhan Bank — HL-LAP Valuation Report
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ref. No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.refNo || ''}
                    onChange={(e) => handleChange('refNo', e.target.value)}
                    placeholder="e.g. Bandhan/2026/07/01"
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

            {/* 1. Basic & Loan Details */}
            <Section id="sec-basic" title="1. Basic & Loan Details (Points 1–5)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="1. Name of the Bank Branch / Asset Centre / COD:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.branchName || ''}
                      onChange={(e) => handleChange('branchName', e.target.value)}
                      placeholder="e.g. Bandhan Bank, Bhubaneswar Branch"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="2. Bank Letter No and Date for undertaking valuation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.letterNoAndDate || ''}
                    onChange={(e) => handleChange('letterNoAndDate', e.target.value)}
                    placeholder="e.g. 21/07/2026"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Customer's Name [Loan Applicant]:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.customerName || ''}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    placeholder="e.g. Mousumi Jena"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="4. Mortgagor's Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.mortgagorName || ''}
                    onChange={(e) => handleChange('mortgagorName', e.target.value)}
                    placeholder="e.g. Mousumi Jena"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="5. Name of Present Owner / Seller:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    placeholder="e.g. Mousumi Jena, S/o- Subhram Kumar Jena"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 2. Location & Address */}
            <Section id="sec-address" title="2. Location & Address Details (Points 6–14)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="6. Complete Property Address:">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={fields.propertyAddress || ''}
                      onChange={(e) => handleChange('propertyAddress', e.target.value)}
                      placeholder="Khata No: ..., Plot No: ..., Mouza: ..., Dist: ..."
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="7. Pin Code:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.pinCode || ''}
                    onChange={(e) => handleChange('pinCode', e.target.value)}
                    placeholder="e.g. 756060"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="8. Legal Address:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.legalAddress || ''}
                    onChange={(e) => handleChange('legalAddress', e.target.value)}
                    placeholder="As recorded in legal title deeds"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="9. Nearby Landmark:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landmark || ''}
                    onChange={(e) => handleChange('landmark', e.target.value)}
                    placeholder="e.g. Near Hotel Golden Plaza"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="10. Distance from Rly Station / Bus Stop:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distanceStation || ''}
                    onChange={(e) => handleChange('distanceStation', e.target.value)}
                    placeholder="e.g. 7 Kms from Railway Station"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="11. Class of Locality:">
                  <select
                    className={selectCls}
                    value={fields.classOfLocality || 'Residential'}
                    onChange={(e) => handleChange('classOfLocality', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </Field>
                <Field label="12. Valuation Type:">
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
                <Field label="13. Date of Visit / Valuation Made:">
                  <BaseDateInput
                    value={fields.dateOfVisit || ''}
                    onChange={(val) => handleChange('dateOfVisit', val)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="14. Quality of Infrastructure in Vicinity:">
                  <select
                    className={selectCls}
                    value={fields.qualityOfInfrastructure || 'Good'}
                    onChange={(e) => handleChange('qualityOfInfrastructure', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* 3. Boundaries */}
            <Section id="sec-boundaries" title="3. Boundaries & Physical Verification (Points 15–16)">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  15. Boundaries of the Property (Actual vs Sale Deed)
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2.5 text-left font-semibold w-24">Direction</th>
                        <th className="p-2.5 text-left font-semibold">ACTUAL (At Site)</th>
                        <th className="p-2.5 text-left font-semibold">AS PER (Previous Sale Deed)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">North</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryNorthActual || ''}
                            onChange={(e) => handleChange('boundaryNorthActual', e.target.value)}
                            placeholder="Actual north boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryNorthDeed || ''}
                            onChange={(e) => handleChange('boundaryNorthDeed', e.target.value)}
                            placeholder="Deed north boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">South</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundarySouthActual || ''}
                            onChange={(e) => handleChange('boundarySouthActual', e.target.value)}
                            placeholder="Actual south boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundarySouthDeed || ''}
                            onChange={(e) => handleChange('boundarySouthDeed', e.target.value)}
                            placeholder="Deed south boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">East</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryEastActual || ''}
                            onChange={(e) => handleChange('boundaryEastActual', e.target.value)}
                            placeholder="Actual east boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryEastDeed || ''}
                            onChange={(e) => handleChange('boundaryEastDeed', e.target.value)}
                            placeholder="Deed east boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">West</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryWestActual || ''}
                            onChange={(e) => handleChange('boundaryWestActual', e.target.value)}
                            placeholder="Actual west boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryWestDeed || ''}
                            onChange={(e) => handleChange('boundaryWestDeed', e.target.value)}
                            placeholder="Deed west boundary"
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Field label="16. Does the boundaries at site match, as mentioned in documentation?">
                  <select
                    className={selectCls}
                    value={fields.boundariesMatch || 'Yes'}
                    onChange={(e) => handleChange('boundariesMatch', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Partially Matching">Partially Matching</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* 4. Classification & Structure */}
            <Section id="sec-class" title="4. Property Classification & Structural Usage (Points 17–23)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="17. Status of Land/Flat:">
                  <select
                    className={selectCls}
                    value={fields.statusOfLand || 'freehold'}
                    onChange={(e) => handleChange('statusOfLand', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="freehold">Freehold</option>
                    <option value="leased">Leased</option>
                    <option value="development authority">Development Authority</option>
                  </select>
                </Field>
                <Field label="18. Type of Property:">
                  <select
                    className={selectCls}
                    value={fields.typeOfProperty || 'Row house'}
                    onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Row house">Row house</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Plot">Plot</option>
                    <option value="Flat">Flat</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </Field>
                <Field label="19. Approved Usage:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.approvedUsage || 'Residential'}
                    onChange={(e) => handleChange('approvedUsage', e.target.value)}
                    placeholder="e.g. Residential"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="20. Actual Usage:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.actualUsage || 'Residential'}
                    onChange={(e) => handleChange('actualUsage', e.target.value)}
                    placeholder="e.g. Residential"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="21. Type of Structure:">
                  <select
                    className={selectCls}
                    value={fields.typeOfStructure || 'RCC'}
                    onChange={(e) => handleChange('typeOfStructure', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="RCC">RCC</option>
                    <option value="Load bearing">Load bearing</option>
                    <option value="Aluform shuttering">Aluform shuttering</option>
                  </select>
                </Field>
                <Field label="22. Occupancy Details:">
                  <select
                    className={selectCls}
                    value={fields.occupancyDetails || 'Self-occupied'}
                    onChange={(e) => handleChange('occupancyDetails', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Self-occupied">Self-occupied</option>
                    <option value="Rented">Rented</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="23. Unit Details (Rooms, Hall, Kitchen, Toilet breakdown):">
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={fields.unitDetails || ''}
                      onChange={(e) => handleChange('unitDetails', e.target.value)}
                      placeholder="GF - 2 Garage, 1 Toilet, 1 Hall, 1 Kitchen&#10;FF - 2 Office room, 1 Toilet, 1 Hall, 1 Stair room..."
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 5. Approval & Plan Details */}
            <Section id="sec-approvals" title="5. Approval & Plan Details (Points 24–25)">
              <div className="space-y-4">
                <Field label="24. Approval Authority Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.approvalAuthority || ''}
                    onChange={(e) => handleChange('approvalAuthority', e.target.value)}
                    placeholder="e.g. Balasore Regional Improvement Trust (BRIT) / BDA"
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 p-4 rounded-lg bg-slate-50/50">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-sm">Layout Approval</h4>
                    <Field label="Layout Approval No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.layoutApprovalNo || ''}
                        onChange={(e) => handleChange('layoutApprovalNo', e.target.value)}
                        placeholder="NA or Approval No"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Layout Approval Date:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.layoutApprovalDate || ''}
                        onChange={(e) => handleChange('layoutApprovalDate', e.target.value)}
                        placeholder="DD/MM/YYYY or NA"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Layout Expiry Date:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.layoutExpiryDate || ''}
                        onChange={(e) => handleChange('layoutExpiryDate', e.target.value)}
                        placeholder="DD/MM/YYYY or NA"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-sm">Building Plan Approval</h4>
                    <Field label="Building Plan Approval No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.buildingPlanApprovalNo || ''}
                        onChange={(e) => handleChange('buildingPlanApprovalNo', e.target.value)}
                        placeholder="e.g. BRIT-II-340/2011/BRIT"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Building Plan Approval Date:">
                      <BaseDateInput
                        value={fields.buildingPlanApprovalDate || ''}
                        onChange={(val) => handleChange('buildingPlanApprovalDate', val)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Building Plan Expiry Date:">
                      <BaseDateInput
                        value={fields.buildingPlanExpiryDate || ''}
                        onChange={(val) => handleChange('buildingPlanExpiryDate', val)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="25. Sanctioned Plan Provided / Plan No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.sanctionedPlanProvided || ''}
                      onChange={(e) => handleChange('sanctionedPlanProvided', e.target.value)}
                      placeholder="e.g. BRIT-II-340/2011/BRIT"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Plan Approved By:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.planApprovedBy || ''}
                      onChange={(e) => handleChange('planApprovedBy', e.target.value)}
                      placeholder="e.g. Balasore Regional Improvement Trust (BRIT)"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Deed Provided / Deed No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.deedProvided || ''}
                      onChange={(e) => handleChange('deedProvided', e.target.value)}
                      placeholder="e.g. NA or Sale Deed No"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Construction Details:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.constructionDetails || 'RCC Framed structure'}
                      onChange={(e) => handleChange('constructionDetails', e.target.value)}
                      placeholder="e.g. RCC Framed structure"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Comments, if any:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.comments || ''}
                        onChange={(e) => handleChange('comments', e.target.value)}
                        placeholder="e.g. ROR, Sale Deed, Approved Plan"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>

            {/* 6. Floor Areas & Setbacks */}
            <Section id="sec-floors" title="6. Area, Floor Breakdown & Setbacks (Points 26–29)">
              <div className="space-y-4">
                <Field label="26. Total Land / Property Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyArea || ''}
                    onChange={(e) => handleChange('propertyArea', e.target.value)}
                    placeholder="e.g. (AC.0.250Decs) i.e. 10,890 sqft."
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2 text-left">Floor Level</th>
                        <th className="p-2 text-left">As Measured (sqft)</th>
                        <th className="p-2 text-left">Sanctioned (sqft)</th>
                        <th className="p-2 text-left">Sale Deed (sqft)</th>
                        <th className="p-2 text-left">Current Usage</th>
                        <th className="p-2 text-left">Approved Usage</th>
                        {!isReadOnly && <th className="p-2 w-12 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(fields.floors || []).map((fl, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.floor || ''}
                              onChange={(e) => handleFloorChange(idx, 'floor', e.target.value)}
                              placeholder="Ground Floor"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.measuredArea || ''}
                              onChange={(e) => handleFloorChange(idx, 'measuredArea', e.target.value)}
                              placeholder="1272 sqft"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.sanctionedArea || ''}
                              onChange={(e) => handleFloorChange(idx, 'sanctionedArea', e.target.value)}
                              placeholder="1225 sqft"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.deedArea || ''}
                              onChange={(e) => handleFloorChange(idx, 'deedArea', e.target.value)}
                              placeholder="NA"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.currentUsage || ''}
                              onChange={(e) => handleFloorChange(idx, 'currentUsage', e.target.value)}
                              placeholder="Residential"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.approvedUsage || ''}
                              onChange={(e) => handleFloorChange(idx, 'approvedUsage', e.target.value)}
                              placeholder="Residential"
                              disabled={isReadOnly}
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeFloorRow(idx)}
                                className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
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

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={addFloorRow}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded border border-slate-300"
                  >
                    + Add Floor Row
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Field label="Carpet Area Total (Approx):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.carpetAreaTotal || ''}
                      onChange={(e) => handleChange('carpetAreaTotal', e.target.value)}
                      placeholder="e.g. As Per Plan (Total) - 3124sqft."
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Built-Up Area Total:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.builtUpAreaTotal || ''}
                      onChange={(e) => handleChange('builtUpAreaTotal', e.target.value)}
                      placeholder="e.g. G+1 Total BUA = 3675sqft."
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Remarks on Construction:">
                    <select
                      className={selectCls}
                      value={fields.remarksOnConstruction || 'Good'}
                      onChange={(e) => handleChange('remarksOnConstruction', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Bad">Bad</option>
                      <option value="Average">Average</option>
                    </select>
                  </Field>
                  <Field label="Compliance with Sanction Plan:">
                    <select
                      className={selectCls}
                      value={fields.complianceWithPlan || 'Not Applicable'}
                      onChange={(e) => handleChange('complianceWithPlan', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </Field>
                </div>

                {/* 27. Setbacks */}
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    27. Setback Around the Property
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Field label="Front:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackFront || ''}
                        onChange={(e) => handleChange('setbackFront', e.target.value)}
                        placeholder="Road"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Back-Side:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackBack || ''}
                        onChange={(e) => handleChange('setbackBack', e.target.value)}
                        placeholder="Vacant Land"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Side 1:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackSide1 || ''}
                        onChange={(e) => handleChange('setbackSide1', e.target.value)}
                        placeholder="Vacant Land"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Side 2:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackSide2 || ''}
                        onChange={(e) => handleChange('setbackSide2', e.target.value)}
                        placeholder="Vacant Land"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="No. of Flats / Floor:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.noOfFlatsPerFloor || 'NA'}
                        onChange={(e) => handleChange('noOfFlatsPerFloor', e.target.value)}
                        placeholder="NA"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                {/* 28 - 29 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <Field label="28. Maintenance of Property:">
                    <select
                      className={selectCls}
                      value={fields.maintenanceOfProperty || 'Good'}
                      onChange={(e) => handleChange('maintenanceOfProperty', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </Field>
                  <Field label="29. Present Life (Years):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.presentLife || '10'}
                      onChange={(e) => handleChange('presentLife', e.target.value)}
                      placeholder="10"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Residual Life (Years):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.residualLife || '50'}
                      onChange={(e) => handleChange('residualLife', e.target.value)}
                      placeholder="50"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 7. Valuation & Computations */}
            <Section id="sec-valuation" title="7. Valuation & Computations (Points 30–33, 35–40)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="30. Recommended Valuation of the Property (Land Component Formula):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.recommendedValuationFormula || ''}
                      onChange={(e) => handleChange('recommendedValuationFormula', e.target.value)}
                      placeholder="e.g. 10,890sqft * Rs.1800/- per sqft of BUA = Rs.1,96,02,000/-"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="31. Recommended Rate of the Plot (Rs./sqft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.plotRate || ''}
                    onChange={(e) => handleChange('plotRate', e.target.value)}
                    placeholder="e.g. 1800"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="32. Rate of Cost of Construction (Rs./sqft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.rateOfCostOfConstruction || ''}
                    onChange={(e) => handleChange('rateOfCostOfConstruction', e.target.value)}
                    placeholder="e.g. Rs.1600/- & Rs.1800/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Recommended Value of the Plot (Floor-wise summary):">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={fields.plotValueBreakdown || ''}
                      onChange={(e) => handleChange('plotValueBreakdown', e.target.value)}
                      placeholder="GF- 1225sqft * Rs.1600/- = Rs.19,60,000/-&#10;FF & SF- 2450sqft * Rs.1800/- = Rs.44,10,000/-&#10;TOTAL= Rs.63,70,000/-"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="33. Depreciation of Construction:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.depreciationOfConstruction || 'Nil'}
                    onChange={(e) => handleChange('depreciationOfConstruction', e.target.value)}
                    placeholder="Nil"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="33b. Net Value of Property (Land + Building):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.netValueOfProperty || ''}
                    onChange={(e) => handleChange('netValueOfProperty', e.target.value)}
                    placeholder="Rs.1,96,02,000/- + Rs.63,70,000/- = Rs.2,59,72,000/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="35. Valuation of Property as on date:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationAsOnDate || ''}
                    onChange={(e) => handleChange('valuationAsOnDate', e.target.value)}
                    placeholder="Rs.2,59,72,000/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="36. Valuation as per Govt Rates (Land):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationGovtRate || ''}
                    onChange={(e) => handleChange('valuationGovtRate', e.target.value)}
                    placeholder="Rs.286/- Per sqft * 10,890sqft. = Rs.31,14,540/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="37. Distress Sale Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distressSaleValue || ''}
                    onChange={(e) => handleChange('distressSaleValue', e.target.value)}
                    placeholder="Rs.2,33,74,800/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Realisable Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.realisableValue || ''}
                    onChange={(e) => handleChange('realisableValue', e.target.value)}
                    placeholder="Rs.2,46,73,400/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="38. Project Commencement & Completion:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dateCommencementCompletion || 'NA'}
                    onChange={(e) => handleChange('dateCommencementCompletion', e.target.value)}
                    placeholder="NA"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="39. Area of Land:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.areaOfLand || ''}
                    onChange={(e) => handleChange('areaOfLand', e.target.value)}
                    placeholder="(AC.0.250Decs) i.e. 10,890sqft."
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 8. Progress of Work */}
            <Section id="sec-progress" title="8. Progress of Work (Point 34)">
              <div className="space-y-4">
                <Field label="34. Floor Structure Level:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.progressStructureHeader || 'G+2'}
                    onChange={(e) => handleChange('progressStructureHeader', e.target.value)}
                    placeholder="e.g. G+2 or G+1"
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Foundation:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressFoundation || 'Completed'}
                      onChange={(e) => handleChange('progressFoundation', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="RCC Work:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressRCC || 'Completed'}
                      onChange={(e) => handleChange('progressRCC', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Brick Work (BR):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressBR || 'Completed'}
                      onChange={(e) => handleChange('progressBR', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Plastering:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressPlastering || 'Completed'}
                      onChange={(e) => handleChange('progressPlastering', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Flooring:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressFlooring || 'Completed'}
                      onChange={(e) => handleChange('progressFlooring', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Doors & Windows:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressDoorsWindows || 'Completed'}
                      onChange={(e) => handleChange('progressDoorsWindows', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Electrical, Sanitary & Plumbing:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressElectricalSanitary || 'Completed'}
                      onChange={(e) => handleChange('progressElectricalSanitary', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Painting:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressPainting || 'Completed'}
                      onChange={(e) => handleChange('progressPainting', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Progress of Work (%):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressTotalPct || '100%'}
                      onChange={(e) => handleChange('progressTotalPct', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Recommendation (%):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressRecommendationPct || '100%'}
                      onChange={(e) => handleChange('progressRecommendationPct', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 9. NDMA Parameters */}
            <Section id="sec-ndma" title="9. NDMA Disaster Management Parameters (Point 41)">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Field label="Concrete Grade:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaConcreteGrade || 'M25'}
                    onChange={(e) => handleChange('ndmaConcreteGrade', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Horizontal Floor Type:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaHorizontalFloorType || 'Beams and Slabs'}
                    onChange={(e) => handleChange('ndmaHorizontalFloorType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Seismic Zone:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaSeismicZone || 'Zone-III'}
                    onChange={(e) => handleChange('ndmaSeismicZone', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Steel Grade:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaSteelGrade || 'FE - 450'}
                    onChange={(e) => handleChange('ndmaSteelGrade', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Flood Prone Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaFloodProne || 'NO'}
                    onChange={(e) => handleChange('ndmaFloodProne', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Urban Floods:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaUrbanFloods || 'NO'}
                    onChange={(e) => handleChange('ndmaUrbanFloods', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Environmental Exposure:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaEnvironmentExposure || 'Mild'}
                    onChange={(e) => handleChange('ndmaEnvironmentExposure', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Soil Slope Landslide:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaSoilSlopeLandslide || 'Low Hazard Zone'}
                    onChange={(e) => handleChange('ndmaSoilSlopeLandslide', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Wind / Cyclones:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaWindCyclones || 'Low Damage Risk Zone'}
                    onChange={(e) => handleChange('ndmaWindCyclones', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Tsunami:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaTsunami || 'NO'}
                    onChange={(e) => handleChange('ndmaTsunami', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Height Above Ground:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaHeightAboveGround || 'Less Than 15m Tall'}
                    onChange={(e) => handleChange('ndmaHeightAboveGround', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="CRZ (Coastal Zone):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaCRZ || 'NA'}
                    onChange={(e) => handleChange('ndmaCRZ', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nature of Building:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaNatureOfBuilding || 'Standalone Structure'}
                    onChange={(e) => handleChange('ndmaNatureOfBuilding', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Function of Use:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaFunctionOfUse || 'Residential'}
                    onChange={(e) => handleChange('ndmaFunctionOfUse', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Foundation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaFoundationType || 'Open Footing column'}
                    onChange={(e) => handleChange('ndmaFoundationType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Structure:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ndmaStructureType || 'RCC Framed Structure'}
                    onChange={(e) => handleChange('ndmaStructureType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 10. Annexure-A */}
            <Section id="sec-annexure-a" title="10. Annexure-A: Valuation Computation & Declaration">
              <div className="space-y-4">
                <Field label="Introduction Paragraph:">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={fields.annexureIntro || ''}
                    onChange={(e) => handleChange('annexureIntro', e.target.value)}
                    placeholder="Pursuant to instructions received from The Bandhan Bank..."
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Description of Property:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.annexurePropertyDesc || ''}
                    onChange={(e) => handleChange('annexurePropertyDesc', e.target.value)}
                    placeholder="Khata No: ..., Plot No: ..., Mouza: ..."
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="List of Documents for Verification:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.annexureDocsVerified || 'ROR, Copy of Sale deed & approved Plan'}
                    onChange={(e) => handleChange('annexureDocsVerified', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* DRC Building Table */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    (B) Depreciated Replacement Cost (DRC) Table
                  </p>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-2 text-left">Particulars</th>
                          <th className="p-2 text-left">Area (sqft)</th>
                          <th className="p-2 text-left">Year</th>
                          <th className="p-2 text-left">Life (Yrs)</th>
                          <th className="p-2 text-left">Cost (Rs.)</th>
                          <th className="p-2 text-left">GCRC</th>
                          <th className="p-2 text-left">Dep. %</th>
                          <th className="p-2 text-left">Value (Rs.)</th>
                          {!isReadOnly && <th className="p-2 w-10 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(fields.drcFloors || []).map((df, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.particulars || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'particulars', e.target.value)}
                                placeholder="GF"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.area || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'area', e.target.value)}
                                placeholder="1225"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.yearOfConst || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'yearOfConst', e.target.value)}
                                placeholder="2016"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.lifeInYrs || '10'}
                                onChange={(e) => handleDRCFloorChange(idx, 'lifeInYrs', e.target.value)}
                                placeholder="10"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.costOfConst || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'costOfConst', e.target.value)}
                                placeholder="1600"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.gcrc || 'No'}
                                onChange={(e) => handleDRCFloorChange(idx, 'gcrc', e.target.value)}
                                placeholder="No"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.depreciation || '50'}
                                onChange={(e) => handleDRCFloorChange(idx, 'depreciation', e.target.value)}
                                placeholder="50"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.value || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'value', e.target.value)}
                                placeholder="19,60,000"
                                disabled={isReadOnly}
                              />
                            </td>
                            {!isReadOnly && (
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeDRCRow(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
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

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={addDRCRow}
                      className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded border border-slate-300"
                    >
                      + Add DRC Row
                    </button>
                  )}
                </div>

                {/* Valuer Credentials & Sign-off */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <Field label="Valuer Name:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerSignatureName || 'S. MOHANTY & ASSOCIATES'}
                      onChange={(e) => handleChange('valuerSignatureName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Qualifications:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerQualification || 'B.Tech (Civil), M.Val (RE)'}
                      onChange={(e) => handleChange('valuerQualification', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="IOV Reg. No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerIovRegNo || '107/2016-17, CAT-1'}
                      onChange={(e) => handleChange('valuerIovRegNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Wealth Tax Reg. No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerWealthTaxRegNo || 'CCIT/BBSR/Tech-10/2017-18'}
                      onChange={(e) => handleChange('valuerWealthTaxRegNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 11. Documents & Maps */}
            <Section id="sec-docs" title="11. Maps & Document Enclosures (Device Upload Only)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ROR Document */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">ROR (Record of Rights)</h4>
                  {fields.rorImageUrl ? (
                    <div className="space-y-2">
                      <img src={fields.rorImageUrl} alt="ROR" className="max-h-44 object-contain rounded border border-slate-200" />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleChange('rorImageUrl', '')}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove ROR
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleChange('rorImageUrl', ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={isReadOnly}
                      className="text-xs text-slate-500"
                    />
                  )}
                </div>

                {/* GPS Location Map */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">GPS Location Map</h4>
                  {fields.locationMapImageUrl ? (
                    <div className="space-y-2">
                      <img src={fields.locationMapImageUrl} alt="GPS Location" className="max-h-44 object-contain rounded border border-slate-200" />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleChange('locationMapImageUrl', '')}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove Location Map
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleChange('locationMapImageUrl', ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={isReadOnly}
                      className="text-xs text-slate-500"
                    />
                  )}
                </div>

                {/* Bhu Naksha / Cadastral Map */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">Bhu Naksha / Cadastral Map</h4>
                  {fields.bhuNakshaImageUrl ? (
                    <div className="space-y-2">
                      <img src={fields.bhuNakshaImageUrl} alt="Bhu Naksha" className="max-h-44 object-contain rounded border border-slate-200" />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleChange('bhuNakshaImageUrl', '')}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove Bhu Naksha
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleChange('bhuNakshaImageUrl', ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={isReadOnly}
                      className="text-xs text-slate-500"
                    />
                  )}
                </div>

                {/* Guideline Value Proof (Annexure-C) */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">Annexure-C: Guideline Value Proof</h4>
                  {fields.guidelineValueImageUrl ? (
                    <div className="space-y-2">
                      <img src={fields.guidelineValueImageUrl} alt="Guideline Value" className="max-h-44 object-contain rounded border border-slate-200" />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleChange('guidelineValueImageUrl', '')}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove Guideline Proof
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => handleChange('guidelineValueImageUrl', ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      disabled={isReadOnly}
                      className="text-xs text-slate-500"
                    />
                  )}
                </div>
              </div>
            </Section>

            {/* 12. Property Photographs */}
            <Section id="sec-photos" title="12. Property Photographs (Cloud Bucket & Local Upload)">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-600">
                    Upload photos of the property. Photos support GPS stamp overlays in the generated report.
                  </p>
                  <div className="flex gap-2">
                    {bucketImages && bucketImages.length > 0 && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setShowBucketModal(true)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded shadow-sm"
                      >
                        Browse Cloud Bucket
                      </button>
                    )}
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const current = [...(fields.propertyPhotos || [])];
                          current.push({ url: '', caption: DEFAULT_PHOTO_LABEL });
                          setFields(prev => ({ ...prev, propertyPhotos: current }));
                        }}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded"
                      >
                        + Add Photo Slot
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(fields.propertyPhotos || []).map((photo, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span>Photo #{idx + 1}</span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = (fields.propertyPhotos || []).filter((_, i) => i !== idx);
                              setFields(prev => ({ ...prev, propertyPhotos: filtered }));
                            }}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {photo.url ? (
                        <div className="space-y-2">
                          <img src={photo.url} alt={`Photo ${idx + 1}`} className="h-36 w-full object-cover rounded border" />
                          <input
                            type="text"
                            className={inputCls}
                            value={photo.caption || ''}
                            onChange={(e) => {
                              const updated = [...(fields.propertyPhotos || [])];
                              updated[idx].caption = e.target.value;
                              setFields(prev => ({ ...prev, propertyPhotos: updated }));
                            }}
                            placeholder="Caption (e.g. Front View, Bedroom...)"
                            disabled={isReadOnly}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-32 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-2 text-center text-xs text-slate-500">
                            <span>No image selected</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(idx, file);
                            }}
                            disabled={isReadOnly}
                            className="w-full text-xs text-slate-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
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
            const newPhotos: BandhanHLLAPPhoto[] = selectedUrls.map((url, i) => ({
              url,
              caption: `Property Photograph ${(fields.propertyPhotos?.length || 0) + i + 1}`,
            }));
            setFields(prev => ({
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
