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
  ActiveConfigBanner,
  FloatingNavigator,
} from '../BaseBankReportComponents';
import { formatIndianCurrency } from '@/lib/numberToWords';

export const LIC_PVR1_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-1(SELF CONSTRUCTION-L & B)',
  displayName: 'LIC Housing Finance Ltd — PVR-1 (House Construction - Land & Building)',
  defaultValues: {
    purpose: 'House Construction / Land & Building Valuation (PVR-1)',
    valuationLayout: 'land_building',
  },
  getPDFRenderer: (data, projectCode) => {
    const { PDFLICPVR1Renderer } = require('@/lib/banks/pdf-lic-pvr1-renderer');
    return new PDFLICPVR1Renderer(data, projectCode);
  },
};

export interface LICPVR1Props extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function LICPVR1({
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
}: LICPVR1Props) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Header Metadata
      fileNo: saved.fileNo || pf.loanAccountNo || '2201003673',
      nameOfValuer: saved.nameOfValuer || 'Er. Satyajit Mohanty',
      codeNo: saved.codeNo || 'BH-AOV0078',
      appointingAuthority: saved.appointingAuthority || 'LIC HFL(Br-II)',
      dateOfValuation: saved.dateOfValuation || pf.reportDate || '06/11/2020',
      reraNo: saved.reraNo || 'NA',

      // Section A: General
      applicantName: saved.applicantName || pf.applicantName || pf.customerName || 'Mrs. Bijaylaxmi Sahoo,D/o:-Mr. Gangadhar Sahoo',
      ownerName: saved.ownerName || pf.ownerName || 'Mrs. Bijaylaxmi Sahoo,D/o:-Mr. Gangadhar Sahoo',
      documentsProduced: saved.documentsProduced || 'Copy of Sale Deed,ROR,Approved Plan & Estimate',
      locationPlotNo: saved.locationPlotNo || '632,Khata no-529/993',
      locationVillage: saved.locationVillage || 'Mattia Pada-II,PS-Pipili(45),Tahasil-Pipili(199)',
      locationDistrict: saved.locationDistrict || 'Dist-Puri,Odisha, Pin-752104',
      addressTallies: saved.addressTallies || 'Yes',
      locationSketchVerified: saved.locationSketchVerified || 'Yes/No',
      surroundingDevelopmentClass: saved.surroundingDevelopmentClass || 'Middle',
      basicAmenitiesAvailable: saved.basicAmenitiesAvailable || 'Yes',
      negativesToLocality: saved.negativesToLocality || 'No',
      favourableConsiderations: saved.favourableConsiderations || 'All civic amenities like school,hospital,market area arewithin 1-2Kms.',
      nearbyLandmark: saved.nearbyLandmark || 'Opposite to Sai Temple,Gudiapokhari',
      otherFeaturesNotice: saved.otherFeaturesNotice || 'Not Observed',

      // Section B: Land
      boundaryNorth: saved.boundaryNorth || 'Proposed Road/20-Feet Wide Road',
      boundaryNorthDim: saved.boundaryNorthDim || 'NA',
      boundarySouth: saved.boundarySouth || 'Revenue Plot No-628/Vacant Plot',
      boundarySouthDim: saved.boundarySouthDim || 'NA',
      boundaryEast: saved.boundaryEast || 'Rest Part of Revenue Plot No-632/Vacant Plot',
      boundaryEastDim: saved.boundaryEastDim || 'NA',
      boundaryWest: saved.boundaryWest || 'Proposed Road/20-Feet Wide Road',
      boundaryWestDim: saved.boundaryWestDim || 'NA',
      totalExtentLandDecimal: saved.totalExtentLandDecimal || 'Ac.0.021 decimal',
      totalExtentLandSqft: saved.totalExtentLandSqft || '915sqft',
      boundariesTallyWithApprovedDrawing: saved.boundariesTallyWithApprovedDrawing || 'Yes',
      natureOfLandUse: saved.natureOfLandUse || 'Residential',
      landUseExistingBua: saved.landUseExistingBua || 'G.F.-850sqft(Under Construction)',
      landUseProposedBua: saved.landUseProposedBua || 'G.F.-850sqft,F.F.-850sqft(Approved)',
      naPermissionRequiredAndObtained: saved.naPermissionRequiredAndObtained || 'Yes(Obtained)',

      // Section C: Buildings
      buildingPlanApprovalNoDate: saved.buildingPlanApprovalNoDate || 'Yes, letter no-645/20,dated-28/09/2020',
      buildingPlanValidity: saved.buildingPlanValidity || 'NA',
      buildingPlanRenewal: saved.buildingPlanRenewal || 'NA',
      buildingPlanApprovalAuthority: saved.buildingPlanApprovalAuthority || 'Sarapanch, Orakal Grama Panchayat',

      // Plinth Approved
      plinthApprovedGf: saved.plinthApprovedGf || '850sqft',
      plinthApprovedFf: saved.plinthApprovedFf || '850sqft',
      plinthApprovedSf: saved.plinthApprovedSf || 'NA',
      plinthApprovedTotal: saved.plinthApprovedTotal || '1700sqft',

      // Plinth Actual
      plinthActualGf: saved.plinthActualGf || '850sqft(Under Construction)',
      plinthActualFf: saved.plinthActualFf || 'NA',
      plinthActualSf: saved.plinthActualSf || 'NA',
      plinthActualTotal: saved.plinthActualTotal || '850sqft',

      estimateCostApplicant: saved.estimateCostApplicant || 'Rs.20,00,000/- (For GF only)',
      estimateCostPerSqft: saved.estimateCostPerSqft || 'Rs.2352.94/sqft',
      isEstimateReasonable: saved.isEstimateReasonable || 'Yes',
      marketabilityOfProperty: saved.marketabilityOfProperty || 'Good',

      // Section D: Inspection
      inspectionBuaApproved: saved.inspectionBuaApproved || '850sqft / Floor',
      inspectionBuaActual: saved.inspectionBuaActual || '850sqft / Floor',
      inspectionFsiApproved: saved.inspectionFsiApproved || '1.85',
      inspectionFsiActual: saved.inspectionFsiActual || '0.92',
      inspectionDwellingUnitsApproved: saved.inspectionDwellingUnitsApproved || '1/ Floor',
      inspectionDwellingUnitsActual: saved.inspectionDwellingUnitsActual || '1/Floor',
      isConstructionAsPerApprovedPlan: saved.isConstructionAsPerApprovedPlan || 'Yes',
      deviationBetweenDrawingAndActual: saved.deviationBetweenDrawingAndActual || 'NA',
      deviationMinorMajorNature: saved.deviationMinorMajorNature || 'NA',
      deviationRevisedApprovalNecessary: saved.deviationRevisedApprovalNecessary || 'NA',
      totalWorksCompletedPct: saved.totalWorksCompletedPct || '90%',
      totalWorksCompletedValue: saved.totalWorksCompletedValue || 'Rs.18,00,000/-(For GF only)',
      nbcAndNdmaComplied: saved.nbcAndNdmaComplied || 'Yes',
      highTensionLinePassing: saved.highTensionLinePassing || 'No',

      // Section E: Total Value
      valLandApplication: saved.valLandApplication || 'NA',
      valLandGuideline: saved.valLandGuideline || 'Rs.3,15,080/-',
      valLandMarket: saved.valLandMarket || 'Rs.5,49,000/-',

      valBldgStageApplication: saved.valBldgStageApplication || 'Rs.18,00,000/-',
      valBldgStageGuideline: saved.valBldgStageGuideline || 'Rs.10,05,210/-',
      valBldgStageMarket: saved.valBldgStageMarket || 'Rs.15,30,000/-',

      valTotalExistingApplication: saved.valTotalExistingApplication || '',
      valTotalExistingGuideline: saved.valTotalExistingGuideline || 'Rs.13,20,290/-',
      valTotalExistingMarket: saved.valTotalExistingMarket || 'Rs.20,79,000/-',

      valBldgCompletionApplication: saved.valBldgCompletionApplication || '',
      valBldgCompletionGuideline: saved.valBldgCompletionGuideline || 'Rs.14,31,980/-',
      valBldgCompletionMarket: saved.valBldgCompletionMarket || 'Rs.22,49,000/-',

      sourceForArrivingAtMarketValue: saved.sourceForArrivingAtMarketValue || 'By analysis of rates of material, labour etc & from local market data of similar properties',
      usageOfBuilding: saved.usageOfBuilding || 'Residential',

      // Narratives
      backgroundInformation: saved.backgroundInformation || 'Subject property is a proposed single storied residential building, located in a developed Mattia Pada-II mouza. Property is accessible with 20-ft earthen road.',
      sourcesOfInformation: saved.sourcesOfInformation || 'Recent transactions, Property Brokers, local market feedback.',
      proceduresAdopted: saved.proceduresAdopted || 'Land value arrived by comparing similar land parcels in that locality while building value arrived by cost incurred to construct a similar house as on date.',
      valuationMethodology: saved.valuationMethodology || 'Land & Building method of valuation adopted',
      majorFactorsInfluenced: saved.majorFactorsInfluenced || 'Location & accessibility to civic amenities etc.',

      // Section F: Recommendation
      recommendationStageNo: saved.recommendationStageNo || '01',
      recommendationStageOfConstruction: saved.recommendationStageOfConstruction || 'GF inside & outside plastering work completed.Flooring work is under progress.',
      recommendationProgressPct: saved.recommendationProgressPct || 'Present stage of construction is 90%',

      // Section G: Certificate
      certificateDate: saved.certificateDate || pf.inspectionDate || '04/11/2020',
      certificatePlace: saved.certificatePlace || 'Bhubaneswar',
      valuerSignatureName: saved.valuerSignatureName || 'Er. Satyajit Mohanty',

      // Annexure
      annexureLandArea: saved.annexureLandArea || '915sqft',
      annexureLandMarketRate: saved.annexureLandMarketRate || 'Rs.600/-',
      annexureLandMarketValue: saved.annexureLandMarketValue || 'Rs.5,49,000/-',
      annexureLandGuidelineRate: saved.annexureLandGuidelineRate || 'Rs.344.35/-',
      annexureLandGuidelineValue: saved.annexureLandGuidelineValue || 'Rs.3,15,080/-',

      annexureBldgArea: saved.annexureBldgArea || '850sqft',
      annexureBldgMarketRate: saved.annexureBldgMarketRate || 'Rs.2000/-',
      annexureBldgMarketValue: saved.annexureBldgMarketValue || 'Rs.17,00,000/-',
      annexureBldgGuidelineRate: saved.annexureBldgGuidelineRate || 'Rs.1314.00',
      annexureBldgGuidelineValue: saved.annexureBldgGuidelineValue || 'Rs.11,16,900/-',

      annexureAmenitiesMarketValue: saved.annexureAmenitiesMarketValue || 'Included',
      annexureAmenitiesGuidelineValue: saved.annexureAmenitiesGuidelineValue || '---',

      annexureTotalMarketValue: saved.annexureTotalMarketValue || 'Rs.22,49,000/-',
      annexureTotalGuidelineValue: saved.annexureTotalGuidelineValue || 'Rs.14,31,980/-',

      annexureYearOfConstruction: saved.annexureYearOfConstruction || 'Under Construction',
      annexureAgeAndFutureLife: saved.annexureAgeAndFutureLife || '60-Years',

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

  // Calculations for Annexure Land & Building Values
  useEffect(() => {
    const lArea = parseNum(fields.annexureLandArea);
    const lMktRate = parseNum(fields.annexureLandMarketRate);
    const lGuideRate = parseNum(fields.annexureLandGuidelineRate);

    const lMktTot = lArea > 0 && lMktRate > 0 ? Math.round(lArea * lMktRate) : parseNum(fields.annexureLandMarketValue);
    const lGuideTot = lArea > 0 && lGuideRate > 0 ? Math.round(lArea * lGuideRate) : parseNum(fields.annexureLandGuidelineValue);

    const bArea = parseNum(fields.annexureBldgArea);
    const bMktRate = parseNum(fields.annexureBldgMarketRate);
    const bGuideRate = parseNum(fields.annexureBldgGuidelineRate);

    const bMktTot = bArea > 0 && bMktRate > 0 ? Math.round(bArea * bMktRate) : parseNum(fields.annexureBldgMarketValue);
    const bGuideTot = bArea > 0 && bGuideRate > 0 ? Math.round(bArea * bGuideRate) : parseNum(fields.annexureBldgGuidelineValue);

    const totMkt = lMktTot + bMktTot;
    const totGuide = lGuideTot + bGuideTot;

    setFields((prev: any) => ({
      ...prev,
      annexureLandMarketValue: lMktTot > 0 ? `Rs.${formatIndianCurrency(lMktTot)}/-` : prev.annexureLandMarketValue,
      annexureLandGuidelineValue: lGuideTot > 0 ? `Rs.${formatIndianCurrency(lGuideTot)}/-` : prev.annexureLandGuidelineValue,
      annexureBldgMarketValue: bMktTot > 0 ? `Rs.${formatIndianCurrency(bMktTot)}/-` : prev.annexureBldgMarketValue,
      annexureBldgGuidelineValue: bGuideTot > 0 ? `Rs.${formatIndianCurrency(bGuideTot)}/-` : prev.annexureBldgGuidelineValue,
      annexureTotalMarketValue: totMkt > 0 ? `Rs.${formatIndianCurrency(totMkt)}/-` : prev.annexureTotalMarketValue,
      annexureTotalGuidelineValue: totGuide > 0 ? `Rs.${formatIndianCurrency(totGuide)}/-` : prev.annexureTotalGuidelineValue,

      // Also mirror to Section E Value Table
      valLandMarket: lMktTot > 0 ? `Rs.${formatIndianCurrency(lMktTot)}/-` : prev.valLandMarket,
      valLandGuideline: lGuideTot > 0 ? `Rs.${formatIndianCurrency(lGuideTot)}/-` : prev.valLandGuideline,
      valBldgCompletionMarket: totMkt > 0 ? `Rs.${formatIndianCurrency(totMkt)}/-` : prev.valBldgCompletionMarket,
      valBldgCompletionGuideline: totGuide > 0 ? `Rs.${formatIndianCurrency(totGuide)}/-` : prev.valBldgCompletionGuideline,
    }));
  }, [
    fields.annexureLandArea,
    fields.annexureLandMarketRate,
    fields.annexureLandGuidelineRate,
    fields.annexureBldgArea,
    fields.annexureBldgMarketRate,
    fields.annexureBldgGuidelineRate,
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
      const { PDFLICPVR1Renderer } = require('@/lib/banks/pdf-lic-pvr1-renderer');
      const renderer = new PDFLICPVR1Renderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIC_PVR1_HouseConstruction_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating LIC PVR-1 PDF:', e);
    }
  };

  const navSections = [
    { id: 'sec-meta', title: 'Header & Metadata' },
    { id: 'sec-a', title: 'A. General' },
    { id: 'sec-b', title: 'B. Land' },
    { id: 'sec-c', title: 'C. Buildings' },
    { id: 'sec-d', title: 'D. Inspection' },
    { id: 'sec-e', title: 'E. Total Value' },
    { id: 'sec-annexure', title: 'Annexure' },
    { id: 'sec-rec-cert', title: 'Certificate' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'section-photographs', title: 'Photographs' },
  ];

  return (
    <div className="space-y-6 pb-28 w-full">
      {/* ── Active Config Banner with Change Parameters ── */}
      <ActiveConfigBanner
        bankName={fields.organisationTemplate || 'LIC HOUSING FINANCE LTD'}
        subclass="PVR-1(SELF CONSTRUCTION-L & B)"
        clientType="organisation"
        category="Bank & FIS"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* ── Top Header Card ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            LIC Housing Finance Ltd
          </span>
          <h1 className="text-xl font-bold text-slate-800 mt-2">PVR-1: HOUSE CONSTRUCTION (LAND & BUILDING)</h1>
          <p className="text-xs text-slate-500">Valuation Report by Panel Valuer for Home Loan</p>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Section Header Metadata ── */}
      <Section id="sec-meta" title="Header & File Metadata" number={1} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="File No.">
            <input className={inputCls} value={fields.fileNo} onChange={(e) => handleChange('fileNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Code No.">
            <input className={inputCls} value={fields.codeNo} onChange={(e) => handleChange('codeNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Appointing Authority">
            <input className={inputCls} value={fields.appointingAuthority} onChange={(e) => handleChange('appointingAuthority', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Name of the Valuer">
            <input className={inputCls} value={fields.nameOfValuer} onChange={(e) => handleChange('nameOfValuer', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Date of Valuation">
            <input className={inputCls} value={fields.dateOfValuation} onChange={(e) => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="RERA No.">
            <input className={inputCls} value={fields.reraNo} onChange={(e) => handleChange('reraNo', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      </Section>

      {/* ── Section A: General ── */}
      <Section id="sec-a" title="A. GENERAL (Points 1 to 13)" number={2} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="1. Name of the Applicant">
            <input className={inputCls} value={fields.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="2. Name of the Owner">
            <input className={inputCls} value={fields.ownerName} onChange={(e) => handleChange('ownerName', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="md:col-span-2">
            <Field label="4. Documents produced for perusal">
              <input className={inputCls} value={fields.documentsProduced} onChange={(e) => handleChange('documentsProduced', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="5. Plot No. / Khata No.">
            <input className={inputCls} value={fields.locationPlotNo} onChange={(e) => handleChange('locationPlotNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="5. Village / Mouza / PS">
            <input className={inputCls} value={fields.locationVillage} onChange={(e) => handleChange('locationVillage', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="md:col-span-2">
            <Field label="5. District, State, PIN">
              <input className={inputCls} value={fields.locationDistrict} onChange={(e) => handleChange('locationDistrict', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="6. Address at site tallies with point 5?">
            <select className={selectCls} value={fields.addressTallies} onChange={(e) => handleChange('addressTallies', e.target.value)} disabled={isReadOnly}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="7. Location Sketch Verified">
            <input className={inputCls} value={fields.locationSketchVerified} onChange={(e) => handleChange('locationSketchVerified', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="8. Surrounding development population class">
            <select className={selectCls} value={fields.surroundingDevelopmentClass} onChange={(e) => handleChange('surroundingDevelopmentClass', e.target.value)} disabled={isReadOnly}>
              <option value="Lower class">Lower class</option>
              <option value="Middle">Middle</option>
              <option value="Upper Middle">Upper Middle</option>
              <option value="Posh">Posh</option>
            </select>
          </Field>
          <Field label="9. Basic amenities available">
            <input className={inputCls} value={fields.basicAmenitiesAvailable} onChange={(e) => handleChange('basicAmenitiesAvailable', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="10. Negatives to locality/property">
            <input className={inputCls} value={fields.negativesToLocality} onChange={(e) => handleChange('negativesToLocality', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="11. Favourable considerations for value">
            <input className={inputCls} value={fields.favourableConsiderations} onChange={(e) => handleChange('favourableConsiderations', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="12. Nearby Landmark">
            <input className={inputCls} value={fields.nearbyLandmark} onChange={(e) => handleChange('nearbyLandmark', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="13. Other features like notice/court/mortgage board">
            <input className={inputCls} value={fields.otherFeaturesNotice} onChange={(e) => handleChange('otherFeaturesNotice', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      </Section>

      {/* ── Section B: Land ── */}
      <Section id="sec-b" title="B. LAND (Boundaries, Dimensions & Land Use)" number={3} defaultOpen={true}>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/4">Direction</th>
                <th className="p-3 w-1/2">Boundaries</th>
                <th className="p-3 w-1/4 text-center">Dimensions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-700">North / Front</td>
                <td className="p-3"><input className={inputCls} value={fields.boundaryNorth} onChange={(e) => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.boundaryNorthDim} onChange={(e) => handleChange('boundaryNorthDim', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">South / Rear</td>
                <td className="p-3"><input className={inputCls} value={fields.boundarySouth} onChange={(e) => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.boundarySouthDim} onChange={(e) => handleChange('boundarySouthDim', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">East / Left (Side 1)</td>
                <td className="p-3"><input className={inputCls} value={fields.boundaryEast} onChange={(e) => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.boundaryEastDim} onChange={(e) => handleChange('boundaryEastDim', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">West / Right (Side 2)</td>
                <td className="p-3"><input className={inputCls} value={fields.boundaryWest} onChange={(e) => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.boundaryWestDim} onChange={(e) => handleChange('boundaryWestDim', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Total Extent of Land (Acres / Decimals)">
            <input className={inputCls} value={fields.totalExtentLandDecimal} onChange={(e) => handleChange('totalExtentLandDecimal', e.target.value)} disabled={isReadOnly} placeholder="e.g. Ac.0.021 decimal" />
          </Field>
          <Field label="Total Extent of Land (Sqft)">
            <input className={inputCls} value={fields.totalExtentLandSqft} onChange={(e) => handleChange('totalExtentLandSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 915sqft" />
          </Field>
          <Field label="Boundaries tally with approved drawing?">
            <input className={inputCls} value={fields.boundariesTallyWithApprovedDrawing} onChange={(e) => handleChange('boundariesTallyWithApprovedDrawing', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Nature of Land Use">
            <input className={inputCls} value={fields.natureOfLandUse} onChange={(e) => handleChange('natureOfLandUse', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Existing BUA">
            <input className={inputCls} value={fields.landUseExistingBua} onChange={(e) => handleChange('landUseExistingBua', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Proposed BUA">
            <input className={inputCls} value={fields.landUseProposedBua} onChange={(e) => handleChange('landUseProposedBua', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Whether N.A. Permission Required & Obtained">
              <input className={inputCls} value={fields.naPermissionRequiredAndObtained} onChange={(e) => handleChange('naPermissionRequiredAndObtained', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section C: Buildings ── */}
      <Section id="sec-c" title="C. BUILDINGS (Approvals, Plinth BUA & Estimate)" number={4} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="1. Building Plan Approval No & Date">
              <input className={inputCls} value={fields.buildingPlanApprovalNoDate} onChange={(e) => handleChange('buildingPlanApprovalNoDate', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="Validity Period">
            <input className={inputCls} value={fields.buildingPlanValidity} onChange={(e) => handleChange('buildingPlanValidity', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Approval Authority">
            <input className={inputCls} value={fields.buildingPlanApprovalAuthority} onChange={(e) => handleChange('buildingPlanApprovalAuthority', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>

        {/* Plinth Area Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Plinth BUA (Approved Drawing)</h4>
            <div className="grid grid-cols-3 gap-2">
              <Field label="G.F."><input className={inputCls} value={fields.plinthApprovedGf} onChange={(e) => handleChange('plinthApprovedGf', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="F.F."><input className={inputCls} value={fields.plinthApprovedFf} onChange={(e) => handleChange('plinthApprovedFf', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="S.F."><input className={inputCls} value={fields.plinthApprovedSf} onChange={(e) => handleChange('plinthApprovedSf', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <Field label="Total Approved"><input className={`${inputCls} font-bold`} value={fields.plinthApprovedTotal} onChange={(e) => handleChange('plinthApprovedTotal', e.target.value)} disabled={isReadOnly} /></Field>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Plinth BUA (Actual at Site)</h4>
            <div className="grid grid-cols-3 gap-2">
              <Field label="G.F."><input className={inputCls} value={fields.plinthActualGf} onChange={(e) => handleChange('plinthActualGf', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="F.F."><input className={inputCls} value={fields.plinthActualFf} onChange={(e) => handleChange('plinthActualFf', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="S.F."><input className={inputCls} value={fields.plinthActualSf} onChange={(e) => handleChange('plinthActualSf', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <Field label="Total Actual"><input className={`${inputCls} font-bold`} value={fields.plinthActualTotal} onChange={(e) => handleChange('plinthActualTotal', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="3. Cost as per Applicant Estimate">
            <input className={inputCls} value={fields.estimateCostApplicant} onChange={(e) => handleChange('estimateCostApplicant', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Cost per Sqft as per Estimate">
            <input className={inputCls} value={fields.estimateCostPerSqft} onChange={(e) => handleChange('estimateCostPerSqft', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Is Estimate Reasonable?">
            <input className={inputCls} value={fields.isEstimateReasonable} onChange={(e) => handleChange('isEstimateReasonable', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="4. Marketability of Property">
            <select className={selectCls} value={fields.marketabilityOfProperty} onChange={(e) => handleChange('marketabilityOfProperty', e.target.value)} disabled={isReadOnly}>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Section D: Inspection ── */}
      <Section id="sec-d" title="D. INSPECTION & DEVIATIONS" number={5} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Plinth BUA (Approved vs Actual)">
            <input className={inputCls} value={fields.inspectionBuaApproved} onChange={(e) => handleChange('inspectionBuaApproved', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="F.S.I. (Approved vs Actual)">
            <div className="flex gap-2">
              <input className={`${inputCls} flex-1`} value={fields.inspectionFsiApproved} onChange={(e) => handleChange('inspectionFsiApproved', e.target.value)} disabled={isReadOnly} placeholder="Approved" />
              <input className={`${inputCls} flex-1`} value={fields.inspectionFsiActual} onChange={(e) => handleChange('inspectionFsiActual', e.target.value)} disabled={isReadOnly} placeholder="Actual" />
            </div>
          </Field>
          <Field label="Construction as per approved plan?">
            <select className={selectCls} value={fields.isConstructionAsPerApprovedPlan} onChange={(e) => handleChange('isConstructionAsPerApprovedPlan', e.target.value)} disabled={isReadOnly}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>
          <Field label="Deviations between approved drawing & actual">
            <input className={inputCls} value={fields.deviationBetweenDrawingAndActual} onChange={(e) => handleChange('deviationBetweenDrawingAndActual', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Total works completed (% and Value)">
            <div className="flex gap-2">
              <input className={`${inputCls} w-24 text-center`} value={fields.totalWorksCompletedPct} onChange={(e) => handleChange('totalWorksCompletedPct', e.target.value)} disabled={isReadOnly} placeholder="%" />
              <input className={`${inputCls} flex-1`} value={fields.totalWorksCompletedValue} onChange={(e) => handleChange('totalWorksCompletedValue', e.target.value)} disabled={isReadOnly} placeholder="Value (Rs.)" />
            </div>
          </Field>
          <Field label="NBC 2005 & NDMA Safety adherence">
            <input className={inputCls} value={fields.nbcAndNdmaComplied} onChange={(e) => handleChange('nbcAndNdmaComplied', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="md:col-span-2">
            <Field label="High Tension wire passing through property?">
              <input className={inputCls} value={fields.highTensionLinePassing} onChange={(e) => handleChange('highTensionLinePassing', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section E: Total Value Table ── */}
      <Section id="sec-e" title="E. TOTAL VALUE COMPARISON TABLE" number={6} defaultOpen={true}>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/2">Description</th>
                <th className="p-3 text-center">As per Application</th>
                <th className="p-3 text-center">Guideline Value</th>
                <th className="p-3 text-right">Market Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-700">1. Value of Land ({fields.totalExtentLandDecimal})</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.valLandApplication} onChange={(e) => handleChange('valLandApplication', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center font-semibold`} value={fields.valLandGuideline} onChange={(e) => handleChange('valLandGuideline', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.valLandMarket} onChange={(e) => handleChange('valLandMarket', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">2. Stage value of building ({fields.totalWorksCompletedPct})</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.valBldgStageApplication} onChange={(e) => handleChange('valBldgStageApplication', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center font-semibold`} value={fields.valBldgStageGuideline} onChange={(e) => handleChange('valBldgStageGuideline', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.valBldgStageMarket} onChange={(e) => handleChange('valBldgStageMarket', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-3 text-slate-900">3. Total value of existing building (1 + 2)</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.valTotalExistingApplication} onChange={(e) => handleChange('valTotalExistingApplication', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center font-bold`} value={fields.valTotalExistingGuideline} onChange={(e) => handleChange('valTotalExistingGuideline', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.valTotalExistingMarket} onChange={(e) => handleChange('valTotalExistingMarket', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr className="bg-blue-50/50 font-bold">
                <td className="p-3 text-blue-900">4. Value of building on completion</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.valBldgCompletionApplication} onChange={(e) => handleChange('valBldgCompletionApplication', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center font-bold text-blue-900`} value={fields.valBldgCompletionGuideline} onChange={(e) => handleChange('valBldgCompletionGuideline', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold text-blue-900`} value={fields.valBldgCompletionMarket} onChange={(e) => handleChange('valBldgCompletionMarket', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="5. Source for arriving at Market Value">
            <textarea className={`${inputCls} h-16`} value={fields.sourceForArrivingAtMarketValue} onChange={(e) => handleChange('sourceForArrivingAtMarketValue', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="6. Usage of Building">
            <input className={inputCls} value={fields.usageOfBuilding} onChange={(e) => handleChange('usageOfBuilding', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      </Section>

      {/* ── Section Annexure: Valuation of Construction Building ── */}
      <Section id="sec-annexure" title="PVR-1 ANNEXURE: Valuation of Construction Building" number={7} defaultOpen={true}>
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Area</th>
                <th className="p-3 text-center">Market Rate</th>
                <th className="p-3 text-right">Market Value</th>
                <th className="p-3 text-center">Guideline Rate</th>
                <th className="p-3 text-right">Guideline Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-700">Land</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.annexureLandArea} onChange={(e) => handleChange('annexureLandArea', e.target.value)} disabled={isReadOnly} placeholder="915sqft" /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.annexureLandMarketRate} onChange={(e) => handleChange('annexureLandMarketRate', e.target.value)} disabled={isReadOnly} placeholder="Rs.600/-" /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.annexureLandMarketValue} onChange={(e) => handleChange('annexureLandMarketValue', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.annexureLandGuidelineRate} onChange={(e) => handleChange('annexureLandGuidelineRate', e.target.value)} disabled={isReadOnly} placeholder="Rs.344.35/-" /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.annexureLandGuidelineValue} onChange={(e) => handleChange('annexureLandGuidelineValue', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-700">Building GF</td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.annexureBldgArea} onChange={(e) => handleChange('annexureBldgArea', e.target.value)} disabled={isReadOnly} placeholder="850sqft" /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.annexureBldgMarketRate} onChange={(e) => handleChange('annexureBldgMarketRate', e.target.value)} disabled={isReadOnly} placeholder="Rs.2000/-" /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.annexureBldgMarketValue} onChange={(e) => handleChange('annexureBldgMarketValue', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"><input className={`${inputCls} text-center`} value={fields.annexureBldgGuidelineRate} onChange={(e) => handleChange('annexureBldgGuidelineRate', e.target.value)} disabled={isReadOnly} placeholder="Rs.1314.00" /></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold`} value={fields.annexureBldgGuidelineValue} onChange={(e) => handleChange('annexureBldgGuidelineValue', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="p-3" colSpan={3}>Total Value</td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold text-slate-900`} value={fields.annexureTotalMarketValue} onChange={(e) => handleChange('annexureTotalMarketValue', e.target.value)} disabled={isReadOnly} /></td>
                <td className="p-3"></td>
                <td className="p-3 text-right"><input className={`${inputCls} text-right font-bold text-slate-900`} value={fields.annexureTotalGuidelineValue} onChange={(e) => handleChange('annexureTotalGuidelineValue', e.target.value)} disabled={isReadOnly} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="1. Year of Construction">
            <input className={inputCls} value={fields.annexureYearOfConstruction} onChange={(e) => handleChange('annexureYearOfConstruction', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="2. Age of Building and Future Life">
            <input className={inputCls} value={fields.annexureAgeAndFutureLife} onChange={(e) => handleChange('annexureAgeAndFutureLife', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      </Section>

      {/* ── Section F & G: Recommendation & Certificate ── */}
      <Section id="sec-rec-cert" title="Recommendation & Certificate" number={8} defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="S.No.">
            <input className={inputCls} value={fields.recommendationStageNo} onChange={(e) => handleChange('recommendationStageNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Stage of Construction Description">
              <input className={inputCls} value={fields.recommendationStageOfConstruction} onChange={(e) => handleChange('recommendationStageOfConstruction', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <Field label="% Progress">
            <input className={inputCls} value={fields.recommendationProgressPct} onChange={(e) => handleChange('recommendationProgressPct', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Inspection Date (Certificate)">
            <input className={inputCls} value={fields.certificateDate} onChange={(e) => handleChange('certificateDate', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Station">
            <input className={inputCls} value={fields.certificatePlace} onChange={(e) => handleChange('certificatePlace', e.target.value)} disabled={isReadOnly} />
          </Field>
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
        <FloatingNavigator sections={navSections} />
      </div>
    </div>
  );
}
