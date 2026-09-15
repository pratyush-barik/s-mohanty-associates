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
  hexToRgb 
} from '../pdf-bank-renderer';

export class PDFAxisFinanceRenderer extends PDFBankRenderer {
  private fields: any;
  private drawnCover = false;

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  override drawCenteredTitle(title: string) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.drawAxisCoverPage();
      // After drawing cover page, move to the next page for the standard sections
      this.addPage();
    }
    // Proceed to draw the actual title on the second page
    super.drawCenteredTitle(title);
  }

  override drawSectionHeader(title: string, opts?: { skipBreak?: boolean }) {
    super.drawSectionHeader(title, opts);
    if (title === 'BOUNDARIES, ACCESS & GEOLOCATION') {
      this.drawAxisBoundariesTable();
    }
  }

  private drawAxisBoundariesTable() {
    const fields = this.fields;
    const fv = (key: string) => (fields[key] || 'NA').toString();

    const rowHeight = FONT_SIZE * 1.5 + 4;
    const tableWidth = CONTENT_W;
    const colW = [
      tableWidth * 0.28,
      tableWidth * 0.18,
      tableWidth * 0.18,
      tableWidth * 0.18,
      tableWidth * 0.18
    ];

    const drawCell = (x: number, y: number, w: number, h: number, text: string, bgHex?: string, isBold = false) => {
      if (bgHex) {
        this.page.drawRectangle({
          x,
          y: this.pdfY(y + h),
          width: w,
          height: h,
          color: hexToRgb(bgHex),
          borderColor: rgb(1,1,1),
          borderWidth: 1
        });
      } else {
         this.page.drawRectangle({
          x,
          y: this.pdfY(y + h),
          width: w,
          height: h,
          borderColor: rgb(1,1,1),
          borderWidth: 1,
          color: hexToRgb('#222222') // dark grey like the image
        });
      }
      
      this.page.drawText(text, {
        x: x + 4,
        y: this.pdfY(y + h - 14),
        size: FONT_SIZE - 1,
        font: isBold ? this.fontBold : this.fontRegular,
        color: rgb(1,1,1)
      });
    };

    const drawRow = (texts: string[], isHeader = false) => {
      this.checkPageBreak(rowHeight);
      let curX = MARGIN_L;
      for (let i = 0; i < 5; i++) {
        drawCell(curX, this.cursorY, colW[i], rowHeight, texts[i], undefined, isHeader);
        curX += colW[i];
      }
      this.cursorY += rowHeight;
    };

    // The image has a dark background with white text
    drawRow(['Four Boundaries of the Property', 'East', 'West', 'North', 'South'], true);
    drawRow(['As Per saledeed', fv('eastAsPerDeed'), fv('westAsPerDeed'), fv('northAsPerDeed'), fv('southAsPerDeed')]);
    drawRow(['As per Sketch map', fv('eastAsPerPlan'), fv('westAsPerPlan'), fv('northAsPerPlan'), fv('southAsPerPlan')]);
    drawRow(['Actual as per Site', fv('eastAsPerSite'), fv('westAsPerSite'), fv('northAsPerSite'), fv('southAsPerSite')]);

    // Row 5: Width of abutting road
    this.checkPageBreak(rowHeight);
    drawCell(MARGIN_L, this.cursorY, colW[0], rowHeight, 'Width of the abutting Road', undefined, true);
    drawCell(MARGIN_L + colW[0], this.cursorY, colW[1] + colW[2], rowHeight, `Road 1 : ${fv('widthOfRoad1')}`);
    drawCell(MARGIN_L + colW[0] + colW[1] + colW[2], this.cursorY, colW[3] + colW[4], rowHeight, `Road 2 :${fv('widthOfRoad2')}`);
    this.cursorY += rowHeight;

    // Row 6: Geo Coordinates
    this.checkPageBreak(rowHeight);
    drawCell(MARGIN_L, this.cursorY, colW[0] + colW[1] + colW[2], rowHeight, `Latitude : ${fv('latitude')}`, undefined, true);
    drawCell(MARGIN_L + colW[0] + colW[1] + colW[2], this.cursorY, colW[3] + colW[4], rowHeight, `Longitude :${fv('longitude')}`, undefined, true);
    this.cursorY += rowHeight;
    this.cursorY += 8;
  }

  private drawAxisCoverPage() {
    const fields = this.fields;
    const fv = (key: string, defaultVal = '') => (fields as any)[key] as string || defaultVal;

    // Reset cursor for the cover page
    this.cursorY = 60;

    // Page 1 Border
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
      const tw = this.fontBold.widthOfTextAtSize(text, size);
      const startX = MARGIN_L + (CONTENT_W - tw) / 2;
      const startY = this.pdfY(this.cursorY);
      this.page.drawText(text, { x: startX, y: startY, size, font: this.fontBold, color: rgb(0,0,0) });
      if (underline) {
        this.page.drawLine({
          start: { x: startX, y: startY - 2 },
          end: { x: startX + tw, y: startY - 2 },
          thickness: 1,
          color: rgb(0,0,0)
        });
      }
      this.cursorY += ySpaceAfter;
    };

    drawCenteredBold('VALUATION OF IMMOVABLE PROPERTY', FONT_SIZE_TITLE + 3, 40, true);

    // Property Owners from dynamic array
    drawCenteredBold('PROPERTY OWNER', FONT_SIZE_HEADER, 16, true);
    const owners = Array.isArray(fields.propertyOwners) && fields.propertyOwners.length > 0
      ? fields.propertyOwners
      : [{ name: '', relationship: 'S/O', relativeName: '', fatherName: '' }];
    for (const owner of owners) {
      if (owner.name) {
        drawCenteredBold(owner.name, FONT_SIZE, 14);
        const rel = owner.relationship || 'S/O';
        const relName = owner.relativeName || owner.fatherName;
        if (relName) {
          drawCenteredBold(`${rel}- ${relName}`, FONT_SIZE, 14);
        }
      }
    }
    this.cursorY += 16;

    drawCenteredBold('ADDRESS OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('addressOfTheProperty'), FONT_SIZE, 40);

    drawCenteredBold('VALUE OF THE PROPERTY', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(`PRESENT MARKET VALUE: ${fv('presentMarketValue')}`, FONT_SIZE, 14);
    drawCenteredBold(`DISTRESS SALE VALUE: ${fv('distressSaleValue')}`, FONT_SIZE, 40);

    drawCenteredBold('PURPOSE OF VALUATION', FONT_SIZE_HEADER, 16, true);
    drawCenteredBold(fv('purposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY'), FONT_SIZE, 40);

    drawCenteredBold('PREPARED BY', FONT_SIZE_HEADER, 16, true);

    drawCenteredBold(fv('preparedByCompany', 'M/s. S MOHANTY ASSOCIATES'), FONT_SIZE, 14);
    drawCenteredBold(fv('preparedByDesignation', 'EMPANELLED VALUER & CHARTERED ENGINEER'), FONT_SIZE, 14);

    const plotNo = fv('preparedByPlotNo', 'Plot no-859/2494/3232 & 858/2493/3295');
    if (plotNo) drawCenteredBold(`${plotNo},`, FONT_SIZE, 14);

    const street = fv('preparedByStreet', 'Shiv Nagar Tankapani Road');
    if (street) drawCenteredBold(`${street},`, FONT_SIZE, 14);

    const cityStatePin = [
      fv('preparedByCity', 'Bhubaneswar'),
      fv('preparedByState', 'Odisha'),
      fv('preparedByPinCode', '751018') ? `Pin-${fv('preparedByPinCode', '751018')}` : ''
    ].filter(Boolean).join(', ');
    if (cityStatePin) drawCenteredBold(cityStatePin, FONT_SIZE, 14);

    drawCenteredBold(`PHONE- ${fv('preparedByPhone', '06742381145')}`, FONT_SIZE, 14);

    let rawMobile = fv('preparedByMobile', '9937023855/9437074855');
    let processedMobile = rawMobile.replace(/[^0-9]+/g, '/').replace(/(^\/|\/$)/g, '');
    drawCenteredBold(`MOBILE-${processedMobile}`, FONT_SIZE, 0);
  }
}
