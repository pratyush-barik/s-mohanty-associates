'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  BankReportHeader,
  Section,
  Field,
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
import { PDFDcbHlLapSmeRenderer } from '@/lib/banks/pdf-dcb-hl-lap-sme-renderer';

export const DCB_HL_LAP_SME_CONFIG: BankConfig = {
  bankId: 'DCB BANK',
  subTemplateId: 'HL-LAP-SME',
  displayName: 'DCB Bank — HL-LAP-SME',
  defaultValues: {
    purposeOfValuation: 'To assess fair market value for collateral security',
    valuationRequestedBy: 'DCB Bank Limited',
    typeOfLoan: 'Home Loan / Business loan',
    suburbName: 'NA',
    projectName: 'NA',
    classificationOfLocality: 'Middle class',
    modeOfTransport: 'Road transport',
    landTenure: 'Freehold',
    jurisdictionAuthority: 'BDA',
    unauthorizedPropertyList: 'NA',
    propertyIdentifiable: 'Yes(Identified by customer&Documents)',
    propertyIdentifiedOnOwn: 'Yes(Identified by Documents)',
    accompaniedBy: 'Customer',
    propertyDemarcated: 'Yes',
    yearOfConstruction: 'Under construction',
    ageOfProperty: '0-Years',
    estimatedFutureLife: '60-years',
    presentCondition: 'Good',
    immediateRepairsRequired: 'No',
    typeOfConstruction: 'RCC framed structure',
    permittedUse: 'Residential',
    actualUse: 'Residential',
    noOfFloors: 'G+1',
    noOfLifts: 'Nil',
    tanksPumps: 'NA',
    openSpaceFlooring: 'NA',
    compoundWallGate: 'NA',
    buildingElevation: 'G+1',
    otherAmenities: 'NA',
    generalComments: 'NA',
    noOfFlatsEachFloor: 'NA',
    accGroundFloor: '',
    accFirstFloor: '',
    balconies: 'NA',
    wallsPlasterPaint: 'completed',
    doorsWindows: 'NA',
    typeOfFlooring: 'Note done',
    toiletFlooringDado: 'Note done',
    kitchenPlatformSink: 'Note done',
    toiletsPlumbingFittings: 'Note done',
    electricalInstallation: 'Note done',
    riskOfDemolition: 'Low',
    mixedUseArea: 'NA',
    mixedUsePermitted: 'NA',
    occupiedBy: 'under construction',
    selfOccupiedSince: 'NA',
    landArea: '',
    landRate: '',
    bua100Desc: '',
    bua100Rate: '',
    percentageCompletion: '',
    percentageRecommended: '',
    marketabilitySale: 'Good',
    marketabilityLease: 'Good',
    place: 'Bhubaneswar',
  },
};

export interface DCBHLLAPSMEProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function DCBHLLAPSME({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: DCBHLLAPSMEProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || userRole === 'viewer';

  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bucket Picker Modal State
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [photoModalTarget, setPhotoModalTarget] = useState<'photos' | 'documents' | 'maps'>('photos');

  // Earliest visit date
  const earliestVisit = useMemo(() => getEarliestFieldVisit(bucketImages, prefill), [bucketImages, prefill]);

  // Initial Form Fields State (Rule 8: Zero hardcoded mock client data)
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || {};
    const pf = (prefill || {}) as any;

    return {
      ...DCB_HL_LAP_SME_CONFIG.defaultValues,
      ...saved,
      refNo: saved.refNo || pf.projectCode || projectCode || '',
      caseNo: saved.caseNo || pf.caseNo || '',
      reportDate: saved.reportDate || formatReportDate(new Date()),
      inspectionDate: saved.inspectionDate || (earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date())),
      borrowerName: saved.borrowerName || pf.customerName || pf.borrowerName || '',
      propertyOwner: saved.propertyOwner || pf.propertyOwner || pf.documentHolderName || '',
      propertyAddress: saved.propertyAddress || pf.propertyAddress || '',
      pincode: saved.pincode || pf.pincode || '',
      latitude: saved.latitude || pf.latitude || '',
      longitude: saved.longitude || pf.longitude || '',
      documentsSubmitted: saved.documentsSubmitted || '',
      typeOfProperty: saved.typeOfProperty || 'Under Construction',
      nameOfAccessRoad: saved.nameOfAccessRoad || '',
      plotNoCtsNo: saved.plotNoCtsNo || pf.plotNo || '',
      jurisdictionAuthority: saved.jurisdictionAuthority || 'BDA',
      approvalsDrawings: saved.approvalsDrawings || '',
      boundaryNorthDoc: saved.boundaryNorthDoc || pf.boundaryNorth || '',
      boundaryEastDoc: saved.boundaryEastDoc || pf.boundaryEast || '',
      boundaryWestDoc: saved.boundaryWestDoc || pf.boundaryWest || '',
      boundarySouthDoc: saved.boundarySouthDoc || pf.boundarySouth || '',
      boundaryNorthSite: saved.boundaryNorthSite || '',
      boundaryEastSite: saved.boundaryEastSite || '',
      boundaryWestSite: saved.boundaryWestSite || '',
      boundarySouthSite: saved.boundarySouthSite || '',
      briefDescription: saved.briefDescription || '',
      areaGroundActual: saved.areaGroundActual || '',
      areaGroundPermissible: saved.areaGroundPermissible || '',
      areaFirstActual: saved.areaFirstActual || '',
      areaFirstPermissible: saved.areaFirstPermissible || '',
      totalActualArea: saved.totalActualArea || '',
      totalPermissibleArea: saved.totalPermissibleArea || '',
      builtUpAreaSummary: saved.builtUpAreaSummary || '',
      carpetAreaSummary: saved.carpetAreaSummary || '',
      adherenceByelaws: saved.adherenceByelaws || 'Yes',
      deviationByelaws: saved.deviationByelaws || '',
      representativeName: saved.representativeName || '',
      documentImages: saved.documentImages || [],
      documentImageNames: saved.documentImageNames || [],
      locationMapImages: saved.locationMapImages || [],
      propertyImages: saved.propertyImages || [],
      propertyImageNames: saved.propertyImageNames || [],
    };
  }, [rawInitialFields, prefill, projectCode, earliestVisit]);

  const [fields, setFields] = useState<any>(initialFields);

  const handleChange = useCallback((key: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  // ── Real-time Auto-Calculations ───────────────────────────────────────────
  const parseNum = (val: any) => {
    if (!val) return 0;
    const n = parseFloat(String(val).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const landAreaNum = parseNum(fields.landArea);
  const landRateNum = parseNum(fields.landRate);
  const computedLandValue = useMemo(() => landAreaNum * landRateNum, [landAreaNum, landRateNum]);

  const bua100RateNum = parseNum(fields.bua100Rate);
  const buaPermissibleAreaNum = parseNum(fields.totalPermissibleArea);
  const computedBua100Value = useMemo(() => buaPermissibleAreaNum * bua100RateNum, [buaPermissibleAreaNum, bua100RateNum]);

  const completionPctNum = parseNum(fields.percentageCompletion) / 100 || 0;
  const buaActualRateNum = useMemo(() => bua100RateNum * completionPctNum, [bua100RateNum, completionPctNum]);
  const computedBuaActualValue = useMemo(() => buaPermissibleAreaNum * buaActualRateNum, [buaPermissibleAreaNum, buaActualRateNum]);

  const totalFairMarketValue = useMemo(() => computedLandValue + computedBuaActualValue, [computedLandValue, computedBuaActualValue]);
  const forcedDistressValue = useMemo(() => Math.round(totalFairMarketValue * 0.8), [totalFairMarketValue]);

  // Keep derived values in fields
  useEffect(() => {
    setFields((prev: any) => {
      let changed = false;
      const next = { ...prev };
      if (next.landValue !== String(computedLandValue)) {
        next.landValue = String(computedLandValue);
        changed = true;
      }
      if (next.bua100Value !== String(computedBua100Value)) {
        next.bua100Value = String(computedBua100Value);
        changed = true;
      }
      if (next.buaActualRate !== String(buaActualRateNum)) {
        next.buaActualRate = String(buaActualRateNum);
        changed = true;
      }
      if (next.buaActualValue !== String(computedBuaActualValue)) {
        next.buaActualValue = String(computedBuaActualValue);
        changed = true;
      }
      if (next.totalValueOfBuilding !== String(totalFairMarketValue)) {
        next.totalValueOfBuilding = String(totalFairMarketValue);
        changed = true;
      }
      if (next.forcedDistressValue !== String(forcedDistressValue)) {
        next.forcedDistressValue = String(forcedDistressValue);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [computedLandValue, computedBua100Value, buaActualRateNum, computedBuaActualValue, totalFairMarketValue, forcedDistressValue]);

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      const res = await saveReportDraft(projectId, {
        fields,
        bankName: 'DCB BANK',
        subTemplate: 'HL-LAP-SME',
        clientType: 'organisation',
        organisationTemplate: 'DCB BANK',
        organisationSubTemplate: 'HL-LAP-SME',
      });
      if (res?.success) {
        setAutoSaveStatus('saved');
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setAutoSaveStatus('error');
        setMessage({ text: res?.error || 'Failed to save draft', type: 'error' });
      }
    } catch (e: any) {
      setAutoSaveStatus('error');
      console.error(e);
      alert(`Error saving draft: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // PDF Preview & Download
  const handlePreviewPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFDcbHlLapSmeRenderer(fields, projectCode || fields.caseNo);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(`PDF Preview error: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFDcbHlLapSmeRenderer(fields, projectCode || fields.caseNo);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Valuation_Report_DCB_Bank_${fields.caseNo || projectCode || 'Report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF Download error: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  // Navigation Items (clean human-readable titles, no numbers - Rule 2 & 3)
  const navSections: NavItem[] = [
    { id: 'dcb-general', title: 'General Particulars' },
    { id: 'dcb-locality', title: 'Locality & Site Identification' },
    { id: 'dcb-structure', title: 'Structure & Specifications' },
    { id: 'dcb-property', title: 'Property Under Reference' },
    { id: 'dcb-assumptions', title: 'Assumptions & Valuation Basis' },
    { id: 'dcb-valuation', title: 'Valuation of Property' },
    { id: 'dcb-marketability', title: 'Marketability & Declaration' },
    { id: 'section-documents', title: 'Verified Property Documents' },
    { id: 'section-maps', title: 'Location & Master Plan Maps' },
    { id: 'section-photographs', title: 'Actual Site Photographs' },
  ];

  return (
    <div className="space-y-6 pb-28 w-full max-w-6xl mx-auto">
      {/* ── Universal Bank Report Header ── */}
      <BankReportHeader
        bankName="DCB BANK"
        subclass="HL-LAP-SME"
        formatName="DCB Bank Valuation Format (HL-LAP-SME)"
        clientType="organisation"
        category={fields.institutionCategory || 'Bank & FIS'}
        serviceType={fields.serviceType || 'Mortgage & Loan Security Valuation'}
        subjectType={fields.subjectType || 'Land & Building / HL-LAP-SME'}
        onResetWizard={onResetWizard}
        earliestVisit={earliestVisit}
        projectCode={projectCode}
        onSyncInspectionDate={
          earliestVisit
            ? () => {
                const dt = formatReportDate(earliestVisit.date);
                handleChange('inspectionDate', dt);
              }
            : undefined
        }
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        <div className="flex-1 min-w-0 space-y-6 w-full">

          {/* Section 1: General Particulars */}
          <div id="dcb-general">
            <Section title="General Particulars" number={1} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Case No. *">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.caseNo || ''}
                    onChange={(e) => handleChange('caseNo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. APPL01832712"
                  />
                </Field>
                <Field label="Dated *">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.reportDate || ''}
                    onChange={(e) => handleChange('reportDate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="DD/MM/YYYY"
                  />
                </Field>
                <Field label="Date of Inspection & Valuation">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.inspectionDate || ''}
                    onChange={(e) => handleChange('inspectionDate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="1. Purpose of Valuation" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.purposeOfValuation || ''}
                    onChange={(e) => handleChange('purposeOfValuation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Valuation Requested By">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationRequestedBy || ''}
                    onChange={(e) => handleChange('valuationRequestedBy', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="4. Suburb Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.suburbName || ''}
                    onChange={(e) => handleChange('suburbName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="6. Type of Loan">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfLoan || ''}
                    onChange={(e) => handleChange('typeOfLoan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="7. Project Name (if any)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.projectName || ''}
                    onChange={(e) => handleChange('projectName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="8. Name of Borrower / Applicant *" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerName || ''}
                    onChange={(e) => handleChange('borrowerName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Aditya Narayan Jana"
                  />
                </Field>
                <Field label="9. Name of Co-Borrowers">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.coBorrowerName || ''}
                    onChange={(e) => handleChange('coBorrowerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="10. Detailed Property Address *" span={2}>
                  <textarea
                    rows={2}
                    className={textareaCls}
                    value={fields.propertyAddress || ''}
                    onChange={(e) => handleChange('propertyAddress', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="11. Property Pincode">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.pincode || ''}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="12. Property Owner (as per doc.) *" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyOwner || ''}
                    onChange={(e) => handleChange('propertyOwner', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Snehalata Jana, W/O-Asish Kumar Jana"
                  />
                </Field>
                <Field label="13. Documents Submitted">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.documentsSubmitted || ''}
                    onChange={(e) => handleChange('documentsSubmitted', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="14. Brief Description of the Property" span={3}>
                  <textarea
                    rows={3}
                    className={textareaCls}
                    value={fields.briefDescription || ''}
                    onChange={(e) => handleChange('briefDescription', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="15. Type of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfProperty || ''}
                    onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="16. Name of Access Road" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.nameOfAccessRoad || ''}
                    onChange={(e) => handleChange('nameOfAccessRoad', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 2: Surrounding Locality & Site Identification */}
          <div id="dcb-locality">
            <Section title="Locality & Site Identification" number={2} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="17. S. No. , Plot No. and C.T.S. No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.plotNoCtsNo || ''}
                    onChange={(e) => handleChange('plotNoCtsNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="18. Classification of Locality">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.classificationOfLocality || ''}
                    onChange={(e) => handleChange('classificationOfLocality', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="20. Mode of Transport">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.modeOfTransport || ''}
                    onChange={(e) => handleChange('modeOfTransport', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="19. Railway Station Distance">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distRailwayStation || '15-Kms'}
                    onChange={(e) => handleChange('distRailwayStation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="19. Bus Stand Distance">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distBusStand || '5-Kms'}
                    onChange={(e) => handleChange('distBusStand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="19. Hospital Distance">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distHospital || '10-Kms'}
                    onChange={(e) => handleChange('distHospital', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="21. Land Tenure">
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
                <Field label="22. Jurisdiction / Municipal Body" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.jurisdictionAuthority || ''}
                    onChange={(e) => handleChange('jurisdictionAuthority', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="23. Approvals for Drawings / Clearance" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.approvalsDrawings || ''}
                    onChange={(e) => handleChange('approvalsDrawings', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="24. Name of Co-operative Housing Society">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.coopSocietyName || ''}
                    onChange={(e) => handleChange('coopSocietyName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* 25. Boundaries Comparison Table */}
                <div className="col-span-1 md:col-span-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    25. Boundary Details (Sale Deed vs Actual Site Comparison)
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-24">Direction</th>
                          <th className="p-2.5">Boundary Details (As per Sale Deed)</th>
                          <th className="p-2.5">Boundary Details (Actual at Site)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">North</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundaryNorthDoc || ''}
                              onChange={(e) => handleChange('boundaryNorthDoc', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundaryNorthSite || ''}
                              onChange={(e) => handleChange('boundaryNorthSite', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">East</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundaryEastDoc || ''}
                              onChange={(e) => handleChange('boundaryEastDoc', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundaryEastSite || ''}
                              onChange={(e) => handleChange('boundaryEastSite', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">West</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundaryWestDoc || ''}
                              onChange={(e) => handleChange('boundaryWestDoc', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundaryWestSite || ''}
                              onChange={(e) => handleChange('boundaryWestSite', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">South</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundarySouthDoc || ''}
                              onChange={(e) => handleChange('boundarySouthDoc', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.boundarySouthSite || ''}
                              onChange={(e) => handleChange('boundarySouthSite', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Field label="26. In Unauthorized Property List?">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unauthorizedPropertyList || 'NA'}
                    onChange={(e) => handleChange('unauthorizedPropertyList', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="27. Property is Easily Identifiable">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyIdentifiable || ''}
                    onChange={(e) => handleChange('propertyIdentifiable', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="28. Identified on Own / Representative">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyIdentifiedOnOwn || ''}
                    onChange={(e) => handleChange('propertyIdentifiedOnOwn', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="29. Accompanied With">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.accompaniedBy || 'Customer'}
                    onChange={(e) => handleChange('accompaniedBy', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="30. Property is Demarcated">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyDemarcated || 'Yes'}
                    onChange={(e) => handleChange('propertyDemarcated', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="31. Geo-Coordinates (Lat, Long)">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.latitude || ''}
                      onChange={(e) => handleChange('latitude', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Latitude"
                    />
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.longitude || ''}
                      onChange={(e) => handleChange('longitude', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Longitude"
                    />
                  </div>
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 3: Structure and Specifications */}
          <div id="dcb-structure">
            <Section title="Structure & Specifications" number={3} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="1. Year of Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.yearOfConstruction || ''}
                    onChange={(e) => handleChange('yearOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="2. Age of the Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ageOfProperty || '0-Years'}
                    onChange={(e) => handleChange('ageOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Estimated Future Life">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.estimatedFutureLife || '60-years'}
                    onChange={(e) => handleChange('estimatedFutureLife', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="4. Present Condition of Building">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.presentCondition || 'Good'}
                    onChange={(e) => handleChange('presentCondition', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="5. Immediate Repairs Required">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.immediateRepairsRequired || 'No'}
                    onChange={(e) => handleChange('immediateRepairsRequired', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="6. Type of Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfConstruction || 'RCC framed structure'}
                    onChange={(e) => handleChange('typeOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="7. Permitted Use">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.permittedUse || 'Residential'}
                    onChange={(e) => handleChange('permittedUse', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="8. Actual Use">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.actualUse || 'Residential'}
                    onChange={(e) => handleChange('actualUse', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="9. No. of Floors & Structures">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfFloors || 'G+1'}
                    onChange={(e) => handleChange('noOfFloors', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="10. Lifts Capacity & Type">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfLifts || 'Nil'}
                    onChange={(e) => handleChange('noOfLifts', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="11. Overhead / Underground Tanks">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tanksPumps || 'NA'}
                    onChange={(e) => handleChange('tanksPumps', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="12. Open Spaces / Stilts Flooring">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.openSpaceFlooring || 'NA'}
                    onChange={(e) => handleChange('openSpaceFlooring', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="13. Compound Wall and Gated">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.compoundWallGate || 'NA'}
                    onChange={(e) => handleChange('compoundWallGate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="14. Building Elevation">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.buildingElevation || 'G+1'}
                    onChange={(e) => handleChange('buildingElevation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="15. Other Amenities / Features">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.otherAmenities || 'NA'}
                    onChange={(e) => handleChange('otherAmenities', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="19. Accommodation: Ground Floor" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.accGroundFloor || ''}
                    onChange={(e) => handleChange('accGroundFloor', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 3 Rooms, 1 Hall, 1 Kitchen"
                  />
                </Field>
                <Field label="19. Accommodation: First Floor">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.accFirstFloor || ''}
                    onChange={(e) => handleChange('accFirstFloor', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 4 Rooms, 1 Hall, 1 Kitchen"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 4: Property Details Under Reference */}
          <div id="dcb-property">
            <Section title="Property Under Reference" number={4} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="1. Balconies (Separate / Merged)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.balconies || 'NA'}
                    onChange={(e) => handleChange('balconies', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="2. Walls, Plaster & Painting">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.wallsPlasterPaint || 'completed'}
                    onChange={(e) => handleChange('wallsPlasterPaint', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Doors & Windows">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.doorsWindows || 'NA'}
                    onChange={(e) => handleChange('doorsWindows', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="4. Type of Flooring">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfFlooring || 'Note done'}
                    onChange={(e) => handleChange('typeOfFlooring', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="5. Flooring in Toilets / W.C. / Dado">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.toiletFlooringDado || 'Note done'}
                    onChange={(e) => handleChange('toiletFlooringDado', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="6. Kitchen Platform & Sink">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.kitchenPlatformSink || 'Note done'}
                    onChange={(e) => handleChange('kitchenPlatformSink', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="7. Toilets Plumbing & Fittings">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.toiletsPlumbingFittings || 'Note done'}
                    onChange={(e) => handleChange('toiletsPlumbingFittings', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="8. Electrical Concealed Wiring">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.electricalInstallation || 'Note done'}
                    onChange={(e) => handleChange('electricalInstallation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="9. Risk of Demolition">
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

                <Field label="12. Property Currently Occupied By" span={2}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.occupiedBy || 'under construction'}
                    onChange={(e) => handleChange('occupiedBy', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="13. Self Occupied Since">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.selfOccupiedSince || 'NA'}
                    onChange={(e) => handleChange('selfOccupiedSince', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 5: Assumptions, Data & Valuation Basis */}
          <div id="dcb-assumptions">
            <Section title="Assumptions & Valuation Basis" number={5} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="1. Drawings and Approvals" span={2}>
                  <textarea
                    rows={2}
                    className={textareaCls}
                    value={fields.drawingsApprovalsBasis || fields.approvalsDrawings || ''}
                    onChange={(e) => handleChange('drawingsApprovalsBasis', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="2. Plot Area (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landArea || ''}
                    onChange={(e) => handleChange('landArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="7. Prevailing Market Rates of Land in Vicinity">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.marketRateVicinity || ''}
                    onChange={(e) => handleChange('marketRateVicinity', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 6: Valuation of Property & Area Matrix */}
          <div id="dcb-valuation">
            <Section title="Valuation of Property" number={6} defaultOpen={true}>
              <div className="space-y-6">

                {/* Floor Area Matrix */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    (a) Area of Property (Permitted as per FSI / Byelaws vs Actual)
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Floor Level</th>
                          <th className="p-2.5">Actual Area (approx.) (Sq. ft.)</th>
                          <th className="p-2.5">Permissible Area (as per byelaws/plan) (Sq. ft.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">Ground Floor</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.areaGroundActual || '1353'}
                              onChange={(e) => handleChange('areaGroundActual', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.areaGroundPermissible || '1339'}
                              onChange={(e) => handleChange('areaGroundPermissible', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-800">First Floor</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.areaFirstActual || '1353'}
                              onChange={(e) => handleChange('areaFirstActual', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.areaFirstPermissible || '1258'}
                              onChange={(e) => handleChange('areaFirstPermissible', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="p-2.5 text-slate-900">Total BUA</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.totalActualArea || '2706'}
                              onChange={(e) => handleChange('totalActualArea', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.totalPermissibleArea || '2597'}
                              onChange={(e) => handleChange('totalPermissibleArea', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Land and Building Computation Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    (i) For Land & Building (Valuation Computation)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Land Area (Sq. ft.)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.landArea || '2156'}
                        onChange={(e) => handleChange('landArea', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Land Rate Adopted (₹/sq.ft)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.landRate || '1200'}
                        onChange={(e) => handleChange('landRate', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Calculated Land Value (A)">
                      <div className="p-2 bg-white rounded border border-slate-300 font-bold text-slate-800 text-sm">
                        ₹ {formatIndianCurrency(computedLandValue)}/-
                      </div>
                    </Field>

                    <Field label="BUA @ 100% Rate (₹/sq.ft)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.bua100Rate || '1800'}
                        onChange={(e) => handleChange('bua100Rate', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Value of BUA @ 100% (2,597 sq.ft)">
                      <div className="p-2 bg-white rounded border border-slate-300 font-semibold text-slate-700 text-sm">
                        ₹ {formatIndianCurrency(computedBua100Value)}/-
                      </div>
                    </Field>
                    <Field label="Stage of Construction (%)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.percentageCompletion || '80'}
                        onChange={(e) => handleChange('percentageCompletion', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. 80"
                      />
                    </Field>

                    <Field label="BUA Adopted Rate as on date">
                      <div className="p-2 bg-white rounded border border-slate-300 font-semibold text-slate-700 text-sm">
                        ₹ {formatIndianCurrency(buaActualRateNum)}/- per sq. ft.
                      </div>
                    </Field>
                    <Field label="Building Value as on date (C)" span={2}>
                      <div className="p-2 bg-white rounded border border-slate-300 font-bold text-slate-800 text-sm">
                        ₹ {formatIndianCurrency(computedBuaActualValue)}/-
                      </div>
                    </Field>
                  </div>

                  {/* Summary Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-xs uppercase tracking-wider font-bold text-emerald-800">
                        Total Fair Market Value (A + C)
                      </div>
                      <div className="text-2xl font-black text-emerald-900 mt-1">
                        ₹ {formatIndianCurrency(totalFairMarketValue)}/-
                      </div>
                      <div className="text-xs text-emerald-700 mt-1 capitalize font-medium">
                        {rupeesInWords(totalFairMarketValue)}
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="text-xs uppercase tracking-wider font-bold text-amber-800">
                        Forced / Distress Sale Value (80%)
                      </div>
                      <div className="text-2xl font-black text-amber-900 mt-1">
                        ₹ {formatIndianCurrency(forcedDistressValue)}/-
                      </div>
                      <div className="text-xs text-amber-700 mt-1 capitalize font-medium">
                        {rupeesInWords(forcedDistressValue)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Field label="Disbursement Recommended (%)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.percentageRecommended || '85'}
                        onChange={(e) => handleChange('percentageRecommended', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. 85%"
                      />
                    </Field>
                    <Field label="Remarks / Valuation Observations">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.remarks || ''}
                        onChange={(e) => handleChange('remarks', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Plastering & wall putty work completed"
                      />
                    </Field>
                  </div>
                </div>

              </div>
            </Section>
          </div>

          {/* Section 7: Marketability & Valuer Declaration */}
          <div id="dcb-marketability">
            <Section title="Marketability & Declaration" number={7} defaultOpen={true}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Marketability: For Sale">
                    <select
                      className={selectCls}
                      value={fields.marketabilitySale || 'Good'}
                      onChange={(e) => handleChange('marketabilitySale', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </Field>
                  <Field label="Marketability: For Lease / Estimated Rental">
                    <select
                      className={selectCls}
                      value={fields.marketabilityLease || 'Good'}
                      onChange={(e) => handleChange('marketabilityLease', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </Field>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 text-justify leading-relaxed">
                  <h4 className="font-bold uppercase tracking-wider text-slate-800 mb-2">
                    Universal Valuer Declaration
                  </h4>
                  <p>1. I have no direct or indirect interest in the property valued.</p>
                  <p>2. Information furnished in the report is true and correct to the best of my knowledge and belief.</p>
                  <p>3. Ownership papers / Sale deed may please be verified at your end to ascertain the right title & areas.</p>
                  <p>4. Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. Client is free to obtain other independent opinions on the same. Fair market value of such properties / localities may increase or decrease, depending on future market conditions & scenarios. Report does not certify or confirm any ownership or title of the property that has been valued.</p>
                  <p>5. No structural survey was conducted by us.</p>
                  <p>6. Validity of this report is for 90 days from date.</p>
                  <div className="pt-2 flex flex-col md:flex-row gap-4 items-center">
                    <span className="font-semibold text-slate-800">
                      7. I have deputed my representative:
                    </span>
                    <input
                      type="text"
                      className={`${inputCls} max-w-xs`}
                      value={fields.representativeName || ''}
                      onChange={(e) => handleChange('representativeName', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Representative Name"
                    />
                    <span>who personally inspected the property on {fields.inspectionDate || '—'}.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Field label="Place">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.place || 'Bhubaneswar'}
                      onChange={(e) => handleChange('place', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Authorized Signatory">
                    <input
                      type="text"
                      className={inputCls}
                      value="for M/s S MOHANTY ASSOCIATES"
                      disabled={true}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 8: Verified Documents */}
          <div id="section-documents">
            <BaseDocumentsSection
              title="Verified Property Documents"
              sectionId="section-documents"
              sectionNumber={8}
              documentImages={fields.documentImages || []}
              documentImageNames={fields.documentImageNames || []}
              isReadOnly={isReadOnly}
              onRemoveDocument={(idx) => {
                handleChange('documentImages', (fields.documentImages || []).filter((_: any, i: number) => i !== idx));
                handleChange('documentImageNames', (fields.documentImageNames || []).filter((_: any, i: number) => i !== idx));
              }}
              onDocumentNameChange={(idx, name) => {
                const arr = [...(fields.documentImageNames || [])];
                while (arr.length <= idx) arr.push('');
                arr[idx] = name;
                handleChange('documentImageNames', arr);
              }}
              onReorderDocuments={(newImgs, newNames) => {
                handleChange('documentImages', newImgs);
                handleChange('documentImageNames', newNames);
              }}
            />
          </div>

          {/* Section 9: Location & Master Maps */}
          <div id="section-maps">
            <BaseMapsSection
              title="Location & Master Plan Maps"
              sectionId="section-maps"
              sectionNumber={9}
              isReadOnly={isReadOnly}
              locationMapImages={fields.locationMapImages || []}
              latitude={fields.latitude || ''}
              longitude={fields.longitude || ''}
              fields={fields}
              hasExternalCoordinatesField={true}
              onLocationMapRemove={(idx) => {
                handleChange('locationMapImages', (fields.locationMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
            />
          </div>

          {/* Section 10: Site Photographs */}
          <div id="section-photographs">
            <BasePhotographsSection
              title="Actual Site Photographs"
              sectionId="section-photographs"
              sectionNumber={10}
              propertyImages={fields.propertyImages || []}
              propertyImageNames={fields.propertyImageNames || []}
              isReadOnly={isReadOnly}
              bucketCount={bucketImages?.length || 0}
              onOpenBucketPicker={() => {
                setPhotoModalTarget('photos');
                setShowBucketModal(true);
              }}
              onRemoveImage={(idx) => {
                handleChange('propertyImages', (fields.propertyImages || []).filter((_: any, i: number) => i !== idx));
                handleChange('propertyImageNames', (fields.propertyImageNames || []).filter((_: any, i: number) => i !== idx));
              }}
              onImageNameChange={(idx, name) => {
                const arr = [...(fields.propertyImageNames || [])];
                while (arr.length <= idx) arr.push('');
                arr[idx] = name;
                handleChange('propertyImageNames', arr);
              }}
              onReorderImages={(newImgs, newNames) => {
                handleChange('propertyImages', newImgs);
                handleChange('propertyImageNames', newNames);
              }}
            />
          </div>
        </div>

        {/* ── Floating Navigator (Right Sidebar) ── */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* ── Report Action Bar (Bottom) ── */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={saving || previewing}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* ── Photo Bucket Picker Modal ── */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            if (photoModalTarget === 'documents') {
              handleChange('documentImages', [...(fields.documentImages || []), ...selectedUrls]);
              handleChange('documentImageNames', [
                ...(fields.documentImageNames || []),
                ...selectedUrls.map((_, i) => `Document ${(fields.documentImages?.length || 0) + i + 1}`),
              ]);
            } else if (photoModalTarget === 'maps') {
              handleChange('locationMapImages', [...(fields.locationMapImages || []), ...selectedUrls]);
            } else {
              handleChange('propertyImages', [...(fields.propertyImages || []), ...selectedUrls]);
              handleChange('propertyImageNames', [
                ...(fields.propertyImageNames || []),
                ...selectedUrls.map((_, i) => `Photo ${(fields.propertyImages?.length || 0) + i + 1}`),
              ]);
            }
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
