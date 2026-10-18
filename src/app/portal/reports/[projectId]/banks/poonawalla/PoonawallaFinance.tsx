'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  BankReportHeader,
  Section,
  Field,
  BaseDateInput,
  inputCls,
  selectCls,
  textareaCls,
  renderedParagraphCls,
  renderedBoxedContentCls,
  renderedDeclarationPointCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
  formatReportDate,
  getEarliestFieldVisit,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { PDFPoonawallaFinanceRenderer } from '@/lib/banks/pdf-poonawalla-finance-renderer';

export const POONAWALLA_FINANCE_CONFIG: BankConfig = {
  bankId: 'POONAWALLA FINANCE',
  subTemplateId: '',
  displayName: 'Poonawalla Fincorp Ltd',
  defaultValues: {
    purpose: 'Mortgage / Business Finance / LAP',
  },
};

export interface PoonawallaFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function PoonawallaFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: PoonawallaFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || userRole === 'viewer';

  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [photoModalTarget, setPhotoModalTarget] = useState<'documents' | 'maps' | 'photos'>('photos');

  const navSections: NavItem[] = [
    { id: 'sec-meta', title: 'Header & Application' },
    { id: 'sec-sanction', title: 'Sanction Plan & Documents' },
    { id: 'sec-boundaries', title: 'Boundaries & Occupant' },
    { id: 'sec-building', title: 'Building & Unit Details' },
    { id: 'sec-floor-area', title: 'Floor Wise Area Matrix' },
    { id: 'sec-valuation', title: 'Valuation & Costing' },
    { id: 'sec-specs', title: 'Engineering Specifications' },
    { id: 'sec-usage', title: 'Floorwise Usage' },
    { id: 'sec-remarks', title: 'Remarks & Declaration' },
    { id: 'sec-documents', title: 'Documents' },
    { id: 'sec-maps', title: 'Location Maps' },
    { id: 'sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initial Fields with clean prefill and zero hardcoded mock client data
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Cover & Meta Header
    if (!d.refNo) d.refNo = projectCode || '';
    if (!d.dealNo) d.dealNo = '';
    if (!d.valuerName) d.valuerName = 'S MOHANTY ASSOCIATES';
    if (!d.vertical) d.vertical = 'NA';
    if (!d.branchName) d.branchName = '';
    if (!d.typeOfCase) d.typeOfCase = 'LAP';
    if (!d.dateOfInitiate) d.dateOfInitiate = formatReportDate(new Date());
    if (!d.dateOfVisit) d.dateOfVisit = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.dateOfReport) d.dateOfReport = formatReportDate(new Date());
    if (!d.contactPerson) {
      d.contactPerson = p.contactName
        ? `${p.contactName}${p.contactPhone ? `, Mob:- ${p.contactPhone}` : ''}`
        : '';
    }

    // 1 to 4: Application & Identification
    if (!d.applicantName) d.applicantName = p.applicantName || p.contactName || '';
    if (!d.propertyType) d.propertyType = 'G+2 storied commercial building';
    if (!d.currentUsage) d.currentUsage = 'Commercial';
    if (!d.addressAtSite) d.addressAtSite = p.propertyAddress || '';
    if (!d.addressAsPerFiring) d.addressAsPerFiring = d.addressAtSite;
    if (!d.addressAsPerDocument) d.addressAsPerDocument = d.addressAtSite;
    if (!d.previousValuation) d.previousValuation = 'No';

    // 5 to 10: Sanction Plan & Documents Details
    if (!d.sanctionPlanNo) d.sanctionPlanNo = '';
    if (!d.sanctionStructure) d.sanctionStructure = 'NA';
    if (!d.sanctionAuthority) d.sanctionAuthority = 'CDA';
    if (!d.sanctionArea) d.sanctionArea = 'NA';
    if (!d.sanctionPlanDetails) d.sanctionPlanDetails = '';
    if (!d.documentsVerified) d.documentsVerified = 'Copy of Sale Deed, Gift deed, ROR, Approved plan';
    if (!d.ownershipType) d.ownershipType = 'Freehold';
    if (!d.constructionCompliance) d.constructionCompliance = 'Bye Laws';
    if (!d.permissibleUsage) d.permissibleUsage = 'Master Plan not publish';
    if (!d.demolitionList) d.demolitionList = 'Not observed';

    // 11. Boundaries
    if (!d.boundaryEastDoc) d.boundaryEastDoc = p.boundaryEast || '';
    if (!d.boundaryWestDoc) d.boundaryWestDoc = p.boundaryWest || '';
    if (!d.boundaryNorthDoc) d.boundaryNorthDoc = p.boundaryNorth || '';
    if (!d.boundarySouthDoc) d.boundarySouthDoc = p.boundarySouth || '';

    if (!d.boundaryEastSite) d.boundaryEastSite = p.boundaryEast || '';
    if (!d.boundaryWestSite) d.boundaryWestSite = p.boundaryWest || '';
    if (!d.boundaryNorthSite) d.boundaryNorthSite = p.boundaryNorth || '';
    if (!d.boundarySouthSite) d.boundarySouthSite = p.boundarySouth || '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Partly matching';

    // 12. Occupant
    if (!d.occupancyStatus) d.occupancyStatus = 'Occupied';
    if (!d.occupantName) d.occupantName = 'Partly self occupied & Partly rented';
    if (!d.occupiedFrom) d.occupiedFrom = 'NA';
    if (!d.occupantRelation) d.occupantRelation = 'NA';

    // 13. Building Details
    if (!d.propertyDemarcation) d.propertyDemarcation = 'Yes';
    if (!d.identifiedThrough) d.identifiedThrough = d.contactPerson ? 'Customer' : 'Shown by Applicant';
    if (!d.structureType) d.structureType = 'RCC';
    if (!d.plotArea) d.plotArea = p.plotArea || '';
    if (!d.noOfFloors) d.noOfFloors = 'G+2';
    if (!d.floorValued) d.floorValued = 'G+2';
    if (!d.unitsPerFloor) d.unitsPerFloor = 'NA';
    if (!d.liftsCount) d.liftsCount = 'Nil';

    // 14. Unit Details
    if (!d.unitRooms) d.unitRooms = '';
    if (!d.sbuaPermissible) d.sbuaPermissible = 'NA';
    if (!d.carpetArea) d.carpetArea = '';
    if (!d.viewRemarks) d.viewRemarks = 'NA';

    // 15 to 20: Locality & Physical Parameters
    if (!d.constructionQuality) d.constructionQuality = 'Average';
    if (!d.interiorsExteriors) d.interiorsExteriors = 'Average';
    if (!d.propertyAge) d.propertyAge = '';
    if (!d.localityType) d.localityType = 'Commercial';
    if (!d.localityClass) d.localityClass = 'High class';
    if (!d.siteDevStatus) d.siteDevStatus = 'Developed';
    if (!d.proximityAmenities) d.proximityAmenities = 'All civic amenities are within 1-2Kms';
    if (!d.landmark) d.landmark = p.nearestLandmark || '';
    if (!d.municipalLimits) d.municipalLimits = 'Yes (Within CDA limit)';
    if (!d.municipalCorporationName) d.municipalCorporationName = 'Cuttack Municipal Corporation';
    if (!d.siteAccessRoad) d.siteAccessRoad = '';
    if (!d.basicAmenitiesAvailable) d.basicAmenitiesAvailable = 'Yes';
    if (!d.marketability) d.marketability = 'Good';
    if (!d.electricityMeterNo) d.electricityMeterNo = 'Not seen';

    // 21. Floor Wise Area Matrix
    if (!d.actualBuaBase) d.actualBuaBase = 'Nil';
    if (!d.actualBuaStilt) d.actualBuaStilt = 'Nil';
    if (!d.actualBuaGround) d.actualBuaGround = '';
    if (!d.actualBuaFirst) d.actualBuaFirst = '';
    if (!d.actualBuaSecond) d.actualBuaSecond = '';
    if (!d.actualBuaThird) d.actualBuaThird = 'Nil';

    if (!d.permissibleBuaBase) d.permissibleBuaBase = 'Nil';
    if (!d.permissibleBuaStilt) d.permissibleBuaStilt = 'Nil';
    if (!d.permissibleBuaGround) d.permissibleBuaGround = 'NA';
    if (!d.permissibleBuaFirst) d.permissibleBuaFirst = 'NA';
    if (!d.permissibleBuaSecond) d.permissibleBuaSecond = 'NA';
    if (!d.permissibleBuaThird) d.permissibleBuaThird = 'Nil';

    if (!d.extraCoverageBase) d.extraCoverageBase = 'NA';
    if (!d.extraCoverageStilt) d.extraCoverageStilt = 'NA';
    if (!d.extraCoverageGround) d.extraCoverageGround = 'NA';
    if (!d.extraCoverageFirst) d.extraCoverageFirst = 'NA';
    if (!d.extraCoverageSecond) d.extraCoverageSecond = 'NA';
    if (!d.extraCoverageThird) d.extraCoverageThird = 'NA';

    if (!d.totalActualBua) d.totalActualBua = '';
    if (!d.totalPermissibleBua) d.totalPermissibleBua = 'NA';
    if (!d.saleableArea) d.saleableArea = 'NA';
    if (!d.compositeExtraCoverage) d.compositeExtraCoverage = 'NA';

    // 22. Valuation & Rates
    if (!d.landArea) d.landArea = '';
    if (!d.landRate) d.landRate = '';
    if (!d.landValue) d.landValue = '0';

    if (!d.constArea) d.constArea = '';
    if (!d.constRate) d.constRate = '';
    if (!d.buildingValue) d.buildingValue = '';

    if (!d.stageOfConstruction) d.stageOfConstruction = '100%';
    if (!d.stagePercent) d.stagePercent = '100%';
    if (!d.recommendedPercent) d.recommendedPercent = '100%';
    if (!d.marketValue) d.marketValue = '';
    if (!d.distressValue) d.distressValue = '';
    if (!d.circleRate) d.circleRate = '';

    // Extra Amenities
    if (!d.amenityCarParking) d.amenityCarParking = '1 Cov. car parking space';
    if (!d.amenityPlc) d.amenityPlc = 'NA';
    if (!d.amenityIdc) d.amenityIdc = 'NA';
    if (!d.amenityEdc) d.amenityEdc = 'NA';
    if (!d.amenityPowerBackup) d.amenityPowerBackup = 'NA';
    if (!d.amenityClub) d.amenityClub = 'NA';
    if (!d.amenityOther) d.amenityOther = 'NA';
    if (!d.totalAmenitiesCharges) d.totalAmenitiesCharges = '0';
    if (!d.approxRentals) d.approxRentals = '';

    // Structural specs
    if (!d.seismicZone) d.seismicZone = 'III';
    if (!d.footingType) d.footingType = 'Independent Footing';
    if (!d.roofType) d.roofType = 'RCC slab';
    if (!d.masonryType) d.masonryType = 'Brick';
    if (!d.soilType) d.soilType = 'Red soil';

    // Floorwise Details of Usage of Property
    if (!d.floorwiseUsageRows) {
      d.floorwiseUsageRows = [
        { floor: 'Basement', usage: 'NA', units: '', tenantedYear: '', rentalAssessment: '' },
        { floor: 'Ground', usage: 'Commercial', units: '', tenantedYear: 'Rented', rentalAssessment: 'NA' },
        { floor: 'First', usage: 'Commercial', units: '', tenantedYear: 'Rented', rentalAssessment: 'NA' },
        { floor: 'Second', usage: 'NA', units: '', tenantedYear: 'NA', rentalAssessment: 'NA' },
        { floor: 'Third', usage: 'NA', units: '', tenantedYear: '', rentalAssessment: '' },
        { floor: '4th/above', usage: 'NA', units: '', tenantedYear: '', rentalAssessment: '' },
      ];
    }

    // Remarks & Coordinates
    if (!d.remarks) d.remarks = '';
    if (!d.latitude) d.latitude = p.latitude || p.propertyLatitude || '';
    if (!d.longitude) d.longitude = p.longitude || p.propertyLongitude || '';

    // Attachments
    if (!d.documentImages) d.documentImages = [];
    if (!d.documentImageNames) d.documentImageNames = [];
    if (!d.locationMapImages) d.locationMapImages = [];
    if (!d.mouzaMapImages) d.mouzaMapImages = [];
    if (!d.sketchMapImages) d.sketchMapImages = [];
    if (!d.cadastralMapImages) d.cadastralMapImages = [];
    if (!d.bdaMapImages) d.bdaMapImages = [];
    if (!d.propertyImages) d.propertyImages = [];
    if (!d.propertyImageNames) d.propertyImageNames = [];

    return d;
  });

  // Real-time Valuation auto-calculation
  const handleChange = useCallback((key: string, value: any) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };

      if (
        key === 'landArea' ||
        key === 'landRate' ||
        key === 'constArea' ||
        key === 'constRate' ||
        key === 'totalAmenitiesCharges'
      ) {
        const lArea = parseFloat(String(next.landArea).replace(/[^0-9.]/g, '')) || 0;
        const lRate = parseFloat(String(next.landRate).replace(/[^0-9.]/g, '')) || 0;
        const cArea = parseFloat(String(next.constArea).replace(/[^0-9.]/g, '')) || 0;
        const cRate = parseFloat(String(next.constRate).replace(/[^0-9.]/g, '')) || 0;
        const amenVal = parseFloat(String(next.totalAmenitiesCharges).replace(/[^0-9.]/g, '')) || 0;

        const lVal = Math.round(lArea * lRate);
        const cVal = Math.round(cArea * cRate);
        const bldgVal = cVal + amenVal;
        const mVal = lVal + bldgVal;
        const dVal = Math.round(mVal * 0.80);

        next.landValue = lVal.toString();
        next.buildingValue = bldgVal.toString();
        next.marketValue = mVal.toString();
        next.distressValue = dVal.toString();
      }

      return next;
    });
  }, []);

  const handleFloorwiseUsageChange = useCallback((index: number, colKey: string, val: string) => {
    setFields(prev => {
      const currentRows = [...(prev.floorwiseUsageRows || [])];
      if (currentRows[index]) {
        currentRows[index] = { ...currentRows[index], [colKey]: val };
      }
      return { ...prev, floorwiseUsageRows: currentRows };
    });
  }, []);

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setAutoSaveStatus('saving');
      setMessage(null);

      const res = await saveReportDraft(projectId, fields);
      if (res?.success) {
        setAutoSaveStatus('saved');
        setMessage({ text: 'Report draft saved successfully', type: 'success' });
        setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } else {
        setAutoSaveStatus('error');
        setMessage({ text: res?.error || 'Failed to save draft', type: 'error' });
      }
    } catch (err: any) {
      setAutoSaveStatus('error');
      setMessage({ text: err.message || 'Error occurred while saving', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFPoonawallaFinanceRenderer({
        ...fields,
        projectCode: projectCode || fields.refNo,
      });
      await renderer.generateAndDownload(`Valuation_Report_Poonawalla_${projectCode || fields.refNo || 'Report'}.pdf`);
    } catch (err: any) {
      alert(`PDF Generation failed: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 w-full max-w-6xl mx-auto">
      {/* ── Universal Bank Report Header ── */}
      <BankReportHeader
        bankName="POONAWALLA FINCORP LTD"
        subclass="Standard"
        description="Technical Valuation Report for Poonawalla Fincorp / Finance (LAP / Mortgage)"
        projectCode={projectCode || fields.refNo}
        onResetWizard={onResetWizard}
        earliestVisit={earliestVisit}
        onSyncInspectionDate={
          earliestVisit
            ? () => {
                const dt = formatReportDate(earliestVisit.date);
                handleChange('dateOfVisit', dt);
              }
            : undefined
        }
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        <div className="flex-1 min-w-0 space-y-6 w-full">

          {/* Section 1: Header & Application Details */}
          <div id="sec-meta">
            <Section title="Header & Application Details" number={1}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Ref No. *">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.refNo || ''}
                    onChange={e => handleChange('refNo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 9856651"
                  />
                </Field>
                <Field label="Deal No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dealNo || ''}
                    onChange={e => handleChange('dealNo', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. VAL/OCT/2025/06"
                  />
                </Field>
                <Field label="Valuer Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerName || 'S MOHANTY ASSOCIATES'}
                    onChange={e => handleChange('valuerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Vertical">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.vertical || 'NA'}
                    onChange={e => handleChange('vertical', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Branch Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.branchName || ''}
                    onChange={e => handleChange('branchName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Fullerton"
                  />
                </Field>
                <Field label="Type of Case">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.typeOfCase || 'LAP'}
                    onChange={e => handleChange('typeOfCase', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <BaseDateInput
                  label="Date of Initiate"
                  value={fields.dateOfInitiate || ''}
                  onChange={val => handleChange('dateOfInitiate', val)}
                  disabled={isReadOnly}
                />
                <BaseDateInput
                  label="Date of Visit / Inspection"
                  value={fields.dateOfVisit || ''}
                  onChange={val => handleChange('dateOfVisit', val)}
                  disabled={isReadOnly}
                />
                <BaseDateInput
                  label="Date of Report"
                  value={fields.dateOfReport || ''}
                  onChange={val => handleChange('dateOfReport', val)}
                  disabled={isReadOnly}
                />
              </div>

              <div className="mt-4">
                <Field label="Contacted Person at site (ID proof details)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.contactPerson || ''}
                    onChange={e => handleChange('contactPerson', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Krishna Pratima Basu, Mob- 9437163005"
                  />
                </Field>
              </div>

              <div className="border-t border-gray-100 my-4" />

              {/* Items 1 to 4 */}
              <div className="space-y-4">
                <Field label="1. Name/s of the applicant/s *">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.applicantName || ''}
                    onChange={e => handleChange('applicantName', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Applicant full name(s)"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="2. Type of property">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propertyType || ''}
                      onChange={e => handleChange('propertyType', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. G+2 storied commercial building"
                    />
                  </Field>
                  <Field label="Current Usage">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.currentUsage || 'Commercial'}
                      onChange={e => handleChange('currentUsage', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="space-y-3">
                  <Field label="3. Address as per firing">
                    <textarea
                      rows={2}
                      className={textareaCls}
                      value={fields.addressAsPerFiring || ''}
                      onChange={e => handleChange('addressAsPerFiring', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Address as recorded in loan firing"
                    />
                  </Field>
                  <Field label="Address at site">
                    <textarea
                      rows={2}
                      className={textareaCls}
                      value={fields.addressAtSite || ''}
                      onChange={e => handleChange('addressAtSite', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Physical site address with Plot, Khata, Mouza"
                    />
                  </Field>
                  <Field label="Address as per document">
                    <textarea
                      rows={2}
                      className={textareaCls}
                      value={fields.addressAsPerDocument || ''}
                      onChange={e => handleChange('addressAsPerDocument', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Legal ownership deed address"
                    />
                  </Field>
                </div>

                <Field label="4. Has the valuator done valuation of this property before this? If yes, when, for whom?">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.previousValuation || 'No'}
                    onChange={e => handleChange('previousValuation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 2: Sanction Plan & Documents Details */}
          <div id="sec-sanction">
            <Section title="Sanction Plan Approval & Other Documents" number={2}>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    5. Sanctioned Plans Verification Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Field label="Plan No.">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.sanctionPlanNo || ''}
                        onChange={e => handleChange('sanctionPlanNo', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. 653/GCIT"
                      />
                    </Field>
                    <Field label="Structure">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.sanctionStructure || 'NA'}
                        onChange={e => handleChange('sanctionStructure', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Authority">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.sanctionAuthority || 'CDA'}
                        onChange={e => handleChange('sanctionAuthority', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. CDA / BDA / CMC"
                      />
                    </Field>
                    <Field label="Approved Area">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.sanctionArea || 'NA'}
                        onChange={e => handleChange('sanctionArea', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="6. Property Documents verified">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.documentsVerified || ''}
                    onChange={e => handleChange('documentsVerified', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Copy of Sale Deed, Gift deed, ROR, Approved plan"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="7. Ownership type">
                    <select
                      className={selectCls}
                      value={fields.ownershipType || 'Freehold'}
                      onChange={e => handleChange('ownershipType', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Freehold">Freehold</option>
                      <option value="Leasehold">Leasehold</option>
                    </select>
                  </Field>

                  <Field label="8. Construction as per approved Building plan/Bye Laws">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.constructionCompliance || 'Bye Laws'}
                      onChange={e => handleChange('constructionCompliance', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="9. Permissible usage allows as per master plan">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.permissibleUsage || 'Master Plan not publish'}
                      onChange={e => handleChange('permissibleUsage', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="10. Is the property in demolition list, if yes Details">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.demolitionList || 'Not observed'}
                      onChange={e => handleChange('demolitionList', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 3: Boundaries & Occupancy Details */}
          <div id="sec-boundaries">
            <Section title="Boundaries & Occupancy Details" number={3}>
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  11. Boundaries as Per Documents & Site
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-3 border-r">Boundaries</th>
                        <th className="p-3 border-r">EAST</th>
                        <th className="p-3 border-r">WEST</th>
                        <th className="p-3 border-r">NORTH</th>
                        <th className="p-3">SOUTH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-3 font-medium bg-slate-50/50 border-r">As per Sale deed</td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryEastDoc || ''}
                            onChange={e => handleChange('boundaryEastDoc', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryWestDoc || ''}
                            onChange={e => handleChange('boundaryWestDoc', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryNorthDoc || ''}
                            onChange={e => handleChange('boundaryNorthDoc', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundarySouthDoc || ''}
                            onChange={e => handleChange('boundarySouthDoc', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium bg-slate-50/50 border-r">At site</td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryEastSite || ''}
                            onChange={e => handleChange('boundaryEastSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryWestSite || ''}
                            onChange={e => handleChange('boundaryWestSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryNorthSite || ''}
                            onChange={e => handleChange('boundaryNorthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundarySouthSite || ''}
                            onChange={e => handleChange('boundarySouthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Field label="Boundaries Matching Status">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.boundariesMatching || 'Partly matching'}
                    onChange={e => handleChange('boundariesMatching', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="border-t border-gray-100 my-4" />

                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  12. Occupant Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Vacant / Occupied / Tenant">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.occupancyStatus || 'Occupied'}
                      onChange={e => handleChange('occupancyStatus', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Name of Occupant">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.occupantName || ''}
                      onChange={e => handleChange('occupantName', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. Partly self occupied & Partly rented"
                    />
                  </Field>
                  <Field label="Occupied from">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.occupiedFrom || 'NA'}
                      onChange={e => handleChange('occupiedFrom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Relation with applicant">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.occupantRelation || 'NA'}
                      onChange={e => handleChange('occupantRelation', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 4: Building & Physical Details */}
          <div id="sec-building">
            <Section title="Building & Locality Specifications" number={4}>
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  13. Building Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Field label="Property Demarcation">
                    <select
                      className={selectCls}
                      value={fields.propertyDemarcation || 'Yes'}
                      onChange={e => handleChange('propertyDemarcation', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </Field>
                  <Field label="Identified through">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.identifiedThrough || 'Customer'}
                      onChange={e => handleChange('identifiedThrough', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Type of structure">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.structureType || 'RCC'}
                      onChange={e => handleChange('structureType', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Plot Area (SqFt)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.plotArea || ''}
                      onChange={e => handleChange('plotArea', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 3354"
                    />
                  </Field>

                  <Field label="No. of Floors">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.noOfFloors || 'G+2'}
                      onChange={e => handleChange('noOfFloors', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Floor Valued">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.floorValued || 'G+2'}
                      onChange={e => handleChange('floorValued', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Units per floor">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.unitsPerFloor || 'NA'}
                      onChange={e => handleChange('unitsPerFloor', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="No. of lifts">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.liftsCount || 'Nil'}
                      onChange={e => handleChange('liftsCount', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="border-t border-gray-100 my-4" />

                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  14. Unit Details
                </div>
                <Field label="No. of rooms">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitRooms || ''}
                    onChange={e => handleChange('unitRooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. GF--Godown, 2-Toilets, FF-- 1-Office (The new India assurance co. Ltd.)"
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Super Built up area (Permissible)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.sbuaPermissible || 'NA'}
                      onChange={e => handleChange('sbuaPermissible', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Carpet area (Of Actual Area)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.carpetArea || ''}
                      onChange={e => handleChange('carpetArea', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 3708sqft (G+1 Actual)"
                    />
                  </Field>
                  <Field label="Remarks on view from property">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.viewRemarks || 'NA'}
                      onChange={e => handleChange('viewRemarks', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="border-t border-gray-100 my-4" />

                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  15 to 20. Locality & Physical Parameters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Field label="15. Quality of construction">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.constructionQuality || 'Average'}
                      onChange={e => handleChange('constructionQuality', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Interiors/Exteriors">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.interiorsExteriors || 'Average'}
                      onChange={e => handleChange('interiorsExteriors', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="16. Age of the property">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propertyAge || ''}
                      onChange={e => handleChange('propertyAge', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 30-Years"
                    />
                  </Field>
                  <Field label="Locality Type">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.localityType || 'Commercial'}
                      onChange={e => handleChange('localityType', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="Class of Locality">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.localityClass || 'High class'}
                      onChange={e => handleChange('localityClass', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Site Status">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.siteDevStatus || 'Developed'}
                      onChange={e => handleChange('siteDevStatus', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Civic Amenities Proximity" className="md:col-span-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.proximityAmenities || 'All civic amenities are within 1-2Kms'}
                      onChange={e => handleChange('proximityAmenities', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="17. Close Vicinity / Landmark" className="md:col-span-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.landmark || ''}
                      onChange={e => handleChange('landmark', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. Near Gayatri Saktipitha, Chahata Ghat, Cuttack"
                    />
                  </Field>
                  <Field label="18. Within Municipal Limits">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.municipalLimits || 'Yes (Within CDA limit)'}
                      onChange={e => handleChange('municipalLimits', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Municipal Corporation Name">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.municipalCorporationName || 'Cuttack Municipal Corporation'}
                      onChange={e => handleChange('municipalCorporationName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="19. Site Access">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.siteAccessRoad || ''}
                      onChange={e => handleChange('siteAccessRoad', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 15-ft wide WBM road"
                    />
                  </Field>
                  <Field label="Basic Amenities Available">
                    <select
                      className={selectCls}
                      value={fields.basicAmenitiesAvailable || 'Yes'}
                      onChange={e => handleChange('basicAmenitiesAvailable', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </Field>
                  <Field label="20. Marketability">
                    <select
                      className={selectCls}
                      value={fields.marketability || 'Good'}
                      onChange={e => handleChange('marketability', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Low">Low</option>
                    </select>
                  </Field>
                  <Field label="Electricity Meter No.">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.electricityMeterNo || 'Not seen'}
                      onChange={e => handleChange('electricityMeterNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 5: Floor Wise Area Matrix */}
          <div id="sec-floor-area">
            <Section title="Floor Wise Area Matrix (Item 21)" number={5}>
              <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white mb-4">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-3 border-r">Area's</th>
                      <th className="p-2 border-r text-center">Base.</th>
                      <th className="p-2 border-r text-center">Stilt</th>
                      <th className="p-2 border-r text-center">Ground</th>
                      <th className="p-2 border-r text-center">First</th>
                      <th className="p-2 border-r text-center">Second</th>
                      <th className="p-2 text-center">Third/above</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-3 font-medium bg-slate-50/50 border-r">Actual (SqFt)</td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.actualBuaBase || 'Nil'} onChange={e => handleChange('actualBuaBase', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.actualBuaStilt || 'Nil'} onChange={e => handleChange('actualBuaStilt', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.actualBuaGround || ''} onChange={e => handleChange('actualBuaGround', e.target.value)} disabled={isReadOnly} placeholder="2180" /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.actualBuaFirst || ''} onChange={e => handleChange('actualBuaFirst', e.target.value)} disabled={isReadOnly} placeholder="2180" /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.actualBuaSecond || ''} onChange={e => handleChange('actualBuaSecond', e.target.value)} disabled={isReadOnly} placeholder="2180" /></td>
                      <td className="p-1"><input type="text" className={inputCls} value={fields.actualBuaThird || 'Nil'} onChange={e => handleChange('actualBuaThird', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium bg-slate-50/50 border-r">Permissible (SqFt)</td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.permissibleBuaBase || 'Nil'} onChange={e => handleChange('permissibleBuaBase', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.permissibleBuaStilt || 'Nil'} onChange={e => handleChange('permissibleBuaStilt', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.permissibleBuaGround || 'NA'} onChange={e => handleChange('permissibleBuaGround', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.permissibleBuaFirst || 'NA'} onChange={e => handleChange('permissibleBuaFirst', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.permissibleBuaSecond || 'NA'} onChange={e => handleChange('permissibleBuaSecond', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1"><input type="text" className={inputCls} value={fields.permissibleBuaThird || 'Nil'} onChange={e => handleChange('permissibleBuaThird', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium bg-slate-50/50 border-r">Extra Coverage (%)</td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.extraCoverageBase || 'NA'} onChange={e => handleChange('extraCoverageBase', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.extraCoverageStilt || 'NA'} onChange={e => handleChange('extraCoverageStilt', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.extraCoverageGround || 'NA'} onChange={e => handleChange('extraCoverageGround', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.extraCoverageFirst || 'NA'} onChange={e => handleChange('extraCoverageFirst', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1 border-r"><input type="text" className={inputCls} value={fields.extraCoverageSecond || 'NA'} onChange={e => handleChange('extraCoverageSecond', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-1"><input type="text" className={inputCls} value={fields.extraCoverageThird || 'NA'} onChange={e => handleChange('extraCoverageThird', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Total Actual (In SqFt)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalActualBua || ''}
                    onChange={e => handleChange('totalActualBua', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 6540"
                  />
                </Field>
                <Field label="Total Permissible (In SqFt)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalPermissibleBua || 'NA'}
                    onChange={e => handleChange('totalPermissibleBua', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Saleable (In SqFt)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.saleableArea || 'NA'}
                    onChange={e => handleChange('saleableArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Composite Extra Coverage's">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.compositeExtraCoverage || 'NA'}
                    onChange={e => handleChange('compositeExtraCoverage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 6: Valuation & Rates Breakdown */}
          <div id="sec-valuation">
            <Section title="Valuation & Rates Breakdown (Item 22)" number={6}>
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  (A) Description of Constructed Area and Rates
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="md:col-span-3 font-medium text-slate-700">1. Land (sqyds/sqft) as per sale deed</div>
                  <Field label="Land Area (SqFt)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.landArea || ''}
                      onChange={e => handleChange('landArea', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 3354"
                    />
                  </Field>
                  <Field label="Land Rate (Rs./SqFt)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.landRate || ''}
                      onChange={e => handleChange('landRate', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Land Amount (in Rs.) [Auto]">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 font-semibold`}
                      value={fields.landValue ? `Rs. ${formatIndianCurrency(fields.landValue)}/-` : 'Rs. 0/-'}
                      readOnly
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="md:col-span-3 font-medium text-slate-700">2. Construction / Composite Rate (SqFt) Actual</div>
                  <Field label="Constructed Area (SqFt)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.constArea || ''}
                      onChange={e => handleChange('constArea', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 4360"
                    />
                  </Field>
                  <Field label="Rate (Rs./SqFt)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.constRate || ''}
                      onChange={e => handleChange('constRate', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. 8000"
                    />
                  </Field>
                  <Field label="Construction Amount (in Rs.) [Auto]">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 font-semibold text-blue-700`}
                      value={fields.buildingValue ? `Rs. ${formatIndianCurrency(fields.buildingValue)}/-` : 'Rs. 0/-'}
                      readOnly
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Stage of Construction">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.stageOfConstruction || '100%'}
                      onChange={e => handleChange('stageOfConstruction', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Stage %">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.stagePercent || '100%'}
                      onChange={e => handleChange('stagePercent', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Recommended %">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.recommendedPercent || '100%'}
                      onChange={e => handleChange('recommendedPercent', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="border-t border-gray-100 my-4" />

                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  (B) Value of Extra Amenities
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Car Parking">
                    <input type="text" className={inputCls} value={fields.amenityCarParking || '1 Cov. car parking space'} onChange={e => handleChange('amenityCarParking', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="PLC">
                    <input type="text" className={inputCls} value={fields.amenityPlc || 'NA'} onChange={e => handleChange('amenityPlc', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="IDC">
                    <input type="text" className={inputCls} value={fields.amenityIdc || 'NA'} onChange={e => handleChange('amenityIdc', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="EDC">
                    <input type="text" className={inputCls} value={fields.amenityEdc || 'NA'} onChange={e => handleChange('amenityEdc', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Power Backup">
                    <input type="text" className={inputCls} value={fields.amenityPowerBackup || 'NA'} onChange={e => handleChange('amenityPowerBackup', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Club Membership">
                    <input type="text" className={inputCls} value={fields.amenityClub || 'NA'} onChange={e => handleChange('amenityClub', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Other Amenities">
                    <input type="text" className={inputCls} value={fields.amenityOther || 'NA'} onChange={e => handleChange('amenityOther', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Total Amenities Charges (in Rs.)">
                    <input type="text" className={inputCls} value={fields.totalAmenitiesCharges || '0'} onChange={e => handleChange('totalAmenitiesCharges', e.target.value)} disabled={isReadOnly} placeholder="0" />
                  </Field>
                </div>

                {/* Valuation Grand Summary Card */}
                <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm space-y-4">
                  <div className="text-sm font-bold uppercase tracking-wider text-amber-900">
                    Valuation Summary & Final Assessment
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
                      <div className="text-xs text-slate-500 font-medium">Market Value of Property (Land + Building):</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {fields.marketValue ? `Rs. ${formatIndianCurrency(fields.marketValue)}/-` : 'Rs. 0/-'}
                      </div>
                      <div className="text-xs text-slate-500 italic mt-0.5">
                        {fields.marketValue && Number(fields.marketValue) > 0 ? rupeesInWords(Number(fields.marketValue)) : ''}
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200">
                      <div className="text-xs text-amber-800 font-semibold">Forced / Distressed Sale Value (80%):</div>
                      <div className="text-xl font-bold text-amber-700 mt-1">
                        {fields.distressValue ? `Rs. ${formatIndianCurrency(fields.distressValue)}/-` : 'Rs. 0/-'}
                      </div>
                      <div className="text-xs text-amber-600 italic mt-0.5">
                        {fields.distressValue && Number(fields.distressValue) > 0 ? rupeesInWords(Number(fields.distressValue)) : ''}
                      </div>
                    </div>

                    <Field label="Circle Rate (in Rs.)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.circleRate || ''}
                        onChange={e => handleChange('circleRate', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="NA"
                      />
                    </Field>

                    <Field label="Approx. Rentals (per month)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.approxRentals || ''}
                        onChange={e => handleChange('approxRentals', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Rs. 40000/- per month"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 7: Structural & Engineering Specifications */}
          <div id="sec-specs">
            <Section title="Structural & Engineering Specifications" number={7}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Seismic Zone (I/II/III/IV/V)">
                  <select
                    className={selectCls}
                    value={fields.seismicZone || 'III'}
                    onChange={e => handleChange('seismicZone', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="I">Zone I</option>
                    <option value="II">Zone II</option>
                    <option value="III">Zone III</option>
                    <option value="IV">Zone IV</option>
                    <option value="V">Zone V</option>
                  </select>
                </Field>
                <Field label="Structure Type">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.structureType || 'RCC'}
                    onChange={e => handleChange('structureType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Footing Type">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.footingType || 'Independent Footing'}
                    onChange={e => handleChange('footingType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Roof Type">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.roofType || 'RCC slab'}
                    onChange={e => handleChange('roofType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Masonry">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.masonryType || 'Brick'}
                    onChange={e => handleChange('masonryType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Soil">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.soilType || 'Red soil'}
                    onChange={e => handleChange('soilType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Section 8: Floorwise Details of Usage of Property */}
          <div id="sec-usage">
            <Section title="Floorwise Details of Usage of Property" number={8}>
              <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-3 border-r w-28">Floor</th>
                      <th className="p-3 border-r">Usage</th>
                      <th className="p-3 border-r w-20">Units</th>
                      <th className="p-3 border-r">If Tenanted, Yr of Current Tenancy</th>
                      <th className="p-3">Rental Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(fields.floorwiseUsageRows || []).map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium bg-slate-50/50 border-r">{row.floor}</td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.usage || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'usage', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.units || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'units', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.tenantedYear || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'tenantedYear', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.rentalAssessment || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'rentalAssessment', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          {/* Section 9: Remarks, Valuation Synthesis & Declaration */}
          <div id="sec-remarks">
            <Section title="Remarks & Declaration" number={9}>
              <div className="space-y-6">
                <Field label="Remarks & Valuation Synthesis (Justified alignment in report)">
                  <textarea
                    rows={6}
                    className={textareaCls}
                    value={fields.remarks || ''}
                    onChange={e => handleChange('remarks', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Enter comprehensive valuation synthesis, approvals history, tenant occupancy, and rate rationale..."
                  />
                  {fields.remarks && (
                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                        Rendered Justified Preview:
                      </div>
                      <p className={renderedParagraphCls}>
                        {fields.remarks}
                      </p>
                    </div>
                  )}
                </Field>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Standard Valuer Declaration (Statutory 5-Point Clause)
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className={renderedDeclarationPointCls}>
                      1. The property is physically inspected by our Engineer/Representative.
                    </div>
                    <div className={renderedDeclarationPointCls}>
                      2. We have no direct/indirect interest in the property valued.
                    </div>
                    <div className={renderedDeclarationPointCls}>
                      3. The information furnished above is true & correct to the best of our knowledge and belief and takes account information and or document submitted or shown to us by the client.
                    </div>
                    <div className={renderedDeclarationPointCls}>
                      4. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.
                    </div>
                    <div className={renderedDeclarationPointCls}>
                      5. The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair market value of such properties/localities may increase or decrease depending on the future market conditions and scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <div className="text-xs font-bold text-slate-800">M/s. S MOHANTY ASSOCIATES (Empanelled Valuer)</div>
                  <div className="text-xs text-slate-500 italic mt-0.5">(Authorized Signatory)</div>
                </div>
              </div>
            </Section>
          </div>

          {/* Section 10: Documents */}
          <div id="sec-documents">
            <BaseDocumentsSection
              title="Documents"
              sectionId="sec-documents"
              sectionNumber={10}
              documentImages={fields.documentImages || []}
              documentImageNames={fields.documentImageNames || []}
              isReadOnly={isReadOnly}
              onRemoveDocument={idx => {
                handleChange('documentImages', (fields.documentImages || []).filter((_: any, i: number) => i !== idx));
                handleChange('documentImageNames', (fields.documentImageNames || []).filter((_: any, i: number) => i !== idx));
              }}
              onDocumentNameChange={(idx, name) => {
                const arr = [...(fields.documentImageNames || [])];
                while (arr.length <= idx) arr.push('');
                arr[idx] = name;
                handleChange('documentImageNames', arr);
              }}
              onReorderDocuments={(newDocs, newNames) => {
                handleChange('documentImages', newDocs);
                handleChange('documentImageNames', newNames);
              }}
            />
          </div>

          {/* Section 11: Location Maps */}
          <div id="sec-maps">
            <BaseMapsSection
              title="Location Maps"
              sectionId="sec-maps"
              sectionNumber={11}
              locationMapImages={fields.locationMapImages || []}
              mouzaMapImages={fields.mouzaMapImages || []}
              sketchMapImages={fields.sketchMapImages || []}
              cadastralMapImages={fields.cadastralMapImages || []}
              bdaMapImages={fields.bdaMapImages || []}
              latitude={fields.latitude || ''}
              longitude={fields.longitude || ''}
              isReadOnly={isReadOnly}
              onLocationMapRemove={idx => {
                handleChange('locationMapImages', (fields.locationMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
              onMouzaMapRemove={idx => {
                handleChange('mouzaMapImages', (fields.mouzaMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
              onSketchMapRemove={idx => {
                handleChange('sketchMapImages', (fields.sketchMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
              onCadastralMapRemove={idx => {
                handleChange('cadastralMapImages', (fields.cadastralMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
              onBdaMapRemove={idx => {
                handleChange('bdaMapImages', (fields.bdaMapImages || []).filter((_: any, i: number) => i !== idx));
              }}
            />
          </div>

          {/* Section 12: Photographs */}
          <div id="sec-photos">
            <BasePhotographsSection
              title="Property Photographs"
              sectionId="sec-photos"
              sectionNumber={12}
              propertyImages={fields.propertyImages || []}
              propertyImageNames={fields.propertyImageNames || []}
              isReadOnly={isReadOnly}
              bucketCount={bucketImages?.length || 0}
              onOpenBucketPicker={() => {
                setPhotoModalTarget('photos');
                setShowBucketModal(true);
              }}
              onRemoveImage={idx => {
                handleChange('propertyImages', (fields.propertyImages || []).filter((_: any, i: number) => i !== idx));
                handleChange('propertyImageNames', (fields.propertyImageNames || []).filter((_: any, i: number) => i !== idx));
              }}
              onImageNameChange={(idx, name) => {
                const arr = [...(fields.propertyImageNames || [])];
                while (arr.length <= idx) arr.push('');
                arr[idx] = name;
                handleChange('propertyImageNames', arr);
              }}
              onReorderImages={(newImgs, newNames) => {
                handleChange('propertyImages', newImgs);
                handleChange('propertyPhotoNames', newNames);
              }}
            />
          </div>
        </div>

        {/* ── Floating Navigator (Right Sidebar) ── */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* ── Report Action Bar (Bottom) ── */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={saving || previewing}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handleDownloadPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* ── Photo Bucket Picker Modal ── */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            if (photoModalTarget === 'documents') {
              handleChange('documentImages', [...(fields.documentImages || []), ...selectedUrls]);
              handleChange('documentImageNames', [
                ...(fields.documentImageNames || []),
                ...selectedUrls.map((_, i) => `Document ${(fields.documentImages?.length || 0) + i + 1}`),
              ]);
            } else if (photoModalTarget === 'maps') {
              handleChange('locationMapImages', [...(fields.locationMapImages || []), ...selectedUrls]);
            } else {
              handleChange('propertyImages', [...(fields.propertyImages || []), ...selectedUrls]);
              handleChange('propertyImageNames', [
                ...(fields.propertyImageNames || []),
                ...selectedUrls.map((_, i) => `Photograph ${(fields.propertyImages?.length || 0) + i + 1}`),
              ]);
            }
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
