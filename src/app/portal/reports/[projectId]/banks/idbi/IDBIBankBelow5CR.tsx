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
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { formatReportDate } from '@/lib/pdf-bank-renderer';

export const IDBI_BELOW_5CR_CONFIG: BankConfig = {
  bankId: 'IDBI BANK',
  subTemplateId: 'BELOW 5CR',
  displayName: 'IDBI Bank — BELOW 5CR',
  defaultValues: {},
  getPDFRenderer: (data, projectCode) => {
    const { PDFSBILandAndBuildingRenderer } = require('@/lib/banks/pdf-sbi-land-and-building-renderer');
    return new PDFSBILandAndBuildingRenderer({
      bankName: 'IDBI BANK',
      ...data,
    }, projectCode);
  },
};

export interface IDBIBelow5CRProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function IDBIBankBelow5CR({
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
}: IDBIBelow5CRProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const earliestVisit = useMemo(() => getEarliestFieldVisit(bucketImages, prefill), [bucketImages, prefill]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill & Exact Statutory Points ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Top Header
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE CHIEF MANAGER / BRANCH HEAD,',
      bankName: saved.bankName !== undefined ? saved.bankName : (pf.bankName || 'IDBI BANK'),
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : (pf.branchAddress || ''),
      refNo: saved.refNo !== undefined ? saved.refNo : (projectCode || projectId || ''),
      reportDate: saved.reportDate !== undefined ? saved.reportDate : (pf.reportDate || formatReportDate(new Date().toISOString())),
      borrowerName: saved.borrowerName !== undefined ? saved.borrowerName : (pf.contactName || pf.applicantName || ''),

      // 1. Customer Details
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.contactName ? `${pf.contactName}${pf.fatherName ? `, S/o: ${pf.fatherName}` : ''}${pf.propertyAddress ? `, At: ${pf.propertyAddress}` : ''}` : ''),
      applicationNo: saved.applicationNo !== undefined ? saved.applicationNo : (pf.loanAccountNo || 'Not Available'),
      caseType: saved.caseType !== undefined ? saved.caseType : 'Fresh Valuation',
      identifiedByAndMobNo: saved.identifiedByAndMobNo !== undefined ? saved.identifiedByAndMobNo : (pf.contactName ? `${pf.contactName}${pf.contactPhone ? `, Mob-${pf.contactPhone}` : ''}` : ''),

      // 2. Property Details
      propertyAddress: saved.propertyAddress !== undefined ? saved.propertyAddress : (pf.propertyAddress || ''),
      nearbyLandmark: saved.nearbyLandmark !== undefined ? saved.nearbyLandmark : (pf.landmark || ''),
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : (pf.latitude && pf.longitude ? `${pf.latitude}, ${pf.longitude}` : ''),
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || ''),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || ''),

      // 3. Document Details
      layoutPlanAvailable: saved.layoutPlanAvailable !== undefined ? saved.layoutPlanAvailable : 'Yes/ No',
      layoutPlanAuthority: saved.layoutPlanAuthority !== undefined ? saved.layoutPlanAuthority : '',
      layoutPlanApprovalNo: saved.layoutPlanApprovalNo !== undefined ? saved.layoutPlanApprovalNo : '',
      buildingPlanAvailable: saved.buildingPlanAvailable !== undefined ? saved.buildingPlanAvailable : 'Yes/ No',
      buildingPlanAuthority: saved.buildingPlanAuthority !== undefined ? saved.buildingPlanAuthority : '',
      buildingPlanApprovalNo: saved.buildingPlanApprovalNo !== undefined ? saved.buildingPlanApprovalNo : '',
      constructionPermissionAvailable: saved.constructionPermissionAvailable !== undefined ? saved.constructionPermissionAvailable : 'Yes/ No',
      constructionPermissionAuthority: saved.constructionPermissionAuthority !== undefined ? saved.constructionPermissionAuthority : '',
      constructionPermissionApprovalNo: saved.constructionPermissionApprovalNo !== undefined ? saved.constructionPermissionApprovalNo : '',
      legalDocumentsAvailable: saved.legalDocumentsAvailable !== undefined ? saved.legalDocumentsAvailable : 'Yes/ No',
      legalDocumentsAuthority: saved.legalDocumentsAuthority !== undefined ? saved.legalDocumentsAuthority : '',
      legalDocumentsApprovalNo: saved.legalDocumentsApprovalNo !== undefined ? saved.legalDocumentsApprovalNo : '',
      listOfDocuments: saved.listOfDocuments !== undefined ? saved.listOfDocuments : 'Xerox copy of Agreement for Sale, Sketch Map, Patta, Approval Letter',

      // 4. Physical Details
      boundaryEastDoc: saved.boundaryEastDoc !== undefined ? saved.boundaryEastDoc : (pf.eastBoundary || ''),
      boundaryEastVerif: saved.boundaryEastVerif !== undefined ? saved.boundaryEastVerif : (pf.eastBoundary || ''),
      boundaryWestDoc: saved.boundaryWestDoc !== undefined ? saved.boundaryWestDoc : (pf.westBoundary || ''),
      boundaryWestVerif: saved.boundaryWestVerif !== undefined ? saved.boundaryWestVerif : (pf.westBoundary || ''),
      boundaryNorthDoc: saved.boundaryNorthDoc !== undefined ? saved.boundaryNorthDoc : (pf.northBoundary || ''),
      boundaryNorthVerif: saved.boundaryNorthVerif !== undefined ? saved.boundaryNorthVerif : (pf.northBoundary || ''),
      boundarySouthDoc: saved.boundarySouthDoc !== undefined ? saved.boundarySouthDoc : (pf.southBoundary || ''),
      boundarySouthVerif: saved.boundarySouthVerif !== undefined ? saved.boundarySouthVerif : (pf.southBoundary || ''),

      matchingBoundaries: saved.matchingBoundaries !== undefined ? saved.matchingBoundaries : 'Yes/ No',
      plotDemarcated: saved.plotDemarcated !== undefined ? saved.plotDemarcated : 'Yes/ No',
      approvedLandUse: saved.approvedLandUse !== undefined ? saved.approvedLandUse : 'Residential',
      typeOfProperty: saved.typeOfProperty !== undefined ? saved.typeOfProperty : (pf.propertyType || 'Land & Building'),

      numberOfRoomsLiving: saved.numberOfRoomsLiving !== undefined ? saved.numberOfRoomsLiving : '',
      numberOfRoomsBed: saved.numberOfRoomsBed !== undefined ? saved.numberOfRoomsBed : '',
      numberOfRoomsToilets: saved.numberOfRoomsToilets !== undefined ? saved.numberOfRoomsToilets : '',
      numberOfRoomsKitchens: saved.numberOfRoomsKitchens !== undefined ? saved.numberOfRoomsKitchens : '',

      totalNumberOfFloors: saved.totalNumberOfFloors !== undefined ? saved.totalNumberOfFloors : (pf.floors || 'G+1 Storied'),
      areaPropertyLocated: saved.areaPropertyLocated !== undefined ? saved.areaPropertyLocated : (pf.mouza || ''),
      approxAgeProperty: saved.approxAgeProperty !== undefined ? saved.approxAgeProperty : (pf.buildingAge || 'New'),
      residualLifeProperty: saved.residualLifeProperty !== undefined ? saved.residualLifeProperty : (pf.residualLife || '60 Yrs'),
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame',

      // 5. Tenure/ Occupancy Details
      statusOfTenure: saved.statusOfTenure !== undefined ? saved.statusOfTenure : 'Freehold',
      occupiedBy: saved.occupiedBy !== undefined ? saved.occupiedBy : 'Owner',
      numberOfYearsOccupied: saved.numberOfYearsOccupied !== undefined ? saved.numberOfYearsOccupied : 'Self',
      tenantRelationshipToOwner: saved.tenantRelationshipToOwner !== undefined ? saved.tenantRelationshipToOwner : 'Self Occupied',

      // 6. Stage of Construction
      stageOfConstruction: saved.stageOfConstruction !== undefined ? saved.stageOfConstruction : 'Completed',
      extentOfCompletion: saved.extentOfCompletion !== undefined ? saved.extentOfCompletion : '100%',

      // 7. Violations
      violationsObserved: saved.violationsObserved !== undefined ? saved.violationsObserved : 'No Violations observed as per standard building norms.',

      // 8. Area Details (Section 8)
      siteAreaApproved: saved.siteAreaApproved !== undefined ? saved.siteAreaApproved : (pf.plotArea ? `${pf.plotArea} Sqft` : ''),
      siteAreaActual: saved.siteAreaActual !== undefined ? saved.siteAreaActual : (pf.plotArea ? `${pf.plotArea} Sqft` : ''),
      carpetAreaApproved: saved.carpetAreaApproved !== undefined ? saved.carpetAreaApproved : (pf.carpetArea ? `${pf.carpetArea} Sqft` : ''),
      carpetAreaActual: saved.carpetAreaActual !== undefined ? saved.carpetAreaActual : (pf.carpetArea ? `${pf.carpetArea} Sqft` : ''),
      saleableAreaApproved: saved.saleableAreaApproved !== undefined ? saved.saleableAreaApproved : (pf.superBuiltUpArea ? `${pf.superBuiltUpArea} Sqft` : ''),
      saleableAreaActual: saved.saleableAreaActual !== undefined ? saved.saleableAreaActual : (pf.superBuiltUpArea ? `${pf.superBuiltUpArea} Sqft` : ''),

      // Plinth Area Approvals Multi-block
      plinthBlock1GFApproved: saved.plinthBlock1GFApproved !== undefined ? saved.plinthBlock1GFApproved : (pf.builtUpArea ? `${pf.builtUpArea} Sqft` : ''),
      plinthBlock1GFActual: saved.plinthBlock1GFActual !== undefined ? saved.plinthBlock1GFActual : (pf.builtUpArea ? `${pf.builtUpArea} Sqft` : ''),
      plinthBlock1FFApproved: saved.plinthBlock1FFApproved !== undefined ? saved.plinthBlock1FFApproved : '',
      plinthBlock1FFActual: saved.plinthBlock1FFActual !== undefined ? saved.plinthBlock1FFActual : '',
      plinthBlock1SFApproved: saved.plinthBlock1SFApproved !== undefined ? saved.plinthBlock1SFApproved : '',
      plinthBlock1SFActual: saved.plinthBlock1SFActual !== undefined ? saved.plinthBlock1SFActual : '',
      plinthBlock2GFApproved: saved.plinthBlock2GFApproved !== undefined ? saved.plinthBlock2GFApproved : '',
      plinthBlock2GFActual: saved.plinthBlock2GFActual !== undefined ? saved.plinthBlock2GFActual : '',
      plinthBlock2FFApproved: saved.plinthBlock2FFApproved !== undefined ? saved.plinthBlock2FFApproved : '',
      plinthBlock2FFActual: saved.plinthBlock2FFActual !== undefined ? saved.plinthBlock2FFActual : '',
      plinthBlock2SFApproved: saved.plinthBlock2SFApproved !== undefined ? saved.plinthBlock2SFApproved : '',
      plinthBlock2SFActual: saved.plinthBlock2SFActual !== undefined ? saved.plinthBlock2SFActual : '',
      plinthTotalApproved: saved.plinthTotalApproved !== undefined ? saved.plinthTotalApproved : (pf.builtUpArea ? `${pf.builtUpArea} Sqft` : ''),
      plinthTotalActual: saved.plinthTotalActual !== undefined ? saved.plinthTotalActual : (pf.builtUpArea ? `${pf.builtUpArea} Sqft` : ''),

      // 9. Valuation (The Land Rate Adopted Narrative)
      adoptedLandRateNarrative: saved.adoptedLandRateNarrative !== undefined ? saved.adoptedLandRateNarrative : 'The land rate adopted in this valuation is based on local inquiries and prevailing market trends.',

      // 10. Remarks
      assumptionsRemarks: saved.assumptionsRemarks !== undefined ? saved.assumptionsRemarks : '1. The property is identified on the basis of physical verification and boundaries.\n2. The valuation is carried out considering the current market potential.',

      // 11. Declaration Clauses
      declarationClause1: saved.declarationClause1 !== undefined ? saved.declarationClause1 : 'The information furnished in this report is true and correct to the best of my knowledge and belief.',
      declarationClause2: saved.declarationClause2 !== undefined ? saved.declarationClause2 : 'I have no direct or indirect interest in the property valued.',
      declarationClause3: saved.declarationClause3 !== undefined ? saved.declarationClause3 : 'The valuation has been carried out independently and impartially.',

      // 12. Valuer Details & Signature
      valuerName: saved.valuerName !== undefined ? saved.valuerName : 'Er. Satyajit Mohanty',
      valuerAddress: saved.valuerAddress !== undefined ? saved.valuerAddress : 'Plot No: 334/2103, Makundaprasad, By-Pass Chowk, Khordha, Odisha - 752057',
      valuerPan: saved.valuerPan !== undefined ? saved.valuerPan : '',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || formatReportDate(new Date().toISOString())),

      // 13 & 14. Enclosures
      listEnclosedDocuments: saved.listEnclosedDocuments !== undefined ? saved.listEnclosedDocuments : 'Copy of Agreement for Sale, Sketch Map, Patta, Approval Plan',
      listEnclosedPhotos: saved.listEnclosedPhotos !== undefined ? saved.listEnclosedPhotos : 'Elevation photograph, Surroundings, Approach road',

      // 15. Marketability
      marketabilityProcedural: saved.marketabilityProcedural !== undefined ? saved.marketabilityProcedural : 'Good marketability in the surrounding locality.',
      marketabilityNarrative: saved.marketabilityNarrative !== undefined ? saved.marketabilityNarrative : 'The property is situated in an accessible residential cluster with adequate physical infrastructure.',

      // DETAILS OF VALUATION (Floor-wise / Block-wise Grid)
      valFloorRows: saved.valFloorRows !== undefined ? saved.valFloorRows : [
        { floor: 'Ground Floor', plinthArea: pf.builtUpArea || '', roofHeight: "10'", age: pf.buildingAge || 'New', replacementRate: pf.constructionRate || '', cost: '', depPct: '0%', netValue: '' },
      ],
      totalBuildingNetValue: saved.totalBuildingNetValue !== undefined ? saved.totalBuildingNetValue : '',

      // VALUE OF THE PROPERTY (4-Row x 4-Col Table)
      valTableGovtLand: saved.valTableGovtLand !== undefined ? saved.valTableGovtLand : '',
      valTableMarketLand: saved.valTableMarketLand !== undefined ? saved.valTableMarketLand : (pf.landValuation || ''),
      valTableRealizableLand: saved.valTableRealizableLand !== undefined ? saved.valTableRealizableLand : '',
      valTableDistressLand: saved.valTableDistressLand !== undefined ? saved.valTableDistressLand : '',

      valTableGovtBldg: saved.valTableGovtBldg !== undefined ? saved.valTableGovtBldg : '',
      valTableMarketBldg: saved.valTableMarketBldg !== undefined ? saved.valTableMarketBldg : (pf.buildingValuation || ''),
      valTableRealizableBldg: saved.valTableRealizableBldg !== undefined ? saved.valTableRealizableBldg : '',
      valTableDistressBldg: saved.valTableDistressBldg !== undefined ? saved.valTableDistressBldg : '',

      valTableGovtTotal: saved.valTableGovtTotal !== undefined ? saved.valTableGovtTotal : '',
      valTableMarketTotal: saved.valTableMarketTotal !== undefined ? saved.valTableMarketTotal : (pf.totalValuation || ''),
      valTableRealizableTotal: saved.valTableRealizableTotal !== undefined ? saved.valTableRealizableTotal : (pf.realizableValue || ''),
      valTableDistressTotal: saved.valTableDistressTotal !== undefined ? saved.valTableDistressTotal : (pf.distressValue || ''),

      valTableGovtOrSay: saved.valTableGovtOrSay !== undefined ? saved.valTableGovtOrSay : '',
      valTableMarketOrSay: saved.valTableMarketOrSay !== undefined ? saved.valTableMarketOrSay : (pf.totalValuation || ''),
      valTableRealizableOrSay: saved.valTableRealizableOrSay !== undefined ? saved.valTableRealizableOrSay : (pf.realizableValue || ''),
      valTableDistressOrSay: saved.valTableDistressOrSay !== undefined ? saved.valTableDistressOrSay : (pf.distressValue || ''),

      // Enclosures Checklist (a to i)
      encSaleDeedTitle: saved.encSaleDeedTitle !== undefined ? saved.encSaleDeedTitle : 'Yes/ No',
      encSketchMap: saved.encSketchMap !== undefined ? saved.encSketchMap : 'Yes/ No',
      encBhuNaksha: saved.encBhuNaksha !== undefined ? saved.encBhuNaksha : 'Yes/ No',
      encApprovalPlanBDA: saved.encApprovalPlanBDA !== undefined ? saved.encApprovalPlanBDA : 'Yes/ No',
      encBuildingPermissionLetter: saved.encBuildingPermissionLetter !== undefined ? saved.encBuildingPermissionLetter : 'Yes/ No',
      encPropertyPhotographs: saved.encPropertyPhotographs !== undefined ? saved.encPropertyPhotographs : 'Yes/ No',
      encPriceTrendPortals: saved.encPriceTrendPortals !== undefined ? saved.encPriceTrendPortals : 'Yes/ No',
      encGuidelineRateEvidence: saved.encGuidelineRateEvidence !== undefined ? saved.encGuidelineRateEvidence : 'Yes/ No',
      encOtherDocuments: saved.encOtherDocuments !== undefined ? saved.encOtherDocuments : 'Yes/ No',

      // Opinion Words
      opinionMarketWords: saved.opinionMarketWords !== undefined ? saved.opinionMarketWords : '',
      opinionRealizableWords: saved.opinionRealizableWords !== undefined ? saved.opinionRealizableWords : '',
      opinionGovtLandWords: saved.opinionGovtLandWords !== undefined ? saved.opinionGovtLandWords : '',
      opinionDistressWords: saved.opinionDistressWords !== undefined ? saved.opinionDistressWords : '',

      // Justification Letter
      justificationLetterSubject: saved.justificationLetterSubject !== undefined ? saved.justificationLetterSubject : '',
      justificationLetterBody: saved.justificationLetterBody !== undefined ? saved.justificationLetterBody : 'The subject property is located in a developed residential area. There is variation between Market value and Guideline value because Guideline rates are not revised regularly and to avoid high stamp duty/registration charges sale deeds are executed at under-valued rates.\n\nSo, the value given by us is justified considering the present market scenario.',

      // Enclosures / Attachments
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

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const updateField = (name: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFloorRowChange = (index: number, key: string, value: string) => {
    const nextRows = [...(fields.valFloorRows || [])];
    nextRows[index] = { ...nextRows[index], [key]: value };

    // Auto-calculate cost = plinthArea * replacementRate if numeric
    if (key === 'plinthArea' || key === 'replacementRate') {
      const p = parseFloat(key === 'plinthArea' ? value : nextRows[index].plinthArea) || 0;
      const r = parseFloat(key === 'replacementRate' ? value : nextRows[index].replacementRate) || 0;
      if (p && r) {
        const c = p * r;
        nextRows[index].cost = String(c);
        nextRows[index].netValue = String(c);
      }
    }

    // Auto-sum total net value
    const sumNet = nextRows.reduce((acc, row) => acc + (parseFloat(row.netValue) || 0), 0);
    setFields((prev: any) => ({
      ...prev,
      valFloorRows: nextRows,
      totalBuildingNetValue: sumNet > 0 ? String(sumNet) : prev.totalBuildingNetValue,
    }));
  };

  const addFloorRow = () => {
    setFields((prev: any) => ({
      ...prev,
      valFloorRows: [
        ...(prev.valFloorRows || []),
        { floor: '', plinthArea: '', roofHeight: "10'", age: '', replacementRate: '', cost: '', depPct: '0%', netValue: '' },
      ],
    }));
  };

  const removeFloorRow = (idx: number) => {
    setFields((prev: any) => ({
      ...prev,
      valFloorRows: prev.valFloorRows.filter((_: any, i: number) => i !== idx),
    }));
  };

  // Auto-fill words on value changes
  useEffect(() => {
    const mv = parseFloat(fields.valTableMarketTotal) || 0;
    if (mv > 0) {
      const words = rupeesInWords(mv);
      if (words && !fields.opinionMarketWords) {
        updateField('opinionMarketWords', words);
      }
      // 95% Realizable
      const rv = Math.round(mv * 0.95);
      if (!fields.valTableRealizableTotal) {
        updateField('valTableRealizableTotal', String(rv));
        updateField('opinionRealizableWords', rupeesInWords(rv));
      }
      // 85% Distress
      const dv = Math.round(mv * 0.85);
      if (!fields.valTableDistressTotal) {
        updateField('valTableDistressTotal', String(dv));
        updateField('opinionDistressWords', rupeesInWords(dv));
      }
    }
  }, [fields.valTableMarketTotal]);

  const handleSaveInternal = async () => {
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        reportData: fields,
        bankTemplate: 'IDBI BANK',
        subTemplate: 'BELOW 5CR',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save IDBI Below 5CR report draft', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdfInternal = async () => {
    const { PDFSBILandAndBuildingRenderer } = await import('@/lib/banks/pdf-sbi-land-and-building-renderer');
    const renderer = new PDFSBILandAndBuildingRenderer({
      bankName: 'IDBI BANK',
      ...fields,
    }, projectCode);
    const pdfBytes = await renderer.render();
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IDBI_BELOW_5CR_${projectCode || projectId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        bankName="IDBI BANK"
        subclass={(initialFields as any)?.organisationSubTemplate || undefined}
        clientType="organisation"
        category="Bank & FIS"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* ── Top Header Card & Actions ── */}
      <BankReportTitleCard
        bankName="IDBI Bank"
        subclass="Below 5CR (Land & Building)"
        title="Valuation Report Builder"
        description="Standard Statutory Bank Format with Sections 1 to 15, Details of Valuation & Value of the Property Matrix."
        earliestVisit={earliestVisit}
        projectCode={projectCode}
      />

      {/* ── Top Header Banner Information ── */}
      <Section title="Top Header & Reference Details" number={1} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="To Authority / Addressee">
            <input
              type="text"
              value={fields.toAuthority}
              onChange={e => updateField('toAuthority', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Bank Name">
            <input
              type="text"
              value={fields.bankName}
              onChange={e => updateField('bankName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Branch Address & District">
            <input
              type="text"
              value={fields.branchAddress}
              onChange={e => updateField('branchAddress', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Borrower / Customer Name">
            <input
              type="text"
              value={fields.borrowerName}
              onChange={e => updateField('borrowerName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Ref. No.">
            <input
              type="text"
              value={fields.refNo}
              onChange={e => updateField('refNo', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Report Date (DD.MM.YYYY)">
            <input
              type="text"
              value={fields.reportDate}
              onChange={e => updateField('reportDate', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── SECTION 1: Customer Details ── */}
      <Section title="Customer Details" number={2} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name of the Owner & Address" className="md:col-span-2">
            <textarea
              rows={2}
              value={fields.ownerNameAndAddress}
              onChange={e => updateField('ownerNameAndAddress', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Application No.">
            <input
              type="text"
              value={fields.applicationNo}
              onChange={e => updateField('applicationNo', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Case Type">
            <input
              type="text"
              value={fields.caseType}
              onChange={e => updateField('caseType', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Identified by & Mob. No." className="md:col-span-2">
            <input
              type="text"
              value={fields.identifiedByAndMobNo}
              onChange={e => updateField('identifiedByAndMobNo', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── SECTION 2: Property Details ── */}
      <Section title="Property Details" number={3} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Address of the Property" className="md:col-span-2">
            <textarea
              rows={2}
              value={fields.propertyAddress}
              onChange={e => updateField('propertyAddress', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Nearby Landmark & Independent Access" className="md:col-span-2">
            <textarea
              rows={3}
              value={fields.nearbyLandmark}
              onChange={e => updateField('nearbyLandmark', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Coordinates Text">
            <input
              type="text"
              value={fields.coordinatesText}
              onChange={e => updateField('coordinatesText', e.target.value)}
              className={inputCls}
              placeholder="e.g. Latitude: 20.2524, Longitude: 85.7821"
            />
          </Field>
        </div>
      </Section>

      {/* ── SECTION 3: Document Details ── */}
      <Section title="Document Details" number={4} defaultOpen>
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Layout Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Available?">
                <input
                  type="text"
                  value={fields.layoutPlanAvailable}
                  onChange={e => updateField('layoutPlanAvailable', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Approving Authority">
                <input
                  type="text"
                  value={fields.layoutPlanAuthority}
                  onChange={e => updateField('layoutPlanAuthority', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Approval No. & Date">
                <input
                  type="text"
                  value={fields.layoutPlanApprovalNo}
                  onChange={e => updateField('layoutPlanApprovalNo', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Building Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Available?">
                <input
                  type="text"
                  value={fields.buildingPlanAvailable}
                  onChange={e => updateField('buildingPlanAvailable', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Approving Authority">
                <input
                  type="text"
                  value={fields.buildingPlanAuthority}
                  onChange={e => updateField('buildingPlanAuthority', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Approval No. & Date">
                <input
                  type="text"
                  value={fields.buildingPlanApprovalNo}
                  onChange={e => updateField('buildingPlanApprovalNo', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Construction Permission</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Available?">
                <input
                  type="text"
                  value={fields.constructionPermissionAvailable}
                  onChange={e => updateField('constructionPermissionAvailable', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Approving Authority">
                <input
                  type="text"
                  value={fields.constructionPermissionAuthority}
                  onChange={e => updateField('constructionPermissionAuthority', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Approval No. & Date">
                <input
                  type="text"
                  value={fields.constructionPermissionApprovalNo}
                  onChange={e => updateField('constructionPermissionApprovalNo', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <Field label="List of Documents Verified">
            <textarea
              rows={2}
              value={fields.listOfDocuments}
              onChange={e => updateField('listOfDocuments', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── SECTION 4: Physical Details ── */}
      <Section title="Physical Details (Boundaries, Rooms, Floors & Structure)" number={5} defaultOpen>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-700">Boundaries as per Agreement</h4>
              <Field label="East:">
                <input
                  type="text"
                  value={fields.boundaryEastDoc}
                  onChange={e => updateField('boundaryEastDoc', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="West:">
                <input
                  type="text"
                  value={fields.boundaryWestDoc}
                  onChange={e => updateField('boundaryWestDoc', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="North:">
                <input
                  type="text"
                  value={fields.boundaryNorthDoc}
                  onChange={e => updateField('boundaryNorthDoc', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="South:">
                <input
                  type="text"
                  value={fields.boundarySouthDoc}
                  onChange={e => updateField('boundarySouthDoc', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-700">Boundaries as per Sketch Map</h4>
              <Field label="East:">
                <input
                  type="text"
                  value={fields.boundaryEastVerif}
                  onChange={e => updateField('boundaryEastVerif', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="West:">
                <input
                  type="text"
                  value={fields.boundaryWestVerif}
                  onChange={e => updateField('boundaryWestVerif', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="North:">
                <input
                  type="text"
                  value={fields.boundaryNorthVerif}
                  onChange={e => updateField('boundaryNorthVerif', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="South:">
                <input
                  type="text"
                  value={fields.boundarySouthVerif}
                  onChange={e => updateField('boundarySouthVerif', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Matching Boundaries">
              <input
                type="text"
                value={fields.matchingBoundaries}
                onChange={e => updateField('matchingBoundaries', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Plot Demarcated">
              <input
                type="text"
                value={fields.plotDemarcated}
                onChange={e => updateField('plotDemarcated', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Approved Land Use">
              <input
                type="text"
                value={fields.approvedLandUse}
                onChange={e => updateField('approvedLandUse', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Type of Property">
              <input
                type="text"
                value={fields.typeOfProperty}
                onChange={e => updateField('typeOfProperty', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Number of Rooms</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Living / Dining">
                <input
                  type="text"
                  value={fields.numberOfRoomsLiving}
                  onChange={e => updateField('numberOfRoomsLiving', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Bed Rooms">
                <input
                  type="text"
                  value={fields.numberOfRoomsBed}
                  onChange={e => updateField('numberOfRoomsBed', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Toilets">
                <input
                  type="text"
                  value={fields.numberOfRoomsToilets}
                  onChange={e => updateField('numberOfRoomsToilets', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Kitchens">
                <input
                  type="text"
                  value={fields.numberOfRoomsKitchens}
                  onChange={e => updateField('numberOfRoomsKitchens', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Field label="Total Floors">
              <input
                type="text"
                value={fields.totalNumberOfFloors}
                onChange={e => updateField('totalNumberOfFloors', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Area Located">
              <input
                type="text"
                value={fields.areaPropertyLocated}
                onChange={e => updateField('areaPropertyLocated', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Approx Age">
              <input
                type="text"
                value={fields.approxAgeProperty}
                onChange={e => updateField('approxAgeProperty', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Residual Life">
              <input
                type="text"
                value={fields.residualLifeProperty}
                onChange={e => updateField('residualLifeProperty', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Structure Type">
              <input
                type="text"
                value={fields.typeOfStructure}
                onChange={e => updateField('typeOfStructure', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── SECTION 5, 6, 7: Tenure, Construction & Violations ── */}
      <Section title="5, 6 & 7. Tenure, Construction & Violations" number={6}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Status of Tenure">
            <input
              type="text"
              value={fields.statusOfTenure}
              onChange={e => updateField('statusOfTenure', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Occupied By">
            <input
              type="text"
              value={fields.occupiedBy}
              onChange={e => updateField('occupiedBy', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Years of Occupancy">
            <input
              type="text"
              value={fields.numberOfYearsOccupied}
              onChange={e => updateField('numberOfYearsOccupied', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Relationship of Tenant to Owner">
            <input
              type="text"
              value={fields.tenantRelationshipToOwner}
              onChange={e => updateField('tenantRelationshipToOwner', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Stage of Construction">
            <input
              type="text"
              value={fields.stageOfConstruction}
              onChange={e => updateField('stageOfConstruction', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Extent of Completion">
            <input
              type="text"
              value={fields.extentOfCompletion}
              onChange={e => updateField('extentOfCompletion', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Nature & Extent of Violations (if any)" className="md:col-span-2">
            <textarea
              rows={2}
              value={fields.violationsObserved}
              onChange={e => updateField('violationsObserved', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── SECTION 8: Area Details of the Property ── */}
      <Section title="Area Details (Site, Carpet, Saleable & Block Plinth Areas)" number={7}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Site Area (Approved)">
              <input
                type="text"
                value={fields.siteAreaApproved}
                onChange={e => updateField('siteAreaApproved', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Site Area (Actual)">
              <input
                type="text"
                value={fields.siteAreaActual}
                onChange={e => updateField('siteAreaActual', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Carpet Area (Approved)">
              <input
                type="text"
                value={fields.carpetAreaApproved}
                onChange={e => updateField('carpetAreaApproved', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Carpet Area (Actual)">
              <input
                type="text"
                value={fields.carpetAreaActual}
                onChange={e => updateField('carpetAreaActual', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Saleable Area (Approved)">
              <input
                type="text"
                value={fields.saleableAreaApproved}
                onChange={e => updateField('saleableAreaApproved', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Saleable Area (Actual)">
              <input
                type="text"
                value={fields.saleableAreaActual}
                onChange={e => updateField('saleableAreaActual', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">Plinth Areas (Block-1 & Block-2)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Block-1 GF (Appr)">
                <input
                  type="text"
                  value={fields.plinthBlock1GFApproved}
                  onChange={e => updateField('plinthBlock1GFApproved', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Block-1 GF (Act)">
                <input
                  type="text"
                  value={fields.plinthBlock1GFActual}
                  onChange={e => updateField('plinthBlock1GFActual', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Block-1 FF (Appr)">
                <input
                  type="text"
                  value={fields.plinthBlock1FFApproved}
                  onChange={e => updateField('plinthBlock1FFApproved', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Block-1 FF (Act)">
                <input
                  type="text"
                  value={fields.plinthBlock1FFActual}
                  onChange={e => updateField('plinthBlock1FFActual', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Block-1 SF (Appr)">
                <input
                  type="text"
                  value={fields.plinthBlock1SFApproved}
                  onChange={e => updateField('plinthBlock1SFApproved', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Block-1 SF (Act)">
                <input
                  type="text"
                  value={fields.plinthBlock1SFActual}
                  onChange={e => updateField('plinthBlock1SFActual', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Total Plinth (Appr)">
                <input
                  type="text"
                  value={fields.plinthTotalApproved}
                  onChange={e => updateField('plinthTotalApproved', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Total Plinth (Act)">
                <input
                  type="text"
                  value={fields.plinthTotalActual}
                  onChange={e => updateField('plinthTotalActual', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </div>
      </Section>

      {/* ── DETAILS OF VALUATION (Floor-wise Construction Grid) ── */}
      <Section title="Details of Valuation (Floor-wise Plinth Replacement & Depreciation)" number={8}>
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2 border">Floor</th>
                  <th className="p-2 border">Plinth Area</th>
                  <th className="p-2 border">Roof Ht</th>
                  <th className="p-2 border">Age</th>
                  <th className="p-2 border">Repl. Rate</th>
                  <th className="p-2 border">Cost</th>
                  <th className="p-2 border">Dep. %</th>
                  <th className="p-2 border">Net Value</th>
                  <th className="p-2 border text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {(fields.valFloorRows || []).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.floor}
                        onChange={e => handleFloorRowChange(idx, 'floor', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.plinthArea}
                        onChange={e => handleFloorRowChange(idx, 'plinthArea', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.roofHeight}
                        onChange={e => handleFloorRowChange(idx, 'roofHeight', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.age}
                        onChange={e => handleFloorRowChange(idx, 'age', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.replacementRate}
                        onChange={e => handleFloorRowChange(idx, 'replacementRate', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.cost}
                        onChange={e => handleFloorRowChange(idx, 'cost', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.depPct}
                        onChange={e => handleFloorRowChange(idx, 'depPct', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border">
                      <input
                        type="text"
                        value={row.netValue}
                        onChange={e => handleFloorRowChange(idx, 'netValue', e.target.value)}
                        className={inputCls}
                      />
                    </td>
                    <td className="p-1 border text-center">
                      <button
                        type="button"
                        onClick={() => removeFloorRow(idx)}
                        className="text-red-500 hover:text-red-700 text-xs px-1"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addFloorRow}
            className="btn btn-secondary text-xs px-3 py-1.5"
          >
            + Add Floor Row
          </button>
        </div>
      </Section>

      {/* ── VALUE OF THE PROPERTY (4-Row x 4-Col Matrix) ── */}
      <Section title="Value of the Property (4-Row x 4-Column Matrix)" number={9} defaultOpen>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-amber-50 text-slate-800 font-bold">
              <tr>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Govt Guideline Value</th>
                <th className="p-2 border">Market Value</th>
                <th className="p-2 border">Realisable Value (95%)</th>
                <th className="p-2 border">Distress Value (85%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border font-semibold">1. Land</td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableGovtLand}
                    onChange={e => updateField('valTableGovtLand', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableMarketLand}
                    onChange={e => updateField('valTableMarketLand', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableRealizableLand}
                    onChange={e => updateField('valTableRealizableLand', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableDistressLand}
                    onChange={e => updateField('valTableDistressLand', e.target.value)}
                    className={inputCls}
                  />
                </td>
              </tr>
              <tr>
                <td className="p-2 border font-semibold">2. Building</td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableGovtBldg}
                    onChange={e => updateField('valTableGovtBldg', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableMarketBldg}
                    onChange={e => updateField('valTableMarketBldg', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableRealizableBldg}
                    onChange={e => updateField('valTableRealizableBldg', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableDistressBldg}
                    onChange={e => updateField('valTableDistressBldg', e.target.value)}
                    className={inputCls}
                  />
                </td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="p-2 border">Total</td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableGovtTotal}
                    onChange={e => updateField('valTableGovtTotal', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableMarketTotal}
                    onChange={e => updateField('valTableMarketTotal', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableRealizableTotal}
                    onChange={e => updateField('valTableRealizableTotal', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableDistressTotal}
                    onChange={e => updateField('valTableDistressTotal', e.target.value)}
                    className={inputCls}
                  />
                </td>
              </tr>
              <tr className="bg-amber-50/40 font-bold">
                <td className="p-2 border">Or Say</td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableGovtOrSay}
                    onChange={e => updateField('valTableGovtOrSay', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableMarketOrSay}
                    onChange={e => updateField('valTableMarketOrSay', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableRealizableOrSay}
                    onChange={e => updateField('valTableRealizableOrSay', e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="text"
                    value={fields.valTableDistressOrSay}
                    onChange={e => updateField('valTableDistressOrSay', e.target.value)}
                    className={inputCls}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Market Value Words">
            <input
              type="text"
              value={fields.opinionMarketWords}
              onChange={e => updateField('opinionMarketWords', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Realisable Value Words">
            <input
              type="text"
              value={fields.opinionRealizableWords}
              onChange={e => updateField('opinionRealizableWords', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── Justification Letter ── */}
      <Section title="Justification Letter" number={10}>
        <div className="space-y-4">
          <Field label="Subject">
            <input
              type="text"
              value={fields.justificationLetterSubject}
              onChange={e => updateField('justificationLetterSubject', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Body Paragraphs">
            <textarea
              rows={4}
              value={fields.justificationLetterBody}
              onChange={e => updateField('justificationLetterBody', e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Base Documents ── */}
      <BaseDocumentsSection
        title="Documents" sectionNumber={11}
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionId="section-documents"
      />

      {/* ── Section: Base Maps ── */}
      <BaseMapsSection
        title="Maps" sectionNumber={12}
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
        sectionId="section-maps"
      />

      {/* ── Section: Photographs ── */}
      <BasePhotographsSection
        title="Photographs" sectionNumber={13}
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionId="section-photographs"
      />
    </div>
  );
}
