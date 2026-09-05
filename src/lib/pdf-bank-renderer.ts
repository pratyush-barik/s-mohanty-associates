/**
 * pdf-bank-renderer.ts — Base PDF renderer for all Bank/FIS valuation reports.
 *
 * Extends PDFGeneralRenderer to inherit:
 * - Form XObject letterhead background watermark
 * - Standard typography (Times-Roman: 14pt Titles/Headers, 12pt Tables/Body, 10pt Captions)
 * - Standard margins (MARGIN_T = 108, MARGIN_B = 80, MARGIN_L = 54, MARGIN_R = 54)
 * - Transparent color palette (#DBE6F0 soft blue, #DDE9F6 ice blue, #FEF9E7 soft golden-yellow at 50% opacity)
 *
 * Subclasses (e.g. PDFAdityaBirlaMLAPRenderer, SBI, HDFC) can inherit or override
 * individual sections, tables, or custom bank formats.
 */

import { rgb } from 'pdf-lib';
import {
  PDFGeneralRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_T,
  MARGIN_B,
  MARGIN_L,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
} from './pdf-general-renderer';

export const DEFAULT_LETTERHEAD_PATH = PDFGeneralRenderer.DEFAULT_LETTERHEAD_PATH;
export const fetchDefaultLetterhead = PDFGeneralRenderer.fetchDefaultLetterhead;

/**
 * Safely fetches an image or asset from a URL into Uint8Array in the browser.
 */
export async function fetchBytes(url?: string | null): Promise<Uint8Array | null> {
  if (!url || !url.trim()) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/**
 * Standard date formatter for bank reports: YYYY-MM-DD → DD/MM/YYYY
 */
export function formatReportDate(d?: string | null, fallback = '________'): string {
  if (!d || !d.trim()) return fallback;
  const t = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, dd] = t.split('-');
    return `${dd}/${m}/${y}`;
  }
  return t;
}

export {
  PAGE_W,
  PAGE_H,
  MARGIN_T,
  MARGIN_B,
  MARGIN_L,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  PDFGeneralRenderer,
};

export class PDFBankRenderer extends PDFGeneralRenderer {
  /**
   * Draw the top Main Title Banner (e.g. "Aditya Birla Capital Ltd (MLAP)")
   */
  drawMainHeader(title: string): void {
    this.checkPageBreak(30);
    const h = 24;
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - h,
      width: CONTENT_W,
      height: h,
      color: hexToRgb(LBL_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    const font = this.fontBold;
    const text = this.sanitizeText(title);
    const tw = font.widthOfTextAtSize(text, FONT_SIZE_TITLE);
    this.page.drawText(text, {
      x: MARGIN_L + (CONTENT_W - tw) / 2,
      y: y - h + 6.5,
      size: FONT_SIZE_TITLE,
      font,
      color: rgb(0, 0, 0),
    });

    this.cursorY += h;
  }

  /**
   * Draw a Section Header Banner (e.g. "BASIC DETAILS", "LOCATION DETAILS")
   * Includes automated section spacing and page-break lookahead protection.
   */
  drawSectionHeader(title: string, addSpaceBefore = true, preserveCase = false): void {
    if (addSpaceBefore && this.cursorY > 10) {
      this.cursorY += 10;
    }

    // Require enough height for section header + at least 2 rows of content (prevents orphan headers)
    this.checkPageBreak(70);

    const h = 20;
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - h,
      width: CONTENT_W,
      height: h,
      color: hexToRgb(OPT_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    const font = this.fontBold;
    const text = preserveCase ? this.sanitizeText(title) : this.sanitizeText(title).toUpperCase();
    const tw = font.widthOfTextAtSize(text, FONT_SIZE_HEADER);
    this.page.drawText(text, {
      x: MARGIN_L + (CONTENT_W - tw) / 2,
      y: y - h + 5.5,
      size: FONT_SIZE_HEADER,
      font,
      color: rgb(0, 0, 0),
    });

    this.cursorY += h;
  }  /**
   * Draw a multi-column key-value row (2-col, 4-col, or N-col)
   * Automatically normalizes column widths to strictly equal CONTENT_W.
   * Labels have 50% opacity soft blue (#DBE6F0), values are transparent (or golden-yellow if highlighted).
   */
  drawKeyValueRow(cols: { label: string; value: string; labelWidth?: number; valueWidth?: number; highlight?: boolean; bold?: boolean }[]): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    // Auto-calculate or normalize widths to match CONTENT_W exactly
    let processedCols: { label: string; value: string; labelWidth: number; valueWidth: number; highlight?: boolean; bold?: boolean }[] = [];
    const hasExplicitWidths = cols.every(c => c.labelWidth !== undefined && c.valueWidth !== undefined);

    if (!hasExplicitWidths) {
      if (cols.length === 1) {
        const lW = 140;
        processedCols = [{ ...cols[0], labelWidth: lW, valueWidth: CONTENT_W - lW }];
      } else if (cols.length === 2) {
        const lW = 110;
        const vW = (CONTENT_W - lW * 2) / 2;
        processedCols = [
          { ...cols[0], labelWidth: lW, valueWidth: vW },
          { ...cols[1], labelWidth: lW, valueWidth: vW },
        ];
      } else {
        const cellW = CONTENT_W / (cols.length * 2);
        processedCols = cols.map(c => ({ ...c, labelWidth: cellW, valueWidth: cellW }));
      }
    } else {
      const totalW = cols.reduce((s, c) => s + (c.labelWidth || 0) + (c.valueWidth || 0), 0);
      if (Math.abs(totalW - CONTENT_W) > 0.01 && totalW > 0) {
        const scale = CONTENT_W / totalW;
        processedCols = cols.map(c => ({
          ...c,
          labelWidth: (c.labelWidth || 0) * scale,
          valueWidth: (c.valueWidth || 0) * scale,
        }));
      } else {
        processedCols = cols as any;
      }
    }

    // Measure max lines needed
    let maxLines = 1;
    const colWrapped: { labelLines: string[]; valueLines: string[] }[] = [];

    for (const c of processedCols) {
      const lLines = this.wrapText(c.label, c.labelWidth - pad * 2, fontSize, true);
      const vLines = this.wrapText(c.value, c.valueWidth - pad * 2, fontSize, !!(c.highlight || c.bold));
      maxLines = Math.max(maxLines, lLines.length, vLines.length);
      colWrapped.push({ labelLines: lLines, valueLines: vLines });
    }

    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (let i = 0; i < processedCols.length; i++) {
      const c = processedCols[i];
      const cw = colWrapped[i];

      // Draw Label Cell (with 50% opacity soft blue background)
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: c.labelWidth,
        height: rowH,
        color: hexToRgb(LBL_BG),
        opacity: BG_OPACITY,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });

      let lineY = y - pad - fontSize * 0.85;
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

      // Draw Value Cell (with 50% opacity yellow highlight or transparent)
      if (c.highlight) {
        this.page.drawRectangle({
          x: curX,
          y: y - rowH,
          width: c.valueWidth,
          height: rowH,
          color: hexToRgb(VAL_BG),
          opacity: BG_OPACITY,
          borderColor: rgb(0, 0, 0),
          borderWidth: BORDER_W,
        });
      } else {
        this.page.drawRectangle({
          x: curX,
          y: y - rowH,
          width: c.valueWidth,
          height: rowH,
          borderColor: rgb(0, 0, 0),
          borderWidth: BORDER_W,
        });
      }

      lineY = y - pad - fontSize * 0.85;
      for (const line of cw.valueLines) {
        this.page.drawText(line, {
          x: curX + pad,
          y: lineY,
          size: fontSize,
          font: (c.highlight || c.bold) ? this.fontBold : this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += c.valueWidth;
    }

    this.cursorY += rowH;
  }

  /**
   * Draw a Generic Data Table with transparent background headers and highlighted/label columns/rows
   * Automatically normalizes colWidths so table width strictly matches CONTENT_W.
   */
  drawTable(
    headers: string[],
    rows: (string | number)[][],
    colWidths: number[],
    highlightedCols: number[] = [],
    labelCols: number[] = []
  ): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    // Normalize colWidths so sum strictly equals CONTENT_W
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const normalizedColWidths = (Math.abs(totalW - CONTENT_W) > 0.01 && totalW > 0)
      ? colWidths.map(w => (w / totalW) * CONTENT_W)
      : colWidths;

    // 1. Draw Table Header
    let headerMaxLines = 1;
    const headerWrapped = headers.map((h, i) => {
      const lines = this.wrapText(h, normalizedColWidths[i] - pad * 2, fontSize, true);
      headerMaxLines = Math.max(headerMaxLines, lines.length);
      return lines;
    });

    const headerH = Math.max(18, headerMaxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(headerH);

    let y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (let i = 0; i < headers.length; i++) {
      this.page.drawRectangle({
        x: curX,
        y: y - headerH,
        width: normalizedColWidths[i],
        height: headerH,
        color: hexToRgb(OPT_BG),
        opacity: BG_OPACITY,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });

      let lineY = y - pad - fontSize * 0.85;
      for (const line of headerWrapped[i]) {
        this.page.drawText(line, {
          x: curX + pad,
          y: lineY,
          size: fontSize,
          font: this.fontBold,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += normalizedColWidths[i];
    }
    this.cursorY += headerH;

    // 2. Draw Data Rows
    for (const row of rows) {
      let rowMaxLines = 1;
      const rowWrapped = row.map((cell, i) => {
        const text = String(cell ?? '');
        const isBold = highlightedCols.includes(i) || labelCols.includes(i);
        const lines = this.wrapText(text, (normalizedColWidths[i] || 50) - pad * 2, fontSize, isBold);
        rowMaxLines = Math.max(rowMaxLines, lines.length);
        return lines;
      });

      const rowH = Math.max(16, rowMaxLines * fontSize * LINE_HEIGHT + pad * 2);
      this.checkPageBreak(rowH);

      y = this.pdfY(this.cursorY);
      curX = MARGIN_L;

      for (let i = 0; i < row.length; i++) {
        const isHighlight = highlightedCols.includes(i);
        const isLabel = labelCols.includes(i);
        const w = normalizedColWidths[i] || 50;
        if (isLabel) {
          this.page.drawRectangle({
            x: curX,
            y: y - rowH,
            width: w,
            height: rowH,
            color: hexToRgb(LBL_BG),
            opacity: BG_OPACITY,
            borderColor: rgb(0, 0, 0),
            borderWidth: BORDER_W,
          });
        } else if (isHighlight) {
          this.page.drawRectangle({
            x: curX,
            y: y - rowH,
            width: w,
            height: rowH,
            color: hexToRgb(VAL_BG),
            opacity: BG_OPACITY,
            borderColor: rgb(0, 0, 0),
            borderWidth: BORDER_W,
          });
        } else {
          this.page.drawRectangle({
            x: curX,
            y: y - rowH,
            width: w,
            height: rowH,
            borderColor: rgb(0, 0, 0),
            borderWidth: BORDER_W,
          });
        }

        let lineY = y - pad - fontSize * 0.85;
        for (const line of rowWrapped[i]) {
          this.page.drawText(line, {
            x: curX + pad,
            y: lineY,
            size: fontSize,
            font: (isHighlight || isLabel) ? this.fontBold : this.fontRegular,
            color: rgb(0, 0, 0),
          });
          lineY -= fontSize * LINE_HEIGHT;
        }
        curX += w;
      }

      this.cursorY += rowH;
    }
  }

  /**
   * Draw a generic data table, with optional custom column widths.
   * If customColWidths is provided, uses drawTable; otherwise delegates to super.drawDataTable.
   */
  override drawDataTable(headers: string[], rows: string[][], customColWidths?: number[]): void {
    if (customColWidths && customColWidths.length === headers.length) {
      this.drawTable(headers, rows, customColWidths);
    } else {
      super.drawDataTable(headers, rows);
    }
  }

  /**
   * Draw a full-width Remarks / Narrative box
   */
  drawRemarksBox(label: string, text: string, addSpaceBefore = true): void {
    if (addSpaceBefore && this.cursorY > 10) {
      this.cursorY += 10;
    }

    const fontSize = FONT_SIZE;
    const pad = 4;
    const lines = this.wrapText(text || 'N/A', CONTENT_W - pad * 2, fontSize, false);
    const textH = lines.length * fontSize * LINE_HEIGHT;
    const totalH = textH + 20 + pad * 2;

    this.checkPageBreak(totalH);
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - totalH,
      width: CONTENT_W,
      height: totalH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    // Label banner (50% opacity soft blue)
    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - 18,
      width: CONTENT_W,
      height: 18,
      color: hexToRgb(OPT_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    this.page.drawText(label, {
      x: MARGIN_L + pad,
      y: y - pad - fontSize * 0.85,
      size: fontSize,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Remarks Body
    let lineY = y - pad - fontSize * 0.85 - 18;
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

  /**
   * Draw an Image on the page with an optional caption and bounding border
   */
  async drawImageSection(imageBytes: Uint8Array, caption = '', maxH = 260, drawBorder = true): Promise<void> {
    if (!imageBytes || imageBytes.length === 0) return;

    const hasCaption = !!(caption && caption.trim().length > 0);
    this.checkPageBreak(maxH + (hasCaption ? 20 : 0));
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

      if (drawBorder) {
        this.page.drawRectangle({
          x: MARGIN_L,
          y: this.pdfY(this.cursorY) - h,
          width: CONTENT_W,
          height: h,
          borderColor: rgb(0, 0, 0),
          borderWidth: BORDER_W,
        });
      }

      this.page.drawImage(img, { x, y, width: w, height: h });

      if (hasCaption) {
        const text = this.sanitizeText(caption.trim());
        const tw = this.fontItalic.widthOfTextAtSize(text, FONT_SIZE_CAPTION);
        this.page.drawText(text, {
          x: MARGIN_L + (CONTENT_W - tw) / 2,
          y: y - 12,
          size: FONT_SIZE_CAPTION,
          font: this.fontItalic,
          color: rgb(0, 0, 0),
        });
        this.cursorY += h + 20;
      } else {
        this.cursorY += h;
      }
    } catch (e) {
      console.error('Failed to embed image:', e);
    }
  }

  /**
   * Draw a 2-column Photograph Grid with dynamic user labels
   */
  async drawPhotoGrid(photos: (Uint8Array | { bytes: Uint8Array; label?: string })[], title: string = 'PHOTOGRAPHS OF PROPERTY'): Promise<void> {
    if (!photos || photos.length === 0) return;

    const normalizedPhotos = photos.map(p => {
      if (p instanceof Uint8Array || (p as any)?.byteLength !== undefined) {
        return { bytes: p as Uint8Array, label: '' };
      }
      return { bytes: (p as any)?.bytes as Uint8Array, label: (p as any)?.label || '' };
    }).filter(p => p.bytes && p.bytes.length > 0);

    if (normalizedPhotos.length === 0) return;

    this.addPage();
    this.drawSectionHeader(title);
    this.advanceCursor(8);

    const cellW = (CONTENT_W - 10) / 2;
    const cellH = 180;

    for (let i = 0; i < normalizedPhotos.length; i += 2) {
      this.checkPageBreak(cellH + 20);
      const rowPhotos = normalizedPhotos.slice(i, i + 2);
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

            // Label (non-bold, Times-Italic, 10pt)
            if (p.label && p.label.trim().length > 0) {
              const text = this.sanitizeText(p.label.trim());
              const tw = this.fontItalic.widthOfTextAtSize(text, FONT_SIZE_CAPTION);
              this.page.drawText(text, {
                x: curX + (cellW - tw) / 2,
                y: y - cellH + 6,
                size: FONT_SIZE_CAPTION,
                font: this.fontItalic,
                color: rgb(0, 0, 0),
              });
            }
          }
        } catch { /* ignore */ }
      }
      this.cursorY += cellH + 10;
    }
  }

  /**
   * Draw a Map Gallery for a specific map type (Google Satellite Map, Mouza Map, Sketch Map, Cadastral Map).
   * Supports 1, 2, or N images.
   * If images exist, adds a new page (or continues), draws the section header, and lays out images cleanly
   * with bounding borders, captions, and page break checking.
   */
  async drawMapGallery(
    images: (Uint8Array | { bytes: Uint8Array; caption?: string })[],
    title: string,
    maxImageH: number = 260
  ): Promise<void> {
    if (!images || images.length === 0) return;

    const normalized = images.map(item => {
      if (item instanceof Uint8Array || (item as any)?.byteLength !== undefined) {
        return { bytes: item as Uint8Array, caption: '' };
      }
      return { bytes: (item as any)?.bytes as Uint8Array, caption: (item as any)?.caption || '' };
    }).filter(i => i.bytes && i.bytes.length > 0);

    if (normalized.length === 0) return;

    this.addPage();
    this.drawSectionHeader(title, false);
    this.advanceCursor(8);

    for (let i = 0; i < normalized.length; i++) {
      const { bytes, caption } = normalized[i];
      const imgCaption = caption || (normalized.length > 1 ? `${title} — Image ${i + 1} of ${normalized.length}` : '');
      await this.drawImageSection(bytes, imgCaption, maxImageH, true);
      this.advanceCursor(10);
    }
  }

  /**
   * Render all populated Annexure spreadsheets at the end of the report.
   * Auto-formats multi-column tables with headers, cell wrapping, background shading, and page breaks.
   */
  renderAnnexures(annexures?: Array<{
    id: string;
    label: string;
    title?: string;
    parsedData?: {
      headers: string[];
      rows: string[][];
      allRows?: string[][];
      merges?: { sr: number; sc: number; er: number; ec: number }[];
      colWidths?: number[];
    };
  }>): void {
    if (!annexures || annexures.length === 0) return;

    const populated = annexures.filter(a => a.parsedData && ((a.parsedData.allRows && a.parsedData.allRows.length > 0) || (a.parsedData.headers && a.parsedData.headers.length > 0)));
    if (populated.length === 0) return;

    for (const ann of populated) {
      this.addPage();
      const annTitle = ann.title ? `ANNEXURE ${ann.label} \u2014 ${ann.title.toUpperCase()}` : `ANNEXURE ${ann.label}`;
      this.drawSectionHeader(annTitle, false);
      this.advanceCursor(8);

      const pd = ann.parsedData!;
      if (pd.allRows && pd.allRows.length > 0) {
        this.drawMergedTable(pd.allRows, pd.merges || [], pd.colWidths || []);
      } else if (pd.headers && pd.headers.length > 0) {
        this.drawDataTable(pd.headers, pd.rows || []);
      }
    }
  }
}

export default PDFBankRenderer;
