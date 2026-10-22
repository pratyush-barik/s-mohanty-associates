/**
 * pdf-dcb-desktop-renderer.ts
 *
 * Dedicated PDF renderer for DCB Bank Limited — Desktop Valuation Format
 * ("POST DISBURSAL VALUATION REPORT").
 * Extends PDFBankRenderer to inherit base letterhead, typography, and drawing primitives.
 */

import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_TITLE,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import { rgb } from 'pdf-lib';

export interface DCBDesktopFields {
  // Top Headers
  refNo?: string;
  reportDate?: string;
  valuationDate?: string;

  // Table Particulars
  customerName?: string;
  propertyOwnerName?: string;
  valuationInitiatedBy?: string;
  loanReferenceNumber?: string;
  propertyAddress?: string;

  // Land / BUA
  landAreaDesc?: string; // e.g. "AC.0.020Decs, 871sqft"
  landAreaSqft?: string;
  landRate?: string;
  landTotalValue?: string;

  buaAreaSqft?: string;
  buaRate?: string;
  buaTotalValue?: string;

  typeOfProperty?: string; // Independent House, Flat, Office, Shop, Plot

  // Age & Life
  ageOfProperty?: string;
  estimatedFutureLife?: string;

  // Valuation Figures
  fairMarketValue?: string;
  realisablePercentage?: string; // default 80% or 85%
  realisableValue?: string;
  distressPercentage?: string; // default 75%
  distressValue?: string;

  // Remarks & Declaration
  remarks?: string;
  declarationPoint1?: string;
  declarationPoint2?: string;
  declarationPoint3?: string;

  // Sign-off Footer
  place?: string;
  versionDate?: string;
  authorizedSignatoryTitle?: string;

  // Attachments
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  propertyImages?: string[];
  propertyImageNames?: string[];
  projectCode?: string;

  [key: string]: any;
}

export class PDFDcbDesktopRenderer extends PDFBankRenderer {
  private dcb: DCBDesktopFields;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.dcb = fields || {};
    if (projectCode && !this.dcb.projectCode) {
      this.dcb.projectCode = projectCode;
    }
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  async generateAndDownload(fileName: string): Promise<void> {
    const pdfBytes = await this.render();
    if (typeof window !== 'undefined') {
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  private draw2Col(label: string, value: string, boldVal = false, highlight = false, customLabelW = 210) {
    const valW = CONTENT_W - customLabelW;
    this.drawKeyValueRow([
      {
        label,
        value: value || 'NA',
        labelWidth: customLabelW,
        valueWidth: valW,
        labelBold: true,
        bold: boldVal,
        highlight,
      },
    ]);
  }

  private async drawContent(): Promise<void> {
    // Top Date (Right Aligned)
    const topDateStr = `Date: ${this.dcb.reportDate || '25/07/2026'}`;
    const tw = this.fontBold.widthOfTextAtSize(topDateStr, FONT_SIZE);
    const startY = this.pdfY(this.cursorY);
    this.page.drawText(topDateStr, {
      x: MARGIN_L + CONTENT_W - tw,
      y: startY - FONT_SIZE,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.advanceCursor(20);

    // Title: POST DISBURSAL VALUATION REPORT
    this.drawCenteredTitle('POST DISBURSAL VALUATION REPORT', 13, false);
    this.advanceCursor(12);

    // Calculations
    const landSqft = parseFloat(String(this.dcb.landAreaSqft || '871').replace(/,/g, '')) || 871;
    const landRate = parseFloat(String(this.dcb.landRate || '150').replace(/,/g, '')) || 150;
    const computedLandVal = landSqft * landRate;

    const buaSqft = parseFloat(String(this.dcb.buaAreaSqft || '1560').replace(/,/g, '')) || 1560;
    const buaRate = parseFloat(String(this.dcb.buaRate || '1000').replace(/,/g, '')) || 1000;
    const computedBuaVal = buaSqft * buaRate;

    const computedTotalVal = computedLandVal + computedBuaVal;
    const realisablePct = parseFloat(String(this.dcb.realisablePercentage || '80').replace(/%/g, '')) / 100 || 0.8;
    const distressPct = parseFloat(String(this.dcb.distressPercentage || '75').replace(/%/g, '')) / 100 || 0.75;

    const computedRealisableVal = Math.round(computedTotalVal * realisablePct);
    const computedDistressVal = Math.round(computedTotalVal * distressPct);

    const refNoStr = `Ref. No.: ${this.dcb.refNo || ''}`;
    const datedStr = `Dated:${this.dcb.reportDate || ''}`;
    const labelW = 210;

    // Row 1: Ref. No. | Dated
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: refNoStr, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: datedStr, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // Rows 2 - 7: Customer & Property Info
    this.draw2Col('Name of the Customer', this.dcb.customerName || 'NA', true, false, labelW);
    this.draw2Col('Property owner name', this.dcb.propertyOwnerName || 'NA', true, false, labelW);
    this.draw2Col('Date of Valuation', this.dcb.valuationDate || this.dcb.reportDate || 'NA', false, false, labelW);
    this.draw2Col('Valuation Initiated by', this.dcb.valuationInitiatedBy || 'DCB Bank Limited', false, false, labelW);
    this.draw2Col('Loan Reference Number', this.dcb.loanReferenceNumber || 'NA', true, false, labelW);
    this.draw2Col(
      'Property Address being valued',
      this.dcb.propertyAddress || 'NA',
      false,
      false,
      labelW
    );

    // Row 8: Land Area / Built Up Area
    const landAreaDisplay = this.dcb.landAreaDesc || (landSqft > 0 ? `${formatIndianCurrency(landSqft)} sqft` : 'NA');
    this.draw2Col('Land Area/Built Up Area', landAreaDisplay, false, false, labelW);

    // Row 9: Type of Property
    const propTypeDisplay = this.dcb.typeOfProperty || 'Independent House';
    this.draw2Col('Type of Property', propTypeDisplay, true, false, labelW);

    // Row 10: Market Rate for Similar Property in Nearby Area
    const marketRateText =
      `Land Value-${formatIndianCurrency(landSqft)}sqft @ Rs.${formatIndianCurrency(landRate)}/- = Rs.${formatIndianCurrency(computedLandVal)}/-\n` +
      `Building value-${formatIndianCurrency(buaSqft)}sqft @ Rs.${formatIndianCurrency(buaRate)}/- = Rs.${formatIndianCurrency(computedBuaVal)}/-`;
    this.draw2Col('Market Rate for Similar Property in the Near by Area', marketRateText, false, false, labelW);

    // Rows 11 - 12: Age & Life
    this.draw2Col('Age of the Property', this.dcb.ageOfProperty || 'NA', false, false, labelW);
    this.draw2Col('Estimate Future life', this.dcb.estimatedFutureLife || 'NA', false, false, labelW);

    // Rows 13 - 15: Values
    const fmvFormula = `Rs.${formatIndianCurrency(computedLandVal)}/- + Rs.${formatIndianCurrency(computedBuaVal)}/- = Rs.${formatIndianCurrency(computedTotalVal)}/-`;
    this.draw2Col('FAIR MARKET VALUE OF SUBJECT PROPERTY', fmvFormula, true, true, labelW);

    const realisableLabel = `REALISABLE VALUE(${(realisablePct * 100).toFixed(0)}%)`;
    this.draw2Col(realisableLabel, `Rs.${formatIndianCurrency(computedRealisableVal)}/-`, true, false, labelW);

    const distressLabel = `DISTRESSS VALUE(${(distressPct * 100).toFixed(0)}%)`;
    this.draw2Col(distressLabel, `Rs.${formatIndianCurrency(computedDistressVal)}/-`, true, false, labelW);

    // Row 16: Remarks
    const remarksContent =
      this.dcb.remarks ||
      'We are releasing desk top valuation on request of “DCB Bank” for the said property Without visiting the property. Property value is arrived on the basis of our experience, expertise & local market feedback. This is existing collateral with DCB Bank.';
    this.draw2Col('REMARKS:-', remarksContent, false, false, labelW);

    // Row 17: Declaration
    this.draw2Col('DECLARATION', 'We hereby Declare That:', true, false, labelW);
    const decl1 = this.dcb.declarationPoint1 || 'Property Has been Valued on the basis of Market Information.';
    const decl2 = this.dcb.declarationPoint2 || 'We have no Direct or Indirect Interest in the Property Valued.';
    const decl3 = this.dcb.declarationPoint3 || (this.dcb.valuationDate || this.dcb.reportDate ? `We Have Conducted Inspection of the Property on ${this.dcb.valuationDate || this.dcb.reportDate}` : 'We Have Conducted Inspection of the Property.');

    this.draw2Col('', decl1, false, false, labelW);
    this.draw2Col('', decl2, false, false, labelW);
    this.draw2Col('', decl3, false, false, labelW);

    this.advanceCursor(20);
    this.checkPageBreak(80);

    // Bottom Footer / Sign-off Block
    const footerY = this.pdfY(this.cursorY);
    const placeStr = `Place: ${this.dcb.place || 'Bhubaneswar'}`;
    const dateFooterStr = `Date: ${this.dcb.reportDate || ''}`;
    const dcbBankLtdStr = 'DCB Bank Ltd';
    const custFooterStr = `Customer Name: ${this.dcb.customerName || ''}`;

    // Left Sign-off
    this.page.drawText(placeStr, {
      x: MARGIN_L,
      y: footerY - FONT_SIZE,
      size: FONT_SIZE - 0.5,
      font: this.fontRegular,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(dateFooterStr, {
      x: MARGIN_L,
      y: footerY - (FONT_SIZE * 2.2),
      size: FONT_SIZE - 0.5,
      font: this.fontRegular,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(dcbBankLtdStr, {
      x: MARGIN_L,
      y: footerY - (FONT_SIZE * 4.0),
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(custFooterStr, {
      x: MARGIN_L,
      y: footerY - (FONT_SIZE * 5.4),
      size: FONT_SIZE - 0.5,
      font: this.fontRegular,
      color: rgb(0, 0, 0),
    });

    // Right Sign-off
    const right1 = 'For M/s S MOHANTY ASSOCIATES';
    const twR1 = this.fontBold.widthOfTextAtSize(right1, FONT_SIZE);
    this.page.drawText(right1, {
      x: MARGIN_L + CONTENT_W - twR1,
      y: footerY - FONT_SIZE,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    const right2 = `Version1.0dated-${this.dcb.versionDate || this.dcb.reportDate || ''}`;
    const twR2 = this.fontRegular.widthOfTextAtSize(right2, FONT_SIZE - 1);
    this.page.drawText(right2, {
      x: MARGIN_L + CONTENT_W - twR2,
      y: footerY - (FONT_SIZE * 4.0),
      size: FONT_SIZE - 1,
      font: this.fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    const right3 = `Ref No: ${this.dcb.refNo || ''}`;
    const twR3 = this.fontRegular.widthOfTextAtSize(right3, FONT_SIZE - 1);
    this.page.drawText(right3, {
      x: MARGIN_L + CONTENT_W - twR3,
      y: footerY - (FONT_SIZE * 5.4),
      size: FONT_SIZE - 1,
      font: this.fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    this.advanceCursor(80);

    // Attachments (Documents, Maps, Photos if available)
    await this.drawAttachmentPages();
  }

  private async drawAttachmentPages(): Promise<void> {
    // 1. Documents
    const docs = this.dcb.documentImages || [];
    const docNames = this.dcb.documentImageNames || [];
    if (docs.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ANNEXURE: VERIFIED PROPERTY DOCUMENTS');
      for (let i = 0; i < docs.length; i++) {
        const bytes = await fetchBytes(docs[i]);
        if (bytes) {
          await this.drawImageSection(bytes, docNames[i] || `Document ${i + 1}`, 220);
        }
      }
    }

    // 2. Maps
    const maps = this.dcb.locationMapImages || [];
    if (maps.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ANNEXURE: LOCATION & MASTER PLAN MAPS');
      for (let i = 0; i < maps.length; i++) {
        const bytes = await fetchBytes(maps[i]);
        if (bytes) {
          await this.drawImageSection(bytes, `Site Location Map ${i + 1}`, 240);
        }
      }
    }

    // 3. Photographs
    const photos = this.dcb.propertyImages || [];
    const photoNames = this.dcb.propertyImageNames || [];
    if (photos.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ANNEXURE: PROPERTY PHOTOGRAPHS (ACTUAL SITE INSPECTION)');
      const photoObjects: { bytes: Uint8Array; label?: string }[] = [];
      for (let i = 0; i < photos.length; i++) {
        const bytes = await fetchBytes(photos[i]);
        if (bytes) {
          photoObjects.push({
            bytes,
            label: photoNames[i] || `Photo ${i + 1}`,
          });
        }
      }
      if (photoObjects.length > 0) {
        await this.drawPhotoGrid(photoObjects, 'Property Photographs', 180, false);
      }
    }
  }
}

export default PDFDcbDesktopRenderer;
