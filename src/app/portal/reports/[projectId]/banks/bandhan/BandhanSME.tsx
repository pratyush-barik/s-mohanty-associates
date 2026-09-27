'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  ActiveConfigBanner,
  FloatingNavigator,
  Section,
  Field,
  BaseDateInput,
  BasePhotoBucketModal,
  BasePhotographsSection,
  BaseMapsSection,
  BaseDocumentsSection,
  DEFAULT_PHOTO_LABEL,
  DEFAULT_DOCUMENT_LABEL,
  ReportActionBar,
  NavItem,
  inputCls,
  selectCls,
} from '../BaseBankReportComponents';
import {
  BandhanSMEReportFields,
  BandhanSMEPlotBoundary,
  BandhanSMEFloorDetail,
  BandhanSMEBuildingValuationRow,
  BandhanSMESubScheduleItem,
  BandhanSMEChecklistItem,
  BandhanSMEPhoto,
  PDFBandhanSMERenderer,
  generateBandhanSMEReport,
  generateBandhanSMEReportWithCount,
  convertAreaToSqft,
  parseSqftFromArea,
  formatAreaOfLandStatement,
  formatDateDisplay,
  formatCommencementCompletion,
  getConstructionDetailsForStructure,
  parseNum,
  formatCurrencyINR,
} from '@/lib/banks/pdf-bandhan-sme-renderer';
import { BankConfig } from '@/lib/bank-fields';
import { formatReportDate } from '@/lib/pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';

export const BANDHAN_SME_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'SME',
  displayName: 'Bandhan Bank — SME',
  defaultValues: {
    purpose: 'SME / Commercial Valuation',
  },
};

const compressImageFile = (
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({ dataUrl, blob: file });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export interface BandhanSMEProps {
  projectId: string;
  projectCode?: string;
  initialFields?: any;
  initialData?: any;
  status?: string;
  userRole?: string;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
  prefill?: any;
  bucketImages?: any[];
}

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-basic', title: 'Basic Information (Section I: Points A–M)' },
  { id: 'sec-prop-details', title: 'Land Details (Section II.1: Points A–L)' },
  { id: 'sec-title-rent', title: 'Title, Ownership & Rent (Points 2.1, 2.2 & 2.3)' },
  { id: 'sec-desc-boundaries', title: 'Property Description & Multi-Plot Boundaries (Point 3)' },
  { id: 'sec-site-char', title: 'Site Characteristics (Point 3) & Location Adv/Disadv (Point 4)' },
  { id: 'sec-other-issues', title: 'Other Issues & Sales Rationale (Point 5)' },
  { id: 'sec-land-valuation', title: 'Valuation of Land (Section II.6)' },
  { id: 'sec-bldg-basic', title: 'Building Basic Info & Built-up Area (Part 1: Points A–H)' },
  { id: 'sec-bldg-checklist', title: 'Building Occupancy & Details (Points I to AB)' },
  { id: 'sec-bldg-tech-spec', title: 'Technical Details & Specifications (Parts 2 & 3)' },
  { id: 'sec-bldg-valuation-schedules', title: 'Building Valuation, Sub-Schedules & 6.0 Total Abstract Matrix' },
  { id: 'sec-remarks-opinion', title: 'Remarks & Certificate of Valuation' },
  { id: 'sec-declaration', title: 'Declaration & Valuer Credentials' },
  { id: 'sec-checklist', title: 'Valuation Checklist' },
  { id: 'sec-documents', title: 'Documents' },
  { id: 'sec-maps', title: 'Maps' },
  { id: 'sec-photos', title: 'Property Photographs' },
];

const sanitizePositiveInt = (val: string, maxLen?: number): string => {
  const digits = val.replace(/[^0-9]/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

const sanitizePositiveFloat = (val: string): string => {
  let clean = val.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  return clean;
};

const sanitizePercentage = (val: string): string => {
  const clean = sanitizePositiveFloat(val.replace(/%/g, ''));
  if (!clean) return '';
  const num = parseFloat(clean);
  if (num > 100) return '100';
  return clean;
};

const renderSelect = (
  value: string | undefined,
  options: string[],
  onChange: (v: string) => void,
  disabled?: boolean,
  defaultVal?: string
) => {
  const current = value !== undefined && value !== '' ? value : (defaultVal || options[0] || '');
  const hasCurrent = options.includes(current);
  return (
    <select
      className={selectCls}
      value={current}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {!hasCurrent && current && <option value={current}>{current}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

export default function BandhanSME({
  projectId,
  projectCode,
  initialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  onResetWizard,
  prefill,
  bucketImages = [],
}: BandhanSMEProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // Default Ref No
  const defaultRefNo = useMemo(() => {
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('bandhan/') ? id : `Bandhan/${id}`) : '';
  }, [projectCode, projectId]);

  // ── Find First Field Engineer Visit Date (Earliest Visit Date) ──
  const firstFieldAgentVisit = useMemo(() => {
    if (bucketImages && bucketImages.length > 0) {
      const validImages = [...bucketImages]
        .filter(img => img.createdAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (validImages.length > 0) {
        return {
          dateStr: formatReportDate(validImages[0].createdAt),
          rawDate: validImages[0].createdAt,
          agentName: validImages[0].employee?.name || prefill?.firstFieldAgentName || '',
          agentId: validImages[0].employee?.employeeId || '',
        };
      }
    }
    const fallbackDate = prefill?.fieldVisitDate || prefill?.inspectionDate;
    if (fallbackDate) {
      return {
        dateStr: formatReportDate(fallbackDate),
        rawDate: fallbackDate,
        agentName: prefill?.firstFieldAgentName || prefill?.fieldEmployees?.[0]?.name || '',
        agentId: prefill?.fieldEmployees?.[0]?.employeeId || '',
      };
    }
    return null;
  }, [bucketImages, prefill]);

  // State initialization with clean defaults and project prefill
  const [fields, setFields] = useState<BandhanSMEReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : (initialData?.reportFields || initialData || {});

    const defaultPlots: BandhanSMEPlotBoundary[] = Array.isArray(raw.documentPlotBoundaries) && raw.documentPlotBoundaries.length > 0
      ? raw.documentPlotBoundaries
      : [
          { plotNo: raw.plotNo ? `Plot No: ${raw.plotNo}` : '', east: '', west: '', north: '', south: '' },
        ];

    const defaultBldgRows: BandhanSMEBuildingValuationRow[] = Array.isArray(raw.buildingValuationRows) && raw.buildingValuationRows.length > 0
      ? raw.buildingValuationRows
      : [
          {
            description: 'RESIDENTIAL & COMMERCIAL BUILDING',
            plinthArea: '',
            height: "10'-6\"",
            age: '',
            replacementRate: '',
            replacementCost: '',
            depreciation: '',
            valueAfterDepreciation: '',
          },
        ];

    const defaultChecklist: BandhanSMEChecklistItem[] = Array.isArray(raw.checklist) && raw.checklist.length > 0
      ? raw.checklist
      : [
          { pointNo: 1, question: 'Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed', answer: 'Yes' },
          { pointNo: 2, question: 'Boundaries of the property are mentioned as per both, title deed and actual observations', answer: 'Yes' },
          { pointNo: 3, question: 'Clearly mentioned that property has been identified by the valuer on his own based on the address', answer: 'Yes' },
          { pointNo: 4, question: 'Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)', answer: 'Yes' },
          { pointNo: 5, question: 'If land, clearly mentioned whether the land is land locked plot or independent land', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 6, question: 'If vacant land, clearly mentioned that proper demarcation and fencing has been done', answer: 'Yes' },
          { pointNo: 7, question: 'If building, clearly mentioned that construction has been done according to the building plan approval', subText: '(If not, deviation should be clearly specified)', answer: 'No' },
          { pointNo: 8, question: 'If building, clearly mentioned that building use / completion certificate has been obtained from competent authority', answer: 'No' },
          { pointNo: 9, question: 'Clearly mentioned whether access to the property is available', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 10, question: 'Basis for arriving at government value has been mentioned and necessary documents have been enclosed', answer: 'Yes' },
        ];

    // Parse branch details from raw data if branchDetails not explicitly stored
    let branchDetails = raw.branchDetails || '';
    let branchName = raw.branchName || '';
    if (!branchDetails && branchName) {
      branchDetails = branchName.replace(/^The\s+Bandhan\s+Bank,?\s*|^Bandhan\s+Bank,?\s*/i, '').trim();
    }
    if (!branchName) {
      branchName = branchDetails ? `Bandhan Bank, ${branchDetails}` : 'Bandhan Bank';
    }

    // Parse letter no and date from raw data if not explicitly set
    let bankLetterNo = raw.bankLetterNo || '';
    let bankLetterDate = raw.bankLetterDate ? formatReportDate(raw.bankLetterDate) : '';
    let letterNoAndDate = raw.letterNoAndDate || '';
    if (!bankLetterNo && !bankLetterDate && letterNoAndDate) {
      const dtMatch = letterNoAndDate.match(/^(.*?)(?:\s*(?:Dt\.?|Date:?|\/|,|-)\s*)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})$/i);
      if (dtMatch) {
        bankLetterNo = dtMatch[1].trim();
        bankLetterDate = formatReportDate(dtMatch[2].trim());
      } else {
        bankLetterNo = letterNoAndDate;
      }
    }
    if (!letterNoAndDate) {
      letterNoAndDate = [bankLetterNo, bankLetterDate ? `Dt. ${bankLetterDate}` : ''].filter(Boolean).join(' ');
    }

    const landAreaUnit = raw.landAreaUnit || 'ACRE_DEC';
    const landAreaValue = (() => {
      if (raw.landAreaValue !== undefined && raw.landAreaValue !== '') return raw.landAreaValue;
      const rawSrc = raw.extentOfSite || raw.areaLandDoc || raw.landAreaTotal || '';
      if (!rawSrc) return '';
      const s = String(rawSrc).trim();
      const acMatch = s.match(/AC\.(\d+(?:\.\d+)?)/i);
      if (acMatch && acMatch[1]) return acMatch[1];
      const parenMatch = s.match(/\((\d+(?:\.\d+)?)\s*(?:Decs|Sq\.Yds|Sq\.Mtr|Guntha|Acre|Decimal)/i);
      if (parenMatch && parenMatch[1]) return parenMatch[1];
      const sqftMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*sqft/i);
      if (sqftMatch && sqftMatch[1]) return sqftMatch[1].replace(/,/g, '');
      if (/^\d+(?:\.\d+)?$/.test(s)) return s;
      return '';
    })();

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      institutionCategory: raw.institutionCategory || 'Bank & FIS',
      organisationTemplate: raw.organisationTemplate || 'BANDHAN BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'SME',
      bankName: raw.bankName || 'BANDHAN BANK',
      serviceType: raw.serviceType || prefill?.purpose || undefined,
      subjectType: raw.subjectType || prefill?.propertyType || undefined,
      reworkNotes: raw.reworkNotes || '',

      // Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // Section I: Basic Information (A - M)
      branchDetails,
      branchName,
      bankLetterNo,
      bankLetterDate,
      letterNoAndDate,
      valuationMadeAtBorrowerRequest: raw.valuationMadeAtBorrowerRequest || 'No',
      managerAccompanied: raw.managerAccompanied || 'No',
      valuationType: raw.valuationType || 'Fresh Valuation',
      dateOfEarlierValuation: raw.dateOfEarlierValuation || 'No',
      previousValuerName: raw.previousValuerName || 'Not Applicable',
      dateOfVisit: raw.dateOfVisit
        ? formatReportDate(raw.dateOfVisit)
        : (firstFieldAgentVisit?.dateStr || (prefill?.fieldVisitDate ? formatReportDate(prefill.fieldVisitDate) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())))),
      dateOfValuation: raw.dateOfValuation ? formatReportDate(raw.dateOfValuation) : (raw.reportDate ? formatReportDate(raw.reportDate) : formatReportDate(new Date())),
      personsPresent: raw.personsPresent || (prefill?.contactName ? `${prefill.contactName}, Mob-${prefill?.serviceRequest?.guestPhone || ''}` : ''),
      documentsProduced: raw.documentsProduced || 'Xerox copy of Sale Deed, Patta, Sketch Map, Assessment of Holding',

      // Borrower Details (L)
      borrowerName: raw.borrowerName || prefill?.serviceRequest?.guestName || prefill?.contactName || '',
      borrowerAt: raw.borrowerAt || prefill?.propertyAddress || '',
      borrowerPo: raw.borrowerPo || '',
      borrowerPs: raw.borrowerPs || '',
      borrowerDist: raw.borrowerDist || prefill?.serviceRequest?.city || '',
      borrowerPhone: raw.borrowerPhone || prefill?.serviceRequest?.guestPhone || '',
      borrowerNatureOfBusiness: raw.borrowerNatureOfBusiness || '',

      // Owner Details (M)
      ownerName: raw.ownerName || prefill?.contactName || '',
      ownerAt: raw.ownerAt || prefill?.propertyAddress || '',
      ownerPo: raw.ownerPo || '',
      ownerPs: raw.ownerPs || '',
      ownerPin: raw.ownerPin || prefill?.serviceRequest?.pincode || '',
      ownerDist: raw.ownerDist || prefill?.serviceRequest?.city || '',
      ownerPhone: raw.ownerPhone || prefill?.serviceRequest?.guestPhone || '',
      ownerFatherName: raw.ownerFatherName || '',

      // Section II: Valuation of Land
      // 1. Details of Property (A - L, I)
      detailsPropertyOffered: raw.detailsPropertyOffered || 'Land & Building',
      dateAcquisitionLand: raw.dateAcquisitionLand ? formatReportDate(raw.dateAcquisitionLand) : '',
      valueAsPerSaleDeed: raw.valueAsPerSaleDeed || '',
      saleDeedDocNo: raw.saleDeedDocNo || '',
      landAreaUnit,
      landAreaValue,
      landAreaSqft: raw.landAreaSqft || '',
      areaLandDoc: raw.areaLandDoc || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      areaLandRor: raw.areaLandRor || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      areaLandPhysical: raw.areaLandPhysical || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),

      // Location of Property & Postal Address (H)
      plotNo: raw.plotNo || '',
      khataNo: raw.khataNo || '',
      propAt: raw.propAt || prefill?.propertyAddress || '',
      propPo: raw.propPo || '',
      propPs: raw.propPs || '',
      propPin: raw.propPin || prefill?.serviceRequest?.pincode || '',
      propDist: raw.propDist || prefill?.serviceRequest?.city || '',

      urbanSemiUrbanRural: raw.urbanSemiUrbanRural || 'Urban Area',
      situatedAreaType: raw.situatedAreaType || 'Residential cum Commercial Area',
      classificationOfLocality: raw.classificationOfLocality || 'Middle Class',
      typeOfProperty: raw.typeOfProperty || 'Land & building',
      isAgricultural: raw.isAgricultural || 'No',
      agriculturalConversionContemplated: raw.agriculturalConversionContemplated || 'Not Applicable',
      isIndustrial: raw.isIndustrial || 'No',
      industrialActivitySuited: raw.industrialActivitySuited || 'Not Applicable',
      isResidential: raw.isResidential || 'Yes',
      isCommercial: raw.isCommercial || 'Yes',
      isInstitutional: raw.isInstitutional || 'No',
      isOthersSpecify: raw.isOthersSpecify || 'No',

      // 2.1 Title of Property Freehold / Leasehold
      titleFreeholdLeasehold: raw.titleFreeholdLeasehold || 'It is a free hold land',
      ownershipOfProperty: raw.ownershipOfProperty || 'Single Ownership',
      jointOwnershipShare: raw.jointOwnershipShare || 'Not Applicable',
      taxesPaidUpTo: raw.taxesPaidUpTo || 'We have not verified any recent rent receipt',
      landRevenue: raw.landRevenue || 'We have not verified any recent rent receipt',
      landBuildingMunicipalTaxes: raw.landBuildingMunicipalTaxes || 'We have not verified any recent rent receipt',
      wealthTaxAssessedPaid: raw.wealthTaxAssessedPaid || 'Not Applicable',

      // 2.2 If Leasehold
      isLeaseholdApplicable: raw.isLeaseholdApplicable || 'No',
      lessorName: raw.lessorName || 'Not Applicable',
      lesseeName: raw.lesseeName || 'Not Applicable',
      natureOfLease: raw.natureOfLease || 'Not Applicable',
      dateCommencementLease: raw.dateCommencementLease || 'Not Applicable',
      periodOfLease: raw.periodOfLease || 'Not Applicable',
      termsOfRenewal: raw.termsOfRenewal || 'Not Applicable',
      leasePremiumRentPerAnnum: raw.leasePremiumRentPerAnnum || 'Not Applicable',
      unexpiredPeriodOfLease: raw.unexpiredPeriodOfLease || 'Not Applicable',
      initialPremium: raw.initialPremium || 'Not Applicable',
      groundRentPerAnnum: raw.groundRentPerAnnum || 'Not Applicable',
      unearnedIncreasePayable: raw.unearnedIncreasePayable || 'Not Applicable',
      leasePermitsMortgage: raw.leasePermitsMortgage || 'Not Applicable',

      // 2. Rent Details
      rentOccupationStatus: raw.rentOccupationStatus || 'The Plot is occupied by Owner',
      tenantNames: raw.tenantNames || 'Not Applicable',
      tenantPortionOccupied: raw.tenantPortionOccupied || 'Not Applicable',
      monthlyAnnualRentPaid: raw.monthlyAnnualRentPaid || 'Not Applicable',
      grossRentReceived: raw.grossRentReceived || 'Not Applicable',

      // 3. Brief Description of Property
      detailedAddressWithPin: raw.detailedAddressWithPin || prefill?.propertyAddress || '',
      municipalityWardNo: raw.municipalityWardNo || '',
      streetNo: raw.streetNo || '',
      surveyPlotNo: raw.surveyPlotNo || raw.plotNo || '',
      briefKhataNo: raw.briefKhataNo || raw.khataNo || '',
      mouza: raw.mouza || '',
      thanaNo: raw.thanaNo || '',
      tehasilNo: raw.tehasilNo || '',
      tehasil: raw.tehasil || '',
      sro: raw.sro || '',
      policeStation: raw.policeStation || '',
      villageTownCity: raw.villageTownCity || 'City',
      district: raw.district || prefill?.serviceRequest?.city || '',
      state: raw.state || 'Odisha',

      dimensionDocEastWest: raw.dimensionDocEastWest || 'As per Sketch Map',
      dimensionDocNorthSouth: raw.dimensionDocNorthSouth || 'As per Sketch Map',
      dimensionMeasEastWest: raw.dimensionMeasEastWest || 'As per Sketch Map',
      dimensionMeasNorthSouth: raw.dimensionMeasNorthSouth || 'As per Sketch Map',
      extentOfSite: raw.extentOfSite || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      extentConsideredValuation: raw.extentConsideredValuation || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),

      documentPlotBoundaries: defaultPlots,
      verifiedBoundaryEast: raw.verifiedBoundaryEast || '',
      verifiedBoundaryWest: raw.verifiedBoundaryWest || '',
      verifiedBoundaryNorth: raw.verifiedBoundaryNorth || '',
      verifiedBoundarySouth: raw.verifiedBoundarySouth || '',
      sketchEnclosed: raw.sketchEnclosed || 'Yes, Enclosed',

      // 4. Characteristics of the Site
      levelOfLand: raw.levelOfLand || 'Leveled and Plain',
      useToWhichCanBePut: raw.useToWhichCanBePut || 'Residential cum Commercial Purpose',
      easementAgreements: raw.easementAgreements || 'No such agreement verified',
      restrictiveCovenant: raw.restrictiveCovenant || 'No',
      approvalLetterNoDateDevelopment: raw.approvalLetterNoDateDevelopment || 'Not Applicable',
      buildingUseCertificateObtained: raw.buildingUseCertificateObtained || 'Not Applicable',
      townPlanningSchemeInclusion: raw.townPlanningSchemeInclusion || '',
      cornerOrIntermittentPlot: raw.cornerOrIntermittentPlot || 'Intermittent Plot',
      isLandLocked: raw.isLandLocked || 'No',
      freeAccessAndProximity: raw.freeAccessAndProximity || 'Yes (15 ft wide CC Road) / Bike, Car, Bus',
      roadFacilities: raw.roadFacilities || 'Yes, Available at site',
      roadKindAndWidth: raw.roadKindAndWidth || '15 ft wide BT Road',
      distMunicipalOffice: raw.distMunicipalOffice || '',
      distMunicipalLimits: raw.distMunicipalLimits || '',
      waterPotentialities: raw.waterPotentialities || 'Good',
      possibilityFlooding: raw.possibilityFlooding || 'No',
      undergroundSewerageAvailable: raw.undergroundSewerageAvailable || 'No',
      drainageSystemsAvailable: raw.drainageSystemsAvailable || 'Surface Drainage',
      powerSupplyAvailable: raw.powerSupplyAvailable || 'Yes',
      surroundingDevelopment: raw.surroundingDevelopment || 'Residential Buildings',

      proximitySchool: raw.proximitySchool || '',
      proximityCollege: raw.proximityCollege || '',
      proximityHospital: raw.proximityHospital || '',
      proximityMarket: raw.proximityMarket || '',
      proximityBusStand: raw.proximityBusStand || '',
      proximityRailwayStation: raw.proximityRailwayStation || '',
      proximityOtherPlace: raw.proximityOtherPlace || '',
      latitudeLongitude: raw.latitudeLongitude || '',
      locationAdvantages: raw.locationAdvantages || '',
      locationDisadvantages: raw.locationDisadvantages || 'Nothing Observed',

      // 5. Other Issues / Points
      landAcquisitionNotification: raw.landAcquisitionNotification || 'No such documents verified',
      developmentContributionDemanded: raw.developmentContributionDemanded || 'No such documents verified',
      landCeilingEnactments: raw.landCeilingEnactments || 'No such documents verified',
      salesInstancesInLocality: raw.salesInstancesInLocality || 'Transactions of the property are not available in the locality',
      salesBasisArrivingLandRate: raw.salesBasisArrivingLandRate || 'The present market rate of land confirmed through local enquiry and property dealers and found to be acceptable.',
      adoptedLandRateRationale: raw.adoptedLandRateRationale || '',

      // 6. Valuation of Land
      previousValuationDetails: raw.previousValuationDetails || 'Not Available / Not Applicable',
      presentValuationApproachDetails: raw.presentValuationApproachDetails || 'Land & Building method of valuation has been adopted',
      landAreaTotal: raw.landAreaTotal || (landAreaValue ? String(parseSqftFromArea('', landAreaUnit, landAreaValue)) : ''),
      landGovtBenchmarkRate: raw.landGovtBenchmarkRate || '',
      landGovtValueTotal: raw.landGovtValueTotal || '',
      landMarketRate: raw.landMarketRate || '',
      landMarketValueTotal: raw.landMarketValueTotal || '',
      landDistressValue: raw.landDistressValue || '',
      landRealisableValue: raw.landRealisableValue || '',
      distressSalePct: raw.distressSalePct !== undefined ? String(raw.distressSalePct) : '85',
      realisableValuePct: raw.realisableValuePct !== undefined ? String(raw.realisableValuePct) : '95',

      // Valuation of Building
      // 1. Basic Info
      buildingType: raw.buildingType || 'Residential Cum Commercial',
      yearCommencementCompletion: raw.yearCommencementCompletion || '',
      typeOfConstruction: raw.typeOfConstruction || 'RCC Frames',
      estimatedFutureLife: raw.estimatedFutureLife || '60 Yrs',
      farFsiPermissibleUtilized: raw.farFsiPermissibleUtilized || 'FAR: 3.46',
      buildingApprovalAuthorityDetails: raw.buildingApprovalAuthorityDetails || '',
      constructionAsPerPlanDeviations: raw.constructionAsPerPlanDeviations || 'Yes',

      builtUpAreaAssessmentHolding: raw.builtUpAreaAssessmentHolding || '',
      builtUpAreaAsPerActual: raw.builtUpAreaAsPerActual || '',
      carpetAreaTotal: raw.carpetAreaTotal || '',
      saleableAreaTotal: raw.saleableAreaTotal || '',

      buildingOwnerOccupiedTenanted: raw.buildingOwnerOccupiedTenanted || 'Owner Occupied',
      ownerOccupiedPortion: raw.ownerOccupiedPortion || 'Not Applicable',
      isUnderRentControlAct: raw.isUnderRentControlAct || 'No',
      buildingTenantNames: raw.buildingTenantNames || 'Not Applicable',
      buildingTenantPortions: raw.buildingTenantPortions || 'Not Applicable',
      buildingMonthlyRent: raw.buildingMonthlyRent || 'Not Applicable',
      buildingGrossRent: raw.buildingGrossRent || 'Not Applicable',
      occupantsRelatedToOwner: raw.occupantsRelatedToOwner || 'Not Applicable',
      fixturesAmountRecovered: raw.fixturesAmountRecovered || 'Borne by Owner',
      waterElectricityChargesBorneBy: raw.waterElectricityChargesBorneBy || 'Borne by Owner',
      isRentDisputePendingCourt: raw.isRentDisputePendingCourt || 'No',
      hasStandardRentFixed: raw.hasStandardRentFixed || 'Not Applicable',
      tenantBearMaintenance: raw.tenantBearMaintenance || 'Not Applicable',
      liftMaintenanceBorneBy: raw.liftMaintenanceBorneBy || 'Not Applicable',
      pumpMaintenanceBorneBy: raw.pumpMaintenanceBorneBy || 'Borne by Owner',
      commonElectricityBorneBy: raw.commonElectricityBorneBy || 'Borne by Owner',
      propertyTaxAmountBorneBy: raw.propertyTaxAmountBorneBy || 'No such document is verified',
      isBuildingInsuredDetails: raw.isBuildingInsuredDetails || 'No such document is verified',
      statutoryDuesPaid: raw.statutoryDuesPaid || 'No such document is verified',
      buildingFreeAccess: raw.buildingFreeAccess || 'Yes',

      // 2. Technical Details
      numberOfFloorsAndHeight: raw.numberOfFloorsAndHeight || "G+3 Storied Building & Height: 10'-6\"",
      floorDetails: (raw.floorDetails && raw.floorDetails.length > 0) ? raw.floorDetails : [
        { floorName: 'Ground Floor', height: raw.floorHeightGF || "10'-6\"", plinthArea: raw.plinthAreaGF || '', doorsWindows: raw.doorsWindowsGF || 'Iron Shutter', flooring: raw.flooringGF || 'VT Flooring', wallFinishing: raw.wallFinishingGF || 'Cement Plastering, Putty, Painting' },
        { floorName: 'First Floor', height: raw.floorHeightFF || 'Do', plinthArea: raw.plinthAreaFF || '', doorsWindows: raw.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter', flooring: raw.flooringFF || 'Do', wallFinishing: raw.wallFinishingFF || 'Do' },
        { floorName: 'Second Floor', height: raw.floorHeightSF || 'Do', plinthArea: raw.plinthAreaSF || '', doorsWindows: raw.doorsWindowsSF || 'Do', flooring: raw.flooringSF || 'Do', wallFinishing: raw.wallFinishingSF || 'Do' },
        { floorName: 'Third Floor', height: raw.floorHeightTF || 'Do', plinthArea: raw.plinthAreaTF || '', doorsWindows: raw.doorsWindowsTF || 'Do', flooring: raw.flooringTF || 'Do', wallFinishing: raw.wallFinishingTF || 'Do' },
      ],
      floorHeightGF: raw.floorHeightGF || "10'-6\"",
      floorHeightFF: raw.floorHeightFF || 'Do',
      floorHeightSF: raw.floorHeightSF || 'Do',
      floorHeightTF: raw.floorHeightTF || 'Do',
      plinthAreaGF: raw.plinthAreaGF || '',
      plinthAreaFF: raw.plinthAreaFF || '',
      plinthAreaSF: raw.plinthAreaSF || '',
      plinthAreaTF: raw.plinthAreaTF || '',
      buildingConditionExterior: raw.buildingConditionExterior || 'Good',
      buildingConditionInterior: raw.buildingConditionInterior || 'Good',
      foundationType: raw.foundationType || 'Column Foundation',
      doorsWindowsGF: raw.doorsWindowsGF || 'Iron Shutter',
      doorsWindowsFF: raw.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter',
      doorsWindowsSF: raw.doorsWindowsSF || 'Do',
      doorsWindowsTF: raw.doorsWindowsTF || 'Do',
      flooringGF: raw.flooringGF || 'VT Flooring',
      flooringFF: raw.flooringFF || 'Do',
      flooringSF: raw.flooringSF || 'Do',
      flooringTF: raw.flooringTF || 'Do',
      wallFinishingGF: raw.wallFinishingGF || 'Cement Plastering, Putty, Painting',
      wallFinishingFF: raw.wallFinishingFF || 'Do',
      wallFinishingSF: raw.wallFinishingSF || 'Do',
      wallFinishingTF: raw.wallFinishingTF || 'Do',

      // 3. Construction Specifications
      specFoundation: raw.specFoundation || 'Column Foundation',
      specBasement: raw.specBasement || 'No',
      specSuperstructure: raw.specSuperstructure || 'Brick Masonry Super Structure',
      specJoineryDoorsWindows: raw.specJoineryDoorsWindows || 'Sal wood choukath with non sal wood shutter',
      specRccWorks: raw.specRccWorks || 'Lintel, Chajja, Beam',
      specPlastering: raw.specPlastering || 'Cement Plastering',
      specFlooringSkirting: raw.specFlooringSkirting || 'VT Flooring',
      specSpecialFinishing: raw.specSpecialFinishing || 'Yes',
      specRoofing: raw.specRoofing || 'RCC Roof',
      specDrainage: raw.specDrainage || 'Surface Drainage',
      specDecorativeFeatures: raw.specDecorativeFeatures || 'Interior work is done on Second & Third Floor',
      specInternalWiring: raw.specInternalWiring || 'Concealed',
      specWiringFittingsClass: raw.specWiringFittingsClass || 'Superior',
      specSanitaryInstallation: raw.specSanitaryInstallation || 'Yes',
      specNoOfGeysers: raw.specNoOfGeysers || 'Not Verified',
      specSanitaryFittingsClass: raw.specSanitaryFittingsClass || 'Superior',
      specCompoundWall: raw.specCompoundWall || 'Yes',
      specCompoundWallHeightLength: raw.specCompoundWallHeightLength || "Height: 5'-0\", Length: 150'-0\"",
      specCompoundWallType: raw.specCompoundWallType || 'Brick Masonry Wall with Iron Gate',
      specLiftsCapacity: raw.specLiftsCapacity || 'No',
      specUndergroundSump: raw.specUndergroundSump || 'Not Available',
      specOverheadTank: raw.specOverheadTank || 'Yes',
      specOverheadTankLocation: raw.specOverheadTankLocation || 'On the top of the roof',
      specOverheadTankCapacity: raw.specOverheadTankCapacity || '2000 Liters',
      specPumpsHp: raw.specPumpsHp || '1 Nos & 1 HP Pump',
      specRoadsPavingCompound: raw.specRoadsPavingCompound || 'No',
      specSewageDisposal: raw.specSewageDisposal || 'Connected to Public Sewers',
      specQualityClassConstruction: raw.specQualityClassConstruction || 'Good',

      // 4. Details of Building Valuation Table
      buildingValuationRows: defaultBldgRows,

      // 5. Sub-Schedules
      isExtraItemsNA: raw.isExtraItemsNA !== undefined ? raw.isExtraItemsNA : true,
      extraItems: Array.isArray(raw.extraItems) ? raw.extraItems : [
        { name: 'Portico', cost: '' },
        { name: 'Ornamental Front Door', cost: '' },
        { name: 'Sit Out / Verandah with Steel Grills', cost: '' },
        { name: 'Overhead Water Tank', cost: '' },
        { name: 'Extra Steel / Collapsible Gates', cost: '' },
      ],
      extraItemsTotal: raw.extraItemsTotal || 'Rs. 0.00',

      isAmenitiesNA: raw.isAmenitiesNA !== undefined ? raw.isAmenitiesNA : true,
      amenities: Array.isArray(raw.amenities) ? raw.amenities : [
        { name: 'Wardrobes', cost: '' },
        { name: 'Glazed Tiles', cost: '' },
        { name: 'Extra Sinks and Bath Tub', cost: '' },
        { name: 'Marble / Ceramic Tiles Flooring', cost: '' },
        { name: 'Interior Decorations', cost: '' },
        { name: 'Architectural Elevation Works', cost: '' },
        { name: 'Paneling Works', cost: '' },
        { name: 'Aluminium Works', cost: '' },
        { name: 'Aluminium Hand Rails', cost: '' },
        { name: 'False Ceiling', cost: '' },
      ],
      amenitiesTotal: raw.amenitiesTotal || 'Rs. 0.00',

      isMiscNA: raw.isMiscNA !== undefined ? raw.isMiscNA : true,
      miscItems: Array.isArray(raw.miscItems) ? raw.miscItems : [
        { name: 'Separate Toilet Room', cost: '' },
        { name: 'Separate Lumber Room', cost: '' },
        { name: 'Separate Water Tank / Sump', cost: '' },
        { name: 'Trees, Gardening', cost: '' },
      ],
      miscItemsTotal: raw.miscItemsTotal || 'Rs. 0.00',

      isServicesNA: raw.isServicesNA !== undefined ? raw.isServicesNA : true,
      servicesItems: Array.isArray(raw.servicesItems) ? raw.servicesItems : [
        { name: 'Water Supply Arrangement', cost: '' },
        { name: 'Drainage Arrangement', cost: '' },
        { name: 'Compound Wall', cost: '' },
        { name: 'C.B Deposit, Fitting etc.', cost: '' },
        { name: 'Pavement', cost: '' },
      ],
      servicesItemsTotal: raw.servicesItemsTotal || 'Rs. 0.00',

      // 6.0 Total Abstract of Entire Property
      abstractGovtLand: raw.abstractGovtLand || '',
      abstractMarketLand: raw.abstractMarketLand || '',
      abstractRealLand: raw.abstractRealLand || '',
      abstractDistressLand: raw.abstractDistressLand || '',

      abstractGovtBuilding: raw.abstractGovtBuilding || 'Rs. 0.00',
      abstractMarketBuilding: raw.abstractMarketBuilding || '',
      abstractRealBuilding: raw.abstractRealBuilding || '',
      abstractDistressBuilding: raw.abstractDistressBuilding || '',

      abstractGovtExtra: raw.abstractGovtExtra || 'Rs. 0.00',
      abstractMarketExtra: raw.abstractMarketExtra || 'Rs. 0.00',
      abstractRealExtra: raw.abstractRealExtra || 'Rs. 0.00',
      abstractDistressExtra: raw.abstractDistressExtra || 'Rs. 0.00',

      abstractGovtAmenities: raw.abstractGovtAmenities || 'Rs. 0.00',
      abstractMarketAmenities: raw.abstractMarketAmenities || 'Rs. 0.00',
      abstractRealAmenities: raw.abstractRealAmenities || 'Rs. 0.00',
      abstractDistressAmenities: raw.abstractDistressAmenities || 'Rs. 0.00',

      abstractGovtMisc: raw.abstractGovtMisc || 'Rs. 0.00',
      abstractMarketMisc: raw.abstractMarketMisc || 'Rs. 0.00',
      abstractRealMisc: raw.abstractRealMisc || 'Rs. 0.00',
      abstractDistressMisc: raw.abstractDistressMisc || 'Rs. 0.00',

      abstractGovtServices: raw.abstractGovtServices || 'Rs. 0.00',
      abstractMarketServices: raw.abstractMarketServices || 'Rs. 0.00',
      abstractRealServices: raw.abstractRealServices || 'Rs. 0.00',
      abstractDistressServices: raw.abstractDistressServices || 'Rs. 0.00',

      abstractGovtTotal: raw.abstractGovtTotal || '',
      abstractMarketTotal: raw.abstractMarketTotal || '',
      abstractRealTotal: raw.abstractRealTotal || '',
      abstractDistressTotal: raw.abstractDistressTotal || '',

      abstractGovtSay: raw.abstractGovtSay || '',
      abstractMarketSay: raw.abstractMarketSay || '',
      abstractRealSay: raw.abstractRealSay || '',
      abstractDistressSay: raw.abstractDistressSay || '',

      // Remarks, Basis & Valuation Opinion
      valuationRemarksBox: raw.valuationRemarksBox || '',
      basisOfValuationStatement: raw.basisOfValuationStatement || '(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)',
      fairMarketValue: raw.fairMarketValue || '',
      fairMarketValueWords: raw.fairMarketValueWords || '',
      realisableValue: raw.realisableValue || '',
      realisableValueWords: raw.realisableValueWords || '',
      bookValueOfLand: raw.bookValueOfLand || '',
      bookValueOfLandWords: raw.bookValueOfLandWords || '',
      distressValue: raw.distressValue || '',
      distressValueWords: raw.distressValueWords || '',
      insurableValueOfProperty: raw.insurableValueOfProperty || '',
      insurableValueOfPropertyWords: raw.insurableValueOfPropertyWords || '',

      // Declaration & Sign-off
      declarationItems: raw.declarationItems || [],
      reportPagesCount: raw.reportPagesCountLocked ? (raw.reportPagesCount || '') : '',
      reportPagesCountLocked: Boolean(raw.reportPagesCountLocked),
      siteEngineerName: raw.siteEngineerName || 'MR. SIBA BEHERA',
      empanelledValuerName: raw.empanelledValuerName || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)',
      valuerQualifications: (!raw.valuerQualifications || raw.valuerQualifications === 'B.Tech (Civil), M.Val (RE)' || raw.valuerQualifications.includes('B.Tech (Civil)'))
        ? 'B.E. (Civil), M.Tech (Civil), M.Sc. (Real Estate Valuation), MBA (Finance), MBA (HR)'
        : raw.valuerQualifications,
      valuerIovRegNo: raw.valuerIovRegNo || 'No. F-26377',
      valuerWealthTaxRegNo: raw.valuerWealthTaxRegNo || 'Regd. No.-107/2016-17, Cat -I',
      declarationDate: raw.declarationDate || formatReportDate(new Date()),

      // Checklist
      checklist: defaultChecklist,

      // Enclosures
      rorImageUrl: raw.rorImageUrl || '',
      locationMapImageUrl: raw.locationMapImageUrl || '',
      bhuNakshaImageUrl: raw.bhuNakshaImageUrl || '',
      guidelineValueImageUrl: raw.guidelineValueImageUrl || '',
      propertyPhotos: Array.isArray(raw.propertyPhotos) ? raw.propertyPhotos : [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [previewedPageCount, setPreviewedPageCount] = useState<number | null>(null);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft Effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          console.error('Autosave error:', res.error);
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (e) {
        console.error('Autosave network error:', e);
        setAutoSaveStatus('error');
      }
    }, 800);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      try {
        navigator.sendBeacon('/api/save-draft', JSON.stringify({ projectId, fields }));
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Field change handler
  const handleChange = useCallback((field: keyof BandhanSMEReportFields, value: any) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'reportDate') {
        if (!prev.dateOfValuation || prev.dateOfValuation === prev.reportDate) {
          next.dateOfValuation = value;
        }
        if (!prev.declarationDate || prev.declarationDate === prev.reportDate) {
          next.declarationDate = value;
        }
      }
      return next;
    });
  }, []);

  // Multi-Plot Boundary Handlers
  const handleAddPlotBoundary = () => {
    const nextPlotNo = `Plot No: Schedule ${fields.documentPlotBoundaries?.length ? fields.documentPlotBoundaries.length + 1 : 1}`;
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: [
        ...(prev.documentPlotBoundaries || []),
        { plotNo: nextPlotNo, east: '', west: '', north: '', south: '' },
      ],
    }));
  };

  const handleRemovePlotBoundary = (index: number) => {
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: prev.documentPlotBoundaries?.filter((_, i) => i !== index),
    }));
  };

  const handlePlotBoundaryChange = (index: number, key: keyof BandhanSMEPlotBoundary, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.documentPlotBoundaries || [])];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, documentPlotBoundaries: updated };
    });
  };

  // Floor Details Handlers (Points A, B, E, F, G)
  const handleAddFloorDetail = () => {
    setFields((prev) => {
      const current = prev.floorDetails || [];
      const newFloorIdx = current.length + 1;
      const defaultName = newFloorIdx === 1 ? 'Ground Floor' : newFloorIdx === 2 ? 'First Floor' : newFloorIdx === 3 ? 'Second Floor' : newFloorIdx === 4 ? 'Third Floor' : `${newFloorIdx}th Floor`;
      const lastFloor = current[current.length - 1];
      const newFloor: BandhanSMEFloorDetail = {
        floorName: defaultName,
        height: lastFloor?.height || 'Do',
        plinthArea: '',
        doorsWindows: lastFloor?.doorsWindows || 'Do',
        flooring: lastFloor?.flooring || 'Do',
        wallFinishing: lastFloor?.wallFinishing || 'Do',
      };
      return {
        ...prev,
        floorDetails: [...current, newFloor],
      };
    });
  };

  const handleRemoveFloorDetail = (index: number) => {
    setFields((prev) => {
      const current = prev.floorDetails || [];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        floorDetails: current.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleFloorDetailChange = (index: number, key: keyof BandhanSMEFloorDetail, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.floorDetails || [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, floorDetails: updated };
    });
  };

  // Building Valuation Table Handlers
  const handleAddBuildingRow = () => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: [
        ...(prev.buildingValuationRows || []),
        {
          description: '',
          plinthArea: '',
          height: "10'-6\"",
          age: '',
          replacementRate: '',
          replacementCost: '',
          depreciation: '',
          valueAfterDepreciation: '',
        },
      ],
    }));
  };

  const handleRemoveBuildingRow = (index: number) => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: prev.buildingValuationRows?.filter((_, i) => i !== index),
    }));
  };

  const handleBuildingRowChange = (index: number, key: keyof BandhanSMEBuildingValuationRow, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.buildingValuationRows || [])];
      const row = { ...updated[index] };

      if (key === 'plinthArea' || key === 'replacementRate' || key === 'depreciation' || key === 'replacementCost' || key === 'valueAfterDepreciation') {
        row[key] = sanitizePositiveFloat(val);
      } else if (key === 'age') {
        row[key] = sanitizePositiveInt(val, 3);
      } else {
        row[key] = val;
      }

      // Auto calculate replacement cost & net value if plinth and rate exist
      const p = parseNum(key === 'plinthArea' ? val : row.plinthArea);
      const r = parseNum(key === 'replacementRate' ? val : row.replacementRate);
      let cost = parseNum(key === 'replacementCost' ? val : row.replacementCost);

      if (p > 0 && r > 0) {
        cost = Math.round((p * r + Number.EPSILON) * 100) / 100;
        row.replacementCost = `Rs. ${formatCurrencyINR(cost)}`;
      } else if (key === 'plinthArea' || key === 'replacementRate') {
        if (!p || !r) {
          row.replacementCost = '';
          cost = 0;
        }
      }

      const dep = parseNum(key === 'depreciation' ? val : row.depreciation);
      if (cost > 0) {
        const net = Math.max(0, Math.round((cost - dep + Number.EPSILON) * 100) / 100);
        row.valueAfterDepreciation = `Rs. ${formatCurrencyINR(net)}`;
      } else if (key === 'depreciation' || key === 'plinthArea' || key === 'replacementRate') {
        row.valueAfterDepreciation = '';
      }

      updated[index] = row;
      return { ...prev, buildingValuationRows: updated };
    });
  };

  // Checklist handler
  const handleChecklistChange = (index: number, answer: 'Yes' | 'No' | 'NA') => {
    setFields((prev) => {
      const updated = [...(prev.checklist || [])];
      updated[index] = { ...updated[index], answer };
      return { ...prev, checklist: updated };
    });
  };

  // Sub-Schedule items handler
  const handleSubScheduleChange = (
    scheduleKey: 'extraItems' | 'amenities' | 'miscItems' | 'servicesItems',
    index: number,
    costVal: string
  ) => {
    const cleanCost = sanitizePositiveFloat(costVal);
    setFields((prev) => {
      const updated = [...(prev[scheduleKey] || [])];
      updated[index] = { ...updated[index], cost: cleanCost };
      return { ...prev, [scheduleKey]: updated };
    });
  };

  // Photos state derivation
  const propertyImages: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? p : p.url)).filter(Boolean);
    }
    if (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0) {
      return fields.propertyImages;
    }
    return [];
  }, [fields.propertyPhotos, fields.propertyImages]);

  const propertyImageNames: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyImageNames) && fields.propertyImageNames.length > 0) {
      return fields.propertyImageNames;
    }
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? '' : (p.caption ?? '')));
    }
    return [];
  }, [fields.propertyImageNames, fields.propertyPhotos]);

  // Dynamic Total Pages Calculation (accounting for 2 maps per page & 2 photos per page)
  const dynamicTotalPages = useMemo(() => {
    const basePages = 8;
    const photoCount = propertyImages.length;
    const photoPages = photoCount > 0 ? Math.ceil(photoCount / 2) : 0;
    const rorCount = (fields.mouzaMapImages && fields.mouzaMapImages.length > 0) ? fields.mouzaMapImages.length : (fields.rorImageUrl ? 1 : 0);
    const locCount = (fields.locationMapImages && fields.locationMapImages.length > 0) ? fields.locationMapImages.length : (fields.locationMapImageUrl ? 1 : 0);
    const bhuCount = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0) ? fields.cadastralMapImages.length : ((fields.bhuNakshaImages && fields.bhuNakshaImages.length > 0) ? fields.bhuNakshaImages.length : (fields.bhuNakshaImageUrl ? 1 : 0));
    const guideCount = (fields.sketchMapImages && fields.sketchMapImages.length > 0) ? fields.sketchMapImages.length : ((fields.guidelineRateImages && fields.guidelineRateImages.length > 0) ? fields.guidelineRateImages.length : (fields.guidelineValueImageUrl ? 1 : 0));
    const bdaCount = fields.bdaMapImages?.length || 0;
    const totalMaps = rorCount + locCount + bhuCount + guideCount + bdaCount;
    const mapPages = totalMaps > 0 ? Math.ceil(totalMaps / 2) : 0;

    return String(basePages + photoPages + mapPages);
  }, [
    propertyImages.length,
    fields.mouzaMapImages,
    fields.rorImageUrl,
    fields.locationMapImages,
    fields.locationMapImageUrl,
    fields.cadastralMapImages,
    fields.bhuNakshaImages,
    fields.bhuNakshaImageUrl,
    fields.sketchMapImages,
    fields.guidelineRateImages,
    fields.guidelineValueImageUrl,
    fields.bdaMapImages,
  ]);

  // Measure exact PDF page count in the background
  useEffect(() => {
    let cancelled = false;
    const calculateExactPages = async () => {
      try {
        const renderer = new PDFBandhanSMERenderer();
        const { pageCount } = await renderer.generateBandhanSMEReportWithCount(fields);
        if (!cancelled && pageCount > 0) {
          setPreviewedPageCount(pageCount);
        }
      } catch {
        // graceful fallback to dynamicTotalPages
      }
    };
    const timer = setTimeout(calculateExactPages, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    fields.propertyImages,
    fields.propertyPhotos,
    fields.mouzaMapImages,
    fields.rorImageUrl,
    fields.locationMapImages,
    fields.locationMapImageUrl,
    fields.cadastralMapImages,
    fields.bhuNakshaImages,
    fields.bhuNakshaImageUrl,
    fields.sketchMapImages,
    fields.guidelineRateImages,
    fields.guidelineValueImageUrl,
    fields.bdaMapImages,
    fields.buildingValuationRows,
    fields.propAt,
    fields.detailedAddressWithPin,
  ]);

  // Live Auto Calculation Engine (Valuation, Land, Building, Sub-schedules & Abstract)
  useEffect(() => {
    // 1. Land Calculations
    const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
    const lMktRate = parseNum(fields.landMarketRate);
    const lGovtRate = parseNum(fields.landGovtBenchmarkRate);

    const landMarketVal = (pArea > 0 && lMktRate > 0) ? Math.round(pArea * lMktRate) : 0;
    const landGovtVal = (pArea > 0 && lGovtRate > 0) ? Math.round(pArea * lGovtRate) : 0;
    const distPct = (fields.distressSalePct !== undefined && fields.distressSalePct !== '') ? parseNum(fields.distressSalePct) : 85;
    const realPct = (fields.realisableValuePct !== undefined && fields.realisableValuePct !== '') ? parseNum(fields.realisableValuePct) : 95;
    const landDistVal = Math.round(landMarketVal * (distPct / 100));
    const landRealVal = Math.round(landMarketVal * (realPct / 100));

    // 2. Building Calculations
    let bldgNetVal = 0;
    (fields.buildingValuationRows || []).forEach((br) => {
      const v = parseNum(br.valueAfterDepreciation || br.replacementCost);
      bldgNetVal += v;
    });
    const bldgDistVal = Math.round(bldgNetVal * (distPct / 100));
    const bldgRealVal = Math.round(bldgNetVal * (realPct / 100));

    // 3. Sub-schedules summation
    const sumSched = (items?: BandhanSMESubScheduleItem[], isNA?: boolean) => {
      if (isNA || !items) return 0;
      return items.reduce((acc, it) => acc + parseNum(it.cost), 0);
    };

    const extraVal = sumSched(fields.extraItems, fields.isExtraItemsNA);
    const amenitiesVal = sumSched(fields.amenities, fields.isAmenitiesNA);
    const miscVal = sumSched(fields.miscItems, fields.isMiscNA);
    const servicesVal = sumSched(fields.servicesItems, fields.isServicesNA);

    // 4. Total Abstract Matrix
    const totalGovt = landGovtVal;
    const totalMarket = landMarketVal + bldgNetVal + extraVal + amenitiesVal + miscVal + servicesVal;
    const totalReal = Math.round(totalMarket * (realPct / 100));
    const totalDist = Math.round(totalMarket * (distPct / 100));

    const roundSay = (n: number) => Math.round(n / 1000) * 1000;

    setFields((prev) => {
      let changed = false;
      const next = { ...prev };

      // Sync Land Valuation Totals
      const landMktStr = landMarketVal > 0 ? `Rs.${formatCurrencyINR(landMarketVal)}/-` : '';
      const landGovtStr = landGovtVal > 0 ? `Rs.${formatCurrencyINR(landGovtVal)}/-` : '';
      const landDistStr = landDistVal > 0 ? `Rs.${formatCurrencyINR(landDistVal)}/-` : '';
      const landRealStr = landRealVal > 0 ? `Rs.${formatCurrencyINR(landRealVal)}/-` : '';

      if (landMarketVal > 0 && prev.landMarketValueTotal !== landMktStr) {
        next.landMarketValueTotal = landMktStr;
        next.landGovtValueTotal = landGovtStr;
        next.landDistressValue = landDistStr;
        next.landRealisableValue = landRealStr;
        changed = true;
      }

      // Sync Abstract Matrix
      if (landMarketVal > 0) {
        const agl = `Rs. ${formatCurrencyINR(landGovtVal)}`;
        const aml = `Rs. ${formatCurrencyINR(landMarketVal)}`;
        const arl = `Rs. ${formatCurrencyINR(landRealVal)}`;
        const adl = `Rs. ${formatCurrencyINR(landDistVal)}`;
        if (prev.abstractGovtLand !== agl || prev.abstractMarketLand !== aml) {
          next.abstractGovtLand = agl;
          next.abstractMarketLand = aml;
          next.abstractRealLand = arl;
          next.abstractDistressLand = adl;
          changed = true;
        }
      }
      if (bldgNetVal > 0) {
        const amb = `Rs. ${formatCurrencyINR(bldgNetVal)}`;
        const arb = `Rs. ${formatCurrencyINR(bldgRealVal)}`;
        const adb = `Rs. ${formatCurrencyINR(bldgDistVal)}`;
        if (prev.abstractMarketBuilding !== amb) {
          next.abstractMarketBuilding = amb;
          next.abstractRealBuilding = arb;
          next.abstractDistressBuilding = adb;
          changed = true;
        }
      }

      // Sub-schedules totals sync
      const exTotStr = extraVal > 0 ? `Rs. ${formatCurrencyINR(extraVal)}` : 'Rs. 0.00';
      const amTotStr = amenitiesVal > 0 ? `Rs. ${formatCurrencyINR(amenitiesVal)}` : 'Rs. 0.00';
      const miTotStr = miscVal > 0 ? `Rs. ${formatCurrencyINR(miscVal)}` : 'Rs. 0.00';
      const seTotStr = servicesVal > 0 ? `Rs. ${formatCurrencyINR(servicesVal)}` : 'Rs. 0.00';

      if (prev.extraItemsTotal !== exTotStr) { next.extraItemsTotal = exTotStr; changed = true; }
      if (prev.amenitiesTotal !== amTotStr) { next.amenitiesTotal = amTotStr; changed = true; }
      if (prev.miscItemsTotal !== miTotStr) { next.miscItemsTotal = miTotStr; changed = true; }
      if (prev.servicesItemsTotal !== seTotStr) { next.servicesItemsTotal = seTotStr; changed = true; }

      if (totalMarket > 0) {
        const agt = `Rs. ${formatCurrencyINR(totalGovt)}`;
        const amt = `Rs. ${formatCurrencyINR(totalMarket)}`;
        const art = `Rs. ${formatCurrencyINR(totalReal)}`;
        const adt = `Rs. ${formatCurrencyINR(totalDist)}`;

        const ags = `Rs. ${formatCurrencyINR(roundSay(totalGovt))}`;
        const ams = `Rs. ${formatCurrencyINR(roundSay(totalMarket))}`;
        const ars = `Rs. ${formatCurrencyINR(roundSay(totalReal))}`;
        const ads = `Rs. ${formatCurrencyINR(roundSay(totalDist))}`;

        const fmv = `Rs.${formatCurrencyINR(roundSay(totalMarket))}/-`;
        const fmw = formatIndianCurrency(roundSay(totalMarket));
        const rv = `Rs.${formatCurrencyINR(roundSay(totalReal))}/-`;
        const rvw = formatIndianCurrency(roundSay(totalReal));
        const bvl = `Rs.${formatCurrencyINR(roundSay(landGovtVal))}/-`;
        const bvw = formatIndianCurrency(roundSay(landGovtVal));
        const dv = `Rs.${formatCurrencyINR(roundSay(totalDist))}/-`;
        const dvw = formatIndianCurrency(roundSay(totalDist));
        const ipv = `Rs.${formatCurrencyINR(bldgDistVal)}/-`;
        const ipvw = formatIndianCurrency(bldgDistVal);

        if (prev.abstractMarketSay !== ams || prev.fairMarketValue !== fmv) {
          next.abstractGovtTotal = agt;
          next.abstractMarketTotal = amt;
          next.abstractRealTotal = art;
          next.abstractDistressTotal = adt;

          next.abstractGovtSay = ags;
          next.abstractMarketSay = ams;
          next.abstractRealSay = ars;
          next.abstractDistressSay = ads;

          next.fairMarketValue = fmv;
          next.fairMarketValueWords = fmw;
          next.realisableValue = rv;
          next.realisableValueWords = rvw;
          next.bookValueOfLand = bvl;
          next.bookValueOfLandWords = bvw;
          next.distressValue = dv;
          next.distressValueWords = dvw;
          next.insurableValueOfProperty = ipv;
          next.insurableValueOfPropertyWords = ipvw;
          changed = true;
        }
      }

      if (!prev.reportPagesCountLocked && prev.reportPagesCount !== dynamicTotalPages) {
        next.reportPagesCount = dynamicTotalPages;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    fields.landAreaUnit,
    fields.landAreaValue,
    fields.landAreaTotal,
    fields.extentOfSite,
    fields.areaLandDoc,
    fields.landMarketRate,
    fields.landGovtBenchmarkRate,
    fields.distressSalePct,
    fields.realisableValuePct,
    fields.buildingValuationRows,
    fields.isExtraItemsNA,
    fields.extraItems,
    fields.isAmenitiesNA,
    fields.amenities,
    fields.isMiscNA,
    fields.miscItems,
    fields.isServicesNA,
    fields.servicesItems,
    dynamicTotalPages,
  ]);

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, fields);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Failed to save draft: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Preview PDF
  const handlePreviewPDF = async () => {
    try {
      const { pdfBytes, pageCount } = await generateBandhanSMEReportWithCount(fields);
      setPreviewedPageCount(pageCount);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      alert('Failed to generate PDF preview: ' + e.message);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const { pdfBytes } = await generateBandhanSMEReportWithCount(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Bandhan_Bank_SME_${projectCode || projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for review?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      alert('Report submitted successfully!');
      router.refresh();
    } catch (e: any) {
      alert('Failed to submit report: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Multiple Photo Upload
  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const newPhotos: BandhanSMEPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = '';
        const { dataUrl, blob } = await compressImageFile(file, 1280, 1280, 0.8);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-photo-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload fallback to compressed base64:', storageErr);
        }

        newPhotos.push({ url: uploadedUrl, caption });
      }

      setFields((prev) => ({
        ...prev,
        propertyPhotos: [...(prev.propertyPhotos || []), ...newPhotos],
      }));
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert(`Photo upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handlePhotoRemove = (idx: number) => {
    const updatedPhotos = (fields.propertyPhotos || []).filter((_, i) => i !== idx);
    setFields((prev) => ({
      ...prev,
      propertyPhotos: updatedPhotos,
      propertyImages: Array.isArray(prev.propertyImages) ? prev.propertyImages.filter((_: any, i: number) => i !== idx) : undefined,
      propertyImageNames: Array.isArray(prev.propertyImageNames) ? prev.propertyImageNames.filter((_: any, i: number) => i !== idx) : undefined,
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const updatedPhotos = [...(fields.propertyPhotos || [])];
    if (updatedPhotos[idx]) {
      updatedPhotos[idx] = { ...updatedPhotos[idx], caption: name };
    } else if (propertyImages[idx]) {
      updatedPhotos[idx] = { url: propertyImages[idx], caption: name };
    }
    const updatedNames = [...(Array.isArray(fields.propertyImageNames) ? fields.propertyImageNames : [])];
    while (updatedNames.length <= idx) {
      updatedNames.push('');
    }
    updatedNames[idx] = name;
    setFields((prev) => ({
      ...prev,
      propertyPhotos: updatedPhotos,
      propertyImageNames: updatedNames,
    }));
  };

  const handlePhotoReorder = (newImages: string[], newNames: string[]) => {
    const newPhotos: BandhanSMEPhoto[] = newImages.map((url, idx) => ({
      url,
      caption: newNames[idx] ?? '',
    }));
    setFields((prev) => ({
      ...prev,
      propertyPhotos: newPhotos,
      propertyImages: newImages,
      propertyImageNames: newNames,
    }));
  };

  // Map Handlers for BaseMapsSection
  const handleMapUpload = async (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl, blob } = await compressImageFile(file, 1600, 1600, 0.85);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-${fieldKey}-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Map upload storage fallback to base64:', storageErr);
        }
        uploadedUrls.push(uploadedUrl);
      }
      setFields(prev => {
        const curr = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : (prev[fieldKey] ? [prev[fieldKey]] : []);
        return {
          ...prev,
          [fieldKey]: [...curr, ...uploadedUrls],
        };
      });
    } catch (err: any) {
      console.error('Map upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleMapRemove = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', idx?: number) => {
    if (idx === undefined) {
      setFields(prev => ({ ...prev, [fieldKey]: [] }));
      return;
    }
    setFields(prev => {
      const curr = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : (prev[fieldKey] ? [prev[fieldKey]] : []);
      return {
        ...prev,
        [fieldKey]: curr.filter((_, i) => i !== idx),
      };
    });
  };

  const handleMapReorder = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', newImgs: string[]) => {
    setFields(prev => ({ ...prev, [fieldKey]: newImgs }));
  };

  // Document Handlers for BaseDocumentsSection
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl, blob } = await compressImageFile(file, 1600, 1600, 0.85);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-document-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Document upload storage fallback to base64:', storageErr);
        }
        uploadedUrls.push(uploadedUrl);
      }
      setFields(prev => {
        const currImgs = Array.isArray(prev.documentImages) ? prev.documentImages : [];
        const currNames = Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [];
        const newNames = uploadedUrls.map(() => DEFAULT_DOCUMENT_LABEL);
        return {
          ...prev,
          documentImages: [...currImgs, ...uploadedUrls],
          documentImageNames: [...currNames, ...newNames],
        };
      });
    } catch (err: any) {
      console.error('Document upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleDocumentRemove = (idx: number) => {
    setFields(prev => {
      const currImgs = Array.isArray(prev.documentImages) ? prev.documentImages : [];
      const currNames = Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [];
      return {
        ...prev,
        documentImages: currImgs.filter((_, i) => i !== idx),
        documentImageNames: currNames.filter((_, i) => i !== idx),
      };
    });
  };

  const handleDocumentRename = (idx: number, name: string) => {
    setFields(prev => {
      const currNames = [...(Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [])];
      while (currNames.length <= idx) {
        currNames.push('');
      }
      currNames[idx] = name;
      return {
        ...prev,
        documentImageNames: currNames,
      };
    });
  };

  const handleDocumentReorder = (newImages: string[], newNames: string[]) => {
    setFields(prev => ({
      ...prev,
      documentImages: newImages,
      documentImageNames: newNames,
    }));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Active Configuration Banner */}
        <ActiveConfigBanner
          clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.bankName || fields.organisationTemplate || 'BANDHAN BANK'}
          subclass={fields.organisationSubTemplate || 'SME'}
          serviceType={fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />

        {/* Rework Banner */}
        {fields.reworkNotes && status === 'REPORT_DRAFTING' && (
          <div className="card p-5 border-2 border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Manager Rework Requested</h2>
            </div>
            <p className="text-sm text-red-700 bg-white/60 p-4 rounded-lg border border-red-100 whitespace-pre-wrap">
              {fields.reworkNotes}
            </p>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Header Block */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Bandhan Bank — SME Valuation Report
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory format for SME & Commercial Land & Building Valuations
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ref. No:">
              <input
                type="text"
                className={inputCls}
                value={fields.refNo || ''}
                onChange={(e) => handleChange('refNo', e.target.value)}
                placeholder="e.g. BANDHAN/SME/2026/01"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="Report Date:">
              <BaseDateInput
                value={fields.reportDate || ''}
                onChange={(val) => handleChange('reportDate', val)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>

        {/* 1. BASIC INFORMATION */}
        <Section number={1} id="sec-basic" title="Basic Information (Section I: Points A–M)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="A. Name of the Bank Branch / CBO / Asset Centre:">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed`}
                        value="Bandhan Bank"
                        readOnly
                        disabled
                      />
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Fixed</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.branchDetails || ''}
                      onChange={(e) => {
                        const bDetails = e.target.value;
                        const combined = bDetails ? `Bandhan Bank, ${bDetails}` : 'Bandhan Bank';
                        setFields((prev) => ({
                          ...prev,
                          branchDetails: bDetails,
                          branchName: combined,
                        }));
                      }}
                      placeholder="e.g. Asset Centre / Borivali Branch, Mumbai"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="B. Bank Letter No. & Date Requesting Valuation:">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.bankLetterNo || ''}
                      onChange={(e) => {
                        const noVal = e.target.value;
                        const dtVal = fields.bankLetterDate || '';
                        const combined = [noVal, dtVal ? `Dt. ${dtVal}` : ''].filter(Boolean).join(' ');
                        setFields((prev) => ({
                          ...prev,
                          bankLetterNo: noVal,
                          letterNoAndDate: combined,
                        }));
                      }}
                      placeholder="e.g. BANDHAN/SME/2026/102"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <BaseDateInput
                      value={fields.bankLetterDate || ''}
                      onChange={(dtVal) => {
                        const noVal = fields.bankLetterNo || '';
                        const combined = [noVal, dtVal ? `Dt. ${dtVal}` : ''].filter(Boolean).join(' ');
                        setFields((prev) => ({
                          ...prev,
                          bankLetterDate: dtVal,
                          letterNoAndDate: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Field>
            </div>
            <Field label="C. Valuation Made at Request of Borrower?:">
              <select
                className={selectCls}
                value={fields.valuationMadeAtBorrowerRequest || 'No'}
                onChange={(e) => handleChange('valuationMadeAtBorrowerRequest', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="D. Name of Manager / Officer who Accompanied:">
              <input
                type="text"
                className={inputCls}
                value={fields.managerAccompanied || 'No'}
                onChange={(e) => handleChange('managerAccompanied', e.target.value)}
                placeholder="No or Officer Name"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="E. Valuation Type:">
              <select
                className={selectCls}
                value={fields.valuationType || 'Fresh Valuation'}
                onChange={(e) => handleChange('valuationType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Fresh Valuation">Fresh Valuation</option>
                <option value="Revaluation">Revaluation</option>
                <option value="Periodic Valuation">Periodic Valuation</option>
              </select>
            </Field>
            <Field label="F. Date of Earlier Valuation, if any:">
              <input
                type="text"
                className={inputCls}
                value={fields.dateOfEarlierValuation || 'No'}
                onChange={(e) => handleChange('dateOfEarlierValuation', e.target.value)}
                placeholder="No or Earlier Date"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="G. Name of Previous Valuer, if any:">
              <input
                type="text"
                className={inputCls}
                value={fields.previousValuerName || 'Not Applicable'}
                onChange={(e) => handleChange('previousValuerName', e.target.value)}
                placeholder="Not Applicable or Valuer Name"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="H. Date of Visit to the Property:">
              <div className="space-y-1">
                <BaseDateInput
                  value={fields.dateOfVisit || ''}
                  onChange={(val) => handleChange('dateOfVisit', val)}
                  disabled={isReadOnly}
                />
                {firstFieldAgentVisit?.dateStr && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate">
                      Earliest Field Visit: <span className="font-semibold text-slate-700">{firstFieldAgentVisit.dateStr}</span>
                      {firstFieldAgentVisit.agentName ? ` (${firstFieldAgentVisit.agentName})` : ''}
                    </span>
                    {!isReadOnly && fields.dateOfVisit !== firstFieldAgentVisit.dateStr && (
                      <button
                        type="button"
                        onClick={() => handleChange('dateOfVisit', firstFieldAgentVisit.dateStr)}
                        className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] shrink-0 ml-2 cursor-pointer"
                      >
                        Use Field Date
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="I. Date on which Valuation is Made:">
              <BaseDateInput
                value={fields.dateOfValuation || ''}
                onChange={(val) => handleChange('dateOfValuation', val)}
                disabled={isReadOnly}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="J. Person(s) in Presence of whom Valuation is Made:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.personsPresent || ''}
                  onChange={(e) => handleChange('personsPresent', e.target.value)}
                  placeholder="e.g. Person Name, Mob-98XXXXXXXX"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="K. List of Documents Produced for Verification:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsProduced || ''}
                  onChange={(e) => handleChange('documentsProduced', e.target.value)}
                  placeholder="e.g. Xerox copy of Sale Deed, Patta, Sketch Map, Assessment of Holding"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Borrower Sub-Block */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                L. Borrower / Borrowal Account Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Borrower Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerName || ''}
                    onChange={(e) => handleChange('borrowerName', e.target.value)}
                    placeholder="e.g. M/S. Company / Borrower Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nature of Business:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerNatureOfBusiness || ''}
                    onChange={(e) => handleChange('borrowerNatureOfBusiness', e.target.value)}
                    placeholder="e.g. Trading, Manufacturing, Retail"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="At (Location):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerAt || ''}
                    onChange={(e) => handleChange('borrowerAt', e.target.value)}
                    placeholder="e.g. Area / Street"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.O:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPo || ''}
                    onChange={(e) => handleChange('borrowerPo', e.target.value)}
                    placeholder="Post Office"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.S:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPs || ''}
                    onChange={(e) => handleChange('borrowerPs', e.target.value)}
                    placeholder="Police Station"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Dist & State:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerDist || ''}
                    onChange={(e) => handleChange('borrowerDist', e.target.value)}
                    placeholder="e.g. Khordha, Odisha"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Phone / Mobile No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPhone || ''}
                    onChange={(e) => handleChange('borrowerPhone', sanitizePositiveInt(e.target.value, 15))}
                    placeholder="Mob-XXXXXXXXXX"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Owner Sub-Block */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                M. Owner / Owner(s) of the Property
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Owner Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    placeholder="e.g. Owner Full Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Father's / Husband's Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerFatherName || ''}
                    onChange={(e) => handleChange('ownerFatherName', e.target.value)}
                    placeholder="e.g. S/o / W/o Full Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="At (Location):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerAt || ''}
                    onChange={(e) => handleChange('ownerAt', e.target.value)}
                    placeholder="e.g. Plot No, Street"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.O:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPo || ''}
                    onChange={(e) => handleChange('ownerPo', e.target.value)}
                    placeholder="Post Office"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.S:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPs || ''}
                    onChange={(e) => handleChange('ownerPs', e.target.value)}
                    placeholder="Police Station"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="PIN Code:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPin || ''}
                    onChange={(e) => handleChange('ownerPin', sanitizePositiveInt(e.target.value, 6))}
                    placeholder="e.g. 751010"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="District:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerDist || ''}
                    onChange={(e) => handleChange('ownerDist', e.target.value)}
                    placeholder="e.g. Khordha, Odisha"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Phone / Mobile No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPhone || ''}
                    onChange={(e) => handleChange('ownerPhone', sanitizePositiveInt(e.target.value, 15))}
                    placeholder="Mob-XXXXXXXXXX"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. LAND DETAILS & MASTER AREA UNIT SELECTOR */}
        <Section number={2} id="sec-prop-details" title="Land Details (Section II: Details of Property)">
          <div className="space-y-4">
            {/* Master Area Converter Banner */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-200/80 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-indigo-200/60 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-semibold text-indigo-900 text-xs sm:text-sm">
                    Master Land Area Unit & Conversion
                  </span>
                </div>
                {(() => {
                  const val = fields.landAreaValue || '';
                  if (!val || parseFloat(val) <= 0) return null;
                  const conv = convertAreaToSqft(fields.landAreaUnit || 'ACRE_DEC', val);
                  return conv.sqftStr ? (
                    <span className="text-[11px] font-semibold text-indigo-900 bg-white/90 px-2.5 py-0.5 rounded border border-indigo-200 shadow-2xs">
                      ⚡ Master Area: {conv.sqftStr}
                    </span>
                  ) : null;
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Choose Area Unit:">
                  <select
                    className={selectCls}
                    value={fields.landAreaUnit || 'ACRE_DEC'}
                    onChange={(e) => {
                      const unit = e.target.value as any;
                      const val = fields.landAreaValue || '';
                      const formatted = formatAreaOfLandStatement(unit, val);
                      setFields(prev => ({
                        ...prev,
                        landAreaUnit: unit,
                        areaLandDoc: formatted.statement,
                        areaLandRor: formatted.statement,
                        areaLandPhysical: formatted.statement,
                        extentOfSite: formatted.statement,
                        extentConsideredValuation: formatted.statement,
                        landAreaTotal: formatted.sqft > 0 ? String(formatted.sqft) : prev.landAreaTotal,
                        landAreaSqft: formatted.sqftStr,
                      }));
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="ACRE_DEC">Acre</option>
                    <option value="DECIMAL">Decimal</option>
                    <option value="SQFT">Sq.Ft</option>
                    <option value="SQYD">Sq.Yards</option>
                    <option value="SQMT">Sq.Meters</option>
                    <option value="GUNTHA">Guntha</option>
                  </select>
                </Field>

                <Field
                  label={
                    fields.landAreaUnit === 'ACRE_DEC'
                      ? 'Land Area (Acre):'
                      : fields.landAreaUnit === 'DECIMAL'
                      ? 'Land Area (Decimal):'
                      : fields.landAreaUnit === 'SQFT'
                      ? 'Land Area (Sq.Ft):'
                      : fields.landAreaUnit === 'SQYD'
                      ? 'Land Area (Sq.Yards):'
                      : fields.landAreaUnit === 'SQMT'
                      ? 'Land Area (Sq.Meters):'
                      : 'Land Area (Guntha):'
                  }
                >
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landAreaValue || ''}
                    onChange={(e) => {
                      const val = sanitizePositiveFloat(e.target.value);
                      const unit = fields.landAreaUnit || 'ACRE_DEC';
                      const formatted = formatAreaOfLandStatement(unit, val);
                      setFields(prev => ({
                        ...prev,
                        landAreaValue: val,
                        areaLandDoc: val ? formatted.statement : '',
                        areaLandRor: val ? formatted.statement : '',
                        areaLandPhysical: val ? formatted.statement : '',
                        extentOfSite: val ? formatted.statement : '',
                        extentConsideredValuation: val ? formatted.statement : '',
                        landAreaTotal: val && formatted.sqft > 0 ? String(formatted.sqft) : '',
                        landAreaSqft: val ? formatted.sqftStr : '',
                      }));
                    }}
                    placeholder="0.00"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Land Area in sqft (Auto-Converted):">
                  <input
                    type="text"
                    className={`${inputCls} bg-slate-100/90 text-slate-800 font-semibold cursor-not-allowed border-slate-300`}
                    value={(() => {
                      const val = fields.landAreaValue || '';
                      if (!val || parseFloat(val) <= 0) return '';
                      const conv = convertAreaToSqft(fields.landAreaUnit || 'ACRE_DEC', val);
                      return conv.sqftStr || '';
                    })()}
                    readOnly
                    disabled
                    placeholder="0 sqft."
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="A. Details of Property Offered as Secured:">
                {renderSelect(
                  fields.detailsPropertyOffered,
                  ['Land & Building', 'Vacant Land', 'Residential Land & Building', 'Commercial Land & Building', 'Residential Flat', 'Commercial Office / Shop', 'Industrial Land & Building'],
                  (v) => handleChange('detailsPropertyOffered', v),
                  isReadOnly,
                  'Land & Building'
                )}
              </Field>
              <Field label="B. Date of Acquisition / Purchase of Land:">
                <BaseDateInput
                  value={fields.dateAcquisitionLand || ''}
                  onChange={(val) => handleChange('dateAcquisitionLand', val)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="C. Value as per Registered Sale Deed:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valueAsPerSaleDeed || ''}
                  onChange={(e) => handleChange('valueAsPerSaleDeed', e.target.value)}
                  placeholder="e.g. Rs. 45,00,000/-"
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Sale Deed / Title Deed Document No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.saleDeedDocNo || ''}
                  onChange={(e) => handleChange('saleDeedDocNo', e.target.value)}
                  placeholder="e.g. 1081609995"
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="E. Area of Land (As per Title Deed):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaLandDoc || ''}
                  onChange={(e) => handleChange('areaLandDoc', e.target.value)}
                  placeholder="e.g. (AC.0.069Decs) i.e. 3006.00 sqft."
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="F. Area of Land (As per ROR):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaLandRor || ''}
                  onChange={(e) => handleChange('areaLandRor', e.target.value)}
                  placeholder="e.g. (AC.0.069Decs) i.e. 3006.00 sqft."
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="G. Area of Land (As per Physical Measurement):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaLandPhysical || ''}
                  onChange={(e) => handleChange('areaLandPhysical', e.target.value)}
                  placeholder="e.g. (AC.0.069Decs) i.e. 3006.00 sqft."
                  disabled={isReadOnly}
                />
              </Field>

              {/* Property Address & Postal Location H */}
              <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">
                  H. Location of Property & Postal Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Plot No(s):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.plotNo || ''}
                      onChange={(e) => handleChange('plotNo', e.target.value)}
                      placeholder="e.g. Plot No: 443/11470"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Khata No / Dag No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.khataNo || ''}
                      onChange={(e) => handleChange('khataNo', e.target.value)}
                      placeholder="e.g. Khata No: 1330/8618"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="At:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propAt || ''}
                      onChange={(e) => handleChange('propAt', e.target.value)}
                      placeholder="Locality"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="P.O:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPo || ''}
                      onChange={(e) => handleChange('propPo', e.target.value)}
                      placeholder="Post Office"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="P.S:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPs || ''}
                      onChange={(e) => handleChange('propPs', e.target.value)}
                      placeholder="Police Station"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="PIN Code:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPin || ''}
                      onChange={(e) => handleChange('propPin', sanitizePositiveInt(e.target.value, 6))}
                      placeholder="PIN"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="District:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propDist || ''}
                      onChange={(e) => handleChange('propDist', e.target.value)}
                      placeholder="e.g. Khordha, Odisha"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>

              <Field label="I. Urban / Semi Urban / Rural:">
                {renderSelect(
                  fields.urbanSemiUrbanRural,
                  ['Urban Area', 'Semi Urban Area', 'Rural Area'],
                  (v) => handleChange('urbanSemiUrbanRural', v),
                  isReadOnly,
                  'Urban Area'
                )}
              </Field>
              <Field label="J. Locality Zone:">
                {renderSelect(
                  fields.situatedAreaType,
                  ['Residential Area', 'Commercial Area', 'Residential cum Commercial Area', 'Industrial Area', 'Mixed Area'],
                  (v) => handleChange('situatedAreaType', v),
                  isReadOnly,
                  'Residential cum Commercial Area'
                )}
              </Field>
              <Field label="K. Locality Classification:">
                {renderSelect(
                  fields.classificationOfLocality,
                  ['High Class', 'Middle Class', 'Poor Class'],
                  (v) => handleChange('classificationOfLocality', v),
                  isReadOnly,
                  'Middle Class'
                )}
              </Field>
              {/* L. Type of Property with nested statutory classification */}
              <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <Field label="L. Type of Property:">
                  {renderSelect(
                    fields.typeOfProperty,
                    ['Land & building', 'Residential Land & Building', 'Commercial Land & Building', 'Vacant Land', 'Industrial Property', 'Mixed Use Property'],
                    (v) => handleChange('typeOfProperty', v),
                    isReadOnly,
                    'Land & building'
                  )}
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <Field label="I. A) Agricultural:">
                    {renderSelect(
                      fields.isAgricultural,
                      ['No', 'Yes'],
                      (v) => handleChange('isAgricultural', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                  <Field label="I. B) Conversion to House Site Plots Contemplated:">
                    {renderSelect(
                      fields.agriculturalConversionContemplated,
                      ['Not Applicable', 'Conversion Permitted', 'Applied for Conversion', 'No', 'Yes'],
                      (v) => handleChange('agriculturalConversionContemplated', v),
                      isReadOnly,
                      'Not Applicable'
                    )}
                  </Field>
                  <Field label="II. A) Industrial:">
                    {renderSelect(
                      fields.isIndustrial,
                      ['No', 'Yes'],
                      (v) => handleChange('isIndustrial', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                  <Field label="II. B) Activity / Industry Suited:">
                    {renderSelect(
                      fields.industrialActivitySuited,
                      ['Not Applicable', 'Light Engineering / Fabrication', 'Warehousing / Logistics', 'Manufacturing Unit', 'Commercial Warehouse', 'Yes'],
                      (v) => handleChange('industrialActivitySuited', v),
                      isReadOnly,
                      'Not Applicable'
                    )}
                  </Field>
                  <Field label="III. Residential (Restrictive clauses):">
                    {renderSelect(
                      fields.isResidential,
                      ['Yes', 'No'],
                      (v) => handleChange('isResidential', v),
                      isReadOnly,
                      'Yes'
                    )}
                  </Field>
                  <Field label="IV. Commercial:">
                    {renderSelect(
                      fields.isCommercial,
                      ['Yes', 'No'],
                      (v) => handleChange('isCommercial', v),
                      isReadOnly,
                      'Yes'
                    )}
                  </Field>
                  <Field label="V. Institutional:">
                    {renderSelect(
                      fields.isInstitutional,
                      ['No', 'Yes'],
                      (v) => handleChange('isInstitutional', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                  <Field label="VI. Others (Specify):">
                    {renderSelect(
                      fields.isOthersSpecify,
                      ['No', 'Yes', 'Mixed Use', 'Not Applicable'],
                      (v) => handleChange('isOthersSpecify', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. TITLE, OWNERSHIP & RENT */}
        <Section number={3} id="sec-title-rent" title="Title, Ownership & Rent (Points 2.1, 2.2 & 2.3)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="2.1 Title of Property (Freehold / Leasehold):">
              <select
                className={selectCls}
                value={fields.titleFreeholdLeasehold || 'It is a free hold land'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('titleFreeholdLeasehold', val);
                  if (val.toLowerCase().includes('lease')) {
                    handleChange('isLeaseholdApplicable', 'Yes');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="It is a free hold land">Freehold</option>
                <option value="It is a lease hold land">Leasehold</option>
              </select>
            </Field>
            <Field label="A. Ownership of Property:">
              {renderSelect(
                fields.ownershipOfProperty,
                ['Single Ownership', 'Joint Ownership'],
                (v) => handleChange('ownershipOfProperty', v),
                isReadOnly,
                'Single Ownership'
              )}
            </Field>
            <Field label="B. Joint Ownership Share:">
              <input
                type="text"
                className={inputCls}
                value={fields.jointOwnershipShare || 'Not Applicable'}
                onChange={(e) => handleChange('jointOwnershipShare', e.target.value)}
                placeholder="Not Applicable or Undivided Share"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="C. Taxes Paid Up To:">
              <input
                type="text"
                className={inputCls}
                value={fields.taxesPaidUpTo || 'We have not verified any recent rent receipt'}
                onChange={(e) => handleChange('taxesPaidUpTo', e.target.value)}
                placeholder="Receipt status"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="D. Land Revenue:">
              <input
                type="text"
                className={inputCls}
                value={fields.landRevenue || 'We have not verified any recent rent receipt'}
                onChange={(e) => handleChange('landRevenue', e.target.value)}
                placeholder="Revenue status"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="E. Municipal Taxes:">
              <input
                type="text"
                className={inputCls}
                value={fields.landBuildingMunicipalTaxes || 'We have not verified any recent rent receipt'}
                onChange={(e) => handleChange('landBuildingMunicipalTaxes', e.target.value)}
                placeholder="Municipal Tax status"
                disabled={isReadOnly}
              />
            </Field>

            {/* 2.2 If Leasehold */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">2.2 If Lease Hold (Points A to M)</h4>
                <label className="text-xs flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fields.isLeaseholdApplicable === 'Yes'}
                    onChange={(e) => handleChange('isLeaseholdApplicable', e.target.checked ? 'Yes' : 'No')}
                    disabled={isReadOnly}
                  />
                  <span>Enable Leasehold Details</span>
                </label>
              </div>

              {fields.isLeaseholdApplicable === 'Yes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <Field label="A. Name of the Lessor:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.lessorName || 'Not Applicable'}
                      onChange={(e) => handleChange('lessorName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="B. Name of the Lessee:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.lesseeName || 'Not Applicable'}
                      onChange={(e) => handleChange('lesseeName', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="C. Nature of Lease:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.natureOfLease || 'Not Applicable'}
                      onChange={(e) => handleChange('natureOfLease', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="D. Date of Commencement:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.dateCommencementLease || 'Not Applicable'}
                      onChange={(e) => handleChange('dateCommencementLease', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="E. Period of Lease:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.periodOfLease || 'Not Applicable'}
                      onChange={(e) => handleChange('periodOfLease', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="G. Terms of Renewal:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.termsOfRenewal || 'Not Applicable'}
                      onChange={(e) => handleChange('termsOfRenewal', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="H. Lease Premium / Rent Per Annum:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.leasePremiumRentPerAnnum || 'Not Applicable'}
                      onChange={(e) => handleChange('leasePremiumRentPerAnnum', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="I. Un-expired Period of Lease:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.unexpiredPeriodOfLease || 'Not Applicable'}
                      onChange={(e) => handleChange('unexpiredPeriodOfLease', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="J. Initial Premium:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.initialPremium || 'Not Applicable'}
                      onChange={(e) => handleChange('initialPremium', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="K. Ground Rent Payable Per Annum:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.groundRentPerAnnum || 'Not Applicable'}
                      onChange={(e) => handleChange('groundRentPerAnnum', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="L. Unearned Increase Payable to Lessor:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.unearnedIncreasePayable || 'Not Applicable'}
                      onChange={(e) => handleChange('unearnedIncreasePayable', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="M. Lease Agreement Permits Mortgage:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.leasePermitsMortgage || 'Not Applicable'}
                      onChange={(e) => handleChange('leasePermitsMortgage', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* 2.3 Rent Details */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">2.3 Rent Details (Points A to D)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Occupation Status:">
                  {renderSelect(
                    fields.rentOccupationStatus,
                    ['The Plot is occupied by Owner', 'Tenanted', 'Partly Owner Occupied & Partly Tenanted', 'Vacant'],
                    (v) => handleChange('rentOccupationStatus', v),
                    isReadOnly,
                    'The Plot is occupied by Owner'
                  )}
                </Field>
                <Field label="A. Tenant Names:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tenantNames || 'Not Applicable'}
                    onChange={(e) => handleChange('tenantNames', e.target.value)}
                    placeholder="Not Applicable or Tenant Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Portion in Occupation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tenantPortionOccupied || 'Not Applicable'}
                    onChange={(e) => handleChange('tenantPortionOccupied', e.target.value)}
                    placeholder="Not Applicable"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Monthly / Annual Rent:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.monthlyAnnualRentPaid || 'Not Applicable'}
                    onChange={(e) => handleChange('monthlyAnnualRentPaid', e.target.value)}
                    placeholder="Not Applicable or Rent Amount"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. DESCRIPTION & BOUNDARIES */}
        <Section number={4} id="sec-desc-boundaries" title="Property Description & Multi-Plot Boundaries (Point 3)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="A. Detailed Postal Address (with PIN):">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.detailedAddressWithPin || ''}
                    onChange={(e) => handleChange('detailedAddressWithPin', e.target.value)}
                    placeholder="Detailed address as per deeds"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <Field label="B. Ward No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalityWardNo || ''}
                  onChange={(e) => handleChange('municipalityWardNo', e.target.value)}
                  placeholder="Ward No"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Mouza:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.mouza || ''}
                  onChange={(e) => handleChange('mouza', e.target.value)}
                  placeholder="Mouza Name"
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Thana No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.thanaNo || ''}
                  onChange={(e) => handleChange('thanaNo', e.target.value)}
                  placeholder="Thana No"
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Tehasil:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tehasil || ''}
                  onChange={(e) => handleChange('tehasil', e.target.value)}
                  placeholder="Tehasil"
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="SRO:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sro || ''}
                  onChange={(e) => handleChange('sro', e.target.value)}
                  placeholder="SRO Office"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* O. Dimensions & Extent */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                O. Dimensions & Extent of Site (Points I to IV)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <p className="font-semibold text-xs text-slate-700">(I) Dimensions as per Document</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="A) East to West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionDocEastWest || 'As per Sketch Map'}
                        onChange={(e) => handleChange('dimensionDocEastWest', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B) North to South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionDocNorthSouth || 'As per Sketch Map'}
                        onChange={(e) => handleChange('dimensionDocNorthSouth', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <p className="font-semibold text-xs text-slate-700">(II) Dimensions as per Measurement</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="A) East to West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionMeasEastWest || 'As per Sketch Map'}
                        onChange={(e) => handleChange('dimensionMeasEastWest', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B) North to South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionMeasNorthSouth || 'As per Sketch Map'}
                        onChange={(e) => handleChange('dimensionMeasNorthSouth', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="(III) Extent of Site:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.extentOfSite || ''}
                    onChange={(e) => handleChange('extentOfSite', e.target.value)}
                    placeholder="e.g. (AC.0.069Decs) i.e. 3006.00 sqft."
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(IV) Extent Considered for Valuation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.extentConsideredValuation || ''}
                    onChange={(e) => handleChange('extentConsideredValuation', e.target.value)}
                    placeholder="e.g. (AC.0.069Decs) i.e. 3006.00 sqft."
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* P. Multi-Plot Boundaries (P. 1) Document) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 text-sm">
                  P) 1) Boundaries as per Document / Deed (Dynamic Multi-Plot Support)
                </h4>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddPlotBoundary}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer"
                  >
                    + Add Plot Boundary
                  </button>
                )}
              </div>

              {(fields.documentPlotBoundaries || []).map((pb, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      className="font-medium text-xs text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 w-64 px-1 py-0.5"
                      value={pb.plotNo}
                      onChange={(e) => handlePlotBoundaryChange(idx, 'plotNo', e.target.value)}
                      placeholder="e.g. Plot No: 443/11470"
                      disabled={isReadOnly}
                    />
                    {!isReadOnly && (fields.documentPlotBoundaries || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlotBoundary(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Field label="I) East:">
                      <input
                        type="text"
                        className={inputCls}
                        value={pb.east}
                        onChange={(e) => handlePlotBoundaryChange(idx, 'east', e.target.value)}
                        placeholder="East Boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="II) West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={pb.west}
                        onChange={(e) => handlePlotBoundaryChange(idx, 'west', e.target.value)}
                        placeholder="West Boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="III) North:">
                      <input
                        type="text"
                        className={inputCls}
                        value={pb.north}
                        onChange={(e) => handlePlotBoundaryChange(idx, 'north', e.target.value)}
                        placeholder="North Boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="IV) South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={pb.south}
                        onChange={(e) => handlePlotBoundaryChange(idx, 'south', e.target.value)}
                        placeholder="South Boundary"
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Boundaries (P. 2) Physical) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                P) 2) Boundaries as per Physical Verification on Site
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="I) East:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.verifiedBoundaryEast || ''}
                    onChange={(e) => handleChange('verifiedBoundaryEast', e.target.value)}
                    placeholder="East boundary"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="II) West:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.verifiedBoundaryWest || ''}
                    onChange={(e) => handleChange('verifiedBoundaryWest', e.target.value)}
                    placeholder="West boundary"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="III) North:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.verifiedBoundaryNorth || ''}
                    onChange={(e) => handleChange('verifiedBoundaryNorth', e.target.value)}
                    placeholder="North boundary"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="IV) South:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.verifiedBoundarySouth || ''}
                    onChange={(e) => handleChange('verifiedBoundarySouth', e.target.value)}
                    placeholder="South boundary"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 5. SITE CHARACTERISTICS & PROXIMITIES */}
        <Section number={5} id="sec-site-char" title="Site Characteristics (Point 3) & Location Advantages/Disadvantages (Point 4)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="A. Level of Land / Topography:">
              {renderSelect(
                fields.levelOfLand,
                ['Leveled and Plain', 'Low Lying Land', 'Elevated / Sloping Land', 'Uneven / Undulated Land'],
                (v) => handleChange('levelOfLand', v),
                isReadOnly,
                'Leveled and Plain'
              )}
            </Field>
            <Field label="B. Permitted Use:">
              {renderSelect(
                fields.useToWhichCanBePut,
                ['Residential cum Commercial Purpose', 'Residential Purpose', 'Commercial Purpose', 'Industrial Purpose', 'Institutional Purpose'],
                (v) => handleChange('useToWhichCanBePut', v),
                isReadOnly,
                'Residential cum Commercial Purpose'
              )}
            </Field>
            <Field label="H. Corner / Intermittent Plot:">
              <select
                className={selectCls}
                value={fields.cornerOrIntermittentPlot || 'Intermittent Plot'}
                onChange={(e) => handleChange('cornerOrIntermittentPlot', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Intermittent Plot">Intermittent Plot</option>
                <option value="Corner Plot">Corner Plot</option>
              </select>
            </Field>
            <Field label="I. Land Locked?:">
              <select
                className={selectCls}
                value={fields.isLandLocked || 'No'}
                onChange={(e) => handleChange('isLandLocked', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="L. Road Kind & Width:">
              {renderSelect(
                fields.roadKindAndWidth,
                ['15 ft wide BT Road', '20 ft wide BT Road', '25 ft wide BT Road', '30 ft wide BT Road', '40 ft wide BT Road', '15 ft wide CC Road', '20 ft wide CC Road', '10 ft wide Morrum Road', 'Earthen Road'],
                (v) => handleChange('roadKindAndWidth', v),
                isReadOnly,
                '15 ft wide BT Road'
              )}
            </Field>
            <Field label="U. Latitude / Longitude Coordinates:">
              <input
                type="text"
                className={inputCls}
                value={fields.latitudeLongitude || ''}
                onChange={(e) => handleChange('latitudeLongitude', e.target.value)}
                placeholder="e.g. Latitude: 20.3128, Longitude: 85.8569"
                disabled={isReadOnly}
              />
            </Field>

            {/* M. Distance from Municipal Office / Limits */}
            <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                M. IF THE PROPERTY IS NOT WITHIN THE CITY/TOWN/MUNICIPAL LIMIT THEN STATE THE DISTANCE OF THE PROPERTY FROM THE:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="a. Municipal Office:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distMunicipalOffice || ''}
                    onChange={(e) => handleChange('distMunicipalOffice', e.target.value)}
                    placeholder="e.g. Bhubaneswar"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="b. Municipal Limits:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distMunicipalLimits || ''}
                    onChange={(e) => handleChange('distMunicipalLimits', e.target.value)}
                    placeholder="e.g. Bhubaneswar Municipal Corporation"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Civic Proximities */}
            <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-slate-700">T. PROXIMITY TO CIVIC AMENITIES:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                <Field label="(i) School:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximitySchool || ''}
                    onChange={(e) => handleChange('proximitySchool', e.target.value)}
                    placeholder="e.g. 2 Kms"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(ii) College:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityCollege || ''}
                    onChange={(e) => handleChange('proximityCollege', e.target.value)}
                    placeholder="e.g. 3 Kms"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(iii) Hospital:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityHospital || ''}
                    onChange={(e) => handleChange('proximityHospital', e.target.value)}
                    placeholder="e.g. 1 Km"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(iv) Market:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityMarket || ''}
                    onChange={(e) => handleChange('proximityMarket', e.target.value)}
                    placeholder="e.g. 500 Mtrs"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(v) Bus Stand:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityBusStand || ''}
                    onChange={(e) => handleChange('proximityBusStand', e.target.value)}
                    placeholder="e.g. 2 Kms"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(vi) i) Railway Station:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityRailwayStation || ''}
                    onChange={(e) => handleChange('proximityRailwayStation', e.target.value)}
                    placeholder="e.g. 2 Kms"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(vii) ii) Other Place:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityOtherPlace || ''}
                    onChange={(e) => handleChange('proximityOtherPlace', e.target.value)}
                    placeholder="e.g. NH-16 (1 Km)"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 4. Location Advantages & Disadvantages */}
            <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-700">4. LOCATION ADVANTAGES & DISADVANTAGES</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="A. Location Advantages:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.locationAdvantages || ''}
                    onChange={(e) => handleChange('locationAdvantages', e.target.value)}
                    placeholder="e.g. Situated in developed area close to civic amenities..."
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Location Disadvantages (Details):">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.locationDisadvantages || 'Nothing Observed'}
                    onChange={(e) => handleChange('locationDisadvantages', e.target.value)}
                    placeholder="e.g. Nothing Observed"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 6. OTHER ISSUES & SALES RATIONALE */}
        <Section number={6} id="sec-other-issues" title="Other Issues & Sales Rationale (Point 5)">
          <div className="space-y-4">
            <Field label="A. Land Acquisition Notification:">
              <input
                type="text"
                className={inputCls}
                value={fields.landAcquisitionNotification || 'No such documents verified'}
                onChange={(e) => handleChange('landAcquisitionNotification', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="B. Development Contribution Demanded:">
              <input
                type="text"
                className={inputCls}
                value={fields.developmentContributionDemanded || 'No such documents verified'}
                onChange={(e) => handleChange('developmentContributionDemanded', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="C. Urban Land Ceiling / Statutory Enactments:">
              <input
                type="text"
                className={inputCls}
                value={fields.landCeilingEnactments || 'No such documents verified'}
                onChange={(e) => handleChange('landCeilingEnactments', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* D. Sales */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">D. SALES:</h4>
              <Field label="a. Give instance of sales of immovable property in the locality, if available, indicating the name and address of the property, registration no. sale price and area of the land sold:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.salesInstancesInLocality || 'Transactions of the property are not available in the locality'}
                  onChange={(e) => handleChange('salesInstancesInLocality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="b. If sale instance are not available or not relied upon, please furnished the basis of arriving at the land rate:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.salesBasisArrivingLandRate || 'The present market rate of land confirmed through local enquiry and property dealers and found to be acceptable.'}
                  onChange={(e) => handleChange('salesBasisArrivingLandRate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="c. Land Rate Adopted in this Valuation:">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.adoptedLandRateRationale || ''}
                  onChange={(e) => handleChange('adoptedLandRateRationale', e.target.value)}
                  placeholder="e.g. Prevailing market rate is Rs.5800/- to Rs.6100/-. Adopted market rate is Rs.6000/- Per Sft..."
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 7. VALUATION OF LAND */}
        <Section number={7} id="sec-land-valuation" title="6. Valuation of Land (Section II.6)">
          <div className="space-y-4">
            {/* A. Previous Valuation Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">A. PREVIOUS VALUATION DETAILS:</h4>
              <Field label="The Detail of the Previous Valuation:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.previousValuationDetails || 'Not Available / Not Applicable'}
                  onChange={(e) => handleChange('previousValuationDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* B. Present Valuation Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">B. PRESENT VALUATION DETAILS:</h4>
              <p className="text-xs text-slate-600 italic">
                (HERE THE REGISTERED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH IN VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATIONS.)
              </p>
              <Field label="Approach in Valuation of the Property:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.presentValuationApproachDetails || ''}
                  onChange={(e) => handleChange('presentValuationApproachDetails', e.target.value)}
                  placeholder="e.g. Land & Building method of valuation has been adopted..."
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Field label="1. Valuation of Land (Area Sq.ft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landAreaTotal || fields.extentOfSite || ''}
                    onChange={(e) => handleChange('landAreaTotal', sanitizePositiveFloat(e.target.value))}
                    placeholder="e.g. 3006.00"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Adopted Market Land Rate (Rs./Sq.ft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landMarketRate || ''}
                    onChange={(e) => handleChange('landMarketRate', sanitizePositiveFloat(e.target.value))}
                    placeholder="e.g. 6000"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Govt. Benchmark Land Rate (Rs./Sq.ft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landGovtBenchmarkRate || ''}
                    onChange={(e) => handleChange('landGovtBenchmarkRate', sanitizePositiveFloat(e.target.value))}
                    placeholder="e.g. 3970"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="2. Govt. Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landGovtValueTotal || ''}
                    onChange={(e) => handleChange('landGovtValueTotal', e.target.value)}
                    placeholder="Auto-calculated"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Market Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landMarketValueTotal || ''}
                    onChange={(e) => handleChange('landMarketValueTotal', e.target.value)}
                    placeholder="Auto-calculated"
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="4. Distress %:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.distressSalePct !== undefined ? fields.distressSalePct : '85'}
                      onChange={(e) => handleChange('distressSalePct', sanitizePercentage(e.target.value))}
                      placeholder="85 (or clear for 100%)"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="4. Distress Sale Value:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.landDistressValue || ''}
                      onChange={(e) => handleChange('landDistressValue', e.target.value)}
                      placeholder="Auto-calculated"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field label="5. Realisable %:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.realisableValuePct !== undefined ? fields.realisableValuePct : '95'}
                      onChange={(e) => handleChange('realisableValuePct', sanitizePercentage(e.target.value))}
                      placeholder="95 (or clear for 100%)"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="5. Realisable Estimation of the Property in case of Distress Sale:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.landRealisableValue || ''}
                      onChange={(e) => handleChange('landRealisableValue', e.target.value)}
                      placeholder="Auto-calculated"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 8. BUILDING BASIC INFO & BUILT UP AREA */}
        <Section number={8} id="sec-bldg-basic" title="Valuation of Building: Basic Info & Built-up Area (Part 1: Points A–H)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="A. Type of Building:">
              {renderSelect(
                fields.buildingType,
                ['Residential Cum Commercial', 'Residential Building', 'Commercial Building', 'Industrial Building', 'Apartment / Residential Flat'],
                (v) => handleChange('buildingType', v),
                isReadOnly,
                'Residential Cum Commercial'
              )}
            </Field>
            <Field label="B. Year of Commencement & Completion:">
              <input
                type="text"
                className={inputCls}
                value={fields.yearCommencementCompletion || ''}
                onChange={(e) => handleChange('yearCommencementCompletion', e.target.value)}
                placeholder="e.g. Construction- 2019, Completion- 2021"
                disabled={isReadOnly}
              />
            </Field>
            <Field label="C. Construction Type:">
              {renderSelect(
                fields.typeOfConstruction,
                ['RCC Frames', 'Load Bearing Masonry', 'Steel Framed Structure', 'Aluform / Mivan Structure'],
                (v) => handleChange('typeOfConstruction', v),
                isReadOnly,
                'RCC Frames'
              )}
            </Field>
            <Field label="D. Estimated Future Life (Years):">
              {renderSelect(
                fields.estimatedFutureLife,
                ['60 Yrs', '50 Yrs', '40 Yrs', '30 Yrs', '20 Yrs', '70 Yrs'],
                (v) => handleChange('estimatedFutureLife', v),
                isReadOnly,
                '60 Yrs'
              )}
            </Field>
            <Field label="E. FAR / FSI Permissible & Utilized:">
              <input
                type="text"
                className={inputCls}
                value={fields.farFsiPermissibleUtilized || 'FAR: 3.46'}
                onChange={(e) => handleChange('farFsiPermissibleUtilized', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="F. Approval Letter / Authority Details:">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingApprovalAuthorityDetails || ''}
                onChange={(e) => handleChange('buildingApprovalAuthorityDetails', e.target.value)}
                placeholder="e.g. Assessment of Holding given by Bhubaneswar Municipal Corporation..."
                disabled={isReadOnly}
              />
            </Field>
            <Field label="G. Construction as per Approved Plan?:">
              {renderSelect(
                fields.constructionAsPerPlanDeviations,
                ['Yes', 'No', 'Minor Deviations', 'Deviations within permissible limits'],
                (v) => handleChange('constructionAsPerPlanDeviations', v),
                isReadOnly,
                'Yes'
              )}
            </Field>

            {/* H. Built up Area Details */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">H. BUILT UP AREA DETAILS:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="(I) A) As per Assessment of Holding:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.builtUpAreaAssessmentHolding || ''}
                    onChange={(e) => handleChange('builtUpAreaAssessmentHolding', e.target.value)}
                    placeholder="e.g. As per Municipal Assessment"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(I) B) As per Actual:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.builtUpAreaAsPerActual || ''}
                    onChange={(e) => handleChange('builtUpAreaAsPerActual', e.target.value)}
                    placeholder="e.g. GF: 2807 Sft, FF: 2807 Sft, SF: 2807 Sft, TF: 2807 Sft, Total: 10428 Sft"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(II) Carpet Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.carpetAreaTotal || ''}
                    onChange={(e) => handleChange('carpetAreaTotal', e.target.value)}
                    placeholder="e.g. 8624.00 Sft"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(III) Saleable Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.saleableAreaTotal || ''}
                    onChange={(e) => handleChange('saleableAreaTotal', e.target.value)}
                    placeholder="e.g. 10428.00 Sft"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. BUILDING CHECKLIST */}
        <Section number={9} id="sec-bldg-checklist" title="Building Occupancy & Details (Points I to AB)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Field label="I. Occupancy:">
              <select
                className={selectCls}
                value={fields.buildingOwnerOccupiedTenanted || 'Owner Occupied'}
                onChange={(e) => handleChange('buildingOwnerOccupiedTenanted', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Owner Occupied">Owner Occupied</option>
                <option value="Tenanted">Tenanted</option>
                <option value="Both">Both</option>
              </select>
            </Field>
            <Field label="K. Under Rent Control Act:">
              <select
                className={selectCls}
                value={fields.isUnderRentControlAct || 'No'}
                onChange={(e) => handleChange('isUnderRentControlAct', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="W. Pump Maintenance:">
              {renderSelect(
                fields.pumpMaintenanceBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Commonly Shared', 'Not Applicable'],
                (v) => handleChange('pumpMaintenanceBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>
            <Field label="X. Common Electricity:">
              {renderSelect(
                fields.commonElectricityBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Commonly Shared', 'Not Applicable'],
                (v) => handleChange('commonElectricityBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>
          </div>
        </Section>

        {/* 10. TECHNICAL DETAILS & SPECIFICATIONS */}
        <Section number={10} id="sec-bldg-tech-spec" title="2. Technical Details & 3. Specifications of Building">
          <div className="space-y-4">
            {/* Top Technical Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <Field label="A. Number of Floors & Total Height:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.numberOfFloorsAndHeight || "G+3 Storied Building & Height: 10'-6\""}
                  onChange={(e) => handleChange('numberOfFloorsAndHeight', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="C. (i) Building Condition (Exterior):">
                {renderSelect(
                  fields.buildingConditionExterior,
                  ['Good', 'Very Good', 'Fair', 'Average', 'Poor'],
                  (v) => handleChange('buildingConditionExterior', v),
                  isReadOnly,
                  'Good'
                )}
              </Field>
              <Field label="C. (ii) Building Condition (Interior):">
                {renderSelect(
                  fields.buildingConditionInterior,
                  ['Good', 'Very Good', 'Fair', 'Average', 'Poor'],
                  (v) => handleChange('buildingConditionInterior', v),
                  isReadOnly,
                  'Good'
                )}
              </Field>
              <Field label="D. Foundation Type:">
                {renderSelect(
                  fields.foundationType,
                  ['Column Foundation', 'Isolated Footing', 'Raft Foundation', 'Strip Footing', 'Pile Foundation', 'Under Reamed Pile'],
                  (v) => handleChange('foundationType', v),
                  isReadOnly,
                  'Column Foundation'
                )}
              </Field>
              <Field label="Roofing:">
                {renderSelect(
                  fields.specRoofing,
                  ['RCC Roof', 'ACC Sheet', 'GI Sheet', 'Tiles Roof', 'Madras Terrace', 'Pre-cast RCC Slab'],
                  (v) => handleChange('specRoofing', v),
                  isReadOnly,
                  'RCC Roof'
                )}
              </Field>
            </div>

            {/* Dynamic Floor-Wise Technical Details (A, B, E, F, G) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    2. Floor-Wise Technical Details (Points A, B, E, F, G)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add or modify floors below. All sub-points under A (Height), B (Plinth Area), E (Doors &amp; Windows), F (Flooring), and G (Wall Finishing) dynamically follow these entries.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddFloorDetail}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer"
                  >
                    + Add Floor
                  </button>
                )}
              </div>

              {(fields.floorDetails || []).map((fl, idx) => {
                const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                const rom = romans[idx] || `(${idx + 1})`;
                return (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-blue-700">{rom}</span>
                        <input
                          type="text"
                          className="font-medium text-xs text-slate-900 border-b border-slate-300 focus:outline-none focus:border-blue-500 w-48 px-1 py-0.5"
                          value={fl.floorName}
                          onChange={(e) => handleFloorDetailChange(idx, 'floorName', e.target.value)}
                          placeholder="e.g. Ground Floor"
                          disabled={isReadOnly}
                        />
                      </div>
                      {!isReadOnly && (fields.floorDetails || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFloorDetail(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                      <Field label={`A.${rom} Height:`}>
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.height || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'height', e.target.value)}
                          placeholder="10'-6&quot;"
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label={`B.${rom} Plinth Area (Sft):`}>
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.plinthArea || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'plinthArea', sanitizePositiveFloat(e.target.value))}
                          placeholder="e.g. 2156.00"
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label={`E.${rom} Doors & Windows:`}>
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.doorsWindows || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'doorsWindows', e.target.value)}
                          placeholder="Sal wood..."
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label={`F.${rom} Flooring:`}>
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.flooring || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'flooring', e.target.value)}
                          placeholder="VT Flooring"
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label={`G.${rom} Wall Finishing:`}>
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.wallFinishing || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'wallFinishing', e.target.value)}
                          placeholder="Cement Plaster..."
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Construction Specifications (Points A to W) */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">
                3. Specifications of Construction (Floor-Wise)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <Field label="A. Foundation:">
                  {renderSelect(
                    fields.specFoundation,
                    ['Column Foundation', 'Isolated Footing', 'Raft Foundation', 'Strip Footing', 'Pile Foundation', 'Under Reamed Pile'],
                    (v) => handleChange('specFoundation', v),
                    isReadOnly,
                    'Column Foundation'
                  )}
                </Field>
                <Field label="B. Basement:">
                  {renderSelect(
                    fields.specBasement,
                    ['No', 'Yes', 'Partial Basement', 'Full Basement', 'Not Applicable'],
                    (v) => handleChange('specBasement', v),
                    isReadOnly,
                    'No'
                  )}
                </Field>
                <Field label="C. Superstructure:">
                  {renderSelect(
                    fields.specSuperstructure,
                    ['Brick Masonry Super Structure', 'RCC Framed Structure', 'Fly Ash Brick Masonry', 'AAC Block Masonry', 'Load Bearing Structure', 'Stone Masonry'],
                    (v) => handleChange('specSuperstructure', v),
                    isReadOnly,
                    'Brick Masonry Super Structure'
                  )}
                </Field>
                <Field label="D. Joinery/Doors & Windows:">
                  {renderSelect(
                    fields.specJoineryDoorsWindows,
                    [
                      'Sal wood choukath with non sal wood shutter',
                      'Sal wood frames with flush doors & UPVC windows',
                      'Teak wood frames & shutters',
                      'UPVC frames and glazed windows',
                      'Aluminium sliding windows & wooden doors',
                      'Flush doors & steel windows'
                    ],
                    (v) => handleChange('specJoineryDoorsWindows', v),
                    isReadOnly,
                    'Sal wood choukath with non sal wood shutter'
                  )}
                </Field>
                <Field label="E. RCC Works:">
                  {renderSelect(
                    fields.specRccWorks,
                    ['Lintel, Chajja, Beam, Slab', 'Lintel, Chajja, Beam', 'RCC Columns, Beams & Slabs (M20/M25)', 'RCC Frame with Slabs & Lintels', 'Not Applicable'],
                    (v) => handleChange('specRccWorks', v),
                    isReadOnly,
                    'Lintel, Chajja, Beam'
                  )}
                </Field>
                <Field label="F. Plastering:">
                  {renderSelect(
                    fields.specPlastering,
                    ['Cement Plastering', 'Cement Plastering (1:6 / 1:4)', 'Smooth Cement Plaster with POP/Putty finish', 'Double Coat Sand Faced Plaster', 'Gypsum Plaster'],
                    (v) => handleChange('specPlastering', v),
                    isReadOnly,
                    'Cement Plastering'
                  )}
                </Field>
                <Field label="G. Flooring, Skirting, Dadoing:">
                  {renderSelect(
                    fields.specFlooringSkirting,
                    ['VT Flooring', 'Vitrified Tiles', 'Ceramic Tiles', 'Marble Flooring', 'Granite Flooring', 'Kota Stone', 'IPS / Cement Concrete Flooring'],
                    (v) => handleChange('specFlooringSkirting', v),
                    isReadOnly,
                    'VT Flooring'
                  )}
                </Field>
                <Field label="H. Special Finishing:">
                  {renderSelect(
                    fields.specSpecialFinishing,
                    ['Yes', 'No', 'Wall Putty & Plastic Emulsion Paint', 'Weather Coat Exterior Paint', 'POP False Ceiling & Texture Paint', 'Not Applicable'],
                    (v) => handleChange('specSpecialFinishing', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>
                <Field label="I. Roofing:">
                  {renderSelect(
                    fields.specRoofing,
                    ['RCC Roof', 'ACC Sheet', 'GI Sheet', 'Tiles Roof', 'Madras Terrace', 'Pre-cast RCC Slab'],
                    (v) => handleChange('specRoofing', v),
                    isReadOnly,
                    'RCC Roof'
                  )}
                </Field>
                <Field label="J. Drainage:">
                  {renderSelect(
                    fields.specDrainage,
                    ['Surface Drainage', 'Underground Concealed Drainage', 'PVC Pipe Drainage System', 'Connected to Municipal Drain', 'Open Surface Drain'],
                    (v) => handleChange('specDrainage', v),
                    isReadOnly,
                    'Surface Drainage'
                  )}
                </Field>
                <Field label="K. Decorative Features:">
                  {renderSelect(
                    fields.specDecorativeFeatures,
                    ['Interior work is done on Second & Third Floor', 'Interior Decorative Works with False Ceiling', 'Standard Architectural Elevation', 'Normal Plaster Grooves', 'None'],
                    (v) => handleChange('specDecorativeFeatures', v),
                    isReadOnly,
                    'Interior work is done on Second & Third Floor'
                  )}
                </Field>
                <Field label="L. (i) Internal Wiring (Concealed/External):">
                  {renderSelect(
                    fields.specInternalWiring,
                    ['Concealed', 'External / Open Casing-Capping', 'Concealed Copper Wiring (ISI Mark)', 'Concealed Conduit Wiring'],
                    (v) => handleChange('specInternalWiring', v),
                    isReadOnly,
                    'Concealed'
                  )}
                </Field>
                <Field label="L. (ii) Class of Fittings:">
                  {renderSelect(
                    fields.specWiringFittingsClass,
                    ['Superior', 'Standard / Modular', 'Ordinary', 'Semi-Modular', 'Premium Modular (Anchor/Havells/Legrand)'],
                    (v) => handleChange('specWiringFittingsClass', v),
                    isReadOnly,
                    'Superior'
                  )}
                </Field>
                <Field label="M. Sanitary Installation:">
                  {renderSelect(
                    fields.specSanitaryInstallation,
                    ['Yes', 'No', 'Modern CPVC/PVC Sanitary System', 'Standard Sanitary Line with CP Fittings', 'Not Applicable'],
                    (v) => handleChange('specSanitaryInstallation', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>
                <Field label="N. No. of Geysers:">
                  {renderSelect(
                    fields.specNoOfGeysers,
                    ['Not Verified', '1 Nos', '2 Nos', '3 Nos', '4 Nos', '5 Nos', 'None / Nil'],
                    (v) => handleChange('specNoOfGeysers', v),
                    isReadOnly,
                    'Not Verified'
                  )}
                </Field>
                <Field label="O. Class of Sanitary Fitting:">
                  {renderSelect(
                    fields.specSanitaryFittingsClass,
                    ['Superior', 'Standard', 'Ordinary', 'Premium (Jaquar/Cera/Hindware)', 'Luxury / High End'],
                    (v) => handleChange('specSanitaryFittingsClass', v),
                    isReadOnly,
                    'Superior'
                  )}
                </Field>
                <Field label="Q. No. of Lifts & Capacity:">
                  {renderSelect(
                    fields.specLiftsCapacity,
                    ['No', '1 Lift (4 Passengers / 272 kg)', '1 Lift (6 Passengers / 408 kg)', '1 Lift (8 Passengers / 544 kg)', '2 Lifts (6 Passengers)', 'Not Applicable'],
                    (v) => handleChange('specLiftsCapacity', v),
                    isReadOnly,
                    'No'
                  )}
                </Field>
                <Field label="R. Underground Sump (Capacity & Type):">
                  {renderSelect(
                    fields.specUndergroundSump,
                    ['Not Available', 'RCC Sump (5000 Liters)', 'RCC Sump (10000 Liters)', 'Brick Masonry Sump (3000 Liters)', 'Available (Capacity not specified)', 'Nil'],
                    (v) => handleChange('specUndergroundSump', v),
                    isReadOnly,
                    'Not Available'
                  )}
                </Field>
                <Field label="T. Pumps (No. & HP):">
                  {renderSelect(
                    fields.specPumpsHp,
                    ['1 Nos & 1 HP Pump', '1 Nos (0.5 HP Submersible)', '1 Nos (1.0 HP Submersible)', '1 Nos (1.5 HP Monobloc Pump)', '2 Nos (1 HP each)', 'Not Available'],
                    (v) => handleChange('specPumpsHp', v),
                    isReadOnly,
                    '1 Nos & 1 HP Pump'
                  )}
                </Field>
                <Field label="U. Roads & Paving in Compound:">
                  {renderSelect(
                    fields.specRoadsPavingCompound,
                    ['No', 'Yes (Interlocking Paver Blocks)', 'Yes (Concrete / CC Paving)', 'Yes (Stone Paving)', 'Not Applicable'],
                    (v) => handleChange('specRoadsPavingCompound', v),
                    isReadOnly,
                    'No'
                  )}
                </Field>
                <Field label="V. Sewage Disposal (Sewers/Septic):">
                  {renderSelect(
                    fields.specSewageDisposal,
                    ['Connected to Public Sewers', 'Septic Tank with Soak Pit', 'Septic Tank Only', 'Municipal Underground Sewerage System', 'Direct Open Drain'],
                    (v) => handleChange('specSewageDisposal', v),
                    isReadOnly,
                    'Connected to Public Sewers'
                  )}
                </Field>
                <Field label="W. Quality / Class of Construction:">
                  {renderSelect(
                    fields.specQualityClassConstruction,
                    ['Good', 'Very Good', 'Superior / First Class', 'Second Class / Average', 'Economy Class', 'Fair'],
                    (v) => handleChange('specQualityClassConstruction', v),
                    isReadOnly,
                    'Good'
                  )}
                </Field>
              </div>

              {/* P. Compound Wall Details */}
              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                <p className="font-semibold text-slate-700 text-xs uppercase">P. Compound Wall</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <Field label="1. Compound Wall:">
                    {renderSelect(
                      fields.specCompoundWall,
                      ['Yes', 'No', 'Partial', 'Not Applicable'],
                      (v) => handleChange('specCompoundWall', v),
                      isReadOnly,
                      'Yes'
                    )}
                  </Field>
                  <Field label="2. Height and Length:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.specCompoundWallHeightLength || "Height: 5'-0\", Length: 150'-0\""}
                      onChange={(e) => handleChange('specCompoundWallHeightLength', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="3. Type of Construction:">
                    {renderSelect(
                      fields.specCompoundWallType,
                      ['Brick Masonry Wall with Iron Gate', 'Brick Masonry Wall with Plaster & Paint', 'RCC / Precast Compound Wall', 'Stone Masonry Wall', 'Barbed Wire Fencing with MS Gate', 'Not Applicable'],
                      (v) => handleChange('specCompoundWallType', v),
                      isReadOnly,
                      'Brick Masonry Wall with Iron Gate'
                    )}
                  </Field>
                </div>
              </div>

              {/* S. Overhead Tank Details */}
              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                <p className="font-semibold text-slate-700 text-xs uppercase">S. Overhead Tank</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <Field label="1. Overhead Tank:">
                    {renderSelect(
                      fields.specOverheadTank,
                      ['Yes', 'No', 'Not Applicable'],
                      (v) => handleChange('specOverheadTank', v),
                      isReadOnly,
                      'Yes'
                    )}
                  </Field>
                  <Field label="2. Where Located:">
                    {renderSelect(
                      fields.specOverheadTankLocation,
                      ['On the top of the roof', 'Over Head Staging / Terrace', 'On RCC Slab Above Staircase Headroom', 'Not Applicable'],
                      (v) => handleChange('specOverheadTankLocation', v),
                      isReadOnly,
                      'On the top of the roof'
                    )}
                  </Field>
                  <Field label="3. Capacity:">
                    {renderSelect(
                      fields.specOverheadTankCapacity,
                      ['2000 Liters', '1000 Liters (PVC/Sintex)', '1500 Liters', '3000 Liters', '5000 Liters (RCC/PVC)', 'Not Applicable'],
                      (v) => handleChange('specOverheadTankCapacity', v),
                      isReadOnly,
                      '2000 Liters'
                    )}
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 11. BUILDING VALUATION, SUB-SCHEDULES & 6.0 TOTAL ABSTRACT MATRIX */}
        <Section number={11} id="sec-bldg-valuation-schedules" title="Building Valuation, Sub-Schedules (Part 4 & 5) & 6.0 Total Abstract Matrix">
          <div className="space-y-4">
            {/* 8-Col Valuation Table */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm">4. Details of Building Valuation</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddBuildingRow}
                  className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded cursor-pointer"
                >
                  + Add Valuation Row
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Plinth (sft)</th>
                    <th className="p-2 text-left">Height</th>
                    <th className="p-2 text-left">Age</th>
                    <th className="p-2 text-left">Repl. Rate</th>
                    <th className="p-2 text-left">Repl. Cost</th>
                    <th className="p-2 text-left">Depreciation</th>
                    <th className="p-2 text-left">Net Value</th>
                    {!isReadOnly && <th className="p-2 w-10 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.buildingValuationRows || []).map((br, idx) => (
                    <tr key={idx}>
                      <td className="p-1">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.description}
                          onChange={(e) => handleBuildingRowChange(idx, 'description', e.target.value)}
                          placeholder="Description"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-20">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.plinthArea}
                          onChange={(e) => handleBuildingRowChange(idx, 'plinthArea', sanitizePositiveFloat(e.target.value))}
                          placeholder="Plinth"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-16">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.height}
                          onChange={(e) => handleBuildingRowChange(idx, 'height', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-16">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.age}
                          onChange={(e) => handleBuildingRowChange(idx, 'age', sanitizePositiveInt(e.target.value, 3))}
                          placeholder="Yrs"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-24">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.replacementRate}
                          onChange={(e) => handleBuildingRowChange(idx, 'replacementRate', sanitizePositiveFloat(e.target.value))}
                          placeholder="Rate"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-28">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.replacementCost}
                          onChange={(e) => handleBuildingRowChange(idx, 'replacementCost', sanitizePositiveFloat(e.target.value))}
                          placeholder="Cost"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-24">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.depreciation}
                          onChange={(e) => handleBuildingRowChange(idx, 'depreciation', sanitizePositiveFloat(e.target.value))}
                          placeholder="Dep"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-28">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.valueAfterDepreciation}
                          onChange={(e) => handleBuildingRowChange(idx, 'valueAfterDepreciation', sanitizePositiveFloat(e.target.value))}
                          placeholder="Net Val"
                          disabled={isReadOnly}
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBuildingRow(idx)}
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4 Sub-schedules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              {/* Extra Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.1 Extra Items</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isExtraItemsNA}
                      onChange={(e) => handleChange('isExtraItemsNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isExtraItemsNA && (
                  <div className="space-y-1">
                    {(fields.extraItems || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('extraItems', idx, sanitizePositiveFloat(e.target.value))}
                          placeholder="Cost"
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.2 Amenities</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isAmenitiesNA}
                      onChange={(e) => handleChange('isAmenitiesNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isAmenitiesNA && (
                  <div className="space-y-1">
                    {(fields.amenities || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('amenities', idx, sanitizePositiveFloat(e.target.value))}
                          placeholder="Cost"
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Misc Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.3 Miscellaneous Items</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isMiscNA}
                      onChange={(e) => handleChange('isMiscNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isMiscNA && (
                  <div className="space-y-1">
                    {(fields.miscItems || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('miscItems', idx, sanitizePositiveFloat(e.target.value))}
                          placeholder="Cost"
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Services Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.4 Services Items</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isServicesNA}
                      onChange={(e) => handleChange('isServicesNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isServicesNA && (
                  <div className="space-y-1">
                    {(fields.servicesItems || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('servicesItems', idx, sanitizePositiveFloat(e.target.value))}
                          placeholder="Cost"
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6.0 Total Abstract Matrix */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 pt-3">
              <h4 className="font-semibold text-slate-800 text-sm">6.0. Total Abstract Matrix (Land + Building + Sub-Schedules)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Field label="Total Govt. Benchmark Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.abstractGovtSay || fields.abstractGovtTotal || ''}
                    disabled
                  />
                </Field>
                <Field label="Total Market Value:">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-slate-900`}
                    value={fields.abstractMarketSay || fields.abstractMarketTotal || ''}
                    disabled
                  />
                </Field>
                <Field label="Total Realisable Value (95%):">
                  <input
                    type="text"
                    className={`${inputCls} font-semibold`}
                    value={fields.abstractRealSay || fields.abstractRealTotal || ''}
                    disabled
                  />
                </Field>
                <Field label="Total Distress Sale Value (85%):">
                  <input
                    type="text"
                    className={`${inputCls} font-semibold`}
                    value={fields.abstractDistressSay || fields.abstractDistressTotal || ''}
                    disabled
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 12. REMARKS & CERTIFICATE OF VALUATION / OPINION */}
        <Section number={12} id="sec-remarks-opinion" title="Remarks & Certificate of Valuation / Opinion">
          <div className="space-y-4">
            <Field label="General Remarks & Condition of the Property / Remarks:">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.valuationRemarksBox || ''}
                onChange={(e) => handleChange('valuationRemarksBox', e.target.value)}
                placeholder="e.g. SUBJECT PROPERTY IS A G+3 STORIED BUILDING..."
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Basis of Valuation Statement:">
              <input
                type="text"
                className={inputCls}
                value={fields.basisOfValuationStatement || ''}
                onChange={(e) => handleChange('basisOfValuationStatement', e.target.value)}
                placeholder="(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)"
                disabled={isReadOnly}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fair Market Value (in words):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.fairMarketValueWords || ''}
                  onChange={(e) => handleChange('fairMarketValueWords', e.target.value)}
                  placeholder="Rupees..."
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Realisable Value (in words):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.realisableValueWords || ''}
                  onChange={(e) => handleChange('realisableValueWords', e.target.value)}
                  placeholder="Rupees..."
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 13. DECLARATION & VALUER CREDENTIALS */}
        <Section number={13} id="sec-declaration" title="Declaration & Valuer Credentials">
          <div className="space-y-6">
            {/* Valuer Credentials & Sign-Off */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">Valuer Credentials & Sign-Off Block</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="Empanelled Valuer Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.empanelledValuerName || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)'}
                    onChange={(e) => handleChange('empanelledValuerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Site Engineer Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.siteEngineerName || 'MR. SIBA BEHERA'}
                    onChange={(e) => handleChange('siteEngineerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Valuer Qualifications:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerQualifications || 'B.E. (Civil), M.Tech (Civil), M.Sc. (Real Estate Valuation), MBA (Finance), MBA (HR)'}
                    onChange={(e) => handleChange('valuerQualifications', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="IOV Reg No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerIovRegNo || 'No. F-26377'}
                    onChange={(e) => handleChange('valuerIovRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Wealth Tax Reg No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerWealthTaxRegNo || 'Regd. No.-107/2016-17, Cat -I'}
                    onChange={(e) => handleChange('valuerWealthTaxRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Declaration Date:">
                  <BaseDateInput
                    value={fields.declarationDate || ''}
                    onChange={(val) => handleChange('declarationDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Total Report Pages Count with Lock Toggle */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Total Report Pages (in Declaration Point O):
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!fields.reportPagesCountLocked}
                        onChange={(e) => {
                          const auto = e.target.checked;
                          setFields(prev => ({
                            ...prev,
                            reportPagesCountLocked: !auto,
                            reportPagesCount: auto ? dynamicTotalPages : prev.reportPagesCount,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                      <span>Auto calculate ({dynamicTotalPages} pages)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    className={`${inputCls} mt-1`}
                    value={fields.reportPagesCount || ''}
                    onChange={(e) => handleChange('reportPagesCount', sanitizePositiveInt(e.target.value, 3))}
                    placeholder="e.g. 26"
                    disabled={isReadOnly || !fields.reportPagesCountLocked}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 14. VALUATION CHECKLIST */}
        <Section number={14} id="sec-checklist" title="Valuation Report Check-List (10 Points)">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">Valuation Report Check-List (10 Points)</h4>
              <div className="space-y-2">
                {(fields.checklist || []).map((ci, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded">
                    <span className="text-xs text-slate-700 pr-4">{ci.pointNo}. {ci.question}</span>
                    <select
                      className="text-xs border border-slate-300 rounded px-2 py-1 font-semibold"
                      value={ci.answer}
                      onChange={(e) => handleChecklistChange(idx, e.target.value as any)}
                      disabled={isReadOnly}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 15. Documents */}
        <BaseDocumentsSection
          title="Documents"
          sectionId="sec-documents"
          sectionNumber={15}
          documentImages={fields.documentImages || []}
          documentImageNames={fields.documentImageNames || []}
          isReadOnly={isReadOnly}
          uploading={saving}
          onUploadDocument={handleDocumentUpload}
          onRemoveDocument={handleDocumentRemove}
          onDocumentNameChange={handleDocumentRename}
          onReorderDocuments={handleDocumentReorder}
          defaultOpen={true}
        />

        {/* 16. Maps */}
        <BaseMapsSection
          title="Maps"
          sectionId="sec-maps"
          sectionNumber={16}
          locationMapImages={fields.locationMapImages || (fields.locationMapImageUrl ? [fields.locationMapImageUrl] : [])}
          mouzaMapImages={fields.mouzaMapImages || (fields.rorImageUrl ? [fields.rorImageUrl] : [])}
          sketchMapImages={fields.sketchMapImages || (fields.guidelineValueImageUrl ? [fields.guidelineValueImageUrl] : [])}
          cadastralMapImages={fields.cadastralMapImages || (fields.bhuNakshaImageUrl ? [fields.bhuNakshaImageUrl] : [])}
          bdaMapImages={fields.bdaMapImages || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          propertyAddress={fields.propAt || ''}
          isReadOnly={isReadOnly}
          uploading={saving}
          onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
          onReorderLocationMap={(imgs) => handleMapReorder('locationMapImages', imgs)}
          onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={(idx) => handleMapRemove('mouzaMapImages', idx)}
          onReorderMouzaMap={(imgs) => handleMapReorder('mouzaMapImages', imgs)}
          onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
          onReorderSketchMap={(imgs) => handleMapReorder('sketchMapImages', imgs)}
          onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
          onReorderCadastralMap={(imgs) => handleMapReorder('cadastralMapImages', imgs)}
          onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
          onBdaMapRemove={(idx) => handleMapRemove('bdaMapImages', idx)}
          onReorderBdaMap={(imgs) => handleMapReorder('bdaMapImages', imgs)}
          defaultOpen={true}
        />

        {/* 17. Property Photographs */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionNumber={17}
          sectionId="sec-photos"
          propertyImages={propertyImages}
          propertyImageNames={propertyImageNames}
          isReadOnly={isReadOnly}
          uploading={saving}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setShowBucketModal(true)}
          onUploadImages={handleUploadMultiplePhotos}
          onRemoveImage={handlePhotoRemove}
          onImageNameChange={handlePhotoRename}
          onReorderImages={handlePhotoReorder}
          defaultOpen={true}
        />

        {/* STANDARDIZED ACTION BAR (DOCKED AT BOTTOM OF MAIN CONTENT) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={saving || submitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      {/* Floating Section Navigator on the Right Side */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Cloud Bucket Selection Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const addedNames = selectedUrls.map((_, i) => `Photograph ${propertyImages.length + i + 1}`);
            const mergedImgs = [...propertyImages, ...selectedUrls];
            const mergedNames = [...propertyImageNames, ...addedNames];
            const mergedPhotos = mergedImgs.map((url, idx) => ({
              url,
              caption: mergedNames[idx] || `Photograph ${idx + 1}`,
            }));
            setFields((prev) => ({
              ...prev,
              propertyPhotos: mergedPhotos,
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
