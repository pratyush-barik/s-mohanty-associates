'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  BankReportHeader,
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  NavItem,
  getEarliestFieldVisit,
} from '../BaseBankReportComponents';
import {
  KotakHLLAPFields,
  KotakHLLAPCategory,
  getKotakInitialFields,
  parseNum,
  formatNum,
} from './KotakHLLAPTypes';
import {
  KotakCategoryTabBar,
  KotakGeneralSection,
  KotakPropertySection,
  KotakSurroundingsSection,
  KotakConstructionSection,
  KotakDocumentsSection,
  KotakAmenitiesSubTableUI,
  KotakFinalValuesSection,
  KotakUniversalEnclosuresAndActions,
} from './KotakHLLAPSections';
import { PDFKotakHLLAPResiCommRenderer } from '@/lib/banks/pdf-kotak-hllap-resi-comm-renderer';
import { Calculator } from 'lucide-react';

export interface KotakHLLAPCategoryProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
  onCategoryChange?: (cat: KotakHLLAPCategory) => void;
}

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-general', title: '1. General Details' },
  { id: 'sec-property', title: '2. Property Details' },
  { id: 'sec-surroundings', title: '3. Surroundings & Proximity' },
  { id: 'sec-construction', title: '4. Survey of Construction' },
  { id: 'sec-documents', title: '5. Documents Verified' },
  { id: 'sec-valuation', title: '6. Valuation Report (Resi-Cum-Comm)' },
  { id: 'sec-final-values', title: '7. Final Values & Declaration' },
  { id: 'sec-docs-gallery', title: 'Enclosure 1: Documents' },
  { id: 'sec-maps', title: 'Enclosure 2: Maps' },
  { id: 'sec-photos', title: 'Enclosure 3: Photographs' },
];

export default function KotakHLLAPResiCumComm({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole = 'REPORT_EMPLOYEE',
  bucketImages = [],
  prefill,
  onResetWizard,
  isReadOnly = false,
  onCategoryChange,
}: KotakHLLAPCategoryProps) {
  const router = useRouter();

  const [fields, setFields] = useState<KotakHLLAPFields>(() =>
    getKotakInitialFields('RES-COM', initialFields, prefill, bucketImages, projectCode)
  );

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const earliestVisit = useMemo(
    () => getEarliestFieldVisit(bucketImages, prefill),
    [bucketImages, prefill]
  );

  const handleChange = useCallback((key: keyof KotakHLLAPFields, value: any) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Real-time Resi-Cum-Comm Auto-Calculation
  const handleCalculateResiComm = useCallback(() => {
    const adoptedArea = parseNum(fields.adoptedAreaSqFt);
    const adoptedRate = parseNum(fields.finalAdoptedRatePerSqFt);
    const unitVal = adoptedArea * adoptedRate;

    const parkVal = parseNum(fields.valueOfParking);
    const otherVal = parseNum(fields.valueOfOtherAmenities);
    const amenitiesTotal = parkVal + otherVal;

    const fmv = unitVal + amenitiesTotal;
    const dist = Math.round(fmv * 0.8);
    const real = Math.round(fmv * 0.9);

    setFields((prev) => ({
      ...prev,
      marketValueWithoutAmenities: unitVal > 0 ? String(unitVal) : prev.marketValueWithoutAmenities,
      totalValueOfAmenities: String(amenitiesTotal),
      marketValueAsPerMethod: fmv > 0 ? String(fmv) : prev.marketValueAsPerMethod,
      finalMarketValue: fmv > 0 ? String(fmv) : prev.finalMarketValue,
      distressedValue: dist > 0 ? String(dist) : prev.distressedValue,
      realizableValue: real > 0 ? String(real) : prev.realizableValue,
    }));
  }, [
    fields.adoptedAreaSqFt,
    fields.finalAdoptedRatePerSqFt,
    fields.valueOfParking,
    fields.valueOfOtherAmenities,
  ]);

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveReportDraft(projectId, fields);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save draft');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const renderer = new PDFKotakHLLAPResiCommRenderer({ ...fields, projectCode });
    const bytes = await renderer.render();
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kotak_HLLAP_Resi_Comm_${projectCode || 'report'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewPDF = async () => {
    const renderer = new PDFKotakHLLAPResiCommRenderer({ ...fields, projectCode });
    const bytes = await renderer.render();
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4">
      {/* Header with Wizard Reset */}
      <BankReportHeader
        bankName="KOTAK MAHINDRA BANK"
        subclass="HL-LAP"
        formatName="Residential cum Commercial Method"
        title="Kotak Mahindra Bank — Residential cum Commercial Valuation"
        description="Comprehensive technical and financial valuation format for mixed-use residential and commercial buildings and shop-cum-residence units."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
      />

      {/* Category Tab Bar Switcher */}
      <KotakCategoryTabBar
        currentCategory="RES-COM"
        onCategoryChange={onCategoryChange}
        isReadOnly={isReadOnly}
      />

      {/* Floating Navigator */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Section 1: General */}
      <div id="sec-general">
        <KotakGeneralSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
      </div>

      {/* Section 2: Property */}
      <div id="sec-property">
        <KotakPropertySection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
      </div>

      {/* Section 3: Surroundings */}
      <div id="sec-surroundings">
        <KotakSurroundingsSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
      </div>

      {/* Section 4: Construction */}
      <div id="sec-construction">
        <KotakConstructionSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
      </div>

      {/* Section 5: Documents */}
      <div id="sec-documents">
        <KotakDocumentsSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
      </div>

      {/* Section 6: Valuation Report (Residential cum Commercial Method) */}
      <div id="sec-valuation">
        <Section title="6. VALUATION REPORT (RESIDENTIAL CUM COMMERCIAL METHOD)" defaultOpen>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Residential cum Commercial Valuation Method
            </span>
            <button
              type="button"
              onClick={handleCalculateResiComm}
              disabled={isReadOnly}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Auto Calculate Values</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Area measured on site (Numeric value)">
              <input
                type="text"
                className={inputCls}
                value={fields.areaMeasuredOnSite || ''}
                onChange={(e) => handleChange('areaMeasuredOnSite', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 1650"
              />
            </Field>

            <Field label="Basis of Area measured on site">
              <select
                className={selectCls}
                value={fields.areaMeasuredBasis || 'Built up Area'}
                onChange={(e) => handleChange('areaMeasuredBasis', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Built up Area">Built up Area</option>
                <option value="Carpet Area">Carpet Area</option>
                <option value="Super Built up Area">Super Built up Area</option>
                <option value="Plot Area">Plot Area</option>
              </select>
            </Field>
          </div>

          {/* Land Extent / Share */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-2">
              A. Land Extent / Share
            </span>
            <Field label="Undivided share of land (UDS) (in Acres / Decs / Sq.Ft)">
              <input
                type="text"
                className={inputCls}
                value={fields.udsShare || ''}
                onChange={(e) => handleChange('udsShare', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 520 Sq.Ft (Ac. 0.012 Decs)"
              />
            </Field>
          </div>

          {/* Unit Measurement & Verification */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-3">
              B. Residential cum Commercial Unit Measurement & Area Verification (in Sq.Ft)
            </span>

            {/* Carpet Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field label="Carpet Area (As per Site)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.carpetAreaSiteSqFt || ''}
                  onChange={(e) => handleChange('carpetAreaSiteSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Carpet Area (As per Plan)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.carpetAreaPlanSqFt || ''}
                  onChange={(e) => handleChange('carpetAreaPlanSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Carpet Area (As per Legal Doc)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.carpetAreaDeedSqFt || ''}
                  onChange={(e) => handleChange('carpetAreaDeedSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Built Up Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field label="Built Up Area (As per Site)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.buaSiteSqFt || ''}
                  onChange={(e) => handleChange('buaSiteSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Built Up Area (As per Plan)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.buaPlanSqFt || ''}
                  onChange={(e) => handleChange('buaPlanSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Built Up Area (As per Legal Doc)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.buaDeedSqFt || ''}
                  onChange={(e) => handleChange('buaDeedSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Field label="Super BUA (SuBA) (in Sq.Ft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.superBuaSqFt || ''}
                  onChange={(e) => handleChange('superBuaSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Adopted Area as per">
                <select
                  className={selectCls}
                  value={fields.adoptedAreaBasis || 'Built Up Area As per Legal Doc'}
                  onChange={(e) => handleChange('adoptedAreaBasis', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Built Up Area As per Legal Doc">Built Up Area As per Legal Doc</option>
                  <option value="Built Up Area As per Site">Built Up Area As per Site</option>
                  <option value="Carpet Area As per Legal Doc">Carpet Area As per Legal Doc</option>
                  <option value="Super BUA As per Legal Doc">Super BUA As per Legal Doc</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Adopted Area (in Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.adoptedAreaSqFt || ''}
                  onChange={(e) => handleChange('adoptedAreaSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Final Adopted Rate (in Rs. per Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.finalAdoptedRatePerSqFt || ''}
                  onChange={(e) => handleChange('finalAdoptedRatePerSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Field label="Market Value without Amenities (in Rs.) [Area * Rate]">
                <input
                  type="text"
                  className={`${inputCls} font-bold bg-slate-50`}
                  value={fields.marketValueWithoutAmenities || ''}
                  onChange={(e) => handleChange('marketValueWithoutAmenities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Market Value w/o Amenities (Present Stage)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.marketValuePresentStage || ''}
                  onChange={(e) => handleChange('marketValuePresentStage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>

          {/* C. Amenities Sub-Table */}
          <KotakAmenitiesSubTableUI fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />

          {/* D. Valuation Totals */}
          <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-xs">
            <Field label="Market Value as per Residential cum Commercial Method (in Rs.) [Total Composite Value]">
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-lg text-amber-900 border-amber-400 bg-white`}
                  value={fields.marketValueAsPerMethod || fields.finalMarketValue || ''}
                  onChange={(e) => {
                    handleChange('marketValueAsPerMethod', e.target.value);
                    handleChange('finalMarketValue', e.target.value);
                  }}
                  disabled={isReadOnly}
                />
                <button
                  type="button"
                  onClick={handleCalculateResiComm}
                  disabled={isReadOnly}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
                >
                  Recalculate
                </button>
              </div>
            </Field>
          </div>
        </Section>
      </div>

      {/* Section 7: Final Values & Declaration */}
      <div id="sec-final-values">
        <KotakFinalValuesSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          isVacantLand={false}
          includeInsurable={true}
        />
      </div>

      {/* Universal Enclosures: Documents -> Maps -> Photographs & Action Bar */}
      <KotakUniversalEnclosuresAndActions
        fields={fields}
        handleChange={handleChange}
        bucketImages={bucketImages}
        isReadOnly={isReadOnly}
        userRole={userRole}
        isPhotoModalOpen={isPhotoModalOpen}
        setIsPhotoModalOpen={setIsPhotoModalOpen}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        saveError={saveError}
        sectionNumbers={{ docs: 8, maps: 9, photos: 10 }}
      />
    </div>
  );
}
