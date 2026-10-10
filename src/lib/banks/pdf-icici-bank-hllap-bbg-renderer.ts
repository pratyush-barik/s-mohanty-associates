import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFIciciBankHlLapBbgRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts;
    this.projectCode = opts.projectCode;
  }

  private getF(key: string): any {
    return this.fields[key];
  }

  async drawContent(): Promise<void> {
    // Draw Title
    this.page.drawRectangle({
      x: MARGIN_L, y: this.pdfY(this.cursorY) - 25, width: CONTENT_W, height: 25,
      color: rgb(1, 1, 1), borderColor: rgb(0,0,0), borderWidth: BORDER_W
    });
    this.page.drawText('VALUATION REPORT FOR ICICI BANK LIMITED', {
      x: MARGIN_L + CONTENT_W / 2 - 140, y: this.pdfY(this.cursorY) - 17,
      size: FONT_SIZE_HEADER + 1, font: this.fontBold, color: rgb(0,0,0)
    });
    this.cursorY += 25;

    // SECTION 1
    this.drawSectionHeader('1 CUSTOMER DETAILS');
    
    this.drawKeyValueRow([
      { label: 'Ref No', value: this.getF('iciciBbgRefNo') || 'NA' },
      { label: 'Date', value: this.getF('iciciBbgDate') || 'NA' }
    ]);
    
    this.drawKeyValueRow([
      { label: 'Format for Resale / LAP / Builder (if non APF) / Balance Transfer/ Land Loan', value: this.getF('iciciBbgFormat') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.drawKeyValueRow([
      { label: 'Customer Name', value: this.getF('iciciBbgCustomerName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    this.drawKeyValueRow([
      { label: 'Application Number', value: this.getF('iciciBbgAppNo') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    
    this.drawKeyValueRow([
      { label: 'DMA/ Nodal Point', value: this.getF('iciciBbgDmaNodal') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);

    const caseType = this.getF('iciciBbgCaseType') === 'Custom' ? this.getF('iciciBbgCaseTypeCustom') : this.getF('iciciBbgCaseType');
    this.drawKeyValueRow([
      { label: 'Case Type', value: caseType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    
    this.cursorY += 10;

    // SECTION 2
    this.drawSectionHeader('2 PROPERTY DETAILS');
    this.drawKeyValueRow([
      { label: 'Address of Property', value: this.getF('iciciBbgAddressOfProperty') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    const legalAddr = this.getF('iciciBbgLegalAddressSame') ? this.getF('iciciBbgAddressOfProperty') : this.getF('iciciBbgLegalAddress');
    this.drawKeyValueRow([
      { label: 'Legal Address (Survey No. / FP No. / Khasra No./ Plot No)', value: legalAddr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.drawKeyValueRow([
      { label: 'Nearby landmark', value: this.getF('iciciBbgNearbyLandmark') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }
    ]);
    this.cursorY += 10;
  }
}
