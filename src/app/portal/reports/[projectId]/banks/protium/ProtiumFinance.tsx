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
import { PDFProtiumFinanceRenderer } from '@/lib/banks/pdf-protium-finance-renderer';

export const PROTIUM_FINANCE_CONFIG: BankConfig = {
  bankId: 'PROTIUM FINANCE LIMITED',
  subTemplateId: '',
  displayName: 'Protium Finance Limited',
  defaultValues: {
    purpose: 'Mortgage / Financial Valuation / LAP',
  },
  getPDFRenderer: (fields: any, projectCode?: string) =>
    new PDFProtiumFinanceRenderer({ ...fields, projectCode }),
};

export interface ProtiumFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function ProtiumFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: ProtiumFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || userRole === 'viewer' || status === 'completed';

  // State initialization with pre-fill bindings
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const raw = rawInitialFields || {};
    const earliestVisit = getEarliestFieldVisit(bucketImages, prefill);
    const visitDate = raw.dateOfTechnicalVisit || raw.inspectionDate || earliestVisit?.date || '';
    const repDate = raw.reportDate || formatReportDate(new Date());

    return {
      // Header metadata
      leadIdLan: raw.leadIdLan || raw.leadId || raw.applicationNo || projectCode || '',
      reportDate: repDate,
      valuerName: raw.valuerName || 'M/S. S MOHANTY ASSOCIATES',

      // Section A: General Details
      applicantName: raw.applicantName || prefill?.contactName || '',
      propertyOwner: raw.propertyOwner || raw.ownerName || '',
      propertyAddressSite: raw.propertyAddressSite || raw.propertyAddress || prefill?.propertyAddress || '',
      legalAddress: raw.legalAddress || raw.propertyAddress || prefill?.propertyAddress || '',
      ownerContactNo: raw.ownerContactNo || prefill?.contactPhone || '',
      tenantIfApplicable: raw.tenantIfApplicable || 'NA',
      landmark: raw.landmark || '',
      latitude: raw.latitude || raw.propertyLatitude || '',
      longitude: raw.longitude || raw.propertyLongitude || '',
      dateOfTechnicalVisit: visitDate,
      propertyUsage: raw.propertyUsage || 'Commercial',
      propertyUsageDoc: raw.propertyUsageDoc || 'NA',
      occupancy: raw.occupancy || 'Self-Occupied',
      marketability: raw.marketability || 'Good',
      frontRoadWidth: raw.frontRoadWidth || '',

      // Section B: Surrounding Locality Details
      wardMunicipalNo: raw.wardMunicipalNo || 'NA',
      typeOfLocality: raw.typeOfLocality || 'Commercial',
      distanceBusStop: raw.distanceBusStop || '',
      distanceHospital: raw.distanceHospital || '',
      distanceRailway: raw.distanceRailway || '',
      siteAccess: raw.siteAccess || 'NA',
      planProvidedStatus: raw.planProvidedStatus || 'Plan not provided.',
      corporationLimit: raw.corporationLimit || 'NA',
      municipalityLimit: raw.municipalityLimit || '',
      panchayatUnion: raw.panchayatUnion || 'NA',
      approachRoadCondition: raw.approachRoadCondition || 'Good',
      approachRoadWidth: raw.approachRoadWidth || '',

      // Section C: Property Details
      noOfFloors: raw.noOfFloors || '',
      floorWiseUsage: raw.floorWiseUsage || 'NA',
      ageOfProperty: raw.ageOfProperty || '',
      residualAge: raw.residualAge || '',

      // Boundaries (4 directions)
      boundaryNorthDoc: raw.boundaryNorthDoc || '',
      boundaryNorthSite: raw.boundaryNorthSite || '',
      boundaryNorthPlan: raw.boundaryNorthPlan || 'NA',

      boundarySouthDoc: raw.boundarySouthDoc || '',
      boundarySouthSite: raw.boundarySouthSite || '',
      boundarySouthPlan: raw.boundarySouthPlan || 'NA',

      boundaryEastDoc: raw.boundaryEastDoc || '',
      boundaryEastSite: raw.boundaryEastSite || '',
      boundaryEastPlan: raw.boundaryEastPlan || 'NA',

      boundaryWestDoc: raw.boundaryWestDoc || '',
      boundaryWestSite: raw.boundaryWestSite || '',
      boundaryWestPlan: raw.boundaryWestPlan || 'NA',

      boundariesMatching: raw.boundariesMatching || 'Yes (Boundary matching as per document)',
      propertyIdentifiedThrough: raw.propertyIdentifiedThrough || 'Shown by Applicant',
      plotDemarcatedAtSite: raw.plotDemarcatedAtSite || 'Yes',
      amenities: raw.amenities || '',

      // Land & Built-up Areas
      landPlotAreaDoc: raw.landPlotAreaDoc || '',
      dimensionNorth: raw.dimensionNorth || '',
      dimensionSouth: raw.dimensionSouth || '',
      dimensionEast: raw.dimensionEast || '',
      dimensionWest: raw.dimensionWest || '',
      totalPlotArea: raw.totalPlotArea || '',
      reductionArea: raw.reductionArea || '',
      netTotalArea: raw.netTotalArea || '',
      landPlotAreaPlan: raw.landPlotAreaPlan || 'NA',
      landPlotAreaSite: raw.landPlotAreaSite || '',
      builtUpAreaPlan: raw.builtUpAreaPlan || 'NA',

      // BUA detailed item list
      buaItems: raw.buaItems || [],
      totalMeasuredBua: raw.totalMeasuredBua || '',
      floorDetailsSummary: raw.floorDetailsSummary || '',
      propertyType: raw.propertyType || 'Row house',
      occupancyStatus: raw.occupancyStatus || 'Self',

      // Section D: Structural Details
      typeOfStructure: raw.typeOfStructure || 'RCC',
      structuralFloorsSummary: raw.structuralFloorsSummary || '',
      noOfWings: raw.noOfWings || 'NA',
      noOfUnitsPerFloor: raw.noOfUnitsPerFloor || 'NA',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      structuralObservation: raw.structuralObservation || 'NA',
      configuration: raw.configuration || 'NA',

      // Section E: Interiors
      flooringFinishing: raw.flooringFinishing || 'Tile / Flooring',
      roofingTerracing: raw.roofingTerracing || 'RCC / GCI roofing',
      qualityOfFixtures: raw.qualityOfFixtures || 'Good',
      doorsWindows: raw.doorsWindows || 'Hard Wood',

      // Section F: Plan Approval Details
      constructionAsPerApprovedPlan: raw.constructionAsPerApprovedPlan || 'Plan not provided',
      detailsOfApprovedPlan: raw.detailsOfApprovedPlan || 'NA',
      constructionPermissionNoDate: raw.constructionPermissionNoDate || 'NA',
      violationsRiskOfDemolition: raw.violationsRiskOfDemolition || 'NA',
      structureConfirmingToLocal: raw.structureConfirmingToLocal || 'NA',

      // Section G: Deviation Details
      deviationRows: raw.deviationRows || [],

      // Section H: Self Construction Case
      architectEstimateAvailable: raw.architectEstimateAvailable || 'NA',
      constructionAmountCertified: raw.constructionAmountCertified || 'NA',
      selfConstructionOthers: raw.selfConstructionOthers || 'NA',

      // Section I: Fair Market Value & Costing
      valuationMethodology: raw.valuationMethodology || 'Land & Building Method',
      landAreaSqft: raw.landAreaSqft || '',
      landRatePerSqft: raw.landRatePerSqft || '',
      landValueManual: raw.landValueManual || '',

      buildingValuationRows: raw.buildingValuationRows || [],
      amenitiesValue: raw.amenitiesValue || '0',

      distressSalePct: raw.distressSalePct || '80',
      guidelineRate: raw.guidelineRate || '',
      guidelineLandValue: raw.guidelineLandValue || '',

      floorwiseUsageRows: raw.floorwiseUsageRows || [],

      constructionProgressPct: raw.constructionProgressPct || '100%',
      constructionRecommendedPct: raw.constructionRecommendedPct || '100%',
      demolitionRisk: raw.demolitionRisk || 'Low',
      naturalDisasterRisk: raw.naturalDisasterRisk || 'Low',

      remarks: raw.remarks || '',

      // Attachments & Photo Gallery
      propertyDocuments: raw.propertyDocuments || [],
      propertyDocumentNames: raw.propertyDocumentNames || [],
      locationMaps: raw.locationMaps || [],
      propertyPhotos: raw.propertyPhotos || [],
      propertyPhotoNames: raw.propertyPhotoNames || [],
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalTarget, setPhotoModalTarget] = useState<'documents' | 'maps' | 'photos'>('photos');

  const handleChange = useCallback((name: string, value: any) => {
    setFields(prev => ({ ...prev, [name]: value }));
  }, []);

  // --- Auto Calculations for Valuation ---
  const calculatedLandValue = useMemo(() => {
    if (fields.landValueManual && !isNaN(Number(fields.landValueManual))) {
      return Number(fields.landValueManual);
    }
    const area = parseFloat(fields.landAreaSqft) || 0;
    const rate = parseFloat(fields.landRatePerSqft) || 0;
    return Math.round(area * rate);
  }, [fields.landAreaSqft, fields.landRatePerSqft, fields.landValueManual]);

  const calculatedBuildingTotals = useMemo(() => {
    let totalReplacement = 0;
    let totalDepreciation = 0;
    let totalNet = 0;

    const rows = (fields.buildingValuationRows || []).map((row: any) => {
      const bua = parseFloat(row.bua) || 0;
      const rate = parseFloat(row.ratePerUnit) || 0;
      const depPct = parseFloat(row.depreciationPct) || 0;

      const replacement = Math.round(bua * rate);
      const lessDep = Math.round(replacement * (depPct / 100));
      const net = replacement - lessDep;

      totalReplacement += replacement;
      totalDepreciation += lessDep;
      totalNet += net;

      return {
        ...row,
        replacementCost: replacement,
        lessDepreciation: lessDep,
        netDepreciatedValue: net,
      };
    });

    const amenities = parseFloat(fields.amenitiesValue) || 0;
    const grandBuildingValue = totalNet + amenities;

    return {
      rows,
      totalReplacement,
      totalDepreciation,
      totalNet,
      grandBuildingValue,
    };
  }, [fields.buildingValuationRows, fields.amenitiesValue]);

  const totalPropertyValue = useMemo(() => {
    return calculatedLandValue + calculatedBuildingTotals.grandBuildingValue;
  }, [calculatedLandValue, calculatedBuildingTotals.grandBuildingValue]);

  const totalPropertyValueWords = useMemo(() => {
    return totalPropertyValue > 0 ? rupeesInWords(totalPropertyValue) : 'Zero Rupees Only';
  }, [totalPropertyValue]);

  const calculatedDistressValue = useMemo(() => {
    const pct = parseFloat(fields.distressSalePct) || 80;
    return Math.round(totalPropertyValue * (pct / 100));
  }, [totalPropertyValue, fields.distressSalePct]);

  // Sync inspection date from bucket images
  const handleSyncInspectionDate = useCallback(() => {
    const earliest = getEarliestFieldVisit(bucketImages, prefill);
    if (earliest?.date) {
      handleChange('dateOfTechnicalVisit', earliest.date);
    }
  }, [bucketImages, prefill, handleChange]);

  // Save draft handler
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        ...fields,
        calculatedLandValue,
        totalBuildingValue: calculatedBuildingTotals.grandBuildingValue,
        totalPropertyValue,
        totalPropertyValueWords,
        distressSaleValue: calculatedDistressValue,
      };

      const res = await saveReportDraft(projectId, payload);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(res.error || 'Failed to save draft');
      }
    } catch (err: any) {
      setSaveError(err.message || 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Generation handler
  const handleDownloadPDF = async () => {
    try {
      const payload = {
        ...fields,
        calculatedLandValue,
        totalBuildingValue: calculatedBuildingTotals.grandBuildingValue,
        totalPropertyValue,
        totalPropertyValueWords,
        distressSaleValue: calculatedDistressValue,
      };
      const renderer = new PDFProtiumFinanceRenderer(payload);
      await renderer.generateAndDownload(`Valuation_Report_Protium_${projectCode || fields.leadIdLan}.pdf`);
    } catch (err: any) {
      alert(`PDF Generation failed: ${err.message}`);
    }
  };

  // Navigation Items
  const navSections: NavItem[] = [
    { id: 'sec-general', title: 'General Details' },
    { id: 'sec-locality', title: 'Surrounding Locality' },
    { id: 'sec-property', title: 'Property & Boundaries' },
    { id: 'sec-structural', title: 'Structural Details' },
    { id: 'sec-interiors', title: 'Interiors' },
    { id: 'sec-approval', title: 'Plan Approval' },
    { id: 'sec-deviation', title: 'Deviation Details' },
    { id: 'sec-self-const', title: 'Self Construction' },
    { id: 'sec-valuation', title: 'Fair Market Value & Costing' },
    { id: 'sec-documents', title: 'Documents' },
    { id: 'sec-maps', title: 'Location Maps' },
    { id: 'sec-photos', title: 'Photographs' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 text-slate-800">
      <FloatingNavigator sections={navSections} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Universal Bank Report Header */}
        <BankReportHeader
          bankName="PROTIUM FINANCE LIMITED"
          subclass="Standard"
          description="Valuation Report for Protium Finance Limited (Financial Services / LAP / Mortgage)"
          projectCode={projectCode}
          onResetWizard={onResetWizard}
          earliestVisit={getEarliestFieldVisit(bucketImages, prefill)}
          onSyncInspectionDate={handleSyncInspectionDate}
        />

        {/* Section 1: General Details (A) */}
        <Section number={1} id="sec-general" title="General Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Lead ID / LAN *">
              <input
                type="text"
                className={inputCls}
                value={fields.leadIdLan || ''}
                onChange={e => handleChange('leadIdLan', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. A376377"
              />
            </Field>

            <BaseDateInput
              label="Report Date *"
              value={fields.reportDate || ''}
              onChange={val => handleChange('reportDate', val)}
              disabled={isReadOnly}
            />

            <Field label="Valuer Name *">
              <input
                type="text"
                className={inputCls}
                value={fields.valuerName || ''}
                onChange={e => handleChange('valuerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Name of the Applicant(s) *">
              <input
                type="text"
                className={inputCls}
                value={fields.applicantName || ''}
                onChange={e => handleChange('applicantName', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Shirdi Sai Educational Trust"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Name of Property Owner *">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={fields.propertyOwner || ''}
                  onChange={e => handleChange('propertyOwner', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Naidu +2 Science College, A unit of Siridi Sai Educational Trust..."
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Property Address as per Site *">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={fields.propertyAddressSite || ''}
                  onChange={e => handleChange('propertyAddressSite', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Khata No, Plot No, Mouza, Tahasil, Dist, State, PIN..."
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Legal Address of Property *">
                <textarea
                  rows={2}
                  className={textareaCls}
                  value={fields.legalAddress || ''}
                  onChange={e => handleChange('legalAddress', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Address as recorded in legal documents..."
                />
              </Field>
            </div>

            <Field label="Contact No. of the Owner">
              <input
                type="text"
                className={inputCls}
                value={fields.ownerContactNo || ''}
                onChange={e => handleChange('ownerContactNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Mr. A Tyagraj Naidu, MOB.- 9861032396"
              />
            </Field>

            <Field label="Tenant if Applicable">
              <input
                type="text"
                className={inputCls}
                value={fields.tenantIfApplicable || ''}
                onChange={e => handleChange('tenantIfApplicable', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Landmark">
              <input
                type="text"
                className={inputCls}
                value={fields.landmark || ''}
                onChange={e => handleChange('landmark', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Near New RTO office, Khurda"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="20.150150"
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleChange('longitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="85.629080"
                />
              </Field>
            </div>

            <BaseDateInput
              label="Date of Technical Visit (Site Inspection) *"
              value={fields.dateOfTechnicalVisit || ''}
              onChange={val => handleChange('dateOfTechnicalVisit', val)}
              disabled={isReadOnly}
            />

            <Field label="Property Usage">
              <select
                className={selectCls}
                value={fields.propertyUsage || 'Commercial'}
                onChange={e => handleChange('propertyUsage', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Commercial">Commercial</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Land">Land</option>
                <option value="Residential cum Commercial">Residential cum Commercial</option>
              </select>
            </Field>

            <Field label="Property Usage as per Document">
              <input
                type="text"
                className={inputCls}
                value={fields.propertyUsageDoc || ''}
                onChange={e => handleChange('propertyUsageDoc', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA / As per deed"
              />
            </Field>

            <Field label="Occupancy">
              <select
                className={selectCls}
                value={fields.occupancy || 'Self-Occupied'}
                onChange={e => handleChange('occupancy', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Self-Occupied">Self-Occupied</option>
                <option value="Rented">Rented</option>
                <option value="Vacant">Vacant</option>
                <option value="Multistage">Multistage</option>
              </select>
            </Field>

            <Field label="Marketability">
              <select
                className={selectCls}
                value={fields.marketability || 'Good'}
                onChange={e => handleChange('marketability', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Very Good">Very Good</option>
                <option value="Good">Good</option>
                <option value="Low">Low</option>
              </select>
            </Field>

            <Field label="Front Side Road Width">
              <input
                type="text"
                className={inputCls}
                value={fields.frontRoadWidth || ''}
                onChange={e => handleChange('frontRoadWidth', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 20 feet wide Road"
              />
            </Field>
          </div>
        </Section>

        {/* Section 2: Surrounding Locality Details (B) */}
        <Section number={2} id="sec-locality" title="Surrounding Locality Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ward No / Municipal and No">
              <input
                type="text"
                className={inputCls}
                value={fields.wardMunicipalNo || ''}
                onChange={e => handleChange('wardMunicipalNo', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Type of Locality">
              <select
                className={selectCls}
                value={fields.typeOfLocality || 'Commercial'}
                onChange={e => handleChange('typeOfLocality', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Commercial">Commercial</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Chawl">Chawl</option>
                <option value="Village">Village</option>
                <option value="Slum">Slum</option>
                <option value="Mix">Mix</option>
              </select>
            </Field>

            <Field label="Distance to Bus Stop (Approx KMs)">
              <input
                type="text"
                className={inputCls}
                value={fields.distanceBusStop || ''}
                onChange={e => handleChange('distanceBusStop', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Bus Stop (500mtrs)"
              />
            </Field>

            <Field label="Distance to Hospital (Approx KMs)">
              <input
                type="text"
                className={inputCls}
                value={fields.distanceHospital || ''}
                onChange={e => handleChange('distanceHospital', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Govt. Hospital (1KMS)"
              />
            </Field>

            <Field label="Distance to Railway Station (Approx KMs)">
              <input
                type="text"
                className={inputCls}
                value={fields.distanceRailway || ''}
                onChange={e => handleChange('distanceRailway', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Khurda Town Road (2kms)"
              />
            </Field>

            <Field label="Site Access">
              <input
                type="text"
                className={inputCls}
                value={fields.siteAccess || ''}
                onChange={e => handleChange('siteAccess', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA / Accessible from main road"
              />
            </Field>

            <Field label="Plan Provided Status / Approving Authority">
              <input
                type="text"
                className={inputCls}
                value={fields.planProvidedStatus || ''}
                onChange={e => handleChange('planProvidedStatus', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Plan not provided."
              />
            </Field>

            <Field label="Corporation Limit">
              <input
                type="text"
                className={inputCls}
                value={fields.corporationLimit || ''}
                onChange={e => handleChange('corporationLimit', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Municipality / DA Limit">
              <input
                type="text"
                className={inputCls}
                value={fields.municipalityLimit || ''}
                onChange={e => handleChange('municipalityLimit', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Kuradhamal GP Limit"
              />
            </Field>

            <Field label="Panchayat Union">
              <input
                type="text"
                className={inputCls}
                value={fields.panchayatUnion || ''}
                onChange={e => handleChange('panchayatUnion', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Conditions of Approach Road">
              <select
                className={selectCls}
                value={fields.approachRoadCondition || 'Good'}
                onChange={e => handleChange('approachRoadCondition', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Bad">Bad</option>
              </select>
            </Field>

            <Field label="Approach Road Width">
              <input
                type="text"
                className={inputCls}
                value={fields.approachRoadWidth || ''}
                onChange={e => handleChange('approachRoadWidth', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 20 feet wide Road"
              />
            </Field>
          </div>
        </Section>

        {/* Section 3: Property Details (C) */}
        <Section number={3} id="sec-property" title="Property & Boundary Details">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="No. of Floors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleChange('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 4(G+3)"
                />
              </Field>

              <Field label="Floor Wise Usage">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.floorWiseUsage || ''}
                  onChange={e => handleChange('floorWiseUsage', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>

              <Field label="Age of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={e => handleChange('ageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 06-Years"
                />
              </Field>

              <Field label="Residual Age">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.residualAge || ''}
                  onChange={e => handleChange('residualAge', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 54-Years"
                />
              </Field>
            </div>

            {/* 4-Direction Boundaries Comparison Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-slate-700">
                Side Boundaries (Document vs Site vs Plan)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-2.5 text-left font-bold w-28">Direction</th>
                      <th className="p-2.5 text-left font-bold">As per Ownership Document</th>
                      <th className="p-2.5 text-left font-bold">As per Site</th>
                      <th className="p-2.5 text-left font-bold">As per Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="p-2.5 font-bold bg-gray-50/50">North</td>
                      <td className="p-2">
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
                          value={fields.boundaryNorthSite || ''}
                          onChange={e => handleChange('boundaryNorthSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryNorthPlan || ''}
                          onChange={e => handleChange('boundaryNorthPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-gray-50/50">South</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundarySouthDoc || ''}
                          onChange={e => handleChange('boundarySouthDoc', e.target.value)}
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
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundarySouthPlan || ''}
                          onChange={e => handleChange('boundarySouthPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-gray-50/50">East</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryEastDoc || ''}
                          onChange={e => handleChange('boundaryEastDoc', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryEastSite || ''}
                          onChange={e => handleChange('boundaryEastSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryEastPlan || ''}
                          onChange={e => handleChange('boundaryEastPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-gray-50/50">West</td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryWestDoc || ''}
                          onChange={e => handleChange('boundaryWestDoc', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryWestSite || ''}
                          onChange={e => handleChange('boundaryWestSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.boundaryWestPlan || ''}
                          onChange={e => handleChange('boundaryWestPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Boundaries are Matching">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.boundariesMatching || ''}
                  onChange={e => handleChange('boundariesMatching', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Yes (Boundary matching as per document)"
                />
              </Field>

              <Field label="Property Identified Through">
                <select
                  className={selectCls}
                  value={fields.propertyIdentifiedThrough || 'Shown by Applicant'}
                  onChange={e => handleChange('propertyIdentifiedThrough', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Shown by Applicant">Shown by Applicant</option>
                  <option value="Valuer">Valuer</option>
                  <option value="Customer">Customer</option>
                </select>
              </Field>

              <Field label="Plot Demarcated at Site">
                <select
                  className={selectCls}
                  value={fields.plotDemarcatedAtSite || 'Yes'}
                  onChange={e => handleChange('plotDemarcatedAtSite', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <Field label="Amenities">
              <input
                type="text"
                className={inputCls}
                value={fields.amenities || ''}
                onChange={e => handleChange('amenities', e.target.value)}
                disabled={isReadOnly}
                placeholder="Playground / Swimming pool / Sports club / GYM / Temple / School"
              />
            </Field>

            {/* Land & Plot Area Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Land &amp; Plot Area Matrix
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Land/Plot Area (Doc) [SqFt]">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.landPlotAreaDoc || ''}
                    onChange={e => handleChange('landPlotAreaDoc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Land/Plot Area (Site) [SqFt]">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.landPlotAreaSite || ''}
                    onChange={e => handleChange('landPlotAreaSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Land/Plot Area (Plan)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landPlotAreaPlan || ''}
                    onChange={e => handleChange('landPlotAreaPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total Plot Area [SqFt]">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.totalPlotArea || ''}
                    onChange={e => handleChange('totalPlotArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-200">
                <Field label="Dim. North">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dimensionNorth || ''}
                    onChange={e => handleChange('dimensionNorth', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 60m"
                  />
                </Field>
                <Field label="Dim. South">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dimensionSouth || ''}
                    onChange={e => handleChange('dimensionSouth', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 60m"
                  />
                </Field>
                <Field label="Dim. East">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dimensionEast || ''}
                    onChange={e => handleChange('dimensionEast', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 726ft"
                  />
                </Field>
                <Field label="Dim. West">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dimensionWest || ''}
                    onChange={e => handleChange('dimensionWest', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 726ft"
                  />
                </Field>
              </div>
            </div>

            {/* Measured BUA Breakdown Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Built Up Area (Actual Measured Itemized Breakdown)
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const current = fields.buaItems || [];
                      handleChange('buaItems', [
                        ...current,
                        { name: '', formula: '', bua: '0', structureType: 'RCC bldg' },
                      ]);
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded transition-colors"
                  >
                    + Add Structure
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-2.5 text-left font-bold">Structure / Building Description</th>
                      <th className="p-2.5 text-left font-bold">Formula / Dimension Breakdown</th>
                      <th className="p-2.5 text-left font-bold w-28">BUA (SqFt)</th>
                      <th className="p-2.5 text-left font-bold w-32">Type</th>
                      {!isReadOnly && <th className="p-2.5 text-center font-bold w-12">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(fields.buaItems || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={item.name || ''}
                            onChange={e => {
                              const updated = [...fields.buaItems];
                              updated[idx].name = e.target.value;
                              handleChange('buaItems', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="e.g. Bldg. 1 RCC Roofing Class/Office room (G+3)"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={item.formula || ''}
                            onChange={e => {
                              const updated = [...fields.buaItems];
                              updated[idx].formula = e.target.value;
                              handleChange('buaItems', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="e.g. 4 x 4219sqft = 16876sqft"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={inputCls}
                            value={item.bua || ''}
                            onChange={e => {
                              const updated = [...fields.buaItems];
                              updated[idx].bua = e.target.value;
                              handleChange('buaItems', updated);
                              // Auto update total
                              const sum = updated.reduce((acc, curr) => acc + (parseFloat(curr.bua) || 0), 0);
                              handleChange('totalMeasuredBua', String(sum));
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={item.structureType || ''}
                            onChange={e => {
                              const updated = [...fields.buaItems];
                              updated[idx].structureType = e.target.value;
                              handleChange('buaItems', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="RCC bldg / GCI Shed"
                          />
                        </td>
                        {!isReadOnly && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = fields.buaItems.filter((_: any, i: number) => i !== idx);
                                handleChange('buaItems', updated);
                                const sum = updated.reduce((acc: number, curr: any) => acc + (parseFloat(curr.bua) || 0), 0);
                                handleChange('totalMeasuredBua', String(sum));
                              }}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Total Measured BUA (Actual) [SqFt]">
                <input
                  type="text"
                  className={inputCls + ' font-bold bg-amber-50'}
                  value={fields.totalMeasuredBua || ''}
                  onChange={e => handleChange('totalMeasuredBua', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Property Type">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyType || ''}
                  onChange={e => handleChange('propertyType', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Row house / Institutional"
                />
              </Field>

              <Field label="Occupancy Status">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupancyStatus || ''}
                  onChange={e => handleChange('occupancyStatus', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Self"
                />
              </Field>
            </div>

            <Field label="Floor Details Summary">
              <input
                type="text"
                className={inputCls}
                value={fields.floorDetailsSummary || ''}
                onChange={e => handleChange('floorDetailsSummary', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. (G+3)-32-Class Room, 8-Toilet, 3-Hall & Office Room. 2-Hostel room"
              />
            </Field>
          </div>
        </Section>

        {/* Section 4: Structural Details (D) */}
        <Section number={4} id="sec-structural" title="Structural Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Type of Structure">
              <input
                type="text"
                className={inputCls}
                value={fields.typeOfStructure || ''}
                onChange={e => handleChange('typeOfStructure', e.target.value)}
                disabled={isReadOnly}
                placeholder="RCC/Load Bearing/Stone Slab/GCI Sheet/Temporary"
              />
            </Field>

            <Field label="No. of Floors Summary across Buildings">
              <input
                type="text"
                className={inputCls}
                value={fields.structuralFloorsSummary || ''}
                onChange={e => handleChange('structuralFloorsSummary', e.target.value)}
                disabled={isReadOnly}
                placeholder="Bldg.1 4(G+3) RCC | Bldg.2 2(G+1) RCC | Bldg.3 1(GF) GCI Shed..."
              />
            </Field>

            <Field label="No. of Wings">
              <input
                type="text"
                className={inputCls}
                value={fields.noOfWings || ''}
                onChange={e => handleChange('noOfWings', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="No. of Units on Each Floor">
              <input
                type="text"
                className={inputCls}
                value={fields.noOfUnitsPerFloor || ''}
                onChange={e => handleChange('noOfUnitsPerFloor', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Quality of Construction">
              <select
                className={selectCls}
                value={fields.qualityOfConstruction || 'Good'}
                onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="Structural Observation">
              <input
                type="text"
                className={inputCls}
                value={fields.structuralObservation || ''}
                onChange={e => handleChange('structuralObservation', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA / Sound condition"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Configuration">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.configuration || ''}
                  onChange={e => handleChange('configuration', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Section 5: Interiors (E) */}
        <Section number={5} id="sec-interiors" title="Interior Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Flooring & Finishing">
              <input
                type="text"
                className={inputCls}
                value={fields.flooringFinishing || ''}
                onChange={e => handleChange('flooringFinishing', e.target.value)}
                disabled={isReadOnly}
                placeholder="Tile / AS Flooring"
              />
            </Field>

            <Field label="Roofing & Terracing">
              <input
                type="text"
                className={inputCls}
                value={fields.roofingTerracing || ''}
                onChange={e => handleChange('roofingTerracing', e.target.value)}
                disabled={isReadOnly}
                placeholder="RCC / GCI roofing"
              />
            </Field>

            <Field label="Quality of Fixtures & Settings">
              <select
                className={selectCls}
                value={fields.qualityOfFixtures || 'Good'}
                onChange={e => handleChange('qualityOfFixtures', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="Doors & Windows">
              <input
                type="text"
                className={inputCls}
                value={fields.doorsWindows || ''}
                onChange={e => handleChange('doorsWindows', e.target.value)}
                disabled={isReadOnly}
                placeholder="Hard Wood / Aluminium"
              />
            </Field>
          </div>
        </Section>

        {/* Section 6: Plan Approval Details (F) */}
        <Section number={6} id="sec-approval" title="Plan Approval Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Construction as per Approved / Sanctioned Plans">
              <input
                type="text"
                className={inputCls}
                value={fields.constructionAsPerApprovedPlan || ''}
                onChange={e => handleChange('constructionAsPerApprovedPlan', e.target.value)}
                disabled={isReadOnly}
                placeholder="Plan not provided / Approved"
              />
            </Field>

            <Field label="Details of Approved Plan with Approval No & Date">
              <input
                type="text"
                className={inputCls}
                value={fields.detailsOfApprovedPlan || ''}
                onChange={e => handleChange('detailsOfApprovedPlan', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Construction Permission Number & Date">
              <input
                type="text"
                className={inputCls}
                value={fields.constructionPermissionNoDate || ''}
                onChange={e => handleChange('constructionPermissionNoDate', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Violations Observed or Risk of Demolition">
              <input
                type="text"
                className={inputCls}
                value={fields.violationsRiskOfDemolition || ''}
                onChange={e => handleChange('violationsRiskOfDemolition', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="If Plans Not Available, Is Structure Confirming to Local Norms">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.structureConfirmingToLocal || ''}
                  onChange={e => handleChange('structureConfirmingToLocal', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="NA"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Section 7: Deviation Details (G) */}
        <Section number={7} id="sec-deviation" title="Deviation Details">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-slate-700">
              Floor Deviation Details
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="p-2.5 text-left font-bold">Floor Details</th>
                    <th className="p-2.5 text-left font-bold">As per Approval Plan</th>
                    <th className="p-2.5 text-left font-bold">At Site</th>
                    <th className="p-2.5 text-left font-bold">Deviation in SqFt</th>
                    <th className="p-2.5 text-left font-bold">Deviation in %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(fields.deviationRows || []).map((row: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.floor || ''}
                          onChange={e => {
                            const updated = [...fields.deviationRows];
                            updated[idx].floor = e.target.value;
                            handleChange('deviationRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.asPerPlan || ''}
                          onChange={e => {
                            const updated = [...fields.deviationRows];
                            updated[idx].asPerPlan = e.target.value;
                            handleChange('deviationRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.atSite || ''}
                          onChange={e => {
                            const updated = [...fields.deviationRows];
                            updated[idx].atSite = e.target.value;
                            handleChange('deviationRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.deviationSqft || ''}
                          onChange={e => {
                            const updated = [...fields.deviationRows];
                            updated[idx].deviationSqft = e.target.value;
                            handleChange('deviationRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={row.deviationPct || ''}
                          onChange={e => {
                            const updated = [...fields.deviationRows];
                            updated[idx].deviationPct = e.target.value;
                            handleChange('deviationRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* Section 8: Self Construction Case (H) */}
        <Section number={8} id="sec-self-const" title="Self Construction Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Architect Certified Estimate Available or Not">
              <input
                type="text"
                className={inputCls}
                value={fields.architectEstimateAvailable || ''}
                onChange={e => handleChange('architectEstimateAvailable', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Construction Amount Certified">
              <input
                type="text"
                className={inputCls}
                value={fields.constructionAmountCertified || ''}
                onChange={e => handleChange('constructionAmountCertified', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>

            <Field label="Others">
              <input
                type="text"
                className={inputCls}
                value={fields.selfConstructionOthers || ''}
                onChange={e => handleChange('selfConstructionOthers', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA"
              />
            </Field>
          </div>
        </Section>

        {/* Section 9: Fair Market Value & Costing (I) */}
        <Section number={9} id="sec-valuation" title="Fair Market Value & Costing">
          <div className="space-y-6">
            <Field label="Valuation Methodology">
              <input
                type="text"
                className={inputCls}
                value={fields.valuationMethodology || ''}
                onChange={e => handleChange('valuationMethodology', e.target.value)}
                disabled={isReadOnly}
                placeholder="Land & Building Method"
              />
            </Field>

            {/* Land Valuation Container */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                1. Land Valuation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Land Area Considered (SqFt)">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={e => handleChange('landAreaSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="43560"
                  />
                </Field>

                <Field label="Land Rate (Rs. per SqFt)">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.landRatePerSqft || ''}
                    onChange={e => handleChange('landRatePerSqft', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="450"
                  />
                </Field>

                <Field label="Total Land Value (Rs.)">
                  <input
                    type="text"
                    className={inputCls + ' font-bold bg-white text-emerald-800'}
                    value={`Rs. ${formatIndianCurrency(calculatedLandValue)}/-`}
                    readOnly
                    disabled
                  />
                </Field>
              </div>
            </div>

            {/* Building Valuation Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  2. Building Valuation (Depreciation Grid)
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const current = fields.buildingValuationRows || [];
                      handleChange('buildingValuationRows', [
                        ...current,
                        { particulars: '', bua: '0', ratePerUnit: '0', depreciationPct: '0' },
                      ]);
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded transition-colors"
                  >
                    + Add Building Row
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-2.5 text-left font-bold">Particulars / Floor</th>
                      <th className="p-2.5 text-left font-bold w-24">BUA</th>
                      <th className="p-2.5 text-left font-bold w-24">Rate/Unit</th>
                      <th className="p-2.5 text-left font-bold w-32">Replacement Cost</th>
                      <th className="p-2.5 text-left font-bold w-20">Dep. %</th>
                      <th className="p-2.5 text-left font-bold w-28">Less Dep.</th>
                      <th className="p-2.5 text-left font-bold w-32">Net Depreciated Value</th>
                      {!isReadOnly && <th className="p-2.5 text-center font-bold w-12">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {calculatedBuildingTotals.rows.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.particulars || ''}
                            onChange={e => {
                              const updated = [...fields.buildingValuationRows];
                              updated[idx].particulars = e.target.value;
                              handleChange('buildingValuationRows', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="e.g. 4(G+3) RCC building"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={inputCls}
                            value={row.bua || ''}
                            onChange={e => {
                              const updated = [...fields.buildingValuationRows];
                              updated[idx].bua = e.target.value;
                              handleChange('buildingValuationRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={inputCls}
                            value={row.ratePerUnit || ''}
                            onChange={e => {
                              const updated = [...fields.buildingValuationRows];
                              updated[idx].ratePerUnit = e.target.value;
                              handleChange('buildingValuationRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 font-semibold">
                          Rs. {formatIndianCurrency(row.replacementCost)}/-
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className={inputCls}
                            value={row.depreciationPct || ''}
                            onChange={e => {
                              const updated = [...fields.buildingValuationRows];
                              updated[idx].depreciationPct = e.target.value;
                              handleChange('buildingValuationRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 text-rose-600 font-medium">
                          Rs. {formatIndianCurrency(row.lessDepreciation)}/-
                        </td>
                        <td className="p-2 font-bold text-emerald-800">
                          Rs. {formatIndianCurrency(row.netDepreciatedValue)}/-
                        </td>
                        {!isReadOnly && (
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = fields.buildingValuationRows.filter((_: any, i: number) => i !== idx);
                                handleChange('buildingValuationRows', updated);
                              }}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-slate-800">
                    <tr>
                      <td colSpan={6} className="p-2.5 text-right">Amenities / Extra Additions:</td>
                      <td className="p-2">
                        <input
                          type="number"
                          className={inputCls}
                          value={fields.amenitiesValue || '0'}
                          onChange={e => handleChange('amenitiesValue', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                    <tr>
                      <td colSpan={6} className="p-2.5 text-right font-extrabold text-sm text-indigo-950">
                        Total Building Value (Net Depreciated + Amenities):
                      </td>
                      <td className="p-2.5 font-extrabold text-sm text-indigo-800">
                        Rs. {formatIndianCurrency(calculatedBuildingTotals.grandBuildingValue)}/-
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Summary Highlights Card */}
            <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-linear-to-r from-indigo-50/60 to-blue-50/60 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                    Total Value of Property as per Actual (Land + Building)
                  </span>
                  <div className="text-2xl font-black text-indigo-950">
                    Rs. {formatIndianCurrency(totalPropertyValue)}/-
                  </div>
                  <div className="text-xs italic text-indigo-700 mt-1 font-medium">
                    ({totalPropertyValueWords})
                  </div>
                </div>

                <div className="border-t md:border-t-0 md:border-l md:pl-4 border-indigo-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Distressed Sale Value ({fields.distressSalePct}%):</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      Rs. {formatIndianCurrency(calculatedDistressValue)}/-
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Govt. Guideline Rate &amp; Land Value:</span>
                    <span className="text-xs font-semibold text-slate-900">
                      Rs. {fields.guidelineRate}/- | Rs. {formatIndianCurrency(Number(fields.guidelineLandValue))}/-
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floorwise Usage Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-slate-700">
                Floorwise Details of Usage and Rental Value
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      <th className="p-2.5 text-left font-bold">Floor</th>
                      <th className="p-2.5 text-left font-bold">Usage</th>
                      <th className="p-2.5 text-left font-bold w-16">Units</th>
                      <th className="p-2.5 text-left font-bold">Value / Status</th>
                      <th className="p-2.5 text-left font-bold">If Tenanted, Tenancy Year</th>
                      <th className="p-2.5 text-left font-bold">Rental Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(fields.floorwiseUsageRows || []).map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{row.floor}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.usage || ''}
                            onChange={e => {
                              const updated = [...fields.floorwiseUsageRows];
                              updated[idx].usage = e.target.value;
                              handleChange('floorwiseUsageRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.units || ''}
                            onChange={e => {
                              const updated = [...fields.floorwiseUsageRows];
                              updated[idx].units = e.target.value;
                              handleChange('floorwiseUsageRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.value || ''}
                            onChange={e => {
                              const updated = [...fields.floorwiseUsageRows];
                              updated[idx].value = e.target.value;
                              handleChange('floorwiseUsageRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.currentTenancy || ''}
                            onChange={e => {
                              const updated = [...fields.floorwiseUsageRows];
                              updated[idx].currentTenancy = e.target.value;
                              handleChange('floorwiseUsageRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.rentalAssessment || ''}
                            onChange={e => {
                              const updated = [...fields.floorwiseUsageRows];
                              updated[idx].rentalAssessment = e.target.value;
                              handleChange('floorwiseUsageRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progress & Risk Assessment Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Progress %">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionProgressPct || ''}
                  onChange={e => handleChange('constructionProgressPct', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="100%"
                />
              </Field>

              <Field label="Recommended %">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionRecommendedPct || ''}
                  onChange={e => handleChange('constructionRecommendedPct', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="100%"
                />
              </Field>

              <Field label="Demolition Risk">
                <select
                  className={selectCls}
                  value={fields.demolitionRisk || 'Low'}
                  onChange={e => handleChange('demolitionRisk', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </Field>

              <Field label="Disaster Risk (Seismic/Flood)">
                <select
                  className={selectCls}
                  value={fields.naturalDisasterRisk || 'Low'}
                  onChange={e => handleChange('naturalDisasterRisk', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </Field>
            </div>

            {/* Valuation Remarks (Justified alignment) */}
            <Field label="Valuation Remarks & Synthesis (Justified)">
              <textarea
                rows={5}
                className={textareaCls}
                value={fields.remarks || ''}
                onChange={e => handleChange('remarks', e.target.value)}
                disabled={isReadOnly}
              />
              <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
                <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Rendered Readout Preview:
                </div>
                <p className={renderedParagraphCls}>
                  {fields.remarks}
                </p>
              </div>
            </Field>
          </div>
        </Section>

        {/* Section 10: Documents Gallery */}
        <BaseDocumentsSection
          title="Documents"
          sectionId="sec-documents"
          sectionNumber={10}
          documentImages={fields.propertyDocuments || []}
          documentImageNames={fields.propertyDocumentNames || []}
          isReadOnly={isReadOnly}
          onRemoveDocument={idx => {
            handleChange('propertyDocuments', (fields.propertyDocuments || []).filter((_: any, i: number) => i !== idx));
            handleChange('propertyDocumentNames', (fields.propertyDocumentNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onDocumentNameChange={(idx, name) => {
            const arr = [...(fields.propertyDocumentNames || [])];
            while (arr.length <= idx) arr.push('');
            arr[idx] = name;
            handleChange('propertyDocumentNames', arr);
          }}
          onReorderDocuments={(newDocs, newNames) => {
            handleChange('propertyDocuments', newDocs);
            handleChange('propertyDocumentNames', newNames);
          }}
        />

        {/* Section 11: Location Maps */}
        <BaseMapsSection
          title="Location Maps"
          sectionId="sec-maps"
          sectionNumber={11}
          locationMapImages={fields.locationMaps || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          isReadOnly={isReadOnly}
          onLocationMapRemove={idx => {
            handleChange('locationMaps', (fields.locationMaps || []).filter((_: any, i: number) => i !== idx));
          }}
        />

        {/* Section 12: Photographs Gallery */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionId="sec-photos"
          sectionNumber={12}
          propertyImages={fields.propertyPhotos || []}
          propertyImageNames={fields.propertyPhotoNames || []}
          isReadOnly={isReadOnly}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => {
            setPhotoModalTarget('photos');
            setIsPhotoModalOpen(true);
          }}
          onRemoveImage={idx => {
            handleChange('propertyPhotos', (fields.propertyPhotos || []).filter((_: any, i: number) => i !== idx));
            handleChange('propertyPhotoNames', (fields.propertyPhotoNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onImageNameChange={(idx, name) => {
            const arr = [...(fields.propertyPhotoNames || [])];
            while (arr.length <= idx) arr.push('');
            arr[idx] = name;
            handleChange('propertyPhotoNames', arr);
          }}
          onReorderImages={(newImgs, newNames) => {
            handleChange('propertyPhotos', newImgs);
            handleChange('propertyPhotoNames', newNames);
          }}
        />

        {/* Action Bar (Save Draft, Print/Download PDF, Reset) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={isSaving ? 'saving' : saveSuccess ? 'saved' : saveError ? 'error' : 'idle'}
          message={saveSuccess ? { text: 'Report draft saved successfully', type: 'success' } : saveError ? { text: saveError, type: 'error' } : null}
          loading={isSaving}
          onSaveDraft={handleSaveDraft}
          onPreviewPDF={handleDownloadPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </main>

      {/* Photo Bucket Selection Modal */}
      {isPhotoModalOpen && (
        <BasePhotoBucketModal
          isOpen={isPhotoModalOpen}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setIsPhotoModalOpen(false)}
          onConfirm={(selectedUrls: string[]) => {
            if (photoModalTarget === 'documents') {
              handleChange('propertyDocuments', [...(fields.propertyDocuments || []), ...selectedUrls]);
              handleChange('propertyDocumentNames', [
                ...(fields.propertyDocumentNames || []),
                ...selectedUrls.map((_, i) => `Document ${(fields.propertyDocuments?.length || 0) + i + 1}`),
              ]);
            } else if (photoModalTarget === 'maps') {
              handleChange('locationMaps', [...(fields.locationMaps || []), ...selectedUrls]);
            } else {
              handleChange('propertyPhotos', [...(fields.propertyPhotos || []), ...selectedUrls]);
              handleChange('propertyPhotoNames', [
                ...(fields.propertyPhotoNames || []),
                ...selectedUrls.map((_, i) => `Photograph ${(fields.propertyPhotos?.length || 0) + i + 1}`),
              ]);
            }
            setIsPhotoModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
