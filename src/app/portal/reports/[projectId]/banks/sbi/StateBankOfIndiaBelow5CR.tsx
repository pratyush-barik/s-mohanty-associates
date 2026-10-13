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
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

export const SBI_BELOW_5CR_CONFIG: BankConfig = {
  bankId: 'STATE BANK OF INDIA-SBI',
  subTemplateId: 'BELOW 5CR',
  displayName: 'State Bank of India (SBI) — BELOW 5CR',
  defaultValues: {},
  getPDFRenderer: (data, projectCode) => {
    const { PDFSBIBelow5CRRenderer } = require('@/lib/banks/pdf-sbi-below-5cr-renderer');
    return new PDFSBIBelow5CRRenderer(data, projectCode);
  },
};

export interface SBIBelow5CRProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function StateBankOfIndiaBelow5CR({
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
}: SBIBelow5CRProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Top Header
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE CHIEF MANAGER,',
      bankName: saved.bankName !== undefined ? saved.bankName : 'STATE BANK OF INDIA,',
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : 'BALUGAON BRANCH, DIST: KHURDA, ODISHA',
      refNo: saved.refNo !== undefined ? saved.refNo : (projectCode || projectId || ''),
      reportDate: saved.reportDate !== undefined ? saved.reportDate : (pf.reportDate || ''),
      borrowerName: saved.borrowerName !== undefined ? saved.borrowerName : (pf.contactName || ''),

      // 1. Customer Details
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.contactName ? `${pf.contactName}, At: ${pf.propertyAddress || ''}` : ''),
      applicationNo: saved.applicationNo !== undefined ? saved.applicationNo : 'Not Available',

      // 2. Property Details
      propertyAddress: saved.propertyAddress !== undefined ? saved.propertyAddress : (pf.propertyAddress || ''),
      nearbyLandmark: saved.nearbyLandmark !== undefined ? saved.nearbyLandmark : '',
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : '',
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || ''),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || ''),

      // 3. Document Details
      layoutPlanAvailable: saved.layoutPlanAvailable !== undefined ? saved.layoutPlanAvailable : 'Yes/ No',
      layoutPlanAuthority: saved.layoutPlanAuthority !== undefined ? saved.layoutPlanAuthority : 'Sarapanch Kanamana Gram Panchayat',
      layoutPlanApprovalNo: saved.layoutPlanApprovalNo !== undefined ? saved.layoutPlanApprovalNo : 'Vide Letter No: 115/26 on dated 02.03.2026 for construction of a G+2 Storied Residential Building.',
      buildingPlanAvailable: saved.buildingPlanAvailable !== undefined ? saved.buildingPlanAvailable : 'Yes/ No',
      buildingPlanAuthority: saved.buildingPlanAuthority !== undefined ? saved.buildingPlanAuthority : '',
      buildingPlanApprovalNo: saved.buildingPlanApprovalNo !== undefined ? saved.buildingPlanApprovalNo : '',
      constructionPermissionAvailable: saved.constructionPermissionAvailable !== undefined ? saved.constructionPermissionAvailable : 'Yes/ No',
      constructionPermissionAuthority: saved.constructionPermissionAuthority !== undefined ? saved.constructionPermissionAuthority : '',
      constructionPermissionApprovalNo: saved.constructionPermissionApprovalNo !== undefined ? saved.constructionPermissionApprovalNo : '',
      legalDocumentsAvailable: saved.legalDocumentsAvailable !== undefined ? saved.legalDocumentsAvailable : 'Yes/No',
      legalDocumentsAuthority: saved.legalDocumentsAuthority !== undefined ? saved.legalDocumentsAuthority : '',
      legalDocumentsApprovalNo: saved.legalDocumentsApprovalNo !== undefined ? saved.legalDocumentsApprovalNo : '',
      listOfDocuments: saved.listOfDocuments !== undefined ? saved.listOfDocuments : 'Xerox copy of Sale Deed, ROR, Approval Plan & Sketch Map',

      // 4. Physical Details
      boundaryEastDoc: saved.boundaryEastDoc !== undefined ? saved.boundaryEastDoc : 'Road',
      boundaryEastVerif: saved.boundaryEastVerif !== undefined ? saved.boundaryEastVerif : 'Road',
      boundaryWestDoc: saved.boundaryWestDoc !== undefined ? saved.boundaryWestDoc : '',
      boundaryWestVerif: saved.boundaryWestVerif !== undefined ? saved.boundaryWestVerif : '',
      boundaryNorthDoc: saved.boundaryNorthDoc !== undefined ? saved.boundaryNorthDoc : '',
      boundaryNorthVerif: saved.boundaryNorthVerif !== undefined ? saved.boundaryNorthVerif : '',
      boundarySouthDoc: saved.boundarySouthDoc !== undefined ? saved.boundarySouthDoc : '',
      boundarySouthVerif: saved.boundarySouthVerif !== undefined ? saved.boundarySouthVerif : '',

      matchingBoundaries: saved.matchingBoundaries !== undefined ? saved.matchingBoundaries : 'Yes/ No',
      plotDemarcated: saved.plotDemarcated !== undefined ? saved.plotDemarcated : 'Yes/ No',
      approvedLandUse: saved.approvedLandUse !== undefined ? saved.approvedLandUse : 'Residential',
      typeOfProperty: saved.typeOfProperty !== undefined ? saved.typeOfProperty : 'Plotted / Flat',
      numberOfRoomsLiving: saved.numberOfRoomsLiving !== undefined ? saved.numberOfRoomsLiving : '1 Nos',
      numberOfRoomsBed: saved.numberOfRoomsBed !== undefined ? saved.numberOfRoomsBed : '3 Nos',
      numberOfRoomsToilets: saved.numberOfRoomsToilets !== undefined ? saved.numberOfRoomsToilets : '1 Nos',
      numberOfRoomsKitchens: saved.numberOfRoomsKitchens !== undefined ? saved.numberOfRoomsKitchens : '1 Nos',
      totalNumberOfFloors: saved.totalNumberOfFloors !== undefined ? saved.totalNumberOfFloors : 'Ground Floor',
      areaPropertyLocated: saved.areaPropertyLocated !== undefined ? saved.areaPropertyLocated : '',
      approxAgeProperty: saved.approxAgeProperty !== undefined ? saved.approxAgeProperty : 'New',
      residualLifeProperty: saved.residualLifeProperty !== undefined ? saved.residualLifeProperty : '65 Yrs',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame',

      // 5. Tenure / Occupancy
      statusOfTenure: saved.statusOfTenure !== undefined ? saved.statusOfTenure : 'Owned/ Rented (Under Construction)',
      numberOfYearsOccupancy: saved.numberOfYearsOccupancy !== undefined ? saved.numberOfYearsOccupancy : 'NA',
      relationshipTenantOwner: saved.relationshipTenantOwner !== undefined ? saved.relationshipTenantOwner : 'NA',

      // 6. Stage of construction
      stageOfConstruction: saved.stageOfConstruction !== undefined ? saved.stageOfConstruction : 'Completed (45%)',
      underConstructionExtent: saved.underConstructionExtent !== undefined ? saved.underConstructionExtent : 'Not Applicable',

      // 7. Violations
      natureExtentViolations: saved.natureExtentViolations !== undefined ? saved.natureExtentViolations : 'Nothing Observed',

      // 8. Area details
      siteAreaText: saved.siteAreaText !== undefined ? saved.siteAreaText : '',
      carpetAreaText: saved.carpetAreaText !== undefined ? saved.carpetAreaText : '',
      saleableAreaText: saved.saleableAreaText !== undefined ? saved.saleableAreaText : '',
      plinthAreaApprovalText: saved.plinthAreaApprovalText !== undefined ? saved.plinthAreaApprovalText : '',
      plinthAreaActualText: saved.plinthAreaActualText !== undefined ? saved.plinthAreaActualText : '',

      // 9. Valuation (Land Rate Adopted)
      landRateAdoptedText: saved.landRateAdoptedText !== undefined ? saved.landRateAdoptedText : '',

      // Assumptions or remarks (i to vii)
      remarkQualificationsTIR: saved.remarkQualificationsTIR !== undefined ? saved.remarkQualificationsTIR : 'Not Applicable',
      remarkSarfaesiCompliant: saved.remarkSarfaesiCompliant !== undefined ? saved.remarkSarfaesiCompliant : 'Yes',
      remarkSocialInfrastructure: saved.remarkSocialInfrastructure !== undefined ? saved.remarkSocialInfrastructure : 'No',
      remarkEntirePieceMortgaged: saved.remarkEntirePieceMortgaged !== undefined ? saved.remarkEntirePieceMortgaged : 'Not Applicable',
      remarkLastTwoTransactions: saved.remarkLastTwoTransactions !== undefined ? saved.remarkLastTwoTransactions : '',
      remarkVariationJustification: saved.remarkVariationJustification !== undefined ? saved.remarkVariationJustification : '',
      remarkMarketabilityAnyOther: saved.remarkMarketabilityAnyOther !== undefined ? saved.remarkMarketabilityAnyOther : 'Not Observed',
      generalRemarksText: saved.generalRemarksText !== undefined ? saved.generalRemarksText : '',

      // 11. Declaration
      declarationText: saved.declarationText !== undefined ? saved.declarationText : '',

      // 12. Valuer Details
      valuerNameAndAddress: saved.valuerNameAndAddress !== undefined ? saved.valuerNameAndAddress : 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018',
      valuerWealthTaxReg: saved.valuerWealthTaxReg !== undefined ? saved.valuerWealthTaxReg : '107/2016-17 of Category-I',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || ''),

      // Valuation Computation
      plinthAreaVal: saved.plinthAreaVal !== undefined ? saved.plinthAreaVal : '1275',
      roofHeightVal: saved.roofHeightVal !== undefined ? saved.roofHeightVal : '10\' 6"',
      ageVal: saved.ageVal !== undefined ? saved.ageVal : 'New',
      replacementRateVal: saved.replacementRateVal !== undefined ? saved.replacementRateVal : '900',
      depreciationVal: saved.depreciationVal !== undefined ? saved.depreciationVal : '0',

      // Abstract Matrix
      abstractGovtLand: saved.abstractGovtLand !== undefined ? saved.abstractGovtLand : '',
      abstractMarketLand: saved.abstractMarketLand !== undefined ? saved.abstractMarketLand : '',
      abstractGovtBldg: saved.abstractGovtBldg !== undefined ? saved.abstractGovtBldg : '0',
      abstractMarketBldg: saved.abstractMarketBldg !== undefined ? saved.abstractMarketBldg : '',

      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',

      // Enclosures
      encLayoutSketch: saved.encLayoutSketch !== undefined ? saved.encLayoutSketch : 'Enclosed',
      encBuildingPlan: saved.encBuildingPlan !== undefined ? saved.encBuildingPlan : 'Enclosed',
      encFloorPlan: saved.encFloorPlan !== undefined ? saved.encFloorPlan : 'Enclosed',
      encPhotographGeo: saved.encPhotographGeo !== undefined ? saved.encPhotographGeo : 'Enclosed',
      encCertifiedApprovedPlan: saved.encCertifiedApprovedPlan !== undefined ? saved.encCertifiedApprovedPlan : 'Enclosed',
      encGoogleMapCoords: saved.encGoogleMapCoords !== undefined ? saved.encGoogleMapCoords : 'Enclosed',
      encPriceTrendPortals: saved.encPriceTrendPortals !== undefined ? saved.encPriceTrendPortals : 'Enclosed',
      encGuidelineRateEvidence: saved.encGuidelineRateEvidence !== undefined ? saved.encGuidelineRateEvidence : 'Enclosed',
      encOtherDocuments: saved.encOtherDocuments !== undefined ? saved.encOtherDocuments : 'No',

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

  // Helper to parse numeric inputs supporting decimals and currency signs safely
  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  // Helper to parse percentage where empty/null defaults to 100%, and '0' is 0%
  const parsePct = (val: any, fallback = 100): number => {
    if (val === undefined || val === null || String(val).trim() === '') return fallback;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? fallback : Math.min(100, Math.max(0, n));
  };

  // ── Auto-Calculate Valuation Computations & Totals ──
  useEffect(() => {
    const area = parseNum(fields.plinthAreaVal);
    const rate = parseNum(fields.replacementRateVal);
    const dep = parseNum(fields.depreciationVal);

    const bldgCost = Math.round(area * rate * 100) / 100;
    const bldgNet = Math.max(0, Math.round((bldgCost - dep) * 100) / 100);

    const landMarket = parseNum(fields.abstractMarketLand);
    const landGovt = parseNum(fields.abstractGovtLand);

    const totalMarket = Math.round((landMarket + bldgNet) * 100) / 100;
    const totalGovt = Math.round(landGovt * 100) / 100;

    // Realizable & Distress percentages (Fallback to 100% if empty, or 0% if '0')
    const rPct = parsePct(fields.abstractRealizablePct, 100);
    const dPct = parsePct(fields.abstractDistressPct, 100);

    const realLand = Math.round((landMarket * rPct) / 100);
    const realBldg = Math.round((bldgNet * rPct) / 100);
    const totalReal = realLand + realBldg;

    const distLand = Math.round((landMarket * dPct) / 100);
    const distBldg = Math.round((bldgNet * dPct) / 100);
    const totalDist = distLand + distBldg;

    setFields((prev: any) => ({
      ...prev,
      valEstimatedCost: bldgCost > 0 ? `Rs. ${formatIndianCurrency(bldgCost)}` : '',
      valTotalNetValue: bldgNet > 0 ? `Rs. ${formatIndianCurrency(bldgNet)}` : '',
      abstractMarketBldg: bldgNet > 0 ? `Rs. ${formatIndianCurrency(bldgNet)}` : prev.abstractMarketBldg,
      abstractMarketTotal: totalMarket > 0 ? `Rs. ${formatIndianCurrency(totalMarket)}` : '',
      abstractGovtTotal: totalGovt > 0 ? `Rs. ${formatIndianCurrency(totalGovt)}` : '',
      abstractRealizableTotal: totalReal > 0 ? `Rs. ${formatIndianCurrency(totalReal)}` : '',
      abstractDistressTotal: totalDist > 0 ? `Rs. ${formatIndianCurrency(totalDist)}` : '',
      opinionMarketWords: totalMarket > 0 ? rupeesInWords(Math.round(totalMarket)) : '',
      opinionRealizableWords: totalReal > 0 ? rupeesInWords(Math.round(totalReal)) : '',
      opinionGovtLandWords: totalGovt > 0 ? rupeesInWords(Math.round(totalGovt)) : '',
      opinionDistressWords: totalDist > 0 ? rupeesInWords(Math.round(totalDist)) : '',
    }));
  }, [
    fields.plinthAreaVal,
    fields.replacementRateVal,
    fields.depreciationVal,
    fields.abstractMarketLand,
    fields.abstractGovtLand,
    fields.abstractRealizablePct,
    fields.abstractDistressPct,
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

  const handleDownloadPdfInternal = async () => {
    try {
      const { PDFSBIBelow5CRRenderer } = require('@/lib/banks/pdf-sbi-below-5cr-renderer');
      const renderer = new PDFSBIBelow5CRRenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SBI_Below_5CR_Valuation_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating SBI Below 5CR PDF:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Card & Actions ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            STATE BANK OF INDIA (SBI) — BELOW 5CR
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Valuation Report Questionnaire (Below 5 Crore)</h2>
          <p className="text-xs text-slate-500">
            Standard Format for Branch Chief Manager addressing land, construction stage, physical matrix, and valuation abstract.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSaveInternal}
            disabled={saving || isReadOnly}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdfInternal}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Section 1: Customer & Bank Details ── */}
      <Section title="Customer & Bank Details" number={1} defaultOpen={true}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="To Authority">
            <input
              className={inputCls}
              value={fields.toAuthority}
              onChange={(e) => handleChange('toAuthority', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. THE CHIEF MANAGER,"
            />
          </Field>
          <Field label="Bank Name">
            <input
              className={inputCls}
              value={fields.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. STATE BANK OF INDIA,"
            />
          </Field>
          <Field label="Branch Address">
            <input
              className={inputCls}
              value={fields.branchAddress}
              onChange={(e) => handleChange('branchAddress', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. BALUGAON BRANCH, DIST: KHURDA, ODISHA"
            />
          </Field>
          <Field label="Ref. No.">
            <input
              className={inputCls}
              value={fields.refNo}
              onChange={(e) => handleChange('refNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. SMA/03/2026/10"
            />
          </Field>
          <Field label="Valuation Date">
            <input
              type="date"
              className={inputCls}
              value={fields.reportDate}
              onChange={(e) => handleChange('reportDate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Customer / Borrowal Unit">
            <input
              className={inputCls}
              value={fields.borrowerName}
              onChange={(e) => handleChange('borrowerName', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Mrs. Sunita Kumari Nahak & Mr. Brundabana Nayak"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <Field label="1. Name of the Owner" span={2}>
            <textarea
              className={inputCls + ' min-h-[64px]'}
              value={fields.ownerNameAndAddress}
              onChange={(e) => handleChange('ownerNameAndAddress', e.target.value)}
              disabled={isReadOnly}
              placeholder="Mrs. Sunita Kumari Nahak, W/o: ... At: Karapada..."
            />
          </Field>
          <Field label="Appl. No.">
            <input
              className={inputCls}
              value={fields.applicationNo}
              onChange={(e) => handleChange('applicationNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Not Available"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Property & Document Details ── */}
      <Section title="Property & Document Details" number={2} defaultOpen={false}>
        <Field label="2. Property Address">
          <textarea
            className={inputCls + ' min-h-[64px]'}
            value={fields.propertyAddress}
            onChange={(e) => handleChange('propertyAddress', e.target.value)}
            disabled={isReadOnly}
            placeholder="Khata No: 441/7666, Plot No: 338/7776, Total Area: Ac.0.031 Dec..."
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <Field label="Nearby Landmark / Independent Access">
            <input
              className={inputCls}
              value={fields.nearbyLandmark}
              onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
              disabled={isReadOnly}
              placeholder="The subject property is situated nearer to Chhatrapur Jail."
            />
          </Field>
          <Field label="Google Coordinates">
            <input
              className={inputCls}
              value={fields.coordinatesText}
              onChange={(e) => handleChange('coordinatesText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Latitude: 19.347667, Longitude: 84.987333"
            />
          </Field>
        </div>

        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">3. Document Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Layout Plan & Authority">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.layoutPlanAvailable}
                onChange={(e) => handleChange('layoutPlanAvailable', e.target.value)}
                disabled={isReadOnly}
                placeholder="Yes/ No"
              />
              <input
                className={inputCls}
                value={fields.layoutPlanAuthority}
                onChange={(e) => handleChange('layoutPlanAuthority', e.target.value)}
                disabled={isReadOnly}
                placeholder="Authority (e.g. Sarapanch Kanamana Gram Panchayat)"
              />
              <input
                className={inputCls}
                value={fields.layoutPlanApprovalNo}
                onChange={(e) => handleChange('layoutPlanApprovalNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="Approval Letter No & Date"
              />
            </div>
          </Field>
          <Field label="List of Documents">
            <textarea
              className={inputCls + ' min-h-[90px]'}
              value={fields.listOfDocuments}
              onChange={(e) => handleChange('listOfDocuments', e.target.value)}
              disabled={isReadOnly}
              placeholder="Xerox copy of Sale Deed, ROR, Approval Plan & Sketch Map"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Physical Details & Boundaries ── */}
      <Section title="Physical Details, Boundaries & Rooms" number={3} defaultOpen={false}>
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
          <p className="text-xs font-bold text-slate-800">4. Boundaries</p>
          <div className="grid grid-cols-3 gap-2 font-semibold text-xs text-slate-500">
            <div>Direction</div>
            <div>As per Document</div>
            <div>As per Verification</div>
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">East:</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryEastDoc}
              onChange={(e) => handleChange('boundaryEastDoc', e.target.value)}
              disabled={isReadOnly}
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryEastVerif}
              onChange={(e) => handleChange('boundaryEastVerif', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">West:</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryWestDoc}
              onChange={(e) => handleChange('boundaryWestDoc', e.target.value)}
              disabled={isReadOnly}
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryWestVerif}
              onChange={(e) => handleChange('boundaryWestVerif', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">North:</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryNorthDoc}
              onChange={(e) => handleChange('boundaryNorthDoc', e.target.value)}
              disabled={isReadOnly}
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundaryNorthVerif}
              onChange={(e) => handleChange('boundaryNorthVerif', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs font-medium text-slate-700">South:</span>
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundarySouthDoc}
              onChange={(e) => handleChange('boundarySouthDoc', e.target.value)}
              disabled={isReadOnly}
            />
            <input
              className={inputCls + ' !py-1.5 text-xs'}
              value={fields.boundarySouthVerif}
              onChange={(e) => handleChange('boundarySouthVerif', e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <Field label="Matching of Boundaries">
            <input
              className={inputCls}
              value={fields.matchingBoundaries}
              onChange={(e) => handleChange('matchingBoundaries', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes/ No"
            />
          </Field>
          <Field label="Plot Demarcated">
            <input
              className={inputCls}
              value={fields.plotDemarcated}
              onChange={(e) => handleChange('plotDemarcated', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes/ No"
            />
          </Field>
          <Field label="Approved Land Use">
            <input
              className={inputCls}
              value={fields.approvedLandUse}
              onChange={(e) => handleChange('approvedLandUse', e.target.value)}
              disabled={isReadOnly}
              placeholder="Residential"
            />
          </Field>
          <Field label="Type of Property">
            <input
              className={inputCls}
              value={fields.typeOfProperty}
              onChange={(e) => handleChange('typeOfProperty', e.target.value)}
              disabled={isReadOnly}
              placeholder="Plotted / Flat"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-2">
          <Field label="Living / Dining">
            <input
              className={inputCls}
              value={fields.numberOfRoomsLiving}
              onChange={(e) => handleChange('numberOfRoomsLiving', e.target.value)}
              disabled={isReadOnly}
              placeholder="1 Nos"
            />
          </Field>
          <Field label="Bedrooms">
            <input
              className={inputCls}
              value={fields.numberOfRoomsBed}
              onChange={(e) => handleChange('numberOfRoomsBed', e.target.value)}
              disabled={isReadOnly}
              placeholder="3 Nos"
            />
          </Field>
          <Field label="Toilets">
            <input
              className={inputCls}
              value={fields.numberOfRoomsToilets}
              onChange={(e) => handleChange('numberOfRoomsToilets', e.target.value)}
              disabled={isReadOnly}
              placeholder="1 Nos"
            />
          </Field>
          <Field label="Kitchens">
            <input
              className={inputCls}
              value={fields.numberOfRoomsKitchens}
              onChange={(e) => handleChange('numberOfRoomsKitchens', e.target.value)}
              disabled={isReadOnly}
              placeholder="1 Nos"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-2">
          <Field label="Total Number of Floors">
            <input
              className={inputCls}
              value={fields.totalNumberOfFloors}
              onChange={(e) => handleChange('totalNumberOfFloors', e.target.value)}
              disabled={isReadOnly}
              placeholder="Ground Floor"
            />
          </Field>
          <Field label="Approx. Age">
            <input
              className={inputCls}
              value={fields.approxAgeProperty}
              onChange={(e) => handleChange('approxAgeProperty', e.target.value)}
              disabled={isReadOnly}
              placeholder="New"
            />
          </Field>
          <Field label="Residual Life">
            <input
              className={inputCls}
              value={fields.residualLifeProperty}
              onChange={(e) => handleChange('residualLifeProperty', e.target.value)}
              disabled={isReadOnly}
              placeholder="65 Yrs"
            />
          </Field>
          <Field label="Type of Structure">
            <input
              className={inputCls}
              value={fields.typeOfStructure}
              onChange={(e) => handleChange('typeOfStructure', e.target.value)}
              disabled={isReadOnly}
              placeholder="RCC Frame"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Tenure, Stage & Area Breakdown ── */}
      <Section title="Tenure, Construction Stage & Areas" number={4} defaultOpen={false}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Status of Tenure">
            <input
              className={inputCls}
              value={fields.statusOfTenure}
              onChange={(e) => handleChange('statusOfTenure', e.target.value)}
              disabled={isReadOnly}
              placeholder="Owned/ Rented (Under Construction)"
            />
          </Field>
          <Field label="Stage of Construction">
            <input
              className={inputCls}
              value={fields.stageOfConstruction}
              onChange={(e) => handleChange('stageOfConstruction', e.target.value)}
              disabled={isReadOnly}
              placeholder="Completed (45%)"
            />
          </Field>
          <Field label="Violations Observed">
            <input
              className={inputCls}
              value={fields.natureExtentViolations}
              onChange={(e) => handleChange('natureExtentViolations', e.target.value)}
              disabled={isReadOnly}
              placeholder="Nothing Observed"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-3">
          <Field label="Site Area">
            <input
              className={inputCls}
              value={fields.siteAreaText}
              onChange={(e) => handleChange('siteAreaText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Ac.0.031 Dec i.e. 1350.00 Sft"
            />
          </Field>
          <Field label="Carpet Area">
            <input
              className={inputCls}
              value={fields.carpetAreaText}
              onChange={(e) => handleChange('carpetAreaText', e.target.value)}
              disabled={isReadOnly}
              placeholder="1142.00 Sft (Approx.)"
            />
          </Field>
          <Field label="Saleable Area">
            <input
              className={inputCls}
              value={fields.saleableAreaText}
              onChange={(e) => handleChange('saleableAreaText', e.target.value)}
              disabled={isReadOnly}
              placeholder="1350.00 Sft (Land) & 1313.00 Sft (Building)"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="9. Land Rate Adopted Narrative">
            <textarea
              className={inputCls + ' min-h-[90px]'}
              value={fields.landRateAdoptedText}
              onChange={(e) => handleChange('landRateAdoptedText', e.target.value)}
              disabled={isReadOnly}
              placeholder="THE LAND RATE ADOPTED IN THIS VALUATION:&#10;• GOVT. BENCHMARK VALUE: RS.3,44,30,000/- PER ACRE I.E. RS.790/- PER SFT&#10;• TOTAL LAND AREA: AC.0.031 DEC I.E. 1350.00 SFT..."
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Details of Valuation & Abstract ── */}
      <Section title="Details of Valuation & Total Abstract" number={5} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <Field label="Plinth Area (Sft)">
            <input
              className={inputCls}
              value={fields.plinthAreaVal}
              onChange={(e) => handleChange('plinthAreaVal', e.target.value)}
              disabled={isReadOnly}
              placeholder="1275"
            />
          </Field>
          <Field label="Replacement Rate (Rs./Sft)">
            <input
              className={inputCls}
              value={fields.replacementRateVal}
              onChange={(e) => handleChange('replacementRateVal', e.target.value)}
              disabled={isReadOnly}
              placeholder="900"
            />
          </Field>
          <Field label="Depreciation (Rs.)">
            <input
              className={inputCls}
              value={fields.depreciationVal}
              onChange={(e) => handleChange('depreciationVal', e.target.value)}
              disabled={isReadOnly}
              placeholder="0"
            />
          </Field>
          <Field label="Net Building Value">
            <input
              className={inputCls + ' font-bold bg-white'}
              value={fields.valTotalNetValue}
              onChange={(e) => handleChange('valTotalNetValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-4">
          <Field label="Land Market Value (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractMarketLand}
              onChange={(e) => handleChange('abstractMarketLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="2430000"
            />
          </Field>
          <Field label="Land Govt Value (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtLand}
              onChange={(e) => handleChange('abstractGovtLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="1066500"
            />
          </Field>
          <Field label="Realizable Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractRealizablePct}
                onChange={(e) => handleChange('abstractRealizablePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Leave empty for 100%)"
              />
              <input
                className={inputCls}
                value={fields.abstractRealizableTotal}
                onChange={(e) => handleChange('abstractRealizableTotal', e.target.value)}
                disabled={isReadOnly}
                placeholder="Realizable Total"
              />
            </div>
          </Field>
          <Field label="Distress Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractDistressPct}
                onChange={(e) => handleChange('abstractDistressPct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Leave empty for 100%)"
              />
              <input
                className={inputCls}
                value={fields.abstractDistressTotal}
                onChange={(e) => handleChange('abstractDistressTotal', e.target.value)}
                disabled={isReadOnly}
                placeholder="Distress Total"
              />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="General Remarks">
            <textarea
              className={inputCls + ' min-h-[80px]'}
              value={fields.generalRemarksText}
              onChange={(e) => handleChange('generalRemarksText', e.target.value)}
              disabled={isReadOnly}
              placeholder="SUBJECT PROPERTY IS AN UNDER CONSTRUCTED GROUND FLOOR RESIDENTIAL BUILDING..."
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 6: Base Documents (Inherited Directly) ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={6}
        sectionId="section-documents"
      />

      {/* ── Section 7: Base Maps (Inherited Directly) ── */}
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

      {/* ── Section 8: Photographs (Inherited Directly) ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={8}
        sectionId="section-photographs"
      />
    </div>
  );
}
