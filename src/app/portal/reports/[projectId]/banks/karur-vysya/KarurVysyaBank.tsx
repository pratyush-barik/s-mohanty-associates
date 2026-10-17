'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  MapPin,
  FileText,
  DollarSign,
  Camera,
  Layers,
  ShieldCheck,
} from 'lucide-react';

import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportTitleCard,
  ActiveConfigBanner,
  FloatingNavigator,
  ReportActionBar,
  EarliestFieldVisitBadge,
  Field,
  Section,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';

import {
  sanitizePositiveFloat,
  sanitizePositiveInt,
  sanitizePercentage,
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
  calculatePercentageValue,
} from '@/lib/bank-input-constraints';

import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFKarurVysyaRenderer } from '@/lib/banks/pdf-karur-vysya-renderer';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

export const KARUR_VYSYA_CONFIG: BankConfig = {
  bankId: 'KARUR VYSYA BANK',
  subTemplateId: '',
  displayName: 'Karur Vysya Bank Limited',
  defaultValues: {
    purpose: 'Commercial / Industrial Valuation',
  },
};

export interface KarurVysyaBankProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

const DEFAULT_OWNERSHIP_DEEDS = [
  '1. Deed of Conveyance No. I-5158, dated- 16th June 2022, between Sri Gosta Bihari Das (Vendor), M/S C & B Ecogen Pvt. Ltd. (Purchaser), mentioning total shali land area 24.75 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 507, 517, L.R Dag No- 532, 543, R.S Khatian No- 349, 310, L.R Khatian No- 1639, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.22,50,000/-',
  '2. Sale Deed No. I-7555, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
  '3. Sale Deed No. I-7559, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
  '4. Sale Deed No. I-7564, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
  '5. Sale Deed No. I-7558, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
  '6. Sale Deed I-9200/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Ray (Seller) mentioning Shali Land 1 Katha 5 Chatak 09 sqft situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 520, L.R Dag No- 546, R.S Khatian No- 364, L.R Khatian No- 1855, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.2,63,000/-',
  '7. Sale Deed I-9201/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Ray (Seller) mentioning Shali Land 2 Katha 3 Chatak 28 sqft situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 521, L.R Dag No- 547, R.S Khatian No- 245, L.R Khatian No- 1855, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.5,00,000/-',
  '8. Sale Deed I-9202/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sabina Bibi (Seller) mentioning Shali Land 3 Katha 10 Chatak situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 520, L.R Dag No- 546, R.S Khatian No- 364, L.R Khatian No- 1864, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.7,25,000/-',
  '9. Sale Deed I-9203/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Roy (Seller) mentioning Shali Land 2 Katha 4 Chatak situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 521, L.R Dag No- 547, R.S Khatian No- 245, L.R Khatian No- 1855, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.7,25,000/-',
  '10. Sale Deed I-9199/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Roy (Seller) mentioning Shali Land 1 Katha 3 Chatak 11 sqft situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 518, L.R Dag No- 544, R.S Khatian No- 344, L.R Khatian No- 1863, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.2,37,000/-'
].join('\n\n');

const DEFAULT_OTHER_DOCUMENTS = `Land Conversion vide case no. CN/2023/1615/1929 Dated 11.05.2023 in the name of M/s. Ecogen Pvt Ltd of land area 5 decimal at Dag No. 532 & 19 Decimal land at Dag No. 543
Land Conversion vide case no. CN/2023/1615/9912 Dated 21.02.2024 in the name of M/s. Ecogen Pvt Ltd of land area 12 decimal at Dag No. 543
Land Conversion vide case no. CN/2024/1615/2662 Dated 01.03.2024 in the name of M/s. Ecogen Pvt Ltd of land area 2 decimal at Dag No. 544, land area 8 Decimal at Dag No. 546 & 7 Decimal land at Dag No. 547
Sanctioned Plan received for proposed two storied commercial building, Approved by Pradhan of Bonhooghly 1 Gram Panchayat, Plan Number & Date is Unclear
Sanction Plan for Tin Shed structure, approved by Bonhooghly 1 Gram Panchayat vide Regd No. Bon-IGP/1865/2022-23 dated 30.08.2022
Draft Plan for Single storied commercial building with truss of area 7405 sqft
Amalgamated Site Plan for 33K 10CH 3 SQFT land drawn by Imtiaz Ali Mondal (Surveyor & Planner)`;

const DEFAULT_REMARKS = `1  Legal aspects are out of scope of valuation.
2  Genuineness of original documents to be verified by the bank authorities before disbursement.
3  All the documents received by us are soft copies only. The bank should verify the authenticity for the documents.
4  The valuer is not responsible for any legal implications such as Any Court Cases, Land Acquisition Proceedings, Encroaches, Encumbrances, Defects in titles and any such other legal claims on the property.
5  This report is prepared on the basis of the copies of the limited documents as mentioned in the report.
6  The property is identified through an identifier & provided document received from bank only. Actual measured land area is more or less matched with Deed land area.
7  The subject property is well demarcated with boundary walls on all side.
8  This valuation report may give a completely different result if any of the assumptions mentioned above are found to be not true. Lenders should check and think of necessary mitigate, as may found suitable, in case of adverse situation, WRT future sale-ability in the open market, at this existing condition.
10 As per Deed Total land area 24,213 sqft i.e. 55.58 Decimal & as per measured 25,612 sqft but as per Land Conversion total land area 53 Decimal. We have considered land area as per Land conversion.
11 Out of the three building plans provided, two are approved by the Gram Panchayat Pradhan and comply with building bye-laws. The third is a draft plan pending approval from the Zilla Parishad. As aligned during discussions with bank officials, the total construction area has been considered based on all three plans, subject to the final approval of the draft plan.
12 The basic civic amenities are all available within a minimum distance of approx. 2-8 Kms. from the subject property.
13 Thus, based on the above stated facts the Valuation of the subject property is recommended. Futuristic Complications will not be complying this report.
14 This valuation report may give a completely different result if any of the assumptions mentioned above are found to be not true. Lenders should check and think of necessary mitigate, as may found suitable, in case of adverse situation, WRT future sale-ability in the open market, at this existing condition.`;

const DEFAULT_DECLARATIONS = `1  The information furnished in our valuation report is true and correct to best of my knowledge and belief and in an impartial and true valuation of the property.
2  We have no direct or indirect interest in the property valued.
3  Information furnished in the report is true and correct to the best of our knowledge and belief.
4  Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair, market value of such properties/localities may increase or decrease, depending on the future market conditions & scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.
5  No structural survey was conducted by us.
6  We have deputed our representative Sougata Sanfui to Inspect the property. Our representative has personally inspected the property.
7  We are not required to give testimony or appear in court by any reason of this appraisal report, with reference to the property in question.
8  We have also taken into consideration the slump in the market and the oversupply condition in the market. The demand for quality construction and maintenance for properties is also considered.
9  We have compared other comparable properties on the basis of many factors and as far as possible tried to remove/ account for the differences in type, location and quality of the properties.
10 Ownership papers may please be verified by the legal adviser at your end to ascertain the right title & area.`;

export default function KarurVysyaBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: KarurVysyaBankProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || userRole === 'viewer' || status === 'completed';

  const [form, setForm] = useState<any>(() => {
    const f = rawInitialFields || {};
    return {
      reportNumber: f.reportNumber || f.refNo || projectCode || 'VIP/KVB/558',
      dateOfReport: f.dateOfReport || f.reportDate || '24.09.2026',

      // 1. GENERAL
      applicantName: f.applicantName || prefill?.contactName || 'C&B Ecogen Pvt Ltd',
      applicationNumber: f.applicationNumber || 'N.A.',
      ownerName: f.ownerName || 'M/S C & B Ecogen Pvt. Ltd. (Purchaser)',
      dateOfTechnicalVisit: f.dateOfTechnicalVisit || f.inspectionDate || (prefill as any)?.fieldVisitDate || '10.08.2026',
      buildingSocietyName: f.buildingSocietyName || 'N.A.',
      builderSellerName: f.builderSellerName || 'Sanjay Kumar Roy, Sabina Bibi and others (Seller)',
      personMetAtSite: f.personMetAtSite || 'Goutam Bag (Workshop In Charge), Contact No.- Not shared',

      // 2. DETAILS OF THE PROPERTY
      electricMeterNumber: f.electricMeterNumber || 'N.A.',
      propertyType: f.propertyType || prefill?.propertyType || 'Industrial',
      basement: f.basement || 'Nil',
      noOfStories: f.noOfStories || 'Single Storied Shed Structures and 1 Storied RCC structure',
      propertyLocatedOn: f.propertyLocatedOn || 'Entire Property',
      totalNoOfUnits: f.totalNoOfUnits || 'Do',
      lift: f.lift || 'Nil',
      propertyConfiguration: f.propertyConfiguration || 'GF- 2 Toilet, 2 Office Room, 1st Floor- 1 Room. Rest In CGI Shed Factory Area, Some Vacant Land',
      noOfBathrooms: f.noOfBathrooms || '2',
      ageOfProperty: f.ageOfProperty || '5',
      residualAge: f.residualAge || '75',
      occupancyStatus: f.occupancyStatus || 'Occupied by Owner',
      vacantDuration: f.vacantDuration || 'N.A.',
      selfOccupiedDuration: f.selfOccupiedDuration || 'For 3 years',
      tenantDuration: f.tenantDuration || 'Not Known',
      propertyAddressInitiation: f.propertyAddressInitiation || prefill?.propertyAddress || 'Mouza Joyenpur, JL No : 66 RS : Khatian No: 310R S Dag No : 507,517 PS Sonarpur Now Narendrapur Dist : South 24 Parganas Under Bonhoogly-1 Gram Panchayat',
      propertyAddressSite: f.propertyAddressSite || prefill?.propertyAddress || 'Vill- Jayenpur, P.O. Jayenpur, P.S. Narendrapur, Dist- South 24 Parganas, Pin Code- 700155, Under Bonhoogly I No Gram Panchayat',
      propertyAddressDocs: f.propertyAddressDocs || prefill?.propertyAddress || 'Mouza- Jayenpur, JL No- 66, Dag No- RS 507,517, 520, 518, 521, L.R 532, 543, 546, 544, 547, Khatian No- R.S 349, 310, 344, 364, 245, L.R 1693, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat',
      pinCode: f.pinCode || 'Kolkata-700 155',
      approvedBuildingUsage: f.approvedBuildingUsage || 'Commercial',
      onSiteBuildingUsage: f.onSiteBuildingUsage || 'Industrial (Factory)',
      zoningMasterPlan: f.zoningMasterPlan || 'Bonhooghly 1 No. Gram Panchayat',
      landClassification: f.landClassification || 'Do',
      crzAsiRegulations: f.crzAsiRegulations || 'N.A.',

      // 3. SURROUNDINGS, ACCESIBILITY & PROXIMITY
      distanceCityCenter: f.distanceCityCenter || '28 Km. approx.',
      nearestRailwayStation: f.nearestRailwayStation || 'Narendrapur Halt (Approx. 9.4 K.M)',
      nearestBusStand: f.nearestBusStand || 'Nepalgunge Bus Stop (Approx. 3.2 K.M)',
      nearestHospital: f.nearestHospital || 'Apollo Hospital (6.5 kms. approx.)',
      widthOfApproachRoad: f.widthOfApproachRoad || '22ft. wide Kuchha Road',
      nearbyLandmark: f.nearbyLandmark || 'Near Jayenpur More Industrial Area',
      typeOfLocality: f.typeOfLocality || 'Mixed',
      occupancyRatio: f.occupancyRatio || 'N.A.',
      developmentSurroundings: f.developmentSurroundings || 'Developing',
      plotDemarcatedAtSite: f.plotDemarcatedAtSite || 'The subject property is demarcated by boundary wall from all sides.',
      demolitionRisk: f.demolitionRisk || 'N.A.',
      propertyIdentifiedThrough: f.propertyIdentifiedThrough || 'The property is identified through an identifier & provided document received from bank only.',
      municipalLimit: f.municipalLimit || 'Bonhooghly 1 No. Gram Panchayat',

      // Boundaries Matrix
      boundNorthSite: f.boundNorthSite || 'Partly Road Partly Vacant Land',
      boundNorthPlan: f.boundNorthPlan || '20ft wide Common Passage',
      boundSouthSite: f.boundSouthSite || "22' Wide Road",
      boundSouthPlan: f.boundSouthPlan || '20ft wide Common Passage',
      boundEastSite: f.boundEastSite || 'Pond Partly Vacant Low Land',
      boundEastPlan: f.boundEastPlan || 'Not mentioned',
      boundWestSite: f.boundWestSite || "22' Wide Road",
      boundWestPlan: f.boundWestPlan || '20ft wide Common Passage',
      boundariesMatching: f.boundariesMatching || 'Partly',
      boundariesDiscrepancy: f.boundariesDiscrepancy || 'East side boundary not mentioned in Site Plan',

      // 4. SURVEY OF CONSTRUCTION
      typeOfConstruction: f.typeOfConstruction || 'RCC Structure & CGI Shed Structure',
      qualityOfConstruction: f.qualityOfConstruction || 'Good',
      exteriors: f.exteriors || 'Do',
      interiors: f.interiors || 'Do',
      amenitiesProvided: f.amenitiesProvided || 'Water, Overhead Tank, Drainage, Electricity etc.',
      constructionProgress: f.constructionProgress || '100% completed',
      completionStagePct: f.completionStagePct || '100%',
      recommendedStagePct: f.recommendedStagePct || '100%',

      // 5. DOCUMENTS VERIFIED
      approvedLayoutPlans: f.approvedLayoutPlans || 'Not available',
      approvedBuildingPlans: f.approvedBuildingPlans || 'Sanctioned Plan received for proposed two storied commercial building, approved by Pradhan of Bonhooghly 1 Gram Panchayat, Plan Number & Date is Unclear.\nSanction Plan for Tin Shed structure, approved by Bonhooghly 1 Gram Panchayat vide Regd No. Bon-IGP/1865/2022-23 dated 30.08.2022\nDraft Plan for Single storied commercial building with truss of area 7405 sqft',
      commencementCertificate: f.commencementCertificate || 'Not available',
      buPermissionDetails: f.buPermissionDetails || 'Not available',
      reraNo: f.reraNo || 'Not available',
      ownershipProof: f.ownershipProof || DEFAULT_OWNERSHIP_DEEDS,
      otherDocuments: f.otherDocuments || DEFAULT_OTHER_DOCUMENTS,

      // 6. LAND & BUILDING AREA DETAILS
      landAreaSite: f.landAreaSite || '25,612 Sq. ft.',
      landAreaPlan: f.landAreaPlan || '31 Katha 12 sqft or 22,332 Sq. ft.',
      landAreaDocs: f.landAreaDocs || 'As per Deed 24,213 Sq. ft., as per Conversion 23,086 sqft',
      shedAreaSite: f.shedAreaSite || '11,245 Sq. ft.',
      shedAreaPlan: f.shedAreaPlan || '8600 Sq. ft.',
      shedAreaDocs: f.shedAreaDocs || 'NA',
      rccAreaSite: f.rccAreaSite || '1,117 Sq. ft.',
      rccAreaPlan: f.rccAreaPlan || '816 Sq.ft.',
      rccAreaDocs: f.rccAreaDocs || 'NA',
      violationDetails: f.violationDetails || 'Horizontal deviation found',

      // 7. VALUATION DETAILS
      valLandArea: f.valLandArea !== undefined ? String(f.valLandArea) : '23086',
      valLandRate: f.valLandRate !== undefined ? String(f.valLandRate) : '972',
      valShedArea: f.valShedArea !== undefined ? String(f.valShedArea) : '8600',
      valShedRate: f.valShedRate !== undefined ? String(f.valShedRate) : '1200',
      valRccArea: f.valRccArea !== undefined ? String(f.valRccArea) : '816',
      valRccRate: f.valRccRate !== undefined ? String(f.valRccRate) : '1600',
      valOtherLs: f.valOtherLs !== undefined ? String(f.valOtherLs) : '0',
      valSayTotal: f.valSayTotal !== undefined ? String(f.valSayTotal) : '34065000',

      // 8. GOVERNMENT VALUE
      govtLandArea: f.govtLandArea || '23,086 Sq. ft.',
      govtLandRate: f.govtLandRate || 'Rs. 515.00 per Sq. ft. for Karkhana/Industrial Land',
      govtLandVal: f.govtLandVal || '1,18,89,290.00',
      govtConstArea: f.govtConstArea || 'NA',
      govtConstRate: f.govtConstRate || 'NA',
      govtConstVal: f.govtConstVal || 'NA',
      govtTotalVal: f.govtTotalVal || 'Rs. 1,18,89,290.00',

      // 9. REMARKS & DECLARATION
      remarks: f.remarks || DEFAULT_REMARKS,
      declarations: f.declarations || DEFAULT_DECLARATIONS,
      visitedPersonName: f.visitedPersonName || 'Sougata Sanfui',

      // Annexures
      propertyImages: f.propertyImages || [],
      propertyImageNames: f.propertyImageNames || [],
      documentImages: f.documentImages || [],
      documentImageNames: f.documentImageNames || [],
      locationMapImages: f.locationMapImages || [],
      mouzaMapImages: f.mouzaMapImages || [],
      sketchMapImages: f.sketchMapImages || [],
      cadastralMapImages: f.cadastralMapImages || [],
      bdaMapImages: f.bdaMapImages || [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | false>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  const updateField = useCallback((key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(form.propertyImages, prefill);
  }, [form.propertyImages, prefill]);

  // ═══════════════════════════════════════════════
  // LIVE VALUATION MATHEMATICS (Section 7 & 9)
  // ═══════════════════════════════════════════════
  const landAreaNum = parseSafeFloat(form.valLandArea);
  const landRateNum = parseSafeFloat(form.valLandRate);
  const landValue = useMemo(() => multiplyExactDecimals(landAreaNum, landRateNum), [landAreaNum, landRateNum]);

  const shedAreaNum = parseSafeFloat(form.valShedArea);
  const shedRateNum = parseSafeFloat(form.valShedRate);
  const shedValue = useMemo(() => multiplyExactDecimals(shedAreaNum, shedRateNum), [shedAreaNum, shedRateNum]);

  const rccAreaNum = parseSafeFloat(form.valRccArea);
  const rccRateNum = parseSafeFloat(form.valRccRate);
  const rccValue = useMemo(() => multiplyExactDecimals(rccAreaNum, rccRateNum), [rccAreaNum, rccRateNum]);

  const otherLsNum = parseSafeFloat(form.valOtherLs);
  const exactTotal = useMemo(
    () => sumDecimals([landValue, shedValue, rccValue, otherLsNum]),
    [landValue, shedValue, rccValue, otherLsNum]
  );

  const sayTotalNum = useMemo(() => {
    const rawSay = parseSafeFloat(form.valSayTotal);
    return rawSay > 0 ? rawSay : exactTotal;
  }, [form.valSayTotal, exactTotal]);

  // Section 9 Metrics
  const realizableValue = useMemo(() => calculatePercentageValue(sayTotalNum, 90), [sayTotalNum]);
  const distressValue = useMemo(() => calculatePercentageValue(sayTotalNum, 80), [sayTotalNum]);
  const insurableValue = useMemo(() => sumDecimals([shedValue, rccValue]), [shedValue, rccValue]);

  // Upload Handlers
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('documents');
      const newUrls: string[] = [];
      const newNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/docs/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, ''));
      }
      setForm((prev: any) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...newUrls],
        documentImageNames: [...(prev.documentImageNames || []), ...newNames],
      }));
      setMessage({ text: 'Documents uploaded successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleMapUpload = async (mapKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(mapKey);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/maps/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }
      setForm((prev: any) => ({
        ...prev,
        [mapKey]: [...(prev[mapKey] || []), ...newUrls],
      }));
      setMessage({ text: 'Map uploaded successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('photos');
      const newUrls: string[] = [];
      const newNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/photos/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(`Photograph ${(form.propertyImages?.length || 0) + i + 1}`);
      }
      setForm((prev: any) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...newUrls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...newNames],
      }));
      setMessage({ text: 'Photos uploaded successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // AUTO-SAVE DRAFT ACTION
  // ═══════════════════════════════════════════════
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, form);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Report draft saved successfully', type: 'success' });
    } catch (err: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Failed to save draft: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPDF = async () => {
    setPreviewing(true);
    try {
      const renderer = new PDFKarurVysyaRenderer({ ...form, projectCode });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      setMessage({ text: 'Failed to generate PDF preview: ' + err.message, type: 'error' });
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const renderer = new PDFKarurVysyaRenderer({ ...form, projectCode });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KVB_Valuation_${form.reportNumber || projectCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ text: 'Failed to download PDF: ' + err.message, type: 'error' });
    }
  };

  // 14 Floating Navigator Sections (0 numeric prefixes)
  const navSections = useMemo(
    () => [
      { id: 'sec-general', title: 'General Information' },
      { id: 'sec-property', title: 'Property Details' },
      { id: 'sec-surroundings', title: 'Surroundings & Boundaries' },
      { id: 'sec-construction', title: 'Survey of Construction' },
      { id: 'sec-documents', title: 'Documents Verified' },
      { id: 'sec-area-details', title: 'Area Details' },
      { id: 'sec-valuation', title: 'Valuation Details' },
      { id: 'sec-govt-val', title: 'Government Value' },
      { id: 'sec-final-val', title: 'Final Valuation & Insurance' },
      { id: 'sec-remarks', title: 'Remarks' },
      { id: 'sec-declaration', title: 'Declaration' },
      { id: 'sec-documents-annexure', title: 'Documents' },
      { id: 'sec-maps-annexure', title: 'Maps' },
      { id: 'sec-photos-annexure', title: 'Photographs' },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-28 w-full">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName="KARUR VYSYA BANK LIMITED"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full px-4 sm:px-6 lg:px-8">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Title Header Card */}
          <BankReportTitleCard
            bankName="Karur Vysya Bank Limited"
            subclass="Standard Valuation Format"
            description="Commercial / Industrial valuation format with 11 core sections, multi-deed legal matrix, and media annexures."
            earliestVisit={earliestVisit}
            projectCode={projectCode}
          />

          {/* Banner Alert Message */}
          {message && (
            <div
              className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-xs font-bold underline ml-4">
                Dismiss
              </button>
            </div>
          )}

          {/* 1. General Information */}
          <div id="sec-general">
            <Section title="General Information" number={1} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Report Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reportNumber}
                    onChange={e => updateField('reportNumber', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Date of Report">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.dateOfReport}
                    onChange={e => updateField('dateOfReport', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Date of Technical Visit">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.dateOfTechnicalVisit}
                    onChange={e => updateField('dateOfTechnicalVisit', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of the Applicant">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.applicantName}
                    onChange={e => updateField('applicantName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Application Number (If Any)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.applicationNumber}
                    onChange={e => updateField('applicationNumber', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of Owner (As per legal docs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ownerName}
                    onChange={e => updateField('ownerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Name of the Builder/Seller">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.builderSellerName}
                    onChange={e => updateField('builderSellerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of The Building/Society">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.buildingSocietyName}
                    onChange={e => updateField('buildingSocietyName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Person Met at site and contact number">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.personMetAtSite}
                    onChange={e => updateField('personMetAtSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 2. Property Details */}
          <div id="sec-property">
            <Section title="Property Details" number={2} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Electric Meter Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.electricMeterNumber}
                    onChange={e => updateField('electricMeterNumber', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyType}
                    onChange={e => updateField('propertyType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Basement">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.basement}
                    onChange={e => updateField('basement', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="No. of Stories">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfStories}
                    onChange={e => updateField('noOfStories', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property located on">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyLocatedOn}
                    onChange={e => updateField('propertyLocatedOn', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total no of units">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.totalNoOfUnits}
                    onChange={e => updateField('totalNoOfUnits', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Lift">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.lift}
                    onChange={e => updateField('lift', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No of Bathrooms">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfBathrooms}
                    onChange={e => updateField('noOfBathrooms', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Configuration">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyConfiguration}
                    onChange={e => updateField('propertyConfiguration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Age of The property (Years)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ageOfProperty}
                    onChange={e => updateField('ageOfProperty', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Residual age of the Property (Years)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.residualAge}
                    onChange={e => updateField('residualAge', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Occupancy Status">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.occupancyStatus}
                    onChange={e => updateField('occupancyStatus', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="If Vacant then from how long">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.vacantDuration}
                    onChange={e => updateField('vacantDuration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="If Self Occupied then from how long">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.selfOccupiedDuration}
                    onChange={e => updateField('selfOccupiedDuration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="If Tenant then from how long">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.tenantDuration}
                    onChange={e => updateField('tenantDuration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Three-way Address Matrix */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Property Address Matrix</h3>
                <Field label="Property Address as per Initiation">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={form.propertyAddressInitiation}
                    onChange={e => updateField('propertyAddressInitiation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Address as per Site">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={form.propertyAddressSite}
                    onChange={e => updateField('propertyAddressSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Address as per Documents">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={form.propertyAddressDocs}
                    onChange={e => updateField('propertyAddressDocs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Field label="Pin Code">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.pinCode}
                    onChange={e => updateField('pinCode', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Approved Building Usage">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approvedBuildingUsage}
                    onChange={e => updateField('approvedBuildingUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="On site Building Usage">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.onSiteBuildingUsage}
                    onChange={e => updateField('onSiteBuildingUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Zoning as per Master plan">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.zoningMasterPlan}
                    onChange={e => updateField('zoningMasterPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Classification of land as per IGRS/Regnet, Patta etc.">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.landClassification}
                    onChange={e => updateField('landClassification', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="CRZ/ASI regulations If any">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.crzAsiRegulations}
                    onChange={e => updateField('crzAsiRegulations', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 3. Surroundings & Boundaries */}
          <div id="sec-surroundings">
            <Section title="Surroundings & Boundaries" number={3} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Distance from City Center">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.distanceCityCenter}
                    onChange={e => updateField('distanceCityCenter', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearest Railway Station">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearestRailwayStation}
                    onChange={e => updateField('nearestRailwayStation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearest Bus Stand">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearestBusStand}
                    onChange={e => updateField('nearestBusStand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearest Hospital">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearestHospital}
                    onChange={e => updateField('nearestHospital', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Width of Approach Road">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.widthOfApproachRoad}
                    onChange={e => updateField('widthOfApproachRoad', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearby Land Mark">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearbyLandmark}
                    onChange={e => updateField('nearbyLandmark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Locality">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.typeOfLocality}
                    onChange={e => updateField('typeOfLocality', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Occupancy ratio in Project / Location">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.occupancyRatio}
                    onChange={e => updateField('occupancyRatio', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Development of surrounding areas">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.developmentSurroundings}
                    onChange={e => updateField('developmentSurroundings', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Demolition Risk">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.demolitionRisk}
                    onChange={e => updateField('demolitionRisk', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot/ Property Demarcated at Site">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.plotDemarcatedAtSite}
                    onChange={e => updateField('plotDemarcatedAtSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property falls under Corporation / Municipality / Panchayat">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.municipalLimit}
                    onChange={e => updateField('municipalLimit', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="Property Identified through">
                <input
                  type="text"
                  className={inputCls}
                  value={form.propertyIdentifiedThrough}
                  onChange={e => updateField('propertyIdentifiedThrough', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* Schedule Boundaries Comparison Table */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Schedule Boundaries (Along with dimensions)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 w-32">Direction</th>
                        <th className="px-4 py-2.5">As per Site</th>
                        <th className="px-4 py-2.5">As per Site Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">North</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundNorthSite}
                            onChange={e => updateField('boundNorthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundNorthPlan}
                            onChange={e => updateField('boundNorthPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">South</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundSouthSite}
                            onChange={e => updateField('boundSouthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundSouthPlan}
                            onChange={e => updateField('boundSouthPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">East</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundEastSite}
                            onChange={e => updateField('boundEastSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundEastPlan}
                            onChange={e => updateField('boundEastPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">West</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundWestSite}
                            onChange={e => updateField('boundWestSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundWestPlan}
                            onChange={e => updateField('boundWestPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Field label="Whether Boundaries matching">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundariesMatching}
                      onChange={e => updateField('boundariesMatching', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Discrepancy found in Boundaries, if any please specify">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundariesDiscrepancy}
                      onChange={e => updateField('boundariesDiscrepancy', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* 4. Survey of Construction */}
          <div id="sec-construction">
            <Section title="Survey of Construction" number={4} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.typeOfConstruction}
                    onChange={e => updateField('typeOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Quality of The Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.qualityOfConstruction}
                    onChange={e => updateField('qualityOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Exteriors">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.exteriors}
                    onChange={e => updateField('exteriors', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Interiors">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.interiors}
                    onChange={e => updateField('interiors', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Amenities provided">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.amenitiesProvided}
                    onChange={e => updateField('amenitiesProvided', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Construction progress">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionProgress}
                    onChange={e => updateField('constructionProgress', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Completion Stage of construction in %">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.completionStagePct}
                    onChange={e => updateField('completionStagePct', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Recommended stage of construction in %">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.recommendedStagePct}
                    onChange={e => updateField('recommendedStagePct', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 5. Documents Verified */}
          <div id="sec-documents">
            <Section title="Documents Verified" number={5} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Approved Layout Plans Details">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approvedLayoutPlans}
                    onChange={e => updateField('approvedLayoutPlans', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Commencement Certificate">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.commencementCertificate}
                    onChange={e => updateField('commencementCertificate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="BU Permission Details">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.buPermissionDetails}
                    onChange={e => updateField('buPermissionDetails', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Approved Building Plans Details">
                  <textarea
                    rows={4}
                    className={inputCls}
                    value={form.approvedBuildingPlans}
                    onChange={e => updateField('approvedBuildingPlans', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="RERA No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reraNo}
                    onChange={e => updateField('reraNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="Ownership Proof (Multi-Deed Matrix)">
                <textarea
                  rows={8}
                  className={`${inputCls} font-mono text-xs leading-relaxed`}
                  value={form.ownershipProof}
                  onChange={e => updateField('ownershipProof', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Other documents (Land Conversion & Composite Plans)">
                <textarea
                  rows={6}
                  className={`${inputCls} font-mono text-xs leading-relaxed`}
                  value={form.otherDocuments}
                  onChange={e => updateField('otherDocuments', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 6. Area Details */}
          <div id="sec-area-details">
            <Section title="Area Details" number={6} defaultOpen={true}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 w-40">Item</th>
                      <th className="px-4 py-2.5">As per Site</th>
                      <th className="px-4 py-2.5">As per Plan</th>
                      <th className="px-4 py-2.5">As per Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Land</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.landAreaSite}
                          onChange={e => updateField('landAreaSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.landAreaPlan}
                          onChange={e => updateField('landAreaPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.landAreaDocs}
                          onChange={e => updateField('landAreaDocs', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Shed area</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.shedAreaSite}
                          onChange={e => updateField('shedAreaSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.shedAreaPlan}
                          onChange={e => updateField('shedAreaPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.shedAreaDocs}
                          onChange={e => updateField('shedAreaDocs', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">RCC area</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.rccAreaSite}
                          onChange={e => updateField('rccAreaSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.rccAreaPlan}
                          onChange={e => updateField('rccAreaPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.rccAreaDocs}
                          onChange={e => updateField('rccAreaDocs', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Field label="Violation Details if any">
                <input
                  type="text"
                  className={inputCls}
                  value={form.violationDetails}
                  onChange={e => updateField('violationDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 7. Valuation Details */}
          <div id="sec-valuation">
            <Section title="Valuation Details" number={7} defaultOpen={true}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 w-48">Item</th>
                      <th className="px-4 py-2.5 w-40">Area (Sq. ft.)</th>
                      <th className="px-4 py-2.5 w-40">Rate (Rs / Sq. ft.)</th>
                      <th className="px-4 py-2.5 text-right">Subtotal Value (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Land */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Land
                        <span className="block text-xs text-slate-500 font-normal">(including land development)</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valLandArea}
                          onChange={e => updateField('valLandArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valLandRate}
                          onChange={e => updateField('valLandRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹ {formatIndianCurrency(landValue)}
                      </td>
                    </tr>

                    {/* Construction-Shed */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Construction-Shed
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valShedArea}
                          onChange={e => updateField('valShedArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valShedRate}
                          onChange={e => updateField('valShedRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹ {formatIndianCurrency(shedValue)}
                      </td>
                    </tr>

                    {/* Construction-RCC */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Construction-RCC
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valRccArea}
                          onChange={e => updateField('valRccArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valRccRate}
                          onChange={e => updateField('valRccRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹ {formatIndianCurrency(rccValue)}
                      </td>
                    </tr>

                    {/* Other LS Cost */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Other LS cost if any
                      </td>
                      <td className="px-3 py-1.5 text-slate-400">—</td>
                      <td className="px-3 py-1.5 text-slate-400">—</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-mono font-bold`}
                          value={form.valOtherLs}
                          onChange={e => updateField('valOtherLs', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculated Exact Total</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    ₹ {formatIndianCurrency(exactTotal)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Sum of Land + Shed + RCC + LS Cost</p>
                </div>
                <Field label="Rounded Value / Say Total (Rs)">
                  <input
                    type="text"
                    className={`${inputCls} text-lg font-bold font-mono text-emerald-700 bg-emerald-50/30 border-emerald-300`}
                    value={form.valSayTotal}
                    onChange={e => updateField('valSayTotal', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                  <p className="text-xs text-slate-500 mt-1">Adopted as final Fair Market Value (FMV)</p>
                </Field>
              </div>
            </Section>
          </div>

          {/* 8. Government Value */}
          <div id="sec-govt-val">
            <Section title="Government Value" number={8} defaultOpen={true}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 w-64">Item</th>
                      <th className="px-4 py-2.5 w-40">Area</th>
                      <th className="px-4 py-2.5">Rate in Rs/unit</th>
                      <th className="px-4 py-2.5 w-48 text-right">Value (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Govt. Assessed Value (Land)</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtLandArea}
                          onChange={e => updateField('govtLandArea', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtLandRate}
                          onChange={e => updateField('govtLandRate', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-mono font-bold`}
                          value={form.govtLandVal}
                          onChange={e => updateField('govtLandVal', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Govt. Assessed Value (Construction)</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtConstArea}
                          onChange={e => updateField('govtConstArea', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtConstRate}
                          onChange={e => updateField('govtConstRate', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-mono`}
                          value={form.govtConstVal}
                          onChange={e => updateField('govtConstVal', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Field label="Total Govt. Assessed Value">
                <input
                  type="text"
                  className={`${inputCls} font-bold font-mono text-base`}
                  value={form.govtTotalVal}
                  onChange={e => updateField('govtTotalVal', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 9. Final Valuation & Insurance */}
          <div id="sec-final-val">
            <Section title="Final Valuation & Insurance" number={9} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FMV Card */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Total Fair Market Value (FMV)</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">100%</span>
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono">
                    ₹ {formatIndianCurrency(sayTotalNum)}
                  </div>
                  <p className="text-xs text-blue-800/80 font-medium italic">
                    {rupeesInWords(sayTotalNum)}
                  </p>
                </div>

                {/* Realizable Value Card */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Total Realizable Value</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">90% of FMV</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    ₹ {formatIndianCurrency(realizableValue)}
                  </div>
                  <p className="text-xs text-emerald-800/80 font-medium italic">
                    {rupeesInWords(realizableValue)}
                  </p>
                </div>

                {/* Distress Value Card */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Distress Value / Force Sale Value</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">80% of FMV</span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 font-mono">
                    ₹ {formatIndianCurrency(distressValue)}
                  </div>
                  <p className="text-xs text-amber-800/80 font-medium italic">
                    {rupeesInWords(distressValue)}
                  </p>
                </div>

                {/* Insurable Value Card */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Insurable Value of Building</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">Shed + RCC</span>
                  </div>
                  <div className="text-2xl font-black text-purple-950 font-mono">
                    ₹ {formatIndianCurrency(insurableValue)}
                  </div>
                  <p className="text-xs text-purple-800/80 font-medium italic">
                    {rupeesInWords(insurableValue)}
                  </p>
                </div>
              </div>
            </Section>
          </div>

          {/* 10. Remarks */}
          <div id="sec-remarks">
            <Section title="Remarks" number={10} defaultOpen={true}>
              <Field label="Remarks & Specific Clauses">
                <textarea
                  rows={14}
                  className={`${inputCls} text-xs leading-relaxed`}
                  value={form.remarks}
                  onChange={e => updateField('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 11. Declaration */}
          <div id="sec-declaration">
            <Section title="Declaration" number={11} defaultOpen={true}>
              <Field label="Declaration Clauses">
                <textarea
                  rows={12}
                  className={`${inputCls} text-xs leading-relaxed`}
                  value={form.declarations}
                  onChange={e => updateField('declarations', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Field label="Visited Person Name (Representative)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.visitedPersonName}
                    onChange={e => updateField('visitedPersonName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800">Authorized Signatory:</span>
                  <p>S. MOHANTY ASSOCIATES</p>
                  <p>Empanelled Valuer & Chartered Engineer</p>
                </div>
              </div>
            </Section>
          </div>

          {/* 12. Documents */}
          <div id="sec-documents-annexure">
            <BaseDocumentsSection
              title="Documents"
              sectionId="sec-documents-annexure"
              sectionNumber={12}
              documentImages={form.documentImages || []}
              documentImageNames={form.documentImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onUploadDocuments={handleDocUpload}
              onRemoveDocument={(idx: number) => {
                setForm((prev: any) => ({
                  ...prev,
                  documentImages: (prev.documentImages || []).filter((_: any, i: number) => i !== idx),
                  documentImageNames: (prev.documentImageNames || []).filter((_: any, i: number) => i !== idx),
                }));
              }}
              onDocumentNameChange={(idx: number, name: string) => {
                setForm((prev: any) => {
                  const arr = [...(prev.documentImageNames || [])];
                  while (arr.length <= idx) arr.push('');
                  arr[idx] = name;
                  return { ...prev, documentImageNames: arr };
                });
              }}
              onReorderDocuments={(newImgs: string[], newNames: string[]) => {
                setForm((prev: any) => ({
                  ...prev,
                  documentImages: newImgs,
                  documentImageNames: newNames,
                }));
              }}
            />
          </div>

          {/* 13. Maps */}
          <div id="sec-maps-annexure">
            <BaseMapsSection
              title="Maps"
              sectionId="sec-maps-annexure"
              sectionNumber={13}
              locationMapImages={form.locationMapImages || []}
              mouzaMapImages={form.mouzaMapImages || []}
              sketchMapImages={form.sketchMapImages || []}
              cadastralMapImages={form.cadastralMapImages || []}
              bdaMapImages={form.bdaMapImages || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onLocationMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('locationMapImages', e)}
              onLocationMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onMouzaMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('mouzaMapImages', e)}
              onMouzaMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onSketchMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('sketchMapImages', e)}
              onSketchMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onCadastralMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('cadastralMapImages', e)}
              onCadastralMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onBdaMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('bdaMapImages', e)}
              onBdaMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onReorderLocationMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, locationMapImages: newImgs }))}
              onReorderMouzaMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, mouzaMapImages: newImgs }))}
              onReorderSketchMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, sketchMapImages: newImgs }))}
              onReorderCadastralMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, cadastralMapImages: newImgs }))}
              onReorderBdaMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, bdaMapImages: newImgs }))}
            />
          </div>

          {/* 14. Photographs */}
          <div id="sec-photos-annexure">
            <BasePhotographsSection
              title="Photographs"
              sectionId="sec-photos-annexure"
              sectionNumber={14}
              propertyImages={form.propertyImages || []}
              propertyImageNames={form.propertyImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              bucketCount={bucketImages?.length || 0}
              onOpenBucketPicker={() => setShowBucketModal(true)}
              onUploadImages={handlePhotoUpload}
              onRemoveImage={(idx: number) => {
                setForm((prev: any) => ({
                  ...prev,
                  propertyImages: (prev.propertyImages || []).filter((_: any, i: number) => i !== idx),
                  propertyImageNames: (prev.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
                }));
              }}
              onImageNameChange={(idx: number, name: string) => {
                setForm((prev: any) => {
                  const arr = [...(prev.propertyImageNames || [])];
                  while (arr.length <= idx) arr.push('');
                  arr[idx] = name;
                  return { ...prev, propertyImageNames: arr };
                });
              }}
              onReorderImages={(newImgs: string[], newNames: string[]) => {
                setForm((prev: any) => ({
                  ...prev,
                  propertyImages: newImgs,
                  propertyImageNames: newNames,
                }));
              }}
            />
          </div>
        </div>

        {/* ── Right Sections Nav Panel ── */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* Action Bar */}
      <ReportActionBar
        autoSaveStatus={autoSaveStatus}
        userRole={userRole}
        message={message}
        loading={saving || previewing || !!uploading}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
        isReadOnly={isReadOnly}
      />

      {/* Cloud Storage Photo Picker Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const nextImgs = [...(form.propertyImages || []), ...selectedUrls];
            const nextNames = [...(form.propertyImageNames || [])];
            selectedUrls.forEach((_, i) => {
              nextNames.push(`Photograph ${(form.propertyImages?.length || 0) + i + 1}`);
            });
            setForm((prev: any) => ({
              ...prev,
              propertyImages: nextImgs,
              propertyImageNames: nextNames,
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
