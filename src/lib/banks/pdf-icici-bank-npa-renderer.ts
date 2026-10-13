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
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFIciciBankNpaRenderer extends PDFBankRenderer {
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
    // ── Title ────────────────────────────────────────────────────────
    this.cursorY += 5;
    this.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE, false);
    this.drawCenteredTitle('FOR ICICI BANK LIMITED (NPA)', FONT_SIZE_TITLE, true);
    this.cursorY += 35;

    // ── Ref & Date ───────────────────────────────────────────────────
    const refNo = this.getF('icicinpaRefNo') || this.projectCode || 'NA';
    const dateRaw = this.getF('icicinpaDate') || '';
    let formattedDate = '';
    if (dateRaw) {
      const m = dateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      formattedDate = m ? `${m[3]}-${m[2]}-${m[1]}` : dateRaw;
    }

    const refText = `REPORT REF: ${refNo}`;
    const dateText = formattedDate ? `DATE OF REPORT: ${formattedDate}` : 'DATE OF REPORT:';

    this.page.drawText(refText, {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY),
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const dateW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE_HEADER);
    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - dateW,
      y: this.pdfY(this.cursorY),
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 35;

    // ── SECTION 1: VALUATION OF IMMOVABLE PROPERTY ───────────────────
    this.drawSectionHeader('1. VALUATION OF IMMOVABLE PROPERTY', false);
    this.drawSectionHeader('General Information', false);

    // Property Owner (prefill from Customer Name, Section 2)
    const propertyOwner = this.getF('icicinpaPropOwner') || this.getF('icicinpaCustomerName') || 'NA';
    this.drawKeyValueRow([{ label: 'PROPERTY OWNER', value: propertyOwner, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Address of Property (prefill from Property Address, Section 3)
    const propAddress = this.getF('icicinpaPropAddress') || this.getF('icicinpaPropertyAddress') || 'NA';
    this.drawKeyValueRow([{ label: 'ADDRESS OF THE PROPERTY', value: propAddress, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Present Market Value (prefill from Round Off Total, Section 9)
    const pmv = this.getF('icicinpaPresentMarketValue') || this.getF('icicinpaRoundOffTotal') || 'NA';
    this.drawKeyValueRow([{ label: 'PRESENT MARKET VALUE', value: pmv, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Distress Sale Value (prefill from Section 7)
    const distress = this.getF('icicinpaDistressSaleValue') || this.getF('icicinpaDistressValue') || 'NA';
    this.drawKeyValueRow([{ label: 'DISTRESS SALE VALUE', value: distress, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Realizable Value (prefill from Section 7)
    const realize = this.getF('icicinpaRealizableValue') || this.getF('icicinpaRealizeValue') || 'NA';
    this.drawKeyValueRow([{ label: 'REALIZABLE VALUE', value: realize, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Purpose of Valuation
    this.drawKeyValueRow([{ label: 'PURPOSE OF VALUATION', value: this.getF('icicinpaPurposeOfValuation') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    // Prepared By (prefill from valuer profile)
    const preparedBy = this.getF('icicinpaPreparedBy') || this.getF('valuerName') || 'NA';
    this.drawKeyValueRow([{ label: 'PREPARED BY', value: preparedBy, labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    this.cursorY += 10;

    // ── SECTION 2: INDIVIDUAL TECHNICAL REPORT ───────────────────────
    this.drawSectionHeader('2. INDIVIDUAL TECHNICAL REPORT', false);
    this.drawSectionHeader('Request Details', false);

    this.drawKeyValueRow([{ label: 'Request ID', value: this.getF('icicinpaRequestId') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Customer Name', value: this.getF('icicinpaCustomerName') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const channelName = this.getF('icicinpaChannelName') === 'Custom' ? this.getF('icicinpaChannelNameCustom') : this.getF('icicinpaChannelName');
    this.drawKeyValueRow([{ label: 'Channel Name', value: channelName || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const reportType = this.getF('icicinpaReportType') === 'Custom' ? this.getF('icicinpaReportTypeCustom') : this.getF('icicinpaReportType');
    this.drawKeyValueRow([{ label: 'Report Type', value: reportType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const productType = this.getF('icicinpaProductType') === 'Custom' ? this.getF('icicinpaProductTypeCustom') : this.getF('icicinpaProductType');
    this.drawKeyValueRow([{ label: 'Product Type', value: productType || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    this.drawKeyValueRow([{ label: 'Application No', value: this.getF('icicinpaApplicationNo') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const businessGroup = this.getF('icicinpaBusinessGroup') === 'Custom' ? this.getF('icicinpaBusinessGroupCustom') : this.getF('icicinpaBusinessGroup');
    this.drawKeyValueRow([{ label: 'Business Group', value: businessGroup || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);
    const productName = this.getF('icicinpaProductName') === 'Custom' ? this.getF('icicinpaProductNameCustom') : this.getF('icicinpaProductName');
    this.drawKeyValueRow([{ label: 'Product Name', value: productName || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 }]);

    this.cursorY += 10;

    // ── (Additional sections will be added here as prompts are provided) ──

  }
}
