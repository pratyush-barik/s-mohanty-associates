'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportTitleCard,
  Section,
  Field,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ActiveConfigBanner,
  FloatingNavigator,
} from '../BaseBankReportComponents';
import { formatIndianCurrency } from '@/lib/numberToWords';

export const LIC_NPA_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'NPA-DEFAULT CASES',
  displayName: 'LIC Housing Finance Ltd — NPA Default Cases',
  defaultValues: {
    purpose: 'SARFAESI / NPA Default Case Valuation',
    marketability: 'Good',
    realizableValuePct: '90',
    distressValuePct: '80',
  },
  getPDFRenderer: (data, projectCode) => {
    const { PDFLICNPARenderer } = require('@/lib/banks/pdf-lic-npa-renderer');
    return new PDFLICNPARenderer(data, projectCode);
  },
};

export interface LICNPAProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function LICNPA({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  config,
  onResetWizard,
}: LICNPAProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      loanAccountNo: saved.loanAccountNo || pf.loanAccountNo || '211600001929/1930',
      borrowerName: saved.borrowerName || pf.applicantName || pf.customerName || 'Mrs. Meghamala Pati ,W/o:-Mr. Narayan Chandra Panda',
      propertyAddress: saved.propertyAddress || pf.propertyAddress || 'Plot No-861/1069,Khata No-270/25,Mouza-Nayagarh, P.S.-Korei,Dist-Jajpur,Pincode-755015',

      // Approved BUA
      approvedBuaGf: saved.approvedBuaGf !== undefined ? saved.approvedBuaGf : '1736sqft',
      approvedBuaFf: saved.approvedBuaFf !== undefined ? saved.approvedBuaFf : '1736sqft',
      approvedBuaSf: saved.approvedBuaSf !== undefined ? saved.approvedBuaSf : '1736sqft',
      approvedBuaTotal: saved.approvedBuaTotal !== undefined ? saved.approvedBuaTotal : '5208sqft',

      // Measured BUA
      measuredBuaGf: saved.measuredBuaGf !== undefined ? saved.measuredBuaGf : '1500sqft',
      measuredBuaFf: saved.measuredBuaFf !== undefined ? saved.measuredBuaFf : '1736sqft',
      measuredBuaSf: saved.measuredBuaSf !== undefined ? saved.measuredBuaSf : '1736sqft',
      measuredBuaTotal: saved.measuredBuaTotal !== undefined ? saved.measuredBuaTotal : '5208sqft',

      // Questions
      isPropertyComplete: saved.isPropertyComplete || 'Yes',
      propertyCompleteDetails: saved.propertyCompleteDetails || '',
      isWellMaintainedAndStructurallySound: saved.isWellMaintainedAndStructurallySound || 'Yes',

      // Valuation Grid
      landArea: saved.landArea || '4356sqft',
      landUnitRate: saved.landUnitRate || 'Rs.1100/-',
      landTotalValue: saved.landTotalValue || 'Rs.47,91,600/-',

      buildingArea: saved.buildingArea || '5208sqft',
      buildingUnitRate: saved.buildingUnitRate || 'Rs.2500/-',
      buildingTotalValue: saved.buildingTotalValue || 'Rs.1,30,20,000/-',

      totalMarketValue: saved.totalMarketValue || 'Rs.1,78,11,600/-',
      realizableValuePct: saved.realizableValuePct || '90',
      realizableValue: saved.realizableValue || 'Rs.1,60,30,440/-',
      distressValuePct: saved.distressValuePct || '80',
      distressValue: saved.distressValue || 'Rs.1,42,49,280/-',
      marketability: saved.marketability || 'Good',
      otherImportantInfo: saved.otherImportantInfo || 'NA',

      visitDate: saved.visitDate || pf.inspectionDate || '26/05/2025',
      reportDate: saved.reportDate || pf.reportDate || '26/05/2025',
      valuerName: saved.valuerName || 'Er. Satyajit Mohanty',
      valuerSignaturePlace: saved.valuerSignaturePlace || 'Bhubaneswar',

      // Attachments
      documentImages: saved.documentImages || [],
      documentImageNames: saved.documentImageNames || [],
      locationMapImages: saved.locationMapImages || [],
      mouzaMapImages: saved.mouzaMapImages || [],
      sketchMapImages: saved.sketchMapImages || [],
      cadastralMapImages: saved.cadastralMapImages || [],
      bdaMapImages: saved.bdaMapImages || [],
      propertyImages: saved.propertyImages || [],
      propertyImageNames: saved.propertyImageNames || [],
    };
  }, [rawInitialFields, initialData, projectCode, projectId, prefill]);

  const [fields, setFields] = useState<any>(initialFields);

  const handleChange = (key: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [key]: value }));
  };

  // Helper numeric parsers for exact calculations
  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  const parsePct = (val: any, fallback = 100): number => {
    if (val === undefined || val === null || String(val).trim() === '') return fallback;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? fallback : Math.min(100, Math.max(0, n));
  };

  // Auto-calculate Total BUA
  useEffect(() => {
    const gfApp = parseNum(fields.approvedBuaGf);
    const ffApp = parseNum(fields.approvedBuaFf);
    const sfApp = parseNum(fields.approvedBuaSf);
    const totalApp = gfApp + ffApp + sfApp;
    if (totalApp > 0) {
      handleChange('approvedBuaTotal', `${totalApp}sqft`);
    }

    const gfMeas = parseNum(fields.measuredBuaGf);
    const ffMeas = parseNum(fields.measuredBuaFf);
    const sfMeas = parseNum(fields.measuredBuaSf);
    const totalMeas = gfMeas + ffMeas + sfMeas;
    if (totalMeas > 0) {
      handleChange('measuredBuaTotal', `${totalMeas}sqft`);
    }
  }, [
    fields.approvedBuaGf,
    fields.approvedBuaFf,
    fields.approvedBuaSf,
    fields.measuredBuaGf,
    fields.measuredBuaFf,
    fields.measuredBuaSf,
  ]);

  // Auto-calculate Land & Building Totals and Market/Realizable/Distress Values
  useEffect(() => {
    const lArea = parseNum(fields.landArea);
    const lRate = parseNum(fields.landUnitRate);
    const lTot = lArea > 0 && lRate > 0 ? Math.round(lArea * lRate) : parseNum(fields.landTotalValue);

    const bArea = parseNum(fields.buildingArea);
    const bRate = parseNum(fields.buildingUnitRate);
    const bTot = bArea > 0 && bRate > 0 ? Math.round(bArea * bRate) : parseNum(fields.buildingTotalValue);

    const mkt = lTot + bTot;
    const rPct = parsePct(fields.realizableValuePct, 90);
    const dPct = parsePct(fields.distressValuePct, 80);

    const real = Math.round((mkt * rPct) / 100);
    const dist = Math.round((mkt * dPct) / 100);

    setFields((prev: any) => ({
      ...prev,
      landTotalValue: lTot > 0 ? `Rs.${formatIndianCurrency(lTot)}/-` : prev.landTotalValue,
      buildingTotalValue: bTot > 0 ? `Rs.${formatIndianCurrency(bTot)}/-` : prev.buildingTotalValue,
      totalMarketValue: mkt > 0 ? `Rs.${formatIndianCurrency(mkt)}/-` : prev.totalMarketValue,
      realizableValue: real > 0 ? `Rs.${formatIndianCurrency(real)}/-` : prev.realizableValue,
      distressValue: dist > 0 ? `Rs.${formatIndianCurrency(dist)}/-` : prev.distressValue,
    }));
  }, [
    fields.landArea,
    fields.landUnitRate,
    fields.buildingArea,
    fields.buildingUnitRate,
    fields.realizableValuePct,
    fields.distressValuePct,
  ]);

  const handleSaveInternal = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        reportData: fields,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save report draft', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { PDFLICNPARenderer } = require('@/lib/banks/pdf-lic-npa-renderer');
      const renderer = new PDFLICNPARenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIC_NPA_Default_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating LIC NPA PDF:', e);
    }
  };

  const navSections = [
    { id: 'sec-1', title: 'Account & Borrower' },
    { id: 'sec-2', title: 'Area Breakdown' },
    { id: 'sec-3', title: 'Physical Condition' },
    { id: 'sec-4', title: 'Valuation' },
    { id: 'sec-5', title: 'Certification' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'section-photographs', title: 'Photographs' },
  ];

  return (
    <div className="space-y-6 pb-28 w-full">
      {/* ── Active Config Banner with Change Parameters ── */}
      <ActiveConfigBanner
        bankName={fields.organisationTemplate || 'LIC HOUSING FINANCE LTD'}
        subclass="NPA-DEFAULT CASES"
        clientType="organisation"
        category="Bank & FIS"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* ── Top Header Card ── */}
      <BankReportTitleCard
        bankName="LIC Housing Finance Ltd"
        subclass="NPA Default Cases"
        title="Valuation Report Builder"
        description="Detailed Statutory Valuation Report for NPA Default Accounts."
        earliestVisit={getEarliestFieldVisit(bucketImages, prefill)}
        projectCode={projectCode}
      />

      {/* ── Section 1: Account & Borrower Details ── */}
      <Section id="sec-1" title="Account & Borrower Details" number={1} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Loan Account No.">
            <input
              className={inputCls}
              value={fields.loanAccountNo}
              onChange={(e) => handleChange('loanAccountNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Name of the Borrower/s">
            <input
              className={inputCls}
              value={fields.borrowerName}
              onChange={(e) => handleChange('borrowerName', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Property Address">
              <textarea
                className={`${inputCls} h-20`}
                value={fields.propertyAddress}
                onChange={(e) => handleChange('propertyAddress', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Carpet / Built-Up Area Grid ── */}
      <Section id="sec-2" title="Carpet / Built-Up Area Breakdown" number={2} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approved BUA */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Approved BUA</h3>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Ground Floor">
                <input
                  className={inputCls}
                  value={fields.approvedBuaGf}
                  onChange={(e) => handleChange('approvedBuaGf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1736sqft"
                />
              </Field>
              <Field label="First Floor">
                <input
                  className={inputCls}
                  value={fields.approvedBuaFf}
                  onChange={(e) => handleChange('approvedBuaFf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1736sqft"
                />
              </Field>
              <Field label="Second Floor">
                <input
                  className={inputCls}
                  value={fields.approvedBuaSf}
                  onChange={(e) => handleChange('approvedBuaSf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1736sqft"
                />
              </Field>
            </div>
            <Field label="Total Approved BUA">
              <input
                className={`${inputCls} font-bold text-slate-800 bg-white`}
                value={fields.approvedBuaTotal}
                onChange={(e) => handleChange('approvedBuaTotal', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Measured BUA */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Measured BUA</h3>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Ground Floor">
                <input
                  className={inputCls}
                  value={fields.measuredBuaGf}
                  onChange={(e) => handleChange('measuredBuaGf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1500sqft"
                />
              </Field>
              <Field label="First Floor">
                <input
                  className={inputCls}
                  value={fields.measuredBuaFf}
                  onChange={(e) => handleChange('measuredBuaFf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1736sqft"
                />
              </Field>
              <Field label="Second Floor">
                <input
                  className={inputCls}
                  value={fields.measuredBuaSf}
                  onChange={(e) => handleChange('measuredBuaSf', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 1736sqft"
                />
              </Field>
            </div>
            <Field label="Total Measured BUA">
              <input
                className={`${inputCls} font-bold text-slate-800 bg-white`}
                value={fields.measuredBuaTotal}
                onChange={(e) => handleChange('measuredBuaTotal', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Physical Condition & Questions ── */}
      <Section id="sec-3" title="Physical Condition & Completion" number={3} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Is the property complete in all respect?">
            <select
              className={selectCls}
              value={fields.isPropertyComplete}
              onChange={(e) => handleChange('isPropertyComplete', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="If not, provide details">
            <input
              className={inputCls}
              value={fields.propertyCompleteDetails}
              onChange={(e) => handleChange('propertyCompleteDetails', e.target.value)}
              disabled={isReadOnly || fields.isPropertyComplete === 'Yes'}
              placeholder="e.g. Finishing works pending"
            />
          </Field>
          <Field label="Is the flat/house well maintained? Is it structurally sound?">
            <select
              className={selectCls}
              value={fields.isWellMaintainedAndStructurallySound}
              onChange={(e) => handleChange('isWellMaintainedAndStructurallySound', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="Marketability of the Property">
            <select
              className={selectCls}
              value={fields.marketability}
              onChange={(e) => handleChange('marketability', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Valuation Grid & Computations ── */}
      <Section id="sec-4" title="Value of Property & Calculations" number={4} defaultOpen={true}>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Component</th>
                <th className="p-3">Area</th>
                <th className="p-3">Unit Rate</th>
                <th className="p-3 text-right">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-700">Land</td>
                <td className="p-3">
                  <input
                    className={inputCls}
                    value={fields.landArea}
                    onChange={(e) => handleChange('landArea', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 4356sqft"
                  />
                </td>
                <td className="p-3">
                  <input
                    className={inputCls}
                    value={fields.landUnitRate}
                    onChange={(e) => handleChange('landUnitRate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Rs.1100/-"
                  />
                </td>
                <td className="p-3 text-right">
                  <input
                    className={`${inputCls} text-right font-bold`}
                    value={fields.landTotalValue}
                    onChange={(e) => handleChange('landTotalValue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">Building (Approved) G+1</td>
                <td className="p-3">
                  <input
                    className={inputCls}
                    value={fields.buildingArea}
                    onChange={(e) => handleChange('buildingArea', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 5208sqft"
                  />
                </td>
                <td className="p-3">
                  <input
                    className={inputCls}
                    value={fields.buildingUnitRate}
                    onChange={(e) => handleChange('buildingUnitRate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Rs.2500/-"
                  />
                </td>
                <td className="p-3 text-right">
                  <input
                    className={`${inputCls} text-right font-bold`}
                    value={fields.buildingTotalValue}
                    onChange={(e) => handleChange('buildingTotalValue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <Field label="Total Market Value">
            <input
              className={`${inputCls} font-bold text-slate-900 bg-white`}
              value={fields.totalMarketValue}
              onChange={(e) => handleChange('totalMarketValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Realizable Value (90%)">
            <div className="flex gap-2">
              <input
                className={`${inputCls} w-20 text-center`}
                value={fields.realizableValuePct}
                onChange={(e) => handleChange('realizableValuePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="%"
              />
              <input
                className={`${inputCls} font-semibold flex-1 bg-white`}
                value={fields.realizableValue}
                onChange={(e) => handleChange('realizableValue', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </Field>
          <Field label="Distress Value (80%)">
            <div className="flex gap-2">
              <input
                className={`${inputCls} w-20 text-center`}
                value={fields.distressValuePct}
                onChange={(e) => handleChange('distressValuePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="%"
              />
              <input
                className={`${inputCls} font-semibold flex-1 bg-white`}
                value={fields.distressValue}
                onChange={(e) => handleChange('distressValue', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Any other information which is important and material for the case">
            <textarea
              className={`${inputCls} h-20`}
              value={fields.otherImportantInfo}
              onChange={(e) => handleChange('otherImportantInfo', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. NA"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Valuer Certification & Inspection Date ── */}
      <Section id="sec-5" title="Certification & Signatures" number={5} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Date of Site Visit">
            <input
              className={inputCls}
              value={fields.visitDate}
              onChange={(e) => handleChange('visitDate', e.target.value)}
              disabled={isReadOnly}
              placeholder="DD/MM/YYYY"
            />
          </Field>
          <Field label="Valuer Name">
            <input
              className={inputCls}
              value={fields.valuerName}
              onChange={(e) => handleChange('valuerName', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Place">
            <input
              className={inputCls}
              value={fields.valuerSignaturePlace}
              onChange={(e) => handleChange('valuerSignaturePlace', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
          <strong>Mandatory Notice:</strong> "Note:- We have referred previous valuation report copy for land & approved built-up area." is automatically embedded below the primary photograph on Page 2.
        </div>
      </Section>

      {/* ── Section 6: Inherited Documents ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={6}
        sectionId="section-documents"
      />

      {/* ── Section 7: Inherited Maps ── */}
      <BaseMapsSection
        title="Maps"
        locationMapImages={fields.locationMapImages || []}
        mouzaMapImages={fields.mouzaMapImages || []}
        sketchMapImages={fields.sketchMapImages || []}
        cadastralMapImages={fields.cadastralMapImages || []}
        bdaMapImages={fields.bdaMapImages || []}
        latitude={fields.latitude}
        longitude={fields.longitude}
        technicalAddress={fields.propertyAddress || ''}
        propertyAddress={fields.propertyAddress || ''}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={7}
        sectionId="section-maps"
      />

      {/* ── Section 8: Inherited Photographs ── */}
      <BasePhotographsSection
        title="Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={8}
        sectionId="section-photographs"
      />
        </div>
        <FloatingNavigator sections={navSections} />
      </div>
    </div>
  );
}
