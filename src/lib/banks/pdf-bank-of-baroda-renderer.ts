import { rgb } from 'pdf-lib';
import { PDFBankRenderer } from '../pdf-bank-renderer';

export class PDFBankOfBarodaRenderer extends PDFBankRenderer {
  constructor(fields: any, reportId: string, projectCode: string) {
    super(fields, reportId, projectCode);
    this.DEFAULT_FONT_SIZE = 11;
  }

  public async generate(): Promise<Uint8Array> {
    await this.init();

    // Reset pagination
    this.pageNumber = 1;
    this.drawHeader();
    this.drawFooter();

    // 1. Cover Page
    this.drawCoverPage();
    this.addNewPage();

    return this.pdfDoc.save();
  }

  private drawCoverPage() {
    const fields = this.fields as any;
    const fv = (key: string, def = '') => fields[key] || def;

    // Outer double border
    this.page.drawRectangle({
      x: this.margin - 10,
      y: this.margin - 10,
      width: this.pageWidth - 2 * this.margin + 20,
      height: this.pageHeight - 2 * this.margin + 20,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    this.page.drawRectangle({
      x: this.margin - 7,
      y: this.margin - 7,
      width: this.pageWidth - 2 * this.margin + 14,
      height: this.pageHeight - 2 * this.margin + 14,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    const FONT_SIZE_TITLE = 16;
    const FONT_SIZE_HEADER = 14;
    const FONT_SIZE = 12;

    const drawCenteredBold = (text: string, size: number, yOffset: number, underline = false) => {
      this.advanceCursor(yOffset);
      const textW = this.helveticaBold.widthOfTextAtSize(text, size);
      this.page.drawText(text, {
        x: (this.pageWidth - textW) / 2,
        y: this.cursorY,
        font: this.helveticaBold,
        size,
        color: rgb(0, 0, 0),
      });
      if (underline) {
        this.page.drawLine({
          start: { x: (this.pageWidth - textW) / 2, y: this.cursorY - 2 },
          end: { x: (this.pageWidth + textW) / 2, y: this.cursorY - 2 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    };

    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', FONT_SIZE_TITLE + 3, 40, true);

    // Property Owners
    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.bobPropertyOwners) && fields.bobPropertyOwners.length > 0
      ? fields.bobPropertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '' }];

    let isFirstOwner = true;
    for (const owner of owners) {
      if (!isFirstOwner) {
        drawCenteredBold('AND', FONT_SIZE - 2, 14, false);
      }
      isFirstOwner = false;
      const ownerStr = `${owner.name || ''} ${owner.relationship || ''} ${owner.relativeName || owner.fatherName || ''}`.trim();
      if (ownerStr) {
        drawCenteredBold(ownerStr, FONT_SIZE, 14);
      }
    }

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    this.advanceCursor(16);
    const address = fv('bobAddressOfTheProperty', '');
    const addrLines = this.wrapText(address, this.CONTENT_W, FONT_SIZE);
    addrLines.forEach((line) => {
      const textW = this.helveticaBold.widthOfTextAtSize(line, FONT_SIZE);
      this.page.drawText(line, {
        x: (this.pageWidth - textW) / 2,
        y: this.cursorY,
        font: this.helveticaBold,
        size: FONT_SIZE,
        color: rgb(0, 0, 0),
      });
      this.advanceCursor(14);
    });

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);

    const formatVal = (valStr: string) => {
      if (!valStr || isNaN(Number(valStr))) return '0';
      return 'Rs ' + Number(valStr).toLocaleString('en-IN') + '/-';
    };

    const presentVal = formatVal(fv('bobPresentMarketValue', '0'));
    const distressVal = formatVal(fv('bobDistressSaleValue', '0'));
    const realizableVal = formatVal(fv('bobRealizableValue', '0'));

    drawCenteredBold(`PRESENT MARKET VALUE:- ${presentVal}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE:- ${distressVal}`, FONT_SIZE, 14);
    drawCenteredBold(`REALIZABLE VALUE:- ${realizableVal}`, FONT_SIZE, 14);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('bobPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);

    drawCenteredBold(fv('bobPreparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('bobPreparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const prepAddress = [
      fv('bobPreparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295'),
      fv('bobPreparedByStreet', 'Shiv Nagar Tankapani Road'),
      `${fv('bobPreparedByCity', 'Bhubaneswar')}, ${fv('bobPreparedByState', 'Odisha')} - ${fv('bobPreparedByPinCode', '751018')}`
    ].filter(Boolean);

    prepAddress.forEach(line => drawCenteredBold(line, FONT_SIZE, 14));

    const phoneStr = [
      fv('bobPreparedByPhone', '06742381145'),
      fv('bobPreparedByMobile', '9937023855/9437074855')
    ].filter(Boolean).join(' , ');

    if (phoneStr) {
      drawCenteredBold(`Ph : ${phoneStr}`, FONT_SIZE, 14);
    }
  }
}

export async function generateBankOfBarodaReport(fields: any, reportId: string, projectCode: string): Promise<Uint8Array> {
  const renderer = new PDFBankOfBarodaRenderer(fields, reportId, projectCode);
  return await renderer.generate();
}
