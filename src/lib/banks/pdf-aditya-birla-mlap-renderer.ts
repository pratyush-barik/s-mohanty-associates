/**
 * PDFAdityaBirlaMLAPRenderer — Dedicated PDF renderer for Aditya Birla Capital Ltd (MLAP).
 * Matches the official Excel-to-PDF template structure.
 */

import { PDFDocument, PDFPage, PDFFont, PDFEmbeddedPage, StandardFonts, rgb } from 'pdf-lib';
import { formatIndianCurrency } from '../numberToWords';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const PAGE_W = 595.28;   // A4 width
const PAGE_H = 841.89;   // A4 height
const MARGIN_T = 108;    // Top margin (matches letterhead header)
const MARGIN_B = 80;     // Bottom margin (matches letterhead footer)
const MARGIN_L = 36;     // Left margin (compact for wide tables)
const MARGIN_R = 36;     // Right margin
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 523.28pt

const FONT_SIZE = 9;
const FONT_SIZE_HEADER = 10;
const FONT_SIZE_TITLE = 11;
const LINE_HEIGHT = 1.25;
const BORDER_W = 0.5;

const BG_HEADER_DARK = '#1C2833';   // Dark header for main title
const BG_SECTION_HEADER = '#2C3E50'; // Section header
const BG_SUB_HEADER = '#D6EAF8';     // Light blue table header
const BG_YELLOW = '#FEF9E7';         // Soft yellow for valuation cells
const BG_ALT_ROW = '#F8F9F9';        // Alternating row background

export interface MLAPReportFields {
  // Basic Details
  clientName?: string;
  ownerName?: string;
  initiationDate?: string;
  dateOfInspection?: string;
  dateOfValuation?: string;
  loanApplicationNo?: string;
  caseReferenceNumber?: string;
  propertyOwnerName?: string;

  // Location Details
  propertyAddressAsDocs?: string;
  propertyAddressAsVisit?: string;
  addressMatching?: string;
  latitude?: string;
  longitude?: string;
  mainLocality?: string;
  subLocality?: string;
  localityType?: string;
  landmark?: string;
  localityOccupancy?: string;
  populationDensity?: string;
  distanceFromBranch?: string;
  distanceFromCityCenter?: string;
  distanceBusStop?: string;
  distanceRailwayStation?: string;
  amenitiesAvailability?: string;
  approachRoadWidth?: string;
  valuedBefore?: string;
  valuedBeforeDate?: string;
  landLocked?: string;
  otherEncumbranceFeatures?: string;

  // Property Detailings
  occupiedBy?: string;
  occupantName?: string;
  occupantRelation?: string;
  plotDemarcated?: string;
  propertyIdentification?: string;
  propertyType?: string;
  propertySubType?: string;
  propertyHolding?: string;
  propertyJurisdiction?: string;
  marketability?: string;
  ageOfPropertyActual?: string;
  estimatedFutureLife?: string;
  qualityOfConstruction?: string;
  structureType?: string;
  dimensionWidth?: string;
  dimensionDepth?: string;
  cautiousLocations?: string;
  flatConfigurationType?: string;
  percentageCompletion?: string;
  percentageRecommendation?: string;

  // Documentation
  documentsProvided?: string;
  sanctionPlanDetails?: string;
  utilityBills?: string;

  // Accommodation Table
  accommodationRows?: {
    floor: string;
    drawingRoom: string;
    bedroom: string;
    diningRoom: string;
    kitchen: string;
    bathroom: string;
    balcony: string;
  }[];

  // Build Up Details Table
  buaRows?: {
    floor: string;
    asPerSite: string;
    asPerPlan: string;
    percentageDeviation: string;
  }[];

  // Valuation Table
  plotAreaDocs?: string;
  plotAreaPhysical?: string;
  plotAreaConsidered?: string;
  landRate?: string;
  landTotalValue?: string;
  buaPlan?: string;
  buaActual?: string;
  buaActualRate?: string;
  buaActualTotalValue?: string;
  buaConsidered?: string;
  buaConsideredRate?: string;
  buaConsideredTotalValue?: string;
  superBua?: string;
  amenitiesValue?: string;
  totalPropertyValuation?: string;
  realizableValue?: string;
  distressValue?: string;

  // Boundary Details Table
  boundarySketchNorth?: string;
  boundarySketchSouth?: string;
  boundarySketchEast?: string;
  boundarySketchWest?: string;
  boundaryMouzaNorth?: string;
  boundaryMouzaSouth?: string;
  boundaryMouzaEast?: string;
  boundaryMouzaWest?: string;
  boundaryActualNorth?: string;
  boundaryActualSouth?: string;
  boundaryActualEast?: string;
  boundaryActualWest?: string;
  boundariesMatching?: string;

  // Remarks & Signature
  remarks?: string;
  engineerVisitedName?: string;
  representativeName?: string;

  // Photos & Maps
  locationMapImage?: string;
  propertyImages?: string[];
  propertyImageNames?: string[];
  sketchMapImages?: string[];
  mouzaMapImage?: string;
  cadastralMapImage?: string;

  [key: string]: any;
}

export class PDFAdityaBirlaMLAPRenderer {
  private doc!: PDFDocument;
  private page!: PDFPage;
  private fontRegular!: PDFFont;
  private fontBold!: PDFFont;
  private fontItalic!: PDFFont;
  private letterheadForm: PDFEmbeddedPage | null = null;
  private cursorY = 0;

  async init(letterheadBytes?: Uint8Array): Promise<void> {
    this.doc = await PDFDocument.create();
    this.fontRegular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.fontItalic = await this.doc.embedFont(StandardFonts.HelveticaOblique);

    if (letterheadBytes && letterheadBytes.length > 0) {
      try {
        const tmpDoc = await PDFDocument.create();
        let tmpImg = null;
        try { tmpImg = await tmpDoc.embedPng(letterheadBytes); } catch { /* ignore */ }
        if (!tmpImg) {
          try { tmpImg = await tmpDoc.embedJpg(letterheadBytes); } catch { /* ignore */ }
        }
        if (tmpImg) {
          const tmpPage = tmpDoc.addPage([PAGE_W, PAGE_H]);
          tmpPage.drawImage(tmpImg, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
          const tmpBytes = await tmpDoc.save();
          [this.letterheadForm] = await this.doc.embedPdf(tmpBytes, [0]);
        }
      } catch {
        this.letterheadForm = null;
      }
    }

    this.addPage();
  }

  private addPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.cursorY = 0;

    if (this.letterheadForm) {
      this.page.drawPage(this.letterheadForm, {
        x: 0, y: 0, width: PAGE_W, height: PAGE_H,
      });
    }
  }

  private get availableHeight(): number {
    return PAGE_H - MARGIN_T - MARGIN_B - this.cursorY;
  }

  private pdfY(topDown: number): number {
    return PAGE_H - MARGIN_T - topDown;
  }

  checkPageBreak(neededHeight: number): void {
    if (this.availableHeight < neededHeight) {
      this.addPage();
    }
  }

  advanceCursor(pts: number): void {
    this.cursorY += pts;
  }

  private sanitize(text: any): string {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[^\x20-\x7E\u20B9]/g, '')
      .trim();
  }

  private wrapText(text: string, maxWidth: number, fontSize: number, bold = false): string[] {
    const clean = this.sanitize(text);
    if (!clean) return [''];
    const font = bold ? this.fontBold : this.fontRegular;
    const words = clean.split(/\s+/);
    const lines: string[] = [];
    let cur = '';

    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  /** Render Title Banner */
  drawMainHeader(title: string): void {
    this.checkPageBreak(24);
    const h = 20;
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - h,
      width: CONTENT_W,
      height: h,
      color: hexToRgb(BG_HEADER_DARK),
    });

    const font = this.fontBold;
    const text = this.sanitize(title);
    const tw = font.widthOfTextAtSize(text, FONT_SIZE_TITLE);
    this.page.drawText(text, {
      x: MARGIN_L + (CONTENT_W - tw) / 2,
      y: y - h + 5.5,
      size: FONT_SIZE_TITLE,
      font,
      color: rgb(1, 1, 1),
    });

    this.cursorY += h;
  }

  /** Render Section Header Bar */
  drawSectionHeader(title: string): void {
    this.checkPageBreak(18);
    const h = 16;
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - h,
      width: CONTENT_W,
      height: h,
      color: hexToRgb(BG_SUB_HEADER),
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    const font = this.fontBold;
    const text = this.sanitize(title).toUpperCase();
    const tw = font.widthOfTextAtSize(text, FONT_SIZE_HEADER);
    this.page.drawText(text, {
      x: MARGIN_L + (CONTENT_W - tw) / 2,
      y: y - h + 4.5,
      size: FONT_SIZE_HEADER,
      font,
      color: hexToRgb(BG_SECTION_HEADER),
    });

    this.cursorY += h;
  }

  /** Draw a 2-column or 4-column key-value row */
  drawKeyValueRow(cols: { label: string; value: string; labelWidth: number; valueWidth: number; highlight?: boolean }[]): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    // Calculate max height
    let maxLines = 1;
    const colWrapped: { labelLines: string[]; valueLines: string[] }[] = [];

    for (const c of cols) {
      const lLines = this.wrapText(c.label, c.labelWidth - pad * 2, fontSize, true);
      const vLines = this.wrapText(c.value, c.valueWidth - pad * 2, fontSize, false);
      maxLines = Math.max(maxLines, lLines.length, vLines.length);
      colWrapped.push({ labelLines: lLines, valueLines: vLines });
    }

    const rowH = Math.max(16, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const cw = colWrapped[i];

      // Draw Label Cell
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: c.labelWidth,
        height: rowH,
        color: hexToRgb(BG_ALT_ROW),
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });

      let lineY = y - pad - fontSize;
      for (const line of cw.labelLines) {
        this.page.drawText(line, {
          x: curX + pad,
          y: lineY,
          size: fontSize,
          font: this.fontBold,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += c.labelWidth;

      // Draw Value Cell
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: c.valueWidth,
        height: rowH,
        color: c.highlight ? hexToRgb(BG_YELLOW) : rgb(1, 1, 1),
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });

      lineY = y - pad - fontSize;
      for (const line of cw.valueLines) {
        this.page.drawText(line, {
          x: curX + pad,
          y: lineY,
          size: fontSize,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += c.valueWidth;
    }

    this.cursorY += rowH;
  }

  /** Draw a Generic Table (Header + Data rows) */
  drawTable(headers: string[], rows: (string | number)[][], colWidths: number[], highlightedCols: number[] = []): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    // 1. Draw Header
    let headerMaxLines = 1;
    const headerWrapped = headers.map((h, i) => {
      const lines = this.wrapText(h, colWidths[i] - pad * 2, fontSize, true);
      headerMaxLines = Math.max(headerMaxLines, lines.length);
      return lines;
    });

    const headerH = Math.max(16, headerMaxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(headerH);

    let y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (let i = 0; i < headers.length; i++) {
      this.page.drawRectangle({
        x: curX,
        y: y - headerH,
        width: colWidths[i],
        height: headerH,
        color: hexToRgb(BG_SUB_HEADER),
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });

      let lineY = y - pad - fontSize;
      for (const line of headerWrapped[i]) {
        this.page.drawText(line, {
          x: curX + pad,
          y: lineY,
          size: fontSize,
          font: this.fontBold,
          color: hexToRgb(BG_SECTION_HEADER),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += colWidths[i];
    }
    this.cursorY += headerH;

    // 2. Draw Rows
    for (const row of rows) {
      let rowMaxLines = 1;
      const rowWrapped = row.map((cell, i) => {
        const text = String(cell ?? '');
        const lines = this.wrapText(text, colWidths[i] - pad * 2, fontSize, false);
        rowMaxLines = Math.max(rowMaxLines, lines.length);
        return lines;
      });

      const rowH = Math.max(14, rowMaxLines * fontSize * LINE_HEIGHT + pad * 2);
      this.checkPageBreak(rowH);

      y = this.pdfY(this.cursorY);
      curX = MARGIN_L;

      for (let i = 0; i < row.length; i++) {
        const isHighlight = highlightedCols.includes(i);
        this.page.drawRectangle({
          x: curX,
          y: y - rowH,
          width: colWidths[i],
          height: rowH,
          color: isHighlight ? hexToRgb(BG_YELLOW) : rgb(1, 1, 1),
          borderColor: rgb(0, 0, 0),
          borderWidth: BORDER_W,
        });

        let lineY = y - pad - fontSize;
        for (const line of rowWrapped[i]) {
          this.page.drawText(line, {
            x: curX + pad,
            y: lineY,
            size: fontSize,
            font: isHighlight ? this.fontBold : this.fontRegular,
            color: rgb(0, 0, 0),
          });
          lineY -= fontSize * LINE_HEIGHT;
        }
        curX += colWidths[i];
      }
      this.cursorY += rowH;
    }
  }

  /** Draw Full Width Text Box (Remarks / Narrative) */
  drawRemarksBox(label: string, text: string): void {
    const fontSize = FONT_SIZE;
    const pad = 4;
    const lines = this.wrapText(text || 'N/A', CONTENT_W - pad * 2, fontSize, false);
    const textH = lines.length * fontSize * LINE_HEIGHT;
    const totalH = textH + 18 + pad * 2;

    this.checkPageBreak(totalH);
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - totalH,
      width: CONTENT_W,
      height: totalH,
      color: rgb(1, 1, 1),
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    // Label
    this.page.drawText(label, {
      x: MARGIN_L + pad,
      y: y - pad - fontSize,
      size: fontSize,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Body
    let lineY = y - pad - fontSize - 14;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN_L + pad,
        y: lineY,
        size: fontSize,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }

    this.cursorY += totalH;
  }

  /** Draw Image on full or half page with caption */
  async drawImageSection(imageBytes: Uint8Array, caption: string, maxH = 260): Promise<void> {
    if (!imageBytes || imageBytes.length === 0) return;

    this.checkPageBreak(maxH + 30);
    try {
      let img = null;
      try { img = await this.doc.embedPng(imageBytes); } catch { /* ignore */ }
      if (!img) {
        try { img = await this.doc.embedJpg(imageBytes); } catch { /* ignore */ }
      }
      if (!img) return;

      const scale = Math.min(CONTENT_W / img.width, maxH / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = MARGIN_L + (CONTENT_W - w) / 2;
      const y = this.pdfY(this.cursorY) - h;

      this.page.drawImage(img, { x, y, width: w, height: h });

      // Caption
      if (caption) {
        const text = this.sanitize(caption);
        const tw = this.fontBold.widthOfTextAtSize(text, 9);
        this.page.drawText(text, {
          x: MARGIN_L + (CONTENT_W - tw) / 2,
          y: y - 12,
          size: 9,
          font: this.fontBold,
          color: rgb(0, 0, 0),
        });
      }

      this.cursorY += h + 20;
    } catch (e) {
      console.error('Failed to embed image:', e);
    }
  }

  /** Draw Photo Grid (2 cols x 3 rows) */
  async drawPhotoGrid(photos: { bytes: Uint8Array; label: string }[]): Promise<void> {
    if (!photos || photos.length === 0) return;

    this.addPage();
    this.drawSectionHeader('Photographs');
    this.advanceCursor(8);

    const cellW = (CONTENT_W - 10) / 2;
    const cellH = 180;

    for (let i = 0; i < photos.length; i += 2) {
      this.checkPageBreak(cellH + 20);
      const rowPhotos = photos.slice(i, i + 2);
      const y = this.pdfY(this.cursorY);

      for (let j = 0; j < rowPhotos.length; j++) {
        const p = rowPhotos[j];
        const curX = MARGIN_L + j * (cellW + 10);

        try {
          let img = null;
          try { img = await this.doc.embedPng(p.bytes); } catch { /* ignore */ }
          if (!img) {
            try { img = await this.doc.embedJpg(p.bytes); } catch { /* ignore */ }
          }
          if (img) {
            const scale = Math.min((cellW - 8) / img.width, (cellH - 24) / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const imgX = curX + (cellW - w) / 2;
            const imgY = y - cellH + 20 + (cellH - 20 - h) / 2;

            // Cell border
            this.page.drawRectangle({
              x: curX,
              y: y - cellH,
              width: cellW,
              height: cellH,
              color: rgb(1, 1, 1),
              borderColor: rgb(0, 0, 0),
              borderWidth: BORDER_W,
            });

            this.page.drawImage(img, { x: imgX, y: imgY, width: w, height: h });

            // Label
            const text = this.sanitize(p.label);
            const tw = this.fontRegular.widthOfTextAtSize(text, 8);
            this.page.drawText(text, {
              x: curX + (cellW - tw) / 2,
              y: y - cellH + 6,
              size: 8,
              font: this.fontRegular,
              color: rgb(0, 0, 0),
            });
          }
        } catch { /* ignore */ }
      }
      this.cursorY += cellH + 10;
    }
  }

  async save(): Promise<Uint8Array> {
    return await this.doc.save();
  }
}
