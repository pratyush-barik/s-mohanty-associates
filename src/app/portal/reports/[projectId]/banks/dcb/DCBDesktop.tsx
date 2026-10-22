'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  renderedParagraphCls,
  renderedBoxedContentCls,
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
import { PDFDcbDesktopRenderer, DCBDesktopFields } from '@/lib/banks/pdf-dcb-desktop-renderer';

export const DCB_DESKTOP_CONFIG: BankConfig = {
  bankId: 'DCB BANK',
  subTemplateId: 'Desktop valuation format',
  displayName: 'DCB Bank — Desktop Valuation Format',
  defaultValues: {
    purpose: 'Desktop Valuation / Post Disbursal Valuation',
  },
};

export interface DCBDesktopProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function DCBDesktop({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: DCBDesktopProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || userRole === 'viewer';

  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [photoModalTarget, setPhotoModalTarget] = useState<'photos' | 'documents' | 'maps'>('photos');

  // Earliest visit date
  const earliestVisit = useMemo(() => getEarliestFieldVisit(bucketImages, prefill), [bucketImages, prefill]);

  // Initial Form Fields State
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || {};
    const pf = (prefill || {}) as any;

    return {
      refNo: saved.refNo || pf.projectCode || projectCode || '',
      reportDate: saved.reportDate || formatReportDate(new Date()),
      valuationDate: saved.valuationDate || (earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date())),
      customerName: saved.customerName || pf.customerName || pf.borrowerName || '',
      propertyOwnerName: saved.propertyOwnerName || pf.propertyOwner || pf.documentHolderName || '',
      valuationInitiatedBy: saved.valuationInitiatedBy || 'DCB Bank Limited',
      loanReferenceNumber: saved.loanReferenceNumber || pf.caseNo || '',
      propertyAddress: saved.propertyAddress || pf.propertyAddress || '',
      landAreaDesc: saved.landAreaDesc || '',
      landAreaSqft: saved.landAreaSqft || '',
      landRate: saved.landRate || '',
      buaAreaSqft: saved.buaAreaSqft || '',
      buaRate: saved.buaRate || '',
      typeOfProperty: saved.typeOfProperty || 'Independent House',
      ageOfProperty: saved.ageOfProperty || '',
      estimatedFutureLife: saved.estimatedFutureLife || '',
      realisablePercentage: saved.realisablePercentage || '80',
      distressPercentage: saved.distressPercentage || '75',
      remarks:
        saved.remarks ||
        'We are releasing desk top valuation on request of “DCB Bank” for the said property Without visiting the property. Property value is arrived on the basis of our experience, expertise & local market feedback. This is existing collateral with DCB Bank.',
      declarationPoint1: saved.declarationPoint1 || 'Property Has been Valued on the basis of Market Information.',
      declarationPoint2: saved.declarationPoint2 || 'We have no Direct or Indirect Interest in the Property Valued.',
      declarationPoint3: saved.declarationPoint3 || (earliestVisit ? `We Have Conducted Inspection of the Property on ${formatReportDate(earliestVisit.date)}` : 'We Have Conducted Inspection of the Property.'),
      place: saved.place || 'Bhubaneswar',
      versionDate: saved.versionDate || formatReportDate(new Date()),
      documentImages: saved.documentImages || [],
      documentImageNames: saved.documentImageNames || [],
      locationMapImages: saved.locationMapImages || [],
      propertyImages: saved.propertyImages || [],
      propertyImageNames: saved.propertyImageNames || [],
    };
  }, [rawInitialFields, prefill, projectCode, earliestVisit]);

  const [fields, setFields] = useState<DCBDesktopFields>(initialFields);

  const handleChange = (key: keyof DCBDesktopFields, value: any) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // Calculations
  const landSqftNum = parseFloat(String(fields.landAreaSqft || '0').replace(/,/g, '')) || 0;
  const landRateNum = parseFloat(String(fields.landRate || '0').replace(/,/g, '')) || 0;
  const computedLandVal = landSqftNum * landRateNum;

  const buaSqftNum = parseFloat(String(fields.buaAreaSqft || '0').replace(/,/g, '')) || 0;
  const buaRateNum = parseFloat(String(fields.buaRate || '0').replace(/,/g, '')) || 0;
  const computedBuaVal = buaSqftNum * buaRateNum;

  const computedTotalVal = computedLandVal + computedBuaVal;

  const realisablePctNum = parseFloat(String(fields.realisablePercentage || '80').replace(/%/g, '')) / 100 || 0.8;
  const distressPctNum = parseFloat(String(fields.distressPercentage || '75').replace(/%/g, '')) / 100 || 0.75;

  const computedRealisableVal = Math.round(computedTotalVal * realisablePctNum);
  const computedDistressVal = Math.round(computedTotalVal * distressPctNum);

  // Sync computed values
  useEffect(() => {
    setFields((prev) => {
      let changed = false;
      const next = { ...prev };
      if (next.landTotalValue !== String(computedLandVal)) {
        next.landTotalValue = String(computedLandVal);
        changed = true;
      }
      if (next.buaTotalValue !== String(computedBuaVal)) {
        next.buaTotalValue = String(computedBuaVal);
        changed = true;
      }
      if (next.fairMarketValue !== String(computedTotalVal)) {
        next.fairMarketValue = String(computedTotalVal);
        changed = true;
      }
      if (next.realisableValue !== String(computedRealisableVal)) {
        next.realisableValue = String(computedRealisableVal);
        changed = true;
      }
      if (next.distressValue !== String(computedDistressVal)) {
        next.distressValue = String(computedDistressVal);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [computedLandVal, computedBuaVal, computedTotalVal, computedRealisableVal, computedDistressVal]);

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      const res = await saveReportDraft(projectId, {
        fields,
        bankName: 'DCB BANK',
        subTemplate: 'Desktop valuation format',
        clientType: 'organisation',
        organisationTemplate: 'DCB BANK',
        organisationSubTemplate: 'Desktop valuation format',
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
      setMessage({ text: `Error saving draft: ${e.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // PDF Preview Handler
  const handlePreviewPDF = async () => {
    setPreviewing(true);
    try {
      const renderer = new PDFDcbDesktopRenderer(fields, projectCode || fields.loanReferenceNumber);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      console.error(e);
      alert(`Error generating PDF preview: ${e.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    setSaving(true);
    try {
      const renderer = new PDFDcbDesktopRenderer(fields, projectCode || fields.loanReferenceNumber);
      const fileName = `DCB_Desktop_Valuation_${fields.loanReferenceNumber || fields.customerName || 'Report'}.pdf`;
      await renderer.generateAndDownload(fileName);
    } catch (e: any) {
      console.error(e);
      alert(`Error downloading PDF: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Navigation Items (clean human-readable titles, no numbers - Rule 2 & 3)
  const navSections: NavItem[] = [
    { id: 'sec-general', title: 'General & Loan Particulars' },
    { id: 'sec-property', title: 'Property Address & Classification' },
    { id: 'sec-valuation', title: 'Market Rate & Valuation Calculation' },
    { id: 'sec-remarks-decl', title: 'Remarks, Declaration & Sign-off' },
    { id: 'sec-documents', title: 'Verified Property Documents' },
    { id: 'sec-maps', title: 'Location & Master Plan Maps' },
    { id: 'sec-photographs', title: 'Actual Site Photographs' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32">
      {/* ── Universal Bank Report Header ── */}
      <BankReportHeader
        bankName="DCB BANK"
        subclass="Desktop valuation format"
        formatName="DCB Bank — Post Disbursal Valuation Report (Desktop Format)"
        clientType="organisation"
        category="Bank & FIS"
        serviceType="Mortgage & Loan Security Valuation"
        subjectType="Desktop / Post Disbursal Valuation"
        onResetWizard={onResetWizard}
        earliestVisit={earliestVisit}
        projectCode={projectCode}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex gap-8">
        {/* Main Form Body */}
        <div className="flex-1 space-y-8">
          {/* Section 1: General & Loan Particulars */}
          <div id="sec-general">
            <Section number={1} title="General & Loan Particulars">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Ref. No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.refNo || ''}
                    onChange={(e) => handleChange('refNo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="DCB/07-26/031"
                  />
                </Field>

                <Field label="Report Date">
                  <BaseDateInput
                    value={fields.reportDate || ''}
                    onChange={(val) => handleChange('reportDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Date of Valuation">
                  <BaseDateInput
                    value={fields.valuationDate || ''}
                    onChange={(val) => handleChange('valuationDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Name of the Customer">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.customerName || ''}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Latip Mahammad"
                  />
                </Field>

                <Field label="Property Owner Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyOwnerName || ''}
                    onChange={(e) => handleChange('propertyOwnerName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Latip Mahammad"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Valuation Initiated By">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationInitiatedBy || ''}
                    onChange={(e) => handleChange('valuationInitiatedBy', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="DCB Bank Limited"
                  />
                </Field>

                <Field label="Loan Reference Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.loanReferenceNumber || ''}
                    onChange={(e) => handleChange('loanReferenceNumber', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="DMHUBRH00406241"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 2: Property Particulars */}
          <div id="sec-property">
            <Section number={2} title="Property Address & Classification">
              <Field label="Property Address Being Valued">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={fields.propertyAddress || ''}
                  onChange={(e) => handleChange('propertyAddress', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Khata No-303, Ch.Kno-223, Plot no-773, Corresponding to Plot no-773/1207 Mouza-Bheden, Tahasil/PS-Bheden, Dist-Bargarh"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Land Area / Built Up Area (Descriptive Header)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landAreaDesc || ''}
                    onChange={(e) => handleChange('landAreaDesc', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="AC.0.020Decs, 871sqft"
                  />
                </Field>

                <Field label="Type of Property">
                  <select
                    className={selectCls}
                    value={fields.typeOfProperty || 'Independent House'}
                    onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Independent House">Independent House</option>
                    <option value="Flat">Flat / Apartment</option>
                    <option value="Office">Office</option>
                    <option value="Shop">Shop / Commercial Unit</option>
                    <option value="Plot">Vacant Plot</option>
                    <option value="Independent House/Flat/Office/Shop/Plot">Independent House/Flat/Office/Shop/Plot</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Age of the Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ageOfProperty || ''}
                    onChange={(e) => handleChange('ageOfProperty', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="16-Years"
                  />
                </Field>

                <Field label="Estimate Future Life">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.estimatedFutureLife || ''}
                    onChange={(e) => handleChange('estimatedFutureLife', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="44-Years"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 3: Valuation Calculation */}
          <div id="sec-valuation">
            <Section number={3} title="Market Rate & Valuation Calculation">
              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  (A) Land Valuation Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Land Extent (sq. ft.)">
                    <input
                      type="number"
                      className={inputCls}
                      value={fields.landAreaSqft || ''}
                      onChange={(e) => handleChange('landAreaSqft', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="871"
                    />
                  </Field>
                  <Field label="Land Rate (Rs./sq. ft.)">
                    <input
                      type="number"
                      className={inputCls}
                      value={fields.landRate || ''}
                      onChange={(e) => handleChange('landRate', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="150"
                    />
                  </Field>
                  <Field label="Calculated Land Value (INR)">
                    <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800">
                      ₹ {formatIndianCurrency(computedLandVal)}
                    </div>
                  </Field>
                </div>
              </div>

              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  (B) Building / Structure Valuation Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Building Extent (sq. ft.)">
                    <input
                      type="number"
                      className={inputCls}
                      value={fields.buaAreaSqft || ''}
                      onChange={(e) => handleChange('buaAreaSqft', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="1560"
                    />
                  </Field>
                  <Field label="Building Rate (Rs./sq. ft.)">
                    <input
                      type="number"
                      className={inputCls}
                      value={fields.buaRate || ''}
                      onChange={(e) => handleChange('buaRate', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="1000"
                    />
                  </Field>
                  <Field label="Calculated Building Value (INR)">
                    <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800">
                      ₹ {formatIndianCurrency(computedBuaVal)}
                    </div>
                  </Field>
                </div>
              </div>

              {/* Total Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70">
                  <div className="text-xs font-semibold text-blue-900 mb-1">FAIR MARKET VALUE (A + B)</div>
                  <div className="text-xl font-black text-blue-950">₹ {formatIndianCurrency(computedTotalVal)}</div>
                  <div className="text-[11px] text-blue-700 mt-1">{rupeesInWords(computedTotalVal)}</div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-900">REALISABLE VALUE</span>
                    <input
                      type="number"
                      className="w-16 text-right px-1 py-0.5 text-xs font-bold bg-white border border-emerald-300 rounded"
                      value={fields.realisablePercentage || '80'}
                      onChange={(e) => handleChange('realisablePercentage', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="text-xl font-black text-emerald-950">₹ {formatIndianCurrency(computedRealisableVal)}</div>
                  <div className="text-[11px] text-emerald-700 mt-1">{rupeesInWords(computedRealisableVal)}</div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-900">DISTRESS VALUE</span>
                    <input
                      type="number"
                      className="w-16 text-right px-1 py-0.5 text-xs font-bold bg-white border border-amber-300 rounded"
                      value={fields.distressPercentage || '75'}
                      onChange={(e) => handleChange('distressPercentage', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="text-xl font-black text-amber-950">₹ {formatIndianCurrency(computedDistressVal)}</div>
                  <div className="text-[11px] text-amber-700 mt-1">{rupeesInWords(computedDistressVal)}</div>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 4: Remarks & Declaration */}
          <div id="sec-remarks-decl">
            <Section number={4} title="Remarks, Declaration & Sign-off">
              <Field label="Remarks (Desktop Valuation Disclaimer)">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={fields.remarks || ''}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="We are releasing desk top valuation on request of “DCB Bank” for the said property Without visiting the property..."
                />
              </Field>

              <div className="mt-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Declaration Points (3-Point Undertaking)
                </div>

                <Field label="Point 1">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.declarationPoint1 || ''}
                    onChange={(e) => handleChange('declarationPoint1', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Point 2">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.declarationPoint2 || ''}
                    onChange={(e) => handleChange('declarationPoint2', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Point 3">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.declarationPoint3 || ''}
                    onChange={(e) => handleChange('declarationPoint3', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Rendered Output Readout with Justified Alignment (Rule 9) */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Rendered Valuation Remarks & Declaration Preview (Justified)
                </div>
                <div className="text-xs text-slate-700 text-justify leading-relaxed font-sans bg-white p-3 rounded border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">REMARKS:-</span>
                  {fields.remarks || 'N/A'}
                </div>
                <div className="text-xs text-slate-700 text-justify leading-relaxed font-sans bg-white p-3 rounded border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block mb-1">DECLARATION (We hereby Declare That):</span>
                  <p>1. {fields.declarationPoint1 || 'N/A'}</p>
                  <p>2. {fields.declarationPoint2 || 'N/A'}</p>
                  <p>3. {fields.declarationPoint3 || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200">
                <Field label="Place">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.place || ''}
                    onChange={(e) => handleChange('place', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Bhubaneswar"
                  />
                </Field>

                <Field label="Version / Footer Date Reference">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.versionDate || ''}
                    onChange={(e) => handleChange('versionDate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="25/07/2026"
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 5: Verified Documents */}
          <div id="sec-documents">
            <BaseDocumentsSection
              title="Verified Property Documents"
              sectionId="sec-documents"
              sectionNumber={5}
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

          {/* Section 6: Location Maps */}
          <div id="sec-maps">
            <BaseMapsSection
              title="Location & Master Plan Maps"
              sectionId="sec-maps"
              sectionNumber={6}
              isReadOnly={isReadOnly}
              locationMapImages={fields.locationMapImages || []}
              latitude=""
              longitude=""
              onLocationMapRemove={(idx) => {
                handleChange('locationMapImages', (fields.locationMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
            />
          </div>

          {/* Section 7: Site Photographs */}
          <div id="sec-photographs">
            <BasePhotographsSection
              title="Actual Site Photographs"
              sectionId="sec-photographs"
              sectionNumber={7}
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

        {/* Floating Navigator (Right Sidebar) */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* Action Bar (Bottom) */}
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

      {/* Bucket Picker Modal */}
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
