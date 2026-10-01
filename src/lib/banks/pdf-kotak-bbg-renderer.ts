import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFKotakBbgRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    return this.fields[key] ?? defaultVal;
  }

  private stripHtml(html: string): string {
    return (html || '').replace(/<[^>]*>?/gm, '');
  }

  async drawContent(): Promise<void> {
    this.addPage();
    this.drawMainHeader('VALUATION REPORT');

    this.drawSectionHeader('1. GENERAL DETAILS');
    this.drawKeyValueRow([
      { label: 'Purpose of Valuation', value: this.getF('kotakBbgPurpose') },
      { label: 'Date of Valuation', value: this.getF('kotakBbgDateOfValuation') },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of the Valuer', value: this.getF('kotakBbgValuerName') },
      { label: 'Site Engineer Inspecting Property', value: this.getF('kotakBbgSiteEngineer') === 'Custom' ? this.getF('kotakBbgSiteEngineerCustom') : this.getF('kotakBbgSiteEngineer') },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Customer / Borrower', value: this.getF('kotakBbgBorrowerName') },
      { label: 'Name of Property Owner(s)', value: this.getF('kotakBbgOwnerSameAsBorrower') ? this.getF('kotakBbgBorrowerName') : this.getF('kotakBbgOwnerName') },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Technical Site Visit', value: this.getF('kotakBbgDateOfVisit') },
      { label: 'Person Met at Site & Contact Details', value: this.getF('kotakBbgPersonMetNA') ? 'NA' : this.getF('kotakBbgPersonMet') },
    ]);
    
    this.drawSectionHeader('2. DETAILS OF PROPERTY BEING APPRAISED');
    this.drawKeyValueRow([
      { label: 'Technical Address (as per site)', value: this.getF('kotakBbgTechnicalAddress'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Legal Address (as per documents)', value: this.getF('kotakBbgLegalAddress'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Google Coordinates', value: this.getF('kotakBbgGoogleCoordinatesNA') ? 'NA' : this.getF('kotakBbgGoogleCoordinates') },
      { label: 'Nature of Property', value: this.getF('kotakBbgNatureOfProperty') === 'Custom' ? this.getF('kotakBbgNatureOfPropertyCustom') : this.getF('kotakBbgNatureOfProperty') },
    ]);
    this.drawKeyValueRow([
      { label: 'Tenure of Property', value: this.getF('kotakBbgTenure') },
      { label: 'Lease Terms (if applicable)', value: this.getF('kotakBbgLeaseTermsNA') ? 'NA' : this.getF('kotakBbgLeaseTerms') },
    ]);
    this.drawKeyValueRow([
      { label: 'Transferability of Leasehold Rights', value: this.getF('kotakBbgTransferability') },
      { label: 'Occupancy Details', value: this.getF('kotakBbgOccupancy') === 'Custom' ? this.getF('kotakBbgOccupancyCustom') : this.getF('kotakBbgOccupancy') },
    ]);
    
    this.drawSectionHeader('3. SITE & SURROUNDING DETAILS');
    this.drawKeyValueRow([{ label: 'Property Boundaries Comparison', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
    this.drawKeyValueRow([
      { label: 'Direction', value: 'As Per Document', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2, bold: true, labelBold: true },
      { label: 'As Per Site', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0, bold: true, labelBold: true },
    ]);
    const b = this.getF('kotakBbgBoundariesTable') || {};
    this.drawKeyValueRow([
      { label: 'North', value: b.northDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.northSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'South', value: b.southDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.southSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'East', value: b.eastDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.eastSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'West', value: b.westDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.westSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Boundaries Matching Verification', value: this.getF('kotakBbgBoundariesMatching') },
      { label: 'Discrepancy in Boundaries', value: this.getF('kotakBbgBoundariesDiscrepancyNA') ? 'NA' : this.getF('kotakBbgBoundariesDiscrepancy') },
    ]);
    this.drawKeyValueRow([
      { label: 'Document Basis for Property Identification', value: this.getF('kotakBbgDocumentBasis') === 'Custom' ? this.getF('kotakBbgDocumentBasisCustom') : this.getF('kotakBbgDocumentBasis') },
      { label: 'Valuer Confirmation', value: this.getF('kotakBbgValuerConfirmation') ? 'Confirmed' : 'Not Confirmed' },
    ]);
    this.drawKeyValueRow([
      { label: 'Plot Demarcated at Site', value: this.getF('kotakBbgPlotDemarcated') ? 'Yes' : 'No' },
      { label: 'Locality Type, Condition & Classification', value: this.getF('kotakBbgLocalityTypeNA') ? 'NA' : this.getF('kotakBbgLocalityType') },
    ]);
    const surrList = Array.isArray(this.getF('kotakBbgSurroundingDev')) ? [...this.getF('kotakBbgSurroundingDev')] : [];
    if (this.getF('kotakBbgSurroundingDevCustomChecked') && this.getF('kotakBbgSurroundingDevCustom')) {
      surrList.push(this.getF('kotakBbgSurroundingDevCustom'));
    }
    const surr = surrList.join(', ');
    this.drawKeyValueRow([
      { label: 'Development of Surrounding Areas', value: surr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Access to Property', value: this.getF('kotakBbgAccessNA') ? 'NA' : this.getF('kotakBbgAccess') },
      { label: 'Approach Road Name & Condition', value: this.getF('kotakBbgApproachRoadNA') ? 'NA' : this.getF('kotakBbgApproachRoad') },
    ]);
    this.drawKeyValueRow([
      { label: 'Proximity to Civic Amenities', value: this.getF('kotakBbgProximityNA') ? 'NA' : this.getF('kotakBbgProximity'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('4. DETAILS OF APPROVALS & LEGAL VERIFICATION');
    this.drawKeyValueRow([
      { label: 'Non-Agricultural (N.A.) Conversion Status', value: this.getF('kotakBbgNaConversionStatusNA') ? 'NA' : this.getF('kotakBbgNaConversionStatus') },
      { label: 'Land Zoning / Restrictions', value: this.getF('kotakBbgLandZoningGPLimitNA') ? 'GP Limit / NA' : this.getF('kotakBbgLandZoning') },
    ]);
    this.drawKeyValueRow([
      { label: 'Approved Plan Details', value: this.getF('kotakBbgApprovedPlanDetails') === 'Custom' ? this.getF('kotakBbgApprovedPlanDetailsCustom') : this.getF('kotakBbgApprovedPlanDetails') },
      { label: 'Authority Granting Approval', value: this.getF('kotakBbgAuthorityApprovalNA') ? 'NA' : this.getF('kotakBbgAuthorityApproval') },
    ]);
    this.drawKeyValueRow([
      { label: 'Plans Approved by Competent Authority', value: this.getF('kotakBbgPlansApprovedByCompetentAuthority') },
      { label: 'Commencement Certificate / Building Permit Details', value: this.getF('kotakBbgCommencementCertificateNA') ? 'NA' : this.getF('kotakBbgCommencementCertificate') },
    ]);
    this.drawKeyValueRow([
      { label: 'Occupation / Completion Certificate', value: this.getF('kotakBbgOccupationCertificateNA') ? 'NA' : this.getF('kotakBbgOccupationCertificate') },
    ]);
    this.drawKeyValueRow([
      { label: 'Sale / Lease Deed Details', value: this.getF('kotakBbgSaleLeaseDeedDetails'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    const otherDocsList = Array.isArray(this.getF('kotakBbgOtherDocumentsPerused')) ? [...this.getF('kotakBbgOtherDocumentsPerused')] : [];
    if (this.getF('kotakBbgOtherDocumentsPerusedCustomChecked') && this.getF('kotakBbgOtherDocumentsPerusedCustom')) {
      otherDocsList.push(this.getF('kotakBbgOtherDocumentsPerusedCustom'));
    }
    const otherDocs = otherDocsList.join(', ');
    this.drawKeyValueRow([
      { label: 'Other Documents Perused', value: otherDocs, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('5. BUILDING / STRUCTURAL DETAILS');
    if (this.getF('kotakBbgNatureOfProperty') === 'Vacant Land' && !this.getF('kotakBbgSection5Override')) {
      this.drawKeyValueRow([{ label: 'This section is auto-disabled because Nature of Property is "Vacant Land".', value: '', labelWidth: CONTENT_W, valueWidth: 0 }]);
    } else {
      const roofingVal = this.getF('kotakBbgConstructionRoofingNA') ? 'NA' : (this.getF('kotakBbgConstructionRoofing') === 'Custom' ? this.getF('kotakBbgConstructionRoofingCustom') : this.getF('kotakBbgConstructionRoofing'));
      this.drawKeyValueRow([
        { label: 'Type of Construction & Roofing', value: roofingVal },
        { label: 'Year of Construction', value: this.getF('kotakBbgYearOfConstructionNA') ? 'NA' : this.getF('kotakBbgYearOfConstruction') },
      ]);
      this.drawKeyValueRow([
        { label: 'Stage of Construction (%)', value: this.getF('kotakBbgStageOfConstructionNA') ? 'NA' : this.getF('kotakBbgStageOfConstruction') },
        { label: 'Residual Structural Age', value: this.getF('kotakBbgResidualStructuralAge') },
      ]);
      const floorsVal = this.getF('kotakBbgNumberOfFloorsNA') ? 'NA' : (this.getF('kotakBbgNumberOfFloors') === 'Custom' ? this.getF('kotakBbgNumberOfFloorsCustom') : this.getF('kotakBbgNumberOfFloors'));
      this.drawKeyValueRow([
        { label: 'Number of Floors', value: floorsVal },
        { label: 'Quality of Construction', value: this.getF('kotakBbgQualityOfConstructionNA') ? 'NA' : this.getF('kotakBbgQualityOfConstruction') },
      ]);
      this.drawKeyValueRow([
        { label: 'Technical Details (Finishing & Interiors)', value: this.getF('kotakBbgTechnicalDetailsFinishingNA') ? 'NA' : this.getF('kotakBbgTechnicalDetailsFinishing'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);
      
      let am = 'NA';
      if (!this.getF('kotakBbgAmenitiesProvidedNA')) {
        const amList = Array.isArray(this.getF('kotakBbgAmenitiesProvided')) ? [...this.getF('kotakBbgAmenitiesProvided')] : [];
        if (this.getF('kotakBbgAmenitiesProvidedCustomChecked') && this.getF('kotakBbgAmenitiesProvidedCustom')) {
          amList.push(this.getF('kotakBbgAmenitiesProvidedCustom'));
        }
        am = amList.join(', ');
      }
      this.drawKeyValueRow([
        { label: 'Amenities Provided', value: am, labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);
      
      const usageVal = this.getF('kotakBbgUsageOfPropertyNA') ? 'NA' : (this.getF('kotakBbgUsageOfProperty') === 'Custom' ? this.getF('kotakBbgUsageOfPropertyCustom') : this.getF('kotakBbgUsageOfProperty'));
      this.drawKeyValueRow([
        { label: 'Usage of Property', value: usageVal, labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);
    }

    this.drawSectionHeader('6. DETAILS OF MEASUREMENTS');
    const landUnit = this.getF('kotakBbgLandAreaUnit') === 'Custom' ? this.getF('kotakBbgLandAreaUnitCustom') : this.getF('kotakBbgLandAreaUnit');
    const landArea = this.getF('kotakBbgLandAreaNA') ? 'NA' : `${this.getF('kotakBbgLandArea') || ''} ${landUnit || ''}`.trim();
    const secLandArea = this.getF('kotakBbgLandAreaNA') ? 'NA' : `${this.getF('kotakBbgLandAreaSecondary') || ''} ${this.getF('kotakBbgLandAreaSecondaryUnit') || ''}`.trim();
    
    this.drawKeyValueRow([
      { label: 'Land Area (Primary)', value: landArea },
      { label: 'Land Area (Secondary)', value: secLandArea },
    ]);
    const proofSource = this.getF('kotakBbgLandAreaProofSource') === 'Custom' ? this.getF('kotakBbgLandAreaProofSourceCustom') : this.getF('kotakBbgLandAreaProofSource');
    this.drawKeyValueRow([
      { label: 'Documentary Proof Source', value: proofSource, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    let buaText = 'NA';
    if (!this.getF('kotakBbgBuildingBuaNA')) {
      if (this.getF('kotakBbgBuildingBuaAnnexure')) {
        buaText = 'Details attached in Annexure-II';
      } else {
        const buaData = Array.isArray(this.getF('kotakBbgBuildingBuaTable')) ? this.getF('kotakBbgBuildingBuaTable') : [];
        if (buaData.length > 0) {
          buaText = buaData.map((row: any) => `Floor: ${row.floor || '-'}, Carpet: ${row.carpet || '-'}, Built-up: ${row.builtUp || '-'}, Super: ${row.superBuiltUp || '-'}`).join('\n');
        } else {
          buaText = '';
        }
      }
    }
    this.drawKeyValueRow([
      { label: 'Building Built-up Area (BUA)', value: buaText, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    if (!this.getF('kotakBbgBuildingBuaNA') && !this.getF('kotakBbgBuildingBuaAnnexure')) {
       this.drawKeyValueRow([
         { label: 'Total Built-up Area', value: this.getF('kotakBbgTotalBua'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
       ]);
    }
    
    const devs = this.getF('kotakBbgDeviationsNA') ? 'NA' : (this.getF('kotakBbgDeviations') === 'Custom' ? this.getF('kotakBbgDeviationsCustom') : this.getF('kotakBbgDeviations'));
    this.drawKeyValueRow([
      { label: 'Deviations / Violations', value: devs, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('7. VALUATION CALCULATIONS & RATE ANALYSIS');
    const meth = this.getF('kotakBbgValuationMethodology') === 'Custom' ? this.getF('kotakBbgValuationMethodologyCustom') : this.getF('kotakBbgValuationMethodology');
    this.drawKeyValueRow([
      { label: 'Valuation Methodology Adopted', value: meth, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Source of Rate Selection', value: this.getF('kotakBbgSourceOfRateSelection'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Comparables Relied Upon', value: this.getF('kotakBbgComparablesReliedNA') ? 'NA' : this.getF('kotakBbgComparablesRelied'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    let analysisStr = 'NA';
    if (!this.getF('kotakBbgAnalysisComparablesNA')) {
      const br = this.getF('kotakBbgBaseMarketRate');
      const dp = this.getF('kotakBbgDiscountPremium');
      const jn = this.getF('kotakBbgJustificationNarrative');
      analysisStr = `Base Rate: Rs ${br || '0'} | Adj: ${dp || '0'}%\nJustification: ${jn || '-'}`;
    }
    this.drawKeyValueRow([
      { label: 'Analysis of Comparables & Justification', value: analysisStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Adopted Land Rate (Rs / sq. ft.)', value: this.getF('kotakBbgAdoptedLandRate'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let bldgRateStr = 'NA';
    if (!this.getF('kotakBbgAdoptedBuildingRateNA')) {
      const bRates = Array.isArray(this.getF('kotakBbgAdoptedBuildingRateTable')) ? this.getF('kotakBbgAdoptedBuildingRateTable') : [];
      if (bRates.length > 0) {
        bldgRateStr = bRates.map((r: any) => `${r.floor || 'Unknown'}: Rs ${r.rate || '0'}`).join('\n');
      } else {
        bldgRateStr = 'No rates defined';
      }
    }
    this.drawKeyValueRow([
      { label: 'Adopted Building Rate(s) (Rs / sq. ft.)', value: bldgRateStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Valuation Calculations Breakdown', value: this.getF('kotakBbgValuationBreakdown'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Guideline / Circle Rate (Rs / sq. ft.)', value: this.getF('kotakBbgGuidelineRateNA') ? 'NA' : this.getF('kotakBbgGuidelineRate') },
      { label: 'Guideline Valuation', value: this.getF('kotakBbgGuidelineValuation') },
    ]);

    this.drawSectionHeader('8. VALUATION FINANCIAL SUMMARY');
    this.drawKeyValueRow([
      { label: 'Exact Fair Market Value (FMV)', value: this.getF('kotakBbgFmvExact') },
      { label: 'Rounded Fair Market Value (Say Value)', value: this.getF('kotakBbgFmvRounded') },
    ]);
    const rvPct = this.getF('kotakBbgRvPercent') !== undefined ? this.getF('kotakBbgRvPercent') : '90';
    const dvPct = this.getF('kotakBbgDvPercent') !== undefined ? this.getF('kotakBbgDvPercent') : '80';
    this.drawKeyValueRow([
      { label: `Realizable Value (RV) @ ${rvPct}%`, value: this.getF('kotakBbgRv') },
      { label: `Distress Value (DV) @ ${dvPct}%`, value: this.getF('kotakBbgDv') },
    ]);
    const isVacantLand = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    const isIvNA = this.getF('kotakBbgIvNA') !== undefined ? this.getF('kotakBbgIvNA') : isVacantLand;
    this.drawKeyValueRow([
      { label: 'Insurable Value (IV)', value: isIvNA ? 'NA' : this.getF('kotakBbgIv'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('9. REMARKS / KEY OBSERVATIONS');
    this.drawKeyValueRow([
      { label: 'Standard Disclaimers', value: this.getF('kotakBbgStandardDisclaimers') || "The valuer assumes no responsibility for legal title. The valuation is strictly for bank internal use based on current market trends and visible site conditions.", labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    let risksStr = 'NA';
    if (!this.getF('kotakBbgRiskFactorsNA')) {
      const rList = Array.isArray(this.getF('kotakBbgRiskFactors')) ? this.getF('kotakBbgRiskFactors') : [];
      const mapped = rList.map(r => r === 'Custom' ? this.getF('kotakBbgRiskFactorsCustom') : r).filter(Boolean);
      risksStr = mapped.length > 0 ? mapped.join(', ') : 'None selected';
    }
    this.drawKeyValueRow([
      { label: 'Key Risk Factors / Alerts', value: risksStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    const rec = this.getF('kotakBbgFinalRecommendation') === 'Custom' ? this.getF('kotakBbgFinalRecommendationCustom') : this.getF('kotakBbgFinalRecommendation');
    this.drawKeyValueRow([
      { label: 'Final Recommendation', value: rec, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Detailed Remarks & Additional Observations', value: this.getF('kotakBbgRemarksNA') ? 'NA' : this.getF('kotakBbgRemarks'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('10. VALUER DECLARATION & SIGNOFF');
    this.drawKeyValueRow([
      { label: 'Declaration Confirmed', value: this.getF('kotakBbgDeclarationConfirmed') ? 'Yes (Legally Bound)' : 'No', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Report Issue Date', value: this.getF('kotakBbgReportIssueDate') || new Date().toISOString().split('T')[0] },
      { label: 'Report Issue Place', value: this.getF('kotakBbgReportIssuePlace') === 'Custom' ? this.getF('kotakBbgReportIssuePlaceCustom') : (this.getF('kotakBbgReportIssuePlace') || 'Bhubaneswar') },
    ]);
    const defaultCredentials = "Name: Er. S. Mohanty\nQualifications: B.Tech (Civil), M.Tech (Structures), FIV\nIBBI Reg No: IBBI/RV/00/0000\nWealth Tax Reg No: CAT-I/000";
    this.drawKeyValueRow([
      { label: 'Valuer Credentials', value: this.getF('kotakBbgValuerCredentials') || defaultCredentials, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Signature Confirmed', value: this.getF('kotakBbgSignatureConfirmed') ? 'Yes (Verified)' : 'No', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
  }
}
