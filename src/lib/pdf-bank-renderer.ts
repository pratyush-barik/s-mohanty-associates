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
};

export class PDFBankRenderer extends PDFGeneralRenderer {
  /**
   * Draw the top Main Title Banner (e.g. "Aditya Birla Capital Ltd (MLAP)")
   */
  drawMainHeader(title: string): void {
    this.checkPageBreak(28);
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
   */
  drawSectionHeader(title: string): void {
    this.checkPageBreak(22);
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
    const text = this.sanitizeText(title).toUpperCase();
    const tw = font.widthOfTextAtSize(text, FONT_SIZE_HEADER);
    this.page.drawText(text, {
      x: MARGIN_L + (CONTENT_W - tw) / 2,
      y: y - h + 5.5,
      size: FONT_SIZE_HEADER,
      font,
      color: rgb(0, 0, 0),
    });

    this.cursorY += h;
  }

  /**
   * Draw a multi-column key-value row (2-col, 4-col, or N-col)
   * Labels have 50% opacity soft blue (#DBE6F0), values are transparent (or golden-yellow if highlighted).
   */
  drawKeyValueRow(cols: { label: string; value: string; labelWidth: number; valueWidth: number; highlight?: boolean }[]): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    // Measure max lines needed
    let maxLines = 1;
    const colWrapped: { labelLines: string[]; valueLines: string[] }[] = [];

    for (const c of cols) {
      const lLines = this.wrapText(c.label, c.labelWidth - pad * 2, fontSize, true);
      const vLines = this.wrapText(c.value, c.valueWidth - pad * 2, fontSize, false);
      maxLines = Math.max(maxLines, lLines.length, vLines.length);
      colWrapped.push({ labelLines: lLines, valueLines: vLines });
    }

    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
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
          font: c.highlight ? this.fontBold : this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += c.valueWidth;
    }

    this.cursorY += rowH;
  }

  /**
   * Draw a Generic Data Table with transparent background headers and highlighted columns/rows
   */
  drawTable(headers: string[], rows: (string | number)[][], colWidths: number[], highlightedCols: number[] = []): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    // 1. Draw Table Header
    let headerMaxLines = 1;
    const headerWrapped = headers.map((h, i) => {
      const lines = this.wrapText(h, colWidths[i] - pad * 2, fontSize, true);
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
        width: colWidths[i],
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
      curX += colWidths[i];
    }
    this.cursorY += headerH;

    // 2. Draw Data Rows
    for (const row of rows) {
      let rowMaxLines = 1;
      const rowWrapped = row.map((cell, i) => {
        const text = String(cell ?? '');
        const lines = this.wrapText(text, colWidths[i] - pad * 2, fontSize, false);
        rowMaxLines = Math.max(rowMaxLines, lines.length);
        return lines;
      });

      const rowH = Math.max(16, rowMaxLines * fontSize * LINE_HEIGHT + pad * 2);
      this.checkPageBreak(rowH);

      y = this.pdfY(this.cursorY);
      curX = MARGIN_L;

      for (let i = 0; i < row.length; i++) {
        const isHighlight = highlightedCols.includes(i);
        if (isHighlight) {
          this.page.drawRectangle({
            x: curX,
            y: y - rowH,
            width: colWidths[i],
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
            width: colWidths[i],
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

  /**
   * Draw a full-width Remarks / Narrative box
   */
  drawRemarksBox(label: string, text: string): void {
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
   * Draw an Image on the page with a caption
   */
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

      if (caption) {
        const text = this.sanitizeText(caption);
        const tw = this.fontBold.widthOfTextAtSize(text, FONT_SIZE_CAPTION);
        this.page.drawText(text, {
          x: MARGIN_L + (CONTENT_W - tw) / 2,
          y: y - 12,
          size: FONT_SIZE_CAPTION,
          font: this.fontBold,
          color: rgb(0, 0, 0),
        });
      }

      this.cursorY += h + 24;
    } catch (e) {
      console.error('Failed to embed image:', e);
    }
  }

  /**
   * Draw a 2-column Photograph Grid with dynamic user labels
   */
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
            const text = this.sanitizeText(p.label);
            const tw = this.fontRegular.widthOfTextAtSize(text, FONT_SIZE_CAPTION);
            this.page.drawText(text, {
              x: curX + (cellW - tw) / 2,
              y: y - cellH + 6,
              size: FONT_SIZE_CAPTION,
              font: this.fontRegular,
              color: rgb(0, 0, 0),
            });
          }
        } catch { /* ignore */ }
      }
      this.cursorY += cellH + 10;
    }
  }
}

export default PDFBankRenderer;
