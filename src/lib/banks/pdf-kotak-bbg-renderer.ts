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

  }
}
