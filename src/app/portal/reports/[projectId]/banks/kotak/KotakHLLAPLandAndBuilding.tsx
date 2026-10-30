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
  ReportActionBar,
  BasePhotoBucketModal,
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
  KotakGeneralSection,
  KotakPropertySection,
  KotakSurroundingsSection,
  KotakConstructionSection,
  KotakDocumentsSection,
  KotakAmenitiesSubTableUI,
  KotakFinalValuesSection,
  KotakEnclosuresSections,
} from './KotakHLLAPSections';
import { PDFKotakHLLAPLandBuildingRenderer } from '@/lib/banks/pdf-kotak-hllap-land-building-renderer';
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
  { id: 'sec-valuation', title: '6. Valuation Report (L&B Method)' },
  { id: 'sec-final-values', title: '7. Final Values & Declaration' },
  { id: 'sec-docs-gallery', title: 'Enclosure 1: Documents' },
  { id: 'sec-maps', title: 'Enclosure 2: Maps' },
  { id: 'sec-photos', title: 'Enclosure 3: Photographs' },
];

export default function KotakHLLAPLandAndBuilding({
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
    getKotakInitialFields('L&B', initialFields, prefill, bucketImages, projectCode)
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
    rows.push({ floor: `${rows.length === 1 ? 'First Floor' : rows.length === 2 ? 'Second Floor' : `Floor ${rows.length}`}`, siteBua: '', planBua: '' });
    handleChange('floorWiseRows', rows);
  };

  const handleRemoveFloor = (index: number) => {
    const rows = [...(fields.floorWiseRows || [])];
    rows.splice(index, 1);
    handleChange('floorWiseRows', rows);
  };

  // Land and Building Valuation Auto-Calculation (with Depreciation)
  const handleCalculateLandAndBuilding = useCallback(() => {
    // Land Value (i)
    const landArea = parseNum(fields.landAreaSqYdOrMt || fields.adoptedLandAreaSqFt);
    const landRate = parseNum(fields.adoptedLandRatePerSqFt);
    const landVal = landArea * landRate;

    // Building Structure Gross Value
    const structArea = parseNum(fields.adoptedAreaSqFt);
    const structRate = parseNum(fields.finalAdoptedRatePerSqFt || fields.adoptedConstructionMarketRate);
    const grossStructVal = structArea * structRate;

    // Depreciation
    const depAmt = parseNum(fields.depreciationTotalAmount);
    const netStructVal = Math.max(0, grossStructVal - depAmt);

    // Amenities
    const parkVal = parseNum(fields.valueOfParking);
    const otherVal = parseNum(fields.valueOfOtherAmenities);
    const amenitiesTotal = parkVal + otherVal;

    // Total Market Value
    const fmv = landVal + netStructVal + amenitiesTotal;
    const dist = Math.round(fmv * 0.8);
    const real = Math.round(fmv * 0.9);

    setFields((prev) => ({
      ...prev,
      landValueI: landVal > 0 ? String(landVal) : prev.landValueI,
      constructionValueIi: netStructVal > 0 ? String(netStructVal) : prev.constructionValueIi,
      totalValueOfAmenities: String(amenitiesTotal),
      marketValueAsPerMethod: fmv > 0 ? String(fmv) : prev.marketValueAsPerMethod,
      finalMarketValue: fmv > 0 ? String(fmv) : prev.finalMarketValue,
      distressedValue: dist > 0 ? String(dist) : prev.distressedValue,
      realizableValue: real > 0 ? String(real) : prev.realizableValue,
      insurableValue: grossStructVal > 0 ? String(grossStructVal) : prev.insurableValue,
    }));
  }, [
    fields.landAreaSqYdOrMt,
    fields.adoptedLandAreaSqFt,
    fields.adoptedLandRatePerSqFt,
    fields.adoptedAreaSqFt,
    fields.finalAdoptedRatePerSqFt,
    fields.adoptedConstructionMarketRate,
    fields.depreciationTotalAmount,
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
    const renderer = new PDFKotakHLLAPLandBuildingRenderer({ ...fields, projectCode });
    const bytes = await renderer.render();
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kotak_HLLAP_Land_Building_${projectCode || 'report'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewPDF = async () => {
    const renderer = new PDFKotakHLLAPLandBuildingRenderer({ ...fields, projectCode });
    const bytes = await renderer.render();
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-28 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header with Wizard Reset */}
      <BankReportHeader
        bankName="KOTAK MAHINDRA BANK"
        subclass="HL-LAP"
        formatName="Land and Building Method"
        title="Kotak Mahindra Bank — Land and Building Valuation"
        description="Comprehensive technical and financial valuation format for independent houses, villas, and residential plots with construction."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
      />

      <div className="flex gap-6">
        {/* Floating Sidebar Navigator */}
        <FloatingNavigator sections={NAV_SECTIONS} />

        {/* Main Content Form */}
        <div className="flex-1 space-y-6 min-w-0">
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

          {/* Section 6: Valuation Report (Land & Building Method) */}
          <div id="sec-valuation">
        <Section title="6. VALUATION REPORT (LAND AND BUILDING METHOD)" defaultOpen>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Land & Building Valuation Method (Land + Depreciated Structure)
            </span>
            <button
              type="button"
              onClick={handleCalculateLandAndBuilding}
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
                placeholder="e.g. 1800"
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
              A. Land Measurement & Valuation
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Field label="Land Area (in sqyd / sqmt / sqft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.landAreaSqYdOrMt || ''}
                  onChange={(e) => handleChange('landAreaSqYdOrMt', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 435 sqft (AC.0.010Decs)"
                />
              </Field>

              <Field label="Undivided share of land (UDS) [Extended to L&B]">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.udsShare || ''}
                  onChange={(e) => handleChange('udsShare', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 100% Full Ownership or Fractional Share"
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

          {/* Part B: Building / Structure Valuation */}
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-3">
              B. Building / Structure Measurement & Valuation
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
                  Floor-wise Area Breakdown (Ground Floor, First Floor, etc.)
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

              <Field label="Final Adopted Rate (in Rs. per Sq.Ft)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold`}
                  value={fields.finalAdoptedRatePerSqFt || fields.adoptedConstructionMarketRate || ''}
                  onChange={(e) => {
                    handleChange('finalAdoptedRatePerSqFt', e.target.value);
                    handleChange('adoptedConstructionMarketRate', e.target.value);
                  }}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Depreciation % age (1.5% per year)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.depreciationPctPerYear || '1.5% per year'}
                  onChange={(e) => handleChange('depreciationPctPerYear', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Total Depreciation Amount (in Rs.)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.depreciationTotalAmount || '0'}
                  onChange={(e) => handleChange('depreciationTotalAmount', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Construction Value - 100% Complete (ii) [Coupled Depreciated Structure Value]">
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
            <Field label="Market Value as per Land and Building Method (in Rs.) [Land (i) + Depreciated Structure (ii) + Amenities]">
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
                  onClick={handleCalculateLandAndBuilding}
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

      {/* Universal Enclosures */}
      <KotakEnclosuresSections
        fields={fields}
        handleChange={handleChange}
        bucketImages={bucketImages}
        isReadOnly={isReadOnly}
        setIsPhotoModalOpen={setIsPhotoModalOpen}
        sectionNumbers={{ docs: 8, maps: 9, photos: 10 }}
      />
        </div>
      </div>

      {/* Floating Action Bar */}
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
        loading={isSaving}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Photo Bucket Modal */}
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
