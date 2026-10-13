'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
} from '../BaseBankReportComponents';
import { formatIndianCurrency } from '@/lib/numberToWords';

export const LIC_PVR2_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-2(FLAT-UNDERCONSTRUCTION)',
  displayName: 'LIC Housing Finance Ltd — PVR-2 (Flat Under Construction)',
  defaultValues: {
    purpose: 'Flat Under Construction Valuation (PVR-2)',
    valuationLayout: 'apartment',
  },
  getPDFRenderer: (data, projectCode) => {
    const { PDFLICPVR2Renderer } = require('@/lib/banks/pdf-lic-pvr2-renderer');
    return new PDFLICPVR2Renderer(data, projectCode);
  },
};

export interface LICPVR2Props extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function LICPVR2({
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
}: LICPVR2Props) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Header Metadata
      fileNo: saved.fileNo || pf.loanAccountNo || '9002050007125',
      nameOfValuer: saved.nameOfValuer || 'Er. Satyajit Mohanty',
      codeNo: saved.codeNo || 'BH-AOV0078',
      appointingAuthority: saved.appointingAuthority || 'LIC HFL(Br-I)',
      dateOfValuation: saved.dateOfValuation || pf.reportDate || '30/07/2025',
      reraNo: saved.reraNo || 'NA',

      // Section A: General
      applicantName: saved.applicantName || pf.applicantName || pf.customerName || 'Mrs. Suchitra Moharana ,W/o:-Mr. Ranjan Kumar Sahoo',
      builderDeveloperName: saved.builderDeveloperName || 'M/s. Ajjiban Construction Pvt. Ltd.',
      documentsProduced: saved.documentsProduced || 'Copy of Agreement for sale & Allotment letter',
      apartmentName: saved.apartmentName || 'Subhadra Palace',
      flatNoFloorNo: saved.flatNoFloorNo || 'Flat no-402, 3-BHK, 4th Floor',
      plotNoKhataNo: saved.plotNoKhataNo || 'Plot No-1236/2887,1236/2897 & 1236/4503,Khata No-1057/702 & 1057/2428',
      villageTalukWard: saved.villageTalukWard || 'Mouza-Bhubaneswar Sahar Unit-32,Gobindparsad,PS-New Capital(46), TS-Bhubaneswar(244)',
      districtPin: saved.districtPin || 'Dist-Khurda,Odisha Pin-751007',
      locationSketchVerified: saved.locationSketchVerified || 'Yes',
      surroundingDevelopmentClass: saved.surroundingDevelopmentClass || 'Middle Class',
      basicAmenitiesAvailable: saved.basicAmenitiesAvailable || 'Yes',
      negativesToLocality: saved.negativesToLocality || 'No',
      favourableConsiderations: saved.favourableConsiderations || 'All civic amenities like school,hospital, market area are within 3-5Kms.',
      otherFeaturesNotice: saved.otherFeaturesNotice || 'Not Observed',

      // Section B: Entire Project
      totalExtentLandSqft: saved.totalExtentLandSqft || '5401sqft',
      boundaryNorth: saved.boundaryNorth || 'Flat No-401',
      boundarySouth: saved.boundarySouth || 'Plot No-1234(Part) & 1234/6',
      boundaryEast: saved.boundaryEast || 'Revenue Plot No-1237/22',
      boundaryWest: saved.boundaryWest || 'Road',
      landDimensionsTallyPlan: saved.landDimensionsTallyPlan || 'Yes',
      landDimensionsTallyDeed: saved.landDimensionsTallyDeed || 'Sale agreement',
      naPermissionObtained: saved.naPermissionObtained || 'Yes',
      environmentClearanceObtained: saved.environmentClearanceObtained || 'No',

      // Section C: Drawing Approval
      planningPermitNoDate: saved.planningPermitNoDate || 'Plan has been approved by BMC, vide Letter No-BP/BMC/003510,Dated-17/06/2023)',
      validityUpto: saved.validityUpto || 'Dt-16/06/2027',
      validityExpiredRenewed: saved.validityExpiredRenewed || 'NA',
      isPlanForResidential: saved.isPlanForResidential || 'Yes',
      approvalAuthority: saved.approvalAuthority || 'BMC,Bhubaneswar',

      // Section D: Inspection
      noOfBlocksApproved: saved.noOfBlocksApproved || '1',
      noOfBlocksActual: saved.noOfBlocksActual || '1',
      noOfFloorsApproved: saved.noOfFloorsApproved || 'S+4',
      noOfFloorsActual: saved.noOfFloorsActual || 'S+4',
      totalBuiltUpAreaApproved: saved.totalBuiltUpAreaApproved || '13410sqft.',
      totalBuiltUpAreaActual: saved.totalBuiltUpAreaActual || '13410sqft.',
      totalCarpetAreaApproved: saved.totalCarpetAreaApproved || 'NA',
      totalCarpetAreaActual: saved.totalCarpetAreaActual || 'NA',
      noOfDwellingUnitsApproved: saved.noOfDwellingUnitsApproved || '8 Units',
      noOfDwellingUnitsActual: saved.noOfDwellingUnitsActual || '8 Units',
      plotCoverageApproved: saved.plotCoverageApproved || '60%',
      plotCoverageActual: saved.plotCoverageActual || '60%',
      fsiApproved: saved.fsiApproved || '1.992',
      fsiActual: saved.fsiActual || '1.992',
      tdrApproved: saved.tdrApproved || 'NA',
      tdrActual: saved.tdrActual || 'NA',

      qualityOfConstruction: saved.qualityOfConstruction || 'Good',
      costOfLandUnitRate: saved.costOfLandUnitRate || 'Not Provided by the Developer',
      costOfLandMarketValue: saved.costOfLandMarketValue || 'Not Provided by the Developer',
      costOfLandGuidelineRate: saved.costOfLandGuidelineRate || 'Not Provided by the Developer',
      costOfLandGuidelineValue: saved.costOfLandGuidelineValue || 'Not Provided by the Developer',
      costOfLandTdrPurchaseCost: saved.costOfLandTdrPurchaseCost || 'Rs.0',
      constructionCostOfProject: saved.constructionCostOfProject || 'Rs.30843000.00',
      totalCostOfProject: saved.totalCostOfProject || 'Rs.30843000.00',

      unitRateForFlatMarket: saved.unitRateForFlatMarket || 'Rs.7700/sqft.',
      marketValueOfFlat: saved.marketValueOfFlat || 'Rs.70,00,000/-',
      guidelineRateForFlat: saved.guidelineRateForFlat || 'Rs.2342/sqft.',
      guidelineValueOfFlat: saved.guidelineValueOfFlat || 'Rs.53,86,600/-',
      sourceForArrivingAtMarketValue: saved.sourceForArrivingAtMarketValue || 'By local market feedback & transaction of similar properties',
      ratePerSqftForConstruction: saved.ratePerSqftForConstruction || 'Flat@Rs.2300.00/sqft',
      waterResources: saved.waterResources || 'Yes(Bore Well)',
      sewerageSystem: saved.sewerageSystem || 'Yes',
      electricityConnection: saved.electricityConnection || 'Yes',
      noOfLifts: saved.noOfLifts || 'Yes(Provision for lift)',
      dateOfCommencement: saved.dateOfCommencement || '10th August 2024',
      proposedDateOfCompletion: saved.proposedDateOfCompletion || '6th June 2026',
      isConstructionAsPerApprovedPlan: saved.isConstructionAsPerApprovedPlan || 'Yes',
      deviationBetweenDrawingAndActual: saved.deviationBetweenDrawingAndActual || 'NA',
      deviationMinorMajorNature: saved.deviationMinorMajorNature || 'NA',
      deviationRevisedApprovalReqd: saved.deviationRevisedApprovalReqd || 'No',
      progressEntireProject: saved.progressEntireProject || 'S+4 RCC,Brickworks & Plastering Completed.',
      progressBlockFloorWise: saved.progressBlockFloorWise || '',
      nbcAndNdmaAdhered: saved.nbcAndNdmaAdhered || 'Yes',
      highTensionLinePassing: saved.highTensionLinePassing || 'No',

      // Section E: Flat Under Construction
      udsAsPerSaleDeed: saved.udsAsPerSaleDeed || 'NA',
      valueOfUds: saved.valueOfUds || 'NA',
      isUdsInProportionToBuiltUp: saved.isUdsInProportionToBuiltUp || 'NA',
      correctUdsIfNotProportion: saved.correctUdsIfNotProportion || 'NA',
      specRoof: saved.specRoof || 'R.C.C',
      specFlooring: saved.specFlooring || 'Not done(Proposed)',
      superBuiltUpAreaFlat: saved.superBuiltUpAreaFlat || '1651sqft',
      carpetAreaFlat: saved.carpetAreaFlat || 'Not mentioned',
      costOfFlatAgreement: saved.costOfFlatAgreement || 'Rs.70,00,000/- (Including Car Parking)',
      totalCostOfFlatTotal: saved.totalCostOfFlatTotal || 'Rs.70,00,000/-',
      compositeRatePerSqft: saved.compositeRatePerSqft || 'Rs.4240/-',
      isRateGenuine: saved.isRateGenuine || 'Yes',
      genuineRateIfNot: saved.genuineRateIfNot || 'NA',
      marketabilityOfProperty: saved.marketabilityOfProperty || 'Good',

      // Section F: Valuation
      valStageWorksPct: saved.valStageWorksPct || '75%',
      valStageWorksValue: saved.valStageWorksValue || 'Rs.52,50,000/-',
      valUdsAsPerSaleDeed: saved.valUdsAsPerSaleDeed || 'NA',
      valTotalStageValueOfFlat: saved.valTotalStageValueOfFlat || 'Rs.52,50,000/-',
      valUsageOfBuilding: saved.valUsageOfBuilding || 'Residential',

      // Section G: Recommendation
      recSno: saved.recSno || '1',
      recStageOfConstruction: saved.recStageOfConstruction || 'S+4 RCC,Brickworks & Plastering Completed.',
      recProgressPct: saved.recProgressPct || '75%',

      // Section H: Narratives
      narrativeBackground: saved.narrativeBackground || 'Subject property is a 3-BHK residential flat. There is a very high difference between Govt. value and market value. Govt. benchmark value not revised for that locality recently and to avoid high stamp duty/registration charges sale deed executed in under-valued Rate.',
      narrativeSources: saved.narrativeSources || 'Recent transactions, Property brokers, local market feedback & web-sites.',
      narrativeProcedures: saved.narrativeProcedures || 'Sales comparison method adopted by comparing the per Sqft CA rate of similar flats in that locality.',
      narrativeMethodology: saved.narrativeMethodology || 'Composite method adopted.',
      narrativeFactors: saved.narrativeFactors || 'Location & Accessibility to civic amenities',

      // Section 9: Certificate
      certificateDate: saved.certificateDate || pf.inspectionDate || '30/07/2025',
      certificatePlace: saved.certificatePlace || 'Bhubaneswar',
      valuerSignatureName: saved.valuerSignatureName || 'Er. Satyajit Mohanty',

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

  // Calculations for Flat Rates & Stage Valuation
  useEffect(() => {
    const sbua = parseNum(fields.superBuiltUpAreaFlat);
    const mktFlat = parseNum(fields.marketValueOfFlat);

    // Composite rate per sqft = Market Value / SBUA
    if (sbua > 0 && mktFlat > 0) {
      const compRate = Math.round(mktFlat / sbua);
      handleChange('compositeRatePerSqft', `Rs.${formatIndianCurrency(compRate)}/-`);
    }

    // Stage value = Total Cost / Market Value * Stage %
    const totalCost = parseNum(fields.totalCostOfFlatTotal) || mktFlat;
    const stagePct = parsePct(fields.valStageWorksPct, 75);
    if (totalCost > 0) {
      const stageVal = Math.round((totalCost * stagePct) / 100);
      setFields((prev: any) => ({
        ...prev,
        valStageWorksValue: `Rs.${formatIndianCurrency(stageVal)}/-`,
        valTotalStageValueOfFlat: `Rs.${formatIndianCurrency(stageVal)}/-`,
      }));
    }
  }, [
    fields.superBuiltUpAreaFlat,
    fields.marketValueOfFlat,
    fields.totalCostOfFlatTotal,
    fields.valStageWorksPct,
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
      const { PDFLICPVR2Renderer } = require('@/lib/banks/pdf-lic-pvr2-renderer');
      const renderer = new PDFLICPVR2Renderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIC_PVR2_FlatUnderConstruction_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating LIC PVR-2 PDF:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* ── Top Header Card ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            LIC Housing Finance Ltd
          </span>
          <h1 className="text-xl font-bold text-slate-800 mt-2">PVR-2: FLAT UNDER CONSTRUCTION</h1>
          <p className="text-xs text-slate-500">Valuation Report by Panel Valuer for Home Loan (Residential Apartment)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveInternal}
            disabled={saving || isReadOnly}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Header Metadata ── */}
      <Section id="sec-meta" title="Header & File Metadata" number={1} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="File No."><input className={inputCls} value={fields.fileNo} onChange={(e) => handleChange('fileNo', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Code No."><input className={inputCls} value={fields.codeNo} onChange={(e) => handleChange('codeNo', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Appointing Authority"><input className={inputCls} value={fields.appointingAuthority} onChange={(e) => handleChange('appointingAuthority', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Name of the Valuer"><input className={inputCls} value={fields.nameOfValuer} onChange={(e) => handleChange('nameOfValuer', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Date of Valuation"><input className={inputCls} value={fields.dateOfValuation} onChange={(e) => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="RERA No."><input className={inputCls} value={fields.reraNo} onChange={(e) => handleChange('reraNo', e.target.value)} disabled={isReadOnly} /></Field>
        </div>
      </Section>

      {/* ── Section A: General ── */}
      <Section id="sec-a" title="A. GENERAL (Points 1 to 11)" number={2} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="1. Name of the Applicant"><input className={inputCls} value={fields.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="2. Name of Builder / Developer"><input className={inputCls} value={fields.builderDeveloperName} onChange={(e) => handleChange('builderDeveloperName', e.target.value)} disabled={isReadOnly} /></Field>
          <div className="md:col-span-2">
            <Field label="4. Documents produced for perusal"><input className={inputCls} value={fields.documentsProduced} onChange={(e) => handleChange('documentsProduced', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
          <Field label="5. Apartment / Project Name"><input className={inputCls} value={fields.apartmentName} onChange={(e) => handleChange('apartmentName', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Flat No & Floor No"><input className={inputCls} value={fields.flatNoFloorNo} onChange={(e) => handleChange('flatNoFloorNo', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Plot No & Khata No"><input className={inputCls} value={fields.plotNoKhataNo} onChange={(e) => handleChange('plotNoKhataNo', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Village / Mouza / PS"><input className={inputCls} value={fields.villageTalukWard} onChange={(e) => handleChange('villageTalukWard', e.target.value)} disabled={isReadOnly} /></Field>
          <div className="md:col-span-2">
            <Field label="District, State, PIN"><input className={inputCls} value={fields.districtPin} onChange={(e) => handleChange('districtPin', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
          <Field label="6. Location Sketch Verified"><input className={inputCls} value={fields.locationSketchVerified} onChange={(e) => handleChange('locationSketchVerified', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="7. Surrounding development class"><input className={inputCls} value={fields.surroundingDevelopmentClass} onChange={(e) => handleChange('surroundingDevelopmentClass', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="8. Basic amenities available"><input className={inputCls} value={fields.basicAmenitiesAvailable} onChange={(e) => handleChange('basicAmenitiesAvailable', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="9. Negatives to locality"><input className={inputCls} value={fields.negativesToLocality} onChange={(e) => handleChange('negativesToLocality', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="10. Favourable considerations for value"><input className={inputCls} value={fields.favourableConsiderations} onChange={(e) => handleChange('favourableConsiderations', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="11. Other features like notice/court/mortgage"><input className={inputCls} value={fields.otherFeaturesNotice} onChange={(e) => handleChange('otherFeaturesNotice', e.target.value)} disabled={isReadOnly} /></Field>
        </div>
      </Section>

      {/* ── Section B: Entire Project ── */}
      <Section id="sec-b" title="B. ENTIRE PROJECT (Land & Boundaries)" number={3} defaultOpen={true}>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/3">Direction</th>
                <th className="p-3 w-2/3">Boundaries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-700">North / Front</td>
                <td className="p-3"><input className={inputCls} value={fields.boundaryNorth} onChange={(e) => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">South / Rear</td>
                <td className="p-3"><input className={inputCls} value={fields.boundarySouth} onChange={(e) => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">East / Left (Side 1)</td>
                <td className="p-3"><input className={inputCls} value={fields.boundaryEast} onChange={(e) => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">West / Right (Side 2)</td>
                <td className="p-3"><input className={inputCls} value={fields.boundaryWest} onChange={(e) => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="1. Total extent of land as per actual"><input className={inputCls} value={fields.totalExtentLandSqft} onChange={(e) => handleChange('totalExtentLandSqft', e.target.value)} disabled={isReadOnly} placeholder="5401sqft" /></Field>
          <Field label="3. Land dimensions tally with approved plan?"><input className={inputCls} value={fields.landDimensionsTallyPlan} onChange={(e) => handleChange('landDimensionsTallyPlan', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="3. Land dimensions tally with sale deed?"><input className={inputCls} value={fields.landDimensionsTallyDeed} onChange={(e) => handleChange('landDimensionsTallyDeed', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="4. Whether N.A. Permission obtained"><input className={inputCls} value={fields.naPermissionObtained} onChange={(e) => handleChange('naPermissionObtained', e.target.value)} disabled={isReadOnly} /></Field>
          <div className="md:col-span-2">
            <Field label="5. Environment Clearance Required & Obtained"><input className={inputCls} value={fields.environmentClearanceObtained} onChange={(e) => handleChange('environmentClearanceObtained', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section C: Drawing Approval ── */}
      <Section id="sec-c" title="C. DRAWING APPROVAL" number={4} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="1. Planning permit / Building permission No & Date">
              <input className={inputCls} value={fields.planningPermitNoDate} onChange={(e) => handleChange('planningPermitNoDate', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="2. Validity is up to"><input className={inputCls} value={fields.validityUpto} onChange={(e) => handleChange('validityUpto', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="3. Plinth certificate / CC / OC status"><input className={inputCls} value={fields.validityExpiredRenewed} onChange={(e) => handleChange('validityExpiredRenewed', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="4. Plan for residential purpose?"><input className={inputCls} value={fields.isPlanForResidential} onChange={(e) => handleChange('isPlanForResidential', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="5. Approval Authority"><input className={inputCls} value={fields.approvalAuthority} onChange={(e) => handleChange('approvalAuthority', e.target.value)} disabled={isReadOnly} /></Field>
        </div>
      </Section>

      {/* ── Section D: Inspection ── */}
      <Section id="sec-d" title="D. INSPECTION & PROJECT DETAILS" number={5} defaultOpen={true}>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/2">Particulars</th>
                <th className="p-3 text-center">As per approved plan / rules</th>
                <th className="p-3 text-center">As at site at inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-700">i) No. of Blocks / Building</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.noOfBlocksApproved} onChange={(e) => handleChange('noOfBlocksApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.noOfBlocksActual} onChange={(e) => handleChange('noOfBlocksActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">ii) No. of storey / Floors</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.noOfFloorsApproved} onChange={(e) => handleChange('noOfFloorsApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.noOfFloorsActual} onChange={(e) => handleChange('noOfFloorsActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">iii) Total built up area (sq.ft)</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.totalBuiltUpAreaApproved} onChange={(e) => handleChange('totalBuiltUpAreaApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.totalBuiltUpAreaActual} onChange={(e) => handleChange('totalBuiltUpAreaActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">iv) Total Carpet area (approx.)</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.totalCarpetAreaApproved} onChange={(e) => handleChange('totalCarpetAreaApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.totalCarpetAreaActual} onChange={(e) => handleChange('totalCarpetAreaActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">v) No. of dwelling units</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.noOfDwellingUnitsApproved} onChange={(e) => handleChange('noOfDwellingUnitsApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.noOfDwellingUnitsActual} onChange={(e) => handleChange('noOfDwellingUnitsActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">vi) Plot coverage</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.plotCoverageApproved} onChange={(e) => handleChange('plotCoverageApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.plotCoverageActual} onChange={(e) => handleChange('plotCoverageActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">vii) Floor Space Index (FSI)</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.fsiApproved} onChange={(e) => handleChange('fsiApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.fsiActual} onChange={(e) => handleChange('fsiActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">viii) TDR</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.tdrApproved} onChange={(e) => handleChange('tdrApproved', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.tdrActual} onChange={(e) => handleChange('tdrActual', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="2. Overall Quality of Construction"><input className={inputCls} value={fields.qualityOfConstruction} onChange={(e) => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="5. Construction Cost of Project"><input className={inputCls} value={fields.constructionCostOfProject} onChange={(e) => handleChange('constructionCostOfProject', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="6(i). Unit Rate for Flat (Market)"><input className={inputCls} value={fields.unitRateForFlatMarket} onChange={(e) => handleChange('unitRateForFlatMarket', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="6(ii). Market Value of Flat"><input className={`${inputCls} font-bold`} value={fields.marketValueOfFlat} onChange={(e) => handleChange('marketValueOfFlat', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="6(iii). Guideline Rate of Flat"><input className={inputCls} value={fields.guidelineRateForFlat} onChange={(e) => handleChange('guidelineRateForFlat', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="6(iv). Guideline Value of Flat"><input className={`${inputCls} font-bold`} value={fields.guidelineValueOfFlat} onChange={(e) => handleChange('guidelineValueOfFlat', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="8. Rate per sqft for Construction"><input className={inputCls} value={fields.ratePerSqftForConstruction} onChange={(e) => handleChange('ratePerSqftForConstruction', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="12. No. of Lifts"><input className={inputCls} value={fields.noOfLifts} onChange={(e) => handleChange('noOfLifts', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="13. Date of Commencement"><input className={inputCls} value={fields.dateOfCommencement} onChange={(e) => handleChange('dateOfCommencement', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="14. Proposed Date of Completion"><input className={inputCls} value={fields.proposedDateOfCompletion} onChange={(e) => handleChange('proposedDateOfCompletion', e.target.value)} disabled={isReadOnly} /></Field>
          <div className="md:col-span-2">
            <Field label="17. Progress of Work (Entire Project)"><textarea className={`${inputCls} h-16`} value={fields.progressEntireProject} onChange={(e) => handleChange('progressEntireProject', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section E: Flat Under Construction ── */}
      <Section id="sec-e" title="E. FLAT UNDER CONSTRUCTION (Agreement & Specifications)" number={6} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Specification: Roof"><input className={inputCls} value={fields.specRoof} onChange={(e) => handleChange('specRoof', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Specification: Flooring"><input className={inputCls} value={fields.specFlooring} onChange={(e) => handleChange('specFlooring', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Super Built-up Area of Flat"><input className={inputCls} value={fields.superBuiltUpAreaFlat} onChange={(e) => handleChange('superBuiltUpAreaFlat', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1651sqft" /></Field>
          <Field label="Carpet Area of Flat"><input className={inputCls} value={fields.carpetAreaFlat} onChange={(e) => handleChange('carpetAreaFlat', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Cost of Flat as per Agreement"><input className={inputCls} value={fields.costOfFlatAgreement} onChange={(e) => handleChange('costOfFlatAgreement', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Total Cost of Flat Total"><input className={`${inputCls} font-bold`} value={fields.totalCostOfFlatTotal} onChange={(e) => handleChange('totalCostOfFlatTotal', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Composite Rate per Sft"><input className={`${inputCls} font-bold`} value={fields.compositeRatePerSqft} onChange={(e) => handleChange('compositeRatePerSqft', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Marketability of Property"><input className={inputCls} value={fields.marketabilityOfProperty} onChange={(e) => handleChange('marketabilityOfProperty', e.target.value)} disabled={isReadOnly} /></Field>
        </div>
      </Section>

      {/* ── Section F & G: Valuation & Recommendation ── */}
      <Section id="sec-f-g" title="F & G. VALUATION & RECOMMENDATION" number={7} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Stage of Works Completed (%)"><input className={inputCls} value={fields.valStageWorksPct} onChange={(e) => handleChange('valStageWorksPct', e.target.value)} disabled={isReadOnly} placeholder="75%" /></Field>
          <Field label="Stage Works Value"><input className={`${inputCls} font-bold`} value={fields.valStageWorksValue} onChange={(e) => handleChange('valStageWorksValue', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Total Stage Value as on Date"><input className={`${inputCls} font-bold text-emerald-900 bg-emerald-50/50`} value={fields.valTotalStageValueOfFlat} onChange={(e) => handleChange('valTotalStageValueOfFlat', e.target.value)} disabled={isReadOnly} /></Field>
          <div className="md:col-span-2">
            <Field label="Recommendation: Stage of Construction"><input className={inputCls} value={fields.recStageOfConstruction} onChange={(e) => handleChange('recStageOfConstruction', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
          <Field label="% Progress"><input className={inputCls} value={fields.recProgressPct} onChange={(e) => handleChange('recProgressPct', e.target.value)} disabled={isReadOnly} /></Field>
        </div>
      </Section>

      {/* ── Section H & 9: Narratives & Certificate ── */}
      <Section id="sec-narratives" title="H. Narratives & 9. Certificate" number={8} defaultOpen={true}>
        <div className="space-y-4">
          <Field label="Background Information of Asset"><textarea className={`${inputCls} h-16`} value={fields.narrativeBackground} onChange={(e) => handleChange('narrativeBackground', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Sources of Information"><input className={inputCls} value={fields.narrativeSources} onChange={(e) => handleChange('narrativeSources', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Procedures Adopted"><input className={inputCls} value={fields.narrativeProcedures} onChange={(e) => handleChange('narrativeProcedures', e.target.value)} disabled={isReadOnly} /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Valuation Methodology"><input className={inputCls} value={fields.narrativeMethodology} onChange={(e) => handleChange('narrativeMethodology', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Inspection Date (Certificate)"><input className={inputCls} value={fields.certificateDate} onChange={(e) => handleChange('certificateDate', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section: Inherited Documents ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={9}
        sectionId="section-documents"
      />

      {/* ── Section: Inherited Maps ── */}
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
        sectionNumber={10}
        sectionId="section-maps"
      />

      {/* ── Section: Inherited Photographs ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={11}
        sectionId="section-photographs"
      />
    </div>
  );
}
