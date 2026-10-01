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
    
  }
}
