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
      { label: 'Site Engineer Inspecting Property', value: this.getF('kotakBbgSiteEngineer') },
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
      { label: 'Google Coordinates', value: this.getF('kotakBbgGoogleCoordinates') },
      { label: 'Nature of Property', value: this.getF('kotakBbgNatureOfProperty') },
    ]);
    this.drawKeyValueRow([
      { label: 'Tenure of Property', value: this.getF('kotakBbgTenure') },
      { label: 'Lease Terms (if applicable)', value: this.getF('kotakBbgLeaseTermsNA') ? 'NA' : this.getF('kotakBbgLeaseTerms') },
    ]);
    this.drawKeyValueRow([
      { label: 'Transferability of Leasehold Rights', value: this.getF('kotakBbgTransferability') },
      { label: 'Occupancy Details', value: this.getF('kotakBbgOccupancy') },
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
      { label: 'Document Basis for Property Identification', value: this.getF('kotakBbgDocumentBasis') },
      { label: 'Valuer Confirmation', value: this.getF('kotakBbgValuerConfirmation') ? 'Confirmed' : 'Not Confirmed' },
    ]);
    this.drawKeyValueRow([
      { label: 'Plot Demarcated at Site', value: this.getF('kotakBbgPlotDemarcated') ? 'Yes' : 'No' },
      { label: 'Locality Type, Condition & Classification', value: this.getF('kotakBbgLocalityType') },
    ]);
    const surr = Array.isArray(this.getF('kotakBbgSurroundingDev')) ? this.getF('kotakBbgSurroundingDev').join(', ') : '';
    this.drawKeyValueRow([
      { label: 'Development of Surrounding Areas', value: surr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Access to Property', value: this.getF('kotakBbgAccess') },
      { label: 'Approach Road Name & Condition', value: this.getF('kotakBbgApproachRoad') },
    ]);
    this.drawKeyValueRow([
      { label: 'Proximity to Civic Amenities', value: this.getF('kotakBbgProximity'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

  }
}
