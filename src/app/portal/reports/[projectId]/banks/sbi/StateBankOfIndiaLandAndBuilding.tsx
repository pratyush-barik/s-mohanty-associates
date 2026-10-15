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
  ReportActionBar,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { PDFSBILandAndBuildingRenderer } from '@/lib/banks/pdf-sbi-land-and-building-renderer';

export const SBI_LAND_BUILDING_CONFIG: BankConfig = {
  bankId: 'STATE BANK OF INDIA-SBI',
  subTemplateId: 'Land & Building',
  displayName: 'State Bank of India (SBI) — Land & Building',
  defaultValues: {},
  getPDFRenderer: (data: any, projectCode?: string) => {
    return new PDFSBILandAndBuildingRenderer(data, projectCode);
  },
};

export interface SBILandBuildingProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function StateBankOfIndiaLandAndBuilding({
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
}: SBILandBuildingProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill & Exact Statutory Points ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      clientType: saved.clientType || 'organisation',
      organisationTemplate: saved.organisationTemplate || 'STATE BANK OF INDIA-SBI',
      organisationSubTemplate: saved.organisationSubTemplate || 'Land & Building',
      institutionCategory: saved.institutionCategory || 'Bank & FIS',
      propertyValuationType: 'LAND_AND_BUILDING',

      // Top Header
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE CHIEF MANAGER / BRANCH HEAD,',
      bankName: saved.bankName !== undefined ? saved.bankName : (pf.bankName || 'STATE BANK OF INDIA,'),
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : 'BALUGAON BRANCH, DIST: KHURDA, ODISHA',
      refNo: saved.refNo !== undefined ? saved.refNo : (projectCode || projectId || 'SMA/IDBI/07-2026/09'),
      reportDate: saved.reportDate !== undefined ? saved.reportDate : (pf.reportDate || '24.07.2026'),
      borrowerName: saved.borrowerName !== undefined ? saved.borrowerName : (pf.contactName || 'Mr. Dipak Kumar Barik'),

      // 1. Customer Details
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (pf.contactName ? `${pf.contactName}, S/o: ${pf.fatherName || 'Ashok Kumar Barik'}, At: ${pf.propertyAddress || 'Khandagiri, Bhubaneswar, Dist: Khurda, Odisha'}` : 'Mr. Dipak Kumar Barik, S/o: Ashok Kumar Barik, At: Khandagiri, Bhubaneswar, Dist: Khurda, Odisha.'),
      applicationNo: saved.applicationNo !== undefined ? saved.applicationNo : 'Not Available',
      caseType: saved.caseType !== undefined ? saved.caseType : 'Fresh Valuation',
      identifiedByAndMobNo: saved.identifiedByAndMobNo !== undefined ? saved.identifiedByAndMobNo : "Mr. Dalai (Owner's Representative), Mob-9178156885",

      // 2. Property Details
      propertyAddress: saved.propertyAddress !== undefined ? saved.propertyAddress : (pf.propertyAddress || 'Khata No: 311/2959, Plot No: 765/2546, Sub Plot No: 1151 & 1152, Total Area: Ac.0.055 Dec i.e. 2400.00 Sft, Kissam: Gharabari in Mz: Kantilo, Ps: Airfield No-53, Ts: Jatani No-196, Dist: Khurda, Odisha. Pin-751002'),
      nearbyLandmark: saved.nearbyLandmark !== undefined ? saved.nearbyLandmark : 'The subject property is situated back side of Subhasri Villa Apartment, Kantilo',
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : '',
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || ''),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || ''),

      // 3. Document Details
      layoutPlanAvailable: saved.layoutPlanAvailable !== undefined ? saved.layoutPlanAvailable : 'Yes/ No',
      layoutPlanAuthority: saved.layoutPlanAuthority !== undefined ? saved.layoutPlanAuthority : 'Bhubaneswar Development Authority',
      layoutPlanApprovalNo: saved.layoutPlanApprovalNo !== undefined ? saved.layoutPlanApprovalNo : 'Vide Letter No: BP/BDA/009678 on dated 07.05.2024 for construction of a G+2 storied (Block-1 & 2) Residential Building',
      buildingPlanAvailable: saved.buildingPlanAvailable !== undefined ? saved.buildingPlanAvailable : 'Yes/ No',
      buildingPlanAuthority: saved.buildingPlanAuthority !== undefined ? saved.buildingPlanAuthority : 'Bhubaneswar Development Authority',
      buildingPlanApprovalNo: saved.buildingPlanApprovalNo !== undefined ? saved.buildingPlanApprovalNo : 'BP/BDA/009678',
      constructionPermissionAvailable: saved.constructionPermissionAvailable !== undefined ? saved.constructionPermissionAvailable : 'Yes/ No',
      constructionPermissionAuthority: saved.constructionPermissionAuthority !== undefined ? saved.constructionPermissionAuthority : 'Bhubaneswar Development Authority',
      constructionPermissionApprovalNo: saved.constructionPermissionApprovalNo !== undefined ? saved.constructionPermissionApprovalNo : 'BP/BDA/009678',
      legalDocumentsAvailable: saved.legalDocumentsAvailable !== undefined ? saved.legalDocumentsAvailable : 'Yes/ No',
      legalDocumentsAuthority: saved.legalDocumentsAuthority !== undefined ? saved.legalDocumentsAuthority : '',
      legalDocumentsApprovalNo: saved.legalDocumentsApprovalNo !== undefined ? saved.legalDocumentsApprovalNo : '',
      listOfDocuments: saved.listOfDocuments !== undefined ? saved.listOfDocuments : 'Xerox copy of Agreement for Sale, Sketch Map, Patta, Approval Letter',

      // 4. Physical Details
      boundaryEastDoc: saved.boundaryEastDoc !== undefined ? saved.boundaryEastDoc : 'Sub Plot No-1153',
      boundaryEastVerif: saved.boundaryEastVerif !== undefined ? saved.boundaryEastVerif : 'Sub Plot No-1153',
      boundaryWestDoc: saved.boundaryWestDoc !== undefined ? saved.boundaryWestDoc : 'Road',
      boundaryWestVerif: saved.boundaryWestVerif !== undefined ? saved.boundaryWestVerif : 'Road',
      boundaryNorthDoc: saved.boundaryNorthDoc !== undefined ? saved.boundaryNorthDoc : 'Revenue Plot No-767',
      boundaryNorthVerif: saved.boundaryNorthVerif !== undefined ? saved.boundaryNorthVerif : 'Revenue Plot No-767',
      boundarySouthDoc: saved.boundarySouthDoc !== undefined ? saved.boundarySouthDoc : 'Road',
      boundarySouthVerif: saved.boundarySouthVerif !== undefined ? saved.boundarySouthVerif : 'Road',

      matchingBoundaries: saved.matchingBoundaries !== undefined ? saved.matchingBoundaries : 'Yes/ No',
      plotDemarcated: saved.plotDemarcated !== undefined ? saved.plotDemarcated : 'Yes/ No',
      approvedLandUse: saved.approvedLandUse !== undefined ? saved.approvedLandUse : 'Residential',
      typeOfProperty: saved.typeOfProperty !== undefined ? saved.typeOfProperty : 'Land & Building',
      numberOfRoomsLiving: saved.numberOfRoomsLiving !== undefined ? saved.numberOfRoomsLiving : '2 Nos',
      numberOfRoomsBed: saved.numberOfRoomsBed !== undefined ? saved.numberOfRoomsBed : '5 Nos',
      numberOfRoomsToilets: saved.numberOfRoomsToilets !== undefined ? saved.numberOfRoomsToilets : '3 Nos',
      numberOfRoomsKitchens: saved.numberOfRoomsKitchens !== undefined ? saved.numberOfRoomsKitchens : '1 Nos',
      totalNumberOfFloors: saved.totalNumberOfFloors !== undefined ? saved.totalNumberOfFloors : 'G+1 Storied',
      areaPropertyLocated: saved.areaPropertyLocated !== undefined ? saved.areaPropertyLocated : 'Kalyani Vihar Scheme',
      approxAgeProperty: saved.approxAgeProperty !== undefined ? saved.approxAgeProperty : 'New',
      residualLifeProperty: saved.residualLifeProperty !== undefined ? saved.residualLifeProperty : '65 Yrs',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame',

      // 5. Tenure / Occupancy
      statusOfTenure: saved.statusOfTenure !== undefined ? saved.statusOfTenure : 'Owned/ Rented (Under Construction)',
      numberOfYearsOccupancy: saved.numberOfYearsOccupancy !== undefined ? saved.numberOfYearsOccupancy : 'NA',
      relationshipTenantOwner: saved.relationshipTenantOwner !== undefined ? saved.relationshipTenantOwner : 'NA',

      // 6. Stage of construction
      stageOfConstruction: saved.stageOfConstruction !== undefined ? saved.stageOfConstruction : 'Ground Floor Completed (85%), First Floor Completed (80%)',
      underConstructionExtent: saved.underConstructionExtent !== undefined ? saved.underConstructionExtent : 'Not Applicable',

      // 7. Violations
      natureExtentViolations: saved.natureExtentViolations !== undefined ? saved.natureExtentViolations : 'Horizontal Deviation-93%',

      // 8. Area details
      siteAreaText: saved.siteAreaText !== undefined ? saved.siteAreaText : 'Ac.0.055 Dec i.e. 2400.00 Sft',
      carpetAreaText: saved.carpetAreaText !== undefined ? saved.carpetAreaText : '2440.00 Sft (Approx.)',
      saleableAreaText: saved.saleableAreaText !== undefined ? saved.saleableAreaText : '2400.00 Sft (Land) & 2880.00 Sft (Building)',
      plinthAreaApprovalText: saved.plinthAreaApprovalText !== undefined ? saved.plinthAreaApprovalText : 'Block-1: Ground: 746.00 Sft, First: 746.00 Sft, Second: 746.00 Sft\nBlock-2: Ground: 746.00 Sft, First: 746.00 Sft, Second: 746.00 Sft',
      plinthAreaActualText: saved.plinthAreaActualText !== undefined ? saved.plinthAreaActualText : 'Block-1: Ground: 1440.00 Sft, First: 1440.00 Sft\nTotal: 2880.00 Sft',

      // 9. Valuation (Land Rate Adopted)
      landRateAdoptedText: saved.landRateAdoptedText !== undefined ? saved.landRateAdoptedText : `THE LAND RATE ADOPTED IN THIS VALUATION:\n• GOVT. BENCHMARK VALUE: RS.1,69,65,000/- PER ACRE I.E. RS.389/- PER SFT\n• TOTAL LAND AREA: AC.0.055 DEC I.E. 2400.00 SFT\n• GUIDELINE VALUE OF LAND= 2400.00 SFT X RS.389/- PER SFT =RS.9,33,600/-\n• THE PREVAILING MARKET RATE OF THE LAND IS RS.2400/- TO RS.2600/- PER SFT.\n• THE ADOPTED MARKET RATE OF THE LAND IS RS.2500/- PER SFT FOR VALUATION PURPOSE.\n• TOTAL MARKET VALUE: 2400.00 SFT X RS.2500/- PER SFT = RS.60,00,000/-`,

      // 10. Remarks
      generalRemarksText: saved.generalRemarksText !== undefined ? saved.generalRemarksText : `REMARKS:\nSUBJECT PROPERTY IS AN UNDER CONSTRUCTED G+1 STORIED BUILDING, LAND EXTENT OF AC.0.055 DEC I.E. 2400.00 SFT. PROPERTY LOCATED IN A GOOD DEVELOPED RESIDENTIAL AREA OF KALYANI VIHAR, KANTILO, BHUBANESWAR. THIS PROPERTY IS COMING UNDER BHUBANESWAR DEVELOPMENT AUTHORITY AREA LIMIT. ALL CIVIC AMENITIES ARE PRESENT 2-3 KM FROM THE PROPERTY. VALUATION HAS BEEN DONE FOR LAND & APPROVED BUA OF THE G+1 STORIED BUILDING (BLOCK-1).`,

      // 11. Declaration
      declarationText: saved.declarationText !== undefined ? saved.declarationText : `1) The property was inspected by the undersigned on 24.07.2026\n2) The undersigned does not have any direct/indirect interest in the above property.\n3) The information furnished herein is true and correct to the best of our knowledge.`,

      // 12. Valuer Details
      valuerNameAndAddress: saved.valuerNameAndAddress !== undefined ? saved.valuerNameAndAddress : 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018',
      valuerWealthTaxReg: saved.valuerWealthTaxReg !== undefined ? saved.valuerWealthTaxReg : '107/2016-17 of Category-I',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || '24.07.2026'),

      // 13 & 14 Enclosures
      listDocumentsEnclosed: saved.listDocumentsEnclosed || 'Valuation Report, Benchmark Valuation, GPS Map, Photographs',
      listPhotosEnclosed: saved.listPhotosEnclosed || 'Bed Room, Dinning, Drawing, Kitchen, Building with Road',

      // 15 Marketability
      marketabilityNarrative: saved.marketabilityNarrative || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & building method of valuation has been adopted for finding the fair market value of the property.',

      // Valuation Computation
      plinthAreaVal: saved.plinthAreaVal !== undefined ? saved.plinthAreaVal : '746',
      roofHeightVal: saved.roofHeightVal !== undefined ? saved.roofHeightVal : "10'-6\"",
      ageVal: saved.ageVal !== undefined ? saved.ageVal : 'New',
      replacementRateVal: saved.replacementRateVal !== undefined ? saved.replacementRateVal : '2000',
      depreciationVal: saved.depreciationVal !== undefined ? saved.depreciationVal : '0',

      // Value of Property Abstract (4x4 Table)
      abstractGovtLand: saved.abstractGovtLand !== undefined ? saved.abstractGovtLand : '933600',
      abstractGovtBldg: saved.abstractGovtBldg !== undefined ? saved.abstractGovtBldg : '1958250',
      abstractGovtTotal: saved.abstractGovtTotal !== undefined ? saved.abstractGovtTotal : '2891850',
      abstractGovtOrSay: saved.abstractGovtOrSay !== undefined ? saved.abstractGovtOrSay : '2892000',

      abstractMarketLand: saved.abstractMarketLand !== undefined ? saved.abstractMarketLand : '6000000',
      abstractMarketBldg: saved.abstractMarketBldg !== undefined ? saved.abstractMarketBldg : '2611000',
      abstractMarketTotal: saved.abstractMarketTotal !== undefined ? saved.abstractMarketTotal : '8611000',
      abstractMarketOrSay: saved.abstractMarketOrSay !== undefined ? saved.abstractMarketOrSay : '8611000',

      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractRealizableLand: saved.abstractRealizableLand !== undefined ? saved.abstractRealizableLand : '5700000',
      abstractRealizableBldg: saved.abstractRealizableBldg !== undefined ? saved.abstractRealizableBldg : '2480450',
      abstractRealizableTotal: saved.abstractRealizableTotal !== undefined ? saved.abstractRealizableTotal : '8180450',
      abstractRealizableOrSay: saved.abstractRealizableOrSay !== undefined ? saved.abstractRealizableOrSay : '8180000',

      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',
      abstractDistressLand: saved.abstractDistressLand !== undefined ? saved.abstractDistressLand : '5100000',
      abstractDistressBldg: saved.abstractDistressBldg !== undefined ? saved.abstractDistressBldg : '2219350',
      abstractDistressTotal: saved.abstractDistressTotal !== undefined ? saved.abstractDistressTotal : '7319350',
      abstractDistressOrSay: saved.abstractDistressOrSay !== undefined ? saved.abstractDistressOrSay : '7319000',

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

  // ── Auto-Calculate Valuation Computations & Totals ──
  useEffect(() => {
    const landMarket = parseNum(fields.abstractMarketLand);
    const bldgMarket = parseNum(fields.abstractMarketBldg);
    const totalMarket = landMarket + bldgMarket;

    const landGovt = parseNum(fields.abstractGovtLand);
    const bldgGovt = parseNum(fields.abstractGovtBldg);
    const totalGovt = landGovt + bldgGovt;

    const rPct = parsePct(fields.abstractRealizablePct, 100);
    const dPct = parsePct(fields.abstractDistressPct, 100);

    const realLand = Math.round((landMarket * rPct) / 100);
    const realBldg = Math.round((bldgMarket * rPct) / 100);
    const totalReal = realLand + realBldg;

    const distLand = Math.round((landMarket * dPct) / 100);
    const distBldg = Math.round((bldgMarket * dPct) / 100);
    const totalDist = distLand + distBldg;

    setFields((prev: any) => ({
      ...prev,
      abstractGovtTotal: totalGovt > 0 ? `Rs. ${formatIndianCurrency(totalGovt)}` : prev.abstractGovtTotal,
      abstractMarketTotal: totalMarket > 0 ? `Rs. ${formatIndianCurrency(totalMarket)}` : prev.abstractMarketTotal,
      abstractRealizableLand: realLand > 0 ? `Rs. ${formatIndianCurrency(realLand)}` : prev.abstractRealizableLand,
      abstractRealizableBldg: realBldg > 0 ? `Rs. ${formatIndianCurrency(realBldg)}` : prev.abstractRealizableBldg,
      abstractRealizableTotal: totalReal > 0 ? `Rs. ${formatIndianCurrency(totalReal)}` : prev.abstractRealizableTotal,
      abstractDistressLand: distLand > 0 ? `Rs. ${formatIndianCurrency(distLand)}` : prev.abstractDistressLand,
      abstractDistressBldg: distBldg > 0 ? `Rs. ${formatIndianCurrency(distBldg)}` : prev.abstractDistressBldg,
      abstractDistressTotal: totalDist > 0 ? `Rs. ${formatIndianCurrency(totalDist)}` : prev.abstractDistressTotal,
    }));
  }, [
    fields.abstractMarketLand,
    fields.abstractMarketBldg,
    fields.abstractGovtLand,
    fields.abstractGovtBldg,
    fields.abstractRealizablePct,
    fields.abstractDistressPct,
  ]);

  const handleSaveInternal = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        ...fields,
        clientType: 'organisation',
        organisationTemplate: 'STATE BANK OF INDIA-SBI',
        organisationSubTemplate: 'Land & Building',
        institutionCategory: 'Bank & FIS',
        propertyValuationType: 'LAND_AND_BUILDING',
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
      const renderer = new PDFSBILandAndBuildingRenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SBI_Land_And_Building_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating SBI Land & Building PDF:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
        category={fields.institutionCategory || 'Bank & FIS'}
        bankName={fields.bankName || fields.organisationTemplate || 'STATE BANK OF INDIA-SBI'}
        subclass={fields.organisationSubTemplate || 'Land & Building'}
        serviceType={fields.serviceType}
        subjectType={fields.subjectType}
        onResetWizard={onResetWizard}
      />

      {/* ── Top Header Card ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            STATE BANK OF INDIA (SBI) / IDBI — Land & Building
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Valuation Report Questionnaire</h2>
          <p className="text-xs text-slate-500">
            Standard Statutory Bank Format with Sections 1 to 15, Details of Valuation & Value of the Property Matrix.
          </p>
        </div>

        {onResetWizard && (
          <button
            type="button"
            onClick={onResetWizard}
            className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <span>⚙️</span>
            <span>Change Parameters</span>
          </button>
        )}
      </div>

      {/* ── Section 1: Customer Details ── */}
      <Section title="1. Customer Details" number={1} defaultOpen={true}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name of the Owner">
            <textarea
              className={inputCls + ' min-h-17.5'}
              value={fields.ownerNameAndAddress}
              onChange={(e) => handleChange('ownerNameAndAddress', e.target.value)}
              disabled={isReadOnly}
              placeholder="Mr. Dipak Kumar Barik, S/o: Ashok Kumar Barik, At: ..."
            />
          </Field>
          <div className="space-y-3">
            <Field label="Application No.">
              <input
                className={inputCls}
                value={fields.applicationNo}
                onChange={(e) => handleChange('applicationNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="Not Available"
              />
            </Field>
            <Field label="Case Type">
              <input
                className={inputCls}
                value={fields.caseType}
                onChange={(e) => handleChange('caseType', e.target.value)}
                disabled={isReadOnly}
                placeholder="Fresh Valuation"
              />
            </Field>
          </div>
        </div>

        <div className="mt-3">
          <Field label="Identified by & Mob No">
            <input
              className={inputCls}
              value={fields.identifiedByAndMobNo}
              onChange={(e) => handleChange('identifiedByAndMobNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Mr. Dalai (Owner's Representative), Mob-9178156885"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Property Details ── */}
      <Section title="2. Property Details" number={2} defaultOpen={true}>
        <Field label="Address (with Khata, Plot, Sub Plot, Area, Kissam, Mouza)">
          <textarea
            className={inputCls + ' min-h-17.5'}
            value={fields.propertyAddress}
            onChange={(e) => handleChange('propertyAddress', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <div className="mt-3">
          <Field label="Nearby Landmark / Independent Access">
            <input
              className={inputCls}
              value={fields.nearbyLandmark}
              onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
              disabled={isReadOnly}
              placeholder="The subject property is situated back side of Subhasri Villa Apartment, Kantilo"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Document Details ── */}
      <Section title="3. Document Details" number={3} defaultOpen={false}>
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-2 items-center">
            <span className="text-xs font-semibold text-slate-700">Layout Plan</span>
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
              placeholder="Approving Authority"
            />
            <input
              className={inputCls}
              value={fields.layoutPlanApprovalNo}
              onChange={(e) => handleChange('layoutPlanApprovalNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Approval No & Date"
            />
          </div>

          <div className="grid md:grid-cols-4 gap-2 items-center">
            <span className="text-xs font-semibold text-slate-700">Building Plan</span>
            <input
              className={inputCls}
              value={fields.buildingPlanAvailable}
              onChange={(e) => handleChange('buildingPlanAvailable', e.target.value)}
              disabled={isReadOnly}
              placeholder="Yes/ No"
            />
            <input
              className={inputCls}
              value={fields.buildingPlanAuthority}
              onChange={(e) => handleChange('buildingPlanAuthority', e.target.value)}
              disabled={isReadOnly}
              placeholder="Approving Authority"
            />
            <input
              className={inputCls}
              value={fields.buildingPlanApprovalNo}
              onChange={(e) => handleChange('buildingPlanApprovalNo', e.target.value)}
              disabled={isReadOnly}
              placeholder="Approval No & Date"
            />
          </div>

          <Field label="List of Documents Produced">
            <input
              className={inputCls}
              value={fields.listOfDocuments}
              onChange={(e) => handleChange('listOfDocuments', e.target.value)}
              disabled={isReadOnly}
              placeholder="Xerox copy of Agreement for Sale, Sketch Map, Patta, Approval Letter"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Physical Details & Boundaries ── */}
      <Section title="4. Physical Details & Boundaries" number={4} defaultOpen={true}>
        <div className="space-y-2">
          {['East', 'West', 'North', 'South'].map((dir) => {
            const dKey = `boundary${dir}Doc`;
            const vKey = `boundary${dir}Verif`;
            return (
              <div key={dir} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-medium text-slate-700">{dir}</span>
                <input
                  className={inputCls + ' py-1.5! text-xs'}
                  value={fields[dKey] || ''}
                  onChange={(e) => handleChange(dKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="As per Agreement"
                />
                <input
                  className={inputCls + ' py-1.5! text-xs'}
                  value={fields[vKey] || ''}
                  onChange={(e) => handleChange(vKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="As per Sketch Map"
                />
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-4">
          <Field label="Matching of Boundaries">
            <input
              className={inputCls}
              value={fields.matchingBoundaries}
              onChange={(e) => handleChange('matchingBoundaries', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Plot Demarcated">
            <input
              className={inputCls}
              value={fields.plotDemarcated}
              onChange={(e) => handleChange('plotDemarcated', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Approved Land Use">
            <input
              className={inputCls}
              value={fields.approvedLandUse}
              onChange={(e) => handleChange('approvedLandUse', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Type of Property">
            <input
              className={inputCls}
              value={fields.typeOfProperty}
              onChange={(e) => handleChange('typeOfProperty', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-3">
          <Field label="Living / Dining">
            <input
              className={inputCls}
              value={fields.numberOfRoomsLiving}
              onChange={(e) => handleChange('numberOfRoomsLiving', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Bedrooms">
            <input
              className={inputCls}
              value={fields.numberOfRoomsBed}
              onChange={(e) => handleChange('numberOfRoomsBed', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Toilets">
            <input
              className={inputCls}
              value={fields.numberOfRoomsToilets}
              onChange={(e) => handleChange('numberOfRoomsToilets', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Kitchens">
            <input
              className={inputCls}
              value={fields.numberOfRoomsKitchens}
              onChange={(e) => handleChange('numberOfRoomsKitchens', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5 to 7: Tenure, Stage & Violations ── */}
      <Section title="5, 6, 7. Tenure, Construction Stage & Violations" number={5} defaultOpen={false}>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="5. Status of Tenure">
            <input
              className={inputCls}
              value={fields.statusOfTenure}
              onChange={(e) => handleChange('statusOfTenure', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="6. Stage of Construction">
            <input
              className={inputCls}
              value={fields.stageOfConstruction}
              onChange={(e) => handleChange('stageOfConstruction', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="7. Violations Observed">
            <input
              className={inputCls}
              value={fields.natureExtentViolations}
              onChange={(e) => handleChange('natureExtentViolations', e.target.value)}
              disabled={isReadOnly}
              placeholder="Horizontal Deviation-93%"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 8: Area details of the property ── */}
      <Section title="8. Area Details (Multi-Block Approval & Actual)" number={6} defaultOpen={true}>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Site Area">
            <input
              className={inputCls}
              value={fields.siteAreaText}
              onChange={(e) => handleChange('siteAreaText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Carpet Area">
            <input
              className={inputCls}
              value={fields.carpetAreaText}
              onChange={(e) => handleChange('carpetAreaText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Saleable Area">
            <input
              className={inputCls}
              value={fields.saleableAreaText}
              onChange={(e) => handleChange('saleableAreaText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <Field label="Plinth Area (As per Approval - Block-1 & 2)">
            <textarea
              className={inputCls + ' min-h-17.5 text-xs'}
              value={fields.plinthAreaApprovalText}
              onChange={(e) => handleChange('plinthAreaApprovalText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Plinth Area (As per Actual)">
            <textarea
              className={inputCls + ' min-h-17.5 text-xs'}
              value={fields.plinthAreaActualText}
              onChange={(e) => handleChange('plinthAreaActualText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 9 & 10: Land Rate Adopted & Remarks ── */}
      <Section title="9 & 10. Valuation Narrative & Remarks" number={7} defaultOpen={true}>
        <Field label="9. The Land Rate Adopted Narrative">
          <textarea
            className={inputCls + ' min-h-22.5 text-xs'}
            value={fields.landRateAdoptedText}
            onChange={(e) => handleChange('landRateAdoptedText', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <div className="mt-4">
          <Field label="10. Remarks">
            <textarea
              className={inputCls + ' min-h-20 text-xs'}
              value={fields.generalRemarksText}
              onChange={(e) => handleChange('generalRemarksText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 13, 14, 15: Enclosures & Marketability ── */}
      <Section title="13, 14, 15. Enclosures & Marketability of Property" number={8} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="13. List of Documents Enclosed">
            <input
              className={inputCls}
              value={fields.listDocumentsEnclosed}
              onChange={(e) => handleChange('listDocumentsEnclosed', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="14. List of Photos Enclosed">
            <input
              className={inputCls}
              value={fields.listPhotosEnclosed}
              onChange={(e) => handleChange('listPhotosEnclosed', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="15. Marketability of the Property">
            <textarea
              className={inputCls + ' min-h-20 text-xs'}
              value={fields.marketabilityNarrative}
              onChange={(e) => handleChange('marketabilityNarrative', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Value of the Property Matrix (4 Rows x 4 Columns) ── */}
      <Section title="Value of the Property (4 x 4 Summary Matrix)" number={9} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <Field label="Land Market Value (Rs.)">
            <input
              className={inputCls + ' font-bold'}
              value={fields.abstractMarketLand}
              onChange={(e) => handleChange('abstractMarketLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="6000000"
            />
          </Field>
          <Field label="Building Market Value (Rs.)">
            <input
              className={inputCls + ' font-bold'}
              value={fields.abstractMarketBldg}
              onChange={(e) => handleChange('abstractMarketBldg', e.target.value)}
              disabled={isReadOnly}
              placeholder="2611000"
            />
          </Field>
          <Field label="Total Market Value (Rs.)">
            <input
              className={inputCls + ' font-bold text-emerald-700 bg-emerald-50'}
              value={fields.abstractMarketTotal}
              onChange={(e) => handleChange('abstractMarketTotal', e.target.value)}
              disabled={isReadOnly}
              placeholder="8611000"
            />
          </Field>
          <Field label="Market Or Say (Rs.)">
            <input
              className={inputCls + ' font-bold text-emerald-700'}
              value={fields.abstractMarketOrSay}
              onChange={(e) => handleChange('abstractMarketOrSay', e.target.value)}
              disabled={isReadOnly}
              placeholder="8611000"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-3">
          <Field label="Land Govt Value (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtLand}
              onChange={(e) => handleChange('abstractGovtLand', e.target.value)}
              disabled={isReadOnly}
              placeholder="933600"
            />
          </Field>
          <Field label="Building Govt Value (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtBldg}
              onChange={(e) => handleChange('abstractGovtBldg', e.target.value)}
              disabled={isReadOnly}
              placeholder="1958250"
            />
          </Field>
          <Field label="Total Govt Value (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtTotal}
              onChange={(e) => handleChange('abstractGovtTotal', e.target.value)}
              disabled={isReadOnly}
              placeholder="2891850"
            />
          </Field>
          <Field label="Govt Or Say (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtOrSay}
              onChange={(e) => handleChange('abstractGovtOrSay', e.target.value)}
              disabled={isReadOnly}
              placeholder="2892000"
            />
          </Field>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mt-3">
          <Field label="Realizable Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractRealizablePct}
                onChange={(e) => handleChange('abstractRealizablePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="95"
              />
              <input
                className={inputCls + ' text-xs'}
                value={fields.abstractRealizableTotal}
                onChange={(e) => handleChange('abstractRealizableTotal', e.target.value)}
                disabled={isReadOnly}
                placeholder="Total Realizable"
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
                placeholder="85"
              />
              <input
                className={inputCls + ' text-xs'}
                value={fields.abstractDistressTotal}
                onChange={(e) => handleChange('abstractDistressTotal', e.target.value)}
                disabled={isReadOnly}
                placeholder="Total Distress"
              />
            </div>
          </Field>
          <Field label="Realizable Or Say (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractRealizableOrSay}
              onChange={(e) => handleChange('abstractRealizableOrSay', e.target.value)}
              disabled={isReadOnly}
              placeholder="8180000"
            />
          </Field>
          <Field label="Distress Or Say (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractDistressOrSay}
              onChange={(e) => handleChange('abstractDistressOrSay', e.target.value)}
              disabled={isReadOnly}
              placeholder="7319000"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Base Documents ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={10}
        sectionId="section-documents"
      />

      {/* ── Section: Base Maps ── */}
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
        sectionNumber={11}
        sectionId="section-maps"
      />

      {/* ── Section: Photographs ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={12}
        sectionId="section-photographs"
      />

      {/* ── Standard Sticky Bottom Action Bar ── */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={saving ? 'saving' : saveSuccess ? 'saved' : 'idle'}
        loading={saving}
        onSaveDraft={handleSaveInternal}
        onPreviewPDF={handleDownloadPdfInternal}
        onDownloadPDF={handleDownloadPdfInternal}
      />
    </div>
  );
}
