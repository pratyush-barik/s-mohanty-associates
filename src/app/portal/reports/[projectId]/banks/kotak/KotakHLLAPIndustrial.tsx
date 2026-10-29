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
  KotakFloorRow,
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
import { PDFKotakHLLAPIndustrialRenderer } from '@/lib/banks/pdf-kotak-hllap-industrial-renderer';
import { Calculator, Plus, Trash2 } from 'lucide-react';

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
  { id: 'sec-valuation', title: '6. Valuation Report (Industrial Method)' },
  { id: 'sec-final-values', title: '7. Final Values & Declaration' },
  { id: 'sec-docs-gallery', title: 'Enclosure 1: Documents' },
  { id: 'sec-maps', title: 'Enclosure 2: Maps' },
  { id: 'sec-photos', title: 'Enclosure 3: Photographs' },
];

export default function KotakHLLAPIndustrial({
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
    getKotakInitialFields('IND', initialFields, prefill, bucketImages, projectCode)
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

  const handleUpdateFloor = (index: number, col: keyof KotakFloorRow, val: string) => {
    const rows = [...(fields.floorWiseRows || [])];
    rows[index] = { ...rows[index], [col]: val };
    handleChange('floorWiseRows', rows);
  };

  const handleAddFloor = () => {
    const rows = [...(fields.floorWiseRows || [])];
    rows.push({ floor: `Level ${rows.length + 1}`, siteBua: '', planBua: '' });
    handleChange('floorWiseRows', rows);
  };

  const handleRemoveFloor = (index: number) => {
    const rows = [...(fields.floorWiseRows || [])];
    rows.splice(index, 1);
    handleChange('floorWiseRows', rows);
  };

  // Industrial Valuation Auto-Calculation
  const handleCalculateIndustrial = useCallback(() => {
    // Land Value (i)
    const landArea = parseNum(fields.adoptedLandAreaSqFt);
    const landRate = parseNum(fields.adoptedLandRatePerSqFt);
    const landVal = landArea * landRate;

    // Building / Shed Value (ii)
    const structArea = parseNum(fields.adoptedAreaSqFt);
    const structRate = parseNum(fields.adoptedConstructionMarketRate);
    const structVal = structArea * structRate;

    // Amenities
    const parkVal = parseNum(fields.valueOfParking);
    const otherVal = parseNum(fields.valueOfOtherAmenities);
    const amenitiesTotal = parkVal + otherVal;

    // Total Market Value
    const fmv = landVal + structVal + amenitiesTotal;
    const dist = Math.round(fmv * 0.8);
    const real = Math.round(fmv * 0.9);

    setFields((prev) => ({
      ...prev,
      landValueI: landVal > 0 ? String(landVal) : prev.landValueI,
      constructionValueIi: structVal > 0 ? String(structVal) : prev.constructionValueIi,
      totalValueOfAmenities: String(amenitiesTotal),
      marketValueAsPerMethod: fmv > 0 ? String(fmv) : prev.marketValueAsPerMethod,
      finalMarketValue: fmv > 0 ? String(fmv) : prev.finalMarketValue,
      distressedValue: dist > 0 ? String(dist) : prev.distressedValue,
      realizableValue: real > 0 ? String(real) : prev.realizableValue,
      insurableValue: structVal > 0 ? String(structVal) : prev.insurableValue,
    }));
  }, [
    fields.adoptedLandAreaSqFt,
    fields.adoptedLandRatePerSqFt,
    fields.adoptedAreaSqFt,
    fields.adoptedConstructionMarketRate,
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
    const renderer = new PDFKotakHLLAPIndustrialRenderer({ ...fields, projectCode });
    const bytes = await renderer.render();
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kotak_HLLAP_Industrial_${projectCode || 'report'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewPDF = async () => {
    const renderer = new PDFKotakHLLAPIndustrialRenderer({ ...fields, projectCode });
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
        formatName="Industrial Property Method"
        title="Kotak Mahindra Bank — Industrial Property Valuation"
        description="Comprehensive technical and financial valuation format for industrial sheds, plots, factories, and warehouses."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
      />

      {/* Category Tab Bar Switcher */}
      <KotakCategoryTabBar
        currentCategory="IND"
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

      {/* Section 5: Documents (with Industrial extended utility bills) */}
      <div id="sec-documents">
        <KotakDocumentsSection
          fields={fields}
          handleChange={handleChange}
          isReadOnly={isReadOnly}
          isIndustrial={true}
        />
      </div>

      {/* Section 6: Valuation Report (Industrial Property Method) */}
      <div id="sec-valuation">
        <Section title="6. VALUATION REPORT (INDUSTRIAL PROPERTY METHOD)" defaultOpen>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Industrial Property Valuation Method (Land & Shed)
            </span>
            <button
              type="button"
              onClick={handleCalculateIndustrial}
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
                placeholder="e.g. 5000"
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
                <option value="Built up Area">Built up Area</option>
                <option value="Carpet Area">Carpet Area</option>
                <option value="Super Built up Area">Super Built up Area</option>
              </select>
            </Field>
          </div>

          {/* Part A: Land Valuation */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-3">
              A. Industrial Land Measurement & Valuation
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
                  value={fields.udsShare || 'NA'}
                  onChange={(e) => handleChange('udsShare', e.target.value)}
                  disabled={isReadOnly}
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

          {/* Part B: Industrial Shed / Structure Valuation */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-3">
              B. Industrial Shed / Structure Valuation
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

            {/* Floor-wise Breakdown Matrix */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  Floor-wise Area Breakdown (Industrial Shed / Block)
                </span>
                <button
                  type="button"
                  onClick={handleAddFloor}
                  disabled={isReadOnly}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Floor
                </button>
              </div>
              <div className="space-y-2">
                {(fields.floorWiseRows || []).map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-1/3 p-1.5 text-xs border rounded bg-white"
                      value={row.floor}
                      onChange={(e) => handleUpdateFloor(idx, 'floor', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Floor Name"
                    />
                    <input
                      type="text"
                      className="w-1/3 p-1.5 text-xs border rounded bg-white"
                      value={row.siteBua}
                      onChange={(e) => handleUpdateFloor(idx, 'siteBua', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Site BUA (Sq.Ft)"
                    />
                    <input
                      type="text"
                      className="w-1/3 p-1.5 text-xs border rounded bg-white"
                      value={row.planBua}
                      onChange={(e) => handleUpdateFloor(idx, 'planBua', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Plan BUA (Sq.Ft)"
                    />
                    {!isReadOnly && (fields.floorWiseRows || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFloor(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Field label="Adopted Structure Area (in Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.adoptedAreaSqFt || ''}
                  onChange={(e) => handleChange('adoptedAreaSqFt', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Adopted Construction Rate (in Rs. per Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.adoptedConstructionMarketRate || ''}
                  onChange={(e) => handleChange('adoptedConstructionMarketRate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Building Value as per Govt Guideline">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.bldgValueGovtGuideline || ''}
                  onChange={(e) => handleChange('bldgValueGovtGuideline', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Construction Value – Present Stage">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionValuePresentStage || ''}
                  onChange={(e) => handleChange('constructionValuePresentStage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Estimated Cost to complete property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.estimatedCostToComplete || ''}
                  onChange={(e) => handleChange('estimatedCostToComplete', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Construction Value - 100% Complete (ii) [Coupled Structure Value]">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-amber-900 bg-amber-100`}
                  value={fields.constructionValueIi || ''}
                  onChange={(e) => handleChange('constructionValueIi', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>

          {/* C. Amenities Sub-Table */}
          <KotakAmenitiesSubTableUI fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />

          {/* D. Valuation Totals */}
          <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 shadow-xs">
            <Field label="Market Value as per Industrial Property Method (in Rs.) [Land (i) + Shed (ii) + Amenities]">
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
                  onClick={handleCalculateIndustrial}
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
