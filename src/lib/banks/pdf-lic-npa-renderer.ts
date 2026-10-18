import {
  PDFBankRenderer,
  MARGIN_L,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  VAL_BG,
  hexToRgb,
  fetchBytes,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';

export interface LICNPAReportFields {
  loanAccountNo?: string;
  borrowerName?: string;
  propertyAddress?: string;

  // BUA Breakdown
  approvedBuaGf?: string;
  approvedBuaFf?: string;
  approvedBuaSf?: string;
  approvedBuaTotal?: string;

  measuredBuaGf?: string;
  measuredBuaFf?: string;
  measuredBuaSf?: string;
  measuredBuaTotal?: string;

  // Questions
  isPropertyComplete?: string;
  propertyCompleteDetails?: string;
  isWellMaintainedAndStructurallySound?: string;

  // Valuation
  landArea?: string;
  landUnitRate?: string;
  landTotalValue?: string;

  buildingArea?: string;
  buildingUnitRate?: string;
  buildingTotalValue?: string;

  totalMarketValue?: string;
  realizableValuePct?: string;
  realizableValue?: string;
  distressValuePct?: string;
  distressValue?: string;
  marketability?: string;
  otherImportantInfo?: string;

  visitDate?: string;
  reportDate?: string;
  valuerName?: string;
  valuerSignaturePlace?: string;

  // Enclosures
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImages?: string[];
  locationMapImage?: string;
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  bdaMapImages?: string[];
  documentImages?: any[];
  documentImageNames?: string[];

  [key: string]: any;
}

export class PDFLICNPARenderer extends PDFBankRenderer {
  private reportFields: LICNPAReportFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // ── Page 1: Main Inspection & Valuation Form ──
    this.drawMainInspectionForm();

    // ── Page 2: Property Photographs & Mandatory Note ──
    await this.drawPhotographsPage();

    // ── Enclosures: Device-Uploaded Maps & Documents ──
    await this.drawEnclosures();

    return await this.save();
  }

  private drawMainInspectionForm(): void {
    const d = this.reportFields;
    this.cursorY = 20;

    // Header Titles
    this.drawCenteredReportTitle('LIC HOUSING FINANCE LIMITED', FONT_SIZE_TITLE, true);
    this.cursorY += 4;
    this.drawCenteredReportTitle('PROPERTY INSPECTION REPORT(Default Cases)', FONT_SIZE_HEADER, true, true);
    this.cursorY += 16;

    const wLabel = 180;
    const wVal = CONTENT_W - wLabel;

    // Row 1: Loan Account No.
    this.draw2ColRow(wLabel, 'Loan Account No.', d.loanAccountNo || 'NA', true);

    // Row 2: Name of the borrower/s
    this.draw2ColRow(wLabel, 'Name of the borrower/s', d.borrowerName || 'NA');

    // Row 3: Property Address
    this.draw2ColRow(wLabel, 'Property Address', d.propertyAddress || 'NA');

    // Row 4: Carpet/Built-up area of the flat/house
    this.drawBuaBreakdownRow(wLabel);

    // Row 5: Is the property complete in all respect?
    const completeAnswer = d.isPropertyComplete || 'Yes';
    const completeFull = d.propertyCompleteDetails ? `${completeAnswer}\n${d.propertyCompleteDetails}` : completeAnswer;
    this.draw2ColRow(wLabel, 'Is the property complete in all respect?\nIf not, provide details.', completeFull);

    // Row 6: Is the flat/house well maintained? Is it structurally sound?
    this.draw2ColRow(wLabel, 'Is the flat/house well maintained?\nIs it structurally sound?', d.isWellMaintainedAndStructurallySound || 'Yes');

    // Row 7: Value of property (Sub-table header + rows)
    this.drawValueGrid();

    // Row 8: Marketability
    this.draw2ColRow(wLabel, 'Marketability of the property', d.marketability || 'Good/Fair/Poor');

    // Row 9: Any other information
    this.draw2ColRow(wLabel, 'Any other information which is important and\nmaterial for the case', d.otherImportantInfo || 'NA');

    this.cursorY += 24;

    // Certification statement
    const visitDate = d.visitDate || d.reportDate || '';
    const certText = `I hereby certify that I have visited the above site on dated ${visitDate} personally and have verified details given above.`;
    const cLines = this.wrapText(certText, CONTENT_W, FONT_SIZE);
    for (const l of cLines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE });
      this.cursorY += 14;
    }

    this.cursorY += 40;

    // Valuer signature
    const sigLine = '...................................................';
    const sigSub = '(Signature of the Valuer)';
    const valuer = d.valuerName || '(Er. Satyajit Mohanty)';
    const sigW = this.fontRegular.widthOfTextAtSize(sigLine, FONT_SIZE);
    const sigX = MARGIN_L + CONTENT_W - sigW - 20;

    this.drawTextAt(sigLine, sigX, this.cursorY, { fontSize: FONT_SIZE });
    this.cursorY += 14;
    const subW = this.fontRegular.widthOfTextAtSize(sigSub, FONT_SIZE_CAPTION);
    this.drawTextAt(sigSub, sigX + (sigW - subW) / 2, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 12;
    const vW = this.fontBold.widthOfTextAtSize(valuer, FONT_SIZE_CAPTION);
    this.drawTextAt(valuer, sigX + (sigW - vW) / 2, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
  }

  private drawBuaBreakdownRow(wLabel: number): void {
    const d = this.reportFields;
    const wVal = CONTENT_W - wLabel;

    const approvedLines = [
      'Approved BUA',
      d.approvedBuaGf ? `GF =${d.approvedBuaGf}` : '',
      d.approvedBuaFf ? `FF =${d.approvedBuaFf}` : '',
      d.approvedBuaSf ? `SF =${d.approvedBuaSf}` : '',
      d.approvedBuaTotal ? `Total-${d.approvedBuaTotal}` : '',
    ].filter(Boolean);

    const measuredLines = [
      'Measured BUA',
      d.measuredBuaGf ? `GF =${d.measuredBuaGf}` : '',
      d.measuredBuaFf ? `FF =${d.measuredBuaFf}` : '',
      d.measuredBuaSf ? `SF =${d.measuredBuaSf}` : '',
      d.measuredBuaTotal ? `Total-${d.measuredBuaTotal}` : '',
    ].filter(Boolean);

    const allValLines = [...approvedLines, '', ...measuredLines].filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''));
    const rowH = Math.max(50, allValLines.length * 13 + 10);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, 'Carpet/Built-up area of the flat/house', {
      fontSize: FONT_SIZE_CAPTION,
      fillColor: LBL_BG,
    });

    const valText = allValLines.join('\n');
    this.drawCell(MARGIN_L + wLabel, this.cursorY, wVal, rowH, valText, {
      fontSize: FONT_SIZE_CAPTION,
    });
    this.cursorY += rowH;
  }

  private drawValueGrid(): void {
    const d = this.reportFields;
    const wLabel = 180;
    const wValArea = 100;
    const wValRate = 95;
    const wValTotal = CONTENT_W - wLabel - wValArea - wValRate;

    // Header row
    const hdrH = 20;
    this.drawCell(MARGIN_L, this.cursorY, wLabel, hdrH, 'Value of property:-', { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, wValArea, hdrH, 'Area', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLabel + wValArea, this.cursorY, wValRate, hdrH, 'Unit rate', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLabel + wValArea + wValRate, this.cursorY, wValTotal, hdrH, 'Total in Rs.', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += hdrH;

    // Land row
    const rowH = 18;
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, 'Land:', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, wValArea, rowH, d.landArea || '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel + wValArea, this.cursorY, wValRate, rowH, d.landUnitRate || '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel + wValArea + wValRate, this.cursorY, wValTotal, rowH, d.landTotalValue || '', { align: 'right', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Building row
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, 'Building (Approved) G+1', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, wValArea, rowH, d.buildingArea || '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel + wValArea, this.cursorY, wValRate, rowH, d.buildingUnitRate || '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel + wValArea + wValRate, this.cursorY, wValTotal, rowH, d.buildingTotalValue || '', { align: 'right', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Total value (Market value)
    const wSpan = wLabel + wValArea + wValRate;
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, 'Total value (Market value)', { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, CONTENT_W - wLabel, rowH, d.totalMarketValue || '', { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Realizable value
    const rPct = d.realizableValuePct || '90';
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, `Realizable value of the property (${rPct}%)`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, CONTENT_W - wLabel, rowH, d.realizableValue || '', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Distress value
    const dPct = d.distressValuePct || '80';
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, `Distress value of the property (${dPct}%)`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, CONTENT_W - wLabel, rowH, d.distressValue || '', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private draw2ColRow(wLabel: number, label: string, val: string, isBoldVal = false): void {
    const wVal = CONTENT_W - wLabel;
    const lLines = this.wrapText(label, wLabel - 8, FONT_SIZE_CAPTION);
    const vLines = this.wrapText(val, wVal - 8, FONT_SIZE_CAPTION);
    const maxLines = Math.max(lLines.length, vLines.length);
    const rowH = Math.max(18, maxLines * 12 + 6);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, label, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, wVal, rowH, val, { bold: isBoldVal, fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private async drawPhotographsPage(): Promise<void> {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    this.drawUnderlinedTextAt('Property Photograph', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_HEADER });
    this.cursorY += 24;

    const photos = d.propertyImages || [];
    if (photos.length > 0) {
      const pW = 260;
      const pH = 240;
      const x = MARGIN_L + (CONTENT_W - pW) / 2;

      await this.drawImageSafely(photos[0], x, this.cursorY, pW, pH);
      this.cursorY += pH + 24;
    } else {
      this.cursorY += 120;
    }

    // Prominent Note
    const notePrefix = 'Note:- ';
    const noteBody = 'We have referred previous valuation report copy for land & approved built-up area.';
    this.drawUnderlinedTextAt(notePrefix, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    const preW = this.fontBold.widthOfTextAtSize(notePrefix, FONT_SIZE);
    this.drawTextAt(noteBody, MARGIN_L + preW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 20;

    // If there are more photos, render them cleanly
    if (photos.length > 1) {
      const remaining = photos.slice(1);
      const names = (d.propertyImageNames || []).slice(1);
      const imgW = (CONTENT_W - 20) / 2;
      const imgH = 150;

      for (let i = 0; i < remaining.length; i += 2) {
        this.checkPageBreak(imgH + 26);
        await this.drawImageSafely(remaining[i], MARGIN_L, this.cursorY, imgW, imgH);
        this.drawTextAt(names[i] || `Photo ${i + 2}`, MARGIN_L, this.cursorY + imgH + 8, { fontSize: FONT_SIZE_CAPTION });

        if (i + 1 < remaining.length) {
          await this.drawImageSafely(remaining[i + 1], MARGIN_L + imgW + 20, this.cursorY, imgW, imgH);
          this.drawTextAt(names[i + 1] || `Photo ${i + 3}`, MARGIN_L + imgW + 20, this.cursorY + imgH + 8, { fontSize: FONT_SIZE_CAPTION });
        }
        this.cursorY += imgH + 24;
      }
    }
  }

  private async drawEnclosures(): Promise<void> {
    const d = this.reportFields;

    const mapList = [
      { title: 'LAYOUT / LOCATION MAP', imgs: d.locationMapImages || (d.locationMapImage ? [d.locationMapImage] : []) },
      { title: 'MOUZA MAP', imgs: d.mouzaMapImages },
      { title: 'SKETCH MAP', imgs: d.sketchMapImages },
      { title: 'CADASTRAL / BHU NAKSHA MAP', imgs: d.cadastralMapImages },
      { title: 'APPROVED BUILDING PLAN', imgs: d.bdaMapImages },
    ];

    for (const m of mapList) {
      if (m.imgs && m.imgs.length > 0) {
        this.addPage();
        this.cursorY = 20;
        this.drawCenteredReportTitle(m.title, FONT_SIZE_HEADER, true);
        this.cursorY += 16;
        for (const imgUrl of m.imgs) {
          this.checkPageBreak(320);
          await this.drawImageSafely(imgUrl, MARGIN_L, this.cursorY, CONTENT_W, 300);
          this.cursorY += 315;
        }
      }
    }

    if (d.documentImages && d.documentImages.length > 0) {
      for (let i = 0; i < d.documentImages.length; i++) {
        const url = d.documentImages[i];
        const label = (d.documentImageNames && d.documentImageNames[i]) || `DOCUMENT ATTACHMENT ${i + 1}`;
        if (url) {
          this.addPage();
          this.cursorY = 20;
          this.drawCenteredReportTitle(label, FONT_SIZE_HEADER, true);
          this.cursorY += 16;
          await this.drawImageSafely(url, MARGIN_L, this.cursorY, CONTENT_W, 600);
          this.cursorY += 610;
        }
      }
    }
  }

  private async drawImageSafely(url: string, x: number, y: number, w: number, h: number): Promise<void> {
    try {
      if (!url) return;
      const bytes = await fetchBytes(url);
      if (!bytes || bytes.length === 0) return;
      const img = await this.embedImgSafe(bytes);
      if (img) {
        this.page.drawImage(img, {
          x,
          y: this.pdfY(y) - h,
          width: w,
          height: h,
        });
      }
    } catch (e) {
      console.warn('Could not embed image:', url, e);
    }
  }

  private drawUnderlinedTextAt(text: string, x: number, y: number, options: { bold?: boolean; fontSize?: number }): void {
    const size = options.fontSize || FONT_SIZE;
    const font = options.bold ? this.fontBold : this.fontRegular;
    const tw = font.widthOfTextAtSize(text, size);
    this.drawTextAt(text, x, y, options);
    const lineY = this.pdfY(y) - 2;
    this.page.drawLine({
      start: { x, y: lineY },
      end: { x: x + tw, y: lineY },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });
  }

  private drawCenteredReportTitle(text: string, size = FONT_SIZE, isBold = true, isUnderline = false): void {
    const font = isBold ? this.fontBold : this.fontRegular;
    const tw = font.widthOfTextAtSize(text, size);
    const x = MARGIN_L + (CONTENT_W - tw) / 2;
    this.drawTextAt(text, x, this.cursorY, { bold: isBold, fontSize: size });
    if (isUnderline) {
      const y = this.pdfY(this.cursorY) - 2;
      this.page.drawLine({
        start: { x, y },
        end: { x: x + tw, y },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
    }
    this.cursorY += size + 4;
  }
}
