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
  KotakDocumentsSection,
  KotakAmenitiesSubTableUI,
  KotakFinalValuesSection,
  KotakUniversalEnclosuresAndActions,
} from './KotakHLLAPSections';
import { PDFKotakHLLAPVacantLandRenderer } from '@/lib/banks/pdf-kotak-hllap-vacant-land-renderer';
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
  { id: 'sec-documents', title: '4. Documents Verified' },
  { id: 'sec-valuation', title: '5. Valuation Report (Land Only)' },
  { id: 'sec-final-values', title: '6. Final Values & Declaration' },
  { id: 'sec-docs-gallery', title: 'Enclosure 1: Documents' },
  { id: 'sec-maps', title: 'Enclosure 2: Maps' },
  { id: 'sec-photos', title: 'Enclosure 3: Photographs' },
];

export default function KotakHLLAPVacantLand({
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
    getKotakInitialFields('VL', initialFields, prefill, bucketImages, projectCode)
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

  // Vacant Land Valuation Auto-Calculation
  const handleCalculateVacantLand = useCallback(() => {
    // Land Value (i)
    const landArea = parseNum(fields.adoptedLandAreaSqFt);
    const landRate = parseNum(fields.adoptedLandRatePerSqFt);
    const landVal = landArea * landRate;

    // Amenities
    const parkVal = parseNum(fields.valueOfParking);
    const otherVal = parseNum(fields.valueOfOtherAmenities);
    const amenitiesTotal = parkVal + otherVal;

    // Total Market Value (No building structure!)
    const fmv = landVal + amenitiesTotal;
    const dist = Math.round(fmv * 0.8);
    const real = Math.round(fmv * 0.9);

    setFields((prev) => ({
      ...prev,
      landValueI: landVal > 0 ? String(landVal) : prev.landValueI,
      totalValueOfAmenities: String(amenitiesTotal),
      marketValueAsPerMethod: fmv > 0 ? String(fmv) : prev.marketValueAsPerMethod,
      finalMarketValue: fmv > 0 ? String(fmv) : prev.finalMarketValue,
      distressedValue: dist > 0 ? String(dist) : prev.distressedValue,
      realizableValue: real > 0 ? String(real) : prev.realizableValue,
      insurableValue: '', // 100% Omitted in Vacant Land!
    }));
  }, [
    fields.adoptedLandAreaSqFt,
    fields.adoptedLandRatePerSqFt,
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
    const renderer = new PDFKotakHLLAPVacantLandRenderer({ ...fields, projectCode });
    const bytes = await renderer.render();
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kotak_HLLAP_Vacant_Land_${projectCode || 'report'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewPDF = async () => {
    const renderer = new PDFKotakHLLAPVacantLandRenderer({ ...fields, projectCode });
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
        formatName="Land Only Method"
        title="Kotak Mahindra Bank — Vacant Land Valuation"
        description="Technical and financial valuation format for residential, commercial, or industrial vacant land plots."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
      />

      {/* Category Tab Bar Switcher */}
      <KotakCategoryTabBar
        currentCategory="VL"
        onCategoryChange={onCategoryChange}
        isReadOnly={isReadOnly}
      />

      {/* Floating Navigator */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Section 1: General (isVacantLand = true) */}
      <div id="sec-general">
        <KotakGeneralSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          isVacantLand={true}
        />
      </div>

      {/* Section 2: Property (isVacantLand = true) */}
      <div id="sec-property">
        <KotakPropertySection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          isVacantLand={true}
        />
      </div>

      {/* Section 3: Surroundings */}
      <div id="sec-surroundings">
        <KotakSurroundingsSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
      </div>

      {/* NOTE: Section 4 Survey of Construction is 100% OMITTED for Vacant Land! */}

      {/* Section 4: Documents Verified (Numbered 4 in Vacant Land) */}
      <div id="sec-documents">
        <KotakDocumentsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          isVacantLand={true}
        />
      </div>

      {/* Section 5: Valuation Report (Land Only Method) */}
      <div id="sec-valuation">
        <Section title="5. VALUATION REPORT (LAND ONLY METHOD)" defaultOpen>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Land Only Valuation Method (Vacant Land)
            </span>
            <button
              type="button"
              onClick={handleCalculateVacantLand}
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
                placeholder="e.g. 2400"
              />
            </Field>

            <Field label="Basis of Area measured on site">
              <select
                className={selectCls}
                value={fields.areaMeasuredBasis || 'Plot Area'}
                onChange={(e) => handleChange('areaMeasuredBasis', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Plot Area">Plot Area</option>
                <option value="Net Land Area">Net Land Area</option>
                <option value="Gross Land Area">Gross Land Area</option>
              </select>
            </Field>
          </div>

          {/* Part A: Land Valuation */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-3">
              A. Vacant Land Measurement & Valuation
            </span>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <Field label="Gross Land Area (in Sq.Ft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.grossLandAreaSqFt || ''}
                  onChange={(e) => handleChange('grossLandAreaSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Net Land Area (As per Site)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.netLandAreaSiteSqFt || ''}
                  onChange={(e) => handleChange('netLandAreaSiteSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Net Land Area (As per Plan)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.netLandAreaPlanSqFt || ''}
                  onChange={(e) => handleChange('netLandAreaPlanSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Net Land Area (As per Legal Doc)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.netLandAreaDeedSqFt || ''}
                  onChange={(e) => handleChange('netLandAreaDeedSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <Field label="Undivided share of land (UDS)">
                <input
                  type="text"
                  className={inputCls}
                  value="NA"
                  disabled
                />
              </Field>

              <Field label="Adopted Land Area as per">
                <select
                  className={selectCls}
                  value={fields.adoptedLandAreaBasis || 'Net Land Area As per Legal Doc'}
                  onChange={(e) => handleChange('adoptedLandAreaBasis', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Net Land Area As per Legal Doc">Net Land Area As per Legal Doc</option>
                  <option value="Net Land Area As per Site">Net Land Area As per Site</option>
                  <option value="Gross Land Area">Gross Land Area</option>
                </select>
              </Field>

              <Field label="Adopted Land Area (in Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.adoptedLandAreaSqFt || ''}
                  onChange={(e) => handleChange('adoptedLandAreaSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Adopted Land Rate (in Rs. per Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.adoptedLandRatePerSqFt || ''}
                  onChange={(e) => handleChange('adoptedLandRatePerSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Govt Guideline Rate - Land (in Rs.)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.govtGuidelineRateLand || ''}
                  onChange={(e) => handleChange('govtGuidelineRateLand', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="LAND VALUE: (in Rs.) (i) [Area * Rate]">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-amber-900 bg-amber-100`}
                  value={fields.landValueI || ''}
                  onChange={(e) => handleChange('landValueI', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>

          {/* NOTE: Building Sub-Table is 100% OMITTED for Vacant Land! */}

          {/* C. Amenities Sub-Table */}
          <KotakAmenitiesSubTableUI fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />

          {/* D. Valuation Totals */}
          <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-xs">
            <Field label="Market Value as per Land Only Method (in Rs.) [Land (i) + Amenities]">
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
                  onClick={handleCalculateVacantLand}
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

      {/* Section 6: Final Values & Declaration (Numbered 6, Insurable Value OMITTED) */}
      <div id="sec-final-values">
        <KotakFinalValuesSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          isVacantLand={true}
          includeInsurable={false}
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
        sectionNumbers={{ docs: 7, maps: 8, photos: 9 }}
      />
    </div>
  );
}
