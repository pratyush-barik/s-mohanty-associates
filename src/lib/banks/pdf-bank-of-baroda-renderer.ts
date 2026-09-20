/**
 * pdf-bank-of-baroda-renderer.ts — Dedicated PDF renderer for Bank of Baroda.
 *
 * Mirrors Axis SBB's architecture: overrides drawCenteredTitle() to inject
 * a custom cover page into the standard BankReportBuilder pipeline.
 *
 * Section 1 (Cover Page): Double-border cover page with Property Owners, Address,
 * Value of Property, Purpose of Valuation, and Prepared By details.
 */

import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_L,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  hexToRgb,
  LINE_HEIGHT
} from '../pdf-bank-renderer';

export class PDFBankOfBarodaRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  /**
   * Override drawCenteredTitle to intercept the first call from BankReportBuilder
   * and draw the BOB cover page before the standard pipeline continues.
   */
  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.drawBobCoverPage();
      return;
    }

    // Override the generic "Valuation Report" title
    const isValuationReport = title.trim().toLowerCase() === 'valuation report';
    const finalTitle = isValuationReport
      ? 'VALUATION REPORT FOR BANK OF BARODA'
      : title;

    super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    // Intercept standard section 2
    if (title.toUpperCase() === 'CASE DETAILS & REPORT METADATA') {
      if (this.doc.getPages().length === 1) {
        this.newPage();
      }

      super.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE, false);
      super.drawCenteredTitle('FOR BANK OF BARODA', FONT_SIZE_TITLE, true);
      this.cursorY += 15;
    }

    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
  }

  private drawBobCoverPage() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = '') => String((fields as any)[key] ?? defaultVal).replace(/[\t\n\r]+/g, ' ');

    // Reset cursor for the cover page
    this.cursorY = 60;

    // Page 1 Border (double border)
    const bmx = 30;
    const bmyTop = 105;
    const bmyBot = 85;
    const borderColorHex = hexToRgb('#4a6078');

    // Outer thick border
    this.page.drawRectangle({
      x: bmx,
      y: bmyBot,
      width: PAGE_W - 2 * bmx,
      height: PAGE_H - bmyBot - bmyTop,
      borderColor: borderColorHex,
      borderWidth: 2.5,
    });
    // Inner thin border
    this.page.drawRectangle({
      x: bmx + 3,
      y: bmyBot + 3,
      width: PAGE_W - 2 * bmx - 6,
      height: PAGE_H - bmyBot - bmyTop - 6,
      borderColor: borderColorHex,
      borderWidth: 0.75,
    });

    const drawCenteredBold = (text: string, size: number, ySpaceAfter: number, underline: boolean = false) => {
      const cleanText = this.sanitizeText(text);
      const maxWidth = PAGE_W - 2 * bmx - 140;
      const lines = this.wrapText(cleanText, maxWidth, size, true);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const tw = this.fontBold.widthOfTextAtSize(line, size);
        const startX = MARGIN_L + (CONTENT_W - tw) / 2;
        const startY = this.pdfY(this.cursorY);
        this.page.drawText(line, { x: startX, y: startY, size, font: this.fontBold, color: rgb(0, 0, 0) });
        if (underline && i === lines.length - 1) {
          this.page.drawLine({
            start: { x: startX, y: startY - 2 },
            end: { x: startX + tw, y: startY - 2 },
            thickness: 1,
            color: rgb(0, 0, 0)
          });
        }
        if (i < lines.length - 1) {
          this.cursorY += size + 4;
        } else {
          this.cursorY += ySpaceAfter;
        }
      }
    };

    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', FONT_SIZE_TITLE + 3, 40, true);

    // Property Owners from dynamic array
    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.bobPropertyOwners) && fields.bobPropertyOwners.length > 0
      ? fields.bobPropertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '', fatherName: '' }];
    const validOwners = owners.filter((o: any) => o.name);
    if (validOwners.length > 0) {
      const ownerStrings = validOwners.map((owner: any) => {
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName || owner.fatherName;
        if (relName) {
          return `${owner.name} ${rel} ${relName}`;
        }
        return owner.name;
      });

      let ownersText = '';
      if (ownerStrings.length === 1) {
        ownersText = ownerStrings[0];
      } else if (ownerStrings.length === 2) {
        ownersText = ownerStrings.join(' & ');
      } else {
        const last = ownerStrings.pop();
        ownersText = ownerStrings.join(', ') + ' & ' + last;
      }

      drawCenteredBold(ownersText, FONT_SIZE, 14);
    }
    this.cursorY += 16;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('bobAddressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    let pmv = fv('bobPresentMarketValue', '');
    let dsv = fv('bobDistressSaleValue', '');
    let rv = fv('bobRealizableValue', '');

    // Format values with Rs prefix and Indian locale
    const formatVal = (valStr: string) => {
      if (!valStr || isNaN(Number(valStr))) return '0.00';
      return Number(valStr).toFixed(2);
    };

    pmv = formatVal(pmv);
    dsv = formatVal(dsv);
    rv = formatVal(rv);

    drawCenteredBold(`PRESENT MARKET VALUE:- ${pmv}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE:- ${dsv}`, FONT_SIZE, 14);
    drawCenteredBold(`REALIZABLE VALUE:- ${rv}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('bobPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);

    drawCenteredBold(fv('bobPreparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('bobPreparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const plotNo = fv('bobPreparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo) drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = fv('bobPreparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street) drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      fv('bobPreparedByCity', 'Bhubaneswar'),
      fv('bobPreparedByState', 'Odisha'),
      fv('bobPreparedByPinCode', '751018') ? `Pin-${fv('bobPreparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    drawCenteredBold(`PHONE- ${fv('bobPreparedByPhone', '06742381145')}`, FONT_SIZE, 14);

    let rawMobile = fv('bobPreparedByMobile', '9937023855/9437074855');
    let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
    drawCenteredBold(`MOBILE-${processedMobile}`, FONT_SIZE, 0);
  }
}
